# OLearn — Elderly Digital Literacy Trainer

OLearn is an Android digital literacy training application designed specifically for elderly and low-literacy users in India. It teaches 8 core real-world smartphone tasks across WhatsApp and Google Pay using sandboxed mock replica interfaces (never live overlays on real apps), clear voice narration in English, Hindi, and Malayalam, and a single-action highlight guidance system with zero progress penalties.

## Key Features

- **Config-Driven Task Engine**: Defined entirely in `src/config/tasks.json` with step-by-step guidance, single highlighted active element, and gentle nudges on wrong taps.
- **8 Core Tasks + Extensible 9th Task**:
  - **WhatsApp**: Send text message, Send photo, Make voice call, Make video call.
  - **Google Pay**: Check bank balance, Scan QR code & pay, Send money to saved contact, View transaction history.
    Send money has the learner type any amount on a number pad, then pick the bank on a "Select payment method" sheet. Scan QR still uses the old amount screen (fixed ₹200 and "Proceed to Pay").
  - **Dummy 9th Task (Extensibility Test)**: Send voice note — added solely via JSON configuration and audio assets with zero code changes.
- **Trilingual Voice Narration**:
  - English, Hindi, and Malayalam voice narration for all steps.
  - One neural voice per language (edge-tts, generated from `tasks.json` by `scripts/generate-audio.py`; see `docs/audio.md`).
  - 111 pre-bundled offline MP3 audio clips (37 per language) in `public/assets/audio/`.
- **"Ask Me" Natural Language Task Router**:
  - Large centered microphone with persistent "Tap and speak" label.
  - Natural language intent routing in English, Hindi, and Malayalam.
  - Clarifying question dialog on ambiguous inputs (e.g. Voice Call vs Video Call).
  - Web Speech API and Whisper-1 STT / GPT-4o-mini classification support (via the OLearn API server; the OpenAI key never reaches the browser).
- **Senior Accessibility Standards**:
  - Typography: Minimum 20sp body text, 24–28sp bold headers, nothing below 18sp.
  - High-contrast solid backgrounds: Green accent for WhatsApp (`#075E54`), blue accent for Google Pay (`#1A73E8`).
  - Large touch targets: Minimum 64dp height for task buttons, 120dp for Home app icons.
  - Practice-repeat loop without penalty or data loss.

## Running Locally

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

Open [http://localhost:3000/](http://localhost:3000/) in your browser.

The Vite dev server proxies `/api` to the API server at `http://localhost:3001`. The OpenAI key is read only by the server from `.env` and is never sent to the browser. Without a key, or with the server stopped or the device offline, Ask Me falls back to on-device keyword matching and the tutorials work as normal.

| Variable | Used by | Default | Purpose |
| --- | --- | --- | --- |
| `OPENAI_API_KEY` | server | _(none)_ | Whisper-1 and GPT-4o-mini. If unset, `/api/stt` and `/api/route` return `503 {"error":"ai_unavailable"}`. |
| `PORT` | server | `3001` | API server port. The Vite proxy expects 3001. |
| `CLIENT_ORIGIN` | server | _(none)_ | Browser origin allowed by CORS. Not needed when using the Vite proxy. |
