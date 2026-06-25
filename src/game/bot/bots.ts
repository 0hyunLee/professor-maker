/**
 * Greedy 봇 7종 — 엔딩별 1봇 (회의록 #014, 오탐지 QA)
 *
 * 단순 가중치 기반 행동 선택.
 * "이 엔딩이 이론상 도달 가능한가" 검증이 목적.
 */
import { ACTIONS } from '../data';
import type { ActionDef, StatId } from '../schema';
import type { Bot, BotContext } from './types';

type Weights = Partial<Record<StatId, number>>;

/** 가중치에 따라 가장 좋은 행동을 고름. 체력/멘탈 위급 시 휴식 강제. */
function pickByWeights(
  ctx: BotContext,
  weights: Weights,
  options: { canRest: boolean } = { canRest: true }
): string {
  const stats = ctx.state.stats;

  // 위급 상황 — 운동으로 회복 (단 canRest=false 봇 제외)
  if (options.canRest && (stats.stamina < 20 || stats.mental < 20)) {
    return 'exercise';
  }

  // 가중치 점수 — saturation 인식 (#023 오탐지 발견)
  // raw delta 대신 "clamping 후 실제 변화량"으로 계산
  // 스탯 100 도달 후 같은 행동 무한반복 방지
  let bestId = ctx.availableActions[0].id;
  let bestScore = -Infinity;
  for (const action of ctx.availableActions) {
    let score = 0;
    for (const [statId, weight] of Object.entries(weights)) {
      const id = statId as StatId;
      const raw = action.effects[id] ?? 0;
      const current = stats[id] ?? 0;
      // 돈은 max가 매우 높으므로 스케일 보정
      const max = id === 'money' ? 5_000_000 : 100;
      const projected = Math.max(0, Math.min(current + raw, max)) - current;
      score += projected * (weight as number);
    }
    if (score > bestScore) {
      bestScore = score;
      bestId = action.id;
    }
  }
  return bestId;
}

export const tenureBot: Bot = {
  id: 'greedy_tenure',
  targetEnding: 'tenure',
  decide: (ctx) =>
    pickByWeights(ctx, { research: 0.4, english: 0.3, network: 0.3 }),
};

export const postdocBot: Bot = {
  id: 'greedy_postdoc',
  targetEnding: 'postdoc',
  decide: (ctx) => pickByWeights(ctx, { research: 0.6, english: 0.4 }),
};

export const industryBot: Bot = {
  id: 'greedy_industry',
  targetEnding: 'industry',
  decide: (ctx) =>
    pickByWeights(ctx, { english: 0.3, chores: 0.5, research: 0.1, money: 0.00003 }),
};

export const lecturerBot: Bot = {
  id: 'greedy_lecturer',
  targetEnding: 'lecturer',
  decide: (ctx) =>
    pickByWeights(ctx, { research: 0.6, network: 0.3, mental: 0.1 }),
};

export const dropoutBot: Bot = {
  id: 'greedy_dropout',
  targetEnding: 'convenience_store',
  decide: (ctx) =>
    pickByWeights(ctx, { mental: -1.0 }, { canRest: false }),
};

export const hiatusBot: Bot = {
  id: 'greedy_hiatus',
  targetEnding: 'infinite_hiatus',
  decide: (ctx) =>
    pickByWeights(ctx, { stamina: -1.0, mental: -0.8 }, { canRest: false }),
};

export const emigrationBot: Bot = {
  id: 'greedy_emigration',
  targetEnding: 'emigration',
  decide: (ctx) =>
    pickByWeights(ctx, { english: 0.6, money: 0.0001 }),
};

export const ALL_BOTS: ReadonlyArray<Bot> = [
  tenureBot,
  postdocBot,
  industryBot,
  lecturerBot,
  dropoutBot,
  hiatusBot,
  emigrationBot,
];

/** 봇 컨텍스트 빌더 */
export function makeContext(
  state: BotContext['state'],
  rng: () => number
): BotContext {
  return {
    state,
    semester: state.semester,
    week: state.week,
    availableActions: ACTIONS as ReadonlyArray<ActionDef>,
    rng,
  };
}
