import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';

const variants: Record<Variant, string> = {
  primary:
    'bg-[var(--color-accent)] text-white hover:brightness-110 active:brightness-95 border border-transparent shadow-sm',
  secondary:
    'bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)]',
  ghost:
    'bg-transparent text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] border border-transparent',
  danger:
    'bg-[var(--color-surface-muted)] text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)]',
  success:
    'bg-[var(--color-accent)] text-white hover:brightness-110 active:brightness-95 border border-transparent shadow-sm',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
  size?: 'sm' | 'md';
}

export function Button({
  variant = 'secondary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const sizeCls =
    size === 'sm' ? 'min-h-9 px-3 py-1.5 text-xs' : 'min-h-10 px-4 py-2 text-sm';
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-1.5 rounded-full font-medium tracking-tight transition disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizeCls} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
