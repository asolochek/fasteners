# Fasteners

A grid per fastener class (SAE machine, metric machine, wood, …): rows are thread sizes, columns are lengths, each cell holds the head
types present plus a drawer number. Nut cells per thread size, washer cells per diameter (spanning the rows that share it).
Generates 9 mm drawer labels in the same format as the transistor drawers (Futura, 50 mm, icons in the glyph slot) via
`~/binner-docs/plan-src/labels.js`.

- `node server.js` — listens on 127.0.0.1:8093 (PORT). Apache proxies and authenticates (`apache-vhost.conf`); `fasteners.service` for systemd.
- `data/fasteners.json` — the model (edited through the page; keep it in git). `data/printed.json` — what has been printed.
- Buttons: *Add length…* inserts an odd length (× on a header removes an empty one); *PDF: unprinted* / *PDF: all*; *Mark all printed*
  after a print run so the next *unprinted* file only holds new or changed labels. The ⎙ on a cell makes a one-off PDF (hover previews it).
- `icons.js` — head, nut and washer icons; `model.js` — length series, cell keys, label text.
