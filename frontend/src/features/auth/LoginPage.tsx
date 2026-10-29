import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Info, KeyRound, UserRound } from 'lucide-react';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { useAuth } from './auth-context';
import { InvalidMasterPasswordError, signInErrorMessage } from './errors';
import { AuthLayout } from './AuthLayout';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import styles from './Auth.module.css';

interface LoginLocationState {
  username?: string;
  notice?: string;
}

interface FieldErrors {
  username?: string;
  password?: string;
}

export function LoginPage() {
  useDocumentTitle('Sign in — Alpine Passmanager');
  const { signIn, notice, clearNotice } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = (location.state as LoginLocationState | null) ?? null;

  const [username, setUsername] = useState(locationState?.username ?? '');
  const [password, setPassword] = useState('');
  const [localNotice, setLocalNotice] = useState<string | null>(
    locationState?.notice ?? null,
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const infoMessage = localNotice ?? notice;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) {
      return;
    }

    const nextErrors: FieldErrors = {};
    if (!username.trim()) {
      nextErrors.username = 'Enter your username.';
    }
    if (!password) {
      nextErrors.password = 'Enter your master password.';
    }

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      (nextErrors.username ? usernameRef : passwordRef).current?.focus();
      return;
    }

    setSubmitting(true);
    setFormError(null);
    setLocalNotice(null);
    clearNotice();

    try {
      await signIn(username, password);
      setPassword('');
      navigate('/vault', { replace: true });
    } catch (error) {
      setFormError(signInErrorMessage(error));
      if (error instanceof InvalidMasterPasswordError) {
        passwordRef.current?.focus();
        passwordRef.current?.select();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className={styles.header}>
        <p className={styles.eyebrow}>Welcome back</p>
        <h1 className={styles.title}>Unlock your vault.</h1>
        <p className={styles.subtitle}>
          Your master password is processed locally. It never crosses the
          network.
        </p>
      </div>

      {infoMessage ? (
        <Alert tone="info" className={styles.noticeSpacing}>
          {infoMessage}
        </Alert>
      ) : null}

      {formError ? (
        <Alert
          tone="error"
          title="Could not unlock the vault"
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
            name="password"
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setFieldErrors((current) => ({ ...current, password: undefined }));
              setFormError(null);
            }}
            autoComplete="current-password"
            spellCheck={false}
            leadingIcon={<KeyRound size={16} />}
            error={fieldErrors.password}
            disabled={submitting}
            required
          />
        </div>

        <div className={styles.actions}>
          <Button
            type="submit"
            block
            loading={submitting}
            loadingLabel="Unlocking vault…"
          >
            Unlock vault
          </Button>
        </div>

        {submitting ? (
          <p className={styles.loadingHint} role="status">
            Deriving your vault key in this browser. Argon2id is intentionally
            slow.
          </p>
        ) : (
          <p className={styles.recoveryNote}>
            <Info size={14} aria-hidden="true" />
            There is no password reset. If you lose your master password, the
            vault cannot be reopened.
          </p>
        )}
      </form>

      <p className={styles.footer}>
        <span>New to Alpine?</span>
        <Link to="/register">Create a vault</Link>
      </p>
    </AuthLayout>
  );
}
