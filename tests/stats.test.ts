import { describe, it, expect } from 'vitest';
import { initialStats, applyEffect, applyModifiers } from '../src/game/systems/stats';

describe('stats', () => {
  it('initialStats returns 7 stats with expected start values', () => {
    const s = initialStats();
    expect(s.research).toBe(20);
    expect(s.stamina).toBe(60);
    expect(s.mental).toBe(70);
    expect(s.money).toBe(500_000);
    expect(Object.keys(s)).toHaveLength(7);
  });

  it('applyEffect clamps to min/max', () => {
    const s = initialStats();
    const boosted = applyEffect(s, { research: 200 });
    expect(boosted.research).toBe(100);
    const dropped = applyEffect(s, { mental: -200 });
    expect(dropped.mental).toBe(0);
  });

  it('burnout modifier reduces positive effects when stamina < 20', () => {
    const s = { ...initialStats(), stamina: 10 };
    const mod = applyModifiers(s, { research: 10 });
    expect(mod.research).toBeLessThan(10);
  });

  it('chore trap reduces research gain when chores >= 70', () => {
    const s = { ...initialStats(), chores: 80 };
    const mod = applyModifiers(s, { research: 10 });
    expect(mod.research).toBeLessThan(10);
  });

  it('paper efficiency boosts research when research*english >= 6000', () => {
    const s = { ...initialStats(), research: 80, english: 80 };
    const mod = applyModifiers(s, { research: 10 });
    expect(mod.research).toBeGreaterThan(10);
  });
});
