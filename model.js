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
// label text for a cell
function cellText(page, key) {
  const [a, b] = key.split('|');
  if (b === 'washer') return `${a} Washer`;
  const row = page.rows.find(r => r.id === a);
  if (!row) return key;
  if (b === 'nut') return `${row.label} Nut`;
  return `${row.label} × ${lengthText(page, +b)}`;
}
// every cell key that has at least one type ticked, in page order (row by row, lengths then nut; washers after their diameter's rows)
function populated(page) {
  const out = [], seenDia = new Set();
  for (const row of page.rows) {
    for (const len of lengths(page)) { const k = screwKey(row, len); if (page.cells[k]?.types?.length) out.push(k); }
    const nk = nutKey(row); if (page.cells[nk]?.types?.length) out.push(nk);
    const wk = washerKey(row.dia);
    if (!seenDia.has(row.dia)) { seenDia.add(row.dia); if (page.cells[wk]?.types?.length) out.push(wk); }
  }
  return out;
}
module.exports = { lengthText, lengths, screwKey, nutKey, washerKey, cellText, populated };
