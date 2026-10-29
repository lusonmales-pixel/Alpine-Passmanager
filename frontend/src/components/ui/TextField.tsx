import { forwardRef, useId, useState } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import styles from './TextField.module.css';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
  leadingIcon?: ReactNode;
  containerClassName?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField(
    {
      label,
      hint,
      error,
      leadingIcon,
      containerClassName,
      id,
      type = 'text',
      className,
      disabled,
      ...props
    },
    ref,
  ) {
    const generatedId = useId();
    const inputId = id ?? `field-${generatedId}`;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;
    const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
    const isPassword = type === 'password';
    const [showPassword, setShowPassword] = useState(false);
    const resolvedType = isPassword && showPassword ? 'text' : type;

    return (
      <div className={[styles.field, containerClassName].filter(Boolean).join(' ')}>
        <label className={styles.label} htmlFor={inputId}>
          {label}
        </label>
        <div
          className={[
            styles.control,
            leadingIcon ? styles.withLeading : '',
            error ? styles.invalid : '',
            disabled ? styles.disabled : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {leadingIcon ? (
            <span className={styles.leading} aria-hidden="true">
              {leadingIcon}
            </span>
          ) : null}
          <input
            {...props}
            ref={ref}
            id={inputId}
            type={resolvedType}
            disabled={disabled}
            className={[styles.input, className].filter(Boolean).join(' ')}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
          />
          {isPassword ? (
            <button
              type="button"
              className={styles.toggle}
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={`${showPassword ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
              aria-pressed={showPassword}
              disabled={disabled}
              tabIndex={0}
            >
              {showPassword ? (
                <EyeOff size={16} aria-hidden="true" />
              ) : (
                <Eye size={16} aria-hidden="true" />
              )}
            </button>
          ) : null}
        </div>
        {hint ? (
          <p className={styles.hint} id={hintId}>
            {hint}
          </p>
        ) : null}
        {error ? (
          <p className={styles.error} id={errorId} role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);
