// NEON LEONIDA — GTA VI trophy guide & tracker. Static, offline, localStorage only.
// Every guide is written in our own words; each trophy cites its source in data/trophies.json.
const KEY_EARNED = 'neon-leonida-earned-v1';
const KEY_NOTES = 'neon-leonida-notes-v1';
const KEY_COUNTS = 'neon-leonida-counts-v1';
const KEY_SETTINGS = 'neon-leonida-settings-v1';
const DEMO_EARNED = [2, 3, 4, 5, 8, 9, 16, 20, 21, 35, 42, 53, 55];

const STAGES = [
  { n: 1, title: 'Story — Chapters 1–2', text: 'Open the game, finish Gone Fishing and Chapter 1, then Chapter 2. Grab the Chapter 1 balcony meditation before it vanishes — the only missable moment in the game.' },
  { n: 2, title: 'Story — Chapters 3–5', text: 'Vice City opens: the Key Cloner, partner play, bank vaults and the finale. The story trophies keep popping on their own.' },
  { n: 3, title: 'Side strands', text: 'Finish the questlines: Andy (Lucia), Kenton, Billy, Randy and Tyrone (Jason), plus Bret’s hunts. All still open after the story.' },
  { n: 4, title: 'Robberies & money', text: 'Gang operations, bank vaults, armored trucks, Payday Loans, fences and laundering — the fastest money in the game, and most of it required for 100%.' },
  { n: 5, title: 'Activities & skill', text: 'Stunts, shooting ranges, drone races, races, fishing, arcade, WAiNK scans and vehicle discovery. Grindable, trackable, and mostly fun.' },
  { n: 6, title: 'Collectibles & secrets', text: 'Cards, meditations, animals, the full map, and the five trophies the community only just confirmed. No more unknowns.' },
  { n: 7, title: 'Cleanup — 100% & platinum', text: 'The 100% checklist, the last challenges, the last shops and garages, and the platinum itself.' },
];

const CHECKLIST_100 = [
  { label: 'Base-model vehicles scanned', need: 200, total: 277 },
  { label: 'Animals studied', need: 100, total: 255 },
  { label: 'Challenges completed', need: 70, total: 80 },
  { label: 'Optional missions', need: 100, total: 200 },
  { label: 'Stunts completed', need: 300, total: 397 },
  { label: 'Meditations', need: 15, total: 18 },
  { label: 'Collectible card sets', need: 3, total: 18 },
  { label: 'Target decks (Bret)', need: 15, total: 15 },
  { label: 'Bank vaults robbed', need: 8, total: 8 },
  { label: 'Gang operations robbed', need: 39, total: 39 },
  { label: 'Drone races won', need: 42, total: 42 },
  { label: 'Shooting Range gold medals', need: 42, total: 42 },
  { label: 'WAiNK scans', need: 100, total: 100 },
  { label: 'Garages owned', need: 8, total: 12 },
];

const KIND_LABELS = { story: 'Story', quest: 'Quest', collectibles: 'Collectible', activities: 'Activity', robbery: 'Robbery', misc: 'Misc' };

let stageFilter = null; // set by a roadmap stage's "See these trophies" button; session-only, not saved

function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback; } catch { return fallback; }
}
function saveJSON(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

const params = new URLSearchParams(location.search);
let earned = new Set(loadJSON(KEY_EARNED, []));
let notes = loadJSON(KEY_NOTES, {});
let counts = loadJSON(KEY_COUNTS, {});
let settings = loadJSON(KEY_SETTINGS, { kind: 'all', grade: 'all', query: '', spoilersOff: false, hideEarned: false });

if (params.get('seed') === 'demo' && earned.size === 0) {
  earned = new Set(DEMO_EARNED);
  saveJSON(KEY_EARNED, [...earned]);
}
if (params.get('spoilers') === 'off') settings.spoilersOff = true;

const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;
const byId = new Map(trophies.map((t) => [t.id, t]));

const $ = (id) => document.getElementById(id);
const ringFill = $('ringFill');
const CIRC = 2 * Math.PI * 52;

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined && text !== null) n.textContent = text;
  return n;
}

