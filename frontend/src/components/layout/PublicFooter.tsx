import { Link, useLocation } from 'react-router-dom';
import { Logo } from '../ui/Logo';
import styles from './PublicFooter.module.css';

export function PublicFooter() {
  const location = useLocation();
  const inPage = location.pathname === '/';
  const sectionHref = (hash: string) => (inPage ? hash : `/${hash}`);

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <div className={styles.brandColumn}>
            <Link to="/" aria-label="Alpine Passmanager home" className={styles.brand}>
              <Logo />
            </Link>
            <p className={styles.blurb}>
              A considered place for the passwords that matter. Encrypted in
              your browser, kept simple by design.
            </p>
          </div>

          <nav className={styles.column} aria-label="Product links">
            <p className={styles.heading}>Product</p>
            <a href={sectionHref('#product')}>The vault</a>
            <a href={sectionHref('#security')}>Security model</a>
          </nav>

          <nav className={styles.column} aria-label="Access links">
            <p className={styles.heading}>Access</p>
            <Link to="/login">Sign in</Link>
            <Link to="/register">Create a vault</Link>
          </nav>
        </div>

        <div className={styles.bottom}>
          <p>© {new Date().getFullYear()} Alpine Passmanager</p>
          <p className={styles.footnote}>Argon2id · HKDF-SHA256 · AES-256-GCM</p>
        </div>
      </div>
    </footer>
  );
}
