import json
import os
import sqlite3
from datetime import datetime, timezone
from typing import Any, Dict, Optional


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
DB_PATH = os.environ.get("LOAF_DB_PATH", os.path.join(DATA_DIR, "loafrate.sqlite3"))


def _connect() -> sqlite3.Connection:
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with _connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS analyses (
                id TEXT PRIMARY KEY,
                lang TEXT NOT NULL,
                filename TEXT NOT NULL,
                image_url TEXT NOT NULL,
                report_json TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )


def save_analysis(share_id: str, lang: str, report: Dict[str, Any]) -> None:
    created_at = datetime.now(timezone.utc).isoformat()
    with _connect() as conn:
        conn.execute(
            """
            INSERT INTO analyses (id, lang, filename, image_url, report_json, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                share_id,
                lang,
                report["filename"],
                report["image_url"],
                json.dumps(report, ensure_ascii=False),
                created_at,
            ),
        )


def get_analysis(share_id: str) -> Optional[Dict[str, Any]]:
    with _connect() as conn:
        row = conn.execute(
            """
            SELECT id, lang, report_json, created_at
            FROM analyses
            WHERE id = ?
            """,
            (share_id,),
        ).fetchone()

    if row is None:
        return None

    report = json.loads(row["report_json"])
    report["share_id"] = row["id"]
    report["lang"] = row["lang"]
    report["created_at"] = row["created_at"]
    return report
