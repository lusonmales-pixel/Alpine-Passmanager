import type { RefObject } from 'react';
import { Search, X } from 'lucide-react';
import type { VaultItem } from './vault-data';
import styles from './VaultPage.module.css';

interface ItemListProps {
  items: VaultItem[];
  totalCount: number;
  query: string;
  onQueryChange: (value: string) => void;
  onSelect: (id: number) => void;
  selectedId: number | null;
  searchRef: RefObject<HTMLInputElement | null>;
  shortcutLabel: string;
}

function initial(serviceName: string) {
  return serviceName.trim().charAt(0).toUpperCase() || 'A';
}

export function ItemList({
  items,
  totalCount,
  query,
  onQueryChange,
  onSelect,
  selectedId,
  searchRef,
  shortcutLabel,
}: ItemListProps) {
  const hasQuery = query.trim().length > 0;

  return (
    <section className={styles.listPane} aria-label="Vault entries">
      <div className={styles.listHeader}>
        <label className={styles.searchField}>
          <Search size={15} aria-hidden="true" />
          <span className="visually-hidden">Search vault</span>
          <input
            ref={searchRef}
            type="search"
            className={styles.searchInput}
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape' && query) {
                event.preventDefault();
                onQueryChange('');
              }
            }}
            placeholder="Search entries"
            autoComplete="off"
            spellCheck={false}
          />
          {hasQuery ? (
            <button
              type="button"
              className={styles.searchClear}
              onClick={() => onQueryChange('')}
              aria-label="Clear search"
            >
              <X size={13} aria-hidden="true" />
            </button>
          ) : (
            <kbd className={`kbd ${styles.searchKbd}`}>{shortcutLabel}</kbd>
          )}
        </label>

        <div className={styles.listMeta}>
          <span>
            {hasQuery
              ? `${items.length} ${items.length === 1 ? 'match' : 'matches'}`
              : `${totalCount} ${totalCount === 1 ? 'entry' : 'entries'}`}
          </span>
          <span>Sorted A–Z</span>
        </div>
      </div>

      <div className={styles.listScroll}>
        {items.length > 0 ? (
          items.map((item) => {
            const selected = item.id === selectedId;
            return (
              <button
                key={item.id}
                type="button"
                className={[styles.listItem, selected ? styles.listItemActive : '']
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onSelect(item.id)}
                aria-current={selected ? 'true' : undefined}
              >
                <span className={styles.listMonogram} aria-hidden="true">
                  {initial(item.serviceName)}
                </span>
                <span className={styles.listItemText}>
                  <span className={styles.listService}>{item.serviceName}</span>
                  <span className={styles.listLogin}>
                    {item.login || 'No login saved'}
                  </span>
                </span>
              </button>
            );
          })
        ) : (
          <div className={styles.emptySearch}>
            <Search size={18} aria-hidden="true" />
            <p>No entries match “{query.trim()}”.</p>
            <button type="button" onClick={() => onQueryChange('')}>
              Clear search
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
