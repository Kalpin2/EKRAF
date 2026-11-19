import { useEffect, useRef } from 'react';
import { useTheme } from '../lib/theme';

/**
 * Dynamic canvas watermark (SPEC §2.3). Diagonal repeated identity text,
 * pointer-events: none. Warna otomatis menyesuaikan tema warm (dark/light).
 */
export default function Watermark({ lines, visible = true }: { lines: string[]; visible?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const theme = useTheme((s) => s.mode);

  useEffect(() => {
    if (!visible) return;
    const canvas = ref.current;
    if (!canvas) return;

    const draw = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const width = parent.clientWidth;
      const height = parent.clientHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);
      ctx.font = '500 13px "JetBrains Mono", monospace';
      // Dark  → rgba(245,241,235,0.14) • Light → rgba(28,25,21,0.12)
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--watermark-color').trim() || 'rgba(245,241,235,0.14)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const text = lines.join('   •   ');
      for (let y = -height; y < height * 2; y += 120) {
        for (let x = -width; x < width * 2; x += 380) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(-Math.PI / 6);
          ctx.fillText(text, 0, 0);
          ctx.restore();
        }
      }
    };

    draw();
    const observer = new ResizeObserver(draw);
    if (canvas.parentElement) observer.observe(canvas.parentElement);
    return () => observer.disconnect();
  }, [lines, visible, theme]);

  if (!visible) return null;
  return <canvas ref={ref} className="absolute inset-0 z-20 pointer-events-none select-none" aria-hidden="true" />;
}
