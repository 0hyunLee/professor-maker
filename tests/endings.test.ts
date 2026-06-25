import { describe, it, expect } from 'vitest';
import { determineEnding, checkInstantEnding } from '../src/game/systems/endings';
import { initialStats, type Stats } from '../src/game/systems/stats';
import { ENDINGS } from '../src/game/data';

describe('endings', () => {
  it('70개 엔딩이 로드된다', () => {
    expect(ENDINGS.length).toBe(70);
  });

  it('mental <= 5 → 번아웃 응급실 (즉시종료, 최우선)', () => {
    const s: Stats = { ...initialStats(), mental: 5 };
    const e = checkInstantEnding(s);
    expect(e).not.toBeNull();
    expect(e!.id).toBe('burnout_er');
  });

  it('mental 8 (6~8) → 편의점 알바 (즉시종료)', () => {
    const s: Stats = { ...initialStats(), mental: 8 };
    const e = checkInstantEnding(s);
    expect(e!.id).toBe('convenience_store');
  });

  it('stamina <= 3 → 과로 입원 (즉시종료)', () => {
    const s: Stats = { ...initialStats(), mental: 12, stamina: 3 };
    const e = checkInstantEnding(s);
    expect(e!.id).toBe('collapse_hospital');
  });

  it('mental 12 + stamina 5 → 무한 휴학 (즉시종료)', () => {
    const s: Stats = { ...initialStats(), mental: 12, stamina: 5 };
    const e = checkInstantEnding(s);
    expect(e!.id).toBe('infinite_hiatus');
  });

  it('healthy stats → no instant ending', () => {
    const s = initialStats();
    expect(checkInstantEnding(s)).toBeNull();
  });

  it('fallback to lecturer when no ending matches', () => {
    const s: Stats = { ...initialStats(), research: 10, english: 10, network: 5 };
    const e = determineEnding(s);
    expect(e.id).toBe('lecturer');
  });

  it('high stats → tenure', () => {
    const s: Stats = {
      ...initialStats(),
      research: 90, english: 60, network: 50, mental: 40,
    };
    const e = determineEnding(s);
    expect(e.id).toBe('tenure');
  });

  it('연구력 낮고 멘탈·체력 높으면 → 롯데월드 취업', () => {
    const s: Stats = {
      ...initialStats(),
      research: 20, mental: 70, stamina: 70,
    };
    const e = determineEnding(s);
    expect(e.id).toBe('lotte_world');
  });
});
