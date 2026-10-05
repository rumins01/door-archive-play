// 광고와 로그 설정입니다. 숫자만 바꿔 광고 빈도와 무료 힌트 수를 조절합니다. 판단 규칙은 escape-ads.js에 있습니다.
// 출시 전에는 test를 true로 두고 Google 공개 테스트 광고 단위만 씁니다. 실제 단위 ID는 AdMob 콘솔에서 앱을 만든 뒤 넣어요.
// 테스트 단위 ID 출처: https://developers.google.com/admob/android/test-ads, https://developers.google.com/admob/ios/test-ads
export const GROWTH = Object.freeze({
  analytics: Object.freeze({ enabled: true }),
  ads: Object.freeze({
    enabled: true,
    test: true,
    // 어린이 대상 앱으로 등록하면 true로 바꿉니다. 그 경우 맞춤 광고와 일부 광고 형식이 막힙니다.
    childDirected: false,
    // 광고를 받아 오지 못하면(오프라인, 재고 없음, 동의 거부) 힌트를 그냥 엽니다. 막힌 플레이어를 광고 실패로 더 막지 않습니다.
    failOpen: true,
    // 방 한 판마다 전면 광고 한 번.
    // when: 'escape'는 탈출 결과 화면이 뜬 뒤, 다음 방 버튼이 켜지기 전에 띄웁니다(기본값).
    //       'open'은 방 버튼을 누른 직후에 띄웁니다. Google Play 광고 정책 FAQ가 레벨 시작 시점 광고를
    //       예상하지 못한 광고의 예로 들기 때문에 기본값으로 쓰지 않습니다. APP_GROWTH.md 3장 참고.
    // skipFirst: 설치 후 처음 맞는 광고 자리 몇 번은 광고 없이 넘깁니다. minGapSec: 직전 광고 뒤 이 시간 안에는 건너뜁니다.
    // 광고 자리마다 무조건 띄우려면 두 값을 0으로 둡니다.
    roomAd: Object.freeze({ when: 'escape', skipFirst: 1, minGapSec: 600, delayMs: 900 }),
    // 힌트를 열 때 보상형 광고. freePerRoom: 방마다 광고 없이 여는 힌트 수입니다. 0이면 모든 힌트에 광고가 붙습니다.
    // freeBeforeFirstBreak: 첫 광고 자리(첫 탈출)를 지나기 전, 즉 처음 하는 방의 힌트는 광고 없이 엽니다.
    // 첫 방 도중에 개인정보 동의 창과 광고가 뜨지 않게 하기 위해서입니다.
    hint: Object.freeze({ freePerRoom: 1, freeBeforeFirstBreak: true }),
    // 기다리는 시간의 상한입니다. 어떤 신호가 오지 않아도 화면이 잠긴 채 남지 않게 합니다.
    // loadTimeoutSec: 보상형 광고를 받아 오는 시간. showStartSec: 보여 달라고 한 뒤 광고가 화면에 뜰 때까지.
    // showTimeoutSec: 광고가 뜬 뒤 닫힐 때까지. rewardGraceMs: 닫힌 뒤 늦게 오는 보상 신호를 기다리는 시간.
    loadTimeoutSec: 8,
    showStartSec: 10,
    showTimeoutSec: 120,
    rewardGraceMs: 500,
    units: Object.freeze({
      android: Object.freeze({ interstitial: 'ca-app-pub-3940256099942544/1033173712', rewarded: 'ca-app-pub-3940256099942544/5224354917' }),
      ios: Object.freeze({ interstitial: 'ca-app-pub-3940256099942544/4411468910', rewarded: 'ca-app-pub-3940256099942544/1712485313' }),
    }),
  }),
});
