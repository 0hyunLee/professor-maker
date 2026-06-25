/**
 * nextWeekSync — 순수 함수 형태의 주차 진행 (회의록 #011)
 *
 * UI store는 이 함수를 호출하고 setTimeout 250ms 연출을 감싼다.
 * 봇 시뮬레이터는 이 함수를 직접 호출해 헤드리스로 1만 회 돌린다.
 *
 * mutate 금지. 새 객체 반환.
 */
import type { EventDef } from '../schema';
import { applyEffect, type Stats } from './stats';
import { pickEvent } from './events';
import { checkInstantEnding, determineEnding } from './endings';

const MAX_SEMESTERS = 14;
const SLOTS_PER_TURN = 3;

export interface GameState {
  semester: number;
  week: number;
  slotsLeft: number;
  stats: Stats;
  flags: ReadonlySet<string>;
  triggeredEvents: ReadonlySet<string>;
  currentEvent: EventDef | null;
  ending: string | null;
  mentalBreaks: number; // 누적 멍때림 강탈 횟수
}

export interface WeekLogEntry {
  kind: 'mental_break_override' | 'event_trigger' | 'semester_change' | 'graduation';
  text: string;
  meta?: Record<string, unknown>;
}

export interface NextWeekResult {
  next: GameState;
  log: WeekLogEntry[];
  firedEvent: EventDef | null;
}

/**
 * 멘탈 브레이크 적용 — 멘탈 < 15이면 슬롯 1개를 zone_out으로 강탈.
 * 회의록 #011 박노잼 디렉터의 시너지/페널티 룰.
 */
export function applyMentalBreak(
  stats: Stats,
  _rng: () => number
): { applied: boolean; effect: Partial<Stats> } {
  if (stats.mental >= 15) {
    return { applied: false, effect: {} };
  }
  // 강탈된 슬롯은 멍때림 — 멘탈 +5, 다른 변화 0
  return {
    applied: true,
    effect: { mental: 5 },
  };
}

/**
 * 한 주차를 진행한다.
 * - 멘탈 브레이크 체크 (<15면 자동 회복 효과)
 * - 주말 회복 (체력+5, 멘탈+3)
 * - 학기 진행
 * - 졸업/엔딩 판정
 * - 다음 주 이벤트 발화 체크
 */
export function nextWeekSync(
  state: GameState,
  rng: () => number = Math.random
): NextWeekResult {
  if (state.ending) {
    return { next: state, log: [], firedEvent: null };
  }

  const log: WeekLogEntry[] = [];
  let stats = state.stats;
  let mentalBreaks = state.mentalBreaks;

  // 1. 멘탈 브레이크
  const mentalBreak = applyMentalBreak(stats, rng);
  if (mentalBreak.applied) {
    stats = applyEffect(stats, mentalBreak.effect);
    mentalBreaks += 1;
    log.push({
      kind: 'mental_break_override',
      text: '🧠 멘탈 붕괴: 정신을 차리고 보니 한 주가 지나 있었다.',
    });
  }

  // 2. 주말 회복
  stats = applyEffect(stats, { stamina: 5, mental: 3 });

  // 3. 학기 진행
  let nextSemester = state.semester;
  let nextWeek = state.week + 1;
  if (nextWeek > 15) {
    nextWeek = 1;
    nextSemester += 1;
    log.push({
      kind: 'semester_change',
      text: `📅 ${nextSemester}학기 시작.`,
    });
  }

  // 4. 졸업/엔딩 판정
  if (nextSemester > MAX_SEMESTERS) {
    const ending = determineEnding(stats);
    log.push({ kind: 'graduation', text: '🎓 졸업 시즌이 도래했다…' });
    return {
      next: {
        ...state,
        semester: nextSemester,
        week: nextWeek,
        stats,
        ending: ending.id,
        mentalBreaks,
      },
      log,
      firedEvent: null,
    };
  }

  // 5. 즉시 종료 (멘탈 0 등)
  const instant = checkInstantEnding(stats);
  if (instant) {
    return {
      next: { ...state, stats, ending: instant.id, mentalBreaks },
      log,
      firedEvent: null,
    };
  }

  // 6. 이벤트 발화 (학기말 체인 포함 — week 전달)
  const event = pickEvent(
    {
      semester: nextSemester,
      week: nextWeek,
      stats,
      triggeredIds: state.triggeredEvents as Set<string>,
      flags: state.flags as Set<string>,
    },
    rng
  );

  if (event) {
    log.push({ kind: 'event_trigger', text: `📌 ${event.title}`, meta: { id: event.id } });
  }

  return {
    next: {
      ...state,
      semester: nextSemester,
      week: nextWeek,
      slotsLeft: SLOTS_PER_TURN,
      stats,
      currentEvent: event,
      mentalBreaks,
    },
    log,
    firedEvent: event,
  };
}
