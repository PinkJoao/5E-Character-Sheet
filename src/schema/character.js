// =============================================================================
// Schema do Personagem — o contrato central do builder
// =============================================================================
// Princípio de ouro: guardamos DECISÕES, não estado computado. O personagem
// salvo registra o que o jogador escolheu (scores base, talentos, perícias). O
// engine (Fase 3) deriva os números finais; o export (Fase 6) hidrata em
// documentos Foundry.
//
// Regras: somente 2024, com conteúdo legado adaptado. Criação custom — sem
// backgrounds prontos: a origem é montada peça por peça. Multiclasse suportado.
//
// Tipos via JSDoc (o projeto é JS puro + React Compiler; JSDoc dá dicas no
// editor sem precisar de build TypeScript).
// -----------------------------------------------------------------------------

/** Versão atual do schema. Incremente ao mudar a forma + adicione um migrate. */
export const CHARACTER_SCHEMA_VERSION = 1;

/** As seis habilidades, na ordem canônica. */
export const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

/**
 * @typedef {'str'|'dex'|'con'|'int'|'wis'|'cha'} Ability
 */

/**
 * @typedef {Object} AbilityScores  Scores BASE, antes de qualquer bônus.
 * @property {number} str
 * @property {number} dex
 * @property {number} con
 * @property {number} int
 * @property {number} wis
 * @property {number} cha
 */

/**
 * Como os scores base foram gerados.
 * @typedef {(
 *   { type: 'standard-array' } |
 *   { type: 'point-buy' } |
 *   { type: 'manual' } |
 *   { type: 'rolled', rolls: number[][] }
 * )} ScoreMethod
 */

/**
 * @typedef {Object} CharacterMeta
 * @property {string} name
 * @property {string|null} portrait    URL ou data-URI.
 * @property {string} createdAt        ISO 8601.
 * @property {string} updatedAt        ISO 8601.
 * @property {string[]} tags
 */

/**
 * @typedef {Object} CharacterIdentity
 * @property {string} alignment
 * @property {string} appearance
 * @property {string} backstory
 * @property {string} personality
 * @property {string} ideals
 * @property {string} bonds
 * @property {string} flaws
 * @property {string} [eyes]
 * @property {string} [hair]
 * @property {string} [height]
 * @property {string} [age]
 * @property {string} [faith]
 */

/**
 * Configuração de regras da casa.
 * @typedef {Object} RulesConfig
 * @property {number} subclassLevel    Nível padronizado em que a subclasse entra.
 * @property {boolean} allowLegacyContent  Conteúdo pré-2024 adaptado (MPMM etc.).
 */

/**
 * Referência a uma entidade do compêndio (5etools), identificada por
 * nome+fonte. O `hash` (estilo Plutonium) é resolvido na hidratação do export.
 * @typedef {Object} ContentRef
 * @property {string} id        Identificador da entidade (ex: "human").
 * @property {string} source    Fonte (ex: "XPHB", "MPMM").
 */

/**
 * Um bônus de atributo escolhido (origem ou ASI).
 * @typedef {Object} AbilityBoost
 * @property {Ability} ability
 * @property {number} amount    Geralmente +1 ou +2.
 */

/**
 * Escolha de talento, com sub-escolhas internas (ASI embutido, magia, etc.).
 * @typedef {Object} FeatChoice
 * @property {string} id
 * @property {string} source
 * @property {'origin'|'general'|'fightingStyle'|'eldritchInvocation'|'epicBoon'} subtype
 * @property {Record<string, unknown>} choices
 */

/**
 * Espécie + sub-escolhas (subraça, boosts de linhagem, etc.).
 * @typedef {Object} SpeciesChoice
 * @property {string} id
 * @property {string} source
 * @property {Record<string, unknown>} choices
 */

/**
 * Origem custom — substitui o "background" pronto. Tudo escolhido individualmente.
 * As proficiências (2 perícias, 1 ferramenta) e o idioma livre ficam em `choices`
 * (choice-bag genérico, lido pelo engine como qualquer outra escolha). Os arrays
 * skill/tool/languages permanecem para conteúdo legado/import.
 * @typedef {Object} CustomOrigin
 * @property {AbilityBoost[]} abilityBoosts
 * @property {FeatChoice|null} originFeat
 * @property {Object} choices       choice-bag (skill×2, tool×1, language×1).
 * @property {string[]} skillProficiencies
 * @property {string[]} toolProficiencies
 * @property {string[]} languages
 */

/**
 * Uma escolha feita em um nível específico de uma classe.
 * @typedef {(
 *   { type: 'feat', feat: FeatChoice } |
 *   { type: 'asi', boosts: AbilityBoost[] } |
 *   { type: 'skill-proficiency', skills: string[] } |
 *   { type: 'skill-expertise', skills: string[] } |
 *   { type: 'fighting-style', featId: string, source: string } |
 *   { type: 'spells-known', spells: ContentRef[] } |
 *   { type: 'cantrips-known', spells: ContentRef[] } |
 *   { type: 'feature-option', featureId: string, optionId: string } |
 *   { type: 'weapon-mastery', weapons: string[] } |
 *   { type: 'custom', label: string, value: unknown }
 * )} LevelChoice
 */

