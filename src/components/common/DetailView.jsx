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

export default function DetailView({ entity, raw, db }) {
  const [imgOk, setImgOk] = useState(true);
  if (!raw) return null;

  const fluff = entity?.fluff?.(raw, db) ?? null;
  const image = fluff?.images?.find((i) => i.href);
  const src = image ? imgUrl(image.href) : null;
  const meta = entity?.meta?.(raw) ?? [];

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
          {meta.map((m) => (
            <span key={m.label} className={m.highlight ? `${styles.metaItem} ${styles.metaHi}` : styles.metaItem}>
              <b>{m.label}</b> {m.value}
            </span>
          ))}
        </div>
      )}

      {raw.entries?.length > 0 && <EntryContent entries={raw.entries} />}

      {fluff?.entries?.length > 0 && (
        <div className={styles.lore}>
          <span className={styles.loreLabel}>Lore</span>
          <EntryContent entries={fluff.entries} />
        </div>
      )}
    </div>
  );
}
