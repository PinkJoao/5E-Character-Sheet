// =============================================================================
// ChoiceList — renderer GENÉRICO e RECURSIVO de sub-escolhas
// =============================================================================
// Recebe descritores `Choice[]` (de engine/choices.parseChoices) + o "choice-bag"
// salvo, e renderiza cada escolha conforme o tipo de pool:
//   - list            → chips toggle (até `count`)
//   - any (skill)      → chips de todas as perícias
//   - any (tool/lang)  → chips removíveis + "+ Add" (SelectorPanel, listas grandes)
//   - any [skill,tool] → MISTO (Skilled): "+ Add" por tipo, budget compartilhado
//   - feat             → PickerField; ao escolher um talento, RECURSA renderizando
//                        as escolhas DELE logo abaixo (Pathbuilder-style).
//
// DEDUP: recebe `owned` (tudo que a ficha já tem) e impede escolher a mesma
// coisa duas vezes. Feats `repeatable` (ex: Skilled) escapam do dedup.
// -----------------------------------------------------------------------------

import { useState } from 'react';
import { parseChoices } from '../../engine/choices';
import { resolveFeat } from '../../engine/resolve';
import { skillCode } from '../../engine/classData';
import PickerField from '../common/PickerField';
import SelectorPanel from '../../selector/SelectorPanel';
import originFeatEntity from '../../selector/entities/feat';
import skillEntity from '../../selector/entities/skill';
import toolEntity from '../../selector/entities/tool';
import languageEntity from '../../selector/entities/language';
import { SKILL_LABEL } from './labels';
import styles from './ChoiceList.module.css';

const SKILL_OPTIONS = Object.keys(SKILL_LABEL)
  .map((code) => ({ value: code, label: SKILL_LABEL[code] }))
  .sort((a, b) => a.label.localeCompare(b.label));

const ADD_ENTITY = { skill: skillEntity, tool: toolEntity, language: languageEntity };
const OWNED_KEY = { skill: 'skills', tool: 'tools', language: 'languages' };

/** Normaliza um valor p/ comparação: skill = código; tool/language = minúsculas. */
function normVal(kind, v) {
  return kind === 'skill' ? v : String(v).toLowerCase();
}

/** O valor já está na ficha (qualquer fonte)? Usado nos painéis de ADICIONAR. */
function isOwned(owned, kind, value) {
  return owned?.[OWNED_KEY[kind]]?.has(normVal(kind, value)) ?? false;
}

/** Já está na ficha por OUTRA fonte (fora deste choice)? Usado nos chips toggle. */
function takenElsewhere(owned, kind, value, ownNorm) {
  const set = owned?.[OWNED_KEY[kind]];
  if (!set) return false;
  const nv = normVal(kind, value);
  return set.has(nv) && !ownNorm.has(nv);
}

export default function ChoiceList({ choices, bag, onChange, db, owned }) {
  if (!choices?.length) return null;

  const setEntry = (id, entry) => {
    const next = { ...(bag ?? {}) };
    if (entry == null) delete next[id];
    else next[id] = entry;
    onChange(next);
  };

  return (
    <div className={styles.list}>
      {choices.map((c) => (
        <ChoiceRow key={c.id} choice={c} entry={bag?.[c.id]} onChange={(e) => setEntry(c.id, e)} db={db} owned={owned} />
      ))}
    </div>
  );
}

function ChoiceRow({ choice, entry, onChange, db, owned }) {
  const picks = entry?.picks ?? [];

  return (
    <div className={styles.choice}>
      <div className={styles.head}>
        <span className={styles.label}>{choice.label}</span>
        <span className={styles.counter}>
          {picks.length}/{choice.count}
        </span>
      </div>
      {choice.pool.type === 'feat' ? (
        <FeatChoice choice={choice} entry={entry} picks={picks} onChange={onChange} db={db} owned={owned} />
      ) : choice.pool.type === 'any' && Array.isArray(choice.pool.of) ? (
        <MixedChoice choice={choice} picks={picks} onChange={onChange} db={db} owned={owned} />
      ) : choice.pool.type === 'any' && choice.pool.of !== 'skill' ? (
        <TagChoice choice={choice} picks={picks} onChange={onChange} db={db} owned={owned} />
      ) : (
        <ChipChoice choice={choice} picks={picks} onChange={onChange} owned={owned} />
      )}
    </div>
  );
}

