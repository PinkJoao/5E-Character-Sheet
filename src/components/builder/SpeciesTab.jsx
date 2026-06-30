// =============================================================================
// SpeciesTab — escolha de espécie + traços + SUB-ESCOLHAS
// =============================================================================
// Mostra o seletor de espécie (PickerField), um resumo dos traços da espécie e,
// principalmente, as sub-escolhas que ela concede (ex: a perícia do Elfo, ou o
// talento de origem do Humano — que recursa nas escolhas DELE) via ChoiceList.
// -----------------------------------------------------------------------------

import { useState } from 'react';
import { parseChoices } from '../../engine/choices';
import { parseSpecies } from '../../engine/speciesData';
import { resolveRaceObj, ownedFromDb } from '../../engine/resolve';
import PickerField from '../common/PickerField';
import DetailView from '../common/DetailView';
import raceEntity from '../../selector/entities/race';
import ChoiceList from './ChoiceList';
import styles from './SpeciesTab.module.css';

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

export default function SpeciesTab({ character, db, onPick, onClear, onChangeChoices }) {
  const [showAbout, setShowAbout] = useState(false);
  const species = character.species;
  const raceObj = species ? resolveRaceObj(db, species.id, species.source) : null;
  const parsed = raceObj ? parseSpecies(raceObj) : null;
  const choices = raceObj ? parseChoices(raceObj) : [];

  return (
    <div className={styles.tab}>
      <section className={styles.section}>
        <span className={styles.label}>Species</span>
        <PickerField
          entity={raceEntity}
          db={db}
          current={
            species
              ? { label: species.id, source: species.source, id: `${capitalize(species.id)}|${species.source}` }
              : null
          }
          placeholder="Choose species…"
          onSelect={onPick}
          onClear={onClear}
        />
      </section>

      {parsed && (
        <section className={styles.section}>
          <div className={styles.meta}>
            <span className={styles.metaItem}>
              <b>Size</b> {parsed.size}
            </span>
            <span className={styles.metaItem}>
              <b>Speed</b> {parsed.speed.walk ?? 0} ft
            </span>
            {parsed.darkvision && (
              <span className={styles.metaItem}>
                <b>Darkvision</b> {parsed.darkvision} ft
              </span>
            )}
          </div>
          <button type="button" className={styles.aboutToggle} onClick={() => setShowAbout((v) => !v)}>
            {showAbout ? '▾ Hide details' : '▸ About this species'}
          </button>
          {showAbout && (
            <div className={styles.about}>
              <DetailView entity={raceEntity} raw={raceObj} db={db} />
            </div>
          )}
        </section>
      )}

      {choices.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Species Choices</h3>
          <ChoiceList
            choices={choices}
            bag={species.choices}
            onChange={onChangeChoices}
            db={db}
            owned={ownedFromDb(character, db)}
          />
        </section>
      )}

      {!species && (
        <p className={styles.hint}>Choose a species to see its traits and choices.</p>
      )}
    </div>
  );
}
