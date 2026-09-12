// Fastener grid model helpers shared by the server and the labels. Rows are thread sizes (diameter + pitch); columns are lengths.
// Cell keys: `${row.id}|${length}` for screws, `${row.id}|nut` for nuts, `${dia}|washer` for washers (washers span the rows of a diameter).
function lengthText(page, len) {
  if (page.units === 'mm') return `${+len}mm`;
  const whole = Math.floor(len + 1e-9), frac = +(len - whole).toFixed(6);
  let f = '';
  if (frac) { for (const d of [2, 4, 8, 16, 32, 64]) { const n = frac * d; if (Math.abs(n - Math.round(n)) < 1e-6) { f = `${Math.round(n)}/${d}`; break; } } if (!f) f = String(frac).replace(/^0/, ''); }
  return (whole ? (f ? `${whole}-${f}` : String(whole)) : f) + '″';
}
// the ordered list of lengths: the step series, plus extras, minus skips
function lengths(page) {
  const L = page.lengths, out = new Set();
  for (let x = L.start; x <= L.stop + 1e-9; x = +(x + L.step).toFixed(6)) out.add(+x.toFixed(6));
  for (const e of L.extra || []) out.add(+e);
  for (const s of L.skip || []) out.delete(+s);
  return [...out].sort((a, b) => a - b);
}
const screwKey = (row, len) => `${row.id}|${len}`;
const nutKey = row => `${row.id}|nut`;
const washerKey = dia => `${dia}|washer`;
// hardware columns: nuts and lock nuts belong to a thread size (row); washers and lock washers to a diameter (shared by its rows)
const HW = [['nuts', 'nut', 'row', 'Nut'], ['locknuts', 'locknut', 'row', 'Lock Nut'], ['washers', 'washer', 'dia', 'Washer'], ['lockwashers', 'lockwasher', 'dia', 'Lock Washer']];
// label text for a cell
function cellText(page, key) {
  const [a, b] = key.split('|');
  const hw = HW.find(h => h[1] === b);
  if (hw && hw[2] === 'dia') return `${a} ${hw[3]}`;
  const row = page.rows.find(r => r.id === a);
  if (!row) return key;
  if (hw) return `${row.label} ${hw[3]}`;
  return `${row.label} × ${lengthText(page, +b)}`;
}
// every cell key that has at least one type ticked, in page order (row by row, lengths then nut; washers after their diameter's rows)
function populated(page) {
  const out = [], seenDia = new Set();
  for (const row of page.rows) {
    for (const len of lengths(page)) { const k = screwKey(row, len); if (page.cells[k]?.types?.length) out.push(k); }
    for (const [, suffix, per] of HW) {
      if (per === 'row') { const k = `${row.id}|${suffix}`; if (page.cells[k]?.types?.length) out.push(k); }
      else if (!seenDia.has(row.dia + suffix)) { seenDia.add(row.dia + suffix); const k = `${row.dia}|${suffix}`; if (page.cells[k]?.types?.length) out.push(k); }
    }
  }
  return out;
}
module.exports = { lengthText, lengths, screwKey, nutKey, washerKey, cellText, populated, HW };
