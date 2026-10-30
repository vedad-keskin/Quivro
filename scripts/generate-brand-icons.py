"""Generate browser icons from the approved Quivro launcher artwork.

Run from the repository root: python scripts/generate-brand-icons.py
Requires Pillow.
"""

from pathlib import Path

from PIL import Image, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "quivro_mobile/assets/branding"
WEB = ROOT / "quivro_web/public"
FLUTTER_WEB = ROOT / "quivro_mobile/web"
background = Image.open(SOURCE / "launcher_background.png").convert("RGB")
q = Image.open(SOURCE / "launcher_q.png").convert("RGBA")
assert background.width == background.height and q.size == (1024, 1024)
assert q.getchannel("A").getextrema() == (0, 255)


def resized(size: int) -> Image.Image:
    return q.resize((size, size), Image.Resampling.LANCZOS)


def favicon(size: int) -> Image.Image:
    symbol = resized(size)
    halo = symbol.getchannel("A").point(lambda value: 255 if value > 16 else 0)
    result = Image.new("RGBA", (size, size), "white")
    result.putalpha(halo.filter(ImageFilter.MaxFilter(3)))
    result.alpha_composite(symbol)
    return result


for size in (16, 32):
    favicon(size).save(WEB / f"favicon-{size}.png")
    favicon(size).save(FLUTTER_WEB / ("favicon.png" if size == 16 else "favicon-32.png"))

favicon(32).save(WEB / "favicon.ico", format="ICO", sizes=[(16, 16), (32, 32)])
for directory in (WEB, FLUTTER_WEB):
    resized(180).save(directory / "apple-touch-icon.png")

for size in (192, 512):
    resized(size).save(FLUTTER_WEB / f"icons/Icon-{size}.png")
    maskable = background.resize((size, size), Image.Resampling.LANCZOS).convert("RGBA")
    side = round(size * 0.65)
    layer = resized(side)
    maskable.alpha_composite(layer, ((size - side) // 2, (size - side) // 2))
    maskable.convert("RGB").save(FLUTTER_WEB / f"icons/Icon-maskable-{size}.png")

assert Image.open(WEB / "favicon.ico").format == "ICO"
assert Image.open(WEB / "favicon-16.png").getpixel((0, 0))[3] == 0
assert Image.open(FLUTTER_WEB / "icons/Icon-maskable-512.png").size == (512, 512)
