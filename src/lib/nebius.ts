import OpenAI from "openai";
import { CONFIG } from "./config";

let client: OpenAI | undefined;

function getClient() {
  if (!process.env.NEBIUS_API_KEY || !process.env.NEBIUS_BASE_URL) {
    throw new Error("Nebius credentials are missing. Add NEBIUS_API_KEY and NEBIUS_BASE_URL.");
  }
  client ??= new OpenAI({
    apiKey: process.env.NEBIUS_API_KEY,
    baseURL: process.env.NEBIUS_BASE_URL,
    timeout: CONFIG.nebius.requestTimeoutMs,
  });
  return client;
}

export async function askNemotron(options: {
  role: "strong" | "fast";
  system: string;
  prompt: string;
  json?: boolean;
}) {
  const model = options.role === "strong" ? CONFIG.nebius.modelStrong : CONFIG.nebius.modelFast;
  if (!model) throw new Error(`NEBIUS_MODEL_${options.role.toUpperCase()} is not configured.`);
  const response = await getClient().chat.completions.create({
    model,
    temperature: CONFIG.nebius.temperature,
    max_tokens: options.role === "strong" ? CONFIG.nebius.maxTokensStrong : CONFIG.nebius.maxTokensFast,
    response_format: options.json ? { type: "json_object" } : undefined,
    messages: [
      { role: "system", content: options.system },
      { role: "user", content: options.prompt },
    ],
  });
  const text = response.choices[0]?.message?.content?.trim();
  if (!text) throw new Error("Nemotron returned an empty response.");
  return text;
}
