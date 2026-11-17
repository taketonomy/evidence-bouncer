import { jsonCall } from "./model.js";
import type { Claim, Source, Verdict, Reference } from "./types.js";

export function validateVerdicts(value: any, claims: Claim[], sources: Source[]): Verdict[] {
  if (!Array.isArray(value.verdicts) || value.verdicts.length !== claims.length) throw new Error("Checker did not return one verdict per claim.");
  const seen = new Set<string>();
  return value.verdicts.map((verdict: any) => {
    if (!claims.some(c => c.id === verdict.claim_id) || seen.has(verdict.claim_id) || !["supported", "unsupported", "contradicted", "unknown"].includes(verdict.status) || typeof verdict.rationale !== "string" || !verdict.rationale.trim() || !Array.isArray(verdict.references)) throw new Error("Invalid checker verdict.");
    seen.add(verdict.claim_id);
    const references: Reference[] = verdict.references.filter((ref: any) => typeof ref.quote === "string" && ref.quote.trim() && sources.some(s => s.id === ref.source_id && s.content.includes(ref.quote))).map((ref: any) => ({ source_id: ref.source_id, quote: ref.quote }));
    if (references.length !== verdict.references.length || (["supported", "contradicted"].includes(verdict.status) && !references.length)) {
      return { claim_id: verdict.claim_id, status: "unknown", rationale: "Citation validation failed: model evidence did not resolve to an exact source quote. Human review required.", references };
    }
    return { claim_id: verdict.claim_id, status: verdict.status, rationale: verdict.rationale, references };
  });
}

export async function checkClaims(model: string, prompt: string, claims: Claim[], sources: Source[]) {
  const result = await jsonCall(model, prompt, { claims, sources });
  return { verdicts: validateVerdicts(result.value, claims, sources), raw_verdicts: result.value.verdicts, response_id: result.response_id };
}
