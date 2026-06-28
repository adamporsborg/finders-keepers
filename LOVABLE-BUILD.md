# Finders Keepers — Lovable Build Kit
**Goal:** rebuild Finders Keepers as a real, hosted, login-protected app on **Lovable** for $0 — using **Lovable Cloud** (database + auth) and **Lovable AI** (free Gemini) as the brain, launched at `finderskeepers.lovable.app`.

Persona = **Bird Dog** (a bloodhound sales oracle). Tagline = *"finders keepers. losers weepers."*

---

## How this works on Lovable (the architecture)

| Piece | On Lovable | Cost |
|---|---|---|
| Frontend (React) | Lovable generates it | Free |
| Login / accounts | **Lovable Cloud** auth | Free |
| Shared database (pipeline, notes, reminders, touches) | **Lovable Cloud** (Postgres) | Free |
| The brain (profile offer, score fit, write the play) | **Lovable AI** → `google/gemini-2.5-flash` | Free (Gemini incl. during Lovable AI window) |
| **Real business data** (name, phone, website, address) | Edge function → OpenStreetMap (Overpass + Nominatim), keyless | Free |
| Named people + verified emails | Edge function → Apollo API (add key later) | Paid, optional |
| Hosting / URL | `*.lovable.app` | Free |

**Why it's real:** Lovable Cloud edge functions run server-side and can `fetch()` any API. OpenStreetMap's Overpass API returns real businesses with real phone numbers and websites for any city, no API key. That's your free "spine."

---

## 🔑 Do I need an AI key? NO (by default)
Lovable AI gives you **Gemini for free** (no key) — Prompts 1–7 use it. The real business data does **not** come from the AI; it comes from the edge function's free web sourcing (OpenStreetMap + scraping in Prompt 3). So you can launch with **zero keys**.
- **Prompt 8 (Claude key) is OPTIONAL** — only add it if you want a stronger researcher that reads sites + finds named decision-makers.
- Note: Lovable's free Gemini is **metered** by your Lovable plan (great for building + early users; watch usage as you scale — your credit/subscription system covers it).

## ⚙️ Before you start (in Lovable)
1. Create a new project.
2. In project settings, **enable Lovable Cloud** (turns on database + auth + edge functions).
3. **Enable Lovable AI** (gives the free Gemini gateway + auto-injects the `LOVABLE_API_KEY` secret).
4. Build with the prompts below **in order** — paste one, let it finish, test, then the next. Do NOT paste all at once. Lovable is far more reliable in steps.
5. Use **Chat mode** (not Build) if you want to discuss a step before it writes code.

---

## PROMPT 1 — Foundation, design system, app shell

```
Build "Finders Keepers," an AI sales-prospecting web app. The AI persona is "Bird Dog," a bloodhound sales oracle. Tagline: "finders keepers. losers weepers."

Use a premium, warm, dark design system — NOT generic AI gray:
- Background #100e0b; panels #1b1712 / #211b15; borders #34291d
- Text #f4ece1 (primary), #cdbfac (secondary), #9b8a73 (muted)
- Accent amber #f7a738, bright amber #ffbe57, ember #e0552b, moss green #8fb14a
- Display font: Fraunces (serif). UI font: Inter. Generous radii (12–20px), soft shadows.

Build only the app shell for now (no backend yet):
- Left sidebar: brand "Finders Keepers" with a 🐕 mark + the tagline; a nav with three items — "☀️ Today", "🐕 Find prospects", "▦ Pipeline"; a credits widget at the bottom ("Bird Dog credits 200/200" with a progress bar); a user row with avatar, name, and a "TRIAL" pill.
- Top bar: page title + subtitle, and a right-side action area.
- Main content area that swaps between the three views.
- Default to the "Today" view with a placeholder "Good morning. Here's your day." headline.

Make it feel like a polished, confident sales tool. Mobile-responsive.
```

## PROMPT 2 — Turn on the backend: auth + database

```
Enable Lovable Cloud. Add email/password authentication that gates the whole app: unauthenticated users see a branded "Finders Keepers" login/signup screen (same dark amber design); authenticated users see the app.

Create these database tables (with row-level security so each user only sees their own rows, but allow a shared "team" view later):
- profiles: user_id, full_name, company, offer (text), location (text), website (text), credits (int, default 200)
- hunts: id, user_id, title, offer, created_at
- prospects: id, user_id, hunt_id, business_name, contact_name (nullable), title/role, industry, location, address, phone (nullable), email (nullable), email_source, website (nullable), lat, lng, fit_score (int), reason, signals (jsonb), outreach (jsonb), source (text), created_at
- pipeline: id, user_id, prospect_id, stage (enum: targets, contacted, warm, followup, won, lost; default targets), notes (jsonb, default []), reminder (date, nullable), touches (jsonb, default []), last_touch (timestamp, nullable), added_at

On signup, auto-create a profiles row with 200 credits.
```

## PROMPT 3 — The crown jewel: real-data hunt (edge function)

