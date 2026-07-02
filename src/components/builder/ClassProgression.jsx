// =============================================================================
// ClassProgression — features de classe/subclasse por nível + tabela (Fase 6+)
// =============================================================================
// Visão estilo página de classe do 5e.tools, dentro da aba Class:
//  - Dois MODOS: "Unlocked" (só até o nível atual) e "Full" (1..20; níveis
//    futuros esmaecidos).
//  - Feature de SUBCLASSE se diferencia por borda accent + tag (sem o antigo
//    esquema de cores por categoria — identidade visual do app).
//  - Cada feature é colapsável; listas LONGAS (invocations, maneuvers,
//    metamagic…) começam FECHADAS p/ não afogar a tela.
//  - Tabela de progressão: mostra a LINHA do nível atual; botão expande a
//    tabela completa (linha atual destacada).
// -----------------------------------------------------------------------------

import { useState } from 'react';
import { classFeatureLevels, isLongFeature, classTable } from '../../engine/classProgression';
import EntryContent, { InlineEntry } from '../common/EntryContent';
import styles from './ClassProgression.module.css';

export default function ClassProgression({ db, classId, classObj, subclass, level }) {
  const [mode, setMode] = useState('unlocked'); // 'unlocked' | 'full'
  const [fullTable, setFullTable] = useState(false);

  const levels = classFeatureLevels(db, classId, classObj, subclass);
  const shown = mode === 'unlocked' ? levels.filter((l) => l.level <= level) : levels;
  const table = classTable(classObj);

  return (
    <section className={styles.progression}>
      <div className={styles.head}>
        <h3 className={styles.title}>Features</h3>
        <div className={styles.modes}>
          <button
            type="button"
            className={mode === 'unlocked' ? `${styles.modeBtn} ${styles.modeActive}` : styles.modeBtn}
            onClick={() => setMode('unlocked')}
          >
            Unlocked
          </button>
          <button
            type="button"
            className={mode === 'full' ? `${styles.modeBtn} ${styles.modeActive}` : styles.modeBtn}
            onClick={() => setMode('full')}
          >
            Full
          </button>
        </div>
      </div>

      {table && (
        <div className={styles.tableBox}>
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {table.cols.map((c, i) => (
                    <th key={i}>
                      <InlineEntry text={c} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(fullTable ? table.rows : table.rows.slice(level - 1, level)).map((row) => {
                  const isCurrent = row[0] === String(level);
                  return (
                    <tr key={row[0]} className={isCurrent ? styles.rowCurrent : undefined}>
                      {row.map((v, i) => (
                        <td key={i}>{v}</td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <button type="button" className={styles.tableToggle} onClick={() => setFullTable((v) => !v)}>
            {fullTable ? 'Show current level only' : 'Show full table'}
          </button>
        </div>
      )}

      {shown.length === 0 ? (
        <p className={styles.empty}>No features yet.</p>
      ) : (
        shown.map((l) => (
          <div key={l.level} className={l.level > level ? `${styles.levelBlock} ${styles.future}` : styles.levelBlock}>
            <div className={styles.levelHead}>
              Level {l.level}
              {l.level > level && <span className={styles.futureTag}>future</span>}
            </div>
            {l.features.map((f) => (
              <FeatureCard key={f.key} feature={f} subclassName={subclass?.shortName} />
            ))}
          </div>
        ))
      )}
    </section>
  );
}

/** Card colapsável de uma feature; listas longas começam fechadas. */
function FeatureCard({ feature, subclassName }) {
  const long = isLongFeature(feature.entries);
  const [open, setOpen] = useState(!long);
  const sub = feature.from === 'subclass';

  return (
    <div className={sub ? `${styles.feature} ${styles.featureSub}` : styles.feature}>
      <button type="button" className={styles.featureHead} onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className={styles.featureName}>{feature.name}</span>
        {sub && <span className={styles.subTag}>{subclassName ?? 'Subclass'}</span>}
        {!open && long && <span className={styles.longHint}>long</span>}
        <span className={styles.chevron}>{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div className={styles.featureBody}>
          <EntryContent entries={feature.entries} />
        </div>
      )}
    </div>
  );
}
