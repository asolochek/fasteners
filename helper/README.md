# Label print helper (Windows)

Runs on the PC the Epson LW-PX900 is plugged into and prints the label PDFs the Partstore page sends, silently, using the
printer queue's saved defaults. It connects out to the Partstore server and collects print jobs from it, so nothing needs to
reach the PC from outside (no firewall rule, no certificate) and the page can be served over https.

1. Install Python 3 (python.org, tick "Add to PATH"). The helper prints through Adobe Acrobat / Reader if installed
   (`/t` silent print, which behaves exactly like printing from Acrobat by hand), otherwise Ghostscript (gswin64c, mswinpr2
   device). SumatraPDF is supported as a last resort but it chooses its own paper from the page size and cuts the labels
   short, so don't rely on it. `--backend` / `--exe` override the automatic choice.
2. In Windows *Printers & scanners*, open the LW-PX900's **Printing preferences** and set tape width 9 mm, length Auto,
   cut per label. For the 18 mm bin labels add a second queue for the same port (Add printer → use an existing port) and
   set 18 mm there. Name them so they are easy to pick, e.g. `LW-PX900 9mm` and `LW-PX900 18mm`. A driver update can reset
   these defaults; check them first if labels come out the wrong size.
3. Start it:  `python print-helper.py --server https://partstore.example.org --token TOKEN`
   where TOKEN is the contents of `data/helper.token` on the server. To have it start with Windows, run that command with
   `pythonw` from a Task Scheduler logon task; it then logs to `print-helper.log` beside the script. It reconnects by itself.
4. In the Partstore page click **Printer…**: it shows whether the helper is connected and the PC's printer queues. Pick the
   9 mm and 18 mm queues, tick *print directly*, Save. Every PDF button then prints instead of downloading; if the helper is
   not connected the page falls back to the download.

Without `--server` the helper listens on the LAN instead (port 8094, `--bind`, optional `--token`): `GET /printers`,
`POST /print?printer=NAME` with the PDF as the body, for anything else that wants to print.
