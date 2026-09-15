// Copyright (C) 2026 Aaron Solochek. Licensed under the GNU GPL v3; see LICENSE.
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
  // oval (raised countersunk): flat head with a domed top
  oval:   `<path d="M20 30 Q50 8 80 30 L62 48 H38 Z" fill="none" stroke="${K}" stroke-width="${SW}" stroke-linejoin="round"/><line x1="50" y1="24" x2="50" y2="38" stroke="${K}" stroke-width="3.5"/>${shank(50, 48, 92)}${threads(50, 50, 92)}`,
  // flange (washer) head machine screw
  flange: `<path d="M30 36 V30 Q30 18 42 18 H58 Q70 18 70 30 V36 Z" fill="none" stroke="${K}" stroke-width="${SW}" stroke-linejoin="round"/><path d="M16 36 H84 V44 H16 Z" fill="none" stroke="${K}" stroke-width="${SW}" stroke-linejoin="round"/>${shank(50, 44, 92)}${threads(50, 46, 92)}`,
  // thumb screw: tall knurled head
  thumb:  `<path d="M30 14 H70 V44 H30 Z" fill="none" stroke="${K}" stroke-width="${SW}" stroke-linejoin="round"/>${[36, 43, 50, 57, 64].map(x => `<line x1="${x}" y1="18" x2="${x}" y2="40" stroke="${K}" stroke-width="2.5"/>`).join('')}${shank(50, 44, 92)}${threads(50, 46, 92)}`,
  // carriage bolt: domed head over a square neck, no drive
  carriage: `<path d="M20 30 Q50 6 80 30 Z" fill="none" stroke="${K}" stroke-width="${SW}" stroke-linejoin="round"/><rect x="40" y="30" width="20" height="14" fill="none" stroke="${K}" stroke-width="${SW}"/>${shank(50, 44, 92)}${threads(50, 46, 92)}`,
  // cheese head: cylindrical, flat top, slotted (DIN 84)
  cheese: `<rect x="30" y="16" width="40" height="28" fill="none" stroke="${K}" stroke-width="${SW}"/><line x1="50" y1="16" x2="50" y2="30" stroke="${K}" stroke-width="3.5"/>${shank(50, 44, 92)}${threads(50, 46, 92)}`,
  // fillister head: cylindrical with a domed top
  fillister: `<path d="M30 44 V26 Q30 14 50 14 Q70 14 70 26 V44 Z" fill="none" stroke="${K}" stroke-width="${SW}" stroke-linejoin="round"/><line x1="50" y1="16" x2="50" y2="30" stroke="${K}" stroke-width="3.5"/>${shank(50, 44, 92)}${threads(50, 46, 92)}`,
  // truss: wide, low dome
  truss:  `<path d="M14 44 Q14 24 50 22 Q86 24 86 44 Z" fill="none" stroke="${K}" stroke-width="${SW}" stroke-linejoin="round"/>${shank(50, 44, 92)}${threads(50, 46, 92)}`,
  buttonsm: `<path d="M22 44 Q22 16 50 16 Q78 16 78 44 Z" fill="none" stroke="${K}" stroke-width="${SW}" stroke-linejoin="round"/><path d="M44 44 V78 L50 94 L56 78 V44 Z" fill="none" stroke="${K}" stroke-width="${SW}"/>${threads(50, 50, 78)}`,
  trusssm:  `<path d="M14 44 Q14 24 50 22 Q86 24 86 44 Z" fill="none" stroke="${K}" stroke-width="${SW}" stroke-linejoin="round"/><path d="M44 44 V78 L50 94 L56 78 V44 Z" fill="none" stroke="${K}" stroke-width="${SW}"/>${threads(50, 50, 78)}`,
  // trim (finish) head: a small head that sinks into the wood
  trim:   `<path d="M38 22 H62 L56 36 H44 Z" fill="none" stroke="${K}" stroke-width="${SW}" stroke-linejoin="round"/><path d="M44 36 V78 L50 94 L56 78 V36 Z" fill="none" stroke="${K}" stroke-width="${SW}"/>${threads(50, 42, 78)}`,
  // flange (washer) head: pan head on a wide flat flange
  flangesm: `<path d="M30 36 V30 Q30 18 42 18 H58 Q70 18 70 30 V36 Z" fill="none" stroke="${K}" stroke-width="${SW}" stroke-linejoin="round"/><path d="M16 36 H84 V44 H16 Z" fill="none" stroke="${K}" stroke-width="${SW}" stroke-linejoin="round"/><path d="M44 44 V78 L50 94 L56 78 V44 Z" fill="none" stroke="${K}" stroke-width="${SW}"/>${threads(50, 50, 78)}`,
  hexsm:  `<path d="M22 20 H78 V38 H22 Z" fill="none" stroke="${K}" stroke-width="${SW}" stroke-linejoin="round"/><line x1="40" y1="20" x2="40" y2="38" stroke="${K}" stroke-width="3"/><line x1="60" y1="20" x2="60" y2="38" stroke="${K}" stroke-width="3"/><line x1="16" y1="44" x2="84" y2="44" stroke="${K}" stroke-width="${SW}"/><path d="M44 44 V78 L50 94 L56 78 V44 Z" fill="none" stroke="${K}" stroke-width="${SW}"/>${threads(50, 50, 78)}`,
  sheetmetal: `<path d="M24 44 V32 Q24 18 40 18 H60 Q76 18 76 32 V44 Z" fill="none" stroke="${K}" stroke-width="${SW}" stroke-linejoin="round"/><line x1="36" y1="22" x2="64" y2="22" stroke="${K}" stroke-width="3.5"/><path d="M44 44 V78 L50 94 L56 78 V44 Z" fill="none" stroke="${K}" stroke-width="${SW}"/>${threads(50, 50, 78)}`,
};
// nuts and washers: face-on
const NUTS = {
  nut:  `<path d="M50 14 L82 32 V68 L50 86 L18 68 V32 Z" fill="none" stroke="${K}" stroke-width="${SW}" stroke-linejoin="round"/><circle cx="50" cy="50" r="15" fill="none" stroke="${K}" stroke-width="${SW}"/>`,
  thin: `<path d="M50 14 L82 32 V68 L50 86 L18 68 V32 Z" fill="none" stroke="${K}" stroke-width="3" stroke-linejoin="round"/><circle cx="50" cy="50" r="15" fill="none" stroke="${K}" stroke-width="3"/>`,
  lock: `<path d="M50 14 L82 32 V68 L50 86 L18 68 V32 Z" fill="none" stroke="${K}" stroke-width="${SW}" stroke-linejoin="round"/><circle cx="50" cy="50" r="15" fill="none" stroke="${K}" stroke-width="${SW}"/><circle cx="50" cy="50" r="24" fill="none" stroke="${K}" stroke-width="3" stroke-dasharray="4 4"/>`,
  nylock: `<path d="M50 14 L82 32 V68 L50 86 L18 68 V32 Z" fill="none" stroke="${K}" stroke-width="${SW}" stroke-linejoin="round"/><circle cx="50" cy="50" r="15" fill="none" stroke="${K}" stroke-width="${SW}"/><circle cx="50" cy="50" r="22" fill="none" stroke="${K}" stroke-width="${SW}" stroke-dasharray="7 5"/>`,
  // serrated-flange (toothed) lock nut, face-on: round flange with teeth, hex inside, bore
  toothednut: `<circle cx="50" cy="50" r="40" fill="none" stroke="${K}" stroke-width="${SW}"/>${Array.from({ length: 16 }, (_, i) => { const a = i * Math.PI / 8, c = Math.cos(a), s = Math.sin(a); return `<line x1="${(50 + 40 * c).toFixed(1)}" y1="${(50 + 40 * s).toFixed(1)}" x2="${(50 + 47 * c).toFixed(1)}" y2="${(50 + 47 * s).toFixed(1)}" stroke="${K}" stroke-width="3.5"/>`; }).join('')}<path d="M50 24 L72 37 V63 L50 76 L28 63 V37 Z" fill="none" stroke="${K}" stroke-width="${SW}" stroke-linejoin="round"/><circle cx="50" cy="50" r="11" fill="none" stroke="${K}" stroke-width="${SW}"/>`,
  // press-fit (self-clinching) nut, face-on: round body with the knurled clinch collar and a thread bore
  pressfit: `<circle cx="50" cy="50" r="38" fill="none" stroke="${K}" stroke-width="${SW}"/><circle cx="50" cy="50" r="26" fill="none" stroke="${K}" stroke-width="${SW}" stroke-dasharray="5 4"/><circle cx="50" cy="50" r="13" fill="none" stroke="${K}" stroke-width="${SW}"/>`,
  square: `<rect x="18" y="18" width="64" height="64" rx="3" fill="none" stroke="${K}" stroke-width="${SW}"/><circle cx="50" cy="50" r="15" fill="none" stroke="${K}" stroke-width="${SW}"/>`,
  wing: `<path d="M50 14 L82 32 V68 L50 86 L18 68 V32 Z" fill="none" stroke="${K}" stroke-width="${SW}" stroke-linejoin="round"/><circle cx="50" cy="50" r="15" fill="none" stroke="${K}" stroke-width="${SW}"/><path d="M18 50 Q0 30 14 20 M82 50 Q100 30 86 20" fill="none" stroke="${K}" stroke-width="${SW}"/>`,
};
const WASHERS = {
  washer:  `<circle cx="50" cy="50" r="38" fill="none" stroke="${K}" stroke-width="${SW}"/><circle cx="50" cy="50" r="16" fill="none" stroke="${K}" stroke-width="${SW}"/>`,
  fender:  `<circle cx="50" cy="50" r="44" fill="none" stroke="${K}" stroke-width="${SW}"/><circle cx="50" cy="50" r="11" fill="none" stroke="${K}" stroke-width="${SW}"/>`,
  thinw:   `<circle cx="50" cy="50" r="38" fill="none" stroke="${K}" stroke-width="2.5"/><circle cx="50" cy="50" r="16" fill="none" stroke="${K}" stroke-width="2.5"/>`,
  split:   `<path d="M63 14.3 A38 38 0 1 1 37 14.3 L44.5 35 A16 16 0 1 0 55.5 35 Z" fill="none" stroke="${K}" stroke-width="${SW}" stroke-linejoin="round"/><line x1="37" y1="14.3" x2="44.5" y2="35" stroke="${K}" stroke-width="${SW}"/>`,
  nylonw:  `<circle cx="50" cy="50" r="38" fill="none" stroke="${K}" stroke-width="${SW}" stroke-dasharray="7 5"/><circle cx="50" cy="50" r="16" fill="none" stroke="${K}" stroke-width="${SW}" stroke-dasharray="6 4"/>`,
  // undersized (small outside diameter) washer
  undersized: `<circle cx="50" cy="50" r="29" fill="none" stroke="${K}" stroke-width="${SW}"/><circle cx="50" cy="50" r="16" fill="none" stroke="${K}" stroke-width="${SW}"/>`,
  // Belleville / spring washer: the cone edge as a middle ring
  spring:  `<circle cx="50" cy="50" r="38" fill="none" stroke="${K}" stroke-width="${SW}"/><circle cx="50" cy="50" r="27" fill="none" stroke="${K}" stroke-width="3" stroke-dasharray="6 4"/><circle cx="50" cy="50" r="16" fill="none" stroke="${K}" stroke-width="${SW}"/>`,
  // internal tooth: teeth point into the bore
  inttooth: `<circle cx="50" cy="50" r="38" fill="none" stroke="${K}" stroke-width="${SW}"/><circle cx="50" cy="50" r="20" fill="none" stroke="${K}" stroke-width="${SW}"/>${Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6, c = Math.cos(a), s = Math.sin(a); return `<line x1="${(50 + 20 * c).toFixed(1)}" y1="${(50 + 20 * s).toFixed(1)}" x2="${(50 + 11 * c).toFixed(1)}" y2="${(50 + 11 * s).toFixed(1)}" stroke="${K}" stroke-width="4"/>`; }).join('')}`,
  // cup (countersunk finishing) washer: the cone shown as a middle ring
  cup:     `<circle cx="50" cy="50" r="38" fill="none" stroke="${K}" stroke-width="${SW}"/><circle cx="50" cy="50" r="27" fill="none" stroke="${K}" stroke-width="${SW}"/><circle cx="50" cy="50" r="14" fill="none" stroke="${K}" stroke-width="${SW}"/>`,
  // sleeved (shoulder) washer: a thick sleeve around the bore
  sleeved: `<circle cx="50" cy="50" r="38" fill="none" stroke="${K}" stroke-width="${SW}"/><circle cx="50" cy="50" r="19" fill="none" stroke="${K}" stroke-width="9"/>`,
  toothed: `<circle cx="50" cy="50" r="36" fill="none" stroke="${K}" stroke-width="${SW}"/><circle cx="50" cy="50" r="16" fill="none" stroke="${K}" stroke-width="${SW}"/>${Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6, c = Math.cos(a), s = Math.sin(a); return `<line x1="${(50 + 36 * c).toFixed(1)}" y1="${(50 + 36 * s).toFixed(1)}" x2="${(50 + 46 * c).toFixed(1)}" y2="${(50 + 46 * s).toFixed(1)}" stroke="${K}" stroke-width="4"/>`; }).join('')}`,
  // internal + external tooth: outer ring r36 with teeth out to 46, bore r16 with teeth in to 8
  inextooth: `<circle cx="50" cy="50" r="36" fill="none" stroke="${K}" stroke-width="${SW}"/><circle cx="50" cy="50" r="17" fill="none" stroke="${K}" stroke-width="${SW}"/>${Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6, c = Math.cos(a), s = Math.sin(a); return `<line x1="${(50 + 36 * c).toFixed(1)}" y1="${(50 + 36 * s).toFixed(1)}" x2="${(50 + 46 * c).toFixed(1)}" y2="${(50 + 46 * s).toFixed(1)}" stroke="${K}" stroke-width="4"/><line x1="${(50 + 17 * c).toFixed(1)}" y1="${(50 + 17 * s).toFixed(1)}" x2="${(50 + 9 * c).toFixed(1)}" y2="${(50 + 9 * s).toFixed(1)}" stroke="${K}" stroke-width="4"/>`; }).join('')}`,
};
// other hardware that lives in drawers: connectors, test leads, jumpers. Face or side views, same weight as the fastener icons.
const dot = (x, y, r = 4) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${K}"/>`;
const ring = (x, y, r, sw = SW) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${K}" stroke-width="${sw}"/>`;
const box = (x, y, w, h, rx = 4, sw = SW) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="none" stroke="${K}" stroke-width="${sw}"/>`;
const bananaPin = (x, y0, y1) => `<path d="M${x - 6} ${y0} Q${x - 15} ${(y0 + y1) / 2} ${x - 6} ${y1 - 6} L${x} ${y1} L${x + 6} ${y1 - 6} Q${x + 15} ${(y0 + y1) / 2} ${x + 6} ${y0} Z" fill="none" stroke="${K}" stroke-width="${SW}" stroke-linejoin="round"/><line x1="${x}" y1="${y0 + 2}" x2="${x}" y2="${y1 - 8}" stroke="${K}" stroke-width="3"/>`;
const MISC = {
  // banana plug: insulated handle on top, sprung pin below
  banana:      `${box(34, 6, 32, 38, 5)}<line x1="50" y1="44" x2="50" y2="50" stroke="${K}" stroke-width="${SW}"/>${bananaPin(50, 50, 94)}`,
  // stackable: the handle has a jack in its top
  bananastack: `${box(34, 6, 32, 38, 5)}<ellipse cx="50" cy="6" rx="9" ry="3.5" fill="none" stroke="${K}" stroke-width="3.5"/>${ring(50, 22, 7, 4)}<line x1="50" y1="44" x2="50" y2="50" stroke="${K}" stroke-width="${SW}"/>${bananaPin(50, 50, 94)}`,
  // dual banana: one block, two pins at 3/4" spacing
  bananadual:  `${box(12, 8, 76, 34, 5)}<line x1="18" y1="20" x2="18" y2="30" stroke="${K}" stroke-width="3"/><line x1="32" y1="42" x2="32" y2="48" stroke="${K}" stroke-width="${SW}"/><line x1="68" y1="42" x2="68" y2="48" stroke="${K}" stroke-width="${SW}"/>${bananaPin(32, 48, 92)}${bananaPin(68, 48, 92)}`,
  // banana jack: a panel bushing with the hole on top
  bananajack:  `<ellipse cx="50" cy="20" rx="17" ry="6" fill="none" stroke="${K}" stroke-width="${SW}"/><ellipse cx="50" cy="20" rx="6" ry="2.5" fill="${K}"/><line x1="33" y1="20" x2="33" y2="60" stroke="${K}" stroke-width="${SW}"/><line x1="67" y1="20" x2="67" y2="60" stroke="${K}" stroke-width="${SW}"/>${box(18, 60, 64, 12, 2)}<line x1="42" y1="72" x2="42" y2="92" stroke="${K}" stroke-width="${SW}"/><line x1="58" y1="72" x2="58" y2="92" stroke="${K}" stroke-width="${SW}"/>${threads(50, 74, 92)}`,
  // binding post: knurled cap, cross-drilled stem, base
  bindingpost: `${box(30, 8, 40, 26, 5)}${[36, 42, 48, 54, 60, 66].map(x => `<line x1="${x}" y1="12" x2="${x}" y2="30" stroke="${K}" stroke-width="2.5"/>`).join('')}<line x1="40" y1="34" x2="40" y2="70" stroke="${K}" stroke-width="${SW}"/><line x1="60" y1="34" x2="60" y2="70" stroke="${K}" stroke-width="${SW}"/>${ring(50, 52, 6, 4)}${box(20, 70, 60, 14, 2)}<line x1="50" y1="84" x2="50" y2="94" stroke="${K}" stroke-width="${SW * 2}"/>`,
  // barrier terminal strip: four screw terminals
  terminalstrip: `${box(4, 30, 92, 40, 3)}${[27, 50, 73].map(x => `<line x1="${x}" y1="30" x2="${x}" y2="70" stroke="${K}" stroke-width="3.5"/>`).join('')}${[15.5, 38.5, 61.5, 84.5].map(x => ring(x, 50, 7, 4) + `<line x1="${x - 4}" y1="46" x2="${x + 4}" y2="54" stroke="${K}" stroke-width="3"/>`).join('')}`,
  // 100 mil shunt: the jumper block on two header pins
  shunt:       `${box(28, 30, 44, 30, 4)}<line x1="50" y1="30" x2="50" y2="22" stroke="${K}" stroke-width="${SW}"/><line x1="44" y1="22" x2="56" y2="22" stroke="${K}" stroke-width="${SW}"/><line x1="39" y1="60" x2="39" y2="92" stroke="${K}" stroke-width="${SW * 1.4}"/><line x1="61" y1="60" x2="61" y2="92" stroke="${K}" stroke-width="${SW * 1.4}"/>${box(28, 84, 44, 10, 2, 4)}`,
  // mini grabber: slim body, hook out the tip, plunger on the back
  minigrabber: `${box(40, 34, 20, 50, 6)}<line x1="46" y1="84" x2="46" y2="94" stroke="${K}" stroke-width="3.5"/><line x1="54" y1="84" x2="54" y2="94" stroke="${K}" stroke-width="3.5"/><line x1="50" y1="34" x2="50" y2="22" stroke="${K}" stroke-width="3.5"/><path d="M50 22 Q50 8 60 8 Q68 8 68 16 Q68 22 62 22" fill="none" stroke="${K}" stroke-width="3.5" stroke-linecap="round"/><line x1="50" y1="40" x2="50" y2="76" stroke="${K}" stroke-width="2.5"/>`,
  // alligator clip: serrated jaws, spring, sleeve
  alligator:   `<path d="M26 50 L82 20 L78 34 L48 50 L78 66 L82 80 Z" fill="none" stroke="${K}" stroke-width="${SW}" stroke-linejoin="round"/>${[56, 64, 72].map(x => `<line x1="${x}" y1="${50 - (x - 48) * 0.53}" x2="${x + 2}" y2="${50 - (x - 48) * 0.53 - 6}" stroke="${K}" stroke-width="3"/><line x1="${x}" y1="${50 + (x - 48) * 0.53}" x2="${x + 2}" y2="${50 + (x - 48) * 0.53 + 6}" stroke="${K}" stroke-width="3"/>`).join('')}${box(6, 38, 20, 24, 4)}${ring(20, 50, 4, 3)}`,
  // DB9 face: D shell, 5 over 4
  db9:         `<path d="M14 30 H86 Q92 30 90 36 L82 66 Q80 70 76 70 H24 Q20 70 18 66 L10 36 Q8 30 14 30 Z" fill="none" stroke="${K}" stroke-width="${SW}" stroke-linejoin="round"/>${[28, 39, 50, 61, 72].map(x => dot(x, 44)).join('')}${[33.5, 44.5, 55.5, 66.5].map(x => dot(x, 57)).join('')}`,
  // flat flex cable end: the ribbon with its exposed fingers
  ffc:         `${box(30, 6, 40, 88, 3)}<line x1="30" y1="56" x2="70" y2="56" stroke="${K}" stroke-width="3.5"/>${[37, 43.5, 50, 56.5, 63].map(x => `<line x1="${x}" y1="62" x2="${x}" y2="90" stroke="${K}" stroke-width="3"/>`).join('')}`,
  // RC power connectors, face on
  xt60:        `<path d="M20 30 L30 14 H70 L80 30 V86 H20 Z" fill="none" stroke="${K}" stroke-width="${SW}" stroke-linejoin="round"/>${ring(37, 56, 9)}${ring(63, 56, 9)}<text x="50" y="30" font-family="sans-serif" font-size="13" font-weight="700" text-anchor="middle" fill="${K}">XT60</text>`,
  xt30:        `<path d="M28 36 L36 24 H64 L72 36 V80 H28 Z" fill="none" stroke="${K}" stroke-width="${SW}" stroke-linejoin="round"/>${ring(41, 60, 6, 4)}${ring(59, 60, 6, 4)}<text x="50" y="45" font-family="sans-serif" font-size="11" font-weight="700" text-anchor="middle" fill="${K}">XT30</text>`,
  deans:       `${box(20, 14, 60, 72, 8)}<rect x="30" y="28" width="40" height="9" fill="${K}"/><rect x="45.5" y="46" width="9" height="30" fill="${K}"/>`,
  jstxh:       `${box(22, 26, 56, 50, 3)}<rect x="40" y="18" width="20" height="8" fill="none" stroke="${K}" stroke-width="4"/>${box(31, 40, 14, 22, 1, 4)}${box(55, 40, 14, 22, 1, 4)}`,
  ec3:         `${box(28, 12, 44, 76, 6)}${ring(50, 34, 9)}${ring(50, 66, 9)}<text x="50" y="96" font-family="sans-serif" font-size="12" font-weight="700" text-anchor="middle" fill="${K}"></text>`,
  tamiya:      `${box(20, 28, 60, 48, 4)}<rect x="42" y="18" width="16" height="10" fill="none" stroke="${K}" stroke-width="4"/>${box(28, 38, 18, 26, 2, 4)}${box(54, 38, 18, 26, 2, 4)}`,
};
const ALL = { ...HEADS, ...NUTS, ...WASHERS, ...MISC };
// icon groups for the glyph picker (list pages)
const GROUPS = { 'Connectors & test': Object.keys(MISC), Heads: Object.keys(HEADS).filter(k => !['nylon'].includes(k)), Nuts: Object.keys(NUTS), Washers: Object.keys(WASHERS).filter(k => !['nylonw'].includes(k)) };
const LABELS = { flat: 'Flat', oval: 'Oval', pan: 'Pan', socket: 'Socket cap', button: 'Button', hex: 'Hex', flange: 'Flange', thumb: 'Thumb', carriage: 'Carriage bolt', cheese: 'Cheese', fillister: 'Fillister', setscrew: 'Set screw', shoulder: 'Shoulder', sems: 'Captive lock washer', truss: 'Truss', wood: 'Flat, pointed', sheetmetal: 'Pan, pointed', buttonsm: 'Button, pointed', trusssm: 'Truss, pointed', trim: 'Trim head', flangesm: 'Flange head', hexsm: 'Hex washer, pointed',
  nut: 'Nut', thin: 'Jam nut (thin)', lock: 'Lock nut (prevailing torque)', nylock: 'Nylon insert', toothednut: 'Toothed flange', pressfit: 'Press-fit nut', square: 'Square nut', wing: 'Wing nut', washer: 'Washer', fender: 'Fender', thinw: 'Thin washer', undersized: 'Undersized (small OD)', cup: 'Cup', sleeved: 'Sleeved', split: 'Split', spring: 'Spring', inttooth: 'Internal tooth', toothed: 'External tooth', inextooth: 'Internal + external tooth',
  banana: 'Banana plug', bananastack: 'Stackable banana plug', bananadual: 'Dual banana plug', bananajack: 'Banana jack', bindingpost: 'Binding post', terminalstrip: 'Terminal strip', shunt: '100 mil shunt', minigrabber: 'Mini grabber', alligator: 'Alligator clip', db9: 'DB9', ffc: 'Flat flex cable end', xt60: 'XT60', xt30: 'XT30', deans: 'Deans / T-plug', jstxh: 'JST-XH', ec3: 'EC3', tamiya: 'Tamiya' };
// one icon as a standalone SVG
const icon = name => `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">${ALL[name] || ''}</svg>`;
// several icons for the label glyph slot, in one or two rows (rows = 2 puts ceil(n/2) per row, the second row left-aligned)
const icons = (names, rows = 1) => {
  const cols = Math.ceil(names.length / rows);
  return `<svg viewBox="0 0 ${100 * cols} ${100 * rows}" xmlns="http://www.w3.org/2000/svg">${names.map((n, i) => `<g transform="translate(${(i % cols) * 100} ${Math.floor(i / cols) * 100})">${ALL[n] || ''}</g>`).join('')}</svg>`;
};
// choose one or two rows for a glyph slot `h` high with `w` of width free: whichever gives the bigger icons
function layout(names, w, h) {
  const n = names.length; if (!n) return { rows: 1, size: 0, maxW: 0.01 };
  const one = Math.min(h, w / n), two = Math.min(h / 2, w / Math.ceil(n / 2));
  const rows = two > one ? 2 : 1, cols = Math.ceil(n / rows);
  return { rows, size: rows === 2 ? two : one, maxW: Math.max(0.01, (cols / rows) * Math.min(1, (rows === 2 ? two * 2 : one) / h)) };
}
module.exports = { HEADS, NUTS, WASHERS, MISC, ALL, LABELS, GROUPS, icon, icons, layout };