/**
 * Uma classe do personagem (uma entrada por classe; multiclasse = várias).
 * @typedef {Object} ClassEntry
 * @property {string} uid              Id interno estável (para React keys/edição).
 * @property {string} classId          Ex: "fighter".
 * @property {string} source           Ex: "XPHB".
 * @property {number} level
 * @property {boolean} isOriginalClass Vira details.originalClass no export.
 * @property {string|null} subclassId
 * @property {string|null} subclassSource
 * @property {Record<number, number|'max'>} hitPoints  Por nível: rolado ou "max".
 * @property {Record<number, LevelChoice[]>} choices   Escolhas por nível.
 */

/**
 * @typedef {Object} Currency
 * @property {number} pp @property {number} gp @property {number} ep
 * @property {number} sp @property {number} cp
 */

/**
 * @typedef {Object} InventoryItem
 * @property {string} uid
 * @property {string} itemId
 * @property {string} source
 * @property {number} quantity
 * @property {boolean} equipped
 * @property {boolean} attuned
 * @property {string} [customName]
 */

/**
 * O documento raiz salvo no IndexedDB.
 * @typedef {Object} Character
 * @property {string} id
 * @property {number} schemaVersion
 * @property {'pt-BR'|'en'} locale
 * @property {CharacterMeta} meta
 * @property {CharacterIdentity} identity
 * @property {AbilityScores} scores
 * @property {ScoreMethod} scoreMethod
 * @property {RulesConfig} rulesConfig
 * @property {SpeciesChoice|null} species
 * @property {CustomOrigin} origin
 * @property {ClassEntry[]} classes
 * @property {Currency} currency
 * @property {InventoryItem[]} inventory
 */

/** Gera um id único (usa crypto.randomUUID quando disponível). */
export function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Scores base padrão (tudo 10 = sem modificador). */
function defaultScores() {
  return { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
}

/**
 * Cria uma classe vazia (nível 1, sem escolhas ainda).
 * @param {boolean} isOriginalClass
 * @returns {ClassEntry}
 */
export function createClassEntry(isOriginalClass = true) {
  return {
    uid: makeId(),
    classId: '',
    source: '',
    level: 1,
    isOriginalClass,
    subclassId: null,
    subclassSource: null,
    hitPoints: { 1: 'max' },
    choices: {},
  };
}

/**
 * Cria um personagem novo com defaults sãos.
 * @param {Partial<{ name: string, locale: 'pt-BR'|'en', subclassLevel: number }>} [opts]
 * @returns {Character}
 */
export function createCharacter(opts = {}) {
  const now = new Date().toISOString();
  return {
    id: makeId(),
    schemaVersion: CHARACTER_SCHEMA_VERSION,
    locale: opts.locale ?? 'pt-BR',
    meta: {
      name: opts.name ?? 'New Character',
      portrait: null,
      createdAt: now,
      updatedAt: now,
      tags: [],
    },
    identity: {
      alignment: '',
      appearance: '',
      backstory: '',
      personality: '',
      ideals: '',
      bonds: '',
      flaws: '',
    },
    scores: defaultScores(),
    scoreMethod: { type: 'manual' },
    rulesConfig: {
      subclassLevel: opts.subclassLevel ?? 3,
      allowLegacyContent: true,
    },
    species: null,
    origin: {
      abilityBoosts: [],
      originFeat: null,
      choices: {},
      skillProficiencies: [],
      toolProficiencies: [],
      languages: [],
    },
    classes: [createClassEntry(true)],
    currency: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
    inventory: [],
  };
}

/**
 * Migra um personagem de versões antigas do schema para a atual.
 * Hoje só há a v1; o esqueleto fica pronto para o futuro.
 * @param {any} raw
 * @returns {Character}
 */
export function migrate(raw) {
  if (!raw || typeof raw !== 'object') return createCharacter();
  let c = raw;
  // Exemplo de uso futuro:
  // if (c.schemaVersion < 2) { c = migrateV1toV2(c); }
  if (c.schemaVersion !== CHARACTER_SCHEMA_VERSION) {
    c = { ...c, schemaVersion: CHARACTER_SCHEMA_VERSION };
  }
  return c;
}

/** Nível total do personagem (soma das classes). */
export function totalLevel(character) {
  return character.classes.reduce((sum, c) => sum + (c.level || 0), 0);
}

/** Resumo curto da build, ex: "Fighter 1 / Warlock 10". Vazio se sem classes. */
export function classSummary(character) {
  return character.classes
    .filter((c) => c.classId)
    .map((c) => `${c.classId} ${c.level}`)
    .join(' / ');
}
