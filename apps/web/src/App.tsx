import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './lib/auth';
import { ThemeProvider } from './components/ThemeProvider';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Roster from './pages/Roster';
import Schedule from './pages/Schedule';
import Matches from './pages/Matches';
import Playbooks from './pages/Playbooks';
import Analytics from './pages/Analytics';
import Contracts from './pages/Contracts';
import Recruitment from './pages/Recruitment';
import Wellness from './pages/Wellness';
import Audit from './pages/Audit';
import Opponents from './pages/Opponents';
import PlayerDashboard from './pages/player/PlayerDashboard';
import PlayerPlaybooks from './pages/player/PlayerPlaybooks';
import PlayerPlaybookReader from './pages/player/PlayerPlaybookReader';
import PlayerPerformance from './pages/player/PlayerPerformance';
import PlayerWellness from './pages/player/PlayerWellness';
import PlayerSchedule from './pages/player/PlayerSchedule';
import PlayerProfile from './pages/player/PlayerProfile';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 10_000 } },
});

/** Rute workspace admin — diblokir untuk tier PLAYER. */
const ADMIN_PATHS = [
  '/dashboard', '/roster', '/schedule', '/matches', '/playbooks', '/analytics',
  '/contracts', '/finance', '/recruitment', '/wellness', '/audit', '/audit-logs', '/opponents',
];

/**
 * Role-tier route guard: PLAYER hanya bisa /player/*, tier admin/manager hanya workspace admin.
 * Berlaku juga jika URL diketik manual setelah deploy (SPA fallback).
 */
function Protected() {
  const token = useAuth((s) => s.token);
  const role = useAuth((s) => s.user?.globalRole);
  const location = useLocation();

  if (!token) return <Navigate to="/login" replace />;

  const isPlayer = role === 'PLAYER';
  const path = location.pathname;
  const inPlayerArea = path.startsWith('/player');
  const inAdminArea = ADMIN_PATHS.some((p) => path === p || path.startsWith(`${p}/`));

  if (isPlayer && (inAdminArea || !inPlayerArea)) return <Navigate to="/player/dashboard" replace />;
  if (!isPlayer && inPlayerArea) return <Navigate to="/dashboard" replace />;
  if (path === '/') return <Navigate to={isPlayer ? '/player/dashboard' : '/dashboard'} replace />;

  return <Layout />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Protected />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/roster" element={<Roster />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/matches" element={<Matches />} />
            <Route path="/playbooks" element={<Playbooks />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/contracts" element={<Contracts />} />
            <Route path="/finance" element={<Navigate to="/contracts" replace />} />
            <Route path="/recruitment" element={<Recruitment />} />
            <Route path="/wellness" element={<Wellness />} />
            <Route path="/audit" element={<Audit />} />
            <Route path="/audit-logs" element={<Navigate to="/audit" replace />} />
            <Route path="/opponents" element={<Opponents />} />

            {/* Player workspace */}
            <Route path="/player" element={<Navigate to="/player/dashboard" replace />} />
            <Route path="/player/dashboard" element={<PlayerDashboard />} />
            <Route path="/player/playbooks" element={<PlayerPlaybooks />} />
            <Route path="/player/playbooks/:id" element={<PlayerPlaybookReader />} />
            <Route path="/player/performance" element={<PlayerPerformance />} />
            <Route path="/player/wellness" element={<PlayerWellness />} />
            <Route path="/player/schedule" element={<PlayerSchedule />} />
            <Route path="/player/profile" element={<PlayerProfile />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
