import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ApiError, api } from '../../lib/api/client';
import { useToast } from '../../components/ui/toast/ToastContext';
import {
  prepareRegistration,
  prepareUnlock,
} from '../../lib/crypto/vaultCrypto';
import { getTokenExpiry } from '../../lib/jwt';
import { AuthContext } from './auth-context';
import type { AuthSession, SignOutReason } from './auth-context';
import {
  AccountNotFoundError,
  InvalidMasterPasswordError,
  RegistrationCompletedError,
  UsernameUnavailableError,
} from './errors';

export function AuthProvider({ children }: { children: ReactNode }) {
  /**
   * Deliberately memory-only. The JWT, the derived vault key and decrypted
   * entries are never written to localStorage, sessionStorage or IndexedDB.
   * Reloading the page therefore locks the vault.
   */
  const { clear: clearToasts } = useToast();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const clearNotice = useCallback(() => setNotice(null), []);

  const signIn = useCallback(async (rawUsername: string, password: string) => {
    const username = rawUsername.trim();

    let saltResponse;
    try {
      saltResponse = await api.getSalt(username);
    } catch (error) {
      // The current backend returns 500 for an unknown username instead of 404.
      if (
        error instanceof ApiError &&
        error.status === 500 &&
        error.serverMessage === 'Failed to get salt'
      ) {
        throw new AccountNotFoundError();
      }
      throw error;
    }

    const { authKeyBase64, vaultKey } = await prepareUnlock(
      password,
      saltResponse.salt,
    );

    let loginResponse;
    try {
      loginResponse = await api.login({
        username,
        auth_key: authKeyBase64,
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 403) {
        throw new InvalidMasterPasswordError();
      }
      if (
        error instanceof ApiError &&
        error.status === 500 &&
        (error.serverMessage ?? '').includes('get user info')
      ) {
        throw new AccountNotFoundError();
      }
      throw error;
    }

    const expiresAt = getTokenExpiry(loginResponse.token);
    if (expiresAt !== null && expiresAt <= Date.now()) {
      throw new ApiError(401, 'The server issued an expired session.', null);
    }

    setSession({
      token: loginResponse.token,
      username,
      vaultKey,
      expiresAt,
    });
    setNotice(null);
  }, []);

  const register = useCallback(async (rawUsername: string, password: string) => {
    const username = rawUsername.trim();
    const material = await prepareRegistration(password);

    try {
      await api.register({
        username,
        master_salt: material.saltBase64,
        verifier: material.verifierBase64,
      });
    } catch (error) {
      // The backend maps all create-user failures, including duplicate names,
      // to the same 500 response.
      if (
        error instanceof ApiError &&
        error.status === 500 &&
        error.serverMessage === 'Failed to create user'
      ) {
        throw new UsernameUnavailableError();
      }
      throw error;
    }

    let loginResponse;
    try {
      loginResponse = await api.login({
        username,
        auth_key: material.authKeyBase64,
      });
    } catch {
      throw new RegistrationCompletedError();
    }

    const expiresAt = getTokenExpiry(loginResponse.token);
    if (expiresAt !== null && expiresAt <= Date.now()) {
      throw new RegistrationCompletedError();
    }

    setSession({
      token: loginResponse.token,
      username,
      vaultKey: material.vaultKey,
      expiresAt,
    });
    setNotice(null);
  }, []);

  const signOut = useCallback((reason: SignOutReason) => {
    clearToasts();
    setSession(null);
    setNotice(
      reason === 'expired'
        ? 'Your session expired. Sign in to continue.'
        : 'Vault locked. Sign in to open it again.',
    );
  }, [clearToasts]);

  useEffect(() => {
    if (!session?.expiresAt) {
      return;
    }

    const remaining = Math.max(0, session.expiresAt - Date.now());
    const timer = window.setTimeout(() => signOut('expired'), remaining);
    return () => window.clearTimeout(timer);
  }, [session, signOut]);

  useEffect(() => {
    if (!session?.expiresAt) {
      return;
    }

    const checkExpiry = () => {
      if (document.visibilityState === 'visible' && session.expiresAt) {
        if (Date.now() >= session.expiresAt) {
          signOut('expired');
        }
      }
    };

    document.addEventListener('visibilitychange', checkExpiry);
    return () => document.removeEventListener('visibilitychange', checkExpiry);
  }, [session, signOut]);

  const value = useMemo(
    () => ({
      session,
      notice,
      signIn,
      register,
      signOut,
      clearNotice,
    }),
    [session, notice, signIn, register, signOut, clearNotice],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
