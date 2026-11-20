// Leonida Trophy Atlas: checklist, filters, spoiler mode, roadmap, per-trophy guides.
// Data comes from data/trophies.json. Progress lives in localStorage only.
// No network requests: the app loads its own files and nothing else.

const SAVE_KEY = 'leonida-trophy-atlas-v1';
const SPOILER_SAVE_KEY = 'leonida-trophy-atlas-spoiler';
const SEED_EARNED = [2, 3, 5, 8, 16, 21, 28, 35, 42, 44, 52, 55];

const ROADMAP = [
  { stage: 1, title: 'Play the story', body: 'Chapters 1 to 4, the named missions and the final mission. Story trophies pop as you go. Do the named missions when they appear.' },
  { stage: 2, title: 'Finish the side stories', body: 'The final missions for Andy, Kenton, Billy, Randy and Tyrone, plus 8 stranger strands and the partner moments. Clear these before the finale.' },
  { stage: 3, title: 'See all of Leonida', body: 'All 52 areas, meditation spots, card sets, WAiNK It locations, vehicles, garages and gang operations. One long road trip covers most of it.' },
  { stage: 4, title: 'Master every activity', body: 'Stunts, shooting range golds, drone races, races, fishing, arcade, hunting, challenges, robberies and the money trophies. The grind stage.' },
  { stage: 5, title: 'Platinum', body: '100% completion and the platinum. They pop together at the end, once the last trophy on this list is yours.' },
];

const cardList = document.getElementById('cardList');
const searchBox = document.getElementById('searchBox');
const kindFilter = document.getElementById('kindFilter');
const gradeFilter = document.getElementById('gradeFilter');
const statusFilter = document.getElementById('statusFilter');
const sortOrder = document.getElementById('sortOrder');
const spoilerToggle = document.getElementById('spoilerToggle');
const missableToggle = document.getElementById('missableToggle');
const resultCount = document.getElementById('resultCount');
const noMatch = document.getElementById('noMatch');
const meterFill = document.getElementById('meterFill');
const meterText = document.getElementById('meterText');

let earnedIds = new Set();
let spoilerOn = false;
try {
  earnedIds = new Set(JSON.parse(localStorage.getItem(SAVE_KEY) ?? '[]'));
  spoilerOn = localStorage.getItem(SPOILER_SAVE_KEY) === '1';
} catch {
  earnedIds = new Set();
  spoilerOn = false;
}
spoilerToggle.checked = spoilerOn;

// ?demo seeds a few earned trophies so a first look shows progress.
// ?spoiler=1 turns spoiler mode on. ?filter=story (or missable, collectibles,
// activities, online) starts on that kind filter.
const params = new URLSearchParams(location.search);
if (params.has('demo') && earnedIds.size === 0) {
  for (const id of SEED_EARNED) earnedIds.add(id);
  persist();
}
if (params.get('spoiler') === '1') {
  spoilerOn = true;
  spoilerToggle.checked = true;
  persist();
}

function persist() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify([...earnedIds]));
    localStorage.setItem(SPOILER_SAVE_KEY, spoilerOn ? '1' : '0');
  } catch { /* storage unavailable: progress just does not persist */ }
}

const data = await (await fetch('data/trophies.json')).json();
const all = data.trophies;

// The header counts come from the data, not from hardcoded numbers.
const byGrade = (g) => all.filter((t) => t.grade === g).length;
document.getElementById('statPlatinum').textContent = byGrade('platinum');
document.getElementById('statGold').textContent = byGrade('gold');
document.getElementById('statSilver').textContent = byGrade('silver');
document.getElementById('statBronze').textContent = byGrade('bronze');
document.getElementById('statHidden').textContent = all.filter((t) => t.hidden).length;
document.getElementById('statMissable').textContent = all.filter((t) => t.missable).length;

function stageInfo(t) {
  return ROADMAP.find((s) => s.stage === t.stage) ?? ROADMAP[0];
}

