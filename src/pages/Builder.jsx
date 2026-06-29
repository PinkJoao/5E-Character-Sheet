// Placeholder do builder — a ficha completa chega na Fase 5.
// Já carrega o personagem real, edita o nome, e (Fase 4) escolhe a espécie pelo
// SelectorPanel, exercitando o ciclo de persistência.
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import useCharacterStore from '../store/characterStore';
import { useData } from '../data/dataContext';
import { totalLevel, classSummary } from '../schema/character';
import SelectorPanel from '../selector/SelectorPanel';
import raceEntity from '../selector/entities/race';

export default function Builder() {
  const { id } = useParams();
  const { db } = useData();

  const loaded = useCharacterStore((s) => s.loaded);
  const load = useCharacterStore((s) => s.load);
  const character = useCharacterStore((s) => s.getById(id));
  const save = useCharacterStore((s) => s.save);

  const [picking, setPicking] = useState(false);

  useEffect(() => {
    if (!loaded) load();
  }, [loaded, load]);

  if (!loaded) return <Shell>Loading…</Shell>;
  if (!character) {
    return (
      <Shell>
        <p>Character not found.</p>
        <Link to="/">← Back</Link>
      </Shell>
    );
  }

  const rename = (name) => save({ ...character, meta: { ...character.meta, name } });

  const pickSpecies = (race) => {
    save({
      ...character,
      species: { id: race.name.toLowerCase(), source: race.source, choices: {} },
    });
    setPicking(false);
  };

  const speciesLabel = character.species
    ? `${character.species.id} (${character.species.source})`
    : null;

  return (
    <Shell>
      <p>
        <Link to="/">← Characters</Link>
      </p>

      <label style={lbl}>Name</label>
      <input value={character.meta.name} onChange={(e) => rename(e.target.value)} style={input} />

      <label style={{ ...lbl, marginTop: 24 }}>Species</label>
      <button type="button" style={pickerBtn} onClick={() => setPicking(true)}>
        {speciesLabel ? (
          <span style={{ textTransform: 'capitalize' }}>{speciesLabel}</span>
        ) : (
          <span style={{ opacity: 0.6 }}>Choose species…</span>
        )}
      </button>

      <p style={{ marginTop: 24, opacity: 0.7 }}>
        Level {totalLevel(character)}
        {classSummary(character) ? ` · ${classSummary(character)}` : ' · no class set'}
      </p>

      <p style={{ marginTop: 24, opacity: 0.5, fontSize: 14 }}>
        Full Origin, Classes and Story tabs arrive in Phase 5.
      </p>

      {picking && (
        <SelectorPanel
          entity={raceEntity}
          db={db}
          currentId={
            character.species ? `${capitalize(character.species.id)}|${character.species.source}` : null
          }
          onSelect={pickSpecies}
          onClose={() => setPicking(false)}
        />
      )}
    </Shell>
  );
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

const lbl = { display: 'block', fontSize: 13, opacity: 0.7, marginBottom: 6 };
const input = {
  font: 'inherit',
  fontSize: 22,
  padding: '8px 12px',
  width: '100%',
  maxWidth: 420,
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--bg-soft)',
  color: 'var(--text-h)',
};
const pickerBtn = {
  font: 'inherit',
  fontSize: 16,
  padding: '12px 16px',
  width: '100%',
  maxWidth: 420,
  textAlign: 'left',
  borderRadius: 10,
  border: '1px solid var(--border)',
  background: 'var(--bg-soft)',
  color: 'var(--text-h)',
  cursor: 'pointer',
};

function Shell({ children }) {
  return <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px' }}>{children}</div>;
}
