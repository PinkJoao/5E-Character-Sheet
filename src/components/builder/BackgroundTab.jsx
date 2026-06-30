// =============================================================================
// BackgroundTab — origem custom (Fase 5b)
// =============================================================================
// Sem backgrounds prontos: o jogador monta a origem peça por peça. Grava em
// character.origin e reflete AO VIVO no header (atributos) e no ProficienciesCard.
//   - Ability boosts (2024: +2/+1 ou +1/+1/+1)  → origin.abilityBoosts
//   - Origin feat (SelectorPanel)               → origin.originFeat
//   - Skill proficiencies (chips, máx 2)         → origin.skillProficiencies
//   - Tool proficiencies (universal + chips)     → origin.toolProficiencies
//   - Languages (universal + chips)              → origin.languages
// -----------------------------------------------------------------------------

import { useState } from 'react';
import { ABILITIES } from '../../schema/character';
import { parseChoices } from '../../engine/choices';
import { resolveFeat, ownedFromDb } from '../../engine/resolve';
import { ABILITY_FULL, SKILL_LABEL } from './labels';
import ClearableSelect from '../common/ClearableSelect';
import PickerField from '../common/PickerField';
import ChoiceList from './ChoiceList';
import SelectorPanel from '../../selector/SelectorPanel';
import originFeatEntity from '../../selector/entities/feat';
import languageEntity from '../../selector/entities/language';
import toolEntity from '../../selector/entities/tool';
import styles from './BackgroundTab.module.css';

const ORIGIN_SKILL_COUNT = 2; // origem custom 2024 concede 2 perícias

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
  const skills = origin.skillProficiencies ?? [];
  const tools = origin.toolProficiencies ?? [];
  const languages = origin.languages ?? [];
  const originFeat = origin.originFeat ?? null;

  const [addPanel, setAddPanel] = useState(null); // 'language' | 'tool' | null

  // Tudo que a ficha já tem (dedup): não deixar escolher a mesma coisa 2×.
  const owned = ownedFromDb(character, db);

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

  // --- Skills ---
  const toggleSkill = (code) => {
    let next;
    if (skills.includes(code)) next = skills.filter((s) => s !== code);
    else if (skills.length < ORIGIN_SKILL_COUNT) next = [...skills, code];
    else return;
    onChangeOrigin({ ...origin, skillProficiencies: next });
  };

  // --- Tools & languages (listas multi-add) ---
  const addTool = (raw) => {
    if (!tools.includes(raw.name)) onChangeOrigin({ ...origin, toolProficiencies: [...tools, raw.name] });
    setAddPanel(null);
  };
  const removeTool = (name) =>
    onChangeOrigin({ ...origin, toolProficiencies: tools.filter((t) => t !== name) });

  const addLanguage = (raw) => {
    if (!languages.includes(raw.name)) onChangeOrigin({ ...origin, languages: [...languages, raw.name] });
    setAddPanel(null);
  };
  const removeLanguage = (name) =>
    onChangeOrigin({ ...origin, languages: languages.filter((l) => l !== name) });

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
                <ClearableSelect
                  value={b.ability}
                  onChange={(v) => setBoostAbility(i, v)}
                  placeholder="Choose ability…"
                >
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
            <ChoiceList choices={featChoices} bag={originFeat.choices} onChange={setFeatChoices} db={db} owned={owned} />
          </div>
        )}
      </section>

      {/* Skill Proficiencies */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h3 className={styles.sectionTitle}>Skill Proficiencies</h3>
          <span className={styles.sectionHint}>
            choose {ORIGIN_SKILL_COUNT} ({skills.length}/{ORIGIN_SKILL_COUNT})
          </span>
        </div>
        <div className={styles.chips}>
          {Object.keys(SKILL_LABEL)
            .sort((a, b) => SKILL_LABEL[a].localeCompare(SKILL_LABEL[b]))
            .map((code) => {
              const selected = skills.includes(code);
              const ownedElsewhere = !selected && owned.skills.has(code);
              const disabled = !selected && (ownedElsewhere || skills.length >= ORIGIN_SKILL_COUNT);
              let cls = styles.chip;
              if (selected) cls = `${styles.chip} ${styles.chipActive}`;
              else if (disabled) cls = `${styles.chip} ${styles.chipDisabled}`;
              return (
                <button
                  key={code}
                  type="button"
                  className={cls}
                  onClick={() => !disabled && toggleSkill(code)}
                  disabled={disabled}
                  title={ownedElsewhere ? 'Already on your sheet' : undefined}
                  aria-pressed={selected}
                >
                  {SKILL_LABEL[code]}
                </button>
              );
            })}
        </div>
      </section>

      {/* Tool Proficiencies */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h3 className={styles.sectionTitle}>Tool Proficiencies</h3>
        </div>
        <TagList
          items={tools}
          onRemove={removeTool}
          onAdd={() => setAddPanel('tool')}
          addLabel="Add tool"
          empty="No tools yet."
        />
      </section>

      {/* Languages */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h3 className={styles.sectionTitle}>Languages</h3>
        </div>
        <TagList
          items={languages}
          onRemove={removeLanguage}
          onAdd={() => setAddPanel('language')}
          addLabel="Add language"
          empty="No languages yet."
        />
      </section>

      {addPanel === 'tool' && (
        <SelectorPanel
          entity={toolEntity}
          db={db}
          currentId={null}
          exclude={(raw) => owned.tools.has(raw.name.toLowerCase())}
          onSelect={addTool}
          onClose={() => setAddPanel(null)}
        />
      )}
      {addPanel === 'language' && (
        <SelectorPanel
          entity={languageEntity}
          db={db}
          currentId={null}
          exclude={(raw) => owned.languages.has(raw.name.toLowerCase())}
          onSelect={addLanguage}
          onClose={() => setAddPanel(null)}
        />
      )}
    </div>
  );
}

function TagList({ items, onRemove, onAdd, addLabel, empty }) {
  return (
    <div className={styles.tags}>
      {items.length === 0 && <span className={styles.emptyTag}>{empty}</span>}
      {items.map((name) => (
        <span key={name} className={styles.tagChip}>
          {name}
          <button type="button" className={styles.tagRemove} onClick={() => onRemove(name)} aria-label={`Remove ${name}`}>
            ×
          </button>
        </span>
      ))}
      <button type="button" className={styles.addBtn} onClick={onAdd}>
        + {addLabel}
      </button>
    </div>
  );
}
