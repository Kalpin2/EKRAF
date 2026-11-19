import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Activity, ClipboardCheck, HeartPulse, Moon, Brain, Timer } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Badge, Card, Empty, Field, Loading, PageHeader, SectionTitle, StatCard } from '../components/ui';
import { fmtDateTime } from '../lib/format';

export default function Wellness() {
  const qc = useQueryClient();
  const user = useAuth((s) => s.user);
  const { data: logs, isLoading } = useQuery<any[]>({ queryKey: ['wellness'], queryFn: () => api.get('/wellness') });
  const [form, setForm] = useState({ sleepHours: '7', fatigueLevel: '2', mentalReadiness: '4', physicalIssue: '', note: '' });
  const [saved, setSaved] = useState(false);

  const submit = async () => {
    await api.post('/wellness', { ...form, sleepHours: Number(form.sleepHours), fatigueLevel: Number(form.fatigueLevel), mentalReadiness: Number(form.mentalReadiness) });
    qc.invalidateQueries({ queryKey: ['wellness'] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const latestMine = (logs || []).find((l: any) => l.userId === 'u-0' || l.user?.ign === user?.ign);
  const avg = (key: string) => logs?.length ? (logs.reduce((s, l) => s + Number(l[key]), 0) / logs.length).toFixed(1) : '0';

  if (isLoading) return <Loading />;

  return (
    <>
      <PageHeader title="Wellness & Condition Log" subtitle="Check-in harian < 30 detik untuk menjaga kesiapan pemain" />

      <div className="grid stagger-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard label="Rata-rata Tidur" value={`${avg('sleepHours')} jam`} icon={Moon} tone="cyan" />
        <StatCard label="Rata-rata Kelelahan" value={`${avg('fatigueLevel')}/5`} icon={HeartPulse} tone="amber" />
        <StatCard label="Kesiapan Mental" value={`${avg('mentalReadiness')}/5`} icon={Brain} tone="green" />
        <StatCard label="Total Check-in" value={logs?.length || 0} icon={ClipboardCheck} tone="violet" />
      </div>

      <div className="asym-grid grid">
        <Card className="lg:col-span-1">
          <SectionTitle><span className="flex items-center gap-2"><Timer size={15} /> Check-in Hari Ini</span></SectionTitle>
          <div className="space-y-4">
            <Field label="Kualitas Tidur (jam)"><input className="input num" type="number" step="0.5" value={form.sleepHours} onChange={(e) => setForm({ ...form, sleepHours: e.target.value })} /></Field>
            <div>
              <div className="flex justify-between"><span className="label">Tingkat Kelelahan</span><Badge tone={Number(form.fatigueLevel) >= 4 ? 'red' : 'green'}>{form.fatigueLevel}/5</Badge></div>
              <input type="range" min="1" max="5" value={form.fatigueLevel} onChange={(e) => setForm({ ...form, fatigueLevel: e.target.value })} className="w-full accent-caution" />
            </div>
            <div>
              <div className="flex justify-between"><span className="label">Kesiapan Mental</span><Badge tone={Number(form.mentalReadiness) >= 4 ? 'green' : 'amber'}>{form.mentalReadiness}/5</Badge></div>
              <input type="range" min="1" max="5" value={form.mentalReadiness} onChange={(e) => setForm({ ...form, mentalReadiness: e.target.value })} className="w-full accent-sage" />
            </div>
            <Field label="Kondisi Fisik (opsional)"><input className="input" value={form.physicalIssue} onChange={(e) => setForm({ ...form, physicalIssue: e.target.value })} placeholder="Contoh: nyeri pergelangan tangan" /></Field>
            <Field label="Catatan"><textarea className="input" rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>
            <button className="btn-primary w-full" onClick={submit}>
              {saved ? '✓ Check-in Tersimpan' : <><Activity size={16} /> Simpan Check-in</>}
            </button>
            {latestMine && <p className="text-[11px] text-muted text-center">Check-in terakhir: {fmtDateTime(latestMine.loggedAt)}</p>}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <SectionTitle>Riwayat Check-in Tim</SectionTitle>
          {!logs?.length ? <Empty title="Belum ada check-in" /> : (
            <div className="overflow-x-auto max-h-[560px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-surface"><tr className="text-left text-[11px] uppercase tracking-wider text-muted border-b border-line">
                  <th className="py-3">Pemain</th><th className="py-3 num">Tidur</th><th className="py-3 num">Fatigue</th><th className="py-3 num">Mental</th><th className="py-3">Kondisi Fisik</th><th className="py-3">Waktu</th>
                </tr></thead>
                <tbody>
                  {logs.slice(0, 30).map((l) => (
                    <tr key={l.id} className="border-b border-line/50 last:border-0">
                      <td className="py-2.5 font-semibold">{l.user?.ign}</td>
                      <td className="py-2.5 num">{l.sleepHours} jam</td>
                      <td className="py-2.5"><Badge tone={l.fatigueLevel >= 4 ? 'red' : l.fatigueLevel >= 3 ? 'amber' : 'green'}>{l.fatigueLevel}/5</Badge></td>
                      <td className="py-2.5"><Badge tone={l.mentalReadiness >= 4 ? 'green' : 'amber'}>{l.mentalReadiness}/5</Badge></td>
                      <td className="py-2.5 text-xs text-muted">{l.physicalIssue || '—'}</td>
                      <td className="py-2.5 text-xs text-muted">{fmtDateTime(l.loggedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
