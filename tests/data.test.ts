import { describe, it, expect } from 'vitest';
import { STATS, ACTIONS, EVENTS, ENDINGS } from '../src/game/data';

describe('data loading + Zod validation', () => {
  it('loads 7 stats', () => {
    expect(STATS).toHaveLength(7);
  });

  it('loads 8 actions', () => {
    expect(ACTIONS).toHaveLength(8);
  });

  it('loads >= 50 events', () => {
    expect(EVENTS.length).toBeGreaterThanOrEqual(50);
  });

  it('loads 7 endings', () => {
    expect(ENDINGS).toHaveLength(7);
  });

  it('every event has at least 1 choice', () => {
    for (const ev of EVENTS) {
      expect(ev.choices.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('no duplicate event IDs', () => {
    const ids = EVENTS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
