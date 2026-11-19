import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, CheckCircle2, Clock, MapPin, ShieldCheck, Timer } from 'lucide-react';
import { api } from '../../lib/api';
import { Badge, Card, Empty, Loading, PageHeader, Progress, SectionTitle, StatCard, Tabs } from '../../components/ui';
import {
  ATTENDANCE_LABELS, SCHEDULE_LABELS, SCHEDULE_TONE, TIMEZONES, countdownTo, zoned,
} from '../../lib/player';
import { fmtDate } from '../../lib/format';

export default function PlayerSchedule() {
  const [view, setView] = useState('day');
  const [tz, setTz] = useState('Asia/Jakarta');
  const { data, isLoading } = useQuery<any>({
    queryKey: ['player-schedule', view],
    queryFn: () => api.get('/player/schedule', { view }),
  });

  if (isLoading) return <Loading />;

  const events = data?.events || [];
  const counts = data?.counts || {};

  return (
    <>
      <PageHeader
        title="Jadwal & Kehadiran"
        subtitle={`Kalender divisi ${data?.context?.division?.gameTitle || ''} • rekap kedisiplinan pribadi`}
        actions={
          <select className="input w-auto" value={tz} onChange={(e) => setTz(e.target.value)} aria-label="Zona waktu">
            {TIMEZONES.map((z) => <option key={z}>{z}</option>)}
          </select>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard label="Sesi Ditampilkan" value={events.length} icon={CalendarDays} tone="cyan" />
        <StatCard label="Skor Disiplin" value={`${data?.discipline || 0}%`} icon={ShieldCheck} tone={(data?.discipline || 0) >= 85 ? 'green' : 'amber'} />
        <StatCard label="Tepat Waktu" value={counts.ON_TIME || 0} icon={CheckCircle2} tone="green" />
        <StatCard label="Terlambat" value={counts.LATE || 0} icon={Clock} tone="amber" />
      </div>

      <div className="asym-grid grid">
        <div className="lg:col-span-2">
          <Card>
            <Tabs tabs={[{ key: 'day', label: 'Harian' }, { key: 'week', label: 'Mingguan' }]} active={view} onChange={setView} />
            {events.length === 0 ? <Empty title="Tidak ada jadwal" description="Tidak ada sesi pada rentang waktu ini." /> : (
              <div className="space-y-3">
                {events.map((e: any) => {
                  const c = countdownTo(e.startsAt);
                  return (
                    <div key={e.id} className="flex items-start gap-4 p-4 rounded-lg border border-line bg-canvas/40">
                      <div className="w-16 shrink-0 text-center border-r border-line pr-3">
                        <p className="num text-xl font-bold">{zoned(e.startsAt, tz)}</p>
                        <p className="text-[10px] text-muted">{zoned(e.endsAt, tz)}</p>
                      </div>
                      <div className={`w-1 h-14 rounded-full shrink-0 ${e.type === 'TOURNAMENT' ? 'bg-defeat' : e.type === 'SCRIM' ? 'bg-clay' : 'bg-sage'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <p className="font-semibold">{e.title}</p>
                          <Badge tone={SCHEDULE_TONE[e.type] || 'neutral'}>{SCHEDULE_LABELS[e.type] || e.type}</Badge>
                          {e.attendance && <Badge tone="green"><CheckCircle2 size={10} /> Hadir</Badge>}
                        </div>
                        <p className="text-xs text-muted flex items-center gap-1"><MapPin size={11} /> {e.location || 'Online'}</p>
                        <p className="text-[11px] text-muted mt-0.5 flex items-center gap-1"><Timer size={11} /> {tz}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`num text-xs font-bold ${c.urgent ? 'text-defeat pulse-soft' : 'text-sage'}`}>{c.done ? 'Selesai' : c.label}</p>
                        <p className="text-[10px] text-muted mt-0.5">{fmtDate(e.startsAt, 'dd MMM')}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <SectionTitle>Ringkasan Kehadiran</SectionTitle>
            <div className="flex items-center gap-4 mb-4">
              <div className="relative w-20 h-20 shrink-0">
                <div className="absolute inset-0 rounded-full border-[6px] border-line" />
                <div className="absolute inset-0 rounded-full border-[6px] border-sage" style={{ clipPath: `inset(0 ${100 - (data?.discipline || 0)}% 0 0)` }} />
                <div className="absolute inset-0 flex items-center justify-center num text-sm font-bold">{data?.discipline || 0}%</div>
              </div>
              <div>
                <p className="font-display font-semibold">Skor Disiplin</p>
                <p className="text-xs text-muted">Dihitung dari ketepatan waktu seluruh sesi.</p>
              </div>
            </div>
            <div className="space-y-2">
              {['ON_TIME', 'LATE', 'EXCUSED', 'SICK', 'ABSENT'].map((k) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="text-xs text-muted">{ATTENDANCE_LABELS[k]}</span>
                  <span className="num text-sm font-semibold">{counts[k] || 0}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-line">
              <Progress value={data?.discipline || 0} tone={(data?.discipline || 0) >= 85 ? 'green' : 'amber'} />
            </div>
          </Card>

          <Card>
            <SectionTitle>Riwayat Absensi</SectionTitle>
            {!data?.history?.length ? <Empty title="Belum ada riwayat" /> : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {data.history.slice(0, 12).map((h: any) => (
                  <div key={h.id} className="flex items-center justify-between py-2 border-b border-line/60 last:border-0">
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{h.event.title}</p>
                      <p className="text-[10px] text-muted">{fmtDate(h.event.startsAt, 'dd MMM')}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge tone={h.status === 'ON_TIME' ? 'green' : h.status === 'LATE' ? 'amber' : 'neutral'}>{ATTENDANCE_LABELS[h.status]}</Badge>
                      {h.lateMinutes > 0 && <p className="text-[10px] text-caution num mt-0.5">+{h.lateMinutes} menit</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
