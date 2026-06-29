// =============================================================================
// Camada de cache do compêndio (Dexie)
// =============================================================================
// Guarda o dataset do 5etools no navegador, com timestamp, para o app abrir
// instantâneo e funcionar offline. O compêndio é gravado POR ARQUIVO na tabela
// `compendium` (ver db.js).
//
// API mantida estável para o useDataEngine:
//   readCache()  → { db, savedAt }   (db = objeto montado a partir das linhas)
//   writeCache(db), clearCache(), isFresh(savedAt)
//
// Extra para uso futuro (mobile/lazy): getCompendiumFile(key) lê uma única
// linha sem carregar o resto.
// -----------------------------------------------------------------------------

import db from './db';
import { CACHE_TTL } from './config';

const SAVED_AT_KEY = 'compendium:savedAt';

/**
 * Lê o compêndio cacheado e o timestamp.
 * Hoje monta o objeto `db` inteiro (todos os consumidores atuais esperam isso);
 * quando a memória no mobile virar gargalo, dá pra trocar por leitura seletiva
 * via getCompendiumFile sem mexer no resto da app.
 * @returns {Promise<{ db: object|null, savedAt: number|null }>}
 */
export async function readCache() {
  const [savedRow, rows] = await Promise.all([
    db.kv.get(SAVED_AT_KEY),
    db.compendium.toArray(),
  ]);
  const savedAt = savedRow?.value ?? null;
  if (!rows.length) return { db: null, savedAt };
  const dbObj = Object.fromEntries(rows.map((r) => [r.key, r.data]));
  return { db: dbObj, savedAt };
}

/**
 * Grava o compêndio (substitui o anterior) e carimba o timestamp atual.
 * @param {object} dbObj  objeto indexado por chave de arquivo (ex: { races, 'class-fighter' })
 * @returns {Promise<number>} savedAt
 */
export async function writeCache(dbObj) {
  const savedAt = Date.now();
  const entries = Object.entries(dbObj).map(([key, data]) => ({ key, data }));
  await db.transaction('rw', db.compendium, db.kv, async () => {
    await db.compendium.clear();
    await db.compendium.bulkPut(entries);
    await db.kv.put({ key: SAVED_AT_KEY, value: savedAt });
  });
  return savedAt;
}

/**
 * Limpa SÓ o compêndio + timestamp (usado pelo forceCacheUpdate).
 * Os personagens NÃO são tocados.
 */
export async function clearCache() {
  await db.transaction('rw', db.compendium, db.kv, async () => {
    await db.compendium.clear();
    await db.kv.delete(SAVED_AT_KEY);
  });
}

/**
 * Lê um único arquivo do compêndio sem carregar o resto.
 * (Ainda não usado — base para leitura lazy no mobile.)
 * @param {string} key  ex: 'races', 'class-fighter'
 * @returns {Promise<object|null>}
 */
export async function getCompendiumFile(key) {
  const row = await db.compendium.get(key);
  return row?.data ?? null;
}

/**
 * Diz se um timestamp ainda está dentro da validade (30 dias).
 * @param {number|null} savedAt
 */
export function isFresh(savedAt) {
  if (!savedAt) return false;
  return Date.now() - savedAt < CACHE_TTL;
}
