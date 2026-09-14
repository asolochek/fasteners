# Fasteners

A small web app for keeping track of a fastener collection stored in drawer cabinets, and for printing the drawer labels.
Each page is a class of fastener (SAE machine screws, metric machine screws, wood screws, sheet metal screws, …) laid out as
a grid: rows are thread sizes, columns are lengths, and each cell records which head types you have at that size and length,
which drawer they live in, and optionally the drive types and materials. Nuts, lock nuts, washers and lock washers get their
own columns. Labels come out as PDFs sized for 9 mm tape on an Epson LabelWorks LW-PX900 (50 × 7 mm printable strip), in
Futura, with the head/nut/washer icons drawn on the label, and can be sent straight to the printer through a small helper
that runs on the Windows PC the printer is attached to.

![grid](docs/grid.png)

## Running it

Requires Node 18+ and the label renderer from the companion Binner label tooling (`labels.js` and `pinouts.js`, expected at
`/home/aarons/binner-docs/plan-src/`; change the path at the top of `server.js` if yours differs). Futura Medium must be
installed for the labels to render in Futura.

```
npm install
node server.js          # http://127.0.0.1:8093/
```

It binds to localhost. Put a reverse proxy with authentication in front of it (`apache-vhost.conf` is an example with
HTTP basic auth) or reach it through an SSH tunnel: `ssh -L 8093:127.0.0.1:8093 host`. `fasteners.service` is a systemd unit.

The model lives in `data/fasteners.json` and is edited entirely through the page; keep it in git. `data/printed.json`
records what has been printed.

## Using the grid

- **Tabs** switch pages. On a phone the page becomes a picker and one thread size is shown at a time as a list of cards.
- **Cells**: click a head icon to tick it. The row of icons is the page's primary set plus anything else ticked in that cell;
  the **…** at the end offers every other head type for the class. More than nine icons and they shrink.
- **Right-click / long-press a ticked icon** for its detail: its own drawer (when that head lives somewhere other than the
  rest of the cell; a badge on the icon shows it), drive types, and materials per drive. Nuts and washers get materials only.
- **Drawer**: click the drawer line at the bottom of a cell; `12` for an undivided drawer, `12R` / `12F` for the rear or
  front half of a divided one.
- **Rows** are thread sizes (`#4-40`, `1/4-28`, `M6`, `M6x0.75`, or a bare gauge like `#6` on wood and sheet metal pages);
  **Add row…** inserts one in order, × on an empty row removes it. Lengths likewise: **Add length…** takes `7/16`, `0.4375`,
  `1-1/2` or `22`; × on an empty column removes it. **Types…** chooses which head, nut and washer types a page shows.
- **Cabinet** opens an 8 × 8 map of the drawers for the page: grey unassigned, red where a drawer half holds lengths that
  skip one in between.

## Labels

- ⎙ on a cell prints that cell's label; on a row header, every label in the row. **PDF: all** prints the page,
  **PDF: unprinted** only labels that changed since the last **Mark all printed**, **PDF: drawers…** takes a list or ranges
  (`12-16, 20, 30R`) across every page.
- Cells that share a drawer half print as one label: `#10 Washer` with all the washer icons, `#4-40 Nut`, `#8-32/36 × 1/2″`
  when two pitches of one diameter share a drawer, or the size with the lengths listed after it. A cell split over several
  drawers asks which to print.
- Order is by drawer number, rear before front, then the unassigned cells in reading order.
- Without the helper the PDF downloads; print it from Acrobat at actual size on a queue whose defaults are set to 9 mm tape,
  auto length, cut per label. With the helper (`helper/`, see its README) the **Printer…** panel sends labels straight to
  the printer.

## Layout of the repo

`server.js` Express app · `model.js` length series, cell keys, label text, drawer portions · `icons.js` head, nut and
washer icons · `static/index.html` the grid · `static/cabinet.html` the drawer map · `helper/` the Windows print helper ·
`data/` the model.
