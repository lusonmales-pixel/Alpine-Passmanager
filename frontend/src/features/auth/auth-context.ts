import { createContext, useContext } from 'react';

export interface AuthSession {
  token: string;
  username: string;
  vaultKey: CryptoKey;
  expiresAt: number | null;
}

export type SignOutReason = 'locked' | 'expired';

export interface AuthContextValue {
  session: AuthSession | null;
  notice: string | null;
  signIn: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  signOut: (reason: SignOutReason) => void;
  clearNotice: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }
  return value;
}
