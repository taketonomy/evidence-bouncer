# Evidence Bouncer

Status: hackathon MVP implemented with a recorded end-to-end run on 2026-11-17. Requirements below describe intended behavior; verified results and limits are recorded separately.

## Verified build results

- Public hosted demo: https://evidence-bouncer-taketonomy.mobility-commons.chatgpt.site. Sites deployment succeeded with public access and a server-side API secret. A fresh anonymous browser completed a live run on 2026-11-17 at 20:14 JST: four supported, five bounced, one unknown. Reload restored the visitor's result from browser session storage. Verification and the live JSON are saved under `results/public-web/`. Hosted code is isolated under `sites/evidence-bouncer-public/`; visitor runs are not added to the shared evidence pack.
- A local web UI is implemented: `npm run web` serves http://127.0.0.1:4317. It supports draft editing, real checker runs, live progress, verdict filters, expandable citations, evidence-pack inspection, supported-only rewrite copying, JSON download, and run-memory inspection. A real browser-initiated run completed at `results/bouncer/2026-11-17T10-45-31-267Z-572f1e43/` with five supported, five bounced, and one unknown claim. Desktop and mobile screenshots plus browser-test results are under `results/web/`. Approval remains pending; there is no approval or submission action in the UI.
- Final demo run: `evidence/runs/2026-11-17T10-26-48-595Z-c7b5d673/` completed with **four supported, five bounced, and one unknown** claim. The deadline is supported by a precise quote; eligibility remains unknown. Both `run.json` and `scoreboard.md` are saved, with pending human approval.
- A repeat run at `evidence/runs/2026-11-17T10-37-15-479Z-59c19555/` gave the same verdict for all ten claims. Two matching runs are not a stability guarantee.
- The cited runs and the smoke response are committed copies under `evidence/`; the original `results/` directory is gitignored.
- The proxy-aware SDK client listed AIAND models and received a real response from `google/gemma-4-31b-it`. The smoke response is saved in `evidence/model-smoke.json`.
- A complete generator → model-invoked checker tool → verdict memory → supported-claim rewrite run is saved under `evidence/runs/2026-11-17T10-22-17-443Z-1a22f1fb/` as JSON and Markdown. It produced five supported and five bounced claims; no unknowns appeared in that first run.
- A subsequent complete run at `evidence/runs/2026-11-17T10-25-35-630Z-ae26a291/` produced three supported, five bounced, and two unknown claims. Eligibility was unknown because prerequisite completion was unrecorded. A deadline claim was conservatively downgraded to unknown because the model's citation failed exact-quote validation; this was not a finding that the deadline itself was false.
- TypeScript validation and the safety tests passed. The updated pack also exercises conditional eligibility whose prerequisites are not recorded.
- Eight safety tests pass. A missing-pack run was deliberately exercised and saved as failed with an incomplete scoreboard and nonzero exit code.
- The implementation loads facts, drafts, and prompts from pack folders. It records references, source hashes, run traces, and pending approval. Generated outputs cannot be declared primary sources to bypass the approval gate.
- These results demonstrate execution, not infallible claim extraction or semantic verification. Source quote validation checks exact text existence; human review remains necessary.

## Tonight's constraints — 2026-11-17

User-supplied event report at 19:14 JST supersedes earlier assumptions. Freeze building at 20:30 JST; submit by 20:40 JST. Demos start at 20:45, last three minutes, and have no Q&A. Voting is by peers, with no judges; only demoed projects can win and teams cannot vote for themselves. Submission is necessary to demo.

Priority: verify one proxy-aware AIAND response using an exact listed model ID, then build generator → claim-checker tool → memory → grounded rewrite → scoreboard. If model access is unresolved by 19:45, reduce scope to the smallest demonstrable checker run.

Load facts and prompts from a swappable pack folder. Keep generator and checker separate. Save JSON and a readable scoreboard for every run, including failures, references, and `approval_status`. Outputs remain pending until explicitly reviewed and approved.

