/**
 * 봇 시뮬레이션 CLI (회의록 #014, #022)
 *
 * 사용법:
 *   pnpm sim                              # 7봇 × 1000회
 *   pnpm sim --runs 10000                 # 7봇 × 10,000회
 *   pnpm sim --bot greedy_tenure          # 특정 봇만
 *   pnpm sim --out results/w3.csv         # CSV 덤프
 *   pnpm sim --gate warn                  # KPI 실패해도 exit 0, 경고만
 *   pnpm sim --gate block                 # KPI 실패 시 exit 1
 *   pnpm sim --threshold 6                # KPI 통과 기준 (기본 6, W3 W2부터 7)
 *
 * KPI 검증 (회의록 #014):
 *   1. 정교수 엔딩 ≤ 5%
 *   2. 자퇴 엔딩 ≤ 15%
 *   3. 7개 엔딩 모두 ≥ 3%
 *   4. 평균 클리어 12.5 ± 1.0 학기
 *
 * W3 W1: 6/10 통과 (#022 오탐지 권한 완화), W3 W2부터 7/10 복원.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { ALL_BOTS } from '../src/game/bot/bots';
import { runMany, summarize, type BotSummary } from '../src/game/bot/runner';
import type { SimResult } from '../src/game/bot/types';

type GateMode = 'off' | 'warn' | 'block';

interface CliOptions {
  runs: number;
  bot?: string;
  out?: string;
  seed: number;
  gate: GateMode;
  threshold: number;
}

function parseArgs(argv: string[]): CliOptions {
  const envGate = (process.env.SIM_GATE ?? 'off') as GateMode;
  const opts: CliOptions = {
    runs: 1000,
    seed: 42,
    gate: ['off', 'warn', 'block'].includes(envGate) ? envGate : 'off',
    threshold: 6,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === '--runs') opts.runs = parseInt(next, 10);
    else if (arg === '--bot') opts.bot = next;
    else if (arg === '--out') opts.out = next;
    else if (arg === '--seed') opts.seed = parseInt(next, 10);
    else if (arg === '--gate') opts.gate = next as GateMode;
    else if (arg === '--threshold') opts.threshold = parseInt(next, 10);
  }
  return opts;
}

function pct(n: number, total: number): string {
  return `${((n / total) * 100).toFixed(1)}%`;
}

function printSummary(s: BotSummary): void {
  console.log(`\n[${s.botId}] runs=${s.runs}`);
  console.log(`  avg semesters: ${s.avgSemesters.toFixed(1)}`);
  console.log(`  avg mental breaks: ${s.avgMentalBreaks.toFixed(2)}`);
  console.log(`  avg events triggered: ${s.avgEventsTriggered.toFixed(1)}`);
  console.log('  endings:');
  for (const [id, n] of Object.entries(s.endingDistribution).sort(
    ([, a], [, b]) => b - a
  )) {
    console.log(`    ${id.padEnd(20)} ${pct(n, s.runs).padStart(7)}  (${n})`);
  }
}

function toCsvRow(r: SimResult): string {
  return [
    r.runId,
    r.botId,
    r.semestersPlayed,
    r.endingId,
    r.finalStats.research,
    r.finalStats.english,
    r.finalStats.network,
    r.finalStats.stamina,
    r.finalStats.mental,
    r.finalStats.money,
    r.finalStats.chores,
    r.eventsTriggered,
    r.mentalBreaks,
  ].join(',');
}

const CSV_HEADER =
  'run_id,bot_type,semester_reached,ending_id,stat_research,stat_english,stat_network,stat_stamina,stat_mental,stat_money,stat_chores,events_triggered,mental_breaks';

function checkKpis(allResults: SimResult[]): { passed: number; total: number } {
  console.log('\n══════ KPI 검증 (오탐지 #014) ══════');
  const n = allResults.length;
  const dist: Record<string, number> = {};
  let totalSem = 0;
  for (const r of allResults) {
    dist[r.endingId] = (dist[r.endingId] ?? 0) + 1;
    totalSem += r.semestersPlayed;
  }

  const tenureRate = (dist.tenure ?? 0) / n;
  const dropoutRate = (dist.convenience_store ?? 0) / n;
  const avgSem = totalSem / n;

  const checks: { name: string; ok: boolean; detail: string }[] = [
    {
      name: '정교수 엔딩 ≤ 5%',
      ok: tenureRate <= 0.05,
      detail: `실측 ${(tenureRate * 100).toFixed(2)}%`,
    },
    {
      name: '자퇴 엔딩 ≤ 15%',
      ok: dropoutRate <= 0.15,
      detail: `실측 ${(dropoutRate * 100).toFixed(2)}%`,
    },
    {
      name: '평균 클리어 12.5 ± 1.0 학기',
      ok: Math.abs(avgSem - 12.5) <= 1.0,
      detail: `실측 ${avgSem.toFixed(2)}학기`,
    },
  ];

  const knownEndings = ['tenure', 'postdoc', 'industry', 'lecturer', 'convenience_store', 'infinite_hiatus', 'emigration'];
  for (const eid of knownEndings) {
    const rate = (dist[eid] ?? 0) / n;
    checks.push({
      name: `${eid} 엔딩 ≥ 3%`,
      ok: rate >= 0.03,
      detail: `실측 ${(rate * 100).toFixed(2)}%`,
    });
  }

  let passed = 0;
  for (const c of checks) {
    const mark = c.ok ? '✅' : '❌';
    console.log(`  ${mark} ${c.name}  →  ${c.detail}`);
    if (c.ok) passed += 1;
  }
  return { passed, total: checks.length };
}

/** 봇 의도 vs 실제 매트릭스 (회의록 #022 오탐지 요청) */
function printBotMatrix(allResults: SimResult[]): void {
  console.log('\n══════ 봇 의도 vs 실제 매트릭스 (#022) ══════');
  const byBot: Record<string, Record<string, number>> = {};
  for (const r of allResults) {
    if (!byBot[r.botId]) byBot[r.botId] = {};
    byBot[r.botId][r.endingId] = (byBot[r.botId][r.endingId] ?? 0) + 1;
  }

  for (const bot of ALL_BOTS) {
    const dist = byBot[bot.id] ?? {};
    const total = Object.values(dist).reduce((a, b) => a + b, 0);
    const sorted = Object.entries(dist).sort(([, a], [, b]) => b - a);
    const topId = sorted[0]?.[0] ?? '∅';
    const topPct = sorted[0] ? ((sorted[0][1] / total) * 100).toFixed(0) : '0';
    const targetCount = dist[bot.targetEnding] ?? 0;
    const targetPct = total > 0 ? ((targetCount / total) * 100).toFixed(0) : '0';
    const ok = topId === bot.targetEnding;
    const mark = ok ? '✅' : '❌';
    console.log(
      `  ${mark} ${bot.id.padEnd(18)} → 의도:${bot.targetEnding.padEnd(20)} 실제 1위:${topId} (${topPct}%)  의도도달:${targetPct}%`
    );
  }
}

