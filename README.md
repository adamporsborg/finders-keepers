<div align="center">

# 🐕 Finders Keepers

### *Finders keepers. Losers weepers.*

**The AI prospecting oracle. Don't build a list — tell it what you're selling, and it finds who's buying.**

Built by [Adam Porsborg](https://liftedspace.com) · [Unser Media](https://unser.media)

</div>

---

## What it is

Finders Keepers is an **AI-native sales prospecting tool + lightweight CRM + daily sales manager** in one. The pitch is the inversion that makes it different:

> You don't pick a list. You tell **Bird Dog** (the AI) *what you sell* — and it figures out **who's buying**, finds the **right person**, pulls their **real contact info**, reads the room, and hands you a **plan to close each one.**

It's powered by an AI research agent that does the work a great SDR would: web search → read their site → find the decision-maker → spot a buying signal → write the outreach. Real businesses, real phone numbers, real hooks — not a stale purchased list.

## What makes it different

- **Sell-first, not list-first.** Start from your offer, not a filter form.
- **A real researcher, not a database.** The engine *finds* data live (web + scraping), so it's current and specific.
- **The whole funnel in one place.** Discover → save to pipeline → multi-channel outreach (call / email / DM / text) → notes → auto-reminders → daily briefing.
- **A sales manager that runs your day.** Open it each morning: who to call, who to follow up, quotas, the script — no decision fatigue.
- **Bird Dog has personality.** It's an oracle with a nose, not a dashboard with a search box.

## How it works

```
You: "I sell AI services" + "Las Vegas"
        │
        ▼
  🐕 Bird Dog (AI research agent)
   ├─ profiles the ideal buyer (the role who signs)
   ├─ finds real matching businesses (web + open data)
   ├─ reads their sites for the decision-maker + a real hook
   ├─ scores fit + writes the outreach play
        │
        ▼
  Your dashboard: ranked prospects → pipeline → daily call list
```

The reasoning brain is an LLM (Claude or Gemini). The **finding** is real research — live web search, site reads, and open business data — which is where the actual value is.

## Run it

**Dashboard (the app):**
```bash
python3 -m http.server 4178 --directory .
# open http://localhost:4178
```

**Trigger a real hunt (with Claude Code):**
```
/hunt med spas in Henderson, NV
/hunt commercial roofing in Dallas, TX
/hunt payment processing for food trucks in Las Vegas
```
The `/hunt` skill researches real businesses and drops them straight into the dashboard. See [`.claude/skills/hunt/SKILL.md`](.claude/skills/hunt/SKILL.md).

**Run it as your live engine:** see [`OPERATOR-PROMPT.md`](OPERATOR-PROMPT.md) — one paste boots the dashboard and turns a Claude session into your standing prospecting desk.

## Three ways to deploy

| Path | Brain | Real data from | Cost |
|---|---|---|---|
| **Claude Code (now)** | Your Claude session | Claude live web research | Your subscription |
| **Lovable + Gemini** | Lovable's built-in Gemini | OpenStreetMap + scraping | Free (metered) |
| **Lovable/own backend + Claude** | Your Anthropic key | Claude web_search | API usage |

Full build kits in [`LOVABLE-BUILD.md`](LOVABLE-BUILD.md) and [`EMERGENT-BUILD.md`](EMERGENT-BUILD.md).

## Tech

Zero-dependency front end (HTML / CSS / vanilla JS) so it runs anywhere. Pluggable engine layer (`engine.js`) with a demo mode and clean seams for a live AI research backend. Data persists per user; designed to graduate to Postgres + auth + Stripe for a hosted, multi-tenant product.

## About

Finders Keepers is a product of **[Unser Media](https://unser.media)** — building AI-native tools that do real work. Created by **Adam Porsborg**, who designs and ships AI systems end-to-end with Claude.

> *"You miss 100% of the buyers you never sniff out."*

---

<div align="center"><sub>© Unser Media. Bird Dog is a very good boy.</sub></div>
