import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { vaultErrorMessage } from './errors';
import type { VaultItem } from './vault-data';
import styles from './Dialogs.module.css';

interface DeleteItemDialogProps {
  item: VaultItem;
  onClose: () => void;
  onDelete: () => Promise<void>;
}

export function DeleteItemDialog({
  item,
  onClose,
  onDelete,
}: DeleteItemDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (submitting) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onDelete();
    } catch (deleteError) {
      setError(vaultErrorMessage(deleteError, 'delete'));
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Delete entry?"
      description="This removes the entry from your vault for good."
      size="sm"
      dismissible={!submitting}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="danger"
            leadingIcon={<Trash2 size={15} />}
            onClick={() => void handleDelete()}
            loading={submitting}
            loadingLabel="Deleting…"
          >
            Delete entry
          </Button>
        </>
      }
    >
      {error ? (
        <Alert tone="error" title="Could not delete the entry" className={styles.formAlert}>
          {error}
        </Alert>
      ) : null}
      <p className={styles.deleteText}>
        Delete <strong>{item.serviceName}</strong>? Its encrypted password will
        be removed from the server.
      </p>
      <Alert tone="warning" className={styles.deleteWarning}>
        This action cannot be undone.
      </Alert>
    </Modal>
  );
}
