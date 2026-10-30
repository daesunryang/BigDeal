// 집중 화면 "불멍" 장면의 도트 고양이.
// 그림은 한 장의 틀(글자 격자)로 그리고, 고양이마다 실제 일러스트(assets/img/cat-*.png)에서 뽑은 털색을 입힌다.
// 글자: O 테두리 · B 기본 털 · S 줄무늬/무늬 · P 얼룩(삼색이의 검은 얼룩) · Q 포인트(샴·랙돌의 귀·얼굴·발·꼬리)
//       W 흰 털(가슴·발끝) · E 눈 · N 코·귀 안쪽 · . 투명
// 모든 그림은 오른쪽을 본다. 왼쪽으로 갈 때는 좌우를 뒤집어 그린다.

export type PixelKey = 'O' | 'B' | 'S' | 'P' | 'Q' | 'W' | 'E' | 'N';
export type Palette = Record<PixelKey, string>;

const INK = '#4A3428';
const pal = (B: string, o: Partial<Palette> = {}): Palette => ({ O: INK, B, S: B, P: B, Q: B, W: B, E: '#2B221D', N: '#E8A0A0', ...o });

// 일러스트의 주요 색 (scripts/gen-pixel-preview.py로 확인)
export const PALETTES: Record<string, Palette> = {
  cheese: pal('#E9AC7C', { S: '#B8744A', W: '#F9E9D7' }),
  blue: pal('#8F9DA6', { S: '#7A8B96', W: '#A9B4BA', N: '#C9A2A6' }),
  calico: pal('#FAEADA', { S: '#DEA47B', P: '#806050', W: '#FFF6EC' }),
  tux: pal('#3E3032', { W: '#FAEBDA', E: '#D9C27A', N: '#C98F8F' }),
  ragdoll: pal('#EED8C3', { Q: '#846C5E', W: '#FBF3EA', E: '#5B8FC9' }),
  siam: pal('#F1DEC8', { Q: '#4A3B3A', E: '#5B8FC9', N: '#8A6A66' }),
  persian: pal('#DCD0C7', { S: '#C7B8AD', W: '#F4E9DF' }),
  angora: pal('#F6ECE0', { W: '#FFFAF3', E: '#C9A24A' }),
};
export const paletteOf = (id: string) => PALETTES[id] || PALETTES.cheese;

