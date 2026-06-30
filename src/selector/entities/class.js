// =============================================================================
// Entity config: Class
// =============================================================================
// Uma entrada por classe (a versão mais recente — XPHB — via resolveClassObj).
// Filtros: tipo (caster/martial) e dado de vida.
// -----------------------------------------------------------------------------

import { CLASS_NAMES } from '../../data/config';
import { resolveClassObj } from '../../engine/resolve';

function isCaster(c) {
  return !!(c.casterProgression || c.spellcastingAbility);
}

const classEntity = {
  type: 'class',
  title: 'Class',

  list: (db) => CLASS_NAMES.map((n) => resolveClassObj(db, n)).filter(Boolean),

  idOf: (c) => `${c.name}|${c.source}`,

  precompute: (c) => ({
    searchText: `${c.name} ${c.source}`.toLowerCase(),
    filterValues: {
      type: [isCaster(c) ? 'caster' : 'martial'],
      die: [`d${c.hd?.faces ?? '?'}`],
    },
  }),

  filters: [
    {
      id: 'type',
      header: 'Type',
      options: [
        { value: 'caster', label: 'Spellcaster' },
        { value: 'martial', label: 'Martial' },
      ],
    },
    { id: 'die', header: 'Hit Die', derive: true },
  ],

  card: (c) => ({
    title: c.name,
    subtitle: c.source,
    badges: [`d${c.hd?.faces ?? '?'}`, ...(isCaster(c) ? ['Spellcaster'] : [])],
  }),
};

export default classEntity;
