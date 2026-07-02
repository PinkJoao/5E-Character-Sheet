// =============================================================================
// Resolve — ponte entre o compêndio (db) e o engine
// =============================================================================
// Os parsers e o buildContext são puros e esperam OBJETOS já localizados (ex:
// o objeto de classe do Fighter). Este módulo faz a ponte: dado o personagem +
// o `db` carregado do 5etools, localiza os objetos certos (classe, subclasse,
// espécie) e entrega o resultado derivado pronto para a UI.
//
// É aqui que o engine "encosta" nos dados ao vivo pela primeira vez (Fase 5a).
// Continua puro: recebe db + character, não toca em rede/cache/React.
// -----------------------------------------------------------------------------

import { buildContext } from './context';
import { deriveCharacter } from './index';
import { parseSpecies } from './speciesData';
import { collectOwned } from './proficiency';

/**
 * Localiza o objeto de classe do 5etools para um classId.
 * O arquivo `class-X.json` pode trazer várias entradas (reprints); preferimos a
 * que casa com a `source` do personagem e, na falta, a última (mais recente).
 * @param {object} db
 * @param {string} classId  ex: 'fighter'
 * @param {string} [source] ex: 'XPHB'
 * @returns {object|null}
 */
export function resolveClassObj(db, classId, source) {
  if (!db || !classId) return null;
  const file = db[`class-${classId}`];
  const list = file?.class;
  if (!Array.isArray(list) || list.length === 0) return null;
  if (source) {
    const match = list.find((c) => c.source === source);
    if (match) return match;
  }
  return list[list.length - 1];
}

/**
 * Localiza o objeto de subclasse (dentro do mesmo arquivo da classe).
 * @param {object} db
 * @param {string} classId
 * @param {string} subclassId      shortName da subclasse (ex: 'Champion')
 * @param {string} [subclassSource]
 * @returns {object|null}
 */
export function resolveSubclassObj(db, classId, subclassId, subclassSource) {
  if (!db || !classId || !subclassId) return null;
  const file = db[`class-${classId}`];
  const list = file?.subclass;
  if (!Array.isArray(list)) return null;
  let matches = list.filter((s) => s.shortName === subclassId);
  if (matches.length === 0) return null;
  if (subclassSource) {
    const bySource = matches.filter((s) => s.source === subclassSource);
    if (bySource.length) matches = bySource;
  }
  // Entre empates (ex: original TCE × stub "compat" _copy sem features),
  // prefere a versão COMPLETA (com subclassFeatures).
  return matches.findLast((s) => Array.isArray(s.subclassFeatures)) ?? matches[matches.length - 1];
}

/**
 * Localiza o objeto de espécie (raça) do 5etools.
 * @param {object} db
 * @param {string} id      nome em minúsculas (ex: 'elf')
 * @param {string} [source]
 * @returns {object|null}
 */
export function resolveRaceObj(db, id, source) {
  if (!db || !id) return null;
  const list = db.races?.race;
  if (!Array.isArray(list)) return null;
  const matches = list.filter((r) => r.name?.toLowerCase() === id.toLowerCase());
  if (matches.length === 0) return null;
  if (source) {
    const m = matches.find((r) => r.source === source);
    if (m) return m;
  }
  return matches[matches.length - 1];
}

/**
 * Localiza o objeto de um talento pelo id "Nome|Fonte".
 * @param {object} db
 * @param {string} id  ex: 'Alert|XPHB'
 * @returns {object|null}
 */
export function resolveFeat(db, id) {
  if (!db || !id) return null;
  const [name, source] = id.split('|');
  const list = db.feats?.feat;
  if (!Array.isArray(list)) return null;
  return list.find((f) => f.name === name && f.source === source) ?? null;
}

/**
 * Monta o mapa classId → objeto de classe 5etools, que o buildContext consome.
 * @param {import('../schema/character').Character} character
 * @param {object} db
 * @returns {Record<string, object>}
 */
export function buildClassDataById(character, db) {
  /** @type {Record<string, object>} */
  const out = {};
  for (const cls of character.classes ?? []) {
    if (!cls.classId) continue;
    const obj = resolveClassObj(db, cls.classId, cls.source);
    if (obj) out[cls.classId] = obj;
  }
  return out;
}

/**
 * Deriva o estado computado do personagem usando o compêndio ao vivo.
 * Quando o `db` ainda não chegou (ou faltam dados de classe), o engine degrada
 * com elegância: stats de atributo continuam valendo, HP/saves ficam nulos.
 * @param {import('../schema/character').Character} character
 * @param {object} db
 * @returns {ReturnType<typeof deriveCharacter>}
 */
export function deriveFromDb(character, db) {
  const classDataById = buildClassDataById(character, db);
  const ctx = buildContext(character, classDataById);

  // Idiomas FIXOS da espécie (ex: Goblin → Goblin). 2024 core (Elf/Orc XPHB) não
  // concede idiomas; aí fica só o Common garantido em collectLanguages.
  const raceObj = character.species
    ? resolveRaceObj(db, character.species.id, character.species.source)
    : null;
  const grantedLanguages = raceObj ? (parseSpecies(raceObj)?.languages?.fixed ?? []) : [];

  return deriveCharacter(character, { ...ctx, grantedLanguages });
}

/**
 * Tudo que a ficha já possui (p/ dedup no ChoiceList), resolvendo os idiomas
 * fixos da raça pelo db. Ver collectOwned.
 * @param {import('../schema/character').Character} character
 * @param {object} db
 */
export function ownedFromDb(character, db) {
  const raceObj = character.species
    ? resolveRaceObj(db, character.species.id, character.species.source)
    : null;
  const grantedLanguages = raceObj ? (parseSpecies(raceObj)?.languages?.fixed ?? []) : [];
  return collectOwned(character, grantedLanguages);
}
