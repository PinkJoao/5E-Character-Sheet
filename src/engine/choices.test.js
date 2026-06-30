import { describe, it, expect } from 'vitest';
import { parseChoices, collectChoicePicks } from './choices';

// Formas reais (confirmadas no compêndio ao vivo).
const elf = { skillProficiencies: [{ choose: { from: ['insight', 'perception', 'survival'] } }] };
const human = {
  skillProficiencies: [{ any: 1 }],
  feats: [{ anyFromCategory: { category: ['O'], count: 1 } }],
};
const crafter = {
  toolProficiencies: [{ choose: { from: ["smith's tools", "mason's tools", "tinker's tools"], count: 3 } }],
};

describe('parseChoices', () => {
  it('Elf: escolha de perícia em lista (códigos + rótulos)', () => {
    const [c] = parseChoices(elf);
    expect(c.id).toBe('skill-0');
    expect(c.kind).toBe('skill');
    expect(c.count).toBe(1);
    expect(c.pool.type).toBe('list');
    expect(c.pool.options).toEqual([
      { value: 'ins', label: 'Insight' },
      { value: 'prc', label: 'Perception' },
      { value: 'sur', label: 'Survival' },
    ]);
  });

  it('Human: "any 1 skill" + escolha de talento de origem (recursivo)', () => {
    const out = parseChoices(human);
    const skill = out.find((c) => c.kind === 'skill');
    const feat = out.find((c) => c.kind === 'feat');
    expect(skill.pool).toEqual({ type: 'any', of: 'skill' });
    expect(feat.count).toBe(1);
    expect(feat.pool).toEqual({ type: 'feat', category: ['O'] });
  });

  it('Crafter: escolher 3 ferramentas de uma lista', () => {
    const [c] = parseChoices(crafter);
    expect(c.kind).toBe('tool');
    expect(c.count).toBe(3);
    expect(c.pool.options).toHaveLength(3);
    expect(c.pool.options[0]).toEqual({ value: "smith's tools", label: "Smith's Tools" });
  });

  it('Skilled: pool MISTO de skill+tool via skillToolLanguageProficiencies', () => {
    const skilled = {
      skillToolLanguageProficiencies: [{ choose: [{ from: ['anySkill', 'anyTool'], count: 3 }] }],
    };
    const [c] = parseChoices(skilled);
    expect(c.id).toBe('mixed-0');
    expect(c.kind).toBe('mixed');
    expect(c.count).toBe(3);
    expect(c.pool).toEqual({ type: 'any', of: ['skill', 'tool'] });
    expect(c.label).toBe('Choose 3 skill or tool');
  });
});

describe('collectChoicePicks — recursivo', () => {
  it('junta perícias do nível raso', () => {
    const bag = { 'skill-0': { kind: 'skill', picks: ['prc'] } };
    expect(collectChoicePicks(bag, 'skill')).toEqual(['prc']);
  });

  it('desce em sub-escolhas (talento escolhido com sua própria perícia)', () => {
    // Human escolheu a perícia Athletics (any) e o talento "Skilled" que deu Stealth.
    const bag = {
      'skill-0': { kind: 'skill', picks: ['ath'] },
      'feat-0': {
        kind: 'feat',
        picks: ['Skilled|XPHB'],
        sub: {
          'Skilled|XPHB': { 'skill-0': { kind: 'skill', picks: ['ste'] } },
        },
      },
    };
    expect(collectChoicePicks(bag, 'skill').sort()).toEqual(['ath', 'ste']);
    expect(collectChoicePicks(bag, 'feat')).toEqual(['Skilled|XPHB']);
  });

  it('picks heterogêneos {kind,value} de um pool misto', () => {
    const bag = {
      'mixed-0': {
        kind: 'mixed',
        picks: [
          { kind: 'skill', value: 'ath' },
          { kind: 'tool', value: "smith's tools" },
        ],
      },
    };
    expect(collectChoicePicks(bag, 'skill')).toEqual(['ath']);
    expect(collectChoicePicks(bag, 'tool')).toEqual(["smith's tools"]);
  });
});
