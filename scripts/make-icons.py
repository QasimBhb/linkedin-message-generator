#!/usr/bin/env python3
"""Generates the extension icons: a message bubble with an AI spark, on LinkedIn blue.

Drawn at 4x and downsampled so the curves stay clean at 16px. Run: python3 scripts/make-icons.py
"""

from PIL import Image, ImageDraw

BLUE = (10, 102, 194, 255)
WHITE = (255, 255, 255, 255)
SS = 4  # supersample factor
SIZES = (16, 48, 128)


def star(draw, cx, cy, r, fill):
    """Four-point sparkle with concave sides — reads as 'AI' at a glance."""
    inner = r * 0.45
    pts = []
    for i in range(8):
        rad = r if i % 2 == 0 else inner
        # start at 12 o'clock, step 45 degrees
        angle = i * 45
        dx = {0: 0, 45: 0.7071, 90: 1, 135: 0.7071, 180: 0, 225: -0.7071, 270: -1, 315: -0.7071}[angle]
        dy = {0: -1, 45: -0.7071, 90: 0, 135: 0.7071, 180: 1, 225: 0.7071, 270: 0, 315: -0.7071}[angle]
        pts.append((cx + dx * rad, cy + dy * rad))
    draw.polygon(pts, fill=fill)


def make(size):
    s = size * SS
    img = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Rounded-square tile.
    d.rounded_rectangle([0, 0, s - 1, s - 1], radius=s * 0.22, fill=BLUE)

    # Message bubble.
    pad = s * 0.20
    bw, bh = s - pad * 2, (s - pad * 2) * 0.72
    top = pad * 0.92
    d.rounded_rectangle([pad, top, pad + bw, top + bh], radius=s * 0.11, fill=WHITE)

    # Bubble tail, bottom-left.
    tx, ty = pad + bw * 0.20, top + bh
    d.polygon(
        [(tx, ty - s * 0.02), (tx + bw * 0.26, ty - s * 0.02), (tx, ty + s * 0.17)],
        fill=WHITE,
    )

    # Spark punched out of the bubble (blue on white) — omitted at 16px, where it turns to mush.
    if size >= 48:
        star(d, pad + bw * 0.5, top + bh * 0.5, bh * 0.30, BLUE)
    else:
        # At 16px, two simple text lines read far better than any glyph.
        lh = bh * 0.17
        for i, w in enumerate((0.64, 0.40)):
            ly = top + bh * (0.28 + i * 0.38)
            d.rounded_rectangle(
                [pad + bw * 0.19, ly, pad + bw * (0.19 + w), ly + lh],
                radius=lh / 2,
                fill=BLUE,
            )

    return img.resize((size, size), Image.LANCZOS)


for size in SIZES:
    make(size).save(f'public/icons/icon{size}.png')
    print(f'public/icons/icon{size}.png')
