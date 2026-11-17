import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateClaims } from "./generator.js";
import { validateVerdicts } from "./checker.js";
import { groundedRewrite } from "./loop.js";
import { loadPack } from "./pack.js";
import type { Claim, Source, Verdict } from "./types.js";

const claims: Claim[] = [{ id: "c1", text: "Peer vote determines winners.", draft_quote: "Peer vote determines winners." }];
const sources: Source[] = [{ id: "rules", file: "rules.md", content: "Peer vote determines winners.", sha256: "fixture", authority: "test fixture" }];

test("fabricated citations cannot pass as supported", () => {
  const verdicts = validateVerdicts({ verdicts: [{ claim_id: "c1", status: "supported", rationale: "Trust me", references: [{ source_id: "rules", quote: "Judges determine winners." }] }] }, claims, sources);
  assert.equal(verdicts[0].status, "unknown");
  assert.deepEqual(verdicts[0].references, []);
});

test("missing checker coverage fails instead of appearing complete", () => {
  assert.throws(() => validateVerdicts({ verdicts: [] }, claims, sources), /one verdict per claim/);
});

test("unsupported is preserved without inventing proof of falsity", () => {
  const verdicts = validateVerdicts({ verdicts: [{ claim_id: "c1", status: "unsupported", rationale: "Not established by these sources.", references: [] }] }, claims, sources);
  assert.equal(verdicts[0].status, "unsupported");
});

test("rewrite refuses bounced or unknown claims and preserves supported wording", () => {
  const verdict: Verdict = { claim_id: "c1", status: "unknown", rationale: "Unclear", references: [] };
  assert.throws(() => groundedRewrite(["c1"], claims, [verdict]), /ungrounded/);
  assert.equal(groundedRewrite(["c1"], claims, [{ ...verdict, status: "supported" }]), claims[0].text);
});

test("extraction rejects an invented draft location", () => {
  assert.throws(() => validateClaims({ claims: [{ ...claims[0], draft_quote: "Invented quote" }] }, claims[0].text), /Invalid claim/);
});

test("pack loader rejects pending reviewed outputs", async () => {
  const root = await mkdtemp(join(tmpdir(), "bouncer-pending-"));
  await writeFile(join(root, "pack.json"), JSON.stringify({ id: "test", model: "test-model", sources: [{ id: "previous", file: "run.json", kind: "reviewed_output", approval_status: "pending" }] }));
  await assert.rejects(loadPack(root), /unapproved output/);
});

test("pending generated output cannot bypass approval by declaring itself a source", async () => {
  const root = await mkdtemp(join(tmpdir(), "bouncer-disguised-"));
  await writeFile(join(root, "run.json"), JSON.stringify({ approval_status: "pending", references: [] }));
  await writeFile(join(root, "pack.json"), JSON.stringify({ id: "test", model: "test-model", sources: [{ id: "previous", file: "run.json", kind: "source" }] }));
  await assert.rejects(loadPack(root), /must be declared reviewed_output/);
});

test("a different pack can be loaded without changing core code", async () => {
  const root = await mkdtemp(join(tmpdir(), "bouncer-pack-"));
  await mkdir(join(root, "prompts"));
  await writeFile(join(root, "draft.md"), "The delivery date is Friday.");
  await writeFile(join(root, "brief.md"), "Deliver on Friday.");
  for (const key of ["generator", "checker", "loop", "rewrite"]) await writeFile(join(root, "prompts", `${key}.txt`), `Client ${key} instructions`);
  await writeFile(join(root, "pack.json"), JSON.stringify({ id: "client-brief", model: "test-model", draft: "draft.md", sources: [{ id: "brief", file: "brief.md", kind: "source" }], prompts: Object.fromEntries(["generator", "checker", "loop", "rewrite"].map(key => [key, `prompts/${key}.txt`])) }));
  const pack = await loadPack(root);
  assert.equal(pack.id, "client-brief");
  assert.equal(pack.sources[0].content, "Deliver on Friday.");
  assert.equal(pack.sources[0].sha256.length, 64);
});
