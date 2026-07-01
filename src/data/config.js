// =============================================================================
// Configuração da camada de dados (5etools)
// =============================================================================
// O app NÃO guarda os JSONs pesados no repositório. Ele busca direto do mirror
// público da comunidade e cacheia no navegador (ver ./cache.js e
// ../hooks/useDataEngine.js).
//
// ATENÇÃO: os mirrors do 5etools migram periodicamente (takedowns por DMCA). Se
// o MIRROR principal cair, troque a ordem de MIRRORS ou adicione um novo. O
// engine tenta cada mirror em ordem até um responder.
// -----------------------------------------------------------------------------

/**
 * Bases de URL candidatas, em ordem de preferência. Cada uma deve terminar em
 * `/data/`. O fetcher tenta da primeira para a última.
 * Confirmado ativo em 2026-06-29: 5etools-mirror-3/5etools-src (branch main).
 */
export const MIRRORS = [
  'https://raw.githubusercontent.com/5etools-mirror-3/5etools-src/main/data/',
];

/** Arquivos da raiz de /data que carregamos sempre. */
export const GLOBAL_FILES = [
  'races.json',
  'skills.json',
  'items-base.json',
  'languages.json',
  'feats.json',
  'senses.json',
  'optionalfeatures.json',
  'fluff-races.json',
  'variantrules.json',
];

/** Classes oficiais — baixadas de /data/class/class-${name}.json. */
export const CLASS_NAMES = [
  'artificer',
  'barbarian',
  'bard',
  'cleric',
  'druid',
  'fighter',
  'monk',
  'paladin',
  'ranger',
  'rogue',
  'sorcerer',
  'wizard',
  'warlock',
];

/** Validade do cache: 30 dias em milissegundos. */
export const CACHE_TTL = 30 * 24 * 60 * 60 * 1000;

/**
 * Monta a lista completa de caminhos relativos a serem buscados (em relação à
 * base do mirror). A chave de cada entrada é usada como chave no objeto `db`.
 */
export function buildManifest() {
  const globals = GLOBAL_FILES.map((file) => ({
    key: file.replace(/\.json$/, ''), // ex: "races"
    path: file,
  }));

  const classes = CLASS_NAMES.map((name) => ({
    key: `class-${name}`, // ex: "class-fighter"
    path: `class/class-${name}.json`,
  }));

  // Fluff das classes (texto "Info" + arte ilustrativa da classe e subclasses).
  const classFluff = CLASS_NAMES.map((name) => ({
    key: `fluff-class-${name}`, // ex: "fluff-class-fighter"
    path: `class/fluff-class-${name}.json`,
  }));

  return [...globals, ...classes, ...classFluff];
}
