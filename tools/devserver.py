"""Loopback-only preview. Serve approved runtime and test files, never a checkout listing."""
import json
import sys
from pathlib import Path
from urllib.parse import unquote, urlsplit
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = Path(__file__).resolve().parent.parent
PUBLIC_FILES = set(json.loads((ROOT / 'tools/site-files.json').read_text()))
TEST_FILES = {
    'test/self-test.html', 'test/vectors.js', 'test/run-vectors.js', 'test/report.js',
    'test/learn-comprehension.html', 'test/learn-visuals-sample.html',
}


class NoCacheHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def send_head(self):
        name = unquote(urlsplit(self.path).path).removeprefix('/') or 'index.html'
        if name not in PUBLIC_FILES | TEST_FILES:
            self.send_error(404)
            return None
        candidate = ROOT
        for component in name.split('/'):
            candidate = candidate / component
            if candidate.is_symlink():
                self.send_error(404)
                return None
        return super().send_head()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Frame-Options', 'DENY')
        self.send_header('Referrer-Policy', 'no-referrer')
        self.send_header('X-Content-Type-Options', 'nosniff')
        super().end_headers()

    def log_message(self, fmt, *args):
        sys.stderr.write('%s\n' % (fmt % args))


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8731
    ThreadingHTTPServer(('127.0.0.1', port), NoCacheHandler).serve_forever()
