"""Populate drivers.headshot_url with lead photos from Wikipedia.

Each driver row carries its Wikipedia article URL (from the Ergast/Jolpica feed).
We ask the Wikipedia PageImages API for each article's lead thumbnail — these are
freely-licensed Wikimedia Commons images, hotlinkable from upload.wikimedia.org, so
nothing copyrighted is scraped or bundled into the repo. Drivers whose article has
no photo simply keep a null headshot and fall back to the initials avatar.

Resumable + safe to rerun. By default only fills missing photos; pass --refresh to
re-fetch everything.

    backend\\.venv\\Scripts\\python pipeline\\ingest\\photos.py [--refresh] [--season YEAR]
"""

import argparse
import logging
import sys
import time
from pathlib import Path
from urllib.parse import unquote

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "backend"))

import httpx  # noqa: E402
from sqlalchemy import select  # noqa: E402

from app.core.database import SessionLocal  # noqa: E402
from app.models.f1 import Constructor, Driver, Race, Result  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("photos")

WIKI_API = "https://en.wikipedia.org/w/api.php"
# Wikimedia enforces a User-Agent policy: it must identify the client and give a
# contact (URL or email). A browser-spoofing UA is rejected with 403.
USER_AGENT = "F1InsightAI/0.1 (https://github.com/f1-insight-ai; educational project) httpx"
BATCH = 50
THUMB_PX = 400


def title_from_url(url: str) -> str | None:
    if not url or "/wiki/" not in url:
        return None
    return unquote(url.split("/wiki/", 1)[1]).replace("_", " ").strip() or None


def fetch_thumbnails(client: httpx.Client, titles: list[str]) -> dict[str, str]:
    """Map requested title -> thumbnail URL for one batch (<=50 titles)."""
    resp = client.get(
        WIKI_API,
        params={
            "action": "query",
            "format": "json",
            "formatversion": "2",
            "prop": "pageimages",
            "piprop": "thumbnail",
            "pithumbsize": str(THUMB_PX),
            "redirects": "1",
            "titles": "|".join(titles),
        },
    )
    resp.raise_for_status()
    query = resp.json().get("query", {})

    # Resolve the normalized/redirect chain back to the title we asked for.
    resolved: dict[str, str] = {t: t for t in titles}
    for norm in query.get("normalized", []):
        resolved[norm["to"]] = resolved.get(norm["from"], norm["from"])
    for redir in query.get("redirects", []):
        resolved[redir["to"]] = resolved.get(redir["from"], redir["from"])

    out: dict[str, str] = {}
    for page in query.get("pages", []):
        thumb = page.get("thumbnail", {}).get("source")
        if thumb:
            requested = resolved.get(page["title"], page["title"])
            out[requested] = thumb
    return out


def run_entity(db, client, model, target_attr: str, refresh: bool, season: int | None, label: str) -> None:
    """Populate `target_attr` on `model` rows from their Wikipedia lead image."""
    q = select(model).where(model.url.isnot(None))
    if not refresh:
        q = q.where(getattr(model, target_attr).is_(None))
    if season:
        fk = Result.driver_id if model is Driver else Result.constructor_id
        q = q.where(model.id.in_(
            select(fk).join(Race, Result.race_id == Race.id).where(Race.season == season)
        ))
    rows = db.execute(q).scalars().all()

    by_title: dict[str, object] = {}
    for row in rows:
        title = title_from_url(row.url or "")
        if title:
            by_title[title] = row
    titles = list(by_title)
    log.info("resolving %s for %d %s", target_attr, len(titles), label)

    updated = 0
    for i in range(0, len(titles), BATCH):
        chunk = titles[i : i + BATCH]
        try:
            thumbs = fetch_thumbnails(client, chunk)
        except httpx.HTTPError as exc:
            log.warning("batch %d failed: %s", i // BATCH, exc)
            continue
        for title, url in thumbs.items():
            setattr(by_title[title], target_attr, url)
            updated += 1
        db.commit()
        log.info("  batch %d/%d — %d images so far", i // BATCH + 1,
                 (len(titles) + BATCH - 1) // BATCH, updated)
        time.sleep(0.2)  # be polite to the API
    log.info("done %s — set %d (%d had no Wikipedia image)", label, updated, len(titles) - updated)


def main() -> None:
    parser = argparse.ArgumentParser(description="Fetch driver photos / team logos from Wikipedia")
    parser.add_argument("--refresh", action="store_true", help="re-fetch even if an image exists")
    parser.add_argument("--season", type=int, help="limit to entities active in this season")
    parser.add_argument("--entity", choices=["drivers", "constructors", "both"], default="both")
    args = parser.parse_args()

    db = SessionLocal()
    try:
        with httpx.Client(headers={"User-Agent": USER_AGENT}, timeout=30) as client:
            if args.entity in ("drivers", "both"):
                run_entity(db, client, Driver, "headshot_url", args.refresh, args.season, "drivers")
            if args.entity in ("constructors", "both"):
                run_entity(db, client, Constructor, "logo_url", args.refresh, args.season, "constructors")
    finally:
        db.close()


if __name__ == "__main__":
    main()
