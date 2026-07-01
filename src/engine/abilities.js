// =============================================================================
// Habilidades — scores finais a partir das DECISÕES
// =============================================================================
// Score final = base + soma de todos os boosts escolhidos (origem, espécie,
// ASIs de classe, e ASI embutido em talentos). Sem cache, sem compêndio:
// trabalha só com o que o personagem registra.
// -----------------------------------------------------------------------------

import { ABILITIES } from '../schema/character';
import { abilityModifier } from './math';

/**
 * Coleta todos os boosts de atributo registrados no personagem.
 * @param {import('../schema/character').Character} character
 * @returns {import('../schema/character').AbilityBoost[]}
 */
export function collectAbilityBoosts(character) {
  /** @type {import('../schema/character').AbilityBoost[]} */
  const boosts = [];

  // Origem custom
  if (character.origin?.abilityBoosts) boosts.push(...character.origin.abilityBoosts);
  // ASI embutido no talento de origem
  const originFeatBoosts = character.origin?.originFeat?.choices?.abilityBoosts;
  if (Array.isArray(originFeatBoosts)) boosts.push(...originFeatBoosts);

  // Espécie (linhagem 2024 normalmente não dá boost, mas o campo existe p/ legado)
  const speciesBoosts = character.species?.choices?.abilityBoosts;
  if (Array.isArray(speciesBoosts)) boosts.push(...speciesBoosts);

  // (ASIs de classe e talentos com ASI embutido entram no 5c-2b, via choice-bag.)

  return boosts;
}

/**
 * Scores finais (base + boosts).
 * @param {import('../schema/character').Character} character
 * @returns {import('../schema/character').AbilityScores}
 */
export function finalScores(character) {
  const out = { ...character.scores };
  for (const { ability, amount } of collectAbilityBoosts(character)) {
    if (ability in out) out[ability] += amount;
  }
  return out;
}

/**
 * Modificadores finais de cada habilidade.
 * @param {import('../schema/character').Character} character
 * @returns {Record<import('../schema/character').Ability, number>}
 */
export function abilityModifiers(character) {
  const scores = finalScores(character);
  /** @type {Record<string, number>} */
  const mods = {};
  for (const a of ABILITIES) mods[a] = abilityModifier(scores[a]);
  return mods;
}
