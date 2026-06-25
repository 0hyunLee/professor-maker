/**
 * 캐릭터 초상화 — 6종 변형 + 동적 무드 (CEO W3 피드백)
 *
 * 변형 선택: 스탯 우선순위 기반
 * 무드 텍스트: 스토어의 mood 상태 (행동/이벤트 선택마다 갱신됨)
 */
import type { Stats } from '../../game/systems/stats';

type Variant =
  | 'base'
  | 'soft_smile'
  | 'darkcircle'
  | 'hollow'
  | 'worn_clothes'
  | 'nerd_glasses';

// import.meta.env.BASE_URL 접두사로 GitHub Pages 하위 경로 배포에서도 안전하게.
const BASE = import.meta.env.BASE_URL;

const VARIANT_SRC: Record<Variant, string> = {
  base: `${BASE}character/char01_base.jpg`,
  soft_smile: `${BASE}character/char01_soft_smile.jpg`,
  darkcircle: `${BASE}character/char01_darkcircle.jpg`,
  hollow: `${BASE}character/char01_hollow.jpg`,
  worn_clothes: `${BASE}character/char01_worn_clothes.jpg`,
  nerd_glasses: `${BASE}character/char01_nerd_glasses.jpg`,
};

function pickVariant(stats: Stats): Variant {
  if (stats.mental < 15) return 'hollow';
  if (stats.mental < 40) return 'darkcircle';
  if (stats.money < 100_000) return 'worn_clothes';
  if (stats.research >= 70) return 'nerd_glasses';
  if (stats.mental >= 75 && stats.stamina >= 60) return 'soft_smile';
  return 'base';
}

interface Props {
  stats: Stats;
  mood: string;
}

export function CharacterPortrait({ stats, mood }: Props) {
  const variant = pickVariant(stats);
  const src = VARIANT_SRC[variant];

  return (
    <div className="character-portrait">
      <div className="character-portrait__frame">
        <img
          key={variant}
          src={src}
          alt="대학원생"
          className="character-portrait__img"
        />
      </div>
      <div className="character-portrait__mood">{mood}</div>
    </div>
  );
}
