# Finders Keepers — Emergent Master Prompt
One comprehensive brief for Emergent (agentic full-stack builder). Paste the whole "MASTER PROMPT" block as your first message. Then use the refinement prompts if anything needs tightening.

**Before you paste:** get a free **Google Gemini API key** at aistudio.google.com (free tier, no billing) — Emergent will ask for it as `GEMINI_API_KEY`. Everything else (real business data) is keyless and free.

---

## MASTER PROMPT (paste this)

```
Build a production, multi-user web app called "Finders Keepers" — an AI sales-prospecting tool that doubles as a lightweight CRM and daily sales manager. The AI persona is "Bird Dog," a bloodhound sales oracle. Tagline: "finders keepers. losers weepers." The core idea: the user does NOT build a list — they tell Bird Dog WHAT they're selling, and the app finds WHO is buying (real businesses), how to reach them, and hands them a plan to close each one.

=== TECH & INFRASTRUCTURE ===
- Full-stack app with a real backend, a persistent database, and email/password authentication. Each user has their own account; data persists server-side and survives reload (no localStorage-only state).
- Deploy it and give me a live URL my team can log into.
- Use Google Gemini (model "gemini-2.0-flash") as the reasoning engine via the GEMINI_API_KEY secret I provide.
- Mobile-responsive.

=== DESIGN SYSTEM (premium, warm, dark — NOT generic AI gray) ===
- Background #100e0b; panels #1b1712 and #211b15; borders #34291d
- Text #f4ece1 (primary), #cdbfac (secondary), #9b8a73 (muted)
- Accents: amber #f7a738, bright amber #ffbe57, ember #e0552b, moss green #8fb14a
- Display/serif font: Fraunces. UI font: Inter. Radii 12–20px, soft shadows, subtle warm glows.
- Confident, premium "sales war room" feel.

=== APP SHELL ===
- Left sidebar: brand "Finders Keepers" (🐕 mark) + tagline; nav: "☀️ Today", "🐕 Find prospects", "▦ Pipeline"; a "Bird Dog credits" widget with balance + progress bar (start each user at 200); user row with avatar + "TRIAL" pill.
- Top bar: page title/subtitle + right-side actions.
- Main area swaps the three views. Default to Today.

=== AUTH + ONBOARDING (first run) ===
- Branded login/signup screen. On first login, a 3-step onboarding:
  1) "What are you selling?" (textarea + starter chips: AI automation for marketing agencies / Payment processing for food trucks / Commercial roofing / Custom merch for teams / Marketing software for med spas)
  2) "Where do you sell?" (location text, e.g. "Las Vegas, NV")
  3) "Your website?" (optional)
- After step 3, call Gemini to (a) if a website was given, return a letter grade + 3 concrete conversion fixes; (b) build an ICP "plan": the decision-maker ROLE to ask for, best niches, buying triggers, and a one-line angle. Show this plan, then run the user's first real hunt automatically. Save offer/location/website to their profile.

=== THE REAL-DATA HUNT (most important — must return REAL businesses, never fake) ===
Create a backend endpoint /hunt that takes { offer, location, count } and:
1) Geocode the location to a bounding box via OpenStreetMap Nominatim (keyless): GET https://nominatim.openstreetmap.org/search?q={location}&format=json&limit=1 with header User-Agent: "FindersKeepers/1.0". Use boundingbox = [south, north, west, east].
2) Map the offer to OpenStreetMap categories (case-insensitive keyword match; pick first matching set, else default):
   - payment/processing/merchant/pos/food truck → amenity=fast_food, amenity=restaurant, amenity=cafe
   - roof/hvac/plumb/contractor/trades → office=estate_agent, office=company, shop=doityourself
   - merch/apparel/hats/tees/print/branding → leisure=fitness_centre, amenity=place_of_worship, craft=brewery
   - coach/clinic/med spa/dental/fitness/wellness/aesthetic → amenity=clinic, shop=beauty, leisure=fitness_centre, amenity=dentist
   - default (ai/automation/software/saas/marketing/services/anything else) → office=company, office=it, office=advertising_agency
3) Query Overpass (keyless): POST https://overpass-api.de/api/interpreter with body "data=" + urlencoded QL. Build a union of node+way for each category, each filtered by ["name"], inside the bbox. Use "[out:json][timeout:25];" and "out center tags 60;". For way results use the "center" lat/lon.
4) Build a prospect from each business:
   - business_name = tags.name; phone = tags.phone || tags["contact:phone"] || null
   - website = tags.website || tags["contact:website"] || null
   - address = housenumber + street, else city; lat/lng from element/center
   - email: if website present, derive domain → email = "info@"+domain, email_source="inferred from website"; else null
   - source = "OpenStreetMap"
   - Real, data-derived buying signals (genuine selling angles): no website → "No website on file — wide open for your offer"; website but no phone → "Web presence, no public phone"; phone present → "Direct line listed"; opening_hours present → "Posted hours — active business"; cuisine present → "{cuisine} — {address}".
5) Call Gemini ONCE per hunt to return strict JSON: a brief { vertical, buyerRole, niches[], triggers[], angle } AND, for each prospect, { fitScore (60–98), reason, outreach: { bestChannel, opener (personalized with the REAL business name + a real signal), dm, followups:[{day,text} x4 for Day 0/2/5/9] } }.
6) Save prospects to the DB under a new "hunt" for the user. Return { brief, prospects }.

=== FIND PROSPECTS VIEW ===
- Chat-style "What are you selling?" box + starter chips. On submit: charge 8 credits, show a live "7-layer hunt" progress animation with named agents (Reader, Profiler, Cartographer, Scout pack, Verifier, Snooper, Closer), then render the brief, then a grid of the REAL prospects (business name, "ask for {role}", location, phone/website icons, a fit-score ring, top signal) with checkboxes, "select high-fit (85+)", and "Save selected to pipeline."

=== PROSPECT DOSSIER (drawer) ===
Clicking a prospect opens a right drawer: header (name, role to ask for, location, fit ring + reason); a stage bar (Saved targets / Contacted / Warm / Follow-up due / Closed); "The company" (industry, address, website link, Google Maps link from lat/lng); "How to reach" (real phone with Call + copy; email verified-or-inferred with confidence; if no email, a "Have Bird Dog call the front desk" button; multi-channel action buttons Call / Email / LinkedIn DM / Instagram DM / Text / Tweet — each logs a touch {channel, timestamp} and advances stage targets→contacted); "Buying signals" (the real ones); "The play" (angle, copyable opener, DM version, Day 0/2/5/9 sequence); "Notes & reminders" (textarea + "remind in N days" — saving with a reminder sets the date and moves the prospect to Follow-up due). Everything persists.

=== PIPELINE VIEW (CRM board) ===
Kanban columns: Saved targets, Contacted, Warm, Follow-up due, Closed. Cards show business name, role, fit ring, touch count, reminder date, latest note; cards open the dossier. An "Export" button (charge 5 credits) downloads a CSV of all prospects with contacts, notes, and outreach plays (and offer HubSpot/Salesforce/Close/Pipedrive/GHL as labeled options).

=== TODAY VIEW (daily briefing — the sales manager) ===
"Good [morning/afternoon/evening], [name]. Here's your day." + recap (X in pipeline · Y follow-ups due · Z hot to call · N touches today). Three quota cards (Calls / Emails / DMs, each /100, filled from today's logged touches). Worklists: "Follow-ups due" (reminder due or stage=followup), "Call first — high intent" (has phone + fit ≥ 82), "New to reach" (untouched targets) — each row has the prospect + a one-click action for the recommended channel + "Open." A "Start working the list" button opens the first prospect.

=== DATA MODEL ===
profiles(user_id, full_name, company, offer, location, website, credits=200);
hunts(id, user_id, title, offer, created_at);
prospects(id, user_id, hunt_id, business_name, contact_name?, role, industry, location, address, phone?, email?, email_source, website?, lat, lng, fit_score, reason, signals[], outreach{}, source, created_at);
pipeline(id, user_id, prospect_id, stage[targets|contacted|warm|followup|won|lost]=targets, notes[], reminder?, touches[], last_touch?, added_at).

=== ACCEPTANCE CRITERIA ===
- I can sign up, get onboarded, and run a search for "payment processing for food trucks" in "Las Vegas, NV" and get back REAL Las Vegas food/restaurant businesses with REAL phone numbers (from OpenStreetMap), scored and with an outreach plan from Gemini.
- I can save prospects to a pipeline, log touches across channels, leave notes that create reminders, and see them on the Today briefing the next day.
- Data persists server-side and is tied to my account. Give me the deployed URL.
```

---

## After the first build — refinement prompts (use as needed)
- "The hunt returned few results — widen the Overpass bbox slightly and add `amenity=restaurant` and `amenity=cafe` to the food/payment category, capped at 40 results."
- "Make the 7-layer hunt animation feel live: reveal each agent one at a time over ~5 seconds with a spinner, then a green check."
- "Add a 'Reset demo' link and credit-spend toast notifications."
- "Add team mode: let me invite teammates by email so we share one pipeline."

## The one paid upgrade (later, optional)
"Add real named decision-makers + verified emails: after pulling businesses from OpenStreetMap, enrich each via the Apollo.io API using an APOLLO_API_KEY secret (People Search / Org Enrichment) to get the real contact's name, title, email, and LinkedIn; prefer Apollo data, fall back to the business + role."

## Notes
- Real businesses + phones + websites = free (OpenStreetMap). Named people + verified emails = the only paid piece (Apollo), and it's optional/later.
- Visual + behavior reference: the working prototype in `~/finders-keepers/` (open `index.html`).
```
