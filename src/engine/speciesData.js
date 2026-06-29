// =============================================================================
// Parser de dados de espécie (formato 5etools, edição 2024/XPHB)
// =============================================================================
// As raças XPHB são limpas (sem _copy) e têm campos estruturados. Extraímos o
// que o engine/expander precisa: tamanho, deslocamento, visão no escuro,
// perícias (fixas ou à escolha), idiomas, tags e os traços nomeados (que viram
// grants de "species-trait").
//
// (Conteúdo legado pré-2024 usa _copy/_versions e precisará de um resolver
// dedicado — fora do escopo deste passo, que foca em 2024.)
// -----------------------------------------------------------------------------

import { skillCode } from './classData';

/**
 * Normaliza um bloco de proficiências do 5etools (skills/languages):
 * cada item é { choose: {...} }, { any: N } ou { <nome>: true }.
 * @param {Array} arr
 * @param {(s: string) => string} mapFn
 * @returns {{ fixed: string[], choose: { from?: string[], count?: number, any?: number } | null }}
 */
function parseProfBlock(arr, mapFn) {
  const fixed = [];
  let choose = null;
  for (const entry of arr ?? []) {
    if (!entry || typeof entry !== 'object') continue;
    if (entry.choose) {
      choose = {
        from: (entry.choose.from ?? []).map(mapFn),
        count: entry.choose.count ?? 1,
      };
    } else if (entry.any != null) {
      choose = { any: entry.any };
    } else {
      for (const [k, v] of Object.entries(entry)) {
        if (v === true) fixed.push(mapFn(k));
      }
    }
  }
  return { fixed, choose };
}

/** Normaliza o deslocamento (número simples ou objeto) para { walk, ... }. */
function parseSpeed(speed) {
  if (speed == null) return { walk: 0 };
  if (typeof speed === 'number') return { walk: speed };
  return speed;
}

/**
 * Normaliza um objeto de espécie do 5etools.
 * @param {object} raceObj  ex: db.races.race.find(r => r.name==='Elf' && r.source==='XPHB')
 */
export function parseSpecies(raceObj) {
  if (!raceObj) return null;

  const traits = (raceObj.entries ?? [])
    .filter((e) => e && e.type === 'entries' && e.name)
    .map((e) => ({ name: e.name }));

  return {
    name: raceObj.name ?? '',
    source: raceObj.source ?? '',
    size: Array.isArray(raceObj.size) ? raceObj.size[0] : (raceObj.size ?? 'M'),
    speed: parseSpeed(raceObj.speed),
    darkvision: raceObj.darkvision ?? null,
    skills: parseProfBlock(raceObj.skillProficiencies, skillCode),
    languages: parseProfBlock(raceObj.languageProficiencies, (s) => s),
    resist: raceObj.resist ?? [],
    traitTags: raceObj.traitTags ?? [],
    creatureTypes: raceObj.creatureTypes ?? [],
    feats: raceObj.feats ?? null, // Humano 2024 concede um talento de origem
    traits, // traços nomeados → viram grants
  };
}
