import { z } from "zod";

export type SafetyRecallSource = "transport_canada" | "nhtsa" | "other";

export type NormalizedSafetyRecall = {
  externalRecallId: string;
  source: SafetyRecallSource;
  manufacturer?: string;
  model?: string;
  year?: number;
  title: string;
  summary?: string;
  riskDescription?: string;
  correctiveAction?: string;
  recallDate?: string;
  officialUrl?: string;
  vinMatchUncertain: boolean;
};

export type RecallSearchInput = {
  year?: number | null;
  make?: string | null;
  model?: string | null;
  vin?: string | null;
};

export const transportCanadaItemSchema = z.object({
  recall_number: z.union([z.string(), z.number()]).optional(),
  RecallNumber: z.union([z.string(), z.number()]).optional(),
  id: z.union([z.string(), z.number()]).optional(),
  manufacturer_name: z.string().optional(),
  ManufacturerName: z.string().optional(),
  make_name: z.string().optional(),
  MakeName: z.string().optional(),
  model_name: z.string().optional(),
  ModelName: z.string().optional(),
  year: z.union([z.string(), z.number()]).optional(),
  Year: z.union([z.string(), z.number()]).optional(),
  model_year: z.union([z.string(), z.number()]).optional(),
  recall_name_en: z.string().optional(),
  Name: z.string().optional(),
  title: z.string().optional(),
  recall_date: z.string().optional(),
  RecallDate: z.string().optional(),
  consequence_en: z.string().optional(),
  Consequence: z.string().optional(),
  corrective_action_en: z.string().optional(),
  CorrectiveAction: z.string().optional(),
  summary_en: z.string().optional(),
  Summary: z.string().optional(),
  url: z.string().optional(),
  Url: z.string().optional(),
});

export type TransportCanadaItem = z.infer<typeof transportCanadaItemSchema>;
