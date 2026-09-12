#!/usr/bin/env python3
"""Print helper for the label printer. Runs on the Windows PC the Epson LW-PX900 is attached to and prints PDFs that the
fastener page (or anything else on the LAN) POSTs to it, silently, using the printer queue's saved defaults.

    python print-helper.py [--port 8094] [--token SECRET] [--sumatra "C:\\path\\SumatraPDF.exe"] [--bind 0.0.0.0]

Endpoints (CORS open, so a browser page served from elsewhere can call them):
    GET  /printers                         -> JSON list of installed printer names
    POST /print?printer=NAME[&token=..]    -> body = the PDF; prints it, returns {"ok":true,"pages":N}
    GET  /                                  -> a tiny status page

Needs SumatraPDF (https://www.sumatrapdfreader.org/, the portable exe is fine). Its -print-to uses the queue's default
settings, so set tape width / auto length / cut per label once in the printer's Printing Preferences, ideally as one queue per
tape width (e.g. "LW-PX900 9mm", "LW-PX900 12mm"). Python 3.8+ standard library only.
"""
import argparse, json, os, shutil, subprocess, sys, tempfile, time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

ARGS = None

def find_sumatra():
    if ARGS.sumatra: return ARGS.sumatra
    for c in [shutil.which('SumatraPDF'), shutil.which('SumatraPDF.exe'),
              os.path.expandvars(r'%LOCALAPPDATA%\SumatraPDF\SumatraPDF.exe'),
              os.path.expandvars(r'%ProgramFiles%\SumatraPDF\SumatraPDF.exe'),
              os.path.expandvars(r'%ProgramFiles(x86)%\SumatraPDF\SumatraPDF.exe'),
              os.path.join(os.path.dirname(os.path.abspath(__file__)), 'SumatraPDF.exe')]:
        if c and os.path.exists(c): return c
    return None

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
            return self._json(200, {'printers': printers(), 'sumatra': find_sumatra()})
        body = f'<h3>Label print helper</h3><p>SumatraPDF: {find_sumatra() or "NOT FOUND"}</p><p>Printers: {", ".join(printers()) or "(none listed)"}</p>'.encode()
        self.send_response(200); self._cors(); self.send_header('Content-Type', 'text/html'); self.send_header('Content-Length', str(len(body))); self.end_headers(); self.wfile.write(body)
    def do_POST(self):
        u = urlparse(self.path); q = parse_qs(u.query)
        if u.path != '/print': return self._json(404, {'error': 'no such endpoint'})
        if not self._auth(q): return self._json(403, {'error': 'bad token'})
        printer = q.get('printer', [''])[0]
        if not printer: return self._json(400, {'error': 'printer= is required'})
        n = int(self.headers.get('Content-Length', '0')); data = self.rfile.read(n)
        if not data.startswith(b'%PDF'): return self._json(400, {'error': 'body is not a PDF'})
        exe = find_sumatra()
        if not exe: return self._json(500, {'error': 'SumatraPDF.exe not found; pass --sumatra or put it next to this script'})
        fd, path = tempfile.mkstemp(suffix='.pdf', prefix='labels-'); os.write(fd, data); os.close(fd)
        try:
            # -print-settings noscale: the page is the printable strip at exact size; the queue's defaults set tape and cutting
            r = subprocess.run([exe, '-print-to', printer, '-print-settings', 'noscale', '-silent', path], capture_output=True, text=True, timeout=300)
            if r.returncode != 0: return self._json(500, {'error': f'SumatraPDF exit {r.returncode}: {(r.stderr or r.stdout).strip()[:300]}'})
            self.log_message('printed %d page(s) to %s', count_pages(data), printer)
            return self._json(200, {'ok': True, 'pages': count_pages(data), 'printer': printer})
        finally:
            try: time.sleep(1); os.remove(path)
            except OSError: pass
    def log_message(self, fmt, *a): sys.stderr.write('%s %s\n' % (time.strftime('%H:%M:%S'), fmt % a))

if __name__ == '__main__':
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--port', type=int, default=8094); ap.add_argument('--bind', default='0.0.0.0', help='0.0.0.0 = accept connections from the LAN (default); 127.0.0.1 = this PC only')
    ap.add_argument('--token', default='', help='if set, callers must send ?token= or X-Token'); ap.add_argument('--sumatra', default='', help='path to SumatraPDF.exe')
    ARGS = ap.parse_args()
    print(f'label print helper on http://{ARGS.bind}:{ARGS.port}/  SumatraPDF: {find_sumatra() or "NOT FOUND"}  printers: {printers() or "(none)"}', flush=True)
    ThreadingHTTPServer((ARGS.bind, ARGS.port), H).serve_forever()