function spoilerHides(t) {
  return spoilerOn && t.hidden && !earnedIds.has(t.id);
}

function buildRoadmap() {
  const grid = document.getElementById('stageGrid');
  grid.replaceChildren();
  for (const s of ROADMAP) {
    const inStage = all.filter((t) => t.stage === s.stage);
    const done = inStage.filter((t) => earnedIds.has(t.id)).length;
    const li = document.createElement('li');
    const h = document.createElement('h3');
    h.textContent = 'Stage ' + s.stage + ': ' + s.title + ' (' + done + '/' + inStage.length + ')';
    const p = document.createElement('p');
    p.textContent = s.body;
    li.append(h, p);
    grid.append(li);
  }
}

function gradeWord(g) {
  return g.charAt(0).toUpperCase() + g.slice(1);
}

function applyFilters() {
  const q = searchBox.value.trim().toLowerCase();
  const kind = kindFilter.value;
  const grade = gradeFilter.value;
  const status = statusFilter.value;
  const onlyMissable = missableToggle.checked;
  const order = sortOrder.value;

  const RANK = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
  const ordered = [...all].sort((a, b) => {
    if (order === 'grade') return RANK[a.grade] - RANK[b.grade] || a.id - b.id;
    if (order === 'name') return a.name.localeCompare(b.name);
    return a.stage - b.stage || a.id - b.id;
  });

  let visible = 0;
  cardList.replaceChildren();
  for (const t of ordered) {
    if (grade !== 'all' && t.grade !== grade) continue;
    if (kind !== 'all' && !t.kinds.includes(kind)) continue;
    if (onlyMissable && !t.missable) continue;
    if (status === 'earned' && !earnedIds.has(t.id)) continue;
    if (status === 'todo' && earnedIds.has(t.id)) continue;
    if (q) {
      const hay = (t.name + ' ' + t.description + ' ' + t.guide + ' ' + t.kinds.join(' ')).toLowerCase();
      if (!hay.includes(q)) continue;
    }

    visible++;
    const li = document.createElement('li');
    li.className = 'card grade-' + t.grade + (earnedIds.has(t.id) ? ' is-earned' : '');
    li.dataset.id = String(t.id);

    const box = document.createElement('input');
    box.type = 'checkbox';
    box.className = 'card-check';
    box.checked = earnedIds.has(t.id);
    box.setAttribute('aria-label', 'Earned: ' + t.name);
    box.addEventListener('change', () => {
      if (box.checked) earnedIds.add(t.id);
      else earnedIds.delete(t.id);
      persist();
      refresh();
    });

    const body = document.createElement('div');
    body.className = 'card-body';

    const nameBtn = document.createElement('button');
    nameBtn.type = 'button';
    nameBtn.className = 'card-name';
    nameBtn.textContent = spoilerHides(t) ? 'Hidden trophy' : t.name;
    nameBtn.addEventListener('click', () => openSheet(t.id));

    const desc = document.createElement('p');
    desc.className = 'card-desc';
    desc.textContent = spoilerHides(t) ? 'A story trophy. Earn it to reveal its name and description.' : t.description;

    const tags = document.createElement('p');
    tags.className = 'card-tags';
    const bits = [gradeWord(t.grade)];
    if (t.count) bits.push('Target: ' + t.count.toLocaleString('en-US'));
    bits.push('Stage ' + t.stage);
    for (const k of t.kinds) bits.push(k);
    if (t.missable) bits.push('MISSABLE');
    if (t.hidden) bits.push('Hidden on PSN');
    tags.textContent = bits.join(' · ');

    body.append(nameBtn, desc, tags);
    li.append(box, body);
    cardList.append(li);
  }

  noMatch.hidden = visible !== 0;
  resultCount.textContent = visible + ' of ' + all.length + ' trophies shown · ' + earnedIds.size + ' earned';
  const pct = Math.round((earnedIds.size / all.length) * 100);
  meterFill.style.width = pct + '%';
  meterText.textContent = earnedIds.size + ' of ' + all.length + ' earned · ' + pct + '%';
}

