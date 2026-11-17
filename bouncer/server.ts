import { createServer } from "node:http";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { loadPack } from "./pack.js";
import { runEvidence } from "./runner.js";

const port = Number(process.env.BOUNCER_PORT || 4317);
const packFolder = resolve(process.argv[2] || "packs/tonight");
type Job = { id: string; status: string; messages: string[]; run?: any; error?: string };
const jobs = new Map<string, Job>();
let busy = false;
const allowedHosts = new Set([`127.0.0.1:${port}`, `localhost:${port}`]);
const runId = /^[0-9TZ-]+-[a-f0-9]{8}$/;

const server = createServer(async (req, res) => {
  const json = (status: number, value: unknown) => { res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }); res.end(JSON.stringify(value)); };
  try {
    if (!allowedHosts.has(req.headers.host || "")) return json(403, { error: "Local access only." });
    if (req.headers.origin && ![`http://127.0.0.1:${port}`, `http://localhost:${port}`].includes(req.headers.origin)) return json(403, { error: "Cross-origin access denied." });
    const url = new URL(req.url || "/", `http://127.0.0.1:${port}`);
    if (req.method === "GET" && ["/", "/app.js", "/style.css"].includes(url.pathname)) {
      const name = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
      const content = await readFile(resolve("bouncer/web", name));
      res.writeHead(200, { "Content-Type": name.endsWith("html") ? "text/html; charset=utf-8" : name.endsWith("css") ? "text/css" : "text/javascript", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'" });
      return res.end(content);
    }
    if (req.method === "GET" && url.pathname === "/api/pack") {
      const pack = await loadPack(packFolder);
      return json(200, { id: pack.id, model: process.env.AIAND_MODEL || pack.model, draft: pack.draft, sources: pack.sources });
    }
    if (req.method === "GET" && url.pathname === "/api/latest") {
      let entries: string[] = [];
      try { entries = (await readdir(resolve("results/bouncer"))).filter(id => runId.test(id)).sort().reverse(); } catch { /* No saved runs. */ }
      for (const id of entries) {
        const run = JSON.parse(await readFile(resolve("results/bouncer", id, "run.json"), "utf8"));
        if (run.execution_status === "completed" && resolve(run.pack_folder) === packFolder) return json(200, { run });
      }
      return json(200, { run: null });
    }
    if (req.method === "GET" && url.pathname.startsWith("/api/jobs/")) {
      const job = jobs.get(url.pathname.slice("/api/jobs/".length));
      return job ? json(200, job) : json(404, { error: "Job not found." });
    }
    if (req.method === "POST" && url.pathname === "/api/runs") {
      if (req.headers["x-bouncer-local"] !== "1" || !req.headers["content-type"]?.startsWith("application/json")) return json(403, { error: "Use the local app to start a run." });
      if (busy) return json(409, { error: "A check is already running. Wait for it to finish." });
      let body = "";
      for await (const chunk of req) {
        body += chunk.toString();
        if (Buffer.byteLength(body) > 100_000) return json(413, { error: "Draft is too large." });
      }
      let input: any;
      try { input = JSON.parse(body); } catch { return json(400, { error: "Invalid JSON." }); }
      if (typeof input.draft !== "string" || !input.draft.trim() || input.draft.length > 20_000) return json(400, { error: "Enter a draft between 1 and 20,000 characters." });
      if (busy) return json(409, { error: "A check is already running. Wait for it to finish." });
      const id = randomUUID();
      const job: Job = { id, status: "running", messages: ["Extracting factual claims · real AIAND model run"] };
      busy = true;
      jobs.set(id, job);
      json(202, { id });
      void runEvidence(packFolder, input.draft, message => job.messages.push(message)).then(result => {
        job.run = result.run;
        job.status = result.run.execution_status;
      }).catch(() => { job.status = "failed"; job.error = "Could not save the run. Check the server terminal."; }).finally(() => { busy = false; });
      return;
    }
    return json(404, { error: "Not found." });
  } catch {
    if (!res.headersSent) json(500, { error: "Could not load local data. Check the server terminal." });
    else res.end();
  }
});
server.listen(port, "127.0.0.1", () => console.log(`Evidence Bouncer web app: http://127.0.0.1:${port}\nPack: ${packFolder}`));
