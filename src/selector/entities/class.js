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

  // Texto "Info" da classe (fluff-class-*.json) → conteúdo principal do preview.
  entries: (c, db) => classFluff(c, db)?.entries ?? [],

  // Só a arte (as entries vêm de `entries()`, p/ não duplicar).
  fluff: (c, db) => {
    const images = classFluff(c, db)?.images;
    return images?.length ? { images } : null;
  },
};

/** Casa a classe com sua entrada de fluff (preferindo a mesma fonte). */
function classFluff(c, db) {
  const list = db?.[`fluff-class-${c.name.toLowerCase()}`]?.classFluff ?? [];
  return (
    list.find((f) => f.name === c.name && f.source === c.source) ??
    list.find((f) => f.name === c.name) ??
    list[0] ??
    null
  );
}

export default classEntity;
