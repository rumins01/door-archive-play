// 문 너머 방탈출 화면입니다. 규칙은 escape-engine.js, 그림은 escape-art.js, 기기 차이는 platform.js가 맡습니다.
import {
  SAVE_KEY_V2, VIEW_W, VIEW_H, NAV_TOP, HINT_MAX, freshState, tap, combine, inputLock, move, jump, activeGoal, requestHint,
  hintsUsed, recoverSave, hotspotsIn, viewAlt, lockIn, lockControls, cleanInput, takePhoto,
} from './escape-engine.js';
import { drawView, drawItem, COLOR_NAMES, DIRECTION_NAMES } from './escape-art.js';
import { loadText, saveText, onPause, onBack, buzz } from './platform.js';

const app = document.querySelector('#app');
const sheet = document.querySelector('#sheet');
const live = document.querySelector('#live');
// ?slot=qa 처럼 저장 칸을 나누면 검수 중에도 실제 진행 기록을 건드리지 않습니다.
const slotName = new URLSearchParams(location.search).get('slot');
const KEY = slotName && /^[a-z0-9-]{1,24}$/i.test(slotName) ? `${SAVE_KEY_V2}.${slotName}` : SAVE_KEY_V2;
const NAV = { left: [0, NAV_TOP, 88, VIEW_H - NAV_TOP], right: [VIEW_W - 88, NAV_TOP, 88, VIEW_H - NAV_TOP], back: [128, NAV_TOP, 104, VIEW_H - NAV_TOP] };
const NAV_LABEL = { left: '왼쪽으로 돌기', right: '오른쪽으로 돌기', back: '돌아가기' };

