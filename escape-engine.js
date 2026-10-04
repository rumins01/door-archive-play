// 문 너머 방탈출 규칙 엔진입니다. DOM, 저장소, 앱 환경을 모르는 순수 규칙만 둡니다.
export const SAVE_KEY_V2 = 'beyond-the-door.v2';
export const HINT_MAX = 3;
export const DIRECTIONS = ['up', 'right', 'down', 'left'];
export const ROTATIONS = DIRECTIONS;
export const LOCK_TYPES = ['color', 'dial', 'direction', 'symbol', 'switch', 'rotate', 'keypad'];
export const SEQUENCE_LOCKS = ['direction', 'symbol', 'keypad'];
export const KEYPAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '<'];
export const ITEM_KINDS = ['tool', 'note', 'secret'];
export const FX = ['open', 'rattle', 'light', 'drop'];
export const VIEW_W = 360;
export const VIEW_H = 480;
// 장면 좌표 60칸은 너비 320px 세로 화면에서 약 53px, 높이 375px 가로 화면에서 약 47px입니다.
// 터치 영역 최소 기준(44px)을 지키려고 조사 영역과 자물쇠 버튼 모두 이 값 이상으로 만듭니다.
export const MIN_HOTSPOT = 60;
// 장면 아래쪽 띠(420~480)는 시점 이동 화살표 자리라서 조사 영역을 두지 않습니다.
export const NAV_TOP = 420;
export const CONTROL = 60;
export const PAD_GAP = 60;
// 고정한 사진이 장면 위쪽 모서리에 놓이므로 자물쇠 버튼은 이 높이 아래에 둡니다.
export const PIN_H = 124;
export const PIN_ZONE = [VIEW_W - Math.round(PIN_H * .75), 0, Math.round(PIN_H * .75), PIN_H];
export const KEY_GAP = 64;
export const PHOTO_MAX = 12;
export const AUTO_PHOTO_MAX = 12;
// 화면 글을 짧게 유지하려고 글자 수 상한을 둡니다.
export const LIMITS = { intro: 60, line: 72, caption: 40, enter: 40, name: 14, note: 72, hint: 80, title: 18, subtitle: 30 };

const list = value => (Array.isArray(value) ? value : []);
const unique = values => [...new Set(values)];

// 자물쇠 조작 버튼의 위치입니다. 화면과 검증이 같은 좌표를 씁니다.
export function lockControls(lock) {
  const half = CONTROL / 2;
  const at = list(lock.at);
  if (['color', 'rotate', 'switch'].includes(lock.type)) return at.map(([x, y], index) => ({ index, x: x - half, y: y - half, w: CONTROL, h: CONTROL }));
  if (lock.type === 'symbol') return at.map(([x, y], index) => ({ index, sym: list(lock.symbols)[index], x: x - half, y: y - half, w: CONTROL, h: CONTROL }));
  if (lock.type === 'dial') return at.flatMap(([x, y], index) => [
    { index, delta: 1, x: x - half, y: y - CONTROL, w: CONTROL, h: CONTROL },
    { index, delta: -1, x: x - half, y, w: CONTROL, h: CONTROL },
  ]);
  if (lock.type === 'direction') {
    const [x, y] = at[0] ?? [0, 0];
    return [['up', 0, -PAD_GAP], ['right', PAD_GAP, 0], ['down', 0, PAD_GAP], ['left', -PAD_GAP, 0]]
      .map(([dir, dx, dy]) => ({ dir, x: x + dx - half, y: y + dy - half, w: CONTROL, h: CONTROL }));
  }
  if (lock.type === 'keypad') {
    const [x, y] = at[0] ?? [0, 0];
    return KEYPAD_KEYS.map((key, i) => ({ key, x: x + ((i % 3) - 1) * KEY_GAP - half, y: y + (Math.floor(i / 3) - 1.5) * KEY_GAP - half, w: CONTROL, h: CONTROL }));
  }
  return [];
}
export const lockIn = (room, viewId) => Object.entries(room.locks).find(([, lock]) => lock.view === viewId) ?? null;
export const lockReady = (lock, s) => all(lock?.if, s);
const overlaps = (a, b) => a[0] < b[0] + b[2] && b[0] < a[0] + a[2] && a[1] < b[1] + b[3] && b[1] < a[1] + a[3];
const negate = cond => (cond.startsWith('!') ? cond.slice(1) : `!${cond}`);
const exclusive = (a, b) => list(a).some(cond => list(b).includes(negate(cond)));

export function check(cond, s) {
  const negative = cond.startsWith('!');
  const key = negative ? cond.slice(1) : cond;
  let value;
  if (key === 'escaped') value = s.escaped === true;
  else if (key.startsWith('got:')) value = s.got.includes(key.slice(4));
  else if (key.startsWith('has:')) value = s.inv.includes(key.slice(4));
  else if (key.startsWith('open:')) value = s.open.includes(key.slice(5));
  else value = s.flags.includes(key);
  return negative ? !value : value;
}
export const all = (conds, s) => list(conds).every(cond => check(cond, s));

