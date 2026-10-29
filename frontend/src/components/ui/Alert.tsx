import type { ReactNode } from 'react';
import { CheckCircle2, CircleAlert, Info, TriangleAlert } from 'lucide-react';
import styles from './Alert.module.css';

type AlertTone = 'info' | 'warning' | 'error' | 'success';

interface AlertProps {
  tone?: AlertTone;
  title?: string;
  children: ReactNode;
  className?: string;
  role?: 'alert' | 'status';
}

export function Alert({
  tone = 'info',
  title,
  children,
  className,
  role,
}: AlertProps) {
  const Icon =
    tone === 'success'
      ? CheckCircle2
      : tone === 'error'
        ? CircleAlert
        : tone === 'warning'
          ? TriangleAlert
          : Info;

  return (
    <div
      className={[styles.alert, styles[tone], className].filter(Boolean).join(' ')}
      role={role ?? (tone === 'error' || tone === 'warning' ? 'alert' : 'status')}
    >
      <Icon size={17} className={styles.icon} aria-hidden="true" />
      <div className={styles.content}>
        {title ? <p className={styles.title}>{title}</p> : null}
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}
