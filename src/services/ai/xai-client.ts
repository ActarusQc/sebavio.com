import "server-only";

import OpenAI from "openai";

export type XaiClientConfig = {
  apiKey: string;
  baseUrl: string;
  timeoutMs: number;
};

export function createXaiClient(config: XaiClientConfig): OpenAI {
  return new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
    timeout: config.timeoutMs,
    maxRetries: 1,
  });
}

export type XaiResponsesCreateParams = {
  model: string;
  input: Array<{ role: "system" | "user"; content: string }>;
  store: false;
  text: { format: { type: "json_object" } };
  tools?: Array<{ type: "web_search" }>;
  tool_choice?: "auto" | "required" | "none";
};

export type XaiResponsesCreateResult = {
  output_text?: string | null;
  usage?: {
    input_tokens?: number | null;
    output_tokens?: number | null;
    total_tokens?: number | null;
  } | null;
  id?: string | null;
  citations?: unknown;
  output?: unknown;
  server_side_tool_usage?: unknown;
};

export type XaiResponsesTransport = {
  responses: {
    create: (
      params: XaiResponsesCreateParams,
    ) => Promise<XaiResponsesCreateResult>;
  };
};

export function createXaiTransport(
  config: XaiClientConfig,
): XaiResponsesTransport {
  const client = createXaiClient(config);
  return {
    responses: {
      create: (params) =>
        client.responses.create(params) as Promise<XaiResponsesCreateResult>,
    },
  };
}
