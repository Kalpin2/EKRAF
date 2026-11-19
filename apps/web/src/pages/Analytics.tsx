import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine, BarChart, Bar, Cell,
} from 'recharts';
import { Gauge, TrendingUp, Target, Activity, GitCommitVertical } from 'lucide-react';
import { api } from '../lib/api';
import { Badge, Card, Empty, Loading, PageHeader, SectionTitle, StatCard, Tabs } from '../components/ui';
import { fmtDate } from '../lib/format';
import { downloadCsv, downloadPdf } from '../lib/export';

export default function Analytics() {
  const [tab, setTab] = useState('trends');
  const { data: trends, isLoading } = useQuery<any[]>({ queryKey: ['trends'], queryFn: () => api.get('/analytics/trends') });
  const { data: readiness } = useQuery<any[]>({ queryKey: ['readiness'], queryFn: () => api.get('/analytics/readiness') });
  const { data: attendance } = useQuery<any[]>({ queryKey: ['attendance-report'], queryFn: () => api.get('/analytics/attendance') });

  const chartData = useMemo(() => (trends || []).map((t) => ({
    ...t,
    label: fmtDate(t.date, 'dd/MM'),
  })), [trends]);

  const patchDates = useMemo(() => {
    const seen = new Set<string>();
    return chartData.filter((d) => d.patch && !seen.has(d.patch) && seen.add(d.patch)).map((d) => ({ patch: d.patch, label: d.label }));
  }, [chartData]);

  const avgAcs = trends?.length ? Math.round(trends.reduce((s, t) => s + t.acs, 0) / trends.length) : 0;
  const avgKd = trends?.length ? (trends.reduce((s, t) => s + t.kd, 0) / trends.length).toFixed(2) : '0';
  const avgScore = trends?.length ? (trends.reduce((s, t) => s + t.scorecardAvg, 0) / trends.length).toFixed(2) : '0';

  if (isLoading) return <Loading />;

  return (
    <>
      <PageHeader
        title="Analitik Performa"
        subtitle="Tren performa lintas patch, scorecard, dan kesiapan strategi"
        actions={
          <>
            <button className="btn-ghost" onClick={() => downloadCsv('nexus-trend-performa', (trends || []).map((t) => ({ Tanggal: fmtDate(t.date), Patch: t.patch, Map: t.map, Lawan: t.opponent, Hasil: t.result, K: t.kills, D: t.deaths, A: t.assists, ACS: t.acs, KD: t.kd, Scorecard: t.scorecardAvg })))}>Ekspor CSV</button>
            <button className="btn-ghost" onClick={() => downloadPdf('nexus-laporan-performa.pdf', 'Laporan Performa Tim', 'NexusEsports OS • Analitik lintas patch', (trends || []).map((t) => ({ Tanggal: fmtDate(t.date), Patch: t.patch, Lawan: t.opponent, ACS: t.acs, Scorecard: t.scorecardAvg })))}>Ekspor PDF</button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard label="Rata-rata ACS" value={avgAcs} icon={TrendingUp} tone="cyan" />
        <StatCard label="Rata-rata K/D" value={avgKd} icon={Gauge} tone="green" />
        <StatCard label="Scorecard Coach" value={avgScore} hint="Skala 1–5" icon={Target} tone="violet" />
        <StatCard label="Sesi Tercatat" value={trends?.length || 0} icon={Activity} tone="amber" />
      </div>

      <Tabs
        tabs={[{ key: 'trends', label: 'Tren Performa' }, { key: 'readiness', label: 'Strategy Readiness' }, { key: 'attendance', label: 'Kehadiran' }]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'trends' && (
        <div className="space-y-6">
          <Card>
            <SectionTitle right={<div className="flex gap-2">{patchDates.map((p) => <Badge key={p.patch} tone="violet"><GitCommitVertical size={10} /> Patch {p.patch}</Badge>)}</div>}>
              Tren ACS & Scorecard per Patch
            </SectionTitle>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 5]} stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: 'var(--text-primary)' }} />
                  <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
                  <ReferenceLine yAxisId="right" y={4.75} stroke="var(--semantic-win)" strokeDasharray="4 4" label={{ value: 'Target ≥95% (4.75/5)', fill: 'var(--semantic-win)', fontSize: 10, position: 'insideTopRight' }} />
                  {patchDates.map((p) => (
                    <ReferenceLine key={p.patch} x={p.label} yAxisId="right" stroke="var(--accent-secondary)" strokeDasharray="3 3" label={{ value: `Patch ${p.patch}`, fill: 'var(--accent-secondary)', fontSize: 9, position: 'insideTopLeft' }} />
                  ))}
                  <Line yAxisId="left" type="monotone" dataKey="acs" name="ACS" stroke="var(--accent-primary)" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 5 }} />
                  <Line yAxisId="right" type="monotone" dataKey="scorecardAvg" name="Scorecard" stroke="var(--accent-secondary)" strokeWidth={2} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-muted mt-2">Garis vertikal menandai transisi patch game — evaluasi dampak perubahan meta terhadap performa.</p>
          </Card>

          <Card>
            <SectionTitle>Distribusi K/D per Pemain</SectionTitle>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.slice(-14)} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="kd" name="K/D" radius={[4, 4, 0, 0]}>
                    {chartData.slice(-14).map((d, i) => <Cell key={i} fill={d.result === 'WIN' ? 'var(--semantic-win)' : 'var(--semantic-loss)'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {tab === 'readiness' && (
        <Card>
          <SectionTitle>Status Keterbacaan Strategi (Target ≥95% H-1)</SectionTitle>
          {!readiness?.length ? <Empty title="Belum ada data readiness" /> : (
            <div className="space-y-3">
              {readiness.map((r) => (
                <div key={r.id} className="flex items-center gap-4 py-2 border-b border-line/60 last:border-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <p className="text-sm font-semibold">{r.title}</p>
                      {r.matchdayReady && <Badge tone="green">Matchday</Badge>}
                    </div>
                    <div className="h-1.5 bg-grid rounded-full overflow-hidden max-w-md">
                      <div className={`h-full rounded-full ${r.rate >= 95 ? 'bg-victory' : r.rate >= 70 ? 'bg-sage' : 'bg-caution'}`} style={{ width: `${r.rate}%` }} />
                    </div>
                  </div>
                  <span className="num text-sm text-muted">{r.ack}/{r.total}</span>
                  <Badge tone={r.rate >= 95 ? 'green' : r.rate >= 70 ? 'cyan' : 'amber'}>{r.rate}%</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === 'attendance' && (
        <Card>
          <SectionTitle>Ringkasan Kehadiran Pemain</SectionTitle>
          {!attendance?.length ? <Empty title="Belum ada data absensi" /> : (
            <div className="space-y-3">
              {attendance.map((a) => (
                <div key={a.ign} className="flex items-center gap-4 py-2 border-b border-line/60 last:border-0">
                  <div className="w-28"><p className="text-sm font-semibold">{a.ign}</p></div>
                  <div className="flex-1 h-2 bg-grid rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-sage" style={{ width: `${a.rate}%` }} />
                  </div>
                  <span className="num text-sm text-muted">{a.onTime}/{a.total} tepat waktu</span>
                  <Badge tone={a.rate >= 90 ? 'green' : a.rate >= 75 ? 'amber' : 'red'}>{a.rate}%</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </>
  );
}