// ── 동작 그림 (가로 20 × 세로 14) ──
export const FRAMES: Record<string, string[]> = {
  walk1: [
    '....................',
    '...............O..O.',
    '..............OQOOQO',
    '.O............OQNNQO',
    'OSO..........OBBBBBO',
    'OBO..........OBEBEBO',
    '.OQO.OOOOOOOOOBBNBBO',
    '..OBOBSBBSBBSBOWWWO.',
    '...OBBSPPBSBBSBBWWO.',
    '...OBBPPPBBBBBBWWO..',
    '...OBWWWWWWWWWBBO...',
    '...OQBO.OQO.OBQO....',
    '....OQO..OQO.OQO....',
    '.....O....O...O.....',
  ],
  walk2: [
    '....................',
    '...............O..O.',
    '..............OQOOQO',
    '..............OQNNQO',
    '.OSO.........OBBBBBO',
    '.OBO.........OBEBEBO',
    '..OQOOOOOOOOOOBBNBBO',
    '..OBOBSBBSBBSBOWWWO.',
    '...OBBSPPBSBBSBBWWO.',
    '...OBBPPPBBBBBBWWO..',
    '...OBWWWWWWWWWBBO...',
    '...OQBO.OQO.OBQO....',
    '...OQO..OQO..OQO....',
    '....O....O....O.....',
  ],
  walk3: [
    '....................',
    '...............O..O.',
    '..............OQOOQO',
    '.O............OQNNQO',
    'OSO..........OBBBBBO',
    'OBO..........OBEBEBO',
    '.OQO.OOOOOOOOOBBNBBO',
    '..OBOBSBBSBBSBOWWWO.',
    '...OBBSPPBSBBSBBWWO.',
    '...OBBPPPBBBBBBWWO..',
    '...OBWWWWWWWWWBBO...',
    '....OQO.OBQO.OQO....',
    '....OQO..OQO..OQO...',
    '.....O....O....O....',
  ],
  sit: [
    '.........O..O.......',
    '........OQOOQO......',
    '........OQNNQO......',
    '.......OBBBBBBO.....',
    '.......OBEBBEBO.....',
    '.......OBBNNBBO.....',
    '........OWWWWO......',
    '.......OBWWWWBO.....',
    '......OBSBWWBSBO....',
    '......OPPSWWSBBO.OO.',
    '......OPPBWWBBBO.OSO',
    '......OBBBWWBBBOOBO.',
    '......OQWOOOOWQBBO..',
    '.......OO....OOOO...',
  ],
  sitTail: [
    '.........O..O.......',
    '........OQOOQO......',
    '........OQNNQO......',
    '.......OBBBBBBO.....',
    '.......OBEBBEBO.....',
    '.......OBBNNBBO.....',
    '........OWWWWO......',
    '.......OBWWWWBO.....',
    '......OBSBWWBSBO....',
    '......OPPSWWSBBO....',
    '......OPPBWWBBBO....',
    '......OBBBWWBBBO.OO.',
    '......OQWOOOOWQOOBSO',
    '.......OO....OOOOOO.',
  ],
  blink: [
    '.........O..O.......',
    '........OQOOQO......',
    '........OQNNQO......',
    '.......OBBBBBBO.....',
    '.......OBOOBOOO.....',
    '.......OBBNNBBO.....',
    '........OWWWWO......',
    '.......OBWWWWBO.....',
    '......OBSBWWBSBO....',
    '......OPPSWWSBBO.OO.',
    '......OPPBWWBBBO.OSO',
    '......OBBBWWBBBOOBO.',
    '......OQWOOOOWQBBO..',
    '.......OO....OOOO...',
  ],
  groom: [
    '.........O..O.......',
    '........OQOOQO......',
    '........OQNNQO......',
    '.......OBBBBBBO.....',
    '.......OBOOBOOO.....',
    '.......OBBNNWWO.....',
    '........OWWOWWO.....',
    '.......OBWWOQWO.....',
    '......OBSBWWOQO.....',
    '......OPPSWWBOBO.OO.',
    '......OPPBWWBBBO.OSO',
    '......OBBBWWBBBOOBO.',
    '......OQWOOOOOOBBO..',
    '.......OO......OO...',
  ],
  loaf: [
    '....................',
    '....................',
    '....................',
    '....................',
    '...............O..O.',
    '..............OQOOQO',
    '..............OQNNQO',
    '....OOOOOOOOOOBBBBBO',
    '...OBBSPPSBBSBBEBEBO',
    '..OBBBPPPBBSBBBBNBBO',
    'OOBBBBBBBBBBBBBOWWO.',
    'OSOBBBBBBBBBBBBBWO..',
    '.OOQWWWWWWWWWWWQO...',
    '...OOOOOOOOOOOOOO...',
  ],
  sleep1: [
    '....................',
    '....................',
    '....................',
    '....................',
    '....................',
    '....................',
    '..............O..O..',
    '.....OOOOOOOOOQOOQO.',
    '...OOBBSPPSBBOQNNQO.',
    '..OBBBPPPBBSBBBBBBO.',
    '.OBBBBBBBBBBBOOBOOBO',
    'OSBBBBBBBBBBBBBNNBO.',
    'OQBBWWWWWWWWBBWWWO..',
    '.OOOOOOOOOOOOOOOO...',
  ],
  sleep2: [
    '....................',
    '....................',
    '....................',
    '....................',
    '....................',
    '....................',
    '....................',
    '.....OOOOOOOO.O..O..',
    '...OOBBSPPSBBOQOOQO.',
    '..OBBBPPPBBSBBQNNQO.',
    '.OBBBBBBBBBBBBBBBBO.',
    'OSBBBBBBBBBBBOOBOOBO',
    'OQBBWWWWWWWWBBBNNBO.',
    '.OOOOOOOOOOOOOOOOO..',
  ],
  stretch: [
    '....................',
    '....................',
    '....................',
    '................O..O',
    '.O.............OQOOQ',
    'OSO............OQNNQ',
    'OBO...........OBBBBB',
    '.OQO.........OBBEBEB',
    '..OBOOOOO...OBBBBNBB',
    '..OBBSBBSOOOBBBBOWWO',
    '...OBBSBBSBBSBBOOWO.',
    '...OBBBBBBBBBBBBQWO.',
    '...OQWOOOOOOOOOOQWO.',
    '....OO.........OOO..',
  ],
};
export const SPRITE_W = 20, SPRITE_H = 14;

// 같은 색이 이어지는 칸을 한 줄로 묶어 그리기 비용을 줄인다: [x, y, 길이, 색]
export type Run = [number, number, number, string];
const cache: Record<string, Run[]> = {};
export function runsOf(frame: string, id: string): Run[] {
  const key = frame + '|' + id;
  if (cache[key]) return cache[key];
  const p = paletteOf(id), rows = FRAMES[frame] || FRAMES.sit, out: Run[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      if (ch === '.') { x++; continue; }
      const c = p[ch as PixelKey] || INK;
      let n = 1; while (x + n < row.length && (p[row[x + n] as PixelKey] || (row[x + n] === '.' ? null : INK)) === c) n++;
      out.push([x, y, n, c]); x += n;
    }
  });
  return (cache[key] = out);
}
