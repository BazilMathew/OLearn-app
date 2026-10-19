# OLearn

OLearn teaches older adults in India to use WhatsApp and Google Pay. Learners practise on copies of the two apps built into OLearn, so a wrong tap can't send a real message or move real money. Every instruction is spoken in English, Hindi or Malayalam, shown as a caption, and paired with a highlight on the one thing to tap next. Tapping something else gets a gentle nudge and nothing more.

It runs in the browser and as an Android app.

## Tutorials

There are 20 tutorials with 122 steps between them, and each one starts on a pretend phone home screen, the way it would on a real phone.

WhatsApp (11): send a text message, send a photo, send a voice note, make a voice call, make a video call, find a contact with search, send a photo as a document, share your location, add a status, forward a message, block an unknown number.

Google Pay (9): check your balance, view transaction history, share a payment receipt, scan a QR code and pay, send money to a saved contact, pay a UPI ID or phone number, send money to a bank account, recharge a mobile number, report a fraud payment.

Blocking unknown numbers and reporting fraud payments are in the list because scammers often go after older people.

## How it works

Tutorials are data, not code. Each task in `src/config/tasks.json` lists its steps, and each step names the screen, the element to highlight, the narration clip and the hint in all three languages. Adding a task mostly means editing that file and generating its audio.

The practice screens in `src/replicas/` follow the light-mode look of WhatsApp and Google Pay. They show English by default, since most phones display these apps in English; a setting switches them to the learner's language.

Narration ships inside the app as 225 MP3 clips (75 per language), so tutorials work offline. `scripts/generate-audio.py` makes them with edge-tts, one neural voice per language, from the same text the captions use, which keeps the voice and the caption saying the same thing. See `docs/audio.md`.

Ask Me lets a learner say or type what they want, like "how do I pay someone", and opens the matching tutorial. With the server running, an AI model on the server turns speech into text and picks the task. Without the server, or offline, the phone matches keywords from all three languages at once, because people often mix languages when they talk. If two tasks score close (voice call and video call, say), it asks which one rather than guessing. On Android it listens through the phone's own speech service, falls back to Google's voice box if that fails, and drops to the typing box if nothing can listen. The Voice check in Settings produces a report testers can paste into WhatsApp.

Settings also cover language, narration speed, text size (up to 150%), Reduce motion and Reset progress.

There are no accounts. Progress and settings stay on the device, and the AI key stays on the server, where the browser and the phone can't see it.

## Tech stack

- App: React 18, TypeScript, Vite, Tailwind CSS
- Android: Capacitor 7, for native speech recognition, keep-awake and the back button
- Server: Node.js and Express 5, with rate limiting, Helmet security headers, CORS and size limits
- Narration: edge-tts (`scripts/generate-audio.py`)
- Testing: a tutorial audit that runs in a headless browser (`scripts/audit-tutorials.mjs`)
- CI: GitHub Actions builds a debug APK on every push to `main`

## Project structure

```
src/
  config/tasks.json        all 20 tutorials (steps, highlights, hints, audio paths)
  engine/                  tutorial player and highlight ring
  replicas/                mock WhatsApp and Google Pay screens
  screens/                 Startup, Language, Home, Task list, Ask Me, Settings, Voice check
  services/                audio, speech-to-text, Ask Me routing, local storage
server/                    API server for AI speech-to-text and routing
public/assets/audio/       narration clips (en, hi, ml)
android/                   Capacitor Android project
scripts/                   narration generator, tutorial audit, matching tests
docs/                      Android, audio and narration notes
```

## Running locally

```bash
# Install dependencies
npm install

# Optional: enable AI speech-to-text and routing
cp .env.example .env   # then set OPENAI_API_KEY in .env

# Start the web app (port 3000) and the API server (port 3001) together
npm run dev:all

# Or run them separately
npm run dev          # web app only
npm run dev:server   # API server only

# Production build (typechecks client and server, then builds the client)
npm run build
```

Then open [http://localhost:3000/](http://localhost:3000/).

The Vite dev server proxies `/api` to the API server at `http://localhost:3001`. Only the server reads the key from `.env`, and it never goes to the browser. If there's no key, the server is stopped or the device is offline, Ask Me uses on-device keyword matching and the tutorials work as usual.

| Variable | Used by | Default | Purpose |
| --- | --- | --- | --- |
| `OPENAI_API_KEY` | server | _(none)_ | Speech-to-text and Ask Me routing. If unset, `/api/stt` and `/api/route` return `503 {"error":"ai_unavailable"}`. |
| `PORT` | server | `3001` | API server port. The Vite proxy expects 3001. |
| `CLIENT_ORIGIN` | server | _(none)_ | Browser origin allowed by CORS. Not needed with the Vite proxy. |

## Android app

GitHub Actions builds a debug APK on every push to `main`, or when you start it by hand from the Actions tab. Open the finished run and download olearn-debug-apk under Artifacts. Installing, voice troubleshooting and the Voice check are covered in [`docs/android.md`](docs/android.md).

## Testing

```bash
# Check that every narration clip exists and all three languages match
node --import tsx scripts/audit-tutorials.mjs --audio-only

# Full audit: plays every step of every task in a headless browser
npm run build && npx vite preview --port 3000 --strictPort
node --experimental-websocket --import tsx scripts/audit-tutorials.mjs --out <screenshot folder outside the project>
```

The full audit goes through every tutorial in all three languages, at several screen sizes, at every text size and with motion on and off. It checks layout, taps and results, and that each hint quotes the button's label exactly as it appears on screen.

## Roadmap

- A prototype where AI builds the practice screens and explains tasks that aren't in the fixed list
- A hosted backend, so voice input works on the web link
- More WhatsApp and Google Pay tasks

## Credits

Built by Blesji Abraham, Bazil Mathew, Amrita P and Abel V James, the OLearn team.
