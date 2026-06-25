/**
 * 봇 시뮬레이터 인터페이스 계약 (회의록 #011, #014)
 * QA의 오탐지가 game/ 모듈을 헤드리스로 import해 1만 회 시뮬레이션을 돌릴 때 사용.
 *
 * 원칙:
 * - 봇은 store/ 또는 ui/ 를 import하지 않는다 (ESLint로 강제 예정).
 * - 모든 무작위성은 주입된 rng를 통해서만.
 * - state는 Readonly. 봇이 mutate하면 즉시 버그.
 */
import type { ActionDef } from '../schema';
import type { GameState } from '../systems/week';
import type { Stats } from '../systems/stats';

export interface BotContext {
  state: Readonly<GameState>;
  semester: number;
  week: number;
  availableActions: ReadonlyArray<ActionDef>;
  rng: () => number;
}

export interface Bot {
  readonly id: string;
  readonly targetEnding: string;
  decide(ctx: BotContext): string; // ActionDef.id
}

export interface SimResult {
  runId: number;
  botId: string;
  seed: number;
  semestersPlayed: number;
  endingId: string | 'TIMEOUT';
  finalStats: Stats;
  mentalBreaks: number;
  eventsTriggered: number;
}
