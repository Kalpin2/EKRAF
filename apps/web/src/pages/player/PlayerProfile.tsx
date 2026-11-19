import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, FileLock2, Plus, ShieldCheck, Smartphone, Trash2, UserRound } from 'lucide-react';
import { api } from '../../lib/api';
import { Avatar, Badge, Card, Empty, Field, Loading, PageHeader, SectionTitle } from '../../components/ui';
import { fmtDate, roleLabel } from '../../lib/format';

const rosterTone: Record<string, any> = { STARTING: 'green', SUBSTITUTE: 'cyan', BENCH: 'amber', TRIAL: 'violet', INACTIVE: 'neutral' };
const contractTone: Record<string, any> = { ACTIVE: 'green', TRIAL: 'violet', LOAN: 'cyan', BENCH: 'amber', EXPIRED: 'red' };

export default function PlayerProfile() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<any>({ queryKey: ['player-profile'], queryFn: () => api.get('/player/profile') });
  const [draft, setDraft] = useState<any>(null);
  const [newAgent, setNewAgent] = useState('');
  const [newDevice, setNewDevice] = useState('');
  const [saved, setSaved] = useState(false);

  if (isLoading) return <Loading />;
  if (!data) return <div className="card p-6 text-defeat">Gagal memuat profil.</div>;

  const form = draft || {
    ign: data.ign,
    jerseySize: data.jerseySize || '',
    travelPref: data.travelPref || '',
    agentPool: [...(data.agentPool || [])],
  };

  const save = async () => {
    await api.patch('/player/profile', form);
    qc.invalidateQueries({ queryKey: ['player-profile'] });
    setDraft(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const revoke = async (id: string) => {
    await api.delete(`/player/devices/${id}`);
    qc.invalidateQueries({ queryKey: ['player-profile'] });
  };

  const register = async () => {
    if (!newDevice.trim()) return;
    await api.post('/player/devices', { label: newDevice, fingerprint: `DEVICE-${Date.now().toString(36).toUpperCase()}` });
    setNewDevice('');
    qc.invalidateQueries({ queryKey: ['player-profile'] });
  };

  return (
    <>
      <PageHeader title="Profil Pemain" subtitle="Data pribadi, status roster & kontrak (read-only), dan perangkat terdaftar" />

      <div className="asym-grid grid">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-xl bg-elevated border border-line flex items-center justify-center">
                <UserRound size={28} className="text-sage" />
              </div>
              <div>
                <h2 className="heading text-xl">{data.user.fullName}</h2>
                <p className="text-sm text-muted">{data.user.email} • {data.user.country}</p>
                <div className="flex gap-2 mt-2">
                  <Badge tone={rosterTone[data.rosterStatus] || 'neutral'}>{data.rosterStatus.replace('_', ' ')}</Badge>
                  <Badge tone="cyan">{data.primaryRole || 'Player'}</Badge>
                  <Badge tone="neutral">{roleLabel(data.divisionRole)}</Badge>
                </div>
              </div>
            </div>

            <SectionTitle right={<Badge tone="violet">Dapat diubah sendiri</Badge>}>Biodata Non-Sensitif</SectionTitle>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="In-Game Name (IGN)"><input className="input" value={form.ign} onChange={(e) => setDraft({ ...form, ign: e.target.value })} /></Field>
              <Field label="Ukuran Jersey"><input className="input" value={form.jerseySize} onChange={(e) => setDraft({ ...form, jerseySize: e.target.value })} placeholder="L" /></Field>
              <Field label="Preferensi Perjalanan"><input className="input" value={form.travelPref} onChange={(e) => setDraft({ ...form, travelPref: e.target.value })} placeholder="Aisle seat" /></Field>
              <Field label="Divisi"><input className="input" value={data.division.gameTitle} readOnly disabled /></Field>
            </div>

            <div className="mt-4">
              <p className="label mb-2">Agent / Hero Pool</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {form.agentPool.map((a: string) => (
                  <button key={a} onClick={() => setDraft({ ...form, agentPool: form.agentPool.filter((x: string) => x !== a) })}
                    className="chip bg-sage/10 border border-sage/25 text-sage hover:bg-defeat/10 hover:border-defeat/30 hover:text-defeat">
                    {a} ×
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input className="input max-w-xs" value={newAgent} onChange={(e) => setNewAgent(e.target.value)} placeholder="Tambah agent..." />
                <button className="btn-ghost" onClick={() => {
                  if (!newAgent.trim()) return;
                  setDraft({ ...form, agentPool: [...form.agentPool, newAgent.trim()] });
                  setNewAgent('');
                }}><Plus size={14} /></button>
              </div>
            </div>

            <div className="flex justify-end mt-5">
              <button className="btn-primary" onClick={save}>{saved ? 'Tersimpan ✓' : 'Simpan Perubahan'}</button>
            </div>
          </Card>

          <Card>
            <SectionTitle right={<Badge tone="neutral"><FileLock2 size={10} /> Read-only</Badge>}>Status Kontrak & Roster</SectionTitle>
            {!data.contract ? <Empty title="Tidak ada data kontrak" /> : (
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  ['Status Kontrak', <Badge key="s" tone={contractTone[data.contract.status]}>{data.contract.status}</Badge>],
                  ['Mulai', fmtDate(data.contract.startDate)],
                  ['Berakhir', fmtDate(data.contract.endDate)],
                  ['Sisa Masa', <Badge key="d" tone={data.contract.daysLeft <= 30 ? 'red' : 'green'}>{data.contract.daysLeft >= 0 ? `H-${data.contract.daysLeft}` : 'Expired'}</Badge>],
                  ['Club Option', data.contract.clubOption ? 'Ya' : 'Tidak'],
                  ['Roster Status', <Badge key="r" tone={rosterTone[data.rosterStatus]}>{data.rosterStatus.replace('_', ' ')}</Badge>],
                ].map(([label, value]: any) => (
                  <div key={label} className="rounded-lg border border-line bg-canvas/40 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted mb-1">{label}</p>
                    <div className="text-sm font-semibold">{value}</div>
                  </div>
                ))}
              </div>
            )}
            <p className="text-[11px] text-caution mt-4 flex items-center gap-1">
              <FileLock2 size={12} /> Nominal gaji, buyout, dan detail finansial tidak tersedia untuk role Player.
            </p>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <SectionTitle right={<Badge tone="green"><ShieldCheck size={10} /> Device Binding</Badge>}>Perangkat Terdaftar</SectionTitle>
            {!data.devices?.length ? <Empty title="Belum ada perangkat" /> : (
              <div className="space-y-2 stagger-grid">
                {data.devices.map((d: any) => (
                  <div key={d.id} className={`rounded-lg border p-3 ${d.revokedAt ? 'border-defeat/30 bg-defeat/5' : 'border-line bg-canvas/40'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Smartphone size={15} className={d.revokedAt ? 'text-defeat' : 'text-sage'} />
                        <div className="min-w-0">
                          <p className={`text-sm font-medium truncate ${d.revokedAt ? 'line-through text-muted' : ''}`}>{d.label}</p>
                          <p className="text-[10px] font-mono text-muted truncate">{d.fingerprint}</p>
                        </div>
                      </div>
                      {!d.revokedAt && (
                        <button onClick={() => revoke(d.id)} title="Cabut akses" className="text-muted hover:text-defeat shrink-0"><Trash2 size={14} /></button>
                      )}
                    </div>
                    <p className="text-[10px] text-muted mt-2 flex items-center gap-1"><CalendarClock size={10} /> Terakhir aktif {fmtDate(d.lastSeenAt, 'dd MMM yyyy • HH:mm')}</p>
                    {d.revokedAt && <Badge tone="red" className="mt-1">Dicabut</Badge>}
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-line">
              <p className="label mb-2">Daftarkan Perangkat</p>
              <div className="flex gap-2">
                <input className="input" value={newDevice} onChange={(e) => setNewDevice(e.target.value)} placeholder="Nama perangkat" />
                <button className="btn-primary shrink-0" onClick={register}><Plus size={14} /></button>
              </div>
              <p className="text-[10px] text-muted mt-2">Akses playbook hanya dari perangkat yang terdaftar.</p>
            </div>
          </Card>

          <Card>
            <SectionTitle>Informasi Akun</SectionTitle>
            <div className="space-y-2 text-xs">
              {[
    ['User ID', data.userId], ['Organisasi', data.orgId], ['Divisi', data.divisionId],
    ['Game Account', data.gameAccountId || '—'], ['Bergabung', fmtDate(data.user.createdAt)],
  ].map(([k, v]: any) => (
                <div key={k} className="flex justify-between gap-3 py-1.5 border-b border-line/50 last:border-0">
                  <span className="text-muted">{k}</span><span className="font-mono text-right truncate max-w-[160px]">{v}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
