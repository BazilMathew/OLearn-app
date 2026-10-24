"""Generate the bundled narration clips from src/config/tasks.json with Microsoft Edge's neural voices.

tasks.json is the single source of truth: every step's audio_<lang> path names the clip and its
hint_text[lang] is what the clip says. Steps that share a clip must share the same text.
Ask Me messages come from src/config/askme-clips.json ({clip name: {lang: text}}), the same text the
screen shows; each is saved as assets/audio/<lang>/<clip name>.mp3.

Hindi and Malayalam clips can mix two voices: words listed under "english" in scripts/pronunciations.json
are spoken by the English voice, the rest by the native voice, joined with a short pause. The map is
audio only; the on-screen hint_text is never changed.

    pip install edge-tts imageio-ffmpeg                       # dev only; ffmpeg joins mixed-voice clips
    python scripts/generate-audio.py                          # every clip, every language
    python scripts/generate-audio.py --lang ml                # one language
    python scripts/generate-audio.py --only gpay_bal_step3    # one clip (repeat --only for more)
    python scripts/generate-audio.py --check                  # no audio: spoken-text and file checks

No API key needed. Exit code 1 if any clip fails, comes out too small, or (--check) any check fails.
"""

import argparse
import asyncio
import json
import os
import re
import subprocess
import sys
import tempfile
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TASKS = ROOT / "src" / "config" / "tasks.json"
ASKME = ROOT / "src" / "config" / "askme-clips.json"
PRONUNCIATIONS = Path(__file__).resolve().parent / "pronunciations.json"
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
GAP_S = 0.15  # pause between an English and a native segment

RUPEES = {"en": "rupees", "hi": "रुपये", "ml": "രൂപ"}
SON = {"en": "Ramesh", "hi": "रमेश", "ml": "രമേഷ്"}

# A map key matches only as a whole word: no letter, digit or Indic sign may touch it
WORD = r"A-Za-z0-9ऀ-ॿഀ-ൿ‌‍"


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


def key_re(key):
    return rf"(?<![{WORD}]){re.escape(key)}(?![{WORD}])"


def segments(caption, lang, pron):
    """[(voice lang, text)] for a caption: English-map words in the English voice, the rest native."""
    p = pron.get(lang, {})
    for old, new in p.get("replace", {}).items():
        caption = caption.replace(old, new)
    if lang == "ml":
        # A quoted label followed by the verb: a short pause after the label
        caption = re.sub(r"(?<=\S)['\"’”](?=\s+തൊടുക)", ",", caption)
    text, _ = speakable(caption, lang)
    native = p.get("native", {})
    for key in sorted(native, key=len, reverse=True):
        text = re.sub(key_re(key), lambda _m, v=native[key]: v, text)

    english = p.get("english", {})
    parts, pos = [], 0
    if english:
        rx = re.compile("|".join(key_re(k) for k in sorted(english, key=len, reverse=True)))
        for m in rx.finditer(text):
            parts += [(lang, text[pos:m.start()]), ("en", english[m.group(0)])]
            pos = m.end()
    parts.append((lang, text[pos:]))

    # English words with only spaces or brackets between them are one English segment
    merged = []
    for voice, s in parts:
        if voice == "en" and len(merged) >= 2 and merged[-2][0] == "en" and re.fullmatch(r"[\s()]*", merged[-1][1]):
            sep = ", " if "(" in merged[-1][1] else " "  # "paperclip (attachment)" -> "paperclip, attachment"
            merged.pop()
            merged[-1] = ("en", merged[-1][1] + sep + s)
        else:
            merged.append((voice, s))

    # Trim; brackets at a segment edge go; punctuation that starts a segment joins the one before
    out = []
    for voice, s in merged:
        s = s.strip().strip("()").strip()
        if out and s and s[0] in ",.!?।":
            out[-1] = (out[-1][0], out[-1][1] + s[0])
            s = s[1:].strip()
        if s:
            out.append((voice, s))
    return out


def spoken(segs):
    return " | ".join(s if v != "en" or len(segs) == 1 else f"[EN: {s}]" for v, s in segs)


def collect():
    """{lang: {clip name: (relative path, text)}} from tasks.json and askme-clips.json."""
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
    for name, texts in json.loads(ASKME.read_text(encoding="utf-8")).items():
        for lang in VOICES:
            text = texts.get(lang, "").strip()
            if not text:
                errors.append(f"askme-clips.json {name} ({lang}): no text to speak")
            if name in clips[lang]:
                errors.append(f"askme-clips.json {name} ({lang}): name is also a tasks.json clip")
            clips[lang][name] = (f"assets/audio/{lang}/{name}.mp3", text)
    return clips, errors


def segment_problems(lang, name, segs, pron):
    """Native-voice text must have no Latin letters or digits; English text must come from the map."""
    problems = []
    allowed = set(pron.get(lang, {}).get("english", {}).values())
    for voice, s in segs:
        if voice == lang and lang != "en" and re.search(r"[A-Za-z0-9]", s):
            problems.append(f"{lang}/{name}: native voice would read Latin letters or digits: {s}")
        # A merged run ("WhatsApp icon") is fine when it splits into map values only
        if voice == "en" and lang != "en" and not covered(re.sub(r"[,.!?।]+$", "", s), allowed):
            problems.append(f"{lang}/{name}: English segment not from the map: {s}")
    return problems


def covered(text, allowed):
    """Can text be split (at spaces or ", ") into map values only?"""
    if text in allowed:
        return True
    for value in sorted(allowed, key=len, reverse=True):
        for sep in (", ", " "):
            if text.startswith(value + sep) and covered(text[len(value) + len(sep):], allowed):
                return True
    return False


