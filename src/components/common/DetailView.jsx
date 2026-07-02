// =============================================================================
// DetailView — ficha de informação de uma entidade (raça, talento…)
// =============================================================================
// Mostra imagem (fluff), nome/fonte, os traços mecânicos (raw.entries) e a lore
// (fluff.entries), estilo 5etools. A entity pode expor `fluff(raw, db)` para
// fornecer imagens + lore; sem isso, mostra só os entries mecânicos.
// -----------------------------------------------------------------------------

import { useState } from 'react';
import EntryContent from './EntryContent';
import { imgUrl } from './media';
import styles from './DetailView.module.css';

const STATUS_CLASS = { ok: 'metaOk', bad: 'metaBad', unknown: 'metaUnknown' };
const TONE_CLASS = { blue: 'toneBlue', accent: 'toneAccent', red: 'toneRed' };

/** Classe do chip de meta: status de pré-requisito, TOM (tipos de classe) ou destaque. */
function metaClass(m) {
  const extra = m.status
    ? styles[STATUS_CLASS[m.status]]
    : m.tone
      ? styles[TONE_CLASS[m.tone]]
      : m.highlight
        ? styles.metaHi
        : '';
  return extra ? `${styles.metaItem} ${extra}` : styles.metaItem;
}

export default function DetailView({ entity, raw, db }) {
  const [imgOk, setImgOk] = useState(true);
  if (!raw) return null;

  const fluff = entity?.fluff?.(raw, db) ?? null;
  const image = fluff?.images?.find((i) => i.href);
  const src = image ? imgUrl(image.href) : null;
  const meta = entity?.meta?.(raw) ?? [];
  // Entidades como classe/subclasse montam os entries (fluff/features resolvidas).
  const bodyEntries = entity?.entries?.(raw, db) ?? raw.entries;

  return (
    <div className={styles.detail}>
      {src && imgOk && (
        <>
          <img className={styles.img} src={src} alt={raw.name} loading="lazy" onError={() => setImgOk(false)} />
          {image.credit && <p className={styles.credit}>Art: {image.credit}</p>}
        </>
      )}

      <h3 className={styles.name}>{raw.name}</h3>
      <p className={styles.src}>{raw.source}</p>

      {meta.length > 0 && (
        <div className={styles.meta}>
          {meta.map((m, i) => (
            <span key={`${m.label ?? m.value}-${i}`} className={metaClass(m)}>
              {m.label ? <b>{m.label}</b> : null} {m.value}
            </span>
          ))}
        </div>
      )}

      {bodyEntries?.length > 0 && <EntryContent entries={bodyEntries} />}

      {fluff?.entries?.length > 0 && (
        <div className={styles.lore}>
          <span className={styles.loreLabel}>Lore</span>
          <EntryContent entries={fluff.entries} />
        </div>
      )}
    </div>
  );
}
