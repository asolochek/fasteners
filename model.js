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
const HW = [['locknuts', 'locknut', 'row', 'Lock Nut'], ['nuts', 'nut', 'row', 'Nut'], ['lockwashers', 'lockwasher', 'dia', 'Lock Washer'], ['washers', 'washer', 'dia', 'Washer']];
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
// every cell key that has at least one type ticked, in reading order: row by row, left to right (lengths, then lock nuts,
// nuts, lock washers, washers); a diameter's washer cells appear with the first row of that diameter
function populated(page) {
  const out = [], has = k => page.cells[k]?.types?.length, seenDia = new Set();
  for (const row of page.rows) {
    for (const len of lengths(page)) { const k = screwKey(row, len); if (has(k)) out.push(k); }
    for (const [, suffix, per] of HW) {
      if (per === 'row') { const k = `${row.id}|${suffix}`; if (has(k)) out.push(k); }
      else if (!seenDia.has(row.dia + suffix)) { seenDia.add(row.dia + suffix); const k = `${row.dia}|${suffix}`; if (has(k)) out.push(k); }
    }
  }
  return out;
}
// a cell may keep some of its head types in a different drawer (cell.detail[type].drawer/half overrides the cell's own):
// portions() splits every populated cell into { key, types, drawer, half } pieces, one per distinct drawer half
function portions(page, keys) {
  const out = [];
  for (const k of keys || populated(page)) {
    const c = page.cells[k] || {}, by = {};
    for (const t of c.types || []) {
      const o = (c.detail || {})[t] || {};
      const drawer = o.drawer !== undefined && o.drawer !== '' ? o.drawer : (c.drawer || ''), half = o.drawer ? (o.half || '') : (c.half || '');
      const slot = drawer ? `${drawer}|${half}` : `cell:${k}`;
      (by[slot] = by[slot] || { key: k, types: [], drawer, half }).types.push(t);
    }
    out.push(...Object.values(by));
  }
  return out;
}
// print order: labels with a drawer first, by drawer number then rear before front; the rest in reading order
function drawerOrder(page, groups) {
  const key = g => { const c = g[0]; return c.drawer ? [0, +c.drawer, c.half === 'front' ? 1 : 0] : [1, 0, 0]; };
  return groups.map((g, i) => [g, key(g), i]).sort((a, b) => (a[1][0] - b[1][0]) || (a[1][1] - b[1][1]) || (a[1][2] - b[1][2]) || (a[2] - b[2])).map(x => x[0]);
}
module.exports = { lengthText, lengths, screwKey, nutKey, washerKey, cellText, populated, portions, drawerOrder, HW };
