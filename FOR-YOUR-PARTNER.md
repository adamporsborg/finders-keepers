# Finders Keepers — Partner Quick Start

Send your partner **two things**: (1) the one-line prereqs, and (2) the bootstrap prompt below. He pastes the prompt into a fresh Claude Code session and ends up with a running tool + a real prospect list, in one shot.

---

## Step 0 — Prereqs (tell him this)
> You need **Claude Code installed and logged in**, plus **Python 3** and **git** (both standard on a Mac). Then open a terminal, run `claude`, and paste the prompt below.

(The repo must be reachable — it's public at `https://github.com/adamporsborg/finders-keepers`, **or** Adam added you as a collaborator on a private repo.)

---

## Step 1 — The prompt he pastes into Claude Code

```
Set up "Finders Keepers" (an AI prospecting tool) and get it running for me, then prove it works:

1. Clone it if it isn't already here:
   git clone https://github.com/adamporsborg/finders-keepers ~/finders-keepers
   Then work inside ~/finders-keepers.
2. Install the included one-line hunt skill so I can use it in any session:
   copy the folder .claude/skills/hunt into ~/.claude/skills/hunt
3. Start the dashboard in the background and give me the clickable link:
   python3 -m http.server 4178 --directory ~/finders-keepers
   → http://localhost:4178
4. Read data/prospects.json and tell me how many prospects are already loaded.
5. Run ONE real hunt to prove the engine works: using live web search + reading
   business websites, find real businesses for "<WHAT I SELL>" in "<MY CITY>",
   build full prospect dossiers (decision-maker, real phone/email/website, buying
   signals, and an outreach play), and APPEND them to data/prospects.json
   (dedupe by id). 100% real data only — never invent a business, phone, or email.
6. Tell me to refresh the dashboard, then show me how to run my own hunts going
   forward (just type: /hunt <offer> in <city>).
```

He replaces **`<WHAT I SELL>`** and **`<MY CITY>`** (e.g. "AI automation services" / "Phoenix, AZ").

---

## What he ends up with
- The **dashboard** running at http://localhost:4178 (Today briefing, Find prospects, Pipeline — same tool Adam uses).
- A **real prospect list** already in his pipeline from the test hunt.
- The **`/hunt`** command for one-line hunts anytime: `/hunt med spas in Henderson, NV`.
- His own operator setup: see `OPERATOR-PROMPT.md` to boot a standing Bird Dog session each day.

## If he wants to build the hosted, sellable SaaS version instead
Point him at `LOVABLE-BUILD.md` (no-key, free Gemini, hosted on Lovable) or `EMERGENT-BUILD.md` (one master prompt). Those build the multi-user product with logins + billing — different goal than the personal desk tool above.
