import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import {
  Activity, Bell, CalendarDays, ChevronLeft, ChevronRight, ClipboardList, Crosshair,
  FileLock2, Gauge, LayoutDashboard, LogOut, Menu, PanelLeftClose, Radar, ScrollText,
  ShieldAlert, Swords, UserRound, Users, X, Zap,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { api, demoMode, onDemoChange } from '../lib/api';
import { Avatar, Badge, Button } from './ui';
import { timeAgo } from '../lib/format';
import { useMatchday } from '../lib/matchday';
import { Breadcrumbs } from './Breadcrumbs';
import { ThemeToggle } from './ThemeToggle';

type NavItem = { path: string; label: string; icon: React.ElementType; roles: string[] };
type NavGroup = { label: string; items: NavItem[] };

const PLAYER_NAV: NavGroup[] = [
  {
    label: 'Command Center',
    items: [
      { path: '/player/dashboard', label: "Today's Command", icon: LayoutDashboard, roles: ['PLAYER'] },
      { path: '/player/schedule', label: 'Jadwal & Kehadiran', icon: CalendarDays, roles: ['PLAYER'] },
    ],
  },
  {
    label: 'Tactical',
    items: [
      { path: '/player/playbooks', label: 'Playbook Taktis', icon: Crosshair, roles: ['PLAYER'] },
      { path: '/player/performance', label: 'Performa & VOD', icon: Gauge, roles: ['PLAYER'] },
    ],
  },
  {
    label: 'Personal',
    items: [
      { path: '/player/wellness', label: 'Wellness Log', icon: Activity, roles: ['PLAYER'] },
      { path: '/player/profile', label: 'Profil Saya', icon: UserRound, roles: ['PLAYER'] },
    ],
  },
];

const STAFF_NAV: NavGroup[] = [
  {
    label: 'Workspace',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['*'] },
      { path: '/schedule', label: 'Jadwal & Absensi', icon: CalendarDays, roles: ['*'] },
      { path: '/roster', label: 'Roster Pemain', icon: Users, roles: ['*'] },
      { path: '/matches', label: 'Scrim & Match', icon: Swords, roles: ['*'] },
    ],
  },
  {
    label: 'Tactical',
    items: [
      { path: '/playbooks', label: 'Playbook Taktis', icon: Crosshair, roles: ['*'] },
      { path: '/opponents', label: 'Opponent Scouting', icon: Radar, roles: ['ORG_ADMIN', 'HEAD_COACH', 'ANALYST'] },
      { path: '/analytics', label: 'Analitik Performa', icon: Gauge, roles: ['ORG_ADMIN', 'HEAD_COACH', 'ANALYST', 'TEAM_MANAGER'] },
    ],
  },
  {
    label: 'Administration',
    items: [
      { path: '/wellness', label: 'Wellness Log', icon: Activity, roles: ['*'] },
      { path: '/contracts', label: 'Kontrak & Finance', icon: FileLock2, roles: ['ORG_ADMIN', 'FINANCE', 'TEAM_MANAGER'] },
      { path: '/recruitment', label: 'Rekrutmen', icon: ClipboardList, roles: ['ORG_ADMIN', 'TEAM_MANAGER', 'HEAD_COACH'] },
      { path: '/audit', label: 'Audit Log', icon: ScrollText, roles: ['ORG_ADMIN', 'FINANCE'] },
    ],
  },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [demo, setDemo] = useState(demoMode);
  const matchday = useMatchday((s) => s.active);
  const toggleMatchday = useMatchday((s) => s.toggle);
  const exitMatchday = useMatchday((s) => s.exit);

  const isPlayer = user?.globalRole === 'PLAYER';

  useEffect(() => {
    const unsubscribe = onDemoChange(() => setDemo(true));
    return () => { unsubscribe(); };
  }, []);
  useEffect(() => { api.get('/notifications').then(setNotifications).catch(() => {}); }, [location.pathname]);
  useEffect(() => { setOpen(false); setNotifOpen(false); }, [location.pathname]);

  const groups = useMemo(() => (isPlayer ? PLAYER_NAV : STAFF_NAV)
    .map((g) => ({ ...g, items: g.items.filter((n) => n.roles.includes('*') || (user && n.roles.includes(user.globalRole))) }))
    .filter((g) => g.items.length > 0), [isPlayer, user]);

  const allItems = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const visibleGroups = useMemo(() => matchday
    ? groups.map((g) => ({ ...g, items: g.items.filter((n) => n.path === (isPlayer ? '/player/playbooks' : '/playbooks')) })).filter((g) => g.items.length)
    : groups, [matchday, groups, isPlayer]);

  const heading = allItems.find((n) => location.pathname.startsWith(n.path))?.label || 'NexusEsports OS';
  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-canvas">
      {!matchday && (
        <aside className={cn(
          'fixed inset-y-0 left-0 z-40 bg-surface border-r border-line flex flex-col transition-all duration-200',
          collapsed ? 'w-12' : 'w-64',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}>
          <div className={cn('h-14 flex items-center gap-3 border-b border-border shrink-0', collapsed ? 'justify-center px-2' : 'px-5')}>
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow-soft shrink-0">
              <Zap size={20} className="text-canvas" fill="currentColor" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="heading text-base leading-tight truncate">NEXUS<span className="text-sage">ESPORTS</span></p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted">OS / Tactical</p>
              </div>
            )}
            <button className="lg:hidden ml-auto text-muted" onClick={() => setOpen(false)}><X size={18} /></button>
          </div>

          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5" aria-label="Navigasi utama">
            {visibleGroups.map((group) => (
              <div key={group.label}>
                {!collapsed && <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted/60">{group.label}</p>}
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      title={collapsed ? item.label : undefined}
                      className={({ isActive }) => cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                        collapsed && 'justify-center',
                        isActive || location.pathname.startsWith(item.path + '/')
                          ? 'bg-sage/10 text-sage border border-sage/20'
                          : 'text-muted hover:bg-elevated hover:text-crisp border border-transparent',
                      )}
                    >
                      <item.icon size={17} className="shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}

            <div>
              {!collapsed && <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted/60">Sistem</p>}
              <button onClick={toggleMatchday} title="Mode Matchday"
                className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-caution hover:bg-caution/10 border border-transparent hover:border-caution/20 transition-all', collapsed && 'justify-center')}>
                <Zap size={17} className="shrink-0" /> {!collapsed && 'Mode Matchday'}
              </button>
            </div>
          </nav>

          <div className="p-3 border-t border-line shrink-0">
            <div className={cn('flex items-center gap-3 px-2 py-2', collapsed && 'justify-center')}>
              <Avatar name={user?.fullName || 'User'} />
              {!collapsed && (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{user?.fullName}</p>
                    <p className="text-[11px] text-muted truncate">{user?.ign}</p>
                  </div>
                  <button title="Keluar" onClick={() => { api.logout(); navigate('/login'); }} className="text-muted hover:text-defeat transition-colors"><LogOut size={17} /></button>
                </>
              )}
            </div>
            <button onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex w-full items-center justify-center gap-2 mt-2 py-1.5 rounded-lg border border-line text-muted hover:text-sage hover:border-sage/40 transition-colors text-xs">
              {collapsed ? <ChevronRight size={14} /> : <><PanelLeftClose size={14} /> Collapse</>}
            </button>
            {collapsed && <button onClick={() => setCollapsed(false)} className="hidden lg:flex w-full justify-center mt-2 text-muted hover:text-sage"><ChevronLeft size={16} /></button>}
          </div>
        </aside>
      )}

      <div className={cn('transition-all duration-200', !matchday && (collapsed ? 'lg:pl-12' : 'lg:pl-64'))}>
        <header className="h-14 sticky top-0 z-30 bg-background/90 backdrop-blur border-b border-border flex items-center gap-2 sm:gap-3 px-3 md:px-4 overflow-hidden">
          {!matchday && <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Buka menu"><Menu size={20} /></Button>}
          <div className="flex-1 min-w-0">
            {!matchday && <Breadcrumbs />}
            <h2 className="heading text-sm truncate mt-0.5" title={isPlayer ? 'Player Workspace' : 'Nexus Esports / Valorant Division'}>
              {matchday ? 'MATCHDAY COMMAND' : heading}
            </h2>
          </div>

          <ThemeToggle compact />
          {demo && <Badge tone="amber" className="hidden md:inline-flex"><ShieldAlert size={12} /> DEMO DATA</Badge>}

          {matchday ? (
            <Button variant="ghost" size="sm" onClick={exitMatchday}><X size={16} /> Keluar Matchday</Button>
          ) : (
            <Button variant="outline" size="sm" onClick={toggleMatchday} className="border-warning/30 bg-warning/10 text-warning hover:bg-warning/20">
              <Zap size={16} /> Matchday
            </Button>
          )}

          {!matchday && (
            <div className="relative">
              <Button variant="outline" size="icon" className="relative" onClick={() => setNotifOpen(!notifOpen)} aria-label="Notifikasi">
                <Bell size={18} />
                {unread > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-[9px] font-bold text-white flex items-center justify-center">{unread}</span>}
              </Button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto card p-2 shadow-2xl z-50">
                  <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted">Notifikasi</p>
                  {notifications.length === 0 && <p className="px-3 py-6 text-center text-sm text-muted">Tidak ada notifikasi</p>}
                  {notifications.map((n) => (
                    <button key={n.id} onClick={() => api.patch(`/notifications/${n.id}/read`).then(() => setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, isRead: true } : x)))}
                      className={cn('w-full text-left px-3 py-2.5 rounded-lg hover:bg-elevated transition-colors border-b border-line/50 last:border-0', !n.isRead && 'bg-sage/5')}>
                      <p className="text-sm font-semibold text-crisp">{n.title}</p>
                      <p className="text-xs text-muted mt-0.5">{n.body}</p>
                      <p className="text-[10px] text-muted/60 mt-1">{timeAgo(n.createdAt)}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </header>

        {matchday && (
          <div className="bg-caution/10 border-b border-caution/20 px-6 py-1.5 text-[11px] text-caution flex items-center gap-2">
            <Zap size={12} /> Mode Matchday aktif — menu administratif disembunyikan
          </div>
        )}

        <main className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto"><Outlet /></main>
      </div>

      {open && <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setOpen(false)} />}
    </div>
  );
}
