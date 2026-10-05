// 광고를 언제 띄우고 결과를 어떻게 처리할지 정합니다. 숫자 설정은 escape-growth.js, AdMob 호출은 platform.js에 있습니다.
// 판단 함수(roomAdDecision, hintAdDecision, hintUnlock)는 화면과 기기에 기대지 않아 테스트에서 바로 부를 수 있습니다.
import { GROWTH } from './escape-growth.js?v=escape-10';
import { adsAvailable, adsInit, adsPrepare, adsShow, adsPrivacyForm, platformName } from './platform.js?v=escape-10';

// 광고 기록은 게임 저장(beyond-the-door.v2)과 따로 둡니다. 게임 저장 형식을 바꾸지 않기 위해서입니다.
export const GROWTH_KEY = 'beyond-the-door.growth.v1';

export function recoverGrowth(raw) {
  const out = { firstSeen: 0, breaks: 0, lastAdAt: 0, adFree: false };
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const key of ['firstSeen', 'breaks', 'lastAdAt']) if (Number.isFinite(raw[key]) && raw[key] >= 0) out[key] = Math.floor(raw[key]);
  // adFree는 나중에 광고 제거 결제를 붙일 자리입니다. 결제 확인 없이 켜지 않습니다.
  out.adFree = raw.adFree === true;
  return out;
}

// 방 한 판의 광고 자리(탈출 직후 또는 방을 열 때)에서 전면 광고를 띄울지 정합니다.
// growth.breaks는 이번 자리를 포함해 지금까지 맞은 광고 자리의 수입니다.
export function roomAdDecision(growth, now, cfg = GROWTH.ads) {
  if (!cfg.enabled) return 'disabled';
  if (growth.adFree) return 'ad_free';
  if (growth.breaks <= cfg.roomAd.skipFirst) return 'skip_first';
  // 기기 시계가 뒤로 가서 마지막 광고 시각이 미래가 되면 없던 것으로 봅니다. 그대로 두면 광고가 계속 멈춥니다.
  const last = growth.lastAdAt > now ? 0 : growth.lastAdAt;
  if (last && now - last < cfg.roomAd.minGapSec * 1000) return 'skip_gap';
  return 'show';
}

// 힌트를 열 때 보상형 광고를 붙일지 정합니다. usedInRoom은 이 방에서 이미 연 힌트 수,
// firstRoom은 아직 한 방도 탈출하지 않은 사람인지입니다. 처음 하는 방에서는 동의 창과 광고를 띄우지 않습니다.
export function hintAdDecision(growth, usedInRoom, cfg = GROWTH.ads, firstRoom = false) {
  if (!cfg.enabled) return 'disabled';
  if (growth.adFree) return 'ad_free';
  if (firstRoom && cfg.hint.freeBeforeFirstBreak) return 'free';
  if (usedInRoom < cfg.hint.freePerRoom) return 'free';
  return 'show';
}

// 광고 결과로 힌트를 열지 정합니다. 보상 신호 없이 닫혔거나 사용자가 이미 다른 곳으로 갔으면(cancelled) 열지 않고,
// 광고를 못 받아 오면 failOpen 설정을 따릅니다.
export function hintUnlock(outcome, cfg = GROWTH.ads) {
  if (outcome === 'rewarded') return { open: true, via: 'ad' };
  if (outcome === 'dismissed' || outcome === 'cancelled') return { open: false, via: 'none' };
  if (['failed', 'timeout', 'no_consent', 'no_unit'].includes(outcome)) return cfg.failOpen ? { open: true, via: 'fallback' } : { open: false, via: 'none' };
  return { open: true, via: 'free' };
}