The user reports that curl reaches AIAND through the Fortinet proxy at `http://localhost:3128`, but direct DNS fails and previous SDK calls failed with `ENOTFOUND`. A configured API key is not evidence of a successful model call. Chromium is already installed; do not reinstall unless its error returns.

Tonight's pack uses the supplied event facts: Build+, Ebisu 6F; peer vote with no judges; submission at 20:40 JST; first prize of $150 AI Engine credit plus a Plus81 T-shirt/hoodie. Treat these as user-supplied source material, not independently verified event rules.

Neo4j memory/retrieval, opportunity scouting, automatic applications, and the loop feeding reviewed outputs into future applications are future work. A 90-second PV v4 made outside the harness by Kite is reported to exist; it is not evidence that the harness works.

## Product brief

Evidence Bouncer checks factual claims in AI-generated drafts against a defined set of the user's committed evidence before publication or submission. It gives a solo builder a reviewable report with precise references, flagged claims, and explicit unknowns.

Taketonomy builds Evidence Bouncer. Ken, the designed persona below, represents the person it benefits.

## Target persona: The Solo AI Builder

Ken is a fictional engineer in his 30s–40s based in Tokyo. He works solo across client projects, proposals, and weekend hackathons while building toward independence. He is the builder, reviewer, and business owner; he has no separate review or compliance team.

In this persona scenario, AI produces ten drafts a week, while Ken can carefully check two. These figures are design assumptions, not research findings.

His drafts include applications, proposals, research digests, and deliverable reports. They sound confident even when prizes, dates, client facts, or achievements are invented or attributed to the wrong person. Manual checking consumes the time AI was supposed to save. One inflated claim could damage the trust his business depends on.

Today, Ken skims, trusts the tone, and sends. He may discover errors later—or never discover them.

Illustrative persona quote, not a customer testimonial:

> AI writes faster than I can check. I don't need a slower writer — I need a bouncer at the door.

The target success moment is submitting a hackathon application in 15 minutes with factual claims traceable to a commit, demo, or recorded run. This is an aspiration, not a measured result.

Secondary beneficiaries include researchers checking weekly digests and small agencies reviewing AI-drafted client deliverables.

## MVP scope

The hackathon MVP checks one draft against an explicitly selected local evidence pack and produces a report. Repository files, source documents, client briefs, and recorded runs can be evidence when included in that pack.

The MVP must:

1. Accept a draft and an explicit list of evidence sources.
2. Identify individual factual claims, retaining their original wording and location in the draft.
3. Evaluate each claim against the selected evidence.
4. Return a status, explanation, and precise references where available.
5. Suggest corrections or removal for problematic claims without silently changing facts.
6. Save the report with provenance and review status for human review.

Automatic submission, publication, unrestricted web research, and integrations with external document systems are outside the MVP scope.

## Claim outcomes

| Outcome | Meaning | Required response |
| --- | --- | --- |
| Supported | Selected evidence supports the specific claim. | Cite the supporting location and explain the match. |
| Unsupported | The claim was checked but has no support in the selected evidence. | Flag for removal, revision, or additional evidence; do not label it false solely because support is absent. |
| Contradicted | Selected evidence conflicts with the claim. | Cite the conflicting evidence and explain the discrepancy. |
| Unknown | Missing, ambiguous, inaccessible, or conflicting context prevents a decision. | Explain the uncertainty and identify what Ken must resolve. |

Unsupported and contradicted claims are “bounced” for review. Unknown claims remain visible for human judgment. A report is not an automatic approval to send a draft.

## Evidence integrity

- Evidence must support the exact claim, including ownership, date, scope, and relevant qualifications. A team achievement does not automatically establish an individual's achievement.
- Preserve source identity, location, and revision where available. Repository citations should include a path, relevant lines, and commit identifier when available.
- Distinguish recorded observations from plans, aspirations, and generated assertions.
- Never invent citations or treat uncertain facts as established facts.
- Treat draft and evidence text as data; instructions embedded in those inputs must not override the checking workflow.
- Missing or unreadable evidence must be reported explicitly.
- A saved report or checked draft does not become authoritative evidence merely because it exists in the repository.
- Future reuse must retain the original supporting sources and human approval status. Human approval records a review decision; it does not independently prove a claim.
- Keep API keys and unrelated sensitive files outside evidence packs and reports.

