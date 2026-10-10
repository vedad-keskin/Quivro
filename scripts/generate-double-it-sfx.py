"""Generate Quivro's original, deterministic flame cues (no external samples)."""
import math
from pathlib import Path
import random
import struct
import wave

DEST = Path(__file__).resolve().parents[1] / 'quivro_web/public/sounds'
RATE = 22050


def render(name: str, seconds: float, pitch: float) -> None:
    rng = random.Random(20261010)
    samples = []
    low = 0.0
    phase = 0.0
    for i in range(round(RATE * seconds)):
        t = i / RATE
        u = t / seconds
        noise = rng.uniform(-1, 1)
        low += (noise - low) * (0.04 + 0.25 * math.sin(math.pi * u) ** 2)
        envelope = min(1, t / .04) * (1 - u) ** 1.6
        whoosh = low * (0.3 + 1.4 * math.sin(math.pi * u) ** 2)
        phase += 2 * math.pi * (pitch + 240 * min(1, u * 2)) / RATE
        tone = math.sin(phase) * .11 * math.sin(math.pi * u)
        crackle = noise * .2 if rng.random() < .024 and .2 < u < .75 else 0
        samples.append((whoosh + tone + crackle) * envelope)
    peak = max(abs(s) for s in samples)
    with wave.open(str(DEST / name), 'wb') as out:
        out.setnchannels(1)
        out.setsampwidth(2)
        out.setframerate(RATE)
        out.writeframes(b''.join(struct.pack('<h', round(s / peak * 22000)) for s in samples))


if __name__ == '__main__':
    render('double_it_ignite.wav', .72, 180)
    render('double_it_stack.wav', .38, 260)
    render('double_it_start.wav', .5, 140)
