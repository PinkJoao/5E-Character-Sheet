// =============================================================================
// subclassPreview — monta os `entries` de uma subclasse para o preview
// =============================================================================
// No 5etools a subclasse é só uma lista de referências (`subclassFeatures`) que
// apontam para entradas em `db['class-X'].subclassFeature`. O texto de cada
// feature ainda pode conter `refSubclassFeature` (inclui outra feature inline —
// é assim que o Battle Master, por ex., traz "Combat Superiority"/"Maneuvers")
// e `refOptionalfeature` (aponta p/ manobras etc.). Resolvemos as referências e
// devolvemos uma árvore de entries pronta p/ o EntryContent, para o jogador ver
// TODAS as features da subclasse antes de escolher (como o Plutonium importa).
// -----------------------------------------------------------------------------

const norm = (s) => (s ?? '').toString().trim().toLowerCase();

/** Chave forte (com fonte) e chave frouxa (sem fonte) de uma feature. */
function strongKey(name, shortName, source, level) {
  return `${norm(name)}|${norm(shortName)}|${norm(source)}|${level}`;
}
function looseKey(name, shortName, level) {
  return `${norm(name)}|${norm(shortName)}|${level}`;
}

/** "name|className|classSource|subShortName|subSource|level" → objeto. */
function parseRef(ref) {
  const [name, , , shortName, source, level] = String(ref).split('|');
  return { name, shortName, source, level: Number(level) };
}

/**
 * Lista de features da subclasse com refs resolvidas/inlinadas.
 * @param {object} db
 * @param {string} classId       ex: 'fighter'
 * @param {object} subclass      objeto de subclasse (com subclassFeatures[])
 * @returns {{name:string, level:number, entries:Array}[]}
 */
export function subclassFeatureList(db, classId, subclass) {
  const features = db?.[`class-${classId}`]?.subclassFeature ?? [];
  if (!Array.isArray(subclass?.subclassFeatures)) return [];

  const byStrong = new Map();
  const byLoose = new Map();
  for (const f of features) {
    byStrong.set(strongKey(f.name, f.subclassShortName, f.subclassSource, f.level), f);
    byLoose.set(looseKey(f.name, f.subclassShortName, f.level), f);
  }
  const find = (r) =>
    byStrong.get(strongKey(r.name, r.shortName, r.source, r.level)) ??
    byLoose.get(looseKey(r.name, r.shortName, r.level)) ??
    null;

  const seen = new Set();
  const keyOf = (f) => strongKey(f.name, f.subclassShortName, f.subclassSource, f.level);

  // Expande refs dentro do corpo de uma feature (recursivo, à prova de ciclo).
  const expand = (entries) => {
    const out = [];
    for (const e of entries ?? []) {
      if (e && typeof e === 'object' && e.type === 'refSubclassFeature') {
        const f = find(parseRef(e.subclassFeature));
        if (f && !seen.has(keyOf(f))) {
          seen.add(keyOf(f));
          out.push({ type: 'entries', name: f.name, entries: expand(f.entries) });
        }
        continue;
      }
      if (e && typeof e === 'object' && (e.entries || e.items)) {
        const clone = { ...e };
        if (e.entries) clone.entries = expand(e.entries);
        if (e.items) clone.items = expand(e.items);
        out.push(clone);
        continue;
      }
      out.push(e);
    }
    return out;
  };

  const out = [];
  for (const ref of subclass.subclassFeatures) {
    const f = find(parseRef(ref));
    if (!f || seen.has(keyOf(f))) continue;
    seen.add(keyOf(f));
    out.push({ name: f.name, level: f.level, entries: expand(f.entries) });
  }
  return out;
}

/**
 * Entries prontos p/ o EntryContent (preview do seletor de subclasse).
 * @returns {Array}
 */
export function resolveSubclassEntries(db, classId, subclass) {
  return subclassFeatureList(db, classId, subclass).map((f) => ({
    type: 'entries',
    name: `Level ${f.level}: ${f.name}`,
    entries: f.entries,
  }));
}
