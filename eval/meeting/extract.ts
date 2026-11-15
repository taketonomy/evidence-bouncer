// The agent under test, in two harness variants:
//   baseline : one call, parse whatever comes back
//   improved : same prompt + validation + ONE bounded retry with error feedback
// The prompt is identical in both, so any score gain comes from the harness.

import { chat, type Msg } from "./model.js";
import type { MeetingCase } from "./dataset.js";

export type ActionItem = { task: string; owner: string | null; deadline: string | null };

export type Extraction = {
  items: ActionItem[] | null;  // null = unparseable output
  raw: string;
  attempts: number;
  problems: string[];          // validation problems on the FINAL attempt
};

export const SYSTEM_PROMPT = `You extract action items from meeting transcripts.
Return ONLY JSON, no prose: {"items":[{"task": string, "owner": string|null, "deadline": "YYYY-MM-DD"|null}]}
Rules:
- An action item is something a person committed to do after the meeting.
- owner: the attendee who will do it, written as in the attendee list. null if nobody was assigned.
- deadline: resolve relative dates ("Friday", "tomorrow", "the 20th") using the meeting date. null if none was given.
- Skip ideas that were rejected, tasks already finished, and vague maybes.`;

export function userPrompt(c: MeetingCase): string {
  const attendees = c.attendees.map((a) => a.split("|")[0]).join(", ");
  return `Meeting date: ${c.meetingDate}\nAttendees: ${attendees}\n\nTranscript:${c.transcript}`;
}

export function parseItems(text: string): { items: ActionItem[] | null; error?: string } {
  const unfenced = text.replace(/```(?:json)?/gi, "");
  const start = unfenced.indexOf("{");
  const end = unfenced.lastIndexOf("}");
  if (start === -1 || end <= start) return { items: null, error: "no JSON object found" };
  let data: any;
  try {
    data = JSON.parse(unfenced.slice(start, end + 1));
  } catch (e) {
    return { items: null, error: `invalid JSON: ${(e as Error).message}` };
  }
  if (!Array.isArray(data?.items)) return { items: null, error: 'missing "items" array' };
  const items: ActionItem[] = [];
  for (const [i, it] of data.items.entries()) {
    if (typeof it?.task !== "string" || !it.task.trim()) return { items: null, error: `item ${i}: "task" must be a non-empty string` };
    const owner = it.owner == null || String(it.owner).trim() === "" ? null : String(it.owner).trim();
    const deadline = it.deadline == null || String(it.deadline).trim() === "" ? null : String(it.deadline).trim();
    items.push({ task: it.task.trim(), owner, deadline });
  }
  return { items };
}

// Checks the harness can do WITHOUT the answer key.
export function validate(items: ActionItem[], c: MeetingCase): string[] {
  const problems: string[] = [];
  const names = c.attendees.flatMap((a) => a.split("|").map((n) => n.toLowerCase()));
  for (const [i, it] of items.entries()) {
    if (it.owner && !names.some((n) => it.owner!.toLowerCase().includes(n))) {
      problems.push(`item ${i} ("${it.task}"): owner "${it.owner}" is not an attendee; use an attendee name or null`);
    }
    if (it.deadline) {
      const ok = /^\d{4}-\d{2}-\d{2}$/.test(it.deadline) && !isNaN(Date.parse(it.deadline));
      if (!ok) problems.push(`item ${i} ("${it.task}"): deadline "${it.deadline}" is not a valid YYYY-MM-DD date`);
      else if (it.deadline < c.meetingDate) problems.push(`item ${i} ("${it.task}"): deadline ${it.deadline} is before the meeting date ${c.meetingDate}`);
    }
  }
  return problems;
}

export async function extractBaseline(c: MeetingCase, call = chat): Promise<Extraction> {
  const raw = await call([{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: userPrompt(c) }]);
  const { items, error } = parseItems(raw);
  return { items, raw, attempts: 1, problems: error ? [error] : validate(items!, c) };
}

export async function extractImproved(c: MeetingCase, call = chat): Promise<Extraction> {
  const messages: Msg[] = [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: userPrompt(c) }];
  let raw = await call(messages);
  let { items, error } = parseItems(raw);
  let problems = error ? [error] : validate(items!, c);
  if (problems.length === 0) return { items, raw, attempts: 1, problems };

  // One bounded retry: show the model exactly what was wrong.
  messages.push(
    { role: "assistant", content: raw },
    { role: "user", content: `Your answer has problems:\n- ${problems.join("\n- ")}\nReturn the corrected JSON only.` },
  );
  raw = await call(messages);
  ({ items, error } = parseItems(raw));
  problems = error ? [error] : validate(items!, c);
  return { items, raw, attempts: 2, problems };
}