export function freshState(room) {
  return { view: room.start, inv: [], got: [], flags: [], open: [], drafts: {}, hints: {}, photos: [], seen: [], autoDone: [], pin: null, seconds: 0, mistakes: 0, escaped: false, cleared: false, secret: false, best: null, started: false };
}

// 사진은 그 순간의 장면 상태만 기억합니다. 화면은 같은 그림 함수로 다시 그립니다.
// 같은 장면을 같은 상태로 다시 찍으면 새로 쌓지 않고 앞으로 옮깁니다.
export function photoSig(room, s, viewId = s.view) {
  const lk = lockIn(room, viewId);
  return JSON.stringify([viewId, [...list(s.flags)].sort(), [...list(s.open)].sort(), [...list(s.got)].sort(), lk ? s.drafts?.[lk[0]] ?? null : null]);
}
// 돌려주는 added는 수첩에 새 사진이 들어갔는지 알려 줍니다. 자동 기록은 시점마다 한 번만 합니다.
export function takePhoto(room, s, { auto = false } = {}) {
  const sig = photoSig(room, s);
  if (auto && !s.autoDone.includes(s.view)) s.autoDone.push(s.view);
  const old = s.photos.find(p => p.sig === sig);
  if (auto && old) return { photo: old, added: false };
  const photo = { view: s.view, flags: [...s.flags], open: [...s.open], got: [...s.got], drafts: structuredClone(s.drafts), auto, sig };
  const merged = [photo, ...s.photos.filter(p => p.sig !== sig)];
  let manual = 0, autos = 0;
  s.photos = merged.filter(p => (p.auto ? ++autos <= AUTO_PHOTO_MAX : ++manual <= PHOTO_MAX));
  return { photo, added: true };
}
// clue가 true면 처음 볼 때, 조건 목록이면 조건이 맞을 때 자동으로 기록합니다.
export function clueActive(room, s, viewId = s.view) {
  const c = room.views[viewId]?.clue;
  return c === true || (Array.isArray(c) && all(c, s));
}
// 단서 장면은 조건이 맞은 뒤 한 번만 자동으로 기록합니다.
export const needsAutoPhoto = (room, s) => clueActive(room, s) && !s.autoDone.includes(s.view);
export function markSeen(s, viewId = s.view) {
  if (s.seen.includes(viewId)) return false;
  s.seen.push(viewId);
  return true;
}

export function cleanInput(lock, value) {
  const raw = list(value), start = list(lock.start), n = list(lock.answer).length;
  const pick = (ok, i, fallback) => (ok(raw[i]) ? raw[i] : ok(start[i]) ? start[i] : fallback);
  const palette = list(lock.palette);
  // 색 단추는 처음부터 서로 다른 색으로 시작해서 누르면 색이 바뀌는 장치라는 것이 보이게 합니다.
  if (lock.type === 'color') return Array.from({ length: n }, (_, i) => pick(v => palette.includes(v), i, palette[i % palette.length]));
  if (lock.type === 'rotate') return Array.from({ length: n }, (_, i) => pick(v => ROTATIONS.includes(v), i, 'up'));
  if (lock.type === 'switch') return Array.from({ length: n }, (_, i) => pick(v => v === 0 || v === 1, i, 0));
  if (lock.type === 'dial') {
    const max = lock.max ?? 9;
    return Array.from({ length: n }, (_, i) => pick(v => Number.isInteger(v) && v >= 0 && v <= max, i, 0));
  }
  if (lock.type === 'direction') return raw.filter(d => DIRECTIONS.includes(d)).slice(0, n);
  if (lock.type === 'symbol') return raw.filter(d => list(lock.symbols).includes(d)).slice(0, n);
  if (lock.type === 'keypad') return raw.filter(d => (Number.isInteger(d) && d >= 0 && d <= 9) || /^\d$/.test(d)).map(Number).slice(0, n);
  return [];
}
export const draftOf = (lock, s, id) => cleanInput(lock, s.drafts[id]);
const same = (a, b) => a.length === b.length && a.every((v, i) => String(v) === String(b[i]));

export function hotspotsIn(room, s, viewId = s.view) {
  return room.hotspots.filter(h => h.view === viewId && all(h.if, s));
}
export function viewAlt(room, s, viewId = s.view) {
  const view = room.views[viewId];
  return list(view.alts).find(alt => all(alt.if, s))?.text ?? view.alt;
}

