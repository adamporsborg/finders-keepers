/* ============================================================
   FINDERS KEEPERS — app.js  v2 (AI sales manager)
   ============================================================ */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const todayKey = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d) => { const s = String(d); const dt = /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(s + 'T00:00:00') : new Date(d); return dt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }); };

const STAGES = [
  { id: 'targets',  name: 'Saved targets', emoji: '🎯', hint: 'Not contacted yet' },
  { id: 'contacted', name: 'Contacted',    emoji: '📨', hint: 'Reached out' },
  { id: 'warm',     name: 'Warm',          emoji: '🔥', hint: 'Replied / interested' },
  { id: 'followup', name: 'Follow-up due', emoji: '⏰', hint: 'You owe them a touch' },
  { id: 'won',      name: 'Closed',        emoji: '🏆', hint: 'Won' },
];

const STARTERS = [
  { e: '🤖', t: 'AI automation for marketing agencies' },
  { e: '💳', t: 'Payment processing for food trucks' },
  { e: '🏠', t: 'Commercial roofing & exterior repair' },
  { e: '🧢', t: 'Custom hats, tees & merch for teams' },
  { e: '💉', t: 'Marketing software for med spas' },
];

const CRMS = [
  { e: '🟠', n: 'HubSpot', d: 'Contacts + deals' }, { e: '🔵', n: 'Salesforce', d: 'Leads' },
  { e: '🟢', n: 'Close', d: 'Leads + tasks' }, { e: '🟣', n: 'Pipedrive', d: 'Persons' },
  { e: '⚫', n: 'Go High Level', d: 'Contacts' }, { e: '📄', n: 'CSV / Sheets', d: 'Download' },
];

/* ---------------- store ---------------- */
const KEY = 'fk_v2';
const state = {
  onboarded: false,
  profile: { name: 'Adam Porsborg', company: 'Unser Media', offer: '', location: '', website: '', site: null, brief: null },
  credits: 200, maxCredits: 200,
  view: 'today',
  hunts: [],        // chat sessions
  activeHuntId: null,
  pipeline: [],     // { ...prospect, stage, notes:[], reminder:null, touches:[], lastTouch:null }
  quota: { calls: 100, emails: 100, dms: 100 },
};
function save() {
  try { localStorage.setItem(KEY, JSON.stringify({ onboarded: state.onboarded, profile: state.profile, credits: state.credits, pipeline: state.pipeline, quota: state.quota })); } catch (e) {}
}
function load() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (d) { Object.assign(state, { onboarded: d.onboarded, credits: d.credits ?? 200, pipeline: d.pipeline || [], quota: d.quota || state.quota }); state.profile = Object.assign(state.profile, d.profile || {}); }
  } catch (e) {}
}

