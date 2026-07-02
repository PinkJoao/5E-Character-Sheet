// =============================================================================
// SelectorPanel — seletor genérico com busca + filtros + preview
// =============================================================================
// Substitui o velho dropdown. Recebe uma config de entidade (entities/*.js) e o
// compêndio (db). Mobile-first: no celular os filtros viram uma gaveta.
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';
import { applyFilters, deriveOptions, cycleOption } from './filterModel';
import DetailView from '../components/common/DetailView';
import styles from './SelectorPanel.module.css';

/* Cores dos badges de pré-requisito nos cards (atende / não atende / incerto). */
const PREREQ_CLASS = { ok: 'preOk', bad: 'preBad', unknown: 'preUnknown' };

/* Tons de badge (ex: tipos de classe — caster azul, half accent, martial vermelho). */
const TONE_CLASS = { blue: 'toneBlue', accent: 'toneAccent', red: 'toneRed' };

export default function SelectorPanel({ entity, db, currentId, onSelect, onClose, exclude }) {
  const [query, setQuery] = useState('');
  const [filterState, setFilterState] = useState({});
  const [hovered, setHovered] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [detailItem, setDetailItem] = useState(null); // mobile: card → detalhe

  const isMobile = () =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 760px)').matches;

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

  const filtered = useMemo(
    () => applyFilters(items, { query, filterState }),
    [items, query, filterState]
  );
  // Esconde o que já está na ficha (dedup), via predicado opcional.
  const results = useMemo(
    () => (exclude ? filtered.filter((it) => !exclude(it.raw)) : filtered),
    [filtered, exclude]
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

  const preview = hovered ?? detailItem ?? results[0]?.raw ?? null;
  //const preview = hovered ?? results[0]?.raw ?? null;

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
              <span className={styles.filtersActions}>
                {activeCount > 0 && (
                  <button type="button" className={styles.clear} onClick={clearFilters}>
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  className={styles.applyFilters}
                  onClick={() => setShowFilters(false)}
                >
                  Apply
                </button>
              </span>
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
                const selected = item.id === currentId; // Verifica se é o item já salvo na ficha
                const isPinned = detailItem && entity.idOf(detailItem) === item.id; // Verifica se é o item atualmente clicado/fixado para preview
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={`${styles.card} ${selected ? styles.cardSel : ''} ${isPinned ? styles.cardPinned : ''}`}
                      onClick={() => setDetailItem(item.raw)}
                      onMouseEnter={() => setHovered(item.raw)}
                      onMouseLeave={() => setHovered(null)}
                    >
                      <span className={styles.cardTitle}>{card.title}</span>
                      <span className={styles.cardSub}>{card.subtitle}</span>
                      {card.meta && <span className={styles.cardMeta}>{card.meta}</span>}
                      {card.prereqs?.length > 0 && (
                        <span className={styles.badges}>
                          {card.prereqs.map((p, pi) => (
                            <em key={pi} className={`${styles.prereq} ${styles[PREREQ_CLASS[p.status]] ?? ''}`}>
                              {p.text}
                            </em>
                          ))}
                        </span>
                      )}
                      {card.badges?.length > 0 && (
                        <span className={styles.badges}>
                          {card.badges.map((b, bi) => {
                            const text = typeof b === 'string' ? b : b.text;
                            const tone = typeof b === 'object' ? TONE_CLASS[b.tone] : null;
                            return (
                              <em key={bi} className={tone ? `${styles.badge} ${styles[tone]}` : styles.badge}>
                                {text}
                              </em>
                            );
                          })}
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
                <div className={styles.previewScroll}>
                  <DetailView entity={entity} raw={preview} db={db} />
                </div>
                <div className={styles.previewFoot}>
                  <button type="button" className={styles.selectBtn} onClick={() => onSelect(preview)}>
                    Select
                  </button>
                </div>
              </>
            ) : (
              <p className={styles.muted}>Nothing to show.</p>
            )}
          </aside>
        </div>

        {/* Tela de detalhe (mobile): tocar num card mostra info antes de selecionar. */}
        {detailItem && isMobile() && (
          <div className={styles.detailScreen}>
            <div className={styles.detailHead}>
              <button type="button" className={styles.detailBack} onClick={() => setDetailItem(null)}>
                ← Back
              </button>
            </div>
            <div className={styles.detailScroll}>
              <DetailView entity={entity} raw={detailItem} db={db} />
            </div>
            <div className={styles.previewFoot}>
              <button type="button" className={styles.selectBtn} onClick={() => onSelect(detailItem)}>
                Select
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
