import type { Claim, Pack, Verdict } from "./types.js";

export function scoreboard(run: any): string {
  const verdicts: Verdict[] = run.verdicts || [];
  const counts = Object.fromEntries(["supported", "unsupported", "contradicted", "unknown"].map(status => [status, verdicts.filter(v => v.status === status).length]));
  const lines = [
    `# Evidence Bouncer — ${run.pack_id || "unloaded pack"}`,
    "",
    `Run: ${run.id} | ${run.created_at} | ${run.model || "unselected model"}`,
    `Execution: **${run.execution_status}** | Human approval: **${run.approval_status}**`,
    "",
    `**Supported: ${counts.supported} · Bounced: ${counts.unsupported + counts.contradicted} · Unknown: ${counts.unknown}**`,
    "",
    "Bounced includes unsupported and contradicted claims. Unsupported does not mean false. Model verdicts require human review.",
    "",
  ];
  if (run.error) lines.push(`Error: ${run.error}`, "", "This run is incomplete and must not be treated as a completed check.", "");
  for (const claim of (run.claims || []) as Claim[]) {
    const verdict = verdicts.find(v => v.claim_id === claim.id);
    lines.push(`## ${claim.id} — ${verdict?.status.toUpperCase() || "NOT CHECKED"}`, "", claim.text, "", `Original draft: ${JSON.stringify(claim.draft_quote)}`, "", verdict?.rationale || "No verdict available.", "");
    for (const ref of verdict?.references || []) {
      const source = (run.evidence as Pack["sources"]).find(s => s.id === ref.source_id);
      const line = source ? source.content.slice(0, source.content.indexOf(ref.quote)).split("\n").length : "?";
      lines.push(`- ${ref.source_id} · ${source?.file}:${line} · SHA-256 ${source?.sha256}`, `  ${JSON.stringify(ref.quote)}`);
    }
    lines.push("");
  }
  lines.push("## Grounded rewrite — pending human review", "", run.rewrite || "No grounded rewrite produced.", "", "The rewrite assembles only checked, supported claim text. It is not a guarantee of truth or exhaustive claim extraction.", "", "## Evidence provenance", "");
  for (const source of (run.evidence || []) as Pack["sources"]) lines.push(`- ${source.id}: ${source.file} (${source.authority}); SHA-256 ${source.sha256}`);
  lines.push("", "Do not reuse generated assertions as independent evidence. Approval requires a separate human review; original references must be preserved.", "");
  return lines.join("\n");
}
