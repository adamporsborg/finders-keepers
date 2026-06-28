/* ============================================================
   FINDERS KEEPERS — Intelligence Engine ("Bird Dog")
   v2: prospecting oracle + AI sales manager
   ------------------------------------------------------------
   DEMO MODE generates realistic data so the whole product is
   clickable with no backend. LIVE MODE swaps in the real stack
   at the marked  >>> LIVE  seams.

   HOW WE GET DATA WITHOUT PAYING FOR A LIST  (Adam's mandate:
   "if you can't pay for the data, find another way — do
   whatever it takes"):
     1. PUBLIC RECORDS  — ingest every licensed business per
        county (business-license registries, Sec. of State,
        FDA/DOT/ABC permits, Google Places). This is the spine.
     2. WEB SCRAPING    — own scraper / BrightData to pull the
        company site, team page, socials.
     3. EMAIL INFERENCE — derive the company's email pattern
        (first@, first.last@, f.last@) from any one known
        address, score confidence, verify deliverability.
     4. RECEPTIONIST AGENT — when there's no email/direct line,
        an AI voice agent CALLS the front desk and just asks:
        "what's the best email for your sales manager?"
     5. SOCIAL ENRICHMENT — match the person across LinkedIn /
        IG / FB / X, pull photo, recent posts, coworkers, and
        life events for the persona dossier.
   ============================================================ */

