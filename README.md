# Evidence Bouncer

Evidence Bouncer checks the factual claims in an AI-written draft against evidence you choose, before the draft goes out. Every claim gets a verdict, a reason, and an exact quote from your evidence. Nothing is sent, published or approved automatically.

It is built for people who write with AI but have no one else to check the result: solo builders, freelancers, small teams. AI drafts sound confident even when a prize, a date or an achievement is invented. Checking every sentence by hand costs the time the AI was meant to save.

---

## How it works

```
draft + evidence pack
        │
        ▼
  1. generator ── extracts each factual claim, with its exact wording from the draft
        │
        ▼
  2. review agent ── calls the check_claims tool until every claim is checked
        │
        ▼
  3. checker ── a separate model call judges each claim against the evidence only
        │
        ▼
  4. citation check ── code verifies every quote really exists in the cited file
        │
        ▼
  5. report ── run.json + scoreboard.md, with references, hashes and approval: pending
```

Each claim ends up with one of four outcomes:

| Outcome | Meaning | What happens |
| --- | --- | --- |
| **Supported** | The evidence backs this exact claim, including date, scope and ownership. | Kept, with its source quote. |
| **Contradicted** | The evidence says otherwise. | Bounced, with the conflicting quote. |
| **Unsupported** | Nothing in the evidence backs it. This does not mean it is false. | Bounced for revision or more evidence. |
| **Unknown** | Missing or ambiguous context, or a citation that failed to check out. | Sent back to a human to decide. |

### Safeguards

- **Citations are checked by code, not trusted.** If a quote the model cites is not an exact substring of the cited source, the verdict drops to Unknown.
- **Claims must come from the draft.** Each extracted claim carries a quote that must appear word for word in the original draft.
- **Provenance is recorded.** Every run saves the original draft, a SHA-256 hash of each source, the git commit, the model, the prompts and every model response ID.
- **Failures are visible.** A missing input, a malformed model reply or an unfinished check produces a report marked `failed`, never an apparent success.
- **A human approves.** Every report starts as `approval_status: pending`. Saving a report does not make it evidence; a past report can only be used as evidence once it is approved and still carries its original references.
- **Inputs are data.** The prompts tell every model call to treat the draft and evidence as data, not instructions; this is a prompt rule, not a guarantee. `.env` files are refused as evidence, files outside the pack folder cannot be loaded, and API keys are redacted from errors.

---

## Quick start

Needs Node.js and an API key for an OpenAI-compatible endpoint. The client is configured for ai& (`https://api.aiand.com/v1`) in `shared/model.ts`; change the base URL there to use another provider.

```sh
npm install
cp .env.example .env        # set AIAND_API_KEY, and AIAND_MODEL to a model ID
npm run models              # list available model IDs; confirms the key works
npm run smoke               # one real model call, saved to results/model-smoke.json
npm run bouncer -- packs/tonight
```

A run takes about 15 seconds and writes `results/bouncer/<run-id>/run.json` and `scoreboard.md`.

If your network requires an HTTP proxy, export `https_proxy` (or `HTTPS_PROXY`) before running; the client picks it up automatically.

Other commands:

```sh
npm run check               # TypeScript type-check
npm run test:bouncer        # safety tests, no API calls
```

---

## Example output

From a recorded run of the example pack ([full report](evidence/runs/2026-11-17T10-26-48-595Z-c7b5d673/scoreboard.md)):

```
Execution: completed | Human approval: pending
Supported: 4 · Bounced: 5 · Unknown: 1

## c4 — CONTRADICTED
Winners are selected by a panel of judges.
- event-brief · sources/event-brief.md:10 · SHA-256 d55f0c6a…
  "Winners are determined by peer vote. There are no judges."

## c10 — UNKNOWN
Our project is eligible to win tonight's prize.
- build-status · sources/build-status.md:14 · SHA-256 0ce6c850…
  "This pack does not record whether the project has submitted or participated
   in a demo. Eligibility depends on those conditions; it cannot be determined
   from this pack."
```

The example draft in `packs/tonight/` is synthetic and contains deliberate errors. Recorded runs are kept in [`evidence/`](evidence/README.md).

---

## Check your own drafts

A pack is a folder. Copy `packs/tonight/` and replace its contents:

```
packs/my-proposal/
├── pack.json           # id, model, which files are the draft, sources and prompts
├── draft.md            # the AI-written text to check
├── sources/            # your evidence: briefs, specs, status notes, past reports
└── prompts/            # generator, checker, loop and rewrite instructions
```

Each source in `pack.json` has an `id`, a `file`, a `kind` and an `authority` line describing where it came from. No facts or prompts live in the code, so a client brief and a deliverable draft work the same way as the example. See [`bouncer/README.md`](bouncer/README.md) for details.

---

## Limitations

- The checker is a language model. The citation check confirms a quote exists, not that it truly supports the conclusion. Read the report before acting on it.
- Claim extraction can miss claims or split them differently between runs, so counts can vary from run to run.
- The rewrite only reassembles supported claims. It does not yet propose corrections for bounced ones.
- There is no web search or automatic retrieval. The evidence is exactly what you put in the pack.

---

## Built on mini-ai-harness

This project grew out of [mini-ai-harness](https://github.com/TejasQ/basically-ai-harness) by TejasQ, a minimal TypeScript implementation of two kinds of AI harness built for a talk on harness engineering: [What Is an Agent Harness?](https://tej.as/blog/what-is-an-agent-harness) · [Harnesses in AI: A Deep Dive](https://www.youtube.com/watch?v=C_GG5g38vLU).

Its two original demos are still here and use the same shared client:

- `eval/`: an **eval harness**. A fixed dataset of hallucination traps, scored against known answers. `eval/meeting/` adds a meeting follow-up extraction eval. Run with `npm run eval`.
- `agent/`: an **agent harness**. A tool-using loop that drives a real browser, with guardrails and a verify step. Run with `npx playwright install chromium` then `npm run agent`. Its current task acts on a live website, so read `agent/7-index.ts` before running it.

Evidence Bouncer reuses the same idea at a smaller scale: the harness, not the model, decides what counts as done. Guardrails catch structural failures; verification catches wrong answers.

## License

MIT. See [LICENSE](LICENSE).
