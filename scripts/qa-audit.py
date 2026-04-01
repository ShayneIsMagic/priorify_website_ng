#!/usr/bin/env python3
"""Static QA checks vs AGENTS.md (SEO basics, meta, images). Run from repo root: python3 scripts/qa-audit.py"""
from __future__ import annotations

import glob
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
SKIP_DIRS = {"reference", "includes", "css"}


def main() -> int:
    issues: list[tuple[str, str]] = []
    html_files = [
        p
        for p in ROOT.rglob("*.html")
        if not any(part in SKIP_DIRS for part in p.parts)
    ]
    for p in sorted(html_files):
        rel = p.relative_to(ROOT)
        t = p.read_text(encoding="utf-8", errors="replace")
        if not t.strip().startswith("<!DOCTYPE"):
            issues.append((str(rel), "Missing <!DOCTYPE html>"))
        if '<html lang="en"' not in t:
            issues.append((str(rel), 'Missing <html lang="en">'))
        if 'charset="utf-8"' not in t.lower():
            issues.append((str(rel), "Missing utf-8 charset"))
        if 'name="viewport"' not in t:
            issues.append((str(rel), "Missing viewport meta"))
        if "<title>" not in t or "</title>" not in t:
            issues.append((str(rel), "Missing <title>"))
        if 'name="description"' not in t:
            issues.append((str(rel), "Missing meta description"))
        is_404 = rel.name == "404.html"
        if is_404:
            if "noindex" not in t:
                issues.append((str(rel), "404 should use meta robots noindex"))
        elif 'rel="canonical"' not in t:
            issues.append((str(rel), "Missing canonical link"))
        h1s = len(re.findall(r"<h1\b", t, re.I))
        if h1s != 1:
            issues.append((str(rel), f"Expected 1 <h1>, found {h1s}"))
        if 'id="main"' not in t:
            issues.append((str(rel), 'Missing id="main" on <main>'))
        if 'skip-link' in t and 'href="#main"' not in t:
            issues.append((str(rel), "Skip link should target #main"))
        if 'rel="icon"' not in t:
            issues.append((str(rel), "Missing favicon link"))
        for m in re.finditer(r'property="og:image"\s+content="([^"]*)"', t):
            if not m.group(1).startswith("https://"):
                issues.append((str(rel), f"og:image must be absolute URL: {m.group(1)[:50]}"))
        for m in re.finditer(r'name="twitter:image"\s+content="([^"]*)"', t):
            if not m.group(1).startswith("https://"):
                issues.append((str(rel), f"twitter:image must be absolute: {m.group(1)[:50]}"))
        for im in re.findall(r"<img\b[^>]*>", t, re.I):
            if "alt=" not in im.lower():
                issues.append((str(rel), f'<img> missing alt: {im[:70]}'))
        if "GTM-PLTQ3Q4B" in t:
            if "window.dataLayer = window.dataLayer || []" not in t:
                issues.append((str(rel), "GTM present but dataLayer init missing"))
            if "googletagmanager.com/ns.html" not in t:
                issues.append((str(rel), "GTM noscript iframe missing"))

    if issues:
        print("Issues:\n")
        for path, msg in issues:
            print(f"  {path}: {msg}")
        print(f"\nTotal: {len(issues)}")
        return 1
    print(f"OK — {len(html_files)} HTML files passed basic AGENTS.md checks.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
