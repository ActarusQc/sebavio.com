import { loadWeatherConfig, type WeatherEnvConfig } from "../config";
import { WeatherError, sanitizeWeatherErrorMessage } from "../errors";
import { logWeatherEvent } from "../metrics";
import type {
  WeatherAlert,
  WeatherForecast,
  WeatherForecastInput,
  WeatherProvider,
  WeatherProviderAvailability,
} from "../types";
import {
  mapAlertDetail,
  mapOneCall3ToForecast,
  mapTimelineRecordToCurrent,
  mapTimelineRecordToDaily,
  mapTimelineRecordToHourly,
} from "./mapper";
import {
  openWeatherAlertDetailSchema,
  openWeatherOneCall3Schema,
  openWeatherTimelineEnvelopeSchema,
} from "./schema";

export type OpenWeatherProviderOptions = {
  config?: WeatherEnvConfig;
  fetchImpl?: typeof fetch;
  /** Compteur d'appels HTTP (quota quotidien). */
  onHttpCall?: () => Promise<void>;
};

const MAX_RESPONSE_BYTES = 1_500_000;
const MAX_ALERT_DETAILS = 5;
const MAX_HOURLY_PAGES = 3;
const MAX_DAILY_PAGES = 2;

export class OpenWeatherProvider implements WeatherProvider {
  readonly name = "openweather" as const;
  readonly horizonDays: number;

  private readonly config: WeatherEnvConfig;
  private readonly fetchImpl: typeof fetch;
  private readonly onHttpCall?: () => Promise<void>;

  constructor(options: OpenWeatherProviderOptions = {}) {
    this.config = options.config ?? loadWeatherConfig();
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.onHttpCall = options.onHttpCall;
    this.horizonDays = this.config.horizonDays;
  }

  isAvailable(): WeatherProviderAvailability {
    if (!this.config.enabled || this.config.provider !== "openweather") {
      return { available: false, reason: "disabled" };
    }
    if (!this.config.openWeatherApiKey) {
      return { available: false, reason: "missing_key" };
    }
    return { available: true };
  }

  async getForecast(input: WeatherForecastInput): Promise<WeatherForecast> {
    if (!this.isAvailable().available) {
      const reason = this.isAvailable().reason;
      throw new WeatherError(
        reason === "missing_key" ? "missing_key" : "disabled",
        "Données météo indisponibles",
        503,
      );
    }

    if (this.config.openWeatherOneCallVersion === "3") {
      return this.fetchOneCall3(input);
    }
    return this.fetchOneCall4(input);
  }

  private parts(input: WeatherForecastInput) {
    return {
      current: input.parts?.current ?? true,
      hourly: input.parts?.hourly ?? true,
      daily: input.parts?.daily ?? true,
      alerts: input.parts?.alerts ?? true,
    };
  }

  private async fetchOneCall3(
    input: WeatherForecastInput,
  ): Promise<WeatherForecast> {
    const parts = this.parts(input);
    const exclude: string[] = [];
    if (!parts.current) exclude.push("current");
    if (!parts.hourly) exclude.push("hourly");
    if (!parts.daily) exclude.push("daily");
    if (!parts.alerts) exclude.push("alerts");
    // Toujours exclure minutely / 1min pour limiter la taille.
    exclude.push("minutely");

    const url = new URL(`${this.config.openWeatherBaseUrl}/data/3.0/onecall`);
    url.searchParams.set("lat", String(input.latitude));
    url.searchParams.set("lon", String(input.longitude));
    url.searchParams.set("units", "metric");
    url.searchParams.set("lang", "fr");
    url.searchParams.set("appid", this.config.openWeatherApiKey);
    if (exclude.length) {
      url.searchParams.set("exclude", exclude.join(","));
    }

    const json = await this.fetchJson(url.toString());
    const parsed = openWeatherOneCall3Schema.safeParse(json);
    if (!parsed.success) {
      throw new WeatherError("validation", "Réponse météo invalide", 502, {
        retryable: false,
      });
    }
    return mapOneCall3ToForecast(parsed.data);
  }

