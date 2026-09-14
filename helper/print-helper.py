#!/usr/bin/env python3
# Copyright (C) 2026 Aaron Solochek. Licensed under the GNU GPL v3; see LICENSE.
"""Print helper for the label printer. Runs on the Windows PC the Epson LW-PX900 is attached to and prints PDFs that the
fastener page (or anything else on the LAN) POSTs to it, silently, on a named printer queue using that queue's saved defaults
(tape width, auto length, cut per label - set once in the queue's Printing Preferences, one queue per tape width).

    python print-helper.py [--port 8094] [--token SECRET] [--backend acrobat|gs|sumatra] [--exe "C:\\path\\to\\program.exe"] [--bind 0.0.0.0]

Backends, tried in this order unless --backend is given:
    acrobat  Adobe Acrobat / Reader  "/t file printer" - prints exactly like File > Print with the queue defaults (what works by hand)
    gs       Ghostscript (gswin64c) mswinpr2 device  - hands the page to the queue at 1:1, no paper matching
    sumatra  SumatraPDF -print-to  - NOT suitable for the label queues: it picks a driver paper by page size (cuts labels short)

Endpoints (CORS open, so a browser page served from elsewhere can call them):
    GET  /printers                         -> JSON list of installed printer names + which backend is in use
    POST /print?printer=NAME[&token=..]    -> body = the PDF; prints it, returns {"ok":true,"pages":N,"backend":..}
    GET  /                                  -> a tiny status page
Python 3.8+ standard library only.
"""
import argparse, json, os, shutil, subprocess, sys, tempfile, time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

ARGS = None

HERE = os.path.dirname(os.path.abspath(__file__))
def first_existing(cands):
    for c in cands:
        if c and os.path.exists(c): return c
    return None
def env(v): return os.path.expandvars(v)
CANDIDATES = {
    'acrobat': lambda: first_existing([env(r'%ProgramFiles%\Adobe\Acrobat DC\Acrobat\Acrobat.exe'), env(r'%ProgramFiles(x86)%\Adobe\Acrobat DC\Acrobat\Acrobat.exe'),
                                       env(r'%ProgramFiles%\Adobe\Acrobat Reader DC\Reader\AcroRd32.exe'), env(r'%ProgramFiles(x86)%\Adobe\Acrobat Reader DC\Reader\AcroRd32.exe'),
                                       env(r'%ProgramFiles%\Adobe\Acrobat\Acrobat\Acrobat.exe'), shutil.which('Acrobat.exe'), shutil.which('AcroRd32.exe')]),
    'gs':      lambda: first_existing([shutil.which('gswin64c'), shutil.which('gswin32c')] +
                                      sorted(__import__('glob').glob(env(r'%ProgramFiles%\gs\gs*\bin\gswin64c.exe')), reverse=True) + [os.path.join(HERE, 'gswin64c.exe')]),
    'sumatra': lambda: first_existing([shutil.which('SumatraPDF'), shutil.which('SumatraPDF.exe'), env(r'%LOCALAPPDATA%\SumatraPDF\SumatraPDF.exe'),
                                       env(r'%ProgramFiles%\SumatraPDF\SumatraPDF.exe'), env(r'%ProgramFiles(x86)%\SumatraPDF\SumatraPDF.exe'), os.path.join(HERE, 'SumatraPDF.exe')]),
}
def backend():
    """(name, exe) of the print program to use"""
    if ARGS.backend:
        exe = ARGS.exe or CANDIDATES[ARGS.backend](); return (ARGS.backend, exe)
    for name in ('acrobat', 'gs', 'sumatra'):
        exe = CANDIDATES[name]()
        if exe: return (name, exe)
    return (None, None)
def print_pdf(name, exe, path, printer):
    """run the backend; returns (ok, message)"""
    if name == 'acrobat':
        # /t = print to the named printer silently; Acrobat stays open afterwards, so give it a moment and close it
        p = subprocess.Popen([exe, '/n', '/t', path, printer])
        try: p.wait(timeout=120)
        except subprocess.TimeoutExpired: p.kill()
        return (True, 'acrobat')
    if name == 'gs':
        r = subprocess.run([exe, '-dBATCH', '-dNOPAUSE', '-dNoCancel', '-dNOSAFER', '-q', '-sDEVICE=mswinpr2', f'-sOutputFile=%printer%{printer}', path], capture_output=True, text=True, timeout=300)
        return (r.returncode == 0, (r.stderr or r.stdout).strip()[:300] or 'gs')
    r = subprocess.run([exe, '-print-to', printer, '-print-settings', 'noscale', '-silent', path], capture_output=True, text=True, timeout=300)
    return (r.returncode == 0, (r.stderr or r.stdout).strip()[:300] or 'sumatra')

