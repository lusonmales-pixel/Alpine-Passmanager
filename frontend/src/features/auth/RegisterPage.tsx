import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, ShieldCheck, UserRound } from 'lucide-react';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { useAuth } from './auth-context';
import {
  RegistrationCompletedError,
  registrationErrorMessage,
} from './errors';
import { AuthLayout } from './AuthLayout';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import styles from './Auth.module.css';

interface FieldErrors {
  username?: string;
  password?: string;
  confirmPassword?: string;
}

export function RegisterPage() {
  useDocumentTitle('Create your vault — Alpine Passmanager');
  const { register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) {
      return;
    }

    const trimmedUsername = username.trim();
    const nextErrors: FieldErrors = {};

    if (!trimmedUsername) {
      nextErrors.username = 'Choose a username.';
    } else if (trimmedUsername.length > 200) {
      nextErrors.username = 'Usernames can be at most 200 characters.';
    }

    if (!password) {
      nextErrors.password = 'Choose a master password.';
    } else if (password.length < 12) {
      nextErrors.password = 'Use at least 12 characters.';
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Repeat the master password.';
    } else if (confirmPassword !== password) {
      nextErrors.confirmPassword = 'The master passwords do not match.';
    }

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      (nextErrors.username
        ? usernameRef
        : nextErrors.password
          ? passwordRef
          : confirmRef
      ).current?.focus();
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      await register(trimmedUsername, password);
      setPassword('');
      setConfirmPassword('');
      navigate('/vault', { replace: true });
    } catch (error) {
      if (error instanceof RegistrationCompletedError) {
        setPassword('');
        setConfirmPassword('');
        navigate('/login', {
          replace: true,
          state: {
            username: trimmedUsername,
            notice:
              'Your vault was created. Sign in with your master password to continue.',
          },
        });
        return;
      }
      setFormError(registrationErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className={styles.header}>
        <p className={styles.eyebrow}>New vault</p>
        <h1 className={styles.title}>Create your vault.</h1>
        <p className={styles.subtitle}>
          One master password. One private place for the passwords that matter.
        </p>
      </div>

      <Alert tone="warning" className={styles.noticeSpacing}>
        There is no password recovery. Keep this master password somewhere safe
        before you continue.
      </Alert>

      {formError ? (
        <Alert
          tone="error"
          title="Could not create the vault"
          className={styles.alertSpacing}
        >
          {formError}
        </Alert>
      ) : null}

      <form
        className={styles.form}
        onSubmit={handleSubmit}
        noValidate
        aria-busy={submitting}
      >
        <div className={styles.fields}>
          <TextField
            ref={usernameRef}
            label="Username"
            name="username"
            value={username}
            onChange={(event) => {
              setUsername(event.target.value);
              setFieldErrors((current) => ({ ...current, username: undefined }));
              setFormError(null);
            }}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            leadingIcon={<UserRound size={16} />}
            error={fieldErrors.username}
            disabled={submitting}
            maxLength={200}
            required
          />
          <TextField
            ref={passwordRef}
            label="Master password"
            name="new-password"
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
            hint="At least 12 characters. Processed locally with Argon2id."
            error={fieldErrors.password}
            disabled={submitting}
            required
          />
          <TextField
            ref={confirmRef}
            label="Confirm master password"
            name="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              setFieldErrors((current) => ({
                ...current,
                confirmPassword: undefined,
              }));
              setFormError(null);
            }}
            autoComplete="new-password"
            spellCheck={false}
            leadingIcon={<ShieldCheck size={16} />}
            error={fieldErrors.confirmPassword}
            disabled={submitting}
            required
          />
        </div>

        <div className={styles.actions}>
          <Button
            type="submit"
            block
            loading={submitting}
            loadingLabel="Creating your vault…"
          >
            Create vault
          </Button>
        </div>

        {submitting ? (
          <p className={styles.loadingHint} role="status">
            Deriving your key locally, then creating the account. This can take
            a moment by design.
          </p>
        ) : (
          <p className={styles.recoveryNote}>
            <KeyRound size={14} aria-hidden="true" />
            Your master password is never sent to the server. Only a derived
            authentication verifier is stored.
          </p>
        )}
      </form>

      <p className={styles.footer}>
        <span>Already have a vault?</span>
        <Link to="/login">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
