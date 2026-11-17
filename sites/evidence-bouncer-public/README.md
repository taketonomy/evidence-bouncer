# Evidence Bouncer — public hosted demo

Self-contained Worker ESM deployment of the local demo. Build with `node build.mjs`; validate with `node verify.mjs`. No package installation is required.

`assets/` contains the web UI. `data/` contains a user-supplied evidence pack and a recorded, completed synthetic demonstration. `core.js` is a portable snapshot of the CLI's claim validation, citation validation, rewrite restrictions, and report rendering, prepared by the main repository's `scripts/prepare-site.mjs`.

The hosted live checker calls AIAND server-side using the runtime secret `AIAND_API_KEY`; no key is included in source or browser assets. It retains per-request memory during the bounded tool loop. Completed and failed reports are returned to the visitor and saved in that browser tab's session storage. Visitors can download JSON containing references, source hashes, trace, pending approval, and a Markdown scoreboard. Hosted visitor drafts are not published as shared recorded runs or added to the evidence pack.

Anonymous visitors can view the recorded demo and run short live checks against the fixed pack. Public checks are limited to 6,000-character drafts with a best-effort 20-second per-IP cooldown per Worker instance. No approval, automatic submission, Neo4j integration, or automatic evidence reuse is implemented.
