// Side-profile icons for fastener heads, nuts and washers. Same line weight and feel as the pinout glyphs.
// Each icon is drawn in a 100 × 100 box; icons(list) sets several side by side for a label glyph.
const K = '#000', SW = 5;
const shank = (x, y0, y1) => `<line x1="${x}" y1="${y0}" x2="${x}" y2="${y1}" stroke="${K}" stroke-width="${SW * 2.2}" stroke-linecap="butt"/>`;
const threads = (x, y0, y1) => { let g = ''; for (let y = y0 + 6; y < y1 - 2; y += 8) g += `<line x1="${x - 9}" y1="${y}" x2="${x + 9}" y2="${y + 3}" stroke="${K}" stroke-width="2.5"/>`; return g; };
// heads: the head sits at the top, shank goes down
const HEADS = {
  flat:   `<path d="M20 22 H80 L62 44 H38 Z" fill="none" stroke="${K}" stroke-width="${SW}" stroke-linejoin="round"/><line x1="50" y1="22" x2="50" y2="34" stroke="${K}" stroke-width="3.5"/>${shank(50, 44, 92)}${threads(50, 46, 92)}`,
  pan:    `<path d="M24 44 V32 Q24 18 40 18 H60 Q76 18 76 32 V44 Z" fill="none" stroke="${K}" stroke-width="${SW}" stroke-linejoin="round"/><line x1="36" y1="22" x2="64" y2="22" stroke="${K}" stroke-width="3.5"/>${shank(50, 44, 92)}${threads(50, 46, 92)}`,
  socket: `<rect x="26" y="14" width="48" height="30" rx="3" fill="none" stroke="${K}" stroke-width="${SW}"/>${shank(50, 44, 92)}${threads(50, 46, 92)}`,
  button: `<path d="M22 44 Q22 16 50 16 Q78 16 78 44 Z" fill="none" stroke="${K}" stroke-width="${SW}" stroke-linejoin="round"/>${shank(50, 44, 92)}${threads(50, 46, 92)}`,
  hex:    `<path d="M22 20 H78 V44 H22 Z" fill="none" stroke="${K}" stroke-width="${SW}" stroke-linejoin="round"/><line x1="40" y1="20" x2="40" y2="44" stroke="${K}" stroke-width="3"/><line x1="60" y1="20" x2="60" y2="44" stroke="${K}" stroke-width="3"/>${shank(50, 44, 92)}${threads(50, 46, 92)}`,
  nylon:  `<path d="M24 44 V32 Q24 18 40 18 H60 Q76 18 76 32 V44 Z" fill="none" stroke="${K}" stroke-width="${SW}" stroke-linejoin="round" stroke-dasharray="7 5"/><line x1="36" y1="22" x2="64" y2="22" stroke="${K}" stroke-width="3.5"/><line x1="50" y1="44" x2="50" y2="92" stroke="${K}" stroke-width="${SW * 2.2}" stroke-dasharray="7 5"/>`,
  setscrew: `<rect x="38" y="14" width="24" height="78" fill="none" stroke="${K}" stroke-width="${SW}"/>${threads(50, 32, 92)}`,
  // SEMS screw: pan head with a captive lock washer under it (drawn as a wider split ring below the head)
  sems:   `<path d="M26 40 V30 Q26 18 40 18 H60 Q74 18 74 30 V40 Z" fill="none" stroke="${K}" stroke-width="${SW}" stroke-linejoin="round"/><line x1="36" y1="22" x2="64" y2="22" stroke="${K}" stroke-width="3.5"/><path d="M18 40 H82 V50 H62 M38 50 H18 Z" fill="none" stroke="${K}" stroke-width="${SW}" stroke-linejoin="round"/><line x1="18" y1="50" x2="38" y2="50" stroke="${K}" stroke-width="${SW}"/><line x1="62" y1="50" x2="82" y2="50" stroke="${K}" stroke-width="${SW}"/>${shank(50, 50, 92)}${threads(50, 52, 92)}`,
  // shoulder screw: socket head, a wider plain shoulder, then a shorter thread
  shoulder: `<rect x="30" y="10" width="40" height="24" rx="3" fill="none" stroke="${K}" stroke-width="${SW}"/><rect x="38" y="34" width="24" height="34" fill="none" stroke="${K}" stroke-width="${SW}"/>${shank(50, 68, 92)}${threads(50, 68, 92)}`,
  // wood / self-tapping: pointed tip
  wood:   `<path d="M20 22 H80 L62 44 H38 Z" fill="none" stroke="${K}" stroke-width="${SW}" stroke-linejoin="round"/><line x1="50" y1="22" x2="50" y2="34" stroke="${K}" stroke-width="3.5"/><path d="M44 44 V78 L50 94 L56 78 V44 Z" fill="none" stroke="${K}" stroke-width="${SW}"/>${threads(50, 50, 78)}`,
  sheetmetal: `<path d="M24 44 V32 Q24 18 40 18 H60 Q76 18 76 32 V44 Z" fill="none" stroke="${K}" stroke-width="${SW}" stroke-linejoin="round"/><line x1="36" y1="22" x2="64" y2="22" stroke="${K}" stroke-width="3.5"/><path d="M44 44 V78 L50 94 L56 78 V44 Z" fill="none" stroke="${K}" stroke-width="${SW}"/>${threads(50, 50, 78)}`,
};
// nuts and washers: face-on
const NUTS = {
  nut:  `<path d="M50 14 L82 32 V68 L50 86 L18 68 V32 Z" fill="none" stroke="${K}" stroke-width="${SW}" stroke-linejoin="round"/><circle cx="50" cy="50" r="15" fill="none" stroke="${K}" stroke-width="${SW}"/>`,
  thin: `<path d="M50 14 L82 32 V68 L50 86 L18 68 V32 Z" fill="none" stroke="${K}" stroke-width="3" stroke-linejoin="round"/><circle cx="50" cy="50" r="15" fill="none" stroke="${K}" stroke-width="3"/>`,
  lock: `<path d="M50 14 L82 32 V68 L50 86 L18 68 V32 Z" fill="none" stroke="${K}" stroke-width="${SW}" stroke-linejoin="round"/><circle cx="50" cy="50" r="15" fill="none" stroke="${K}" stroke-width="${SW}"/><circle cx="50" cy="50" r="24" fill="none" stroke="${K}" stroke-width="3" stroke-dasharray="4 4"/>`,
  // press-fit (self-clinching) nut, face-on: round body with the knurled clinch collar and a thread bore
  pressfit: `<circle cx="50" cy="50" r="38" fill="none" stroke="${K}" stroke-width="${SW}"/><circle cx="50" cy="50" r="26" fill="none" stroke="${K}" stroke-width="${SW}" stroke-dasharray="5 4"/><circle cx="50" cy="50" r="13" fill="none" stroke="${K}" stroke-width="${SW}"/>`,
  wing: `<path d="M50 14 L82 32 V68 L50 86 L18 68 V32 Z" fill="none" stroke="${K}" stroke-width="${SW}" stroke-linejoin="round"/><circle cx="50" cy="50" r="15" fill="none" stroke="${K}" stroke-width="${SW}"/><path d="M18 50 Q0 30 14 20 M82 50 Q100 30 86 20" fill="none" stroke="${K}" stroke-width="${SW}"/>`,
};
const WASHERS = {
  washer:  `<circle cx="50" cy="50" r="38" fill="none" stroke="${K}" stroke-width="${SW}"/><circle cx="50" cy="50" r="16" fill="none" stroke="${K}" stroke-width="${SW}"/>`,
  fender:  `<circle cx="50" cy="50" r="44" fill="none" stroke="${K}" stroke-width="${SW}"/><circle cx="50" cy="50" r="11" fill="none" stroke="${K}" stroke-width="${SW}"/>`,
  thinw:   `<circle cx="50" cy="50" r="38" fill="none" stroke="${K}" stroke-width="2.5"/><circle cx="50" cy="50" r="16" fill="none" stroke="${K}" stroke-width="2.5"/>`,
  split:   `<path d="M63 14.3 A38 38 0 1 1 37 14.3 L44.5 35 A16 16 0 1 0 55.5 35 Z" fill="none" stroke="${K}" stroke-width="${SW}" stroke-linejoin="round"/><line x1="37" y1="14.3" x2="44.5" y2="35" stroke="${K}" stroke-width="${SW}"/>`,
  nylonw:  `<circle cx="50" cy="50" r="38" fill="none" stroke="${K}" stroke-width="${SW}" stroke-dasharray="7 5"/><circle cx="50" cy="50" r="16" fill="none" stroke="${K}" stroke-width="${SW}" stroke-dasharray="6 4"/>`,
  toothed: `<circle cx="50" cy="50" r="36" fill="none" stroke="${K}" stroke-width="${SW}"/><circle cx="50" cy="50" r="16" fill="none" stroke="${K}" stroke-width="${SW}"/>${Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6, c = Math.cos(a), s = Math.sin(a); return `<line x1="${(50 + 36 * c).toFixed(1)}" y1="${(50 + 36 * s).toFixed(1)}" x2="${(50 + 46 * c).toFixed(1)}" y2="${(50 + 46 * s).toFixed(1)}" stroke="${K}" stroke-width="4"/>`; }).join('')}`,
};
const ALL = { ...HEADS, ...NUTS, ...WASHERS };
const LABELS = { flat: 'Flat', pan: 'Pan', socket: 'Socket cap', button: 'Button', hex: 'Hex', nylon: 'Nylon', setscrew: 'Set screw', shoulder: 'Shoulder', sems: 'Captive lock washer', wood: 'Wood', sheetmetal: 'Sheet metal',
  nut: 'Nut', thin: 'Thin nut', lock: 'Lock nut', pressfit: 'Press-fit nut', wing: 'Wing nut', washer: 'Washer', fender: 'Fender', thinw: 'Thin washer', nylonw: 'Plastic washer', split: 'Split lock', toothed: 'Toothed lock' };
// one icon as a standalone SVG
const icon = name => `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">${ALL[name] || ''}</svg>`;
// several icons in a row, for the label glyph slot
const icons = names => `<svg viewBox="0 0 ${100 * names.length} 100" xmlns="http://www.w3.org/2000/svg">${names.map((n, i) => `<g transform="translate(${i * 100} 0)">${ALL[n] || ''}</g>`).join('')}</svg>`;
module.exports = { HEADS, NUTS, WASHERS, ALL, LABELS, icon, icons };