const PATHS = {
  back: 'M15 5l-7 7 7 7', left: 'M15 5l-7 7 7 7', right: 'M9 5l7 7-7 7', down: 'M5 9l7 7 7-7',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  camera: 'M4 7h3l2-3h6l2 3h3v13H4V7Zm8 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  bulb: 'M9 18h6m-5 3h4M8 14a6 6 0 1 1 8 0c-1 1-1 2-1 4H9c0-2 0-3-1-4Z',
  menu: 'M4 7h16M4 12h16M4 17h16', close: 'M6 6l12 12M18 6 6 18',
  sound: 'M11 5 6 9H3v6h3l5 4V5Zm4 4a4 4 0 0 1 0 6m3-9a8 8 0 0 1 0 12', mute: 'M11 5 6 9H3v6h3l5 4V5Zm5 5 5 5m0-5-5 5',
  album: 'M4 5h16v14H4V5Zm0 10 5-5 4 4 3-3 4 4M15 9h.01', reset: 'M4 4v6h6M5 15a8 8 0 1 0 2-8l-3 3',
  help: 'M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7v.5M12 17h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  door: 'M5 21V3h11v18M3 21h18M13 12h.01', check: 'm5 12 5 5 9-10', plus: 'M12 5v14M5 12h14',
  hand: 'M9 11V5a1.5 1.5 0 0 1 3 0v6m0-1a1.5 1.5 0 0 1 3 0v1m0 0a1.5 1.5 0 0 1 3 0v4a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-3l-2-4a1.5 1.5 0 0 1 2.5-1.5L9 15',
  bag: 'M5 8h14l-1 13H6L5 8Zm4 0V6a3 3 0 0 1 6 0v2', home: 'M3 11l9-7 9 7v9h-6v-6H9v6H3v-9Z',
  clock: 'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0', trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
};
const icon = (name, size = 22) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="${PATHS[name]}"/></svg>`;
const e = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const num = n => String(n).padStart(2, '0');
const clock = sec => `${num(Math.floor(sec / 60))}:${num(sec % 60)}`;
const box = ([x, y, w, h]) => `left:${(x / VIEW_W) * 100}%;top:${(y / VIEW_H) * 100}%;width:${(w / VIEW_W) * 100}%;height:${(h / VIEW_H) * 100}%`;

let rooms = [], save = null, room = null, s = null;
let selected = null, zoomItem = null, saveTimer = 0, toastTimer = 0, revealTimer = 0, audio = null, saveWarned = false, returnFocus = null;
const fresh = new Set();

function announce(text) { live.textContent = ''; requestAnimationFrame(() => { live.textContent = text; }); }
function showSaveWarning() {
  if (document.querySelector('.save-warn')) return;
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
  const stage = document.querySelector('#stage');
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
function toast(text, items = []) {
  const t = document.querySelector('#toast');
  announce(text);
  if (!t) return;
  t.innerHTML = `${items.map(id => `<span class="toast-item">${drawItem(id)}</span>`).join('')}<span>${e(text)}</span>`;
  t.classList.remove('show');
  void t.offsetWidth;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2000);
}

function focusKey() {
  const n = document.activeElement;
  if (!n || n === document.body || !n.dataset?.act) return null;
  return `[data-act="${CSS.escape(n.dataset.act)}"]${['id', 'i', 'd', 'dir'].filter(k => n.dataset[k] !== undefined).map(k => `[data-${k}="${CSS.escape(n.dataset[k])}"]`).join('')}`;
}
function restoreFocus(selector) {
  if (!selector) return;
  const n = document.querySelector(selector);
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
    return lk && !s.open.includes(lk[0]) ? { ...NONE, lock: true } : { ...NONE, all: true };
  }
  const doorway = hotspotsIn(room, s).find(h => h.actions.some(a => (a.do ?? []).some(x => x.go === target)));
  if (doorway) return { ...NONE, spot: doorway.id };
  if (room.views[s.view].kind === 'zoom') return { ...NONE, nav: 'back' };
  const goal_wall = wallOf(target);
  return { ...NONE, nav: stepsTo(s.view, goal_wall, 'left') < stepsTo(s.view, goal_wall, 'right') ? 'left' : 'right' };
}

function renderHome() {
  document.body.dataset.screen = 'home';
  const done = rooms.filter(r => save.rooms[r.id]?.escaped).length;
  const cont = rooms.find(r => r.id === save.last && save.rooms[r.id]?.started && !save.rooms[r.id]?.escaped);
  const next = rooms.find(r => !save.rooms[r.id]?.escaped);
  const first = cont ?? next ?? rooms[0];
  const heroLabel = cont ? '이어하기' : next ? '시작하기' : '다시 보기';
  const cards = rooms.map(r => {
    const st = save.rooms[r.id];
    const status = st?.escaped ? `<span class="status done">${icon('check', 16)}<span class="sr-only">탈출 완료</span></span>` : st?.started ? '<span class="status play">진행 중</span>' : '';
    const label = `${r.title}, ${st?.escaped ? '탈출 완료' : st?.started ? '이어하기' : '시작하기'}`;
    return `<li><button class="room-card" data-act="open-room" data-id="${r.id}" aria-label="${e(label)}"><span class="thumb">${drawView(r, r.start, freshState(r))}</span><span class="info"><span class="no">${num(r.id)}</span><b>${e(r.title)}</b><small>${e(r.subtitle)}</small><span class="meta">${icon('clock', 14)}<span>${r.minutes}분</span><span class="dots" aria-label="난이도 ${r.difficulty} / 5">${'●'.repeat(r.difficulty)}${'○'.repeat(5 - r.difficulty)}</span></span></span>${status}</button></li>`;
  }).join('');
  app.innerHTML = `<main class="home" id="main">
    <header class="home-top"><h1 class="brand">${icon('door', 26)}<span>문 너머</span></h1><button class="icon-btn" data-act="guide" aria-label="조작 안내">${icon('help')}</button></header>
    <section class="hero"><img src="assets/archive.jpg" alt="" width="1536" height="1024" fetchpriority="high"><div class="hero-copy"><p class="hero-line">단서를 찾고, 물건을 합쳐, 문을 여세요.</p><button class="btn primary" data-act="open-room" data-id="${first.id}">${heroLabel} ${icon('right', 18)}</button></div></section>
    <h2 class="list-title">방 <span>${done} / ${rooms.length}</span></h2>
    <ul class="rooms">${cards}</ul>
    <p class="legacy"><a href="legacy.html">이전 버전 사건 기록 24개</a></p>
  </main>`;
  if (saveWarned) showSaveWarning();
}

function renderGame() {
  document.body.dataset.screen = 'game';
  app.innerHTML = `<div class="game" id="main">
    <header class="bar">
      <button class="icon-btn" data-act="home" aria-label="방 목록으로">${icon('back')}</button>
      <div class="where"><b>${e(room.title)}</b><small id="where-view"></small></div>
      <button class="icon-btn" data-act="reveal" aria-label="살펴볼 곳 보기">${icon('eye')}</button>
      <button class="icon-btn" data-act="photo" aria-label="사진 찍기">${icon('camera')}</button>
      <button class="icon-btn" data-act="hint" aria-label="힌트">${icon('bulb')}</button>
      <button class="icon-btn" data-act="menu" aria-label="메뉴">${icon('menu')}</button>
    </header>
    <div class="stage-wrap"><div class="backdrop" id="backdrop" aria-hidden="true"></div><div class="stage" id="stage"><div class="scene" id="scene"></div><div class="overlay" id="overlay"></div><div class="toast" id="toast" aria-hidden="true"></div></div></div>
    <nav class="bag" id="bag" aria-label="가방"></nav>
  </div>`;
  if (saveWarned) showSaveWarning();
  paint();
}
function paint() {
  const f = focusKey();
  paintBar(); paintScene(); paintOverlay(); paintBag();
  restoreFocus(f);
}
// 위 막대의 작은 글씨는 지금 시점 이름이고, 물건을 고르면 그 물건 이름으로 바뀝니다.
// 고른 물건을 알림 띠로 띄우면 장면 위 단서를 가리므로 막대에만 표시합니다.
function paintBar() {
  const where = document.querySelector('#where-view');
  if (!where) return;
  const held = selected && s.inv.includes(selected) ? room.items[selected].name : null;
  where.classList.toggle('is-held', !!held);
  where.innerHTML = held ? `${icon('hand', 14)}<span>${e(held)}</span>` : e(room.views[s.view].name);
}
function paintScene() {
  const scene = document.querySelector('#scene');
  if (!scene) return;
  const view = room.views[s.view];
  const focus = hintFocus();
  let html = drawView(room, s.view, s, viewAlt(room, s));
  for (const h of hotspotsIn(room, s)) html += `<button class="spot${focus.all || focus.spot === h.id ? ' is-hint' : ''}" data-act="spot" data-id="${e(h.id)}" style="${box(h.rect)}" aria-label="${e(h.label)}"></button>`;
  const lk = lockIn(room, s.view);
  if (lk && !s.open.includes(lk[0])) html += lockButtons(lk[0], lk[1], focus.lock);
  if (view.kind === 'wall') html += navButton('left', focus.nav) + navButton('right', focus.nav);
  else html += navButton('back', focus.nav);
  scene.innerHTML = html;
  // 키가 큰 화면에서 장면 위아래에 남는 공간은 같은 그림을 흐리게 깔아 빈 띠처럼 보이지 않게 합니다.
  const backdrop = document.querySelector('#backdrop');
  if (backdrop) backdrop.innerHTML = drawView(room, s.view, s).replace('xMidYMid meet', 'xMidYMid slice');
}
function navButton(dir, hint) {
  return `<button class="nav nav-${dir}${hint === dir ? ' is-hint' : ''}" data-act="nav" data-dir="${dir}" style="${box(NAV[dir])}" aria-label="${NAV_LABEL[dir]}"><span>${icon(dir === 'back' ? 'down' : dir, 24)}</span></button>`;
}
function lockButtons(id, lock, hint) {
  const draft = cleanInput(lock, s.drafts[id]);
  const buttons = lockControls(lock).map(c => {
    let label, data;
    if (lock.type === 'color') { label = `${lock.label} ${c.index + 1}번, 지금 ${COLOR_NAMES[draft[c.index]] ?? draft[c.index]}`; data = `data-i="${c.index}"`; }
    else if (lock.type === 'dial') { label = `${c.index + 1}번째 숫자 ${c.delta > 0 ? '올리기' : '내리기'}, 지금 ${draft[c.index]}`; data = `data-i="${c.index}" data-d="${c.delta}"`; }
    else { label = `${DIRECTION_NAMES[c.dir]} 화살표`; data = `data-dir="${c.dir}"`; }
    return `<button class="ctrl${hint ? ' is-hint' : ''}" data-act="lock" ${data} style="${box([c.x, c.y, c.w, c.h])}" aria-label="${e(label)}"></button>`;
  }).join('');
  return buttons + (lock.type === 'direction' ? `<span class="sr-only">${draft.length} / ${lock.answer.length} 입력</span>` : '');
}
function paintOverlay() {
  const overlay = document.querySelector('#overlay');
  if (!overlay) return;
  overlay.className = 'overlay';
  if (!s.started) {
    overlay.classList.add('is-on');
    overlay.innerHTML = `<div class="panel intro"><p class="kicker">ROOM ${num(room.id)}</p><h2>${e(room.title)}</h2>${room.intro.map(line => `<p>${e(line)}</p>`).join('')}<button class="btn primary wide" data-act="begin">들어가기 ${icon('right', 18)}</button></div>`;
    return;
  }
  if (s.escaped) {
    document.querySelector('#toast')?.classList.remove('show');
    overlay.classList.add('is-on');
    overlay.innerHTML = `<div class="panel outro"><span class="outro-mark">${icon('door', 40)}</span><h2>${e(room.outro.title)}</h2>${room.outro.lines.map(line => `<p>${e(line)}</p>`).join('')}<dl class="stats"><div><dt>${icon('clock', 16)}<span>시간</span></dt><dd>${clock(s.seconds)}</dd></div><div><dt>${icon('bulb', 16)}<span>힌트</span></dt><dd>${hintsUsed(s)}</dd></div></dl><div class="row"><button class="btn" data-act="replay">${icon('reset', 18)} 다시 하기</button><button class="btn primary" data-act="home">방 목록 ${icon('right', 18)}</button></div></div>`;
    return;
  }
  if (zoomItem && s.inv.includes(zoomItem)) {
    const item = room.items[zoomItem];
    overlay.classList.add('is-on', 'is-item');
    overlay.innerHTML = `<section class="item-zoom" aria-label="${e(item.name)} 크게 보기"><button class="icon-btn item-close" data-act="zoom-close" aria-label="닫기">${icon('close')}</button><div class="item-big">${drawItem(zoomItem, item.name)}</div><p class="item-name">${e(item.name)}</p>${item.note ? `<p class="item-note">${e(item.note)}</p>` : ''}${room.recipes.some(r => r.a === zoomItem || r.b === zoomItem) ? `<p class="item-tip">${icon('plus', 16)}<span>가방의 다른 물건을 눌러 합쳐 보세요.</span></p>` : ''}</section>`;
    return;
  }
  zoomItem = null;
  overlay.innerHTML = '';
}
function paintBag() {
  const bag = document.querySelector('#bag');
  if (!bag) return;
  const focus = hintFocus();
  const count = Math.max(6, s.inv.length);
  let html = '';
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
}

function play(events) {
  const gains = [];
  for (const ev of events) {
    if (ev.type === 'gain') { gains.push(ev.item); fresh.add(ev.item); }
    else if (ev.type === 'fx') fx(ev.name);
    else if (ev.type === 'say' && ev.text) toast(ev.text);
    else if (ev.type === 'escape') { sfx('open'); void persist(); }
  }
  if (gains.length) {
    toast(`+ ${gains.map(id => room.items[id].name).join(', ')}`, gains);
    if (!events.some(ev => ev.type === 'fx')) sfx('pick');
  }
}
function changed(before) {
  const turned = before !== s.view;
  scheduleSave();
  paint();
  if (turned) {
    const scene = document.querySelector('#scene');
    scene.classList.remove('turn');
    void scene.offsetWidth;
    scene.classList.add('turn');
    announce(room.views[s.view].name);
  }
}
function onSpot(id) {
  const before = s.view;
  const held = selected;
  const result = tap(room, s, id, held);
  if (!result.ok) return;
  if (result.used || (held && !s.inv.includes(held))) selected = null;
  if (result.rejected) toast('여기에는 쓸 수 없어요.');
  else if (!result.events.length) sfx('tap');
  play(result.events);
  changed(before);
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
    document.querySelector('[data-act="zoom-close"]')?.focus({ preventScroll: true });
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
  let draft = cleanInput(lock, s.drafts[id]);
  if (lock.type === 'color') {
    const i = Number(button.dataset.i), p = lock.palette;
    draft[i] = p[(p.indexOf(draft[i]) + 1) % p.length];
  } else if (lock.type === 'dial') {
    const i = Number(button.dataset.i), size = (lock.max ?? 9) + 1;
    draft[i] = (draft[i] + Number(button.dataset.d) + size) % size;
  } else draft = [...draft, button.dataset.dir];
  const result = inputLock(room, s, id, draft);
  if (!result.ok) return;
  sfx('click');
  if (result.open) announce(`${lock.label}가 풀렸어요.`);
  if (result.wrong) toast('맞지 않아요.');
  play(result.events);
  changed(s.view);
}
function onNav(dir) {
  const before = s.view;
  if (dir === 'back') jump(room, s, room.views[s.view].back);
  else move(room, s, dir);
  changed(before);
}
function reveal() {
  const scene = document.querySelector('#scene');
  if (!scene) return;
  scene.classList.add('reveal');
  clearTimeout(revealTimer);
  revealTimer = setTimeout(() => scene.classList.remove('reveal'), 1600);
  announce(`살펴볼 곳 ${hotspotsIn(room, s).length}개`);
}

function openSheet(html, labelledBy = 'sheet-title') {
  if (!sheet.open) returnFocus = focusKey();
  sheet.setAttribute('aria-labelledby', labelledBy);
  sheet.innerHTML = `<div class="sheet-inner">${html}</div>`;
  if (!sheet.open) sheet.showModal();
}
function closeSheet() { if (sheet.open) sheet.close(); }
const sheetHead = (title, glyph) => `<div class="sheet-head"><h2 id="sheet-title">${icon(glyph, 20)}<span>${e(title)}</span></h2><button class="icon-btn" data-act="close" aria-label="닫기">${icon('close')}</button></div>`;

function showHint() {
  const goal = activeGoal(room, s);
  if (!goal) { openSheet(`${sheetHead('힌트', 'bulb')}<p class="sheet-copy">이미 탈출했어요.</p>`); return; }
  const n = s.hints[goal.id] || 0;
  const more = n >= HINT_MAX ? '모든 힌트를 열었어요' : n === 0 ? '힌트 보기' : '다음 힌트';
  openSheet(`${sheetHead('힌트', 'bulb')}
    ${n ? `<ol class="hints">${goal.hints.slice(0, n).map((h, i) => `<li><b>${i + 1}</b><span>${e(h)}</span></li>`).join('')}</ol>` : '<p class="sheet-copy">막힌 곳이 있으면 한 단계씩 열어 보세요.</p>'}
    ${n === HINT_MAX - 1 ? '<p class="sheet-warn">다음 힌트는 정답이에요.</p>' : ''}
    <button class="btn primary wide" data-act="hint-more" ${n >= HINT_MAX ? 'disabled' : ''}>${more}</button>`);
}
function showMenu() {
  openSheet(`${sheetHead('메뉴', 'menu')}<div class="menu-list">
    <button data-act="album">${icon('album')}<span>사진</span><small>${s.photos.length}장</small></button>
    <button data-act="sound" aria-pressed="${save.sound}">${icon(save.sound ? 'sound' : 'mute')}<span>소리와 진동</span><small>${save.sound ? '켜짐' : '꺼짐'}</small></button>
    <button data-act="guide">${icon('help')}<span>조작 안내</span></button>
    <button data-act="reset">${icon('reset')}<span>처음부터</span></button>
    <button data-act="home">${icon('home')}<span>방 목록</span></button>
  </div>`);
}
function photoState(photo) { return { ...freshState(room), ...structuredClone(photo), inv: [...photo.got] }; }
function showAlbum() {
  const list = s.photos.map((photo, i) => `<button class="photo" data-act="photo-open" data-i="${i}" aria-label="${e(room.views[photo.view].name)} 사진 ${i + 1}">${drawView(room, photo.view, photoState(photo))}</button>`).join('');
  openSheet(`${sheetHead('사진', 'album')}${list ? `<div class="photos">${list}</div>` : `<p class="sheet-copy empty-photo">${icon('camera', 28)}<span>카메라 버튼으로 장면을 찍어 두세요.</span></p>`}`);
}
function showPhoto(i) {
  const photo = s.photos[i];
  if (!photo) { showAlbum(); return; }
  openSheet(`${sheetHead(room.views[photo.view].name, 'album')}<div class="photo-big">${drawView(room, photo.view, photoState(photo), viewAlt(room, photoState(photo), photo.view))}</div><div class="row"><button class="btn" data-act="photo-delete" data-i="${i}">${icon('trash', 18)} 지우기</button><button class="btn primary" data-act="album">목록</button></div>`);
}
function showGuide() {
  openSheet(`${sheetHead('이렇게 해요', 'help')}<ol class="guide">
    <li><span class="g-icon">${icon('hand', 26)}</span><span>궁금한 곳을 눌러 살펴봐요.</span></li>
    <li><span class="g-icon">${icon('left', 22)}${icon('right', 22)}</span><span>화살표로 방을 둘러봐요.</span></li>
    <li><span class="g-icon">${icon('bag', 26)}</span><span>물건을 고르고 쓸 곳을 눌러요.</span></li>
    <li><span class="g-icon">${icon('plus', 26)}</span><span>고른 물건을 한 번 더 누르면 크게 보고 합칠 수 있어요.</span></li>
    <li><span class="g-icon">${icon('eye', 20)}${icon('camera', 20)}${icon('bulb', 20)}</span><span>살펴볼 곳, 사진, 힌트를 써 보세요.</span></li>
  </ol><button class="btn primary wide" data-act="guide-done">알겠어요</button>`);
}
function confirmReset() {
  openSheet(`${sheetHead('처음부터 할까요?', 'reset')}<p class="sheet-copy">이 방의 물건, 사진, 힌트 기록이 지워져요.</p><div class="row"><button class="btn" data-act="close">계속하기</button><button class="btn danger" data-act="confirm-reset">처음부터</button></div>`);
}
function restart() {
  save.rooms[room.id] = freshState(room);
  s = save.rooms[room.id];
  selected = null; zoomItem = null;
  void persist();
  paint();
}

function route() {
  const match = location.hash.match(/^#room\/(\d+)$/);
  const next = match ? rooms.find(r => r.id === Number(match[1])) : null;
  closeSheet();
  selected = null; zoomItem = null;
  if (next) {
    room = next;
    save.rooms[room.id] ??= freshState(room);
    s = save.rooms[room.id];
    save.last = room.id;
    scheduleSave();
    renderGame();
  } else {
    room = null; s = null;
    renderHome();
  }
  document.title = room ? `${room.title} | 문 너머` : '문 너머';
  scrollTo(0, 0);
}
function goHome() {
  closeSheet();
  void persist();
  if (location.hash) location.hash = '';
  else route();
}
function handleBack() {
  if (sheet.open) { closeSheet(); return true; }
  if (!room) return false;
  if (zoomItem) { zoomItem = null; paint(); return true; }
  if (room.views[s.view].kind === 'zoom' && s.started && !s.escaped) { onNav('back'); return true; }
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
  if (act === 'open-room') { location.hash = `room/${b.dataset.id}`; return; }
  if (act === 'home') { goHome(); return; }
  if (!room) return;
  if (act === 'begin') { s.started = true; scheduleSave(); paint(); if (!save.tutorial) showGuide(); return; }
  if (act === 'menu') { showMenu(); return; }
  if (act === 'hint') { showHint(); return; }
  if (act === 'hint-more') { requestHint(room, s); scheduleSave(); showHint(); paint(); return; }
  if (act === 'album') { showAlbum(); return; }
  if (act === 'photo-open') { showPhoto(Number(b.dataset.i)); return; }
  if (act === 'photo-delete') { s.photos.splice(Number(b.dataset.i), 1); scheduleSave(); showAlbum(); return; }
  if (act === 'sound') { save.sound = !save.sound; scheduleSave(); sfx('open'); showMenu(); return; }
  if (act === 'reset') { confirmReset(); return; }
  if (act === 'confirm-reset' || act === 'replay') { closeSheet(); restart(); return; }
  if (!s.started || s.escaped) return;
  if (act === 'spot') onSpot(b.dataset.id);
  else if (act === 'item') onItem(b.dataset.id);
  else if (act === 'zoom-close') { zoomItem = null; paint(); restoreFocus(`[data-act="item"][data-id="${CSS.escape(selected ?? '')}"]`); }
  else if (act === 'lock') onLock(b);
  else if (act === 'nav') onNav(b.dataset.dir);
  else if (act === 'reveal') reveal();
  else if (act === 'photo') { takePhoto(s); fx('photo'); toast(`사진 ${s.photos.length}장`); scheduleSave(); }
});
document.addEventListener('pointerdown', event => {
  const scene = event.target.closest?.('#scene');
  const stage = document.querySelector('#stage');
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
  if (!room || sheet.open || !s?.started || s.escaped || event.altKey || event.metaKey || event.ctrlKey) return;
  if (room.views[s.view].kind === 'wall' && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
    event.preventDefault();
    onNav(event.key === 'ArrowLeft' ? 'left' : 'right');
  }
});
sheet.addEventListener('click', event => { if (event.target === sheet) closeSheet(); });
sheet.addEventListener('close', () => {
  if (room && !save.tutorial && s?.started && sheet.querySelector('[data-act="guide-done"]')) { save.tutorial = true; scheduleSave(); }
  restoreFocus(returnFocus);
  returnFocus = null;
});

function tick() {
  if (!room || !s?.started || s.escaped || document.hidden || sheet.open) return;
  s.seconds++;
  if (s.seconds % 15 === 0) scheduleSave();
}

async function init() {
  try {
    const response = await fetch('./escape.json');
    if (!response.ok) throw new Error('방 정보를 읽지 못했어요.');
    rooms = await response.json();
    let raw = null;
    try { raw = JSON.parse((await loadText(KEY)) || 'null'); } catch { raw = null; }
    save = recoverSave(raw, rooms);
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
