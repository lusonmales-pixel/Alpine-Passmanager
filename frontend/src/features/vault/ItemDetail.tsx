import { useEffect, useRef, useState } from 'react';
import {
  Check,
  ChevronLeft,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Pencil,
  ShieldCheck,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';
import { useToast } from '../../components/ui/toast/ToastContext';
import { copyToClipboard } from '../../lib/clipboard';
import type { VaultItem } from './vault-data';
import styles from './VaultPage.module.css';

interface ItemDetailProps {
  item: VaultItem;
  onEdit: () => void;
  onDelete: () => void;
  onBack: () => void;
}

type CopiedField = 'login' | 'password' | null;

function initial(serviceName: string) {
  return serviceName.trim().charAt(0).toUpperCase() || 'A';
}

export function ItemDetail({ item, onEdit, onDelete, onBack }: ItemDetailProps) {
  const [revealed, setRevealed] = useState(false);
  const [revealStatus, setRevealStatus] = useState('');
  const [copied, setCopied] = useState<CopiedField>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { notify } = useToast();

  useEffect(() => {
    if (window.matchMedia('(max-width: 720px)').matches) {
      headingRef.current?.focus({ preventScroll: true });
    }
  }, []);

  useEffect(() => {
    if (!revealed) {
      return;
    }
    const timer = window.setTimeout(() => {
      setRevealed(false);
      setRevealStatus('Password hidden.');
    }, 30_000);
    return () => window.clearTimeout(timer);
  }, [revealed]);

  useEffect(() => {
    if (!copied) {
      return;
    }
    const timer = window.setTimeout(() => setCopied(null), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copy = async (value: string, field: Exclude<CopiedField, null>) => {
    const success = await copyToClipboard(value);
    if (success) {
      setCopied(field);
      notify(field === 'password' ? 'Password copied.' : 'Login copied.', 'success');
    } else {
      notify(
        'Clipboard access is unavailable in this browser. Select the value manually to copy it.',
        'error',
      );
    }
  };

  return (
    <div className={styles.detailRoot}>
      <div className={styles.mobileDetailBar}>
        <button type="button" className={styles.backButton} onClick={onBack}>
          <ChevronLeft size={16} aria-hidden="true" />
          All items
        </button>
      </div>

      <div className={styles.detailWrap}>
        <header className={styles.detailHeader}>
          <div className={styles.detailIdentity}>
            <span className={styles.detailMonogram} aria-hidden="true">
              {initial(item.serviceName)}
            </span>
            <div className={styles.detailInfo}>
              <h2 className={styles.detailService} ref={headingRef} tabIndex={-1}>
                {item.serviceName}
              </h2>
              <p className={styles.detailKind}>
                <LockKeyhole size={11} aria-hidden="true" />
                Password entry
              </p>
            </div>
          </div>

          <div className={styles.detailActions}>
            <Button
              variant="secondary"
              size="sm"
              leadingIcon={<Pencil size={14} />}
              onClick={onEdit}
              disabled={item.decryptionFailed}
              title={
                item.decryptionFailed
                  ? 'This entry cannot be decrypted with the current key.'
                  : undefined
              }
            >
              Edit
            </Button>
            <IconButton
              label="Delete entry"
              icon={<Trash2 size={16} />}
              tone="danger"
              onClick={onDelete}
            />
          </div>
        </header>

        {item.decryptionFailed ? (
          <Alert tone="error" title="This entry cannot be decrypted" className={styles.decryptAlert}>
            It may have been created with a different key, or its stored data is
            damaged. The entry can be deleted, but its password cannot be
            recovered here.
          </Alert>
        ) : null}

        <div className={styles.fieldCard}>
          <div className={styles.fieldRow}>
            <div className={styles.fieldBody}>
              <span className={styles.fieldLabel}>Login</span>
              <span className={styles.fieldValue}>{item.login || '—'}</span>
            </div>
            <div className={styles.fieldButtons}>
              <IconButton
                label={copied === 'login' ? 'Login copied' : 'Copy login'}
                icon={
                  copied === 'login' ? <Check size={15} /> : <Copy size={15} />
                }
                size="sm"
                onClick={() => void copy(item.login, 'login')}
                disabled={!item.login}
              />
            </div>
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.fieldBody}>
              <span className={styles.fieldLabel}>
                Password
                <span className={styles.encryptedBadge}>
                  <ShieldCheck size={9} aria-hidden="true" />
                  Encrypted
                </span>
              </span>

              {item.decryptionFailed ? (
                <span className={styles.passwordUnavailable}>
                  <TriangleAlert size={14} aria-hidden="true" />
                  Could not decrypt
                </span>
              ) : (
                <span
                  className={[
                    styles.fieldValue,
                    styles.passwordValue,
                    revealed ? '' : styles.passwordMasked,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {revealed ? item.password : '••••••••••••••••'}
                </span>
              )}

              {!item.decryptionFailed && revealed ? (
                <span className={styles.revealHint}>
                  Hides automatically after 30 seconds.
                </span>
              ) : null}
            </div>

            {!item.decryptionFailed ? (
              <div className={styles.fieldButtons}>
                <IconButton
                  label={revealed ? 'Hide password' : 'Reveal password'}
                  icon={revealed ? <EyeOff size={15} /> : <Eye size={15} />}
                  size="sm"
                  onClick={() => {
                    const next = !revealed;
                    setRevealed(next);
                    setRevealStatus(
                      next ? 'Password revealed.' : 'Password hidden.',
                    );
                  }}
                />
                <IconButton
                  label={copied === 'password' ? 'Password copied' : 'Copy password'}
                  icon={
                    copied === 'password' ? (
                      <Check size={15} />
                    ) : (
                      <Copy size={15} />
                    )
                  }
                  size="sm"
                  onClick={() => void copy(item.password, 'password')}
                />
              </div>
            ) : null}
          </div>
        </div>

        <p className="visually-hidden" role="status">
          {revealStatus}
        </p>

        <div className={styles.detailMeta}>
          <KeyRound size={14} aria-hidden="true" />
          <p>
            The password is encrypted with AES-256-GCM. The service name and
            login are stored as plain text by the current backend.
          </p>
        </div>
      </div>
    </div>
  );
}
