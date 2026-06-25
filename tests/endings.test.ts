import { describe, it, expect } from 'vitest';
import { determineEnding, checkInstantEnding } from '../src/game/systems/endings';
import { initialStats, type Stats } from '../src/game/systems/stats';

describe('endings', () => {
  it('mental <= 8 triggers convenience_store instant ending', () => {
    const s: Stats = { ...initialStats(), mental: 5 };
    const e = checkInstantEnding(s);
    expect(e).not.toBeNull();
    expect(e!.id).toBe('convenience_store');
  });

  it('mental 15 + stamina 3 triggers infinite_hiatus', () => {
    const s: Stats = { ...initialStats(), mental: 12, stamina: 3 };
    const e = checkInstantEnding(s);
    expect(e).not.toBeNull();
    expect(e!.id).toBe('infinite_hiatus');
  });

  it('healthy stats → no instant ending', () => {
    const s = initialStats();
    expect(checkInstantEnding(s)).toBeNull();
  });

  it('fallback to lecturer when no ending matches', () => {
    const s: Stats = { ...initialStats(), research: 10, english: 10, network: 5 };
    const e = determineEnding(s);
    expect(e.id).toBe('lecturer');
  });

  it('high stats → tenure', () => {
    const s: Stats = {
      ...initialStats(),
      research: 90, english: 60, network: 50, mental: 40,
    };
    const e = determineEnding(s);
    expect(e.id).toBe('tenure');
  });
});
