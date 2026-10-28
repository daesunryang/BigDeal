# 집중냥 (F cat)

방해 앱을 막고 집중하면 고양이가 자라고, 모은 츄르는 실제 보호소 고양이의 사료가 되는 Android 앱입니다.
Claude Design에서 만든 프로토타입(`집중냥 App.dc.html`)을 React Native + Expo(SDK 57)로 옮겼습니다.

## 두 가지 APK

| | 데모 (`APP_FLAVOR=demo`) | 정식 (`APP_FLAVOR=full`) |
|---|---|---|
| 패키지 | `com.jibjungnyang.demo` | `com.jibjungnyang.app` |
| 앱 차단 | `(데모) 인스타그램 열어보기` 버튼으로 흉내 | 실제 차단: 사용 정보 접근 + 다른 앱 위에 표시, 포그라운드 서비스 |
| 차단할 앱 목록 | 예시 6개 | 휴대폰에 설치된 앱 (아이콘 · 오늘 사용 시간) |
| 로그인 | 예시 계정 | Firebase Auth (Google · 이메일) |
| 백업 · 동기화 | 흉내 | Firestore 자동 동기화, 친구 코드, 문의하기 저장 |
| 타이머 | 30배속 (메뉴 → 프로토타입 검토에서 끄기) | 실제 시간 |
| 시작 데이터 | 프로토타입 예시 수치 | 빈 상태 (웰컴 츄르 20개 우편) |

두 빌드 모두 결제 후원, Plus 구독, 광고 보상은 **화면 데모**입니다 (실제 결제·광고 SDK 없음).

## APK 받기

GitHub Actions의 **Android APK** 워크플로가 푸시마다 두 APK를 만듭니다.
Actions → 실행 하나 선택 → Artifacts에서 `jibjungnyang-demo-apk`, `jibjungnyang-full-apk`를 내려받으세요.
수동으로 돌리려면 Actions → Android APK → Run workflow.

서명 키 비밀값이 없으면 디버그 키로 서명돼서, 직접 설치(사이드로드)는 되지만 Play 스토어에는 올릴 수 없습니다.

## 정식 빌드 설정 (Firebase)

키가 없어도 정식 APK는 만들어집니다. 그때는 로그인·동기화 없이 이 기기에만 저장되고, 앱 차단은 그대로 동작합니다.

1. [Firebase 콘솔](https://console.firebase.google.com)에서 프로젝트를 만들고 **웹 앱**을 추가해 설정 값을 받습니다.
2. Authentication → 로그인 방법에서 **Google**과 **이메일/비밀번호**를 켭니다. Google 공급자의 **웹 클라이언트 ID**를 복사합니다.
3. Google 로그인용으로 Android 앱(`com.jibjungnyang.app`)도 Firebase 프로젝트에 추가하고, APK 서명 키의 **SHA-1**을 등록합니다.
   (디버그 키로 서명된 CI 빌드라면 그 디버그 키의 SHA-1. 릴리스 키를 쓰면 릴리스 키의 SHA-1.)
4. Firestore를 만들고 이 저장소의 `firestore.rules`를 규칙으로 배포합니다.
5. GitHub 저장소 Settings → Secrets and variables → Actions에 다음 비밀값을 넣습니다.
   `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`, `FIREBASE_MESSAGING_SENDER_ID`, `FIREBASE_APP_ID`, `GOOGLE_WEB_CLIENT_ID`
6. (선택) 릴리스 서명: `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`

로컬에서는 `.env.example`을 `.env`로 복사해 같은 값을 넣으면 됩니다.

## 로컬 개발

```bash
npm install
npm run web                                   # 브라우저에서 화면 확인 (데모)
APP_FLAVOR=demo npx expo run:android          # 데모 빌드를 기기에서
APP_FLAVOR=full npx expo run:android          # 정식 빌드 (Android SDK 필요)
npx tsc --noEmit                              # 타입 검사
```

## 구조

```
App.tsx                 화면 전환, 타이머, 뒤로가기, 복구, 차단·동기화 연결
src/store.ts            앱 상태와 동작 (프로토타입의 state · 메서드를 옮김), AsyncStorage에 저장
src/data.ts             고양이·아이템·방·문구 등 상수
src/screens/            스플래시·로그인·권한, 홈, 탭들, 방 꾸미기, 집중·완료·실패·휴식, 메뉴, 팝업
src/stage/              고양이 방 장면(가구·창·행동 애니메이션), 우리 집 평면도
src/ui/                 공통 컴포넌트, CSS @keyframes를 옮긴 애니메이션
src/services/           blocker(네이티브 차단), auth(Firebase 로그인), sync(Firestore)
modules/app-blocker/    Kotlin 네이티브 모듈: 설치 앱 목록, 권한 확인, 차단 서비스와 덮개 화면
plugins/withAppBlocker.js  정식 빌드에만 붙는 권한·서비스 설정
```

## 실제 차단 동작 (정식 · Android)

1. 처음 실행 때 **사용 정보 접근**과 **다른 앱 위에 표시**를 허용합니다 (누르면 설정 화면이 열려요).
2. 집중을 시작하면 포그라운드 서비스가 알림에 남은 시간을 보여주며 0.7초마다 지금 열린 앱을 확인합니다.
3. 차단한 앱이 열리면 "지금은 집중 시간이에요" 고양이 화면이 그 위를 덮습니다. 엄격 모드가 아니면 "그래도 열기 (세션 포기)"로 포기할 수 있습니다.
4. 앱이 강제 종료돼도 서비스는 계속 막고, 다시 열면 남은 시간으로 이어지거나 복구 안내가 나옵니다.

## 아직 예시인 것

- 보호소·파트너 정보, 약관·개인정보 처리방침 문안 (출시 전 교체와 법무 검토 필요)
- 결제 후원, Plus 구독, 광고 보상, 리마인더 알림, 위젯 (화면만)
- 사진 자리(보호소·동물·아이템 그림)는 줄무늬 자리표시로 남아 있음
- iOS 스크린 타임 차단은 아직 없음 (화면은 iOS에서도 동작)