  private async fetchOneCall4(
    input: WeatherForecastInput,
  ): Promise<WeatherForecast> {
    const parts = this.parts(input);
    const base: WeatherForecast = {
      latitude: input.latitude,
      longitude: input.longitude,
      provider: "openweather",
      timezone: "UTC",
      timezoneOffsetSeconds: 0,
      fetchedAt: new Date().toISOString(),
      current: undefined,
      hourly: [],
      daily: [],
      alerts: [],
    };

    const alertIds = new Set<string>();

    if (parts.daily) {
      const dailyPages = await this.fetchTimelinePages(
        "1day",
        input.latitude,
        input.longitude,
        MAX_DAILY_PAGES,
      );
      if (dailyPages[0]) {
        base.timezone = dailyPages[0].timezone;
        base.timezoneOffsetSeconds = dailyPages[0].timezone_offset;
        base.latitude = dailyPages[0].lat;
        base.longitude = dailyPages[0].lon;
      }
      for (const page of dailyPages) {
        for (const row of page.data) {
          const mapped = mapTimelineRecordToDaily(row, page.timezone);
          if (mapped) base.daily.push(mapped);
          this.collectAlertIds(row, alertIds);
        }
      }
    }

    if (parts.hourly) {
      const hourlyPages = await this.fetchTimelinePages(
        "1h",
        input.latitude,
        input.longitude,
        MAX_HOURLY_PAGES,
      );
      if (hourlyPages[0] && !parts.daily) {
        base.timezone = hourlyPages[0].timezone;
        base.timezoneOffsetSeconds = hourlyPages[0].timezone_offset;
        base.latitude = hourlyPages[0].lat;
        base.longitude = hourlyPages[0].lon;
      }
      for (const page of hourlyPages) {
        for (const row of page.data) {
          const mapped = mapTimelineRecordToHourly(row);
          if (mapped) base.hourly.push(mapped);
          this.collectAlertIds(row, alertIds);
        }
      }
    }

    if (parts.current) {
      const currentEnv = await this.fetchTimeline(
        "current",
        input.latitude,
        input.longitude,
      );
      base.timezone = currentEnv.timezone;
      base.timezoneOffsetSeconds = currentEnv.timezone_offset;
      base.latitude = currentEnv.lat;
      base.longitude = currentEnv.lon;
      const row = currentEnv.data[0];
      if (row) {
        const current = mapTimelineRecordToCurrent(row);
        if (current) base.current = current;
        this.collectAlertIds(row, alertIds);
      }
    }

    if (parts.alerts && alertIds.size > 0) {
      const ids = [...alertIds].slice(0, MAX_ALERT_DETAILS);
      for (const id of ids) {
        try {
          const alert = await this.fetchAlertDetail(id);
          if (alert) base.alerts.push(alert);
        } catch {
          // Alerte individuelle non bloquante.
        }
      }
    }

    // Timeline 1day omet souvent `weather` : réutiliser la condition horaire du même jour.
    if (base.daily.length > 0 && base.hourly.length > 0) {
      for (const day of base.daily) {
        const sample = base.hourly.find((h) =>
          h.forecastAt.startsWith(day.date),
        );
        if (sample) {
          day.condition = sample.condition;
          day.weatherCode = sample.condition.code;
          day.summary = sample.condition.description;
        }
      }
    }

    if (base.daily.length === 0 && base.hourly.length === 0 && !base.current) {
      throw new WeatherError(
        "unavailable",
        "Données météo indisponibles",
        503,
        {
          retryable: true,
        },
      );
    }

    return base;
  }

  private collectAlertIds(
    row: Record<string, unknown>,
    into: Set<string>,
  ): void {
    const alerts = row.alerts;
    if (!Array.isArray(alerts)) return;
    for (const id of alerts) {
      if (typeof id === "string" && id) into.add(id);
    }
  }

  private async fetchTimelinePages(
    kind: "1h" | "1day",
    lat: number,
    lon: number,
    maxPages: number,
  ): Promise<
    Array<{
      lat: number;
      lon: number;
      timezone: string;
      timezone_offset: number;
      data: Record<string, unknown>[];
      next?: string;
      prev?: string;
    }>
  > {
    const pages: Array<{
      lat: number;
      lon: number;
      timezone: string;
      timezone_offset: number;
      data: Record<string, unknown>[];
      next?: string;
      prev?: string;
    }> = [];
    let nextUrl: string | null = null;
    type TimelinePage = (typeof pages)[number];
    for (let i = 0; i < maxPages; i++) {
      let page: TimelinePage;
      if (nextUrl) {
        page = await this.fetchTimelineUrl(nextUrl);
      } else {
        page = await this.fetchTimeline(kind, lat, lon);
      }
      pages.push(page);
      nextUrl = page.next ?? null;
      if (!nextUrl) break;
    }
    return pages;
  }

