// Copyright (C) 2026 Aaron Solochek. Licensed under the GNU GPL v3; see LICENSE.
// Fastener grid: a small web app for the fastener cabinets. Serves the grid, stores the JSON model, renders drawer labels as PDF.
// Run:  node server.js            (port 8093 unless PORT is set; bind to localhost, Apache proxies and authenticates)
// Label rendering reuses ~/binner-docs/plan-src/labels.js (Futura, 360 dpi): drawer labels on 9 mm tape, bin labels on 18 mm.
const path = require('path'), fs = require('fs');
process.env.NODE_PATH = path.join(__dirname, 'node_modules');   // labels.js finds sharp and pdf-lib through NODE_PATH
const express = require('express');
const L = require('/home/aarons/binner-docs/plan-src/labels.js');
const I = require('./icons.js'), M = require('./model.js');
const DATA = process.env.FASTENERS_DATA || path.join(__dirname, 'data', 'fasteners.json');   // FASTENERS_DATA: another data file (tests)
const PRINTED = process.env.FASTENERS_PRINTED || path.join(__dirname, 'data', 'printed.json');   // { "<page>|<cell key>": "<label text + types>", "bin|B3": "..." } = what has been printed
const app = express();
app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'static')));
app.use('/helper', express.static(path.join(__dirname, 'helper'), { index: false }));   // the Windows print helper, downloadable from the page's host
app.get('/model.js', (req, res) => res.sendFile(path.join(__dirname, 'model.js')));   // the page uses the same location logic as the server
const load = () => JSON.parse(fs.readFileSync(DATA, 'utf8'));
const loadPrinted = () => fs.existsSync(PRINTED) ? JSON.parse(fs.readFileSync(PRINTED, 'utf8')) : {};
app.get('/api/data', (req, res) => res.json(load()));
// Saves carry the revision they were loaded from; a stale copy (another tab, or a model edit made here) is refused with the
// current data so the page can reload instead of overwriting it.
app.put('/api/data', (req, res) => {
  const d = req.body, cur = load();
  if (!d || !Array.isArray(d.pages)) return res.status(400).json({ error: 'bad model' });
  if ((d.rev || 0) !== (cur.rev || 0)) return res.status(409).json({ error: 'stale', data: cur });
  d.rev = (cur.rev || 0) + 1;
  fs.writeFileSync(DATA + '.tmp', JSON.stringify(d, null, 1)); fs.renameSync(DATA + '.tmp', DATA);
  res.json({ ok: true, rev: d.rev });
});
// icons for the page: every base name, the pointed version of every head shape, and every screw variant in use anywhere
app.get('/api/icons', (req, res) => {
  const d = load(), names = new Set([...Object.keys(I.ALL), ...Object.keys(I.SHAPES).map(k => k + ':p')]);
  for (const page of d.pages) for (const c of Object.values(page.cells || {})) for (const t of c.types || []) names.add(t);
  res.json({ svg: Object.fromEntries([...names].map(k => [k, I.icon(k)])), labels: Object.fromEntries([...names].map(k => [k, I.label(k)])), groups: I.GROUPS, washers: I.WASHER_NAMES });
});
// one icon on demand (a variant the page just created)
app.get('/api/icon', (req, res) => res.json({ name: req.query.name, svg: I.icon(req.query.name), label: I.label(req.query.name) }));
app.get('/api/printed', (req, res) => res.json(loadPrinted()));

