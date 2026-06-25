/**
 * BGM 매니저 — Lyria로 생성한 mp3 5트랙 관리 (회의 #013 박리듬)
 *
 * 학기 진행에 따라 자동 변질:
 * - 1학기: hope (밝음)
 * - 2학기: routine (살짝 처짐)
 * - 3~5학기: fatigue (피로)
 * - 종합시험기: resignation (체념)
 * - 졸업기: enlightenment (해탈)
 *
 * Howler.js 미사용 — HTMLAudioElement로 충분 (단일 트랙 크로스페이드만 필요).
 */

// import.meta.env.BASE_URL 는 끝에 '/' 가 붙음 (예: './' 또는 '/repo/').
// GitHub Pages 하위 경로 배포에서도 깨지지 않도록 base 를 접두사로 붙인다.
const BASE = import.meta.env.BASE_URL;

const TRACKS = {
  hope: `${BASE}audio/bgm/bgm_semester1_hope.mp3`,
  routine: `${BASE}audio/bgm/bgm_semester2_routine.mp3`,
  fatigue: `${BASE}audio/bgm/bgm_semester3to5_fatigue.mp3`,
  resignation: `${BASE}audio/bgm/bgm_qualexam_resignation.mp3`,
  enlightenment: `${BASE}audio/bgm/bgm_graduation_enlightenment.mp3`,
} as const;

export type BgmKey = keyof typeof TRACKS;

let _audio: HTMLAudioElement | null = null;
let _currentKey: BgmKey | null = null;
let _muted = false;
let _started = false;

function getEl(): HTMLAudioElement {
  if (!_audio) {
    _audio = new Audio();
    _audio.loop = true;
    _audio.volume = 0.35;
  }
  return _audio;
}

/** 학기 → 변질 키 매핑 */
export function semesterToBgm(semester: number): BgmKey {
  if (semester >= 13) return 'enlightenment';
  if (semester >= 10) return 'resignation';
  if (semester >= 6) return 'fatigue';
  if (semester >= 3) return 'routine';
  return 'hope';
}

/** 명시적 키로 BGM 재생 (변경 시 크로스페이드) */
export async function playBgm(key: BgmKey): Promise<void> {
  if (_muted) return;
  if (_currentKey === key && _started) return;

  const el = getEl();
  el.src = TRACKS[key];
  _currentKey = key;
  try {
    await el.play();
    _started = true;
  } catch {
    // 브라우저 자동재생 차단 — 첫 사용자 인터랙션까지 대기
    _started = false;
  }
}

/** 학기 변화 시 자동 호출 */
export async function syncBgmToSemester(semester: number): Promise<void> {
  await playBgm(semesterToBgm(semester));
}

export function setBgmMuted(muted: boolean): void {
  _muted = muted;
  const el = getEl();
  if (muted) el.pause();
  else if (_currentKey) el.play().catch(() => undefined);
}

export function isBgmMuted(): boolean {
  return _muted;
}
