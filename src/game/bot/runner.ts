/**
 * 봇 시뮬레이터 러너 — game/ 모듈만 사용. DOM 의존 0.
 * 회의록 #014 오탐지 QA 리드.
 */
import { applyEffect, applyModifiers, initialStats } from '../systems/stats';
import { nextWeekSync, type GameState } from '../systems/week';
import { ACTIONS } from '../data';
import type { Bot, SimResult } from './types';
import { makeContext } from './bots';

const MAX_SEMESTERS = 14;
const SLOTS_PER_TURN = 3;

/** 시드 기반 결정론적 RNG (mulberry32) */
export function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function emptyState(): GameState {
  return {
    semester: 1,
    week: 1,
    slotsLeft: SLOTS_PER_TURN,
    stats: initialStats(),
    flags: new Set<string>(),
    triggeredEvents: new Set<string>(),
    currentEvent: null,
    ending: null,
    mentalBreaks: 0,
  };
}

/**
 * 한 봇이 한 게임을 끝까지 플레이.
 */
export function runBot(bot: Bot, runId: number, seed: number): SimResult {
  const rng = makeRng(seed);
  let state = emptyState();
  let eventsTriggered = 0;

  // 안전장치: 무한루프 방지
  // 한 주차 = 3 행동 + 1 nextWeek + 평균 1 이벤트응답 = 5 turn
  // 14학기 × 15주 × 5 turn ≈ 1050. 여유 두고 2500.
  const MAX_TURNS = 2500;
  let turns = 0;

  while (!state.ending && turns < MAX_TURNS) {
    turns += 1;

    // 1. 진행 중인 이벤트 자동 응답 (첫 선택지)
    if (state.currentEvent) {
      const choice = state.currentEvent.choices[0];
      const newStats = applyEffect(state.stats, choice.effect);
      const newTriggered = new Set(state.triggeredEvents);
      newTriggered.add(state.currentEvent.id);
      eventsTriggered += 1;
      state = {
        ...state,
        stats: newStats,
        currentEvent: null,
        triggeredEvents: newTriggered,
      };
      continue;
    }

    // 2. 슬롯 소진 — 다음 주
    if (state.slotsLeft <= 0) {
      const result = nextWeekSync(state, rng);
      state = result.next;
      if (result.firedEvent) eventsTriggered += 1;
      continue;
    }

    // 3. 봇이 행동 결정
    const ctx = makeContext(state, rng);
    const actionId = bot.decide(ctx);
    const action = ACTIONS.find((a) => a.id === actionId);
    if (!action) break;

    const effect = applyModifiers(state.stats, action.effects);
    state = {
      ...state,
      stats: applyEffect(state.stats, effect),
      slotsLeft: state.slotsLeft - 1,
    };
  }

  return {
    runId,
    botId: bot.id,
    seed,
    semestersPlayed: Math.min(state.semester, MAX_SEMESTERS),
    endingId: state.ending ?? 'TIMEOUT',
    finalStats: state.stats,
    mentalBreaks: state.mentalBreaks,
    eventsTriggered,
  };
}

/** 한 봇으로 N회 반복 시뮬레이션 */
export function runMany(bot: Bot, runs: number, baseSeed = 42): SimResult[] {
  const results: SimResult[] = [];
  for (let i = 0; i < runs; i += 1) {
    results.push(runBot(bot, i, baseSeed + i));
  }
  return results;
}

/** 결과 요약 (콘솔 출력용) */
export interface BotSummary {
  botId: string;
  runs: number;
  endingDistribution: Record<string, number>;
  avgSemesters: number;
  avgMentalBreaks: number;
  avgEventsTriggered: number;
}

export function summarize(results: SimResult[]): BotSummary {
  const dist: Record<string, number> = {};
  let totalSem = 0;
  let totalBreaks = 0;
  let totalEvents = 0;
  for (const r of results) {
    dist[r.endingId] = (dist[r.endingId] ?? 0) + 1;
    totalSem += r.semestersPlayed;
    totalBreaks += r.mentalBreaks;
    totalEvents += r.eventsTriggered;
  }
  const n = results.length || 1;
  return {
    botId: results[0]?.botId ?? '?',
    runs: results.length,
    endingDistribution: dist,
    avgSemesters: totalSem / n,
    avgMentalBreaks: totalBreaks / n,
    avgEventsTriggered: totalEvents / n,
  };
}