/* ---------------- live data (real hunts written by Claude Code) ---------------- */
async function loadLiveData() {
  try {
    const res = await fetch('data/prospects.json', { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    if (!data.prospects || !data.prospects.length) return;
    let added = 0;
    for (const p of data.prospects) {
      if (state.pipeline.some(x => x.id === p.id)) continue;
      state.pipeline.unshift({ ...p, stage: 'targets', notes: [], reminder: null, touches: [], lastTouch: null, addedTs: Date.now(), live: true });
      added++;
    }
    if (added) {
      save(); refreshBadges(); renderSideContext();
      if (state.view === 'today') renderToday();
      if (state.view === 'pipeline') renderPipeline();
      toast('🐕', `Loaded <b>${added}</b> real prospects from Bird Dog's last hunt${data.hunt?.location ? ' · ' + esc(data.hunt.location) : ''}.`);
    }
  } catch (e) { /* no live file yet — demo mode */ }
}

/* ---------------- credits ---------------- */
function setCredits(n) {
  state.credits = Math.max(0, n);
  $('#creditsVal').innerHTML = `${state.credits}<small>/${state.maxCredits}</small>`;
  $('#creditsBar').style.width = (state.credits / state.maxCredits * 100) + '%';
  save();
}
function spend(n, label) {
  if (state.credits < n) { toast('💸', `Not enough credits — <b>${n}</b> needed. Top up to keep going.`); return false; }
  setCredits(state.credits - n);
  if (label) toast('🐾', `${label} · <b>−${n}</b> credits`);
  return true;
}

/* ============================================================
   ROUTER
   ============================================================ */
const TITLES = {
  today: ['Today', 'Your daily briefing'],
  find: ['Find prospects', "Tell Bird Dog what you're selling"],
  pipeline: ['Pipeline', 'Work your saved prospects'],
};
function setView(v) {
  state.view = v;
  $$('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.view === v));
  $('#topTitle').firstChild.textContent = TITLES[v][0];
  $('#topSub').textContent = TITLES[v][1];
  renderTopActions();
  renderSideContext();
  if (v === 'today') renderToday();
  if (v === 'find') renderFind();
  if (v === 'pipeline') renderPipeline();
  refreshBadges();
}
function refreshBadges() {
  const due = dueFollowups().length;
  $('#navToday').textContent = due ? due : '';
  $('#navToday').style.display = due ? 'inline-grid' : 'none';
  $('#navPipe').textContent = state.pipeline.length || '';
  $('#navPipe').style.display = state.pipeline.length ? 'inline-grid' : 'none';
}
function renderTopActions() {
  const host = $('#topActions');
  if (state.view === 'find') {
    host.innerHTML = `<button class="btn" data-action="new-hunt"><span class="ico">＋</span> New hunt</button>`;
  } else if (state.view === 'pipeline') {
    host.innerHTML = `<button class="btn" data-action="view:find"><span class="ico">🐕</span> Find more</button>
      <button class="btn btn-primary" data-action="export"><span class="ico">⇩</span> Export</button>`;
  } else {
    host.innerHTML = `<button class="btn btn-primary" data-action="start-working"><span class="ico">▶</span> Start working the list</button>`;
  }
}

/* ============================================================
   SIDE CONTEXT (per view)
   ============================================================ */
function renderSideContext() {
  const host = $('#sideContext');
  if (state.view === 'find') {
    let h = `<div class="ctx-label">Your hunts</div>`;
    if (!state.hunts.length) h += `<div class="ctx-empty">No hunts yet.</div>`;
    for (const hu of state.hunts) {
      const active = hu.id === state.activeHuntId ? ' active' : '';
      h += `<div class="ctx-item${active}" data-action="open-hunt" data-id="${hu.id}">
        <div class="ctx-title"><span class="dot"></span>${esc(hu.title)}</div>
        <div class="ctx-meta">${hu.prospects?.length ? hu.prospects.length + ' found' : 'awaiting offer'}</div></div>`;
    }
    host.innerHTML = h;
  } else if (state.view === 'pipeline') {
    let h = `<div class="ctx-label">Pipeline stages</div>`;
    for (const s of STAGES) {
      const n = state.pipeline.filter(p => p.stage === s.id).length;
      h += `<div class="ctx-item"><div class="ctx-title">${s.emoji} ${esc(s.name)}</div><div class="ctx-meta">${n} ${n === 1 ? 'prospect' : 'prospects'}</div></div>`;
    }
    host.innerHTML = h;
  } else {
    const due = dueFollowups().length;
    host.innerHTML = `<div class="ctx-label">At a glance</div>
      <div class="ctx-stat"><span>In pipeline</span><b>${state.pipeline.length}</b></div>
      <div class="ctx-stat"><span>Follow-ups due</span><b style="color:var(--ember)">${due}</b></div>
      <div class="ctx-stat"><span>Touched today</span><b>${touchesToday().length}</b></div>`;
  }
}

/* ============================================================
   ONBOARDING
   ============================================================ */
let onb = { step: 0, offer: '', location: '', website: '', site: null, brief: null };
function startOnboarding() { onb = { step: 0, offer: '', location: '', website: '', site: null, brief: null }; renderOnb(); $('#onbScrim').classList.add('show'); }
function renderOnb() {
  const s = onb.step;
  let body = '';
  if (s === 0) {
    body = `
      <div class="onb-mark">🐕</div>
      <h2>What are you selling?</h2>
      <p>Don't pick a list. Tell me your offer and I'll figure out who's buying, find them, and hand you a plan.</p>
      <textarea id="onbOffer" class="onb-input" rows="2" placeholder="e.g. AI automation services for marketing agencies">${esc(onb.offer)}</textarea>
      <div class="onb-chips">${STARTERS.map(c => `<button class="chip" data-action="onb-pick" data-text="${esc(c.t)}"><span class="e">${c.e}</span>${esc(c.t)}</button>`).join('')}</div>
      <div class="onb-foot"><span></span><button class="btn btn-primary" data-action="onb-next">Continue →</button></div>`;
  } else if (s === 1) {
    body = `
      <div class="onb-step">Step 2 of 3</div>
      <h2>Where do you sell?</h2>
      <p>City, state, or "nationwide." I weight territories by where your buyers actually are.</p>
      <input id="onbLoc" class="onb-input" placeholder="e.g. Las Vegas, NV" value="${esc(onb.location)}" />
      <div class="onb-foot"><button class="btn btn-ghost" data-action="onb-back">← Back</button><button class="btn btn-primary" data-action="onb-next">Continue →</button></div>`;
  } else if (s === 2) {
    body = `
      <div class="onb-step">Step 3 of 3</div>
      <h2>Got a website?</h2>
      <p>Drop it in — I'll read it and tell you what to fix to close more of the people I bring you. (Optional.)</p>
      <input id="onbSite" class="onb-input" placeholder="e.g. unser.media" value="${esc(onb.website)}" />
      <div class="onb-foot"><button class="btn btn-ghost" data-action="onb-back">← Back</button>
        <span style="display:flex;gap:8px"><button class="btn" data-action="onb-analyze" data-skip="1">Skip</button>
        <button class="btn btn-primary" data-action="onb-analyze">Analyze & build plan →</button></span></div>`;
  } else if (s === 3) {
    body = `<div class="onb-loading"><span class="spin big"></span><h2>Bird Dog is on it…</h2>
      <div class="onb-log" id="onbLog"></div></div>`;
  } else if (s === 4) {
    const site = onb.site, b = onb.brief;
    body = `
      <div class="onb-mark sm">🎯</div>
      <h2>Here's your plan</h2>
      <p>I read your offer${site ? ' and your site' : ''}. Sell to <b>these</b> people — not everyone.</p>
      ${site ? `<div class="onb-card">
        <div class="onb-card-h">🌐 Your site <span class="grade">${esc(site.grade)}</span></div>
        <div class="onb-mini-label">Fix these to close more of the leads I send:</div>
        ${site.fixes.map(f => `<div class="onb-fix"><span>⚠️</span>${esc(f)}</div>`).join('')}
      </div>` : ''}
      <div class="onb-card">
        <div class="onb-card-h">🎯 Who's buying · ${esc(b.vertical)}</div>
        <div class="onb-mini-label">Decision makers <span class="onb-note">${esc(b.buyerNote)}</span></div>
        <div class="tagset">${b.buyerTitles.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
        <div class="onb-mini-label" style="margin-top:12px">Best niches</div>
        <div class="tagset">${b.industries.slice(0,4).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
        <div class="onb-mini-label" style="margin-top:12px">The play</div>
        <div style="font-size:13px;color:var(--ink-2);line-height:1.5">${esc(b.angle)}</div>
      </div>
      <div class="onb-foot"><span class="muted-note">Sourced from county records + the web — no paid list.</span>
        <button class="btn btn-primary" data-action="onb-finish">🐕 Start hunting →</button></div>`;
  }
  $('#onbScrim').innerHTML = `<div class="onb"><div class="onb-body">${body}</div></div>`;
  if (s === 0) setTimeout(() => $('#onbOffer')?.focus(), 50);
  if (s === 1) setTimeout(() => $('#onbLoc')?.focus(), 50);
  if (s === 2) setTimeout(() => $('#onbSite')?.focus(), 50);
}
async function onbAnalyze(skip) {
  if (!skip) onb.website = ($('#onbSite')?.value || '').trim();
  onb.step = 3; renderOnb();
  const steps = onb.website
    ? ['Fetching your website…', 'Reading your value prop…', 'Scoring conversion gaps…', 'Profiling your ideal buyer…', 'Mapping niches + territories…']
    : ['Reading your offer…', 'Profiling your ideal buyer…', 'Mapping niches + territories…', 'Picking buying triggers…'];
  const log = $('#onbLog');
  for (const st of steps) { log.insertAdjacentHTML('beforeend', `<div class="onb-log-row">✓ ${esc(st)}</div>`); await wait(520); }
  onb.site = onb.website ? await FK.analyzeWebsite(onb.website) : null;
  onb.brief = await FK.profileOffer(onb.offer, { location: onb.location });
  await wait(300);
  onb.step = 4; renderOnb();
}
function onbFinish() {
  state.onboarded = true;
  state.profile.offer = onb.offer; state.profile.location = onb.location; state.profile.website = onb.website;
  state.profile.site = onb.site; state.profile.brief = onb.brief;
  save();
  $('#onbScrim').classList.remove('show');
  // jump into find view and auto-run the first hunt
  setView('find');
  newHunt(onb.offer);
}

/* ============================================================
   FIND  (chat hunt + discovery)
   ============================================================ */
function activeHunt() { return state.hunts.find(h => h.id === state.activeHuntId); }
function newHunt(prefill) {
  const h = { id: 'h' + Date.now(), title: prefill ? titleize(prefill) : 'New hunt', offer: '', messages: [], brief: null, prospects: [], selected: new Set() };
  state.hunts.unshift(h); state.activeHuntId = h.id;
  renderSideContext(); renderFind();
  if (prefill) { $('#input').value = prefill; autosize(); submit(); }
  else $('#input')?.focus();
}
function openHunt(id) { state.activeHuntId = id; renderSideContext(); renderFind(); }

function renderFind() {
  const h = activeHunt();
  $('#viewHost').innerHTML = `
    <div class="thread" id="thread"><div class="thread-inner" id="threadInner"></div></div>
    <div class="composer-wrap"><div class="composer">
      <textarea id="input" rows="1" placeholder="What are you selling? (e.g. “AI automation for marketing agencies”)"></textarea>
      <div class="composer-tools">
        <button class="icon-btn" title="Paste a link to your offer">🔗</button>
        <button class="icon-btn" title="Upload a product photo">🖼</button>
        <button class="send" id="sendBtn" data-action="send" title="Send" disabled>➤</button>
      </div></div>
      <div class="composer-hint">Bird Dog runs a <b>7-layer hunt</b> · <b>8 credits</b>/search · self-sourced data — <b>no paid lists</b></div>
    </div>`;
  const inner = $('#threadInner');
  if (!h || !h.messages.length) { inner.innerHTML = heroHTML(); }
  else { inner.innerHTML = h.messages.map(renderMessage).join(''); scrollDown(); }
  wireComposer();
}
function wireComposer() {
  const input = $('#input'); if (!input) return;
  input.addEventListener('input', () => { autosize(); $('#sendBtn').disabled = !input.value.trim(); });
  input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (input.value.trim()) submit(); } });
}
function heroHTML() {
  return `<div class="hero">
    <div class="hero-mark">🐕</div>
    <h1>Don't build a list.<br>Tell me <em>what you're selling.</em></h1>
    <p>I'm <strong>Bird Dog</strong>. Point me at your offer and I'll sniff out who's buying, find the right person inside each company, build their persona, and hand you a play to close them.</p>
    <div class="chips">${STARTERS.map(s => `<button class="chip" data-action="chip" data-text="${esc(s.t)}"><span class="e">${s.e}</span>${esc(s.t)}</button>`).join('')}</div>
    <div class="hero-quote">“You miss 100% of the buyers you never sniff out.”</div>
  </div>`;
}
function renderMessage(m) {
  if (m.role === 'user') return `<div class="msg user"><div class="msg-ava">${esc(initials(state.profile.name))}</div><div class="msg-body"><div class="msg-who">You</div><div class="msg-text"><p>${esc(m.text)}</p></div></div></div>`;
  return `<div class="msg bot"><div class="msg-ava">🐕</div><div class="msg-body"><div class="msg-who">Bird Dog <small>prospecting oracle</small></div><div class="msg-text" id="${m.id || ''}">${m.html}</div></div></div>`;
}
function pushBot(html) { const h = activeHunt(); const id = 'b' + Date.now() + Math.floor(Math.random() * 999); h.messages.push({ role: 'bot', html, id }); renderThreadOnly(); return id; }
function updateBot(id, html) { const h = activeHunt(); const m = h.messages.find(x => x.id === id); if (m) m.html = html; const el = document.getElementById(id); if (el) { el.innerHTML = html; scrollDown(); } }
function renderThreadOnly() { const inner = $('#threadInner'); const h = activeHunt(); inner.innerHTML = h.messages.map(renderMessage).join(''); scrollDown(); }