// ?ads=mock은 웹에서 광고 자리를 흉내 냅니다. 화면 흐름 검수용이고 실제 광고를 부르지 않습니다.
// ?ads=fail은 광고를 받아 오지 못한 경우를 흉내 냅니다.
function mockAd(format, mode) {
  if (mode === 'fail') return Promise.resolve('failed');
  return new Promise(resolve => {
    const box = document.createElement('dialog');
    box.className = 'ad-mock';
    box.setAttribute('aria-label', '테스트 광고');
    const rewarded = format === 'rewarded';
    box.innerHTML = `<p class="ad-mock-tag">테스트 광고</p><p class="ad-mock-kind">${rewarded ? '보상형 광고' : '전면 광고'}</p><p class="ad-mock-count" aria-live="polite">2</p><button class="btn" data-ad="close">${rewarded ? '그만 보기' : '닫기'}</button>`;
    document.body.append(box);
    let left = 2, done = false;
    const button = box.querySelector('[data-ad="close"]');
    if (!rewarded) button.disabled = true;
    const finish = outcome => {
      if (done) return;
      done = true;
      clearInterval(timer);
      if (box.open) box.close();
      box.remove();
      resolve(outcome);
    };
    const timer = setInterval(() => {
      left -= 1;
      box.querySelector('.ad-mock-count').textContent = left > 0 ? String(left) : '끝';
      if (left > 0) return;
      clearInterval(timer);
      button.disabled = false;
      button.textContent = rewarded ? '힌트 받기' : '닫기';
      button.classList.add('primary');
    }, 700);
    // 보상형은 언제든 닫을 수 있지만 끝까지 봐야 보상이 나옵니다. 전면 광고는 시간이 끝나야 닫힙니다.
    const close = () => {
      if (rewarded) finish(left > 0 ? 'dismissed' : 'rewarded');
      else if (left <= 0) finish('shown');
    };
    button.addEventListener('click', close);
    // Esc는 이 창에서 끝냅니다. 아래에 열린 힌트 창이나 방 화면의 뒤로 가기로 넘어가지 않게 합니다.
    box.addEventListener('keydown', event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); } });
    box.addEventListener('cancel', event => { event.preventDefault(); close(); });
    box.showModal();
    button.focus({ preventScroll: true });
  });
}

