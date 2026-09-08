# OLearn — Elderly Digital Literacy Trainer

OLearn is an Android digital literacy training application designed specifically for elderly and low-literacy users in India. It teaches 8 core real-world smartphone tasks across WhatsApp and Google Pay using sandboxed mock replica interfaces (never live overlays on real apps), clear voice narration in English, Hindi, and Malayalam, and a single-action highlight guidance system with zero progress penalties.

## Key Features

- **Config-Driven Task Engine**: Defined entirely in `src/config/tasks.json` with step-by-step guidance, single highlighted active element, and gentle nudges on wrong taps.
- **8 Core Tasks + Extensible 9th Task**:
  - **WhatsApp**: Send text message, Send photo, Make voice call, Make video call.
  - **Google Pay**: Check bank balance, Scan QR code & pay, Send money to saved contact, View transaction history.
  - **Dummy 9th Task (Extensibility Test)**: Send voice note — added solely via JSON configuration and audio assets with zero code changes.
- **Trilingual Voice Narration**:
  - English, Hindi, and Malayalam voice narration for all steps.
  - Malayalam narration powered by Google Translate public TTS endpoint per PRD decision log.
  - 93 pre-bundled offline MP3 audio clips in `public/assets/audio/`.
- **"Ask Me" Natural Language Task Router**:
  - Large centered microphone with persistent "Tap and speak" label.
  - Natural language intent routing in English, Hindi, and Malayalam.
  - Clarifying question dialog on ambiguous inputs (e.g. Voice Call vs Video Call).
  - Web Speech API and Whisper-1 STT / GPT-4o-mini classification support.
- **Senior Accessibility Standards**:
  - Typography: Minimum 20sp body text, 24–28sp bold headers, nothing below 18sp.
  - High-contrast solid backgrounds: Green accent for WhatsApp (`#075E54`), blue accent for Google Pay (`#1A73E8`).
  - Large touch targets: Minimum 64dp height for task buttons, 120dp for Home app icons.
  - Practice-repeat loop without penalty or data loss.

## Running Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Production build
npm run build
```

Open [http://localhost:3000/](http://localhost:3000/) in your browser.
