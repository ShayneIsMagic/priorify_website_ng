#!/usr/bin/env python3
"""Add title tooltips to Home and MyPriorityPath links in primary nav (idempotent)."""
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[1]
NAV_BLOCK = re.compile(
    r'<nav class="site-nav" aria-label="Primary">.*?</nav>',
    re.DOTALL,
)


def inject_titles(nav_html: str) -> str:
    if 'title="Organization &amp; team engagements"' in nav_html:
        return nav_html

    def home(m):
        inner = m.group(1)
        if "title=" in inner:
            return m.group(0)
        return '<a href="/"' + inner + ' title="Organization &amp; team engagements">Home</a>'

    nav_html = re.sub(
        r'<a href="/"([^>]*?)>Home</a>',
        home,
        nav_html,
        count=1,
    )

    def mypath(m):
        inner = m.group(1)
        if "title=" in inner:
            return m.group(0)
        return (
            '<a href="/myprioritypath/"'
            + inner
            + ' title="Individuals — personal &amp; career goals">MyPriorityPath®</a>'
        )

    nav_html = re.sub(
        r'<a href="/myprioritypath/"([^>]*?)>MyPriorityPath®</a>',
        mypath,
        nav_html,
        count=1,
    )
    return nav_html


def main():
    for p in sorted(ROOT.rglob("*.html")):
        if "reference" in p.parts:
            continue
        t = p.read_text(encoding="utf-8")

        def repl(m):
            return inject_titles(m.group(0))

        t2 = NAV_BLOCK.sub(repl, t)
        if t2 != t:
            p.write_text(t2, encoding="utf-8")
            print("updated", p.relative_to(ROOT))


if __name__ == "__main__":
    main()
