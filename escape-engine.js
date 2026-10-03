// 문 너머 방탈출 규칙 엔진입니다. DOM, 저장소, 앱 환경을 모르는 순수 규칙만 둡니다.
export const SAVE_KEY_V2 = 'beyond-the-door.v2';
export const HINT_MAX = 3;
export const DIRECTIONS = ['up', 'right', 'down', 'left'];
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

const list = value => (Array.isArray(value) ? value : []);
const unique = values => [...new Set(values)];

// 자물쇠 조작 버튼의 위치입니다. 화면과 검증이 같은 좌표를 씁니다.
export function lockControls(lock) {
  const half = CONTROL / 2;
  if (lock.type === 'color') return list(lock.at).map(([x, y], index) => ({ index, x: x - half, y: y - half, w: CONTROL, h: CONTROL }));
  if (lock.type === 'dial') return list(lock.at).flatMap(([x, y], index) => [
    { index, delta: 1, x: x - half, y: y - CONTROL, w: CONTROL, h: CONTROL },
    { index, delta: -1, x: x - half, y, w: CONTROL, h: CONTROL },
  ]);
  if (lock.type === 'direction') {
    const [x, y] = list(lock.at)[0] ?? [0, 0];
    return [['up', 0, -PAD_GAP], ['right', PAD_GAP, 0], ['down', 0, PAD_GAP], ['left', -PAD_GAP, 0]]
      .map(([dir, dx, dy]) => ({ dir, x: x + dx - half, y: y + dy - half, w: CONTROL, h: CONTROL }));
  }
  return [];
}
export const lockIn = (room, viewId) => Object.entries(room.locks).find(([, lock]) => lock.view === viewId) ?? null;
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

export const PHOTO_MAX = 12;

export function freshState(room) {
  return { view: room.start, inv: [], got: [], flags: [], open: [], drafts: {}, hints: {}, photos: [], seconds: 0, mistakes: 0, escaped: false, started: false };
}

// 사진은 그 순간의 장면 상태만 기억합니다. 화면은 같은 그림 함수로 다시 그립니다.
export function takePhoto(s) {
  const photo = { view: s.view, flags: [...s.flags], open: [...s.open], got: [...s.got], drafts: structuredClone(s.drafts) };
  s.photos = [photo, ...s.photos].slice(0, PHOTO_MAX);
  return photo;
}

