/**
 * 엔딩 판정 — 스탯에 따라 어떤 엔딩으로 귀결되는지 결정.
 *
 * 회의록 #021 (개발부 미니 미팅, 정호준+Claude 페어):
 * - `terminalPriority` 필드 도입. 0 = 졸업 시점만 평가, 1+ = 매 주차 즉시종료 후보.
 * - 기존 하드코딩 (`mental <= 0`) 제거. 데이터 주도.
 * - week.ts 호출부 변경 0줄 — endings.ts 안에 캡슐화.
 *
 * 졸업 시점 우선순위: bad/hidden(즉시 종료 후보지만 졸업 평가 시엔 동급) > true > secret > good > normal > bittersweet
 */
import { ENDINGS } from '../data';
import type { EndingDef, StatId } from '../schema';
import type { Stats } from './stats';

/**
 * 졸업 시점 엔딩 평가 우선순위 (#QA-018-01 수정).
 * 숫자가 작을수록 우선. true(정교수) > secret(이민) > good(포닥) > normal(산업체) > bittersweet(시간강사) > bad > hidden
 * 핵심: industry(normal=3)가 lecturer(bittersweet=4)보다 우선 평가되어야 함.
 */
const TIER_PRIORITY: Record<string, number> = {
  true: 0,         // 학계 정점 (정교수·석학)
  secret: 1,       // 특이/탈출 성공 (이민·롯데월드·코인부자)
  good: 2,         // 좋은 학계·전문직 (포닥·대기업연구소)
  bittersweet: 3,  // 학계 림보 — 남았지만 애매 (시간강사·만년조교)
  normal: 4,       // 학계 떠난 평범한 직업 (산업체·공무원)
  bad: 5,          // 붕괴 (자퇴·번아웃)
  hidden: 6,       // 즉시 붕괴 (무한휴학·잠적)
};
// 70개 엔딩 확장(회의록 #022): bittersweet > normal 로 조정.
// 이유: '학계에 남은 애매한 결말'은 '학계를 떠난 평범한 직업'보다, 본인이 학계
// 조건(높은 연구력 등)을 충족했을 때 우선해야 자연스럽다. 이렇게 해야 광범위한
// normal catch-all 엔딩이 림보 엔딩들을 통째로 가리지 않는다.

function meets(stats: Stats, conditions: Record<string, number>): boolean {
  for (const [key, value] of Object.entries(conditions)) {
    if (key.endsWith('_max')) {
      const id = key.slice(0, -4) as StatId;
      if (stats[id] > value) return false;
    } else {
      const id = key as StatId;
      if (stats[id] < value) return false;
    }
  }
  return true;
}

/** 졸업 시점에 호출. 만족하는 엔딩 중 우선순위가 가장 높은 것 반환. */
export function determineEnding(stats: Stats): EndingDef {
  const matched = ENDINGS.filter((e) => meets(stats, e.conditions));
  if (matched.length === 0) {
    // fallback — 시간강사
    return ENDINGS.find((e) => e.id === 'lecturer') ?? ENDINGS[0];
  }
  matched.sort((a, b) => {
    const tierDiff =
      (TIER_PRIORITY[a.tier] ?? 99) - (TIER_PRIORITY[b.tier] ?? 99);
    if (tierDiff !== 0) return tierDiff;
    // 같은 tier 내에서는 조건이 더 구체적인(조건 수 많은) 엔딩 우선.
    // 70개 엔딩 확장 대응: 특화 엔딩이 일반 catch-all 엔딩을 이기도록.
    return (
      Object.keys(b.conditions).length - Object.keys(a.conditions).length
    );
  });
  return matched[0];
}

/**
 * 게임 도중 즉시 종료 트리거 (회의록 #021).
 *
 * `terminalPriority > 0` 인 엔딩 중 조건 만족하는 후보를 모은 뒤,
 * `terminalPriority` 값이 큰 쪽이 우선. 같으면 tier 우선.
 *
 * 기존: `mental <= 0` 하드코딩으로 항상 convenience_store만 선택됨.
 * 변경: convenience_store(prio 2) vs infinite_hiatus(prio 1) 등 데이터로 결정.
 */
export function checkInstantEnding(stats: Stats): EndingDef | null {
  const candidates = ENDINGS
    .filter((e) => (e.terminalPriority ?? 0) > 0)
    .filter((e) => meets(stats, e.conditions));
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => {
    const pd = (b.terminalPriority ?? 0) - (a.terminalPriority ?? 0);
    if (pd !== 0) return pd;
    return (TIER_PRIORITY[a.tier] ?? 99) - (TIER_PRIORITY[b.tier] ?? 99);
  });
  return candidates[0];
}
