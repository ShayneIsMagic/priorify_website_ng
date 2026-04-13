#!/usr/bin/env python3
"""
Refresh the Priorify Discovery PDF cover to match the site header:
navy band (#1b1464) + logo-yellow.svg centered over the baked-in cover wordmark.

Uses CairoSVG for correct SVG rasterization (PyMuPDF alone mis-renders white fills).

Usage:
  pip install pymupdf cairosvg
  python3 scripts/refresh_discovery_pdf.py \\
    --input ~/Downloads/Priorify\\ Discovery\\ Document\\ \\(\\1\\).pdf \\
    --output assets/documents/Priorify-Discovery-Document.pdf
"""

from __future__ import annotations

import argparse
import io
import os

import cairosvg
import fitz

NAVY = (27, 20, 100)


def blend_rgba_on_rgb(r: int, g: int, b: int, a: int, br: int, bg: int, bb: int) -> tuple[int, int, int]:
    if a >= 255:
        return r, g, b
    if a <= 0:
        return br, bg, bb
    af = a / 255.0
    return (
        int(r * af + br * (1 - af) + 0.5),
        int(g * af + bg * (1 - af) + 0.5),
        int(b * af + bb * (1 - af) + 0.5),
    )


def navy_bar_buffer(w: int, h: int) -> bytearray:
    row = bytes([NAVY[0], NAVY[1], NAVY[2]]) * w
    return bytearray(row * h)


def cairo_png_bytes(svg_path: str, scale: float = 3.0) -> bytes:
    buf = io.BytesIO()
    cairosvg.svg2png(url=svg_path, write_to=buf, scale=scale)
    return buf.getvalue()


def composite_cover_strip(
    bar_w: int,
    bar_h: int,
    logo_png: bytes,
    pad_y: int = 14,
) -> fitz.Pixmap:
    """Navy RGB pixmap bar_w x bar_h with logo centered (logo scaled to fit)."""
    logo_pm = fitz.Pixmap(logo_png)
    lw, lh = logo_pm.width, logo_pm.height

    max_h = bar_h - 2 * pad_y
    sc = min(max_h / lh, (bar_w - 32) / lw)
    nw, nh = int(lw * sc), int(lh * sc)
    scaled = fitz.Pixmap(logo_pm, nw, nh)

    ox = (bar_w - scaled.width) // 2
    oy = (bar_h - scaled.height) // 2

    bar = navy_bar_buffer(bar_w, bar_h)
    stride = 3 if scaled.n == 3 else 4
    for y in range(scaled.height):
        for x in range(scaled.width):
            si = (y * scaled.width + x) * stride
            if scaled.n == 4:
                r, g, b, a = scaled.samples[si : si + 4]
            else:
                r, g, b = scaled.samples[si : si + 3]
                a = 255
            bx, by = ox + x, oy + y
            if bx < 0 or by < 0 or bx >= bar_w or by >= bar_h:
                continue
            bi = (by * bar_w + bx) * 3
            br, bg_, bb = bar[bi], bar[bi + 1], bar[bi + 2]
            pr, pg, pb = blend_rgba_on_rgb(r, g, b, a, br, bg_, bb)
            bar[bi : bi + 3] = bytes([pr, pg, pb])
    return fitz.Pixmap(fitz.csRGB, bar_w, bar_h, bytes(bar), 0)


def main() -> None:
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--input",
        default=os.path.expanduser("~/Downloads/Priorify Discovery Document (1).pdf"),
    )
    ap.add_argument(
        "--output",
        default=os.path.join(root, "assets", "documents", "Priorify-Discovery-Document.pdf"),
    )
    ap.add_argument(
        "--logo",
        default=os.path.join(root, "assets", "images", "logo-yellow.svg"),
    )
    args = ap.parse_args()
    os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)

    doc = fitz.open(args.input)
    page = doc[0]
    # Edge-to-edge band masks the baked-in white wordmark in the cover JPEG.
    bar = fitz.Rect(0, 118, 612, 368)
    bar_w = int(bar.width)
    bar_h = int(bar.height)

    png_bytes = cairo_png_bytes(args.logo, scale=3.0)
    strip = composite_cover_strip(bar_w, bar_h, png_bytes, pad_y=18)
    page.insert_image(bar, pixmap=strip, overlay=True)

    # Original tagline can sit under the band; redraw on top (approx. Greycliff → helvetica).
    page.insert_textbox(
        fitz.Rect(48, 338, 564, 378),
        "Prioritized Stakeholder Intelligence",
        fontsize=15,
        color=(1, 1, 1),
        fontname="helv",
        align=fitz.TEXT_ALIGN_CENTER,
    )

    doc.save(args.output, garbage=4, deflate=True)
    doc.close()
    print("Wrote", args.output)


if __name__ == "__main__":
    main()
