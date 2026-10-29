import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { LinkProps } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { LoaderCircle } from 'lucide-react';
import styles from './Button.module.css';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger'
  | 'dangerGhost';

type ButtonSize = 'sm' | 'md' | 'lg';

interface StyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
}

function classesFor({ variant = 'primary', size = 'md', block }: StyleOptions) {
  return [styles.button, styles[variant], styles[size], block ? styles.block : '']
    .filter(Boolean)
    .join(' ');
}

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    StyleOptions {
  loading?: boolean;
  loadingLabel?: string;
  leadingIcon?: ReactNode;
}

export function Button({
  variant,
  size,
  block,
  loading = false,
  loadingLabel,
  leadingIcon,
  children,
  className,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={[classesFor({ variant, size, block }), className]
        .filter(Boolean)
        .join(' ')}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {loading ? (
        <LoaderCircle className="spin" size={16} aria-hidden="true" />
      ) : (
        leadingIcon
      )}
      <span>{loading ? (loadingLabel ?? children) : children}</span>
    </button>
  );
}

interface LinkButtonProps extends LinkProps, StyleOptions {
  children: ReactNode;
  leadingIcon?: ReactNode;
}

export function LinkButton({
  variant,
  size,
  block,
  leadingIcon,
  children,
  className,
  ...props
}: LinkButtonProps) {
  return (
    <Link
      {...props}
      className={[classesFor({ variant, size, block }), className]
        .filter(Boolean)
        .join(' ')}
    >
      {leadingIcon}
      <span>{children}</span>
    </Link>
  );
}
