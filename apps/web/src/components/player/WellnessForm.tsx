import { useEffect, useState } from 'react';
import { Activity, Timer, Check } from 'lucide-react';
import { api } from '../../lib/api';
import { clamp10 } from '../../lib/player';
import { Badge } from '../ui';

const ISSUES = ['Tidak ada', 'Pergelangan', 'Punggung', 'Mata', 'Leher', 'Lainnya'];

interface Props {
  compact?: boolean;
  initial?: any;
  onSaved?: () => void;
}

export default function WellnessForm({ compact, initial, onSaved }: Props) {
  const [sleep, setSleep] = useState(initial?.sleepHours ?? 7);
  const [fatigue, setFatigue] = useState(initial?.fatigueLevel ?? 3);
  const [mental, setMental] = useState(initial?.mentalReadiness ?? 7);
  const [issue, setIssue] = useState(initial?.physicalIssue || 'Tidak ada');
  const [note, setNote] = useState(initial?.note || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const submit = async () => {
    setSaving(true);
    try {
      await api.post('/player/wellness', {
        sleepHours: clamp10(Number(sleep)),
        fatigueLevel: clamp10(Number(fatigue)),
        mentalReadiness: clamp10(Number(mental)),
        physicalIssue: issue === 'Tidak ada' ? null : issue,
        note: note || null,
      });
      setSaved(true);
      onSaved?.();
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const Row = ({ label, value, setValue, tone }: { label: string; value: number; setValue: (n: number) => void; tone: string }) => (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-muted">{label}</span>
        <span className={`num text-sm font-bold ${tone}`}>{value}<span className="text-[10px] text-muted">/10</span></span>
      </div>
      <input
        type="range" min="1" max="10" value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="w-full accent-sage h-1.5"
        aria-label={label}
      />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={15} className="text-sage" />
          <span className="heading text-sm">Daily Check-in</span>
        </div>
        <Badge tone={seconds < 30 ? 'green' : 'amber'}><Timer size={11} /> 0:{String(seconds % 60).padStart(2, '0')}</Badge>
      </div>

      <Row label="Kualitas Tidur" value={Number(sleep)} setValue={setSleep} tone="text-sage" />
      <Row label="Tingkat Kelelahan" value={Number(fatigue)} setValue={setFatigue} tone={Number(fatigue) >= 7 ? 'text-defeat' : 'text-victory'} />
      <Row label="Kesiapan Mental" value={Number(mental)} setValue={setMental} tone={Number(mental) >= 7 ? 'text-victory' : 'text-caution'} />

      <div>
        <p className="text-xs font-medium text-muted mb-2">Kondisi Fisik</p>
        <div className="flex flex-wrap gap-1.5">
          {ISSUES.map((it) => (
            <button key={it} onClick={() => setIssue(it)}
              className={`chip border transition-colors ${issue === it ? 'bg-sage/15 border-sage text-sage' : 'bg-canvas border-line text-muted hover:text-crisp'}`}>
              {it}
            </button>
          ))}
        </div>
      </div>

      {!compact && (
        <label className="block">
          <span className="label">Catatan (opsional)</span>
          <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Kondisi khusus hari ini..." />
        </label>
      )}

      <button className="btn-primary w-full" onClick={submit} disabled={saving}>
        {saved ? <><Check size={15} /> Tersimpan</> : <><Activity size={15} /> {saving ? 'Menyimpan...' : 'Simpan Check-in'}</>}
      </button>

      {compact && <p className="text-[10px] text-muted text-center">Rata-rata &lt; 30 detik • data hanya untuk coach divisi Anda</p>}
    </div>
  );
}
