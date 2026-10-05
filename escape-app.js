// 문 너머 방탈출 화면입니다. 규칙은 escape-engine.js, 그림은 escape-art.js, 기기 차이는 platform.js가 맡습니다.
// 배포 때 브라우저가 옛 파일과 새 파일을 섞어 쓰지 않도록 모든 상대 경로에 같은 버전 꼬리표(?v=)를 붙입니다.
import {
  SAVE_KEY_V2, VIEW_W, VIEW_H, NAV_TOP, HINT_MAX, PIN_ZONE, ROTATIONS, SEQUENCE_LOCKS, freshState, tap, combine, inputLock, move, jump,
  activeGoal, requestHint, hintsUsed, recoverSave, hotspotsIn, viewAlt, lockIn, lockReady, lockControls, cleanInput, takePhoto,
  needsAutoPhoto, markSeen, progress, episodeOf, roomUnlocked,
} from './escape-engine.js?v=escape-9';
import { drawView, drawItem, setPlates, COLOR_NAMES, DIRECTION_NAMES, SYMBOL_NAMES } from './escape-art.js?v=escape-9';
import { loadText, saveText, onPause, onBack, buzz, share } from './platform.js?v=escape-9';
import { createAnalytics, MILESTONES } from './escape-analytics.js?v=escape-9';
import { createAds, recoverGrowth, GROWTH_KEY } from './escape-ads.js?v=escape-9';
import { GROWTH } from './escape-growth.js?v=escape-9';

const VERSION = 'escape-9';
const app = document.querySelector('#app');
const sheet = document.querySelector('#sheet');
const live = document.querySelector('#live');
const params = new URLSearchParams(location.search);
// ?slot=qa 처럼 저장 칸을 나누면 검수 중에도 실제 진행 기록을 건드리지 않습니다.
const slotName = params.get('slot');
const KEY = slotName && /^[a-z0-9-]{1,24}$/i.test(slotName) ? `${SAVE_KEY_V2}.${slotName}` : SAVE_KEY_V2;
// ?unlock=all은 검수용으로 잠긴 방을 모두 엽니다.
const UNLOCK_ALL = params.get('unlock') === 'all';
// 광고 기록도 저장 칸을 따라 나눕니다. ?ads=mock은 웹에서 광고 자리를 흉내 내고, ?debug=analytics는 로그를 콘솔에 보여 줍니다.
const GROWTH_STORE = GROWTH_KEY + KEY.slice(SAVE_KEY_V2.length);
const AD_MOCK = ['mock', 'fail'].includes(params.get('ads')) ? params.get('ads') : false;
// 그림 판(plate)입니다. ?plates=0이면 끄고 예전 SVG 그림만 씁니다. DESIGN_v7.md 참고.
const PLATES_ON = params.get('plates') !== '0';
let plateIndex = null, plateIndexJob = null;
const plateReady = {}, plateJobs = {};
// 8초 안에 받지 못하면 실패로 봅니다. 그 방은 SVG로 그리고, 다음에 방을 열 때 다시 받습니다.
const decodeImage = src => new Promise(resolve => { const img = new Image(); const timer = setTimeout(() => resolve(false), 8000); img.src = src; img.decode().then(() => { clearTimeout(timer); resolve(true); }, () => { clearTimeout(timer); resolve(false); }); });
function loadPlateIndex() {
  if (!PLATES_ON) return Promise.resolve(null);
  return (plateIndexJob ??= fetch(`./plates/manifest.json?v=${VERSION}`).then(res => (res.ok ? res.json() : null)).catch(() => null).then(json => (plateIndex = json)));
}
// 방의 판을 모두 받아 둡니다. 판과 그 조각이 모두 받아진 시점만 쓰고, 나머지 시점은 SVG로 그립니다.
// 받는 동안에는 SVG가 보이고, 다 받으면 true를 돌려줘 화면을 다시 그리게 합니다. 같은 방은 한 번만 받습니다.
function preparePlates(roomId) {
  return (plateJobs[roomId] ??= (async () => {
    const views = (await loadPlateIndex())?.[roomId];
    if (!views) return false;
    const ok = {};
    await Promise.all(Object.entries(views).map(async ([view, entry]) => {
      const srcs = [entry.src, ...Object.values(entry.patches ?? {}).map(p => p.src)];
      if ((await Promise.all(srcs.map(decodeImage))).every(Boolean)) ok[view] = entry;
    }));
    plateReady[roomId] = { ...plateReady[roomId], ...ok };
    setPlates(plateReady);
    if (!Object.keys(ok).length) delete plateJobs[roomId];
    return Object.keys(ok).length > 0;
  })());
}
// 시점 하나의 판만 받습니다. 홈 표지와 화 목록의 작은 그림에 씁니다. 방 전체를 받는 preparePlates와 따로 둡니다.
const viewJobs = {};
function prepareView(roomId, view) {
  return (viewJobs[`${roomId}/${view}`] ??= (async () => {
    const entry = (await loadPlateIndex())?.[roomId]?.[view];
    if (!entry) return false;
    if (plateReady[roomId]?.[view]) return true;
    const srcs = [entry.src, ...Object.values(entry.patches ?? {}).map(p => p.src)];
    if (!(await Promise.all(srcs.map(decodeImage))).every(Boolean)) { delete viewJobs[`${roomId}/${view}`]; return false; }
    plateReady[roomId] = { ...plateReady[roomId], [view]: entry };
    setPlates(plateReady);
    return true;
  })());
}
// 목록 속 그림(svg[data-layer])만 새 그림으로 바꿉니다. 버튼과 초점은 그대로 둡니다.
function swapArt(list, html) {
  if (!list) return;
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  const next = tpl.content.querySelectorAll('svg[data-layer]');
  const now = list.querySelectorAll('svg[data-layer]');
  if (next.length === now.length) now.forEach((el, i) => el.replaceWith(next[i]));
}
// 에피소드 표지 그림입니다. 12장을 같은 구도와 밝기로 따로 만들었습니다(DESIGN_v8.md). 받기 전이나 실패하면 첫 방 그림으로 그립니다.
const coverReady = {};
let coverJob = null;
function loadCovers() {
  if (!PLATES_ON) return Promise.resolve(false);
  return (coverJob ??= fetch(`./plates/covers.json?v=${VERSION}`).then(res => (res.ok ? res.json() : {})).catch(() => ({}))
    .then(list => Promise.all(Object.entries(list).map(async ([id, src]) => { if (await decodeImage(src)) coverReady[id] = src; })))
    .then(() => Object.keys(coverReady).length > 0));
}
const coverArt = ep => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false" data-layer="cover"><image href="${coverReady[ep.id]}" x="0" y="0" width="400" height="300" preserveAspectRatio="xMidYMid slice"/></svg>`;
const coverOf = ep => { const first = roomById(ep.rooms.find(roomById)); if (!first) return null; return [first.id, ep.cover?.view && first.views[ep.cover.view] ? ep.cover.view : first.start]; };
const NAV = { left: [0, NAV_TOP, 88, VIEW_H - NAV_TOP], right: [VIEW_W - 88, NAV_TOP, 88, VIEW_H - NAV_TOP], back: [128, NAV_TOP, 104, VIEW_H - NAV_TOP] };
const NAV_LABEL = { left: '왼쪽으로 돌기', right: '오른쪽으로 돌기', back: '돌아가기' };

