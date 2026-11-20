// Leonida Trophy Guide: checklist, filters, spoiler mode, roadmap and per-trophy guides.
// All data comes from data/trophies.json. Progress lives in localStorage only.
// No network requests: the app loads its own files and nothing else.

const KEY = 'leonida-trophy-guide-v1';
const SPOILER_KEY = 'leonida-trophy-guide-spoiler';
const DEMO_EARNED = [2, 3, 4, 8, 15, 16, 20, 21, 28, 35, 42, 44];

const STAGES = [
  { n: 1, title: 'Play the story', text: 'Chapters 1 to 4, the named missions and the final mission. Story trophies pop as you go. Do the named missions when they appear.' },
  { n: 2, title: 'Finish the side stories', text: 'The final missions for Andy, Kenton, Billy, Randy and Tyrone, plus 8 stranger strands. Clear these before the finale so nothing is left behind.' },
  { n: 3, title: 'See all of Leonida', text: 'All 52 areas, meditation spots, card sets, WAiNK It locations, vehicles, garages and gang operations. One long road trip covers most of it.' },
  { n: 4, title: 'Master every activity', text: 'Stunts, shooting range golds, drone races, races, fishing, arcade, hunting, challenges, robberies and the money trophies. The grind stage.' },
  { n: 5, title: 'Platinum', text: '100% completion and the platinum. They pop together at the end, once the last trophy on this list is yours.' },
];

const list = document.getElementById('trophyList');
const searchEl = document.getElementById('search');
const kindEl = document.getElementById('kind');
const gradeEl = document.getElementById('grade');
const showEl = document.getElementById('show');
const spoilerEl = document.getElementById('spoiler');
const missableOnlyEl = document.getElementById('missableOnly');
const sortEl = document.getElementById('sort');
const countText = document.getElementById('countText');
const emptyText = document.getElementById('emptyText');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');

let earned = new Set();
let spoiler = false;
try {
  earned = new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]'));
  spoiler = localStorage.getItem(SPOILER_KEY) === '1';
} catch {
  earned = new Set();
  spoiler = false;
}
spoilerEl.checked = spoiler;

// Demo mode (?demo in the URL) seeds a few earned trophies so a first look shows progress.
// ?spoiler=1 turns spoiler mode on (handy for a link that hides story trophies).
if (new URLSearchParams(location.search).has('demo') && earned.size === 0) {
  for (const id of DEMO_EARNED) earned.add(id);
  save();
}
if (new URLSearchParams(location.search).get('spoiler') === '1') {
  spoiler = true;
  spoilerEl.checked = true;
  save();
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify([...earned]));
    localStorage.setItem(SPOILER_KEY, spoiler ? '1' : '0');
  } catch { /* storage unavailable, progress just does not persist */ }
}

const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;

function stageOf(t) {
  return STAGES.find((s) => s.n === t.stage) ?? STAGES[0];
}

function isHiddenFromSpoiler(t) {
  return spoiler && t.hidden && !earned.has(t.id);
}

function renderStages() {
  const ol = document.getElementById('stages');
  ol.replaceChildren();
  for (const s of STAGES) {
    const count = trophies.filter((t) => t.stage === s.n).length;
    const li = document.createElement('li');
    const h = document.createElement('h3');
    h.textContent = 'Stage ' + s.n + ': ' + s.title + ' (' + count + ' trophies)';
    const p = document.createElement('p');
    p.textContent = s.text;
    li.append(h, p);
    ol.append(li);
  }
}

function gradeLabel(g) {
  return g.charAt(0).toUpperCase() + g.slice(1);
}

function render() {
  const q = searchEl.value.trim().toLowerCase();
  const kind = kindEl.value;
  const grade = gradeEl.value;
  const show = showEl.value;
  const missableOnly = missableOnlyEl.checked;
  const sort = sortEl.value;

  const GRADE_RANK = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
  const ordered = [...trophies].sort((a, b) => {
    if (sort === 'grade') return GRADE_RANK[a.grade] - GRADE_RANK[b.grade] || a.id - b.id;
    if (sort === 'name') return a.name.localeCompare(b.name);
    return a.stage - b.stage || a.id - b.id;
  });

  let shown = 0;
  list.replaceChildren();
  for (const t of ordered) {
    if (grade !== 'all' && t.grade !== grade) continue;
    if (kind !== 'all' && !t.kinds.includes(kind)) continue;
    if (missableOnly && !t.missable) continue;
    if (show === 'earned' && !earned.has(t.id)) continue;
    if (show === 'todo' && earned.has(t.id)) continue;
    if (q) {
      const hay = (t.name + ' ' + t.description + ' ' + t.guide + ' ' + t.kinds.join(' ')).toLowerCase();
      if (!hay.includes(q)) continue;
    }

    shown++;
    const li = document.createElement('li');
    li.className = 'trophy-card grade-' + t.grade + (earned.has(t.id) ? ' is-earned' : '');
    li.dataset.id = String(t.id);

    const box = document.createElement('input');
    box.type = 'checkbox';
    box.className = 'trophy-check';
    box.checked = earned.has(t.id);
    box.setAttribute('aria-label', 'Earned: ' + t.name);
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.id);
      else earned.delete(t.id);
      save();
      render();
    });

    const body = document.createElement('div');
    body.className = 'trophy-body';

    const name = document.createElement('button');
    name.type = 'button';
    name.className = 'trophy-name';
    name.textContent = isHiddenFromSpoiler(t) ? 'Hidden trophy' : t.name;
    name.addEventListener('click', () => openDetail(t.id));

    const desc = document.createElement('p');
    desc.className = 'trophy-desc';
    desc.textContent = isHiddenFromSpoiler(t) ? 'A story trophy. Earn it to reveal its name and description.' : t.description;

    const tags = document.createElement('p');
    tags.className = 'trophy-tags';
    const parts = [gradeLabel(t.grade)];
    if (t.count) parts.push('Count: ' + t.count.toLocaleString('en-US'));
    parts.push('Stage ' + t.stage);
    for (const k of t.kinds) parts.push(k);
    if (t.missable) parts.push('MISSABLE');
    if (t.hidden) parts.push('Hidden on PSN');
    tags.textContent = parts.join(' · ');

    body.append(name, desc, tags);
    li.append(box, body);
    list.append(li);
  }

  emptyText.hidden = shown !== 0;
  countText.textContent = shown + ' of ' + trophies.length + ' trophies shown · ' + earned.size + ' earned';
  const pct = Math.round((earned.size / trophies.length) * 100);
  progressFill.style.width = pct + '%';
  progressText.textContent = earned.size + ' of ' + trophies.length + ' earned · ' + pct + '%';
}

