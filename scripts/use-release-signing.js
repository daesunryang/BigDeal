// CI에서 릴리스 키가 주어졌을 때 android/app/build.gradle의 release 서명을 그 키로 바꾼다.
const fs = require('fs');
const p = 'android/app/build.gradle';
let s = fs.readFileSync(p, 'utf8');
if (!s.includes('JJN_STORE_FILE')) {
  s = s.replace(/signingConfigs\s*\{/, `signingConfigs {
        jjnRelease {
            storeFile file(JJN_STORE_FILE)
            storePassword JJN_STORE_PASSWORD
            keyAlias JJN_KEY_ALIAS
            keyPassword JJN_KEY_PASSWORD
        }`);
  s = s.replace(/(release\s*\{[^}]*?)signingConfig signingConfigs\.debug/, '$1signingConfig signingConfigs.jjnRelease');
  fs.writeFileSync(p, s);
}
console.log('release signing:', s.includes('signingConfigs.jjnRelease') ? 'custom key' : 'debug key');
