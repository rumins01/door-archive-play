// 색, 방향, 그림 이름입니다. 그림 모듈과 빌드 도구가 함께 읽으므로 다른 모듈을 불러오지 않습니다.
export const COLORS = { red: '#b8483a', blue: '#3f6d9c', green: '#4d8757', yellow: '#d6ab3f' };
export const COLOR_NAMES = { red: '빨강', blue: '파랑', green: '초록', yellow: '노랑' };
export const DIRECTION_NAMES = { up: '위', right: '오른쪽', down: '아래', left: '왼쪽' };
export const SYMBOL_NAMES = {
  sun: '해', moon: '달', star: '별', drop: '물방울', leaf: '잎', eye: '눈', key: '열쇠', crown: '왕관',
  // 단서와 자물쇠에 쓰는 작은 그림 이름입니다.
  bottle: '병', book: '책', cup: '잔', fish: '물고기', candle: '초', gem: '보석', flag: '깃발', apple: '사과', umbrella: '우산', lantern: '등롱',
  bird: '새', ribbon: '리본', feather: '깃털', shell: '조개', mushroom: '버섯', bell: '종', anchor: '닻', note: '음표', snow: '눈송이', flame: '불꽃',
  wave: '물결', tree: '나무', hand: '손', boat: '배', house: '집', hat: '모자', foot: '발자국', coin: '동전', pear: '서양배', cloud: '구름', scarf: '목도리',
  flower: '꽃', dot: '점', dash: '선',
};