function renderRing() {
  const n = earned.size;
  $('earnedCount').textContent = `${n}/55`;
  $('earnedPct').textContent = `${Math.round((n / 55) * 100)}% to platinum`;
  ringFill.style.strokeDashoffset = String(CIRC * (1 - n / 55));
}

function medalNode(t) {
  const m = el('span', `medal ${t.grade}`, { platinum: 'P', gold: 'G', silver: 'S', bronze: 'B' }[t.grade]);
  m.title = t.grade;
  return m;
}

function trophyTags(t) {
  const tags = el('div', 'tags');
  tags.append(el('span', 'tag', KIND_LABELS[t.kind] ?? t.kind));
  tags.append(el('span', 'tag', t.grade));
  if (t.hidden) tags.append(el('span', 'tag hidden', 'Hidden'));
  if (t.missable) tags.append(el('span', 'tag missable', 'Missable'));
  if (t.count) tags.append(el('span', 'tag count', `${t.count} ${t.count_label ?? ''}`.trim()));
  if (t.guide.includes('CONFIRMED 20 Nov 2026')) tags.append(el('span', 'tag confirmed', '✓ Confirmed 20 Nov'));
  return tags;
}

function spoilerHidden(t) {
  return settings.spoilersOff && t.hidden && !earned.has(t.id);
}

function renderRoadmap() {
  const wrap = $('roadmap');
  wrap.replaceChildren();
  for (const stage of STAGES) {
    const members = trophies.filter((t) => t.roadmap === stage.n);
    const done = members.filter((t) => earned.has(t.id)).length;
    const card = el('div', 'stage');
    const h = el('h3');
    h.append(el('span', 'stage-num', String(stage.n)), document.createTextNode(` ${stage.title}`));
    card.append(h);
    card.append(el('p', null, stage.text));
    const bar = el('div', 'bar');
    const fill = el('i');
    fill.style.width = `${members.length ? (done / members.length) * 100 : 0}%`;
    bar.append(fill);
    card.append(bar);
    card.append(el('div', 'stage-count', `${done} of ${members.length} trophies earned`));
    const names = el('div', 'stage-trophies', members.map((t) => (earned.has(t.id) ? '✓ ' : '· ') + t.name).join('  •  '));
    card.append(names);
    const jump = el('button', 'stage-link', `See these ${members.length} trophies →`);
    jump.addEventListener('click', () => {
      stageFilter = stage.n;
      setView('checklist');
      renderChecklist();
      window.scrollTo(0, 0);
    });
    card.append(jump);
    wrap.append(card);
  }
  renderNextUp($('nextUp'));
  renderNextUp($('nextUpComplete'));
}

function nextUpList() {
  return trophies
    .filter((t) => !earned.has(t.id))
    .sort((a, b) => a.roadmap - b.roadmap || a.id - b.id)
    .slice(0, 5);
}

function renderNextUp(box) {
  box.replaceChildren();
  box.append(el('h3', null, 'Next up — your next 5 trophies'));
  const ol = el('ol');
  for (const t of nextUpList()) {
    const li = el('li');
    const b = el('b', null, t.name);
    li.append(b, document.createTextNode(` — ${t.description} (Stage ${t.roadmap}, ${t.grade})`));
    ol.append(li);
  }
  box.append(ol);
}

