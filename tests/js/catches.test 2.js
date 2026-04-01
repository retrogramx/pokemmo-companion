import { describe, it, expect } from 'vitest';
const { sortCatches, chooseBannerLayout, isCaught, toggleCaught } = require('../../src/js/catches.js');

describe('sortCatches', () => {
  it('returns empty array for empty input', () => {
    expect(sortCatches([])).toEqual([]);
  });

  it('places top25 entries before non-top25', () => {
    const catches = [
      { name: 'Rattata', top25: false },
      { name: 'Patrat', top25: true },
      { name: 'Pidove', top25: false },
      { name: 'Lillipup', top25: true },
    ];
    const result = sortCatches(catches);
    expect(result[0].top25).toBe(true);
    expect(result[1].top25).toBe(true);
    expect(result[2].top25).toBe(false);
    expect(result[3].top25).toBe(false);
  });

  it('preserves order within the same tier', () => {
    const catches = [
      { name: 'Patrat', top25: false },
      { name: 'Rattata', top25: false },
      { name: 'Pidove', top25: true },
      { name: 'Lillipup', top25: true },
    ];
    const result = sortCatches(catches);
    expect(result[0].name).toBe('Pidove');
    expect(result[1].name).toBe('Lillipup');
    expect(result[2].name).toBe('Patrat');
    expect(result[3].name).toBe('Rattata');
  });

  it('does not mutate the original array', () => {
    const catches = [
      { name: 'Rattata', top25: false },
      { name: 'Patrat', top25: true },
    ];
    const original = [...catches];
    sortCatches(catches);
    expect(catches[0].name).toBe(original[0].name);
    expect(catches[1].name).toBe(original[1].name);
  });
});

describe('chooseBannerLayout', () => {
  it('returns "none" for 0', () => {
    expect(chooseBannerLayout(0)).toBe('none');
  });

  it('returns "cards" for 1', () => {
    expect(chooseBannerLayout(1)).toBe('cards');
  });

  it('returns "cards" for 2', () => {
    expect(chooseBannerLayout(2)).toBe('cards');
  });

  it('returns "cards" for 3', () => {
    expect(chooseBannerLayout(3)).toBe('cards');
  });

  it('returns "icetray" for 4', () => {
    expect(chooseBannerLayout(4)).toBe('icetray');
  });

  it('returns "icetray" for large counts', () => {
    expect(chooseBannerLayout(10)).toBe('icetray');
  });
});

describe('isCaught', () => {
  it('returns false for uncaught pokemon', () => {
    expect(isCaught({}, 'Patrat')).toBe(false);
  });

  it('returns true for caught pokemon', () => {
    expect(isCaught({ patrat: true }, 'Patrat')).toBe(true);
  });

  it('uses lowercase key lookup', () => {
    expect(isCaught({ lillipup: true }, 'Lillipup')).toBe(true);
    expect(isCaught({ lillipup: true }, 'LILLIPUP')).toBe(true);
  });

  it('returns false when map is empty', () => {
    expect(isCaught({}, 'Pidove')).toBe(false);
  });
});

describe('toggleCaught', () => {
  it('adds entry when pokemon is not caught', () => {
    const result = toggleCaught({}, 'Patrat');
    expect(result['patrat']).toBe(true);
  });

  it('removes entry when pokemon is already caught', () => {
    const result = toggleCaught({ patrat: true }, 'Patrat');
    expect(result['patrat']).toBeUndefined();
  });

  it('returns a new object and does not mutate the original', () => {
    const original = { patrat: true };
    const result = toggleCaught(original, 'Patrat');
    expect(result).not.toBe(original);
    expect(original['patrat']).toBe(true);
  });

  it('uses lowercase key', () => {
    const result = toggleCaught({}, 'Lillipup');
    expect(result['lillipup']).toBe(true);
    expect(result['Lillipup']).toBeUndefined();
  });

  it('preserves other entries when toggling', () => {
    const result = toggleCaught({ patrat: true }, 'Lillipup');
    expect(result['patrat']).toBe(true);
    expect(result['lillipup']).toBe(true);
  });
});
