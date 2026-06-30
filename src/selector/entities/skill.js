// =============================================================================
// Entity config: Skill
// =============================================================================
// Usada nos pools MISTOS (ex: Skilled "3 skills or tools") para adicionar perícia
// via SelectorPanel. Lista enxuta (18), mas reusa o mesmo painel genérico.
// -----------------------------------------------------------------------------

import { latestOnly } from '../reprints';

const skillEntity = {
  type: 'skill',
  title: 'Skill',

  list: (db) => latestOnly(db?.skills?.skill ?? []),

  idOf: (s) => s.name,

  precompute: (s) => ({
    searchText: `${s.name} ${s.source}`.toLowerCase(),
    filterValues: { source: [s.source].filter(Boolean) },
  }),

  filters: [{ id: 'source', header: 'Source', derive: true }],

  card: (s) => ({ title: s.name, subtitle: s.source, badges: [] }),
};

export default skillEntity;
