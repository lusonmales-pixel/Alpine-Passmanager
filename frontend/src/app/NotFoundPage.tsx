import { LinkButton } from '../components/ui/Button';
import { PublicFooter } from '../components/layout/PublicFooter';
import { PublicHeader } from '../components/layout/PublicHeader';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import styles from './NotFoundPage.module.css';

export function NotFoundPage() {
  useDocumentTitle('Page not found — Alpine Passmanager');

  return (
    <div className={styles.page}>
      <PublicHeader />
      <main className={styles.main} id="main-content">
        <p className={styles.code}>404</p>
        <h1>This page does not exist.</h1>
        <p className={styles.text}>
          The address may be mistyped, or the page may have moved. Your vault is
          still where you left it.
        </p>
        <div className={styles.actions}>
          <LinkButton to="/">Back to home</LinkButton>
          <LinkButton to="/login" variant="secondary">
            Sign in
          </LinkButton>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
