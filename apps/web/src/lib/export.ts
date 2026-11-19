import { jsPDF } from 'jspdf';

function escapeCsv(value: any): string {
  const s = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function downloadCsv(filename: string, rows: Record<string, any>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => escapeCsv(r[h])).join(','))].join('\r\n');
  const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
}

export function downloadPdf(filename: string, title: string, subtitle: string, rows: Record<string, any>[]) {
  const doc = new jsPDF({ orientation: rows.length && Object.keys(rows[0]).length > 5 ? 'landscape' : 'portrait' });
  doc.setFillColor(11, 14, 20);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 32, 'F');
  doc.setTextColor(0, 229, 255);
  doc.setFontSize(16);
  doc.text(title, 14, 15);
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(9);
  doc.text(subtitle, 14, 24);

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9);
  const headers = Object.keys(rows[0] || {});
  let y = 44;
  const write = (line: string) => {
    if (y > doc.internal.pageSize.getHeight() - 14) { doc.addPage(); y = 18; }
    doc.text(line, 14, y);
    y += 6;
  };
  write(headers.join('  |  '));
  write('-'.repeat(Math.min(headers.length * 16, 180)));
  rows.forEach((row) => write(headers.map((h) => row[h] ?? '').join('  |  ')));
  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
