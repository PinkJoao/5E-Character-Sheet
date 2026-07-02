// =============================================================================
// BackgroundTab — origem custom (Fase 5b)
// =============================================================================
// Sem backgrounds prontos: o jogador monta a origem peça por peça. Grava em
// character.origin e reflete AO VIVO no header (atributos) e no ProficienciesCard.
//   - Ability boosts (2024: +2/+1 ou +1/+1/+1)  → origin.abilityBoosts
//   - Origin feat (SelectorPanel + sub-escolhas) → origin.originFeat
//   - Proficiências + idioma (via ChoiceList,     → origin.choices
//     padronizado: 2 skills, 1 tool, 1 language)
// -----------------------------------------------------------------------------

import { ABILITIES } from '../../schema/character';
import { parseChoices } from '../../engine/choices';
import { resolveFeat, ownedFromDb } from '../../engine/resolve';
import { prereqContext } from '../../engine/prereq';
import { ABILITY_FULL } from './labels';
import ClearableSelect from '../common/ClearableSelect';
import PickerField from '../common/PickerField';
import ChoiceList from './ChoiceList';
import { makeFeatEntity } from '../../selector/entities/feat';
import styles from './BackgroundTab.module.css';

// Escolhas FIXAS da origem custom 2024 — descritores p/ o ChoiceList (mesmo
// formato que parseChoices gera p/ espécies/talentos): 2 perícias, 1 ferramenta,
// 1 idioma livres.
const ORIGIN_CHOICES = [
  { id: 'skill', kind: 'skill', count: 2, label: 'Skill Proficiencies', pool: { type: 'any', of: 'skill' } },
  { id: 'tool', kind: 'tool', count: 1, label: 'Tool Proficiency', pool: { type: 'any', of: 'tool' } },
  { id: 'language', kind: 'language', count: 1, label: 'Language', pool: { type: 'any', of: 'language' } },
];

/** Deriva o modo de boost a partir do array salvo. */
function boostMode(boosts) {
  if (!boosts || boosts.length === 0) return null;
  if (boosts.some((b) => b.amount === 2)) return '2-1';
  return '1-1-1';
}

export default function BackgroundTab({ character, db, onChangeOrigin }) {
  const origin = character.origin;
  const boosts = origin.abilityBoosts ?? [];
  const mode = boostMode(boosts);
  const originFeat = origin.originFeat ?? null;

  // Tudo que a ficha já tem (dedup): não deixar escolher a mesma coisa 2×.
  const owned = ownedFromDb(character, db);

  // Entity de talento de origem ciente do personagem (colore pré-requisitos).
  const originFeatEntity = makeFeatEntity(['O'], 'Origin Feat', prereqContext(character, { db }));

  // --- Ability boosts ---
  const setMode = (m) => {
    let next = [];
    if (m === '2-1') next = [{ ability: '', amount: 2 }, { ability: '', amount: 1 }];
    else if (m === '1-1-1') next = [{ ability: '', amount: 1 }, { ability: '', amount: 1 }, { ability: '', amount: 1 }];
    onChangeOrigin({ ...origin, abilityBoosts: next });
  };
  const setBoostAbility = (index, ability) =>
    onChangeOrigin({ ...origin, abilityBoosts: boosts.map((b, i) => (i === index ? { ...b, ability } : b)) });
  const usedAbilities = new Set(boosts.map((b) => b.ability).filter(Boolean));

  // --- Origin feat (com SUB-ESCOLHAS recursivas via ChoiceList) ---
  const setOriginFeat = (raw) =>
    onChangeOrigin({ ...origin, originFeat: { id: raw.name, source: raw.source, subtype: 'origin', choices: {} } });
  const clearOriginFeat = () => onChangeOrigin({ ...origin, originFeat: null });
  const setFeatChoices = (choices) => onChangeOrigin({ ...origin, originFeat: { ...originFeat, choices } });
  const originFeatData = originFeat ? resolveFeat(db, `${originFeat.id}|${originFeat.source}`) : null;
  const featChoices = originFeatData ? parseChoices(originFeatData) : [];

  // --- Proficiências + idioma (choice-bag) ---
  const setOriginChoices = (choices) => onChangeOrigin({ ...origin, choices });

  return (
    <div className={styles.tab}>
      {/* Ability Score Boosts */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h3 className={styles.sectionTitle}>Ability Score Boosts</h3>
          <span className={styles.sectionHint}>from your origin</span>
        </div>
        <div className={styles.modeRow}>
          <button
            type="button"
            className={mode === '2-1' ? `${styles.modeBtn} ${styles.modeActive}` : styles.modeBtn}
            onClick={() => setMode('2-1')}
          >
            +2 / +1
          </button>
          <button
            type="button"
            className={mode === '1-1-1' ? `${styles.modeBtn} ${styles.modeActive}` : styles.modeBtn}
            onClick={() => setMode('1-1-1')}
          >
            +1 / +1 / +1
          </button>
        </div>
        {mode && (
          <div className={styles.boostRows}>
            {boosts.map((b, i) => (
              <div className={styles.boostRow} key={i}>
                <span className={styles.boostAmount}>+{b.amount}</span>
                <ClearableSelect value={b.ability} onChange={(v) => setBoostAbility(i, v)} placeholder="Choose ability…">
                  {ABILITIES.filter((a) => !usedAbilities.has(a) || a === b.ability).map((a) => (
                    <option key={a} value={a}>
                      {ABILITY_FULL[a]}
                    </option>
                  ))}
                </ClearableSelect>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Origin Feat */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h3 className={styles.sectionTitle}>Origin Feat</h3>
        </div>
        <PickerField
          entity={originFeatEntity}
          db={db}
          current={
            originFeat
              ? { label: originFeat.id, source: originFeat.source, id: `${originFeat.id}|${originFeat.source}` }
              : null
          }
          placeholder="Choose origin feat…"
          onSelect={setOriginFeat}
          onClear={clearOriginFeat}
          exclude={(raw) => {
            const id = `${raw.name}|${raw.source}`;
            if (raw.repeatable || (originFeat && id === `${originFeat.id}|${originFeat.source}`)) return false;
            return owned.feats.has(id);
          }}
        />
        {featChoices.length > 0 && (
          <div className={styles.featChoices}>
            <ChoiceList choices={featChoices} bag={originFeat.choices} onChange={setFeatChoices} db={db} owned={owned} character={character} />
          </div>
        )}
      </section>

      {/* Proficiências & Idioma (padronizado via ChoiceList) */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h3 className={styles.sectionTitle}>Proficiencies &amp; Language</h3>
          <span className={styles.sectionHint}>from your origin</span>
        </div>
        <ChoiceList
          choices={ORIGIN_CHOICES}
          bag={origin.choices ?? {}}
          onChange={setOriginChoices}
          db={db}
          owned={owned}
          character={character}
        />
      </section>
    </div>
  );
}
