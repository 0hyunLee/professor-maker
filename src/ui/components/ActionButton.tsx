import type { ActionDef } from '../../game/schema';
import { sfxHover } from '../../game/audio/sfx';

interface Props {
  action: ActionDef;
  disabled: boolean;
  onClick: () => void;
}

export function ActionButton({ action, disabled, onClick }: Props) {
  return (
    <button
      className="action-btn"
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={disabled ? undefined : sfxHover}
      title={action.note}
    >
      <span className="action-btn__icon">{action.icon}</span>
      <span className="action-btn__label">{action.label}</span>
      <span className="action-btn__effects">
        {Object.entries(action.effects).map(([k, v]) => (
          <span key={k} className={v > 0 ? 'pos' : 'neg'}>
            {k} {v > 0 ? '+' : ''}
            {k === 'money' ? `${(v / 1000).toFixed(0)}k` : v}
          </span>
        ))}
      </span>
    </button>
  );
}
