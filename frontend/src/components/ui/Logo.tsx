import styles from './Logo.module.css';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  nameClassName?: string;
}

export function Logo({ size = 'md', showName = true, nameClassName }: LogoProps) {
  return (
    <span className={`${styles.logo} ${styles[size]}`}>
      <span className={styles.mark} aria-hidden="true">
        <svg viewBox="0 0 32 32" role="presentation">
          <path
            d="M6 23.5 13.1 9l4.2 8.2 2.1-3.5L26 23.5H6Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <circle cx="15.1" cy="19.1" r="1.55" fill="currentColor" />
        </svg>
      </span>
      {showName ? (
        <span className={[styles.name, nameClassName].filter(Boolean).join(' ')}>
          <span className={styles.nameStrong}>Alpine</span>{' '}
          <span className={styles.nameSoft}>Passmanager</span>
        </span>
      ) : (
        <span className="visually-hidden">Alpine Passmanager</span>
      )}
    </span>
  );
}
