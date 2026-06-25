import type { EventDef } from '../../game/schema';

interface Props {
  event: EventDef;
  onChoose: (idx: number) => void;
}

export function EventCard({ event, onChoose }: Props) {
  return (
    <div className="event-card-overlay">
      <div className="event-card">
        <h2 className="event-card__title">{event.title}</h2>
        <p className="event-card__text">{event.text}</p>
        <div className="event-card__choices">
          {event.choices.map((c, i) => (
            <button key={i} className="event-card__choice" onClick={() => onChoose(i)}>
              <span className="event-card__choice-label">{c.label}</span>
              <span className="event-card__choice-effects">
                {Object.entries(c.effect)
                  .map(([k, v]) => `${k} ${v > 0 ? '+' : ''}${v}`)
                  .join(' · ')}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
