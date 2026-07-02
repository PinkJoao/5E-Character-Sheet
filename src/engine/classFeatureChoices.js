// =============================================================================
// classFeatureChoices — escolhas POR NÍVEL das features de classe (Fase 6)
// =============================================================================
// As features 2024 (XPHB) são texto puro — não há dados estruturados de escolha.
// Detectamos pelo NOME da feature (como o Plutonium faz) e geramos descritores
// `Choice` (mesmo formato de engine/choices) para o ChoiceList:
//
//   Ability Score Improvement → talento (categoria G; o próprio feat "Ability
//                               Score Improvement" é um deles, repetível)
//   Epic Boon                 → talento (categoria EB)
//   Fighting Style            → talento (categoria FS; paladin/ranger têm
//                               variantes FS:P / FS:R)
//   Expertise                 → 2 perícias DAS QUE JÁ É PROFICIENTE
//   Weapon Mastery            → N armas (N vem da coluna "Weapon Mastery" da
//                               tabela da classe; sem coluna = 2 fixo)
//
// Os ids embutem o nível (ex: 'feat@4') p/ permitir PODAR o choice-bag quando o
// nível desce. Weapon Mastery tem id fixo (o count cresce com o nível, mas as
// escolhas persistem).
// -----------------------------------------------------------------------------

/** Variantes de Fighting Style por classe (além da categoria FS comum). */
const FS_EXTRA = { paladin: 'FS:P', ranger: 'FS:R' };

const EXPERTISE_COUNT = 2; // XPHB: toda feature Expertise concede 2 perícias.

/**
 * Quantas armas o Weapon Mastery cobre neste nível: coluna "Weapon Mastery" da
 * tabela da classe (fighter/barbarian escalam), senão 2 (paladin/ranger/rogue).
 * @param {object} classObj  objeto de classe 5etools (com classTableGroups)
 * @param {number} level
 */
export function weaponMasteryCount(classObj, level) {
  for (const g of classObj?.classTableGroups ?? []) {
    const col = (g.colLabels ?? []).findIndex((l) => String(l).includes('Weapon Mastery'));
    if (col >= 0) {
      const row = g.rows?.[level - 1];
      const n = Number(row?.[col]);
      if (Number.isFinite(n) && n > 0) return n;
    }
  }
  return 2;
}

/**
 * Gera os descritores de escolha por nível de uma classe.
 * @param {object} parsed    parseClass(classObj) — features com {name, level}
 * @param {object} classObj  objeto cru (p/ tabela do Weapon Mastery)
 * @param {number} level     nível atual da classe
 * @returns {import('./choices').Choice[]}
 */
export function classLevelChoices(parsed, classObj, level) {
  const out = [];
  let sawWeaponMastery = false;

  for (const f of parsed?.features ?? []) {
    if (f.level > level) continue;
    switch (f.name) {
      case 'Ability Score Improvement':
        out.push({
          id: `feat@${f.level}`,
          kind: 'feat',
          count: 1,
          label: `Level ${f.level} — Feat`,
          pool: { type: 'feat', category: ['G'] },
        });
        break;
      case 'Epic Boon':
        out.push({
          id: `feat@${f.level}`,
          kind: 'feat',
          count: 1,
          label: `Level ${f.level} — Epic Boon`,
          pool: { type: 'feat', category: ['EB'] },
        });
        break;
      case 'Fighting Style': {
        const cats = ['FS'];
        if (FS_EXTRA[parsed.id]) cats.push(FS_EXTRA[parsed.id]);
        out.push({
          id: `feat@${f.level}`,
          kind: 'feat',
          count: 1,
          label: `Level ${f.level} — Fighting Style`,
          pool: { type: 'feat', category: cats },
        });
        break;
      }
      case 'Expertise':
        out.push({
          id: `expertise@${f.level}`,
          kind: 'expertise',
          count: EXPERTISE_COUNT,
          label: `Level ${f.level} — Expertise`,
          pool: { type: 'expertise' }, // opções (perícias proficientes) vêm da UI
        });
        break;
      case 'Weapon Mastery':
        sawWeaponMastery = true;
        break;
      default:
        break;
    }
  }

  if (sawWeaponMastery) {
    const n = weaponMasteryCount(classObj, level);
    out.push({
      id: 'weaponMastery',
      kind: 'weapon',
      count: n,
      label: `Weapon Mastery`,
      pool: { type: 'weapon' },
    });
  }

  return out;
}

/**
 * Poda um choice-bag quando o nível DESCE: remove entradas cujo id embute um
 * nível maior que o novo (ex: 'feat@8' com nível 6). Ids sem '@' ficam.
 * @param {object} bag
 * @param {number} level
 * @returns {object}
 */
export function pruneChoicesAboveLevel(bag, level) {
  const out = {};
  for (const [id, entry] of Object.entries(bag ?? {})) {
    const at = id.indexOf('@');
    const lvl = at >= 0 ? Number(id.slice(at + 1)) : null;
    if (lvl != null && Number.isFinite(lvl) && lvl > level) continue;
    out[id] = entry;
  }
  return out;
}
