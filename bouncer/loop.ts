import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { client } from "../shared/model.js";
import { checkClaims } from "./checker.js";
import { parseObject } from "./model.js";
import type { Claim, Pack, Verdict } from "./types.js";

export function groundedRewrite(ids: unknown, claims: Claim[], memory: Verdict[]): string {
  if (!Array.isArray(ids) || !ids.length || new Set(ids).size !== ids.length) throw new Error("Rewrite must select unique supported claim IDs.");
  return ids.map(id => {
    const claim = claims.find(c => c.id === id);
    if (!claim || !memory.some(v => v.claim_id === id && v.status === "supported")) throw new Error(`Rewrite tried to include an ungrounded claim: ${id}`);
    return claim.text;
  }).join("\n\n");
}

export async function runBouncerLoop(model: string, pack: Pack, claims: Claim[], onEvent: (event: unknown) => void) {
  const memory: Verdict[] = [];
  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: pack.prompts.loop },
    { role: "user", content: JSON.stringify({ draft: pack.draft, claims }) },
  ];
  const tool = {
    type: "function" as const,
    function: {
      name: "check_claims",
      description: "Check draft claims against the selected evidence pack and save verdicts to run memory.",
      parameters: { type: "object", properties: { claim_ids: { type: "array", items: { type: "string" } } }, required: ["claim_ids"], additionalProperties: false },
    },
  };
  for (let iteration = 1; iteration <= 3 && memory.length < claims.length; iteration++) {
    console.log(`[loop ${iteration}] model choosing checker tool`);
    const response = await client.chat.completions.create({ model, messages, tools: [tool], tool_choice: { type: "function", function: { name: "check_claims" } }, temperature: 0, max_tokens: 1000 });
    const message = response.choices[0]?.message;
    if (!message?.tool_calls?.length || response.choices[0]?.finish_reason !== "tool_calls") throw new Error("Model did not complete the required checker tool call.");
    messages.push(message as ChatCompletionMessageParam);
    for (const call of message.tool_calls) {
      if (call.function.name !== "check_claims") throw new Error("Unknown tool requested.");
      const args = parseObject(call.function.arguments);
      if (!Array.isArray(args.claim_ids) || !args.claim_ids.length || new Set(args.claim_ids).size !== args.claim_ids.length || args.claim_ids.some((id: unknown) => !claims.some(c => c.id === id))) throw new Error("Invalid checker tool arguments.");
      const selected = claims.filter(c => args.claim_ids.includes(c.id) && !memory.some(v => v.claim_id === c.id));
      if (!selected.length) throw new Error("Checker tool made no progress.");
      console.log(`  → check_claims: ${selected.length} claims against ${pack.sources.length} sources`);
      const checked = await checkClaims(model, pack.prompts.checker, selected, pack.sources);
      memory.push(...checked.verdicts);
      onEvent({ iteration, tool: call.function.name, arguments: args, model_response_id: response.id, checker_response_id: checked.response_id, raw_checker_verdicts: checked.raw_verdicts, verdicts: checked.verdicts });
      messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify({ verdicts: checked.verdicts, remaining_claim_ids: claims.filter(c => !memory.some(v => v.claim_id === c.id)).map(c => c.id) }) });
    }
  }
  if (memory.length !== claims.length) throw new Error("Iteration limit reached before all claims were checked.");
  if (!memory.some(v => v.status === "supported")) return { memory, rewrite: "", selected_claim_ids: [] };
  messages.push({ role: "user", content: pack.prompts.rewrite });
  const response = await client.chat.completions.create({ model, messages, temperature: 0, max_tokens: 1500, response_format: { type: "json_object" } });
  if (response.choices[0]?.finish_reason !== "stop") throw new Error("Rewrite response incomplete.");
  const selection = parseObject(response.choices[0].message.content);
  const rewrite = groundedRewrite(selection.selected_claim_ids, claims, memory);
  onEvent({ phase: "rewrite", model_response_id: response.id, selected_claim_ids: selection.selected_claim_ids });
  return { memory, rewrite, selected_claim_ids: selection.selected_claim_ids };
}
