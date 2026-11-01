# Download assets — Option 2 homepage plan

Prepared 2026-11-01. These source assets now have runtime copies in `quivro_web/public/brand/`; the phone PNG is optimized to a 480 × 720 transparent WebP there for the larger phone display.

## Google Play badges

`google-play-badge-en.png` and `google-play-badge-bs.png` are unmodified official Google PNG downloads (478 × 142), corresponding to `GetItOnGooglePlay_Badge_Web_color_English.png` and `GetItOnGooglePlay_Badge_Web_color_Bosnian.png`.

Source and usage guidance: https://partnermarketinghub.withgoogle.com/brands/google-play/google-play/lockups-icons-badges/?folder=86642

The download listing identifies these badge files as updated in November 2025. Use the corresponding language asset with the homepage language. Keep aspect ratio and supplied elements intact; do not recolor or add effects. Minimum displayed badge height: 28 CSS pixels; maintain clear space of at least one-quarter of displayed badge height. The implementation uses about 46–56px badge height with 14px of surrounding padding.

## QR code

`google-play-qr.svg` is the deployable vector asset; `google-play-qr.png` is a 328 × 328 raster preview / fallback. Both have a white background, black modules, four-module quiet zone, and error-correction level M. The complete grid is 41 × 41 modules including quiet zone.

Exact encoded content:

https://play.google.com/store/apps/details?id=com.quivro.app

Generated locally with Python qrcode 8.2. Independently decoded with zxing-cpp; result matched the URL exactly. No URL shortener, redirects, tracking parameters, or runtime QR service. The homepage plan starts at 123px including the quiet zone (three CSS pixels per module); verify a physical phone scan at final size before shipping and increase to 164px if scanning is uncomfortable. Keep the store badge a normal accessible link, so the QR is never the sole path.

Temporary encoder/decoder tooling was installed outside the application. No project dependency or lockfile changed.

## SHA-256

- `google-play-badge-en.png`: `a7dbeba4623dd255798dd1159e543cdbeeb9e43faa6db7f859b0f9ed3699932c`
- `google-play-badge-bs.png`: `d79d8139690517ebae5711acf450502c600932a102e9e1bc76f61f2b8e0d9afb`
- `google-play-qr.svg`: `78d0e29f77a6429bae288fe7dae0af9632db7b084dc876b3d516c28bb71c73b6`
- `google-play-qr.png`: `67eab49e325b796be6114d10e5699ea8ddccfef344a3f45f1369ebe027a368c4`
