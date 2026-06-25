/**
 * Gemini 2.5 Flash Image (nano banana) 캐릭터 생성 스크립트
 *
 * 회의 #016 결정사항 (CEO 직권):
 * - Flux+ControlNet+RunPod 워크플로우 폐기
 * - Gemini API로 베이스 이미지 생성 → 박찰떡 손 보정 → WebP
 *
 * 사용법:
 *   node scripts/generate-character.mjs                  # 기본 1안 5장
 *   node scripts/generate-character.mjs --count 3        # 3장
 *   node scripts/generate-character.mjs --prompt "..."   # 커스텀 프롬프트
 *   node scripts/generate-character.mjs --variant darkcircle  # 변형
 *
 * 출력: src/assets/character/raw/char01_*.png
 *
 * @google/genai SDK 안 씀 (의존성 0). Node 18+ 내장 fetch 사용.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ─────────────────────────────────────────────────────────────
// .env 로드 (외부 패키지 없이)
// ─────────────────────────────────────────────────────────────
function loadEnv() {
  const envPath = resolve(ROOT, '.env');
  try {
    const text = readFileSync(envPath, 'utf-8');
    for (const line of text.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq < 0) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  } catch (err) {
    console.error(`❌ .env 파일을 읽을 수 없습니다: ${envPath}`);
    console.error(`   .env.example을 복사해서 .env로 만들고 GEMINI_API_KEY를 채우세요.`);
    process.exit(1);
  }
}
loadEnv();

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('❌ GEMINI_API_KEY 환경 변수가 비어있습니다.');
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────
// 박찰떡 AD의 표준 프롬프트 (회의 #012, #016)
//
// 주의:
// - 게임명("Professor Maker")을 프롬프트에 넣으면 워터마크로 박힘 → 제거
// - "Variation:" 같은 비교 표현을 쓰면 before/after 두 명 컷이 나옴 → 절대 금지
// - 각 variant는 독립적인 단일 캐릭터 일러스트로 직접 묘사
// ─────────────────────────────────────────────────────────────
function buildPrompt({ expression, condition, clothing = 'default', accessory = 'none' }) {
  return `A solo single-character portrait illustration. ONE figure only. No comparison, no before/after, no multiple characters, no text, no watermark, no logo, no signature.

The subject:
- A Korean woman in her late 20s, a quiet introspective grad student
- Dark brown short bob haircut just past the ears, side-swept slightly right
- ${expression}
- ${clothing === 'default' ? 'Wearing an oatmeal-colored oversized cardigan over a plain white inner shirt' : clothing}
- ${accessory === 'none' ? '' : accessory}
- ${condition}
- Subtly asymmetric posture, left shoulder dropped about 1 degree
- Upper body visible, facing the viewer, centered in frame

Art style:
- Soft hand-drawn lineart with gouache texture
- Warm brown outlines, NOT pure black
- Muted earthy palette: oatmeal beige, warm brown, soft bluish gray shadows
- Studio Ghibli warmth meets melancholic indie game aesthetic
- 2D illustration, painterly but clean, NOT photorealistic, NOT generic anime
- Plain solid neutral background, no scenery, no props
- No text anywhere in the image, no watermark, no caption

Composition: single centered figure taking about 65% of the frame height, calm front-facing pose.`;
}

const VARIANTS = {
  base: buildPrompt({
    expression: 'Gentle neutral expression, eyes about 70% open with a slight downward gaze, lips closed at zero degrees, the quiet look of someone pretending she is fine when she isn\'t',
    condition: 'Calm and composed, slightly tired but holding it together',
  }),
  soft_smile: buildPrompt({
    expression: 'A faint barely-there smile at the corner of her mouth, eyes slightly softened as if remembering something pleasant, gaze meeting the viewer warmly',
    condition: 'A rare good day — looking quietly content',
  }),
  darkcircle: buildPrompt({
    expression: 'Visible dark circles under the eyes, tired expression, eyes about 60% open, mouth a flat line, looking slightly to the side',
    condition: 'Has not slept well in days, the early stage of burnout showing on her face',
  }),
  hollow: buildPrompt({
    expression: 'Heavy dark circles under the eyes, hollow exhausted gaze, mouth slightly parted, looking through the viewer rather than at them',
    condition: 'Deep burnout phase, shoulders subtly more slumped, the look of someone who has not really rested in weeks',
  }),
  worn_clothes: buildPrompt({
    expression: 'Neutral tired expression, eyes about 65% open, faint downward gaze',
    condition: 'Hair slightly messier than usual, looking like she has been wearing the same clothes for several days',
    clothing: 'Wearing a worn-out faded oatmeal cardigan, slightly stretched at the collar, over a plain off-white inner shirt with a small faint stain near the hem',
  }),
  nerd_glasses: buildPrompt({
    expression: 'Focused intellectual gaze through her glasses, slight crease between the brows from too much reading, mouth a small flat line of concentration',
    condition: 'The look of someone who has been staring at papers for too long',
    accessory: 'Wearing thick-framed black reading glasses with visibly thick lenses',
  }),
};

// ─────────────────────────────────────────────────────────────
// CLI 파싱
// ─────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const opts = { count: 5, prompt: null, variant: 'base', outDir: 'src/assets/character/raw' };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    const next = argv[i + 1];
    if (a === '--count') opts.count = parseInt(next, 10);
    else if (a === '--prompt') opts.prompt = next;
    else if (a === '--variant') opts.variant = next;
    else if (a === '--out') opts.outDir = next;
  }
  return opts;
}

// ─────────────────────────────────────────────────────────────
// Gemini REST API 호출 (SDK 미사용)
// ─────────────────────────────────────────────────────────────
const MODEL = 'nano-banana-pro-preview';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

async function generateImage(prompt) {
  const url = `${ENDPOINT}?key=${API_KEY}`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ['IMAGE'],
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API ${res.status}: ${errText.slice(0, 500)}`);
  }

  const data = await res.json();
  // 응답 구조: candidates[0].content.parts[].inlineData.data (base64)
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    if (part.inlineData?.data) {
      return {
        base64: part.inlineData.data,
        mimeType: part.inlineData.mimeType ?? 'image/png',
      };
    }
  }

  // 텍스트 응답만 온 경우 — 디버그용
  const textPart = parts.find((p) => p.text);
  throw new Error(
    `이미지 응답이 비어있습니다. 응답 텍스트: ${textPart?.text ?? '(없음)'}`
  );
}

// ─────────────────────────────────────────────────────────────
// 메인
// ─────────────────────────────────────────────────────────────
async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const prompt = opts.prompt ?? VARIANTS[opts.variant];
  if (!prompt) {
    console.error(`❌ Unknown variant: ${opts.variant}`);
    console.error(`   Available: ${Object.keys(VARIANTS).join(', ')}`);
    process.exit(1);
  }

  const outAbs = resolve(ROOT, opts.outDir);
  mkdirSync(outAbs, { recursive: true });

  console.log(`🎨 Gemini 2.5 Flash Image — '${opts.variant}' × ${opts.count}장`);
  console.log(`   출력: ${outAbs}`);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

  for (let i = 1; i <= opts.count; i += 1) {
    const start = Date.now();
    process.stdout.write(`  [${i}/${opts.count}] 생성 중… `);
    try {
      const { base64, mimeType } = await generateImage(prompt);
      const ext = mimeType.includes('png') ? 'png' : 'jpg';
      const filename = `char01_${opts.variant}_${timestamp}_${String(i).padStart(2, '0')}.${ext}`;
      const fullPath = resolve(outAbs, filename);
      writeFileSync(fullPath, Buffer.from(base64, 'base64'));
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      console.log(`✅ ${filename} (${elapsed}s)`);
    } catch (err) {
      console.log(`❌ 실패`);
      console.error(`     ${err.message}`);
    }
  }

  console.log(`\n💡 박찰떡 AD 워크플로우: 위 PNG → Clip Studio Paint → 손 보정 → src/assets/character/char01_*.webp`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