function refresh() {
  buildRoadmap();
  applyFilters();
}

function openSheet(id) {
  const t = all.find((x) => x.id === id);
  if (!t) return;
  const overlay = document.getElementById('overlay');
  document.getElementById('overlayGrade').textContent = gradeWord(t.grade) + ' trophy · Stage ' + t.stage;
  document.getElementById('overlayName').textContent = spoilerHides(t) ? 'Hidden trophy' : t.name;
  document.getElementById('overlayDesc').textContent = spoilerHides(t) ? 'A story trophy. Earn it to reveal its name and description.' : t.description;
  const chips = document.getElementById('overlayChips');
  chips.replaceChildren();
  const notes = [];
  if (t.count) notes.push('Target: ' + t.count.toLocaleString('en-US'));
  if (t.missable) notes.push('MISSABLE: tied to one mission, choice or moment');
  if (t.hidden) notes.push('Hidden on PlayStation until earned');
  notes.push('Kinds: ' + t.kinds.join(', '));
  for (const n of notes) {
    const s = document.createElement('span');
    s.textContent = n;
    chips.append(s);
  }
  document.getElementById('overlayGuide').textContent = t.guide;
  const src = document.getElementById('overlaySources');
  src.replaceChildren();
  for (const s of t.sources) {
    const li = document.createElement('li');
    li.textContent = s;
    src.append(li);
  }
  const earnedBox = document.getElementById('overlayEarned');
  earnedBox.checked = earnedIds.has(t.id);
  earnedBox.onchange = () => {
    if (earnedBox.checked) earnedIds.add(t.id);
    else earnedIds.delete(t.id);
    persist();
    refresh();
  };
  overlay.hidden = false;
  history.replaceState(null, '', '#trophy=' + t.id);
  document.getElementById('overlayClose').focus();
}

function closeSheet() {
  document.getElementById('overlay').hidden = true;
  history.replaceState(null, '', location.pathname + location.search);
}

document.getElementById('overlayClose').addEventListener('click', closeSheet);
document.getElementById('overlay').addEventListener('click', (e) => {
  if (e.target.id === 'overlay') closeSheet();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeSheet();
});

document.getElementById('exportBtn').addEventListener('click', () => {
  const payload = JSON.stringify({ game: 'Grand Theft Auto VI', earned: [...earnedIds].sort((a, b) => a - b) }, null, 2);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});
document.getElementById('importFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    const ids = Array.isArray(parsed) ? parsed : parsed.earned;
    earnedIds = new Set(ids.filter((id) => all.some((t) => t.id === id)));
    persist();
    refresh();
  } catch {
    alert('That file is not a progress export from this guide.');
  }
  e.target.value = '';
});
document.getElementById('resetBtn').addEventListener('click', () => {
  if (!confirm('Clear all earned trophies?')) return;
  earnedIds = new Set();
  persist();
  refresh();
});

spoilerToggle.addEventListener('change', () => {
  spoilerOn = spoilerToggle.checked;
  persist();
  refresh();
});
for (const el of [searchBox, kindFilter, gradeFilter, statusFilter, sortOrder, missableToggle]) {
  el.addEventListener('input', applyFilters);
  el.addEventListener('change', applyFilters);
}

refresh();

// Deep links: #trophy=<id> opens one trophy, #view=roadmap scrolls to the roadmap.
const hash = new URLSearchParams(location.hash.slice(1));
if (hash.has('trophy')) {
  const id = Number(hash.get('trophy'));
  if (all.some((t) => t.id === id)) openSheet(id);
} else if (hash.get('view') === 'roadmap') {
  document.getElementById('roadmap').scrollIntoView();
}
if (params.has('filter')) {
  const f = params.get('filter');
  if (['story', 'missable', 'collectibles', 'activities', 'online'].includes(f)) {
    kindFilter.value = f;
    applyFilters();
  }
}
