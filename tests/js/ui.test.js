import { describe, it, expect } from 'vitest';
const {
  TYPE_COLORS,
  TYPE_ABBR,
  makeTypeBadge,
  makeTypeBadgeMini,
  rarityHue,
  rarityColor,
  rarityBorder,
  rarityBg,
  buildStatPillsData,
} = require('../../src/js/ui.js');

// --- TYPE_COLORS ---

describe('TYPE_COLORS', () => {
  it('contains all 18 types', () => {
    const types = [
      'Normal', 'Fire', 'Water', 'Grass', 'Electric', 'Ice',
      'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
      'Rock', 'Ghost', 'Dark', 'Dragon', 'Steel', 'Fairy',
    ];
    for (const t of types) {
      expect(TYPE_COLORS).toHaveProperty(t);
    }
  });

  it('each type has bg and text properties', () => {
    for (const [name, val] of Object.entries(TYPE_COLORS)) {
      expect(val, `${name} missing bg`).toHaveProperty('bg');
      expect(val, `${name} missing text`).toHaveProperty('text');
    }
  });

  it('Fire has correct bg color', () => {
    expect(TYPE_COLORS.Fire.bg).toBe('#F08030');
  });

  it('Water has correct bg color', () => {
    expect(TYPE_COLORS.Water.bg).toBe('#6890F0');
  });

  it('Electric uses dark text color', () => {
    expect(TYPE_COLORS.Electric.text).toBe('#333');
  });

  it('Ice uses dark text color', () => {
    expect(TYPE_COLORS.Ice.text).toBe('#333');
  });

  it('Ground uses dark text color', () => {
    expect(TYPE_COLORS.Ground.text).toBe('#333');
  });

  it('Steel uses dark text color', () => {
    expect(TYPE_COLORS.Steel.text).toBe('#333');
  });

  it('Fairy uses dark text color', () => {
    expect(TYPE_COLORS.Fairy.text).toBe('#333');
  });

  it('Fire uses white text color', () => {
    expect(TYPE_COLORS.Fire.text).toBe('#fff');
  });

  it('Ghost uses white text color', () => {
    expect(TYPE_COLORS.Ghost.text).toBe('#fff');
  });
});

// --- TYPE_ABBR ---

describe('TYPE_ABBR', () => {
  it('contains all 18 types', () => {
    const types = [
      'Normal', 'Fire', 'Water', 'Grass', 'Electric', 'Ice',
      'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
      'Rock', 'Ghost', 'Dark', 'Dragon', 'Steel', 'Fairy',
    ];
    for (const t of types) {
      expect(TYPE_ABBR).toHaveProperty(t);
    }
  });

  it('each abbreviation is exactly 3 characters', () => {
    for (const [name, abbr] of Object.entries(TYPE_ABBR)) {
      expect(abbr.length, `${name} abbr should be 3 chars`).toBe(3);
    }
  });

  it('Normal abbreviates to NRM', () => {
    expect(TYPE_ABBR.Normal).toBe('NRM');
  });

  it('Fire abbreviates to FIR', () => {
    expect(TYPE_ABBR.Fire).toBe('FIR');
  });

  it('Water abbreviates to WTR', () => {
    expect(TYPE_ABBR.Water).toBe('WTR');
  });

  it('Grass abbreviates to GRS', () => {
    expect(TYPE_ABBR.Grass).toBe('GRS');
  });

  it('Electric abbreviates to ELC', () => {
    expect(TYPE_ABBR.Electric).toBe('ELC');
  });

  it('Ice abbreviates to ICE', () => {
    expect(TYPE_ABBR.Ice).toBe('ICE');
  });

  it('Fighting abbreviates to FTG', () => {
    expect(TYPE_ABBR.Fighting).toBe('FTG');
  });

  it('Poison abbreviates to PSN', () => {
    expect(TYPE_ABBR.Poison).toBe('PSN');
  });

  it('Ground abbreviates to GND', () => {
    expect(TYPE_ABBR.Ground).toBe('GND');
  });

  it('Flying abbreviates to FLY', () => {
    expect(TYPE_ABBR.Flying).toBe('FLY');
  });

  it('Psychic abbreviates to PSY', () => {
    expect(TYPE_ABBR.Psychic).toBe('PSY');
  });

  it('Bug abbreviates to BUG', () => {
    expect(TYPE_ABBR.Bug).toBe('BUG');
  });

  it('Rock abbreviates to RCK', () => {
    expect(TYPE_ABBR.Rock).toBe('RCK');
  });

  it('Ghost abbreviates to GHO', () => {
    expect(TYPE_ABBR.Ghost).toBe('GHO');
  });

  it('Dark abbreviates to DRK', () => {
    expect(TYPE_ABBR.Dark).toBe('DRK');
  });

  it('Dragon abbreviates to DRG', () => {
    expect(TYPE_ABBR.Dragon).toBe('DRG');
  });

  it('Steel abbreviates to STL', () => {
    expect(TYPE_ABBR.Steel).toBe('STL');
  });

  it('Fairy abbreviates to FRY', () => {
    expect(TYPE_ABBR.Fairy).toBe('FRY');
  });
});

// --- makeTypeBadge ---

