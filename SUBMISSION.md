# Evidence Bouncer

Builder: Taketonomy

## Short description

Evidence Bouncer checks factual claims in AI-generated drafts against a swappable evidence pack. It flags unsupported or contradicted claims, surfaces unknowns for human judgment, and produces a rewrite assembled from supported claims with traceable references.

## Problem and intended user

Solo builders use AI to draft applications, proposals, and deliverables, but reviewing every confident assertion takes time. An invented achievement or incorrect client fact can damage trust. Ken, our explicitly fictional designed persona, illustrates this problem; he is not a real user or testimonial.

## What the MVP demonstrates

- Pack-based knowledge: draft, source documents, and prompts loaded from a folder.
- Separate generator and checker modules using AIAND's OpenAI-compatible API.
- A model-invoked claim-checking tool and bounded loop.
- Per-run memory of supported, unsupported, contradicted, and unknown verdicts.
- A grounded rewrite selected by the model and restricted by code to supported claim IDs.
- Saved JSON trace and readable scoreboard with references, source hashes, and pending human approval.

The synthetic demo application contains intentionally incorrect claims about tonight's judging, a prize win, Neo4j integration, and a fictional persona presented as a customer. The checker compares these against user-supplied event and project notes. These notes are not independently verified organizer documentation.

## Limitations and future work

Model judgments are fallible; citation existence is checked, but semantic correctness and exhaustive extraction still need human review. No drafts are automatically published or submitted. Automatic retrieval and reuse of previous reports, Neo4j integration, opportunity scouting, and automatic applications are not implemented. The externally made PV is promotional material, separate from harness execution.

## Links

- Public working demo (no sign-in required): https://evidence-bouncer-taketonomy.mobility-commons.chatgpt.site
- Hosted verification: an anonymous browser completed a real check at 20:14 JST on 2026-11-17 (four supported, five bounced, one unknown; approval pending). Local artifacts: `results/public-web/`.
- Repository: https://github.com/taketonomy/evidence-bouncer
- Recorded run (4 supported, 5 bounced, 1 unknown; pending human review): https://github.com/taketonomy/evidence-bouncer/blob/main/evidence/runs/2026-11-17T10-26-48-595Z-c7b5d673/scoreboard.md
- Demo script: https://github.com/taketonomy/evidence-bouncer/blob/main/DEMO.md
- PV video: add the actual v4 video link if required. The wordless PV is a private artifact; share it before linking.

These are preparation notes, not a completed submission. The organizer's form and required fields have not been supplied.
