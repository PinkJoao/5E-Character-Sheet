// =============================================================================
// ClassTab — classe(s), nível, subclasse, escolhas de classe (Fase 5c)
// =============================================================================
// Multiclasse em SUB-ABAS (uma classe por vez) — evita clutter e não confunde as
// classes entre si. A 1ª entrada é a ORIGINAL (define os saves proficientes).
// Deriva ao vivo (Level/HP/saves). As escolhas de classe (perícias no nv1, e mais
// tarde ASI/talento/fighting style…) usam o ChoiceList e gravam em cls.choices.
// -----------------------------------------------------------------------------

import { useState } from 'react';
import { createClassEntry } from '../../schema/character';
import { resolveClassObj, resolveSubclassObj, ownedFromDb } from '../../engine/resolve';
import { parseClass } from '../../engine/classData';
import {
  classLevelChoices,
  pruneChoicesAboveLevel,
  weaponMasteryCount,
} from '../../engine/classFeatureChoices';
import { collectSkillProficiencies } from '../../engine/proficiency';
import { SKILL_LABEL } from './labels';
import PickerField from '../common/PickerField';
import ChoiceList from './ChoiceList';
import ClassProgression from './ClassProgression';
import classEntity from '../../selector/entities/class';
import { makeSubclassEntity } from '../../selector/entities/subclass';
import styles from './ClassTab.module.css';

const MAX_TOTAL = 20;

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/** Descritores de escolha da classe (por ora: perícias iniciais da ORIGINAL). */
function classChoices(parsed, isOriginal) {
  const out = [];
  if (isOriginal && parsed?.skillChoice?.count > 0 && parsed.skillChoice.from.length) {
    out.push({
      id: 'skill',
      kind: 'skill',
      count: parsed.skillChoice.count,
      label: 'Skill Proficiencies',
      pool: {
        type: 'list',
        options: parsed.skillChoice.from.map((c) => ({ value: c, label: SKILL_LABEL[c] ?? c })),
      },
    });
  }
  return out;
}

