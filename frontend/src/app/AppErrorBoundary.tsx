import { Component } from 'react';
import type { ReactNode } from 'react';
import { Logo } from '../components/ui/Logo';
import styles from './AppErrorBoundary.module.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.shell}>
          <Logo size="md" />
          <div className={styles.content}>
            <p className={styles.code}>Unexpected error</p>
            <h1>Something went quiet.</h1>
            <p className={styles.text}>
              The interface ran into an unexpected error. Your vault is not
              persisted in the browser, so reloading will return you to a signed
              out state.
            </p>
            <div className={styles.actions}>
              <a href="/" className={styles.primary}>
                Return home
              </a>
              <button
                type="button"
                className={styles.secondary}
                onClick={() => window.location.reload()}
              >
                Reload page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
