// Model client for the meeting eval (ai&, OpenAI-compatible).
// Passes Node's built-in fetch explicitly so NODE_USE_ENV_PROXY=1
// (the Fortinet proxy fix) applies to SDK calls too.

import OpenAI from "openai";
import "dotenv/config";

export const MODEL = process.env.AIAND_MODEL || "google/gemma-4-31b-it";

export const client = new OpenAI({
  baseURL: "https://api.aiand.com/v1",
  apiKey: process.env.AIAND_API_KEY || "missing", // checked in index.ts
  fetch: globalThis.fetch as any,
});

export type Msg = { role: "system" | "user" | "assistant"; content: string };

export async function chat(messages: Msg[]): Promise<string> {
  const res = await client.chat.completions.create({
    model: MODEL,
    temperature: 0,
    max_tokens: 1200,
    messages,
  });
  return res.choices[0]?.message?.content?.trim() ?? "";
}
