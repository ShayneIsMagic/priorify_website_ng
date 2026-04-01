#!/usr/bin/env python3
"""One-off: wrap site nav in path / learn groups. Run from repo root."""
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[1]

# Which page file -> aria-current on which href (last path segment or "cta")
CURRENT = {
    "index.html": "/",
    "myprioritypath/index.html": "/myprioritypath/",
    "why-priorify/index.html": "/why-priorify/",
    "our-process/index.html": "/our-process/",
    "pricing/index.html": "/pricing/",
    "research/index.html": "/research/",
    "our-team/index.html": "/our-team/",
    "faq/index.html": "/faq/",
    "contact/index.html": "cta",
    "404.html": None,
    "shan-g/index.html": None,
    "shandon-m-gubler/index.html": None,
}


def aria_current(href: str, current, is_cta: bool = False) -> str:
    if current == "cta" and is_cta:
        return ' aria-current="page"'
    if current and not is_cta and href == current:
        return ' aria-current="page"'
    return ""


def build_desktop_nav(current) -> str:
    def a(href, text, *, individual=False, cta=False):
        ac = aria_current(href, current, is_cta=cta)
        cls = ' class="site-nav__link--individual"' if individual else ""
        return f'          <a href="{href}"{cls}{ac}>{text}</a>'

    lines = [
        '        <nav class="site-nav" aria-label="Primary">',
        '          <div class="site-nav__group site-nav__group--paths" role="group" aria-label="Choose your path">',
        a("/", "Home"),
        a("/myprioritypath/", "MyPriorityPath®", individual=True),
        "          </div>",
        '          <span class="site-nav__sep" aria-hidden="true"></span>',
        '          <div class="site-nav__group site-nav__group--learn" role="group" aria-label="Methodology and company">',
        a("/why-priorify/", "Why Priorify"),
        a("/our-process/", "Our Process"),
        a("/pricing/", "Pricing"),
        a("/research/", "Research"),
        a("/our-team/", "Our Team"),
        a("/faq/", "FAQ"),
        "          </div>",
        f'          <a class="btn-nav-cta" href="/contact/"{aria_current("/contact/", current, is_cta=(current == "cta"))}>Get Priorified ✦</a>',
        "        </nav>",
    ]
    return "\n".join(lines)


def build_mobile_nav(current) -> str:
    def a(href, text, *, individual=False, cta=False):
        ac = aria_current(href, current, is_cta=cta)
        cls = ' class="site-nav-mobile__link--individual"' if individual else ""
        return f'        <a href="{href}"{cls}{ac}>{text}</a>'

    lines = [
        '      <div id="site-nav-mobile" class="site-nav-mobile" hidden>',
        '        <div class="site-nav-mobile__group site-nav-mobile__group--paths" role="group" aria-label="Choose your path">',
        a("/", "Home"),
        a("/myprioritypath/", "MyPriorityPath®", individual=True),
        "        </div>",
        '        <div class="site-nav-mobile__sep" aria-hidden="true"></div>',
        '        <div class="site-nav-mobile__group site-nav-mobile__group--learn" role="group" aria-label="Methodology and company">',
        a("/why-priorify/", "Why Priorify"),
        a("/our-process/", "Our Process"),
        a("/pricing/", "Pricing"),
        a("/research/", "Research"),
        a("/our-team/", "Our Team"),
        a("/faq/", "FAQ"),
        "        </div>",
        f'        <a class="btn-nav-cta" href="/contact/"{aria_current("/contact/", current, is_cta=(current == "cta"))}>Get Priorified ✦</a>',
        "      </div>",
    ]
    return "\n".join(lines)


NAV_RE = re.compile(
    r'<nav class="site-nav" aria-label="Primary">.*?</nav>',
    re.DOTALL,
)
MOBILE_RE = re.compile(
    r'<div id="site-nav-mobile" class="site-nav-mobile" hidden>.*?</div>\s*(?=\s*</header>)',
    re.DOTALL,
)


def patch_file(path: pathlib.Path, current) -> None:
    text = path.read_text(encoding="utf-8")
    new_nav = build_desktop_nav(current)
    text, n = NAV_RE.subn(new_nav, text, count=1)
    if n != 1:
        raise SystemExit(f"NAV replace failed: {path}")
    new_mob = build_mobile_nav(current)
    text2, m = MOBILE_RE.subn(new_mob, text, count=1)
    if m != 1:
        raise SystemExit(f"MOBILE replace failed: {path}")
    path.write_text(text2, encoding="utf-8")
    print("ok", path.relative_to(ROOT))


def main():
    for rel, cur in CURRENT.items():
        patch_file(ROOT / rel, cur)
    inc = ROOT / "includes" / "header.html"
    if inc.exists():
        patch_file(inc, None)


if __name__ == "__main__":
    main()
