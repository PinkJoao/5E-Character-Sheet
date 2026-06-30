// =============================================================================
// PickerField — gatilho do seletor universal (SelectorPanel) com clear-x
// =============================================================================
// Campo de valor único respaldado pelo SelectorPanel: mostra o valor escolhido
// (nome + fonte discreta), abre o painel ao clicar e tem um × para limpar.
// Gerencia o próprio estado de aberto/fechado. Usado p/ espécie, talento, etc.
// -----------------------------------------------------------------------------

import { useState } from 'react';
import SelectorPanel from '../../selector/SelectorPanel';
import styles from './PickerField.module.css';

/**
 * @param {object}   props
 * @param {object}   props.entity        config de entidade (selector/entities/*)
 * @param {object}   props.db            compêndio
 * @param {?{label:string, source?:string, id?:string}} props.current  seleção atual
 * @param {string}   props.placeholder
 * @param {(raw:object)=>void} props.onSelect
 * @param {()=>void} props.onClear
 */
export default function PickerField({ entity, db, current, placeholder, onSelect, onClear, exclude }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className={styles.field}>
        <button type="button" className={styles.trigger} onClick={() => setOpen(true)}>
          {current ? (
            <>
              <span className={styles.name}>{current.label}</span>
              {current.source && <span className={styles.source}>{current.source}</span>}
            </>
          ) : (
            <span className={styles.ph}>{placeholder}</span>
          )}
        </button>
        {current && (
          <button type="button" className={styles.clearX} onClick={onClear} aria-label="Clear">
            ×
          </button>
        )}
      </div>

      {open && (
        <SelectorPanel
          entity={entity}
          db={db}
          currentId={current?.id ?? null}
          exclude={exclude}
          onSelect={(raw) => {
            onSelect(raw);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
