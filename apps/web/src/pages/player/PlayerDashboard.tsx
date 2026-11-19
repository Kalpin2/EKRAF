import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, ArrowUpRight, CalendarDays, CheckCircle2, ClipboardList,
  Crosshair, MapPin, Radio, Timer, Zap,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Badge, Card, Empty, Loading, PageHeader, SectionTitle, StatCard } from '../../components/ui';
import WellnessForm from '../../components/player/WellnessForm';
import {
  SCHEDULE_LABELS, SCHEDULE_TONE, READ_STATUS_LABELS, READ_STATUS_TONE,
  TIMEZONES, actionLabel, actionTone, countdownTo, nextAction, zoned,
} from '../../lib/player';
import { fmtDate } from '../../lib/format';

export default function PlayerDashboard() {
  const qc = useQueryClient();
  const [timezone, setTimezone] = useState('Asia/Jakarta');
  const [, setTick] = useState(0);
  const { data, isLoading } = useQuery<any>({
    queryKey: ['player-home', timezone],
    queryFn: () => api.get('/player/home', { timezone }),
    refetchInterval: 60_000,
  });

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  if (isLoading) return <Loading />;
  if (!data) return <div className="card p-6 text-defeat">Gagal memuat command center.</div>;

  const { schedule, unreadPlaybooks, actionItems, wellnessToday, counts, context, notifications } = data;

  const updateAction = async (id: string, status: string) => {
    await api.patch(`/player/action-items/${id}`, { status });
    qc.invalidateQueries({ queryKey: ['player-home'] });
    qc.invalidateQueries({ queryKey: ['player-actions'] });
  };

  return (
    <>
      <PageHeader
        title="Today's Command Center"
        subtitle={`${context.division.gameTitle} • ${context.rosterStatus.replace('_', ' ')} • ${context.primaryRole || 'Player'}`}
        actions={
          <>
            <select className="input w-auto" value={timezone} onChange={(e) => setTimezone(e.target.value)} aria-label="Zona waktu">
              {TIMEZONES.map((z) => <option key={z}>{z}</option>)}
            </select>
            <Badge tone="cyan"><Radio size={11} /> LIVE</Badge>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard label="Sesi Hari Ini" value={counts.schedule} hint="Scrim / VOD / turnamen" icon={CalendarDays} tone="cyan" />
        <StatCard label="Playbook Belum Siap" value={counts.unreadPlaybooks} hint="Perlu dibaca & dikonfirmasi" icon={Crosshair} tone={counts.unreadPlaybooks > 0 ? 'amber' : 'green'} />
        <StatCard label="Action Item Aktif" value={counts.openActions} hint="Tugas dari coach/analyst" icon={ClipboardList} tone="violet" />
        <StatCard label="Action Item Selesai" value={(actionItems || []).filter((a: any) => a.status === 'DONE').length} hint="Dari total tugas aktif" icon={CheckCircle2} tone="green" />
      </div>

      <div className="asym-grid grid">
        {/* Main rail */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="card-editorial">
            <SectionTitle right={<Link to="/player/schedule" className="text-xs text-sage flex items-center gap-1">Kalender penuh <ArrowUpRight size={12} /></Link>}>
              Today's Schedule — {zoned(new Date().toISOString(), timezone, true)}
            </SectionTitle>
            {schedule.length === 0 ? (
              <Empty title="Tidak ada sesi hari ini" description="Gunakan waktu untuk review playbook atau wellness check-in." />
            ) : (
              <div className="space-y-2">
                {schedule.map((e: any) => {
                  const c = countdownTo(e.startsAt);
                  return (
                    <div key={e.id} className="flex items-center gap-4 p-3 rounded-lg border border-line bg-canvas/40">
                      <div className="w-14 shrink-0 text-center border-r border-line pr-3">
                        <p className="num text-lg font-bold text-crisp">{zoned(e.startsAt, timezone)}</p>
                        <p className="text-[10px] text-muted">{zoned(e.endsAt, timezone)}</p>
                      </div>
                      <div className={`w-1 h-11 rounded-full shrink-0 ${e.type === 'TOURNAMENT' ? 'bg-defeat' : e.type === 'SCRIM' ? 'bg-clay' : 'bg-sage'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <p className="font-semibold truncate">{e.title}</p>
                          <Badge tone={SCHEDULE_TONE[e.type] || 'neutral'}>{SCHEDULE_LABELS[e.type] || e.type}</Badge>
                        </div>
                        <p className="text-xs text-muted flex items-center gap-1"><MapPin size={11} /> {e.location || 'Online'}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`num text-xs font-bold ${c.urgent ? 'text-defeat pulse-soft' : c.live ? 'text-caution' : 'text-sage'}`}>
                          {c.done ? '—' : c.label}
                        </p>
                        <p className="text-[10px] text-muted mt-0.5">{e.attendance ? 'Hadir dicatat' : 'Belum absen'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-[10px] text-muted mt-3 flex items-center gap-1"><Timer size={11} /> Pengingat otomatis aktif pada H-1 jam dan H-15 menit.</p>
          </Card>

          <Card>
            <SectionTitle right={<Link to="/player/performance" className="text-xs text-sage flex items-center gap-1">Lihat semua <ArrowUpRight size={12} /></Link>}>
              Assigned VOD Action Items
            </SectionTitle>
            {actionItems.length === 0 ? <Empty title="Tidak ada tugas aktif" /> : (
              <div className="space-y-2">
                {actionItems.map((a: any) => {
                  const next = nextAction(a.status);
                  return (
                    <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg border border-line bg-canvas/40">
                      <button
                        onClick={() => updateAction(a.id, next)}
                        className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${a.status === 'DONE' ? 'bg-victory border-victory text-canvas' : 'border-line hover:border-sage text-transparent hover:text-sage'}`}
                        title={`Ubah ke ${actionLabel[next]}`}
                        aria-label={`Tandai ${a.title} sebagai ${actionLabel[next]}`}
                      >
                        <CheckCircle2 size={13} />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium ${a.status === 'DONE' ? 'line-through text-muted' : ''}`}>{a.title}</p>
                          <Badge tone={actionTone[a.status] || 'neutral'}>{actionLabel[a.status] || a.status}</Badge>
                        </div>
                        <p className="text-xs text-muted mt-0.5">
                          vs {a.match?.opponentName} • dari {a.creator?.ign}
                          {a.dueDate ? ` • deadline ${fmtDate(a.dueDate, 'dd MMM')}` : ''}
                        </p>
                      </div>
                      {a.match?.vodUrl && (
                        <a href={a.match.vodUrl} target="_blank" rel="noreferrer" className="btn-ghost text-xs shrink-0"><Radio size={13} /> VOD</a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right rail */}
        <div className="space-y-6">
          <Card className="border-sage/20">
            <SectionTitle right={<Link to="/player/playbooks" className="text-xs text-sage">Semua <ArrowUpRight size={12} /></Link>}>
              Playbook Belum Dibaca
            </SectionTitle>
            {unreadPlaybooks.length === 0 ? <Empty title="Semua playbook siap" /> : (
              <div className="space-y-2">
                {unreadPlaybooks.slice(0, 5).map((p: any) => (
                  <Link key={p.id} to={`/player/playbooks/${p.id}`}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-line hover:border-sage/40 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{p.title}</p>
                      <p className="text-[11px] text-muted">{p.mapName} • Patch {p.patchVersion}</p>
                    </div>
                    <Badge tone={READ_STATUS_TONE[p.myStatus] || 'red'} className="shrink-0">
                      {p.myStatus === 'UNREAD' && <AlertTriangle size={10} />}
                      {READ_STATUS_LABELS[p.myStatus] || p.myStatus}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          {wellnessToday ? (
            <Card>
              <SectionTitle right={<Link to="/player/wellness" className="text-xs text-sage">Riwayat <ArrowUpRight size={12} /></Link>}>
                Check-in Hari Ini Selesai
              </SectionTitle>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  ['Tidur', wellnessToday.sleepHours], ['Fatigue', wellnessToday.fatigueLevel], ['Mental', wellnessToday.mentalReadiness],
                ].map(([l, v]: any) => (
                  <div key={l} className="rounded-lg border border-line bg-canvas/50 py-3">
                    <p className="num text-xl font-bold text-sage">{v}<span className="text-[10px] text-muted">/10</span></p>
                    <p className="text-[10px] text-muted uppercase tracking-wider">{l}</p>
                  </div>
                ))}
              </div>
              <Link to="/player/wellness" className="btn-ghost w-full mt-4"><Zap size={14} /> Update Check-in</Link>
            </Card>
          ) : (
            <Card className="border-caution/30">
              <WellnessForm compact onSaved={() => qc.invalidateQueries({ queryKey: ['player-home'] })} />
            </Card>
          )}

          <Card>
            <SectionTitle>Notifikasi</SectionTitle>
            {notifications.length === 0 ? <Empty title="Tidak ada notifikasi" /> : notifications.map((n: any) => (
              <div key={n.id} className="py-2 border-b border-line/60 last:border-0">
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-xs text-muted">{n.body}</p>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </>
  );
}
