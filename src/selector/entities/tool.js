// =============================================================================
// Entity config: Tool (ferramentas, instrumentos, kits de jogo)
// =============================================================================
// baseitem filtrado pelos tipos de ferramenta. Dedup por nome (prefere XPHB).
// Filtro por categoria derivada do prefixo do tipo (AT/INS/GS/T).
// -----------------------------------------------------------------------------

import { latestOnly, dedupeByName } from '../reprints';

const TOOL_TYPES = ['AT', 'GS', 'T', 'INS'];
const TOOL_CAT = {
  AT: "Artisan's Tools",
  INS: 'Musical Instrument',
  GS: 'Gaming Set',
  T: 'Tool',
};

function toolCat(item) {
  const prefix = (item.type ?? '').split('|')[0];
  return TOOL_CAT[prefix] ?? 'Tool';
}

const toolEntity = {
  type: 'tool',
  title: 'Tool',

  list: (db) =>
    dedupeByName(
      latestOnly(db?.['items-base']?.baseitem ?? []).filter(
        (i) => i.type && TOOL_TYPES.includes(i.type.split('|')[0]),
      ),
    ),

  idOf: (i) => i.name,

  precompute: (i) => ({
    searchText: i.name.toLowerCase(),
    filterValues: { category: [toolCat(i)] },
  }),

  filters: [{ id: 'category', header: 'Category', derive: true }],

  card: (i) => ({
    title: i.name,
    subtitle: toolCat(i),
    badges: [],
  }),
};

export default toolEntity;
