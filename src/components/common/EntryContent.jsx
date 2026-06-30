// =============================================================================
// EntryContent — renderiza a estrutura de `entries` do 5etools
// =============================================================================
// Converte o markup do 5etools (objetos aninhados + tags inline {@...}) em
// React. Cobre os casos comuns de raça/talento: strings, blocos `entries`
// nomeados, listas, insets, citações, tabelas e imagens. Tags de referência
// ({@spell ...}, {@variantrule ...}, etc.) viram o texto exibido (antes do "|").
// -----------------------------------------------------------------------------

import { imgUrl } from './media';
import styles from './EntryContent.module.css';

// --- Inline: resolve as tags {@tag conteúdo} (com aninhamento balanceado) ----
function renderInline(str, key = 't') {
  if (typeof str !== 'string') return str;
  const nodes = [];
  let i = 0;
  let n = 0;
  while (i < str.length) {
    const open = str.indexOf('{@', i);
    if (open === -1) {
      nodes.push(str.slice(i));
      break;
    }
    if (open > i) nodes.push(str.slice(i, open));
    let depth = 0;
    let j = open;
    for (; j < str.length; j++) {
      if (str[j] === '{') depth++;
      else if (str[j] === '}') {
        depth--;
        if (depth === 0) break;
      }
    }
    const inner = str.slice(open + 2, j);
    const sp = inner.indexOf(' ');
    const tag = sp === -1 ? inner : inner.slice(0, sp);
    const content = sp === -1 ? '' : inner.slice(sp + 1);
    nodes.push(renderTag(tag, content, `${key}-${n++}`));
    i = j + 1;
  }
  return nodes;
}

function renderTag(tag, content, key) {
  const display = content.split('|')[0];
  switch (tag) {
    case 'b':
    case 'bold':
      return <strong key={key}>{renderInline(content, key)}</strong>;
    case 'i':
    case 'italic':
      return <em key={key}>{renderInline(content, key)}</em>;
    case 'note':
      return (
        <span key={key} style={{ opacity: 0.75 }}>
          {renderInline(content, key)}
        </span>
      );
    case 'dice':
    case 'damage':
    case 'scaledice':
    case 'scaledamage':
    case 'hit':
    case 'chance':
      return <span key={key}>{display}</span>;
    default:
      // Tags de referência (spell/item/condition/variantrule/sense/skill…).
      return (
        <span key={key} className={styles.ref}>
          {renderInline(display, key)}
        </span>
      );
  }
}

// --- Bloco: cada item de um array de `entries` ------------------------------
function renderEntry(entry, key) {
  if (entry == null) return null;
  if (typeof entry === 'string' || typeof entry === 'number') {
    return <p key={key}>{renderInline(String(entry), key)}</p>;
  }
  switch (entry.type) {
    case 'entries':
    case 'section':
      return (
        <div key={key} className={styles.section}>
          {entry.name && <span className={styles.entryName}>{entry.name}. </span>}
          {renderList(entry.entries, key)}
        </div>
      );
    case 'list':
      return (
        <ul key={key}>
          {(entry.items ?? []).map((it, idx) => (
            <li key={idx}>{typeof it === 'string' ? renderInline(it, `${key}-${idx}`) : renderList([it], `${key}-${idx}`)}</li>
          ))}
        </ul>
      );
    case 'inset':
    case 'insetReadaloud':
      return (
        <div key={key} className={styles.inset}>
          {entry.name && <span className={styles.entryName}>{entry.name}. </span>}
          {renderList(entry.entries, key)}
        </div>
      );
    case 'quote':
      return (
        <div key={key} className={styles.quote}>
          {renderList(entry.entries, key)}
        </div>
      );
    case 'image': {
      const src = imgUrl(entry.href);
      return src ? <img key={key} className={styles.image} src={src} alt="" loading="lazy" /> : null;
    }
    case 'table':
      return renderTable(entry, key);
    default:
      return entry.entries ? <div key={key}>{renderList(entry.entries, key)}</div> : null;
  }
}

function renderList(entries, key) {
  return (entries ?? []).map((e, idx) => renderEntry(e, `${key}-${idx}`));
}

function renderTable(entry, key) {
  const rows = entry.rows ?? [];
  return (
    <table key={key} className={styles.table}>
      {entry.colLabels && (
        <thead>
          <tr>
            {entry.colLabels.map((c, idx) => (
              <th key={idx}>{renderInline(String(c), `${key}-h-${idx}`)}</th>
            ))}
          </tr>
        </thead>
      )}
      <tbody>
        {rows.map((row, ri) => (
          <tr key={ri}>
            {(Array.isArray(row) ? row : [row]).map((cell, ci) => (
              <td key={ci}>{typeof cell === 'string' ? renderInline(cell, `${key}-${ri}-${ci}`) : renderList([cell], `${key}-${ri}-${ci}`)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function EntryContent({ entries }) {
  if (!entries?.length) return null;
  return <div className={styles.content}>{renderList(entries, 'e')}</div>;
}
