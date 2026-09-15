// Copyright (C) 2026 Aaron Solochek. Licensed under the GNU GPL v3; see LICENSE.
// Fastener grid model helpers shared by the server and the labels. Rows are thread sizes (diameter + pitch); columns are lengths.
// Cell keys: `${row.id}|${length}` for screws, `${row.id}|nut` for nuts, `${dia}|washer` for washers (washers span the rows of a diameter).
(function () {   // one scope, so the page's own globals (HW, lengths, …) are untouched when this file is loaded as a script
function lengthText(page, len) {
  if (page.units === 'mm') return `${+len}mm`;
  const whole = Math.floor(len + 1e-9), frac = +(len - whole).toFixed(6);
  let f = '';
  if (frac) { for (const d of [2, 4, 8, 16, 32, 64]) { const n = frac * d; if (Math.abs(n - Math.round(n)) < 1e-6) { f = `${Math.round(n)}/${d}`; break; } } if (!f) f = String(frac).replace(/^0/, ''); }
  return (whole ? (f ? `${whole}-${f}` : String(whole)) : f) + '″';
}
// the ordered list of lengths: the step series, plus extras, minus skips
function lengths(page) {
  if (!page.lengths) return [];
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
// list pages (kind 'list'): free-form lines instead of a grid. page.items = [{ id, text, detail, glyph, loc, overflow, checked }]
const isList = page => page.kind === 'list';
const listItem = (page, key) => (page.items || []).find(it => it.id === key);
// label text for a cell
function cellText(page, key) {
  if (isList(page)) return listItem(page, key)?.text || key;
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
  if (isList(page)) return (page.items || []).filter(it => (it.text || '').trim()).map(it => it.id);
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
// ---- locations ----
// A location is { kind:'drawer', drawer:'12', half:'back'|'front'|'' } or { kind:'bin', bin:'B7' }. It can be set on the cell
// (cell.loc), on one head type (cell.detail[type].loc) or on one drive+material of a head (cell.detail[type].items['drive|material'].loc);
// the most specific one wins. Each level may also carry overflow locations (…overflow: [loc, ...]).
// Older data used cell.drawer / cell.half and detail[type].drawer / half; those still read as drawer locations.
const slotOf = l => !l ? '' : l.kind === 'bin' ? `B:${l.bin}` : (l.drawer ? `D:${l.drawer}|${l.half || ''}` : '');
const locOf = o => o?.loc?.kind === 'bin' ? (o.loc.bin ? { kind: 'bin', bin: String(o.loc.bin) } : null)
  : o?.loc?.drawer ? { kind: 'drawer', drawer: String(o.loc.drawer), half: o.loc.half || '' }
  : o?.drawer ? { kind: 'drawer', drawer: String(o.drawer), half: o.half || '' } : null;
const overflowOf = o => (o?.overflow || []).map(l => locOf({ loc: l })).filter(Boolean);
// the items of a cell: one per (type, drive, material) recorded, else per type; each with its resolved primary and overflow locations
function items(page, key) {
  if (isList(page)) { const it = listItem(page, key); return it ? [{ key, type: it.glyph || '', drive: '', material: '', loc: locOf(it), overflow: overflowOf(it) }] : []; }
  const c = page.cells[key] || {}, out = [];
  const cellLoc = locOf(c), cellOver = overflowOf(c);
  for (const t of c.types || []) {
    const o = (c.detail || {})[t] || {};
    const typeLoc = locOf(o) || cellLoc, typeOver = overflowOf(o).length ? overflowOf(o) : (locOf(o) ? [] : cellOver);
    const combos = [];
    if (o.drives) for (const [d, mats] of Object.entries(o.drives)) { if (mats.length) for (const m of mats) combos.push([d, m]); else combos.push([d, '']); }
    if (o.materials) for (const m of o.materials) combos.push(['', m]);
    if (!combos.length) combos.push(['', '']);
    for (const [d, m] of combos) {
      const it = (o.items || {})[`${d}|${m}`] || {};
      const loc = locOf(it) || typeLoc, over = overflowOf(it).length ? overflowOf(it) : (locOf(it) ? [] : typeOver);
      out.push({ key, type: t, drive: d, material: m, loc, overflow: over });
    }
  }
  return out;
}
// portions: every populated cell split by location; one piece per distinct location, listing the types in it.
// { key, types, kind, drawer, half, bin, overflow: bool }  — a piece with no location at all keeps the cell's own slot
function portions(page, keys) {
  const out = [];
  for (const k of keys || populated(page)) {
    const by = {};
    const add = (loc, it, over) => {
      const slot = loc ? slotOf(loc) + (over ? '#o' : '') : `cell:${k}`;
      const p = by[slot] = by[slot] || { key: k, types: [], items: [], kind: loc?.kind || '', drawer: loc?.drawer || '', half: loc?.half || '', bin: loc?.bin || '', overflow: !!over };
      if (it.type && !p.types.includes(it.type)) p.types.push(it.type);
      p.items.push(it);
    };
    for (const it of items(page, k)) { add(it.loc, it, false); for (const ov of it.overflow) add(ov, it, true); }
    out.push(...Object.values(by));
  }
  return out;
}
const portionSlot = p => p.kind === 'bin' ? `B:${p.bin}` : p.kind === 'drawer' ? `D:${p.drawer}|${p.half || ''}` : '';
// location text: "12", "12R", "12F" for drawers, "B3" for bins; parseLoc reads the same (plus "12 rear", "bin 3", "b3")
const locText = l => !l ? '' : l.kind === 'bin' ? l.bin : l.drawer + (l.half === 'back' ? 'R' : l.half === 'front' ? 'F' : '');
const locLong = l => !l ? '' : l.kind === 'bin' ? `bin ${l.bin}` : `drawer ${l.drawer}${l.half === 'back' ? ' rear' : l.half === 'front' ? ' front' : ''}`;
function parseLoc(text) {
  const t = String(text || '').trim(); if (!t) return null;
  let m = /^(?:bin\s*)?b\s*(\d+)$/i.exec(t); if (m) return { kind: 'bin', bin: `B${+m[1]}` };
  m = /^(\d+)\s*(r|rear|b|back|f|front)?$/i.exec(t); if (!m) return undefined;   // undefined = not understood
  const h = (m[2] || '').toLowerCase();
  return { kind: 'drawer', drawer: m[1], half: /^(r|rear|b|back)$/.test(h) ? 'back' : /^(f|front)$/.test(h) ? 'front' : '' };
}
const parseLocs = text => String(text || '').replace(/bin\s+(?=\d)/gi, 'B').replace(/(\d)\s+(r|rear|b|back|f|front)\b/gi, '$1$2').split(/[,;\s]+/).filter(Boolean).map(parseLoc);
// every bin named anywhere on a page (primary or overflow, at any level)
function bins(page) {
  const out = new Set();
  for (const k of populated(page)) for (const it of items(page, k)) { if (it.loc?.kind === 'bin') out.add(it.loc.bin); for (const o of it.overflow) if (o.kind === 'bin') out.add(o.bin); }
  return [...out].sort((a, b) => (parseInt(a.slice(1)) - parseInt(b.slice(1))) || a.localeCompare(b));
}
// short names for the label qualifiers (an item that is only part of its cell's stock says what sets it apart)
const MAT_SHORT = { aluminum: 'Al', steel: 'steel', 'steel-blackoxide': 'blk oxide', 'steel-zinc': 'zinc', 'steel-cadmium': 'cad', stainless: 'SS', brass: 'brass', nylon: 'nylon', plastic: 'plastic', fiber: 'fiber', copper: 'Cu', bronze: 'bronze', ptfe: 'PTFE', phenolic: 'phenolic', pei: 'PEI', polycarbonate: 'PC' };
const DRIVE_SHORT = { slotted: 'slotted', phillips: 'Phillips', combo: 'combo', hexslot: 'hex+slot', pozidriv: 'Pozi', jis: 'JIS', torx: 'Torx', hex: 'hex', square: 'square' };
// print order: labels with a drawer first, by drawer number then rear before front; the rest in reading order
function drawerOrder(page, groups) {
  const key = g => { const c = g[0]; return c.kind === 'drawer' ? [0, +c.drawer, c.half === 'front' ? 1 : 0] : c.kind === 'bin' ? [1, 0, 0] : [2, 0, 0]; };
  return groups.map((g, i) => [g, key(g), i]).sort((a, b) => (a[1][0] - b[1][0]) || (a[1][1] - b[1][1]) || (a[1][2] - b[1][2]) || (a[2] - b[2])).map(x => x[0]);
}
const api = { isList, listItem, lengthText, lengths, screwKey, nutKey, washerKey, cellText, populated, items, portions, portionSlot, slotOf, locOf, overflowOf, locText, locLong, parseLoc, parseLocs, bins, drawerOrder, HW, MAT_SHORT, DRIVE_SHORT };
if (typeof module !== 'undefined') module.exports = api; else window.M = api;   // the same file is served to the browser
})();
