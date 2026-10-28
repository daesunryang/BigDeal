import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

// 영수증·누적 증명서를 PDF로 만들어 공유 창을 연다 (웹에서는 인쇄 창).
const esc = (t: string) => t.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export function receiptHtml(o: { title: string; sub: string; rows: string[][]; total: string; issued: string }) {
  const rows = o.rows.map(([a, b]) => `<tr><td>${esc(a)}</td><td class="r">${esc(b)}</td></tr>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    body{font-family:sans-serif;color:#4A3428;padding:36px;background:#FBF6EE}
    h1{text-align:center;font-size:26px;margin:0 0 6px} .sub{text-align:center;color:#7A6352;font-size:13px;margin-bottom:22px}
    table{width:100%;border-collapse:collapse;border-top:1.5px dashed #7A6352;border-bottom:1.5px dashed #7A6352}
    td{padding:8px 4px;font-size:14px} .r{text-align:right} .tot{display:flex;justify-content:space-between;font-size:18px;font-weight:bold;margin-top:12px}
    .foot{margin-top:28px;font-size:11px;color:#9A8676;text-align:center}
  </style></head><body><h1>${esc(o.title)}</h1><div class="sub">${esc(o.sub)}</div><table>${rows}</table>
  <div class="tot"><span>합계</span><span>${esc(o.total)}</span></div>
  <div class="foot">발급일 ${esc(o.issued)} · 집중냥 · 이 문서는 앱 안 기록을 바탕으로 만든 참고용이에요.</div></body></html>`;
}

export async function sharePdf(html: string, name: string) {
  if (Platform.OS === 'web') { await Print.printAsync({ html }); return true; }
  const { uri } = await Print.printToFileAsync({ html });
  if (!(await Sharing.isAvailableAsync())) return false;
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: name, UTI: 'com.adobe.pdf' });
  return true;
}