export function cleanInput(lock, value) {
  const raw = list(value);
  // 색 단추는 처음부터 서로 다른 색으로 시작해서 누르면 색이 바뀌는 장치라는 것이 보이게 합니다.
  if (lock.type === 'color') return lock.answer.map((_, i) => (lock.palette.includes(raw[i]) ? raw[i] : lock.palette[i % lock.palette.length]));
  if (lock.type === 'dial') {
    const max = lock.max ?? 9;
    return lock.answer.map((_, i) => (Number.isInteger(raw[i]) && raw[i] >= 0 && raw[i] <= max ? raw[i] : 0));
  }
  if (lock.type === 'direction') return raw.filter(d => DIRECTIONS.includes(d)).slice(0, lock.answer.length);
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

function run(room, s, effects) {
  const events = [];
  for (const e of list(effects)) {
    if (e.go) { s.view = e.go; events.push({ type: 'go', view: e.go }); }
    if (e.set && !s.flags.includes(e.set)) s.flags.push(e.set);
    if (e.gain && !s.got.includes(e.gain)) { s.got.push(e.gain); s.inv.push(e.gain); events.push({ type: 'gain', item: e.gain }); }
    if (e.lose && s.inv.includes(e.lose)) { s.inv = s.inv.filter(item => item !== e.lose); events.push({ type: 'lose', item: e.lose }); }
    if (e.say) events.push({ type: 'say', text: room.captions[e.say] });
    if (e.fx) events.push({ type: 'fx', name: e.fx });
    if (e.escape) { s.escaped = true; events.push({ type: 'escape' }); }
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

// 자물쇠 입력을 반영합니다. 색과 숫자는 맞는 순간 열리고, 방향은 끝까지 누른 뒤 판정합니다.
export function inputLock(room, s, lockId, value) {
  const lock = room.locks[lockId];
  if (!lock || s.escaped || s.open.includes(lockId) || s.view !== lock.view) return { ok: false, open: false, events: [] };
  const input = cleanInput(lock, value);
  s.drafts[lockId] = input;
  if (lock.type === 'direction' && input.length < lock.answer.length) return { ok: true, open: false, events: [] };
  if (same(input, lock.answer)) {
    s.open.push(lockId);
    delete s.drafts[lockId];
    return { ok: true, open: true, events: run(room, s, lock.onOpen) };
  }
  if (lock.type === 'direction') {
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

function knownFlags(room) {
  const flags = new Set();
  const scan = effects => list(effects).forEach(e => e.set && flags.add(e.set));
  room.hotspots.forEach(h => h.actions.forEach(a => scan(a.do)));
  Object.values(room.locks).forEach(l => scan(l.onOpen));
  return flags;
}

// 저장된 진행을 현재 콘텐츠 기준으로 다시 검증합니다. 이전 판(v1) 저장은 다른 키에 그대로 둡니다.
export function recoverSave(raw, rooms) {
  const out = { version: 2, rooms: {}, sound: false, tutorial: false, last: null };
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || raw.version !== 2) return out;
  out.sound = raw.sound === true;
  out.tutorial = raw.tutorial === true;
  if (rooms.some(r => r.id === raw.last)) out.last = raw.last;
  for (const room of rooms) {
    const old = raw.rooms?.[room.id];
    if (!old || typeof old !== 'object' || Array.isArray(old)) continue;
    const s = freshState(room);
    const flags = knownFlags(room);
    if (typeof old.view === 'string' && room.views[old.view]) s.view = old.view;
    s.got = unique(list(old.got).filter(id => room.items[id]));
    s.inv = unique(list(old.inv).filter(id => s.got.includes(id)));
    s.flags = unique(list(old.flags).filter(f => flags.has(f)));
    s.open = unique(list(old.open).filter(id => room.locks[id]));
    for (const [id, lock] of Object.entries(room.locks)) {
      if (s.open.includes(id) || old.drafts?.[id] === undefined) continue;
      const draft = cleanInput(lock, old.drafts[id]);
      s.drafts[id] = lock.type === 'direction' ? draft.slice(0, lock.answer.length - 1) : draft;
    }
    for (const goal of room.goals) {
      const n = old.hints?.[goal.id];
      if (Number.isInteger(n) && n > 0 && n <= HINT_MAX) s.hints[goal.id] = n;
    }
    s.photos = list(old.photos).filter(ph => ph && typeof ph === 'object' && room.views[ph.view]).slice(0, PHOTO_MAX).map(ph => ({
      view: ph.view,
      flags: unique(list(ph.flags).filter(f => flags.has(f))),
      open: unique(list(ph.open).filter(id => room.locks[id])),
      got: unique(list(ph.got).filter(id => room.items[id])),
      drafts: Object.fromEntries(Object.entries(room.locks).filter(([id]) => ph.drafts?.[id] !== undefined).map(([id, lock]) => [id, cleanInput(lock, ph.drafts[id])])),
    }));
    s.seconds = Number.isFinite(old.seconds) ? Math.max(0, Math.floor(old.seconds)) : 0;
    s.mistakes = Number.isFinite(old.mistakes) ? Math.max(0, Math.floor(old.mistakes)) : 0;
    s.started = old.started === true;
    s.escaped = old.escaped === true && room.hotspots.some(h => h.actions.some(a => all(a.if, s) && list(a.do).some(e => e.escape)));
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
      const result = tap(room, s, step.tap, step.use ?? null);
      if (!result.ok || (step.use && !result.used)) errors.push(`step ${i + 1}: tap ${step.tap} failed`);
    } else if (step.lock) {
      const lock = room.locks[step.lock];
      if (!lock) { errors.push(`step ${i + 1}: unknown lock ${step.lock}`); return; }
      s.view = lock.view;
      if (!inputLock(room, s, step.lock, step.input).open) errors.push(`step ${i + 1}: lock ${step.lock} stayed closed`);
    } else if (step.combine) {
      if (!combine(room, s, ...step.combine).ok) errors.push(`step ${i + 1}: combine ${step.combine.join('+')} failed`);
    } else errors.push(`step ${i + 1}: unknown step`);
  });
  if (!s.escaped) errors.push('walkthrough does not escape');
  return { state: s, errors };
}

export function validateRoom(room) {
  const errors = [];
  const fail = message => errors.push(`room ${room?.id}: ${message}`);
  if (!room || typeof room !== 'object') return ['room is not an object'];
  if (!Number.isInteger(room.id)) fail('id must be an integer');
  for (const field of ['title', 'subtitle', 'start']) if (typeof room[field] !== 'string' || !room[field].trim()) fail(`missing ${field}`);
  if (!list(room.intro).length || !room.outro?.title || !list(room.outro?.lines).length) fail('missing intro or outro');
  for (const field of ['views', 'items', 'locks', 'captions']) if (!room[field] || typeof room[field] !== 'object') { fail(`missing ${field}`); return errors; }
  for (const field of ['recipes', 'hotspots', 'goals', 'walkthroughs']) if (!Array.isArray(room[field])) { fail(`missing ${field}`); return errors; }
  const views = room.views, items = room.items, locks = room.locks;
  if (!views[room.start] || views[room.start].kind !== 'wall') fail('start must be a wall view');
  const flags = knownFlags(room);
  const condOk = cond => {
    if (typeof cond !== 'string') return false;
    const key = cond.replace(/^!/, '');
    if (key === 'escaped') return true;
    if (key.startsWith('got:') || key.startsWith('has:')) return !!items[key.slice(4)];
    if (key.startsWith('open:')) return !!locks[key.slice(5)];
    return flags.has(key);
  };
  const condsOk = (conds, where) => list(conds).forEach(c => condOk(c) || fail(`${where} has unknown condition ${c}`));
  const effectsOk = (effects, where) => list(effects).forEach(e => {
    if (e.go && !views[e.go]) fail(`${where} goes to unknown view ${e.go}`);
    if (e.gain && !items[e.gain]) fail(`${where} gains unknown item ${e.gain}`);
    if (e.lose && !items[e.lose]) fail(`${where} loses unknown item ${e.lose}`);
    if (e.say && !room.captions[e.say]) fail(`${where} says unknown caption ${e.say}`);
    if (e.fx && !FX.includes(e.fx)) fail(`${where} uses unknown fx ${e.fx}`);
  });

  for (const [id, view] of Object.entries(views)) {
    if (typeof view.name !== 'string' || !view.name || typeof view.alt !== 'string' || !view.alt) fail(`view ${id} needs name and alt`);
    if (view.kind === 'wall') { if (!views[view.left] || !views[view.right]) fail(`view ${id} needs left and right`); }
    else if (view.kind === 'zoom') { if (!views[view.back]) fail(`view ${id} needs back`); }
    else fail(`view ${id} has unknown kind`);
    list(view.alts).forEach(alt => condsOk(alt.if, `view ${id} alt`));
  }
  for (const [id, item] of Object.entries(items)) if (typeof item.name !== 'string' || !item.name) fail(`item ${id} needs name`);
  for (const r of room.recipes) {
    if (!items[r.a] || !items[r.b] || !items[r.make] || r.a === r.b) fail(`recipe ${r.a}+${r.b} is invalid`);
  }
  for (const [id, lock] of Object.entries(locks)) {
    if (!views[lock.view] || views[lock.view].kind !== 'zoom') fail(`lock ${id} must live in a zoom view`);
    if (!['color', 'dial', 'direction'].includes(lock.type)) { fail(`lock ${id} has unknown type`); continue; }
    if (!Array.isArray(lock.answer) || !lock.answer.length) { fail(`lock ${id} needs answer`); continue; }
    if (!same(cleanInput(lock, lock.answer), lock.answer)) fail(`lock ${id} answer is outside its controls`);
    if (lock.type === 'color' && (!Array.isArray(lock.palette) || lock.palette.length < 2)) fail(`lock ${id} needs palette`);
    if (lock.type !== 'direction' && same(cleanInput(lock, []), lock.answer)) fail(`lock ${id} starts already solved`);
    if (lock.type !== 'direction' && list(lock.at).length !== lock.answer.length) fail(`lock ${id} needs one position per control`);
    if (lock.type === 'direction' && (list(lock.at).length !== 1 || list(lock.lights).length !== 2)) fail(`lock ${id} needs pad and lights positions`);
    effectsOk(lock.onOpen, `lock ${id}`);
  }
  const ids = new Set();
  for (const h of room.hotspots) {
    if (ids.has(h.id)) fail(`duplicate hotspot ${h.id}`);
    ids.add(h.id);
    if (!views[h.view]) fail(`hotspot ${h.id} has unknown view`);
    const [x, y, w, hgt] = list(h.rect);
    if (![x, y, w, hgt].every(Number.isFinite) || x < 0 || y < 0 || x + w > VIEW_W || y + hgt > NAV_TOP) fail(`hotspot ${h.id} rect is outside the play area`);
    if (w < MIN_HOTSPOT || hgt < MIN_HOTSPOT) fail(`hotspot ${h.id} is smaller than the touch minimum`);
    if (typeof h.label !== 'string' || !h.label) fail(`hotspot ${h.id} needs label`);
    condsOk(h.if, `hotspot ${h.id}`);
    if (!list(h.actions).length) fail(`hotspot ${h.id} needs actions`);
    list(h.actions).forEach((a, i) => {
      if (a.use && !items[a.use]) fail(`hotspot ${h.id} action ${i} uses unknown item`);
      condsOk(a.if, `hotspot ${h.id} action ${i}`);
      effectsOk(a.do, `hotspot ${h.id} action ${i}`);
    });
  }
  room.hotspots.forEach((a, i) => room.hotspots.slice(i + 1).forEach(b => {
    if (a.view === b.view && overlaps(a.rect, b.rect) && !exclusive(a.if, b.if)) fail(`hotspots ${a.id} and ${b.id} overlap while both visible`);
  }));
  const lockViews = Object.values(locks).map(lock => lock.view);
  if (new Set(lockViews).size !== lockViews.length) fail('one zoom view can hold only one lock');
  for (const [id, lock] of Object.entries(locks)) {
    for (const c of lockControls(lock)) {
      if (c.x < 0 || c.y < 0 || c.x + c.w > VIEW_W || c.y + c.h > NAV_TOP) fail(`lock ${id} control is outside the play area`);
      for (const h of room.hotspots) {
        if (h.view === lock.view && overlaps(h.rect, [c.x, c.y, c.w, c.h]) && !list(h.if).includes(`open:${id}`)) fail(`hotspot ${h.id} covers lock ${id}`);
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
    if (list(g.hints).length !== HINT_MAX || !g.hints.every(t => typeof t === 'string' && t)) fail(`goal ${g.id} needs ${HINT_MAX} hints`);
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