async function submit() {
  const h = activeHunt() || (newHunt(), activeHunt());
  const text = $('#input').value.trim(); if (!text) return;
  if (!h.offer) { h.offer = text; h.title = titleize(text); }
  h.messages.push({ role: 'user', text });
  $('#input').value = ''; autosize(); $('#sendBtn').disabled = true;
  renderSideContext(); renderThreadOnly();

  if (!spend(FK.config.creditsPerSearch, 'Hunt dispatched')) { pushBot(`<p>You're out of credits, partner. <strong>Top up</strong> and I'll get right back on the scent.</p>`); return; }
  pushBot(`<p>On it. Let me read <strong>${esc(short(text))}</strong>, pull matching businesses from county records + the web, find the right person in each, and build their files. A few seconds — I check every lead by hand.</p>`);
  await wait(500);

  const brief = await FK.profileOffer(text, { location: state.profile.location });
  h.brief = brief;
  const logId = pushBot(worklogHTML(0));
  for (let i = 0; i < FK.layers.length; i++) {
    await wait(520 + Math.random() * 360);
    const count = [null, null, FK._rand(180, 420), FK._rand(60, 140), FK._rand(40, 90), FK._rand(24, 50), null][i];
    updateBot(logId, worklogHTML(i, count));
  }
  await wait(400); updateBot(logId, worklogHTML(FK.layers.length));

  const prospects = await FK.hunt(text, brief, 24);
  h.prospects = prospects;
  renderSideContext(); refreshBadges();
  pushBot(briefHTML(brief));
  await wait(300);
  h.resultsMsgId = pushBot(resultsHTML(h));
}