  private async fetchTimeline(
    kind: "current" | "1h" | "1day",
    lat: number,
    lon: number,
  ): Promise<{
    lat: number;
    lon: number;
    timezone: string;
    timezone_offset: number;
    data: Record<string, unknown>[];
    next?: string;
    prev?: string;
  }> {
    const path =
      kind === "current"
        ? "/data/4.0/onecall/current"
        : `/data/4.0/onecall/timeline/${kind}`;
    const url = new URL(`${this.config.openWeatherBaseUrl}${path}`);
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lon));
    url.searchParams.set("units", "metric");
    url.searchParams.set("lang", "fr");
    url.searchParams.set("appid", this.config.openWeatherApiKey);
    return this.fetchTimelineUrl(url.toString());
  }

  private async fetchTimelineUrl(url: string): Promise<{
    lat: number;
    lon: number;
    timezone: string;
    timezone_offset: number;
    data: Record<string, unknown>[];
    next?: string;
    prev?: string;
  }> {
    const json = await this.fetchJson(url);
    const parsed = openWeatherTimelineEnvelopeSchema.safeParse(json);
    if (!parsed.success) {
      throw new WeatherError("validation", "Réponse météo invalide", 502, {
        retryable: false,
      });
    }
    return {
      lat: parsed.data.lat,
      lon: parsed.data.lon,
      timezone: parsed.data.timezone,
      timezone_offset: parsed.data.timezone_offset,
      data: parsed.data.data as Record<string, unknown>[],
      next: parsed.data.next,
      prev: parsed.data.prev,
    };
  }

  private async fetchAlertDetail(
    alertId: string,
  ): Promise<WeatherAlert | null> {
    const url = new URL(
      `${this.config.openWeatherBaseUrl}/data/4.0/onecall/alert/${encodeURIComponent(alertId)}`,
    );
    url.searchParams.set("appid", this.config.openWeatherApiKey);
    const json = await this.fetchJson(url.toString());
    const parsed = openWeatherAlertDetailSchema.safeParse(json);
    if (!parsed.success) return null;
    const row = parsed.data.data?.[0] ?? parsed.data;
    return mapAlertDetail(alertId, {
      sender_name: row.sender_name,
      event: row.event,
      start: row.start,
      end: row.end,
      description: row.description,
      tags: row.tags,
    });
  }

  private async fetchJson(url: string): Promise<unknown> {
    const maxAttempts = 1 + this.config.maxRetries;
    let lastError: unknown;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (attempt > 0) {
        const delay = Math.min(4000, 300 * 2 ** (attempt - 1));
        await new Promise((r) => setTimeout(r, delay));
      }

      try {
        if (this.onHttpCall) {
          await this.onHttpCall();
        }

        const response = await this.fetchImpl(url, {
          method: "GET",
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(this.config.timeoutMs),
        });

        const text = await response.text();
        if (text.length > MAX_RESPONSE_BYTES) {
          throw new WeatherError(
            "validation",
            "Réponse météo trop volumineuse",
            502,
            {
              retryable: false,
            },
          );
        }

        if (response.status === 401 || response.status === 403) {
          throw new WeatherError(
            "unauthorized",
            "Authentification météo refusée",
            503,
            { retryable: false },
          );
        }
        if (response.status === 400) {
          throw new WeatherError("validation", "Requête météo invalide", 400, {
            retryable: false,
          });
        }
        if (response.status === 429) {
          throw new WeatherError(
            "rate_limited",
            "Limite fournisseur météo atteinte",
            429,
            { retryable: true },
          );
        }
        if (response.status >= 500) {
          throw new WeatherError(
            "temporary",
            "Fournisseur météo temporairement indisponible",
            503,
            { retryable: true },
          );
        }
        if (!response.ok) {
          throw new WeatherError(
            "unavailable",
            "Données météo indisponibles",
            503,
            {
              retryable: false,
            },
          );
        }

        try {
          return JSON.parse(text) as unknown;
        } catch {
          throw new WeatherError("validation", "Réponse météo invalide", 502, {
            retryable: false,
          });
        }
      } catch (error) {
        lastError = error;
        if (error instanceof WeatherError) {
          if (!error.retryable) throw error;
          logWeatherEvent("provider_retry", {
            attempt,
            kind: error.kind,
            status: error.status,
          });
          continue;
        }
        if (error instanceof Error && error.name === "TimeoutError") {
          lastError = new WeatherError("timeout", "Délai météo dépassé", 503, {
            retryable: true,
          });
          continue;
        }
        if (error instanceof DOMException && error.name === "AbortError") {
          lastError = new WeatherError("timeout", "Délai météo dépassé", 503, {
            retryable: true,
          });
          continue;
        }
        lastError = new WeatherError(
          "temporary",
          sanitizeWeatherErrorMessage(
            error instanceof Error ? error.message : "Erreur météo",
          ),
          503,
          { retryable: true },
        );
      }
    }

    if (lastError instanceof WeatherError) throw lastError;
    throw new WeatherError("unavailable", "Données météo indisponibles", 503, {
      retryable: false,
    });
  }
}
