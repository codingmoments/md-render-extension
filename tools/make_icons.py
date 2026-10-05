"""Generate icons/icon{16,48,128}.png: a bold white lowercase "m" filling a green square.

Run: python tools/make_icons.py   (needs Pillow)
"""
from pathlib import Path

from PIL import Image, ImageDraw

BG = (60, 181, 63, 255)  # green, #3cb53f
FG = (255, 255, 255, 255)
HI = 1024                # draw large, then downscale for clean edges

# The "m" glyph, in its own design grid.
BASE = 353               # baseline (bottom of all three stems)
STEM = (116, 171, 165)   # left stem: x0, x1, top
# Each arch: outer box (x0, x1, top), corner radius, counter box (x0, x1, top).
# The second arch starts left of the first one's right edge, leaving a V-notch between their curves.
ARCHES = [
    ((160, 285, 158), 62, (171, 228, 211)),
    ((262, 398, 158), 72, (285, 341, 211)),
]
COUNTER_RADIUS = 22      # less than half the counter width, so its top reads slightly squared
GLYPH = (116, 398, 158, BASE)  # glyph bounding box: x0, x1, top, bottom

# Glyph width as a share of the icon width; smaller icons get a bigger "m" to stay legible.
LETTER_WIDTH = {48: 0.82, 128: 0.78}
# At 16px plain scaling puts stroke edges mid-pixel and blurs them, so the glyph's key edges are
# pinned to whole pixels instead: 3px stems, 2px counters. Maps glyph coordinate -> icon pixel.
PIXEL_SNAP = {16: {
    "x": ([116, 171, 228, 285, 341, 398], [1, 4, 6, 9, 11, 14]),
    "y": ([158, 211, BASE], [4, 6, 13]),
}}


def piecewise(points, targets):
    """Linear map through (points[i] -> targets[i]), extending the end segments beyond the range."""
    def f(v):
        i = next((i for i in range(1, len(points) - 1) if v < points[i]), len(points) - 1)
        p0, p1, t0, t1 = points[i - 1], points[i], targets[i - 1], targets[i]
        return t0 + (v - p0) * (t1 - t0) / (p1 - p0)
    return f


def glyph_maps(size: int):
    """Return (map_x, map_y, scale) from glyph coordinates to HI-canvas pixels."""
    if size in PIXEL_SNAP:
        unit = HI / size
        mx, my = (piecewise(p, [t * unit for t in ts]) for p, ts in PIXEL_SNAP[size].values())
        return mx, my, (mx(GLYPH[1]) - mx(GLYPH[0])) / (GLYPH[1] - GLYPH[0])
    gx0, gx1, gtop, gbottom = GLYPH
    k = HI * LETTER_WIDTH[size] / (gx1 - gx0)
    # Shift so the glyph's bounding box sits in the centre of the icon.
    dx = HI / 2 - (gx0 + gx1) / 2 * k
    dy = HI / 2 - (gtop + gbottom) / 2 * k
    return (lambda x: dx + x * k), (lambda y: dy + y * k), k


def render(size: int) -> Image.Image:
    img = Image.new("RGBA", (HI, HI), BG)
    draw = ImageDraw.Draw(img)
    mx, my, k = glyph_maps(size)

    def box(x0, x1, top, bottom=BASE):
        return (mx(x0), my(top), mx(x1) - 1, my(bottom) - 1)

    draw.rectangle(box(*STEM), fill=FG)
    for outer, radius, _ in ARCHES:
        draw.rounded_rectangle(box(*outer), radius=radius * k, fill=FG, corners=(True, True, False, False))
    for _, _, counter in ARCHES:
        # Counter runs past the baseline so its bottom stays open.
        draw.rounded_rectangle(box(*counter, BASE + 20), radius=COUNTER_RADIUS * k, fill=BG,
                               corners=(True, True, False, False))
    return img.resize((size, size), Image.BOX)  # area average keeps pixel-aligned edges sharp


def main() -> None:
    out = Path(__file__).resolve().parent.parent / "icons"
    out.mkdir(exist_ok=True)
    for size in (*PIXEL_SNAP, *LETTER_WIDTH):
        render(size).save(out / f"icon{size}.png")
        print(f"wrote {out / f'icon{size}.png'}")


if __name__ == "__main__":
    main()
