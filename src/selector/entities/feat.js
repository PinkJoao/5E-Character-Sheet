// =============================================================================
// Entity config: Origin Feat (talento de origem)
// =============================================================================
// Talentos com categoria "O" (origin). Mesmo padrão da entity de raça: list /
// idOf / precompute / filters / card. Reusa o SelectorPanel.
// -----------------------------------------------------------------------------

import { latestOnly } from '../reprints';

function isOriginFeat(f) {
  return f.category === 'O' || (Array.isArray(f.category) && f.category.includes('O'));
}

const originFeatEntity = {
  type: 'feat',
  title: 'Origin Feat',

  list: (db) => latestOnly(db?.feats?.feat ?? []).filter(isOriginFeat),

  idOf: (f) => `${f.name}|${f.source}`,

  precompute: (f) => ({
    searchText: `${f.name} ${f.source}`.toLowerCase(),
    filterValues: {
      source: [f.source].filter(Boolean),
      trait: f.prerequisite ? ['prerequisite'] : [],
    },
  }),

  filters: [
    { id: 'source', header: 'Source', derive: true },
    { id: 'trait', header: 'Traits', options: [{ value: 'prerequisite', label: 'Has Prerequisite' }] },
  ],

  card: (f) => ({
    title: f.name,
    subtitle: f.source,
    badges: f.prerequisite ? ['Prereq'] : [],
  }),
};

export default originFeatEntity;
