import { describe, expect, it } from 'vitest';
import { WAVE_SPAWN_RULES } from '../enemies';

describe('zombie wave rules', () => {
  it('waves 1-5 only spawn zombie archetypes', () => {
    const allowed = new Set(['rusher', 'spitter', 'brute', 'snare_rat']);

    for (const rule of WAVE_SPAWN_RULES) {
      if (rule.wave > 5) {
        continue;
      }

      for (const archetype of rule.archetypes) {
        expect(allowed.has(archetype)).toBe(true);
      }
    }
  });

  it('wave 6 is reserved for miniboss only', () => {
    const wave6 = WAVE_SPAWN_RULES.find((rule) => rule.wave === 6);

    expect(wave6).toBeDefined();
    expect(wave6?.archetypes).toEqual(['miniboss_mechacat']);
  });
});
