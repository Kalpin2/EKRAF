import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Activity, AlertTriangle, ArrowUpRight, CalendarDays, ClipboardCheck,
  FileLock2, Gauge, GitCommitVertical, Play, Swords, Target, Trophy, Users, Zap,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Badge, Card, Empty, Loading, PageHeader, Progress, SectionTitle, StatCard } from '../components/ui';
import { fmtDate, fmtDateTime, fmtTime, roleLabel, timeAgo } from '../lib/format';

const typeLabels: Record<string, string> = {
  PRACTICE: 'Practice', SCRIM: 'Scrim', VOD_REVIEW: 'VOD Review', TOURNAMENT: 'Turnamen', MEDIA_DAY: 'Media Day',
};
const typeTone: Record<string, any> = {
  PRACTICE: 'cyan', SCRIM: 'violet', VOD_REVIEW: 'cyan', TOURNAMENT: 'red', MEDIA_DAY: 'amber',
};

export default function Dashboard() {
  const user = useAuth((s) => s.user);
  const { data, isLoading, isError } = useQuery<any>({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/analytics/dashboard'),
  });

  if (isLoading) return <Loading />;
  if (isError || !data) return <div className="card p-6 text-defeat">Gagal memuat dashboard.</div>;

  const { summary, widgets, focus, role, divisions } = data;
  const firstName = user?.fullName?.split(' ')[0] || 'Coach';
  const isPlayer = role === 'PLAYER';

  return (
    <>
      <PageHeader
        title={`Selamat datang, ${firstName} 👋`}
        subtitle={`${divisions?.map((d: any) => d.gameTitle).join(' / ') || 'Nexus Esports'} • Command Workspace`}
        actions={
          <div className="hidden md:flex items-center gap-2">
            <Badge tone="green"><span className="w-1.5 h-1.5 rounded-full bg-victory pulse-soft" /> Sistem Online</Badge>
            <Badge tone="neutral">{fmtDate(new Date(), 'EEEE, dd MMM yyyy')}</Badge>
          </div>
        }
      />

      {/* Summary */}
      <div className="grid stagger-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard label="Total Pertandingan" value={summary.totalMatches} hint="Scrim + turnamen tercatat" icon={Swords} tone="cyan" />
        <StatCard label="Win Rate" value={`${summary.winRate}%`} hint="14 pertandingan terakhir" icon={Trophy} tone="green" />
        <StatCard label="Pemain Aktif" value={summary.activePlayers} hint="Starting + substitute" icon={Users} tone="violet" />
        <StatCard label="Playbook Aktif" value={summary.playbooks} hint="3 matchday ready" icon={Target} tone="amber" />
      </div>

      {/* Player-specific focus */}
      {isPlayer && (
        <div className="grid lg:grid-cols-3 gap-4 mb-6">
          <Card className="lg:col-span-2">
            <SectionTitle right={<Link to="/matches" className="text-xs text-sage flex items-center gap-1">Lihat semua <ArrowUpRight size={12} /></Link>}>
              Action Item Saya
            </SectionTitle>
            {focus?.myActions?.length ? focus.myActions.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between py-2.5 border-b border-line/60 last:border-0">
                <div>
                  <p className="text-sm font-medium">{a.title}</p>
                  <p className="text-xs text-muted">vs {a.match?.opponentName} • oleh {a.creator?.ign}</p>
                </div>
                <Badge tone={a.status === 'DONE' ? 'green' : a.status === 'IN_PROGRESS' ? 'amber' : 'cyan'}>{a.status.replace('_', ' ')}</Badge>
              </div>
            )) : <Empty title="Tidak ada action item" description="Semua tugas selesai. Mantap!" />}
          </Card>
          <Card>
            <SectionTitle>Wellness Terakhir</SectionTitle>
            {focus?.lastWellness ? (
              <div className="space-y-3">
                {[
                  ['Tidur', `${focus.lastWellness.sleepHours} jam`, 'cyan'],
                  ['Kelelahan', `${focus.lastWellness.fatigueLevel}/5`, focus.lastWellness.fatigueLevel >= 4 ? 'red' : 'green'],
                  ['Kesiapan Mental', `${focus.lastWellness.mentalReadiness}/5`, 'violet'],
                ].map(([l, v, t]: any) => (
                  <div key={l} className="flex items-center justify-between">
                    <span className="text-sm text-muted">{l}</span>
                    <Badge tone={t}><span className="num">{v}</span></Badge>
                  </div>
                ))}
                <Link to="/wellness" className="btn-ghost w-full mt-2"><Activity size={14} /> Isi Check-in</Link>
              </div>
            ) : <Empty title="Belum ada check-in" />}
          </Card>
        </div>
      )}

      <div className="asym-grid grid">
        {/* Today schedule */}
        <Card className="card-editorial">
          <SectionTitle right={<Link to="/schedule" className="text-xs text-sage flex items-center gap-1">Buka kalender <ArrowUpRight size={12} /></Link>}>
            Jadwal Mendatang
          </SectionTitle>
          <div className="space-y-1 stagger-grid">
            {widgets.events?.slice(0, 5).map((ev: any) => (
              <div key={ev.id} className="flex items-center gap-4 py-2.5 border-b border-line/60 last:border-0">
                <div className="w-14 text-center shrink-0">
                  <p className="num text-sm font-semibold text-crisp">{fmtTime(ev.startsAt)}</p>
                  <p className="text-[10px] text-muted">{fmtDate(ev.startsAt, 'dd MMM')}</p>
                </div>
                <div className={`w-1 h-9 rounded-full ${ev.type === 'TOURNAMENT' ? 'bg-defeat' : ev.type === 'SCRIM' ? 'bg-clay' : 'bg-sage'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{ev.title}</p>
                  <p className="text-xs text-muted truncate">{ev.location || 'Online'} • {ev._count?.attendance || 0} peserta</p>
                </div>
                <Badge tone={typeTone[ev.type] || 'neutral'}>{typeLabels[ev.type] || ev.type}</Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Contract alerts / readiness */}
        <Card>
          <SectionTitle right={!isPlayer && <Link to="/contracts" className="text-xs text-sage flex items-center gap-1">Detail <ArrowUpRight size={12} /></Link>}>
            {isPlayer ? 'Playbook Belum Dibaca' : 'Peringatan Kontrak'}
          </SectionTitle>
          {isPlayer ? (
            focus?.unreadPlaybooks?.length ? focus.unreadPlaybooks.map((r: any) => (
              <Link key={r.id} to={`/playbooks/${r.playbook.id}`} className="flex items-center justify-between py-2.5 border-b border-line/60 last:border-0 hover:text-sage">
                <div>
                  <p className="text-sm font-medium">{r.playbook.title}</p>
                  <p className="text-xs text-muted">{r.playbook.mapName}</p>
                </div>
                <Badge tone="amber">Belum dibaca</Badge>
              </Link>
            )) : <Empty title="Semua playbook terbaca" />
          ) : (
            <>
              {focus?.contracts?.filter((c: any) => c.daysLeft >= 0 && c.daysLeft <= 90).slice(0, 5).map((c: any) => (
                <div key={c.id} className="flex items-center justify-between py-2.5 border-b border-line/60 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{c.user?.ign}</p>
                    <p className="text-xs text-muted">{c.status} • {fmtDate(c.endDate)}</p>
                  </div>
                  <Badge tone={c.daysLeft <= 30 ? 'red' : 'amber'}>H-{c.daysLeft}</Badge>
                </div>
              ))}
              {focus?.attendance && (
                <div className="mt-4 pt-3 border-t border-line">
                  <p className="text-xs text-muted mb-2">Rekap Kehadiran</p>
                  <Progress value={focus.attendance.find((a: any) => a.status === 'ON_TIME')?._count / (focus.attendance.reduce((s: number, a: any) => s + a._count, 0) || 1) * 100} tone="green" />
                </div>
              )}
            </>
          )}
        </Card>

        {(role === 'HEAD_COACH' || role === 'ANALYST') && focus?.wellness?.length > 0 && (
          <Card>
            <SectionTitle right={<Link to="/wellness" className="text-xs text-sage">Detail <ArrowUpRight size={12} /></Link>}>
              Wellness Tim (Terbaru)
            </SectionTitle>
            {focus.wellness.slice(0, 4).map((w: any) => (
              <div key={w.id} className="flex items-center justify-between py-2 border-b border-line/60 last:border-0">
                <div><p className="text-sm font-medium">{w.user.ign}</p><p className="text-[10px] text-muted">Tidur {w.sleepHours}jam • Mental {w.mentalReadiness}/5</p></div>
                <Badge tone={w.fatigueLevel >= 4 ? 'red' : 'green'}>Fatigue {w.fatigueLevel}/5</Badge>
              </div>
            ))}
          </Card>
        )}
      </div>

      <div className="asym-grid grid mt-6">
        {/* Recent matches */}
        <Card className="lg:col-span-2">
          <SectionTitle right={<Link to="/matches" className="text-xs text-sage flex items-center gap-1">Semua pertandingan <ArrowUpRight size={12} /></Link>}>
            Pertandingan Terakhir
          </SectionTitle>
          <div className="overflow-x-auto">
            <table className="w-full text-sm stagger-table">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted border-b border-line">
                  <th className="py-2 font-medium">Lawan</th><th className="py-2 font-medium">Map</th>
                  <th className="py-2 font-medium">Patch</th><th className="py-2 font-medium">Skor</th>
                  <th className="py-2 font-medium">Hasil</th><th className="py-2 font-medium">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {widgets.matches?.map((m: any) => (
                  <tr key={m.id} className="border-b border-line/50 last:border-0">
                    <td className="py-2.5 font-medium">{m.opponentName}</td>
                    <td className="py-2.5 text-muted">{m.mapName}</td>
                    <td className="py-2.5"><Badge tone="violet">{m.patchVersion}</Badge></td>
                    <td className="py-2.5 num font-semibold">{m.scoreUs} : {m.scoreThem}</td>
                    <td className="py-2.5"><Badge tone={m.result === 'WIN' ? 'green' : 'red'}>{m.result}</Badge></td>
                    <td className="py-2.5 text-xs text-muted">{fmtDate(m.playedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Patches + notifications */}
        <div className="space-y-6">
          <Card>
            <SectionTitle>Patch Timeline</SectionTitle>
            <div className="space-y-3">
              {widgets.patches?.map((p: any) => (
                <div key={p.id} className="flex gap-3">
                  <GitCommitVertical size={16} className="text-clay mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold num">Patch {p.version}</p>
                    <p className="text-xs text-muted">{fmtDate(p.releaseDate)}</p>
                    <p className="text-[11px] text-muted/70 mt-0.5 line-clamp-1">{p.notes}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <SectionTitle>Notifikasi</SectionTitle>
            {widgets.notifications?.length ? widgets.notifications.map((n: any) => (
              <div key={n.id} className="flex items-start gap-3 py-2">
                <AlertTriangle size={15} className={n.type === 'CONTRACT' ? 'text-caution mt-0.5 shrink-0' : 'text-sage mt-0.5 shrink-0'} />
                <div>
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-muted">{n.body}</p>
                  <p className="text-[10px] text-muted/60 mt-0.5">{timeAgo(n.createdAt)}</p>
                </div>
              </div>
            )) : <Empty title="Tidak ada notifikasi baru" />}
          </Card>
        </div>
      </div>
    </>
  );
}
