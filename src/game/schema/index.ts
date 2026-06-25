import { z } from 'zod';

/**
 * 스탯 ID — 7개 핵심 스탯
 * (회의록 #003 기획부 결정사항)
 */
export const StatId = z.enum([
  'research',
  'stamina',
  'mental',
  'network',
  'chores',
  'english',
  'money',
]);
export type StatId = z.infer<typeof StatId>;

export const StatDef = z.object({
  id: StatId,
  label: z.string(),
  icon: z.string(),
  min: z.number(),
  max: z.number(),
  start: z.number(),
  unit: z.string().optional(),
  description: z.string(),
});
export type StatDef = z.infer<typeof StatDef>;

export const StatsFile = z.object({ stats: z.array(StatDef) });

/** 스탯 효과 — 부분적으로 적용 가능 */
export const StatEffect = z.record(StatId, z.number());
export type StatEffect = z.infer<typeof StatEffect>;

/** 행동 정의 */
export const ActionDef = z.object({
  id: z.string(),
  label: z.string(),
  icon: z.string(),
  category: z.enum(['research', 'self', 'social', 'money']),
  effects: StatEffect,
  note: z.string().optional(),
});
export type ActionDef = z.infer<typeof ActionDef>;

export const ActionsFile = z.object({ actions: z.array(ActionDef) });

/** 이벤트 */
export const EventChoice = z.object({
  label: z.string(),
  effect: StatEffect,
  flag: z.string().optional(),
});
export type EventChoice = z.infer<typeof EventChoice>;

export const EventTrigger = z.object({
  semester_min: z.number().optional(),
  stat: z.record(StatId, z.number()).optional(),
  prob: z.number().min(0).max(1),
});

export const EventDef = z.object({
  id: z.string(),
  title: z.string(),
  trigger: EventTrigger,
  text: z.string(),
  choices: z.array(EventChoice).min(1),
  followup: z.string().optional(),
});
export type EventDef = z.infer<typeof EventDef>;

export const EventsFile = z.object({ events: z.array(EventDef) });

/** 엔딩 */
export const EndingTier = z.enum(['true', 'good', 'normal', 'bittersweet', 'bad', 'hidden', 'secret']);
export type EndingTier = z.infer<typeof EndingTier>;

export const EndingDef = z.object({
  id: z.string(),
  label: z.string(),
  icon: z.string(),
  tier: EndingTier,
  /** 키가 stat이면 "최소값", 키가 `${stat}_max`이면 "최대값(이하 진입)" */
  conditions: z.record(z.string(), z.number()),
  /**
   * 즉시 종료 우선순위 (회의록 #021).
   * 0 = 졸업 시점에만 평가 (기본).
   * 1+ = 매 주차 끝에 즉시 종료 후보, 숫자가 큰 게 우선.
   */
  terminalPriority: z.number().int().min(0).default(0),
  description: z.string(),
});
export type EndingDef = z.infer<typeof EndingDef>;

export const EndingsFile = z.object({ endings: z.array(EndingDef) });
