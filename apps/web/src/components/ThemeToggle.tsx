import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../lib/theme';
import { cn } from '../lib/utils';

/** Theme switcher Dark/Light — tersedia di Login, Player Workspace, dan Admin Dashboard. */
export function ThemeToggle({ className, compact }: { className?: string; compact?: boolean }) {
  const mode = useTheme((s) => s.mode);
  const toggle = useTheme((s) => s.toggle);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={mode === 'dark' ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
      title={mode === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md border border-[var(--border-subtle)]',
        'bg-[var(--bg-surface)] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]/40',
        compact ? 'h-8 w-8' : 'h-8 px-2.5 text-xs font-medium',
        className,
      )}
    >
      <span className={cn('inline-flex transition-transform duration-200 ease-out', mode === 'light' && 'rotate-180')}>
        {mode === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
      </span>
      {!compact && <span>{mode === 'dark' ? 'Light' : 'Dark'}</span>}
    </button>
  );
}
