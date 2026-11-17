# Evidence Bouncer — hackathon MVP

Run a draft through an evidence-checking tool loop and save a claim scoreboard. Ken is a fictional designed persona, not a customer or testimonial.

## Run

### Local web app

```sh
npm run web
```

Open http://127.0.0.1:4317. The app loads the latest completed recorded run, explicitly labels it recorded, and lets you edit the draft and start a real check. Filter claims, expand source citations, inspect source documents and run memory, copy the grounded rewrite, or download the run JSON. Live progress is polled from the local server; the API key stays server-side. Reports remain pending human review.

The server binds only to loopback, serves a fixed allowlist of assets, checks request origin/host, and allows only one active model run. To choose another local pack, use `npm run web -- packs/your-pack`. Stop with Ctrl+C. The UI does not approve, publish, or submit drafts.

Browser smoke verification: `node scripts/web-smoke.mjs` checks recorded-run rendering, filters, citations, mobile overflow, and one real browser-initiated model run. Screenshots and its result are saved under `results/web/`.

### CLI

The local `.env` must contain `AIAND_API_KEY`. Do not commit it or paste the key into logs.

On the venue network, keep the proxy configured in the shell:

```sh
export http_proxy=http://localhost:3128
export https_proxy=http://localhost:3128
export HTTP_PROXY=http://localhost:3128
export HTTPS_PROXY=http://localhost:3128
npm run models
AIAND_MODEL=google/gemma-4-31b-it npm run smoke
npm run bouncer -- packs/tonight
```

`google/gemma-4-31b-it` was returned by AIAND's model listing and produced a real response on 2026-11-17. The pack selects this model; `AIAND_MODEL` overrides it. The shared SDK client uses `https-proxy-agent` with the configured proxy rather than relying on node-fetch to interpret proxy variables.

Each bouncer run writes `run.json` and `scoreboard.md` into a unique directory under `results/bouncer/`. Failures are saved as failed runs, with partial trace and an explicit incomplete report. `results/` is gitignored; copy only deliberately reviewed, sanitized artifacts into a committed evidence directory when appropriate. Nothing is submitted or published automatically.

## How it works

1. **Knowledge:** load the selected pack's draft, prompts, and source documents. Snapshot source content and SHA-256 hashes.
2. **Generator:** extract factual claims and original draft quotes.
3. **Tool:** the review model calls `check_claims`; the separate checker model call assesses the selected claims against the pack.
4. **Memory:** store supported, unsupported, contradicted, and unknown verdicts with exact source quotes.
5. **Loop:** feed tool results back to the model. It selects supported claim IDs for a rewrite; deterministic code assembles only those checked sentences.
6. **Report:** save JSON, tool trace, source references, a readable scoreboard, and `approval_status: pending`.

The loop is bounded to three tool-selection iterations. Each network request has a 60-second timeout and no SDK retries. Invalid model JSON, missing verdict coverage, incomplete responses, and stalled tool use fail visibly. Invalid citations downgrade verdicts to unknown. The checker remains a model: exact quote validation confirms reference existence, not semantic truth or exhaustive claim extraction.

## Swap the pack

Copy `packs/tonight/` and update `pack.json`, the draft, sources, and prompt text files. No event facts or task prompts are embedded in the generator/checker code. A client pack can use a brief, specification, and deliverable draft instead.

Sources have explicit IDs, files, provenance, and kinds. Generated reports used as `reviewed_output` must be explicitly approved and retain original references. Saving a run is not approval. Do not reclassify generated assertions as primary sources; human approval is not independent factual evidence. Automatic retrieval or reuse of old runs is not implemented.

Tonight's sources are user-supplied event notes, not independently verified organizer rules. The build-status source is a historical 19:14 snapshot; it must not be treated as evidence that later work succeeded. The application draft is intentionally synthetic and contains errors.

## Validate

```sh
npm run check
npm run test:bouncer
```

Tests exercise citation fabrication, incomplete coverage, unsupported versus false, rewrite restrictions, draft quote provenance, pending-output rejection, and pack swapping. A real end-to-end run is separate evidence that the model and tool loop executed.

## Tonight's boundaries

Freeze building at 20:30 JST. Submit by 20:40. The demo is three minutes starting at 20:45, with no Q&A. Only submitted and demoed projects can participate in peer voting.

Neo4j integration, opportunity scouting, automatic applications, and automatic reuse of reviewed outputs remain future work. The externally produced PV is not proof of harness execution.