```
Create an edge function called "hunt" that returns REAL businesses (no fake data). It takes { offer, location, count } and does this:

1) GEOCODE the location to a bounding box using OpenStreetMap Nominatim (keyless). Send a User-Agent header "FindersKeepers/1.0".
   GET https://nominatim.openstreetmap.org/search?q={location}&format=json&limit=1
   Use the result's boundingbox = [south, north, west, east].

2) MAP the offer text to OpenStreetMap categories (case-insensitive keyword match):
   - payment/processing/merchant/pos/food truck → amenity=fast_food, amenity=restaurant, amenity=cafe
   - roof/hvac/plumb/contractor/trades → office=estate_agent, office=company, shop=doityourself
   - merch/apparel/hats/tees/print/branding → leisure=fitness_centre, amenity=place_of_worship, craft=brewery
   - coach/clinic/med spa/dental/fitness/wellness/aesthetic → amenity=clinic, shop=beauty, leisure=fitness_centre, amenity=dentist
   - ai/automation/software/saas/marketing/services (default) → office=company, office=it, office=advertising_agency, shop=*
   Pick the first matching set; otherwise the default set.

3) QUERY Overpass for real businesses with names in the bbox (keyless):
   POST https://overpass-api.de/api/interpreter  (body = "data=" + urlencoded query)
   Query (union node+way for each category, with [name]):
   [out:json][timeout:25];
   (
     node["amenity"="fast_food"]["name"](south,west,north,east);
     way["amenity"="fast_food"]["name"](south,west,north,east);
     ... (repeat for each category in the chosen set) ...
   );
   out center tags 60;
   For "way" results, use the "center" lat/lon.

4) For each business build a prospect:
   - business_name = tags.name
   - phone = tags.phone || tags["contact:phone"] || null
   - website = tags.website || tags["contact:website"] || null
   - address = join(tags["addr:housenumber"], tags["addr:street"]) || tags["addr:city"]
   - lat/lng = element center
   - email: if website present, derive domain and set email = "info@" + domain, email_source = "inferred from website"; else email = null
   - source = "OpenStreetMap"
   - Derive REAL signals from the data (these are genuine selling angles):
       * if no website → "No website on file — wide open for your offer"
       * if website but no phone → "Web presence, no public phone"
       * if phone present → "Direct line listed"
       * if tags.opening_hours → "Posted hours — active, operating business"
       * if tags.cuisine → tags.cuisine + " — " + (address or "local spot")

5) Use Lovable AI (model google/gemini-2.5-flash) ONCE per hunt to:
   - write a short ICP "brief": who the decision-maker is (the role to ASK FOR — e.g. Owner, GM, Office Manager), best niches, the buying triggers, and a one-line "angle"
   - for each prospect, score fit 60–98 and write an "outreach" object: { bestChannel, opener (personalized using the REAL business name + a real signal), dm, followups: [{day,text} x4] }
   Call the Lovable AI gateway:
   POST https://ai.gateway.lovable.dev/v1/chat/completions
   Authorization: Bearer {LOVABLE_API_KEY}   (Lovable injects this automatically)
   body: { model: "google/gemini-2.5-flash", messages: [...] }
   Ask Gemini to return strict JSON; parse it.

6) Save the prospects to the database under a new hunt for the current user, and return { brief, prospects }.

Build a "Find prospects" view: a chat-style box ("What are you selling?") with starter chips. On submit, show a live "7-layer hunt" progress animation (Reader, Profiler, Cartographer, Scout pack, Verifier, Snooper, Closer), then render the brief, then a grid of the real prospects (business name, role to ask for, location, phone/website icons, fit ring, top signal) with checkboxes and a "Save selected to pipeline" button. Charge 8 credits per hunt.
```

## PROMPT 4 — Prospect dossier (drawer)

```
Clicking a prospect opens a right-side drawer dossier:
- Header: business name, role to ask for, location, fit score ring + one-line reason.
- A stage bar (Saved targets / Contacted / Warm / Follow-up due / Closed) to move them.
- "The company" section: industry, address, website (link), Google Maps link from lat/lng.
- "How to reach" section: real phone (with copy + a "Call" action), email (verified or "inferred from website" with confidence), and if no email, a "Have Bird Dog call the front desk to get it" button. Multi-channel action buttons: Call, Email, LinkedIn DM, Instagram DM, Text, Tweet — each logs a "touch" (channel + timestamp) and advances the stage from targets→contacted.
- "Buying signals" section: the real data-derived signals.
- "The play" section: angle, opening line (copyable), DM version, and a Day 0/2/5/9 follow-up sequence.
- Notes & reminders: a textarea + "remind me in N days" dropdown. Saving a note stores it and, if a reminder is set, sets the reminder date and moves the prospect to "Follow-up due."
- Footer: "Copy opener" + "Log [best channel]".
Everything persists to the database.
```

## PROMPT 5 — Pipeline (CRM board)

