import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Activity, Brain, HeartPulse, Moon } from 'lucide-react';
import { api } from '../../lib/api';
import { Badge, Card, Empty, Loading, PageHeader, SectionTitle, StatCard } from '../../components/ui';
import WellnessForm from '../../components/player/WellnessForm';
import { fmtDate } from '../../lib/format';

export default function PlayerWellness() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<any[]>({
    queryKey: ['player-wellness'],
    queryFn: () => api.get('/player/wellness', { days: 14 }),
  });

  if (isLoading) return <Loading />;

  const rows = (data || []).slice(-14);
  const chart = rows.map((r) => ({ ...r, label: fmtDate(r.loggedAt, 'dd/MM') }));
  const latest = rows[rows.length - 1];
  const avg = (key: string) => rows.length ? (rows.reduce((s: number, r: any) => s + Number(r[key]), 0) / rows.length).toFixed(1) : '0';

  return (
    <>
      <PageHeader title="Daily Wellness & Condition Log" subtitle="Check-in cepat < 30 detik • pantau pola kelelahan menjelang turnamen" />

      <div className="grid stagger-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard label="Tidur (rata-rata)" value={`${avg('sleepHours')}/10`} icon={Moon} tone="cyan" />
        <StatCard label="Burnout Index" value={`${avg('fatigueLevel')}/10`} icon={HeartPulse} tone={Number(avg('fatigueLevel')) >= 7 ? 'red' : 'green'} />
        <StatCard label="Kesiapan Mental" value={`${avg('mentalReadiness')}/10`} icon={Brain} tone="violet" />
        <StatCard label="Total Check-in" value={rows.length} hint="14 hari terakhir" icon={Activity} tone="amber" />
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-2">
          <WellnessForm onSaved={() => qc.invalidateQueries({ queryKey: ['player-wellness'] })} />
        </Card>

        <Card className="lg:col-span-3">
          <SectionTitle right={<Badge tone="neutral">14 hari terakhir</Badge>}>Grafik Kondisi Pribadi</SectionTitle>
          {chart.length === 0 ? <Empty title="Belum ada riwayat" description="Isi check-in pertama Anda di sebelah kiri." /> : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 10]} stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-secondary)' }} />
                  <ReferenceLine y={7} stroke="var(--semantic-win)" strokeDasharray="4 4" label={{ value: 'Target ≥7 (tidur/mental)', fill: 'var(--semantic-win)', fontSize: 9, position: 'insideTopRight' }} />
                  <ReferenceLine y={8} stroke="var(--semantic-loss)" strokeDasharray="2 4" label={{ value: 'Risiko burnout (fatigue ≥8)', fill: 'var(--semantic-loss)', fontSize: 9, position: 'insideBottomRight' }} />
                  <Line type="monotone" dataKey="sleepHours" name="Tidur" stroke="var(--accent-primary)" strokeWidth={2} dot={{ r: 2 }} animationDuration={420} animationEasing="ease-out" />
                  <Line type="monotone" dataKey="mentalReadiness" name="Mental" stroke="var(--semantic-win)" strokeWidth={2} dot={{ r: 2 }} animationDuration={420} animationEasing="ease-out" />
                  <Line type="monotone" dataKey="fatigueLevel" name="Kelelahan" stroke="var(--semantic-loss)" strokeWidth={2} dot={{ r: 2 }} animationDuration={420} animationEasing="ease-out" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          <p className="text-[10px] text-muted mt-2">Kelelahan tinggi (&gt;7) dan tidur rendah (&lt;5) pada hari berturut-turut menandakan risiko burnout.</p>
        </Card>
      </div>

      <Card className="mt-6">
        <SectionTitle>Riwayat Check-in</SectionTitle>
        {!rows.length ? <Empty title="Belum ada riwayat" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-[11px] uppercase tracking-wider text-muted border-b border-line">
                <th className="py-2">Tanggal</th><th className="py-2 num">Tidur</th><th className="py-2 num">Kelelahan</th><th className="py-2 num">Mental</th><th className="py-2">Kondisi Fisik</th><th className="py-2">Catatan</th>
              </tr></thead>
              <tbody>
                {[...rows].reverse().map((r) => (
                  <tr key={r.id} className="border-b border-line/50 last:border-0">
                    <td className="py-2 text-xs text-muted">{fmtDate(r.loggedAt, 'dd MMM yyyy • HH:mm')}</td>
                    <td className="py-2 num">{r.sleepHours}/10</td>
                    <td className="py-2"><Badge tone={r.fatigueLevel >= 7 ? 'red' : 'green'}>{r.fatigueLevel}/10</Badge></td>
                    <td className="py-2"><Badge tone={r.mentalReadiness >= 7 ? 'green' : 'amber'}>{r.mentalReadiness}/10</Badge></td>
                    <td className="py-2 text-xs text-muted">{r.physicalIssue || '—'}</td>
                    <td className="py-2 text-xs text-muted">{r.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {latest && (
        <p className="text-[11px] text-muted mt-3">Check-in terakhir: {fmtDate(latest.loggedAt, 'dd MMM yyyy • HH:mm')}</p>
      )}
    </>
  );
}
