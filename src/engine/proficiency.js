// =============================================================================
// Proficiências — perícias e resistências (saves)
// =============================================================================
// Códigos de perícia seguem a convenção Foundry/5etools (acr, ath, prc...).
// O nível de proficiência é 0 (nenhum), 1 (proficiente) ou 2 (expertise).
// -----------------------------------------------------------------------------

import { abilityModifier } from './math';
import { finalScores } from './abilities';

/** Perícia → habilidade padrão (regras 2024). */
export const SKILL_ABILITY = {
  acr: 'dex', // Acrobatics
  ani: 'wis', // Animal Handling
  arc: 'int', // Arcana
  ath: 'str', // Athletics
  dec: 'cha', // Deception
  his: 'int', // History
  ins: 'wis', // Insight
  itm: 'cha', // Intimidation
  inv: 'int', // Investigation
  med: 'wis', // Medicine
  nat: 'int', // Nature
  prc: 'wis', // Perception
  prf: 'cha', // Performance
  per: 'cha', // Persuasion
  rel: 'int', // Religion
  slt: 'dex', // Sleight of Hand
  ste: 'dex', // Stealth
  sur: 'wis', // Survival
};

/**
 * Bônus total dado o modificador, o bônus de proficiência e o nível (0/1/2).
 * @param {number} mod
 * @param {number} profBonus
 * @param {0|1|2} level
 * @returns {number}
 */
export function profValueBonus(mod, profBonus, level) {
  return mod + profBonus * level;
}

/**
 * Coleta o nível de proficiência de cada perícia a partir das DECISÕES do
 * personagem (origem custom + escolhas de classe). Proficiências fixas vindas
 * de espécie/classe (não escolhidas) entram pelo expander, na Fase 3b.
 * @param {import('../schema/character').Character} character
 * @returns {Record<string, 0|1|2>}
 */
export function collectSkillProficiencies(character) {
  /** @type {Record<string, 0|1|2>} */
  const out = {};
  const mark = (skill, level) => {
    out[skill] = Math.max(out[skill] ?? 0, level);
  };

  for (const s of character.origin?.skillProficiencies ?? []) mark(s, 1);
  // Perícias escolhidas na espécie (ex: Elfo 2024 escolhe 1 de insight/perception/survival)
  for (const s of character.species?.choices?.skillProficiencies ?? []) mark(s, 1);

  for (const cls of character.classes ?? []) {
    for (const choices of Object.values(cls.choices ?? {})) {
      for (const choice of choices) {
        if (choice.type === 'skill-proficiency') {
          for (const s of choice.skills ?? []) mark(s, 1);
        } else if (choice.type === 'skill-expertise') {
          for (const s of choice.skills ?? []) mark(s, 2);
        }
      }
    }
  }

  return out;
}

/**
 * Bônus de uma perícia para o personagem.
 * @param {import('../schema/character').Character} character
 * @param {string} skill  código (ex: 'ath')
 * @param {number} profBonus
 * @param {Record<string, 0|1|2>} [skillProfs]  opcional (evita recomputar)
 * @returns {number}
 */
export function skillBonus(character, skill, profBonus, skillProfs) {
  const profs = skillProfs ?? collectSkillProficiencies(character);
  const ability = SKILL_ABILITY[skill];
  const mod = abilityModifier(finalScores(character)[ability]);
  return profValueBonus(mod, profBonus, profs[skill] ?? 0);
}

/**
 * Bônus de save de uma habilidade.
 * @param {import('../schema/character').Character} character
 * @param {import('../schema/character').Ability} ability
 * @param {number} profBonus
 * @param {Set<string>|string[]} proficientSaves  habilidades com save proficiente
 * @returns {number}
 */
export function saveBonus(character, ability, profBonus, proficientSaves) {
  const set = proficientSaves instanceof Set ? proficientSaves : new Set(proficientSaves);
  const mod = abilityModifier(finalScores(character)[ability]);
  return mod + (set.has(ability) ? profBonus : 0);
}