function openDetail(id) {
  const t = trophies.find((x) => x.id === id);
  if (!t) return;
  const d = document.getElementById('detail');
  document.getElementById('detailGrade').textContent = gradeLabel(t.grade) + ' trophy · Stage ' + t.stage;
  document.getElementById('detailName').textContent = isHiddenFromSpoiler(t) ? 'Hidden trophy' : t.name;
  document.getElementById('detailDesc').textContent = isHiddenFromSpoiler(t) ? 'A story trophy. Earn it to reveal its name and description.' : t.description;
  const meta = document.getElementById('detailMeta');
  meta.replaceChildren();
  const chips = [];
  if (t.count) chips.push('Count: ' + t.count.toLocaleString('en-US'));
  if (t.missable) chips.push('MISSABLE: tied to a specific mission, choice or moment');
  if (t.hidden) chips.push('Hidden on PlayStation until earned');
  chips.push('Kinds: ' + t.kinds.join(', '));
  for (const c of chips) {
    const s = document.createElement('span');
    s.className = 'chip';
    s.textContent = c;
    meta.append(s);
  }
  document.getElementById('detailGuide').textContent = t.guide;
  const src = document.getElementById('detailSources');
  src.replaceChildren();
  for (const s of t.sources) {
    const li = document.createElement('li');
    li.textContent = s;
    src.append(li);
  }
  const earnedBox = document.getElementById('detailEarned');
  earnedBox.checked = earned.has(t.id);
  earnedBox.onchange = () => {
    if (earnedBox.checked) earned.add(t.id);
    else earned.delete(t.id);
    save();
    render();
  };
  d.hidden = false;
  history.replaceState(null, '', '#trophy=' + t.id);
  document.getElementById('detailClose').focus();
}

function closeDetail() {
  document.getElementById('detail').hidden = true;
  history.replaceState(null, '', location.pathname + location.search);
}

document.getElementById('detailClose').addEventListener('click', closeDetail);
document.getElementById('detail').addEventListener('click', (e) => {
  if (e.target.id === 'detail') closeDetail();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeDetail();
});

document.getElementById('export').addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify({ game: 'Grand Theft Auto VI', earned: [...earned].sort((x, y) => x - y) }, null, 2)], { type: 'application/json' }));
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});
document.getElementById('import').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const ids = Array.isArray(data) ? data : data.earned;
    earned = new Set(ids.filter((id) => trophies.some((t) => t.id === id)));
    save();
    render();
  } catch {
    alert('That file is not a progress export from this guide.');
  }
  e.target.value = '';
});
document.getElementById('reset').addEventListener('click', () => {
  if (!confirm('Clear all earned trophies?')) return;
  earned = new Set();
  save();
  render();
});

spoilerEl.addEventListener('change', () => {
  spoiler = spoilerEl.checked;
  save();
  render();
});
for (const el of [searchEl, kindEl, gradeEl, showEl, sortEl, missableOnlyEl]) {
  el.addEventListener('input', render);
  el.addEventListener('change', render);
}

renderStages();
render();

// Deep link: #trophy=<id> opens that trophy, #view=roadmap scrolls to the roadmap.
const hash = new URLSearchParams(location.hash.slice(1));
if (hash.has('trophy')) {
  const id = Number(hash.get('trophy'));
  if (trophies.some((t) => t.id === id)) openDetail(id);
} else if (hash.get('view') === 'roadmap') {
  document.getElementById('roadmap').scrollIntoView();
}
if (new URLSearchParams(location.search).has('filter')) {
  const f = new URLSearchParams(location.search).get('filter');
  if (['story', 'missable', 'collectibles', 'activities', 'online'].includes(f)) {
    kindEl.value = f;
    render();
  }
}
