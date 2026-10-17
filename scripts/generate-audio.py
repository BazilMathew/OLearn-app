"""Generate the bundled narration clips from src/config/tasks.json with Microsoft Edge's neural voices.

tasks.json is the single source of truth: every step's audio_<lang> path names the clip and its
hint_text[lang] is what the clip says. Steps that share a clip must share the same text.

    pip install edge-tts
    python scripts/generate-audio.py                          # every clip, every language
    python scripts/generate-audio.py --lang ml                # one language
    python scripts/generate-audio.py --only gpay_bal_step3    # one clip (repeat --only for more)

No API key needed. Exit code 1 if any clip fails or comes out too small.
"""

import argparse
import asyncio
import json
import os
import re
import sys
import time
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent.parent
TASKS = ROOT / "src" / "config" / "tasks.json"
PUBLIC = ROOT / "public"
VOICES = {
    "en": "en-IN-NeerjaNeural",
    "hi": "hi-IN-SwaraNeural",
    "ml": "ml-IN-SobhanaNeural",
}
RATE = "-10%"
TRIES = 3
PAUSE_S = 2
MIN_BYTES = 3 * 1024

RUPEES = {"en": "rupees", "hi": "रुपये", "ml": "രൂപ"}
SON = {"en": "Ramesh", "hi": "रमेश", "ml": "രമേഷ്"}


def speakable(text, lang):
    """Spoken form of a caption. Returns (text, list of substitutions applied)."""
    subs = []

    def amount(m):
        new = f"{m.group(1)} {RUPEES[lang]}"
        subs.append(f"{m.group(0)} -> {new}")
        return new

    text = re.sub(r"₹\s?(\d[\d,]*)", amount, text)

    def son(m):
        new = f"{m.group(1)}, {m.group(2)}"
        subs.append(f"{m.group(0)} -> {new}")
        return new

    text = re.sub(rf"({re.escape(SON[lang])})\s*\(([^)]+)\)", son, text)

    # Quotes around button names; an apostrophe inside a word is kept
    quotes = "'\"‘’“”"
    stripped = re.sub(rf"(?<!\w)[{quotes}]|[{quotes}](?!\w)", "", text)
    if stripped != text:
        subs.append("quotes removed")
        text = stripped
    return text, subs


def collect():
    """{lang: {clip name: (relative path, text)}} from tasks.json."""
    tasks = json.loads(TASKS.read_text(encoding="utf-8"))
    clips = {lang: {} for lang in VOICES}
    errors = []
    for task in tasks:
        for i, step in enumerate(task["steps"]):
            for lang in VOICES:
                path = step.get(f"audio_{lang}", "")
                if not path:
                    continue
                text = step["hint_text"].get(lang, "").strip()
                name = Path(path).stem
                where = f"{task['task_id']} step {i + 1} ({lang})"
                if not path.startswith(f"assets/audio/{lang}/"):
                    errors.append(f"{where}: path {path} is not in assets/audio/{lang}/")
                if not text:
                    errors.append(f"{where}: no hint_text to speak")
                seen = clips[lang].get(name)
                if seen and seen != (path, text):
                    errors.append(f"{where}: clip {name} is also used with a different text or path")
                clips[lang][name] = (path, text)
    return clips, errors


def generate(text, voice, out):
    tmp = out.with_name(out.name + ".tmp")
    last = None
    for attempt in range(1, TRIES + 1):
        try:
            asyncio.run(edge_tts.Communicate(text, voice, rate=RATE).save(str(tmp)))
            size = tmp.stat().st_size
            if size < MIN_BYTES:
                raise RuntimeError(f"only {size} bytes")
            os.replace(tmp, out)
            return size, None
        except Exception as e:  # noqa: BLE001 - every failure is retried and then reported
            last = f"try {attempt}: {e}"
            if tmp.exists():
                tmp.unlink()
            if attempt < TRIES:
                time.sleep(PAUSE_S)
    return 0, last


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--lang", choices=sorted(VOICES), help="only this language")
    ap.add_argument("--only", action="append", default=[], metavar="NAME", help="only this clip (repeatable)")
    args = ap.parse_args()

    clips, errors = collect()
    if errors:
        print("tasks.json problems:\n  " + "\n  ".join(errors))
        return 1

    langs = [args.lang] if args.lang else list(VOICES)
    unknown = [n for n in args.only if not any(n in clips[l] for l in langs)]
    if unknown:
        print("Unknown clip name(s): " + ", ".join(unknown))
        return 1

    failures, done, total_bytes = [], 0, 0
    for lang in langs:
        folder = PUBLIC / "assets" / "audio" / lang
        folder.mkdir(parents=True, exist_ok=True)
        for name, (path, caption) in sorted(clips[lang].items()):
            if args.only and name not in args.only:
                continue
            text, subs = speakable(caption, lang)
            size, err = generate(text, VOICES[lang], PUBLIC / path)
            if err:
                failures.append(f"{lang}/{name}: {err}")
                print(f"FAIL {lang}/{name}: {err}")
                continue
            done += 1
            total_bytes += size
            note = f"  [{'; '.join(subs)}]" if subs else ""
            print(f"ok   {lang}/{name}.mp3 {size} B{note}")

        # Report (never delete) files in the folder that tasks.json does not use
        orphans = sorted(p.name for p in folder.glob("*.mp3") if p.stem not in clips[lang])
        if orphans and not args.only:
            print(f"orphans in {lang}/ (not referenced by tasks.json): {', '.join(orphans)}")

    print(f"\n{done} clip(s) written, {total_bytes} bytes, {len(failures)} failure(s)")
    for f in failures:
        print("  " + f)
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
