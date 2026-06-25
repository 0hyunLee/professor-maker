import type { StatDef } from '../../game/schema';

interface Props {
  def: StatDef;
  value: number;
}

export function StatBar({ def, value }: Props) {
  const isMoney = def.id === 'money';
  const pct = isMoney ? Math.min(100, (value / 2_000_000) * 100) : (value / def.max) * 100;
  const display = isMoney ? `${value.toLocaleString()}원` : `${value} / ${def.max}`;

  // 위험 단계 색상
  let color = '#6b9bd1';
  if (def.id === 'mental' && value < 15) color = '#d14d4d';
  else if (def.id === 'stamina' && value < 20) color = '#d18f4d';
  else if (def.id === 'money' && value <= 0) color = '#d14d4d';

  return (
    <div className="stat-bar" title={def.description}>
      <div className="stat-bar__label">
        <span className="stat-bar__icon">{def.icon}</span>
        <span className="stat-bar__name">{def.label}</span>
        <span className="stat-bar__value">{display}</span>
      </div>
      <div className="stat-bar__track">
        <div
          className="stat-bar__fill"
          style={{ width: `${Math.max(0, pct)}%`, background: color }}
        />
      </div>
    </div>
  );
}
