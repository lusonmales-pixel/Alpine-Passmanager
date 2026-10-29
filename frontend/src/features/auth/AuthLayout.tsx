import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../../components/ui/Logo';
import styles from './AuthLayout.module.css';

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <aside className={styles.brandPanel}>
        <Link to="/" className={styles.logoLink} aria-label="Alpine Passmanager home">
          <Logo size="md" />
        </Link>

        <div className={styles.brandCenter}>
          <p className={styles.eyebrow}>Private by construction</p>
          <h1 className={styles.brandTitle}>
            A private room for the keys to your day.
          </h1>
          <p className={styles.brandText}>
            Your master password is processed in this browser. The server
            receives only what it needs to verify you and store encrypted
            passwords.
          </p>
        </div>

        <ul className={styles.specs} aria-label="Cryptography used">
          <li>Argon2id</li>
          <li>HKDF-SHA256</li>
          <li>AES-256-GCM</li>
        </ul>

        <div className={styles.contour} aria-hidden="true">
          <svg viewBox="0 0 520 420" fill="none">
            <path d="M-36 338c92-38 124-104 218-112s164 60 366-12" />
            <path d="M-52 374c106-42 144-116 244-120s172 62 382-10" />
            <path d="M-70 412c120-46 164-128 272-126s182 62 400-12" />
            <path d="M4 300c60-26 90-74 154-82s120 40 248-4" />
            <path d="M32 262c44-20 68-50 116-58s92 24 182-6" />
            <path d="M64 224c30-14 46-32 80-38s62 14 120-6" />
          </svg>
        </div>
      </aside>

      <main className={styles.formSide} id="main-content">
        <div className={styles.formWrap}>
          <div className={styles.mobileBrand}>
            <Link to="/" aria-label="Alpine Passmanager home">
              <Logo size="sm" />
            </Link>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
