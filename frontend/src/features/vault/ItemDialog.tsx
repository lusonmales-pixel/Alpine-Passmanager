import { useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Globe2, KeyRound, LockKeyhole, UserRound } from 'lucide-react';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { TextField } from '../../components/ui/TextField';
import { vaultErrorMessage } from './errors';
import type { VaultItem } from './vault-data';
import styles from './Dialogs.module.css';

export interface ItemFormValues {
  serviceName: string;
  login: string;
  password: string;
}

interface ItemDialogProps {
  mode: 'create' | 'edit';
  item?: VaultItem;
  onClose: () => void;
  onSubmit: (values: ItemFormValues) => Promise<void>;
}

interface FieldErrors {
  serviceName?: string;
  login?: string;
  password?: string;
}

export function ItemDialog({ mode, item, onClose, onSubmit }: ItemDialogProps) {
  const formId = useId();
  const [serviceName, setServiceName] = useState(item?.serviceName ?? '');
  const [login, setLogin] = useState(item?.login ?? '');
  const [password, setPassword] = useState(item?.password ?? '');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const serviceRef = useRef<HTMLInputElement>(null);
  const loginRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) {
      return;
    }

    const trimmedService = serviceName.trim();
    const trimmedLogin = login.trim();
    const nextErrors: FieldErrors = {};

    if (!trimmedService) {
      nextErrors.serviceName = 'Enter a service or site name.';
    } else if (trimmedService.length > 255) {
      nextErrors.serviceName = 'Use at most 255 characters.';
    }

    if (!trimmedLogin) {
      nextErrors.login = 'Enter a login or username.';
    } else if (trimmedLogin.length > 255) {
      nextErrors.login = 'Use at most 255 characters.';
    }

    if (!password) {
      nextErrors.password = 'Enter the password to store.';
    }

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      (nextErrors.serviceName
        ? serviceRef
        : nextErrors.login
          ? loginRef
          : passwordRef
      ).current?.focus();
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      await onSubmit({
        serviceName: trimmedService,
        login: trimmedLogin,
        password,
      });
    } catch (error) {
      setFormError(vaultErrorMessage(error, 'save'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={mode === 'create' ? 'New entry' : 'Edit entry'}
      description={
        mode === 'create'
          ? 'The entry appears in your vault only after the server confirms it.'
          : 'Changes are encrypted in this browser before they are saved.'
      }
      dismissible={!submitting}
      footer={
        <>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={formId}
            loading={submitting}
            loadingLabel="Saving…"
          >
            {mode === 'create' ? 'Save entry' : 'Save changes'}
          </Button>
        </>
      }
    >
      {formError ? (
        <Alert
          tone="error"
          title="Could not save the entry"
          className={styles.formAlert}
        >
          {formError}
        </Alert>
      ) : null}

      <form
        id={formId}
        className={styles.form}
        onSubmit={handleSubmit}
        noValidate
        aria-busy={submitting}
      >
        <div className={styles.fields}>
          <TextField
            ref={serviceRef}
            label="Service"
            name="service"
            value={serviceName}
            onChange={(event) => {
              setServiceName(event.target.value);
              setFieldErrors((current) => ({
                ...current,
                serviceName: undefined,
              }));
              setFormError(null);
            }}
            placeholder="e.g. Northwind Studio"
            autoComplete="off"
            autoFocus
            spellCheck={false}
            leadingIcon={<Globe2 size={16} />}
            error={fieldErrors.serviceName}
            disabled={submitting}
            maxLength={255}
            required
          />
          <TextField
            ref={loginRef}
            label="Login"
            name="login"
            value={login}
            onChange={(event) => {
              setLogin(event.target.value);
              setFieldErrors((current) => ({ ...current, login: undefined }));
              setFormError(null);
            }}
            placeholder="e.g. alex@example.com"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            leadingIcon={<UserRound size={16} />}
            error={fieldErrors.login}
            disabled={submitting}
            maxLength={255}
            required
          />
          <TextField
            ref={passwordRef}
            label="Password"
            name="entry-password"
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setFieldErrors((current) => ({ ...current, password: undefined }));
              setFormError(null);
            }}
            autoComplete="new-password"
            spellCheck={false}
            leadingIcon={<KeyRound size={16} />}
            error={fieldErrors.password}
            disabled={submitting}
            required
          />
        </div>

        <p className={styles.note}>
          <LockKeyhole size={14} aria-hidden="true" />
          Only the password field is encrypted. Service and login are stored as
          plain text by the current backend.
        </p>
      </form>
    </Modal>
  );
}
