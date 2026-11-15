// Meeting follow-up eval: baseline vs improved harness.
//
//   npm run meeting                    # both modes, real model (needs credits)
//   npm run meeting -- --mode baseline # one mode only
//   npm run meeting -- --only 03       # cases whose id contains "03"
//   npm run meeting -- --mock          # no API calls: checks scoring + retry plumbing
//   npm run meeting -- --ping          # list models: checks key + proxy, no inference

import { mkdirSync, writeFileSync } from "node:fs";
import { meetings, type MeetingCase } from "./dataset.js";
import { extractBaseline, extractImproved, type Extraction } from "./extract.js";
import { scoreCase, type CaseScore } from "./score.js";
import { client, MODEL, type Msg } from "./model.js";

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const opt = (name: string) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined; };

if (!flag("mock") && !process.env.AIAND_API_KEY) {
  console.error("AIAND_API_KEY is not set. Add it to .env, or use --mock.");
  process.exit(1);
}

if (flag("ping")) {
  const list = await client.models.list();
  const ids = list.data.map((m) => m.id);
  console.log(`Reached ai& through the SDK. ${ids.length} models listed.`);
  console.log(ids.includes(MODEL) ? `✓ ${MODEL} is available` : `✗ ${MODEL} not in the list:\n  ${ids.join("\n  ")}`);
  process.exit(0);
}

// Mock model: first reply is broken (bad owner + bad date) so the retry path runs;
// the reply to a retry is the answer key, so the improved mode should score 1.00.
function mockCall(c: MeetingCase) {
  return async (messages: Msg[]): Promise<string> => {
    const key = c.expected.map((e) => ({ task: e.task, owner: e.owner?.split("|")[0] ?? null, deadline: e.deadline }));
    if (messages.length > 2) return "```json\n" + JSON.stringify({ items: key }) + "\n```";
    const broken = key.map((k, i) => (i === 0 ? { ...k, owner: "Someone Else", deadline: "next Friday" } : k));
    return JSON.stringify({ items: broken });
  };
}

type Row = { id: string; ex: Extraction; sc: CaseScore; ms: number };
const MODES = { baseline: extractBaseline, improved: extractImproved } as const;
type Mode = keyof typeof MODES;

const modes: Mode[] = opt("mode") ? [opt("mode") as Mode] : ["baseline", "improved"];
const cases = opt("only") ? meetings.filter((m) => m.id.includes(opt("only")!)) : meetings;
const mock = flag("mock");

console.log(`Model: ${mock ? "MOCK" : MODEL} · cases: ${cases.length} · modes: ${modes.join(", ")}\n`);

const runs: Record<string, Row[]> = {};
for (const mode of modes) {
  const rows: Row[] = [];
  for (const c of cases) {
    const t = Date.now();
    let ex: Extraction;
    try {
      ex = await MODES[mode](c, mock ? mockCall(c) : undefined);
    } catch (e) {
      console.error(`✗ ${mode} ${c.id}: ${(e as Error).message}`);
      ex = { items: null, raw: "", attempts: 0, problems: [`API error: ${(e as Error).message}`] };
    }
    rows.push({ id: c.id, ex, sc: scoreCase(ex.items, c), ms: Date.now() - t });
    process.stdout.write(".");
  }
  runs[mode] = rows;
  console.log(`\n\n=== ${mode} ===`);
  console.table(rows.map((r) => ({
    id: r.id,
    score: r.sc.score.toFixed(2),
    perfect: r.sc.perfect ? "✓" : "✗",
    missed: r.sc.missed.length,
    invented: r.sc.invented.length,
    badOwner: r.sc.wrongOwner.length,
    badDate: r.sc.wrongDeadline.length,
    tries: r.ex.attempts,
    ms: r.ms,
  })));
  for (const r of rows) {
    const issues = [
      ...r.sc.missed.map((t) => `missed: ${t}`),
      ...r.sc.invented.map((t) => `invented: ${t}`),
      ...r.sc.wrongOwner.map((t) => `owner: ${t}`),
      ...r.sc.wrongDeadline.map((t) => `date: ${t}`),
      ...r.ex.problems.map((p) => `invalid: ${p}`),
    ];
    if (issues.length) console.log(`  ${r.id}\n    ${issues.join("\n    ")}`);
  }
}

console.log("\n=== COMPARISON ===");
console.table(Object.entries(runs).map(([mode, rows]) => {
  const sum = (f: (r: Row) => number) => rows.reduce((s, r) => s + f(r), 0);
  return {
    mode,
    avgScore: (sum((r) => r.sc.score) / rows.length).toFixed(2),
    perfect: `${rows.filter((r) => r.sc.perfect).length}/${rows.length}`,
    missed: sum((r) => r.sc.missed.length),
    invented: sum((r) => r.sc.invented.length),
    badOwner: sum((r) => r.sc.wrongOwner.length),
    badDate: sum((r) => r.sc.wrongDeadline.length),
    retries: rows.filter((r) => r.ex.attempts > 1).length,
    avgMs: Math.round(sum((r) => r.ms) / rows.length),
  };
}));

mkdirSync("results", { recursive: true });
const file = `results/meeting-${mock ? "mock" : MODEL.replace(/\W+/g, "_")}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
writeFileSync(file, JSON.stringify({ model: mock ? "MOCK" : MODEL, runs }, null, 2));
console.log(`\nSaved ${file}`);
