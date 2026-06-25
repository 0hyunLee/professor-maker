/**
 * Google Lyria 3 Clip Preview — BGM 생성 스크립트
 *
 * 회의 #013 박리듬 사양:
 * - bgm_semester1_hope: BPM 96, C-Em-Am-Fmaj7, 피아노+기타+첼로, 도-솔-미-라 모티프
 * - 학기 진행에 따라 변질되는 메인 테마 5종
 *
 * Suno API 자리에 Lyria 3 (Gemini API 키로 호출).
 * SDK 없음, fetch만 사용.
 *
 * 사용법:
 *   node scripts/generate-bgm.mjs                       # bgm_semester1_hope 1트랙
 *   node scripts/generate-bgm.mjs --variant fatigue     # 피로 변질 버전
 *   node scripts/generate-bgm.mjs --prompt "..." --name custom
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

function loadEnv() {
  const text = readFileSync(resolve(ROOT, '.env'), 'utf-8');
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq < 0) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[k]) process.env[k] = v;
  }
}
loadEnv();

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('❌ GEMINI_API_KEY 없음');
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────
// 박리듬 작곡가의 BGM 사양 (회의 #013, #016)
// 학기별 변질 — 같은 모티프 도-솔-미-라가 점점 무너짐
// ─────────────────────────────────────────────────────────────
const VARIANTS = {
  semester1_hope: {
    name: 'bgm_semester1_hope',
    description: 'A warm, hopeful but slightly anxious instrumental piece for a Korean indie game about graduate school life. Solo piano leads with gentle arpeggiated acoustic guitar in 8th notes. Soft cello pad in the background. Tempo around 96 BPM. Key of C major with a Fmaj7 ending feel that leaves things "open" instead of resolved. The mood: a fresh graduate student walking into the lab on her first day, full of hope but already a little uncertain. Studio Ghibli warmth meets indie game melancholy. No vocals, no drums, instrumental only. Soft, intimate, and slightly bittersweet.',
  },
  semester2_routine: {
    name: 'bgm_semester2_routine',
    description: 'Same warm instrumental palette as semester 1 but slightly slower, around 88 BPM. Solo piano with sparse cello. The acoustic guitar has dropped out. The mood is the same student a year later — the routine has set in, the hope is still there but quieter. Key of C major slipping toward A minor. No vocals, instrumental only.',
  },
  semester3to5_fatigue: {
    name: 'bgm_semester3to5_fatigue',
    description: 'Minimal piano, melancholic, around 80 BPM. The melody is the same as the hopeful semester 1 theme but slightly slower and slightly downward — the high notes have dropped a half step. Faint, almost imperceptible distortion under the piano. Key shifts toward A minor. The mood: third-year burnout, fluorescent lab lights, papers everywhere, late nights. No vocals, instrumental only.',
  },
  qualexam_resignation: {
    name: 'bgm_qualexam_resignation',
    description: 'Ambient pad with sparse single piano notes, around 60 BPM. The melody from the earlier hopeful theme is barely recognizable, broken up by long silences. Soft clock ticking in the background. Key of C minor. The mood: post-qualifying-exam resignation, exhausted, the student staring at the ceiling at 3 AM. No vocals, instrumental, very sparse.',
  },
  graduation_enlightenment: {
    name: 'bgm_graduation_enlightenment',
    description: 'Almost silence. A single distant piano note repeating slowly. Soft breathing or wind in the background. Around 50 BPM. The melody has dissolved entirely. The mood: graduation week, transcendence through exhaustion, a quiet acceptance. Almost ASMR. No vocals, instrumental, extremely minimal.',
  },
};

function parseArgs(argv) {
  const opts = { variant: 'semester1_hope', prompt: null, name: null, outDir: 'public/audio/bgm' };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    const next = argv[i + 1];
    if (a === '--variant') opts.variant = next;
    else if (a === '--prompt') opts.prompt = next;
    else if (a === '--name') opts.name = next;
    else if (a === '--out') opts.outDir = next;
  }
  return opts;
}

const MODEL = 'lyria-3-clip-preview';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

async function generateBgm(prompt) {
  const url = `${ENDPOINT}?key=${API_KEY}`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ['AUDIO'],
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Lyria ${res.status}: ${err.slice(0, 800)}`);
  }

  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    if (part.inlineData?.data) {
      return {
        base64: part.inlineData.data,
        mimeType: part.inlineData.mimeType ?? 'audio/wav',
      };
    }
  }
  const textPart = parts.find((p) => p.text);
  throw new Error(
    `오디오 응답이 비어있음. 텍스트: ${textPart?.text ?? '(없음)'}\n전체: ${JSON.stringify(data).slice(0, 500)}`
  );
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const variant = VARIANTS[opts.variant];
  const prompt = opts.prompt ?? variant?.description;
  const name = opts.name ?? variant?.name ?? `bgm_${opts.variant}`;

  if (!prompt) {
    console.error(`❌ Unknown variant: ${opts.variant}`);
    console.error(`   Available: ${Object.keys(VARIANTS).join(', ')}`);
    process.exit(1);
  }

  const outAbs = resolve(ROOT, opts.outDir);
  mkdirSync(outAbs, { recursive: true });

  console.log(`🎼 Lyria 3 Clip — '${name}' 생성 중…`);
  console.log(`   출력: ${outAbs}`);

  const start = Date.now();
  try {
    const { base64, mimeType } = await generateBgm(prompt);
    const ext = mimeType.includes('wav') ? 'wav' : (mimeType.includes('mpeg') || mimeType.includes('mp3')) ? 'mp3' : 'audio';
    const filename = `${name}.${ext}`;
    const fullPath = resolve(outAbs, filename);
    writeFileSync(fullPath, Buffer.from(base64, 'base64'));
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    const sizeKb = (Buffer.from(base64, 'base64').length / 1024).toFixed(1);
    console.log(`✅ ${filename} (${elapsed}s, ${sizeKb}KB)`);
  } catch (err) {
    console.log(`❌ 실패`);
    console.error(`   ${err.message}`);
    process.exit(1);
  }
}

main();
