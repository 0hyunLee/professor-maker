/**
 * 프로페서 메이커 메인 화면 — W2.5 패치 (회의 #016 + 사운드 야근 #017 후속)
 *
 * 씬 분할 레이아웃 (프린세스 메이커 풍):
 * ┌──────────────────────────────────────────────┐
 * │ TOP   학기 · 주차 · 날짜 · 돈 · 🔊             │
 * ├──────────────────────────┬───────────────────┤
 * │ MAIN                     │ SIDE              │
 * │ 캐릭터 + 무드             │ 스탯 패널          │
 * ├──────────────────────────┴───────────────────┤
 * │ BOTTOM   행동 슬롯 + 일지                     │
 * └──────────────────────────────────────────────┘
 */
import { useEffect, useState } from 'react';
import { STATS, ACTIONS } from './game/data';
import { useGameStore } from './game/store/gameStore';
import { StatBar } from './ui/components/StatBar';
import { ActionButton } from './ui/components/ActionButton';
import { EventCard } from './ui/components/EventCard';
import { CharacterPortrait } from './ui/components/CharacterPortrait';
import {
  sfxClick,
  sfxHover,
  sfxConfirm,
  sfxModalOpen,
  sfxModalClose,
  sfxKakaoProf,
  sfxStatUp,
  sfxStatDown,
} from './game/audio/sfx';
import { syncBgmToSemester, setBgmMuted, isBgmMuted } from './game/audio/bgm';

export default function App() {
  const {
    semester,
    week,
    slotsLeft,
    stats,
    currentEvent,
    ending,
    log,
    mood,
    performAction,
    resolveEventChoice,
    nextWeek,
    reset,
  } = useGameStore();

  const [muted, setMuted] = useState(isBgmMuted());

  // 학기 변화 → BGM 자동 변질 동기화
  useEffect(() => {
    syncBgmToSemester(semester);
  }, [semester]);

  // 이벤트 등장 → kakao 시그니처 + 모달 효과음
  useEffect(() => {
    if (currentEvent) {
      sfxKakaoProf();
      sfxModalOpen();
    }
  }, [currentEvent]);

  // 멘탈 급변 감지 (대략적인 효과음 트리거)
  useEffect(() => {
    if (stats.mental < 15) sfxStatDown();
  }, [stats.mental]);

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    setBgmMuted(next);
    sfxClick();
  }

  function handleAction(id: string) {
    sfxClick();
    performAction(id);
    // 행동 결과에 따른 톤 — 단순히 한 번만
    sfxStatUp();
  }

  function handleNextWeek() {
    sfxConfirm();
    nextWeek();
  }

  function handleEventChoice(idx: number) {
    sfxClick();
    sfxModalClose();
    resolveEventChoice(idx);
  }

  function handleReset() {
    sfxClick();
    reset();
  }

  if (ending) {
    return (
      <div className="ending-screen">
        <h1 className="ending-screen__icon">{ending.icon}</h1>
        <h2 className="ending-screen__title">{ending.label}</h2>
        <p className="ending-screen__tier">[{ending.tier.toUpperCase()} ENDING]</p>
        <p className="ending-screen__desc">{ending.description}</p>
        <button className="ending-screen__restart" onClick={handleReset}>
          다시 시작
        </button>
      </div>
    );
  }

  return (
    <div className="scene">
      {/* ─── 상단 ─── */}
      <header className="scene__top">
        <div className="scene__top-left">
          <span className="scene__title">🎓 프로페서 메이커</span>
        </div>
        <div className="scene__top-right">
          <span className="scene__date">{semester}학기 · {week}주차</span>
          <span className="scene__money">💰 {stats.money.toLocaleString()}원</span>
          <span className="scene__slots">슬롯 {slotsLeft}/3</span>
          <button
            className="mute-btn"
            onClick={toggleMute}
            onMouseEnter={sfxHover}
            title={muted ? '음소거 해제' : '음소거'}
          >
            {muted ? '🔇' : '🔊'}
          </button>
        </div>
      </header>

      {/* ─── 메인 (캐릭터 + 스탯) ─── */}
      <main className="scene__main">
        <section className="scene__character">
          <CharacterPortrait stats={stats} mood={mood} />
        </section>

        <aside className="scene__stats">
          <h3 className="scene__panel-title">스탯</h3>
          {STATS.filter((s) => s.id !== 'money').map((s) => (
            <StatBar key={s.id} def={s} value={stats[s.id]} />
          ))}
        </aside>
      </main>

      {/* ─── 하단 (행동 + 일지) ─── */}
      <footer className="scene__bottom">
        <section className="scene__actions">
          <h3 className="scene__panel-title">
            이번 주 행동 (남은 슬롯: {slotsLeft}/3)
          </h3>
          <div className="action-grid">
            {ACTIONS.map((a) => (
              <ActionButton
                key={a.id}
                action={a}
                disabled={slotsLeft <= 0 || !!currentEvent}
                onClick={() => handleAction(a.id)}
              />
            ))}
          </div>
          <button
            className="next-week-btn"
            onClick={handleNextWeek}
            onMouseEnter={sfxHover}
            disabled={slotsLeft > 0 || !!currentEvent}
          >
            다음 주로 →
          </button>
        </section>

        <section className="scene__log">
          <h3 className="scene__panel-title">📜 일지</h3>
          <ul>
            {log.slice(-6).reverse().map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
          <button className="reset-btn" onClick={handleReset}>처음부터</button>
        </section>
      </footer>

      {currentEvent && <EventCard event={currentEvent} onChoose={handleEventChoice} />}
    </div>
  );
}