// growth는 recoverGrowth로 만든 기록이고, persist는 그 기록을 저장하는 함수입니다.
// mock은 false, 'mock', 'fail' 중 하나입니다.
// stillWanted는 광고를 보여 주기 직전에 부르는 함수입니다. 사용자가 그 화면을 떠났거나 앱이 뒤로 갔으면 false를 돌려줍니다.
export function createAds({ growth, persist = () => {}, mock = false, cfg = GROWTH.ads, now = () => Date.now() }) {
  const native = adsAvailable();
  const live = native || Boolean(mock);
  const ready = {}, loaded = {}, loadedAt = {};
  // 받아 둔 광고는 한 시간이 지나면 쓸 수 없습니다. 조금 일찍 버리고 새로 받습니다.
  const STALE_MS = 50 * 60 * 1000;
  const fresh = format => loaded[format] === true && now() - (loadedAt[format] ?? 0) < STALE_MS;
  const refresh = format => { if (loaded[format] && !fresh(format)) { ready[format] = null; loaded[format] = false; } };
  let consent = null, privacyRequired = false;
  const unit = format => cfg.units[platformName()]?.[format];
  const within = (promise, sec, fallback) => new Promise(resolve => {
    const timer = setTimeout(() => resolve(fallback), sec * 1000);
    promise.then(value => { clearTimeout(timer); resolve(value); }, () => { clearTimeout(timer); resolve(fallback); });
  });

  function preload(format) {
    if (!ready[format] && unit(format)) {
      loaded[format] = false;
      ready[format] = adsPrepare(format, unit(format), { test: cfg.test }).then(() => { loaded[format] = true; loadedAt[format] = now(); return true; }, () => { ready[format] = null; return false; });
    }
    return ready[format] ?? Promise.resolve(false);
  }
  // 동의와 광고 미리 받기를 한 번만 합니다. 첫 광고가 필요해지기 전에 불러 두면 광고가 늦게 뜨지 않습니다.
  // 동의 과정이 오류로 끝나면 다음 기회에 다시 묻습니다.
  function warmup() {
    if (!native || !cfg.enabled || growth.adFree) return Promise.resolve(false);
    consent ??= adsInit({ childDirected: cfg.childDirected }).then(r => { privacyRequired = r.privacyRequired === true; return r.canRequestAds; }, () => { consent = null; return false; });
    return consent.then(ok => { if (ok) { void preload('interstitial'); void preload('rewarded'); } return ok; });
  }
  async function show(format, stillWanted) {
    if (mock) return stillWanted() ? mockAd(format, mock) : 'cancelled';
    if (!(await warmup())) return 'no_consent';
    if (!unit(format)) return 'no_unit';
    if (format === 'interstitial') {
      // 전면 광고는 미리 받아 둔 것만 띄웁니다. 받아 오기를 기다렸다 띄우면 화면이 바뀐 뒤에 광고가 뜰 수 있습니다.
      refresh('interstitial');
      if (!fresh('interstitial')) { void preload('interstitial'); return 'not_ready'; }
    } else { refresh(format); if (!(await within(preload(format), cfg.loadTimeoutSec ?? 8, false))) return 'failed'; }
    if (!stillWanted()) return 'cancelled';
    ready[format] = null; loaded[format] = false;
    const outcome = await adsShow(format, { startMs: (cfg.showStartSec ?? 10) * 1000, timeoutMs: (cfg.showTimeoutSec ?? 120) * 1000, graceMs: cfg.rewardGraceMs ?? 500 });
    void preload(format);
    return outcome;
  }
  async function fullscreen(format, stillWanted) {
    const outcome = await show(format, stillWanted);
    if (['shown', 'rewarded', 'dismissed'].includes(outcome)) growth.lastAdAt = now();
    persist();
    return outcome;
  }

  return {
    live,
    warmup,
    // 다음 광고 자리에서 실제로 광고가 뜰지 미리 봅니다(세지 않습니다). 화면은 이 값으로 결과 화면을 잠깐 비워 둡니다.
    breakWillShow: () => live && (Boolean(mock) || fresh('interstitial')) && roomAdDecision({ ...growth, breaks: growth.breaks + 1 }, now(), cfg) === 'show',
    // 방 한 판의 광고 자리입니다. 탈출 직후(when: 'escape') 또는 방을 열기 직전(when: 'open')에 부릅니다.
    // 결과 outcome은 로그(ad_result)에 그대로 남깁니다.
    async roomBreak(stillWanted = () => true) {
      growth.breaks += 1;
      if (!live) { persist(); return { format: 'interstitial', outcome: 'unsupported' }; }
      const decision = roomAdDecision(growth, now(), cfg);
      if (decision !== 'show') { persist(); return { format: 'interstitial', outcome: decision }; }
      return { format: 'interstitial', outcome: await fullscreen('interstitial', stillWanted) };
    },
    hintNeedsAd: (usedInRoom, firstRoom = false) => live && hintAdDecision(growth, usedInRoom, cfg, firstRoom) === 'show',
    // 힌트 한 단계를 열기 전에 부릅니다. open이 true일 때만 힌트를 엽니다.
    async forHint(usedInRoom, { firstRoom = false, stillWanted = () => true } = {}) {
      let outcome = 'unsupported';
      if (live) {
        const decision = hintAdDecision(growth, usedInRoom, cfg, firstRoom);
        outcome = decision === 'show' ? await fullscreen('rewarded', stillWanted) : decision;
      }
      return { format: 'rewarded', outcome, ...hintUnlock(outcome, cfg) };
    },
    // 유럽 등 동의가 필요한 지역에서는 사용자가 광고 개인정보 선택을 다시 할 수 있어야 합니다.
    privacyRequired: () => native && privacyRequired,
    openPrivacy: () => adsPrivacyForm(),
  };
}
