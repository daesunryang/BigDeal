// 데모 앱의 웹 빌드를 Claude 아티팩트(냥집중 미리보기)에 올릴 수 있는 폴더로 만든다.
// 사용: node scripts/web-artifact.js <저장 폴더>
// 그 뒤 Artifact 도구로 <저장 폴더>/index.html을 publish (root = 저장 폴더, files = files.json의 목록, url = AGENTS.md의 미리보기 주소)
// 아티팩트는 '_'로 시작하는 경로를 못 쓰고 어느 주소 아래에서 열릴지 모르므로, 스크립트는 app/ 아래로 옮기고 모든 경로를 상대 경로로 바꾼다.
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const OUT = path.resolve(process.argv[2] || 'web-artifact');
const TMP = OUT + '-export';
fs.rmSync(OUT, { recursive: true, force: true });
fs.rmSync(TMP, { recursive: true, force: true });
execSync(`npx expo export --platform web --output-dir "${TMP}"`, { stdio: 'inherit', env: { ...process.env, EXPO_OFFLINE: '1', CI: '1' } });

const jsDir = path.join(TMP, '_expo/static/js/web');
const jsName = fs.readdirSync(jsDir).find(f => f.endsWith('.js'));
let js = fs.readFileSync(path.join(jsDir, jsName), 'utf8');
// 글꼴은 node_modules/@expo-google-fonts/… 아래에 나오는데, 아티팩트 경로에 맞게 assets/fonts/로 모은다
js = js.replace(/"\/assets\/node_modules\/@expo-google-fonts\/[a-z-]+\/400Regular\//g, '"./assets/fonts/').replace(/"\/assets\//g, '"./assets/');

fs.mkdirSync(path.join(OUT, 'app'), { recursive: true });
fs.writeFileSync(path.join(OUT, 'app', jsName), js);
fs.cpSync(path.join(TMP, 'assets'), path.join(OUT, 'assets'), { recursive: true });
const fontRoot = path.join(OUT, 'assets/node_modules');
if (fs.existsSync(fontRoot)) {
  fs.mkdirSync(path.join(OUT, 'assets/fonts'), { recursive: true });
  const walk = d => fs.readdirSync(d, { withFileTypes: true }).forEach(e => { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (p.endsWith('.ttf')) fs.renameSync(p, path.join(OUT, 'assets/fonts', e.name)); });
  walk(fontRoot);
  fs.rmSync(fontRoot, { recursive: true, force: true });
}

fs.writeFileSync(path.join(OUT, 'index.html'), `<!DOCTYPE html>
<title>냥집중 미리보기</title>
<style>
  :root { --bg: #FBF6EE; color-scheme: light; }
  html, body { height: 100%; }
  body { background: var(--bg); overflow: hidden; }
  #root { display: flex; height: 100%; flex: 1; }
</style>
<noscript>냥집중을 보려면 JavaScript를 켜 주세요.</noscript>
<div id="root"></div>
<script src="./app/${jsName}" defer></script>
`);

const files = {};
const list = d => fs.readdirSync(path.join(OUT, d), { withFileTypes: true }).forEach(e => { const p = path.posix.join(d, e.name); if (e.isDirectory()) list(p); else files[p] = p; });
list('app'); list('assets');
fs.writeFileSync(path.join(OUT, '..', path.basename(OUT) + '-files.json'), JSON.stringify(files, null, 1));
fs.rmSync(TMP, { recursive: true, force: true });
console.log(Object.keys(files).length + '개 파일 → ' + OUT);
