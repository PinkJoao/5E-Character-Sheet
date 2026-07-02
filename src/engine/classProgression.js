// =============================================================================
// classProgression — features de classe + subclasse agrupadas por nível
// =============================================================================
// Monta a visão de progressão da aba Class (estilo página de classe do
// 5e.tools): para cada nível, as features de CLASSE (refs de
// classObj.classFeatures resolvidas em db['class-X'].classFeature) e, quando
// há subclasse escolhida, as features DELA (via subclassFeatureList, que já
// inlina refSubclassFeature). Puro: recebe db/objetos e devolve dados.
// -----------------------------------------------------------------------------

import { parseFeatureRef } from './classData';
import { subclassFeatureList } from './subclassPreview';
import { resolveOptionalRefs } from './optionalFeatures';

const norm = (s) => (s ?? '').toString().trim().toLowerCase();

/**
 * @typedef {Object} LevelFeatures
 * @property {number} level
 * @property {{key:string, name:string, entries:Array, from:'class'|'subclass'}[]} features
 */

/**
 * Resolve as features de CLASSE do objeto de classe.
 * @returns {{name:string, level:number, entries:Array}[]}
 */
function classFeatureItems(db, classId, classObj) {
  const pool = db?.[`class-${classId}`]?.classFeature ?? [];
  const byStrong = new Map();
  const byLoose = new Map();
  for (const f of pool) {
    byStrong.set(`${norm(f.name)}|${norm(f.classSource)}|${f.level}`, f);
    byLoose.set(`${norm(f.name)}|${f.level}`, f);
  }
  const out = [];
  for (const ref of classObj?.classFeatures ?? []) {
    const r = parseFeatureRef(ref); // {name, className, source(=classSource), level}
    const f =
      byStrong.get(`${norm(r.name)}|${norm(r.source || classObj.source)}|${r.level}`) ??
      byLoose.get(`${norm(r.name)}|${r.level}`);
    if (f) out.push({ name: f.name, level: f.level, entries: resolveOptionalRefs(f.entries ?? [], db) });
  }
  return out;
}

/**
 * Progressão completa (níveis 1..20) de uma classe, com subclasse opcional.
 * Níveis sem features não aparecem.
 * @param {object} db
 * @param {string} classId    ex: 'fighter'
 * @param {object} classObj   objeto de classe 5etools
 * @param {object} [subclass] objeto de subclasse (raw) ou null
 * @returns {LevelFeatures[]}
 */
export function classFeatureLevels(db, classId, classObj, subclass = null) {
  const byLevel = new Map();
  const push = (level, feature) => {
    if (!byLevel.has(level)) byLevel.set(level, []);
    byLevel.get(level).push(feature);
  };

  for (const f of classFeatureItems(db, classId, classObj)) {
    push(f.level, { key: `c|${f.name}|${f.level}`, name: f.name, entries: f.entries, from: 'class' });
  }
  if (subclass) {
    for (const f of subclassFeatureList(db, classId, subclass)) {
      push(f.level, { key: `s|${f.name}|${f.level}`, name: f.name, entries: f.entries, from: 'subclass' });
    }
  }

  return [...byLevel.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([level, features]) => ({ level, features }));
}

/**
 * Uma feature é "LONGA" (lista de opções extensa — invocations, maneuvers,
 * metamagic…)? Usado p/ começar colapsada na UI.
 */
export function isLongFeature(entries) {
  let refs = 0;
  let hasOptions = false;
  const walk = (e) => {
    if (Array.isArray(e)) return e.forEach(walk);
    if (!e || typeof e !== 'object') return;
    if (e.type === 'options') hasOptions = true;
    if (e.type === 'refOptionalfeature') refs += 1;
    if (e.entries) walk(e.entries);
    if (e.items) walk(e.items);
  };
  walk(entries);
  if (hasOptions || refs >= 6) return true;
  try {
    return JSON.stringify(entries ?? []).length > 3500;
  } catch {
    return false;
  }
}

// --- Tabela de progressão (classTableGroups) -----------------------------------

/** "+N" | "1d6" | número | string; 0 em coluna de slots vira "—". */
function cellText(v) {
  if (v == null) return '—';
  if (typeof v === 'object') {
    if (v.type === 'bonus') return `+${v.value}`;
    if (v.type === 'bonusSpeed') return `+${v.value} ft.`;
    if (v.type === 'dice') {
      return v.displayText ?? (v.toRoll ?? []).map((d) => `${d.number}d${d.faces}`).join('+');
    }
    return String(v.value ?? '');
  }
  if (v === 0) return '—';
  return String(v);
}

/**
 * Achata os classTableGroups numa tabela única: colunas (labels crus, podem
 * ter {@filter}) e 20 linhas [Level, PB, ...valores]. Subclasses com progressão
 * própria (Eldritch Knight, Arcane Trickster…) contribuem com seus
 * `subclassTableGroups` no final.
 * @param {object} classObj
 * @param {object} [subclass]
 * @returns {{cols: string[], rows: string[][]}|null}
 */
export function classTable(classObj, subclass = null) {
  const groups = [
    ...(classObj?.classTableGroups ?? []),
    ...(subclass?.subclassTableGroups ?? []),
  ];
  if (groups.length === 0) return null;
  const cols = ['Level', 'PB', ...groups.flatMap((g) => g.colLabels ?? [])];
  const rows = [];
  for (let i = 0; i < 20; i++) {
    const row = [String(i + 1), `+${Math.ceil((i + 1) / 4) + 1}`];
    for (const g of groups) {
      const src = g.rows ?? g.rowsSpellProgression ?? [];
      for (const v of src[i] ?? Array((g.colLabels ?? []).length).fill(null)) row.push(cellText(v));
    }
    rows.push(row);
  }
  return { cols, rows };
}