// ---- what a location holds ----
// portions of the given cells grouped by location (drawer half or bin); a portion without a location is a group of its own
function groupBySlot(page, keys) {
  const groups = new Map(), singles = [];
  for (const pt of M.portions(page, keys)) {
    const s = M.portionSlot(pt); if (!s || M.isList(page)) { singles.push([pt]); continue; }   // list lines print one label each
    if (!groups.has(s)) groups.set(s, []); groups.get(s).push(pt);
  }
  return [...singles, ...groups.values()];
}
const groupSlot = g => M.portionSlot(g[0]);
// what sets this portion apart from the rest of its cell: the drives / materials of its items when the head type's other
// items live elsewhere, as a short list ("SS/zinc", "Phillips"); "overflow" is added by the caller. The icons already
// say which types are here, so type names are left out.
function qualifier(page, pt) {
  const all = M.items(page, pt.key), ds = new Set(), ms = new Set();
  const u = (list, f) => [...new Set(list.map(f).filter(Boolean))];
  for (const t of pt.types) {
    const mine = pt.items.filter(i => i.type === t), whole = all.filter(i => i.type === t);
    if (mine.length >= whole.length) continue;
    const md = u(mine, i => i.drive), mm = u(mine, i => i.material);
    if (md.length && md.length < u(whole, i => i.drive).length) md.forEach(x => ds.add(M.DRIVE_SHORT[x] || x));
    if (mm.length && mm.length < u(whole, i => i.material).length) mm.forEach(x => ms.add(M.MAT_SHORT[x] || x));
  }
  return { drives: [...ds], materials: [...ms] };
}
// the qualifier line of a group: the union over its portions, drives then materials, then "overflow" if any portion is one
function groupQual(page, group) {
  const ds = new Set(), ms = new Set(); let over = false;
  for (const pt of group) { const q = qualifier(page, pt); q.drives.forEach(x => ds.add(x)); q.materials.forEach(x => ms.add(x)); over = over || pt.overflow; }
  return [[...ds].join('/'), [...ms].join('/'), over ? 'overflow' : ''].filter(Boolean).join(' ');
}
// the text of one location's label: { pn, value, qual, types, sig }
// cells that share a location print as ONE label: "#10 Washer" (washers + lock washers), "#4-40 Nut" (nuts + lock nuts),
// or for screws the size in the big slot and the lengths on the detail line; the icons are the union of the cells'
function groupText(page, group) {
  const types = [...new Set(group.flatMap(pt => pt.types || []))];
  const qual = groupQual(page, group);
  if (group.length === 1) { const pn = M.cellText(page, group[0].key), value = M.isList(page) ? (M.listItem(page, group[0].key)?.detail || '') : ''; return { pn, value, qual, types, sig: `${pn}|${value}|${qual}|${types.join(',')}` }; }
  const cells = group.map(pt => ({ k: pt.key, types: pt.types, suffix: pt.key.split('|')[1], base: pt.key.split('|')[0] }));
  // reading order inside the label: rows in page order, lengths ascending, hardware after the lengths
  const rowIx = id => page.rows.findIndex(r => r.id === id);
  cells.sort((a, b) => (rowIx(a.base) - rowIx(b.base)) || ((isNaN(+a.suffix) ? 1e9 : +a.suffix) - (isNaN(+b.suffix) ? 1e9 : +b.suffix)));
  // the size text: thread sizes of one diameter merge their pitches ("#8-32/36", "M6×1/0.75"); different diameters are listed
  const rowsIn = [...new Set(cells.filter(c => !c.suffix.endsWith('washer')).map(c => c.base))].map(id => page.rows.find(r => r.id === id)).filter(Boolean);
  const dias = [...new Set(rowsIn.map(r => r.dia))];
  let base;
  if (cells.every(c => c.suffix.endsWith('washer'))) base = [...new Set(cells.map(c => c.base))].join(' / ');
  else if (dias.length === 1 && rowsIn.length > 1) base = page.units === 'mm' ? `${dias[0]}×${rowsIn.map(r => r.pitch).join('/')}` : `${dias[0]}-${rowsIn.map(r => r.pitch).join('/')}`;
  else base = rowsIn.map(r => r.label).join(' / ');
  const items = [...new Set(cells.map(c => M.HW.find(h => h[1] === c.suffix)?.[3] || M.lengthText(page, +c.suffix)))];   // one entry per length, however many rows share it
  let pn, value = '';
  if (cells.every(c => c.suffix.endsWith('washer'))) pn = `${base} Washer`;
  else if (cells.every(c => c.suffix.endsWith('nut'))) pn = `${base} Nut`;
  else if (items.length === 1 && !cells.some(c => isNaN(+c.suffix))) pn = `${base} × ${items[0]}`;   // one length shared by the rows: a plain screw label
  else if (dias.length > 1) {   // several diameters with their own lengths: one "size × lengths" per row, the first one big
    const per = rowsIn.map(r => `${r.label} × ${cells.filter(c => c.base === r.id).map(c => M.HW.find(h => h[1] === c.suffix)?.[3] || M.lengthText(page, +c.suffix)).join('/')}`);
    pn = per[0]; value = per.slice(1).join('  ');
  }
  else { pn = base; value = items.join('  '); }
  return { pn, value, qual, types, sig: `${pn}|${value}|${qual}|${types.join(',')}` };
}
// a 9 mm drawer label for one location: big text, lengths and/or qualifier as detail, the icons on the right
// a long single detail line ("PEI/phenolic/PTFE") may be wrapped onto two lines at a slash or space, whichever keeps the icons larger
function wrap2(text, fs) {
  const parts = text.split(/(?<=[\/ ])/); let best = null;
  for (let i = 1; i < parts.length; i++) {
    const a = parts.slice(0, i).join('').replace(/[\/ ]$/, ''), b = parts.slice(i).join('');
    const w = Math.max(L.textWidth(a, fs), L.textWidth(b, fs)); if (!best || w < best.w) best = { a, b, w };
  }
  return best ? [best.a, best.b] : [text];
}
function drawerLabel(page, group) {
  const S = L.STYLE.drawer, t = groupText(page, group);
  const base = [t.value, t.qual].filter(Boolean);
  const detX = S.pnX + L.textWidth(t.pn, S.pn) + 2.5;
  const freeFor = (lines, sp) => S.len - S.pad - 1.5 - Math.max(S.pnX + L.textWidth(t.pn, S.pn), ...lines.map(l => detX + L.textWidth(l, sp)));
  // candidates in order of preference: one line large, then two lines / smaller text; the first that keeps the icons ≥ ~3 mm wins
  const cands = [];
  if (base.length === 1) for (const sp of [3.0, 2.6, 2.3, 2.0]) { cands.push({ lines: base, sp }); if (sp < 3.0 && base[0].length > 6) cands.push({ lines: wrap2(base[0], sp), sp }); }
  else if (base.length === 2) for (const sp of [2.6, 2.3, 2.0, 1.9]) cands.push({ lines: base, sp });
  else cands.push({ lines: [], sp: null });
  let pick = null;
  for (const c of cands) { c.lay = I.layout(t.types, freeFor(c.lines, c.sp ?? S.spec), S.glyphH); if (!pick || c.lay.size > pick.lay.size + 1e-6) pick = c; if (c.lay.size >= Math.min(3.0, S.glyphH / 2)) { pick = c; break; } }
  const extra = pick.lines.length ? { spec: pick.sp, detX, detCenter: pick.lines.length === 1 } : {};
  return { kind: 'drawer', pn: t.pn, value: pick.lines[0] || '', specs: pick.lines[1] || '', pinout: null, glyphSvg: t.types.length ? I.icons(t.types, pick.lay.rows) : null, glyphMaxW: pick.lay.maxW, ...extra,
           generic: true, _n: t.types.length || (M.isList(page) ? 1 : 0), _sig: t.sig, _slot: groupSlot(group) };
}
// an 18 mm bin label: everything in the bin, from every page. One entry: the size big with its details under it; several:
// one line per entry at a size that fits (up to six lines)
function binEntries(d, bin) {
  const out = [];
  for (const page of d.pages) for (const g of groupBySlot(page, M.populated(page))) {
    if (groupSlot(g) !== `B:${bin}`) continue;
    // one entry per diameter, so each line of the label reads "size × lengths"
    const diaOf = pt => { const [a, b = ''] = pt.key.split('|'); return M.isList(page) ? pt.key : b.endsWith('washer') ? a : (page.rows.find(r => r.id === a)?.dia || a); };
    const byDia = new Map(); for (const pt of g) { const k = diaOf(pt); if (!byDia.has(k)) byDia.set(k, []); byDia.get(k).push(pt); }
    for (const sub of byDia.values()) out.push({ page, group: sub, ...groupText(page, sub) });
  }
  return out;
}
function binLabel(d, bin) {
  const S = L.STYLE.bin, entries = binEntries(d, bin);
  const types = [...new Set(entries.flatMap(e => e.types))];
  let lab;
  if (entries.length === 1) lab = { pn: entries[0].pn, value: entries[0].value, specs: entries[0].qual, lines: [] };
  else {
    let lines = entries.map(e => [e.pn, e.value, e.qual].filter(Boolean).join('  '));
    if (lines.length > 6) { L.warnings.push(`bin ${bin}: ${lines.length} entries, only 6 fit`); lines = [...lines.slice(0, 5), `+${lines.length - 5} more`]; }
    lab = { pn: '', value: '', specs: '', lines, spec: [4.0, 4.0, 3.4, 2.8, 2.4, 2.0][lines.length - 1] || 2.0 };
  }
  const all = () => [lab.value, lab.specs, ...lab.lines].filter(Boolean);
  const freeFor = () => S.len - S.pad - 1.5 - Math.max(lab.pn ? S.pnX + L.textWidth(lab.pn, S.pn) : 0, ...all().map(l => S.detX + L.textWidth(l, lab.spec ?? S.spec)));
  let lay = I.layout(types, freeFor(), S.glyphH);
  while (lay.size < 3.0 && (lab.spec ?? S.spec) > 2.0) { lab.spec = +(((lab.spec ?? S.spec) - 0.3).toFixed(1)); lay = I.layout(types, freeFor(), S.glyphH); }
  return { kind: 'bin', ...lab, pinout: null, glyphSvg: types.length ? I.icons(types, lay.rows) : null, glyphMaxW: lay.maxW, generic: true, _n: types.length || entries.length,
           _sig: entries.map(e => e.sig).join(';'), _slot: `B:${bin}`, _bin: bin, _entries: entries };
}
const allBins = d => [...new Set(d.pages.flatMap(p => M.bins(p)))].sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)));
// drawer spec: "12-16, 20, 30R, 31F" -> predicate on (drawer, half). A bare number matches both halves of a divided drawer.
function drawerMatcher(spec) {
  const terms = String(spec).split(/[,\s]+/).filter(Boolean).map(t => {
    const m = /^(\d+)(?:-(\d+))?([rRfFbB])?$/.exec(t); if (!m) return null;
    const half = m[3] ? (/[fF]/.test(m[3]) ? 'front' : 'back') : null;
    return { lo: +m[1], hi: +(m[2] || m[1]), half };
  });
  if (terms.some(t => !t)) return null;
  return (drawer, half) => { const n = +drawer; return terms.some(t => n >= t.lo && n <= t.hi && (!t.half || t.half === (half || ''))); };
}
// bin spec: "all" | ["B1", ...] | "B1, B3-5, 7" -> list of bin ids (only ones that hold something)
function binList(d, spec) {
  const have = allBins(d);
  if (spec === 'all') return have;
  if (Array.isArray(spec)) return have.filter(b => spec.includes(b));
  const want = new Set();
  for (const t of String(spec).split(/[,\s]+/).filter(Boolean)) {
    const m = /^b?(\d+)(?:-b?(\d+))?$/i.exec(t); if (!m) return null;
    for (let n = +m[1]; n <= +(m[2] || m[1]); n++) want.add(`B${n}`);
  }
  return have.filter(b => want.has(b));
}
async function sendPdf(res, labels, name, bins) {
  if (!labels.length) return res.status(400).json({ error: 'nothing to print' });
  L.warnings.length = 0;
  const pdf = await L.pdf(labels);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="labels-${name.replace(/[^\w.-]+/g, '_')}.pdf"`);
  res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, X-Label-Count, X-Tape, X-Bins');
  res.setHeader('X-Label-Count', String(labels.length));
  res.setHeader('X-Tape', labels[0].kind === 'bin' ? '18' : '9');
  if (bins?.length) res.setHeader('X-Bins', bins.join(','));   // bin labels the caller should fetch separately (18 mm tape)
  if (L.warnings.length) console.warn(L.warnings.join('\n'));
  res.send(Buffer.from(pdf));
}
// POST /api/labels -> PDF of 9 mm drawer labels: { page, keys: [...] | "all" | "new" [, slots: [...]] } or { drawers: "12-16, 20, 30R" }
// (every page). Bin labels are 18 mm and come from a separate call: { bins: "all" | "B1, B3-5" | ["B1", ...] [, only: "new"] }.
// A page request whose cells also live in bins answers with X-Bins: the bins to fetch next (204 when there are only bins).
app.post('/api/labels', async (req, res) => {
  const d = load();
  if (req.body.bins !== undefined) {
    const bins = binList(d, req.body.bins); if (!bins) return res.status(400).json({ error: 'bad bin list; use e.g. B1, B3-5' });
    let labels = bins.map(b => binLabel(d, b)).filter(l => l._n > 0);
    if (req.body.only === 'new') { const pr = loadPrinted(); labels = labels.filter(l => pr[`bin|${l._bin}`] !== l._sig); }
    return sendPdf(res, labels, 'bins-' + (req.body.bins === 'all' ? 'all' : labels.map(l => l._bin).join('_')));
  }
  let groups = [], pageOf = new Map(), name = 'all', bins = [];
  if (req.body.drawers) {
    const ok = drawerMatcher(req.body.drawers); if (!ok) return res.status(400).json({ error: 'bad drawer list; use e.g. 12-16, 20, 30R' });
    for (const page of d.pages) {
      for (const g of groupBySlot(page, M.populated(page))) if (g[0].kind === 'drawer' && ok(g[0].drawer, g[0].half)) { groups.push(g); pageOf.set(g, page); }
    }
    // drawer order, rear before front
    const dk = g => [+g[0].drawer, g[0].half === 'front' ? 1 : 0];
    groups.sort((a, b) => { const [x, y] = dk(a), [u, v] = dk(b); return (x - u) || (y - v); });
    name = 'drawers-' + String(req.body.drawers).replace(/[^\w-]+/g, '_');
  } else {
    const page = d.pages.find(p => p.id === req.body.page);
    if (!page) return res.status(404).json({ error: 'no such page' });
    let keys = req.body.keys === 'all' || req.body.keys === 'new' ? M.populated(page) : (req.body.keys || []);
    if (Array.isArray(req.body.keys)) {
      // a chosen cell prints the label of each of its locations (or of the slots chosen from the split-cell dialog, '' = the
      // unlocated part); a location shared with other cells prints the merged label, and nothing else of those cells
      const orig = new Set(keys), chosen = Array.isArray(req.body.slots) ? new Set(req.body.slots) : null;
      let slots = new Set(M.portions(page, keys).map(M.portionSlot).filter(Boolean));
      if (chosen) slots = new Set([...slots].filter(x => chosen.has(x)));
      const more = M.portions(page).filter(pt => slots.has(M.portionSlot(pt))).map(pt => pt.key);
      keys = [...new Set([...keys, ...more])];
      groups = groupBySlot(page, keys).filter(g => groupSlot(g) ? slots.has(groupSlot(g)) : (orig.has(g[0].key) && (!chosen || chosen.has(''))));
    } else groups = groupBySlot(page, keys);
    groups = M.drawerOrder(page, groups); groups.forEach(g => pageOf.set(g, page));
    bins = [...new Set(groups.filter(g => g[0].kind === 'bin').map(g => g[0].bin))];
    groups = groups.filter(g => g[0].kind !== 'bin');
    if (req.body.keys === 'new') {
      const pr = loadPrinted();
      groups = groups.filter(g => pr[`${page.id}|${g[0].key}`] !== groupText(page, g).sig);
      bins = bins.filter(b => pr[`bin|${b}`] !== binLabel(d, b)._sig);
    }
    name = `${page.id}-${Array.isArray(req.body.keys) ? (req.body.keys.length === 1 ? req.body.keys[0] : 'selection') : req.body.keys}`;
  }
  const labels = groups.map(g => drawerLabel(pageOf.get(g), g)).filter(l => l._n > 0);
  if (!labels.length && bins.length) { res.setHeader('Access-Control-Expose-Headers', 'X-Bins'); res.setHeader('X-Bins', bins.join(',')); return res.status(204).end(); }
  return sendPdf(res, labels, name, bins);
});
// POST /api/printed { page, keys: [...] | "all" } marks those labels (and the bins they touch) as printed with their current text;
// { bins: [...] | "all" } marks bins
app.post('/api/printed', (req, res) => {
  const d = load(), pr = loadPrinted();
  let marked = 0;
  if (req.body.bins !== undefined) { for (const b of binList(d, req.body.bins) || []) { pr[`bin|${b}`] = binLabel(d, b)._sig; marked++; } }
  else {
    const page = d.pages.find(p => p.id === req.body.page); if (!page) return res.status(404).json({ error: 'no such page' });
    const keys = req.body.keys === 'all' ? M.populated(page) : (req.body.keys || []);
    for (const g of groupBySlot(page, keys)) {
      if (g[0].kind === 'bin') { pr[`bin|${g[0].bin}`] = binLabel(d, g[0].bin)._sig; continue; }
      const sig = groupText(page, g).sig; for (const pt of g) pr[`${page.id}|${pt.key}`] = sig;
    }
    marked = keys.length;
  }
  fs.writeFileSync(PRINTED, JSON.stringify(pr, null, 1)); res.json({ ok: true, marked });
});
// GET /api/cabinet -> what is in each drawer and bin: { drawers: { "12": { back: [...], front: [...], whole: [...] } }, bins: { "B3": [...] } }
// each entry: { text, page, keys, gap, overflow } where gap = the screw lengths in that half are not a contiguous run of the
// page's lengths, overflow = everything in this entry is overflow stock
app.get('/api/cabinet', (req, res) => {
  const d = load(), drawers = {}, bins = {};
  const pages = req.query.page ? d.pages.filter(p => p.id === req.query.page) : d.pages;
  for (const page of pages) {
    for (const g of groupBySlot(page, M.populated(page)).filter(g => g[0].kind)) {
      const c = g[0], t = groupText(page, g);
      // gap check per row: the lengths assigned here must be consecutive in the page's length list
      const lens = M.lengths(page); let gap = false;
      const byRow = {};
      for (const pt of g) { const [a, b] = pt.key.split('|'); if (!isNaN(+b)) (byRow[a] = byRow[a] || []).push(lens.indexOf(+b)); }
      for (const idx of Object.values(byRow)) { idx.sort((x, y) => x - y); for (let i = 1; i < idx.length; i++) if (idx[i] !== idx[i - 1] + 1) gap = true; }
      const entry = { text: t.pn + (t.value ? '  ' + t.value : '') + (t.qual ? '  ' + t.qual : ''), page: page.title, keys: g.map(pt => pt.key), gap, overflow: g.every(pt => pt.overflow) };
      if (c.kind === 'bin') { (bins[c.bin] = bins[c.bin] || []).push(entry); continue; }
      const dr = drawers[c.drawer] = drawers[c.drawer] || { back: [], front: [], whole: [] };
      dr[c.half || 'whole'].push(entry);
    }
  }
  res.json({ drawers, bins, pages: d.pages.map(p => ({ id: p.id, title: p.title })), page: req.query.page || '' });
});
// GET /api/preview.png?page=..&key=..[&slot=..]  -> a PNG of one label for the on-screen preview (the cell's primary location, or the slot given)
app.get('/api/preview.png', async (req, res) => {
  const d = load(), page = d.pages.find(p => p.id === req.query.page); if (!page) return res.status(404).end();
  const mine = M.portions(page, [req.query.key]); if (!mine.length) return res.status(404).end();
  const pt = ('slot' in req.query ? mine.find(p => M.portionSlot(p) === req.query.slot) : null) || mine.find(p => !p.overflow) || mine[0];
  const slot = M.portionSlot(pt);
  let lab;
  if (pt.kind === 'bin') lab = binLabel(d, pt.bin);
  else lab = drawerLabel(page, slot ? groupBySlot(page, M.populated(page)).find(g => groupSlot(g) === slot) : [pt]);
  res.setHeader('Content-Type', 'image/png'); res.send(await L.renderPng(L.labelSvg(lab.kind, lab)));
});
const port = +process.env.PORT || 8093;
app.listen(port, '127.0.0.1', () => console.log(`fasteners on http://127.0.0.1:${port}`));
