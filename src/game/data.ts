/**
 * 데이터 로더 — JSON 파일을 Zod로 검증해 타입 안전하게 노출.
 * 정호준 결정사항(회의록 #004): 빌드 시점에 검증, 런타임 undefined 방지.
 */
import statsJson from '../data/stats.json';
import actionsJson from '../data/actions.json';
import eventsJson from '../data/events.json';
import endingsJson from '../data/endings.json';

import {
  StatsFile,
  ActionsFile,
  EventsFile,
  EndingsFile,
  type StatDef,
  type ActionDef,
  type EventDef,
  type EndingDef,
} from './schema';

export const STATS: StatDef[] = StatsFile.parse(statsJson).stats;
export const ACTIONS: ActionDef[] = ActionsFile.parse(actionsJson).actions;
export const EVENTS: EventDef[] = EventsFile.parse(eventsJson).events;
export const ENDINGS: EndingDef[] = EndingsFile.parse(endingsJson).endings;

export const STAT_BY_ID = Object.fromEntries(STATS.map((s) => [s.id, s])) as Record<
  StatDef['id'],
  StatDef
>;
