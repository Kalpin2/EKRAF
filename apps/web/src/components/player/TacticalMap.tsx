import clsx from 'clsx';
import { MARKER_COLORS } from '../../lib/player';

/** Kanvas taktis read-only untuk Player Playbook Reader. Tidak ada interaksi edit. */
export default function TacticalMap({ data, className }: { data: any; className?: string }) {
  const markers = data?.markers || [];
  const paths = data?.paths || [];

  return (
    <div className={clsx('relative overflow-hidden grid-bg bg-canvas border border-line rounded-lg', className || 'aspect-[16/10]')} aria-label="Kanvas taktis playbook">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full opacity-70" aria-hidden="true">
        <path d="M8 18 L34 12 L44 30 L30 45 L10 40 Z" fill="var(--bg-surface)" stroke="var(--border-subtle)" strokeWidth="0.5" />
        <path d="M58 12 L90 18 L88 42 L66 46 L56 30 Z" fill="var(--bg-surface)" stroke="var(--border-subtle)" strokeWidth="0.5" />
        <path d="M30 58 L52 54 L62 78 L36 88 L22 74 Z" fill="var(--bg-surface)" stroke="var(--border-subtle)" strokeWidth="0.5" />
        <path d="M66 58 L92 60 L90 90 L66 86 Z" fill="var(--bg-surface)" stroke="var(--border-subtle)" strokeWidth="0.5" />
        <path d="M44 30 L56 30 M30 45 L30 58 M66 46 L66 58 M62 78 L66 78" stroke="var(--accent-primary)" strokeWidth="0.4" strokeDasharray="2 2" opacity="0.45" />
        {paths.map((p: any, i: number) => (
          <line key={i} x1={p.from.x} y1={p.from.y} x2={p.to.x} y2={p.to.y}
            stroke={p.color || 'var(--accent-secondary)'} strokeWidth="0.8" strokeDasharray="3 2" markerEnd="url(#player-arrow)" />
        ))}
        <defs>
          <marker id="player-arrow" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto">
            <path d="M0 0 L4 2 L0 4 Z" fill="var(--accent-secondary)" />
          </marker>
        </defs>
      </svg>

      {markers.map((m: any, i: number) => (
        <div key={i}
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 flex items-center justify-center font-mono font-bold shadow-lg"
          style={{
            left: `${m.x}%`, top: `${m.y}%`, width: 26, height: 26, fontSize: 11,
            color: MARKER_COLORS[m.type] || 'var(--text-primary)', borderColor: MARKER_COLORS[m.type] || 'var(--text-secondary)',
            background: 'var(--bg-canvas)', boxShadow: '0 2px 8px color-mix(in srgb, var(--text-primary) 18%, transparent)',
          }}
          title={`${m.type} — ${m.label}`}
        >{m.label}</div>
      ))}

      <div className="absolute bottom-2 left-2 flex flex-wrap gap-2 text-[9px] font-mono text-muted/70 bg-canvas/80 px-2 py-1 rounded">
        <span style={{ color: 'var(--accent-primary)' }}>● Player</span>
        <span style={{ color: 'var(--text-secondary)' }}>● Smoke</span>
        <span style={{ color: 'var(--semantic-warn)' }}>● Flash</span>
        <span style={{ color: 'var(--semantic-loss)' }}>● Enemy</span>
      </div>
    </div>
  );
}
