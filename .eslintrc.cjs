/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'import'],
  rules: {
    // 회의록 #011 정호준 코딩 컨벤션:
    // 1. game/** → React/Zustand/i18next import 금지
    // 2. scripts/** → stores/ui import 금지
    // 3. game/** → Math.random 직접 호출 금지 (RNG 주입만)
    'import/no-restricted-paths': ['error', {
      zones: [
        // game/ 모듈은 DOM 무관 순수 TS만
        {
          target: './src/game/**',
          from: './src/ui/**',
          message: 'game/ 모듈은 ui/ import 금지 (#011 정호준 룰)',
        },
        {
          target: './src/game/**',
          from: './src/game/store/**',
          message: 'game/systems, game/bot 등은 store/ 직접 import 금지 (#011)',
        },
        // scripts는 game/만 import 가능
        {
          target: './scripts/**',
          from: './src/ui/**',
          message: 'scripts/ 에서 ui/ import 금지 (#011)',
        },
        {
          target: './scripts/**',
          from: './src/game/store/**',
          message: 'scripts/ 에서 store/ import 금지 — game/systems만 사용 (#011)',
        },
      ],
    }],
  },
};
