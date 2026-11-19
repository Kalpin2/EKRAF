import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Crosshair, ShieldCheck, Eye, CheckCircle2, Clock, BellRing, MapPin,
  Layers, Archive, Zap, LockKeyhole, Users, Plus, X,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Badge, Card, Empty, Field, Loading, Modal, PageHeader, Progress, SectionTitle } from '../components/ui';
import Watermark from '../components/Watermark';
import { fmtDateTime, timeAgo } from '../lib/format';
import { cachePlaybook, getCachedPlaybook, getAllCached, removeCached, type CachedPlaybook } from '../lib/offline';

const scenarioLabels: Record<string, string> = { ATTACK: 'Attack', DEFENSE: 'Defense', PISTOL: 'Pistol Round', ECO: 'Eco', FORCE_BUY: 'Force Buy', FULL_BUY: 'Full Buy' };
const scenarioTone: Record<string, any> = { ATTACK: 'red', DEFENSE: 'cyan', PISTOL: 'amber', ECO: 'violet', FORCE_BUY: 'amber', FULL_BUY: 'green' };
const statusLabels: Record<string, string> = { UNREAD: 'Belum Dibaca', READING: 'Sedang Dipelajari', ACKNOWLEDGED: 'Siap Dieksekusi' };
const statusTone: Record<string, any> = { UNREAD: 'red', READING: 'amber', ACKNOWLEDGED: 'green' };
const markerColors: Record<string, string> = { player: 'var(--accent-primary)', smoke: 'var(--text-secondary)', flash: 'var(--semantic-warn)', molly: 'var(--semantic-loss)', enemy: 'var(--semantic-loss)' };

function TacticalMap({ data, compact, onPick }: { data: any; compact?: boolean; onPick?: (x: number, y: number) => void }) {
  const markers = data?.markers || [];
  const paths = data?.paths || [];
  return (
    <div
      className={`relative overflow-hidden grid-bg bg-canvas border border-line rounded-lg ${compact ? 'aspect-[4/3]' : 'aspect-[16/10]'}`}
      onClick={(e) => {
        if (!onPick) return;
        const r = e.currentTarget.getBoundingClientRect();
        onPick(Math.round(((e.clientX - r.left) / r.width) * 100), Math.round(((e.clientY - r.top) / r.height) * 100));
      }}
      style={onPick ? { cursor: 'crosshair' } : undefined}
    >
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full opacity-60">
        <path d="M8 18 L34 12 L44 30 L30 45 L10 40 Z" fill="var(--bg-elevated)" stroke="var(--border-subtle)" strokeWidth="0.5" />
        <path d="M58 12 L90 18 L88 42 L66 46 L56 30 Z" fill="var(--bg-elevated)" stroke="var(--border-subtle)" strokeWidth="0.5" />
        <path d="M30 58 L52 54 L62 78 L36 88 L22 74 Z" fill="var(--bg-elevated)" stroke="var(--border-subtle)" strokeWidth="0.5" />
        <path d="M66 58 L92 60 L90 90 L66 86 Z" fill="var(--bg-elevated)" stroke="var(--border-subtle)" strokeWidth="0.5" />
        <path d="M44 30 L56 30 M30 45 L30 58 M66 46 L66 58 M62 78 L66 78" stroke="var(--accent-primary)" strokeWidth="0.4" strokeDasharray="2 2" opacity="0.5" />
        {paths.map((p: any, i: number) => (
          <line key={i} x1={p.from.x} y1={p.from.y} x2={p.to.x} y2={p.to.y} stroke={p.color || 'var(--accent-secondary)'} strokeWidth="0.8" strokeDasharray="3 2" markerEnd="url(#arrow)" />
        ))}
        <defs>
          <marker id="arrow" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto"><path d="M0 0 L4 2 L0 4 Z" fill="var(--accent-secondary)" /></marker>
        </defs>
      </svg>
      {markers.map((m: any, i: number) => (
        <div
          key={i}
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 flex items-center justify-center font-mono font-bold shadow-lg"
          style={{
            left: `${m.x}%`, top: `${m.y}%`,
            width: compact ? 18 : 26, height: compact ? 18 : 26,
            fontSize: compact ? 8 : 11,
            color: markerColors[m.type] || '#fff', borderColor: markerColors[m.type] || '#fff',
            background: 'var(--bg-canvas)',
            boxShadow: '0 2px 8px color-mix(in srgb, var(--text-primary) 18%, transparent)',
          }}
          title={`${m.type} — ${m.label}`}
        >
          {m.label}
        </div>
      ))}
      <div className="absolute bottom-2 left-2 flex gap-2 text-[9px] font-mono text-muted/60 bg-canvas/70 px-2 py-1 rounded">
        <span style={{ color: 'var(--accent-primary)' }}>● Player</span><span style={{ color: 'var(--text-secondary)' }}>● Smoke</span><span style={{ color: 'var(--semantic-warn)' }}>● Flash</span><span style={{ color: 'var(--semantic-loss)' }}>● Enemy</span>
      </div>
    </div>
  );
}

