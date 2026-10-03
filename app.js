import { SAVE_KEY, freshProgress, unlocked, canSolve, attempt, recover, restoreDraft } from './engine.js';
import { sceneArt } from './art.js';

const app = document.querySelector('#app');
const dialog = document.querySelector('#dialog');
const e = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths = {
  door:'M5 21V3h14v18M3 21h18M15 12h.01', arrow:'M5 12h14m-5-5 5 5-5 5', back:'M19 12H5m5-5-5 5 5 5',
  key:'M15 7a4 4 0 1 1-2 7L5 22H2v-3l7-7a4 4 0 0 1 6-5Z', book:'M4 3h13a3 3 0 0 1 3 3v15H7a3 3 0 0 1-3-3V3Zm0 14h16',
  clock:'M12 8v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0', check:'m5 12 4 4L19 6', lock:'M6 10h12v11H6V10Zm3 0V6a3 3 0 0 1 6 0v4',
  close:'m6 6 12 12M6 18 18 6', search:'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0', sound:'m11 4-6 5H2v6h3l6 5V4Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14',
  mute:'m11 4-6 5H2v6h3l6 5V4Zm5 5 5 6m0-6-5 6', bulb:'M9 18h6m-6 3h6M8 14a7 7 0 1 1 8 0l-1 4H9l-1-4', reset:'M3 10a9 9 0 1 1 1 7M3 3v7h7',
  file:'M5 2h9l5 5v15H5V2Zm9 0v6h5M8 12h8M8 16h8', box:'m3 7 9-5 9 5v10l-9 5-9-5V7Zm0 0 9 5 9-5m-9 5v10', plus:'M12 5v14M5 12h14', minus:'M5 12h14', star:'m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6', help:'M9 8a3 3 0 0 1 6 0c0 2-3 2-3 5m0 4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0'
};
const icon = (name, size=18) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name] || paths.file}"/></svg>`;
const num = n => String(n).padStart(2,'0');
const fmt = n => `${num(Math.floor(n/60))}:${num(n%60)}`;
let stories = [], state, active=null, room='r1', tab='puzzles', selected=null, input=null, feedback='', solvedNow=false, genre='전체', query='', audioContext, storageWarning=false;
let savedNotice='이 브라우저에 자동 저장됩니다.';
let dialogReturnFocus=null;
let mobilePanel='explore';
const progress = () => state.progress[active.id];
const completed = () => stories.filter(s => state.progress[s.id]?.ending !== null && state.progress[s.id]?.ending !== undefined);

