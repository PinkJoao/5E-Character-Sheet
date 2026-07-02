// =============================================================================
// ChoiceList — renderer GENÉRICO e RECURSIVO de sub-escolhas
// =============================================================================
// Recebe descritores `Choice[]` (de engine/choices.parseChoices ou
// engine/classFeatureChoices) + o "choice-bag" salvo, e renderiza cada escolha
// conforme o tipo de pool:
//   - list / any       → chips removíveis + "+ Add" (SelectorPanel)
//   - any [skill,tool] → MISTO (Skilled): "+ Add" por tipo, budget compartilhado
//   - expertise        → como skill, restrito às perícias PROFICIENTES
//   - weapon           → armas com mastery (Weapon Mastery)
//   - ability          → ASI embutido em talento (+2/um ou +1/dois no feat ASI)
//   - feat             → PickerField (categoria do pool: O/G/FS/EB); ao escolher
//                        um talento, RECURSA renderizando as escolhas DELE
//                        logo abaixo (Pathbuilder-style).
//
// DEDUP: recebe `owned` (tudo que a ficha já tem) e impede escolher a mesma
// coisa duas vezes. Feats `repeatable` (ex: Skilled, ASI) escapam do dedup.
// -----------------------------------------------------------------------------

import { useState } from 'react';
import { parseChoices } from '../../engine/choices';
import { resolveFeat } from '../../engine/resolve';
import { skillCode } from '../../engine/classData';
import { prereqContext, prereqStatus } from '../../engine/prereq';
import { ABILITIES } from '../../schema/character';
import PickerField from '../common/PickerField';
import ClearableSelect from '../common/ClearableSelect';
import SelectorPanel from '../../selector/SelectorPanel';
import { makeFeatEntity, FEAT_CATEGORY_TITLE, hasFreeLegacyBonus } from '../../selector/entities/feat';
import skillEntity from '../../selector/entities/skill';
import toolEntity from '../../selector/entities/tool';
import languageEntity from '../../selector/entities/language';
import weaponEntity from '../../selector/entities/weapon';
import { SKILL_LABEL, ABILITY_FULL } from './labels';
import styles from './ChoiceList.module.css';

const ADD_ENTITY = {
  skill: skillEntity,
  tool: toolEntity,
  language: languageEntity,
  expertise: skillEntity, // expertise escolhe entre perícias
  weapon: weaponEntity,
};
const OWNED_KEY = { skill: 'skills', tool: 'tools', language: 'languages', expertise: 'expertise' };

/** Kinds que guardam CÓDIGO de perícia (comparação sem normalizar caixa). */
const SKILL_LIKE = new Set(['skill', 'expertise']);

/** Normaliza um valor p/ comparação: skill = código; tool/language = minúsculas. */
function normVal(kind, v) {
  return SKILL_LIKE.has(kind) ? v : String(v).toLowerCase();
}

/** Bônus livre (+1 em qualquer) sintetizado p/ feats LEGACY sem campo ability —
 * padrão de adaptação DMG 2024 (Plutonium faz o mesmo). */
const LEGACY_ABILITY_CHOICE = {
  id: 'ability-legacy',
  kind: 'ability',
  count: 1,
  label: 'Ability Score Increase',
  pool: { type: 'ability', alternatives: [{ from: [...ABILITIES], count: 1, amount: 1 }] },
};

/** O valor já está na ficha (qualquer fonte)? */
function isOwned(owned, kind, value) {
  return owned?.[OWNED_KEY[kind]]?.has(normVal(kind, value)) ?? false;
}

export default function ChoiceList({ choices, bag, onChange, db, owned, character }) {
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
        <ChoiceRow
          key={c.id}
          choice={c}
          entry={bag?.[c.id]}
          onChange={(e) => setEntry(c.id, e)}
          db={db}
          owned={owned}
          character={character}
        />
      ))}
    </div>
  );
}

