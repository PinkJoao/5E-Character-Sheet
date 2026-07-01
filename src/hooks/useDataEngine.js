// =============================================================================
// useDataEngine — "The Gatekeeper"
// =============================================================================
// Orquestra o carregamento do compêndio 5etools com a estratégia cache-first:
//
//   1. CHECKING  → lê o IndexedDB.
//   2a. Cache fresco (<30d) e COMPLETO (todos os arquivos do manifest)
//        → usa direto, ZERO rede.                                    → READY
//   2b. Vazio, expirado ou incompleto → "Updating...", baixa.        → UPDATING
//        - sucesso               → grava com timestamp novo.          → READY
//        - falha + havia cache   → graceful fallback (usa expirado).  → READY
//        - falha + sem cache     → erro fatal (única tela de erro).   → ERROR
//
// Expõe forceCacheUpdate() para o override manual (ALT+click na versão).
// -----------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from 'react';
import { readCache, writeCache, clearCache, isFresh, isComplete } from '../data/cache';
import { fetchCompendium } from '../data/fetcher';

/**
 * @typedef {'checking' | 'updating' | 'ready' | 'error'} EngineStatus
 */

export default function useDataEngine() {
  const [status, setStatus] = useState(/** @type {EngineStatus} */ ('checking'));
  const [db, setDb] = useState(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [stale, setStale] = useState(false); // true = rodando com cache expirado
  const [error, setError] = useState(null);

  // Evita corridas/duplo-disparo (StrictMode monta duas vezes em dev).
  const runningRef = useRef(false);

  /**
   * Baixa do zero e grava no cache. Em caso de falha, faz fallback para
   * `existingDb` se houver, senão entra em estado de erro fatal.
   * @param {object|null} existingDb
   */
  const downloadAndCache = useCallback(async (existingDb) => {
    setStatus('updating');
    setProgress({ done: 0, total: 0 });
    try {
      const fresh = await fetchCompendium({
        onProgress: (done, total) => setProgress({ done, total }),
      });
      await writeCache(fresh);
      setDb(fresh);
      setStale(false);
      setStatus('ready');
    } catch (err) {
      if (existingDb) {
        // Graceful fallback: offline com cache expirado → roda mesmo assim.
        console.warn('[useDataEngine] fetch falhou, usando cache expirado.', err);
        setDb(existingDb);
        setStale(true);
        setStatus('ready');
      } else {
        // Sem rede e sem cache: não há o que fazer.
        console.error('[useDataEngine] fetch falhou e não há cache.', err);
        setError(err);
        setStatus('error');
      }
    }
  }, []);

  /** Fluxo de boot cache-first. */
  const boot = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    setStatus('checking');
    try {
      const { db: cachedDb, savedAt } = await readCache();
      if (cachedDb && isFresh(savedAt) && isComplete(cachedDb)) {
        // Caminho feliz: cache válido e completo, abre instantâneo.
        setDb(cachedDb);
        setStale(false);
        setStatus('ready');
      } else {
        // Vazio, expirado ou INCOMPLETO (o app passou a pedir arquivos novos —
        // ex.: fluff-class-*): atualiza, com fallback para o que houver.
        await downloadAndCache(cachedDb);
      }
    } finally {
      runningRef.current = false;
    }
  }, [downloadAndCache]);

  /**
   * Override manual: limpa o cache e re-baixa ignorando a regra dos 30 dias.
   * Disparado pelo VersionTag (ALT+click / long-press).
   */
  const forceCacheUpdate = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    try {
      await clearCache();
      setError(null);
      await downloadAndCache(null); // ignora cache de propósito
    } finally {
      runningRef.current = false;
    }
  }, [downloadAndCache]);

  useEffect(() => {
    boot();
  }, [boot]);

  return {
    status, // 'checking' | 'updating' | 'ready' | 'error'
    db, // compêndio carregado (ou null)
    progress, // { done, total } durante o download
    stale, // true se rodando com cache expirado (offline)
    error, // Error em caso de falha fatal
    forceCacheUpdate, // () => Promise<void>
    retry: boot, // re-tentar após erro fatal
  };
}
