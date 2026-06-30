// =============================================================================
// Entity config: Subclass (fábrica — depende da classe escolhida)
// =============================================================================
// As subclasses ficam no arquivo da classe (db['class-X'].subclass). A lista é
// específica de cada classe, então a entity é gerada por uma função. latestOnly
// remove reprints (mostra só as versões atuais).
// -----------------------------------------------------------------------------

import { latestOnly } from '../reprints';

// Subclasses não usam reprintedAs de forma consistente (e há duplicatas na mesma
// fonte). Dedup por shortName, preferindo a versão 2024 (XPHB).
function dedupeByShortName(list) {
  const map = new Map();
  for (const s of list) {
    const cur = map.get(s.shortName);
    if (!cur || s.source === 'XPHB') map.set(s.shortName, s);
  }
  return [...map.values()];
}

/**
 * @param {string} classId  ex: 'fighter'
 * @param {string} [title]  título do painel (ex: "Fighter Subclass")
 */
export function makeSubclassEntity(classId, title = 'Subclass') {
  return {
    type: 'subclass',
    title,

    list: (db) => dedupeByShortName(latestOnly(db?.[`class-${classId}`]?.subclass ?? [])),

    idOf: (s) => `${s.shortName}|${s.source}`,

    precompute: (s) => ({
      searchText: `${s.name} ${s.source}`.toLowerCase(),
      filterValues: { source: [s.source].filter(Boolean) },
    }),

    filters: [{ id: 'source', header: 'Source', derive: true }],

    card: (s) => ({ title: s.name, subtitle: s.source, badges: [] }),
  };
}