describe('makeTypeBadge', () => {
  it('returns correct full name text for Fire', () => {
    const badge = makeTypeBadge('Fire');
    expect(badge.text).toBe('Fire');
  });

  it('returns correct bg for Fire', () => {
    const badge = makeTypeBadge('Fire');
    expect(badge.bg).toBe('#F08030');
  });

  it('returns correct textColor for Fire', () => {
    const badge = makeTypeBadge('Fire');
    expect(badge.textColor).toBe('#fff');
  });

  it('returns correct textColor for Electric (dark)', () => {
    const badge = makeTypeBadge('Electric');
    expect(badge.textColor).toBe('#333');
  });

  it('returns fallback for unknown type', () => {
    const badge = makeTypeBadge('Unknown');
    expect(badge.bg).toBe('#888');
    expect(badge.text).toBe('#fff');
  });

  it('returns fallback for empty string', () => {
    const badge = makeTypeBadge('');
    expect(badge.bg).toBe('#888');
  });

  it('works for all 18 types without throwing', () => {
    const types = [
      'Normal', 'Fire', 'Water', 'Grass', 'Electric', 'Ice',
      'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
      'Rock', 'Ghost', 'Dark', 'Dragon', 'Steel', 'Fairy',
    ];
    for (const t of types) {
      expect(() => makeTypeBadge(t)).not.toThrow();
      const badge = makeTypeBadge(t);
      expect(badge.bg).toBeTruthy();
      expect(badge.text).toBeTruthy();
    }
  });
});

// --- makeTypeBadgeMini ---

describe('makeTypeBadgeMini', () => {
  it('returns 3-letter abbr text for Fire', () => {
    const badge = makeTypeBadgeMini('Fire');
    expect(badge.text).toBe('FIR');
  });

  it('returns correct bg for Water', () => {
    const badge = makeTypeBadgeMini('Water');
    expect(badge.bg).toBe('#6890F0');
  });

  it('returns correct textColor for Ice (dark)', () => {
    const badge = makeTypeBadgeMini('Ice');
    expect(badge.textColor).toBe('#333');
  });

  it('returns fallback bg for unknown type', () => {
    const badge = makeTypeBadgeMini('Unknown');
    expect(badge.bg).toBe('#888');
  });

  it('falls back to first 3 chars uppercased for unknown type', () => {
    const badge = makeTypeBadgeMini('Xyz');
    expect(badge.text).toBe('XYZ');
  });

  it('falls back to first 3 chars uppercased for short unknown type', () => {
    const badge = makeTypeBadgeMini('AB');
    expect(badge.text).toBe('AB');
  });
});

// --- rarityHue ---

describe('rarityHue', () => {
  it('returns 120 for 100%', () => {
    expect(rarityHue(100)).toBe(120);
  });

  it('returns 0 for 0%', () => {
    expect(rarityHue(0)).toBe(0);
  });

  it('returns 60 for 50%', () => {
    expect(rarityHue(50)).toBe(60);
  });

  it('clamps to 120 for values above 100', () => {
    expect(rarityHue(200)).toBe(120);
  });

  it('clamps to 0 for negative values', () => {
    expect(rarityHue(-10)).toBe(0);
  });

  it('returns proportional hue for 25%', () => {
    expect(rarityHue(25)).toBe(30);
  });
});

// --- rarityColor ---

describe('rarityColor', () => {
  it('returns an hsl string', () => {
    const color = rarityColor(50);
    expect(color).toMatch(/^hsl\(/);
  });

  it('uses 75% saturation and 55% lightness', () => {
    const color = rarityColor(50);
    expect(color).toContain('75%');
    expect(color).toContain('55%');
  });

  it('returns hsl(0, 75%, 55%) for 0%', () => {
    expect(rarityColor(0)).toBe('hsl(0, 75%, 55%)');
  });

  it('returns hsl(120, 75%, 55%) for 100%', () => {
    expect(rarityColor(100)).toBe('hsl(120, 75%, 55%)');
  });

  it('clamps above 100', () => {
    expect(rarityColor(150)).toBe('hsl(120, 75%, 55%)');
  });

  it('clamps below 0', () => {
    expect(rarityColor(-5)).toBe('hsl(0, 75%, 55%)');
  });
});

// --- rarityBorder ---

describe('rarityBorder', () => {
  it('returns an hsla string', () => {
    const color = rarityBorder(50);
    expect(color).toMatch(/^hsla\(/);
  });

  it('uses 0.3 alpha', () => {
    expect(rarityBorder(50)).toContain('0.3');
  });

  it('uses correct hue for 100%', () => {
    expect(rarityBorder(100)).toBe('hsla(120, 75%, 55%, 0.3)');
  });

  it('uses correct hue for 0%', () => {
    expect(rarityBorder(0)).toBe('hsla(0, 75%, 55%, 0.3)');
  });
});

// --- rarityBg ---

describe('rarityBg', () => {
  it('returns an hsla string', () => {
    const color = rarityBg(50);
    expect(color).toMatch(/^hsla\(/);
  });

  it('uses 0.1 alpha', () => {
    expect(rarityBg(50)).toContain('0.1');
  });

  it('uses correct hue for 100%', () => {
    expect(rarityBg(100)).toBe('hsla(120, 75%, 55%, 0.1)');
  });

  it('uses correct hue for 0%', () => {
    expect(rarityBg(0)).toBe('hsla(0, 75%, 55%, 0.1)');
  });
});

// --- buildStatPillsData ---

describe('buildStatPillsData', () => {
  it('returns all input fields', () => {
    const data = buildStatPillsData(3, 15, 45);
    expect(data.encounter).toBe(3);
    expect(data.level).toBe(15);
    expect(data.percent).toBe(45);
  });

  it('includes percentColor derived from rarityColor', () => {
    const data = buildStatPillsData(1, 10, 100);
    expect(data.percentColor).toBe('hsl(120, 75%, 55%)');
  });

  it('includes percentColor for 0%', () => {
    const data = buildStatPillsData(1, 10, 0);
    expect(data.percentColor).toBe('hsl(0, 75%, 55%)');
  });

  it('returns an object with exactly 4 keys', () => {
    const data = buildStatPillsData(2, 20, 50);
    expect(Object.keys(data)).toHaveLength(4);
  });
});