def tts(text, voice, out):
    """One edge-tts call with retries. Returns an error string or None."""
    import edge_tts

    last = None
    for attempt in range(1, TRIES + 1):
        try:
            asyncio.run(edge_tts.Communicate(text, voice, rate=RATE).save(str(out)))
            if out.stat().st_size == 0:
                raise RuntimeError("empty file")
            return None
        except Exception as e:  # noqa: BLE001 - every failure is retried and then reported
            last = f"try {attempt}: {e}"
            if out.exists():
                out.unlink()
            if attempt < TRIES:
                time.sleep(PAUSE_S)
    return last


def stitch(parts, out):
    """Join segment MP3s: inner-edge silence trimmed, GAP_S of silence between, one 24 kHz mono 48 kbps MP3."""
    try:
        import imageio_ffmpeg
    except ImportError:
        raise RuntimeError("mixed-voice clip needs ffmpeg: pip install imageio-ffmpeg")
    trim = "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.02"
    chains, labels = [], []
    for i in range(len(parts)):
        f = [f"[{i}:a]aformat=sample_rates=24000:channel_layouts=mono"]
        if i > 0:
            f.append(trim)
        if i < len(parts) - 1:
            f += ["areverse", trim, "areverse"]
        chains.append(",".join(f) + f"[s{i}]")
        labels.append(f"[s{i}]")
        if i < len(parts) - 1:
            chains.append(f"aevalsrc=0:d={GAP_S}:s=24000:c=mono[g{i}]")
            labels.append(f"[g{i}]")
    graph = ";".join(chains) + ";" + "".join(labels) + f"concat=n={len(labels)}:v=0:a=1[out]"
    cmd = [imageio_ffmpeg.get_ffmpeg_exe(), "-y", "-loglevel", "error"]
    for p in parts:
        cmd += ["-i", str(p)]
    cmd += ["-filter_complex", graph, "-map", "[out]", "-ar", "24000", "-ac", "1", "-c:a", "libmp3lame", "-b:a", "48k", "-f", "mp3", str(out)]
    done = subprocess.run(cmd, capture_output=True, text=True)
    if done.returncode:
        raise RuntimeError(f"ffmpeg: {done.stderr.strip()[-300:]}")


def generate(segs, out):
    tmp = out.with_name(out.name + ".tmp")
    try:
        if len(segs) == 1:
            err = tts(segs[0][1], VOICES[segs[0][0]], tmp)
            if err:
                return 0, err
        else:
            with tempfile.TemporaryDirectory() as d:
                parts = []
                for i, (voice, text) in enumerate(segs):
                    part = Path(d) / f"{i}.mp3"
                    err = tts(text, VOICES[voice], part)
                    if err:
                        return 0, f"segment {i + 1} ({voice}): {err}"
                    parts.append(part)
                stitch(parts, tmp)
        size = tmp.stat().st_size
        if size < MIN_BYTES:
            return 0, f"only {size} bytes"
        os.replace(tmp, out)
        return size, None
    except Exception as e:  # noqa: BLE001 - reported as a failed clip
        return 0, str(e)
    finally:
        if tmp.exists():
            tmp.unlink()


def check(clips, pron):
    """Spoken-text checks for hi and ml, and every clip file present and tracked by git."""
    problems = []
    for lang in ("hi", "ml"):
        for name, (_path, caption) in sorted(clips[lang].items()):
            problems += segment_problems(lang, name, segments(caption, lang, pron), pron)
    try:
        tracked = set(subprocess.run(
            ["git", "ls-files", "public/assets/audio"], cwd=ROOT, capture_output=True, text=True, check=True
        ).stdout.split())
    except Exception as e:  # noqa: BLE001
        tracked = None
        problems.append(f"git ls-files failed: {e}")
    for lang in VOICES:
        for name, (path, _caption) in sorted(clips[lang].items()):
            if not (PUBLIC / path).is_file():
                problems.append(f"{lang}/{name}: {path} is missing")
            elif tracked is not None and f"public/{path}" not in tracked:
                problems.append(f"{lang}/{name}: public/{path} is not tracked by git")
    return problems


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--lang", choices=sorted(VOICES), help="only this language")
    ap.add_argument("--only", action="append", default=[], metavar="NAME", help="only this clip (repeatable)")
    ap.add_argument("--check", action="store_true", help="check spoken text and clip files; generate nothing")
    args = ap.parse_args()

    clips, errors = collect()
    if errors:
        print("tasks.json / askme-clips.json problems:\n  " + "\n  ".join(errors))
        return 1
    pron = {k: v for k, v in json.loads(PRONUNCIATIONS.read_text(encoding="utf-8")).items() if not k.startswith("_")}

    if args.check:
        problems = check(clips, pron)
        for p in problems:
            print("FAIL " + p)
        print(f"audio check: {sum(len(c) for c in clips.values())} clips, {len(problems)} problem(s)")
        return 1 if problems else 0

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
            segs = segments(caption, lang, pron)
            problems = segment_problems(lang, name, segs, pron)
            if problems:
                failures += problems
                print("FAIL " + "; ".join(problems))
                continue
            size, err = generate(segs, PUBLIC / path)
            if err:
                failures.append(f"{lang}/{name}: {err}")
                print(f"FAIL {lang}/{name}: {err}")
                continue
            done += 1
            total_bytes += size
            print(f"ok   {lang}/{name}.mp3 {size} B  {spoken(segs)}")

        # Report (never delete) files in the folder that no clip uses
        orphans = sorted(p.name for p in folder.glob("*.mp3") if p.stem not in clips[lang])
        if orphans and not args.only:
            print(f"orphans in {lang}/ (not referenced by tasks.json or askme-clips.json): {', '.join(orphans)}")

    print(f"\n{done} clip(s) written, {total_bytes} bytes, {len(failures)} failure(s)")
    for f in failures:
        print("  " + f)
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
