# Evidence

Committed copies of runs cited in `spec.md`, `DEMO.md` and `SUBMISSION.md`. The live output directory `results/` is gitignored.

- `model-smoke.json`: first successful model call through the proxy.
- `runs/…1a22f1fb`: first complete run (5 supported, 5 bounced).
- `runs/…ae26a291`: second run (3 supported, 5 bounced, 2 unknown; one unknown came from a failed exact-quote check).
- `runs/…c7b5d673`: recorded demo run (4 supported, 5 bounced, 1 unknown).
- `runs/…59c19555`: repeat run with the same verdict for every claim as `c7b5d673`.

All runs are model output pending human review. They show what the harness did, not that the claims are true. The draft is synthetic and Ken is a fictional persona. Checked before committing: no API key or auth header in any file.
