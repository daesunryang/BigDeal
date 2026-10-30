# 고양이 노래 13곡을 WAV로 만든다 (assets/sfx/song<i>.wav).
# 프로토타입의 WebAudio 합성과 같은 소리: 삼각파, 음마다 높이를 1.15배 → 0.8배로 미끄러뜨리고
# 0.03초 만에 커졌다가 음 길이 동안 줄어드는 볼륨. 곡 데이터는 src/data.ts의 SONGS와 같은 순서.
# 사용: python3 scripts/gen-songs.py
import os, re, wave
import numpy as np

RATE = 44100
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

src = open(os.path.join(ROOT, 'src', 'data.ts'), encoding='utf-8').read()
block = src[src.index('export const SONGS'):src.index('export const songMs')]
songs = [[(float(f), float(d)) for f, d in re.findall(r'\[(\d+), *(\.?\d+(?:\.\d+)?)\]', n)] for n in re.findall(r'n: \[(.*?)\] \}', block)]
assert len(songs) == 13, len(songs)

def note(fq, d):
    t = np.arange(int(d * RATE)) / RATE
    f = fq * 1.15 * (0.8 / 1.15) ** (t / d)            # exponentialRamp fq*1.15 → fq*0.8
    ph = np.cumsum(f) / RATE
    tri = 2 * np.abs(2 * (ph - np.floor(ph + 0.5))) - 1
    a = np.where(t < 0.03, 0.0001 * (0.09 / 0.0001) ** (t / 0.03), 0.09 * (0.0001 / 0.09) ** ((t - 0.03) / max(d - 0.03, 1e-3)))
    return tri * a

for i, ns in enumerate(songs):
    y = np.concatenate([note(f, d) for f, d in ns] + [np.zeros(int(0.05 * RATE))])
    y = y / 0.09 * 0.5  # 다른 효과음과 비슷한 크기로
    pcm = (np.clip(y, -1, 1) * 32767).astype('<i2')
    with wave.open(os.path.join(ROOT, 'assets', 'sfx', f'song{i}.wav'), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(RATE); w.writeframes(pcm.tobytes())
print(len(songs), 'songs')
