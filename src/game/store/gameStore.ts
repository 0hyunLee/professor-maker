/**
 * Zustand 게임 스토어 — 정호준 (회의록 #004)
 * persist 미들웨어로 LocalStorage 자동 저장. 세이브 버전 마이그레이션 지원.
 */
import { create } from 'zustand';
import { persist, type PersistOptions } from 'zustand/middleware';

import { ACTIONS } from '../data';
import { applyEffect, applyModifiers, initialStats, type Stats } from '../systems/stats';
import { pickEvent } from '../systems/events';
import { checkInstantEnding, determineEnding } from '../systems/endings';
import type { EventDef, EndingDef } from '../schema';

const SAVE_VERSION = 1;
const MAX_SEMESTERS = 14;
const SLOTS_PER_TURN = 3;

interface GameState {
  // 게임 진행
  semester: number;
  week: number;
  slotsLeft: number;
  stats: Stats;
  flags: Set<string>;
  triggeredEvents: Set<string>;

  // 현재 상태
  currentEvent: EventDef | null;
  ending: EndingDef | null;
  log: string[];
  /** 캐릭터 무드 텍스트 — 매 행동/이벤트 선택마다 갱신 */
  mood: string;

  // 액션
  performAction: (actionId: string) => void;
  resolveEventChoice: (choiceIdx: number) => void;
  nextWeek: () => void;
  reset: () => void;
}

/** 행동 실행 후 무드 메시지 생성 — 행동 종류와 스탯 변화에 따라 반응 */
const ACTION_MOODS: Record<string, string[]> = {
  read_paper: ['… 논문 글자가 춤을 춘다.', '… 읽다 보니 잠이 온다.', '… 여전히 모르겠다.'],
  experiment: ['… 실험은 배신하지 않는다. 보통은.', '… 손이 기억하는 대로 움직인다.', '… 데이터가 예쁘게 나왔다.'],
  prof_meeting: ['… 교수님 표정을 읽으려 애쓴다.', '… 오늘은 혼나지 않았다.', '… 무사히 넘겼다.'],
  admin_chores: ['… 나는 연구자일까, 행정보조일까.', '… 엑셀 시트가 끝이 없다.', '… 잡일의 늪.'],
  exercise: ['… 이 30분이 하루를 버틸 힘을 준다.', '… 달리는 동안만큼은 아무 생각 없다.', '… 샤워하니 살 것 같다.'],
  tutoring: ['… 학생이 이해하면 나도 기분이 좋다.', '… 시급 환산하면 슬프다.', '… 통장에 숫자가 찍혔다.'],
  english_study: ['… 영어는 도망쳐도 따라온다.', '… 영작문, 아직도 어색하다.', '… 쉐도잉 50번째.'],
  drinking: ['… 소주 한 잔에 마음이 풀린다.', '… 동기들이 있어서 다행이다.', '… 내일 후회할 거 알면서.'],
};

const FALLBACK_MOODS = [
  '… 묵묵히 책상에 앉는다.',
  '… 오늘도 하루가 지나간다.',
  '… 연구실 형광등이 윙 거린다.',
];

function pickActionMood(actionId: string): string {
  const pool = ACTION_MOODS[actionId] ?? FALLBACK_MOODS;
  return pool[Math.floor(Math.random() * pool.length)];
}

function pickEventMood(choiceLabel: string): string {
  // 이벤트 선택지 텍스트를 활용해 무드 생성
  if (choiceLabel.includes('축하') || choiceLabel.includes('감사') || choiceLabel.includes('기분'))
    return '… 마음이 조금 따뜻해졌다.';
  if (choiceLabel.includes('울') || choiceLabel.includes('도망') || choiceLabel.includes('포기'))
    return '… 눈이 뜨겁다.';
  if (choiceLabel.includes('무시') || choiceLabel.includes('안 답') || choiceLabel.includes('지나'))
    return '… 아무렇지 않은 척했다.';
  if (choiceLabel.includes('병원') || choiceLabel.includes('약'))
    return '… 건강이 신경 쓰인다.';
  if (choiceLabel.includes('솔직') || choiceLabel.includes('이야기'))
    return '… 말하고 나니 좀 나아졌다.';
  return '… 선택의 무게가 어깨에 남는다.';
}

