# OLearn on Android (debug APK)

The Android app is the same OLearn web app wrapped with Capacitor 7. It is built by GitHub Actions; no Android Studio is needed.

## Read this first

**The microphone says "Please allow the microphone" and no permission box appears.**
Someone tapped "Don't allow" (or "Don't ask again") earlier, so Android no longer asks. To fix it:
open the phone's **Settings › Apps › OLearn › Permissions › Microphone** and choose **Allow only while using the app**.
(Or press and hold the OLearn icon › App info › Permissions.) Then go back to OLearn and tap the mic again.

**Malayalam voice may say "Didn't catch that, tap and try again" even when you spoke clearly.**
Voice input uses the phone's own speech service (from Google). Some phones cannot recognise Malayalam, and newer Android
versions do not tell the app that clearly, so OLearn can only say it did not catch that. Typing in the box below the mic always works.

**How to check that a phone has Google's speech service** (menu names differ a little between phones):
1. Settings › Apps › show all apps: look for **Google** and **Speech Services by Google** (sometimes "Speech Recognition and Synthesis from Google"). Both should be there and not disabled.
2. Quick test: open the **Google** app (or Gboard, the Google keyboard), tap its mic and speak. If that works, OLearn's mic should work for that language too.
3. For Malayalam or Hindi: in the Google app, tap your profile picture › Settings › Voice › Languages, and add **മലയാളം (ഇന്ത്യ)** or **हिन्दी (भारत)**. Then repeat the quick test in that language.

If the phone has no speech service at all (some phones sold without Google apps), OLearn says "Voice isn't available here, please type your question".

## Build the APK

The workflow `.github/workflows/android-debug.yml` ("Android debug APK") runs:
- automatically on every push to `ui-sandbox` or `main`, or
- by hand: GitHub › **Actions** › **Android debug APK** › **Run workflow** › choose the branch › **Run workflow**.

It takes about 5-10 minutes.

## Download the APK

1. GitHub › **Actions** › open the finished run (green tick).
2. At the bottom, under **Artifacts**, click **olearn-debug-apk**. You get a zip file.
3. Unzip it: inside is `app-debug.apk`. Artifacts are kept for 30 days.

To get it onto the phone: download it on the phone's browser directly (signed in to GitHub), or copy it over by USB, Google Drive or similar.

## Install

1. On the phone, tap `app-debug.apk` (in Files or the browser's downloads).
2. Android asks to allow installs from this source: tap **Settings**, turn on **Allow from this source**, go back.
3. Tap **Install**. If Play Protect warns about an unknown app, choose **Install anyway** (it is a debug build, not from the Play Store).

## Update

Install the new APK over the old one, the same way. Progress and settings are kept.

If Android says the app **"conflicts with an existing package"** or the signature does not match, the new APK was signed with a different
debug key. This happens when GitHub has dropped the stored key (unused for 7 days) or when switching between APKs from `ui-sandbox` and `main`.
Then uninstall OLearn first and install the new one. **Uninstalling deletes progress and settings.**

## Known limits

- Voice needs internet (as on the web). Offline, the mic shows "No internet, please type". Tutorials and narration work fully offline.
- On the phone the spoken words appear when you finish speaking, not word by word while you speak as in Chrome.
- Voice listens for up to 15 seconds and stops by itself after a pause.
- Narration uses the bundled clips. If a clip were ever missing, the backup voice (device speech) may stay silent inside the app,
  and the Repeat Voice button may stay highlighted.
- Light theme only. The app always stays upright (portrait).
- Android's font size setting does not change OLearn; use OLearn's own **Settings › Text size**. Android's **Display size** setting still
  makes everything bigger or smaller together, as in Chrome.
- Debug build only: not for the Play Store.

## Test checklist (on a real phone)

Startup
- [ ] Cold start: native splash (Mitra on cream), then the OLearn animation (about 2.5 s), then Home (or the language choice on first start).
- [ ] Tap during the animation: it skips straight on.
- [ ] Settings › Reduce motion on, close the app fully, reopen: still Mitra and name, a short fade, no bounce.
- [ ] Switch to another app and back: the animation does not play again.

Microphone (Ask Me)
- [ ] English: "how do I send a photo" opens the right tutorial.
- [ ] Hindi (language set to Hindi): a Hindi question works.
- [ ] Malayalam: a Malayalam question works, or note what the phone shows.
- [ ] Tap the mic while listening: it stops and uses what was heard.
- [ ] Say nothing: "Didn't catch that, tap and try again" after a few seconds; the mic does not stay red.
- [ ] First use: Android asks for the microphone. Tap **Don't allow**: "Please allow the microphone" message and voice clip.
- [ ] Deny again / "Don't ask again", then fix it in Settings as described at the top: the mic works again.
- [ ] Airplane mode: "No internet, please type"; typing still works; tutorials and narration still play.

Navigation and display
- [ ] Back button: Settings, Ask Me and a task list go to Home; inside a tutorial goes back to the task list; on Home the app closes.
- [ ] Back during the startup animation skips it.
- [ ] Rotate the phone: the app stays upright.
- [ ] Android Settings › Display › Font size at maximum: OLearn looks the same.
- [ ] OLearn Settings › Text size: Normal, Large, Larger, Largest all change the text.
- [ ] The status bar and the navigation bar/gesture area do not cover any OLearn content; bars are cream with dark icons.
- [ ] During a tutorial the screen does not turn off by itself (wait longer than the phone's screen timeout); on Home it does.

Audio
- [ ] Each tutorial step speaks on its own (no tap needed).
- [ ] **Repeat Voice** replays the step.
- [ ] Correct-tap and celebration sounds play.

## For developers

- Config: `capacitor.config.ts` (appId `com.olearn.app`, webDir `dist`). Native project: `android/` (build outputs, `local.properties`
  and keystores are git-ignored; the web files are copied in by `npx cap sync android`, not committed).
- `MainActivity` sets the WebView text zoom to 100%, so Android's font size never scales the app.
- Voice: `src/services/STTService.ts` uses `@capacitor-community/speech-recognition` only inside the app; the web keeps the Web Speech API.
- Icons and splash: sources in `assets/` (rendered from the Mitra SVG in `src/components/Mascot.tsx`), generated into `android/app/src/main/res`
  with `npx @capacitor/assets@3.0.5 generate --android --assetPath assets`.
- Local build (needs JDK 21 and the Android SDK): `npm run build && npx cap sync android && cd android && ./gradlew assembleDebug`.
