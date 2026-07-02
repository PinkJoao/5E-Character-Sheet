// =============================================================================
// Choices — modelo generalizado de SUB-ESCOLHAS (estilo Pathbuilder)
// =============================================================================
// Muitas features dão escolhas, e escolhas podem dar OUTRAS escolhas (um talento
// escolhido tem as próprias sub-escolhas; uma invocação pode conceder magias ou
// talentos). Este módulo é a base disso, em duas partes PURAS:
//
//  1. parseChoices(entity)  — lê os campos de escolha de uma entidade 5etools
//     (espécie, talento, feature) e devolve descritores `Choice[]` uniformes.
//  2. collectChoicePicks(bag, kind) — caminha RECURSIVAMENTE pelo "choice-bag"
//     salvo no personagem e junta as seleções de um tipo (ex: todas as perícias).
//
// O formato salvo (choice-bag) é recursivo:
//   bag = { [choiceId]: { kind, picks: string[], sub?: { [pickValue]: bag } } }
// onde `sub` guarda as sub-escolhas de cada pick que é, ele mesmo, uma feature
// com escolhas (ex: um talento escolhido dentro de uma escolha de talento).
// -----------------------------------------------------------------------------

import { skillCode } from './classData';

/**
 * @typedef {Object} Choice
 * @property {string} id        estável dentro da entidade (ex: 'skill-0')
 * @property {'skill'|'tool'|'language'|'feat'} kind
 * @property {number} count     quantos escolher
 * @property {string} label
 * @property {ChoicePool} pool
 *
 * @typedef {(
 *   { type:'list', options: {value:string,label:string}[] } |
 *   { type:'any', of:'skill'|'tool'|'language' } |
 *   { type:'feat', category?: string[] }
 * )} ChoicePool
 */

const KIND_NOUN = { skill: 'skill', tool: 'tool', language: 'language', feat: 'feat' };