function createInitialState() {
  return {
    semester: 1,
    week: 1,
    slotsLeft: SLOTS_PER_TURN,
    stats: initialStats(),
    flags: new Set<string>(),
    triggeredEvents: new Set<string>(),
    currentEvent: null,
    ending: null,
    log: ['🎓 입학을 환영합니다. 당신의 대학원 생활이 시작됩니다.'],
    mood: '… 새 학기가 시작됐다. 기대 반, 불안 반.',
  };
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...createInitialState(),

      performAction: (actionId) => {
        const state = get();
        if (state.ending || state.currentEvent || state.slotsLeft <= 0) return;

        const action = ACTIONS.find((a) => a.id === actionId);
        if (!action) return;

        const effect = applyModifiers(state.stats, action.effects);
        const nextStats = applyEffect(state.stats, effect);
        const ending = checkInstantEnding(nextStats);

        set({
          stats: nextStats,
          slotsLeft: state.slotsLeft - 1,
          log: [...state.log, `${action.icon} ${action.label}`].slice(-30),
          ending,
          mood: pickActionMood(actionId),
        });

        if (!ending && get().slotsLeft === 0) {
          // 슬롯 다 쓰면 주말 → 다음 주 자동
          setTimeout(() => get().nextWeek(), 250);
        }
      },

      resolveEventChoice: (choiceIdx) => {
        const state = get();
        if (!state.currentEvent) return;
        const choice = state.currentEvent.choices[choiceIdx];
        if (!choice) return;

        const nextStats = applyEffect(state.stats, choice.effect);
        const flags = new Set(state.flags);
        if (choice.flag) flags.add(choice.flag);
        const triggered = new Set(state.triggeredEvents);
        triggered.add(state.currentEvent.id);

        const ending = checkInstantEnding(nextStats);

        set({
          stats: nextStats,
          flags,
          triggeredEvents: triggered,
          currentEvent: null,
          log: [...state.log, `📌 ${state.currentEvent.title} → ${choice.label}`].slice(-30),
          ending,
          mood: pickEventMood(choice.label),
        });
      },

      nextWeek: () => {
        const state = get();
        if (state.ending) return;

        let nextSemester = state.semester;
        let nextWeek = state.week + 1;
        let log = state.log;

        if (nextWeek > 15) {
          nextWeek = 1;
          nextSemester += 1;
          log = [...log, `📅 ${nextSemester}학기 시작.`].slice(-30);
        }

        // 졸업 시점
        if (nextSemester > MAX_SEMESTERS) {
          set({
            ending: determineEnding(state.stats),
            log: [...log, '🎓 졸업 시즌이 도래했다…'].slice(-30),
          });
          return;
        }

        // 주말 회복
        const weekendStats = applyEffect(state.stats, { stamina: 5, mental: 3 });

        // 이벤트 발화 체크
        const event = pickEvent({
          semester: nextSemester,
          stats: weekendStats,
          triggeredIds: state.triggeredEvents,
          flags: state.flags,
        });

        set({
          semester: nextSemester,
          week: nextWeek,
          slotsLeft: SLOTS_PER_TURN,
          stats: weekendStats,
          currentEvent: event,
          log,
        });
      },

      reset: () => set(createInitialState()),
    }),
    {
      name: 'professor-maker-save',
      version: SAVE_VERSION,
      // Set은 JSON 직렬화 안 되므로 변환
      partialize: (state: GameState) => ({
        semester: state.semester,
        week: state.week,
        slotsLeft: state.slotsLeft,
        stats: state.stats,
        flags: Array.from(state.flags),
        triggeredEvents: Array.from(state.triggeredEvents),
        currentEvent: state.currentEvent,
        ending: state.ending,
        log: state.log,
        mood: state.mood,
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      merge: (persisted: any, current: GameState) => ({
        ...current,
        ...persisted,
        flags: new Set(persisted?.flags ?? []),
        triggeredEvents: new Set(persisted?.triggeredEvents ?? []),
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      migrate: (persistedState: any, version: number) => {
        // 향후 버전 마이그레이션 위치
        if (version < SAVE_VERSION) {
          return persistedState;
        }
        return persistedState;
      },
    } as unknown as PersistOptions<GameState>
  )
);
