// =============================================================================
// ClassTab — classe(s), nível, subclasse (Fase 5c)
// =============================================================================
// Cada classe é uma entrada (multiclasse = várias). Escolha de classe e subclasse
// pelo seletor universal; nível por stepper (cap total 20). A primeira entrada é
// a classe ORIGINAL (define os saves proficientes no multiclasse). Tudo deriva ao
// vivo: os tiles Level/HP e os saves/PB do header reagem na hora.
//   As escolhas por nível (perícias da classe, ASI/talento, etc.) chegam em 5c-2.
// -----------------------------------------------------------------------------

import { createClassEntry } from '../../schema/character';
import { resolveClassObj } from '../../engine/resolve';
import { parseClass } from '../../engine/classData';
import PickerField from '../common/PickerField';
import classEntity from '../../selector/entities/class';
import { makeSubclassEntity } from '../../selector/entities/subclass';
import styles from './ClassTab.module.css';

const MAX_TOTAL = 20;

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

export default function ClassTab({ character, db, onChange }) {
  const classes = character.classes ?? [];
  const subclassLevel = character.rulesConfig?.subclassLevel ?? 3;
  const total = classes.reduce((sum, c) => sum + (c.level || 0), 0);
  const takenClassIds = new Set(classes.map((c) => c.classId).filter(Boolean));

  const setClasses = (next) => onChange(next);
  const updateClass = (i, patch) => setClasses(classes.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));

  const pickClass = (i, raw) =>
    updateClass(i, { classId: raw.name.toLowerCase(), source: raw.source, subclassId: null, subclassSource: null });
  const clearClass = (i) =>
    updateClass(i, { classId: '', source: '', subclassId: null, subclassSource: null });
  const setLevel = (i, level) => updateClass(i, { level });
  const pickSubclass = (i, raw) => updateClass(i, { subclassId: raw.shortName, subclassSource: raw.source });
  const clearSubclass = (i) => updateClass(i, { subclassId: null, subclassSource: null });
  const addClass = () => setClasses([...classes, createClassEntry(false)]);
  const removeClass = (i) => setClasses(classes.filter((_, idx) => idx !== i));

  return (
    <div className={styles.tab}>
      {classes.map((c, i) => {
        const classObj = c.classId ? resolveClassObj(db, c.classId, c.source) : null;
        const parsed = classObj ? parseClass(classObj) : null;
        const maxForThis = MAX_TOTAL - (total - (c.level || 0));

        return (
          <div className={styles.classCard} key={c.uid}>
            <div className={styles.classTop}>
              {c.isOriginalClass && <span className={styles.originBadge}>Original</span>}
              {i > 0 && (
                <button
                  type="button"
                  className={styles.remove}
                  onClick={() => removeClass(i)}
                  aria-label="Remove class"
                >
                  ×
                </button>
              )}
            </div>

            <PickerField
              entity={classEntity}
              db={db}
              current={
                c.classId
                  ? { label: c.classId, source: c.source, id: `${capitalize(c.classId)}|${c.source}` }
                  : null
              }
              placeholder="Choose class…"
              onSelect={(raw) => pickClass(i, raw)}
              onClear={() => clearClass(i)}
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
                    onClick={() => setLevel(i, Math.max(1, c.level - 1))}
                    disabled={c.level <= 1}
                    aria-label="Decrease level"
                  >
                    −
                  </button>
                  <span className={styles.stepValue}>{c.level}</span>
                  <button
                    type="button"
                    className={styles.stepBtn}
                    onClick={() => setLevel(i, Math.min(maxForThis, c.level + 1))}
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
                    c.subclassId
                      ? { label: c.subclassId, source: c.subclassSource, id: `${c.subclassId}|${c.subclassSource}` }
                      : null
                  }
                  placeholder="Choose subclass…"
                  onSelect={(raw) => pickSubclass(i, raw)}
                  onClear={() => clearSubclass(i)}
                />
              </div>
            )}
          </div>
        );
      })}

      <button type="button" className={styles.addBtn} onClick={addClass} disabled={total >= MAX_TOTAL}>
        + Add class (multiclass)
      </button>

      <p className={styles.summary}>Total level: {total} / {MAX_TOTAL}</p>
    </div>
  );
}