const kindOf = (room, id) => room.items[id]?.kind ?? 'tool';
function run(room, s, effects) {
  const events = [];
  for (const e of list(effects)) {
    if (e.go) { s.view = e.go; events.push({ type: 'go', view: e.go }); }
    if (e.set && !s.flags.includes(e.set)) s.flags.push(e.set);
    if (e.gain && !s.got.includes(e.gain)) {
      const kind = kindOf(room, e.gain);
      s.got.push(e.gain);
      if (kind === 'tool') s.inv.push(e.gain);
      if (kind === 'secret') s.secret = true;
      events.push({ type: kind === 'tool' ? 'gain' : kind, item: e.gain });
    }
    if (e.lose && s.inv.includes(e.lose)) { s.inv = s.inv.filter(item => item !== e.lose); events.push({ type: 'lose', item: e.lose }); }
    if (e.say) events.push({ type: 'say', text: room.captions[e.say] });
    if (e.fx) events.push({ type: 'fx', name: e.fx });
    if (e.escape) { s.escaped = true; s.cleared = true; events.push({ type: 'escape' }); }
  }
  return events;
}

// 사용자가 현재 시점의 물체를 누릅니다. item을 고른 상태라면 그 물건을 쓰는 행동을 먼저 찾습니다.
export function tap(room, s, hotspotId, item = null) {
  const h = room.hotspots.find(spot => spot.id === hotspotId);
  if (!h || h.view !== s.view || !all(h.if, s) || s.escaped) return { ok: false, used: false, events: [] };
  const held = item && s.inv.includes(item) ? item : null;
  const usable = held ? h.actions.find(a => a.use === held && all(a.if, s)) : null;
  // 지금 물건을 기다리는 대상에 맞지 않는 물건을 쓰면 아무 일도 일어나지 않습니다.
  // 물건을 기다리지 않는 대상(확대, 줍기, 열린 문)은 물건을 들고 있어도 평소처럼 반응합니다.
  const wantsItem = h.actions.some(a => a.use && all(a.if, s));
  if (held && !usable && wantsItem) return { ok: true, used: false, rejected: true, events: [{ type: 'fx', name: 'rattle' }] };
  const action = usable ?? h.actions.find(a => !a.use && all(a.if, s));
  if (!action) return { ok: true, used: false, rejected: false, events: [{ type: 'fx', name: 'rattle' }] };
  return { ok: true, used: !!usable, rejected: false, events: run(room, s, action.do) };
}

// 가방 속 두 물건을 합칩니다. 실패하면 아무것도 잃지 않습니다.
export function combine(room, s, a, b) {
  if (s.escaped || a === b || !s.inv.includes(a) || !s.inv.includes(b)) return { ok: false, events: [] };
  const recipe = room.recipes.find(r => (r.a === a && r.b === b) || (r.a === b && r.b === a));
  if (!recipe) return { ok: false, events: [{ type: 'fx', name: 'rattle' }] };
  const at = Math.min(s.inv.indexOf(a), s.inv.indexOf(b));
  s.inv = s.inv.filter(item => item !== a && item !== b);
  s.inv.splice(at, 0, recipe.make);
  if (!s.got.includes(recipe.make)) s.got.push(recipe.make);
  return { ok: true, item: recipe.make, events: [{ type: 'gain', item: recipe.make }] };
}

// 자물쇠 입력을 반영합니다. 색, 숫자, 스위치, 회전은 맞는 순간 열리고, 순서형은 끝까지 누른 뒤 판정합니다.
export function inputLock(room, s, lockId, value) {
  const lock = room.locks[lockId];
  if (!lock || s.escaped || s.open.includes(lockId) || s.view !== lock.view || !all(lock.if, s)) return { ok: false, open: false, events: [] };
  const input = cleanInput(lock, value);
  s.drafts[lockId] = input;
  const sequence = SEQUENCE_LOCKS.includes(lock.type);
  if (sequence && input.length < lock.answer.length) return { ok: true, open: false, events: [] };
  if (same(input, lock.answer)) {
    s.open.push(lockId);
    delete s.drafts[lockId];
    return { ok: true, open: true, events: run(room, s, lock.onOpen) };
  }
  if (sequence) {
    s.mistakes++;
    s.drafts[lockId] = [];
    return { ok: true, open: false, wrong: true, events: [{ type: 'fx', name: 'rattle' }] };
  }
  return { ok: true, open: false, events: [] };
}

export function move(room, s, direction) {
  const next = room.views[s.view]?.[direction];
  if (!next || !room.views[next] || s.escaped) return false;
  s.view = next;
  return true;
}
export function jump(room, s, viewId) {
  if (!room.views[viewId] || s.escaped) return false;
  s.view = viewId;
  return true;
}

