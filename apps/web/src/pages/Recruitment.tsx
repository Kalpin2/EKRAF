import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, UserPlus, Star, ExternalLink } from 'lucide-react';
import { api } from '../lib/api';
import { Badge, Card, Field, Loading, Modal, PageHeader, SectionTitle } from '../components/ui';
import { timeAgo } from '../lib/format';

const STAGES = [
  { key: 'SCOUTING', label: 'Target Scouting', tone: 'neutral' },
  { key: 'CONTACTED', label: 'Dihubungi', tone: 'cyan' },
  { key: 'TRIAL_SCHEDULED', label: 'Jadwal Trial', tone: 'violet' },
  { key: 'COACH_EVAL', label: 'Evaluasi Coach', tone: 'amber' },
  { key: 'OFFER', label: 'Penawaran', tone: 'green' },
  { key: 'ACCEPTED', label: 'Diterima', tone: 'green' },
  { key: 'REJECTED', label: 'Ditolak', tone: 'red' },
];

export default function Recruitment() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', ign: '', role: '', source: 'Open Trial', rating: '7.5', notes: '' });
  const { data: recruits, isLoading } = useQuery<any[]>({ queryKey: ['recruits'], queryFn: () => api.get('/recruits') });

  const move = async (id: string, stage: string) => {
    await api.patch(`/recruits/${id}`, { stage });
    qc.invalidateQueries({ queryKey: ['recruits'] });
  };

  const add = async () => {
    if (!form.name || !form.ign) return;
    await api.post('/recruits', { ...form, divisionId: 'div-val', rating: Number(form.rating) });
    qc.invalidateQueries({ queryKey: ['recruits'] });
    setShowAdd(false);
  };

  if (isLoading) return <Loading />;

  return (
    <>
      <PageHeader title="Pipeline Rekrutmen" subtitle="Kanban scouting → trial → penawaran kontrak" actions={<button className="btn-primary" onClick={() => setShowAdd(true)}><UserPlus size={16} /> Tambah Kandidat</button>} />

      <div className="flex overflow-x-auto snap-x gap-4 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        {STAGES.map((stage) => {
          const items = (recruits || []).filter((r) => r.stage === stage.key);
          return (
            <div
              key={stage.key}
              className="min-w-[280px] sm:min-w-[300px] snap-start shrink-0 bg-surface border border-line rounded-xl p-3 min-h-[420px]"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData('text/plain'); if (id) move(id, stage.key); }}
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">{stage.label}</p>
                <Badge tone={stage.tone as any}>{items.length}</Badge>
              </div>
              <div className="space-y-2 stagger-grid">
                {items.map((r) => (
                  <div key={r.id} draggable onDragStart={(e) => e.dataTransfer.setData('text/plain', r.id)} className="card p-3 cursor-grab active:cursor-grabbing card-hover">
                    <div className="flex items-start justify-between mb-2">
                      <div className="w-8 h-8 rounded-lg bg-elevated border border-line flex items-center justify-center font-display font-bold text-sage text-xs">{r.ign.slice(0, 2).toUpperCase()}</div>
                      <Badge tone="amber"><Star size={10} /> {r.rating}</Badge>
                    </div>
                    <p className="font-semibold text-sm">{r.ign}</p>
                    <p className="text-xs text-muted">{r.name}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {r.role && <Badge tone="neutral">{r.role}</Badge>}
                      <Badge tone="violet">{r.source}</Badge>
                    </div>
                    <p className="text-[10px] text-muted mt-3">{timeAgo(r.updatedAt)} • {r.evaluator?.ign}</p>
                    <select className="input mt-2 text-xs py-1" value={r.stage} onChange={(e) => move(r.id, e.target.value)}>
                      {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                  </div>
                ))}
                {items.length === 0 && <p className="text-center text-[11px] text-muted/50 py-8 border border-dashed border-line rounded-lg">Tarik kartu ke sini</p>}
              </div>
            </div>
          );
        })}
      </div>

      <Card className="mt-4">
        <SectionTitle>Penilaian Trial Terstandar</SectionTitle>
        <p className="text-sm text-muted">Kandidat pada tahap <strong>Evaluasi Coach</strong> dibandingkan dengan rata-rata statistik pemain utama. Gunakan modul <a href="/matches" className="text-sage">Scrim & Match <ExternalLink size={11} className="inline" /></a> untuk mencatat statistik trial.</p>
      </Card>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Tambah Kandidat">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nama Lengkap"><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="IGN"><input className="input" value={form.ign} onChange={(e) => setForm({ ...form, ign: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Role"><input className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Duelist" /></Field>
            <Field label="Rating Awal"><input className="input num" type="number" step="0.1" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} /></Field>
          </div>
          <Field label="Sumber"><input className="input" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} /></Field>
          <Field label="Catatan"><textarea className="input" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
          <div className="flex justify-end gap-2"><button className="btn-ghost" onClick={() => setShowAdd(false)}>Batal</button><button className="btn-primary" onClick={add}>Tambah Kandidat</button></div>
        </div>
      </Modal>
    </>
  );
}
