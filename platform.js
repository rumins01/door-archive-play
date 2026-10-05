// 웹과 앱(Capacitor)의 차이를 이 파일에만 둡니다.
// 앱으로 감쌀 때 Preferences, App, Haptics, Share 플러그인이 있으면 그것을 쓰고, 없으면 브라우저 기능을 씁니다.
const plugin = name => globalThis.Capacitor?.Plugins?.[name];
export const isNativeApp = () => globalThis.Capacitor?.isNativePlatform?.() === true;

export async function loadText(key) {
  const prefs = plugin('Preferences');
  if (prefs) return (await prefs.get({ key }))?.value ?? null;
  try { return localStorage.getItem(key); } catch { return null; }
}

// 저장에 실패하면 예외를 그대로 던집니다. 화면은 실패를 성공처럼 표시하지 않습니다.
export async function saveText(key, value) {
  const prefs = plugin('Preferences');
  if (prefs) { await prefs.set({ key, value }); return; }
  localStorage.setItem(key, value);
}

// 앱이 뒤로 가거나 화면이 꺼질 때 저장하도록 알려 줍니다.
export function onPause(handler) {
  document.addEventListener('visibilitychange', () => { if (document.hidden) handler(); });
  addEventListener('pagehide', handler);
  plugin('App')?.addListener?.('pause', handler);
}

// 안드로이드 뒤로 가기와 키보드 Esc를 같은 순서로 처리합니다. handler가 false면 앱을 닫아도 됩니다.
export function onBack(handler) {
  addEventListener('keydown', event => {
    if (event.key !== 'Escape' || event.defaultPrevented) return;
    if (handler()) event.preventDefault();
  });
  const app = plugin('App');
  app?.addListener?.('backButton', () => { if (!handler()) app.exitApp?.(); });
}

export function buzz(strength = 'light') {
  const haptics = plugin('Haptics');
  if (haptics?.impact) { Promise.resolve(haptics.impact({ style: strength === 'heavy' ? 'HEAVY' : 'LIGHT' })).catch(() => {}); return; }
  try { navigator.vibrate?.(strength === 'heavy' ? 28 : 10); } catch { /* 진동을 지원하지 않는 기기는 조용히 넘어갑니다. */ }
}

// 결과를 공유합니다. 공유 창이 없으면 클립보드에 복사합니다. 결과는 shared, copied, cancelled, failed 중 하나입니다.
export async function share(data) {
  try {
    const native = plugin('Share');
    if (native?.share) { await native.share(data); return 'shared'; }
    if (navigator.share) { await navigator.share(data); return 'shared'; }
    if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText([data.text, data.url].filter(Boolean).join(' ')); return 'copied'; }
    return 'failed';
  } catch (error) {
    return error?.name === 'AbortError' ? 'cancelled' : 'failed';
  }
}

// 실행 환경 이름입니다. 앱이면 ios 또는 android, 브라우저면 web입니다.
export const platformName = () => globalThis.Capacitor?.getPlatform?.() ?? 'web';

// 로그: 앱에 Firebase Analytics 플러그인(@capacitor-firebase/analytics)이 있으면 그쪽으로 보냅니다.
// 플러그인이 없으면 false를 돌려주고 아무것도 하지 않습니다. 웹 배포판은 지금 외부로 로그를 보내지 않습니다.
export async function logNative(name, params) {
  const analytics = plugin('FirebaseAnalytics');
  if (!analytics?.logEvent) return false;
  await analytics.logEvent({ name, params });
  return true;
}
export async function setLogEnabled(enabled) {
  await plugin('FirebaseAnalytics')?.setEnabled?.({ enabled });
}

// 광고: 앱에 AdMob 플러그인(@capacitor-community/admob)이 있을 때만 씁니다. 웹에서는 광고를 띄우지 않습니다.
export const adsAvailable = () => isNativeApp() && Boolean(plugin('AdMob'));

// 광고 SDK를 켜고 개인정보 동의(UMP)와 iOS 추적 허용(ATT)을 차례로 묻습니다.
// canRequestAds가 false면 광고를 요청하지 않습니다. privacyRequired가 true면 화면에 개인정보 설정 메뉴를 보여야 합니다.
export async function adsInit({ childDirected = false } = {}) {
  const admob = plugin('AdMob');
  if (!admob) return { canRequestAds: false, privacyRequired: false };
  await admob.initialize({ tagForChildDirectedTreatment: childDirected });
  let info = await admob.requestConsentInfo();
  if (info?.isConsentFormAvailable && info?.status === 'REQUIRED') info = await admob.showConsentForm();
  if (platformName() === 'ios') {
    const tracking = await admob.trackingAuthorizationStatus();
    if (tracking?.status === 'notDetermined') await admob.requestTrackingAuthorization();
  }
  return { canRequestAds: info?.canRequestAds !== false, privacyRequired: info?.privacyOptionsRequirementStatus === 'REQUIRED' };
}

