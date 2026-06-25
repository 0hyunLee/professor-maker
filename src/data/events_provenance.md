# events.json Provenance — 출처 메모

회의록 #020 (기획부 박재필+Claude 페어) 합의에 따라, 모든 이벤트의 출처와 작성 경위를 기록한다.

## 출처 구분
- **일기장**: 박재필 일기장에서 직접 가져온 사건 (재구성 최소)
- **재구성**: 일기장 패턴 + Claude 1차 작성 + 박재필 검증
- **창작**: 일기장과 무관, 게임 디자인 필요로 만든 사건

## 톤 가이드 (회의록 #020)

새 이벤트 작성 시 따를 룰:

1. **선택지는 3개 기본**, 핵심 분기는 4개
2. **각 선택지 effect는 +/- 혼합** — 단방향 손해/이득 거의 없음
3. **flag는 절제**, 게임 후반 분기 핵심 사건에만
4. **타이틀은 짧고 비유적** (5-10자), 본문은 한 문장 + 직인용
5. **자조 톤** — 비참함을 비참하다고 쓰지 말 것. 일상의 평범한 단어로
6. **시간 표현 구체화** — "새벽 3시", "내일 발표인데" 같은 메타데이터가 비참함의 강도를 결정

## 이벤트 출처 표

### W1~W2 (#001~#015) — 기존 박힘
| ID | 출처 | 비고 |
|----|------|------|
| EV_KAKAO_3AM | 일기장 | 박재필 핵심 |
| EV_PARENTS_CALL | 일기장 | |
| EV_SUNBAE_ESCAPE | 일기장 | |
| EV_AI_SCANDAL | 창작 | 시사 |
| EV_LAB_FRIDGE | 일기장 | |
| EV_MT_GUITAR | 일기장 | |
| EV_PRINTER_JAM | 일기장 | |
| EV_SEMINAR_SLEEP | 일기장 | |
| EV_REVIEWER_2 | 재구성 | "This is trivial" 직인용 |
| EV_FREE_PIZZA | 일기장 | |
| EV_PROF_WEDDING_MC | 일기장 | "축가도 부르겠습니다" 분기는 박재필 직접 |
| EV_INSTA_COMPARE | 재구성 | |
| EV_COAUTHOR_WAR | 일기장 | "관계를 터뜨린다" 박재필 직접 |
| EV_REVISION_REJECT | 일기장 | "incremental" 직인용 |
| EV_LAB_NOTEBOOK_ROAST | 일기장 | "학부생이 쓴 거냐" 직인용 |

### W3 신규 추가 15개 (#020 페어 작업)

| ID | 카테고리 | 출처 | Claude 1차 / 박재필 검증 한마디 |
|----|---------|------|--------------------------------|
| EV_DESK_HEADACHE | 신체 | 재구성 | Claude 1차, 박재필 톤 통과 |
| EV_HAND_TREMBLE | 신체 | 재구성 | Claude 1차, "감춘다" 선택지에 박재필 동의 |
| EV_NIGHT_SCROLL | 신체 | 일기장 패턴 | "48번째 새로고침" 메타 — 박재필 동의 |
| EV_HUBAE_RESPECT | 인간관계 | 재구성 | Claude 1차, "화장실로 도망" 박재필 동의 |
| EV_DONGGI_GRADUATE | 인간관계 | 일기장 | "8학기째다" 박재필 직접 보충 |
| EV_PROF_SILENCE | 인간관계 | 재구성 | Claude 1차 |
| EV_PARENTS_REMIT_END | 돈 | 일기장 | "이제 너도 다 컸지" 박재필 직인용 |
| EV_CARD_BILL | 돈 | 재구성 | Claude 1차 |
| EV_CONF_FEE | 돈 | 일기장 | "70만원" 박재필 실제 금액 |
| EV_SECOND_REJECT | 거절후속 | 일기장 | "메일 제목은 익숙해졌다" 박재필 직접 |
| EV_DEADLINE_OVERLAP | 거절후속 | 재구성 | Claude 1차 |
| EV_NATURE_HUBAE | 비교 | 재구성 | Claude 1차, "혼자 술자리"는 박재필 보충 |
| EV_HUBAE_GIMBAP | 위안 | 일기장 | **"고맙다는 말을 잊었다"** — 박재필 검증으로 변경. Claude 1차안은 "울음" 이었으나 "너무 쉬워요" 라며 박재필이 직접 수정 |
| EV_OLD_FRIEND_TEXT | 위안 | 재구성 | Claude 1차, "8년 만이다" 박재필 보충 |
| EV_LAB_CAT | 위안 | 창작 | Claude 1차, 박재필 동의 |

## 박재필 검증 로그
- **EV_HUBAE_GIMBAP**: Claude 첫 1차안의 "울음" 선택지를 "고맙다는 말을 잊었다" 로 박재필 직접 변경. 사유: *"울음 선택지는 너무 쉬워요. 일기장에서는 고맙다고 못 말한 채로 그냥 받았어요."*

## 다음 사이클 메모
- W3 W2 시뮬 결과 보고 *"flag 발화율"* 검증. CAT_FED, GIMBAP_DEBT, MONEY_HIDDEN 등 새 flag가 게임 후반 분기에 쓰이는지 확인.
- 추가 이벤트 필요하면 6 카테고리 비율 유지. 위안 카테고리는 항상 20% 이상.
