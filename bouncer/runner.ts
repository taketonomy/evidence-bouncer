import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { randomUUID, createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import "dotenv/config";
import { loadPack } from "./pack.js";
import { generateClaims } from "./generator.js";
import { runBouncerLoop } from "./loop.js";
import { scoreboard } from "./report.js";
import { requireApiKey } from "../shared/model.js";

export async function runEvidence(folder: string, draftOverride?: string, onProgress: (message: string) => void = () => {}) {
const id = `${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID().slice(0, 8)}`;
const directory = resolve("results", "bouncer", id);
await mkdir(directory, { recursive: true });
const run: any = { id, created_at: new Date().toISOString(), execution_status: "running", approval_status: "pending", references: [], claims: [], verdicts: [], trace: [] };
try {
  const pack = await loadPack(folder);
  if (draftOverride !== undefined) pack.draft = draftOverride;
  requireApiKey();
  const model = process.env.AIAND_MODEL || pack.model;
  let commit: string | null = null;
  try { commit = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); } catch { /* Source hashes still identify pack bytes. */ }
  Object.assign(run, { pack_id: pack.id, pack_folder: resolve(folder), model, repository_commit: commit, evidence: pack.sources, original_draft: pack.draft, draft_sha256: createHash("sha256").update(pack.draft).digest("hex"), prompts: pack.prompts, configuration: { max_tool_iterations: 3, temperature: 0 } });
  console.log(`Evidence Bouncer | ${pack.id} | ${model}\n[generator] extracting claims from draft`);
  const generated = await generateClaims(model, pack.prompts.generator, pack.draft);
  run.claims = generated.claims;
  run.trace.push({ phase: "generator", response_id: generated.response_id });
  console.log(`[generator] ${generated.claims.length} claims identified`);
  onProgress(`${generated.claims.length} claims extracted · agent calling checker tool`);
  const result = await runBouncerLoop(model, pack, generated.claims, event => {
    run.trace.push(event);
    if ((event as any).verdicts) run.verdicts.push(...(event as any).verdicts);
    if ((event as any).verdicts) onProgress(`Checked ${run.verdicts.length} claims · selecting supported claims for rewrite`);
  });
  Object.assign(run, { verdicts: result.memory, rewrite: result.rewrite, selected_claim_ids: result.selected_claim_ids, execution_status: "completed" });
} catch (error) {
  run.execution_status = "failed";
  const message = error instanceof Error ? error.message : String(error);
  const secret = process.env.AIAND_API_KEY;
  run.error = secret ? message.split(secret).join("[REDACTED]") : message;
} finally {
  run.finished_at = new Date().toISOString();
  run.references = run.verdicts.flatMap((v: any) => v.references.map((ref: any) => ({ claim_id: v.claim_id, ...ref })));
  const report = scoreboard(run);
  await writeFile(resolve(directory, "run.json"), JSON.stringify(run, null, 2));
  await writeFile(resolve(directory, "scoreboard.md"), report);
  onProgress(run.execution_status === "completed" ? "Complete · report saved for human review" : "Run failed · incomplete report saved");
  return { run, directory, report };
}
}
