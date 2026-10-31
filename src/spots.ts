// 고양이마다 랜덤으로 생기는 얼룩. 얼룩은 숫자 하나(씨앗)로 정해지고, 같은 씨앗이면 언제나 같은 얼룩이 나온다.
// 처음 만난 고양이는 이 기기의 spotSalt와 고양이 id로 씨앗을 정하고, 츄르로 "얼룩 다시 뽑기"를 하면 새 씨앗을 받는다 (store.rerollSpots).
// 얼룩 좌표는 고양이 그림 상자 기준 0~1. 일러스트(CatSpots)는 배경을 지운 그림의 모양대로 잘라서, 도트 고양이(pixelCat)는 털 칸에만 칠한다.

export type Blob = [number, number, number, number, number]; // cx, cy, rx, ry, 회전(도)
export type Spots = { kind: 'patch' | 'dot'; name: string; color: string; blobs: Blob[] };

export const SPOT_COST = 200;

// 문자열 → 32비트 씨앗
export function hashSeed(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// 털이 어두운 고양이에게는 밝은 얼룩, 밝은 고양이에게는 어두운 얼룩이 잘 보인다
const DARK = ['#4A3428', '#6B4A36', '#7A7470'];
const WARM = ['#D98A4A', '#B8744A'];
const LIGHT = ['#F6EBDD', '#FFF6EC', '#E9C9A4'];
const lum = (hex: string) => { const n = parseInt(hex.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };

export function spotsOf(seed: number, fur: string): Spots {
  const r = rng(seed), pick = (a: string[]) => a[Math.floor(r() * a.length) % a.length];
  const dark = lum(fur) < 0.45;
  const color = dark ? pick([...LIGHT, WARM[0]]) : pick(r() < 0.3 ? WARM : DARK);
  const kind: Spots['kind'] = r() < 0.35 ? 'dot' : 'patch';
  const blobs: Blob[] = [];
  // 눈 · 코가 있는 얼굴 가운데(세로 0.3~0.56)는 비워 둔다. 몸통은 아래쪽, 머리 얼룩은 이마 · 귀 쪽에만
  const spotY = (head: boolean) => (head ? 0.1 + r() * 0.16 : 0.6 + r() * 0.3);
  // 얼룩이 얼굴 높이까지 번지지 않게: 몸통 얼룩은 위끝이 0.56 아래, 머리 얼룩은 아래끝이 0.3 위
  const fit = (b: Blob, head: boolean): Blob => { const e = Math.max(b[2], b[3]); return [b[0], head ? Math.min(b[1], 0.3 - e) : Math.max(b[1], 0.56 + e), b[2], b[3], b[4]]; };
  if (kind === 'patch') {
    // 큰 얼룩 2~4개(가끔 머리에 하나). 한 얼룩은 타원 여러 개를 겹쳐 울퉁불퉁하게
    const n = 2 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++) {
      const head = i === 0 && r() < 0.35, s = head ? 0.06 + r() * 0.05 : 0.08 + r() * 0.07;
      const cx = 0.18 + r() * 0.64, cy = spotY(head);
      const parts = 2 + Math.floor(r() * 2);
      for (let k = 0; k < parts; k++) blobs.push(fit([cx + (r() - 0.5) * s, cy + (r() - 0.5) * s, s * (0.7 + r() * 0.5), s * (0.55 + r() * 0.4), Math.round(r() * 180)], head));
    }
  } else {
    // 작은 점 7~12개
    const n = 7 + Math.floor(r() * 6);
    for (let i = 0; i < n; i++) { const s = 0.035 + r() * 0.035; const head = r() < 0.2; blobs.push(fit([0.15 + r() * 0.7, spotY(head), s, s * (0.75 + r() * 0.3), Math.round(r() * 180)], head)); }
  }
  return { kind, name: kind === 'dot' ? '점박이' : '얼룩무늬', color, blobs };
}

// (x, y)가 얼룩 안에 있는지 (0~1 좌표)
export function inSpot(sp: Spots, x: number, y: number) {
  return sp.blobs.some(([cx, cy, rx, ry, deg]) => {
    const a = (deg * Math.PI) / 180, dx = x - cx, dy = y - cy;
    const u = dx * Math.cos(a) + dy * Math.sin(a), v = -dx * Math.sin(a) + dy * Math.cos(a);
    return (u * u) / (rx * rx) + (v * v) / (ry * ry) <= 1;
  });
}
