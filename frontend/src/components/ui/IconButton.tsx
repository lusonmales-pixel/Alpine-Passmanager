import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './IconButton.module.css';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon: ReactNode;
  tone?: 'default' | 'accent' | 'danger';
  size?: 'sm' | 'md';
}

export function IconButton({
  label,
  icon,
  tone = 'default',
  size = 'md',
  className,
  type = 'button',
  ...props
}: IconButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={[styles.button, styles[tone], styles[size], className]
        .filter(Boolean)
        .join(' ')}
      aria-label={label}
      title={label}
    >
      {icon}
    </button>
  );
}
