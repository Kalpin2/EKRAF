import { cn } from '../lib/utils';

/**
 * Ambient tactical background — minimal topographic grid + very thin radar sweep.
 * Purely decorative: pointer-events none, 4–7% opacity, transform/opacity only.
 * Reduced-motion is handled globally in index.css.
 */
export function AmbientTactical({ className }: { className?: string }) {
  return (
    <div className={cn('ambient-tactical', className)} aria-hidden="true">
      <div className="ambient-grid" />
      <div className="ambient-radar" />
    </div>
  );
}
