import { useQuery } from '@tanstack/react-query';
import { Radar, ExternalLink, CalendarDays, Map, Play } from 'lucide-react';
import { api } from '../lib/api';
import { Badge, Card, Empty, Loading, PageHeader, Progress, SectionTitle } from '../components/ui';
import { fmtDate } from '../lib/format';

export default function Opponents() {
  const { data: opponents, isLoading } = useQuery<any[]>({ queryKey: ['opponents'], queryFn: () => api.get('/opponents') });

  if (isLoading) return <Loading />;

  return (
    <>
      <PageHeader title="Opponent Scouting" subtitle="Database kecenderungan tim lawan dari riwayat pertandingan" />

      {!opponents?.length ? <Card><Empty title="Belum ada data lawan" description="Data terkumpul otomatis dari hasil scrim dan turnamen." /></Card> : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {opponents.map((o) => (
            <Card key={o.opponent} hover>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-clay/10 border border-clay/20 flex items-center justify-center"><Radar size={18} className="text-clay" /></div>
                  <div><h3 className="font-display font-semibold">{o.opponent}</h3><p className="text-xs text-muted">{o.matches} pertandingan tercatat</p></div>
                </div>
                <Badge tone={o.winRate >= 50 ? 'red' : 'green'}>{o.winRate}% menang</Badge>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <div className="flex justify-between text-[11px] text-muted mb-1"><span>Win rate kita melawan mereka</span><span className="num">{100 - o.winRate}%</span></div>
                  <Progress value={100 - o.winRate} tone={(100 - o.winRate) >= 60 ? 'green' : 'amber'} />
                </div>
                <div className="flex flex-wrap gap-1">
                  {o.maps?.map((m: string) => <Badge key={m} tone="neutral"><Map size={10} /> {m}</Badge>)}
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-line text-xs text-muted">
                <p className="flex items-center gap-2"><CalendarDays size={13} /> Terakhir: {fmtDate(o.lastPlayed)}</p>
                <p className="flex items-center gap-2"><Play size={13} /> Patch {o.lastPatch || '—'}</p>
                {o.lastVod && <a href={o.lastVod} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sage hover:underline"><ExternalLink size={13} /> VOD pertandingan terakhir</a>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
