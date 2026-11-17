import { readFile, realpath } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { createHash } from "node:crypto";
import type { Pack, Source } from "./types.js";

export async function loadPack(folder: string): Promise<Pack> {
  const root = await realpath(folder);
  async function read(relative: string) {
    const path = await realpath(resolve(root, relative));
    if (!path.startsWith(root + sep)) throw new Error("Pack files must stay within the pack folder.");
    if (path.split(sep).some(part => part === ".env" || part.startsWith(".env."))) throw new Error("Credentials cannot be evidence.");
    return readFile(path, "utf8");
  }
  const config = JSON.parse(await read("pack.json"));
  if (!config.id || !config.model || !Array.isArray(config.sources) || !config.sources.length) throw new Error("Invalid pack configuration.");
  const sources: Source[] = [];
  for (const source of config.sources) {
    if (!source.id || sources.some(s => s.id === source.id)) throw new Error("Missing or duplicate source ID.");
    if (!["source", "reviewed_output"].includes(source.kind)) throw new Error(`Source ${source.id}: specify source or reviewed_output kind.`);
    if (source.kind === "reviewed_output" && source.approval_status !== "approved") throw new Error(`Source ${source.id}: unapproved output cannot be evidence.`);
    const content = await read(source.file);
    let artifact: any = null;
    try { artifact = JSON.parse(content); } catch { /* Plain-text source documents are expected. */ }
    if (artifact && typeof artifact === "object" && "approval_status" in artifact && source.kind !== "reviewed_output") throw new Error(`Source ${source.id}: a saved output must be declared reviewed_output, not a primary source.`);
    if (source.kind === "reviewed_output") {
      const saved = JSON.parse(content);
      if (saved.approval_status !== "approved" || !Array.isArray(saved.references) || !saved.references.length) throw new Error(`Source ${source.id}: reviewed output requires approval and original references.`);
    }
    sources.push({ id: source.id, file: source.file, content, sha256: createHash("sha256").update(content).digest("hex"), authority: source.authority || "user-supplied", approval_status: source.approval_status });
  }
  for (const source of config.sources.filter((s: any) => s.kind === "reviewed_output")) {
    const saved = JSON.parse(sources.find(s => s.id === source.id)!.content);
    for (const ref of saved.references) {
      const original = sources.find(s => s.id === ref.source_id && config.sources.some((entry: any) => entry.id === s.id && entry.kind === "source"));
      if (!original || typeof ref.quote !== "string" || !ref.quote.trim() || !original.content.includes(ref.quote)) throw new Error(`Source ${source.id}: original references must resolve to primary evidence in this pack.`);
    }
  }
  const prompts = {} as Pack["prompts"];
  for (const key of ["generator", "checker", "loop", "rewrite"] as const) prompts[key] = await read(config.prompts[key]);
  return { id: config.id, model: config.model, draft: await read(config.draft), sources, prompts };
}