export default function ClassTab({ character, db, onChange }) {
  const classes = character.classes ?? [];
  const [activeIdx, setActiveIdx] = useState(0);
  const idx = Math.min(activeIdx, classes.length - 1);

  const subclassLevel = character.rulesConfig?.subclassLevel ?? 3;
  const total = classes.reduce((sum, c) => sum + (c.level || 0), 0);
  const takenClassIds = new Set(classes.map((c) => c.classId).filter(Boolean));
  const owned = ownedFromDb(character, db);

  const updateClass = (i, patch) => onChange(classes.map((c, x) => (x === i ? { ...c, ...patch } : c)));
  const pickClass = (i, raw) =>
    updateClass(i, {
      classId: raw.name.toLowerCase(),
      source: raw.source,
      subclassId: null,
      subclassSource: null,
      choices: {},
    });
  const clearClass = (i) =>
    updateClass(i, { classId: '', source: '', subclassId: null, subclassSource: null, choices: {} });
  // Baixar o nível abaixo do nível de subclasse REVERTE a subclasse (e o que ela
  // concede); também PODA escolhas de níveis perdidos (feat@8 etc.) e apara o
  // Weapon Mastery se o novo nível cobrir menos armas.
  const setLevel = (i, level) => {
    const patch = { level };
    if (level < subclassLevel) {
      patch.subclassId = null;
      patch.subclassSource = null;
    }
    const pruned = pruneChoicesAboveLevel(classes[i].choices, level);
    if (pruned.weaponMastery?.picks) {
      const clsObj = resolveClassObj(db, classes[i].classId, classes[i].source);
      const max = weaponMasteryCount(clsObj, level);
      if (pruned.weaponMastery.picks.length > max) {
        pruned.weaponMastery = { ...pruned.weaponMastery, picks: pruned.weaponMastery.picks.slice(0, max) };
      }
    }
    patch.choices = pruned;
    updateClass(i, patch);
  };
  const pickSubclass = (i, raw) => updateClass(i, { subclassId: raw.shortName, subclassSource: raw.source });
  const clearSubclass = (i) => updateClass(i, { subclassId: null, subclassSource: null });
  const setClassChoices = (i, choices) => updateClass(i, { choices });

  const addClass = () => {
    onChange([...classes, createClassEntry(false)]);
    setActiveIdx(classes.length);
  };
  const removeClass = (i) => {
    onChange(classes.filter((_, x) => x !== i));
    setActiveIdx(Math.max(0, i - 1));
  };

  const c = classes[idx];
  const classObj = c.classId ? resolveClassObj(db, c.classId, c.source) : null;
  const parsed = classObj ? parseClass(classObj) : null;
  const maxForThis = MAX_TOTAL - (total - (c.level || 0));

  // Escolhas: perícias iniciais (original) + POR NÍVEL (feat/ASI, fighting
  // style, expertise, weapon mastery). O pool de expertise é restrito às
  // perícias em que o personagem JÁ é proficiente.
  const profSkillOptions = Object.keys(collectSkillProficiencies(character)).map((code) => ({
    value: code,
    label: SKILL_LABEL[code] ?? code,
  }));
  const levelChoices = parsed
    ? classLevelChoices(parsed, classObj, c.level).map((ch) =>
        ch.kind === 'expertise' ? { ...ch, pool: { type: 'list', options: profSkillOptions } } : ch,
      )
    : [];
  const choices = [...(parsed ? classChoices(parsed, c.isOriginalClass) : []), ...levelChoices];

  return (
    <div className={styles.tab}>
      {/* Sub-abas: uma por classe (multiclasse) + adicionar. */}
      <nav className={styles.subTabs}>
        {classes.map((cl, i) => (
          <button
            key={cl.uid}
            type="button"
            className={i === idx ? `${styles.subTab} ${styles.subTabActive}` : styles.subTab}
            onClick={() => setActiveIdx(i)}
          >
            {cl.classId ? `${capitalize(cl.classId)} ${cl.level}` : 'New class'}
          </button>
        ))}
        {total < MAX_TOTAL && (
          <button type="button" className={styles.addTab} onClick={addClass} aria-label="Add class">
            +
          </button>
        )}
      </nav>

      <div className={styles.classCard}>
        <div className={styles.classTop}>
          {c.isOriginalClass ? (
            <span className={styles.originBadge}>Original</span>
          ) : (
            <span className={styles.multiBadge}>Multiclass</span>
          )}
          {idx > 0 && (
            <button type="button" className={styles.remove} onClick={() => removeClass(idx)} aria-label="Remove class">
              ×
            </button>
          )}
        </div>

        <PickerField
          entity={classEntity}
          db={db}
          current={
            c.classId ? { label: c.classId, source: c.source, id: `${capitalize(c.classId)}|${c.source}` } : null
          }
          placeholder="Choose class…"
          showInfo={false}
          onSelect={(raw) => pickClass(idx, raw)}
          onClear={() => clearClass(idx)}
          exclude={(raw) => {
            const id = raw.name.toLowerCase();
            return id !== c.classId && takenClassIds.has(id);
          }}
        />

        {c.classId && (
          <div className={styles.row}>
            <span className={styles.rowLabel}>Level</span>
            <div className={styles.stepper}>
              <button
                type="button"
                className={styles.stepBtn}
                onClick={() => setLevel(idx, Math.max(1, c.level - 1))}
                disabled={c.level <= 1}
                aria-label="Decrease level"
              >
                −
              </button>
              <span className={styles.stepValue}>{c.level}</span>
              <button
                type="button"
                className={styles.stepBtn}
                onClick={() => setLevel(idx, Math.min(maxForThis, c.level + 1))}
                disabled={c.level >= maxForThis}
                aria-label="Increase level"
              >
                +
              </button>
            </div>
          </div>
        )}

        {c.classId && c.level >= subclassLevel && (
          <div>
            <span className={styles.subLabel}>{parsed?.subclassTitle || 'Subclass'}</span>
            <PickerField
              entity={makeSubclassEntity(c.classId, parsed?.subclassTitle || 'Subclass')}
              db={db}
              current={
                c.subclassId ? { label: c.subclassId, source: c.subclassSource, id: `${c.subclassId}|${c.subclassSource}` } : null
              }
              placeholder="Choose subclass…"
              showInfo={false}
              onSelect={(raw) => pickSubclass(idx, raw)}
              onClear={() => clearSubclass(idx)}
            />
          </div>
        )}

        {choices.length > 0 && (
          <div className={styles.choices}>
            <ChoiceList
              choices={choices}
              bag={c.choices ?? {}}
              onChange={(ch) => setClassChoices(idx, ch)}
              db={db}
              owned={owned}
              character={character}
            />
          </div>
        )}
      </div>

      {/* Progressão de features (classe + subclasse) — descritivo, fica ABAIXO
          dos seletores/escolhas. */}
      {c.classId && classObj && (
        <ClassProgression
          db={db}
          classId={c.classId}
          classObj={classObj}
          subclass={c.subclassId ? resolveSubclassObj(db, c.classId, c.subclassId, c.subclassSource) : null}
          level={c.level}
        />
      )}

      <p className={styles.summary}>
        Total level: {total} / {MAX_TOTAL}
      </p>
    </div>
  );
}