function renderChecklist() {
  const list = $('trophyList');
  list.replaceChildren();
  const q = settings.query.trim().toLowerCase();
  const shown = trophies.filter((t) => {
    if (stageFilter && t.roadmap !== stageFilter) return false;
    if (settings.kind === 'missable' && !t.missable) return false;
    if (settings.kind === 'hidden' && !t.hidden) return false;
    if (settings.kind !== 'all' && settings.kind !== 'missable' && settings.kind !== 'hidden' && t.kind !== settings.kind) return false;
    if (settings.grade !== 'all' && t.grade !== settings.grade) return false;
    if (settings.hideEarned && earned.has(t.id)) return false;
    if (q && !(t.name + ' ' + t.description + ' ' + t.guide).toLowerCase().includes(q)) return false;
    return true;
  });
  const meta = $('listMeta');
  meta.replaceChildren();
  meta.append(document.createTextNode(`${shown.length} of 55 shown — ${earned.size} earned, ${55 - earned.size} to go. Click a trophy to read its guide and source.`));
  if (stageFilter) {
    const clear = el('button', 'clear-stage', `✕ clear Stage ${stageFilter} filter`);
    clear.addEventListener('click', () => { stageFilter = null; renderChecklist(); });
    meta.append(document.createTextNode(' '), clear);
  }
  for (const t of shown) {
    const card = el('div', 'trophy' + (earned.has(t.id) ? ' earned' : ''));
    card.dataset.trophy = String(t.id);
    const head = el('div', 'trophy-head');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.id);
    box.setAttribute('aria-label', `Mark ${t.name} earned`);
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.id); else earned.delete(t.id);
      saveJSON(KEY_EARNED, [...earned]);
      renderRing();
      renderRoadmap();
      renderChecklist();
    });
    head.append(box, medalNode(t));
    const title = el('div', 'trophy-title');
    if (spoilerHidden(t)) {
      title.append(el('b', null, 'Hidden trophy'));
      title.append(el('div', 'spoiler-hidden', 'Spoilers are off — earn it to reveal its name and guide.'));
    } else {
      title.append(el('b', null, t.name));
      title.append(el('div', 'desc', t.description));
    }
    title.append(trophyTags(t));
    head.append(title);
    const detail = el('div', 'trophy-detail');
    detail.hidden = !(params.get('open') === String(t.id));
    if (!spoilerHidden(t)) {
      detail.append(el('p', null, t.guide));
      const src = el('p', 'source');
      src.append(document.createTextNode('Source: '));
      const a = el('a', null, t.source);
      a.href = t.source_url;
      a.target = '_blank';
      a.rel = 'noopener';
      src.append(a);
      detail.append(src);
      if (t.count) {
        const counter = el('div', 'counter');
        const minus = el('button', null, '−');
        const val = el('span', null, `${counts[t.id] ?? 0} / ${t.count} ${t.count_label ?? ''}`.trim());
        const plus = el('button', null, '+');
        const bump = (d) => {
          const next = Math.max(0, Math.min(t.count, (counts[t.id] ?? 0) + d));
          counts[t.id] = next;
          saveJSON(KEY_COUNTS, counts);
          val.textContent = `${next} / ${t.count} ${t.count_label ?? ''}`.trim();
        };
        minus.addEventListener('click', () => bump(-1));
        plus.addEventListener('click', () => bump(1));
        counter.append(el('span', null, 'Your progress:'), minus, val, plus);
        detail.append(counter);
      }
      const noteLabel = el('label', null, 'Your notes');
      const note = document.createElement('textarea');
      note.value = notes[t.id] ?? '';
      note.placeholder = 'e.g. found the Banshee at the south showroom…';
      note.addEventListener('input', () => {
        notes[t.id] = note.value;
        saveJSON(KEY_NOTES, notes);
      });
      noteLabel.append(note);
      detail.append(noteLabel);
    }
    head.addEventListener('click', (e) => {
      if (e.target === box) return;
      detail.hidden = !detail.hidden;
    });
    card.append(head, detail);
    list.append(card);
  }
  // Deep-link support (?open=<id>): bring the opened trophy into view so its guide is visible.
  const openId = Number(params.get('open'));
  if (openId) {
    const target = list.querySelector(`[data-trophy="${openId}"]`);
    if (target) target.scrollIntoView({ block: 'start' });
  }
}

function renderMissables() {
  const wrap = $('missableList');
  wrap.replaceChildren();
  const t = trophies.find((x) => x.missable);
  const card = el('div', 'trophy');
  const head = el('div', 'trophy-head');
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = earned.has(t.id);
  box.addEventListener('change', () => {
    if (box.checked) earned.add(t.id); else earned.delete(t.id);
    saveJSON(KEY_EARNED, [...earned]);
    renderRing();
    renderRoadmap();
  });
  head.append(box, medalNode(t));
  const title = el('div', 'trophy-title');
  title.append(el('b', null, t.name));
  title.append(el('div', 'desc', t.description));
  title.append(trophyTags(t));
  head.append(title);
  const detail = el('div', 'trophy-detail');
  detail.append(el('p', null, t.guide));
  const src = el('p', 'source');
  src.append(document.createTextNode('Source: '));
  const a = el('a', null, t.source);
  a.href = t.source_url;
  a.target = '_blank';
  a.rel = 'noopener';
  src.append(a);
  detail.append(src);
  card.append(head, detail);
  wrap.append(card);
}

