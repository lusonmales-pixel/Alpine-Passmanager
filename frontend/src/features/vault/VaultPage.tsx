import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  CircleAlert,
  FolderLock,
  LockKeyhole,
  Plus,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/toast/ToastContext';
import { useAuth } from '../auth/auth-context';
import {
  api,
  UnauthorizedError,
} from '../../lib/api/client';
import { encryptPassword } from '../../lib/crypto/vaultCrypto';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { DeleteItemDialog } from './DeleteItemDialog';
import { ItemDetail } from './ItemDetail';
import { ItemDialog } from './ItemDialog';
import type { ItemFormValues } from './ItemDialog';
import { ItemList } from './ItemList';
import { MobileVaultHeader, VaultSidebar } from './VaultChrome';
import { vaultErrorMessage } from './errors';
import {
  fetchVaultItems,
  matchesQuery,
  sortVaultItems,
} from './vault-data';
import type { VaultItem } from './vault-data';
import styles from './VaultPage.module.css';

type DialogState =
  | { type: 'create' }
  | { type: 'edit'; item: VaultItem }
  | { type: 'delete'; item: VaultItem }
  | null;

const isMac =
  typeof navigator !== 'undefined' &&
  /Macintosh|Mac OS X|iPhone|iPad/.test(navigator.userAgent);
const SHORTCUT_LABEL = isMac ? '⌘K' : 'Ctrl K';

