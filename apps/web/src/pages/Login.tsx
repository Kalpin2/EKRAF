import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, ShieldCheck, LockKeyhole, Radar, Swords, UserRound, Shield } from 'lucide-react';
import { api } from '../lib/api';
import { demoCredentials } from '../lib/mock';
import { Input } from '../components/ui';
import { ThemeToggle } from '../components/ThemeToggle';

export default function Login() {
  const navigate = useNavigate();
  // Default: langsung terisi dari VITE_PLAYER_USERNAME / VITE_PLAYER_PASSWORD.
  const [username, setUsername] = useState(demoCredentials.player.username);
  const [password, setPassword] = useState(demoCredentials.player.password);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fill = (tier: 'player' | 'admin') => {
    const acc = demoCredentials[tier];
    setUsername(acc.username);
    setPassword(acc.password);
    setError('');
  };

  const doLogin = async (credential?: { username: string; password: string }) => {
    setLoading(true);
    setError('');
    try {
      const account: any = await api.login(credential?.username ?? username, credential?.password ?? password);
      navigate(account?.globalRole === 'PLAYER' ? '/player/dashboard' : '/dashboard');
    } catch {
      setError('Login gagal. Periksa kredensial demo di .env.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid-bg flex items-stretch">
      {/* Brand panel */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden border-r border-border bg-card/40 flex-col justify-between p-12">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full border border-primary/20" />
          <div className="absolute top-32 left-32 w-64 h-64 rounded-full border border-accent/20" />
          <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full border border-border" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center shadow-glow">
              <Zap size={24} className="text-background" fill="currentColor" />
            </div>
            <div>
              <p className="heading text-xl">NEXUS<span className="text-primary">ESPORTS</span></p>
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Operating System</p>
            </div>
          </div>
        </div>
        <div className="relative max-w-lg">
          <p className="font-mono text-xs text-primary mb-4 tracking-wider">// TACTICAL COMMAND CENTER</p>
          <h1 className="heading text-5xl leading-[1.1] mb-5">
            Satu sistem untuk<br /><span className="text-primary">setiap keputusan</span> tim.
          </h1>
          <p className="muted-description max-w-md leading-relaxed">
            Manajemen roster, scrim, playbook taktis yang aman, analitik performa, dan administrasi kontrak —
            dalam satu workspace yang dirancang untuk hari pertandingan.
          </p>
          <div className="grid grid-cols-3 gap-3 mt-10">
            {[
              { icon: Swords, label: 'Scrim Tracker' },
              { icon: ShieldCheck, label: 'Anti-Leak Playbook' },
              { icon: Radar, label: 'Deep Analytics' },
            ].map((f) => (
              <div key={f.label} className="rounded-lg border border-border bg-card p-4">
                <f.icon size={18} className="text-primary mb-2" />
                <p className="text-xs font-medium text-muted-foreground">{f.label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-[11px] text-muted-foreground/60 font-mono">v1.0.0 • STANDALONE DEMO</p>
      </div>

      {/* Form panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-5 sm:p-8 min-w-0">
        <div className="w-full max-w-md">
          <div className="flex justify-end mb-4"><ThemeToggle compact /></div>
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Zap size={22} className="text-background" fill="currentColor" />
            </div>
            <p className="heading text-lg">NEXUS<span className="text-primary">ESPORTS</span></p>
          </div>

          <h1 className="heading text-3xl mb-2">Selamat datang kembali</h1>
          <p className="muted-description mb-6">Kredensial sudah terisi otomatis dari `.env` — tinggal klik Login.</p>

          {/* Quick-switch */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button type="button" className="btn-quick" onClick={() => fill('player')}>
              <UserRound size={14} /> Isi Akun Player
            </button>
            <button type="button" className="btn-quick" onClick={() => fill('admin')}>
              <Shield size={14} /> Isi Akun Admin/Manager
            </button>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); doLogin(); }} className="space-y-4">
            <div>
              <label className="label">Username / Email</label>
              <Input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="player@nexus.gg" autoComplete="username" />
            </div>
            <div>
              <label className="label">Password</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
            </div>

            {error && <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">{error}</p>}

            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? 'Memproses...' : 'Login'}
            </button>
          </form>

          <p className="text-[11px] text-muted-foreground mt-6 flex items-center gap-2">
            <LockKeyhole size={13} /> Demo standalone — kredensial dibaca dari
            <code className="font-mono text-primary">VITE_ADMIN_*</code> &amp;
            <code className="font-mono text-primary">VITE_PLAYER_*</code>.
          </p>
        </div>
      </div>
    </div>
  );
}
