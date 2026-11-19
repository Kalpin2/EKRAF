import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { Activity, CheckCircle2, ClipboardList, Gauge, Radio, Target, TrendingUp } from 'lucide-react';
import { api } from '../../lib/api';
import { Badge, Card, Empty, Loading, PageHeader, Progress, SectionTitle, StatCard, Tabs } from '../../components/ui';
import { actionLabel, actionTone, mmss, nextAction } from '../../lib/player';
import { fmtDate } from '../../lib/format';

const SCORE_FIELDS = [
  ['mechanics', 'Mekanik'], ['communication', 'Komunikasi'], ['mapAwareness', 'Map Awareness'],
  ['tactics', 'Eksekusi Taktik'], ['mentality', 'Mentalitas'],
];

export default function PlayerPerformance() {
  const qc = useQueryClient();
  const [mode, setMode] = useState('ALL');
  const [tab, setTab] = useState('stats');

  const { data: perf, isLoading } = useQuery<any>({
    queryKey: ['player-performance', mode],
    queryFn: () => api.get('/player/performance', { mode }),
  });
  const { data: scorecards } = useQuery<any[]>({ queryKey: ['player-scorecards'], queryFn: () => api.get('/player/scorecards') });
  const { data: actions } = useQuery<any>({ queryKey: ['player-actions'], queryFn: () => api.get('/player/action-items') });

  const updateAction = async (id: string, status: string) => {
    await api.patch(`/player/action-items/${id}`, { status });
    qc.invalidateQueries({ queryKey: ['player-actions'] });
    qc.invalidateQueries({ queryKey: ['player-home'] });
  };

  if (isLoading) return <Loading />;

  const trend: any[] = ((perf?.trend || []) as any[]).map((t: any) => ({ ...t, label: fmtDate(t.date, 'dd/MM') }));
  const patches: string[] = [...new Set(trend.map((t: any) => String(t.patch || '')).filter(Boolean))];
  const avgAcs = trend.length ? Math.round(trend.reduce((s: number, t: any) => s + t.acs, 0) / trend.length) : 0;
  const avgKd = trend.length ? (trend.reduce((s: number, t: any) => s + t.kd, 0) / trend.length).toFixed(2) : '0';
  const wins = trend.filter((t: any) => t.result === 'WIN').length;

  return (
    <>
      <PageHeader title="Performa & VOD Review" subtitle="Statistik pribadi lintas mode • scorecard coach • action items" />

      <Tabs
        tabs={[{ key: 'stats', label: 'Statistik & Tren' }, { key: 'scorecard', label: 'Scorecard Coach' }, { key: 'vod', label: 'VOD & Action Items' }]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'stats' && (
        <>
          <div className="flex flex-wrap items-center gap-2 mb-5">
            {[['ALL', 'Semua Mode'], ['SCRIM', 'Scrim'], ['OFFICIAL', 'Turnamen'], ['RANKED', 'Ranked']].map(([k, v]) => (
              <button key={k} onClick={() => setMode(k)} className={`chip border px-3 py-1.5 ${mode === k ? 'bg-sage/15 border-sage text-sage' : 'bg-elevated border-line text-muted hover:text-crisp'}`}>{v}</button>
            ))}
          </div>

          <div className="grid stagger-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <StatCard label="Total Sesi" value={perf?.total || 0} icon={Activity} tone="cyan" />
            <StatCard label="Rata-rata ACS" value={avgAcs} icon={TrendingUp} tone="green" />
            <StatCard label="Rata-rata K/D" value={avgKd} icon={Gauge} tone="violet" />
            <StatCard label="Win Rate" value={trend.length ? Math.round((wins / trend.length) * 100) + '%' : '0%'} icon={Target} tone="amber" />
          </div>

          <div className="asym-grid grid">
            <Card className="lg:col-span-2">
              <SectionTitle right={<div className="flex gap-1">{patches.map((p) => <Badge key={p} tone="violet">{p}</Badge>)}</div>}>
                Tren ACS & Scorecard per Patch
              </SectionTitle>
              {trend.length === 0 ? <Empty title="Belum ada data sesi" /> : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trend} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                      <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis yAxisId="left" stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis yAxisId="right" orientation="right" domain={[0, 5]} stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-secondary)' }} />
                      {patches.map((p: string) => {
                        const first = trend.find((t: any) => t.patch === p);
                        return <ReferenceLine key={p} x={first?.label} yAxisId="right" stroke="var(--accent-secondary)" strokeDasharray="3 3"
                          label={{ value: `Patch ${p}`, fill: 'var(--accent-secondary)', fontSize: 9, position: 'insideTopLeft' }} />;
                      })}
                      <Line yAxisId="left" type="monotone" dataKey="acs" name="ACS" stroke="var(--accent-primary)" strokeWidth={2} dot={{ r: 2 }} animationDuration={420} animationEasing="ease-out" />
                      <Line yAxisId="right" type="monotone" dataKey="scorecardAvg" name="Scorecard" stroke="var(--accent-secondary)" strokeWidth={2} dot={{ r: 2 }} animationDuration={420} animationEasing="ease-out" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            <Card>
              <SectionTitle>Ringkasan per Mode</SectionTitle>
              <div className="space-y-3">
                {(perf?.byMode || []).map((m: any) => (
                  <div key={m.mode} className="rounded-lg border border-line bg-canvas/40 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted">{m.mode}</span>
                      <Badge tone="neutral">{m.matches} sesi</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[['ACS', m.avgAcs], ['K/D', m.avgKd], ['W', m.wins]].map(([l, v]: any) => (
                        <div key={l}><p className="num text-sm font-bold text-crisp">{v}</p><p className="text-[9px] text-muted">{l}</p></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card className="mt-6">
            <SectionTitle>Riwayat Sesi (Tabular Numerals)</SectionTitle>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-[11px] uppercase tracking-wider text-muted border-b border-line">
                  <th className="py-2">Tanggal</th><th className="py-2">Mode</th><th className="py-2">Lawan</th><th className="py-2">Map</th>
                  <th className="py-2 num">K</th><th className="py-2 num">D</th><th className="py-2 num">A</th><th className="py-2 num">ACS</th><th className="py-2 num">K/D</th><th className="py-2">Hasil</th>
                </tr></thead>
                <tbody>
                  {[...trend].reverse().map((t: any) => (
                    <tr key={t.id} className="border-b border-line/50 last:border-0">
                      <td className="py-2 text-xs text-muted">{fmtDate(t.date)}</td>
                      <td className="py-2"><Badge tone="neutral">{t.mode}</Badge></td>
                      <td className="py-2 font-medium">{t.opponent}</td>
                      <td className="py-2 text-muted">{t.map}</td>
                      <td className="py-2 num text-victory">{t.kills}</td>
                      <td className="py-2 num text-defeat">{t.deaths}</td>
                      <td className="py-2 num">{t.assists}</td>
                      <td className="py-2 num text-sage">{t.acs}</td>
                      <td className="py-2 num">{t.kd}</td>
                      <td className="py-2"><Badge tone={t.result === 'WIN' ? 'green' : 'red'}>{t.result}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {tab === 'scorecard' && (
        <Card>
          <SectionTitle right={<Badge tone="cyan">Dari Head Coach / Analyst</Badge>}>Riwayat Player Performance Scorecard</SectionTitle>
          {!scorecards?.length ? <Empty title="Belum ada scorecard" /> : (
            <div className="grid md:grid-cols-2 gap-4">
              {scorecards.map((s) => (
                <div key={s.id} className="rounded-lg border border-line bg-canvas/40 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold">vs {s.opponent}</p>
                      <p className="text-[11px] text-muted">{fmtDate(s.date)} • {s.map} • Patch {s.patch}</p>
                    </div>
                    <Badge tone={s.average >= 4.5 ? 'green' : s.average >= 3.5 ? 'cyan' : 'amber'}><span className="num">{s.average}</span>/5</Badge>
                  </div>
                  <div className="space-y-2 stagger-grid">
                    {SCORE_FIELDS.map(([key, label]) => (
                      <div key={key} className="flex items-center gap-3">
                        <span className="text-[11px] text-muted w-28 shrink-0">{label}</span>
                        <div className="flex-1"><Progress value={(Number(s[key]) / 5) * 100} tone={Number(s[key]) >= 4 ? 'green' : 'cyan'} /></div>
                        <span className="num text-xs w-6 text-right">{s[key]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === 'vod' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <SectionTitle right={<Badge tone="violet"><Radio size={10} /> Timestamped</Badge>}>Catatan VOD Review</SectionTitle>
            {!actions?.vodNotes?.length ? <Empty title="Belum ada catatan VOD" /> : (
              <div className="space-y-2 stagger-grid">
                {actions.vodNotes.map((n: any) => (
                  <div key={n.id} className="rounded-lg border border-line bg-canvas/50 p-3">
                    <span className="num text-sm font-bold text-sage">{n.mmss || mmss(n.timestampSeconds)}</span>
                    <p className="text-sm mt-1">{n.note}</p>
                    <p className="text-[10px] text-muted mt-1">— {n.author.ign}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
          <Card>
            <SectionTitle right={<Badge tone="amber">{actions?.actions?.filter((a: any) => a.status !== 'DONE').length || 0} aktif</Badge>}>Action Items Saya</SectionTitle>
            {!actions?.actions?.length ? <Empty title="Tidak ada action item" /> : (
              <div className="space-y-2 stagger-grid">
                {actions.actions.map((a: any) => {
                  const next = nextAction(a.status);
                  return (
                    <div key={a.id} className="rounded-lg border border-line bg-canvas/50 p-3 flex items-start gap-3">
                      <button onClick={() => updateAction(a.id, next)}
                        className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 ${a.status === 'DONE' ? 'bg-victory border-victory text-canvas' : 'border-line text-transparent hover:text-sage'}`}
                        aria-label={`Ubah status ke ${actionLabel[next]}`}>
                        <CheckCircle2 size={13} />
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium ${a.status === 'DONE' ? 'line-through text-muted' : ''}`}>{a.title}</p>
                          <Badge tone={actionTone[a.status] || 'neutral'}>{actionLabel[a.status] || a.status}</Badge>
                        </div>
                        <p className="text-[11px] text-muted mt-0.5">vs {a.match?.opponentName} • {a.dueDate ? fmtDate(a.dueDate) : 'tanpa deadline'}</p>
                        {a.status !== 'DONE' && <button className="text-[11px] text-sage mt-1" onClick={() => updateAction(a.id, next)}>Tandai {actionLabel[next]} →</button>}
                      </div>
                      <ClipboardList size={14} className="text-muted shrink-0" />
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