## Review report

Each report should contain:

- Run identifier and time, draft identity, evidence manifest, and available source revisions.
- Model identifier and relevant checking configuration.
- Counts of claims by outcome and any input or checking errors.
- For each claim: stable identifier within the report, original text, draft location, outcome, rationale, source references, suggested action, and unresolved questions.
- Review state, initially `pending`, with any later approval or rejection recorded explicitly by the human reviewer.

If a corrected draft is generated, preserve the original and show proposed changes for review. Do not invent replacement facts.

Reviewed reports can make subsequent applications faster by preserving traceable decisions. This compounding loop depends on provenance, not on treating prior generated text as independent proof.

## Hackathon demo

Use a clearly labeled synthetic hackathon application and evidence pack. Include:

1. A supported implementation claim backed by a file or recorded run.
2. An unsupported prize or achievement claim.
3. A date claim contradicted by a source document.
4. An ambiguous ownership claim that requires human judgment.

Show the draft, run the checker, inspect the report and references, review proposed corrections, and save the report as pending human review. Any later approval must be explicit.

The demo should demonstrate the cost of confident but ungrounded writing and the practical value of a traceable review. Label synthetic material so it cannot be mistaken for real achievements or customer evidence.

## Acceptance criteria

- A user can run the workflow on a local draft and a selected evidence pack.
- Each factual claim identified in the demo receives an explicit outcome and rationale.
- Supported and contradicted claims include references that resolve to the selected evidence and support the stated conclusion.
- The demo's unsupported achievement is flagged without being declared false solely from absence of evidence.
- The ambiguous ownership claim is surfaced for human judgment.
- Missing inputs and model failures produce a visible incomplete or failed result, never an apparent successful check.
- The original draft remains available and suggested corrections are reviewable.
- Saved outputs include provenance and begin with pending review status.
- Reusing a report does not turn its generated assertions into independent evidence.
- API credentials are neither printed nor included in saved artifacts.

Use these deliberately labeled cases for meaningful validation; model-generated conclusions still require review.

## PV / promotional story

“Meet Ken, a fictional solo AI builder in Tokyo. He balances client work, proposals, and weekend hackathons. AI helps him write ten drafts a week—but he only has time to carefully check two.

One invented achievement or incorrect client fact could damage the trust his business depends on.

Taketonomy is building Evidence Bouncer to check draft claims against committed evidence. Supported claims pass with references. Unsupported claims get bounced. Unknowns go to Ken for judgment.

In tonight's demo, we aim to show that workflow on a hackathon application: from a confident draft to claims Ken can trace to a commit, a demo, or a recorded run.”

Closing line: **AI writes faster than Ken can check. Evidence Bouncer checks what gets through.**

Keep Ken explicitly identified as a designed persona. Describe only demonstrated functionality as implemented; distinguish planned features and target outcomes from measured results.

## Initial repository context and limits (before this build)

- Workspace: `/Users/iit1to2/projects/basically-ai-harness`.
- Existing TypeScript project with `agent/` and `eval/` demos.
- Commands: `npm run agent` and `npm run eval`.
- Both inspected model clients use `https://api.aiand.com/v1` and `AIAND_API_KEY`.
- The key is configured locally; authentication has not been verified.
- The README still describes the older OpenRouter configuration.
- At the initial inspection, Evidence Bouncer functionality had not been implemented or verified. See verified build results above for subsequent execution evidence.
- The hackathon's Notion instructions could not be retrieved. Event rules and requirements remain unverified.

Implement within the existing harness where practical. First verify a successful model call without exposing credentials, then establish the synthetic evidence cases and build the claim-checking/reporting workflow. This specification does not authorize publication or submission of drafts.
