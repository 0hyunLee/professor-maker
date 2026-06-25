/**
 * 이벤트 디스패처 — 트리거 조건을 만족하는 이벤트 중 하나를 확률적으로 선택.
 */
import { EVENTS } from '../data';
import type { EventDef, StatId } from '../schema';
import type { Stats } from './stats';

export interface EventContext {
  semester: number;
  stats: Stats;
  triggeredIds: Set<string>;
  flags: Set<string>;
}

/**
 * 학기말 강제 이벤트 (W4 구현, CEO 피드백 "1학기가 너무 빨리 지나감")
 * 15주차에 도달하면 EV_SEMESTER_EVAL이 강제 발동.
 * 12학기 이상이면 EV_GRADUATION_DEFENSE도 후보.
 */
function pickSemesterEndEvent(
  ctx: EventContext & { week: number },
  _rng: () => number
): EventDef | null {
  if (ctx.week !== 15) return null;

  // 졸업 디펜스 (12학기 이상, 연구 60+)
  if (ctx.semester >= 12 && ctx.stats.research >= 60) {
    const defense = EVENTS.find((e) => e.id === 'EV_GRADUATION_DEFENSE');
    if (defense && !ctx.triggeredIds.has(defense.id)) return defense;
  }

  // 학기말 평가 (매 학기 강제)
  const eval_ = EVENTS.find((e) => e.id === 'EV_SEMESTER_EVAL');
  if (eval_) return eval_; // 중복 허용 — 매 학기 평가는 반복 가능

  return null;
}

export function pickEvent(
  ctx: EventContext & { week?: number },
  rng: () => number = Math.random
): EventDef | null {
  // 학기말 강제 이벤트 우선
  if (ctx.week != null) {
    const semEnd = pickSemesterEndEvent(
      { ...ctx, week: ctx.week } as EventContext & { week: number },
      rng
    );
    if (semEnd) return semEnd;
  }

  const eligible = EVENTS.filter((ev) => {
    if (ctx.triggeredIds.has(ev.id)) return false;
    const t = ev.trigger;
    if (t.semester_min != null && ctx.semester < t.semester_min) return false;
    if (t.stat) {
      for (const [k, threshold] of Object.entries(t.stat)) {
        if (ctx.stats[k as StatId] < (threshold as number)) return false;
      }
    }
    return rng() < t.prob;
  });

  if (eligible.length === 0) return null;
  return eligible[Math.floor(rng() * eligible.length)];
}