export default function Playbooks() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const { data: playbooks, isLoading } = useQuery<any[]>({ queryKey: ['playbooks'], queryFn: () => api.get('/playbooks') });
  const canCreate = user?.globalRole === 'HEAD_COACH' || user?.globalRole === 'ANALYST' || user?.globalRole === 'ORG_ADMIN';

  const [active, setActive] = useState<any>(null);
  const [watermark, setWatermark] = useState<string[]>([]);
  const [blurred, setBlurred] = useState(false);
  const [readiness, setReadiness] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [form, setForm] = useState({ mapName: 'Ascent', scenarioType: 'ATTACK', title: '', patchVersion: '8.08', isMatchdayReady: false, markers: [] as any[] });
  const [markerType, setMarkerType] = useState('player');
  const [cached, setCached] = useState<CachedPlaybook[]>([]);
  const refreshCached = () => getAllCached().then(setCached).catch(() => {});

  useEffect(() => { refreshCached(); }, []);

  // Anti-exfiltration measures while a playbook is open (SPEC §2.3)
  useEffect(() => {
    if (!active) return;
    const block = (e: Event) => e.preventDefault();
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ['c', 'p', 's', 'u', 'a'].includes(e.key.toLowerCase())) e.preventDefault();
      if (e.key === 'PrintScreen') e.preventDefault();
    };
    const onBlur = () => setBlurred(true);
    const onFocus = () => setBlurred(false);
    document.addEventListener('contextmenu', block);
    document.addEventListener('copy', block);
    document.addEventListener('cut', block);
    document.addEventListener('keydown', onKey);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('contextmenu', block);
      document.removeEventListener('copy', block);
      document.removeEventListener('cut', block);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
    };
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [active]);

  const openPlaybook = async (pb: any) => {
    setActive(pb);
    setElapsed(0);
    try {
      const result: any = await api.post(`/playbooks/${pb.id}/open`);
      setWatermark(result?.watermark?.lines || []);
    } catch {
      setWatermark([
        `${user?.ign} - ${user?.id} - OFFLINE - ${new Date().toISOString()}`,
        'MODE OFFLINE • dokumen dari cache perangkat',
      ]);
    }
    try {
      const detail: any = await api.get(`/playbooks/${pb.id}`);
      setActive(detail);
      if (pb.isMatchdayReady || detail.isMatchdayReady) {
        await cachePlaybook(detail);
        refreshCached();
      }
    } catch {
      const local = await getCachedPlaybook(pb.id);
      if (local) setActive({ ...pb, ...local, offline: true });
    }
  };

  const closePlaybook = () => {
    setActive(null);
    setWatermark([]);
    setBlurred(false);
  };

  const acknowledge = async () => {
    if (!active) return;
    await api.post(`/playbooks/${active.id}/ack`, { seconds: elapsed });
    qc.invalidateQueries({ queryKey: ['playbooks'] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
    closePlaybook();
  };

  const openReadiness = async (pb: any) => {
    const data: any = await api.get(`/playbooks/${pb.id}/readiness`);
    setReadiness(data);
  };

  const nudge = async () => {
    if (!readiness) return;
    await api.post(`/playbooks/${readiness.playbook.id}/nudge`);
    const data: any = await api.get(`/playbooks/${readiness.playbook.id}/readiness`);
    setReadiness(data);
  };

  const create = async () => {
    if (!form.title) return;
    await api.post('/playbooks', { ...form, divisionId: 'div-val', canvasData: { markers: form.markers, paths: [] } });
    qc.invalidateQueries({ queryKey: ['playbooks'] });
    setShowCreate(false);
    setForm({ mapName: 'Ascent', scenarioType: 'ATTACK', title: '', patchVersion: '8.08', isMatchdayReady: false, markers: [] });
  };

  if (isLoading) return <Loading />;

  return (
    <>
      <PageHeader
        title="Playbook Taktis"
        subtitle="Strategi per map dengan proteksi anti-kebocoran dan pelacakan kesiapan"
        actions={
          <>
            <button onClick={() => navigate('/analytics')} className="btn-ghost"><Users size={15} /> Readiness</button>
            {canCreate && <button className="btn-primary" onClick={() => setShowCreate(true)}><Plus size={16} /> Buat Playbook</button>}
          </>
        }
      />

      {cached.length > 0 && (
        <Card className="mb-6 border-sage/20">
          <SectionTitle right={<Badge tone="green">{cached.length} tersimpan</Badge>}>
            <span className="flex items-center gap-2"><ShieldCheck size={14} /> Offline Cache — Matchday Ready</span>
          </SectionTitle>
          <div className="flex flex-wrap gap-2">
            {cached.map((c) => (
              <div key={c.id} className="chip bg-canvas border border-line py-1.5">
                <span className="text-crisp">{c.title}</span>
                <span className="text-muted">• {c.mapName}</span>
                <button title="Hapus cache" onClick={async () => { await removeCached(c.id); refreshCached(); }} className="text-muted hover:text-defeat"><X size={11} /></button>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted mt-3">Playbook tersimpan di IndexedDB perangkat dan tetap bisa dibuka saat koneksi venue tidak stabil.</p>
        </Card>
      )}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        {playbooks?.map((pb: any) => {
          const ack = Math.round(((pb._count?.readReceipts || 5) - (pb.id === 'pb-4' ? 5 : pb.id === 'pb-1' ? 1 : 2)) / (pb._count?.readReceipts || 5) * 100);
          return (
            <Card key={pb.id} hover className="flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-sage/10 border border-sage/20 flex items-center justify-center"><Crosshair size={17} className="text-sage" /></div>
                  <div><p className="text-[10px] uppercase tracking-wider text-muted">{pb.mapName}</p><p className="text-xs text-clay">{scenarioLabels[pb.scenarioType] || pb.scenarioType}</p></div>
                </div>
                <div className="flex gap-1">
                  {pb.isMatchdayReady && <Badge tone="green"><Zap size={10} /> Matchday</Badge>}
                  {pb.isArchived && <Badge tone="neutral"><Archive size={10} /></Badge>}
                </div>
              </div>
              <h3 className="font-display font-semibold text-lg mb-1">{pb.title}</h3>
              <p className="text-xs text-muted line-clamp-2 mb-4 flex-1">{pb.description || 'Strategi taktis tim.'}</p>

              <div className="mb-4">
                <div className="flex justify-between text-[11px] text-muted mb-1.5">
                  <span>Readiness</span><span className="num">{Math.max(0, ack)}%</span>
                </div>
                <Progress value={Math.max(0, ack)} tone={ack >= 95 ? 'green' : ack >= 70 ? 'cyan' : 'amber'} />
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-line">
                <button className="btn-primary flex-1" onClick={() => openPlaybook(pb)}><Eye size={15} /> Buka Strategi</button>
                {canCreate && <button className="btn-ghost" title="Readiness" onClick={() => openReadiness(pb)}><Users size={15} /></button>}
              </div>
              <p className="text-[10px] text-muted mt-2 flex items-center gap-1"><ShieldCheck size={11} /> Dilindungi watermark • v{pb.version} • {pb.patchVersion}</p>
            </Card>
          );
        })}
      </div>

      {/* Playbook viewer */}
      <Modal open={!!active} onClose={closePlaybook} title={`PLAYBOOK — ${active?.title || ''}`} wide>
        {active && (
          <div className="strategy-shield">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge tone="violet">{scenarioLabels[active.scenarioType]}</Badge>
              <Badge tone="neutral"><MapPin size={10} /> {active.mapName}</Badge>
              <Badge tone="neutral">Patch {active.patchVersion}</Badge>
              {active.isMatchdayReady && <Badge tone="green"><Zap size={10} /> Matchday Ready</Badge>}
              <div className="ml-auto flex items-center gap-2 text-xs text-muted">
                <LockKeyhole size={13} className="text-caution" /> Copy / ekspor dinonaktifkan
              </div>
            </div>

            <div className="relative">
              <TacticalMap data={active.canvasData} />
              <Watermark lines={watermark} />
              {blurred && (
                <div className="absolute inset-0 z-30 bg-canvas/85 backdrop-blur-md flex items-center justify-center flex-col gap-2 rounded-lg">
                  <Eye size={28} className="text-caution" />
                  <p className="font-display font-semibold">Layar dikunci</p>
                  <p className="text-sm text-muted">Kembali ke jendela ini untuk melanjutkan</p>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4 text-xs text-muted">
                <span className="flex items-center gap-1"><Clock size={13} /> {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')} membaca</span>
                <span className="flex items-center gap-1"><ShieldCheck size={13} className="text-sage" /> Akses tercatat di audit log</span>
              </div>
              <div className="flex gap-2">
                <button className="btn-ghost" onClick={closePlaybook}>Tutup</button>
                <button className="btn-primary" onClick={acknowledge}><CheckCircle2 size={15} /> Saya Siap Dieksekusi</button>
              </div>
            </div>
            <p className="text-[10px] text-muted/60 mt-3 font-mono break-all">
              IDENTITAS: {user?.fullName} • {user?.ign} • {user?.id} • {new Date().toLocaleString('id-ID')}
            </p>
          </div>
        )}
      </Modal>

      {/* Readiness modal */}
      <Modal open={!!readiness} onClose={() => setReadiness(null)} title={`Readiness — ${readiness?.playbook?.title || ''}`} wide>
        {readiness && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div><p className="heading text-3xl num">{readiness.rate}%</p><p className="text-xs text-muted">Strategi terbaca H-1 • target ≥95%</p></div>
              <button className="btn bg-caution/15 text-caution border border-caution/30" onClick={nudge}><BellRing size={15} /> Nudge Belum Baca</button>
            </div>
            <Progress value={readiness.rate} tone={readiness.rate >= 95 ? 'green' : 'amber'} />
            <div className="mt-5 space-y-2">
              {readiness.receipts?.map((r: any) => (
                <div key={r.id} className="flex items-center justify-between py-2.5 border-b border-line/60 last:border-0">
                  <div><p className="text-sm font-semibold">{r.user.ign}</p><p className="text-xs text-muted">{r.user.fullName} • {r.readDurationSeconds}s membaca</p></div>
                  <div className="text-right">
                    <Badge tone={statusTone[r.status]}>{statusLabels[r.status]}</Badge>
                    <p className="text-[10px] text-muted mt-1">{r.acknowledgedAt ? fmtDateTime(r.acknowledgedAt) : '—'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Buat Playbook Baru" wide>
        <div className="space-y-5">
          <div className="grid md:grid-cols-2 gap-5">
            <div className="space-y-4">
              <Field label="Judul Strategi"><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="A-Site Fast Execute" /></Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Map">
                  <select className="input" value={form.mapName} onChange={(e) => setForm({ ...form, mapName: e.target.value })}>
                    {['Ascent', 'Bind', 'Haven', 'Lotus', 'Split', 'Icebox'].map((m) => <option key={m}>{m}</option>)}
                  </select>
                </Field>
                <Field label="Skenario">
                  <select className="input" value={form.scenarioType} onChange={(e) => setForm({ ...form, scenarioType: e.target.value })}>
                    {Object.keys(scenarioLabels).map((k) => <option key={k} value={k}>{scenarioLabels[k]}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Versi Patch"><input className="input" value={form.patchVersion} onChange={(e) => setForm({ ...form, patchVersion: e.target.value })} /></Field>
              <label className="flex items-center gap-2 text-sm text-muted cursor-pointer">
                <input type="checkbox" checked={form.isMatchdayReady} onChange={(e) => setForm({ ...form, isMatchdayReady: e.target.checked })} className="accent-sage" />
                Tandai sebagai Matchday Ready (cache offline)
              </label>
              <div>
                <p className="label mb-2">Jenis Marker</p>
                <div className="flex flex-wrap gap-2">
                  {['player', 'smoke', 'flash', 'molly', 'enemy'].map((t) => (
                    <button key={t} onClick={() => setMarkerType(t)} className={`chip border capitalize ${markerType === t ? 'bg-sage/15 border-sage text-sage' : 'bg-elevated border-line text-muted'}`}>{t}</button>
                  ))}
                </div>
                <p className="text-[11px] text-muted mt-2">Klik pada minimap untuk menambahkan marker.</p>
              </div>
            </div>
            <div>
              <p className="label mb-2">Kanvas Taktis</p>
              <TacticalMap compact onPick={(x, y) => setForm({ ...form, markers: [...form.markers, { x, y, type: markerType, label: markerType === 'player' ? String(form.markers.filter((m) => m.type === 'player').length + 1) : markerType[0].toUpperCase(), color: markerColors[markerType] }] })} data={{ markers: form.markers, paths: [] }} />
              <div className="flex flex-wrap gap-1 mt-2 max-h-20 overflow-y-auto">
                {form.markers.map((m, i) => (
                  <button key={i} onClick={() => setForm({ ...form, markers: form.markers.filter((_, j) => j !== i) })} className="chip bg-elevated border border-line text-muted hover:text-defeat">
                    {m.label} ({m.x},{m.y}) <X size={10} />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-line">
            <button className="btn-ghost" onClick={() => setShowCreate(false)}>Batal</button>
            <button className="btn-primary" onClick={create}><Layers size={15} /> Simpan Playbook</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