// 광고 개인정보 선택 창을 다시 엽니다. 실패해도 게임은 그대로입니다.
export async function adsPrivacyForm() {
  const admob = plugin('AdMob');
  if (!admob?.showPrivacyOptionsForm) return false;
  try { await admob.showPrivacyOptionsForm(); return true; } catch { return false; }
}

// 전면 광고(interstitial)와 보상형 광고(rewarded)를 미리 받아 둡니다. 실패하면 예외를 던집니다.
export async function adsPrepare(format, adId, { test = true } = {}) {
  const admob = plugin('AdMob');
  if (!admob) throw new Error('AdMob unavailable');
  const options = { adId, isTesting: test };
  if (format === 'rewarded') await admob.prepareRewardVideoAd(options);
  else await admob.prepareInterstitial(options);
}

// @capacitor-community/admob v8의 이벤트 이름입니다(RewardAdPluginEvents, InterstitialAdPluginEvents).
const AD_EVENTS = {
  rewarded: { showed: 'onRewardedVideoAdShowed', reward: 'onRewardedVideoAdReward', dismissed: 'onRewardedVideoAdDismissed', failed: 'onRewardedVideoAdFailedToShow' },
  interstitial: { showed: 'interstitialAdShowed', dismissed: 'interstitialAdDismissed', failed: 'interstitialAdFailedToShow' },
};

// 받아 둔 광고를 보여 주고 광고가 닫힐 때까지 기다립니다. 결과는 shown, rewarded, dismissed, failed, timeout 중 하나입니다.
// 보상형 광고의 show 함수는 보상을 받을 때만 끝나서, 중간에 닫으면 영원히 끝나지 않을 수 있습니다.
// 그래서 뜸, 보상, 닫힘, 표시 실패 이벤트로 결과를 정하고, 기다리는 시간에 상한을 둡니다.
// startMs: 광고가 화면에 뜨기까지의 상한. 이 안에 뜨지 않으면 failed입니다.
// timeoutMs: 광고가 뜬 뒤 닫힐 때까지의 상한. graceMs: 보상형이 닫힌 뒤 늦게 오는 보상 신호를 기다리는 시간.
export function adsShow(format, { startMs = 10000, timeoutMs = 120000, graceMs = 500 } = {}) {
  const admob = plugin('AdMob');
  if (!admob) return Promise.resolve('failed');
  const rewardedAd = format === 'rewarded';
  const names = AD_EVENTS[rewardedAd ? 'rewarded' : 'interstitial'];
  const events = typeof admob.addListener === 'function';
  return new Promise(resolve => {
    const handles = [];
    let rewarded = false, done = false, timer = 0;
    const finish = outcome => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      for (const h of handles) Promise.resolve(h).then(x => x?.remove?.()).catch(() => {});
      resolve(outcome);
    };
    const settle = () => finish(rewardedAd ? (rewarded ? 'rewarded' : 'dismissed') : 'shown');
    const arm = (ms, outcome) => { clearTimeout(timer); timer = setTimeout(() => finish(rewarded ? 'rewarded' : outcome), ms); };
    const listen = (name, fn) => { if (events && name) handles.push(admob.addListener(name, fn)); };
    listen(names.showed, () => arm(timeoutMs, 'timeout'));
    listen(names.reward, () => { rewarded = true; });
    listen(names.dismissed, () => { if (rewardedAd && !rewarded) { clearTimeout(timer); timer = setTimeout(settle, graceMs); } else settle(); });
    listen(names.failed, () => finish('failed'));
    // 이벤트를 붙일 수 있으면 먼저 "뜸" 신호를 짧게 기다리고, 붙일 수 없으면 전체 상한만 둡니다.
    arm(events ? startMs : timeoutMs, events ? 'failed' : 'timeout');
    const call = rewardedAd ? admob.showRewardVideoAd() : admob.showInterstitial();
    Promise.resolve(call).then(reward => {
      if (rewardedAd && reward && Number(reward.amount) > 0) rewarded = true;
      // 이벤트를 붙일 수 없는 환경(이전 판 플러그인, 테스트 대역)에서는 show 함수가 끝난 시점을 결과로 씁니다.
      if (!events) settle();
    }, () => finish('failed'));
  });
}