export function activeGoal(room, s) {
  if (s.escaped) return null;
  return room.goals.find(g => all(g.if, s) && !all(g.done, s)) ?? null;
}
export function requestHint(room, s) {
  const goal = activeGoal(room, s);
  if (!goal) return null;
  s.hints[goal.id] = Math.min(HINT_MAX, (s.hints[goal.id] || 0) + 1);
  return goal;
}
export const hintsUsed = s => Object.values(s.hints).reduce((sum, n) => sum + n, 0);
export function progress(room, s) {
  const done = s.escaped ? room.goals.length : room.goals.filter(g => all(g.done, s)).length;
  return { done, total: room.goals.length };
}

export function knownFlags(room) {
  const flags = new Set();
  const scan = effects => list(effects).forEach(e => e.set && flags.add(e.set));
  list(room.hotspots).forEach(h => list(h.actions).forEach(a => scan(a.do)));
  Object.values(room.locks ?? {}).forEach(l => scan(l.onOpen));
  return flags;
}
export function condKnown(room, cond) {
  if (typeof cond !== 'string') return false;
  const key = cond.replace(/^!/, '');
  if (key === 'escaped') return true;
  if (key.startsWith('got:') || key.startsWith('has:')) return !!room.items?.[key.slice(4)];
  if (key.startsWith('open:')) return !!room.locks?.[key.slice(5)];
  return knownFlags(room).has(key);
}

// 조사 영역에 rect 대신 prop(그림 부품 id)을 적으면 그 부품의 크기로 영역을 만듭니다.
export function resolveRoom(room) {
  if (!list(room?.hotspots).some(h => h.prop && !h.rect)) return room;
  const copy = structuredClone(room);
  for (const h of copy.hotspots) {
    if (h.rect || !h.prop) continue;
    const p = list(copy.views?.[h.view]?.props).find(x => x.id === h.prop);
    if (!p || ![p.x, p.y, p.w, p.h].every(Number.isFinite)) continue;
    const pad = Number.isFinite(h.pad) ? h.pad : 6;
    const w = Math.min(VIEW_W, Math.max(MIN_HOTSPOT, p.w + pad * 2));
    const hh = Math.min(NAV_TOP, Math.max(MIN_HOTSPOT, p.h + pad * 2));
    const x = Math.max(0, Math.min(VIEW_W - w, p.x + p.w / 2 - w / 2));
    const y = Math.max(0, Math.min(NAV_TOP - hh, p.y + p.h / 2 - hh / 2));
    h.rect = [Math.floor(x), Math.floor(y), Math.ceil(w), Math.ceil(hh)];
  }
  return copy;
}

// 저장된 진행을 현재 콘텐츠 기준으로 다시 검증합니다. 이전 판(v1) 저장은 다른 키에 그대로 둡니다.
export function recoverSave(raw, rooms) {
  const out = { version: 2, rooms: {}, sound: false, tutorial: false, autoClue: true, autoTold: false, pinTold: false, last: null };
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || raw.version !== 2) return out;
  out.sound = raw.sound === true;
  out.tutorial = raw.tutorial === true;
  out.autoClue = raw.autoClue !== false;
  out.autoTold = raw.autoTold === true;
  out.pinTold = raw.pinTold === true;
  if (rooms.some(r => r.id === raw.last)) out.last = raw.last;
  for (const room of rooms) {
    const old = raw.rooms?.[room.id];
    if (!old || typeof old !== 'object' || Array.isArray(old)) continue;
    const s = freshState(room);
    const flags = knownFlags(room);
    if (typeof old.view === 'string' && room.views[old.view]) s.view = old.view;
    s.got = unique(list(old.got).filter(id => room.items[id]));
    s.inv = unique(list(old.inv).filter(id => s.got.includes(id) && kindOf(room, id) === 'tool'));
    s.flags = unique(list(old.flags).filter(f => flags.has(f)));
    s.open = unique(list(old.open).filter(id => room.locks[id]));
    s.seen = unique(list(old.seen).filter(id => room.views[id]));
    for (const [id, lock] of Object.entries(room.locks)) {
      if (s.open.includes(id) || old.drafts?.[id] === undefined) continue;
      const draft = cleanInput(lock, old.drafts[id]);
      s.drafts[id] = SEQUENCE_LOCKS.includes(lock.type) ? draft.slice(0, lock.answer.length - 1) : draft;
    }
    for (const goal of room.goals) {
      const n = old.hints?.[goal.id];
      if (Number.isInteger(n) && n > 0 && n <= HINT_MAX) s.hints[goal.id] = n;
    }
    s.photos = list(old.photos).filter(ph => ph && typeof ph === 'object' && room.views[ph.view]).map(ph => {
      const photo = {
        view: ph.view,
        flags: unique(list(ph.flags).filter(f => flags.has(f))),
        open: unique(list(ph.open).filter(id => room.locks[id])),
        got: unique(list(ph.got).filter(id => room.items[id])),
        drafts: Object.fromEntries(Object.entries(room.locks).filter(([id]) => ph.drafts?.[id] !== undefined).map(([id, lock]) => [id, cleanInput(lock, ph.drafts[id])])),
        auto: ph.auto === true,
      };
      photo.sig = photoSig(room, photo, photo.view);
      return photo;
    }).filter((p, i, arr) => arr.findIndex(q => q.sig === p.sig) === i);
    let manual = 0, autos = 0;
    s.photos = s.photos.filter(p => (p.auto ? ++autos <= AUTO_PHOTO_MAX : ++manual <= PHOTO_MAX));
    s.autoDone = unique([...list(old.autoDone), ...list(old.photos).filter(p => p?.auto === true).map(p => p.view)].filter(id => room.views[id]));
    s.pin = typeof old.pin === 'string' && s.photos.some(p => p.sig === old.pin) ? old.pin : null;
    s.seconds = Number.isFinite(old.seconds) ? Math.max(0, Math.floor(old.seconds)) : 0;
    s.mistakes = Number.isFinite(old.mistakes) ? Math.max(0, Math.floor(old.mistakes)) : 0;
    s.started = old.started === true;
    s.escaped = old.escaped === true && room.hotspots.some(h => h.actions.some(a => all(a.if, s) && list(a.do).some(e => e.escape)));
    // 다시 하기를 눌러도 한 번 탈출한 기록은 남겨 다음 방이 다시 잠기지 않게 합니다.
    s.cleared = s.escaped || old.cleared === true;
    s.secret = old.secret === true || s.got.some(id => kindOf(room, id) === 'secret');
    const b = old.best;
    s.best = b && Number.isFinite(b.seconds) && b.seconds >= 0 && Number.isFinite(b.hints) && b.hints >= 0 ? { seconds: Math.floor(b.seconds), hints: Math.floor(b.hints) } : null;
    out.rooms[room.id] = s;
  }
  return out;
}