export function titleCase(s) {
  return String(s)
    .split(' ')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

function noun(kind, count) {
  const n = KIND_NOUN[kind] ?? kind;
  return count > 1 ? `${n}s` : n;
}

function toOption(kind, raw) {
  if (kind === 'skill') return { value: skillCode(raw), label: titleCase(raw) };
  return { value: String(raw), label: titleCase(raw) };
}

/** Lê um bloco de proficiências (skill/tool/language) e empurra os Choices. */
function parseProfField(field, kind, push) {
  for (const entry of field ?? []) {
    if (!entry || typeof entry !== 'object') continue;
    if (entry.choose) {
      const count = entry.choose.count ?? 1;
      push({
        kind,
        count,
        label: count > 1 ? `Choose ${count} ${noun(kind, count)}` : `Choose a ${noun(kind, 1)}`,
        pool: { type: 'list', options: (entry.choose.from ?? []).map((v) => toOption(kind, v)) },
      });
    } else if (entry.any != null) {
      push({
        kind,
        count: entry.any,
        label: entry.any > 1 ? `Choose ${entry.any} ${noun(kind, entry.any)}` : `Choose any ${noun(kind, 1)}`,
        pool: { type: 'any', of: kind },
      });
    }
    // entrada fixa { x: true } é um GRANT (não escolha) — ignorada aqui.
  }
}

// Tokens "any*" do 5etools → tipo (ver render.js _SKILL_TOOL_LANGUAGE_KEYS_*).
const TOKEN_KIND = {
  anySkill: 'skill',
  anyTool: 'tool',
  anyArtisansTool: 'tool',
  anyMusicalInstrument: 'tool',
  anyToolProficiency: 'tool',
  anyLanguage: 'language',
  anyStandardLanguage: 'language',
  anyExoticLanguage: 'language',
  anyRareLanguage: 'language',
};

/**
 * Lê `skillToolLanguageProficiencies` (campo COMBINADO; ex: Skilled). O `choose`
 * pode ser objeto OU array, e o `from` traz tokens any* misturados → pool de um
 * tipo, ou MISTO (skill+tool) quando há mais de um tipo.
 */
function parseStlField(field, push) {
  for (const entry of field ?? []) {
    if (!entry || typeof entry !== 'object' || !entry.choose) continue;
    const specs = Array.isArray(entry.choose) ? entry.choose : [entry.choose];
    for (const spec of specs) {
      const count = spec.count ?? 1;
      const kinds = [];
      for (const f of spec.from ?? []) {
        const k = TOKEN_KIND[f];
        if (k && !kinds.includes(k)) kinds.push(k);
      }
      if (kinds.length === 0) continue; // entradas fixas nomeadas: fora de escopo
      const mixed = kinds.length > 1;
      const word = mixed ? kinds.join(' or ') : noun(kinds[0], count);
      push({
        kind: mixed ? 'mixed' : kinds[0],
        count,
        label: count > 1 ? `Choose ${count} ${word}` : `Choose a ${word}`,
        pool: { type: 'any', of: mixed ? kinds : kinds[0] },
      });
    }
  }
}

/**
 * Lê o campo `ability` de um TALENTO (ASI embutido). Cada entrada com `choose` é
 * uma ALTERNATIVA (o feat "Ability Score Improvement" tem duas: +2 em um OU +1
 * em dois); a maioria dos feats General tem uma só (+1 em str/dex, etc.).
 * Vira UM Choice kind 'ability' com pool {type:'ability', alternatives:[...]},
 * onde cada alternativa é {from, count, amount} normalizada.
 */
function parseAbilityField(field, push) {
  const alternatives = [];
  for (const entry of field ?? []) {
    if (!entry || typeof entry !== 'object' || !entry.choose) continue;
    const c = entry.choose;
    alternatives.push({
      from: c.from ?? [],
      count: c.count ?? 1,
      amount: c.amount ?? 1,
    });
  }
  if (alternatives.length === 0) return;
  push({
    kind: 'ability',
    count: 1,
    label: 'Ability Score Increase',
    pool: { type: 'ability', alternatives },
  });
}

/** Lê o campo `feats` (concede talento à escolha — recursivo). */
function parseFeatField(field, push) {
  for (const entry of field ?? []) {
    if (!entry || typeof entry !== 'object') continue;
    if (entry.anyFromCategory) {
      const count = entry.anyFromCategory.count ?? 1;
      push({
        kind: 'feat',
        count,
        label: count > 1 ? `Choose ${count} feats` : 'Choose a feat',
        pool: { type: 'feat', category: entry.anyFromCategory.category },
      });
    } else if (entry.any != null) {
      push({ kind: 'feat', count: entry.any, label: 'Choose a feat', pool: { type: 'feat' } });
    }
  }
}

/**
 * Extrai os descritores de escolha de uma entidade 5etools (espécie/talento).
 * @param {object} entity
 * @returns {Choice[]}
 */
export function parseChoices(entity) {
  const raw = [];
  const push = (c) => raw.push(c);
  parseAbilityField(entity?.ability, push);
  parseProfField(entity?.skillProficiencies, 'skill', push);
  parseProfField(entity?.toolProficiencies, 'tool', push);
  parseProfField(entity?.languageProficiencies, 'language', push);
  parseStlField(entity?.skillToolLanguageProficiencies, push);
  parseFeatField(entity?.feats, push);

  // ids estáveis por tipo: skill-0, skill-1, tool-0, feat-0…
  const counters = {};
  return raw.map((c) => {
    const n = counters[c.kind] ?? 0;
    counters[c.kind] = n + 1;
    return { ...c, id: `${c.kind}-${n}` };
  });
}

/**
 * Caminha recursivamente por um choice-bag salvo e junta os picks de um tipo.
 * @param {object} bag
 * @param {'skill'|'tool'|'language'|'feat'} kind
 * @param {string[]} [out]
 * @returns {string[]}
 */
export function collectChoicePicks(bag, kind, out = []) {
  for (const choice of Object.values(bag ?? {})) {
    if (!choice || typeof choice !== 'object') continue;
    // Picks podem ser strings (pool de um tipo) ou {kind,value} (pool MISTO).
    for (const pick of choice.picks ?? []) {
      const pk = pick && typeof pick === 'object' ? pick.kind : choice.kind;
      const pv = pick && typeof pick === 'object' ? pick.value : pick;
      if (pk === kind) out.push(pv);
    }
    if (choice.sub) {
      for (const sub of Object.values(choice.sub)) collectChoicePicks(sub, kind, out);
    }
  }
  return out;
}

/**
 * Caminha recursivamente por um choice-bag e junta os aumentos de atributo
 * (choices kind 'ability', com picks {ability, amount}) — inclusive os embutidos
 * em talentos escolhidos (sub-bags, ex: ASI dentro de um slot de feat de classe).
 * @param {object} bag
 * @param {{ability:string, amount:number}[]} [out]
 * @returns {{ability:string, amount:number}[]}
 */
export function collectAbilityPicks(bag, out = []) {
  for (const choice of Object.values(bag ?? {})) {
    if (!choice || typeof choice !== 'object') continue;
    if (choice.kind === 'ability') {
      for (const pick of choice.picks ?? []) {
        if (pick && typeof pick === 'object' && pick.ability && pick.amount) out.push(pick);
      }
    }
    if (choice.sub) {
      for (const sub of Object.values(choice.sub)) collectAbilityPicks(sub, out);
    }
  }
  return out;
}