function main(): void {
  const opts = parseArgs(process.argv.slice(2));
  const bots = opts.bot
    ? ALL_BOTS.filter((b) => b.id === opts.bot)
    : ALL_BOTS;

  if (bots.length === 0) {
    console.error(`Unknown bot: ${opts.bot}`);
    console.error(`Available: ${ALL_BOTS.map((b) => b.id).join(', ')}`);
    process.exit(1);
  }

  console.log(
    `🤖 봇 시뮬레이션 시작 — ${bots.length}봇 × ${opts.runs}회 (seed=${opts.seed})`
  );

  const allResults: SimResult[] = [];
  const start = Date.now();

  for (const bot of bots) {
    const results = runMany(bot, opts.runs, opts.seed);
    allResults.push(...results);
    printSummary(summarize(results));
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n⏱  ${allResults.length} runs in ${elapsed}s`);

  const { passed, total } = checkKpis(allResults);
  printBotMatrix(allResults);

  console.log(`\n📊 KPI 요약: ${passed}/${total} 통과 (게이트 기준 ${opts.threshold}/${total})`);

  if (opts.out) {
    mkdirSync(dirname(opts.out), { recursive: true });
    const csv = [CSV_HEADER, ...allResults.map(toCsvRow)].join('\n');
    writeFileSync(opts.out, csv, 'utf-8');
    console.log(`\n💾 CSV → ${opts.out} (${allResults.length} rows)`);
  }

  // 게이트 처리 (#022)
  const passedGate = passed >= opts.threshold;
  if (opts.gate === 'off') {
    return;
  }
  if (passedGate) {
    console.log(`\n✅ 게이트 (${opts.gate}) 통과 — ${passed}/${total} ≥ ${opts.threshold}`);
    return;
  }
  if (opts.gate === 'warn') {
    console.log(`\n⚠️  게이트 (warn) 실패 — ${passed}/${total} < ${opts.threshold}. exit 0 (W3 W1 모드)`);
    return;
  }
  // block
  console.error(`\n❌ 게이트 (block) 실패 — ${passed}/${total} < ${opts.threshold}. exit 1`);
  process.exit(1);
}

main();
