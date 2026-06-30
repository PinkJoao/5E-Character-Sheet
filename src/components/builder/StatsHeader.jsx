// =============================================================================
// StatsHeader — tiles (Level / HP / Alignment) + atributos editáveis
// =============================================================================
// - Level e Hit Points são tiles EXPANSÍVEIS (breakdown por classe).
// - Alignment é expansível com as 9 opções (seleção funcional).
// - Cada atributo mostra o nome POR EXTENSO, o TOTAL grande e o modificador
//   (accent) menor; ao expandir traz o Base (legenda + stepper − +), Bonus e
//   Modifier (o valor base não é repetido).
// -----------------------------------------------------------------------------

import { useState } from 'react';
import { ABILITIES } from '../../schema/character';
import { formatBonus } from '../../engine/math';
import { ABILITY_FULL } from './labels';
import styles from './StatsHeader.module.css';

const MIN_SCORE = 1;
const MAX_SCORE = 30;

const ALIGNMENT_LABEL = {
  LG: 'Lawful Good', NG: 'Neutral Good', CG: 'Chaotic Good',
  LN: 'Lawful Neutral', N: 'True Neutral', CN: 'Chaotic Neutral',
  LE: 'Lawful Evil', NE: 'Neutral Evil', CE: 'Chaotic Evil',
};
const ALIGNMENT_ORDER = ['LG', 'NG', 'CG', 'LN', 'N', 'CN', 'LE', 'NE', 'CE'];

export default function StatsHeader({ derived, character, onChangeBaseScore, onChangeAlignment }) {
  return (
    <div className={styles.header}>
      <div className={styles.tiles}>
        <LevelTile level={derived.level} classBreakdown={derived.classBreakdown} />
        <HpTile maxHp={derived.maxHp} classBreakdown={derived.classBreakdown} />
        <AlignmentTile current={character.identity.alignment} onSelect={onChangeAlignment} />
      </div>

      <div className={styles.abilities}>
        {ABILITIES.map((a) => (
          <AbilityCard
            key={a}
            ability={a}
            total={derived.scores[a]}
            base={character.scores[a]}
            mod={derived.modifiers[a]}
            onStep={(delta) =>
              onChangeBaseScore(a, clamp(character.scores[a] + delta, MIN_SCORE, MAX_SCORE))
            }
          />
        ))}
      </div>
    </div>
  );
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

// --- Tiles -------------------------------------------------------------------

function ExpandableTile({ label, value, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={open ? `${styles.tile} ${styles.open}` : styles.tile}>
      <button type="button" className={styles.tileHead} onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className={styles.tileChevron}>▾</span>
        <span className={styles.value}>{value}</span>
        <span className={styles.label}>{label}</span>
      </button>
      {open && <div className={styles.tileBody}>{children}</div>}
    </div>
  );
}

function LevelTile({ level, classBreakdown }) {
  const named = classBreakdown.filter((c) => c.classId);
  return (
    <ExpandableTile label="Level" value={level || '—'}>
      {named.length === 0 ? (
        <p className={styles.emptyNote}>No classes yet.</p>
      ) : (
        named.map((c, i) => (
          <div className={styles.breakRow} key={`${c.classId}-${i}`}>
            <span className={styles.bName}>{c.classId}</span>
            <span className={styles.bVal}>Lvl {c.level}</span>
          </div>
        ))
      )}
    </ExpandableTile>
  );
}

function HpTile({ maxHp, classBreakdown }) {
  const named = classBreakdown.filter((c) => c.classId && c.hitDie);
  return (
    <ExpandableTile label="Hit Points" value={maxHp ?? '—'}>
      {named.length === 0 ? (
        <p className={styles.emptyNote}>Add a class to track hit points.</p>
      ) : (
        named.map((c, i) => (
          <div className={styles.breakRow} key={`${c.classId}-${i}`}>
            <span className={styles.bName}>{c.classId}</span>
            <span className={styles.die}>
              {c.level}d{c.hitDie}
            </span>
          </div>
        ))
      )}
    </ExpandableTile>
  );
}

function AlignmentTile({ current, onSelect }) {
  const [open, setOpen] = useState(false);
  const value = ALIGNMENT_LABEL[current] || 'Unaligned';
  return (
    <div className={open ? `${styles.tile} ${styles.open}` : styles.tile}>
      <button type="button" className={styles.tileHead} onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className={styles.tileChevron}>▾</span>
        <span className={`${styles.value} ${styles.small}`}>{value}</span>
        <span className={styles.label}>Alignment</span>
      </button>
      {open && (
        <div className={styles.tileBody}>
          <div className={styles.alignGrid}>
            {ALIGNMENT_ORDER.map((code) => (
              <button
                key={code}
                type="button"
                title={ALIGNMENT_LABEL[code]}
                className={current === code ? `${styles.alignBtn} ${styles.alignSel}` : styles.alignBtn}
                onClick={() => onSelect(current === code ? '' : code)}
              >
                {code}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Ability card ------------------------------------------------------------

function AbilityCard({ ability, total, base, mod, onStep }) {
  const [open, setOpen] = useState(false);
  const bonus = total - base;

  return (
    <div className={open ? `${styles.ability} ${styles.open}` : styles.ability}>
      <button type="button" className={styles.abilityHead} onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className={styles.chevron}>▾</span>
        <span className={styles.name}>{ABILITY_FULL[ability]}</span>
        <span className={styles.total}>{total}</span>
        <span className={styles.mod}>{formatBonus(mod)}</span>
      </button>

      {open && (
        <div className={styles.detail}>
          <div className={styles.stepperBlock}>
            <span className={styles.stepLabel}>Base</span>
            <div className={styles.stepper}>
              <button
                type="button"
                className={styles.stepBtn}
                onClick={() => onStep(-1)}
                disabled={base <= MIN_SCORE}
                aria-label={`Decrease base ${ABILITY_FULL[ability]}`}
              >
                −
              </button>
              <span className={styles.stepValue}>{base}</span>
              <button
                type="button"
                className={styles.stepBtn}
                onClick={() => onStep(1)}
                disabled={base >= MAX_SCORE}
                aria-label={`Increase base ${ABILITY_FULL[ability]}`}
              >
                +
              </button>
            </div>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.rowLabel}>Bonus</span>
            <span className={styles.rowValue}>{formatBonus(bonus)}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.rowLabel}>Modifier</span>
            <span className={styles.rowValue}>{formatBonus(mod)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