function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }
  catch { storageWarning=true; savedNotice='브라우저 저장 공간을 사용할 수 없습니다. 창을 닫으면 진행이 사라질 수 있어요.'; document.querySelector('#save-notice')?.replaceChildren(savedNotice); }
}
function announce(text) { document.querySelector('#announcement').textContent=text; }
function focusKey() {
  const node=document.activeElement;if(!node||node===document.body)return null;
  if(node.id)return {selector:`#${CSS.escape(node.id)}`,start:node.selectionStart,end:node.selectionEnd};
  if(node.dataset.action)return {selector:'[data-action="'+CSS.escape(node.dataset.action)+'"]'+['id','value','index','delta'].filter(k=>node.dataset[k]!==undefined).map(k=>`[data-${k}="${CSS.escape(node.dataset[k])}"]`).join('')};
  if(node.type==='submit')return {selector:'#puzzle-form button[type="submit"]'};
  return null;
}
function restoreFocus(key) {
  if(!key)return;const node=document.querySelector(key.selector);if(!node||node.disabled)return;
  node.focus({preventScroll:true});if(typeof key.start==='number'&&node.setSelectionRange)node.setSelectionRange(key.start,key.end);
}
function rememberDraft() { if(active&&selected){progress().drafts[selected]=structuredClone(input);save();} }
function tone(success=false) {
  if (!state.sound) return;
  try {
    audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') void audioContext.resume();
    [success ? 440 : 260, ...(success ? [554,659] : [])].forEach((hz,i) => {
      const o=audioContext.createOscillator(), g=audioContext.createGain(), t=audioContext.currentTime+i*.1;
      o.type='sine';o.frequency.value=hz;g.gain.setValueAtTime(.035,t);g.gain.exponentialRampToValueAtTime(.001,t+.35);o.connect(g);g.connect(audioContext.destination);o.start(t);o.stop(t+.36);
    });
  } catch { state.sound=false; save(); }
}
function showDialog(html) {
  if(!dialog.open)dialogReturnFocus=focusKey();
  dialog.innerHTML=`<div class="dialog-inner">${html}</div>`;
  if (!dialog.open) dialog.showModal();
}
const dialogHeader = title => `<div class="dialog-top"><h2 id="dialog-title">${e(title)}</h2><button class="quiet" data-action="close" aria-label="닫기">${icon('close')}</button></div>`;
function help() {
  showDialog(`${dialogHeader('기록실 이용 안내')}<ol class="help-list"><li><strong>사건 하나를 선택하세요.</strong> 어떤 순서로 시작해도 괜찮습니다. 모든 사건은 독립적으로 풀 수 있어요.</li><li><strong>방 안의 표식을 조사하세요.</strong> 장면 아래 조사 목록으로도 같은 단서를 얻습니다. 조사한 문서는 단서 수첩에 보관돼요.</li><li><strong>두 단서를 함께 읽고 장치를 푸세요.</strong> 첫 방의 두 장치를 해결하면 다음 방이 열립니다. 순서 장치는 후보를 차례로 누르고, 잘못 놓은 조각은 선택 순서에서 눌러 빼세요.</li><li><strong>막히면 힌트를 한 단계씩 여세요.</strong> 세 번째 힌트는 정답을 포함합니다. 오답과 힌트는 기록하지만 벌점이나 시간제한은 없어요.</li><li><strong>끝에서 당신의 선택을 남기세요.</strong> 다섯 장치를 풀고 후일담을 선택하면 사건이 완료됩니다. 모든 사건을 끝내면 기록실의 마지막 편지가 열립니다.</li></ol><p class="note-help">진행과 메모는 이 브라우저에만 저장됩니다. 다른 기기와 동기화되지 않으며, 브라우저 데이터를 지우면 기록도 지워집니다. 소리는 선택 사항이고 정답에 필요한 정보는 모두 글로 제공됩니다.</p><button class="btn primary" data-action="close">알겠습니다 ${icon('arrow')}</button>`);
}
function intro(story) {
  showDialog(`${dialogHeader(story.title)}<div class="eyebrow">CASE ${num(story.id)} / ${e(story.genre)}</div><p class="dialog-copy" style="margin-top:20px">${e(story.intro)}</p><div class="meta dialog-meta"><span>${icon('clock')}약 ${story.minutes}분</span><span>난이도 ${story.difficulty} / 5</span><span>공간 3개 · 장치 5개</span></div><p class="note-help">${e(story.mission)}</p><div class="dialog-actions"><button class="btn" data-action="close">돌아가기</button><button class="btn primary" data-action="start" data-id="${story.id}">문을 열다 ${icon('arrow')}</button></div>`);
}
function start(id) {
  const story=stories.find(s=>s.id===Number(id)); if (!story) return;
  state.progress[story.id] ??= freshProgress(); state.last=story.id; save(); dialog.close();
  if (location.hash===`#case/${story.id}`) route(); else location.hash=`case/${story.id}`;
}
function route() {
  const match=location.hash.match(/^#case\/(\d+)$/);
  active=match ? stories.find(s=>s.id===Number(match[1])) : null;
  selected=null;feedback='';tab='puzzles';room='r1';mobilePanel='explore';
  if (active) {
    state.progress[active.id] ??= freshProgress();state.last=active.id;
    room=active.rooms.find(r=>unlocked(r.requires,progress()) && active.puzzles.some(p=>p.room===r.id&&!progress().solved.includes(p.id)))?.id ?? 'r3';
    save();
  }
  document.title=active?`${active.title} | 문 너머`:'문 너머 | 사라진 기록실';render();window.scrollTo(0,0);
}
function render() { active ? renderGame() : renderLibrary(); }
function renderLibrary() {
  app.classList.remove('playing');
  const done=completed().length;
  const last=stories.find(s=>s.id===state.last && state.progress[s.id]?.ending===null);
  const featured=last || stories.find(s=>!state.progress[s.id] || state.progress[s.id].ending===null) || stories[0];
  app.innerHTML=`<div class="wrap"><header class="topbar"><button class="brand" data-action="home" aria-label="문 너머 기록실 홈"><span class="brand-mark">${icon('door',32)}</span><span><span class="brand-name">문 너머</span><span class="brand-en" style="display:block">BEYOND THE DOOR</span></span></button><div class="top-actions"><span class="count-label">기록 복원 <span class="mono">${num(done)} / 24</span></span><button class="quiet" data-action="sound" aria-label="효과음 ${state.sound?'끄기':'켜기'}">${icon(state.sound?'sound':'mute')}</button><button class="quiet" data-action="help">${icon('help')} 플레이 안내</button></div></header><main id="main"><section class="featured"><img src="assets/archive.jpg" width="1536" height="1024" fetchpriority="high" alt="황동 자물쇠가 달린 문과 오래된 문서들이 놓인 기록실"><div class="featured-copy"><div class="eyebrow">${last?'YOUR UNFINISHED CHAPTER':'THE ARCHIVE OF LOST DOORS'}</div><h1>${last?e(last.title):'스물네 개의 문.<br>당신을 기다린 이야기.'}</h1><p>${last?'마지막으로 남긴 단서가 그대로 기다리고 있습니다. 멈췄던 이야기의 다음 장을 열어 보세요.':'이름을 잃은 열차, 시간을 멈춘 저택, 돌아오지 않는 편지. 흩어진 단서를 모아 문 너머의 진실을 밝혀 주세요.'}</p><button class="btn primary" data-action="case" data-id="${featured.id}">${last?'사건 이어하기':'첫 번째 사건 열기'} ${icon('arrow')}</button></div><span class="featured-stamp">24 STORIES / 120 PUZZLES</span></section><div class="catalog-head"><div><span class="eyebrow">CHOOSE YOUR NEXT MYSTERY</span><h2 style="margin-top:8px">사건 기록 <span class="tiny-count">24</span></h2></div><p class="muted" style="font-size:12px">어떤 문부터 열어도 괜찮아요.</p></div>${done===24?`<section class="master-ending"><span class="eyebrow">THE FINAL LETTER</span><h2>문을 만든 사람에게</h2><p>당신은 스물네 번 문을 열었고, 그 안에서 스물네 개의 이유를 발견했습니다. 기록실은 사람을 가두는 곳이 아니었습니다. 아무도 듣지 못한 이야기가 사라지지 않도록 기다리는 곳이었습니다. 이제 마지막 기록의 이름을 알게 되었습니다. 그 이름은, 끝까지 읽어 준 당신입니다.</p></section>`:''}<div class="toolbar"><nav class="filters" aria-label="장르 선택">${['전체','추리','모험','SF','판타지','스릴러'].map(g=>`<button class="filter" data-action="genre" data-value="${g}" aria-pressed="${genre===g}">${g}</button>`).join('')}</nav><label class="sr-only" for="search">사건 검색</label><input id="search" type="search" placeholder="이름이나 장소로 찾기" value="${e(query)}"></div><div id="case-grid" class="case-grid">${cards()}</div></main><footer class="library-footer"><span>${icon('door',14)} 문 너머 / 사라진 기록실</span><span id="save-notice">${e(savedNotice)}</span><button class="quiet" data-action="credits">제작과 참고 자료</button></footer></div>`;
}
function cards() {
  const visible=stories.filter(s=>(genre==='전체'||s.genre===genre)&&`${s.title} ${s.subtitle} ${s.intro}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  if (!visible.length) return '<div class="empty"><h3>일치하는 기록이 없습니다.</h3><p class="muted">다른 단어를 입력하거나 장르를 전체로 바꿔 보세요.</p><button class="btn" data-action="clear-filters" style="margin-top:24px">전체 사건 보기</button></div>';
  return visible.map(s=>{
    const p=state.progress[s.id],done=p&&p.ending!==null;
    return `<button class="case-card" data-action="case" data-id="${s.id}" aria-label="${e(s.title)} ${done?'완료':p?'이어하기':'시작하기'}"><div class="case-picture">${sceneArt(s.scene,s.accent,s.id*3)}<span class="case-no">FILE ${num(s.id)}</span>${p?`<span class="case-status">${done?'✓ 복원 완료':`${p.solved.length}/5 진행 중`}</span>`:''}</div><div class="case-copy"><span class="eyebrow">${e(s.genre)} / CHAPTER ${num(s.id)}</span><h3>${e(s.title)}</h3><p>${e(s.subtitle)}</p><div class="case-bottom"><div class="meta"><span>${icon('clock',14)} ${s.minutes}분</span><span class="difficulty" aria-label="난이도 ${s.difficulty} 중 5">${'◆'.repeat(s.difficulty)}${'◇'.repeat(5-s.difficulty)}</span></div><span class="case-arrow">${icon('arrow')}</span></div></div></button>`;
  }).join('');
}
function renderGame() {
  app.classList.add('playing');
  const focus=focusKey();
  const p=progress(),r=active.rooms.find(r=>r.id===room),clues=active.clues.filter(c=>c.room===room&&unlocked(c.requires,p));
  app.innerHTML=`<header class="game-header"><div class="game-title"><button class="quiet" data-action="home" aria-label="사건 목록으로">${icon('back')}</button><div><div class="eyebrow">FILE ${num(active.id)} / ${e(active.genre)}</div><h1>${e(active.title)}</h1></div></div><div class="game-tools"><span class="timer" id="timer" aria-label="플레이 시간">${fmt(p.seconds)}</span><button class="quiet sound" data-action="sound" aria-label="효과음 ${state.sound?'끄기':'켜기'}">${icon(state.sound?'sound':'mute')}</button><button class="quiet reset" data-action="reset">${icon('reset')}<span class="tool-label">처음부터</span></button><button class="quiet" data-action="help" aria-label="플레이 안내">${icon('help')}</button></div></header>${storageWarning?`<div class="save-warning">${e(savedNotice)}</div>`:''}<main id="main" class="game-shell" data-mobile-panel="${mobilePanel}"><section class="explore" id="explore"><div class="section-line"><h2>${e(r.name)}</h2><span class="eyebrow">ROOM ${num(active.rooms.indexOf(r)+1)} / 03</span></div><nav class="room-nav" aria-label="방 이동">${active.rooms.map((r,i)=>`<button class="room-tab" data-action="room" data-id="${r.id}" aria-pressed="${room===r.id}" ${unlocked(r.requires,p)?'':'disabled'}>${icon(unlocked(r.requires,p)?'door':'lock',14)} ${num(i+1)} ${e(r.name)}</button>`).join('')}</nav><div class="scene">${sceneArt(active.scene,active.accent,active.id*3+active.rooms.indexOf(r))}${clues.map((c,i)=>`<button class="hotspot ${p.found.includes(c.id)?'found':''}" data-action="clue" data-id="${c.id}" style="left:${c.x}%;top:${c.y}%" aria-label="${e(c.name)} ${p.found.includes(c.id)?'다시 읽기':'조사하기'}">${p.found.includes(c.id)?icon('check',16):`<span>${i+1}</span>`}<span class="hotspot-label">${e(c.name)}</span></button>`).join('')}<span class="scene-caption">${p.solved.length===5?'ALL SEALS RELEASED':'INSPECT THE ROOM / FOLLOW THE EVIDENCE'}</span></div><p class="room-description">${e(r.description)}</p><div class="explore-label"><span>방 안의 조사 대상</span><span>${clues.filter(c=>p.found.includes(c.id)).length} / ${clues.length} 발견</span></div><div class="object-list">${clues.map(c=>`<button class="object ${p.found.includes(c.id)?'seen':''}" data-action="clue" data-id="${c.id}">${icon(c.kind==='object'?'box':c.kind==='record'?'book':'file',20)}<span>${e(c.name)}<small>${p.found.includes(c.id)?'수첩에 보관됨 · 다시 읽기':'아직 조사하지 않았습니다'}</small></span></button>`).join('')}</div><div class="objective">${icon('key',20)}<div><span class="eyebrow">YOUR OBJECTIVE</span><p>${e(active.mission)}</p></div></div><p class="note-help" id="save-notice" style="margin-top:20px">${e(savedNotice)}</p><button class="quiet" data-action="story">${icon('book')} 사건의 시작 다시 읽기</button></section><aside class="desk" id="desk" aria-label="조사 기록과 퍼즐"><nav class="desk-tabs" aria-label="조사 도구"><button class="desk-tab" data-action="tab" data-value="puzzles" aria-pressed="${tab==='puzzles'}">장치<span>${p.solved.length}/5</span></button><button class="desk-tab" data-action="tab" data-value="clues" aria-pressed="${tab==='clues'}">단서<span>${p.found.length}</span></button><button class="desk-tab" data-action="tab" data-value="notes" aria-pressed="${tab==='notes'}">메모</button><button class="desk-tab" data-action="tab" data-value="log" aria-pressed="${tab==='log'}">사건록</button></nav><div id="desk-content">${deskContent()}</div></aside></main>${mobileNavigation()}`;
  document.querySelector('.game-tools .reset')?.setAttribute('aria-label','이 사건 처음부터 시작');
  restoreFocus(focus);
}
function mobileNavigation() {
  const items=[['explore','탐색','search'],['puzzles','장치','key'],['clues','단서','file'],['notes','메모','book'],['log','사건록','door']];
  return `<nav class="mobile-nav" aria-label="사건 조사 메뉴">${items.map(([value,label,glyph])=>`<button data-action="mobile-tab" data-value="${value}" aria-controls="${value==='explore'?'explore':'desk'}" aria-pressed="${value==='explore'?mobilePanel==='explore':mobilePanel==='desk'&&tab===value}">${icon(glyph,20)}<span>${label}</span></button>`).join('')}</nav>`;
}
function switchPanel(value) {
  rememberDraft();
  mobilePanel=value==='explore'?'explore':'desk';
  if(value!=='explore')tab=value;
  renderGame();
  window.scrollTo({top:0,behavior:'instant'});
}
function deskContent() {
  const p=progress();
  if (tab==='notes') return `<div class="fade-in"><h2 style="font-size:24px;margin-bottom:16px">나의 추리 메모</h2><p class="note-help">순서, 숫자, 의심스러운 문장을 자유롭게 남겨 두세요. 이 브라우저에 자동 저장됩니다.</p><label for="notes" class="sr-only">추리 메모</label><textarea id="notes" maxlength="6000" placeholder="아직 연결되지 않은 단서들…">${e(p.notes)}</textarea></div>`;
  if (tab==='clues') return p.found.length?`<div class="fade-in">${active.clues.filter(c=>p.found.includes(c.id)).map(c=>`<article class="journal-clue"><div class="eyebrow">${e(active.rooms.find(r=>r.id===c.room).name)}</div><h3>${e(c.name)}</h3><p>${e(c.text)}</p></article>`).join('')}</div>`:'<div class="empty"><h3>아직 비어 있는 수첩</h3><p class="muted">방 안의 조사 대상을 누르면<br>단서가 여기에 모입니다.</p></div>';
  if (tab==='log') return `<div class="fade-in"><div class="log-entry"><h3>사건의 시작</h3><p>${e(active.intro)}</p></div>${active.puzzles.filter(q=>p.solved.includes(q.id)).map(q=>`<div class="log-entry"><h3>${e(q.title)}</h3><p>${e(q.reveal)}</p></div>`).join('')}${p.solved.length===5?`<div class="log-entry"><h3>밝혀진 진실</h3><p>${e(active.twist)}</p></div><button class="btn primary submit" data-action="ending">${p.ending===null?'마지막 선택':'후일담 다시 읽기'} ${icon('arrow')}</button>`:''}</div>`;
  if (selected) return puzzleContent(active.puzzles.find(q=>q.id===selected));
  return `<div class="desk-summary"><span class="eyebrow">INVESTIGATION BOARD</span><h3>${p.solved.length===5?'모든 봉인이 풀렸습니다.':'단서가 모이면, 장치가 응답합니다.'}</h3><div class="progress-track">${active.puzzles.map(q=>`<i class="${p.solved.includes(q.id)?'done':''}"></i>`).join('')}</div><p>${p.solved.length===5?'마지막 선택을 남겨 사건을 마무리하세요.':'각 장치에 필요한 두 단서를 먼저 조사해 주세요.'}</p></div><div class="puzzle-list">${active.puzzles.map((q,i)=>{
    const solved=p.solved.includes(q.id),open=unlocked(q.requires,p),ready=canSolve(q,p);
    return `<button class="puzzle-item ${solved?'solved':''}" data-action="puzzle" data-id="${q.id}" ${open?'':'disabled'}><span class="puzzle-index">${solved?icon('check'):num(i+1)}</span><span><strong>${e(q.title)}</strong><small>${solved?'해결 완료 · 풀이 다시 읽기':!open?'이전 방의 두 장치를 해결하면 열립니다':ready?'단서 확보 · 장치 살펴보기':`필요한 단서 ${q.clueIds.filter(id=>p.found.includes(id)).length}/${q.clueIds.length}`}</small></span><span class="end-icon">${icon(solved?'check':open?'arrow':'lock',16)}</span></button>`;
  }).join('')}</div>${p.solved.length===5?`<button class="btn primary submit" data-action="ending">${p.ending===null?'마지막 문 열기':'후일담 다시 읽기'} ${icon('door')}</button>`:''}<p class="note-help" style="margin-top:24px">${icon('bulb',14)} 힌트는 각 장치에서 3단계로 제공됩니다.</p>`;
}
function puzzleContent(q) {
  const p=progress(), solved=p.solved.includes(q.id), ready=canSolve(q,p), count=p.hints[q.id]||0;
  return `<section class="puzzle-panel fade-in"><div class="puzzle-head"><button class="quiet" data-action="puzzle-back">${icon('back',16)} 장치 목록</button><span class="eyebrow">${{code:'CIPHER',choice:'DEDUCTION',sequence:'SEQUENCE',switches:'CIRCUIT',dials:'DIAL LOCK',pairs:'CONNECTION'}[q.type]}</span></div><h2>${e(q.title)}</h2><p class="puzzle-prompt">${e(q.prompt)}</p><div class="control-label">관련 단서</div><div class="evidence-ref">${q.clueIds.map(id=>{const c=active.clues.find(c=>c.id===id);return `<button data-action="clue" data-id="${id}">${icon(p.found.includes(id)?'file':'search',12)} ${e(c.name)} ${p.found.includes(id)?'':'· 조사하기'}</button>`;}).join('')}</div>${solved?`<div class="solution"><h3>${icon('check')} 봉인 해제</h3><p>${e(q.explanation)}</p><p class="reveal">${e(q.reveal)}</p></div><button class="btn primary submit" data-action="next-step">다음 기록으로 ${icon('arrow')}</button>`:!ready?'<div class="empty"><p>관련 단서를 모두 조사하면<br>장치를 조작할 수 있습니다.</p></div>':`<form id="puzzle-form">${controls(q)}<button class="btn primary submit" type="submit">${q.type==='choice'?'추리 확인하기':'장치 작동하기'} ${icon('key',16)}</button></form><div class="feedback ${solvedNow?'success':''}" role="status">${e(feedback)}</div><div class="hint-zone"><button class="quiet" data-action="hint" ${count===3?'disabled':''}>${icon('bulb')} ${count===3?'모든 힌트를 열었습니다':`힌트 ${count+1}단계 열기`} <span class="mono">${count}/3</span></button>${count===2?'<p class="note-help">다음 힌트에는 정답이 포함됩니다.</p>':''}${q.hints.slice(0,count).map((h,i)=>`<div class="hint"><b>HINT ${i+1}</b>${e(h)}</div>`).join('')}</div>`}</section>`;
}
function controls(q) {
  if (q.type==='code') return `<label class="control-label" for="answer">암호 입력</label><input class="answer-input" id="answer" name="answer" inputmode="${q.answer.every(answer=>/^\d+$/.test(String(answer)))?'numeric':'text'}" enterkeyhint="done" autocomplete="off" spellcheck="false" maxlength="80" value="${e(input||'')}" placeholder="단서에서 찾은 답">`;
  if (q.type==='choice'||q.type==='switches') return `<div class="control-label">${q.type==='choice'?'하나를 선택하세요.':'조건에 맞는 항목을 모두 켜세요.'}</div><div class="options">${q.options.map((o,i)=>{const on=q.type==='choice'?input===o.id:input.includes(o.id);return `<button type="button" class="option" data-action="option" data-value="${e(o.id)}" aria-pressed="${on}"><span class="marker">${on?'✓':String.fromCharCode(65+i)}</span>${e(o.label)}</button>`;}).join('')}</div>`;
  if (q.type==='sequence') return `<div class="control-label">후보를 눌러 순서를 만드세요. 위의 조각을 누르면 뺄 수 있어요.</div><div class="order-slots" aria-label="선택한 순서">${input.length?input.map((id,i)=>`<button type="button" class="order-slot" data-action="remove-order" data-value="${e(id)}">${i+1}. ${e(q.options.find(o=>o.id===id).label)} ×</button>`).join(''):'<span class="muted">아직 놓은 조각이 없습니다.</span>'}</div><div class="options">${q.options.map(o=>`<button type="button" class="option" data-action="option" data-value="${e(o.id)}" ${input.includes(o.id)?'disabled':''}>${icon('plus',14)} ${e(o.label)}</button>`).join('')}</div>`;
  if (q.type==='dials') return `<div class="dials">${q.labels.map((label,i)=>`<div class="dial"><label>${e(label)}</label><button type="button" data-action="dial" data-index="${i}" data-delta="1" aria-label="${e(label)} 올리기">${icon('plus')}</button><output aria-label="${e(label)} 값">${input[i]}</output><button type="button" data-action="dial" data-index="${i}" data-delta="-1" aria-label="${e(label)} 내리기">${icon('minus')}</button></div>`).join('')}</div>`;
  if (q.type==='pairs') {
    const rights=q.pairs.map(p=>p.right).sort((a,b)=>a.localeCompare(b,'ko'));
    return `<div class="control-label">각 기록과 짝이 되는 항목을 연결하세요.</div>${q.pairs.map((pair,i)=>`<div class="pair-row"><label for="pair-${i}">${e(pair.left)}</label><select id="pair-${i}" data-pair="${e(pair.left)}"><option value="">짝 선택</option>${rights.map(right=>`<option value="${e(right)}" ${input[pair.left]===right?'selected':''}>${e(right)}</option>`).join('')}</select></div>`).join('')}`;
  }
  return '';
}
function showClue(id) {
  const c=active.clues.find(c=>c.id===id);if(!c||!unlocked(c.requires,progress())||!unlocked(active.rooms.find(r=>r.id===c.room).requires,progress())) return;
  const isNew=!progress().found.includes(id);
  if(isNew){progress().found.push(id);save();tone();renderGame();announce('새로운 단서를 수첩에 보관했습니다.');}
  showDialog(`${dialogHeader(isNew?'새로운 단서 발견':'단서 다시 읽기')}<article class="clue-paper"><span class="eyebrow">EVIDENCE ${num(active.clues.indexOf(c)+1)} / ${e(active.rooms.find(r=>r.id===c.room).name)}</span><h3>${e(c.name)}</h3>${e(c.text)}</article><div class="dialog-actions"><button class="btn primary" data-action="close">수첩에 보관하기 ${icon('check')}</button></div>`);
}
function openPuzzle(id) {
  const q=active.puzzles.find(p=>p.id===id);if(!q||!unlocked(q.requires,progress()))return;
  rememberDraft();selected=id;tab='puzzles';mobilePanel='desk';feedback='';solvedNow=false;
  input=restoreDraft(q,progress().drafts[id]);
  renderGame();if(innerWidth<761)window.scrollTo({top:0,behavior:'instant'});
}
function updateDesk() { const focus=focusKey();document.querySelector('#desk-content').innerHTML=deskContent();restoreFocus(focus); }
function ending() {
  if(progress().solved.length!==5)return;
  const p=progress(),isDone=p.ending!==null,choice=active.finalChoice;
  showDialog(`${dialogHeader('문 너머의 진실')}<div class="ending-hero">${icon('door',48)}<span class="eyebrow">CASE ${num(active.id)} / ${isDone?'ARCHIVED':'THE LAST DECISION'}</span><h2>${e(active.title)}</h2><p>${e(active.twist)}</p><p style="margin-top:20px">${e(active.ending)}</p></div>${isDone?`<div class="ending-record">${e(choice.options[p.ending].text)}<p style="margin-top:16px">${e(active.epilogue)}</p></div><div class="seal" aria-label="수집한 인장 ${e(active.seal)}">${e(active.seal)}</div><p class="note-help" style="text-align:center">플레이 ${fmt(p.seconds)} / 사용한 힌트 ${Object.values(p.hints).reduce((a,b)=>a+b,0)}개<br>복원한 기록 ${completed().length} / 24</p><div class="dialog-actions"><button class="btn" data-action="reset">다른 선택으로 다시 시작</button><button class="btn primary" data-action="home">다음 사건 찾기 ${icon('arrow')}</button></div>`:`<h3>${e(choice.prompt)}</h3><div class="ending-choice">${choice.options.map((o,i)=>`<button data-action="choose-ending" data-index="${i}"><strong>${e(o.label)}</strong><small>이 선택으로 후일담을 남깁니다 ${icon('arrow',14)}</small></button>`).join('')}</div>`}`);
}
function credits() {showDialog(`${dialogHeader('기록실 제작 노트')}<p class="dialog-copy">문 너머는 24개의 오리지널 이야기와 120개의 장치로 구성된 1인용 웹 방탈출입니다. 게임 속 인물과 사건은 창작입니다. 배경 이미지는 AI로 생성했고, 장면 삽화와 퍼즐 조작은 웹으로 구현했습니다.\n\n장소와 퍼즐의 일관성, 해결 후 드러나는 새로운 사실, 독립적인 사건이 공유하는 세계라는 설계 원칙을 참고했습니다. 원작의 퍼즐이나 줄거리를 복제하지 않았습니다.</p><ul class="help-list"><li><a href="https://scottnicholson.com/pubs/askwhy.pdf" target="_blank" rel="noopener noreferrer">Scott Nicholson, Ask Why</a></li><li><a href="https://www.fireproofgames.com/games/the-room" target="_blank" rel="noopener noreferrer">Fireproof Games, The Room</a></li><li><a href="https://www.rustylake.com/" target="_blank" rel="noopener noreferrer">Rusty Lake</a></li><li><a href="https://escapeacademygame.com/en" target="_blank" rel="noopener noreferrer">Escape Academy</a></li><li><a href="https://store.steampowered.com/app/210970/The_Witness/" target="_blank" rel="noopener noreferrer">The Witness</a></li></ul><p class="note-help">대표작의 공식 소개와 설계 자료를 참고했으며 모든 게임을 플레이하거나 분석한 것은 아닙니다.</p>`);}

document.addEventListener('click', event=>{
  const b=event.target.closest('[data-action]');if(!b||b.disabled)return;
  const a=b.dataset.action,id=b.dataset.id,value=b.dataset.value;
  if(a==='close'){dialog.close();return;}
  if(a==='help'){help();return;}
  if(a==='credits'){credits();return;}
  if(a==='home'){save();dialog.close();location.hash='';if(!active)renderLibrary();return;}
  if(a==='sound'){state.sound=!state.sound;save();tone(true);render();return;}
  if(a==='case'){const s=stories.find(s=>s.id===Number(id));state.progress[s.id]?start(id):intro(s);return;}
  if(a==='start'){start(id);return;}
  if(a==='genre'){genre=value;renderLibrary();return;}
  if(a==='clear-filters'){genre='전체';query='';renderLibrary();return;}
  if(!active)return;
  if(a==='room'){const r=active.rooms.find(r=>r.id===id);if(r&&unlocked(r.requires,progress())){rememberDraft();room=id;mobilePanel='explore';renderGame();}return;}
  if(a==='clue'){showClue(id);return;}
  if(a==='story'){showDialog(`${dialogHeader('사건의 시작')}<p class="dialog-copy">${e(active.intro)}</p><div class="dialog-actions"><button class="btn primary" data-action="close">조사 계속하기</button></div>`);return;}
  if(a==='mobile-tab'){switchPanel(value);return;}
  if(a==='tab'){rememberDraft();tab=value;renderGame();return;}
  if(a==='puzzle'){openPuzzle(id);return;}
  if(a==='puzzle-back'){selected=null;feedback='';updateDesk();return;}
  if(a==='next-step'){
    const next=active.puzzles.find(q=>!progress().solved.includes(q.id));selected=null;
    if(next){room=next.room;mobilePanel='explore';renderGame();announce('다음 장치를 조사하세요.');}else{renderGame();ending();}return;
  }
  if(a==='ending'){ending();return;}
  if(a==='choose-ending'){
    const index=Number(b.dataset.index);if(progress().solved.length!==5||!active.finalChoice.options[index])return;
    progress().ending=index;save();tone(true);renderGame();ending();return;
  }
  if(a==='reset'){showDialog(`${dialogHeader('이 사건을 처음부터 시작할까요?')}<p class="dialog-copy">「${e(active.title)}」의 단서, 풀이, 메모와 후일담이 초기화됩니다. 다른 사건의 기록은 그대로 유지됩니다.</p><div class="dialog-actions"><button class="btn" data-action="close">계속 조사하기</button><button class="btn primary" data-action="confirm-reset">이 사건 초기화</button></div>`);return;}
  if(a==='confirm-reset'){state.progress[active.id]=freshProgress();save();dialog.close();route();return;}
  const q=active.puzzles.find(q=>q.id===selected);if(!q||progress().solved.includes(q.id)||!canSolve(q,progress()))return;
  if(a==='option'){
    if(q.type==='choice')input=value;
    else if(q.type==='switches')input=input.includes(value)?input.filter(v=>v!==value):[...input,value];
    else if(q.type==='sequence'&&!input.includes(value))input.push(value);
    feedback='';rememberDraft();updateDesk();
    if(q.type==='sequence')document.querySelector('.options .option:not(:disabled)')?.focus({preventScroll:true});
  }else if(a==='remove-order'){input=input.filter(v=>v!==value);rememberDraft();updateDesk();document.querySelector('.options .option:not(:disabled)')?.focus({preventScroll:true});}
  else if(a==='dial'){const i=Number(b.dataset.index);input[i]=(input[i]+Number(b.dataset.delta)+(q.max??9)+1)%((q.max??9)+1);rememberDraft();updateDesk();}
  else if(a==='hint'){progress().hints[q.id]=Math.min(3,(progress().hints[q.id]||0)+1);save();updateDesk();}
});
document.addEventListener('input', event=>{
  if(event.target.id==='search'){query=event.target.value;document.querySelector('#case-grid').innerHTML=cards();}
  if(event.target.id==='notes'){progress().notes=event.target.value;save();}
  if(event.target.id==='answer'){input=event.target.value;rememberDraft();}
});
document.addEventListener('change', event=>{if(event.target.dataset.pair){input[event.target.dataset.pair]=event.target.value;rememberDraft();}});
document.addEventListener('submit', event=>{
  if(event.target.id!=='puzzle-form')return;event.preventDefault();
  const q=active.puzzles.find(q=>q.id===selected);const result=attempt(q,input,progress());
  feedback=result.ok?'봉인이 풀렸습니다.':result.reason;solvedNow=result.ok;save();
  if(result.ok){tone(true);renderGame();announce(`${q.title} 해결. ${q.reveal}`);}else{tone();updateDesk();document.querySelector('.feedback')?.scrollIntoView({block:'nearest'});}
});
dialog.addEventListener('click', event=>{if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();}});
dialog.addEventListener('close',()=>restoreFocus(dialogReturnFocus));
window.addEventListener('hashchange',route);
window.addEventListener('pagehide',()=>state&&save());
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state)save();});

async function init() {
  try {
    const response=await fetch('./stories.json');if(!response.ok)throw new Error('기록 파일을 읽지 못했습니다.');stories=await response.json();
    let raw;try{raw=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');}catch{savedNotice='이전 기록을 읽지 못해 새 기록으로 시작합니다.';}
    state=recover(raw,stories);route();
    setInterval(()=>{if(active&&!document.hidden&&progress().ending===null){progress().seconds++;const t=document.querySelector('#timer');if(t)t.textContent=fmt(progress().seconds);if(progress().seconds%10===0)save();}},1000);
    registerTools();
  }catch(error){app.innerHTML=`<main class="loading"><h1>기록실 문이 잠시 닫혔습니다.</h1><p>${e(error.message)}</p><p>연결을 확인하고 페이지를 새로고침해 주세요.</p></main>`;}
}
function registerTools() {
  if(!document.modelContext?.registerTool)return;
  const lifecycle=new AbortController();
  const registrations=[{
    name:'read_escape_progress',description:'현재 기기에 저장된 방탈출 사건 목록과 완료 상태를 읽습니다.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>({stories:stories.map(s=>({id:s.id,title:s.title,solved:state.progress[s.id]?.solved.length||0,completed:state.progress[s.id]?.ending!=null})),active:active?.id??null})
  },{
    name:'open_escape_case',description:'선택한 방탈출 사건을 열고 이 기기에 시작 상태를 저장합니다. 퍼즐을 해결하지 않습니다.',inputSchema:{type:'object',properties:{id:{type:'integer',minimum:1,maximum:24}},required:['id'],additionalProperties:false},annotations:{readOnlyHint:false},execute:async data=>{if(!data||!Number.isInteger(data.id)||!stories.some(s=>s.id===data.id))throw new Error('존재하는 사건 번호가 필요합니다.');start(data.id);route();return {id:active.id,title:active.title,room};}
  }];
  for(const tool of registrations){try{Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}}
  window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}
void init();