function worklogHTML(activeIdx, count) {
  const done = activeIdx >= FK.layers.length;
  const rows = FK.layers.map((l, i) => {
    let cls = 'wl-step', ico = '○';
    if (i < activeIdx) { cls += ' ok'; ico = '✓'; }
    else if (i === activeIdx && !done) { cls += ' on'; ico = '◆'; }
    const cnt = (i === activeIdx && count) ? `<span class="wl-count">${count} found</span>` : '';
    return `<div class="${cls}"><span class="wl-ico">${ico}</span><span><span class="wl-agent">${l.icon} ${esc(l.agent)}</span> — <span class="wl-detail">${esc(l.detail)}</span></span>${cnt}</div>`;
  }).join('');
  return `<div class="worklog"><div class="worklog-head ${done ? 'done' : ''}">${done ? '✅' : '<span class="spin"></span>'} ${done ? 'Hunt complete — 7 layers cleared' : 'Running the 7-layer hunt…'}</div>${rows}</div>`;
}
function briefHTML(b) {
  return `<p>Here's the read. Don't sell this to everyone — sell it to <strong>these</strong> people:</p>
    <div class="brief"><div class="brief-title">🎯 Who's actually buying <span style="color:var(--ink-4);font-weight:400;font-size:12px">· ${esc(b.vertical)}</span></div>
      <div class="brief-grid">
        <div class="brief-item"><div class="k">Decision makers</div><div class="v tagset">${b.buyerTitles.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div></div>
        <div class="brief-item"><div class="k">Best niches</div><div class="v tagset">${b.industries.slice(0,4).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div></div>
        <div class="brief-item"><div class="k">Hot territories</div><div class="v tagset">${b.territories.slice(0,4).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div></div>
        <div class="brief-item"><div class="k">Buying triggers I hunt</div><div class="v tagset">${b.triggers.slice(0,3).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div></div>
      </div>
      <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--line-soft);font-size:12.5px;color:var(--ink-2)"><strong style="color:var(--amber-bright)">Who to ask for:</strong> ${esc(b.buyerNote)}</div>
    </div>`;
}
function resultsHTML(h) {
  const ps = h.prospects;
  const avg = Math.round(ps.reduce((a, p) => a + p.fitScore, 0) / ps.length);
  return `<div class="found"><div class="found-num">${ps.length}</div>
    <div class="found-txt"><b>matches pulled</b> — avg fit ${avg}/100. Tick the ones you want and save them into your pipeline. Click a name for the full persona dossier.</div></div>
    <div class="disc-bar">
      <label class="disc-all"><input type="checkbox" data-action="select-all"> Select all</label>
      <button class="btn" data-action="select-high"><span class="ico">⭐</span> Select high-fit (85+)</button>
      <button class="btn btn-primary" data-action="save-selected"><span class="ico">＋</span> Save <span id="selCount">${h.selected.size}</span> to pipeline</button>
    </div>
    <div class="disc-grid">${ps.map(discCardHTML).join('')}</div>`;
}
function refreshResults() { const h = activeHunt(); if (h && h.resultsMsgId) updateBot(h.resultsMsgId, resultsHTML(h)); }
function discCardHTML(p) {
  const inPipe = state.pipeline.some(x => x.id === p.id);
  const h = activeHunt();
  const sel = h && h.selected.has(p.id);
  return `<div class="disc-card ${inPipe ? 'inpipe' : ''}" data-id="${p.id}">
    <label class="disc-check" data-action="stop"><input type="checkbox" data-action="toggle-select" data-id="${p.id}" ${inPipe ? 'checked disabled' : (sel ? 'checked' : '')}></label>
    <div class="disc-body" data-action="open-prospect" data-id="${p.id}">
      <div class="disc-top">${avatarHTML(p, 38)}<div class="disc-id">
        <div class="disc-name">${esc(p.name)} ${inPipe ? '<span class="inpipe-pill">in pipeline</span>' : ''}</div>
        <div class="disc-title">${esc(p.title)} · ${esc(p.company)}</div></div>
        <div class="mini-ring" style="--p:${p.fitScore}"><span>${p.fitScore}</span></div></div>
      <div class="disc-meta"><span>📍 ${esc(p.location)}</span><span>${channelDots(p)}</span></div>
      <div class="disc-sig">🟢 ${esc(short(p.signals[0] || p.lifeEvent, 60))}</div>
    </div></div>`;
}
function channelDots(p) {
  const c = p.channels; const out = [];
  if (p.phone || c.phoneStatus === 'direct') out.push('📞'); else out.push('<span title="front desk only" style="opacity:.5">📞</span>');
  out.push(c.emailStatus === 'verified' ? '✉️' : '<span title="inferred" style="opacity:.5">✉️</span>');
  if (c.linkedin) out.push('in'); if (c.instagram) out.push('◎'); if (c.sms) out.push('💬');
  return out.join(' ');
}
function selectedIds(h) { return [...(h.selected || new Set())]; }
function updateSelCount() { const h = activeHunt(); const el = $('#selCount'); if (el) el.textContent = h.selected.size; }

/* ============================================================
   PIPELINE
   ============================================================ */
function saveToPipeline(ids) {
  const h = activeHunt(); let added = 0;
  for (const id of ids) {
    if (state.pipeline.some(x => x.id === id)) continue;
    const p = h.prospects.find(x => x.id === id); if (!p) continue;
    state.pipeline.unshift({ ...p, stage: 'targets', notes: [], reminder: null, touches: [], lastTouch: null, addedTs: Date.now() });
    added++;
  }
  h.selected = new Set();
  save(); renderSideContext(); refreshBadges();
  if (added) toast('🎯', `<b>${added}</b> ${added === 1 ? 'prospect' : 'prospects'} saved to your pipeline.`);
  else toast('🐾', 'Tick a few prospects first, then save.');
  refreshResults();
}
function pipeItem(id) { return state.pipeline.find(p => p.id === id); }
function dueFollowups() { const t = todayKey(); return state.pipeline.filter(p => p.stage === 'followup' || (p.reminder && p.reminder <= t && p.stage !== 'won')); }
function touchesToday() { const t = todayKey(); return state.pipeline.flatMap(p => p.touches.filter(x => x.ts.slice(0, 10) === t)); }

