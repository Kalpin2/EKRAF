import React from 'react';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';
import {
  Badge as PrimitiveBadge, Button, Card as PrimitiveCard, Input, Separator, Skeleton,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from './ui/primitives';

export { Button, Input, Separator, Skeleton, Table, TableBody, TableCell, TableHead, TableHeader, TableRow };

/** Template Heading convention: title + text-pretty description, actions on the right. */
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-x-4 gap-y-3 border-b border-border pb-5">
      <div className="min-w-0">
        <h1 className="heading text-xl sm:text-2xl lg:text-3xl">{title}</h1>
        {subtitle && <p className="muted-description">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ children, className, hover }: { children: React.ReactNode; className?: string; hover?: boolean }) {
  return (
    <PrimitiveCard className={cn('p-5 sm:p-6', hover && 'transition-all hover:ring-2 hover:ring-primary/40', className)}>
      {children}
    </PrimitiveCard>
  );
}

export function StatCard({ label, value, hint, icon: Icon, tone = 'cyan' }: {
  label: string; value: React.ReactNode; hint?: string; icon?: React.ElementType;
  tone?: 'cyan' | 'violet' | 'green' | 'amber' | 'red';
}) {
  const tones = {
    cyan: 'text-sage bg-sage/10 border-sage/20',
    violet: 'text-clay bg-clay/10 border-clay/20',
    green: 'text-victory bg-victory/10 border-victory/20',
    amber: 'text-caution bg-caution/10 border-caution/20',
    red: 'text-defeat bg-defeat/10 border-defeat/20',
  };
  return (
    <Card hover className="relative overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</p>
          <p className="heading num text-2xl sm:text-3xl mt-2 text-crisp">{value}</p>
          {hint && <p className="text-xs text-muted mt-1.5">{hint}</p>}
        </div>
        {Icon && <div className={cn('p-2.5 rounded-lg border', tones[tone])}><Icon size={18} /></div>}
      </div>
      <div className="absolute -right-6 -bottom-8 w-24 h-24 rounded-full bg-current opacity-[0.03]" />
    </Card>
  );
}

export function Badge({ children, tone = 'neutral', className }: {
  children: React.ReactNode; tone?: 'neutral' | 'cyan' | 'violet' | 'green' | 'amber' | 'red'; className?: string;
}) {
  const variants: Record<string, 'secondary' | 'default' | 'link' | 'success' | 'warning' | 'destructive' | 'outline'> = {
    neutral: 'outline',
    cyan: 'default',
    violet: 'link',
    green: 'success',
    amber: 'warning',
    red: 'destructive',
  };
  return <PrimitiveBadge variant={variants[tone]} className={className}>{children}</PrimitiveBadge>;
}

export function Progress({ value, tone = 'cyan' }: { value: number; tone?: 'cyan' | 'green' | 'amber' | 'red' }) {
  const colors = { cyan: 'bg-sage', green: 'bg-victory', amber: 'bg-caution', red: 'bg-defeat' };
  return (
    <div className="w-full h-1.5 rounded-full bg-grid overflow-hidden">
      <div className={cn('progress-fill h-full rounded-full transition-[width] duration-500 ease-out', colors[tone])} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="heading text-sm uppercase tracking-wider text-muted">{children}</h2>
      {right}
    </div>
  );
}

export function Empty({ title = 'Belum ada data', description }: { title?: string; description?: string }) {
  return (
    <div className="text-center py-12 text-muted">
      <div className="text-3xl mb-2 opacity-40">◈</div>
      <p className="font-semibold text-crisp/80">{title}</p>
      {description && <p className="text-sm mt-1">{description}</p>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onMouseDown={onClose}>
      <div
        className={cn('bg-elevated border border-line rounded-xl shadow-2xl w-full max-h-[88vh] overflow-y-auto', wide ? 'max-w-4xl' : 'max-w-lg')}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-line sticky top-0 bg-elevated z-10">
          <h3 className="heading text-lg">{title}</h3>
          <button onClick={onClose} className="text-muted hover:text-crisp transition-colors"><X size={20} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="text-[11px] text-muted mt-1 block">{hint}</span>}
    </label>
  );
}

export function Tabs({ tabs, active, onChange }: { tabs: { key: string; label: string }[]; active: string; onChange: (key: string) => void }) {
  return (
    <div className="flex gap-1 border-b border-line mb-5 overflow-x-auto">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={cn('px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors -mb-px',
            active === t.key ? 'border-sage text-sage' : 'border-transparent text-muted hover:text-crisp')}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const letters = name.split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div className={cn('rounded-lg bg-elevated border border-line flex items-center justify-center font-display font-bold text-sage',
      size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-9 h-9 text-xs')}>
      {letters}
    </div>
  );
}

export function Loading() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
      <div className="flex items-center gap-2">
        <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        Memuat data...
      </div>
      <Skeleton className="h-2 w-40" />
    </div>
  );
}
