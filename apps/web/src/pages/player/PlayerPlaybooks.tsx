import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Clock, Crosshair, Eye, Filter, ShieldCheck, Zap } from 'lucide-react';
import { api } from '../../lib/api';
import { Badge, Card, Empty, Loading, PageHeader, StatCard } from '../../components/ui';
import { READ_STATUS_LABELS, READ_STATUS_TONE, SCENARIO_LABELS, SCENARIO_TONE } from '../../lib/player';
import { cachePlaybook, getAllCached, type CachedPlaybook } from '../../lib/offline';
import { fmtDate } from '../../lib/format';

const SCENARIOS = ['ALL', 'ATTACK', 'DEFENSE', 'PISTOL', 'ECO', 'FULL_BUY'];

export default function PlayerPlaybooks() {
  const [map, setMap] = useState('ALL');
  const [scenario, setScenario] = useState('ALL');
  const [matchdayOnly, setMatchdayOnly] = useState(false);
  const [cached, setCached] = useState<CachedPlaybook[]>([]);
  const [loadMs, setLoadMs] = useState<number | null>(null);

  const { data, isLoading } = useQuery<any[]>({
    queryKey: ['player-playbooks', map, scenario],
    queryFn: async () => {
      const t0 = performance.now();
      const result = await api.get('/player/playbooks', {
        map: map === 'ALL' ? undefined : map,
        scenario: scenario === 'ALL' ? undefined : scenario,
      });
      setLoadMs(Math.round(performance.now() - t0));
      return result;
    },
  });

  useEffect(() => { getAllCached().then(setCached).catch(() => {}); }, [data]);

  const maps = useMemo(() => ['ALL', ...new Set((data || []).map((p: any) => p.mapName))], [data]);
  const rows = (data || []).filter((p: any) => !matchdayOnly || p.isMatchdayReady);

  const ackCount = (data || []).filter((p: any) => p.myStatus === 'ACKNOWLEDGED').length;

  return (
    <>
      <PageHeader
        title="Playbook Taktis"
        subtitle="Strategi divisi Anda • dilindungi watermark & audit akses"
        actions={
          <button
            onClick={() => setMatchdayOnly(!matchdayOnly)}
            className={`btn ${matchdayOnly ? 'bg-caution/15 text-caution border border-caution/30' : 'btn-ghost'}`}
          >
            <Zap size={15} /> Mode Matchday {matchdayOnly ? 'Aktif' : ''}
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard label="Total Playbook" value={data?.length || 0} icon={Crosshair} tone="cyan" />
        <StatCard label="Siap Dieksekusi" value={ackCount} icon={CheckCircle2} tone="green" />
        <StatCard label="Belum Dibaca" value={(data || []).filter((p: any) => p.myStatus === 'UNREAD').length} icon={AlertTriangle} tone="red" />
        <StatCard label="Matchday Ready" value={(data || []).filter((p: any) => p.isMatchdayReady).length} icon={Zap} tone="amber" />
      </div>

      {matchdayOnly && (
        <Card className="mb-6 border-caution/30 grid-bg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck size={15} className="text-caution" />
              <span className="heading text-sm">Cache Offline Terenkripsi</span>
            </div>
            <Badge tone="green">{cached.length} tersimpan • {loadMs !== null ? `${loadMs}ms` : '—'}</Badge>
          </div>
          <p className="text-xs text-muted mb-3">Taktik Matchday Ready dimuat dari IndexedDB perangkat — tetap bisa dibuka saat jaringan venue tidak stabil.</p>
          <div className="flex flex-wrap gap-2">
            {cached.map((c) => (
              <Link key={c.id} to={`/player/playbooks/${c.id}`} className="chip bg-canvas border border-line hover:border-sage/50 py-1.5">
                <Zap size={11} className="text-caution" /> {c.title} <span className="text-muted">• {c.mapName}</span>
              </Link>
            ))}
            {cached.length === 0 && <p className="text-xs text-muted">Buka playbook bertanda Matchday Ready sekali untuk menyimpannya ke cache.</p>}
          </div>
        </Card>
      )}

      <Card>
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="flex items-center gap-2 text-xs text-muted"><Filter size={14} /> Filter</div>
          <div className="flex flex-wrap gap-1.5">
            {maps.map((m: string) => (
              <button key={m} onClick={() => setMap(m)} className={`chip border px-2.5 py-1.5 ${map === m ? 'bg-sage/15 border-sage text-sage' : 'bg-elevated border-line text-muted hover:text-crisp'}`}>{m === 'ALL' ? 'Semua Map' : m}</button>
            ))}
          </div>
          <div className="w-px h-5 bg-grid mx-1" />
          <div className="flex flex-wrap gap-1.5">
            {SCENARIOS.map((s) => (
              <button key={s} onClick={() => setScenario(s)} className={`chip border px-2.5 py-1.5 ${scenario === s ? 'bg-clay/15 border-clay text-clay' : 'bg-elevated border-line text-muted hover:text-crisp'}`}>{s === 'ALL' ? 'Semua Skenario' : SCENARIO_LABELS[s]}</button>
            ))}
          </div>
        </div>

        {isLoading ? <Loading /> : rows.length === 0 ? <Empty title="Tidak ada playbook" description="Coba ubah filter." /> : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {rows.map((p: any) => (
              <div key={p.id} className="rounded-xl border border-line bg-canvas/40 p-4 hover:border-sage/40 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted">{p.mapName}</p>
                    <p className="text-xs text-clay">{SCENARIO_LABELS[p.scenarioType] || p.scenarioType}</p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-1">
                    {p.isMatchdayReady && <Badge tone="amber"><Zap size={10} /> Matchday</Badge>}
                    <Badge tone={READ_STATUS_TONE[p.myStatus] || 'neutral'}>
                      {p.myStatus === 'UNREAD' ? <AlertTriangle size={10} /> : p.myStatus === 'ACKNOWLEDGED' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                      {READ_STATUS_LABELS[p.myStatus] || p.myStatus}
                    </Badge>
                  </div>
                </div>
                <h3 className="font-display font-semibold text-base mb-1">{p.title}</h3>
                <p className="text-[11px] text-muted mb-3">Patch {p.patchVersion} • v{p.version} • {fmtDate(p.updatedAt)}</p>
                {p.myStatus === 'READING' && p.readDurationSeconds > 0 && (
                  <p className="text-[10px] text-caution mb-3 flex items-center gap-1"><Clock size={10} /> {p.readDurationSeconds}s dibaca</p>
                )}
                <Link to={`/player/playbooks/${p.id}`} className="btn-primary w-full"><Eye size={15} /> Buka Taktik</Link>
                <p className="text-[10px] text-muted/60 mt-2 flex items-center gap-1"><ShieldCheck size={10} /> Watermark aktif • read-only</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
