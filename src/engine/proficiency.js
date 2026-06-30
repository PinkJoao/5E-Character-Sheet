// =============================================================================
// Proficiências — perícias e resistências (saves)
// =============================================================================
// Códigos de perícia seguem a convenção Foundry/5etools (acr, ath, prc...).
// O nível de proficiência é 0 (nenhum), 1 (proficiente) ou 2 (expertise).
// -----------------------------------------------------------------------------

import { abilityModifier } from './math';
import { finalScores } from './abilities';
import { collectChoicePicks, titleCase } from './choices';

// Tokens de idioma que NÃO são línguas reais (escolha/discrição do mestre).
const LANGUAGE_TOKENS = new Set(['other', 'any', 'anystandard', 'anyexotic', 'anyrare']);

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
  // Escolhas de espécie e do talento de origem, via choice-bag genérico (recursivo:
  // pega também perícias de uma feature concedida dentro de outra escolha).
  for (const s of collectChoicePicks(character.species?.choices, 'skill')) mark(s, 1);
  for (const s of collectChoicePicks(character.origin?.originFeat?.choices, 'skill')) mark(s, 1);

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
 * Coleta TODAS as proficiências de ferramenta: origem (Background) + escolhas
 * (espécie/talento, recursivo). Dedup por nome.
 * @param {import('../schema/character').Character} character
 * @returns {string[]}
 */
export function collectToolProficiencies(character) {
  const out = new Set();
  for (const t of character.origin?.toolProficiencies ?? []) out.add(t);
  for (const t of collectChoicePicks(character.species?.choices, 'tool')) out.add(t);
  for (const t of collectChoicePicks(character.origin?.originFeat?.choices, 'tool')) out.add(t);
  return [...out];
}

/**
 * Coleta TODOS os idiomas conhecidos. Regra de ouro: TODO personagem sabe
 * Common (raças 2024 deixaram de conceder; passou p/ background). Junta também
 * os idiomas FIXOS da raça (grantedLanguages), a origem e as escolhas. Normaliza
 * o caixa (ex: "elvish" → "Elvish") e descarta tokens ("other", "anyStandard"…).
 * @param {import('../schema/character').Character} character
 * @param {string[]} [grantedLanguages]  idiomas fixos da espécie (do db).
 * @returns {string[]}
 */
export function collectLanguages(character, grantedLanguages = []) {
  const out = new Set(['Common']);
  const add = (l) => {
    if (l && !LANGUAGE_TOKENS.has(String(l).toLowerCase())) out.add(titleCase(l));
  };
  for (const l of grantedLanguages) add(l);
  for (const l of character.origin?.languages ?? []) add(l);
  for (const l of collectChoicePicks(character.species?.choices, 'language')) add(l);
  for (const l of collectChoicePicks(character.origin?.originFeat?.choices, 'language')) add(l);
  return [...out];
}

/** Ids de TODOS os talentos já tomados (origem + escolhas + classe). */
export function collectFeatIds(character) {
  const out = [];
  const of = character.origin?.originFeat;
  if (of?.id) out.push(`${of.id}|${of.source}`);
  out.push(...collectChoicePicks(character.species?.choices, 'feat'));
  out.push(...collectChoicePicks(character.origin?.originFeat?.choices, 'feat'));
  for (const cls of character.classes ?? []) {
    for (const choices of Object.values(cls.choices ?? {})) {
      for (const ch of choices) {
        if (ch.type === 'feat' && ch.feat?.id) out.push(`${ch.feat.id}|${ch.feat.source}`);
        out.push(...collectChoicePicks(ch.feat?.choices, 'feat'));
      }
    }
  }
  return out;
}

/**
 * Tudo que o personagem JÁ POSSUI, por tipo — para o ChoiceList não deixar
 * escolher a mesma coisa duas vezes (dedup pela ficha inteira). tools/languages
 * em minúsculas (comparação case-insensitive); skills em código; feats por id.
 * @param {import('../schema/character').Character} character
 * @param {string[]} [grantedLanguages]  idiomas fixos da raça (do db).
 */
export function collectOwned(character, grantedLanguages = []) {
  return {
    skills: new Set(Object.keys(collectSkillProficiencies(character))),
    tools: new Set(collectToolProficiencies(character).map((t) => t.toLowerCase())),
    languages: new Set(collectLanguages(character, grantedLanguages).map((l) => l.toLowerCase())),
    feats: new Set(collectFeatIds(character)),
  };
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
