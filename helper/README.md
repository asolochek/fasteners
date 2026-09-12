# Label print helper (Windows)

Runs on the PC the Epson LW-PX900 is plugged into and prints PDFs sent to it from the fastener page, silently, using the
printer queue's saved defaults. Nothing to install beyond Python and SumatraPDF.

1. Install Python 3 (python.org, tick "Add to PATH"). The helper prints through Adobe Acrobat / Reader if installed
   (`/t` silent print, which behaves exactly like printing from Acrobat by hand), otherwise Ghostscript (gswin64c, mswinpr2
   device). SumatraPDF is supported as a last resort but it chooses its own paper from the page size and cuts the labels
   short, so don't rely on it. `--backend` / `--exe` override the automatic choice.
2. In Windows *Printers & scanners*, open the LW-PX900's **Printing preferences** and set tape width 9 mm, length Auto,
   cut per label. For the 12 mm box labels add a second queue for the same port (Add printer → use an existing port) and
   set 12 mm there. Name them so they are easy to pick, e.g. `LW-PX900 9mm` and `LW-PX900 12mm`.
3. Start it:  `python print-helper.py --token SOMESECRET`
   (listens on all interfaces, port 8094; `--bind 127.0.0.1` restricts it to this PC). Allow it through Windows Firewall
   when asked so the Mac can reach it. To have it start with Windows, put a shortcut to that command in
   `shell:startup`, or run it with `pythonw` from Task Scheduler.
4. In the fastener page click **Printer…**, enter `http://<pc-ip>:8094`, the token, click *Fetch printers*, pick the 9 mm
   queue, tick *print directly*, Save. Every PDF button then prints instead of downloading; if the helper is not reachable
   the page falls back to the download.

Endpoints, for anything else that wants to print: `GET /printers`, `POST /print?printer=NAME` with the PDF as the body.