const FK = {
  config: {
    mode: 'demo',
    apiBase: '/api',
    model: 'claude-opus-4-8',
    creditsPerSearch: 8,
    creditsPerUnlock: 1,
    creditsPerExport: 5,
    creditsPerReceptionistCall: 3,
  },

  dataStrategy: [
    { id: 'records', icon: '🏛', name: 'County license registries', note: 'Every licensed business, ingested per county. The spine. No paid list.' },
    { id: 'scrape',  icon: '🕸', name: 'Web + team-page scraping', note: 'Own scraper / BrightData pulls the site, people, and socials.' },
    { id: 'pattern', icon: '✉️', name: 'Email-pattern inference', note: 'Derive first@ / first.last@ from one known address, then verify it.' },
    { id: 'call',    icon: '📞', name: 'Receptionist AI call', note: 'No email on file? Bird Dog calls the front desk and asks for it.' },
    { id: 'social',  icon: '🔍', name: 'Social identity match', note: 'Photo, posts, coworkers, life events — the human, not just the record.' },
  ],

  layers: [
    { agent: 'Reader',       icon: '👁', detail: 'reading your offer + site, figuring out the real value prop' },
    { agent: 'Profiler',     icon: '🎯', detail: 'building the ideal-buyer persona (the human who says yes)' },
    { agent: 'Cartographer', icon: '🗺', detail: 'pulling matching businesses from county records + the web' },
    { agent: 'Scout pack',   icon: '🐕', detail: 'finding the RIGHT person inside each one (not just the owner)' },
    { agent: 'Verifier',     icon: '✅', detail: 'inferring email pattern + verifying dials and inboxes' },
    { agent: 'Snooper',      icon: '🔎', detail: 'socials, photo, coworkers, recent life events' },
    { agent: 'Closer',       icon: '📝', detail: 'scoring fit + writing the channel plan and script' },
  ],

  /* ============================================================
     ONBOARDING: analyze the user's own website
     ============================================================ */
  async analyzeWebsite(url) {
    // >>> LIVE: scrape url -> Claude reads it -> returns this shape
    return this._demoSiteAnalysis(url);
  },
  async profileOffer(offer, ctx = {}) {
    // >>> LIVE: Claude (company key) reads offer + site + location
    return this._demoProfile(offer, ctx);
  },
  async hunt(offer, brief, count = 24) {
    // >>> LIVE: records+scrape -> right-person -> verify -> enrich -> score
    return this._demoProspects(offer, brief, count);
  },
  async getReceptionistEmail(prospect) {
    // >>> LIVE: dispatch voice agent to call prospect.frontDesk, ask for email
    const first = prospect.name.split(' ')[0].toLowerCase();
    const dom = prospect.socials.website;
    return { email: `${first}@${dom}`, source: 'Front desk confirmed by phone' };
  },

  /* ============================================================
     DEMO BRAIN
     ============================================================ */
  _verticals: [
    {
      match: /\b(ai|a\.i\.|automation|saas|software|app|agent|gpt|llm|chatbot|machine learning)\b/i,
      label: 'AI / automation services',
      titles: ['Founder / CEO', 'VP Sales', 'Head of Revenue', 'Director of Marketing', 'Sales Manager', 'COO'],
      buyerNote: 'Target the person who owns the number — often a Sales Manager or VP, not the owner.',
      industries: ['Marketing agencies', 'Professional services', 'E-commerce brands', 'Local service businesses', 'B2B SaaS'],
      triggers: ['Hiring ops/RevOps roles', 'Posted about being "buried in manual work"', 'Recently raised or hit a growth milestone', 'Tool sprawl complaints'],
      angle: 'Lead with hours-back-per-week and a 14-day pilot. They buy time, not "AI."',
      companies: ['Brightside Marketing', 'Cedar & Co.', 'Northbeam Agency', 'Summit Digital', 'Harbor Studio', 'Vantage Group', 'Ro15 Labs', 'Maple & Main', 'Crestline Partners', 'Wildfire Media', 'Tidewater Co.', 'Granite Digital'],
      sizes: ['8–25 staff', '15–40 staff', '25–60 staff'],
    },
    {
      match: /\b(payment|processing|merchant|pos|point of sale|fintech|card|terminal)\b/i,
      label: 'payment processing / merchant services',
      titles: ['Owner', 'General Manager', 'Operator', 'Founder', 'Manager'],
      buyerNote: 'Owner-operators decide fast. Catch them in slow hours.',
      industries: ['Food trucks', 'Restaurants & cafés', 'Salons & barbershops', 'Boutique retail', 'Auto shops'],
      triggers: ['New permit/license filed', 'Recently opened', 'Cash-heavy / no online ordering', 'Complaints about current fees'],
      angle: 'Lead with "what are you paying in fees right now?" and a same-day side-by-side. Save them money, today.',
      companies: ['Smokin\' Wheels BBQ', 'Taco Libre Truck', 'Crave Mobile Kitchen', 'Bella Nails', 'Fade Co. Barbers', 'Main St. Diner', 'Rolling Bites', 'Sunrise Café', 'Iron Auto', 'The Daily Grind'],
      sizes: ['1–3 staff', 'Owner-operator', '3–8 staff'],
    },
    {
      match: /\b(roof|roofing|hvac|plumb|solar|construction|contractor|remodel|landscap|fenc)\b/i,
      label: 'home / trades services',
      titles: ['Owner', 'General Manager', 'Property Manager', 'Facilities Director', 'Operations Manager'],
      buyerNote: 'For B2B trades, the Property/Facilities Manager signs — not the building owner.',
      industries: ['Property management', 'Commercial real estate', 'HOAs', 'General contractors', 'Multi-family residential'],
      triggers: ['Storm/weather event in the metro', 'New property acquisition', 'Aging permits on file', 'Bad review of current vendor'],
      angle: 'Lead with a free inspection + photo proof of the problem. Speed and certainty win.',
      companies: ['Anchor Property Group', 'Sunbelt Realty Mgmt', 'Keystone Commercial', 'Desert Ridge HOA', 'Granite Builders', 'Riverside Facilities', 'Lone Star Properties', 'Cornerstone RE', 'Pinnacle Management', 'Ironwood Holdings'],
      sizes: ['Portfolio: 6–20 sites', 'Portfolio: 15–50 sites', '12–80 units'],
    },
    {
      match: /\b(hat|hats|tee|tees|shirt|hoodie|merch|apparel|print|pod|print[- ]on[- ]demand|brand)\b/i,
      label: 'custom merch / apparel',
      titles: ['Owner', 'Marketing Lead', 'Event Coordinator', 'Brand Manager', 'Booster / Team Director'],
      buyerNote: 'Whoever runs the events or the socials is your buyer.',
      industries: ['Sports teams & leagues', 'Churches & ministries', 'Breweries & bars', 'Nonprofits & events', 'Local boutiques'],
      triggers: ['Upcoming event/season announced', 'Just grew their following', 'Asked "where do you get merch?"', 'New location opening'],
      angle: 'Lead with a free mockup of THEIR logo on a product. Show, don\'t pitch.',
      companies: ['Iron Will CrossFit', 'Grace Community Church', 'Hopworks Brewing', 'Ridgeline Run Club', 'The Local Market', 'Vista Youth League', 'Summit Outfitters', 'Tailgate Co.', 'Frontline Fitness', 'Open Road Bikes'],
      sizes: ['100–500 members', '500–2k followers', '2k–20k followers'],
    },
    {
      match: /\b(coach|coaching|consult|course|mastermind|fitness|gym|trainer|wellness|med spa|medspa|clinic|aesthet|dental|chiro)\b/i,
      label: 'coaching / clinics / local services',
      titles: ['Owner', 'Founder', 'Practice Manager', 'Clinic Director', 'Head Coach', 'Office Manager'],
      buyerNote: 'The Office/Practice Manager controls the calendar and the budget.',
      industries: ['Med spas & aesthetics', 'Boutique fitness', 'Private practices', 'Wellness studios', 'Solo coaches'],
      triggers: ['Running paid ads already', '5-star reviews but small list', 'New treatment launched', 'Hiring front-desk/marketing'],
      angle: 'Lead with booked-appointments-per-month math. They buy outcomes they can count.',
      companies: ['Lumiere Aesthetics', 'Vital Wellness Co.', 'Pure Barre Midtown', 'Renew Med Spa', 'Peak Performance PT', 'Glow Skin Studio', 'Anchor Counseling', 'Elevate Fitness', 'Serenity Spa', 'Apex Coaching'],
      sizes: ['1–5 providers', '3–12 staff', 'Solo + VA'],
    },
  ],

  _genericVertical: {
    label: 'your offer',
    titles: ['Owner', 'Founder / CEO', 'VP Sales', 'Sales Manager', 'Director of Operations', 'General Manager'],
    buyerNote: 'Find the person who owns the revenue number, not just the founder.',
    industries: ['SMBs in growth mode', 'Regional service providers', 'Mid-market operators', 'D2C brands', 'Professional firms'],
    triggers: ['Recent hiring spree', 'New funding or location', 'Active on social about growth', 'Switched off a competitor'],
    angle: 'Lead with the single most painful problem you remove, and proof you\'ve done it before.',
    companies: ['Vantage Group', 'Cedar & Co.', 'Summit Partners', 'Harbor Studio', 'Northwind LLC', 'Crestline Co.', 'Maple & Main', 'Lighthouse Inc.', 'Brightside Co.', 'Ironwood Group'],
    sizes: ['10–50 staff', '20–100 staff', '5–25 staff'],
  },

  _firstNames: ['Marcus','Danielle','Tyler','Priya','Jordan','Selena','Brett','Aisha','Cole','Renee','Diego','Hannah','Victor','Mia','Grant','Lena','Omar','Paige','Devon','Carla','Nathan','Bianca','Shane','Tara','Luis','Holly','Reggie','Nina','Wes','Dana','Marcus','Gabriela','Trent','Yasmin','Pearl','Andre','Kaylee','Sam','Ruth','Felix'],
  _lastNames: ['Caldwell','Nguyen','Boone','Patel','Marsh','Rios','Hahn','Okafor','Briggs','Salas','Vance','Pruitt','Quinn','Delgado','Fields','Maddox','Ferris','Cho','Hollis','Reyes','Tran','Beck','Sloan','Mercer','Knox','Ayers','Dunn','Calderon','Frost','Lowe','Webb','Stone','Park','Hines','Mata','Booker','Rhodes','Vega','Chen','Pope'],

  _cityByState: {
    'NV': ['Las Vegas, NV','Henderson, NV','Reno, NV'],
    'TX': ['Austin, TX','Dallas, TX','Houston, TX','San Antonio, TX'],
    'AZ': ['Phoenix, AZ','Scottsdale, AZ','Mesa, AZ'],
    'FL': ['Tampa, FL','Miami, FL','Orlando, FL','Jacksonville, FL'],
    'CA': ['Los Angeles, CA','San Diego, CA','Sacramento, CA'],
    'CO': ['Denver, CO','Boulder, CO','Colorado Springs, CO'],
    'GA': ['Atlanta, GA','Savannah, GA','Augusta, GA'],
    'NC': ['Charlotte, NC','Raleigh, NC','Durham, NC'],
    'TN': ['Nashville, TN','Knoxville, TN','Memphis, TN'],
  },

  _pick(arr, seed) { return arr[Math.abs(Math.floor(seed)) % arr.length]; },
  _rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; },

  _classify(offer) {
    for (const v of this._verticals) if (v.match.test(offer)) return v;
    return this._genericVertical;
  },

  _territories(ctx) {
    const loc = (ctx.location || '').toUpperCase();
    for (const st in this._cityByState) if (loc.includes(st) || this._cityByState[st].some(c => loc.includes(c.split(',')[0].toUpperCase()))) return this._cityByState[st];
    if (ctx.location) return [ctx.location, ctx.location + ' (metro)', '+25 mi radius'];
    return ['Austin, TX', 'Dallas, TX', 'Phoenix, AZ', 'Atlanta, GA'];
  },

  _demoSiteAnalysis(url) {
    const fixes = [
      'No clear single call-to-action above the fold — pick ONE next step and repeat it.',
      'Add proof near the top: a logo bar, a number ("147 clients"), or a 5-star count.',
      'Your pricing is hidden — even a "starting at" anchor lifts qualified replies.',
      'Slow hero image (>1.2s) — compress it; speed is a closing-rate tax.',
      'No risk-reversal — add a guarantee or free pilot to kill the "what if it fails" objection.',
      'Contact is buried — put a booking link in the nav and the footer.',
    ];
    const strengths = [
      'Clear who-it\'s-for in the headline',
      'Real testimonials with names',
      'Mobile layout is clean',
      'Strong brand colors / trustworthy feel',
    ];
    return {
      url: url || 'your site',
      grade: this._pick(['B+', 'B', 'B-', 'A-'], (url || 'x').length),
      strengths: [this._pick(strengths, 1), this._pick(strengths, 7)].filter((x,i,a)=>a.indexOf(x)===i),
      fixes: [this._pick(fixes,2), this._pick(fixes,11), this._pick(fixes,19)].filter((x,i,a)=>a.indexOf(x)===i),
    };
  },

  _demoProfile(offer, ctx) {
    const v = this._classify(offer);
    const clean = offer.trim().replace(/\s+/g, ' ');
    return {
      vertical: v.label,
      offerSummary: clean.length > 120 ? clean.slice(0, 117) + '…' : clean,
      buyerTitles: v.titles.slice(0, 4),
      buyerNote: v.buyerNote,
      industries: v.industries,
      territories: this._territories(ctx),
      triggers: v.triggers,
      angle: v.angle,
      _v: v,
    };
  },

  _signalsFor(v, seed) {
    const pool = v.triggers.concat([
      'Liked 3 posts about scaling this week',
      'Profile says "open to vendors"',
      'Team photo posted — clearly hiring/growing',
      'Bio names the exact problem you solve',
      'Commented asking for recommendations',
      'Recently followed 2 of your competitors',
    ]);
    const out = [];
    for (let i = 0; i < this._rand(2, 3); i++) out.push(this._pick(pool, seed + i * 7));
    return [...new Set(out)];
  },

  _lifeEvent(seed) {
    return this._pick([
      'Posted vacation photos from Cabo last week 🌴',
      'Spoke at a regional conference 2 weeks ago',
      'Just celebrated a 5-year work anniversary',
      'Shared a "we\'re hiring" post 4 days ago',
      'Coached their kid\'s little-league team this weekend',
      'Was at a trade show in your category last month',
      'Reposted an article about exactly your problem space',
      'Just hit a follower milestone and thanked customers',
    ], seed);
  },

  _coworkers(v, seed) {
    const t2 = v.titles.filter((_, i) => i > 0);
    return [
      { name: `${this._pick(this._firstNames, seed*2)} ${this._pick(this._lastNames, seed*3)}`, title: this._pick(t2, seed) || 'Operations' },
      { name: `${this._pick(this._firstNames, seed*5)} ${this._pick(this._lastNames, seed*7)}`, title: this._pick(t2, seed+2) || 'Marketing' },
    ];
  },

  _channels(p, seed) {
    // not everyone has everything — that's the point of self-sourcing
    const phoneStatus = this._pick(['direct', 'direct', 'frontdesk', 'frontdesk'], seed);
    const hasEmail = this._rand(0, 10) > 2;
    return {
      phoneStatus,                              // 'direct' | 'frontdesk'
      emailStatus: hasEmail ? 'verified' : 'inferred',  // 'verified' | 'inferred'
      emailConfidence: hasEmail ? this._rand(92, 99) : this._rand(70, 88),
      linkedin: true,
      instagram: this._rand(0,10) > 3,
      facebook: this._rand(0,10) > 4,
      x: this._rand(0,10) > 5,
      sms: phoneStatus === 'direct' && this._rand(0,10) > 4,
    };
  },

  _outreach(v, p) {
    const first = p.name.split(' ')[0];
    const best = p.channels.phoneStatus === 'direct' && p.fitScore > 82 ? 'Call' : (p.channels.emailStatus === 'verified' ? 'Email' : 'DM');
    return {
      angle: v.angle,
      bestChannel: best,
      opener: `Hey ${first} — saw ${p.company} ${p._hook}. I help ${v.industries[0].toLowerCase()} ${v._win}. Worth a 10-min look?`,
      dm: `${first}! Not a pitch — genuinely impressed by ${p.company}. I help folks like you ${v._win}. Cool if I send one idea?`,
      voicemail: `Hi ${first}, it's {you} — quick one about ${p.company}. I'll text you so it's not another voicemail. Talk soon.`,
      followups: [
        { day: 'Day 0', text: `${best}: opener above. Name the exact signal Bird Dog found.` },
        { day: 'Day 2', text: 'Value follow-up: one relevant proof point. No ask.' },
        { day: 'Day 5', text: 'Soft nudge: "Should I close your file or is timing just off?"' },
        { day: 'Day 9', text: 'Break-up note + door open. Most replies land here.' },
      ],
    };
  },

  _demoProspects(offer, brief, count) {
    const v = brief._v || this._classify(offer);
    const wins = {
      'AI / automation services': 'claw back 10–15 hours a week without adding headcount',
      'payment processing / merchant services': 'cut their card-processing fees starting this week',
      'home / trades services': 'cut response time and lock in repeat contracts',
      'custom merch / apparel': 'turn their fans into walking billboards',
      'coaching / clinics / local services': 'fill the calendar with booked, qualified appointments',
    };
    v._win = wins[v.label] || 'hit their next growth number faster';
    const territories = brief.territories;

    const out = [];
    for (let i = 0; i < count; i++) {
      const seed = (offer.length * 13 + i * 97 + this._rand(0, 50));
      const first = this._pick(this._firstNames, seed);
      const last = this._pick(this._lastNames, seed * 3 + 5);
      const name = `${first} ${last}`;
      const company = this._pick(v.companies, seed + i);
      const title = this._pick(v.titles, seed * 7 + i);
      const fitScore = this._rand(64, 98);
      const handle = (first + last).toLowerCase();
      const dom = company.toLowerCase().replace(/[^a-z]/g, '').slice(0, 14) + '.com';
      const hooks = ['just posted about scaling', 'opened a new location', 'is hiring on your exact pain point', 'switched off a competitor recently', 'has great reviews but a thin pipeline', 'just filed a new license'];
      const channels = this._channels({}, seed + i);
      const p = {
        id: 'p' + Date.now().toString(36) + i + Math.floor(Math.random()*9999).toString(36),
        name, title, company,
        photo: `https://api.dicebear.com/9.x/personas/svg?seed=${encodeURIComponent(name)}&backgroundType=gradientLinear`,
        location: this._pick(territories, seed + i * 2),
        industry: this._pick(v.industries, seed * 5 + i),
        size: this._pick(v.sizes, seed + i),
        fitScore,
        reason: this._reason(v, fitScore),
        phone: channels.phoneStatus === 'direct' ? `(${this._rand(201,989)}) ${this._rand(200,899)}-${this._rand(1000,9999)}` : null,
        frontDesk: `(${this._rand(201,989)}) ${this._rand(200,899)}-${this._rand(1000,9999)}`,
        email: channels.emailStatus === 'verified' ? `${first.toLowerCase()}@${dom}` : null,
        emailPattern: `first@${dom}`,
        _hook: this._pick(hooks, seed + i),
        channels,
        socials: { linkedin: `linkedin.com/in/${handle}`, instagram: `@${handle}`, facebook: `fb.com/${handle}`, x: `@${handle}`, website: dom },
        signals: this._signalsFor(v, seed),
        lifeEvent: this._lifeEvent(seed + i),
        coworkers: this._coworkers(v, seed + i),
        unlocked: false,
      };
      p.outreach = this._outreach(v, p);
      out.push(p);
    }
    return out.sort((a, b) => b.fitScore - a.fitScore);
  },

  _reason(v, score) {
    if (score >= 88) return 'Bullseye fit — right role, right size, throwing off active buying signals right now.';
    if (score >= 78) return 'Strong fit — right person, plus a timing signal in the last 30 days.';
    if (score >= 70) return 'Solid fit — matches the persona; warm them up before the hard pitch.';
    return 'Worth a touch — fits the profile but no live signal yet.';
  },
};

window.FK = FK;
