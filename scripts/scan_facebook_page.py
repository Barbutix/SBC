#!/usr/bin/env python3
"""Collect recent tournament-related posts from the club's own Facebook Page.

Requires a Page access token with pages_read_engagement. It never logs the token.
"""
import json
import os
import sys
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

OUT = Path("site/event-candidates.json")
PAGE_ID = os.environ.get("SBC_FB_PAGE_ID", "").strip()
PAGE_TOKEN = os.environ.get("SBC_FB_PAGE_ACCESS_TOKEN", "").strip()
API_VERSION = os.environ.get("SBC_FB_API_VERSION", "v26.0").strip()
LOOKBACK_DAYS = max(1, min(int(os.environ.get("SBC_FB_LOOKBACK_DAYS", "7")), 30))
KEYWORDS = ("tournoi", "open", "championnat", "competition", "inscription", "flechette", "darts", "concours")


def normalize(value):
    value = unicodedata.normalize("NFKD", str(value or "").lower())
    return "".join(char for char in value if not unicodedata.combining(char))


def fetch_posts():
    since = int((datetime.now(timezone.utc) - timedelta(days=LOOKBACK_DAYS)).timestamp())
    params = {
        "fields": "id,message,created_time,permalink_url",
        "limit": "100",
        "since": str(since),
        "access_token": PAGE_TOKEN,
    }
    url = f"https://graph.facebook.com/{API_VERSION}/{urllib.parse.quote(PAGE_ID, safe='')}/published_posts?{urllib.parse.urlencode(params)}"
    posts = []
    for _ in range(10):
        request = urllib.request.Request(url, headers={"User-Agent": "SBC-Tournament-Scout/1.0"})
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as error:
            raise RuntimeError(f"Facebook Graph API returned HTTP {error.code}; check the Page token and pages_read_engagement access") from None
        except urllib.error.URLError:
            raise RuntimeError("Could not reach Facebook Graph API") from None
        if payload.get("error"):
            raise RuntimeError("Facebook Graph API rejected the request; check the Page ID, token, and permission")
        posts.extend(payload.get("data", []))
        url = (payload.get("paging") or {}).get("next")
        if not url:
            break
    return posts


def main():
    if not PAGE_ID or not PAGE_TOKEN:
        print("Facebook Page scan skipped: configure SBC_FB_PAGE_ID and SBC_FB_PAGE_ACCESS_TOKEN in GitHub Actions.")
        return

    document = json.loads(OUT.read_text(encoding="utf-8")) if OUT.exists() else {"events": []}
    saved = {str(post.get("postId")): post for post in document.get("facebookPosts", []) if post.get("postId")}
    found = 0
    for post in fetch_posts():
        message = str(post.get("message") or "").strip()
        if not message:
            continue
        normalized = normalize(message)
        if not any(keyword in normalized for keyword in KEYWORDS):
            continue
        post_id = str(post.get("id") or "")
        permalink = str(post.get("permalink_url") or "").strip()
        if not post_id or not permalink:
            continue
        saved[post_id] = {
            "postId": post_id,
            "publishedAt": post.get("created_time", ""),
            "url": permalink,
            "message": message,
            "source": "Page Facebook du club",
            "status": saved.get(post_id, {}).get("status", "pending"),
        }
        found += 1

    document["facebookPosts"] = sorted(saved.values(), key=lambda item: item.get("publishedAt", ""), reverse=True)[:300]
    document["facebookUpdatedAt"] = datetime.now(timezone.utc).isoformat()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(document, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Facebook Page scan complete: {found} relevant posts checked; {len(document['facebookPosts'])} saved for member review.")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Facebook Page scan failed: {error}", file=sys.stderr)
        sys.exit(1)
