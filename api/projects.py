# api/projects.py
# Vercel Python serverless function — handles project CRUD via Neon Postgres
# Endpoints:
#   POST   /api/projects         → Create new project, returns { "id": "..." }
#   GET    /api/projects?id=xxx  → Load project state, returns { "state": {...} }
#   PATCH  /api/projects         → Update project state (body: { "id": "...", "state": {...} })

import json
import os
import uuid
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse

import psycopg2


def get_conn():
    """Connect to Neon Postgres using the DATABASE_URL env var (auto-set by Vercel)."""
    database_url = os.environ.get("DATABASE_URL") or os.environ.get("POSTGRES_URL")
    if not database_url:
        raise Exception("Missing DATABASE_URL or POSTGRES_URL env var")
    return psycopg2.connect(database_url, sslmode="require")


def ensure_table(conn):
    """Create the projects table if it doesn't exist yet."""
    with conn.cursor() as cur:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS calculator_projects (
                id TEXT PRIMARY KEY,
                state JSONB NOT NULL DEFAULT '{}'::jsonb,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        """)
        conn.commit()


class handler(BaseHTTPRequestHandler):
    def _send_json(self, status: int, data: dict):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def do_OPTIONS(self):
        """Handle CORS preflight requests."""
        self._send_json(200, {})

    def do_POST(self):
        """Create a new project. Body: { "state": {...} }"""
        conn = None
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(content_length)) if content_length else {}
            state = body.get("state", {})

            project_id = str(uuid.uuid4())

            conn = get_conn()
            ensure_table(conn)

            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO calculator_projects (id, state) VALUES (%s, %s)",
                    (project_id, json.dumps(state))
                )
                conn.commit()

            self._send_json(201, {"id": project_id})
        except Exception as e:
            self._send_json(500, {"error": str(e)})
        finally:
            if conn:
                conn.close()

    def do_GET(self):
        """Load a project. Query param: ?id=xxx"""
        conn = None
        try:
            parsed = urlparse(self.path)
            params = parse_qs(parsed.query)
            project_id = params.get("id", [None])[0]

            if not project_id:
                self._send_json(400, {"error": "Missing 'id' query parameter"})
                return

            conn = get_conn()
            ensure_table(conn)

            with conn.cursor() as cur:
                cur.execute(
                    "SELECT state FROM calculator_projects WHERE id = %s",
                    (project_id,)
                )
                row = cur.fetchone()

            if not row:
                self._send_json(404, {"error": "Project not found"})
                return

            # row[0] is already a dict if JSONB, or a string if TEXT
            state = row[0] if isinstance(row[0], dict) else json.loads(row[0])
            self._send_json(200, {"state": state})
        except Exception as e:
            self._send_json(500, {"error": str(e)})
        finally:
            if conn:
                conn.close()

    def do_PATCH(self):
        """Update a project. Body: { "id": "...", "state": {...} }"""
        conn = None
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(content_length)) if content_length else {}
            project_id = body.get("id")
            state = body.get("state", {})

            if not project_id:
                self._send_json(400, {"error": "Missing 'id' in request body"})
                return

            conn = get_conn()
            ensure_table(conn)

            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE calculator_projects SET state = %s, updated_at = NOW() WHERE id = %s",
                    (json.dumps(state), project_id)
                )
                if cur.rowcount == 0:
                    self._send_json(404, {"error": "Project not found"})
                    return
                conn.commit()

            self._send_json(200, {"ok": True})
        except Exception as e:
            self._send_json(500, {"error": str(e)})
        finally:
            if conn:
                conn.close()
