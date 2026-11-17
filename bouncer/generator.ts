import { jsonCall } from "./model.js";
import type { Claim } from "./types.js";

export function validateClaims(value: any, draft: string): Claim[] {
  if (!Array.isArray(value.claims) || !value.claims.length || value.claims.length > 30) throw new Error("Generator must return 1–30 claims.");
  const seen = new Set<string>();
  return value.claims.map((claim: any) => {
    if (typeof claim.id !== "string" || seen.has(claim.id) || typeof claim.text !== "string" || !claim.text.trim() || typeof claim.draft_quote !== "string" || !claim.draft_quote.trim() || !draft.includes(claim.draft_quote)) throw new Error("Invalid claim or quote not found in original draft.");
    seen.add(claim.id);
    return { id: claim.id, text: claim.text, draft_quote: claim.draft_quote };
  });
}

export async function generateClaims(model: string, prompt: string, draft: string) {
  const result = await jsonCall(model, prompt, { draft });
  return { claims: validateClaims(result.value, draft), response_id: result.response_id };
}
