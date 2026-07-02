import { describe, it, expect } from 'vitest';
import { parseChoices, collectAbilityPicks } from './choices';
import { collectAbilityBoosts, finalScores } from './abilities';
import { createCharacter } from '../schema/character';

// Feat "Ability Score Improvement" XPHB: duas alternativas (+2 em um OU +1 em dois).
const asiFeat = {
  name: 'Ability Score Improvement',
  ability: [
    { choose: { from: ['str', 'dex', 'con', 'int', 'wis', 'cha'], amount: 2 }, hidden: true },
    { choose: { from: ['str', 'dex', 'con', 'int', 'wis', 'cha'], count: 2 }, hidden: true },
  ],
};

// Feat General com ASI simples (Athlete: +1 em Str ou Dex).
const athleteFeat = { name: 'Athlete', ability: [{ choose: { from: ['str', 'dex'] } }] };

describe('parseChoices — ability field', () => {
  it('parses ASI feat alternatives (+2/one, +1/two)', () => {
    const [choice] = parseChoices(asiFeat);
    expect(choice.kind).toBe('ability');
    expect(choice.pool.alternatives).toEqual([
      { from: ['str', 'dex', 'con', 'int', 'wis', 'cha'], count: 1, amount: 2 },
      { from: ['str', 'dex', 'con', 'int', 'wis', 'cha'], count: 2, amount: 1 },
    ]);
  });

  it('parses single-alternative feats (Athlete)', () => {
    const [choice] = parseChoices(athleteFeat);
    expect(choice.pool.alternatives).toEqual([{ from: ['str', 'dex'], count: 1, amount: 1 }]);
  });

  it('ignores feats without ability chooses', () => {
    expect(parseChoices({ name: 'Alert' })).toEqual([]);
  });
});

describe('collectAbilityPicks', () => {
  it('collects picks from nested sub-bags (feat dentro de slot de ASI)', () => {
    const bag = {
      'feat@4': {
        kind: 'feat',
        picks: ['Ability Score Improvement|XPHB'],
        sub: {
          'Ability Score Improvement|XPHB': {
            'ability-0': { kind: 'ability', alt: 0, picks: [{ ability: 'str', amount: 2 }] },
          },
        },
      },
    };
    expect(collectAbilityPicks(bag)).toEqual([{ ability: 'str', amount: 2 }]);
  });

  it('ignores malformed picks', () => {
    const bag = { x: { kind: 'ability', picks: ['str', { ability: '', amount: 1 }, null] } };
    expect(collectAbilityPicks(bag)).toEqual([]);
  });
});

describe('collectAbilityBoosts + finalScores com ASI de classe', () => {
  it('applies class choice-bag boosts to final scores', () => {
    const ch = createCharacter({ name: 'T' });
    ch.scores.str = 15;
    ch.classes[0].choices = {
      'feat@4': {
        kind: 'feat',
        picks: ['Ability Score Improvement|XPHB'],
        sub: {
          'Ability Score Improvement|XPHB': {
            'ability-0': { kind: 'ability', alt: 0, picks: [{ ability: 'str', amount: 2 }] },
          },
        },
      },
    };
    expect(collectAbilityBoosts(ch)).toContainEqual({ ability: 'str', amount: 2 });
    expect(finalScores(ch).str).toBe(17);
  });
});
