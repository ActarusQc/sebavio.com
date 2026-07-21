import type {
  WeatherActivityCondition,
  WeatherCurrent,
  WeatherDailyForecast,
  WeatherHourlyForecast,
} from "./types";

export type WeatherActivityReasonCode =
  | "storm"
  | "heavy_rain"
  | "rain"
  | "snow"
  | "extreme_heat"
  | "extreme_cold"
  | "strong_wind"
  | "excellent_outdoor"
  | "good_outdoor"
  | "mixed";

export type WeatherActivityReason = {
  code: WeatherActivityReasonCode;
  /** Clé i18n / message FR court. */
  messageKey: string;
  messageFr: string;
};

export type WeatherActivityInput = {
  current?: WeatherCurrent | null;
  daily?: WeatherDailyForecast | null;
  hourly?: WeatherHourlyForecast[] | null;
};

export type WeatherActivityClassification = {
  outdoorSuitable: boolean;
  indoorPreferred: boolean;
  avoidWaterActivities: boolean;
  avoidExposedAreas: boolean;
  conditions: WeatherActivityCondition[];
  reasons: WeatherActivityReason[];
};

function weatherCodeIsStorm(code: number): boolean {
  return (
    (code >= 200 && code < 300) || code === 95 || code === 96 || code === 99
  );
}

function weatherCodeIsSnow(code: number): boolean {
  return (
    (code >= 600 && code < 700) ||
    code === 71 ||
    code === 73 ||
    code === 75 ||
    code === 77 ||
    code === 85 ||
    code === 86
  );
}

function weatherCodeIsRain(code: number): boolean {
  return (
    (code >= 300 && code < 600) ||
    (code >= 51 && code <= 67) ||
    (code >= 80 && code <= 82)
  );
}

/**
 * Classification pure destinée aux futures recommandations d'activités.
 * Calculée par Sebavio — jamais fournie telle quelle par le fournisseur.
 */
export class WeatherActivityClassifier {
  classify(input: WeatherActivityInput): WeatherActivityClassification {
    const conditions = new Set<WeatherActivityCondition>();
    const reasons: WeatherActivityReason[] = [];

    const code =
      input.daily?.condition.code ??
      input.current?.condition.code ??
      input.hourly?.[0]?.condition.code ??
      0;
    const tempMax =
      input.daily?.tempMaxC ??
      input.current?.temperatureC ??
      input.hourly?.[0]?.temperatureC ??
      20;
    const tempMin =
      input.daily?.tempMinC ?? input.current?.temperatureC ?? tempMax;
    const wind =
      input.daily?.windSpeedKmh ??
      input.current?.windSpeedKmh ??
      input.hourly?.[0]?.windSpeedKmh ??
      0;
    const pop = input.daily?.precipitationProbability ?? 0;
    const rainMm = input.daily?.rainMm ?? input.daily?.precipitationMm ?? 0;

    let avoidWater = false;
    let avoidExposed = false;
    let indoorPreferred = false;

    if (weatherCodeIsStorm(code)) {
      conditions.add("storm");
      indoorPreferred = true;
      avoidExposed = true;
      avoidWater = true;
      reasons.push({
        code: "storm",
        messageKey: "weather.activity.storm",
        messageFr: "Orage : privilégier les activités intérieures",
      });
    }

    if (
      weatherCodeIsSnow(code) ||
      (rainMm != null && rainMm > 0 && tempMax <= 1)
    ) {
      conditions.add("snow");
      indoorPreferred = true;
      reasons.push({
        code: "snow",
        messageKey: "weather.activity.snow",
        messageFr: "Neige : adapter les activités et la conduite",
      });
    }

    if (
      !conditions.has("storm") &&
      (weatherCodeIsRain(code) ||
        (pop != null && pop >= 60) ||
        (rainMm != null && rainMm >= 5))
    ) {
      conditions.add("rain");
      indoorPreferred = true;
      avoidWater = rainMm != null && rainMm >= 10;
      reasons.push({
        code: rainMm != null && rainMm >= 10 ? "heavy_rain" : "rain",
        messageKey:
          rainMm != null && rainMm >= 10
            ? "weather.activity.heavy_rain"
            : "weather.activity.rain",
        messageFr:
          rainMm != null && rainMm >= 10
            ? "Pluie importante : activités intérieures recommandées"
            : "Pluie probable : prévoir une option intérieure",
      });
    }

    if (tempMax >= 32) {
      conditions.add("extreme_heat");
      reasons.push({
        code: "extreme_heat",
        messageKey: "weather.activity.extreme_heat",
        messageFr:
          "Chaleur élevée : privilégier les activités aquatiques ou matinales",
      });
    }

    if (tempMin <= -15 || tempMax <= -10) {
      conditions.add("extreme_cold");
      indoorPreferred = true;
      reasons.push({
        code: "extreme_cold",
        messageKey: "weather.activity.extreme_cold",
        messageFr: "Froid extrême : limiter les expositions prolongées",
      });
    }

    if (wind != null && wind >= 50) {
      conditions.add("strong_wind");
      avoidExposed = true;
      reasons.push({
        code: "strong_wind",
        messageKey: "weather.activity.strong_wind",
        messageFr: "Vent fort : éviter les activités exposées",
      });
    }

    if (conditions.size === 0) {
      if (
        tempMax >= 12 &&
        tempMax <= 28 &&
        (pop == null || pop < 20) &&
        (wind == null || wind < 25)
      ) {
        conditions.add("excellent_outdoor");
        reasons.push({
          code: "excellent_outdoor",
          messageKey: "weather.activity.excellent_outdoor",
          messageFr:
            "Beau temps : conditions favorables aux activités extérieures",
        });
      } else if ((pop == null || pop < 40) && tempMax >= 8 && tempMax <= 30) {
        conditions.add("good_outdoor");
        reasons.push({
          code: "good_outdoor",
          messageKey: "weather.activity.good_outdoor",
          messageFr: "Bonnes conditions pour les activités extérieures",
        });
      } else {
        conditions.add("mixed");
        reasons.push({
          code: "mixed",
          messageKey: "weather.activity.mixed",
          messageFr: "Conditions mixtes : prévoir une alternative",
        });
      }
    } else if (
      !conditions.has("storm") &&
      !conditions.has("extreme_cold") &&
      !conditions.has("rain")
    ) {
      // garder les conditions négatives uniquement
    } else if (conditions.has("rain") && !conditions.has("storm")) {
      conditions.add("mixed");
    }

    const outdoorSuitable =
      !indoorPreferred &&
      !conditions.has("storm") &&
      !conditions.has("extreme_cold");

    return {
      outdoorSuitable,
      indoorPreferred,
      avoidWaterActivities: avoidWater,
      avoidExposedAreas: avoidExposed,
      conditions: [...conditions],
      reasons,
    };
  }
}

export const weatherActivityClassifier = new WeatherActivityClassifier();
