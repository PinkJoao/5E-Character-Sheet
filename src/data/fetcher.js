// =============================================================================
// Fetcher do compêndio 5etools
// =============================================================================
// Baixa todos os arquivos do manifesto em paralelo, tentando cada mirror em
// ordem até um responder. Lança se nenhum mirror funcionar — quem chama
// (useDataEngine) decide o que fazer (graceful fallback para cache expirado).
// -----------------------------------------------------------------------------

import { MIRRORS, buildManifest } from './config';

/** Busca um único caminho tentando cada mirror em ordem. */
async function fetchWithMirrors(path, signal) {
  let lastError;
  for (const base of MIRRORS) {
    try {
      const res = await fetch(base + path, { signal });
      if (!res.ok) throw new Error(`HTTP ${res.status} em ${base + path}`);
      return await res.json();
    } catch (err) {
      lastError = err;
      // tenta o próximo mirror
    }
  }
  throw lastError ?? new Error(`Falha ao buscar ${path}`);
}

/**
 * Baixa o compêndio inteiro.
 * @param {object} [options]
 * @param {(done: number, total: number) => void} [options.onProgress]
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<object>} db indexado por chave (ex: db.races, db['class-fighter'])
 */
export async function fetchCompendium({ onProgress, signal } = {}) {
  const manifest = buildManifest();
  const total = manifest.length;
  let done = 0;

  const entries = await Promise.all(
    manifest.map(async ({ key, path }) => {
      const data = await fetchWithMirrors(path, signal);
      done += 1;
      onProgress?.(done, total);
      return [key, data];
    })
  );

  return Object.fromEntries(entries);
}
