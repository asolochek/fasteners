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
const load = () => JSON.parse(fs.readFileSync(DATA, 'utf8'));
const loadPrinted = () => fs.existsSync(PRINTED) ? JSON.parse(fs.readFileSync(PRINTED, 'utf8')) : {};
app.get('/api/data', (req, res) => res.json(load()));
app.put('/api/data', (req, res) => {
  const d = req.body;
  if (!d || !Array.isArray(d.pages)) return res.status(400).json({ error: 'bad model' });
  fs.writeFileSync(DATA + '.tmp', JSON.stringify(d, null, 1)); fs.renameSync(DATA + '.tmp', DATA);
  res.json({ ok: true });
});
app.get('/api/icons', (req, res) => res.json({ svg: Object.fromEntries(Object.keys(I.ALL).map(k => [k, I.icon(k)])), labels: I.LABELS }));
app.get('/api/printed', (req, res) => res.json(loadPrinted()));
// a label for one cell: text in the part-number slot, the ticked types as icons in the glyph slot
function labelFor(page, key) {
  const cell = page.cells[key] || {}, types = cell.types || [], pn = M.cellText(page, key), S = L.STYLE.drawer;
  // the icons take whatever width the text leaves free (at most one glyph height each); the drawer number stays off the label
  const free = S.len - S.pad - S.pnX - L.textWidth(pn, S.pn) - 1.5;
  return { kind: 'drawer', pn, value: '', specs: '', pinout: null, glyphSvg: I.icons(types), glyphMaxW: Math.max(0.01, Math.min(types.length, free / S.glyphH)),
           generic: true, _n: types.length, _sig: `${pn}|${types.join(',')}` };
}
// POST /api/labels { page, keys: [...] | "all" | "new" } -> PDF
app.post('/api/labels', async (req, res) => {
  const d = load(), page = d.pages.find(p => p.id === req.body.page);
  if (!page) return res.status(404).json({ error: 'no such page' });
  let keys = req.body.keys === 'all' || req.body.keys === 'new' ? M.populated(page) : (req.body.keys || []);
  if (req.body.keys === 'new') { const pr = loadPrinted(); keys = keys.filter(k => pr[`${page.id}|${k}`] !== labelFor(page, k)._sig); }
  const labels = keys.map(k => labelFor(page, k)).filter(l => l._n > 0);
  if (!labels.length) return res.status(400).json({ error: 'nothing to print' });
  L.warnings.length = 0;
  const pdf = await L.pdf(labels);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="labels-${page.id}-${keys.length === 1 ? keys[0].replace(/[^\w.-]+/g, '_') : req.body.keys === 'new' ? 'new' : 'all'}.pdf"`);
  res.setHeader('X-Label-Count', String(labels.length));
  res.send(Buffer.from(pdf));
});
// POST /api/printed { page, keys } marks those labels as printed with their current text
app.post('/api/printed', (req, res) => {
  const d = load(), page = d.pages.find(p => p.id === req.body.page); if (!page) return res.status(404).json({ error: 'no such page' });
  const pr = loadPrinted();
  const keys = req.body.keys === 'all' ? M.populated(page) : (req.body.keys || []);
  for (const k of keys) pr[`${page.id}|${k}`] = labelFor(page, k)._sig;
  fs.writeFileSync(PRINTED, JSON.stringify(pr, null, 1)); res.json({ ok: true, marked: keys.length });
});
// GET /api/preview.png?page=..&key=..  -> a PNG of one label for the on-screen preview
app.get('/api/preview.png', async (req, res) => {
  const d = load(), page = d.pages.find(p => p.id === req.query.page); if (!page) return res.status(404).end();
  const l = labelFor(page, req.query.key);
  res.setHeader('Content-Type', 'image/png'); res.send(await L.renderPng(L.labelSvg('drawer', l)));
});
const port = +process.env.PORT || 8093;
app.listen(port, '127.0.0.1', () => console.log(`fasteners on http://127.0.0.1:${port}`));
