import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { client } from "../shared/model.js";

export function parseObject(content: string | null): any {
  if (!content) throw new Error("Model returned no JSON text.");
  return JSON.parse(content.replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/, ""));
}

export async function jsonCall(model: string, prompt: string, input: unknown) {
  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: prompt },
    { role: "user", content: JSON.stringify(input) },
  ];
  const response = await client.chat.completions.create({ model, messages, temperature: 0, max_tokens: 4000, response_format: { type: "json_object" } });
  if (response.choices[0]?.finish_reason !== "stop") throw new Error(`Incomplete JSON response: ${response.choices[0]?.finish_reason}`);
  return { value: parseObject(response.choices[0].message.content), response_id: response.id };
}
