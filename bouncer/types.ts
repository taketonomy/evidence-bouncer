export type Claim = { id: string; text: string; draft_quote: string };
export type Reference = { source_id: string; quote: string };
export type Verdict = {
  claim_id: string;
  status: "supported" | "unsupported" | "contradicted" | "unknown";
  rationale: string;
  references: Reference[];
};
export type Source = { id: string; file: string; content: string; sha256: string; authority: string; approval_status?: string };
export type Pack = {
  id: string;
  model: string;
  draft: string;
  sources: Source[];
  prompts: { generator: string; checker: string; loop: string; rewrite: string };
};
