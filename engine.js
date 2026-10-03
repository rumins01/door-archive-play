export const SAVE_KEY = 'beyond-the-door.v1';
export const normal = value => String(value ?? '').normalize('NFKC').toUpperCase().replace(/[\s\-.,:]/g, '');
export const freshProgress = () => ({ found: [], solved: [], hints: {}, drafts: {}, notes: '', seconds: 0, mistakes: 0, ending: null });
export function unlocked(requirements = [], progress) { return requirements.every(id => progress.solved.includes(id)); }
export function canSolve(puzzle, progress) { return unlocked(puzzle.requires, progress) && puzzle.clueIds.every(id => progress.found.includes(id)); }
export function restoreDraft(puzzle, value) {
  if (puzzle.type === 'code') return typeof value === 'string' ? value.slice(0,80) : '';
  if (puzzle.type === 'choice') return puzzle.options.some(o => o.id === value) ? value : '';
  if (puzzle.type === 'dials') return puzzle.labels.map((_,i) => Array.isArray(value) && Number.isInteger(value[i]) && value[i] >= 0 && value[i] <= (puzzle.max ?? 9) ? value[i] : 0);
  if (puzzle.type === 'pairs') return Object.fromEntries(puzzle.pairs.filter(pair => value && typeof value === 'object' && puzzle.pairs.some(p => p.right === value[pair.left])).map(pair => [pair.left, value[pair.left]]));
  return [...new Set(Array.isArray(value) ? value.filter(id => puzzle.options.some(o => o.id === id)) : [])];
}
export function correct(puzzle, input) {
  if (puzzle.type === 'code' || puzzle.type === 'choice') return puzzle.answer.some(answer => normal(answer) === normal(input));
  if (puzzle.type === 'pairs') return !!input && puzzle.pairs.every(pair => input[pair.left] === pair.right) && Object.keys(input).length === puzzle.pairs.length;
  if (!Array.isArray(input) || input.length !== puzzle.solution.length) return false;
  if (puzzle.type === 'switches') return new Set(input).size === input.length && puzzle.solution.every(value => input.includes(value));
  return puzzle.solution.every((value, index) => String(value) === String(input[index]));
}
export function attempt(puzzle, input, progress) {
  if (!canSolve(puzzle, progress)) return { ok: false, reason: '먼저 필요한 단서를 모두 조사하세요.' };
  if (progress.solved.includes(puzzle.id)) return { ok: true, already: true };
  if (!correct(puzzle, input)) { progress.mistakes++; return { ok: false, reason: '장치가 반응하지 않습니다. 단서의 조건을 다시 대조해 보세요.' }; }
  progress.solved.push(puzzle.id);
  return { ok: true, already: false };
}
export function recover(raw, stories) {
  const result = { version: 1, progress: {}, last: null, sound: false };
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || raw.version !== 1) return result;
  result.sound = raw.sound === true;
  if (stories.some(s => s.id === raw.last)) result.last = raw.last;
  for (const story of stories) {
    const old = raw.progress?.[story.id];
    if (!old || typeof old !== 'object') continue;
    const p = freshProgress();
    p.found = [...new Set(Array.isArray(old.found) ? old.found.filter(id => story.clues.some(c => c.id === id)) : [])];
    const oldSolved = Array.isArray(old.solved) ? old.solved : [];
    for (const puzzle of story.puzzles) if (oldSolved.includes(puzzle.id) && canSolve(puzzle, p)) p.solved.push(puzzle.id);
    for (const puzzle of story.puzzles) {
      const n = old.hints?.[puzzle.id];
      if (Number.isInteger(n) && n >= 0 && n <= 3) p.hints[puzzle.id] = n;
      p.drafts[puzzle.id] = restoreDraft(puzzle, old.drafts?.[puzzle.id]);
    }
    p.notes = typeof old.notes === 'string' ? old.notes.slice(0, 6000) : '';
    p.seconds = Number.isFinite(old.seconds) ? Math.max(0, Math.floor(old.seconds)) : 0;
    p.mistakes = Number.isFinite(old.mistakes) ? Math.max(0, Math.floor(old.mistakes)) : 0;
    p.ending = p.solved.length === story.puzzles.length && Number.isInteger(old.ending) && old.ending >= 0 && old.ending < story.finalChoice.options.length ? old.ending : null;
    result.progress[story.id] = p;
  }
  return result;
}
export function validateStories(stories) {
  const errors = [];
  if (stories.length < 24) errors.push('24 stories required');
  if (new Set(stories.map(s => s.id)).size !== stories.length) errors.push('Duplicate story ids');
  for (const s of stories) {
    const fail = message => errors.push(`${s.id} ${message}`);
    if (s.puzzles.length !== 5 || s.rooms.length !== 3 || s.clues.length !== 10) fail('Expected 5 puzzles, 3 rooms, 10 clues');
    if (new Set(s.puzzles.map(p => p.type)).size < 4) fail('Need 4 puzzle types');
    for (const field of ['title', 'intro', 'mission', 'twist', 'ending', 'epilogue']) if (typeof s[field] !== 'string' || !s[field].trim()) fail(`Missing ${field}`);
    for (const collection of ['puzzles','clues','rooms']) if (new Set(s[collection].map(p => p.id)).size !== s[collection].length) fail(`Duplicate ${collection} ids`);
    const progress = freshProgress();
    for (const puzzle of s.puzzles) {
      const room = s.rooms.find(r => r.id === puzzle.room);
      if (!room || !unlocked(room.requires, progress)) fail(`${puzzle.id} unreachable room`);
      if (puzzle.hints?.length !== 3 || !puzzle.explanation || !puzzle.reveal) fail(`${puzzle.id} missing explanation or hints`);
      for (const id of puzzle.clueIds) {
        const clue = s.clues.find(c => c.id === id);
        if (!clue || clue.room !== puzzle.room || !unlocked(clue.requires, progress)) fail(`${puzzle.id} unreachable clue ${id}`);
        if (!progress.found.includes(id)) progress.found.push(id);
      }
      let answer;
      if (['code','choice'].includes(puzzle.type)) answer = puzzle.answer?.[0];
      else if (puzzle.type === 'pairs') answer = Object.fromEntries(puzzle.pairs.map(p => [p.left, p.right]));
      else answer = puzzle.solution;
      if (!attempt(puzzle, answer, progress).ok) fail(`${puzzle.id} answer or dependencies invalid`);
      if (puzzle.options && new Set(puzzle.options.map(o => o.id)).size !== puzzle.options.length) fail(`${puzzle.id} duplicate options`);
      if (puzzle.type === 'choice' && !puzzle.options.some(o => o.id === answer)) fail(`${puzzle.id} unknown choice`);
      if (['sequence','switches'].includes(puzzle.type) && puzzle.solution.some(id => !puzzle.options.some(o => o.id === id))) fail(`${puzzle.id} unknown option`);
      if (puzzle.type === 'dials' && (puzzle.labels.length !== answer.length || answer.some(n => !Number.isInteger(n) || n < 0 || n > (puzzle.max ?? 9)))) fail(`${puzzle.id} invalid dials`);
      if (puzzle.type === 'pairs' && (new Set(puzzle.pairs.map(p => p.left)).size !== puzzle.pairs.length || new Set(puzzle.pairs.map(p => p.right)).size !== puzzle.pairs.length)) fail(`${puzzle.id} duplicate pairs`);
    }
  }
  return errors;
}