function renderCounters() {
  const wrap = $('counters');
  wrap.replaceChildren();
  for (const c of CHECKLIST_100) {
    const card = el('div', 'counter-card');
    card.append(el('b', null, `${c.need} / ${c.total}`));
    card.append(el('span', null, c.label));
    const bar = el('div', 'bar');
    const fill = el('i');
    fill.style.width = `${Math.round((c.need / c.total) * 100)}%`;
    bar.append(fill);
    card.append(bar);
    wrap.append(card);
  }
}

function setView(name) {
  for (const btn of document.querySelectorAll('#tabs button')) btn.classList.toggle('active', btn.dataset.view === name);
  for (const sec of document.querySelectorAll('.view')) sec.classList.toggle('active', sec.id === `view-${name}`);
}

for (const btn of document.querySelectorAll('#tabs button')) {
  btn.addEventListener('click', () => setView(btn.dataset.view));
}
for (const chip of document.querySelectorAll('#kindChips button')) {
  chip.addEventListener('click', () => {
    settings.kind = chip.dataset.kind;
    saveJSON(KEY_SETTINGS, settings);
    for (const c of document.querySelectorAll('#kindChips button')) c.classList.toggle('active', c === chip);
    renderChecklist();
  });
}
$('gradeFilter').addEventListener('change', (e) => {
  settings.grade = e.target.value;
  saveJSON(KEY_SETTINGS, settings);
  renderChecklist();
});
$('search').addEventListener('input', (e) => {
  settings.query = e.target.value;
  renderChecklist();
});
$('spoilerToggle').addEventListener('change', (e) => {
  settings.spoilersOff = e.target.checked;
  saveJSON(KEY_SETTINGS, settings);
  renderChecklist();
});
$('hideEarned').addEventListener('change', (e) => {
  settings.hideEarned = e.target.checked;
  saveJSON(KEY_SETTINGS, settings);
  renderChecklist();
});
$('exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ earned: [...earned], notes, counts }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'neon-leonida-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});
$('importFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (Array.isArray(data.earned)) earned = new Set(data.earned.filter((id) => byId.has(id)));
    if (data.notes && typeof data.notes === 'object') notes = data.notes;
    if (data.counts && typeof data.counts === 'object') counts = data.counts;
    saveJSON(KEY_EARNED, [...earned]);
    saveJSON(KEY_NOTES, notes);
    saveJSON(KEY_COUNTS, counts);
    renderRing();
    renderRoadmap();
    renderChecklist();
    renderMissables();
  } catch { alert('That file is not a valid NEON LEONIDA export.'); }
});
$('resetBtn').addEventListener('click', () => {
  if (!confirm('Clear all earned trophies, notes and counters?')) return;
  earned = new Set();
  notes = {};
  counts = {};
  saveJSON(KEY_EARNED, []);
  saveJSON(KEY_NOTES, notes);
  saveJSON(KEY_COUNTS, counts);
  renderRing();
  renderRoadmap();
  renderChecklist();
  renderMissables();
});

// Restore saved settings into the controls, then render everything.
for (const c of document.querySelectorAll('#kindChips button')) c.classList.toggle('active', c.dataset.kind === settings.kind);
$('gradeFilter').value = settings.grade;
$('search').value = settings.query;
$('spoilerToggle').checked = settings.spoilersOff;
$('hideEarned').checked = settings.hideEarned;

// Pick the requested view BEFORE rendering, so deep-links (?open=<id>) can scroll the opened card into view.
if (params.get('view')) setView(params.get('view'));
renderRing();
renderRoadmap();
renderChecklist();
renderMissables();
renderCounters();
