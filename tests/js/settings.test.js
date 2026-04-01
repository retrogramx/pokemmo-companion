import { describe, it, expect, beforeEach } from 'vitest';
const { DEFAULT_SETTINGS, THEMES, FONT_SIZES, mergeSettings, getProgressStats } = require('../../src/js/settings.js');

describe('DEFAULT_SETTINGS', () => {
  it('has opacity 0.92', () => {
    expect(DEFAULT_SETTINGS.opacity).toBe(0.92);
  });

  it('has fontSize "default"', () => {
    expect(DEFAULT_SETTINGS.fontSize).toBe('default');
  });

  it('has theme "dark-purple"', () => {
    expect(DEFAULT_SETTINGS.theme).toBe('dark-purple');
  });

  it('has autoAdvanceStep true', () => {
    expect(DEFAULT_SETTINGS.autoAdvanceStep).toBe(true);
  });

  it('has autoAdvanceLocation true', () => {
    expect(DEFAULT_SETTINGS.autoAdvanceLocation).toBe(true);
  });

  it('has bannerAutoCollapse "off"', () => {
    expect(DEFAULT_SETTINGS.bannerAutoCollapse).toBe('off');
  });

  it('has hotkeys.toggle "Ctrl+Shift+G"', () => {
    expect(DEFAULT_SETTINGS.hotkeys.toggle).toBe('Ctrl+Shift+G');
  });

  it('has hotkeys.complete "Ctrl+Shift+D"', () => {
    expect(DEFAULT_SETTINGS.hotkeys.complete).toBe('Ctrl+Shift+D');
  });

  it('has hotkeys.expand "Ctrl+Shift+E"', () => {
    expect(DEFAULT_SETTINGS.hotkeys.expand).toBe('Ctrl+Shift+E');
  });
});

describe('THEMES', () => {
  it('has dark-purple theme', () => {
    expect(THEMES['dark-purple']).toBeDefined();
  });

  it('has dark-blue theme', () => {
    expect(THEMES['dark-blue']).toBeDefined();
  });

  it('has oled-black theme', () => {
    expect(THEMES['oled-black']).toBeDefined();
  });

  it('dark-purple has bg-deep and bg-panel', () => {
    expect(THEMES['dark-purple']['bg-deep']).toBeDefined();
    expect(THEMES['dark-purple']['bg-panel']).toBeDefined();
  });

  it('dark-blue has bg-deep and bg-panel', () => {
    expect(THEMES['dark-blue']['bg-deep']).toBeDefined();
    expect(THEMES['dark-blue']['bg-panel']).toBeDefined();
  });

  it('oled-black has bg-deep and bg-panel', () => {
    expect(THEMES['oled-black']['bg-deep']).toBeDefined();
    expect(THEMES['oled-black']['bg-panel']).toBeDefined();
  });
});

describe('mergeSettings', () => {
  it('returns deep copy of defaults when called with undefined', () => {
    const result = mergeSettings(undefined);
    expect(result).toEqual(DEFAULT_SETTINGS);
  });

  it('merges partial settings, keeping other defaults', () => {
    const result = mergeSettings({ opacity: 0.8 });
    expect(result.opacity).toBe(0.8);
    expect(result.fontSize).toBe(DEFAULT_SETTINGS.fontSize);
    expect(result.theme).toBe(DEFAULT_SETTINGS.theme);
    expect(result.hotkeys).toEqual(DEFAULT_SETTINGS.hotkeys);
  });

  it('merges nested hotkeys partially', () => {
    const result = mergeSettings({ hotkeys: { toggle: 'Ctrl+Shift+H' } });
    expect(result.hotkeys.toggle).toBe('Ctrl+Shift+H');
    expect(result.hotkeys.complete).toBe(DEFAULT_SETTINGS.hotkeys.complete);
    expect(result.hotkeys.expand).toBe(DEFAULT_SETTINGS.hotkeys.expand);
  });

  it('does NOT mutate DEFAULT_SETTINGS', () => {
    const original = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    mergeSettings({ opacity: 0.5, hotkeys: { toggle: 'Alt+Z' } });
    expect(DEFAULT_SETTINGS.opacity).toBe(original.opacity);
    expect(DEFAULT_SETTINGS.hotkeys.toggle).toBe(original.hotkeys.toggle);
  });
});

describe('getProgressStats', () => {
  it('returns correct counts with no completions', () => {
    const locations = [
      { name: 'A', steps: [{}, {}] },
      { name: 'B', steps: [{}] },
    ];
    const stats = getProgressStats(0, 3, 2, locations, {});
    expect(stats.stepsCompleted).toBe(0);
    expect(stats.totalSteps).toBe(3);
    expect(stats.stepsPercent).toBe(0);
    expect(stats.locationsVisited).toBe(0);
    expect(stats.totalLocations).toBe(2);
    expect(stats.pokemonCaught).toBe(0);
  });

  it('returns correct counts with some completions', () => {
    const locations = [
      { name: 'A', steps: [{}, {}] },
      { name: 'B', steps: [{}] },
    ];
    const completedSteps = { '0-0': true, '0-1': true };
    const caughtPokemon = { Tepig: true, Oshawott: true };
    const stats = getProgressStats(2, 3, 2, locations, caughtPokemon);
    expect(stats.stepsCompleted).toBe(2);
    expect(stats.totalSteps).toBe(3);
    expect(stats.stepsPercent).toBeCloseTo(66.67, 1);
    expect(stats.pokemonCaught).toBe(2);
  });

  it('returns 100 percent when all steps done', () => {
    const locations = [{ name: 'A', steps: [{}] }];
    const stats = getProgressStats(1, 1, 1, locations, {});
    expect(stats.stepsPercent).toBe(100);
  });

  it('handles zero totalSteps gracefully', () => {
    const stats = getProgressStats(0, 0, 0, [], {});
    expect(stats.stepsPercent).toBe(0);
  });
});
