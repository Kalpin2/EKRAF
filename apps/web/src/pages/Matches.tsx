import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Swords, Play, ClipboardList, ExternalLink, Trophy } from 'lucide-react';
import { api } from '../lib/api';
import { Badge, Card, Empty, Field, Loading, Modal, PageHeader, SectionTitle, StatCard } from '../components/ui';
import { fmtDate, mmss } from '../lib/format';

export default function Matches() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [filter, setFilter] = useState('ALL');
  const [form, setForm] = useState({ opponentName: '', mapName: 'Ascent', matchType: 'SCRIM', patchVersion: '8.08', scoreUs: '13', scoreThem: '7', vodUrl: '', notes: '' });
  const [stats, setStats] = useState<Record<string, any>>({});

  const { data: matches, isLoading } = useQuery<any[]>({ queryKey: ['matches'], queryFn: () => api.get('/matches') });
  const { data: members } = useQuery<any[]>({ queryKey: ['members'], queryFn: () => api.get('/core/members') });
  const players = (members || []).filter((m: any) => m.divisionRole === 'PLAYER');

  const filtered = useMemo(() => (matches || []).filter((m) => filter === 'ALL' || m.matchType === filter), [matches, filter]);
  const wins = (matches || []).filter((m: any) => m.result === 'WIN').length;
  const winRate = matches?.length ? Math.round((wins / matches.length) * 100) : 0;

  const openDetail = async (id: string) => {
    const data: any = await api.get(`/matches/${id}`);
    setDetail(data);
  };

  const create = async () => {
    if (!form.opponentName) return;
    const body = {
      divisionId: 'div-val', opponentName: form.opponentName, mapName: form.mapName,
      matchType: form.matchType, patchVersion: form.patchVersion,
      scoreUs: Number(form.scoreUs), scoreThem: Number(form.scoreThem),
      vodUrl: form.vodUrl, notes: form.notes,
      stats: players.map((p: any) => ({ userId: p.userId, ...(stats[p.userId] || {}) })),
    };
    await api.post('/matches', body);
    qc.invalidateQueries({ queryKey: ['matches'] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
    setShowAdd(false);
  };

  if (isLoading) return <Loading />;

  return (
    <>
      <PageHeader
        title="Scrim & Match"
        subtitle="Catat hasil pertandingan, statistik pemain, dan VOD review"
        actions={<button className="btn-primary" onClick={() => setShowAdd(true)}><Plus size={16} /> Catat Pertandingan</button>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard label="Total Match" value={matches?.length || 0} icon={Swords} tone="cyan" />
        <StatCard label="Kemenangan" value={wins} icon={Trophy} tone="green" />
        <StatCard label="Win Rate" value={`${winRate}%`} icon={Trophy} tone="violet" />
        <StatCard label="Dengan VOD" value={(matches || []).filter((m: any) => m.vodUrl).length} icon={Play} tone="amber" />
      </div>

      <Card>
        <div className="flex gap-2 mb-5">
          {[['ALL', 'Semua'], ['SCRIM', 'Scrim'], ['OFFICIAL', 'Turnamen'], ['RANKED', 'Ranked']].map(([k, v]) => (
            <button key={k} onClick={() => setFilter(k)} className={`chip border px-3 py-1.5 ${filter === k ? 'bg-sage/15 border-sage text-sage' : 'bg-elevated border-line text-muted hover:text-crisp'}`}>{v}</button>
          ))}
        </div>
        {filtered.length === 0 ? <Empty title="Belum ada pertandingan" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-[11px] uppercase tracking-wider text-muted border-b border-line">
                <th className="py-3 font-medium">Lawan</th><th className="py-3 font-medium">Tipe</th><th className="py-3 font-medium">Map</th>
                <th className="py-3 font-medium">Patch</th><th className="py-3 font-medium">Skor</th><th className="py-3 font-medium">Hasil</th>
                <th className="py-3 font-medium">Tanggal</th><th className="py-3 font-medium">VOD</th>
              </tr></thead>
              <tbody>
                {filtered.map((m: any) => (
                  <tr key={m.id} className="border-b border-line/50 last:border-0 hover:bg-elevated/40 transition-colors cursor-pointer" onClick={() => openDetail(m.id)}>
                    <td className="py-3 font-semibold">{m.opponentName}</td>
                    <td className="py-3"><Badge tone={m.matchType === 'OFFICIAL' ? 'red' : 'violet'}>{m.matchType}</Badge></td>
                    <td className="py-3 text-muted">{m.mapName}</td>
                    <td className="py-3"><Badge tone="neutral">{m.patchVersion}</Badge></td>
                    <td className="py-3 num font-semibold">{m.scoreUs} : {m.scoreThem}</td>
                    <td className="py-3"><Badge tone={m.result === 'WIN' ? 'green' : 'red'}>{m.result}</Badge></td>
                    <td className="py-3 text-xs text-muted">{fmtDate(m.playedAt)}</td>
                    <td className="py-3">
                      <div className="flex gap-2 text-muted">
                        {m.vodUrl && <Play size={14} className="text-sage" />}
                        {m._count?.actionItems > 0 && <ClipboardList size={14} className="text-caution" />}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Quick input modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Catat Hasil Pertandingan" wide>
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Field label="Lawan"><input className="input" value={form.opponentName} onChange={(e) => setForm({ ...form, opponentName: e.target.value })} placeholder="Team Liquid" /></Field>
            <Field label="Tipe">
              <select className="input" value={form.matchType} onChange={(e) => setForm({ ...form, matchType: e.target.value })}>
                <option>SCRIM</option><option>OFFICIAL</option><option>RANKED</option>
              </select>
            </Field>
            <Field label="Map"><input className="input" value={form.mapName} onChange={(e) => setForm({ ...form, mapName: e.target.value })} /></Field>
            <Field label="Patch"><input className="input" value={form.patchVersion} onChange={(e) => setForm({ ...form, patchVersion: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Skor Kita"><input className="input num" type="number" value={form.scoreUs} onChange={(e) => setForm({ ...form, scoreUs: e.target.value })} /></Field>
            <Field label="Skor Lawan"><input className="input num" type="number" value={form.scoreThem} onChange={(e) => setForm({ ...form, scoreThem: e.target.value })} /></Field>
            <Field label="Link VOD"><input className="input" value={form.vodUrl} onChange={(e) => setForm({ ...form, vodUrl: e.target.value })} placeholder="https://..." /></Field>
          </div>

          <div>
            <SectionTitle>Statistik Pemain <span className="text-[10px] normal-case tracking-normal text-muted">(opsional, K / D / A / ACS)</span></SectionTitle>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {players.map((p: any) => {
                const s = stats[p.userId] || {};
                return (
                  <div key={p.userId} className="grid grid-cols-5 items-center gap-2 bg-canvas/50 rounded-lg p-2">
                    <span className="text-sm font-medium col-span-1">{p.user.ign}</span>
                    {['kills', 'deaths', 'assists', 'acsOrRating'].map((key) => (
                      <input key={key} className="input num text-center px-1 py-1" type="number" placeholder={key === 'acsOrRating' ? 'ACS' : key[0].toUpperCase()}
                        value={s[key] ?? ''} onChange={(e) => setStats({ ...stats, [p.userId]: { ...s, [key]: e.target.value } })} />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          <Field label="Catatan"><textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
          <div className="flex justify-end gap-2">
            <button className="btn-ghost" onClick={() => setShowAdd(false)}>Batal</button>
            <button className="btn-primary" onClick={create}>Simpan Pertandingan</button>
          </div>
        </div>
      </Modal>

      {/* Detail modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={`Detail — ${detail?.opponentName || ''}`} wide>
        {detail && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 flex-wrap">
              <Badge tone={detail.result === 'WIN' ? 'green' : 'red'}>{detail.result}</Badge>
              <span className="num heading text-3xl">{detail.scoreUs} : {detail.scoreThem}</span>
              <Badge tone="violet">{detail.mapName}</Badge>
              <Badge tone="neutral">Patch {detail.patchVersion}</Badge>
              <span className="text-xs text-muted">{fmtDate(detail.playedAt)}</span>
              {detail.vodUrl && <a href={detail.vodUrl} target="_blank" rel="noreferrer" className="btn-ghost ml-auto"><ExternalLink size={14} /> Tonton VOD</a>}
            </div>

            <div>
              <SectionTitle>Statistik Pemain</SectionTitle>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-[11px] uppercase text-muted border-b border-line">
                    <th className="py-2">Pemain</th><th className="py-2">Agent</th><th className="py-2 num">K</th><th className="py-2 num">D</th><th className="py-2 num">A</th><th className="py-2 num">ACS</th><th className="py-2 num">KD</th>
                  </tr></thead>
                  <tbody>
                    {detail.playerStats?.map((s: any) => (
                      <tr key={s.id} className="border-b border-line/50">
                        <td className="py-2 font-medium">{s.user.ign}</td>
                        <td className="py-2 text-muted">{s.characterPlayed}</td>
                        <td className="py-2 num text-victory">{s.kills}</td>
                        <td className="py-2 num text-defeat">{s.deaths}</td>
                        <td className="py-2 num">{s.assists}</td>
                        <td className="py-2 num text-sage">{s.acsOrRating}</td>
                        <td className="py-2 num">{s.deaths ? (s.kills / s.deaths).toFixed(2) : s.kills}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <SectionTitle>VOD Notes (Timestamp)</SectionTitle>
                {detail.vodNotes?.length ? detail.vodNotes.map((n: any) => (
                  <div key={n.id} className="bg-canvas/60 rounded-lg p-3 mb-2 border border-line">
                    <span className="num text-sage text-sm">{mmss(n.timestampSeconds)}</span>
                    <p className="text-sm mt-1">{n.note}</p>
                    <p className="text-[11px] text-muted mt-1">— {n.author.ign}</p>
                  </div>
                )) : <p className="text-sm text-muted">Belum ada catatan VOD.</p>}
              </div>
              <div>
                <SectionTitle>Action Items</SectionTitle>
                {detail.actionItems?.length ? detail.actionItems.map((a: any) => (
                  <div key={a.id} className="bg-canvas/60 rounded-lg p-3 mb-2 border border-line">
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-sm font-medium">{a.title}</p>
                      <Badge tone={a.status === 'DONE' ? 'green' : 'amber'}>{a.status}</Badge>
                    </div>
                    <p className="text-xs text-muted mt-1">→ {a.assignee.ign} • {a.dueDate ? fmtDate(a.dueDate) : 'tanpa deadline'}</p>
                  </div>
                )) : <p className="text-sm text-muted">Belum ada action item.</p>}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
