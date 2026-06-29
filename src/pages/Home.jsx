// Roster: lista de personagens salvos. Criar, abrir, duplicar, exportar,
// importar e deletar.
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useCharacterStore from '../store/characterStore';
import { totalLevel, classSummary } from '../schema/character';
import styles from './Home.module.css';

export default function Home() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const characters = useCharacterStore((s) => s.characters);
  const loaded = useCharacterStore((s) => s.loaded);
  const load = useCharacterStore((s) => s.load);
  const create = useCharacterStore((s) => s.create);
  const duplicate = useCharacterStore((s) => s.duplicate);
  const remove = useCharacterStore((s) => s.remove);
  const importJson = useCharacterStore((s) => s.importJson);

  useEffect(() => {
    if (!loaded) load();
  }, [loaded, load]);

  const handleCreate = async () => {
    const c = await create();
    navigate(`/build/${c.id}`);
  };

  const handleExport = (character) => {
    const blob = new Blob([JSON.stringify(character, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safe = (character.meta.name || 'personagem').replace(/[^\w.-]+/g, '_');
    a.href = url;
    a.download = `${safe}.builder.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite reimportar o mesmo arquivo
    if (!file) return;
    try {
      const raw = JSON.parse(await file.text());
      const imported = await importJson(raw);
      navigate(`/build/${imported.id}`);
    } catch (err) {
      console.error('Failed to import character', err);
      alert('Invalid file — could not import.');
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Characters</h1>
        <div className={styles.actions}>
          <button type="button" className={styles.ghost} onClick={() => fileInputRef.current?.click()}>
            Import
          </button>
          <button type="button" className={styles.primary} onClick={handleCreate}>
            + New character
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={handleImportFile}
          />
        </div>
      </header>

      {!loaded ? (
        <p className={styles.muted}>Loading…</p>
      ) : characters.length === 0 ? (
        <div className={styles.empty}>
          <p>No characters yet.</p>
          <button type="button" className={styles.primary} onClick={handleCreate}>
            Create your first
          </button>
        </div>
      ) : (
        <ul className={styles.list}>
          {characters.map((c) => {
            const summary = classSummary(c);
            return (
              <li key={c.id} className={styles.card}>
                <button
                  type="button"
                  className={styles.cardMain}
                  onClick={() => navigate(`/build/${c.id}`)}
                >
                  <span className={styles.avatar} aria-hidden="true">
                    {(c.meta.name || '?').charAt(0).toUpperCase()}
                  </span>
                  <span className={styles.info}>
                    <span className={styles.name}>{c.meta.name || 'Unnamed'}</span>
                    <span className={styles.sub}>
                      Level {totalLevel(c)}
                      {summary ? ` · ${summary}` : ''}
                    </span>
                  </span>
                </button>
                <div className={styles.cardActions}>
                  <button type="button" title="Duplicate" onClick={() => duplicate(c.id)}>
                    ⧉
                  </button>
                  <button type="button" title="Export JSON" onClick={() => handleExport(c)}>
                    ↓
                  </button>
                  <button
                    type="button"
                    title="Delete"
                    className={styles.danger}
                    onClick={() => {
                      if (confirm(`Delete "${c.meta.name}"? This can't be undone.`)) {
                        remove(c.id);
                      }
                    }}
                  >
                    ✕
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
