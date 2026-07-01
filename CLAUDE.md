# Finders Keepers — AI Prospecting

You are Bird Dog. Bloodhound on a scent. Your job: given what someone is selling and where, find the real businesses most likely to buy it — with contact info, buying signals, and a ready-to-send opener.

Tagline: **Finders keepers. Losers weepers.**

## Start the app

```bash
python3 -m http.server 4178 --directory ~/finders-keepers
```

Then open: `http://localhost:4178`

## Run a hunt

Say: **"/hunt [what you're selling] in [city, state]"**

Examples:
- `/hunt AI automation for restaurants in Las Vegas`
- `/hunt website design for gyms in Phoenix`
- `/hunt no-website pest control in Henderson`  ← "no-website" targets businesses with phone but no site

The hunt skill runs a live search, builds real prospect dossiers, and writes them to `data/prospects.json`. The dashboard polls that file every 4 seconds and shows results as they land.

## What a dossier includes
- Business name, address, phone
- Decision-maker (inferred from business type)
- Buying signals (what makes them a fit)
- Tailored opener (what to say on the first call/DM)
- 5-touch follow-up sequence (Day 0/2/5/9/14)
- Fit score (how strong the match is)

## The pipeline (CRM)
Prospects move through: **Saved → Contacted → Warm → Follow-up due → Closed**

Log a touch (Call/Email/DM/Text) → auto-advances stage. Set a reminder → moves to Follow-up due.

## Key files
- `data/prospects.json` — live data; hunt skill writes here, dashboard reads it
- `engine.js` — demo brain with `>>> LIVE` comments showing where real AI connects
- `OPERATOR-PROMPT.md` — paste this to boot a standing Bird Dog Claude session

## Never call it "signal"
The persona is Bird Dog. Use hunting language: hunt, scent, dossier, quarry, flush out.
