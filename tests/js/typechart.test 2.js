import { describe, it, expect } from 'vitest';
const { getEffectiveness, getDefensiveMatchups } = require('../../src/js/typechart.js');

const typesJson = require('../../src/data/types.json');

describe('getEffectiveness', () => {
  it('returns 2 for super effective matchup (Fire vs Grass)', () => {
    expect(getEffectiveness(typesJson.chart, 'Fire', 'Grass')).toBe(2);
  });

  it('returns 0.5 for not very effective matchup (Fire vs Water)', () => {
    expect(getEffectiveness(typesJson.chart, 'Fire', 'Water')).toBe(0.5);
  });

  it('returns 0 for immune matchup (Normal vs Ghost)', () => {
    expect(getEffectiveness(typesJson.chart, 'Normal', 'Ghost')).toBe(0);
  });

  it('returns 1 for neutral matchup (Normal vs Normal)', () => {
    expect(getEffectiveness(typesJson.chart, 'Normal', 'Normal')).toBe(1);
  });

  it('returns 1 for unknown attacker type', () => {
    expect(getEffectiveness(typesJson.chart, 'UnknownType', 'Fire')).toBe(1);
  });

  it('returns 1 for unknown defender type', () => {
    expect(getEffectiveness(typesJson.chart, 'Fire', 'UnknownType')).toBe(1);
  });
});

describe('getDefensiveMatchups', () => {
  it('returns weaknesses for single-type Water defender (Electric 2x)', () => {
    const result = getDefensiveMatchups(typesJson.chart, typesJson.types, ['Water']);
    const weak = result.weak.map(e => e.type);
    expect(weak).toContain('Electric');
    expect(weak).toContain('Grass');
  });

  it('returns resistances for single-type Water defender (Fire 0.5x)', () => {
    const result = getDefensiveMatchups(typesJson.chart, typesJson.types, ['Water']);
    const resist = result.resist.map(e => e.type);
    expect(resist).toContain('Fire');
    expect(resist).toContain('Ice');
    expect(resist).toContain('Water');
    expect(resist).toContain('Steel');
  });

  it('returns immunities for Ghost type (Normal immune)', () => {
    const result = getDefensiveMatchups(typesJson.chart, typesJson.types, ['Ghost']);
    const immune = result.immune.map(e => e.type);
    expect(immune).toContain('Normal');
    expect(immune).toContain('Fighting');
  });

  it('combines multipliers for dual-type Water/Ground: Grass is 4x', () => {
    const result = getDefensiveMatchups(typesJson.chart, typesJson.types, ['Water', 'Ground']);
    const grassEntry = result.weak.find(e => e.type === 'Grass');
    expect(grassEntry).toBeDefined();
    expect(grassEntry.multiplier).toBe(4);
  });

  it('combines multipliers for dual-type Water/Ground: Electric is 0x (immune)', () => {
    const result = getDefensiveMatchups(typesJson.chart, typesJson.types, ['Water', 'Ground']);
    const electricEntry = result.immune.find(e => e.type === 'Electric');
    expect(electricEntry).toBeDefined();
    expect(electricEntry.multiplier).toBe(0);
  });

  it('weak array is sorted descending by multiplier', () => {
    const result = getDefensiveMatchups(typesJson.chart, typesJson.types, ['Water', 'Ground']);
    for (let i = 1; i < result.weak.length; i++) {
      expect(result.weak[i - 1].multiplier).toBeGreaterThanOrEqual(result.weak[i].multiplier);
    }
  });

  it('resist array is sorted ascending by multiplier', () => {
    const result = getDefensiveMatchups(typesJson.chart, typesJson.types, ['Water']);
    for (let i = 1; i < result.resist.length; i++) {
      expect(result.resist[i - 1].multiplier).toBeLessThanOrEqual(result.resist[i].multiplier);
    }
  });

  it('neutral array contains types with 1x multiplier', () => {
    const result = getDefensiveMatchups(typesJson.chart, typesJson.types, ['Water']);
    const normalEntry = result.neutral.find(e => e.type === 'Normal');
    expect(normalEntry).toBeDefined();
    expect(normalEntry.multiplier).toBe(1);
  });
});
