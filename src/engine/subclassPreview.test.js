import { describe, it, expect } from 'vitest';
import { resolveSubclassEntries } from './subclassPreview';

// db mínimo no formato do 5etools: a subclasse referencia features por string, e
// uma feature de nível 3 inclui sub-features via `refSubclassFeature`.
const db = {
  'class-fighter': {
    subclassFeature: [
      {
        name: 'Battle Master',
        subclassShortName: 'Battle Master',
        subclassSource: 'XPHB',
        level: 3,
        entries: [
          'Intro text.',
          { type: 'refSubclassFeature', subclassFeature: 'Combat Superiority|Fighter|XPHB|Battle Master|XPHB|3' },
        ],
      },
      {
        name: 'Combat Superiority',
        subclassShortName: 'Battle Master',
        subclassSource: 'XPHB',
        level: 3,
        entries: ['You learn maneuvers fueled by Superiority Dice.'],
      },
      {
        name: 'Know Your Enemy',
        subclassShortName: 'Battle Master',
        subclassSource: 'XPHB',
        level: 7,
        entries: ['You can study another creature.'],
      },
    ],
  },
};

const subclass = {
  shortName: 'Battle Master',
  source: 'XPHB',
  subclassFeatures: [
    'Battle Master|Fighter|XPHB|Battle Master|XPHB|3',
    'Know Your Enemy|Fighter|XPHB|Battle Master|XPHB|7',
  ],
};

describe('resolveSubclassEntries', () => {
  it('resolves top-level features with level headings', () => {
    const out = resolveSubclassEntries(db, 'fighter', subclass);
    expect(out.map((s) => s.name)).toEqual(['Level 3: Battle Master', 'Level 7: Know Your Enemy']);
  });

  it('inlines nested refSubclassFeature', () => {
    const out = resolveSubclassEntries(db, 'fighter', subclass);
    const lvl3 = out[0];
    // O último entry do nível 3 deve ser a sub-feature resolvida (não a ref crua).
    const nested = lvl3.entries.find((e) => e && e.name === 'Combat Superiority');
    expect(nested).toBeTruthy();
    expect(nested.entries[0]).toMatch(/Superiority Dice/);
  });

  it('does not duplicate a feature already rendered', () => {
    // Se a sub-feature também estivesse no topo, não deveria aparecer duas vezes.
    const withDup = {
      ...subclass,
      subclassFeatures: [
        ...subclass.subclassFeatures,
        'Combat Superiority|Fighter|XPHB|Battle Master|XPHB|3',
      ],
    };
    const out = resolveSubclassEntries(db, 'fighter', withDup);
    const names = out.map((s) => s.name);
    expect(names).not.toContain('Level 3: Combat Superiority');
  });

  it('returns [] when data missing', () => {
    expect(resolveSubclassEntries({}, 'fighter', subclass)).toEqual([]);
    expect(resolveSubclassEntries(db, 'fighter', {})).toEqual([]);
  });
});
