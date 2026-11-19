import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Clock, MapPin, Plus, Check, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api';
import { Badge, Card, Empty, Field, Loading, Modal, PageHeader, SectionTitle } from '../components/ui';
import { fmtDate, fmtTime } from '../lib/format';

const typeLabels: Record<string, string> = { PRACTICE: 'Practice', SCRIM: 'Scrim', VOD_REVIEW: 'VOD Review', TOURNAMENT: 'Turnamen', MEDIA_DAY: 'Media Day' };
const typeTone: Record<string, any> = { PRACTICE: 'cyan', SCRIM: 'violet', VOD_REVIEW: 'cyan', TOURNAMENT: 'red', MEDIA_DAY: 'amber' };
const attendanceTone: Record<string, any> = { ON_TIME: 'green', LATE: 'amber', EXCUSED: 'violet', SICK: 'red', ABSENT: 'red' };

export default function Schedule() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [attendanceEvent, setAttendanceEvent] = useState<any>(null);
  const [form, setForm] = useState({ title: '', type: 'SCRIM', location: '', startsAt: '', endsAt: '' });
  const [att, setAtt] = useState<Record<string, string>>({});
  const [tz, setTz] = useState('Asia/Jakarta');
  const zoned = (value: string) => new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz }).format(new Date(value));

  const { data: events, isLoading } = useQuery<any[]>({ queryKey: ['schedules'], queryFn: () => api.get('/schedules') });
  const { data: divisions } = useQuery<any[]>({ queryKey: ['divisions'], queryFn: () => api.get('/core/divisions') });
  const { data: members } = useQuery<any[]>({ queryKey: ['members'], queryFn: () => api.get('/core/members') });
  const players = (members || []).filter((m: any) => m.divisionRole === 'PLAYER');

  const grouped = useMemo(() => {
    const map = new Map<string, any[]>();
    (events || []).forEach((e) => {
      const key = fmtDate(e.startsAt, 'EEE, dd MMM yyyy');
      map.set(key, [...(map.get(key) || []), e]);
    });
    return [...map.entries()];
  }, [events]);

  const create = async () => {
    if (!form.title || !form.startsAt) return;
    await api.post('/schedules', { ...form, divisionId: divisions?.[0]?.id, startsAt: new Date(form.startsAt).toISOString(), endsAt: new Date(form.endsAt || form.startsAt).toISOString() });
    qc.invalidateQueries({ queryKey: ['schedules'] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
    setShowAdd(false);
  };

  const saveAttendance = async () => {
    if (!attendanceEvent) return;
    for (const [userId, status] of Object.entries(att)) {
      await api.post('/attendance', { eventId: attendanceEvent.id, userId, status, lateMinutes: status === 'LATE' ? 10 : 0 });
    }
    setAttendanceEvent(null);
    setAtt({});
  };

  if (isLoading) return <Loading />;

  return (
    <>
      <PageHeader
        title="Jadwal & Absensi"
        subtitle="Kalender terpusat untuk latihan, scrim, dan turnamen"
        actions={
          <>
            <select className="input w-auto" value={tz} onChange={(e) => setTz(e.target.value)} title="Zona waktu tampilan">
              {['Asia/Jakarta', 'Asia/Singapore', 'UTC', 'America/Los_Angeles', 'Europe/Berlin'].map((z) => <option key={z}>{z}</option>)}
            </select>
            <button className="btn-primary" onClick={() => setShowAdd(true)}><Plus size={16} /> Buat Jadwal</button>
          </>
        }
      />

      <div className="asym-grid grid">
        <div className="lg:col-span-2 space-y-6">
          {grouped.length === 0 && <Card><Empty title="Belum ada jadwal" description="Buat jadwal pertama untuk tim Anda." /></Card>}
          {grouped.map(([day, items]) => (
            <div key={day}>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="heading text-sm text-crisp">{day}</h2>
                <div className="h-px bg-grid flex-1" />
                <Badge tone="neutral">{items.length} sesi</Badge>
              </div>
              <div className="space-y-2 stagger-grid">
                {items.map((ev: any) => (
                  <Card key={ev.id} hover className="flex items-center gap-4 py-4">
                    <div className={`w-1 h-12 rounded-full shrink-0 ${ev.type === 'TOURNAMENT' ? 'bg-defeat' : ev.type === 'SCRIM' ? 'bg-clay' : 'bg-sage'}`} />
                    <div className="w-16 shrink-0 text-center">
                      <p className="num text-lg font-semibold">{zoned(ev.startsAt)}</p>
                      <p className="text-[10px] text-muted">{zoned(ev.endsAt)}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold truncate">{ev.title}</p>
                        <Badge tone={typeTone[ev.type] || 'neutral'}>{typeLabels[ev.type] || ev.type}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-muted">
                        <span className="flex items-center gap-1"><MapPin size={12} /> {ev.location || 'Online'}</span>
                        <span className="flex items-center gap-1"><Clock size={12} /> {tz}</span>
                        <span className="flex items-center gap-1"><CalendarDays size={12} /> {ev._count?.attendance || 0} peserta</span>
                      </div>
                    </div>
                    <button className="btn-ghost shrink-0" onClick={() => { setAttendanceEvent(ev); setAtt({}); }}>
                      <CheckCircle2 size={14} /> Absensi
                    </button>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        <Card>
          <SectionTitle>Legenda Status</SectionTitle>
          <div className="space-y-2.5">
            {Object.entries(typeLabels).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between">
                <span className="text-sm text-muted">{v}</span>
                <Badge tone={typeTone[k]}>●</Badge>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-5 border-t border-line">
            <p className="text-[11px] uppercase tracking-wider text-muted mb-3">Pengingat Otomatis</p>
            <div className="space-y-2 text-xs text-muted">
              <p className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-sage" /> H-1 jam sebelum sesi</p>
              <p className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-clay" /> H-15 menit sebelum sesi</p>
              <p className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-caution" /> Konversi zona waktu otomatis</p>
            </div>
          </div>
        </Card>
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Buat Jadwal Baru">
        <div className="space-y-4">
          <Field label="Judul Sesi"><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Scrim Block vs Sentinels" /></Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Tipe">
              <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <Field label="Lokasi"><input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Gaming House" /></Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Mulai"><input className="input" type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} /></Field>
            <Field label="Selesai"><input className="input" type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} /></Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn-ghost" onClick={() => setShowAdd(false)}>Batal</button>
            <button className="btn-primary" onClick={create}>Simpan Jadwal</button>
          </div>
        </div>
      </Modal>

      <Modal open={!!attendanceEvent} onClose={() => setAttendanceEvent(null)} title={`Absensi — ${attendanceEvent?.title || ''}`} wide>
        <div className="space-y-2 stagger-grid">
          {players.map((p: any) => (
            <div key={p.userId} className="flex items-center justify-between py-2 border-b border-line/60 last:border-0">
              <div><p className="text-sm font-semibold">{p.user.ign}</p><p className="text-xs text-muted">{p.user.fullName}</p></div>
              <div className="flex flex-wrap gap-1">
                {['ON_TIME', 'LATE', 'EXCUSED', 'SICK', 'ABSENT'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setAtt({ ...att, [p.userId]: s })}
                    className={`chip border transition-colors ${att[p.userId] === s ? 'bg-sage/20 border-sage text-sage' : 'bg-elevated border-line text-muted hover:text-crisp'}`}
                  >
                    {s === 'ON_TIME' ? 'Tepat Waktu' : s === 'LATE' ? 'Terlambat' : s === 'EXCUSED' ? 'Izin' : s === 'SICK' ? 'Sakit' : 'Tanpa Keterangan'}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-4">
            <button className="btn-ghost" onClick={() => setAttendanceEvent(null)}>Batal</button>
            <button className="btn-primary" onClick={saveAttendance}><Check size={15} /> Simpan Absensi</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
