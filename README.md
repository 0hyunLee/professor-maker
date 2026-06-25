# 프로페서 메이커 (Professor Maker)

> *"당신의 대학원, 이번엔 클릭 한 번으로 망해보세요."*

『프로페서 메이커』는 대학원생 육성 시뮬레이션 게임입니다. 신입 대학원생으로 시작해, 7가지 엔딩 중 하나로 귀결됩니다.

**제작**: 연구빼고다재밌어 (Research-Free Fun Studio)

---

## 시작하기

```bash
# 의존성 설치
pnpm install

# 개발 서버 (HMR)
pnpm dev

# 프로덕션 빌드
pnpm build

# 봇 시뮬레이션 (오탐지 QA 리드 담당)
pnpm sim
```

## 기술 스택

| 영역 | 선택 | 이유 |
|---|---|---|
| 프론트 | React 18 + TypeScript | DOM UI가 게임 본체 |
| 빌드 | Vite | HMR이 미친듯이 빠름 |
| 패키지 | pnpm | 디스크 절약 |
| 상태 | Zustand + persist | 보일러플레이트 0, LocalStorage 자동 |
| 검증 | Zod | 데이터 JSON 빌드타임 검증 |
| 사운드 | Howler.js (예정) | 웹오디오 안정 |
| i18n | i18next (예정) | W1부터 키 기반 |

상세 결정 배경: [`../회의록/004_개발부_기술스택확정.md`](../회의록/004_개발부_기술스택확정.md)

## 폴더 구조

```
professor-maker/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── game/             ← DOM 무관, 순수 TS (봇 시뮬레이터가 import)
│   │   ├── data.ts       ← JSON 로드 + Zod 검증
│   │   ├── schema/       ← Zod 스키마
│   │   ├── store/        ← Zustand store + persist
│   │   └── systems/      ← stats, events, endings
│   ├── ui/
│   │   ├── components/   ← StatBar, ActionButton, EventCard
│   │   └── styles/       ← global.css
│   └── data/             ← 기획자가 직접 편집 (JSON)
│       ├── stats.json
│       ├── actions.json
│       ├── events.json
│       └── endings.json
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## 게임 시스템 (W1 기준)

### 스탯 7종 (회의록 #003)
🔬 연구력 · 💪 체력 · 🧠 멘탈 · 🤝 인맥 · 🪣 잡일숙련도 · 🌐 영어 · 💰 돈

### 행동 8종
주 3슬롯 사용. "공짜 점심 없다" 원칙.

### 시너지/페널티 룰 (구현됨)
- **체력 < 20** → 모든 양의 효과 × 0.7 (번아웃)
- **잡일숙련도 ≥ 70** → 연구력 획득 × 0.8 (조교화 함정)
- **연구력 × 영어 ≥ 6000** → 연구력 획득 × 1.5 (논문 작성 효율)
- **멘탈 < 15** → 슬롯 강제 멍때림 (TODO: 구현 예정)
- **멘탈 ≤ 0** → 즉시 편의점알바 엔딩

### 엔딩 7종
🏆 정교수(트루) · 📚 포닥(굿) · 💼 산업체(노멀) · 🏫 시간강사(씁쓸) · 🏪 편의점알바(배드) · 🛏️ 무한휴학(히든) · ✈️ 해외이민(시크릿)

### 시그니처 이벤트 10종 (회의록 #003)
EV_KAKAO_3AM · EV_PARENTS_CALL · EV_SUNBAE_ESCAPE · EV_AI_SCANDAL · EV_LAB_FRIDGE · EV_MT_GUITAR · EV_PRINTER_JAM · EV_SEMINAR_SLEEP · EV_REVIEWER_2 · EV_FREE_PIZZA

## 데이터 편집 워크플로우

기획자는 `src/data/*.json`을 직접 편집할 수 있습니다. Vite HMR이 0.3초 안에 반영하며, Zod가 빌드 시점에 스키마를 검증합니다.

새 이벤트 추가 예시:
```json
{
  "id": "EV_NEW_EVENT",
  "title": "이벤트 제목",
  "trigger": { "semester_min": 2, "prob": 0.3 },
  "text": "본문 텍스트",
  "choices": [
    { "label": "선택지 1", "effect": { "mental": -5, "research": 3 } }
  ]
}
```

## AI 도구 활용 (각 부서 회의록 참조)

- **개발**: Claude Code (페어 프로그래밍)
- **아트**: Flux.1-dev + ControlNet + IP-Adapter (탐색만, 출시 에셋 0%)
- **사운드**: Suno v4 / Udio (드래프트), MusicGen (앰비언트), ElevenLabs (보이스 조미료)
- **기획**: Claude/GPT (이벤트 텍스트 베리에이션 빌드타임 생성)
- **QA**: Playwright + AI 셀렉터, Claude (엣지 케이스 생성)
- **마케팅**: Claude/GPT (데일리 카피), Stable Diffusion (티저)

## TODO (W2~)

- [ ] 봇 시뮬레이터 (`scripts/simulate.ts`) — 오탐지 QA 리드 담당
- [ ] i18next 통합 + 한/영 키 분리
- [ ] 캐릭터 레이어 시스템 (박찰떡 24장 에셋)
- [ ] Howler.js 사운드 통합
- [ ] 학기/주차 기반 이벤트 풀 확장 (50개)
- [ ] 엔딩 일러스트 7장
- [ ] 마이그레이션 함수 체인 (saveVersion v1→v2)

## 라이선스

내부 개발용. 출시 라이선스 미정.