function ChoiceRow({ choice, entry, onChange, db, owned, character }) {
  const picks = entry?.picks ?? [];

  // Contador: no pool 'ability' o alvo depende da ALTERNATIVA escolhida
  // (+2 em um = 1 pick; +1 em dois = 2 picks); sem alternativa, oculto.
  let counter = `${picks.length}/${choice.count}`;
  if (choice.pool.type === 'ability') {
    const alts = choice.pool.alternatives;
    const alt = entry?.alt ?? (alts.length === 1 ? 0 : null);
    counter = alt == null ? null : `${picks.length}/${alts[alt].count}`;
  }

  return (
    <div className={styles.choice}>
      <div className={styles.head}>
        <span className={styles.label}>{choice.label}</span>
        {counter && <span className={styles.counter}>{counter}</span>}
      </div>
      {choice.pool.type === 'feat' ? (
        <FeatChoice choice={choice} entry={entry} picks={picks} onChange={onChange} db={db} owned={owned} character={character} />
      ) : choice.pool.type === 'ability' ? (
        <AbilityChoice choice={choice} entry={entry} picks={picks} onChange={onChange} />
      ) : choice.pool.type === 'any' && Array.isArray(choice.pool.of) ? (
        <MixedChoice choice={choice} picks={picks} onChange={onChange} db={db} owned={owned} />
      ) : (
        // "any" OU "list" (skill/tool/language/expertise/weapon) → SelectorPanel
        // (mostra descrição); pool de LISTA fica restrito às suas opções.
        <TagChoice choice={choice} picks={picks} onChange={onChange} db={db} owned={owned} />
      )}
    </div>
  );
}

/** Escolha via SelectorPanel (com descrição): chips removíveis + "+ Add". Trata
 * "any" (todo o pool), "list" (restrito às opções), "expertise" (restrito às
 * perícias proficientes) e "weapon". Skills/expertise guardam o CÓDIGO. */
