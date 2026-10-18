"""Generate browser and Flutter web icons from the existing Quivro mark.

Run from the repository root: python scripts/generate-brand-icons.py
Requires Pillow.
"""

from pathlib import Path

from PIL import Image, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parents[1]
WEB = ROOT / "quivro_web/public"
FLUTTER = ROOT / "quivro_mobile/web"
mark = Image.open(ROOT / "quivro_mobile/assets/branding/logo_big.png").convert("RGBA")
mark = mark.crop(mark.getchannel("A").getbbox())


def icon(size: int, scale: float, *, outline: bool = False) -> Image.Image:
    render_size = size * 4 if outline else size
    side = round(render_size * scale)
    artwork = ImageOps.contain(mark, (side, side), Image.Resampling.LANCZOS)
    position = ((render_size - artwork.width) // 2, (render_size - artwork.height) // 2)
    result = Image.new("RGBA", (render_size, render_size), (0, 0, 0, 0) if outline else "#0A0E27")
    if outline:
        alpha = Image.new("L", (render_size, render_size))
        alpha.paste(artwork.getchannel("A"), position)
        halo = alpha.filter(ImageFilter.MaxFilter(5)).point(lambda value: value // 2)
        result.paste("#F8FAFF", (0, 0, render_size, render_size), halo)
    result.alpha_composite(artwork, position)
    return result.resize((size, size), Image.Resampling.LANCZOS) if outline else result


for size in (16, 32):
    favicon = icon(size, 0.84, outline=True)
    assert favicon.getpixel((0, 0))[3] == 0
    favicon.save(WEB / f"favicon-{size}.png")
    favicon.save(FLUTTER / ("favicon.png" if size == 16 else "favicon-32.png"))

icon(32, 0.84, outline=True).save(WEB / "favicon.ico", format="ICO", sizes=[(16, 16), (32, 32)])
for directory in (WEB, FLUTTER):
    icon(180, 0.78).save(directory / "apple-touch-icon.png")
for size in (192, 512):
    icon(size, 0.78).save(FLUTTER / f"icons/Icon-{size}.png")
    icon(size, 0.58).save(FLUTTER / f"icons/Icon-maskable-{size}.png")

assert Image.open(WEB / "favicon.ico").format == "ICO"
