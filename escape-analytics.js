// 플레이 로그를 정해진 이름과 항목으로만 남깁니다. 보내는 곳(Firebase Analytics)은 platform.js가 맡습니다.
// 이름과 항목은 Firebase(GA4) 제한을 지킵니다: 이벤트 이름 40자, 항목 25개, 글자 값 100자.
// 개인정보(이름, 연락처, 기기 식별자)는 이벤트에 넣지 않습니다.
import { GROWTH } from './escape-growth.js?v=escape-12';
import { logNative, setLogEnabled, platformName } from './platform.js?v=escape-12';

// 이벤트 사전입니다. 새 이벤트는 여기에 먼저 적고, APP_GROWTH.md의 이벤트 표에도 같이 적습니다.
export const EVENTS = Object.freeze({
  app_open: ['returning', 'cleared'],
  episode_view: ['episode'],
  room_open: ['room', 'episode', 'chapter', 'difficulty', 'resume', 'cleared'],
  room_start: ['room', 'episode', 'chapter'],
  hint_request: ['room', 'goal', 'level', 'via'],
  lock_fail: ['room', 'lock'],
  lock_open: ['room', 'lock', 'seconds'],
  room_escape: ['room', 'episode', 'chapter', 'seconds', 'hints', 'fails', 'first'],
  room_exit: ['room', 'seconds', 'progress', 'hints'],
  room_restart: ['room', 'after_escape'],
  share_result: ['room', 'result'],
  ad_result: ['placement', 'format', 'outcome', 'ms'],
  // 퍼포먼스 마케팅에서 전환으로 가져갈 이정표입니다. 처음 달성할 때 한 번만 남깁니다.
  tutorial_complete: ['room', 'seconds'],
  clear_3: ['room'],
  clear_10: ['room'],
});
// 모든 이벤트에 자동으로 붙는 항목입니다.
export const COMMON = Object.freeze(['app_ver', 'platform']);
export const MILESTONES = Object.freeze({ 1: 'tutorial_complete', 3: 'clear_3', 10: 'clear_10' });

const NAME = /^[a-z][a-z0-9_]{0,39}$/;

// 이벤트를 검사하고 보낼 수 있는 모양으로 바꿉니다. 문제가 있으면 { error }를 돌려줍니다.
export function cleanEvent(name, params = {}) {
  const allowed = EVENTS[name];
  if (!NAME.test(name) || !allowed) return { error: `unknown event ${name}` };
  const out = {};
  for (const [key, value] of Object.entries(params)) {
    if (!allowed.includes(key)) return { error: `${name}: unknown param ${key}` };
    if (value === undefined || value === null) continue;
    if (typeof value === 'boolean') out[key] = value ? 1 : 0;
    else if (typeof value === 'number' && Number.isFinite(value)) out[key] = value;
    else if (typeof value === 'string') out[key] = value.slice(0, 100);
    else return { error: `${name}.${key}: unsupported value` };
  }
  return { name, params: out };
}

// debug가 true면 이벤트를 콘솔과 globalThis.__doorEvents에 남깁니다. 검수 화면에서 ?debug=analytics로 켭니다.
export function createAnalytics({ version, debug = false, enabled = GROWTH.analytics.enabled } = {}) {
  const sinks = [];
  const recent = [];
  const base = { app_ver: version, platform: platformName() };
  let on = enabled;
  if (debug) globalThis.__doorEvents = recent;

  function track(name, params) {
    if (!on) return;
    const event = cleanEvent(name, params);
    if (event.error) { if (debug) console.warn('[analytics]', event.error); return; }
    const full = { ...event.params, ...base };
    if (debug) {
      recent.push({ at: Date.now(), name, params: full });
      if (recent.length > 300) recent.shift();
      console.info('[analytics]', name, full);
      // 검수 도구가 다른 실행 공간에서도 읽을 수 있도록 sessionStorage에도 최근 100개를 남깁니다.
      try { globalThis.sessionStorage?.setItem('door.analytics', JSON.stringify(recent.slice(-100))); } catch { /* 저장 공간이 없으면 넘어갑니다. */ }
    }
    // 로그 실패가 게임을 멈추지 않도록 오류는 삼키고, 디버그 모드에서만 보여 줍니다.
    logNative(name, full).catch(error => { if (debug) console.warn('[analytics]', error); });
    for (const sink of sinks) {
      try { sink(name, full); } catch (error) { if (debug) console.warn('[analytics]', error); }
    }
  }
  return {
    track,
    // 측정 업체(MMP) 같은 다른 보낼 곳을 붙이는 자리입니다. sink(name, params) 모양의 함수를 넘깁니다.
    addSink: sink => { sinks.push(sink); },
    // 사용자가 로그 수집을 끄면 부릅니다.
    setEnabled: value => { on = Boolean(value); return setLogEnabled(on).catch(() => {}); },
    recent,
  };
}
