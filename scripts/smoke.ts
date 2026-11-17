import { mkdir, writeFile } from "node:fs/promises";
import { client, configuredModel } from "../shared/model.js";

const model = configuredModel();
const response = await client.chat.completions.create({
  model,
  messages: [{ role: "user", content: "Reply with a brief greeting to the hackathon builders." }],
  max_tokens: 100,
});
const answer = response.choices[0]?.message.content;
if (!answer?.trim()) throw new Error("Model returned no text; smoke check failed.");
const record = { created_at: new Date().toISOString(), model, response_id: response.id, answer, references: [], approval_status: "pending" };
await mkdir("results", { recursive: true });
await writeFile("results/model-smoke.json", JSON.stringify(record, null, 2));
console.log(JSON.stringify(record, null, 2));
