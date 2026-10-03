// 웹과 앱(Capacitor)의 차이를 이 파일에만 둡니다.
// 앱으로 감쌀 때 Preferences, App, Haptics 플러그인이 있으면 그것을 쓰고, 없으면 브라우저 기능을 씁니다.
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
