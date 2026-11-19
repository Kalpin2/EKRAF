import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Users, UserPlus, Mail, Shield } from 'lucide-react';
import { api } from '../lib/api';
import { Avatar, Badge, Card, Empty, Loading, Modal, PageHeader, SectionTitle, Field } from '../components/ui';
import { roleColor, roleLabel } from '../lib/format';

const rosterTone: Record<string, any> = { STARTING: 'green', SUBSTITUTE: 'cyan', BENCH: 'amber', TRIAL: 'violet', INACTIVE: 'neutral' };

export default function Roster() {
  const [search, setSearch] = useState('');
  const [division, setDivision] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ fullName: '', ign: '', email: '', globalRole: 'PLAYER', rosterStatus: 'BENCH', primaryRole: '' });

  const { data: members, isLoading } = useQuery<any[]>({ queryKey: ['members'], queryFn: () => api.get('/core/members') });
  const { data: divisions } = useQuery<any[]>({ queryKey: ['divisions'], queryFn: () => api.get('/core/divisions') });
  const { data: users } = useQuery<any[]>({ queryKey: ['users'], queryFn: () => api.get('/core/users') });

  const filtered = useMemo(() => (members || []).filter((m: any) => {
    const q = search.toLowerCase();
    const matchQ = !q || m.user.ign.toLowerCase().includes(q) || m.user.fullName.toLowerCase().includes(q) || m.primaryRole?.toLowerCase().includes(q);
    const matchD = !division || m.divisionId === division;
    return matchQ && matchD;
  }), [members, search, division]);

  const counts = useMemo(() => ({
    starting: (members || []).filter((m: any) => m.rosterStatus === 'STARTING').length,
    sub: (members || []).filter((m: any) => m.rosterStatus === 'SUBSTITUTE').length,
    bench: (members || []).filter((m: any) => m.rosterStatus === 'BENCH').length,
    trial: (members || []).filter((m: any) => m.rosterStatus === 'TRIAL').length,
  }), [members]);

  const createUser = async () => {
    if (!form.email || !form.fullName) return;
    const result: any = await api.post('/core/users', { ...form, password: 'nexus123' });
    const div = division || divisions?.[0]?.id;
    if (div && result?.id) await api.post('/core/members', { userId: result.id, divisionId: div, divisionRole: form.globalRole === 'PLAYER' ? 'PLAYER' : 'MANAGER', rosterStatus: form.rosterStatus, primaryRole: form.primaryRole });
    setShowAdd(false);
  };

  if (isLoading) return <Loading />;

  return (
    <>
      <PageHeader
        title="Roster Pemain"
        subtitle="Kelola anggota, posisi, dan status lineup setiap divisi"
        actions={<button className="btn-primary" onClick={() => setShowAdd(true)}><UserPlus size={16} /> Tambah Anggota</button>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[
          ['Starting', counts.starting, 'green'], ['Substitute', counts.sub, 'cyan'],
          ['Bench', counts.bench, 'amber'], ['Trial', counts.trial, 'violet'],
        ].map(([label, value, tone]: any) => (
          <Card key={label} className="flex items-center justify-between">
            <div><p className="text-[11px] uppercase tracking-wider text-muted">{label}</p><p className="num heading text-2xl mt-1">{value}</p></div>
            <Badge tone={tone}>●</Badge>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input className="input pl-9" placeholder="Cari IGN, nama, atau role..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="input w-auto min-w-[180px]" value={division} onChange={(e) => setDivision(e.target.value)}>
            <option value="">Semua divisi</option>
            {divisions?.map((d) => <option key={d.id} value={d.id}>{d.gameTitle}</option>)}
          </select>
        </div>

        {filtered.length === 0 ? <Empty title="Tidak ada anggota" description="Coba ubah filter pencarian." /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted border-b border-line">
                  <th className="py-3 font-medium">Pemain</th><th className="py-3 font-medium">Divisi</th>
                  <th className="py-3 font-medium">Role</th><th className="py-3 font-medium">Agent Pool</th>
                  <th className="py-3 font-medium">Status Roster</th><th className="py-3 font-medium">Akses</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m: any) => (
                  <tr key={m.id} className="border-b border-line/50 last:border-0 hover:bg-elevated/40 transition-colors">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={m.user.fullName} />
                        <div><p className="font-semibold">{m.user.ign}</p><p className="text-xs text-muted">{m.user.fullName}</p></div>
                      </div>
                    </td>
                    <td className="py-3"><Badge tone="neutral">{m.division.gameTitle}</Badge></td>
                    <td className="py-3 text-muted">{m.primaryRole || '—'}</td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-1 max-w-[180px]">
                        {(m.agentPool || []).map((a: string) => <span key={a} className="chip bg-elevated border border-line text-muted">{a}</span>)}
                        {!(m.agentPool || []).length && <span className="text-muted">—</span>}
                      </div>
                    </td>
                    <td className="py-3"><Badge tone={rosterTone[m.rosterStatus] || 'neutral'}>{m.rosterStatus.replace('_', ' ')}</Badge></td>
                    <td className="py-3"><Badge tone="neutral" className={roleColor(m.user.globalRole)}><Shield size={10} /> {roleLabel(m.user.globalRole)}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Tambah Anggota Baru">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nama Lengkap"><input className="input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></Field>
            <Field label="IGN"><input className="input" value={form.ign} onChange={(e) => setForm({ ...form, ign: e.target.value })} /></Field>
          </div>
          <Field label="Email"><input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Role Sistem">
              <select className="input" value={form.globalRole} onChange={(e) => setForm({ ...form, globalRole: e.target.value })}>
                {['PLAYER', 'HEAD_COACH', 'ANALYST', 'TEAM_MANAGER', 'FINANCE'].map((r) => <option key={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="Status Roster">
              <select className="input" value={form.rosterStatus} onChange={(e) => setForm({ ...form, rosterStatus: e.target.value })}>
                {['STARTING', 'SUBSTITUTE', 'BENCH', 'TRIAL'].map((r) => <option key={r}>{r}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Posisi Utama"><input className="input" value={form.primaryRole} onChange={(e) => setForm({ ...form, primaryRole: e.target.value })} placeholder="Duelist, Controller, ..." /></Field>
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn-ghost" onClick={() => setShowAdd(false)}>Batal</button>
            <button className="btn-primary" onClick={createUser}>Simpan Anggota</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
