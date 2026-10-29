import { useMemo, useState } from 'react';
import {
  Copy,
  Eye,
  EyeOff,
  LockKeyhole,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { IconButton } from '../../components/ui/IconButton';
import { useToast } from '../../components/ui/toast/ToastContext';
import { copyToClipboard } from '../../lib/clipboard';
import styles from './VaultPreview.module.css';

interface DemoEntry {
  id: string;
  service: string;
  login: string;
  password: string;
}

const SAMPLE_ENTRIES: DemoEntry[] = [
  {
    id: 'northwind',
    service: 'Northwind Studio',
    login: 'alex@northwind.example',
    password: 'sample-northwind-42',
  },
  {
    id: 'alpine-mail',
    service: 'Alpine Mail',
    login: 'alex@alpinemail.example',
    password: 'sample-mail-17',
  },
  {
    id: 'lumen',
    service: 'Lumen Cloud',
    login: 'ops@lumen.example',
    password: 'sample-lumen-08',
  },
  {
    id: 'atlas',
    service: 'Atlas Accounting',
    login: 'accounts@atlas.example',
    password: 'sample-atlas-31',
  },
];

function initial(service: string) {
  return service.charAt(0).toUpperCase();
}

function WindowDots() {
  return (
    <span className={styles.dots} aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

export function HeroVault() {
  const selected = SAMPLE_ENTRIES[0];

  return (
    <div
      className={styles.heroComposition}
      role="group"
      aria-label="Preview of the Alpine vault interface with fictitious sample data"
    >
      <p className="visually-hidden">
        Interface preview. All names, logins and passwords shown are fictitious.
      </p>
      <div className={styles.heroGlow} aria-hidden="true" />
      <div className={styles.backPlate} aria-hidden="true" />

      <div className={styles.heroWindow} aria-hidden="true">
        <div className={styles.windowBar}>
          <WindowDots />
          <span className={styles.windowTitle}>Private vault</span>
          <span className={styles.previewChip}>Sample preview</span>
        </div>

        <div className={styles.heroBody}>
          <div className={styles.heroList}>
            <div className={styles.listHead}>
              <span>All items</span>
              <span className={styles.count}>4</span>
            </div>
            <div className={styles.heroItems}>
              {SAMPLE_ENTRIES.map((entry, index) => (
                <div
                  key={entry.id}
                  className={[
                    styles.heroItem,
                    index === 0 ? styles.heroItemActive : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <span className={styles.monogram}>{initial(entry.service)}</span>
                  <span className={styles.itemText}>
                    <span className={styles.itemService}>{entry.service}</span>
                    <span className={styles.itemLogin}>{entry.login}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.heroDetail}>
            <div className={styles.detailTop}>
              <span className={styles.detailMonogram}>
                {initial(selected.service)}
              </span>
              <div className={styles.detailTitles}>
                <p className={styles.detailTitle}>{selected.service}</p>
                <p className={styles.detailSub}>Password entry</p>
              </div>
              <span className={styles.lockChip}>
                <LockKeyhole size={11} />
                Encrypted
              </span>
            </div>

            <div className={styles.detailFields}>
              <div className={styles.fieldRow}>
                <div className={styles.fieldStack}>
                  <span className={styles.fieldLabel}>Login</span>
                  <span className={styles.fieldValue}>{selected.login}</span>
                </div>
                <Copy size={14} className={styles.fieldIcon} />
              </div>
              <div className={styles.fieldRow}>
                <div className={styles.fieldStack}>
                  <span className={styles.fieldLabel}>Password</span>
                  <span className={`${styles.fieldValue} ${styles.masked}`}>
                    ••••••••••••
                  </span>
                </div>
                <Eye size={14} className={styles.fieldIcon} />
              </div>
            </div>

            <div className={styles.detailFoot}>
              <span className={styles.seal}>
                <ShieldCheck size={13} />
                AES-256-GCM
              </span>
              <span className={styles.uniqueNonce}>unique nonce</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.floatCard}>
        <span className={styles.floatIcon}>
          <ShieldCheck size={18} />
        </span>
        <span className={styles.floatText}>
          <strong>Sealed before storage</strong>
          <span>Encrypted in this browser</span>
        </span>
      </div>
    </div>
  );
}

export function InteractiveDemo() {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(SAMPLE_ENTRIES[0].id);
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const { notify } = useToast();

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return SAMPLE_ENTRIES;
    }
    return SAMPLE_ENTRIES.filter((entry) =>
      `${entry.service} ${entry.login}`.toLowerCase().includes(needle),
    );
  }, [query]);

  const active =
    filtered.find((entry) => entry.id === selectedId) ?? filtered[0] ?? null;
  const revealed = active !== null && revealedId === active.id;

  const copy = async (value: string, label: string) => {
    const copied = await copyToClipboard(value);
    notify(
      copied
        ? `${label} copied from sample data.`
        : 'Clipboard access is unavailable in this browser.',
      copied ? 'success' : 'error',
    );
  };

  return (
    <div className={styles.demoFrame}>
      <div className={styles.demoBar}>
        <div className={styles.demoBarLeft}>
          <WindowDots />
          <span className={styles.windowTitle}>Vault preview</span>
        </div>
        <span className={styles.previewChip}>Fictitious sample data</span>
      </div>

      <div className={styles.demoBody}>
        <div className={styles.demoList}>
          <div className={styles.demoListHead}>
            <span>All items</span>
            <span className={styles.count}>{filtered.length}</span>
          </div>

          <label className={styles.search}>
            <Search size={15} aria-hidden="true" />
            <span className="visually-hidden">Search sample entries</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search sample entries"
              autoComplete="off"
              spellCheck={false}
            />
          </label>

          {filtered.length > 0 ? (
            <div className={styles.demoItems}>
              {filtered.map((entry) => {
                const activeItem = entry.id === active?.id;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    className={[
                      styles.demoItem,
                      activeItem ? styles.demoItemActive : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => setSelectedId(entry.id)}
                    aria-current={activeItem ? 'true' : undefined}
                  >
                    <span className={styles.monogram}>
                      {initial(entry.service)}
                    </span>
                    <span className={styles.itemText}>
                      <span className={styles.itemService}>{entry.service}</span>
                      <span className={styles.itemLogin}>{entry.login}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className={styles.demoEmptySearch}>
              <p>No sample entries match “{query}”.</p>
              <button type="button" onClick={() => setQuery('')}>
                Clear search
              </button>
            </div>
          )}
        </div>

        <div className={styles.demoDetail}>
          {active ? (
            <>
              <div className={styles.demoDetailTop}>
                <span className={styles.demoDetailMonogram}>
                  {initial(active.service)}
                </span>
                <div className={styles.detailTitles}>
                  <p className={styles.demoDetailTitle}>{active.service}</p>
                  <p className={styles.detailSub}>Sample password entry</p>
                </div>
              </div>

              <div className={styles.demoField}>
                <div className={styles.demoFieldHead}>
                  <span className={styles.fieldLabel}>Login</span>
                  <IconButton
                    size="sm"
                    label="Copy sample login"
                    icon={<Copy size={14} />}
                    onClick={() => copy(active.login, 'Sample login')}
                  />
                </div>
                <p className={styles.demoValue}>{active.login}</p>
              </div>

              <div className={styles.demoField}>
                <div className={styles.demoFieldHead}>
                  <span className={styles.fieldLabel}>
                    Password
                    <span className={styles.encryptedTag}>Encrypted</span>
                  </span>
                  <span className={styles.demoFieldActions}>
                    <IconButton
                      size="sm"
                      label={revealed ? 'Hide sample password' : 'Reveal sample password'}
                      icon={revealed ? <EyeOff size={14} /> : <Eye size={14} />}
                      onClick={() =>
                        setRevealedId(revealed ? null : active.id)
                      }
                    />
                    <IconButton
                      size="sm"
                      label="Copy sample password"
                      icon={<Copy size={14} />}
                      onClick={() => copy(active.password, 'Sample password')}
                    />
                  </span>
                </div>
                <p className={`${styles.demoValue} ${styles.demoSecret}`}>
                  {revealed ? active.password : '••••••••••••••••'}
                </p>
              </div>

              <div className={styles.demoNote}>
                <LockKeyhole size={14} aria-hidden="true" />
                <p>
                  Only the password is encrypted. The service name and login
                  are stored as text by the current backend.
                </p>
              </div>
            </>
          ) : (
            <div className={styles.demoEmptyDetail}>
              <Search size={20} aria-hidden="true" />
              <p>Select a sample entry to inspect it.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
