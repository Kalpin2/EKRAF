/** @type {import('tailwindcss').Config} */

// Setiap warna Tailwind dipetakan ke channel RGB dari CSS variable warm tema.
// rgb(var(--token-rgb) / <alpha-value>) bekerja di semua browser & menjaga opacity (/10, /50).
const tone = (variable) => `rgb(var(${variable}-rgb) / <alpha-value>)`;

const C = {
  canvas: tone('--bg-canvas'),
  surface: tone('--bg-surface'),
  elevated: tone('--bg-elevated'),
  line: tone('--border-subtle'),
  ink: tone('--text-primary'),
  subtle: tone('--text-secondary'),
  terracotta: tone('--accent-primary'),
  brass: tone('--accent-secondary'),
  win: tone('--semantic-win'),
  loss: tone('--semantic-loss'),
  warn: tone('--semantic-warn'),
};

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        /* Nama token baru (warm) */
        canvas: C.canvas,
        surface: C.surface,
        elevated: C.elevated,
        line: C.line,
        ink: C.ink,
        subtle: C.subtle,
        terracotta: C.terracotta,
        brass: C.brass,
        sage: C.terracotta,
        clay: C.brass,
        win: C.win,
        loss: C.loss,
        warn: C.warn,

        /* Semantic aliases — dipakai komponen/primitif */
        background: C.canvas,
        foreground: C.ink,
        card: C.surface,
        'card-foreground': C.ink,
        popover: C.elevated,
        'popover-foreground': C.ink,
        primary: C.terracotta,
        'primary-foreground': C.canvas,
        secondary: C.elevated,
        'secondary-foreground': C.ink,
        'muted-bg': C.elevated,
        'muted-foreground': C.subtle,
        accent: C.brass,
        'accent-foreground': C.ink,
        destructive: C.loss,
        'destructive-foreground': C.ink,
        warning: C.warn,
        success: C.win,
        border: C.line,
        input: C.line,
        ring: C.terracotta,
        'chart-1': C.terracotta,
        'chart-2': C.brass,
        'chart-3': C.win,
        'chart-4': C.warn,
        'chart-5': C.loss,
        sidebar: C.surface,
        'sidebar-foreground': C.ink,
        'sidebar-primary': C.terracotta,
        'sidebar-accent': C.elevated,
        'sidebar-border': C.line,
        'sidebar-ring': C.terracotta,

        /* Legacy alias lama — otomatis ikut palet warm, tidak ada cyan/ungu neon */
        obsidian: C.canvas,
        slatec: C.surface,
        steel: C.elevated,
        grid: C.line,
        cyanx: C.terracotta,
        violetx: C.brass,
        victory: C.win,
        defeat: C.loss,
        caution: C.warn,
        crisp: C.ink,
        muted: C.subtle,
      },
      fontFamily: {
        sans: 'var(--font-sans)',
        ui: 'var(--font-sans)',
        display: 'var(--font-display)',
        mono: 'var(--font-mono)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        soft: '0 10px 30px color-mix(in srgb, var(--text-primary) 8%, transparent)',
        glow: '0 10px 30px color-mix(in srgb, var(--text-primary) 8%, transparent)',
      },
    },
  },
  plugins: [],
};
