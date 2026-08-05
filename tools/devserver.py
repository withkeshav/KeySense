"""Dev server for local testing. Identical to python -m http.server except it
tells the browser never to cache, so an edit is always the thing you are
looking at. Not used in production; deploy the static files with any server."""
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, fmt, *args):
        sys.stderr.write("%s\n" % (fmt % args))


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8731
    ThreadingHTTPServer(("127.0.0.1", port), NoCacheHandler).serve_forever()