// 공략 경로를 실제 조작 순서대로 실행합니다. 검증과 테스트가 같은 함수를 씁니다.
// 매 단계마다 힌트가 가리키는 대상이 실제로 보이는지도 함께 확인합니다.
export function runWalkthrough(room, steps, from = null) {
  const s = from ?? freshState(room);
  const errors = [];
  list(steps).forEach((step, i) => {
    if (s.escaped) { errors.push(`step ${i + 1}: already escaped`); return; }
    const goal = activeGoal(room, s);
    if (!goal) errors.push(`step ${i + 1}: no hint goal`);
    const focus = goal?.focus?.hotspot && room.hotspots.find(h => h.id === goal.focus.hotspot);
    if (focus && !all(focus.if, s)) errors.push(`step ${i + 1}: hint ${goal.id} points to hidden hotspot ${focus.id}`);
    list(goal?.focus?.items).forEach(id => s.inv.includes(id) || errors.push(`step ${i + 1}: hint ${goal.id} points to missing item ${id}`));
    if (step.tap) {
      const h = room.hotspots.find(spot => spot.id === step.tap);
      if (!h) { errors.push(`step ${i + 1}: unknown hotspot ${step.tap}`); return; }
      s.view = h.view;
      if (!all(h.if, s)) { errors.push(`step ${i + 1}: hotspot ${step.tap} is not visible yet`); return; }
      const result = tap(room, s, step.tap, step.use ?? null);
      if (!result.ok || (step.use && !result.used)) errors.push(`step ${i + 1}: tap ${step.tap} failed`);
    } else if (step.lock) {
      const lock = room.locks[step.lock];
      if (!lock) { errors.push(`step ${i + 1}: unknown lock ${step.lock}`); return; }
      s.view = lock.view;
      if (!all(lock.if, s)) { errors.push(`step ${i + 1}: lock ${step.lock} is not ready yet`); return; }
      if (!inputLock(room, s, step.lock, step.input).open) errors.push(`step ${i + 1}: lock ${step.lock} stayed closed`);
    } else if (step.combine) {
      if (!combine(room, s, ...step.combine).ok) errors.push(`step ${i + 1}: combine ${step.combine.join('+')} failed`);
    } else errors.push(`step ${i + 1}: unknown step`);
  });
  if (!s.escaped) errors.push('walkthrough does not escape');
  return { state: s, errors };
}

const textOk = (value, max) => typeof value === 'string' && value.trim().length > 0 && [...value].length <= max;