function parseItemId(wildcard: string | undefined): number | null {
  if (!wildcard) {
    return null;
  }
  const value = wildcard.replace(/\/+$/, '');
  if (!/^\d+$/.test(value)) {
    return null;
  }
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function VaultSkeleton() {
  return (
    <div className={styles.panes} role="status" aria-label="Loading vault">
      <div className={styles.listPane} aria-hidden="true">
        <div className={styles.listHeader}>
          <div className={`${styles.skeleton} ${styles.skeletonSearch}`} />
          <div className={styles.skeletonMeta}>
            <div className={`${styles.skeleton} ${styles.skeletonMetaLine}`} />
          </div>
        </div>
        <div className={styles.listScroll}>
          {Array.from({ length: 6 }, (_, index) => (
            <div className={styles.skeletonRow} key={index}>
              <div className={`${styles.skeleton} ${styles.skeletonMonogram}`} />
              <div className={styles.skeletonText}>
                <div className={`${styles.skeleton} ${styles.skeletonTitle}`} />
                <div className={`${styles.skeleton} ${styles.skeletonSub}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className={styles.detailPane} aria-hidden="true">
        <div className={styles.detailWrap}>
          <div className={styles.skeletonDetailHeader}>
            <div className={`${styles.skeleton} ${styles.skeletonDetailMark}`} />
            <div className={styles.skeletonText}>
              <div className={`${styles.skeleton} ${styles.skeletonDetailTitle}`} />
              <div className={`${styles.skeleton} ${styles.skeletonDetailSub}`} />
            </div>
          </div>
          <div className={`${styles.skeleton} ${styles.skeletonCard}`} />
          <div className={`${styles.skeleton} ${styles.skeletonCard}`} />
        </div>
      </div>
      <span className="visually-hidden">Loading your vault…</span>
    </div>
  );
}

function DetailPlaceholder() {
  return (
    <div className={styles.placeholder}>
      <span className={styles.placeholderMark} aria-hidden="true">
        <LockKeyhole size={22} />
      </span>
      <h2>Select an entry</h2>
      <p>Choose an item from the list to view its login and password.</p>
      <p className={styles.placeholderNote}>Strings are decrypted only in this tab.</p>
    </div>
  );
}

function DetailNotFound({ onBack }: { onBack: () => void }) {
  return (
    <div className={styles.detailRoot}>
      <div className={styles.mobileDetailBar}>
        <button type="button" className={styles.backButton} onClick={onBack}>
          All items
        </button>
      </div>
      <div className={styles.placeholder}>
        <span className={styles.placeholderMark} aria-hidden="true">
          <FolderLock size={22} />
        </span>
        <h2>Entry not found</h2>
        <p>It may have been deleted or the link may be out of date.</p>
        <Button variant="secondary" size="sm" onClick={onBack}>
          Back to all items
        </Button>
      </div>
    </div>
  );
}

export function VaultPage() {
  useDocumentTitle('Vault — Alpine Passmanager');
  const { session, signOut } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const params = useParams();
  const itemId = parseItemId(params['*']);

  const [items, setItems] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [query, setQuery] = useState('');
  const [dialog, setDialog] = useState<DialogState>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const token = session?.token ?? null;
  const vaultKey = session?.vaultKey ?? null;

  useEffect(() => {
    if (!token || !vaultKey) {
      return;
    }

    let cancelled = false;

    fetchVaultItems(token, vaultKey)
      .then((nextItems) => {
        if (!cancelled) {
          setItems(nextItems);
        }
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        if (error instanceof UnauthorizedError) {
          signOut('expired');
          return;
        }
        setLoadError(vaultErrorMessage(error, 'load'));
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token, vaultKey, reloadKey, signOut]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (document.querySelector('dialog[open]')) {
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  const selectedItem =
    itemId !== null ? items.find((item) => item.id === itemId) : undefined;

  const filteredItems = useMemo(
    () => items.filter((item) => matchesQuery(item, query)),
    [items, query],
  );

  const retry = () => {
    setLoading(true);
    setLoadError(null);
    setReloadKey((value) => value + 1);
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (selectedItem && !matchesQuery(selectedItem, value)) {
      navigate('/vault', { replace: true });
    }
  };

  const handleSelect = (id: number) => {
    navigate(`/vault/${id}`);
  };

  const handleCreate = useCallback(
    async (values: ItemFormValues) => {
      if (!session) {
        return;
      }

      const previousIds = new Set(items.map((item) => item.id));

      try {
        const encrypted = await encryptPassword(session.vaultKey, values.password);
        await api.savePassword(session.token, {
          service_name: values.serviceName,
          login: values.login,
          encrypted_password: encrypted.ciphertextBase64,
          nonce: encrypted.nonceBase64,
        });
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          signOut('expired');
        }
        throw error;
      }

      setDialog(null);
      setQuery('');
      notify('Entry saved.', 'success');

      try {
        const nextItems = await fetchVaultItems(session.token, session.vaultKey);
        setItems(nextItems);
        const created =
          nextItems.find(
            (item) =>
              !previousIds.has(item.id) &&
              item.serviceName === values.serviceName &&
              item.login === values.login,
          ) ?? nextItems.find((item) => !previousIds.has(item.id));

        if (created) {
          navigate(`/vault/${created.id}`, { replace: true });
        }
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          signOut('expired');
          return;
        }
        setLoadError(
          'The entry was saved, but the vault list could not refresh. Retry to see it.',
        );
        notify('Entry saved. Refresh the list to see it.', 'success');
      }
    },
    [session, items, navigate, notify, signOut],
  );

  const handleUpdate = useCallback(
    async (item: VaultItem, values: ItemFormValues) => {
      if (!session) {
        return;
      }

      try {
        const encrypted = await encryptPassword(session.vaultKey, values.password);
        await api.updatePassword(session.token, {
          id: item.id,
          service_name: values.serviceName,
          login: values.login,
          encrypted_password: encrypted.ciphertextBase64,
          nonce: encrypted.nonceBase64,
        });
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          signOut('expired');
        }
        throw error;
      }

      const updated: VaultItem = {
        ...item,
        serviceName: values.serviceName,
        login: values.login,
        password: values.password,
        decryptionFailed: false,
      };

      setItems((current) =>
        sortVaultItems(
          current.map((currentItem) =>
            currentItem.id === item.id ? updated : currentItem,
          ),
        ),
      );
      setDialog(null);
      notify('Changes saved.', 'success');

      if (query.trim() && !matchesQuery(updated, query)) {
        setQuery('');
      }
    },
    [session, query, notify, signOut],
  );

  const handleDelete = useCallback(
    async (item: VaultItem) => {
      if (!session) {
        return;
      }

      try {
        await api.deletePassword(session.token, { id: item.id });
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          signOut('expired');
        }
        throw error;
      }

      setItems((current) => current.filter((currentItem) => currentItem.id !== item.id));
      setDialog(null);
      if (itemId === item.id) {
        navigate('/vault', { replace: true });
      }
      notify('Entry deleted.', 'success');
    },
    [session, itemId, navigate, notify, signOut],
  );

  if (!session) {
    return null;
  }

  const isDetailOpen = itemId !== null && items.length > 0;
  const showInitialSkeleton = loading && items.length === 0;
  const subtitle = loading
    ? 'Opening your vault…'
    : `${items.length} ${items.length === 1 ? 'entry' : 'entries'} in your vault`;

  return (
    <div className={styles.shell}>
      <VaultSidebar
        username={session.username}
        count={loading ? null : items.length}
        onNew={() => setDialog({ type: 'create' })}
        onLock={() => signOut('locked')}
      />

      <div
        className={[styles.main, isDetailOpen ? styles.mainDetailOpen : '']
          .filter(Boolean)
          .join(' ')}
      >
        <MobileVaultHeader
          onNew={() => setDialog({ type: 'create' })}
          onLock={() => signOut('locked')}
        />

        <header className={styles.pageHeader}>
          <div className={styles.pageHeading}>
            <h1>All items</h1>
            <p>{subtitle}</p>
          </div>
          <div className={styles.pageActions}>
            <span className={styles.sessionBadge}>
              <ShieldCheck size={13} aria-hidden="true" />
              In-memory session
            </span>
            <Button
              className={styles.pageNewButton}
              variant="secondary"
              size="sm"
              leadingIcon={<Plus size={15} />}
              onClick={() => setDialog({ type: 'create' })}
            >
              New item
            </Button>
          </div>
        </header>

        <main id="main-content" className={styles.content}>
          {loadError && !showInitialSkeleton ? (
            <div className={styles.banner} role="alert">
              <CircleAlert size={16} aria-hidden="true" />
              <p>{loadError}</p>
              <Button
                size="sm"
                variant="secondary"
                leadingIcon={<RefreshCw size={13} />}
                onClick={retry}
              >
                Retry
              </Button>
            </div>
          ) : null}

          {showInitialSkeleton ? (
            <VaultSkeleton />
          ) : loadError && items.length === 0 ? (
            <div className={styles.statePanel}>
              <span className={styles.stateMark} aria-hidden="true">
                <CircleAlert size={22} />
              </span>
              <h2>The vault could not be loaded</h2>
              <p>{loadError}</p>
              <Button
                variant="secondary"
                leadingIcon={<RefreshCw size={15} />}
                onClick={retry}
              >
                Try again
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className={styles.statePanel}>
              <span className={styles.stateMark} aria-hidden="true">
                <LockKeyhole size={22} />
              </span>
              <h2>Your vault is empty</h2>
              <p>
                Add the first password you want to keep. It will be encrypted in
                this browser before it is saved.
              </p>
              <Button
                leadingIcon={<Plus size={16} />}
                onClick={() => setDialog({ type: 'create' })}
              >
                Add your first item
              </Button>
            </div>
          ) : (
            <div className={styles.panes}>
              <ItemList
                items={filteredItems}
                totalCount={items.length}
                query={query}
                onQueryChange={handleQueryChange}
                onSelect={handleSelect}
                selectedId={selectedItem?.id ?? null}
                searchRef={searchRef}
                shortcutLabel={SHORTCUT_LABEL}
              />

              <div className={styles.detailPane}>
                {selectedItem ? (
                  <ItemDetail
                    key={selectedItem.id}
                    item={selectedItem}
                    onEdit={() => setDialog({ type: 'edit', item: selectedItem })}
                    onDelete={() =>
                      setDialog({ type: 'delete', item: selectedItem })
                    }
                    onBack={() => navigate('/vault')}
                  />
                ) : itemId !== null ? (
                  <DetailNotFound onBack={() => navigate('/vault')} />
                ) : (
                  <DetailPlaceholder />
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {dialog?.type === 'create' ? (
        <ItemDialog
          mode="create"
          onClose={() => setDialog(null)}
          onSubmit={handleCreate}
        />
      ) : null}

      {dialog?.type === 'edit' ? (
        <ItemDialog
          mode="edit"
          item={dialog.item}
          onClose={() => setDialog(null)}
          onSubmit={(values) => handleUpdate(dialog.item, values)}
        />
      ) : null}

      {dialog?.type === 'delete' ? (
        <DeleteItemDialog
          item={dialog.item}
          onClose={() => setDialog(null)}
          onDelete={() => handleDelete(dialog.item)}
        />
      ) : null}
    </div>
  );
}