function logTouch(id, channel) {
  const p = pipeItem(id); if (!p) return;
  p.touches.push({ channel, ts: new Date().toISOString() });
  p.lastTouch = new Date().toISOString();
  if (p.stage === 'targets') p.stage = 'contacted';
  save(); refreshBadges(); renderSideContext();
  toast('✅', `Logged <b>${channel}</b> → ${esc(p.name.split(' ')[0])}. Touch #${p.touches.length}.`);
  if (state.view === 'pipeline') renderPipeline();
  if ($('#drawer').classList.contains('show')) openDrawer(id);
  if (state.view === 'today') renderToday();
}
function moveStage(id, stage) {
  const p = pipeItem(id); if (!p) return; p.stage = stage;
  if (stage !== 'followup') p.reminder = stage === 'won' ? null : p.reminder;
  save(); refreshBadges(); renderSideContext();
  if (state.view === 'pipeline') renderPipeline();
  if (state.view === 'today') renderToday();
  if ($('#drawer').classList.contains('show')) openDrawer(id);
}
function addNote(id, text, remindDays) {
  const p = pipeItem(id); if (!p || !text.trim()) return;
  p.notes.unshift({ text: text.trim(), ts: new Date().toISOString() });
  let msg = 'Note saved.';
  if (remindDays) {
    const d = new Date(); d.setDate(d.getDate() + Number(remindDays));
    p.reminder = d.toISOString().slice(0, 10); p.stage = 'followup';
    msg = `Note saved + reminder set for <b>${fmtDate(p.reminder)}</b>.`;
  }
  save(); refreshBadges(); renderSideContext();
  toast('📝', msg);
  openDrawer(id);
  if (state.view === 'today') renderToday();
}

function renderPipeline() {
  if (!state.pipeline.length) {
    $('#viewHost').innerHTML = emptyState('▦', 'Your pipeline is empty', 'Go find prospects, tick the good ones, and save them here. Then I run your day from this board.', 'view:find', '🐕 Find prospects');
    return;
  }
  const cols = STAGES.map(s => {
    const items = state.pipeline.filter(p => p.stage === s.id);
    return `<div class="pcol"><div class="pcol-head">${s.emoji} ${esc(s.name)} <span class="pcol-n">${items.length}</span></div>
      <div class="pcol-body">${items.map(pipeCardHTML).join('') || `<div class="pcol-empty">${esc(s.hint)}</div>`}</div></div>`;
  }).join('');
  $('#viewHost').innerHTML = `<div class="board">${cols}</div>`;
}
function pipeCardHTML(p) {
  const last = p.lastTouch ? `${p.touches.length} touch${p.touches.length > 1 ? 'es' : ''}` : 'not contacted';
  const due = p.reminder ? `<span class="due">⏰ ${fmtDate(p.reminder)}</span>` : '';
  return `<div class="pipe-card" data-action="open-prospect" data-id="${p.id}">
    <div class="pipe-top">${avatarHTML(p, 32)}<div style="min-width:0"><div class="pipe-name">${esc(p.name)}</div><div class="pipe-sub">${esc(p.company)}</div></div><div class="mini-ring sm" style="--p:${p.fitScore}"><span>${p.fitScore}</span></div></div>
    <div class="pipe-foot"><span>${last}</span>${due}</div>
    ${p.notes[0] ? `<div class="pipe-note">📝 ${esc(short(p.notes[0].text, 70))}</div>` : ''}</div>`;
}

/* ============================================================
   TODAY  (daily briefing)
   ============================================================ */
