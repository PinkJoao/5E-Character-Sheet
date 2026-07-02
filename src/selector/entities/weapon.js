// =============================================================================
// Entity config: Weapon (para o Weapon Mastery — Fase 6)
// =============================================================================
// Armas base (items-base.json) que TÊM propriedade de maestria (2024/XPHB).
// Filtros: categoria (Simple/Martial) e tipo (Melee/Ranged). O meta mostra
// dano e a mastery property — o jogador compara antes de escolher.
// -----------------------------------------------------------------------------

import { latestOnly } from '../reprints';

const DMG_TYPE = { B: 'Bludgeoning', P: 'Piercing', S: 'Slashing' };

const isMelee = (w) => String(w.type).startsWith('M');
const masteryName = (w) => (w.mastery ?? []).map((m) => String(m).split('|')[0]).join(', ');

function cap(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function damageText(w) {
  if (!w.dmg1) return '—';
  return `${w.dmg1} ${DMG_TYPE[w.dmgType] ?? w.dmgType ?? ''}`.trim();
}

const weaponEntity = {
  type: 'weapon',
  title: 'Weapon',

  // Só armas com mastery (XPHB); latestOnly esconde as versões antigas (PHB).
  // Armas de fogo de outras eras (age: modern/futuristic…) ficam de fora — não
  // entram na escolha padrão de Weapon Mastery.
  list: (db) =>
    latestOnly(db?.['items-base']?.baseitem ?? []).filter(
      (i) => i.weaponCategory && i.mastery && !i.age
    ),

  idOf: (w) => `${w.name}|${w.source}`,

  precompute: (w) => ({
    searchText: `${w.name} ${w.source} ${masteryName(w)}`.toLowerCase(),
    filterValues: {
      category: [cap(w.weaponCategory)],
      kind: [isMelee(w) ? 'Melee' : 'Ranged'],
      mastery: [masteryName(w)].filter(Boolean),
    },
  }),

  filters: [
    { id: 'category', header: 'Category', options: ['Simple', 'Martial'] },
    { id: 'kind', header: 'Type', options: ['Melee', 'Ranged'] },
    { id: 'mastery', header: 'Mastery', derive: true },
  ],

  meta: (w) => [
    { label: 'Damage', value: damageText(w) },
    { label: 'Mastery', value: masteryName(w) || '—', highlight: true },
    ...(w.range ? [{ label: 'Range', value: w.range }] : []),
  ],

  card: (w) => ({
    title: w.name,
    subtitle: w.source,
    meta: `${damageText(w)} · ${cap(w.weaponCategory)}`,
    badges: [masteryName(w)].filter(Boolean),
  }),
};

export default weaponEntity;
