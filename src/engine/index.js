// =============================================================================
// Engine — ponto de entrada da derivação do personagem
// =============================================================================
// Junta as peças puras num resumo derivado. Recebe um contexto com os dados que
// vêm do compêndio (dados de vida por classe, saves por classe, etc.); na Fase
// 3b o expander preencherá esse contexto a partir do 5etools.
// -----------------------------------------------------------------------------

import { ABILITIES, totalLevel } from '../schema/character';
import { proficiencyBonus } from './math';
import { finalScores, abilityModifiers } from './abilities';
import { maxHp } from './hitpoints';
import {
  collectSkillProficiencies,
  collectToolProficiencies,
  collectLanguages,
  skillBonus,
  saveBonus,
  SKILL_ABILITY,
} from './proficiency';

/**
 * @typedef {Object} DeriveContext
 * @property {Record<string, number>} [hitDieMax]      classId → valor máx. do dado.
 * @property {Set<string>|string[]} [proficientSaves]  saves proficientes (do expander).
 */

/**
 * Deriva o estado completo (computado) de um personagem.
 * @param {import('../schema/character').Character} character
 * @param {DeriveContext} [ctx]
 */
export function deriveCharacter(character, ctx = {}) {
  const level = totalLevel(character);
  const profBonus = proficiencyBonus(level);
  const scores = finalScores(character);
  const mods = abilityModifiers(character);

  const skillProfs = collectSkillProficiencies(character);
  const proficientSaves = [...new Set(ctx.proficientSaves ?? [])];

  const skills = {};
  for (const skill of Object.keys(SKILL_ABILITY)) {
    skills[skill] = {
      ability: SKILL_ABILITY[skill],
      proficiency: skillProfs[skill] ?? 0,
      bonus: skillBonus(character, skill, profBonus, skillProfs),
    };
  }

  const saves = {};
  for (const a of ABILITIES) {
    saves[a] = saveBonus(character, a, profBonus, proficientSaves);
  }

  // Breakdown por classe (para os cards Level / Hit Points expansíveis).
  const classBreakdown = (character.classes ?? []).map((c) => ({
    classId: c.classId,
    level: c.level,
    hitDie: ctx.hitDieMax?.[c.classId] ?? null,
  }));

  return {
    level,
    proficiencyBonus: profBonus,
    scores,
    modifiers: mods,
    maxHp:
      ctx.hitDieMax && Object.keys(ctx.hitDieMax).length > 0
        ? maxHp(character, ctx.hitDieMax)
        : null,
    skills,
    saves,
    proficientSaves,
    tools: collectToolProficiencies(character),
    languages: collectLanguages(character, ctx.grantedLanguages ?? []),
    classBreakdown,
  };
}

export * from './math';
export * from './abilities';
export * from './hitpoints';
export * from './proficiency';
export * from './classData';
export * from './subclassData';
export * from './speciesData';
export * from './context';
export * from './expander';
export * from './resolve';
export * from './choices';