function renderToday() {
  const host = $('#viewHost');
  if (!state.pipeline.length) {
    host.innerHTML = emptyState('☀️', `Good ${greet()}, ${state.profile.name.split(' ')[0]}.`, "You've got no prospects yet. Tell me what you're selling and I'll build your first day's list.", 'view:find', '🐕 Find my buyers');
    return;
  }
  const due = dueFollowups();
  const hot = state.pipeline.filter(p => p.stage !== 'won' && !due.includes(p) && (p.phone || p.channels.phoneStatus === 'direct') && p.fitScore >= 82);
  const rest = state.pipeline.filter(p => p.stage === 'targets' && !hot.includes(p) && !due.includes(p));
  const tt = touchesToday();
  const byCh = (c) => tt.filter(x => x.channel.toLowerCase().includes(c)).length;

  host.innerHTML = `<div class="today">
    <div class="today-hello">
      <h2>Good ${greet()}, ${esc(state.profile.name.split(' ')[0])}. Here's your day.</h2>
      <p>${state.pipeline.length} in pipeline · <b style="color:var(--ember)">${due.length} follow-ups due</b> · ${hot.length} hot to call. ${recapLine()}</p>
    </div>
    <div class="quota-row">
      ${quotaCard('📞 Calls', byCh('call'), state.quota.calls)}
      ${quotaCard('✉️ Emails', byCh('email'), state.quota.emails)}
      ${quotaCard('💬 DMs', byCh('dm') + byCh('text') + byCh('tweet'), state.quota.dms)}
    </div>

    ${worklist('⏰ Follow-ups due', 'These asked you to circle back — or you said you would.', due, 'ember')}
    ${worklist('🔥 Call first — high intent', 'Direct line + strong fit. Dial these while you’re fresh.', hot, 'amber')}
    ${worklist('✉️ New to reach', 'Fresh targets. Email or DM to open the loop.', rest.slice(0, 12), 'plain')}
  </div>`;
}
function quotaCard(label, n, target) {
  const pct = Math.min(100, Math.round(n / target * 100));
  return `<div class="quota"><div class="quota-top"><span>${label}</span><b>${n}<small>/${target}</small></b></div>
    <div class="quota-bar"><i style="width:${pct}%"></i></div></div>`;
}
function worklist(title, sub, items, tone) {
  if (!items.length) return '';
  return `<div class="wlist wl-${tone}"><div class="wlist-h"><div><div class="wlist-t">${title}</div><div class="wlist-s">${esc(sub)}</div></div><span class="wlist-n">${items.length}</span></div>
    <div class="wlist-body">${items.map(todayRowHTML).join('')}</div></div>`;
}
function todayRowHTML(p) {
  const ch = p.outreach.bestChannel;
  const chBtn = ch === 'Call' ? `<button class="row-act call" data-action="touch" data-id="${p.id}" data-channel="Call">📞 Call</button>`
    : ch === 'Email' ? `<button class="row-act" data-action="touch" data-id="${p.id}" data-channel="Email">✉️ Email</button>`
    : `<button class="row-act" data-action="touch" data-id="${p.id}" data-channel="DM">💬 DM</button>`;
  return `<div class="trow">
    ${avatarHTML(p, 36)}
    <div class="trow-id" data-action="open-prospect" data-id="${p.id}">
      <div class="trow-name">${esc(p.name)} <span class="trow-fit">${p.fitScore}</span></div>
      <div class="trow-sub">${esc(p.title)} · ${esc(p.company)} · 📍 ${esc(p.location)}</div>
      <div class="trow-why">🟢 ${esc(short(p.signals[0] || p.lifeEvent, 64))}</div>
    </div>
    <div class="trow-acts">${chBtn}<button class="row-act ghost" data-action="open-prospect" data-id="${p.id}">Open</button></div>
  </div>`;
}
function recapLine() {
  const t = touchesToday().length;
  if (!t) return "Let's get the first one on the board.";
  return `You've made <b>${t}</b> ${t === 1 ? 'touch' : 'touches'} today. Keep the streak.`;
}
function greet() { const h = new Date().getHours(); return h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening'; }
function startWorking() {
  const list = dueFollowups().concat(state.pipeline.filter(p => p.stage !== 'won'));
  if (!list.length) { toast('🐕', 'Nothing queued — go find some prospects first.'); setView('find'); return; }
  openDrawer(list[0].id);
}

/* ============================================================
   DRAWER — persona dossier (+ pipeline actions)
   ============================================================ */
function findAnywhere(id) { return pipeItem(id) || state.hunts.flatMap(h => h.prospects).find(p => p.id === id); }
function openDrawer(id) {
  const p = findAnywhere(id); if (!p) return;
  $('#drawer').innerHTML = dossierHTML(p);
  $('#drawer').classList.add('show'); $('#scrim').classList.add('show');
}
function closeDrawer() { $('#drawer').classList.remove('show'); $('#scrim').classList.remove('show'); }

function dossierHTML(p) {
  const inPipe = !!pipeItem(p.id);
  const c = p.channels;
  const contactBlock = p.unlocked || inPipe ? `
    ${p.phone ? contactRow('📞', p.phone, 'Direct dial') : `<div class="contact-row missing"><span class="e">📞</span><span class="v">No direct line — front desk: ${esc(p.frontDesk)}</span>
      <button class="copy" data-action="get-email" data-id="${p.id}">have Bird Dog call →</button></div>`}
    ${p.email ? contactRow('✉️', p.email, c.emailStatus === 'verified' ? 'Verified' : 'Inferred ' + c.emailConfidence + '%')
      : `<div class="contact-row missing"><span class="e">✉️</span><span class="v">Pattern: ${esc(p.emailPattern)} <small>(${c.emailConfidence}% likely)</small></span>
      <button class="copy" data-action="get-email" data-id="${p.id}">verify →</button></div>`}`
    : `<div class="unlock-box"><p>🔒 Bird Dog has a contact path for ${esc(p.name.split(' ')[0])} — direct dial / inferred email / socials.</p>
       <button class="btn btn-primary" data-action="unlock" data-id="${p.id}" style="margin:0 auto"><span class="ico">🔓</span> Unlock contact · 1 credit</button></div>`;

  return `<div class="drawer-head">${avatarHTML(p, 52)}
    <div><div class="pcard-name" style="font-size:16px">${esc(p.name)}</div><div class="pcard-title">${esc(p.title)} · ${esc(p.company)}</div></div>
    <button class="drawer-close" data-action="close-drawer">✕</button></div>
  <div class="drawer-body">
    <div class="found" style="margin-top:0"><div class="found-num">${p.fitScore}</div><div class="found-txt"><b>fit score</b><br>${esc(p.reason)}</div></div>

    ${inPipe ? stageBar(p) : `<button class="btn btn-primary fullbtn" data-action="save-one" data-id="${p.id}"><span class="ico">＋</span> Save to pipeline</button>`}

    <div class="dossier-sec"><h4>The human <span class="layer">persona</span></h4>
      <div class="persona">${avatarHTML(p, 60)}
        <div><div class="persona-life">📸 ${esc(p.lifeEvent)}</div>
        <div class="persona-co"><b>Works with:</b> ${p.coworkers.map(cw => `${esc(cw.name)} <span>(${esc(cw.title)})</span>`).join(' · ')}</div></div></div>
    </div>

    <div class="dossier-sec"><h4>The company <span class="layer">layer 1–3</span></h4>
      <div class="kv"><span class="k">Industry</span><span class="v">${esc(p.industry)}</span></div>
      <div class="kv"><span class="k">Size</span><span class="v">${esc(p.size)}</span></div>
      <div class="kv"><span class="k">Location</span><span class="v">${esc(p.location)}</span></div>
      <div class="kv"><span class="k">Website</span><span class="v"><a href="#" onclick="return false">${esc(p.socials.website)}</a></span></div>
    </div>

    <div class="dossier-sec"><h4>How to reach ${esc(p.name.split(' ')[0])} <span class="layer">layer 5</span></h4>
      ${contactBlock}
      <div class="channels">${channelBtns(p)}</div>
    </div>

    <div class="dossier-sec"><h4>Buying signals <span class="layer">layer 6 · socials</span></h4>
      ${p.signals.map(s => `<div class="signal-item sig"><span class="dot"></span><span>${esc(s)}</span></div>`).join('')}
    </div>

    <div class="dossier-sec"><h4>Find them <span class="layer">socials</span></h4>
      <div class="socials">
        <a class="social" href="#" onclick="return false">in · ${esc(p.socials.linkedin.split('/').pop())}</a>
        ${c.instagram ? `<a class="social" href="#" onclick="return false">◎ ${esc(p.socials.instagram)}</a>` : ''}
        ${c.facebook ? `<a class="social" href="#" onclick="return false">f · ${esc(p.socials.facebook.split('/').pop())}</a>` : ''}
        ${c.x ? `<a class="social" href="#" onclick="return false">𝕏 ${esc(p.socials.x)}</a>` : ''}
      </div>
    </div>

    <div class="dossier-sec"><h4>The play <span class="layer">layer 7 · script</span></h4>
      <div class="play">
        <div class="angle"><b>Angle:</b> ${esc(p.outreach.angle)}</div>
        <div class="script"><div class="label">Best channel · ${esc(p.outreach.bestChannel)}</div></div>
        <div class="script"><div class="label">Opening line</div>${esc(p.outreach.opener)}<button class="mini-copy" data-action="copy" data-copy="${esc(p.outreach.opener)}">copy</button></div>
        <div class="script"><div class="label">DM version</div>${esc(p.outreach.dm)}<button class="mini-copy" data-action="copy" data-copy="${esc(p.outreach.dm)}">copy</button></div>
        <div class="seq">${p.outreach.followups.map((f, i) => `<div class="seq-step"><span class="n">${i + 1}</span><span><span class="day">${esc(f.day)} —</span> ${esc(f.text)}</span></div>`).join('')}</div>
      </div>
    </div>

    ${inPipe ? notesSection(p) : ''}
  </div>
  <div class="drawer-foot">
    <button class="btn" data-action="copy" data-copy="${esc(p.outreach.opener)}"><span class="ico">📋</span> Copy opener</button>
    ${inPipe ? `<button class="btn btn-primary" data-action="touch" data-id="${p.id}" data-channel="${esc(p.outreach.bestChannel)}"><span class="ico">✅</span> Log ${esc(p.outreach.bestChannel)}</button>`
      : `<button class="btn btn-primary" data-action="save-one" data-id="${p.id}"><span class="ico">＋</span> Save to pipeline</button>`}
  </div>`;
}
function contactRow(e, v, tag) { return `<div class="contact-row"><span class="e">${e}</span><span class="v">${esc(v)}</span><span class="ctag">${esc(tag)}</span><button class="copy" data-action="copy" data-copy="${esc(v)}">copy</button></div>`; }
function channelBtns(p) {
  const c = p.channels; const b = [];
  b.push(`<button class="ch-btn" data-action="touch" data-id="${p.id}" data-channel="Call">📞 Call</button>`);
  b.push(`<button class="ch-btn" data-action="touch" data-id="${p.id}" data-channel="Email">✉️ Email</button>`);
  if (c.linkedin) b.push(`<button class="ch-btn" data-action="touch" data-id="${p.id}" data-channel="LinkedIn DM">in DM</button>`);
  if (c.instagram) b.push(`<button class="ch-btn" data-action="touch" data-id="${p.id}" data-channel="Instagram DM">◎ DM</button>`);
  if (c.sms) b.push(`<button class="ch-btn" data-action="touch" data-id="${p.id}" data-channel="Text">💬 Text</button>`);
  if (c.x) b.push(`<button class="ch-btn" data-action="touch" data-id="${p.id}" data-channel="Tweet">𝕏 Tweet</button>`);
  return b.join('');
}
function stageBar(p) {
  return `<div class="stagebar">${STAGES.map(s => `<button class="stage-pill ${p.stage === s.id ? 'on' : ''}" data-action="move-stage" data-id="${p.id}" data-stage="${s.id}">${s.emoji} ${esc(s.name)}</button>`).join('')}</div>`;
}
function notesSection(p) {
  return `<div class="dossier-sec"><h4>Notes & reminders <span class="layer">your sales manager remembers</span></h4>
    <div class="note-compose">
      <textarea id="noteInput" placeholder="e.g. Spoke to Brett, send pricing Monday. He's the decision maker."></textarea>
      <div class="note-actions">
        <select id="noteRemind"><option value="">No reminder</option><option value="1">Remind in 1 day</option><option value="2">in 2 days</option><option value="3">in 3 days</option><option value="7">in 1 week</option></select>
        <button class="btn btn-primary" data-action="add-note" data-id="${p.id}">Save note</button>
      </div>
    </div>
    ${p.reminder ? `<div class="reminder-chip">⏰ Reminder set for <b>${fmtDate(p.reminder)}</b></div>` : ''}
    <div class="notes-list">${p.notes.map(n => `<div class="note"><div class="note-meta">${new Date(n.ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</div>${esc(n.text)}</div>`).join('') || '<div class="ctx-empty">No notes yet — I act on whatever you write here.</div>'}</div>
    ${p.touches.length ? `<div class="touchlog"><div class="onb-mini-label">Touch history</div>${p.touches.slice().reverse().map(t => `<div class="touch-row">✅ ${esc(t.channel)} <span>${new Date(t.ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span></div>`).join('')}</div>` : ''}
  </div>`;
}

/* ============================================================
   EXPORT MODAL
   ============================================================ */
function openExport() {
  const n = state.pipeline.length;
  if (!n) { toast('▦', 'Pipeline is empty — save some prospects first.'); return; }
  $('#modalScrim').innerHTML = `<div class="modal"><h3>Send your pipeline to CRM</h3>
    <div class="sub">${n} prospects with verified contacts, persona notes, and the outreach play attached. Pick where they land.</div>
    <div class="crm-grid">${CRMS.map(c => `<button class="crm-opt" data-action="export-crm" data-crm="${esc(c.n)}"><span class="logo">${c.e}</span><span><span class="nm">${esc(c.n)}</span><br><span class="ds">${esc(c.d)}</span></span></button>`).join('')}</div>
    <div class="modal-foot"><button class="btn btn-ghost" data-action="close-modal">Cancel</button><span class="cost" style="margin-left:auto">Export cost: <b>${FK.config.creditsPerExport} credits</b></span></div></div>`;
  $('#modalScrim').classList.add('show');
}
function closeModal() { $('#modalScrim').classList.remove('show'); }

/* ============================================================
   SHARED UI
   ============================================================ */
function avatarHTML(p, size) {
  return `<div class="av" style="width:${size}px;height:${size}px;border-radius:${Math.round(size/3.5)}px">
    <img src="${esc(p.photo)}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><div class="av-fb" style="display:none">${esc(initials(p.name))}</div></div>`;
}
function initials(name) { return String(name).split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(); }
function emptyState(emoji, title, sub, action, cta) {
  return `<div class="empty"><div class="empty-mark">${emoji}</div><h2>${esc(title)}</h2><p>${esc(sub)}</p><button class="btn btn-primary" data-action="${action}">${esc(cta)}</button></div>`;
}
function toast(e, html) {
  const t = document.createElement('div'); t.className = 'toast';
  t.innerHTML = `<span class="e">${e}</span><span>${html}</span>`;
  $('#toasts').appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(8px)'; setTimeout(() => t.remove(), 300); }, 3200);
}
function copy(text) { navigator.clipboard?.writeText(text).then(() => toast('📋', 'Copied to clipboard')); }
function scrollDown() { const t = $('#thread'); if (t) t.scrollTop = t.scrollHeight; }
function short(s, n = 64) { s = String(s || ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; }
function titleize(s) { s = String(s).trim().replace(/^(selling|sell)\s+/i, ''); return short(s.charAt(0).toUpperCase() + s.slice(1), 34); }
function autosize() { const el = $('#input'); if (!el) return; el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 160) + 'px'; }

/* ============================================================
   GLOBAL EVENT DELEGATION
   ============================================================ */
function onClick(e) {
  // sidebar nav (uses data-view, no data-action)
  const nav = e.target.closest('.nav-item[data-view]');
  if (nav) return setView(nav.dataset.view);
  const t = e.target.closest('[data-action]'); if (!t) return;
  // checkbox inputs are handled by the 'change' listener — avoid double-toggle
  if (t.tagName === 'INPUT' && t.type === 'checkbox') return;
  const a = t.dataset.action, id = t.dataset.id;
  if (a === 'stop') return;
  if (a.startsWith('view:')) return setView(a.slice(5));
  switch (a) {
    case 'open-hunt': openHunt(id); break;
    case 'new-hunt': newHunt(); break;
    case 'chip': case 'onb-pick': {
      const txt = t.dataset.text;
      if (a === 'onb-pick') { onb.offer = txt; $('#onbOffer').value = txt; }
      else { $('#input').value = txt; autosize(); $('#sendBtn').disabled = false; submit(); }
      break;
    }
    case 'send': if ($('#input').value.trim()) submit(); break;
    case 'select-high': {
      const h = activeHunt();
      $$('.disc-grid input[data-action="toggle-select"]').forEach(cb => {
        if (cb.disabled) return;
        const p = h.prospects.find(x => x.id === cb.dataset.id);
        if (p && p.fitScore >= 85) { cb.checked = true; h.selected.add(p.id); }
      });
      updateSelCount(); break;
    }
    case 'save-selected': saveToPipeline(selectedIds(activeHunt())); break;
    case 'save-one': saveToPipeline([id]); openDrawer(id); break;
    case 'open-prospect': openDrawer(id); break;
    case 'close-drawer': closeDrawer(); break;
    case 'unlock': { const p = findAnywhere(id); if (spend(FK.config.creditsPerUnlock, `Unlocked ${p.name}`)) { p.unlocked = true; openDrawer(id); } break; }
    case 'get-email': getEmail(id); break;
    case 'touch': logTouch(id, t.dataset.channel); break;
    case 'move-stage': moveStage(id, t.dataset.stage); break;
    case 'add-note': addNote(id, $('#noteInput').value, $('#noteRemind').value); break;
    case 'export': openExport(); break;
    case 'export-crm': if (spend(FK.config.creditsPerExport, `Exported to ${t.dataset.crm}`)) { closeModal(); toast('✅', `<b>${state.pipeline.length} prospects</b> pushed to <b>${esc(t.dataset.crm)}</b> with notes + plays.`); } break;
    case 'close-modal': closeModal(); break;
    case 'start-working': startWorking(); break;
    case 'copy': copy(t.dataset.copy); break;
    case 'onb-next': onbNext(); break;
    case 'onb-back': onb.step--; renderOnb(); break;
    case 'onb-analyze': onbAnalyze(t.dataset.skip); break;
    case 'onb-finish': onbFinish(); break;
  }
}
function onbNext() {
  if (onb.step === 0) { onb.offer = ($('#onbOffer').value || '').trim(); if (!onb.offer) return toast('🐕', 'Tell me what you sell first.'); }
  if (onb.step === 1) { onb.location = ($('#onbLoc').value || '').trim(); }
  onb.step++; renderOnb();
}
async function getEmail(id) {
  const p = findAnywhere(id); if (!p) return;
  if (!spend(FK.config.creditsPerReceptionistCall, 'Bird Dog called the front desk')) return;
  toast('📞', `Calling ${esc(p.company)}'s front desk…`);
  await wait(1400);
  const r = await FK.getReceptionistEmail(p);
  p.email = r.email; p.channels.emailStatus = 'verified'; p.channels.emailConfidence = 99;
  if (!p.phone) { p.phone = p.frontDesk; }
  save();
  toast('✅', `Got it — <b>${esc(r.email)}</b> (${esc(r.source)}).`);
  openDrawer(id);
}

/* ============================================================
   INIT
   ============================================================ */
function init() {
  load();
  $('#creditsVal').innerHTML = `${state.credits}<small>/${state.maxCredits}</small>`;
  $('#creditsBar').style.width = (state.credits / state.maxCredits * 100) + '%';
  $('#userName').textContent = state.profile.name;
  $('#userPlan').textContent = state.profile.company;
  $('#userAva').textContent = initials(state.profile.name);

  document.addEventListener('click', onClick);
  $('#upgradeLink').onclick = (e) => { e.preventDefault(); toast('⭐', 'Plans: Scout $49 · Hunter $149 · Pack $399/mo. (Demo)'); };
  $('#resetDemo').onclick = (e) => { e.preventDefault(); localStorage.removeItem(KEY); location.reload(); };
  $('#scrim').onclick = closeDrawer;
  $('#modalScrim').onclick = (e) => { if (e.target.id === 'modalScrim') closeModal(); };
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeDrawer(); closeModal(); } });

  // selection checkboxes (handled here, not in click, to avoid double-toggle)
  document.addEventListener('change', e => {
    const cb = e.target; if (!cb.dataset) return;
    const h = activeHunt();
    if (cb.dataset.action === 'toggle-select' && h) {
      if (cb.checked) h.selected.add(cb.dataset.id); else h.selected.delete(cb.dataset.id);
      updateSelCount();
    }
    if (cb.dataset.action === 'select-all' && h) {
      const on = cb.checked;
      $$('.disc-grid input[data-action="toggle-select"]').forEach(x => {
        if (x.disabled) return; x.checked = on;
        if (on) h.selected.add(x.dataset.id); else h.selected.delete(x.dataset.id);
      });
      updateSelCount();
    }
  });

  refreshBadges();
  if (!state.onboarded) { setView('today'); startOnboarding(); }
  else setView('today');

  // pull in any real prospects Claude Code has researched into data/prospects.json
  loadLiveData();
}
document.addEventListener('DOMContentLoaded', init);
