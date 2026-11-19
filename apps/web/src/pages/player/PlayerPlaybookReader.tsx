import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, Clock, Crosshair, EyeOff, LockKeyhole,
  MapPin, ShieldCheck, Zap,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { Badge, Card, SectionTitle } from '../../components/ui';
import Watermark from '../../components/Watermark';
import TacticalMap from '../../components/player/TacticalMap';
import { cachePlaybook, getCachedPlaybook } from '../../lib/offline';
import { READ_STATUS_LABELS, READ_STATUS_TONE, SCENARIO_LABELS, mmss } from '../../lib/player';

export default function PlayerPlaybookReader() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const [detail, setDetail] = useState<any>(null);
  const [watermark, setWatermark] = useState<string[]>([]);
  const [blurred, setBlurred] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [offline, setOffline] = useState(false);
  const [loadMs, setLoadMs] = useState<number | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState('');
  const startedAt = useRef(Date.now());

  // --- Anti-exfiltration: blokir copy/print/context-menu & auto-blur --------
  useEffect(() => {
    const block = (e: Event) => e.preventDefault();
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ['c', 'p', 's', 'u', 'a'].includes(e.key.toLowerCase())) e.preventDefault();
      if (e.key === 'PrintScreen') e.preventDefault();
    };
    const onBlur = () => setBlurred(true);
    const onFocus = () => setBlurred(false);
    const onVisibility = () => setBlurred(document.hidden);
    document.addEventListener('contextmenu', block);
    document.addEventListener('copy', block);
    document.addEventListener('cut', block);
    document.addEventListener('keydown', onKey);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('contextmenu', block);
      document.removeEventListener('copy', block);
      document.removeEventListener('cut', block);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  useEffect(() => {
    if (!id) return;
    const t0 = performance.now();
    (async () => {
      try {
        const result: any = await api.post(`/player/playbooks/${id}/open`);
        setDetail(result.detail);
        setWatermark(result.watermark?.lines || []);
        setAcknowledged(result.detail?.myStatus === 'ACKNOWLEDGED');
        setLoadMs(Math.round(performance.now() - t0));
        if (result.detail?.isMatchdayReady) await cachePlaybook(result.detail);
      } catch (e: any) {
        const cached = await getCachedPlaybook(id);
        if (cached) {
          setDetail(cached);
          setOffline(true);
          setWatermark([
            `${user?.ign} - ${user?.id} - OFFLINE - ${new Date().toISOString()}`,
            'MODE OFFLINE • dokumen dari cache terenkripsi perangkat',
          ]);
          setLoadMs(Math.round(performance.now() - t0));
        } else {
          setError(e?.response?.data?.message || 'Playbook tidak dapat dibuka.');
        }
      }
    })();
  }, [id]);

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  const confirm = async () => {
    if (!id) return;
    await api.post(`/player/playbooks/${id}/acknowledge`, { seconds: elapsed });
    setAcknowledged(true);
  };

  const loadFromCache = async () => {
    if (!id) return;
    const t0 = performance.now();
    const cached = await getCachedPlaybook(id);
    if (cached) {
      setDetail(cached);
      setOffline(true);
      setLoadMs(Math.round(performance.now() - t0));
    }
  };

  if (error) return <Card><p className="text-defeat">{error}</p><button className="btn-ghost mt-4" onClick={() => navigate('/player/playbooks')}>Kembali</button></Card>;
  if (!detail) return <div className="flex items-center justify-center py-20 text-muted"><span className="w-4 h-4 border-2 border-sage/30 border-t-sage rounded-full animate-spin mr-2" />Memuat taktik...</div>;

  return (
    <div className="strategy-shield select-none">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <button className="btn-ghost" onClick={() => navigate('/player/playbooks')}><ArrowLeft size={15} /> Kembali</button>
          <div>
            <h1 className="heading text-xl">{detail.title}</h1>
            <p className="text-xs text-muted flex items-center gap-2">
              <MapPin size={11} /> {detail.mapName} • {SCENARIO_LABELS[detail.scenarioType] || detail.scenarioType} • Patch {detail.patchVersion}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="red"><LockKeyhole size={11} /> READ ONLY</Badge>
          {detail.isMatchdayReady && <Badge tone="amber"><Zap size={11} /> Matchday Ready</Badge>}
          {offline && <Badge tone="violet">OFFLINE CACHE</Badge>}
          {loadMs !== null && <Badge tone={loadMs < 200 ? 'green' : 'neutral'}><Clock size={11} /> {loadMs}ms</Badge>}
          {detail.myStatus && <Badge tone={READ_STATUS_TONE[detail.myStatus] || 'neutral'}>{READ_STATUS_LABELS[detail.myStatus]}</Badge>}
        </div>
      </div>

      <div className="asym-grid grid">
        <div className="lg:col-span-2">
          <div className="relative">
            <TacticalMap data={detail.canvasData} />
            <Watermark lines={watermark} />
            {blurred && (
              <div className="absolute inset-0 z-30 bg-canvas/90 backdrop-blur-md rounded-lg flex flex-col items-center justify-center gap-2">
                <EyeOff size={30} className="text-caution" />
                <p className="heading text-base">Layar dikunci</p>
                <p className="text-sm text-muted">Kembali ke jendela ini untuk melanjutkan membaca</p>
              </div>
            )}
          </div>
          <p className="text-[11px] text-muted mt-2 flex items-center gap-1">
            <ShieldCheck size={12} className="text-sage" /> Setiap pembukaan dicatat beserta identitas, IP, dan perangkat Anda.
          </p>
        </div>

        <div className="space-y-4">
          <Card>
            <SectionTitle>Kontrol Sesi</SectionTitle>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">Durasi membaca</span>
                <span className="num text-lg font-bold text-sage">{mmss(elapsed)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">Mode akses</span>
                <Badge tone={offline ? 'violet' : 'green'}>{offline ? 'Offline / cache' : 'Online / aman'}</Badge>
              </div>
              <div className="pt-2 border-t border-line text-[11px] text-muted space-y-1.5">
                <p className="flex items-center gap-2"><Crosshair size={11} /> Klik kanan & seleksi teks dinonaktifkan</p>
                <p className="flex items-center gap-2"><LockKeyhole size={11} /> Ctrl+C / Ctrl+P / Ctrl+S / PrintScreen diblokir</p>
                <p className="flex items-center gap-2"><EyeOff size={11} /> Auto-blur saat jendela kehilangan fokus</p>
              </div>
            </div>
          </Card>

          <Card className="border-sage/20">
            <SectionTitle>Konfirmasi</SectionTitle>
            <p className="text-xs text-muted mb-4">
              Tekan tombol di bawah setelah taktik dipahami. Status Anda akan berubah menjadi <strong className="text-crisp">Siap Dieksekusi</strong> dan tercatat di audit log.
            </p>
            <button className="btn-primary w-full" onClick={confirm} disabled={acknowledged || blurred}>
              <CheckCircle2 size={16} /> {acknowledged ? 'Sudah Dikonfirmasi' : 'Konfirmasi Sudah Membaca & Paham'}
            </button>
            {detail.isMatchdayReady && (
              <button className="btn-ghost w-full mt-2" onClick={loadFromCache}><Zap size={14} /> Muat dari Cache Offline</button>
            )}
          </Card>

          {detail.description && (
            <Card>
              <SectionTitle>Catatan Coach</SectionTitle>
              <p className="text-sm text-muted leading-relaxed">{detail.description}</p>
            </Card>
          )}
        </div>
      </div>

      <p className="text-[10px] text-muted/60 font-mono mt-4 break-all">
        WATERMARK: {user?.ign} - {user?.id} - {new Date().toLocaleString('id-ID')}
      </p>
    </div>
  );
}