function TagChoice({ choice, picks, onChange, db, owned }) {
  const [open, setOpen] = useState(false);
  const kind = choice.kind;
  const entity = ADD_ENTITY[kind];
  const skillLike = SKILL_LIKE.has(kind);
  const allowed =
    choice.pool.type === 'list'
      ? new Set(choice.pool.options.map((o) => String(o.value).toLowerCase()))
      : null;
  const valueOf = (raw) => (skillLike ? skillCode(raw.name) : raw.name);
  const labelOf = (v) => (skillLike ? (SKILL_LABEL[v] ?? v) : v);
  const addLabel = kind === 'expertise' ? 'skill' : kind;

  const add = (raw) => {
    const value = valueOf(raw);
    if (!picks.includes(value) && picks.length < choice.count) {
      onChange({ kind, picks: [...picks, value] });
    }
    setOpen(false);
  };
  const remove = (value) => onChange({ kind, picks: picks.filter((p) => p !== value) });

  return (
    <div className={styles.tags}>
      {picks.map((value) => (
        <span key={value} className={styles.tagChip}>
          {labelOf(value)}
          <button type="button" className={styles.tagRemove} onClick={() => remove(value)} aria-label={`Remove ${labelOf(value)}`}>
            ×
          </button>
        </span>
      ))}
      {picks.length < choice.count && (
        <button type="button" className={styles.addBtn} onClick={() => setOpen(true)}>
          + Add {addLabel}
        </button>
      )}
      {open && entity && (
        <SelectorPanel
          entity={entity}
          db={db}
          currentId={null}
          exclude={(raw) => {
            const v = valueOf(raw);
            if (allowed && !allowed.has(String(v).toLowerCase())) return true;
            // Dedup: expertise exclui perícias JÁ com expertise (owned.expertise);
            // skill/tool/language excluem o que a ficha já tem; weapon não dedupa.
            return isOwned(owned, kind, v);
          }}
          onSelect={add}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

/**
 * ASI embutido num talento (pool 'ability'). Com uma alternativa só (ex:
 * Athlete: +1 em Str ou Dex) mostra direto os selects; com várias (feat ASI:
 * +2 em um OU +1 em dois) mostra botões de modo antes. Picks: {ability, amount}.
 */
function AbilityChoice({ choice, entry, picks, onChange }) {
  const alts = choice.pool.alternatives;
  const alt = entry?.alt ?? (alts.length === 1 ? 0 : null);
  const spec = alt != null ? alts[alt] : null;

  const altLabel = (a) => `+${a.amount} to ${a.count === 1 ? 'one' : a.count === 2 ? 'two' : a.count} ${a.count === 1 ? 'ability' : 'abilities'}`;
  const setAlt = (i) => onChange({ kind: 'ability', alt: i, picks: [] });
  const setAbility = (slot, ability) => {
    const next = picks.slice(0, spec.count);
    next[slot] = ability ? { ability, amount: spec.amount } : null;
    onChange({ kind: 'ability', alt, picks: next.filter(Boolean) });
  };
  const used = new Set(picks.map((p) => p.ability));

  return (
    <div className={styles.abilityChoice}>
      {alts.length > 1 && (
        <div className={styles.modeRow}>
          {alts.map((a, i) => (
            <button
              key={i}
              type="button"
              className={alt === i ? `${styles.modeBtn} ${styles.modeActive}` : styles.modeBtn}
              onClick={() => setAlt(i)}
            >
              {altLabel(a)}
            </button>
          ))}
        </div>
      )}
      {spec && (
        <div className={styles.abilityRows}>
          {Array.from({ length: spec.count }).map((_, i) => {
            const current = picks[i]?.ability ?? '';
            return (
              <div className={styles.abilityRow} key={i}>
                <span className={styles.abilityAmount}>+{spec.amount}</span>
                <ClearableSelect value={current} onChange={(v) => setAbility(i, v)} placeholder="Choose ability…">
                  {spec.from
                    .filter((a) => !used.has(a) || a === current)
                    .map((a) => (
                      <option key={a} value={a}>
                        {ABILITY_FULL[a] ?? a}
                      </option>
                    ))}
                </ClearableSelect>
              </div>
            );
          })}
        </div>
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

/** Escolha de talento: PickerField por slot (entity da CATEGORIA do pool —
 * O/G/FS/EB, ciente do personagem p/ colorir pré-requisitos); cada talento
 * escolhido RECURSA (sub-escolhas, incl. ASI; legacy ganha +1 livre). */
function FeatChoice({ choice, entry, picks, onChange, db, owned, character }) {
  const cats = choice.pool.category ?? ['O'];
  // Pools de Fighting Style CONCEDEM a feature homônima — pré-requisito atendido.
  const granted = cats.some((c) => c.startsWith('FS')) ? ['Fighting Style'] : [];
  const ctx = character ? prereqContext(character, { db, grantedFeatures: granted }) : null;
  const featEntity = makeFeatEntity(cats, FEAT_CATEGORY_TITLE[cats[0]] ?? 'Feat', ctx);

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

  // Selecionar sem cumprir pré-requisito pede confirmação; incerto manda
  // confirmar com o mestre.
  const confirmPick = (index, raw) => {
    if (ctx) {
      const status = prereqStatus(raw, ctx);
      if (
        status === 'bad' &&
        !window.confirm(`${raw.name} has prerequisites your character does not meet. Select it anyway?`)
      ) {
        return;
      }
      if (
        status === 'unknown' &&
        !window.confirm(
          `${raw.name} has prerequisites that can't be checked automatically. Confirm with your Dungeon Master. Select it anyway?`,
        )
      ) {
        return;
      }
    }
    setPick(index, `${raw.name}|${raw.source}`);
  };

  return (
    <div className={styles.list}>
      {Array.from({ length: choice.count }).map((_, i) => {
        const featId = picks[i] ?? null;
        const featData = featId ? resolveFeat(db, featId) : null;
        // Feats LEGACY sem bônus próprio ganham +1 livre (adaptação DMG 2024).
        const subChoices = featData
          ? [...parseChoices(featData), ...(hasFreeLegacyBonus(featData) ? [LEGACY_ABILITY_CHOICE] : [])]
          : [];
        const [name, source] = featId ? featId.split('|') : [];
        return (
          <div className={styles.featSlot} key={i}>
            <PickerField
              entity={featEntity}
              db={db}
              current={featId ? { label: name, source, id: featId } : null}
              placeholder="Choose feat…"
              // Esconde talentos já tomados na ficha — exceto o deste slot e os repeatable.
              exclude={(raw) => {
                const id = `${raw.name}|${raw.source}`;
                if (id === featId || raw.repeatable) return false;
                return owned?.feats?.has(id) ?? false;
              }}
              onSelect={(raw) => confirmPick(i, raw)}
              onClear={() => setPick(i, null)}
            />
            {subChoices.length > 0 && (
              <div className={styles.nested}>
                <ChoiceList
                  choices={subChoices}
                  bag={entry?.sub?.[featId] ?? {}}
                  db={db}
                  owned={owned}
                  character={character}
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
