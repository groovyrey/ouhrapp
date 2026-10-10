import functools
import http.server
import os
import sys

DIRECTORY = os.path.dirname(os.path.abspath(__file__))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 3000


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


def main():
    handler = functools.partial(NoCacheHandler, directory=DIRECTORY)
    server = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), handler)
    print(f"ouhrapp dev server on http://127.0.0.1:{PORT} (no cache)")
    server.serve_forever()


if __name__ == "__main__":
    main()