def printers():
    if sys.platform != 'win32': return []
    try:
        out = subprocess.run(['powershell', '-NoProfile', '-Command', 'Get-Printer | Select-Object -ExpandProperty Name'], capture_output=True, text=True, timeout=20).stdout
        return [l.strip() for l in out.splitlines() if l.strip()]
    except Exception:
        try:
            import winreg
            k = winreg.OpenKey(winreg.HKEY_CURRENT_USER, r'Software\Microsoft\Windows NT\CurrentVersion\Devices')
            names = []
            i = 0
            while True:
                try: names.append(winreg.EnumValue(k, i)[0]); i += 1
                except OSError: break
            return names
        except Exception:
            return []

def count_pages(data):
    return max(1, data.count(b'/Type /Page') - data.count(b'/Type /Pages')) if b'/Type /Page' in data else 0

class H(BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-Token')
    def _json(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code); self._cors(); self.send_header('Content-Type', 'application/json'); self.send_header('Content-Length', str(len(body))); self.end_headers(); self.wfile.write(body)
    def _auth(self, q):
        if not ARGS.token: return True
        return (q.get('token', [''])[0] or self.headers.get('X-Token', '')) == ARGS.token
    def do_OPTIONS(self):
        self.send_response(204); self._cors(); self.end_headers()
    def do_GET(self):
        u = urlparse(self.path); q = parse_qs(u.query)
        if u.path == '/printers':
            if not self._auth(q): return self._json(403, {'error': 'bad token'})
            name, exe = backend(); return self._json(200, {'printers': printers(), 'backend': name, 'exe': exe, 'sumatra': exe})
        name, exe = backend()
        body = f'<h3>Label print helper</h3><p>Backend: {name or "NONE FOUND"} ({exe})</p><p>Printers: {", ".join(printers()) or "(none listed)"}</p>'.encode()
        self.send_response(200); self._cors(); self.send_header('Content-Type', 'text/html'); self.send_header('Content-Length', str(len(body))); self.end_headers(); self.wfile.write(body)
    def do_POST(self):
        u = urlparse(self.path); q = parse_qs(u.query)
        if u.path != '/print': return self._json(404, {'error': 'no such endpoint'})
        if not self._auth(q): return self._json(403, {'error': 'bad token'})
        printer = q.get('printer', [''])[0]
        if not printer: return self._json(400, {'error': 'printer= is required'})
        n = int(self.headers.get('Content-Length', '0')); data = self.rfile.read(n)
        if not data.startswith(b'%PDF'): return self._json(400, {'error': 'body is not a PDF'})
        name, exe = backend()
        if not exe: return self._json(500, {'error': 'no print program found: install Acrobat Reader or Ghostscript, or pass --backend/--exe'})
        fd, path = tempfile.mkstemp(suffix='.pdf', prefix='labels-'); os.write(fd, data); os.close(fd)
        try:
            ok, msg = print_pdf(name, exe, path, printer)
            if not ok: return self._json(500, {'error': f'{name}: {msg}'})
            self.log_message('printed %d page(s) to %s via %s', count_pages(data), printer, name)
            return self._json(200, {'ok': True, 'pages': count_pages(data), 'printer': printer, 'backend': name})
        finally:
            try: time.sleep(3); os.remove(path)
            except OSError: pass
    def log_message(self, fmt, *a): sys.stderr.write('%s %s\n' % (time.strftime('%H:%M:%S'), fmt % a))

if __name__ == '__main__':
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--port', type=int, default=8094); ap.add_argument('--bind', default='0.0.0.0', help='0.0.0.0 = accept connections from the LAN (default); 127.0.0.1 = this PC only')
    ap.add_argument('--token', default='', help='if set, callers must send ?token= or X-Token')
    ap.add_argument('--backend', choices=['acrobat', 'gs', 'sumatra'], default='', help='print program (default: first found of acrobat, gs, sumatra)')
    ap.add_argument('--exe', default='', help='path to that program, if it is not found automatically')
    ARGS = ap.parse_args()
    name, exe = backend()
    print(f'label print helper on http://{ARGS.bind}:{ARGS.port}/  backend: {name or "NONE FOUND"} ({exe})  printers: {printers() or "(none)"}', flush=True)
    ThreadingHTTPServer((ARGS.bind, ARGS.port), H).serve_forever()
