# Evidence Bouncer — three-minute demo

Ken is a fictional, designed persona. His story and quote illustrate a problem; they are not customer research or testimonials.

## 0:00–0:25 — The problem

Optional: play the first 12 seconds of the wordless PV (the flood and the leak) behind this narration. The full 41-second PV ends on the same idea as the close.

“I'm building Evidence Bouncer for solo AI builders like Ken, our fictional persona. AI writes his applications and client drafts faster than he can check them. One invented achievement can cost him trust. He needs a checker at the door.”

## 0:25–0:50 — Show the draft and knowledge pack

Open `packs/tonight/draft.md` and `packs/tonight/sources/event-brief.md`.

“This is a synthetic application with deliberate errors. The pack contains tonight's user-supplied event notes, project status, and prompts. The draft claims judges choose the winners, that we've already won, and that Ken is a real customer. The pack says otherwise—or provides no evidence.”

## 0:50–1:45 — Run and show the harness

Prepare this terminal before the demo. Without the proxy variables, model calls fail with `ENOTFOUND` on the venue network:

```sh
export http_proxy=http://localhost:3128 https_proxy=http://localhost:3128
export HTTP_PROXY=http://localhost:3128 HTTPS_PROXY=http://localhost:3128
npm run models   # once, before going on stage: confirms the proxy and key work
```

On stage:

```sh
npm run bouncer -- packs/tonight
```

A completed run takes about 14–16 seconds.

“The generator extracts claims. The agent calls a separate checker tool against this pack. The harness stores verdicts and references in run memory, then lets the model select supported claims for a rewrite. The renderer refuses to include bounced or unknown claim IDs.”

Show the actual scoreboard. Read its real counts; do not promise fixed counts because claim splitting and verdicts can vary. Show one supported claim's source quote, the contradicted judge claim, the unsupported win, and the unknown eligibility claim if the current run labels it unknown.

If the network is slow, switch to an already completed saved run and explicitly call it a recorded run. Do not simulate a live response or present failed output as successful.

Recorded demo run: `evidence/runs/2026-11-17T10-26-48-595Z-c7b5d673/scoreboard.md` (committed copy; `results/` is gitignored). This run completed with four supported, five bounced, and one unknown claim. Its adjacent `run.json` contains the evidence snapshots and tool trace. A repeat run, `evidence/runs/2026-11-17T10-37-15-479Z-59c19555/`, gave the same verdict for every claim. Outputs remain pending human review.

## 1:45–2:25 — Show the result and safeguards

Open the run's `scoreboard.md` and `run.json`.

“The rewrite keeps only supported claim sentences. Every saved run includes original sources, content hashes, references, tool events, and `approval_status: pending`. Saving a draft doesn't make it evidence. Reviewed outputs need approval and original references before a pack can accept them.”

“Exact quote validation checks that citations exist. Model judgments still need human review, and the pack's event notes are user-supplied rather than independently verified.”

## 2:25–3:00 — Reuse and close

“Swap the folder and the same core can check another hackathon application or a client deliverable against its brief. Neo4j, opportunity scouting, automatic applications, and automatic reuse of past outputs are future work. Tonight we're demonstrating the pack-based checker loop and its saved evidence.”

Close: “AI writes faster than we can check. Evidence Bouncer checks what gets through.”

## Submission preparation

- Build freeze: 20:30 JST on 2026-11-17.
- Submission deadline: 20:40 JST. No submission means no demo.
- Demos: 20:45 onward; three minutes, no Q&A; peer voting.
- Confirm the submission form and required fields with the organizer. Its URL has not been provided here.
- Verify repository visibility and artifact access before linking them. No repository publication or submission has been performed by this build.
- Use the existing externally created 90-second PV only if useful; label it as promotional material, not execution evidence.
- A 41-second wordless PV of the recorded run exists as a private Claude artifact. Its claim order, outcomes and cited line numbers follow run `c7b5d673`. Share it before linking it, and say aloud that Ken is fictional and the draft is synthetic, since the PV has no on-screen text.
