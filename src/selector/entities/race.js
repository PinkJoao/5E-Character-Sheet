// =============================================================================
// Entity config: Species (Race)
// =============================================================================
// Models the relevant filters (à la 5etools filter-races.js). Filter VALUES are
// stable, language-independent KEYS (e.g. 'fly', 'spellcasting'); the LABELS are
// kept in separate maps. A future translator only swaps the label maps — the
// matching logic and any saved filter state never break.
// -----------------------------------------------------------------------------

import { latestOnly } from '../reprints';

// --- Stable keys → display labels (the only place a translator touches) -------
const SIZE_LABEL = { T: 'Tiny', S: 'Small', M: 'Medium', L: 'Large', V: 'Varies' };

const SPEED_LABEL = { walk: 'Walk', fly: 'Fly', swim: 'Swim', climb: 'Climb' };

const TRAIT_LABEL = {
  darkvision: 'Darkvision',
  'superior-darkvision': 'Superior Darkvision',
  blindsight: 'Blindsight',
  spellcasting: 'Spellcasting',
  'skill-proficiency': 'Skill Proficiency',
  'tool-proficiency': 'Tool Proficiency',
  'damage-resistance': 'Damage Resistance',
  'natural-armor': 'Natural Armor',
  'powerful-build': 'Powerful Build',
  'improved-resting': 'Improved Resting',
};

// --- Derivation: 5etools fields → stable keys ---------------------------------
function speedKeys(speed) {
  if (speed == null) return [];
  const s = typeof speed === 'number' ? { walk: speed } : speed;
  const keys = [];
  if (s.walk) keys.push('walk');
  if (s.fly) keys.push('fly');
  if (s.swim) keys.push('swim');
  if (s.climb) keys.push('climb');
  return keys;
}

function traitKeys(race) {
  const keys = [];
  if (race.darkvision >= 120) keys.push('superior-darkvision');
  else if (race.darkvision) keys.push('darkvision');
  if (race.blindsight) keys.push('blindsight');
  if (race.additionalSpells) keys.push('spellcasting');
  if (race.skillProficiencies) keys.push('skill-proficiency');
  if (race.toolProficiencies) keys.push('tool-proficiency');
  if (race.resist) keys.push('damage-resistance');
  if (Array.isArray(race.traitTags)) {
    if (race.traitTags.includes('Natural Armor')) keys.push('natural-armor');
    if (race.traitTags.includes('Powerful Build')) keys.push('powerful-build');
    if (race.traitTags.includes('Improved Resting')) keys.push('improved-resting');
  }
  return keys;
}

/** Builds the {value,label} option list for a fixed-key filter. */
function options(labelMap) {
  return Object.entries(labelMap).map(([value, label]) => ({ value, label }));
}

const raceEntity = {
  type: 'race',
  title: 'Species',

  // Só versões atuais (latestOnly) e JOGÁVEIS — fora as "NPC Species" (raças
  // monstruosas do DMG 2014, marcadas com traitTags "NPC Race"; o 5etools as
  // esconde por padrão pelo filtro "NPC Species").
  list: (db) =>
    latestOnly(db?.races?.race ?? []).filter((r) => !r.traitTags?.includes('NPC Race')),

  idOf: (race) => `${race.name}|${race.source}`,

  /** Precompute search text + filter values (stable keys), once per item. */
  precompute: (race) => {
    const sizes = (Array.isArray(race.size) ? race.size : [race.size]).filter(Boolean);
    return {
      searchText: `${race.name} ${race.source}`.toLowerCase(),
      filterValues: {
        source: [race.source].filter(Boolean),
        size: sizes, // keys: T/S/M/L/V
        speed: speedKeys(race.speed),
        trait: traitKeys(race),
      },
    };
  },

  filters: [
    { id: 'source', header: 'Source', derive: true },
    { id: 'size', header: 'Size', options: options(SIZE_LABEL) },
    { id: 'speed', header: 'Speed', options: options(SPEED_LABEL) },
    { id: 'trait', header: 'Traits', options: options(TRAIT_LABEL) },
  ],

  card: (race) => ({
    title: race.name,
    subtitle: race.source,
    badges: traitKeys(race).slice(0, 3).map((k) => TRAIT_LABEL[k]),
  }),

  // Lore + imagens (fluff-races.json) p/ o DetailView. Tenta nome+fonte e, na
  // falta, qualquer fonte com o mesmo nome.
  fluff: (race, db) => {
    const list = db?.['fluff-races']?.raceFluff ?? [];
    return (
      list.find((f) => f.name === race.name && f.source === race.source) ??
      list.find((f) => f.name === race.name) ??
      null
    );
  },
};

export default raceEntity;