export function validateRoom(input) {
  const errors = [];
  const fail = message => errors.push(`room ${input?.id}: ${message}`);
  if (!input || typeof input !== 'object') return ['room is not an object'];
  const room = resolveRoom(input);
  if (!Number.isInteger(room.id)) fail('id must be an integer');
  if (!textOk(room.title, LIMITS.title)) fail(`title needs 1-${LIMITS.title} characters`);
  if (!textOk(room.subtitle, LIMITS.subtitle)) fail(`subtitle needs 1-${LIMITS.subtitle} characters`);
  if (typeof room.start !== 'string') fail('missing start');
  if (!Number.isInteger(room.difficulty) || room.difficulty < 1 || room.difficulty > 5) fail('difficulty must be 1-5');
  if (!Number.isInteger(room.minutes) || room.minutes < 5 || room.minutes > 60) fail('minutes must be 5-60');
  if (!list(room.intro).length || list(room.intro).length > 3 || !list(room.intro).every(t => textOk(t, LIMITS.intro))) fail(`intro needs 1-3 lines of up to ${LIMITS.intro} characters`);
  if (!room.outro?.title || !list(room.outro?.lines).length || list(room.outro.lines).length > 3 || !list(room.outro.lines).every(t => textOk(t, LIMITS.line))) fail(`outro needs a title and 1-3 lines of up to ${LIMITS.line} characters`);
  for (const field of ['views', 'items', 'locks', 'captions']) if (!room[field] || typeof room[field] !== 'object') { fail(`missing ${field}`); return errors; }
  for (const field of ['recipes', 'hotspots', 'goals', 'walkthroughs']) if (!Array.isArray(room[field])) { fail(`missing ${field}`); return errors; }
  const views = room.views, items = room.items, locks = room.locks;
  if (!views[room.start] || views[room.start].kind !== 'wall') fail('start must be a wall view');
  const condsOk = (conds, where) => list(conds).forEach(c => condKnown(room, c) || fail(`${where} has unknown condition ${c}`));
  const effectsOk = (effects, where) => list(effects).forEach(e => {
    if (e.go && !views[e.go]) fail(`${where} goes to unknown view ${e.go}`);
    if (e.gain && !items[e.gain]) fail(`${where} gains unknown item ${e.gain}`);
    if (e.lose && !items[e.lose]) fail(`${where} loses unknown item ${e.lose}`);
    if (e.say && !room.captions[e.say]) fail(`${where} says unknown caption ${e.say}`);
    if (e.fx && !FX.includes(e.fx)) fail(`${where} uses unknown fx ${e.fx}`);
  });
  for (const [id, text] of Object.entries(room.captions)) if (!textOk(text, LIMITS.caption)) fail(`caption ${id} needs 1-${LIMITS.caption} characters`);

  for (const [id, view] of Object.entries(views)) {
    if (!textOk(view.name, LIMITS.name) || typeof view.alt !== 'string' || !view.alt) fail(`view ${id} needs a short name and alt`);
    if (view.kind === 'wall') { if (!views[view.left] || !views[view.right]) fail(`view ${id} needs left and right`); }
    else if (view.kind === 'zoom') { if (!views[view.back]) fail(`view ${id} needs back`); }
    else fail(`view ${id} has unknown kind`);
    if (view.enter !== undefined && !textOk(view.enter, LIMITS.enter)) fail(`view ${id} enter line needs up to ${LIMITS.enter} characters`);
    if (view.clue !== undefined && typeof view.clue !== 'boolean' && !Array.isArray(view.clue)) fail(`view ${id} clue must be true or a condition list`);
    if (Array.isArray(view.clue)) condsOk(view.clue, `view ${id} clue`);
    list(view.alts).forEach(alt => condsOk(alt.if, `view ${id} alt`));
  }
  for (const [id, item] of Object.entries(items)) {
    if (!textOk(item.name, LIMITS.name)) fail(`item ${id} needs a name of up to ${LIMITS.name} characters`);
    const kind = item.kind ?? 'tool';
    if (!ITEM_KINDS.includes(kind)) fail(`item ${id} has unknown kind`);
    if (item.note !== undefined && !textOk(item.note, LIMITS.note)) fail(`item ${id} note needs up to ${LIMITS.note} characters`);
    if (kind === 'note' && !item.note) fail(`note item ${id} needs note text`);
  }
  if (Object.values(items).filter(item => item.kind === 'secret').length > 1) fail('only one secret item per room');
  for (const r of room.recipes) {
    if (!items[r.a] || !items[r.b] || !items[r.make] || r.a === r.b) fail(`recipe ${r.a}+${r.b} is invalid`);
    else if ([r.a, r.b, r.make].some(id => kindOf(room, id) !== 'tool')) fail(`recipe ${r.a}+${r.b} must use tool items`);
  }
  for (const [id, lock] of Object.entries(locks)) {
    if (!views[lock.view] || views[lock.view].kind !== 'zoom') fail(`lock ${id} must live in a zoom view`);
    if (!LOCK_TYPES.includes(lock.type)) { fail(`lock ${id} has unknown type`); continue; }
    if (!Array.isArray(lock.answer) || !lock.answer.length) { fail(`lock ${id} needs answer`); continue; }
    if (lock.type === 'symbol' && (!Array.isArray(lock.symbols) || lock.symbols.length < 2 || lock.symbols.length > 6 || new Set(lock.symbols).size !== lock.symbols.length)) fail(`lock ${id} needs 2-6 unique symbols`);
    if (lock.type === 'color' && (!Array.isArray(lock.palette) || lock.palette.length < 2)) fail(`lock ${id} needs palette`);
    if (!same(cleanInput(lock, lock.answer), lock.answer)) fail(`lock ${id} answer is outside its controls`);
    const sequence = SEQUENCE_LOCKS.includes(lock.type);
    if (!sequence && same(cleanInput(lock, []), lock.answer)) fail(`lock ${id} starts already solved`);
    if (['color', 'rotate', 'switch', 'dial'].includes(lock.type) && list(lock.at).length !== lock.answer.length) fail(`lock ${id} needs one position per control`);
    if (lock.type === 'symbol' && list(lock.at).length !== list(lock.symbols).length) fail(`lock ${id} needs one position per symbol`);
    if (['direction', 'keypad'].includes(lock.type) && list(lock.at).length !== 1) fail(`lock ${id} needs one pad position`);
    if (sequence && list(lock.lights).length !== 2) fail(`lock ${id} needs lights position`);
    if (sequence && (lock.answer.length < 3 || lock.answer.length > 6)) fail(`lock ${id} sequence needs 3-6 steps`);
    if (typeof lock.label !== 'string' || !lock.label) fail(`lock ${id} needs label`);
    condsOk(lock.if, `lock ${id}`);
    effectsOk(lock.onOpen, `lock ${id}`);
  }
  const ids = new Set();
  for (const h of room.hotspots) {
    if (ids.has(h.id)) fail(`duplicate hotspot ${h.id}`);
    ids.add(h.id);
    if (!views[h.view]) fail(`hotspot ${h.id} has unknown view`);
    if (!h.rect && h.prop) { fail(`hotspot ${h.id} refers to missing prop ${h.prop}`); continue; }
    const [x, y, w, hgt] = list(h.rect);
    if (![x, y, w, hgt].every(Number.isFinite) || x < 0 || y < 0 || x + w > VIEW_W || y + hgt > NAV_TOP) fail(`hotspot ${h.id} rect is outside the play area`);
    if (w < MIN_HOTSPOT || hgt < MIN_HOTSPOT) fail(`hotspot ${h.id} is smaller than the touch minimum`);
    const [px, py, pw, ph] = PIN_ZONE;
    const ox = Math.max(0, Math.min(x + w, px + pw) - Math.max(x, px)), oy = Math.max(0, Math.min(y + hgt, py + ph) - Math.max(y, py));
    if (w * hgt > 0 && (ox * oy) / (w * hgt) > .25) fail(`hotspot ${h.id} hides under the pinned photo`);
    if (typeof h.label !== 'string' || !h.label) fail(`hotspot ${h.id} needs label`);
    condsOk(h.if, `hotspot ${h.id}`);
    if (!list(h.actions).length) fail(`hotspot ${h.id} needs actions`);
    list(h.actions).forEach((a, i) => {
      if (a.use && (!items[a.use] || kindOf(room, a.use) !== 'tool')) fail(`hotspot ${h.id} action ${i} uses unknown item`);
      condsOk(a.if, `hotspot ${h.id} action ${i}`);
      effectsOk(a.do, `hotspot ${h.id} action ${i}`);
    });
  }
  room.hotspots.forEach((a, i) => room.hotspots.slice(i + 1).forEach(b => {
    if (a.rect && b.rect && a.view === b.view && overlaps(a.rect, b.rect) && !exclusive(a.if, b.if)) fail(`hotspots ${a.id} and ${b.id} overlap while both visible`);
  }));
  const lockViews = Object.values(locks).map(lock => lock.view);
  if (new Set(lockViews).size !== lockViews.length) fail('one zoom view can hold only one lock');
  for (const [id, lock] of Object.entries(locks)) {
    for (const c of lockControls(lock)) {
      if (c.x < 0 || c.y < 0 || c.x + c.w > VIEW_W || c.y + c.h > NAV_TOP) fail(`lock ${id} control is outside the play area`);
      if (c.y < PIN_H) fail(`lock ${id} control sits under the pinned photo area`);
      for (const h of room.hotspots) {
        if (h.rect && h.view === lock.view && overlaps(h.rect, [c.x, c.y, c.w, c.h]) && !list(h.if).includes(`open:${id}`) && !exclusive(h.if, lock.if)) fail(`hotspot ${h.id} covers lock ${id}`);
      }
    }
  }
  const reachable = new Set([room.start]);
  const queue = [room.start];
  while (queue.length) {
    const id = queue.shift();
    const view = views[id];
    if (!view) continue;
    const next = [view.left, view.right, view.back];
    room.hotspots.filter(h => h.view === id).forEach(h => h.actions.forEach(a => list(a.do).forEach(e => e.go && next.push(e.go))));
    for (const n of next) if (n && views[n] && !reachable.has(n)) { reachable.add(n); queue.push(n); }
  }
  for (const id of Object.keys(views)) if (!reachable.has(id)) fail(`view ${id} cannot be reached`);
  const sources = new Set(room.recipes.map(r => r.make));
  room.hotspots.forEach(h => h.actions.forEach(a => list(a.do).forEach(e => e.gain && sources.add(e.gain))));
  Object.values(locks).forEach(l => list(l.onOpen).forEach(e => e.gain && sources.add(e.gain)));
  for (const id of Object.keys(items)) if (!sources.has(id)) fail(`item ${id} can never be obtained`);
  const goalIds = new Set();
  for (const g of room.goals) {
    if (goalIds.has(g.id)) fail(`duplicate goal ${g.id}`);
    goalIds.add(g.id);
    if (list(g.hints).length !== HINT_MAX || !g.hints.every(t => textOk(t, LIMITS.hint))) fail(`goal ${g.id} needs ${HINT_MAX} hints of up to ${LIMITS.hint} characters`);
    if (!list(g.done).length) fail(`goal ${g.id} needs done`);
    condsOk(g.if, `goal ${g.id}`);
    condsOk(g.done, `goal ${g.id}`);
    if (g.focus?.view && !views[g.focus.view]) fail(`goal ${g.id} focus view is unknown`);
    if (g.focus?.hotspot && !ids.has(g.focus.hotspot)) fail(`goal ${g.id} focus hotspot is unknown`);
    list(g.focus?.items).forEach(id => items[id] || fail(`goal ${g.id} focus item is unknown`));
  }
  if (!room.walkthroughs.length) fail('needs at least one walkthrough');
  room.walkthroughs.forEach((steps, i) => runWalkthrough(room, steps).errors.forEach(e => fail(`walkthrough ${i + 1} ${e}`)));
  return errors;
}