/** Chips toggle: pool de lista, ou "any skill" (todas as perícias). */
function ChipChoice({ choice, picks, onChange, owned }) {
  const kind = choice.kind;
  const options = choice.pool.type === 'list' ? choice.pool.options : SKILL_OPTIONS;
  const ownNorm = new Set(picks.map((p) => normVal(kind, p)));

  const toggle = (value) => {
    const next = picks.includes(value)
      ? picks.filter((p) => p !== value)
      : picks.length < choice.count
        ? [...picks, value]
        : picks;
    onChange({ kind, picks: next });
  };

  return (
    <div className={styles.chips}>
      {options.map((o) => {
        const sel = picks.includes(o.value);
        const taken = takenElsewhere(owned, kind, o.value, ownNorm);
        const disabled = !sel && (taken || picks.length >= choice.count);
        let cls = styles.chip;
        if (sel) cls = `${styles.chip} ${styles.chipActive}`;
        else if (disabled) cls = `${styles.chip} ${styles.chipDisabled}`;
        return (
          <button
            key={o.value}
            type="button"
            className={cls}
            onClick={() => !disabled && toggle(o.value)}
            disabled={disabled}
            title={taken ? 'Already on your sheet' : undefined}
            aria-pressed={sel}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** "any tool/language": chips removíveis + botão que abre o SelectorPanel. */
function TagChoice({ choice, picks, onChange, db, owned }) {
  const [open, setOpen] = useState(false);
  const kind = choice.pool.of;
  const entity = ADD_ENTITY[kind];

  const add = (raw) => {
    if (!picks.includes(raw.name) && picks.length < choice.count) {
      onChange({ kind: choice.kind, picks: [...picks, raw.name] });
    }
    setOpen(false);
  };
  const remove = (name) => onChange({ kind: choice.kind, picks: picks.filter((p) => p !== name) });

  return (
    <div className={styles.tags}>
      {picks.map((name) => (
        <span key={name} className={styles.tagChip}>
          {name}
          <button type="button" className={styles.tagRemove} onClick={() => remove(name)} aria-label={`Remove ${name}`}>
            ×
          </button>
        </span>
      ))}
      {picks.length < choice.count && (
        <button type="button" className={styles.addBtn} onClick={() => setOpen(true)}>
          + Add {kind}
        </button>
      )}
      {open && entity && (
        <SelectorPanel
          entity={entity}
          db={db}
          currentId={null}
          exclude={(raw) => isOwned(owned, kind, raw.name)}
          onSelect={add}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

/** Pool MISTO (ex: Skilled "3 skills or tools"): chips + um "+ Add" por tipo. */
function MixedChoice({ choice, picks, onChange, db, owned }) {
  const [addKind, setAddKind] = useState(null);

  const add = (kind, raw) => {
    const value = kind === 'skill' ? skillCode(raw.name) : raw.name;
    if (!picks.some((p) => p.value === value) && picks.length < choice.count) {
      onChange({ kind: choice.kind, picks: [...picks, { kind, value }] });
    }
    setAddKind(null);
  };
  const remove = (value) => onChange({ kind: choice.kind, picks: picks.filter((p) => p.value !== value) });
  const labelFor = (p) => (p.kind === 'skill' ? (SKILL_LABEL[p.value] ?? p.value) : p.value);

  return (
    <div className={styles.tags}>
      {picks.map((p) => (
        <span key={p.value} className={styles.tagChip}>
          {labelFor(p)}
          <button type="button" className={styles.tagRemove} onClick={() => remove(p.value)} aria-label={`Remove ${labelFor(p)}`}>
            ×
          </button>
        </span>
      ))}
      {picks.length < choice.count &&
        choice.pool.of.map((kind) => (
          <button key={kind} type="button" className={styles.addBtn} onClick={() => setAddKind(kind)}>
            + Add {kind}
          </button>
        ))}
      {addKind && ADD_ENTITY[addKind] && (
        <SelectorPanel
          entity={ADD_ENTITY[addKind]}
          db={db}
          currentId={null}
          exclude={(raw) => isOwned(owned, addKind, addKind === 'skill' ? skillCode(raw.name) : raw.name)}
          onSelect={(raw) => add(addKind, raw)}
          onClose={() => setAddKind(null)}
        />
      )}
    </div>
  );
}

/** Escolha de talento: PickerField por slot; cada talento escolhido RECURSA. */
function FeatChoice({ choice, entry, picks, onChange, db, owned }) {
  const setPick = (index, featId) => {
    const oldId = picks[index];
    const nextPicks = [...picks];
    if (featId == null) nextPicks.splice(index, 1);
    else nextPicks[index] = featId;
    const sub = { ...(entry?.sub ?? {}) };
    if (oldId && oldId !== featId) delete sub[oldId];
    onChange({ kind: 'feat', picks: nextPicks.filter(Boolean), sub });
  };
  const setSub = (featId, subBag) =>
    onChange({ kind: 'feat', picks, sub: { ...(entry?.sub ?? {}), [featId]: subBag } });

  return (
    <div className={styles.list}>
      {Array.from({ length: choice.count }).map((_, i) => {
        const featId = picks[i] ?? null;
        const featData = featId ? resolveFeat(db, featId) : null;
        const subChoices = featData ? parseChoices(featData) : [];
        const [name, source] = featId ? featId.split('|') : [];
        return (
          <div className={styles.featSlot} key={i}>
            <PickerField
              entity={originFeatEntity}
              db={db}
              current={featId ? { label: name, source, id: featId } : null}
              placeholder="Choose feat…"
              // Esconde talentos já tomados na ficha — exceto o deste slot e os repeatable.
              exclude={(raw) => {
                const id = `${raw.name}|${raw.source}`;
                if (id === featId || raw.repeatable) return false;
                return owned?.feats?.has(id) ?? false;
              }}
              onSelect={(raw) => setPick(i, `${raw.name}|${raw.source}`)}
              onClear={() => setPick(i, null)}
            />
            {subChoices.length > 0 && (
              <div className={styles.nested}>
                <ChoiceList
                  choices={subChoices}
                  bag={entry?.sub?.[featId] ?? {}}
                  db={db}
                  owned={owned}
                  onChange={(subBag) => setSub(featId, subBag)}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
