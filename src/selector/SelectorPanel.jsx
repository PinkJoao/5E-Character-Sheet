// =============================================================================
// SelectorPanel — seletor genérico com busca + filtros + preview
// =============================================================================
// Substitui o velho dropdown. Recebe uma config de entidade (entities/*.js) e o
// compêndio (db). Mobile-first: no celular os filtros viram uma gaveta.
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';
import { applyFilters, deriveOptions, cycleOption } from './filterModel';
import styles from './SelectorPanel.module.css';

export default function SelectorPanel({ entity, db, currentId, onSelect, onClose }) {
  const [query, setQuery] = useState('');
  const [filterState, setFilterState] = useState({});
  const [hovered, setHovered] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Pré-computa a lista uma vez (busca + valores de filtro).
  const items = useMemo(() => {
    const raw = entity.list(db);
    return raw.map((r) => ({ id: entity.idOf(r), raw: r, ...entity.precompute(r) }));
  }, [entity, db]);

  // Each filter's options as {value,label}. Derived filters take values from the
  // data (value === label); fixed filters carry their own labels.
  const filterOptions = useMemo(() => {
    const out = {};
    for (const f of entity.filters) {
      if (f.derive) {
        out[f.id] = deriveOptions(items, f.id).map((v) => ({ value: v, label: v }));
      } else {
        out[f.id] = (f.options ?? []).map((o) =>
          typeof o === 'string' ? { value: o, label: o } : o
        );
      }
    }
    return out;
  }, [entity, items]);

  const results = useMemo(
    () => applyFilters(items, { query, filterState }),
    [items, query, filterState]
  );

  const activeCount = Object.values(filterState).reduce(
    (n, opts) => n + Object.values(opts).filter(Boolean).length,
    0
  );

  const toggle = (filterId, value) => {
    setFilterState((prev) => {
      const next = { ...prev, [filterId]: { ...(prev[filterId] ?? {}) } };
      const mode = cycleOption(next[filterId][value]);
      if (mode) next[filterId][value] = mode;
      else delete next[filterId][value];
      return next;
    });
  };

  const clearFilters = () => setFilterState({});

  const preview = hovered ?? results[0]?.raw ?? null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        {/* Cabeçalho */}
        <header className={styles.header}>
          <h2>Choose {entity.title}</h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>

        {/* Search bar */}
        <div className={styles.searchBar}>
          <input
            className={styles.search}
            type="search"
            placeholder={`Search ${entity.title.toLowerCase()}…`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <button
            type="button"
            className={styles.filterToggle}
            onClick={() => setShowFilters((v) => !v)}
          >
            Filters{activeCount ? ` (${activeCount})` : ''}
          </button>
        </div>

        <div className={styles.body}>
          {/* Filters */}
          <aside className={`${styles.filters} ${showFilters ? styles.filtersOpen : ''}`}>
            <div className={styles.filtersHead}>
              <span className={styles.legend}>
                <em className={styles.dotInc} /> include · <em className={styles.dotExc} /> exclude
              </span>
              {activeCount > 0 && (
                <button type="button" className={styles.clear} onClick={clearFilters}>
                  Clear
                </button>
              )}
            </div>
            {entity.filters.map((f) => (
              <div key={f.id} className={styles.filterGroup}>
                <h3>{f.header}</h3>
                <div className={styles.chips}>
                  {filterOptions[f.id].map((opt) => {
                    const mode = filterState[f.id]?.[opt.value];
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        className={`${styles.chip} ${
                          mode === 'include' ? styles.inc : mode === 'exclude' ? styles.exc : ''
                        }`}
                        onClick={() => toggle(f.id, opt.value)}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </aside>

          {/* Resultados */}
          <main className={styles.results}>
            <div className={styles.count}>{results.length} result(s)</div>
            <ul className={styles.cards}>
              {results.map((item) => {
                const card = entity.card(item.raw);
                const selected = item.id === currentId;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={`${styles.card} ${selected ? styles.cardSel : ''}`}
                      onClick={() => onSelect(item.raw)}
                      onMouseEnter={() => setHovered(item.raw)}
                    >
                      <span className={styles.cardTitle}>{card.title}</span>
                      <span className={styles.cardSub}>{card.subtitle}</span>
                      {card.badges?.length > 0 && (
                        <span className={styles.badges}>
                          {card.badges.map((b) => (
                            <em key={b} className={styles.badge}>
                              {b}
                            </em>
                          ))}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </main>

          {/* Preview */}
          <aside className={styles.preview}>
            {preview ? (
              <>
                <h3>{preview.name}</h3>
                <p className={styles.previewSrc}>{preview.source}</p>
                {entity.card(preview).badges?.length > 0 && (
                  <div className={styles.badges}>
                    {entity.card(preview).badges.map((b) => (
                      <em key={b} className={styles.badge}>
                        {b}
                      </em>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  className={styles.selectBtn}
                  onClick={() => onSelect(preview)}
                >
                  Select
                </button>
              </>
            ) : (
              <p className={styles.muted}>Nothing to show.</p>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
