// =============================================================================
// Builder — a ficha completa (Fase 5)
// =============================================================================
// Shell: foto + nome, header de stats DERIVADOS (tiles + atributos editáveis),
// card de proficiências, e navegação por abas. As abas (Species / Background /
// Class / Skills / Equipment / Spellbook) recebem conteúdo nos sub-passos da
// Fase 5; aqui só Species já tem o seletor.
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import useCharacterStore from '../store/characterStore';
import { useData } from '../data/dataContext';
import useDerived from '../hooks/useDerived';
import { totalLevel, classSummary } from '../schema/character';
import StatsHeader from '../components/builder/StatsHeader';
import ProficienciesCard from '../components/builder/ProficienciesCard';
import BackgroundTab from '../components/builder/BackgroundTab';
import SpeciesTab from '../components/builder/SpeciesTab';
import ClassTab from '../components/builder/ClassTab';
import styles from './Builder.module.css';

const TABS = ['Species', 'Background', 'Class', 'Skills', 'Equipment', 'Spellbook'];

export default function Builder() {
  const { id } = useParams();
  const { db } = useData();

  const loaded = useCharacterStore((s) => s.loaded);
  const load = useCharacterStore((s) => s.load);
  const character = useCharacterStore((s) => s.getById(id));
  const save = useCharacterStore((s) => s.save);

  const [activeTab, setActiveTab] = useState('Species');

  useEffect(() => {
    if (!loaded) load();
  }, [loaded, load]);

  if (!loaded) return <div className={styles.page}>Loading…</div>;
  if (!character) {
    return (
      <div className={styles.page}>
        <p>Character not found.</p>
        <Link to="/">← Back</Link>
      </div>
    );
  }

  return (
    <BuilderInner
      key={character.id}
      character={character}
      db={db}
      save={save}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    />
  );
}

// Hooks isolados num componente com personagem garantido (evita hook-após-return).
function BuilderInner({ character, db, save, activeTab, setActiveTab }) {
  const derived = useDerived(character);

  const rename = (name) => save({ ...character, meta: { ...character.meta, name } });

  const setBaseScore = (ability, value) =>
    save({ ...character, scores: { ...character.scores, [ability]: value } });

  const setAlignment = (code) =>
    save({ ...character, identity: { ...character.identity, alignment: code } });

  const setOrigin = (origin) => save({ ...character, origin });

  const setClasses = (classes) => save({ ...character, classes });

  // HP: rolar (máx no nível 1, resto rolado) ou média (padrão = hitPoints vazio).
  const dieOf = (classId) => derived.classBreakdown.find((b) => b.classId === classId)?.hitDie ?? 0;
  const rollHp = () =>
    save({
      ...character,
      classes: character.classes.map((cls) => {
        const die = dieOf(cls.classId);
        const hitPoints = {};
        for (let lvl = 2; lvl <= cls.level; lvl++) {
          hitPoints[lvl] = die > 0 ? Math.floor(Math.random() * die) + 1 : 0;
        }
        return { ...cls, hitPoints };
      }),
    });
  const averageHp = () =>
    save({ ...character, classes: character.classes.map((cls) => ({ ...cls, hitPoints: {} })) });
  const hpRolled = character.classes.some((cls) =>
    Object.values(cls.hitPoints ?? {}).some((v) => typeof v === 'number'),
  );

  const pickSpecies = (race) =>
    save({ ...character, species: { id: race.name.toLowerCase(), source: race.source, choices: {} } });
  const clearSpecies = () => save({ ...character, species: null });
  const setSpeciesChoices = (choices) =>
    save({ ...character, species: { ...character.species, choices } });

  return (
    <div className={styles.page}>
      <p className={styles.back}>
        <Link to="/">← Characters</Link>
      </p>

      <div className={styles.identity}>
        <button type="button" className={styles.portrait} title="Add a portrait (coming soon)">
          {character.meta.portrait ? <img src={character.meta.portrait} alt="" /> : '👤'}
        </button>
        <div className={styles.nameWrap}>
          <input
            className={styles.name}
            value={character.meta.name}
            onChange={(e) => rename(e.target.value)}
            placeholder="Character name"
          />
          <p className={styles.sub}>
            {classSummary(character) || 'No class set'} · Level {totalLevel(character)}
          </p>
        </div>
      </div>

      <StatsHeader
        derived={derived}
        character={character}
        onChangeBaseScore={setBaseScore}
        onChangeAlignment={setAlignment}
        onRollHp={rollHp}
        onAverageHp={averageHp}
        hpRolled={hpRolled}
      />

      <div className={styles.stack}>
        <ProficienciesCard derived={derived} />
      </div>

      <nav className={styles.tabBar}>
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={activeTab === tab ? `${styles.tab} ${styles.tabActive}` : styles.tab}
          >
            {tab}
          </button>
        ))}
      </nav>

      <div className={styles.panel}>
        {activeTab === 'Species' && (
          <SpeciesTab
            character={character}
            db={db}
            onPick={pickSpecies}
            onClear={clearSpecies}
            onChangeChoices={setSpeciesChoices}
          />
        )}

        {activeTab === 'Background' && (
          <BackgroundTab character={character} db={db} onChangeOrigin={setOrigin} />
        )}
        {activeTab === 'Class' && <ClassTab character={character} db={db} onChange={setClasses} />}
        {activeTab === 'Skills' && <Placeholder text="Skill proficiency choices arrive in Phase 5b/5c." />}
        {activeTab === 'Equipment' && <Placeholder text="Inventory & equipment arrive in a later phase." />}
        {activeTab === 'Spellbook' && <Placeholder text="Spell selection arrives in a later phase." />}
      </div>
    </div>
  );
}

function Placeholder({ text }) {
  return <div className={styles.placeholder}>{text}</div>;
}
