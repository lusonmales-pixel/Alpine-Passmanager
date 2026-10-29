import { Link } from 'react-router-dom';
import { Logo } from '../ui/Logo';
import { LinkButton } from '../ui/Button';
import { useAuth } from '../../features/auth/auth-context';
import { useLocation } from 'react-router-dom';
import styles from './PublicHeader.module.css';

export function PublicHeader() {
  const { session } = useAuth();
  const location = useLocation();
  const inPage = location.pathname === '/';
  const sectionHref = (hash: string) => (inPage ? hash : `/${hash}`);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.brand} aria-label="Alpine Passmanager home">
          <Logo nameClassName={styles.logoName} />
        </Link>

        <nav className={styles.nav} aria-label="Landing sections">
          <a href={sectionHref('#product')}>The vault</a>
          <a href={sectionHref('#security')}>Security</a>
        </nav>

        <div className={styles.actions}>
          {session ? (
            <LinkButton to="/vault" size="sm">
              Open vault
            </LinkButton>
          ) : (
            <>
              <Link to="/login" className={styles.signIn}>
                Sign in
              </Link>
              <LinkButton to="/register" size="sm">
                Create vault
              </LinkButton>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
