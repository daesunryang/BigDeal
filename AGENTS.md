This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- This app does **not** use Expo Router. It ports a single-screen design prototype, so navigation is a small state machine in `src/store.ts` (`screen`, `tab`, `menuPage` and overlay flags), and `App.tsx` renders the matching screen.
- Android back is handled by `useApp.getState().back()` (popup → sheet → sub-screen → tab → home → "press again to exit").
- Screens live in `src/screens/`, shared UI in `src/ui/`, the room drawing in `src/stage/`.

## Flavors

- `APP_FLAVOR=demo` (default): UI demo, everything mocked.
- `APP_FLAVOR=full`: real Android app blocking (`modules/app-blocker`, config plugin `plugins/withAppBlocker.js`), Firebase login and Firestore sync (`src/services/`).

## Feedback loop

- The user reacts to changes in the web checklist artifact https://claude.ai/artifact/TbHNt1WHm9w85JrnqcSxdz (source `tools/feedback/index.html`, db collections `items` and `reactions`, same doc ids). `FEEDBACK.md` is the Git copy.
- When asked to apply feedback ("피드백 반영해 줘"): read `reactions` (and `items`) with the ArtifactData tool, copy status and memo into `FEEDBACK.md`, implement the `수정 필요` items on a new version branch (never on `main` or an older version branch), then set `done: "vX.Y.Z"` and a short Korean `reply` on each handled item and add the new version's changes as new `items` (ids `X.Y.Z-n`, `order` lower than the previous round's). If `FEEDBACK.md` was edited by hand, merge: the later edit wins; ask when unclear.
- Claude Design history lives in the same checklist as items `D<round>-<n>` (round title `디자인 라운드 N · …`, `order` 300+, `source: "design"`). When a new Claude Design handoff bundle arrives, import any new rounds from its `집중냥 업데이트 내역.dc.html` the same way, then port the changed screens to the app.
- Reply to the user in Korean.

## Claude Design canvas (keep in sync)

- The design lives in the Claude Design canvas https://claude.ai/artifact/LbTzdZDAH86SSkY6qHicu6 (it replaces the old claude.ai/design project, which Claude Code can't write to). Its source is kept in `design/canvas/project/` (`canvas.json`, `Main.dc.html` = the interactive prototype, `RealApp.dc.html` = screenshots of the real app).
- Before changing the canvas, read the live `project/*.dc.html` from the artifact (the user may have edited it) and merge into `design/canvas/project/`. Images are canvas assets (`/_blob/<id>`); `Main.dc.html` references them through the CSS variables `--ca` and `--cut-<cat>` in its `<helmet>`.
- After every change that affects UI or behaviour, in the same task:
  1. Port the change into `Main.dc.html` (same rules as the app, e.g. navigation history) and bump the version text in the 앱 정보 page and the notes column.
  2. Start the web dev server (`EXPO_OFFLINE=1 CI=1 BROWSER=none npx expo start --web --port 8081`), run `node scripts/design-shots.js <scratch dir>` (add a step to `SHOTS` for new screens), upload the PNGs as canvas assets and point the `<img>` tags in `RealApp.dc.html` at them; update its title and the `real` page name to the new version.
  3. Publish the changed files to the canvas (root = folder holding `project/`), copy them back to `design/canvas/project/`, and commit.
- When the user edits the design on the canvas, diff the live `Main.dc.html` against `design/canvas/project/Main.dc.html` and port the differences to the app.

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
