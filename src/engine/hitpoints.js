// =============================================================================
// Pontos de vida máximos
// =============================================================================
// Para cada nível de cada classe: (rolagem ou "max" do dado de vida) + mod CON.
// O valor máximo do dado por classe vem do compêndio (class.hd) e é injetado
// como parâmetro, mantendo o engine puro e testável.
// -----------------------------------------------------------------------------

import { abilityModifier } from './math';
import { finalScores } from './abilities';

/**
 * @param {import('../schema/character').Character} character
 * @param {Record<string, number>} hitDieMax  classId → valor máximo do dado (ex: { fighter: 10 }).
 * @returns {number}
 */
export function maxHp(character, hitDieMax) {
  const conMod = abilityModifier(finalScores(character).con);
  let total = 0;

  for (const cls of character.classes ?? []) {
    const die = hitDieMax[cls.classId] ?? 0;
    for (let lvl = 1; lvl <= cls.level; lvl++) {
      const rolled = cls.hitPoints?.[lvl];
      const base = rolled === 'max' || rolled == null ? die : rolled;
      total += base + conMod;
    }
  }

  return total;
}
