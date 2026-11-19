import { useEffect } from 'react';
import { applyTheme, useTheme } from '../lib/theme';

/**
 * Membungkus seluruh rute aplikasi sehingga perubahan Dark/Light langsung
 * diterapkan ke <html> dan seluruh halaman (Login, Player, Admin) serentak.
 * State persisten ditangani Zustand + localStorage (lihat lib/theme.ts).
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = useTheme((s) => s.mode);

  useEffect(() => {
    applyTheme(mode);
  }, [mode]);

  return <>{children}</>;
}
