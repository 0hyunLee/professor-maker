/**
 * 스탯 계산 시스템 — 순수 함수. DOM 의존 없음.
 * 박노잼 디렉터의 시너지/페널티 룰 (회의록 #003) 구현.
 */
import { STAT_BY_ID } from '../data';
import type { StatEffect, StatId } from '../schema';

export type Stats = Record<StatId, number>;

/** 시작값으로 초기화 */
export function initialStats(): Stats {
  const out = {} as Stats;
  for (const stat of Object.values(STAT_BY_ID)) {
    out[stat.id] = stat.start;
  }
  return out;
}

/** 스탯 변화량을 적용하되, min/max 클램프 */
export function applyEffect(stats: Stats, effect: StatEffect): Stats {
  const next = { ...stats };
  for (const [key, delta] of Object.entries(effect)) {
    const id = key as StatId;
    const def = STAT_BY_ID[id];
    if (!def || delta == null) continue;
    next[id] = Math.max(def.min, Math.min(def.max, next[id] + delta));
  }
  return next;
}

/** 박노잼의 시너지/페널티 룰 — 행동 효과에 곱해진 후의 보정 */
export function applyModifiers(stats: Stats, baseEffect: StatEffect): StatEffect {
  const result: StatEffect = { ...baseEffect };

  // 체력 < 20 → 모든 효과 ×0.7 (번아웃)
  if (stats.stamina < 20) {
    for (const k of Object.keys(result) as StatId[]) {
      const v = result[k];
      if (v != null && v > 0) result[k] = Math.floor(v * 0.7);
    }
  }

  // 잡일숙련도 ≥ 70 → 연구력 획득 ×0.8 (조교화 함정)
  if (stats.chores >= 70 && result.research && result.research > 0) {
    result.research = Math.floor(result.research * 0.8);
  }

  // 연구력 × 영어 ≥ 6000 → 연구력 증가량 +50% (논문 작성 효율)
  if (
    stats.research * stats.english >= 6000 &&
    result.research &&
    result.research > 0
  ) {
    result.research = Math.floor(result.research * 1.5);
  }

  return result;
}

/** 멘탈 < 15 — 슬롯이 강제 멍때림으로 치환되는지 체크 */
export function isMentalBreak(stats: Stats): boolean {
  return stats.mental < 15;
}
