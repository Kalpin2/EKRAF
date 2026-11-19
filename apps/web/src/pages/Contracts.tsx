import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FileLock2, CalendarClock, Calculator, ShieldAlert, Upload, Download, LockKeyhole } from 'lucide-react';
import { api } from '../lib/api';
import { Badge, Card, Empty, Field, Loading, Modal, PageHeader, Progress, SectionTitle, StatCard } from '../components/ui';
import { fmtDate, fmtMoney } from '../lib/format';
import { downloadCsv, downloadPdf } from '../lib/export';

const statusTone: Record<string, any> = { ACTIVE: 'green', TRIAL: 'violet', LOAN: 'cyan', BENCH: 'amber', EXPIRED: 'red' };

export default function Contracts() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('contracts');
  const [prize, setPrize] = useState({ total: '250000000', taxPercent: '10', players: '70', staff: '15', org: '15', playerCount: '5' });
  const [prizeResult, setPrizeResult] = useState<any>(null);
  const [docs, setDocs] = useState<any[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [upload, setUpload] = useState({ userId: '', docType: 'KTP', fileName: '', content: '' });

  const { data: contracts, isLoading } = useQuery<any[]>({ queryKey: ['contracts'], queryFn: () => api.get('/contracts') });
  const { data: alerts } = useQuery<any[]>({ queryKey: ['contract-alerts'], queryFn: () => api.get('/contracts/alerts') });

  const expiring = useMemo(() => (contracts || []).filter((c) => c.daysLeft >= 0 && c.daysLeft <= 90), [contracts]);

  const calculate = async () => {
    const result: any = await api.post('/finance/prize-pool', prize);
    setPrizeResult(result);
  };

  const loadDocs = async () => {
    const data: any = await api.get('/legal-documents');
    setDocs(data || []);
  };
  useEffect(() => { if (tab === 'vault') loadDocs(); }, [tab]);

  if (isLoading) return <Loading />;

  return (
    <>
      <PageHeader title="Kontrak & Finance" subtitle="Siklus kontrak, brankas dokumen legal, dan kalkulator prize pool" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard label="Kontrak Aktif" value={(contracts || []).filter((c) => c.status === 'ACTIVE').length} icon={FileLock2} tone="green" />
        <StatCard label="Akan Berakhir ≤90 Hari" value={expiring.length} icon={CalendarClock} tone="amber" />
        <StatCard label="Masa Trial" value={(contracts || []).filter((c) => c.status === 'TRIAL').length} icon={ShieldAlert} tone="violet" />
        <StatCard label="Dokumen Terenkripsi" value={docs.length || '—'} icon={LockKeyhole} tone="cyan" />
      </div>

      <div className="flex gap-2 mb-5 border-b border-line">
        {[['contracts', 'Kontrak'], ['vault', 'Brankas Legal'], ['prizepool', 'Prize Pool']].map(([k, v]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px ${tab === k ? 'border-sage text-sage' : 'border-transparent text-muted hover:text-crisp'}`}>{v}</button>
        ))}
      </div>

      {tab === 'contracts' && (
        <div className="space-y-6">
          {alerts && alerts.length > 0 && (
            <Card className="border-caution/30">
              <SectionTitle><span className="text-caution flex items-center gap-2"><ShieldAlert size={15} /> Pengingat Otomatis (H-90/60/30/14)</span></SectionTitle>
              <div className="grid md:grid-cols-2 gap-3">
                {alerts.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between bg-caution/5 border border-caution/20 rounded-lg px-3 py-2">
                    <div><p className="text-sm font-semibold">{a.user?.ign}</p><p className="text-xs text-muted">Berakhir {fmtDate(a.endDate)}</p></div>
                    <Badge tone={a.daysLeft <= 30 ? 'red' : 'amber'}>H-{a.daysLeft}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-[11px] uppercase tracking-wider text-muted border-b border-line">
                  <th className="py-3">Pemain</th><th className="py-3">Status</th><th className="py-3">Mulai</th><th className="py-3">Berakhir</th>
                  <th className="py-3">Gaji Pokok</th><th className="py-3">Buyout</th><th className="py-3">Prize %</th><th className="py-3">Sisa</th>
                </tr></thead>
                <tbody>
                  {contracts?.map((c) => (
                    <tr key={c.id} className="border-b border-line/50 last:border-0">
                      <td className="py-3 font-semibold">{c.user?.ign}</td>
                      <td className="py-3"><Badge tone={statusTone[c.status]}>{c.status}</Badge></td>
                      <td className="py-3 text-muted">{fmtDate(c.startDate)}</td>
                      <td className="py-3 text-muted">{fmtDate(c.endDate)}</td>
                      <td className="py-3 num">{c.baseSalary ? fmtMoney(c.baseSalary) : <span className="text-muted">🔒 Terenkripsi</span>}</td>
                      <td className="py-3 num">{c.buyoutClause ? fmtMoney(c.buyoutClause) : '—'}</td>
                      <td className="py-3 num text-sage">{c.prizePoolPercentage}%</td>
                      <td className="py-3"><Badge tone={c.daysLeft < 0 ? 'red' : c.daysLeft <= 30 ? 'amber' : 'green'}>{c.daysLeft < 0 ? 'Expired' : `H-${c.daysLeft}`}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {tab === 'vault' && (
        <Card>
          <SectionTitle right={<button className="btn-primary" onClick={() => setShowUpload(true)}><Upload size={15} /> Unggah Dokumen</button>}>
            Brankas Dokumen Legal — AES-256-GCM
          </SectionTitle>
          <p className="text-xs text-muted mb-4">Seluruh dokumen dienkripsi sebelum disimpan. Setiap pembukaan/unduhan dicatat permanen di audit log.</p>
          {docs.length === 0 ? <Empty title="Belum ada dokumen" description="Unggah KTP, Paspor, Visa, NPWP, atau kontrak pemain." /> : (
            <div className="space-y-2">
              {docs.map((d) => (
                <div key={d.id} className="flex items-center justify-between py-3 border-b border-line/60 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-clay/10 border border-clay/20 flex items-center justify-center"><FileLock2 size={16} className="text-clay" /></div>
                    <div><p className="text-sm font-semibold">{d.fileName}</p><p className="text-xs text-muted">{d.docType} • {d.user?.ign} • {fmtDate(d.createdAt)}</p></div>
                  </div>
                  <button className="btn-ghost" onClick={async () => { await api.get(`/legal-documents/${d.id}`); qc.invalidateQueries({ queryKey: ['audit'] }); }}><Download size={14} /> Buka</button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === 'prizepool' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <SectionTitle><span className="flex items-center gap-2"><Calculator size={15} /> Simulasi Pembagian</span></SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Total Prize Pool (Rp)"><input className="input num" value={prize.total} onChange={(e) => setPrize({ ...prize, total: e.target.value })} /></Field>
              <Field label="Pajak (%)"><input className="input num" type="number" value={prize.taxPercent} onChange={(e) => setPrize({ ...prize, taxPercent: e.target.value })} /></Field>
              <Field label="Pemain (%)"><input className="input num" type="number" value={prize.players} onChange={(e) => setPrize({ ...prize, players: e.target.value })} /></Field>
              <Field label="Staf (%)"><input className="input num" type="number" value={prize.staff} onChange={(e) => setPrize({ ...prize, staff: e.target.value })} /></Field>
              <Field label="Organisasi (%)"><input className="input num" type="number" value={prize.org} onChange={(e) => setPrize({ ...prize, org: e.target.value })} /></Field>
              <Field label="Jumlah Pemain"><input className="input num" type="number" value={prize.playerCount} onChange={(e) => setPrize({ ...prize, playerCount: e.target.value })} /></Field>
            </div>
            <button className="btn-primary w-full mt-5" onClick={calculate}>Hitung Pembagian</button>
          </Card>
          <Card>
            <SectionTitle right={prizeResult && (
              <div className="flex gap-2">
                <button className="btn-ghost text-xs" onClick={() => downloadCsv('nexus-prize-pool', [
                  { Komponen: 'Gross', Nominal: prizeResult.gross }, { Komponen: 'Pajak', Nominal: prizeResult.tax },
                  { Komponen: 'Bersih', Nominal: prizeResult.net }, { Komponen: 'Pemain', Nominal: prizeResult.playerPool },
                  { Komponen: 'Staf', Nominal: prizeResult.staffPool }, { Komponen: 'Organisasi', Nominal: prizeResult.orgPool },
                  { Komponen: 'Per Pemain', Nominal: prizeResult.perPlayer },
                ])}>CSV</button>
                <button className="btn-ghost text-xs" onClick={() => downloadPdf('nexus-prize-pool.pdf', 'Laporan Prize Pool', 'NexusEsports OS • Simulasi pembagian', [
                  { Komponen: 'Gross', Nominal: fmtMoney(prizeResult.gross) }, { Komponen: 'Pajak', Nominal: fmtMoney(prizeResult.tax) },
                  { Komponen: 'Bersih', Nominal: fmtMoney(prizeResult.net) }, { Komponen: 'Per Pemain', Nominal: fmtMoney(prizeResult.perPlayer) },
                ])}>PDF</button>
              </div>
            )}>Hasil Kalkulasi</SectionTitle>
            {!prizeResult ? <Empty title="Belum ada hasil" description="Isi parameter dan klik Hitung Pembagian." /> : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    ['Gross', prizeResult.gross, 'cyan'], ['Pajak', prizeResult.tax, 'red'],
                    ['Bersih', prizeResult.net, 'green'], ['Per Pemain', prizeResult.perPlayer, 'violet'],
                  ].map(([l, v, t]: any) => (
                    <div key={l} className="bg-canvas/50 rounded-lg p-3 border border-line">
                      <p className="text-[10px] uppercase tracking-wider text-muted">{l}</p>
                      <p className="num text-lg font-semibold mt-1 text-crisp">{fmtMoney(v)}</p>
                    </div>
                  ))}
                </div>
                {[
                  ['Pemain', prizeResult.playerPool, 70], ['Staf / Coach', prizeResult.staffPool, 15], ['Organisasi', prizeResult.orgPool, 15],
                ].map(([l, v, p]: any) => (
                  <div key={l}>
                    <div className="flex justify-between text-sm mb-1.5"><span className="text-muted">{l}</span><span className="num">{fmtMoney(v)}</span></div>
                    <Progress value={p} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      <Modal open={showUpload} onClose={() => setShowUpload(false)} title="Unggah Dokumen Legal">
        <div className="space-y-4">
          <Field label="Pemain">
            <select className="input" value={upload.userId} onChange={(e) => setUpload({ ...upload, userId: e.target.value })}>
              <option value="">Pilih pemain...</option>
              {contracts?.map((c) => <option key={c.userId} value={c.userId}>{c.user?.ign}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Jenis Dokumen">
              <select className="input" value={upload.docType} onChange={(e) => setUpload({ ...upload, docType: e.target.value })}>
                {['KTP', 'Paspor', 'Visa', 'NPWP', 'Kontrak'].map((d) => <option key={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Nama File"><input className="input" value={upload.fileName} onChange={(e) => setUpload({ ...upload, fileName: e.target.value })} placeholder="ktp-aditya.pdf" /></Field>
          </div>
          <Field label="Konten (base64 / teks)" hint="Demo: masukkan teks Dummy isi dokumen"><textarea className="input" rows={3} value={upload.content} onChange={(e) => setUpload({ ...upload, content: e.target.value })} /></Field>
          <div className="flex justify-end gap-2">
            <button className="btn-ghost" onClick={() => setShowUpload(false)}>Batal</button>
            <button className="btn-primary" onClick={async () => { await api.post('/legal-documents', upload); await loadDocs(); setShowUpload(false); }}>Enkripsi & Simpan</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
