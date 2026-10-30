# src/stage/pixelCat.ts의 도트 고양이 그림을 8종 털색으로 칠해 한 장의 미리보기 PNG로 만든다.
# 사용: python3 scripts/gen-pixel-preview.py <출력.png>
import os, re, sys
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = open(os.path.join(ROOT, 'src', 'stage', 'pixelCat.ts'), encoding='utf-8').read()
INK = '#4A3428'
pals = {}
for cid, b, rest in re.findall(r"(\w+): pal\('(#\w+)'(?:, \{([^}]*)\})?\)", src):
    p = dict(O=INK, B=b, S=b, P=b, Q=b, W=b, E='#2B221D', N='#E8A0A0')
    for k, v in re.findall(r"(\w): '(#\w+)'", rest or ''): p[k] = v
    pals[cid] = p
frames = {}
for name, body in re.findall(r"  (\w+): \[\n(.*?)\n  \],", src, re.S):
    frames[name] = re.findall(r"'([^']*)'", body)
S = 8
names = list(frames)
im = Image.new('RGB', (len(names) * 21 * S + S, len(pals) * 15 * S + S), '#FBF6EE')
for j, (cid, p) in enumerate(pals.items()):
    for i, n in enumerate(names):
        for y, row in enumerate(frames[n]):
            for x, ch in enumerate(row):
                if ch != '.':
                    ImageDraw.Draw(im).rectangle([S + i * 21 * S + x * S, S + j * 15 * S + y * S, S + i * 21 * S + x * S + S - 1, S + j * 15 * S + y * S + S - 1], fill=p.get(ch, INK))
im.save(sys.argv[1] if len(sys.argv) > 1 else 'pixel-cats.png')
print(names, list(pals))
