import asyncio
import sqlite3
import os

_DB_PATH = os.getenv("SQLITE_DB_PATH", "local_scores.db")


class _Result:
    def __init__(self, rows: list):
        self.rows = rows


class _Client:
    def __init__(self, path: str):
        self._path = path

    def _run(self, sql: str, params=None):
        con = sqlite3.connect(self._path, check_same_thread=False)
        try:
            cur = con.execute(sql, params or [])
            if sql.strip().upper().startswith("SELECT"):
                rows = [tuple(r) for r in cur.fetchall()]
            else:
                rows = []
            con.commit()
            return _Result(rows)
        finally:
            con.close()

    async def execute(self, sql: str, params=None):
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, self._run, sql, params)


client = _Client(_DB_PATH)