// 에피소드는 방 3~6개를 이야기 순서로 묶습니다. 같은 에피소드 안에서는 앞 방을 탈출해야 다음 방이 열립니다.
export function validateEpisodes(episodes, rooms) {
  const errors = [];
  if (!Array.isArray(episodes) || !episodes.length) return ['episodes missing'];
  const built = new Set(rooms.map(r => r.id));
  const owner = new Map();
  for (const ep of episodes) {
    const fail = m => errors.push(`episode ${ep?.id}: ${m}`);
    if (!Number.isInteger(ep.id)) fail('id must be an integer');
    for (const f of ['title', 'tagline']) if (typeof ep[f] !== 'string' || !ep[f]) fail(`missing ${f}`);
    if (!list(ep.intro).length) fail('missing intro');
    const ids = list(ep.rooms);
    if (ids.length < 3 || ids.length > 6) fail('needs 3 to 6 rooms');
    for (const rid of ids) {
      if (owner.has(rid)) fail(`room ${rid} already belongs to episode ${owner.get(rid)}`);
      owner.set(rid, ep.id);
      const soon = ep.upcoming?.[rid];
      if (!built.has(rid) && !(soon && typeof soon.title === 'string' && Number.isInteger(soon.difficulty))) fail(`room ${rid} is neither built nor listed as upcoming`);
    }
    ids.slice(0, -1).forEach(rid => { if (typeof ep.bridges?.[rid] !== 'string' || !ep.bridges[rid]) fail(`bridge after room ${rid} missing`); });
    // 에피소드는 혼자 완결됩니다. 마지막 화에서 다른 에피소드로 넘어가는 다리 문장을 두지 않습니다.
    if (ids.length && ep.bridges?.[ids[ids.length - 1]] !== undefined) fail('last room must not bridge to another episode');
    if (!list(ep.finale).length) fail('missing finale');
  }
  for (const r of rooms) if (!owner.has(r.id)) errors.push(`room ${r.id} is in no episode`);
  if (new Set(episodes.map(e => e.id)).size !== episodes.length) errors.push('duplicate episode ids');
  return errors;
}
export function episodeOf(episodes, roomId) {
  for (const episode of list(episodes)) {
    const index = list(episode.rooms).indexOf(roomId);
    if (index >= 0) return { episode, index };
  }
  return null;
}
export function roomUnlocked(episodes, saveRooms, roomId, everything = false) {
  if (everything) return true;
  const found = episodeOf(episodes, roomId);
  if (!found || found.index === 0) return true;
  const prev = saveRooms?.[found.episode.rooms[found.index - 1]];
  return prev?.escaped === true || prev?.cleared === true;
}