const PATHS = {
  back: 'M15 5l-7 7 7 7', left: 'M15 5l-7 7 7 7', right: 'M9 5l7 7-7 7', down: 'M5 9l7 7 7-7',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  camera: 'M4 7h3l2-3h6l2 3h3v13H4V7Zm8 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  bulb: 'M9 18h6m-5 3h4M8 14a6 6 0 1 1 8 0c-1 1-1 2-1 4H9c0-2 0-3-1-4Z',
  menu: 'M4 7h16M4 12h16M4 17h16', close: 'M6 6l12 12M18 6 6 18',
  sound: 'M11 5 6 9H3v6h3l5 4V5Zm4 4a4 4 0 0 1 0 6m3-9a8 8 0 0 1 0 12', mute: 'M11 5 6 9H3v6h3l5 4V5Zm5 5 5 5m0-5-5 5',
  reset: 'M4 4v6h6M5 15a8 8 0 1 0 2-8l-3 3',
  help: 'M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7v.5M12 17h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  door: 'M5 21V3h11v18M3 21h18M13 12h.01', check: 'm5 12 5 5 9-10', plus: 'M12 5v14M5 12h14',
  hand: 'M9 11V5a1.5 1.5 0 0 1 3 0v6m0-1a1.5 1.5 0 0 1 3 0v1m0 0a1.5 1.5 0 0 1 3 0v4a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-3l-2-4a1.5 1.5 0 0 1 2.5-1.5L9 15',
  bag: 'M5 8h14l-1 13H6L5 8Zm4 0V6a3 3 0 0 1 6 0v2', home: 'M3 11l9-7 9 7v9h-6v-6H9v6H3v-9Z',
  clock: 'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0', trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  book: 'M4 4h11a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3V4Zm0 13a3 3 0 0 1 3-3h11', pin: 'M9 4h6l-1 6 3 3H7l3-3-1-6Zm3 9v7',
  share: 'M4 13v7h16v-7M12 3v12m-4-8 4-4 4 4', lock: 'M6 11h12v10H6V11Zm3 0V7a3 3 0 0 1 6 0v4',
  note: 'M6 3h9l4 4v14H6V3Zm9 0v4h4M9 12h7M9 16h5', ribbon: 'M8 3h8v18l-4-4-4 4V3Z',
  star: 'm12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6-4.5-4.2 6.1-.7L12 3Z',
};
const icon = (name, size = 22) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="${PATHS[name]}"/></svg>`;
const e = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const num = n => String(n).padStart(2, '0');
const clock = sec => `${num(Math.floor(sec / 60))}:${num(sec % 60)}`;
const box = ([x, y, w, h]) => `left:${(x / VIEW_W) * 100}%;top:${(y / VIEW_H) * 100}%;width:${(w / VIEW_W) * 100}%;height:${(h / VIEW_H) * 100}%`;
const $ = selector => document.querySelector(selector);
const stars = n => `<span class="stars" role="img" aria-label="난이도 5점 만점에 ${n}점">${Array.from({ length: 5 }, (_, i) => `<i class="${i < n ? 'on' : ''}">★</i>`).join('')}</span>`;

let rooms = [], episodes = [], save = null, room = null, s = null;
let selected = null, zoomItem = null, resume = false, pendingNote = null;
// 합치기 버튼을 누른 물건입니다. 크게 보는 물건이 바뀌면 저절로 풀립니다.
let combineFor = null;
const combining = () => !!zoomItem && combineFor === zoomItem;
let saveTimer = 0, toastTimer = 0, revealTimer = 0, audio = null, saveWarned = false, returnFocus = null;
let artKey = '', pinKey = '';
const fresh = new Set();
// 로그와 광고입니다. init에서 만들고, 만들기 전에는 아무것도 하지 않는 빈 객체를 씁니다.
let analytics = { track() {} }, ads = null, growth = recoverGrowth(null);
let roomFails = 0, firstClear = false, adBusy = false, breakPending = false;
const ROOM_AD = GROWTH.ads.roomAd;

const roomById = id => rooms.find(r => r.id === id);
const unlocked = id => roomUnlocked(episodes, save.rooms, id, UNLOCK_ALL);
const cleared = id => save.rooms[id]?.cleared === true || save.rooms[id]?.escaped === true;
// 아직 한 방도 탈출하지 않은 사람입니다. 처음 하는 방의 힌트에는 광고와 동의 창을 붙이지 않습니다.
const firstRoom = () => !rooms.some(r => cleared(r.id));
const playOrder = () => episodes.flatMap(ep => ep.rooms).map(roomById).filter(Boolean);
const stateSig = () => JSON.stringify([s.flags, s.open, s.got]);
const notesOf = () => s.got.filter(id => ['note', 'secret'].includes(room.items[id]?.kind));

function announce(text) { live.textContent = ''; requestAnimationFrame(() => { live.textContent = text; }); }
function showSaveWarning() {
  if ($('.save-warn')) return;
  const note = document.createElement('p');
  note.className = 'save-warn';
  note.setAttribute('role', 'alert');
  note.textContent = '진행을 저장하지 못했어요. 창을 닫으면 기록이 사라질 수 있어요.';
  app.prepend(note);
}
async function persist() {
  clearTimeout(saveTimer);
  if (!save) return;
  try { await saveText(KEY, JSON.stringify(save)); }
  catch { saveWarned = true; showSaveWarning(); }
}
const scheduleSave = () => { clearTimeout(saveTimer); saveTimer = setTimeout(persist, 250); };

function sfx(kind) {
  if (!save?.sound) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') void audio.resume();
    const notes = { tap: [[660, .04]], pick: [[523, .07], [784, .12]], open: [[392, .09], [523, .09], [659, .16]], light: [[587, .1], [880, .2]], wrong: [[170, .16]], click: [[900, .025]], photo: [[1250, .03], [880, .05]] }[kind] ?? [];
    let t = audio.currentTime;
    for (const [hz, d] of notes) {
      const o = audio.createOscillator(), g = audio.createGain();
      o.type = kind === 'wrong' ? 'triangle' : 'sine';
      o.frequency.value = hz;
      g.gain.setValueAtTime(.05, t);
      g.gain.exponentialRampToValueAtTime(.001, t + d + .12);
      o.connect(g).connect(audio.destination);
      o.start(t); o.stop(t + d + .14);
      t += d;
    }
  } catch { save.sound = false; }
}
function fx(name) {
  const stage = $('#stage');
  if (stage) {
    const cls = `fx-${name}`;
    stage.classList.remove(cls);
    void stage.offsetWidth;
    stage.classList.add(cls);
    setTimeout(() => stage.classList.remove(cls), 700);
  }
  sfx({ rattle: 'wrong', drop: 'pick', light: 'light', photo: 'photo' }[name] ?? 'open');
  if (save.sound) buzz(name === 'rattle' || name === 'photo' ? 'light' : 'heavy');
}
function toast(text, items = [], ms = 2000) {
  const t = $('#toast');
  announce(text);
  if (!t) return;
  t.innerHTML = `${items.map(id => `<span class="toast-item">${drawItem(id)}</span>`).join('')}<span>${e(text)}</span>`;
  t.classList.remove('show');
  void t.offsetWidth;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), ms);
}

function focusKey() {
  const n = document.activeElement;
  if (!n || n === document.body || !n.dataset?.act) return null;
  return `[data-act="${CSS.escape(n.dataset.act)}"]${['id', 'ep', 'i', 'd', 'dir', 'sym', 'key', 'tab'].filter(k => n.dataset[k] !== undefined).map(k => `[data-${k}="${CSS.escape(n.dataset[k])}"]`).join('')}`;
}
function restoreFocus(selector) {
  if (!selector) return;
  const n = $(selector);
  if (n && !n.disabled) n.focus({ preventScroll: true });
}

// 힌트를 두 단계 이상 열면 다음에 누를 곳이 은은하게 빛납니다.
// 목표가 다른 시점에 있으면 그쪽으로 가는 물체나 화살표를 먼저 비춥니다.
const NONE = { items: [], spot: null, nav: null, lock: false, all: false };
function wallOf(viewId, depth = 0) {
  const view = room.views[viewId];
  return view.kind === 'wall' || depth > 6 ? viewId : wallOf(view.back, depth + 1);
}
function stepsTo(from, to, dir) {
  let at = from, n = 0;
  while (at !== to && n < 12) { at = room.views[at][dir]; n++; }
  return at === to ? n : Infinity;
}
function hintFocus() {
  const goal = activeGoal(room, s);
  if (!goal || (s.hints[goal.id] || 0) < 2) return NONE;
  const focus = goal.focus ?? {};
  if (focus.items?.length) return { ...NONE, items: focus.items };
  const target = focus.hotspot ? room.hotspots.find(h => h.id === focus.hotspot)?.view : focus.view;
  if (!target) return NONE;
  if (target === s.view) {
    if (focus.hotspot) return { ...NONE, spot: focus.hotspot };
    const lk = lockIn(room, s.view);
    return lk && !s.open.includes(lk[0]) && lockReady(lk[1], s) ? { ...NONE, lock: true } : { ...NONE, all: true };
  }
  const doorway = hotspotsIn(room, s).find(h => h.actions.some(a => (a.do ?? []).some(x => x.go === target)));
  if (doorway) return { ...NONE, spot: doorway.id };
  if (room.views[s.view].kind === 'zoom') return { ...NONE, nav: 'back' };
  const goalWall = wallOf(target);
  return { ...NONE, nav: stepsTo(s.view, goalWall, 'left') < stepsTo(s.view, goalWall, 'right') ? 'left' : 'right' };
}

// 방 목록: 에피소드를 두 칸씩 카드로 놓습니다. 에피소드의 첫 화는 다른 에피소드와 관계없이 바로 시작할 수 있고,
// 같은 에피소드 안에서만 앞 화를 탈출해야 다음 화가 열립니다.
const starRange = (lo, hi) => `<span class="stars" role="img" aria-label="난이도 5점 만점에 ${lo === hi ? lo : `${lo}~${hi}`}점">${Array.from({ length: 5 }, (_, i) => `<i class="${i < lo ? 'on' : i < hi ? 'part' : ''}">★</i>`).join('')}</span>`;
function episodeState(ep) {
  const built = ep.rooms.map(roomById).filter(Boolean);
  const done = ep.rooms.filter(id => cleared(id)).length;
  const levels = ep.rooms.map(id => roomById(id)?.difficulty ?? ep.upcoming?.[id]?.difficulty).filter(Number.isInteger);
  const live = r => save.rooms[r.id]?.started && !save.rooms[r.id]?.escaped && unlocked(r.id);
  const playing = built.find(r => r.id === save.last && live(r)) ?? built.find(live);
  const next = built.find(r => unlocked(r.id) && !cleared(r.id));
  const target = playing ?? next ?? built[0] ?? null;
  const n = target ? ep.rooms.indexOf(target.id) + 1 : 0;
  const action = !target ? null : playing ? `${n}화 이어하기` : next ? `${n}화 시작` : `${n}화 다시 보기`;
  return { built, done, total: ep.rooms.length, lo: Math.min(...levels), hi: Math.max(...levels), target, action };
}
function episodeCard(ep) {
  const st = episodeState(ep);
  const ready = st.built.length > 0;
  const first = st.built[0];
  const coverView = ep.cover?.view && first?.views[ep.cover.view] ? ep.cover.view : first?.start;
  const cover = ready && coverReady[ep.id] ? coverArt(ep) : ready ? drawView(first, coverView, freshState(first)).replace('xMidYMid meet', 'xMidYMid slice') : `<span class="ep-blank" aria-hidden="true"><i>EPISODE ${ep.id}</i><small>준비 중</small></span>`;
  const done = ready && st.done === st.total;
  const mark = done ? `<span class="marks"><span class="status done">${icon('check', 16)}</span></span>` : '';
  const progressText = !ready ? '' : done ? '<span class="ok">완료</span>' : st.done ? `<span>${st.done}/${st.total} 탈출</span>` : '';
  const state = !ready ? '준비 중' : done ? '완료' : st.done ? `${st.total}화 중 ${st.done}화 탈출` : '시작 전';
  const label = `에피소드 ${ep.id} ${ep.title}, ${st.total}화, 난이도 5점 만점에 ${st.lo === st.hi ? st.lo : `${st.lo}~${st.hi}`}점, ${state}. 화 목록 보기`;
  const play = ready ? `<button class="btn ep-play" data-act="open-room" data-id="${st.target.id}" aria-label="${e(`${ep.title} ${st.action}, ${st.target.title}`)}">${e(st.action)}</button>` : '';
  return `<li class="ep-card"><button class="ep-open" data-act="episode" data-ep="${ep.id}" aria-label="${e(label)}"><span class="ep-cover">${cover}${mark}</span><span class="ep-body"><span class="no">EP ${ep.id}</span><b>${e(ep.title)}</b><span class="ep-meta">${starRange(st.lo, st.hi)}<span>${st.total}화</span>${progressText}</span></span></button>${play}</li>`;
}
function roomRow(r, ep, i) {
  const st = save.rooms[r.id];
  const thumb = drawView(r, r.start, freshState(r));
  const meta = `<span class="meta">${stars(r.difficulty)}<span class="mins">${icon('clock', 14)}${r.minutes}분</span></span>`;
  const head = `<span class="no">${i + 1}화</span><b>${e(r.title)}</b><small>${e(r.subtitle)}</small>`;
  if (!unlocked(r.id)) return `<li><div class="room-card is-locked"><span class="thumb">${thumb}<span class="lock-mark">${icon('lock', 22)}</span></span><span class="info">${head}${meta}<small class="lock-note">${icon('lock', 13)}앞 화를 탈출하면 열려요</small></span></div></li>`;
  const done = cleared(r.id);
  const marks = `${done ? `<span class="status done">${icon('check', 16)}<span class="sr-only">탈출 완료</span></span>` : st?.started ? '<span class="status play">진행 중</span>' : ''}${st?.secret ? `<span class="status mark" title="책갈피">${icon('ribbon', 15)}<span class="sr-only">책갈피 찾음</span></span>` : ''}`;
  const label = `${i + 1}화 ${r.title}, 난이도 5점 만점에 ${r.difficulty}점, ${done ? '탈출 완료' : st?.started ? '이어하기' : '시작하기'}`;
  return `<li><button class="room-card" data-act="open-room" data-id="${r.id}" aria-label="${e(label)}"><span class="thumb">${thumb}</span><span class="info">${head}${meta}</span><span class="marks">${marks}</span></button></li>`;
}
function soonRow(soon, i) {
  return `<li class="soon"><span class="step">${i + 1}</span><span class="info"><b>${e(soon.title)}</b><span class="meta">${stars(soon.difficulty)}<span class="mins">${icon('clock', 14)}${soon.minutes}분</span></span></span><span class="tag">준비 중</span></li>`;
}
function showEpisode(id) {
  const ep = episodes.find(x => x.id === id);
  if (!ep) return;
  const st = episodeState(ep);
  const rows = ep.rooms.map((rid, i) => (roomById(rid) ? roomRow(roomById(rid), ep, i) : soonRow(ep.upcoming[rid], i))).join('');
  const play = st.target
    ? `<button class="btn primary wide" data-act="open-room" data-id="${st.target.id}">${e(st.action)} · ${e(st.target.title)} ${icon('right', 18)}</button>`
    : '<p class="sheet-copy soon-note">이 에피소드는 준비 중이에요.</p>';
  openSheet(`${sheetHead(ep.title, 'book')}<p class="kicker">EPISODE ${ep.id} · ${st.total}화</p><p class="ep-tag">${e(ep.tagline)}</p><ol class="rooms">${rows}</ol>${play}`);
  // 화 목록의 작은 그림은 시작 시점 판을 받은 뒤 그림만 바꿉니다.
  const built = ep.rooms.map(roomById).filter(Boolean);
  void Promise.all(built.map(r => prepareView(r.id, r.start))).then(done => {
    const list = sheet.querySelector('ol.rooms');
    if (done.some(Boolean) && list) swapArt(list, ep.rooms.map((rid, i) => (roomById(rid) ? roomRow(roomById(rid), ep, i) : soonRow(ep.upcoming[rid], i))).join(''));
  });
}
// 홈의 그림만 바꿉니다. 판을 늦게 받았을 때 버튼, 초점, 스크롤을 건드리지 않기 위해서입니다.
function refreshHomeArt() {
  const list = app.querySelector('.episodes');
  if (room || !list) return;
  swapArt(list, episodes.map(episodeCard).join(''));
}
function renderHome() {
  document.body.dataset.screen = 'home';
  delete document.body.dataset.view;
  const order = playOrder();
  const cont = order.find(r => r.id === save.last && save.rooms[r.id]?.started && !save.rooms[r.id]?.escaped && unlocked(r.id));
  const next = order.find(r => unlocked(r.id) && !cleared(r.id));
  const first = cont ?? next ?? order[0];
  const heroLabel = cont ? '이어하기' : next ? '시작하기' : '다시 하기';
  const total = episodes.reduce((n, ep) => n + ep.rooms.length, 0);
  const done = order.filter(r => cleared(r.id)).length;
  const marks = order.filter(r => save.rooms[r.id]?.secret).length;
  app.innerHTML = `<main class="home" id="main">
    <header class="home-top"><h1 class="brand">${icon('door', 26)}<span>문 너머</span></h1><button class="icon-btn" data-act="guide" aria-label="조작 안내">${icon('help')}</button></header>
    <section class="hero"><img src="assets/hero-ep1.webp" alt="" width="1200" height="900" fetchpriority="high"><div class="hero-copy"><p class="hero-line">단서를 찾고, 물건을 합쳐, 문을 여세요.</p><button class="btn primary" data-act="open-room" data-id="${first.id}">${heroLabel} · ${e(first.title)} ${icon('right', 18)}</button></div></section>
    <h2 class="list-title">에피소드 <span>탈출 ${done} / ${total}${marks ? ` · 책갈피 ${marks}` : ''}</span></h2>
    <ul class="episodes">${episodes.map(episodeCard).join('')}</ul>
  </main>`;
  if (saveWarned) showSaveWarning();
}

function renderGame() {
  document.body.dataset.screen = 'game';
  artKey = ''; pinKey = '';
  app.innerHTML = `<div class="game" id="main">
    <header class="bar">
      <button class="icon-btn" data-act="home" aria-label="방 목록으로">${icon('back')}</button>
      <div class="where"><b>${e(room.title)}</b><small id="where-view"></small></div>
      <button class="icon-btn" data-act="reveal" aria-label="살펴볼 곳 보기">${icon('eye')}</button>
      <button class="icon-btn" data-act="photo" aria-label="사진 찍기">${icon('camera')}</button>
      <button class="icon-btn" data-act="hint" aria-label="힌트">${icon('bulb')}</button>
      <button class="icon-btn" data-act="menu" aria-label="메뉴">${icon('menu')}</button>
      <span class="meter" id="meter" role="progressbar" aria-label="진행" aria-valuemin="0"><i></i></span>
    </header>
    <div class="stage-wrap"><div class="backdrop" id="backdrop" aria-hidden="true"></div><div class="stage" id="stage"><div class="scene" id="scene"><div class="art" id="art"></div><div class="hits" id="hits"></div></div><div class="overlay" id="overlay"></div><button class="pin" id="pin" data-act="pin-open" hidden></button><div class="toast" id="toast" aria-hidden="true"></div></div></div>
    <nav class="bag" id="bag" aria-label="가방"></nav>
  </div>`;
  if (saveWarned) showSaveWarning();
  paint();
}
function paint() {
  const f = focusKey();
  paintBar(); paintScene(); paintPin(); paintOverlay(); paintBag();
  restoreFocus(f);
}
// 위 막대의 작은 글씨는 지금 시점 이름이고, 물건을 고르면 그 물건 이름으로 바뀝니다.
function paintBar() {
  const where = $('#where-view');
  if (!where) return;
  const held = selected && s.inv.includes(selected) ? room.items[selected].name : null;
  where.classList.toggle('is-held', !!held);
  where.innerHTML = held ? `${icon('hand', 14)}<span>${e(held)}</span>` : e(room.views[s.view].name);
  const meter = $('#meter');
  const { done, total } = progress(room, s);
  meter.style.setProperty('--p', `${Math.round((done / total) * 100)}%`);
  meter.setAttribute('aria-valuemax', total);
  meter.setAttribute('aria-valuenow', done);
}
function paintScene() {
  const art = $('#art'), hits = $('#hits');
  if (!art) return;
  document.body.dataset.view = s.view;
  // 그림은 상태가 바뀔 때만 다시 그립니다. 매번 그리면 휴대폰에서 느려지고 움직임이 처음부터 다시 시작됩니다.
  const key = JSON.stringify([s.view, s.flags, s.open, s.got, s.drafts]);
  if (key !== artKey) {
    art.innerHTML = drawView(room, s.view, s, viewAlt(room, s));
    // 키가 큰 화면에서 장면 위아래에 남는 공간은 같은 그림을 흐리게 깔아 빈 띠처럼 보이지 않게 합니다.
    const backdrop = $('#backdrop');
    if (backdrop) backdrop.innerHTML = drawView(room, s.view, s).replace('xMidYMid meet', 'xMidYMid slice');
    artKey = key;
  }
  const view = room.views[s.view];
  const focus = hintFocus();
  let html = '';
  for (const h of hotspotsIn(room, s)) html += `<button class="spot${focus.all || focus.spot === h.id ? ' is-hint' : ''}" data-act="spot" data-id="${e(h.id)}" style="${box(h.rect)}" aria-label="${e(h.label)}"></button>`;
  const lk = lockIn(room, s.view);
  const lockOn = !!(lk && !s.open.includes(lk[0]) && lockReady(lk[1], s));
  if (lockOn) html += lockButtons(lk[0], lk[1], focus.lock);
  $('#stage').classList.toggle('has-lock', lockOn);
  // 확대 화면은 아래 띠 가운데에 돌아가기 버튼이 있어서 말풍선을 위로 올립니다.
  $('#stage').classList.toggle('is-zoom', view.kind !== 'wall');
  if (view.kind === 'wall') html += navButton('left', focus.nav) + navButton('right', focus.nav);
  else html += navButton('back', focus.nav);
  hits.innerHTML = html;
}
function navButton(dir, hint) {
  return `<button class="nav nav-${dir}${hint === dir ? ' is-hint' : ''}" data-act="nav" data-dir="${dir}" style="${box(NAV[dir])}" aria-label="${NAV_LABEL[dir]}"><span>${icon(dir === 'back' ? 'down' : dir, 24)}</span></button>`;
}
function lockButtons(id, lock, hint) {
  const draft = cleanInput(lock, s.drafts[id]);
  const buttons = lockControls(lock).map(c => {
    let label, data;
    const v = e(String(draft[c.index] ?? ''));
    if (lock.type === 'color') { label = `${lock.label} ${c.index + 1}번, 지금 ${COLOR_NAMES[draft[c.index]] ?? SYMBOL_NAMES[draft[c.index]] ?? draft[c.index]}`; data = `data-i="${c.index}" data-v="${v}"`; }
    else if (lock.type === 'dial') { label = `${c.index + 1}번째 숫자 ${c.delta > 0 ? '올리기' : '내리기'}, 지금 ${draft[c.index]}`; data = `data-i="${c.index}" data-d="${c.delta}" data-v="${v}"`; }
    else if (lock.type === 'switch') { label = `${c.index + 1}번 스위치, 지금 ${draft[c.index] ? '켜짐' : '꺼짐'}`; data = `data-i="${c.index}" data-v="${v}"`; }
    else if (lock.type === 'rotate') { label = `${c.index + 1}번 돌리기, 지금 ${DIRECTION_NAMES[draft[c.index]]}`; data = `data-i="${c.index}" data-v="${v}"`; }
    else if (lock.type === 'symbol') { label = `${SYMBOL_NAMES[c.sym] ?? c.sym} 누르기`; data = `data-sym="${e(c.sym)}"`; }
    else if (lock.type === 'keypad') { label = c.key === 'C' ? '모두 지우기' : c.key === '<' ? '하나 지우기' : c.key; data = `data-key="${c.key}"`; }
    else { label = `${DIRECTION_NAMES[c.dir]} 화살표`; data = `data-dir="${c.dir}"`; }
    return `<button class="ctrl${hint ? ' is-hint' : ''}" data-act="lock" ${data} style="${box([c.x, c.y, c.w, c.h])}" aria-label="${e(label)}"></button>`;
  }).join('');
  return buttons + (SEQUENCE_LOCKS.includes(lock.type) ? `<span class="sr-only">${draft.length} / ${lock.answer.length} 입력</span>` : '');
}
// 고정한 사진은 장면 오른쪽 위 모서리에 작게 띄웁니다. 자물쇠 버튼은 이 영역 아래에만 놓입니다.
function photoState(photo) { return { ...freshState(room), ...structuredClone(photo), inv: [...photo.got] }; }
function paintPin() {
  const pin = $('#pin');
  if (!pin) return;
  const photo = s.pin ? s.photos.find(p => p.sig === s.pin) : null;
  if (!photo || !s.started || s.escaped) { pin.hidden = true; pinKey = ''; return; }
  pin.hidden = false;
  pin.setAttribute('style', box(PIN_ZONE));
  if (photo.sig !== pinKey) {
    pin.innerHTML = drawView(room, photo.view, photoState(photo)) + `<span class="pin-tag">${icon('pin', 12)}</span>`;
    pin.setAttribute('aria-label', `고정한 사진, ${room.views[photo.view].name}. 크게 보기`);
    pinKey = photo.sig;
  }
}
function introHtml() {
  const ep = episodeOf(episodes, room.id);
  const kicker = ep ? `EPISODE ${ep.episode.id} · ${ep.index + 1} / ${ep.episode.rooms.length}` : `ROOM ${num(room.id)}`;
  return `<div class="panel intro"><p class="kicker">${kicker}</p><h2>${e(room.title)}</h2><p class="intro-meta">${stars(room.difficulty)}<span>${icon('clock', 14)}${room.minutes}분</span></p>${room.intro.map(line => `<p>${e(line)}</p>`).join('')}<button class="btn primary wide" data-act="begin">들어가기 ${icon('right', 18)}</button></div>`;
}
// 쉬었다 돌아오면 어디까지 왔는지, 가방과 최근 사진을 먼저 보여 줍니다.
function resumeHtml() {
  const { done, total } = progress(room, s);
  const bag = s.inv.length ? `<div class="recap-row" aria-label="가방">${s.inv.map(id => `<span class="recap-item" title="${e(room.items[id].name)}">${drawItem(id, room.items[id].name)}</span>`).join('')}</div>` : '';
  const shots = s.photos.slice(0, 3);
  const photos = shots.length ? `<div class="recap-row">${shots.map(p => `<span class="recap-photo">${drawView(room, p.view, photoState(p), room.views[p.view].name)}</span>`).join('')}</div>` : '';
  return `<div class="panel resume"><p class="kicker">이어하기</p><h2>${e(room.title)}</h2><div class="recap-meter" role="img" aria-label="진행 ${done} / ${total}"><i style="width:${Math.round((done / total) * 100)}%"></i></div>${bag}${photos}<button class="btn primary wide" data-act="resume-go">계속하기 ${icon('right', 18)}</button></div>`;
}
function outroHtml() {
  // 탈출 직후 광고가 뜰 차례면, 광고가 끝날 때까지 이야기와 버튼 없이 제목만 둡니다.
  // AdMob 권장대로 광고가 휴식 화면과 다음 버튼보다 먼저 나오게 하기 위해서입니다.
  if (breakPending) return `<div class="panel outro is-waiting" aria-busy="true"><span class="outro-mark">${icon('door', 40)}</span><h2>${e(room.outro.title)}</h2></div>`;
  const ep = episodeOf(episodes, room.id);
  const idx = ep?.index ?? 0, order = ep?.episode.rooms ?? [];
  const nextId = order[idx + 1];
  const nextRoom = nextId ? roomById(nextId) : null;
  const soon = nextId && !nextRoom ? ep.episode.upcoming?.[nextId] : null;
  const isLast = !!ep && idx === order.length - 1;
  const best = s.best && (s.best.seconds !== s.seconds || s.best.hints !== hintsUsed(s)) ? `<div><dt>${icon('star', 16)}<span>최고</span></dt><dd>${clock(s.best.seconds)}</dd></div>` : '';
  const hasSecret = Object.values(room.items).some(item => item.kind === 'secret');
  const secret = hasSecret ? `<p class="secret-line${s.secret ? ' found' : ''}">${icon('ribbon', 16)}<span>${s.secret ? '책갈피를 찾았어요' : '이 방에 책갈피가 하나 숨어 있어요'}</span></p>` : '';
  const bridge = ep && !isLast && ep.episode.bridges?.[room.id] ? `<p class="bridge">${e(ep.episode.bridges[room.id])}</p>` : '';
  const finale = isLast ? `<div class="finale"><p class="kicker">EPISODE ${ep.episode.id} 완료</p>${ep.episode.finale.map(line => `<p>${e(line)}</p>`).join('')}</div>` : '';
  const next = nextRoom ? `<button class="btn primary wide" data-act="next-room" data-id="${nextRoom.id}">다음 방 · ${e(nextRoom.title)} ${icon('right', 18)}</button>` : soon ? `<p class="soon-note">다음 방 「${e(soon.title)}」은 준비 중이에요.</p>` : '';
  return `<div class="panel outro"><span class="outro-mark">${icon('door', 40)}</span><h2>${e(room.outro.title)}</h2>${room.outro.lines.map(line => `<p>${e(line)}</p>`).join('')}
    <dl class="stats"><div><dt>${icon('clock', 16)}<span>시간</span></dt><dd>${clock(s.seconds)}</dd></div><div><dt>${icon('bulb', 16)}<span>힌트</span></dt><dd>${hintsUsed(s)}</dd></div>${best}</dl>
    ${secret}${bridge}${finale}${next}
    <div class="row"><button class="btn" data-act="share">${icon('share', 18)} 공유</button><button class="btn" data-act="replay">${icon('reset', 18)} 다시 하기</button><button class="btn${nextRoom ? '' : ' primary'}" data-act="home">방 목록</button></div></div>`;
}
function paintOverlay() {
  const overlay = $('#overlay');
  if (!overlay) return;
  overlay.className = 'overlay';
  if (!s.started) { overlay.classList.add('is-on'); overlay.innerHTML = introHtml(); return; }
  if (s.escaped) {
    $('#toast')?.classList.remove('show');
    overlay.classList.add('is-on');
    overlay.innerHTML = outroHtml();
    return;
  }
  if (resume) { overlay.classList.add('is-on'); overlay.innerHTML = resumeHtml(); return; }
  if (zoomItem && s.inv.includes(zoomItem)) {
    const item = room.items[zoomItem];
    overlay.classList.add('is-on', 'is-item');
    overlay.innerHTML = `<section class="item-zoom" aria-label="${e(item.name)} 크게 보기"><button class="icon-btn item-close" data-act="zoom-close" aria-label="닫기">${icon('close')}</button><div class="item-big">${drawItem(zoomItem, item.name)}</div><p class="item-name">${e(item.name)}</p>${item.note ? `<p class="item-note">${e(item.note)}</p>` : ''}${s.inv.some(id => id !== zoomItem) ? `<button class="btn combine-btn" data-act="combine-pick" aria-pressed="${combining()}">${icon('plus', 18)}<span>${combining() ? '합칠 물건을 가방에서 고르세요' : '합치기'}</span></button>` : ''}${!combining() && room.recipes.some(r => r.a === zoomItem || r.b === zoomItem) ? `<p class="item-tip">${icon('plus', 16)}<span>가방의 다른 물건을 눌러 합쳐 보세요.</span></p>` : ''}</section>`;
    return;
  }
  zoomItem = null;
  overlay.innerHTML = '';
}
// 가방 맨 앞 칸은 수첩입니다. 찍은 사진과 주운 쪽지가 모두 여기에 모입니다.
function paintBag() {
  const bag = $('#bag');
  if (!bag) return;
  const focus = hintFocus();
  const shots = s.photos.length, notes = notesOf().length;
  let html = `<button class="slot journal" data-act="journal" aria-label="수첩, 사진 ${shots}장, 쪽지 ${notes}장">${icon('book', 24)}${shots ? `<span class="badge">${shots}</span>` : ''}</button>`;
  const count = Math.max(5, s.inv.length);
  for (let i = 0; i < count; i++) {
    const id = s.inv[i];
    if (!id) { html += '<span class="slot empty" aria-hidden="true"></span>'; continue; }
    const name = room.items[id].name;
    const on = selected === id;
    const label = on ? `${name}, 고름. 한 번 더 누르면 크게 봐요` : zoomItem ? `${name}, 크게 본 물건과 합치기` : name;
    html += `<button class="slot${focus.items.includes(id) ? ' is-hint' : ''}${fresh.has(id) ? ' is-new' : ''}" data-act="item" data-id="${e(id)}" aria-pressed="${on}" aria-label="${e(label)}">${drawItem(id)}</button>`;
  }
  fresh.clear();
  bag.innerHTML = html;
  bag.classList.toggle('is-combining', combining());
}

function onEscape() {
  const now = { seconds: s.seconds, hints: hintsUsed(s) };
  if (!s.best || now.hints < s.best.hints || (now.hints === s.best.hints && now.seconds < s.best.seconds)) s.best = now;
  sfx('open');
  void persist();
  const where = episodeOf(episodes, room.id);
  analytics.track('room_escape', { room: room.id, episode: where?.episode.id, chapter: where ? where.index + 1 : undefined, seconds: s.seconds, hints: now.hints, fails: roomFails, first: firstClear });
  if (firstClear) {
    const milestone = MILESTONES[rooms.filter(r => cleared(r.id)).length];
    if (milestone) analytics.track(milestone, milestone === 'tutorial_complete' ? { room: room.id, seconds: s.seconds } : { room: room.id });
  }
  firstClear = false;
  // 첫 탈출 뒤에 광고 동의를 묻고 다음 광고를 미리 받아 둡니다.
  void ads?.warmup();
  escapeBreak();
}
// 방 한 판의 광고 자리(when: 'escape'): 탈출 결과 화면이 뜬 뒤, 다음 방 버튼이 켜지기 전에 전면 광고를 띄웁니다.
// 광고를 띄울 차례면 결과 화면을 제목만 둔 대기 상태로 두고, 광고가 끝난 뒤 이야기와 다음 방 버튼을 보여 줍니다.
function escapeBreak() {
  if (!ads || ROOM_AD.when !== 'escape' || adBusy) return;
  const willShow = ads.breakWillShow();
  const at = room, startedAt = Date.now();
  adBusy = true; breakPending = willShow;
  const run = async () => {
    // 기다리는 사이 방을 나갔다면 광고를 띄우지 않습니다. 다른 화면 위에 광고가 뜨면 예상하지 못한 광고가 됩니다.
    if (room !== at || !s?.escaped) { adBusy = false; breakPending = false; return; }
    let result;
    // 광고를 받아 오는 사이 방을 나갔거나 앱이 뒤로 갔으면 띄우지 않습니다(cancelled).
    const stillHere = () => room === at && s?.escaped === true && !document.hidden;
    try { result = await ads.roomBreak(stillHere); } catch { result = { format: 'interstitial', outcome: 'failed' }; }
    adBusy = false; breakPending = false;
    logAd('room_end', result, startedAt);
    if (room === at) paint();
  };
  if (willShow) setTimeout(() => { void run(); }, ROOM_AD.delayMs); else void run();
}
function play(events) {
  const gains = [], notes = [], secrets = [];
  for (const ev of events) {
    if (ev.type === 'gain') { gains.push(ev.item); fresh.add(ev.item); }
    else if (ev.type === 'note') notes.push(ev.item);
    else if (ev.type === 'secret') secrets.push(ev.item);
    else if (ev.type === 'fx') fx(ev.name);
    else if (ev.type === 'say' && ev.text) toast(ev.text);
    else if (ev.type === 'escape') onEscape();
  }
  if (gains.length) {
    toast(`+ ${gains.map(id => room.items[id].name).join(', ')}`, gains);
    if (!events.some(ev => ev.type === 'fx')) sfx('pick');
  }
  if (secrets.length) toast('책갈피를 찾았어요', secrets, 2400);
  if (notes.length) { sfx('pick'); pendingNote = notes[0]; }
}
// 시점을 옮기거나 상태가 바뀐 뒤에 처음 들어온 곳의 한 줄 반응과 단서 자동 기록을 처리합니다.
function afterMove() {
  if (!s.started || s.escaped || resume) return;
  const firstVisit = markSeen(s);
  const enter = room.views[s.view].enter;
  if (firstVisit && enter) toast(enter, [], 2600);
  if (save.autoClue && needsAutoPhoto(room, s)) {
    const { added } = takePhoto(room, s, { auto: true });
    if (added) {
      paintBag();
      flyPhoto();
      if (!save.autoTold) { save.autoTold = true; toast('단서 장면은 수첩에 자동으로 찍혀요.', [], 2600); }
    }
  }
  scheduleSave();
}
function changed(before, stateMoved = false) {
  const turned = before !== s.view;
  scheduleSave();
  paint();
  if (turned) {
    const art = $('#art');
    art.classList.remove('turn');
    void art.offsetWidth;
    art.classList.add('turn');
    announce(room.views[s.view].name);
  }
  afterMove();
  if (pendingNote) { const id = pendingNote; pendingNote = null; showNote(id); }
}
function onSpot(id) {
  const before = s.view, prev = stateSig();
  const held = selected;
  const result = tap(room, s, id, held);
  if (!result.ok) return;
  if (result.used || (held && !s.inv.includes(held))) selected = null;
  if (result.rejected) toast('여기에는 쓸 수 없어요.');
  else if (!result.events.length) sfx('tap');
  play(result.events);
  changed(before, stateSig() !== prev);
}
function onItem(id) {
  if (!s.inv.includes(id)) return;
  if (zoomItem && zoomItem !== id) {
    const result = combine(room, s, zoomItem, id);
    if (result.ok) {
      zoomItem = result.item;
      selected = result.item;
      fresh.add(result.item);
      fx('open');
      toast(`+ ${room.items[result.item].name}`, [result.item]);
      scheduleSave();
    } else {
      fx('rattle');
      toast('맞지 않아요.');
    }
    paint();
    return;
  }
  // 크게 보던 물건을 한 번 더 누르면 닫히면서 선택도 풀립니다. 물건을 내려놓는 유일한 동작입니다.
  if (zoomItem === id) { zoomItem = null; selected = null; paint(); restoreFocus(`[data-act="item"][data-id="${CSS.escape(id)}"]`); return; }
  if (selected === id) {
    zoomItem = id;
    paint();
    $('[data-act="zoom-close"]')?.focus({ preventScroll: true });
    return;
  }
  selected = id;
  sfx('tap');
  announce(`${room.items[id].name} 고름`);
  paintBar();
  paintBag();
  restoreFocus(`[data-act="item"][data-id="${CSS.escape(id)}"]`);
}
function onLock(button) {
  const found = lockIn(room, s.view);
  if (!found) return;
  const [id, lock] = found;
  if (!lockReady(lock, s)) return;
  let draft = cleanInput(lock, s.drafts[id]);
  const i = Number(button.dataset.i);
  if (lock.type === 'color') { const p = lock.palette; draft[i] = p[(p.indexOf(draft[i]) + 1) % p.length]; }
  else if (lock.type === 'dial') { const size = (lock.max ?? 9) + 1; draft[i] = (draft[i] + Number(button.dataset.d) + size) % size; }
  else if (lock.type === 'switch') draft[i] = draft[i] ? 0 : 1;
  else if (lock.type === 'rotate') draft[i] = ROTATIONS[(ROTATIONS.indexOf(draft[i]) + 1) % ROTATIONS.length];
  else if (lock.type === 'symbol') draft = [...draft, button.dataset.sym];
  else if (lock.type === 'keypad') { const k = button.dataset.key; draft = k === 'C' ? [] : k === '<' ? draft.slice(0, -1) : [...draft, Number(k)]; }
  else draft = [...draft, button.dataset.dir];
  const before = s.view, prev = stateSig();
  const result = inputLock(room, s, id, draft);
  if (!result.ok) return;
  sfx('click');
  if (result.open) { announce(`${lock.label}가 풀렸어요.`); analytics.track('lock_open', { room: room.id, lock: id, seconds: s.seconds }); }
  if (result.wrong) { toast('맞지 않아요.'); roomFails++; analytics.track('lock_fail', { room: room.id, lock: id }); }
  play(result.events);
  changed(before, result.open || stateSig() !== prev);
}
function onNav(dir) {
  const before = s.view;
  if (dir === 'back') jump(room, s, room.views[s.view].back);
  else move(room, s, dir);
  changed(before);
}
function reveal() {
  const scene = $('#scene');
  if (!scene) return;
  scene.classList.add('reveal');
  clearTimeout(revealTimer);
  revealTimer = setTimeout(() => scene.classList.remove('reveal'), 1600);
  announce(`살펴볼 곳 ${hotspotsIn(room, s).length}개`);
}
// 사진을 찍거나 단서가 자동으로 찍히면 수첩 칸이 한 번 튑니다.
function flyPhoto() {
  const now = $('[data-act="journal"]');
  if (!now) return;
  now.classList.remove('bump');
  void now.offsetWidth;
  now.classList.add('bump');
}
function shoot() {
  takePhoto(room, s);
  fx('photo');
  paintBag();
  flyPhoto();
  if (!save.pinTold) { save.pinTold = true; toast('수첩에서 사진을 고정하면 화면에 띄워 둘 수 있어요.', [], 2800); }
  else toast(`사진 ${s.photos.length}장`);
  scheduleSave();
}

function openSheet(html, labelledBy = 'sheet-title') {
  if (!sheet.open) returnFocus = focusKey();
  sheet.setAttribute('aria-labelledby', labelledBy);
  sheet.innerHTML = `<div class="sheet-inner">${html}</div>`;
  if (!sheet.open) sheet.showModal();
}
function closeSheet() { if (sheet.open) sheet.close(); }
const sheetHead = (title, glyph) => `<div class="sheet-head"><h2 id="sheet-title">${icon(glyph, 20)}<span>${e(title)}</span></h2><button class="icon-btn" data-act="close" aria-label="닫기">${icon('close')}</button></div>`;

function showHint(notice = '') {
  const goal = activeGoal(room, s);
  if (!goal) { openSheet(`${sheetHead('힌트', 'bulb')}<p class="sheet-copy">이미 탈출했어요.</p>`); return; }
  const n = s.hints[goal.id] || 0;
  const paid = n < HINT_MAX && ads?.hintNeedsAd(hintsUsed(s), firstRoom());
  const more = n >= HINT_MAX ? '모든 힌트를 열었어요' : adBusy ? '광고를 불러오는 중이에요' : `${paid ? '광고 보고 ' : ''}${n === 0 ? '힌트 보기' : '다음 힌트'}`;
  openSheet(`${sheetHead('힌트', 'bulb')}
    ${n ? `<ol class="hints">${goal.hints.slice(0, n).map((h, i) => `<li><b>${i + 1}</b><span>${e(h)}</span></li>`).join('')}</ol>` : '<p class="sheet-copy">막힌 곳이 있으면 한 단계씩 열어 보세요.</p>'}
    ${n === HINT_MAX - 1 ? '<p class="sheet-warn">다음 힌트는 정답이에요.</p>' : ''}
    ${notice ? `<p class="sheet-warn" role="status">${e(notice)}</p>` : ''}
    <button class="btn primary wide" data-act="hint-more" ${n >= HINT_MAX || adBusy ? 'disabled' : ''}>${more}</button>`);
}
// 광고 결과를 로그로 남깁니다. 웹처럼 광고가 없는 곳의 결과(unsupported)와 무료 힌트는 남기지 않습니다.
function logAd(placement, result, startedAt) {
  if (['unsupported', 'free'].includes(result.outcome)) return;
  analytics.track('ad_result', { placement, format: result.format, outcome: result.outcome, ms: Date.now() - startedAt });
}
// 힌트 한 단계를 엽니다. 광고가 필요하면 먼저 보여 주고, 끝까지 봤거나 광고를 받지 못했을 때 엽니다.
async function unlockHint() {
  const goal = activeGoal(room, s);
  if (!goal || (s.hints[goal.id] || 0) >= HINT_MAX || adBusy) return;
  const atRoom = room, atState = s, startedAt = Date.now();
  adBusy = true;
  const first = firstRoom();
  if (ads?.hintNeedsAd(hintsUsed(s), first)) showHint();
  // 광고를 받아 오는 사이 힌트 창을 닫았거나 방을 나갔으면 광고를 띄우지 않습니다.
  const stillHere = () => room === atRoom && s === atState && sheet.open && !document.hidden;
  let result;
  try { result = ads ? await ads.forHint(hintsUsed(s), { firstRoom: first, stillWanted: stillHere }) : { format: 'rewarded', outcome: 'unsupported', open: true, via: 'free' }; }
  catch { result = { format: 'rewarded', outcome: 'failed', open: true, via: 'fallback' }; }
  finally { adBusy = false; }
  logAd('hint', result, startedAt);
  if (room !== atRoom || s !== atState) return;
  if (result.outcome === 'cancelled') { if (sheet.open) showHint(); return; }
  if (!result.open) { showHint('광고를 끝까지 보면 힌트가 열려요.'); return; }
  const opened = requestHint(room, s);
  if (opened) analytics.track('hint_request', { room: room.id, goal: opened.id, level: s.hints[opened.id], via: result.via });
  scheduleSave(); showHint(); paint();
}
// 방을 열기 직전의 광고 자리(when: 'open')입니다. 광고가 끝나거나 건너뛰면 열려던 일을 이어 합니다.
async function adBreakThen(next) {
  if (adBusy) return;
  adBusy = true;
  const startedAt = Date.now();
  let result = { format: 'interstitial', outcome: 'unsupported' };
  const at = location.hash;
  try { if (ads) result = await ads.roomBreak(() => location.hash === at && !document.hidden); }
  catch { result = { format: 'interstitial', outcome: 'failed' }; }
  finally { adBusy = false; }
  logAd('room_open', result, startedAt);
  // 광고를 보는 사이 다른 곳으로 갔으면, 원래 하려던 이동은 하지 않습니다.
  if (location.hash === at) next();
}
function showMenu() {
  openSheet(`${sheetHead('메뉴', 'menu')}<div class="menu-list">
    <button data-act="journal">${icon('book')}<span>수첩</span><small>사진 ${s.photos.length}장</small></button>
    <button data-act="auto-clue" aria-pressed="${save.autoClue}">${icon('camera')}<span>단서 자동 기록</span><small>${save.autoClue ? '켜짐' : '꺼짐'}</small></button>
    <button data-act="sound" aria-pressed="${save.sound}">${icon(save.sound ? 'sound' : 'mute')}<span>소리와 진동</span><small>${save.sound ? '켜짐' : '꺼짐'}</small></button>
    <button data-act="guide">${icon('help')}<span>조작 안내</span></button>
    <button data-act="reset">${icon('reset')}<span>처음부터</span></button>
    ${ads?.privacyRequired() ? `<button data-act="ad-privacy">${icon('help')}<span>광고 개인정보 설정</span></button>` : ''}
    <button data-act="home">${icon('home')}<span>방 목록</span></button>
  </div>`);
}
function showJournal(tab = 'photos') {
  const notes = notesOf();
  const tabs = `<div class="tabs" role="tablist">${[['photos', `사진 ${s.photos.length}`], ['notes', `쪽지 ${notes.length}`]].map(([k, label]) => `<button role="tab" aria-selected="${tab === k}" data-act="journal" data-tab="${k}">${label}</button>`).join('')}</div>`;
  let body;
  if (tab === 'notes') {
    body = notes.length ? `<ul class="notes">${notes.map(id => { const item = room.items[id]; return `<li class="note-paper${item.kind === 'secret' ? ' secret' : ''}">${item.kind === 'secret' ? icon('ribbon', 16) : ''}<b>${e(item.name)}</b><p>${e(item.note ?? '')}</p></li>`; }).join('')}</ul>` : `<p class="sheet-copy empty-photo">${icon('note', 28)}<span>쪽지를 찾으면 여기에 모여요.</span></p>`;
  } else {
    body = s.photos.length ? `<div class="photos">${s.photos.map((p, i) => `<button class="photo${p.sig === s.pin ? ' pinned' : ''}" data-act="photo-open" data-i="${i}" aria-label="${e(room.views[p.view].name)}${p.auto ? ', 자동 기록' : ''}${p.sig === s.pin ? ', 고정됨' : ''}">${drawView(room, p.view, photoState(p))}${p.auto ? '<span class="ph-tag">자동</span>' : ''}${p.sig === s.pin ? `<span class="ph-pin">${icon('pin', 12)}</span>` : ''}</button>`).join('')}</div>` : `<p class="sheet-copy empty-photo">${icon('camera', 28)}<span>카메라로 장면을 찍어 두세요. 단서는 자동으로 찍혀요.</span></p>`;
  }
  openSheet(`${sheetHead('수첩', 'book')}${tabs}${body}`);
}
function showPhoto(i) {
  const photo = s.photos[i];
  if (!photo) { showJournal(); return; }
  const n = s.photos.length, st = photoState(photo), pinned = s.pin === photo.sig;
  openSheet(`${sheetHead(`${room.views[photo.view].name}${photo.auto ? ' · 자동' : ''}`, 'camera')}
    <div class="photo-big">${drawView(room, photo.view, st, viewAlt(room, st, photo.view))}</div>
    <div class="viewer-nav"><button class="icon-btn" data-act="photo-open" data-i="${(i - 1 + n) % n}" aria-label="이전 사진" ${n < 2 ? 'disabled' : ''}>${icon('left')}</button><span>${i + 1} / ${n}</span><button class="icon-btn" data-act="photo-open" data-i="${(i + 1) % n}" aria-label="다음 사진" ${n < 2 ? 'disabled' : ''}>${icon('right')}</button></div>
    <div class="row"><button class="btn" data-act="photo-delete" data-i="${i}">${icon('trash', 18)} 지우기</button><button class="btn primary" data-act="photo-pin" data-i="${i}">${icon('pin', 18)} ${pinned ? '고정 풀기' : '화면에 고정'}</button></div>`);
}
function showNote(id) {
  const item = room.items[id];
  openSheet(`${sheetHead(item.kind === 'secret' ? '책갈피' : '쪽지', item.kind === 'secret' ? 'ribbon' : 'note')}<article class="note-paper big${item.kind === 'secret' ? ' secret' : ''}"><b>${e(item.name)}</b><p>${e(item.note ?? '')}</p></article><button class="btn primary wide" data-act="close">수첩에 넣기</button>`);
}
function showGuide() {
  openSheet(`${sheetHead('이렇게 해요', 'help')}<ol class="guide">
    <li><span class="g-icon">${icon('hand', 26)}</span><span>궁금한 곳을 눌러 살펴봐요.</span></li>
    <li><span class="g-icon">${icon('left', 22)}${icon('right', 22)}</span><span>화살표로 방을 둘러봐요.</span></li>
    <li><span class="g-icon">${icon('bag', 26)}</span><span>물건을 고르고 쓸 곳을 눌러요.</span></li>
    <li><span class="g-icon">${icon('plus', 26)}</span><span>고른 물건을 한 번 더 누르면 크게 보고 합칠 수 있어요.</span></li>
    <li><span class="g-icon">${icon('camera', 20)}${icon('book', 20)}${icon('bulb', 20)}</span><span>사진과 쪽지는 수첩에 모여요. 막히면 힌트를 열어요.</span></li>
  </ol><button class="btn primary wide" data-act="guide-done">알겠어요</button>`);
}
function confirmReset() {
  openSheet(`${sheetHead('처음부터 할까요?', 'reset')}<p class="sheet-copy">이 방의 물건, 사진, 힌트 기록이 지워져요. 탈출 기록과 책갈피는 남아요.</p><div class="row"><button class="btn" data-act="close">계속하기</button><button class="btn danger" data-act="confirm-reset">처음부터</button></div>`);
}
function restart() {
  analytics.track('room_restart', { room: room.id, after_escape: s.escaped });
  const keep = { cleared: s.cleared || s.escaped, best: s.best, secret: s.secret };
  save.rooms[room.id] = { ...freshState(room), ...keep };
  s = save.rooms[room.id];
  selected = null; zoomItem = null; resume = false;
  roomFails = 0; firstClear = !s.cleared;
  void persist();
  renderGame();
}
async function shareResult() {
  const text = `문 너머 「${room.title}」 탈출 ${clock(s.seconds)} · 힌트 ${hintsUsed(s)}개`;
  const result = await share({ title: '문 너머', text, url: `${location.origin}${location.pathname}` });
  analytics.track('share_result', { room: room.id, result });
  if (result === 'copied') toast('결과를 복사했어요.');
  else if (result === 'failed') toast('공유하지 못했어요.');
}

function route() {
  const match = location.hash.match(/^#room\/(\d+)$/);
  const next = match ? roomById(Number(match[1])) : null;
  closeSheet();
  selected = null; zoomItem = null; resume = false; pendingNote = null; combineFor = null;
  if (next && unlocked(next.id)) {
    room = next;
    save.rooms[room.id] ??= freshState(room);
    s = save.rooms[room.id];
    save.last = room.id;
    resume = s.started && !s.escaped;
    roomFails = 0; firstClear = !cleared(room.id);
    const where = episodeOf(episodes, room.id);
    analytics.track('room_open', { room: room.id, episode: where?.episode.id, chapter: where ? where.index + 1 : undefined, difficulty: room.difficulty, resume, cleared: !firstClear });
    scheduleSave();
    renderGame();
    const at = room;
    // 장면은 상태가 바뀔 때만 다시 그리므로, 판을 다 받으면 그리기 기준(artKey)을 비워 한 번 다시 그립니다.
    void preparePlates(room.id).then(changed => { if (changed && room === at) { artKey = ''; paint(); } });
  } else {
    if (match) history.replaceState(null, '', `${location.pathname}${location.search}`);
    room = null; s = null;
    renderHome();
  }
  document.title = room ? `${room.title} | 문 너머` : '문 너머';
  scrollTo(0, 0);
}
function goHome() {
  closeSheet();
  if (room && s?.started && !s.escaped) {
    const { done, total } = progress(room, s);
    analytics.track('room_exit', { room: room.id, seconds: s.seconds, progress: total ? Math.round((done / total) * 100) : 0, hints: hintsUsed(s) });
  }
  void persist();
  if (location.hash) location.hash = '';
  else route();
}
function handleBack() {
  if (sheet.open) { closeSheet(); return true; }
  if (!room) return false;
  if (zoomItem) { zoomItem = null; paint(); return true; }
  if (room.views[s.view].kind === 'zoom' && s.started && !s.escaped && !resume) { onNav('back'); return true; }
  goHome();
  return true;
}

document.addEventListener('click', event => {
  const b = event.target.closest('[data-act]');
  if (!b || b.disabled) return;
  const act = b.dataset.act;
  if (act === 'close') { closeSheet(); return; }
  if (act === 'guide') { showGuide(); return; }
  if (act === 'guide-done') { save.tutorial = true; scheduleSave(); closeSheet(); return; }
  if (act === 'open-room' || act === 'next-room') {
    const id = Number(b.dataset.id);
    const go = () => { location.hash = `room/${id}`; };
    // 기본값(when: 'escape')은 광고를 탈출 직후에 이미 거쳤으므로 바로 넘어갑니다.
    // when: 'open'일 때만 방을 열기 직전에 광고 자리를 거칩니다. 잠긴 방과 이미 열려 있는 방은 광고 없이 넘어갑니다.
    if (ROOM_AD.when !== 'open' || !roomById(id) || !unlocked(id) || room?.id === id) go(); else void adBreakThen(go);
    return;
  }
  if (act === 'episode') { analytics.track('episode_view', { episode: Number(b.dataset.ep) }); showEpisode(Number(b.dataset.ep)); return; }
  if (act === 'home') { goHome(); return; }
  if (!room) return;
  if (act === 'begin') {
    s.started = true; scheduleSave(); paint();
    const where = episodeOf(episodes, room.id);
    analytics.track('room_start', { room: room.id, episode: where?.episode.id, chapter: where ? where.index + 1 : undefined });
    if (!save.tutorial) showGuide(); else afterMove();
    return;
  }
  if (act === 'resume-go') { resume = false; paint(); afterMove(); return; }
  if (act === 'menu') { showMenu(); return; }
  if (act === 'ad-privacy') { closeSheet(); void ads?.openPrivacy(); return; }
  if (act === 'hint') { showHint(); return; }
  if (act === 'hint-more') { void unlockHint(); return; }
  if (act === 'journal') { showJournal(b.dataset.tab ?? 'photos'); return; }
  if (act === 'photo-open') { showPhoto(Number(b.dataset.i)); return; }
  if (act === 'pin-open') { const i = s.photos.findIndex(p => p.sig === s.pin); if (i >= 0) showPhoto(i); return; }
  if (act === 'photo-pin') {
    const photo = s.photos[Number(b.dataset.i)];
    if (!photo) return;
    const pinned = s.pin === photo.sig;
    s.pin = pinned ? null : photo.sig;
    scheduleSave(); closeSheet(); paint();
    toast(pinned ? '고정을 풀었어요.' : '사진을 화면 구석에 고정했어요.');
    return;
  }
  if (act === 'photo-delete') {
    const [gone] = s.photos.splice(Number(b.dataset.i), 1);
    if (gone && s.pin === gone.sig) s.pin = null;
    scheduleSave(); paint(); showJournal();
    return;
  }
  if (act === 'sound') { save.sound = !save.sound; scheduleSave(); sfx('open'); showMenu(); return; }
  if (act === 'auto-clue') { save.autoClue = !save.autoClue; scheduleSave(); showMenu(); return; }
  if (act === 'reset') { confirmReset(); return; }
  if (act === 'confirm-reset') { closeSheet(); restart(); return; }
  // 탈출 뒤 다시 하기는 방을 새로 여는 것이라 방 열기 광고 자리를 거칩니다.
  if (act === 'replay') {
    closeSheet();
    // 기본값(when: 'escape')은 이 판의 광고를 탈출 직후에 이미 거쳤습니다. 다시 하기를 누른 직후에는 광고를 띄우지 않습니다.
    if (ROOM_AD.when === 'open') { const at = room; void adBreakThen(() => { if (room === at) restart(); }); } else restart();
    return;
  }
  if (act === 'share') { void shareResult(); return; }
  if (!s.started || s.escaped || resume) return;
  if (act === 'spot') onSpot(b.dataset.id);
  else if (act === 'item') onItem(b.dataset.id);
  else if (act === 'combine-pick') { combineFor = combining() ? null : zoomItem; paint(); }
  else if (act === 'zoom-close') { combineFor = null; zoomItem = null; paint(); restoreFocus(`[data-act="item"][data-id="${CSS.escape(selected ?? '')}"]`); }
  else if (act === 'lock') onLock(b);
  else if (act === 'nav') onNav(b.dataset.dir);
  else if (act === 'reveal') reveal();
  else if (act === 'photo') shoot();
});
document.addEventListener('pointerdown', event => {
  const scene = event.target.closest?.('#scene');
  const stage = $('#stage');
  if (!scene || !stage) return;
  const rect = stage.getBoundingClientRect();
  const dot = document.createElement('span');
  dot.className = 'ripple';
  dot.style.left = `${event.clientX - rect.left}px`;
  dot.style.top = `${event.clientY - rect.top}px`;
  stage.append(dot);
  setTimeout(() => dot.remove(), 480);
});
document.addEventListener('keydown', event => {
  if (!room || sheet.open || !s?.started || s.escaped || resume || event.altKey || event.metaKey || event.ctrlKey) return;
  if (room.views[s.view].kind === 'wall' && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
    event.preventDefault();
    onNav(event.key === 'ArrowLeft' ? 'left' : 'right');
  } else if (event.key === 'p' || event.key === 'P') {
    event.preventDefault();
    shoot();
  }
});
sheet.addEventListener('click', event => { if (event.target === sheet) closeSheet(); });
sheet.addEventListener('close', () => {
  if (room && !save.tutorial && s?.started && sheet.querySelector('[data-act="guide-done"]')) { save.tutorial = true; scheduleSave(); }
  restoreFocus(returnFocus);
  returnFocus = null;
  // 안내 창을 닫은 뒤에야 첫 장면의 한 줄 반응을 보여 줍니다.
  if (room && s?.started && !s.escaped && !resume && !s.seen.includes(s.view)) afterMove();
});

function tick() {
  if (!room || !s?.started || s.escaped || resume || document.hidden || sheet.open) return;
  s.seconds++;
  if (s.seconds % 15 === 0) scheduleSave();
}

// 로그와 광고를 준비합니다. 여기서 실패해도 게임은 광고와 로그 없이 그대로 돌아갑니다.
async function startGrowth() {
  try {
    let raw = null;
    try { raw = JSON.parse((await loadText(GROWTH_STORE)) || 'null'); } catch { raw = null; }
    growth = recoverGrowth(raw);
    const returning = growth.firstSeen > 0;
    if (!returning) growth.firstSeen = Date.now();
    const keep = () => { saveText(GROWTH_STORE, JSON.stringify(growth)).catch(() => {}); };
    analytics = createAnalytics({ version: VERSION, debug: params.get('debug') === 'analytics' });
    ads = createAds({ growth, persist: keep, mock: AD_MOCK });
    keep();
    analytics.track('app_open', { returning, cleared: rooms.filter(r => cleared(r.id)).length });
    // 처음 설치한 사람에게는 첫 방을 깨기 전까지 광고 동의 창을 띄우지 않습니다.
    if (growth.breaks > 0) void ads.warmup();
  } catch {
    analytics = { track() {} }; ads = null;
  }
}

async function init() {
  try {
    const response = await fetch(`./escape.json?v=${VERSION}`);
    if (!response.ok) throw new Error('방 정보를 읽지 못했어요.');
    const data = await response.json();
    rooms = data.rooms;
    episodes = data.episodes;
    let raw = null;
    try { raw = JSON.parse((await loadText(KEY)) || 'null'); } catch { raw = null; }
    save = recoverSave(raw, rooms);
    await startGrowth();
    // 첫 방의 판은 홈 표지에도 쓰므로 시작하자마자 받기 시작합니다. 화면은 기다리지 않고 SVG로 먼저 그리고,
    // 다 받았을 때 아직 홈이면 표지 그림만 바꿉니다(버튼과 초점은 그대로).
    // 에피소드 표지는 표지 시점 판 하나씩만 받고, 다 받으면 한 번에 바꿉니다.
    // 표지 그림을 먼저 받고, 표지 그림이 없는 에피소드만 첫 방의 판을 받습니다.
    void loadCovers().then(() => Promise.all(episodes.filter(ep => !coverReady[ep.id]).map(coverOf).filter(Boolean).map(([id, view]) => prepareView(id, view)))).then(() => { if (!room) refreshHomeArt(); });
    onPause(() => { void persist(); });
    onBack(handleBack);
    addEventListener('hashchange', route);
    setInterval(tick, 1000);
    route();
  } catch (error) {
    app.innerHTML = `<main class="loading"><h1>문이 잠시 닫혔어요.</h1><p>${e(error.message)}</p><p>새로고침해 주세요.</p></main>`;
  }
}
void init();
