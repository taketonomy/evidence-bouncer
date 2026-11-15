// Scores extracted items against the answer key.
// score = 0.4 * F1(items) + 0.3 * owner accuracy + 0.3 * deadline accuracy
// Invented items lower precision; missed items lower recall.

import type { ExpectedItem, MeetingCase } from "./dataset.js";
import type { ActionItem } from "./extract.js";

export type CaseScore = {
  score: number;
  perfect: boolean;
  matched: number;
  missed: string[];      // expected tasks not found
  invented: string[];    // predicted tasks with no match
  wrongOwner: string[];
  wrongDeadline: string[];
};

const norm = (s: string) => s.normalize("NFKC").toLowerCase().trim();
const alts = (s: string) => s.split("|").map(norm);
const NO_OWNER = /^(none|nobody|unassigned|tbd|n\/a|null|-)?$/i;

function keywordOverlap(task: string, keywords: string[]): number {
  const t = norm(task);
  const hits = keywords.filter((k) => alts(k).some((a) => t.includes(a))).length;
  return hits / keywords.length;
}

export function ownerMatches(pred: string | null, exp: string | null): boolean {
  if (exp === null) return pred === null || NO_OWNER.test(pred.trim());
  if (pred === null || NO_OWNER.test(pred.trim())) return false;
  const p = norm(pred);
  return alts(exp).some((a) => p.includes(a));
}

export function scoreCase(items: ActionItem[] | null, c: MeetingCase): CaseScore {
  const expected = c.expected;
  if (items === null) {
    return { score: 0, perfect: false, matched: 0, missed: expected.map((e) => e.task), invented: [], wrongOwner: [], wrongDeadline: [] };
  }

  const used = new Set<number>();
  const pairs: [ExpectedItem, ActionItem][] = [];
  const missed: string[] = [];

  for (const exp of expected) {
    let best = -1, bestOverlap = 0;
    items.forEach((it, i) => {
      if (used.has(i)) return;
      const o = keywordOverlap(it.task, exp.keywords);
      if (o > bestOverlap) { best = i; bestOverlap = o; }
    });
    if (best >= 0 && bestOverlap >= 0.5) { used.add(best); pairs.push([exp, items[best]!]); }
    else missed.push(exp.task);
  }

  const invented = items.filter((_, i) => !used.has(i)).map((it) => it.task);
  const wrongOwner = pairs.filter(([e, p]) => !ownerMatches(p.owner, e.owner)).map(([e, p]) => `${e.task}: got ${p.owner ?? "null"}, want ${e.owner ?? "null"}`);
  const wrongDeadline = pairs.filter(([e, p]) => (p.deadline ?? null) !== e.deadline).map(([e, p]) => `${e.task}: got ${p.deadline ?? "null"}, want ${e.deadline ?? "null"}`);

  const m = pairs.length;
  const precision = items.length ? m / items.length : expected.length ? 0 : 1;
  const recall = expected.length ? m / expected.length : 1;
  const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
  const ownerAcc = (m - wrongOwner.length) / expected.length;
  const deadlineAcc = (m - wrongDeadline.length) / expected.length;
  const score = 0.4 * f1 + 0.3 * ownerAcc + 0.3 * deadlineAcc;

  return {
    score,
    perfect: missed.length === 0 && invented.length === 0 && wrongOwner.length === 0 && wrongDeadline.length === 0,
    matched: m, missed, invented, wrongOwner, wrongDeadline,
  };
}
