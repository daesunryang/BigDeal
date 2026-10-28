import { Linking, Platform } from 'react-native';
import { APP_VERSION, GITHUB_REPO, IS_DEMO } from '../config';
import { S, getS } from '../store';

// GitHub 릴리스에서 최신 버전을 확인한다. 직접 설치(APK)로 배포하므로 스토어 대신 이걸로 새 버전을 알린다.
type Asset = { name: string; browser_download_url: string };
type Release = { tag_name: string; html_url: string; body?: string; draft?: boolean; prerelease?: boolean; assets: Asset[] };

export function parseVer(v: string) { return v.replace(/^v/i, '').split(/[.-]/).slice(0, 3).map(n => parseInt(n, 10) || 0); }
export function isNewer(remote: string, local: string) {
  const a = parseVer(remote), b = parseVer(local);
  for (let i = 0; i < 3; i++) { if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) > (b[i] ?? 0); }
  return false;
}
// 이 빌드에 맞는 APK: 데모는 이름에 demo가 들어간 것, 정식은 들어가지 않은 것
export function pickApk(assets: Asset[], demo: boolean) {
  const apks = assets.filter(a => a.name.toLowerCase().endsWith('.apk'));
  return apks.find(a => a.name.toLowerCase().includes('demo') === demo) ?? null;
}

export async function checkUpdate(manual = false) {
  if (Platform.OS === 'web' && !manual) return null;
  try {
    const r = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, { headers: { Accept: 'application/vnd.github+json' } });
    if (!r.ok) throw new Error(String(r.status));
    const rel = (await r.json()) as Release;
    if (!isNewer(rel.tag_name, APP_VERSION)) { S({ update: null }); if (manual) getS().toast('최신 버전을 사용 중이에요'); return null; }
    const apk = pickApk(rel.assets, IS_DEMO);
    const info = { tag: rel.tag_name, url: apk?.browser_download_url ?? rel.html_url, page: rel.html_url, notes: (rel.body ?? '').slice(0, 400) };
    S({ update: info });
    return info;
  } catch {
    if (manual) getS().toast('업데이트를 확인하지 못했어요. 네트워크를 확인해 주세요');
    return null;
  }
}

export function openUpdate() {
  const u = getS().update; if (!u) return;
  Linking.openURL(u.url).catch(() => Linking.openURL(u.page).catch(() => {}));
}
