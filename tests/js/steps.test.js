import { describe, it, expect } from 'vitest';
import { highlightText, getNextStep, buildStepState } from '../../src/js/steps.js';

describe('highlightText', () => {
  it('wraps items in hl-item spans', () => {
    const result = highlightText('Get a Potion', { items: ['Potion'] });
    expect(result).toContain('<span class="hl-item">Potion</span>');
  });

  it('wraps battles in hl-battle spans', () => {
    const result = highlightText('Battle Bianca', { battles: ['Bianca'] });
    expect(result).toContain('<span class="hl-battle">Bianca</span>');
  });

  it('wraps pokemon in hl-pokemon spans', () => {
    const result = highlightText('Pick Tepig', { pokemon: ['Tepig'] });
    expect(result).toContain('<span class="hl-pokemon">Tepig</span>');
  });

  it('returns plain text when no tags', () => {
    const result = highlightText('Just walk north', undefined);
    expect(result).toBe('Just walk north');
  });

  it('handles multiple tags of same type', () => {
    const result = highlightText('Get Potion and Pokeball', { items: ['Potion', 'Pokeball'] });
    expect(result).toContain('<span class="hl-item">Potion</span>');
    expect(result).toContain('<span class="hl-item">Pokeball</span>');
  });
});

describe('getNextStep', () => {
  const locations = [
    { name: 'A', steps: [{ text: 's1' }, { text: 's2' }] },
    { name: 'B', steps: [{ text: 's3' }] },
  ];

  it('advances to next step in same location', () => {
    expect(getNextStep(locations, 0, 0)).toEqual({ location: 0, step: 1 });
  });

  it('advances to next location when at last step', () => {
    expect(getNextStep(locations, 0, 1)).toEqual({ location: 1, step: 0 });
  });

  it('returns null at end of all locations', () => {
    expect(getNextStep(locations, 1, 0)).toBeNull();
  });
});

describe('buildStepState', () => {
  it('creates state with correct current step', () => {
    const state = buildStepState(2, { '0-0': true }, 0);
    expect(state[0]).toEqual({ done: true, current: false });
    expect(state[1]).toEqual({ done: false, current: true });
  });

  it('marks first incomplete step as current', () => {
    const state = buildStepState(3, {}, 0);
    expect(state[0]).toEqual({ done: false, current: true });
    expect(state[1]).toEqual({ done: false, current: false });
  });
});
