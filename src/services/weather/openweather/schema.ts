import { z } from "zod";

const weatherItemSchema = z.object({
  id: z.number(),
  main: z.string(),
  description: z.string(),
  icon: z.string(),
});

const rainSnowSchema = z
  .object({
    "1h": z.number().optional(),
    "3h": z.number().optional(),
  })
  .passthrough()
  .optional();

/** One Call 3.0 — réponse unifiée. */
export const openWeatherOneCall3Schema = z
  .object({
    lat: z.number(),
    lon: z.number(),
    timezone: z.string(),
    timezone_offset: z.number(),
    current: z
      .object({
        dt: z.number(),
        sunrise: z.number().optional(),
        sunset: z.number().optional(),
        temp: z.number(),
        feels_like: z.number(),
        pressure: z.number().optional(),
        humidity: z.number().optional(),
        uvi: z.number().optional(),
        clouds: z.number().optional(),
        visibility: z.number().optional(),
        wind_speed: z.number().optional(),
        wind_deg: z.number().optional(),
        wind_gust: z.number().optional(),
        weather: z.array(weatherItemSchema).min(1),
        rain: rainSnowSchema,
        snow: rainSnowSchema,
      })
      .passthrough()
      .optional(),
    hourly: z
      .array(
        z
          .object({
            dt: z.number(),
            temp: z.number(),
            feels_like: z.number(),
            pressure: z.number().optional(),
            humidity: z.number().optional(),
            uvi: z.number().optional(),
            clouds: z.number().optional(),
            visibility: z.number().optional(),
            wind_speed: z.number().optional(),
            wind_deg: z.number().optional(),
            wind_gust: z.number().optional(),
            pop: z.number().optional(),
            weather: z.array(weatherItemSchema).min(1),
            rain: rainSnowSchema,
            snow: rainSnowSchema,
          })
          .passthrough(),
      )
      .optional(),
    daily: z
      .array(
        z
          .object({
            dt: z.number(),
            sunrise: z.number().optional(),
            sunset: z.number().optional(),
            temp: z.object({
              day: z.number().optional(),
              min: z.number(),
              max: z.number(),
              night: z.number().optional(),
              eve: z.number().optional(),
              morn: z.number().optional(),
            }),
            feels_like: z
              .object({
                day: z.number().optional(),
                night: z.number().optional(),
                eve: z.number().optional(),
                morn: z.number().optional(),
              })
              .optional(),
            pressure: z.number().optional(),
            humidity: z.number().optional(),
            wind_speed: z.number().optional(),
            wind_deg: z.number().optional(),
            wind_gust: z.number().optional(),
            weather: z.array(weatherItemSchema).min(1),
            clouds: z.number().optional(),
            pop: z.number().optional(),
            rain: z.number().optional(),
            snow: z.number().optional(),
            uvi: z.number().optional(),
          })
          .passthrough(),
      )
      .optional(),
    alerts: z
      .array(
        z
          .object({
            sender_name: z.string(),
            event: z.string(),
            start: z.number(),
            end: z.number(),
            description: z.string(),
            tags: z.array(z.string()).optional(),
          })
          .passthrough(),
      )
      .optional(),
  })
  .passthrough();

export type OpenWeatherOneCall3 = z.infer<typeof openWeatherOneCall3Schema>;

/** Timeline / current 4.0 — enveloppe commune. */
export const openWeatherTimelineEnvelopeSchema = z
  .object({
    lat: z.number(),
    lon: z.number(),
    timezone: z.string(),
    timezone_offset: z.number(),
    data: z.array(z.record(z.string(), z.unknown())).min(0),
    next: z.string().optional(),
    prev: z.string().optional(),
  })
  .passthrough();

export const openWeatherAlertDetailSchema = z
  .object({
    id: z.string().optional(),
    sender_name: z.string().optional(),
    event: z.string().optional(),
    start: z.number().optional(),
    end: z.number().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    data: z
      .array(
        z
          .object({
            sender_name: z.string().optional(),
            event: z.string().optional(),
            start: z.number().optional(),
            end: z.number().optional(),
            description: z.string().optional(),
            tags: z.array(z.string()).optional(),
          })
          .passthrough(),
      )
      .optional(),
  })
  .passthrough();

export type OpenWeatherTimelineEnvelope = z.infer<
  typeof openWeatherTimelineEnvelopeSchema
>;
