import { useQuery } from '@tanstack/react-query';
import { ScrollText, ShieldCheck, Fingerprint, Clock, Monitor } from 'lucide-react';
import { api } from '../lib/api';
import { Badge, Card, Empty, Loading, PageHeader, SectionTitle, StatCard } from '../components/ui';
import { fmtDateTime } from '../lib/format';

const actionTone: Record<string, any> = {
  PLAYBOOK_OPEN: 'cyan', PLAYBOOK_ACK: 'green', PLAYBOOK_CREATE: 'violet', CONTRACT_VIEW: 'amber',
  CONTRACT_UPDATE: 'amber', ROLE_CHANGE: 'red', ACCESS_REVOKE: 'red', ACCESS_GRANT: 'green',
  LEGAL_DOC_DOWNLOAD: 'red', LEGAL_DOC_UPLOAD: 'violet', LOGIN: 'neutral',
};

export default function Audit() {
  const { data: logs, isLoading } = useQuery<any[]>({ queryKey: ['audit'], queryFn: () => api.get('/audit-logs') });

  if (isLoading) return <Loading />;

  return (
    <>
      <PageHeader title="Security Audit Log" subtitle="Catatan permanen atas seluruh aktivitas sensitif" />

      <div className="grid stagger-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard label="Total Aktivitas" value={logs?.length || 0} icon={ScrollText} tone="cyan" />
        <StatCard label="Akses Playbook" value={(logs || []).filter((l) => l.actionType?.startsWith('PLAYBOOK')).length} icon={ShieldCheck} tone="violet" />
        <StatCard label="Perubahan Akses" value={(logs || []).filter((l) => l.actionType?.includes('ROLE') || l.actionType?.includes('ACCESS')).length} icon={Fingerprint} tone="red" />
        <StatCard label="Dokumen Legal" value={(logs || []).filter((l) => l.actionType?.includes('LEGAL')).length} icon={Monitor} tone="amber" />
      </div>

      <Card>
        <SectionTitle right={<Badge tone="green"><span className="w-1.5 h-1.5 rounded-full bg-victory pulse-soft" /> Immutable Log</Badge>}>
          Aktivitas Terbaru
        </SectionTitle>
        {!logs?.length ? <Empty title="Belum ada aktivitas" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-[11px] uppercase tracking-wider text-muted border-b border-line">
                <th className="py-3">Waktu</th><th className="py-3">Aktor</th><th className="py-3">Aksi</th><th className="py-3">Resource</th><th className="py-3">IP</th><th className="py-3">Device</th>
              </tr></thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-b border-line/50 last:border-0 hover:bg-elevated/40">
                    <td className="py-3 text-xs text-muted whitespace-nowrap"><Clock size={11} className="inline mr-1" />{fmtDateTime(l.createdAt)}</td>
                    <td className="py-3">
                      <p className="font-semibold">{l.actor?.ign || 'Sistem'}</p>
                      <p className="text-[10px] text-muted">{l.actor?.globalRole}</p>
                    </td>
                    <td className="py-3"><Badge tone={actionTone[l.actionType] || 'neutral'}>{l.actionType?.replace(/_/g, ' ')}</Badge></td>
                    <td className="py-3 font-mono text-xs text-muted">{l.targetResource}</td>
                    <td className="py-3 num text-xs text-muted">{l.ipAddress || '—'}</td>
                    <td className="py-3 font-mono text-[10px] text-muted">{l.deviceFingerprint || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
