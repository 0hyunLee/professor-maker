/**
 * SFX 합성기 — Web Audio API 자체 합성 (회의 #013 박리듬 8개 가족톤)
 *
 * 박리듬의 원래 안: 만년필 폴리 녹음 → Cubase EQ 가족 묶음
 * W2.5 패치: 폴리 녹음 대신 Web Audio 합성으로 동일한 가족톤 구성
 *
 * 8종 SFX 모두 같은 AudioContext + 같은 base 톤(짧은 sine + soft filter)에서 파생
 * → 같은 "가족"이라는 일관성 자동 확보.
 *
 * 모티프 시그니처: kakao_prof는 도(C4)-솔(G4) 두 음 (회의 #013)
 */

let _ctx: AudioContext | null = null;
let _master: GainNode | null = null;

function getCtx(): { ctx: AudioContext; master: GainNode } {
  if (!_ctx) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
    _ctx = new Ctx();
    _master = _ctx.createGain();
    _master.gain.value = 0.18; // 마스터 볼륨 (작게)
    _master.connect(_ctx.destination);
  }
  return { ctx: _ctx, master: _master! };
}

interface ToneOpts {
  freq: number;
  duration: number;
  type?: OscillatorType;
  attack?: number;
  release?: number;
  volume?: number;
  delay?: number;
  filterFreq?: number;
}

function tone(opts: ToneOpts): void {
  const { ctx, master } = getCtx();
  const t0 = ctx.currentTime + (opts.delay ?? 0);
  const dur = opts.duration;
  const vol = opts.volume ?? 1;
  const attack = opts.attack ?? 0.005;
  const release = opts.release ?? 0.05;

  const osc = ctx.createOscillator();
  osc.type = opts.type ?? 'sine';
  osc.frequency.value = opts.freq;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(vol, t0 + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + release);

  // 부드러운 만년필 톤을 위한 lowpass
  if (opts.filterFreq) {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = opts.filterFreq;
    osc.connect(filter);
    filter.connect(gain);
  } else {
    osc.connect(gain);
  }
  gain.connect(master);

  osc.start(t0);
  osc.stop(t0 + dur + release + 0.05);
}

/** 짧은 노이즈 버스트 (잉크 튀김, 종이 쓸기) */
function noise(opts: { duration: number; volume?: number; filterFreq?: number; delay?: number }): void {
  const { ctx, master } = getCtx();
  const t0 = ctx.currentTime + (opts.delay ?? 0);
  const dur = opts.duration;

  const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize); // decay
  }

  const src = ctx.createBufferSource();
  src.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = opts.filterFreq ?? 3000;

  const gain = ctx.createGain();
  gain.gain.value = opts.volume ?? 0.4;

  src.connect(filter);
  filter.connect(gain);
  gain.connect(master);

  src.start(t0);
  src.stop(t0 + dur + 0.05);
}

// ─────────────────────────────────────────────────────────────
// SFX 8종 가족 (회의 #013 박리듬 사양)
// 모두 만년필 + 종이 메타포로 합성
// ─────────────────────────────────────────────────────────────

/** 점 찍기 — 짧은 톡 */
export function sfxClick(): void {
  tone({ freq: 880, duration: 0.04, type: 'triangle', volume: 0.6, filterFreq: 4000 });
}

/** 종이 쓸기 — 짧은 노이즈 */
export function sfxHover(): void {
  noise({ duration: 0.06, volume: 0.15, filterFreq: 2500 });
}

/** 역획 — 낮은 톤 */
export function sfxBack(): void {
  tone({ freq: 440, duration: 0.08, type: 'sine', volume: 0.5, filterFreq: 2000 });
}

/** 체크 — 두 음 상승 */
export function sfxConfirm(): void {
  tone({ freq: 660, duration: 0.06, type: 'sine', volume: 0.6, filterFreq: 3500 });
  tone({ freq: 990, duration: 0.08, type: 'sine', volume: 0.55, filterFreq: 3500, delay: 0.05 });
}

/** 잉크 튀김 — 짧은 노이즈 + 톤 */
export function sfxCancel(): void {
  noise({ duration: 0.08, volume: 0.3, filterFreq: 1500 });
  tone({ freq: 220, duration: 0.05, type: 'sawtooth', volume: 0.3, filterFreq: 1500, delay: 0.02 });
}

/** 페이지 넘김 — 노이즈 */
export function sfxTab(): void {
  noise({ duration: 0.12, volume: 0.2, filterFreq: 4000 });
}

/** 책 펼침 — 두 노이즈 */
export function sfxModalOpen(): void {
  noise({ duration: 0.1, volume: 0.25, filterFreq: 3000 });
  tone({ freq: 330, duration: 0.1, type: 'sine', volume: 0.4, filterFreq: 2000, delay: 0.05 });
}

/** 책 덮음 */
export function sfxModalClose(): void {
  tone({ freq: 220, duration: 0.12, type: 'sine', volume: 0.5, filterFreq: 1500 });
  noise({ duration: 0.08, volume: 0.2, filterFreq: 1800, delay: 0.03 });
}

// ─────────────────────────────────────────────────────────────
// 시그니처 — kakao_prof (회의 #013 박리듬: 도-솔 두 음)
// ─────────────────────────────────────────────────────────────
const C4 = 261.63;
const G4 = 392.0;

export function sfxKakaoProf(): void {
  // 0.15초 무음 후 마림바 도-솔 (회의 #013 2안)
  tone({ freq: C4, duration: 0.12, type: 'triangle', volume: 0.7, filterFreq: 3500, delay: 0.15 });
  tone({ freq: G4, duration: 0.16, type: 'triangle', volume: 0.65, filterFreq: 3500, delay: 0.27 });
}

// ─────────────────────────────────────────────────────────────
// 게임 이벤트 SFX
// ─────────────────────────────────────────────────────────────

/** 스탯 증가 — 짧은 상승 */
export function sfxStatUp(): void {
  tone({ freq: 523, duration: 0.06, type: 'sine', volume: 0.4, filterFreq: 4000 });
  tone({ freq: 784, duration: 0.06, type: 'sine', volume: 0.35, filterFreq: 4000, delay: 0.04 });
}

/** 스탯 감소 — 짧은 하강 */
export function sfxStatDown(): void {
  tone({ freq: 392, duration: 0.06, type: 'sine', volume: 0.4, filterFreq: 2500 });
  tone({ freq: 261, duration: 0.08, type: 'sine', volume: 0.35, filterFreq: 2500, delay: 0.04 });
}
