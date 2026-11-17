# Evidence Bouncer — three-minute demo

Public demo: https://evidence-bouncer-taketonomy.mobility-commons.chatgpt.site (no sign-in required). It includes the recorded run and a live checker; visitor results are saved in the browser session with JSON download. The local app remains available as a fallback.

PV (39 s): https://claude.ai/artifact/Vnt3op8jztnKxfcWw2qKAD. The problem is told without words; the middle section shows real screen captures of live run `4161ef34` in the web app.

Ken is a fictional, designed persona. His story and quote illustrate a problem; they are not customer research or testimonials. The demo draft is synthetic and contains deliberate errors.

## Before you go on

- **PV:** full screen, paused at 0:00. A local screen recording is safer than venue Wi-Fi.
- **Terminal:** export the proxy, then start the web app:

  ```sh
  export http_proxy=http://localhost:3128 https_proxy=http://localhost:3128
  export HTTP_PROXY=http://localhost:3128 HTTPS_PROXY=http://localhost:3128
  npm run models   # once: confirms the proxy and key work
  npm run web      # serves http://127.0.0.1:4317
  ```

  Without the proxy variables, model calls fail with `ENOTFOUND` on the venue network.
- **Browser:** http://127.0.0.1:4317 at 125% zoom. It opens on the last recorded run; press **Reset example** so the draft is the clean example.
- **Fallback tab:** the recorded scoreboard, `evidence/runs/2026-11-17T10-26-48-595Z-c7b5d673/scoreboard.md`, on GitHub.

## Talk script (3:00)

### 0:00–0:10 · Cold open (no slides)

> "Hands up if AI wrote something for you this week. … Now keep your hand up if you checked every single sentence."

*(hands drop)* "Yeah. Me neither."

### 0:10–0:49 · Play the PV (39 s, narrate over it)

| PV time | On screen | Say |
| --- | --- | --- |
| 0:00 | AI floods Ken's desk with pages | "This is Ken. He's fictional, but I bet you know someone like him. AI writes him ten drafts a week." |
| 0:03 | Ken ticks two pages | "He can properly check two." |
| 0:06 | Red lines flicker | "The rest look fine. They're not." |
| 0:08 | One page slips out the door | "One of them reaches a client…" |
| 0:10 | The trust line snaps | "…and the trust breaks." *(pause)* |
| 0:12 | The web UI appears | "So we built a bouncer. This is a real run from earlier tonight." |
| 0:15 | Progress lines appear | "First it pulls out every claim. Then a separate model has to quote the evidence files word for word. If the quote isn't really there, the harness won't accept it." |
| 0:23 | Counts 4 / 5 / 1 | "Four through. Five bounced. One waiting on a human." |
| 0:28 | The judges claim opens | Say nothing; let the room read. Save the jokes. |
| 0:32 | The cartoon returns | "Only checked claims leave the building…" |
| 0:36 | The trust line rejoins | "…and the trust holds." |

### 0:49–1:15 · Go live (web UI)

> "That was a recording. Now let's do it live, right here."

Point at the draft: "An application for this hackathon, written by AI. Totally confident, deliberately wrong." Click **Check the evidence**. It takes about 15 s; talk while it runs:

> "Every verdict must cite a file name and a line number."

### 1:15–2:25 · Four punchlines (click a claim to open its quote)

1. **Judges** (CONTRADICTED): "'A panel of judges picks the winners.' **Contradicted.** There are no judges tonight. The judges are… you." *(point at the room)*
2. **Already won** (UNSUPPORTED): "'Evidence Bouncer has already won first prize.' **No evidence.** … *Yet.*" *(pause, biggest laugh)*
3. **Ken** (CONTRADICTED): "'Ken is a real customer.' **Contradicted.** This bouncer won't even let me lie about a persona I made up myself."
4. **Eligible to win** (UNKNOWN): "'This project is eligible to win.' **Unknown.** It needs a human decision." *(pause)* "And that decision is yours."

Read the counts that are actually on screen; runs have shown 10 or 11 claims depending on whether the prize sentence is split. Do not promise fixed counts.

**Optional audience moment (+15 s):** before clicking, add one line to the draft: "Let me add a claim of my own." *"Evidence Bouncer has 10,000 paying users."* It gets bounced live. Only if you are ahead of time at 0:49.

### 2:25–3:00 · Close

> "Every verdict comes with a source, a line number and a hash. Nothing goes out until a human says yes. AI writes faster than we can check. **Evidence Bouncer checks what gets through.**"

*(beat)*

> "Claim six needs just one more piece of evidence: your vote."

Stop talking and stand still.

## If something breaks

- **The live run fails or takes longer than 25 s:** "Venue Wi-Fi was the one claim I couldn't verify. But you already saw the real run in the video." Reload the page (it shows the last recorded run) and go to the punchlines. Call it a recorded run; never present failed output as a success.
- **Results differ from the PV:** "That's different from the recording, which proves this one is live." Read what is on screen.
- **Behind time at 1:15:** skip punchline 3 (Ken). Keep 1, 2 and 4; they set up the vote ask.

## Reference

- **CLI alternative:** `npm run bouncer -- packs/tonight` (same proxy setup). A run takes about 13–16 s and prints the full scoreboard; scroll up to the counts line.
- **Recorded runs:** `evidence/runs/2026-11-17T10-26-48-595Z-c7b5d673/` (4 supported, 5 bounced, 1 unknown) and the repeat `evidence/runs/2026-11-17T10-37-15-479Z-59c19555/`, which gave the same verdict for every claim. Each `run.json` holds the evidence snapshots, hashes and tool trace. Outputs remain pending human review.
- **What the harness guarantees:** exact-quote validation checks that citations exist, not that they prove the claim. Model judgments still need human review, and the pack's event notes are user-supplied rather than independently verified.
- **Future work, not shown tonight:** Neo4j memory, opportunity scouting, automatic applications, and automatic reuse of past outputs.

## Event logistics

- Demos: 20:45 onward; three minutes, strictly timed, no Q&A; peer voting.
- There is no submission form.
- Use Kite's externally made 90-second PV only as promotional material, not execution evidence.