```
Build the "Pipeline" view as a kanban board with columns: Saved targets, Contacted, Warm, Follow-up due, Closed. Each card shows business name, role, fit ring, touch count, reminder date (if any), and the latest note. Cards open the dossier. Add an "Export" button that opens a modal to send the pipeline to a CRM (HubSpot, Salesforce, Close, Pipedrive, Go High Level, CSV) — for now generate a CSV download of all prospects with their contacts, notes, and outreach plays. Charge 5 credits per export.
```

## PROMPT 6 — Today (daily briefing)

```
Build the "Today" view as a daily briefing: a "Good [morning/afternoon/evening], [name]. Here's your day." headline; a recap line (X in pipeline · Y follow-ups due · Z hot to call · N touches today); three quota cards (Calls / Emails / DMs, each /100, filled from today's logged touches by channel); then worklists: "Follow-ups due" (reminders due or stage=followup), "Call first — high intent" (has phone + fit ≥ 82), and "New to reach" (untouched targets). Each row has the prospect and a one-click action button for the recommended channel, plus "Open." A "Start working the list" button opens the first prospect.
```

## PROMPT 7 — Onboarding + polish

```
Add a first-run onboarding flow for new signups: step 1 "What are you selling?" (textarea + starter chips), step 2 "Where do you sell?" (location), step 3 "Your website?" (optional) — then an edge function "analyze-site" that fetches the URL and uses Lovable AI (google/gemini-2.5-flash) to return a grade + 3 conversion fixes, shown alongside the AI-generated ICP plan. Finish by running the user's first real hunt. Save offer/location/website to their profile. Add a "Reset" link and credit-spend toasts.
```

---

## Adding named people + emails later (the one paid upgrade)
When you want real *named* decision-makers and verified emails (for email/DM outreach, not just calling):
1. Get an Apollo.io API key.
2. In Lovable: add it as a secret (`APOLLO_API_KEY`).
3. Prompt: *"In the hunt edge function, after getting businesses from OpenStreetMap, enrich each one by calling the Apollo API (People Search / Organization Enrichment) using the APOLLO_API_KEY secret to find the real decision-maker's name, title, email, and LinkedIn. Prefer Apollo data when available; fall back to the OpenStreetMap business + role."*

---

## PROMPT 8 — Make the brain CLAUDE (your embedded key, server-side only)

```
Change the reasoning engine from Lovable AI to Anthropic Claude, and make the hunt a REAL research agent (not synthetic).

SECURITY: store my Anthropic key as a Lovable secret named ANTHROPIC_API_KEY. It must ONLY be used inside edge functions, NEVER sent to the browser or referenced in frontend code.

In the "hunt" edge function, call the Anthropic Messages API (model claude-sonnet, or the current default) with the built-in web_search tool enabled, so Claude actually researches:
POST https://api.anthropic.com/v1/messages
headers: x-api-key: {ANTHROPIC_API_KEY}, anthropic-version: 2023-06-01, content-type: application/json
body includes: tools: [{ "type": "web_search_20250305", "name": "web_search", "max_uses": 5 }]
Prompt Claude as "Bird Dog": given the user's offer + location, search the web for real matching businesses, read their sites to find the decision-maker (name + role), real contact info (phone/website, and email if shown), and one specific personalized outreach hook; then score fit 60–98 and write the outreach play. Return STRICT JSON matching the prospects schema. Keep each hunt BOUNDED to ~15 businesses with at most 1–2 page reads each so the function finishes within the timeout.

Keep the OpenStreetMap step as a fast fallback/seed source, but Claude's web research is the primary engine. Charge 8 credits per hunt only on success.
```

## PROMPT 9 — Subscriptions that cover the cost (Stripe + credit metering)

```
Add Stripe subscription billing with three plans: Scout $49/mo (200 credits), Hunter $149/mo (800 credits), Pack $399/mo (2,500 credits). New users get a 7-day free trial with 200 credits.

Credits are the cost cap:
- A hunt costs 8 credits, a contact-unlock 1, a CRM export 5. Deduct credits server-side in the edge function BEFORE calling Claude; refund if the call fails. Never let a user spend below 0.
- Reset each plan's credits monthly on renewal.
- Show plan + remaining credits in the sidebar; when credits run low, prompt to upgrade.
- Add a billing page to manage/cancel the subscription via the Stripe customer portal.
Store the Stripe keys as Lovable secrets (server-side only). Gate hunts/exports behind an active trial or paid subscription.
```

---

## Tips so Lovable doesn't flail
- Build the prompts **in order**, test after each. If a step breaks, tell Lovable exactly what's wrong in plain English.
- Keep the real-data edge function (Prompt 3) as its own step — it's the most important and the most likely to need a follow-up tweak.
- If Overpass is slow, tell Lovable to add `[timeout:25]` (already in the query) and cap results to ~40.
- The reference prototype that already works (UI + behavior to match) is in `~/finders-keepers/` — open `index.html` to see the exact look and flows.
```
