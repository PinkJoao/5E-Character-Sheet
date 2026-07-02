import { describe, it, expect } from 'vitest';
import {
  classLevelChoices,
  weaponMasteryCount,
  pruneChoicesAboveLevel,
} from './classFeatureChoices';

// Recorte de um fighter XPHB: features relevantes + tabela com Weapon Mastery.
const fighterObj = {
  classTableGroups: [
    {
      colLabels: ['Second Wind', 'Weapon Mastery'],
      rows: [
        ['2', '3'], ['2', '3'], ['2', '3'], ['3', '4'], ['3', '4'],
      ],
    },
  ],
};

const fighterParsed = {
  id: 'fighter',
  features: [
    { name: 'Fighting Style', level: 1 },
    { name: 'Weapon Mastery', level: 1 },
    { name: 'Second Wind', level: 1 },
    { name: 'Ability Score Improvement', level: 4 },
    { name: 'Epic Boon', level: 19 },
  ],
};

const rogueParsed = {
  id: 'rogue',
  features: [
    { name: 'Expertise', level: 1 },
    { name: 'Weapon Mastery', level: 1 },
    { name: 'Expertise', level: 6 },
    { name: 'Ability Score Improvement', level: 4 },
  ],
};

describe('classLevelChoices', () => {
  it('generates fighting style + weapon mastery at level 1', () => {
    const out = classLevelChoices(fighterParsed, fighterObj, 1);
    const ids = out.map((c) => c.id);
    expect(ids).toContain('feat@1'); // fighting style
    expect(ids).toContain('weaponMastery');
    expect(ids).not.toContain('feat@4'); // ainda não
    const fs = out.find((c) => c.id === 'feat@1');
    expect(fs.pool).toEqual({ type: 'feat', category: ['FS'] });
  });

  it('adds ASI feat choice at level 4 (category G)', () => {
    const out = classLevelChoices(fighterParsed, fighterObj, 4);
    const asi = out.find((c) => c.id === 'feat@4');
    expect(asi.pool.category).toEqual(['G']);
  });

  it('epic boon uses category EB', () => {
    const out = classLevelChoices(fighterParsed, fighterObj, 19);
    const boon = out.find((c) => c.id === 'feat@19');
    expect(boon.pool.category).toEqual(['EB']);
  });

  it('expertise appears per level with count 2', () => {
    const lvl1 = classLevelChoices(rogueParsed, {}, 1);
    expect(lvl1.filter((c) => c.kind === 'expertise')).toHaveLength(1);
    const lvl6 = classLevelChoices(rogueParsed, {}, 6);
    expect(lvl6.filter((c) => c.kind === 'expertise')).toHaveLength(2);
    expect(lvl6.find((c) => c.id === 'expertise@6').count).toBe(2);
  });

  it('paladin/ranger fighting style includes class variant category', () => {
    const paladin = { id: 'paladin', features: [{ name: 'Fighting Style', level: 2 }] };
    const out = classLevelChoices(paladin, {}, 2);
    expect(out[0].pool.category).toEqual(['FS', 'FS:P']);
  });
});

describe('weaponMasteryCount', () => {
  it('reads the class-table column (fighter scales)', () => {
    expect(weaponMasteryCount(fighterObj, 1)).toBe(3);
    expect(weaponMasteryCount(fighterObj, 4)).toBe(4);
  });

  it('defaults to 2 without a column (rogue/paladin/ranger)', () => {
    expect(weaponMasteryCount({}, 1)).toBe(2);
    expect(weaponMasteryCount(null, 5)).toBe(2);
  });
});

describe('pruneChoicesAboveLevel', () => {
  it('drops entries whose id level exceeds the new level', () => {
    const bag = {
      'skill': { kind: 'skill', picks: ['ath'] },
      'feat@4': { kind: 'feat', picks: ['Ability Score Improvement|XPHB'] },
      'feat@8': { kind: 'feat', picks: ['Grappler|XPHB'] },
      'expertise@6': { kind: 'expertise', picks: ['ste'] },
      'weaponMastery': { kind: 'weapon', picks: ['Longsword|XPHB'] },
    };
    const out = pruneChoicesAboveLevel(bag, 5);
    expect(Object.keys(out).sort()).toEqual(['feat@4', 'skill', 'weaponMastery']);
  });
});
