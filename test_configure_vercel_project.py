import json
import os
import subprocess
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parent
SCRIPT = REPO_ROOT / "scripts" / "configure-vercel-project.sh"


def _make_vercel_stub_handler(calls):
    class _VercelStubHandler(BaseHTTPRequestHandler):
        def _read_json(self):
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length).decode()
            return raw, json.loads(raw or "{}")

        def _write_json(self, status_code, payload):
            body = json.dumps(payload).encode()
            self.send_response(status_code)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def do_PATCH(self):
            raw, payload = self._read_json()
            calls.append((self.command, self.path, raw))
            if self.path == "/v9/projects/gridmind-epc" and payload == {"rootDirectory": "web"}:
                self._write_json(200, {"rootDirectory": "web", "name": "gridmind-epc"})
                return
            if self.path == "/v9/projects/gridmind-epc" and payload == {"name": "gridmindepc"}:
                self._write_json(409, {"error": {"code": "conflict", "message": "name already in use"}})
                return
            self._write_json(500, {"error": {"message": "unexpected PATCH"}})

        def do_POST(self):
            raw, payload = self._read_json()
            calls.append((self.command, self.path, raw))
            if self.path == "/v10/projects/gridmind-epc/domains" and payload == {"name": "pvmind.ai"}:
                self._write_json(200, {"verified": True, "verification": []})
                return
            self._write_json(500, {"error": {"message": "unexpected POST"}})

        def log_message(self, msg_format, *args):
            return

    return _VercelStubHandler


def test_configure_script_skips_conflicting_rename_and_keeps_configuring_domains():
    calls = []
    server = HTTPServer(("127.0.0.1", 0), _make_vercel_stub_handler(calls))
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()

    try:
        env = os.environ.copy()
        env.update(
            {
                "VERCEL_API": f"http://127.0.0.1:{server.server_port}",
                "VERCEL_TOKEN": "test-token",
                "VERCEL_PROJECT": "gridmind-epc",
                "RENAME_PROJECT": "gridmindepc",
                "VERCEL_DOMAINS": "pvmind.ai",
            }
        )
        result = subprocess.run(
            ["bash", str(SCRIPT)],
            cwd=REPO_ROOT,
            env=env,
            capture_output=True,
            text=True,
            check=False,
        )
    finally:
        server.shutdown()
        thread.join()
        server.server_close()

    assert result.returncode == 0, result.stderr + result.stdout
    assert "rename skipped because project name 'gridmindepc' is already in use" in result.stdout
    assert ("PATCH", "/v9/projects/gridmind-epc", '{"rootDirectory":"web"}') in calls
    assert ("PATCH", "/v9/projects/gridmind-epc", '{"name":"gridmindepc"}') in calls
    assert ("POST", "/v10/projects/gridmind-epc/domains", '{"name":"pvmind.ai"}') in calls
