// Copyright (C) 2026 Aaron Solochek. Licensed under the GNU GPL v3; see LICENSE.
// Fastener grid: a small web app for the fastener cabinets. Serves the grid, stores the JSON model, renders drawer labels as PDF.
// Run:  node server.js            (port 8093 unless PORT is set; bind to localhost, Apache proxies and authenticates)
// Label rendering reuses ~/binner-docs/plan-src/labels.js (Futura, 360 dpi, 9 mm drawer format).
const path = require('path'), fs = require('fs');
process.env.NODE_PATH = path.join(__dirname, 'node_modules');   // labels.js finds sharp and pdf-lib through NODE_PATH
const express = require('express');
const L = require('/home/aarons/binner-docs/plan-src/labels.js');
const I = require('./icons.js'), M = require('./model.js');
const DATA = path.join(__dirname, 'data', 'fasteners.json');
const PRINTED = path.join(__dirname, 'data', 'printed.json');   // { "<page>|<cell key>": "<label text + types>" } = what has been printed
const app = express();
app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'static')));
app.use('/helper', express.static(path.join(__dirname, 'helper'), { index: false }));   // the Windows print helper, downloadable from the page's host
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
app.get('/api/icons', (req, res) => res.json({ svg: Object.fromEntries(Object.keys(I.ALL).map(k => [k, I.icon(k)])), labels: I.LABELS }));
app.get('/api/printed', (req, res) => res.json(loadPrinted()));
// a label for one cell: text in the part-number slot, the ticked types as icons in the glyph slot
function labelFor(page, portion) {
  const key = portion.key, types = portion.types || [], pn = M.cellText(page, key), S = L.STYLE.drawer;
  // the icons take whatever width the text leaves free (at most one glyph height each); the drawer number stays off the label
  const free = S.len - S.pad - S.pnX - L.textWidth(pn, S.pn) - 1.5;
  const lay = I.layout(types, free, S.glyphH);   // one row or two, whichever keeps the icons larger
  return { kind: 'drawer', pn, value: '', specs: '', pinout: null, glyphSvg: I.icons(types, lay.rows), glyphMaxW: lay.maxW,
           generic: true, _n: types.length, _sig: `${pn}|${types.join(',')}` };
}
// cells that share a drawer half print as ONE label: "#10 Washers" (washers + lock washers), "#4-40 Nuts" (nuts + lock nuts),
// or for a mix with screws the size in the big slot and the items on the detail line; the icons are the union of the cells'
function groupByDrawer(page, keys) {
  const groups = new Map(), singles = [];
  for (const pt of M.portions(page, keys)) {
    if (!pt.drawer) { singles.push([pt]); continue; }
    const g = `${pt.drawer}|${pt.half || ''}`; if (!groups.has(g)) groups.set(g, []); groups.get(g).push(pt);
  }
  return [...singles, ...groups.values()];
}
function labelForGroup(page, group) {
  if (group.length === 1) return labelFor(page, group[0]);
  const S = L.STYLE.drawer, cells = group.map(pt => ({ k: pt.key, types: pt.types, suffix: pt.key.split('|')[1], base: pt.key.split('|')[0] }));
  // reading order inside the label: rows in page order, lengths ascending, hardware after the lengths
  const rowIx = id => page.rows.findIndex(r => r.id === id);
  cells.sort((a, b) => (rowIx(a.base) - rowIx(b.base)) || ((isNaN(+a.suffix) ? 1e9 : +a.suffix) - (isNaN(+b.suffix) ? 1e9 : +b.suffix)));
  const types = [...new Set(cells.flatMap(c => c.types || []))];
  // the size text: thread sizes of one diameter merge their pitches ("#8-32/36", "M6×1/0.75"); different diameters are listed
  const rowsIn = [...new Set(cells.filter(c => !c.suffix.endsWith('washer')).map(c => c.base))].map(id => page.rows.find(r => r.id === id)).filter(Boolean);
  const dias = [...new Set(rowsIn.map(r => r.dia))];
  let base;
  if (cells.every(c => c.suffix.endsWith('washer'))) base = [...new Set(cells.map(c => c.base))].join(' / ');
  else if (dias.length === 1 && rowsIn.length > 1) base = page.units === 'mm' ? `${dias[0]}×${rowsIn.map(r => r.pitch).join('/')}` : `${dias[0]}-${rowsIn.map(r => r.pitch).join('/')}`;
  else base = rowsIn.map(r => r.label).join(' / ');
  const items = [...new Set(cells.map(c => M.HW.find(h => h[1] === c.suffix)?.[3] || M.lengthText(page, +c.suffix)))];   // one entry per length, however many rows share it
  let pn, value = '', extra = {};
  if (cells.every(c => c.suffix.endsWith('washer'))) pn = `${base} Washer`;
  else if (cells.every(c => c.suffix.endsWith('nut'))) pn = `${base} Nut`;
  else if (items.length === 1 && !cells.some(c => isNaN(+c.suffix))) pn = `${base} × ${items[0]}`;   // one length shared by the rows: a plain screw label
  else {
    // size in the big slot, then the lengths (and any nut) right after it at a mid size, centred on the strip
    pn = base; value = items.join('  ');
    extra = { spec: 3.0, detX: S.pnX + L.textWidth(pn, S.pn) + 2.5, detCenter: true };
  }
  // the icons take the width left after the big text and, when there is one, the detail line; a long length list gives up
  // font size (3.0 → 1.9 mm) until the icons keep at least ~3 mm, so neither the text nor the icons get squeezed out
  const freeFor = sp => S.len - S.pad - 1.5 - Math.max(S.pnX + L.textWidth(pn, S.pn), value ? (extra.detX ?? S.detX) + L.textWidth(value, sp ?? S.spec) : 0);
  let lay, free;
  for (const sp of (extra.spec ? [3.0, 2.6, 2.3, 2.0] : [null])) {
    if (extra.spec) extra.spec = sp;
    free = freeFor(extra.spec); lay = I.layout(types, free, S.glyphH);
    if (lay.size >= Math.min(3.0, S.glyphH / 2)) break;
  }
  return { kind: 'drawer', pn, value, specs: '', pinout: null, glyphSvg: I.icons(types, lay.rows), glyphMaxW: lay.maxW, ...extra,
           generic: true, _n: types.length, _sig: `${pn}|${value}|${types.join(',')}` };
}
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
// POST /api/labels { page, keys: [...] | "all" | "new" }  or  { drawers: "12-16, 20, 30R" } (every page) -> PDF
app.post('/api/labels', async (req, res) => {
  const d = load();
  let groups = [], pageOf = new Map(), name = 'all';
  if (req.body.drawers) {
    const ok = drawerMatcher(req.body.drawers); if (!ok) return res.status(400).json({ error: 'bad drawer list; use e.g. 12-16, 20, 30R' });
    for (const page of d.pages) {
      const keys = M.populated(page).filter(k => page.cells[k]?.drawer && ok(page.cells[k].drawer, page.cells[k].half));
      for (const g of groupByDrawer(page, keys)) { groups.push(g); pageOf.set(g, page); }
    }
    // drawer order, rear before front
    const dk = g => { const c = pageOf.get(g).cells[g[0]]; return [+c.drawer, c.half === 'front' ? 1 : 0]; };
    groups.sort((a, b) => { const [x, y] = dk(a), [u, v] = dk(b); return (x - u) || (y - v); });
    name = 'drawers-' + String(req.body.drawers).replace(/[^\w-]+/g, '_');
  } else {
    const page = d.pages.find(p => p.id === req.body.page);
    if (!page) return res.status(404).json({ error: 'no such page' });
    let keys = req.body.keys === 'all' || req.body.keys === 'new' ? M.populated(page) : (req.body.keys || []);
    let only = null;   // { slots: Set of "drawer|half" } when the caller chose which of a split cell's drawers to print
    if (Array.isArray(req.body.keys)) {
      // a chosen cell that shares a drawer half with other cells prints the merged label(s) for those halves
      let slots = new Set(M.portions(page, keys).filter(pt => pt.drawer).map(pt => `${pt.drawer}|${pt.half || ''}`));
      if (Array.isArray(req.body.slots)) { only = new Set(req.body.slots); slots = new Set([...slots].filter(x => only.has(x))); }
      const more = M.portions(page).filter(pt => pt.drawer && slots.has(`${pt.drawer}|${pt.half || ''}`)).map(pt => pt.key);
      keys = [...new Set([...keys, ...more])];
    }
    groups = M.drawerOrder(page, groupByDrawer(page, keys)); groups.forEach(g => pageOf.set(g, page));
    if (only) groups = groups.filter(g => !g[0].drawer || only.has(`${g[0].drawer}|${g[0].half || ''}`));
    if (req.body.keys === 'new') { const pr = loadPrinted(); groups = groups.filter(g => pr[`${page.id}|${g[0].key}`] !== labelForGroup(page, g)._sig); }
    name = `${page.id}-${Array.isArray(req.body.keys) ? (req.body.keys.length === 1 ? req.body.keys[0] : 'selection') : req.body.keys}`;
  }
  const labels = groups.map(g => labelForGroup(pageOf.get(g), g)).filter(l => l._n > 0);
  if (!labels.length) return res.status(400).json({ error: 'nothing to print' });
  L.warnings.length = 0;
  const pdf = await L.pdf(labels);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="labels-${name.replace(/[^\w.-]+/g, '_')}.pdf"`);
  res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, X-Label-Count');
  res.setHeader('X-Label-Count', String(labels.length));
  res.send(Buffer.from(pdf));
});
// POST /api/printed { page, keys } marks those labels as printed with their current text
app.post('/api/printed', (req, res) => {
  const d = load(), page = d.pages.find(p => p.id === req.body.page); if (!page) return res.status(404).json({ error: 'no such page' });
  const pr = loadPrinted();
  const keys = req.body.keys === 'all' ? M.populated(page) : (req.body.keys || []);
  for (const g of groupByDrawer(page, keys)) { const sig = labelForGroup(page, g)._sig; for (const pt of g) pr[`${page.id}|${pt.key}`] = sig; }
  fs.writeFileSync(PRINTED, JSON.stringify(pr, null, 1)); res.json({ ok: true, marked: keys.length });
});
// GET /api/cabinet -> what is in each drawer (all pages): { drawers: { "12": { back: [...], front: [...], whole: [...] } } }
// each entry: { text, page, keys, gap } where gap = the screw lengths in that half are not a contiguous run of the page's lengths
app.get('/api/cabinet', (req, res) => {
  const d = load(), drawers = {};
  const pages = req.query.page ? d.pages.filter(p => p.id === req.query.page) : d.pages;
  for (const page of pages) {
    for (const g of groupByDrawer(page, M.populated(page)).filter(g => g[0].drawer)) {
      const c = g[0], half = c.half || 'whole', lab = labelForGroup(page, g);
      // gap check per row: the lengths assigned here must be consecutive in the page's length list
      const lens = M.lengths(page); let gap = false;
      const byRow = {};
      for (const pt of g) { const [a, b] = pt.key.split('|'); if (!isNaN(+b)) (byRow[a] = byRow[a] || []).push(lens.indexOf(+b)); }
      for (const idx of Object.values(byRow)) { idx.sort((x, y) => x - y); for (let i = 1; i < idx.length; i++) if (idx[i] !== idx[i - 1] + 1) gap = true; }
      const entry = { text: lab.pn + (lab.value ? '  ' + lab.value : ''), page: page.title, keys: g.map(pt => pt.key), gap };
      const dr = drawers[c.drawer] = drawers[c.drawer] || { back: [], front: [], whole: [] };
      dr[half].push(entry);
    }
  }
  res.json({ drawers, pages: d.pages.map(p => ({ id: p.id, title: p.title })), page: req.query.page || '' });
});
// GET /api/preview.png?page=..&key=..  -> a PNG of one label for the on-screen preview
app.get('/api/preview.png', async (req, res) => {
  const d = load(), page = d.pages.find(p => p.id === req.query.page); if (!page) return res.status(404).end();
  const l = labelForGroup(page, groupByDrawer(page, M.populated(page)).find(g => g.some(pt => pt.key === req.query.key)) || groupByDrawer(page, [req.query.key])[0]);
  res.setHeader('Content-Type', 'image/png'); res.send(await L.renderPng(L.labelSvg('drawer', l)));
});
const port = +process.env.PORT || 8093;
app.listen(port, '127.0.0.1', () => console.log(`fasteners on http://127.0.0.1:${port}`));
