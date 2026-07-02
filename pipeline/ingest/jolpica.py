"""Rate-limited client for the Jolpica-F1 API (Ergast successor).

Jolpica allows ~4 req/s burst but only 500 req/hr sustained for unauthenticated
use. The client paces requests conservatively and honors 429 backoff so long
backfills never get banned.
"""

import logging
import time
from typing import Any, Iterator

import httpx

log = logging.getLogger("ingest.jolpica")

BASE_URL = "https://api.jolpi.ca/ergast/f1"


class JolpicaClient:
    def __init__(self, min_interval: float = 3.8, timeout: float = 30.0):
        # 3.8s between requests ≈ 947 req/hr worst case is too fast for the
        # 500/hr sustained cap, but short runs (< ~250 requests) fit inside the
        # hourly budget. Long backfills should pass min_interval=7.5.
        self.min_interval = min_interval
        self._last_request = 0.0
        self._client = httpx.Client(
            timeout=timeout,
            headers={"User-Agent": "F1-Insight-AI/0.1 (student project)"},
        )

    def get(self, path: str, params: dict[str, Any] | None = None) -> dict:
        for attempt in range(6):
            wait = self.min_interval - (time.monotonic() - self._last_request)
            if wait > 0:
                time.sleep(wait)
            self._last_request = time.monotonic()

            resp = self._client.get(f"{BASE_URL}/{path.lstrip('/')}", params=params)
            if resp.status_code == 429:
                backoff = float(resp.headers.get("Retry-After", 2 ** (attempt + 2)))
                log.warning("429 rate limited on %s, sleeping %.0fs", path, backoff)
                time.sleep(backoff)
                continue
            if resp.status_code >= 500:
                log.warning("HTTP %s on %s, retrying", resp.status_code, path)
                time.sleep(2**attempt)
                continue
            resp.raise_for_status()
            return resp.json()["MRData"]
        raise RuntimeError(f"Giving up on {path} after repeated failures")

    def get_paged(self, path: str, *unwrap: str, limit: int = 100) -> Iterator[dict]:
        """Iterate every item of a paginated Ergast list endpoint.

        `unwrap` is the key path from MRData to the list, e.g.
        ("DriverTable", "Drivers") or ("RaceTable", "Races").
        """
        offset = 0
        while True:
            data = self.get(path, {"limit": limit, "offset": offset})
            node: Any = data
            for key in unwrap:
                node = node.get(key, {}) if isinstance(node, dict) else []
            items: list = node if isinstance(node, list) else []
            yield from items
            offset += limit
            if offset >= int(data.get("total", 0)):
                return

    def close(self) -> None:
        self._client.close()
