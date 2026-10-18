// Tutorial audit: plays every step of every task in a real (headless) Edge or Chrome and checks
// layout and behaviour for each language, screen size, Reduce motion and Text size setting.
//
// Needs no extra packages: the browser is driven over the DevTools protocol with Node's built-in
// WebSocket (Node 20: --experimental-websocket), and tsx (already a dev dependency) loads the strings.
//
//   npm run build && npx vite preview --port 3000 --strictPort
//   node --experimental-websocket --import tsx scripts/audit-tutorials.mjs --out <screenshot folder>
//
// Options: --url (default http://localhost:3000), --out (required: keep screenshots OUT of the
// project), --browser (path to msedge.exe / chrome.exe), --quick (one size, motion off),
// --scales-only (skip the 100% Home and tutorial matrix; run the hint fit sweep and the Text size pass),
// --audio-only (only the narration clip check; no browser, server or --out needed).
//
// Passes: (1) Home and every tutorial step at 100% for every size, language and motion setting;
// (2) hint fit sweep: every step's instruction at every Text size, language and size (no hint may
// scroll below 150%; steps that scroll at 150% are listed); (3) Text size pass: 130% and 150% for
// en/hi/ml at 360x690 and 412x915 on Home, Settings, Ask Me, both task lists and every tutorial step.
// Exit code 1 if any check fails.

import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync, readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { I18N } from '../src/config/i18n.ts';
import { REPLICA_STRINGS } from '../src/replicas/replicaStrings.ts';

const args = Object.fromEntries(
  process.argv.slice(2).map((a, i, all) => (a.startsWith('--') ? [a.slice(2), all[i + 1]?.startsWith('--') ? true : all[i + 1] ?? true] : null)).filter(Boolean)
);
const URL_BASE = args.url || 'http://localhost:3000';
const TASKS = JSON.parse(readFileSync(new URL('../src/config/tasks.json', import.meta.url), 'utf8'));
const LANGS = ['en', 'hi', 'ml'];

// ---------- Narration clips (no browser needed) ----------
// Every non-empty audio path is a git-tracked file with the exact same case, each step's three
// fields are all empty or name the same clip, and every language has the same set of clips.
const audioFailures = [];
{
  const tracked = new Set(
    execFileSync('git', ['ls-files', '-z', 'public/assets/audio'], { cwd: fileURLToPath(new URL('..', import.meta.url)), encoding: 'utf8' })
      .split('\0')
      .filter(Boolean)
  );
  const names = Object.fromEntries(LANGS.map((l) => [l, new Set()]));
  for (const task of TASKS) {
    task.steps.forEach((step, i) => {
      const where = `${task.task_id} step ${i + 1}`;
      const paths = LANGS.map((l) => step[`audio_${l}`] || '');
      if (paths.every((p) => !p)) return;
      const clip = paths[0].split('/').pop();
      LANGS.forEach((l, k) => {
        const p = paths[k];
        if (!p) return audioFailures.push(`${where}: audio_${l} is empty but other languages have a clip`);
        if (p !== `assets/audio/${l}/${clip}`) audioFailures.push(`${where}: audio_${l} is ${p}, expected assets/audio/${l}/${clip}`);
        if (!tracked.has('public/' + p)) audioFailures.push(`${where}: ${p} is not a git-tracked file (exact case)`);
        names[l].add(p.split('/').pop());
      });
    });
  }
  for (const l of LANGS.slice(1)) {
    const only = (a, b) => [...names[a]].filter((n) => !names[b].has(n));
    for (const n of only('en', l)) audioFailures.push(`clip ${n} exists for en but not ${l}`);
    for (const n of only(l, 'en')) audioFailures.push(`clip ${n} exists for ${l} but not en`);
  }
  const used = new Set(LANGS.flatMap((l) => [...names[l]].map((n) => `public/assets/audio/${l}/${n}`)));
  const orphans = [...tracked].filter((f) => !used.has(f));
  console.log(`Narration clips: ${LANGS.map((l) => `${names[l].size} ${l}`).join(', ')}; ${audioFailures.length} problem(s)`);
  for (const f of audioFailures) console.log('  FAIL ' + f);
  if (orphans.length) console.log('  Not referenced by tasks.json (report only): ' + orphans.join(', '));
}
if (args['audio-only']) process.exit(audioFailures.length ? 1 : 0);

if (!args.out || args.out === true) {
  console.error('Pass --out <folder outside the project> for screenshots.');
  process.exit(2);
}
const OUT = resolve(args.out);
if (OUT.startsWith(resolve('.'))) {
  console.error('--out must be outside the project folder.');
  process.exit(2);
}
mkdirSync(OUT, { recursive: true });

const BROWSERS = [
  args.browser,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium'
].filter((p) => typeof p === 'string' && existsSync(p));
if (!BROWSERS.length) {
  console.error('No Edge/Chrome found; pass --browser <path>.');
  process.exit(2);
}

const SIZES = args.quick ? [[360, 690]] : [[360, 690], [360, 780], [412, 915]];
const MOTIONS = args.quick ? [false] : [false, true];
const TEXT_SCALES = [1, 1.15, 1.3, 1.5];
const SCALE_PASS = { scales: [1.3, 1.5], sizes: args.quick ? [[360, 690]] : [[360, 690], [412, 915]] };
const SCROLL_METHODS = ['touch', 'wheel', 'keyboard'];
const MARGIN = 12;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const failures = [...audioFailures];
const notes = [];
const screenshots = [];
let checks = 0;
const check = (ok, what) => {
  checks++;
  if (!ok) failures.push(what);
  return ok;
};

// ---------- DevTools protocol over the built-in WebSocket ----------
class Cdp {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.id = 0;
    this.pending = new Map();
    this.ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve: ok, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        msg.error ? reject(new Error(`${msg.error.message}`)) : ok(msg.result);
      }
    };
    this.ready = new Promise((ok, bad) => {
      this.ws.onopen = ok;
      this.ws.onerror = bad;
    });
    // A closed browser fails the run instead of leaving it waiting forever
    this.ws.onclose = () => {
      for (const { reject } of this.pending.values()) reject(new Error('browser connection closed'));
      this.pending.clear();
    };
  }
  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((ok, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`${method} got no answer in 30s`));
      }, 30000);
      this.pending.set(id, {
        resolve: (v) => { clearTimeout(timer); ok(v); },
        reject: (e) => { clearTimeout(timer); reject(e); }
      });
    });
  }
  async eval(expr) {
    const res = await this.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (res.exceptionDetails) throw new Error(res.exceptionDetails.exception?.description || res.exceptionDetails.text);
    return res.result.value;
  }
}

// ---------- In-page helpers (installed before the app loads) ----------
const PAGE_HELPERS = `
(() => {
  try { sessionStorage.setItem('olearn_startup_shown', '1'); } catch (e) {} // skip the startup screen
  window.__plays = [];
  const play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () { window.__plays.push(this.src); return play.call(this); };
  if (window.speechSynthesis) {
    window.speechSynthesis.speak = (u) => { window.__plays.push('tts:' + u.text); setTimeout(() => u.onend && u.onend(), 10); };
  }
  const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  window.__audit = {
    label: () => document.getElementById('tutorial-progress-label')?.textContent || null,
    // Visible region of an element: viewport clipped by every scrolling/clipping ancestor;
    // inside the chat list, the floating button's top is the bottom edge.
    region(el) {
      let top = 0, left = 0, bottom = innerHeight, right = innerWidth;
      for (let p = el.parentElement; p; p = p.parentElement) {
        const cs = getComputedStyle(p);
        if (/auto|scroll|hidden/.test(cs.overflowY)) {
          const pr = p.getBoundingClientRect();
          top = Math.max(top, pr.top); bottom = Math.min(bottom, pr.bottom);
          left = Math.max(left, pr.left); right = Math.min(right, pr.right);
          if (p.hasAttribute('data-scroll-area')) {
            for (const c of p.parentElement.querySelectorAll('[data-scroll-cover]')) bottom = Math.min(bottom, c.getBoundingClientRect().top);
          }
        }
      }
      return { top, left, bottom, right };
    },
    target(id) {
      const el = document.querySelector('[data-element-id="' + id + '"]');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const g = this.region(el);
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const hit = document.elementFromPoint(cx, cy);
      return {
        highlighted: el.classList.contains('highlight-active'),
        top: r.top, bottom: r.bottom, left: r.left, right: r.right, w: r.width, h: r.height,
        region: g,
        gaps: { top: r.top - g.top, bottom: g.bottom - r.bottom, left: r.left - g.left, right: g.right - r.right },
        cx, cy,
        hitInside: !!hit && el.contains(hit),
        count: document.querySelectorAll('[data-element-id="' + id + '"]').length
      };
    },
    smallText() {
      const out = [];
      for (const el of document.body.querySelectorAll('*')) {
        if (!vis(el)) continue;
        const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
        if (!own) continue;
        const fs = parseFloat(getComputedStyle(el).fontSize);
        if (fs < 18) out.push(fs + 'px "' + el.textContent.trim().slice(0, 30) + '"');
      }
      return out;
    },
    sideways() {
      const out = [];
      const se = document.scrollingElement;
      if (se.scrollWidth > innerWidth + 0.5) out.push('page ' + se.scrollWidth + '>' + innerWidth);
      for (const el of document.body.querySelectorAll('*')) {
        if (!vis(el)) continue;
        const cs = getComputedStyle(el);
        if (el.scrollWidth <= el.clientWidth + 1) continue;
        if (/auto|scroll/.test(cs.overflowX)) {
          // Name the descendant that sticks out furthest
          const box = el.getBoundingClientRect();
          let worst = null, by = 0;
          for (const d of el.querySelectorAll('*')) {
            const dr = d.getBoundingClientRect();
            const o = Math.max(dr.right - box.right, box.left - dr.left);
            if (o > by) { by = o; worst = d; }
          }
          const what = worst ? (worst.getAttribute('data-element-id') || worst.textContent.trim().slice(0, 20) || (worst.className + '').slice(0, 40)) : '?';
          out.push('scrolls sideways by ' + (el.scrollWidth - el.clientWidth) + 'px: ' + (el.className + '').slice(0, 30) + ' (furthest out: ' + what + ')');
          continue;
        }
        if (cs.overflowX === 'visible' && cs.textOverflow !== 'ellipsis' && el.textContent.trim() && !el.children.length)
          out.push('text overflows: "' + el.textContent.trim().slice(0, 30) + '"');
      }
      // Text runs wider than their block (catches inline labels, which have no scrollWidth of their own)
      for (const el of document.body.querySelectorAll('*')) {
        if (!vis(el) || el.children.length || !el.textContent.trim()) continue;
        let box = el;
        while (box.parentElement && getComputedStyle(box).display === 'inline') box = box.parentElement;
        const bcs = getComputedStyle(box);
        if (bcs.textOverflow === 'ellipsis' || /hidden|clip/.test(bcs.overflowX)) continue;
        const range = document.createRange();
        range.selectNodeContents(el);
        const tr = range.getBoundingClientRect(), br = box.getBoundingClientRect();
        if (tr.right > br.right + 1 || tr.left < br.left - 1)
          out.push('text wider than its box: "' + el.textContent.trim().slice(0, 30) + '"');
      }
      return out;
    },
    // The engine's practice-screen container (holds the WhatsApp or Google Pay replica)
    replicaRoot() {
      return [...document.querySelectorAll('div')].find((d) => {
        const c = typeof d.className === 'string' ? d.className : '';
        return c.includes('flex-1') && c.includes('overflow-y-auto') && c.includes('overflow-x-hidden') && c.includes('bg-canvas');
      }) || null;
    },
    // Every piece of text fully inside its own box and inside its tile (button). Text outside a button must
    // stay inside the screen sideways; below the screen it is only scrolled away, which is fine.
    homeClipped(root) {
      root = root || document.querySelector('.screen-enter');
      const out = [];
      if (!root) return ['screen not found'];
      for (const el of root.querySelectorAll('*')) {
        if (!vis(el) || el.children.length || !el.textContent.trim()) continue;
        if (getComputedStyle(el).webkitLineClamp !== 'none') continue; // cut off on purpose, with an ellipsis
        const what = '"' + el.textContent.trim().slice(0, 30) + '"';
        if (el.scrollWidth > el.clientWidth + 1) out.push(what + ' wider than its box (' + el.scrollWidth + '>' + el.clientWidth + ')');
        // Glyphs may draw a little past a visible box's line height (32px header: 40 > 38) without being cut;
        // real clipping by the tile or screen is caught by the sticks-out check below
        if (getComputedStyle(el).overflowY !== 'visible' && el.scrollHeight > el.clientHeight + 1) out.push(what + ' taller than its box (' + el.scrollHeight + '>' + el.clientHeight + ')');
        const tile = el.closest('button') || root;
        const range = document.createRange();
        range.selectNodeContents(el);
        const tr = range.getBoundingClientRect(), br = tile.getBoundingClientRect();
        const vert = tile !== root && (tr.top < br.top - 1 || tr.bottom > br.bottom + 1);
        if (tr.left < br.left - 1 || tr.right > br.right + 1 || vert)
          out.push(what + ' sticks out of its ' + (tile === root ? 'screen' : 'tile'));
      }
      return out;
    },
    // Home tiles: text column width and the widest single word in it (the column can never be narrower)
    homeColumns() {
      const root = document.querySelector('.screen-enter');
      return [...root.querySelectorAll('button')].map((b) => {
        const texts = [...b.querySelectorAll('*')].filter((e) => !e.children.length && e.textContent.trim());
        const col = texts[0].parentElement;
        let word = 0;
        for (const e of texts) {
          const s = document.createElement('span');
          s.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;font:' + getComputedStyle(e).font;
          document.body.appendChild(s);
          for (const w of e.textContent.trim().split(/\\s+/)) { s.textContent = w; word = Math.max(word, s.getBoundingClientRect().width); }
          s.remove();
        }
        const ir = b.querySelector('svg')?.parentElement.getBoundingClientRect(), cr = col.getBoundingClientRect();
        return { title: texts[0].textContent.trim(), col: Math.round(cr.width), word: Math.round(word), stacked: !!ir && cr.top >= ir.bottom - 1 };
      });
    },
    // Text that wraps in the middle of a word, anywhere on the practice screen (or under root): a new
    // line must start right after a space, a hyphen, a bullet, an opening bracket or a slash
    midWordBreaks(root, skip) {
      const el = root || this.replicaRoot();
      const out = [];
      if (!el) return out;
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        if (skip && skip.contains(n)) continue;
        const s = n.textContent;
        let lastTop = null;
        // Step by grapheme so Indic clusters are measured whole
        const parts = [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(s)];
        for (const { segment, index } of parts) {
          const range = document.createRange();
          range.setStart(n, index); range.setEnd(n, index + segment.length);
          const rect = range.getBoundingClientRect();
          if (!rect.width) continue; // hidden or collapsed text
          const top = rect.top;
          if (lastTop !== null && top > lastTop + 4 && segment.trim() && index > 0 && !' -•(/'.includes(s[index - 1]))
            out.push('line breaks inside a word at "' + s.slice(Math.max(0, index - 6), index + 6) + '"');
          if (segment.trim()) lastTop = top;
        }
      }
      return out;
    },
    // The highlight's dark outer ring (#2B2620) or its amber outline must stand out from what the target sits on
    ringContrast(id) {
      const el = document.querySelector('[data-element-id="' + id + '"]');
      if (!el) return null;
      const lum = (c) => {
        const [r, g, b] = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
      let bg = [255, 255, 255];
      for (let p = el.parentElement; p; p = p.parentElement) {
        const m = getComputedStyle(p).backgroundColor.match(/[\\d.]+/g);
        if (m && (m.length < 4 || +m[3] > 0.5)) { bg = m.slice(0, 3).map(Number); break; }
      }
      return { bg: 'rgb(' + bg.join(',') + ')', ratio: Math.max(ratio([0x2b, 0x26, 0x20], bg), ratio([0xf2, 0xa9, 0x3b], bg)) };
    },
    // Looping animations: inside a tutorial only the highlight ring may loop
    loops() {
      return document.getAnimations()
        .filter((a) => a.playState === 'running' && a.effect && a.effect.getTiming().iterations === Infinity)
        .map((a) => a.animationName || 'web-animation');
    },
    running() { return document.getAnimations().filter((a) => a.playState === 'running').length; },
    textIncludes: (s) => document.body.innerText.includes(s),
    buttonWithText(s) {
      const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === s && vis(x));
      if (!b) return null;
      const r = b.getBoundingClientRect();
      return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, h: b.offsetHeight, disabled: b.getAttribute('aria-disabled') };
    },
    clickPointForText(s) {
      const el = [...document.querySelectorAll('body *')].find((x) => vis(x) && x.children.length === 0 && x.textContent.trim() === s);
      if (!el) return null;
      el.scrollIntoView({ block: 'center' });
      const r = el.getBoundingClientRect();
      return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
    },
    replayDisabled(label) { return this.buttonWithText(label)?.disabled; },
    list() {
      const l = document.querySelector('[data-scroll-area]');
      if (!l) return null;
      const r = l.getBoundingClientRect();
      return { scrollTop: l.scrollTop, cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
    },
    focusList() { document.querySelector('[data-scroll-area]')?.focus(); },
    appTs: () => getComputedStyle(document.documentElement).getPropertyValue('--app-ts').trim(),
    savedScale: () => JSON.parse(localStorage.getItem('olearn_user_profile_v1') || '{}').textScale,
    // Buttons matching a label (exact text or aria-label, else the smallest button containing it): each one,
    // once scrolled into view, must be fully on screen and inside its scroll area, >= 64px tall, and the
    // topmost element at its centre. Returns the problems.
    reach(label) {
      const all = [...document.querySelectorAll('button')].filter(vis);
      let found = all.filter((b) => b.textContent.trim() === label || b.getAttribute('aria-label') === label);
      if (!found.length) {
        const inc = all.filter((b) => b.textContent.includes(label)).sort((a, b) => a.textContent.length - b.textContent.length);
        found = inc.slice(0, 1);
      }
      if (!found.length) return ['"' + label + '": button not found'];
      const out = [];
      for (const b of found) {
        b.scrollIntoView({ block: 'nearest' });
        const r = b.getBoundingClientRect(), g = this.region(b);
        const name = '"' + label + '"';
        if (r.top < Math.max(0, g.top) - 1 || r.bottom > Math.min(innerHeight, g.bottom) + 1 || r.left < Math.max(0, g.left) - 1 || r.right > Math.min(innerWidth, g.right) + 1)
          out.push(name + ' not fully on screen (' + Math.round(r.top) + '..' + Math.round(r.bottom) + ' of ' + Math.round(g.top) + '..' + Math.round(g.bottom) + ')');
        if (r.height < 64) out.push(name + ' is ' + Math.round(r.height) + 'px tall');
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        if (!hit || !b.contains(hit)) out.push(name + ' is covered at its centre');
      }
      return out;
    },
    // The engine's tutorial chrome: every child of the tutorial screen except the practice screen
    chromeParts() {
      const rr = this.replicaRoot();
      return rr ? [...rr.parentElement.children].filter((c) => c !== rr) : [];
    },
    // The instruction is checked on its own (hintBreaks): at 150% a very long word may have to break
    chromeBreaks() {
      const hint = document.getElementById('tutorial-hint');
      return this.chromeParts().flatMap((c) => this.midWordBreaks(c, hint));
    },
    hintBreaks() {
      const hint = document.getElementById('tutorial-hint');
      return hint ? this.midWordBreaks(hint) : [];
    },
    // Practice screens keep 100% text: --ts is 1 and every type token inside has its 100% size
    insulation() {
      const rr = this.replicaRoot();
      if (!rr) return ['practice screen not found'];
      const out = [];
      const ts = getComputedStyle(rr).getPropertyValue('--ts').trim();
      if (ts !== '1') out.push('--ts is ' + ts + ' inside the practice screen');
      const want = { 'text-body': 20, 'text-label': 18, 'text-title': 26, 'text-display': 32 };
      for (const el of rr.querySelectorAll('[class*="text-"]')) {
        const cls = (typeof el.className === 'string' ? el.className : '').split(/\\s+/);
        for (const [c, px] of Object.entries(want)) {
          if (!cls.includes(c) || cls.some((k) => /^!?text-\\[\\d/.test(k))) continue;
          const fs = parseFloat(getComputedStyle(el).fontSize);
          if (Math.abs(fs - px) > 0.5) out.push(c + ' is ' + fs + 'px inside the practice screen ("' + el.textContent.trim().slice(0, 20) + '")');
        }
      }
      return [...new Set(out)].slice(0, 5);
    },
    // Height left for the practice screen, and the tutorial screen's height
    replicaShare() {
      const rr = this.replicaRoot();
      return rr ? { px: rr.getBoundingClientRect().height, of: rr.parentElement.getBoundingClientRect().height } : { px: 0, of: 1 };
    },
    // The instruction under the practice screen: does it scroll, and is the scroll cue shown
    hint() {
      const el = document.getElementById('tutorial-hint');
      if (!el) return null;
      const box = el.parentElement;
      const bar = box.querySelector('[data-hint-scrollbar]');
      const fade = box.querySelector('[data-hint-fade]');
      const thumb = bar && bar.firstElementChild;
      return {
        scrolls: el.scrollHeight > el.clientHeight + 1,
        edge: parseFloat(getComputedStyle(el).borderBottomWidth),
        bar: bar ? { w: bar.getBoundingClientRect().width, h: bar.getBoundingClientRect().height, thumb: thumb.getBoundingClientRect().height } : null,
        fade: !!fade && vis(fade)
      };
    },
    hintToEnd() { const el = document.getElementById('tutorial-hint'); el.scrollTop = el.scrollHeight; el.dispatchEvent(new Event('scroll')); },
    // Hint fit sweep: put a step's instruction into the hint and measure (the page is reloaded afterwards).
    // A scroll step keeps a taller practice screen (336px instead of 284px, see TaskEngine).
    hintFits(text, scroll) {
      const el = document.getElementById('tutorial-hint');
      this.replicaRoot().style.minHeight = scroll ? 'max(40%, 336px)' : '';
      el.textContent = text;
      return { fits: el.scrollHeight <= el.clientHeight + 1, over: el.scrollHeight - el.clientHeight, breaks: this.midWordBreaks(el) };
    },
    // The gentle nudge (drawn over the top bar) keeps its text inside and does not cover the target
    nudge(id) {
      const n = document.querySelector('[role="status"].pointer-events-none');
      if (!n) return null;
      const r = n.getBoundingClientRect(), tr = n.lastElementChild.getBoundingClientRect();
      const t = document.querySelector('[data-element-id="' + id + '"]').getBoundingClientRect();
      return {
        coversTarget: r.bottom > t.top && r.top < t.bottom && r.right > t.left && r.left < t.right,
        textFits: tr.top >= r.top - 1 && tr.bottom <= r.bottom + 1,
        below: Math.round(r.bottom - n.parentElement.getBoundingClientRect().bottom)
      };
    },
    progressPoint() {
      const r = document.getElementById('tutorial-progress-label').getBoundingClientRect();
      return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
    }
  };
})();
`;

// ---------- Browser ----------
const port = 9300 + Math.floor(Math.random() * 500);
const profileDir = mkdtempSync(join(tmpdir(), 'olearn-audit-'));
const browser = spawn(BROWSERS[0], [
  '--headless=new',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profileDir}`,
  '--autoplay-policy=no-user-gesture-required',
  '--no-first-run',
  '--hide-scrollbars',
  'about:blank'
], { stdio: 'ignore' });

let pageWs;
for (let i = 0; i < 50 && !pageWs; i++) {
  await sleep(200);
  try {
    const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    pageWs = list.find((t) => t.type === 'page')?.webSocketDebuggerUrl;
  } catch {}
}
if (!pageWs) {
  console.error('Browser did not start.');
  browser.kill();
  process.exit(2);
}
const cdp = new Cdp(pageWs);
await cdp.ready;
await cdp.send('Page.enable');
await cdp.send('Runtime.enable');
await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: PAGE_HELPERS });

const A = (expr) => cdp.eval(`window.__audit.${expr}`);
const click = async (x, y) => {
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
};
const shot = async (name) => {
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' });
  const file = join(OUT, name + '.png');
  writeFileSync(file, Buffer.from(data, 'base64'));
  screenshots.push(file);
};
const waitFor = async (fn, ms = 3000) => {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (await fn()) return true;
    await sleep(60);
  }
  return false;
};

async function openApp(profile) {
  await cdp.send('Page.navigate', { url: URL_BASE });
  await waitFor(() => cdp.eval(`location.origin === ${JSON.stringify(new URL(URL_BASE).origin)}`).catch(() => false), 8000);
  await cdp.eval(`localStorage.setItem('olearn_user_profile_v1', ${JSON.stringify(JSON.stringify(profile))})`);
  await cdp.send('Page.reload', { ignoreCache: false });
  await waitFor(() => cdp.eval(`document.readyState === 'complete' && !!document.querySelector('.text-title')`), 8000);
  await sleep(400);
}

async function openTask(task, t, lang) {
  const appTitle = task.app === 'whatsapp' ? t.whatsAppTitle : t.gpayTitle;
  const p1 = await A(`clickPointForText(${JSON.stringify(appTitle)})`);
  if (!p1) return false;
  await click(p1.cx, p1.cy);
  const title = task.title[lang] || task.title.en;
  await waitFor(() => A(`clickPointForText(${JSON.stringify(title)})`), 3000);
  await sleep(500); // task cards fade up
  const p2 = await A(`clickPointForText(${JSON.stringify(title)})`);
  if (!p2) return false;
  await click(p2.cx, p2.cy);
  return waitFor(() => A('label()'), 3000);
}

const stepText = (t, n, total) => t.stepXofY.replace('{n}', String(n)).replace('{total}', String(total));

async function scrollOnce(method) {
  const l = await A('list()');
  if (!l) return;
  if (method === 'touch') {
    // A finger swipe up of 120px (raw touch events; the synthetic scroll gesture does not scroll in headless mode)
    const x = Math.round(l.cx), y0 = Math.round(l.cy) + 60;
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: y0 }] });
    for (let k = 1; k <= 8; k++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y0 - k * 15 }] });
      await sleep(16);
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: false });
  } else if (method === 'wheel') {
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: l.cx, y: l.cy, deltaX: 0, deltaY: 120 });
  } else {
    await A('focusList()');
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowDown', code: 'ArrowDown', windowsVirtualKeyCode: 40 });
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowDown', code: 'ArrowDown', windowsVirtualKeyCode: 40 });
  }
}

// ---------- Run ----------
const replicaIds = new Set(TASKS.flatMap((t) => t.steps.map((s) => s.highlight_element)));
const seenIds = new Set();
const t0 = Date.now();
const timings = [];
const timed = async (name, fn) => {
  const start = Date.now();
  await fn();
  timings.push(`${name}: ${Math.round((Date.now() - start) / 1000)}s`);
};
const pct = (scale) => `${Math.round(scale * 100)}%`;
const profileFor = (lang, reduce, textScale) => ({
  name: 'User', language: lang, completedTasks: [], firstLaunchCompleted: true, reduceMotion: reduce, replicaLanguage: 'follow', textScale
});
const setScreen = async (w, h, reduce) => {
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: true });
  await cdp.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: reduce ? 'reduce' : 'no-preference' }]
  });
};

// An older saved profile (no practice-screen or Text size setting) must still load, at 100%
await setScreen(360, 690, false);
await openApp({ name: 'User', language: 'en', completedTasks: ['whatsapp_send_text'], firstLaunchCompleted: true });
check(await A(`clickPointForText(${JSON.stringify(I18N.en.whatsAppTitle)})`), 'old saved profile: Home did not load');
check((await A('appTs()')) === '1', `old saved profile: Text size is ${await A('appTs()')}, expected 1`);
// A Text size that is not one of the four stops falls back to Normal
await openApp(profileFor('en', false, 7));
check((await A('appTs()')) === '1', `Text size 7 in storage: applied as ${await A('appTs()')}, expected 1`);

// Listed in the report rather than failed: at 150% only (see the report section)
const hintScrollsAt150 = [];
const hintBreaksAt150 = new Set();
const wordBreaksAt150 = new Set();

// One whole screen: text inside its boxes, word wrapping, no sideways scroll, nothing under 18px,
// and every listed button reachable and tappable (checked last: it scrolls the screen)
async function checkScreen(tag, name, labels, scale = 1) {
  for (const s of await A('homeClipped()')) check(false, `${tag} ${name}: ${s}`);
  for (const s of await A(`homeClipped(document.querySelector('nav'))`)) check(false, `${tag} ${name} navigation bar: ${s}`);
  for (const s of [...new Set(await A(`midWordBreaks(document.querySelector('.screen-enter'))`))]) {
    if (scale >= 1.5) wordBreaksAt150.add(`${tag} ${name}: ${s}`);
    else check(false, `${tag} ${name}: ${s}`);
  }
  for (const s of await A('sideways()')) check(false, `${tag} ${name}: ${s}`);
  for (const s of await A('smallText()')) check(false, `${tag} ${name}: text under 18px: ${s}`);
  for (const l of labels) for (const s of await A(`reach(${JSON.stringify(l)})`)) check(false, `${tag} ${name}: ${s}`);
}

// ---------- Home: tile titles and subtitles fully visible, wrapped by word ----------
if (!args['scales-only']) await timed('Home at 100%', async () => {
  for (const [w, h] of SIZES) {
    for (const lang of LANGS) {
      for (const reduce of MOTIONS) {
        const t = I18N[lang];
        const tag = `${lang}_${w}x${h}_${reduce ? 'reduced' : 'motion'}`;
        await setScreen(w, h, reduce);
        await openApp(profileFor(lang, reduce, 1));
        await sleep(reduce ? 100 : 500); // screen slide-in
        if (w === 360 && !reduce) {
          for (const c of await A('homeColumns()'))
            notes.push(`${tag} Home tile "${c.title}": text column ${c.col}px, widest word ${c.word}px${c.stacked ? ' (below the icon)' : ''}`);
        }
        if (!reduce) await shot(`${tag}_home`);
        await checkScreen(tag, 'Home', [t.whatsAppTitle, t.gpayTitle, t.askStart, t.home, t.settings]);
      }
    }
  }
});

// ---------- Every tutorial step ----------
let methodTurn = 0;

async function runTutorials(w, h, lang, reduce, scale) {
  const t = I18N[lang];
  const r = REPLICA_STRINGS[lang];
  const tag = `${lang}_${w}x${h}_${reduce ? 'reduced' : 'motion'}${scale === 1 ? '' : '_ts' + Math.round(scale * 100)}`;
  await setScreen(w, h, reduce);
  const wait = reduce ? 450 : 900; // screen slide + scroll-into-view (smooth when motion is on)
  const stepShots = scale === 1 ? w === 360 && h === 690 && !reduce : w === 360 && scale === 1.5;

  for (const task of TASKS) {
    const where = `${tag} ${task.task_id}`;
    await openApp(profileFor(lang, reduce, scale));
    if (!check(await openTask(task, t, lang), `${where}: could not open the task`)) continue;
    const total = task.steps.length;
    const showMeRun = task.task_id === 'whatsapp_send_text';
    let playMark = 0;

    for (let i = 0; i < total; i++) {
      const step = task.steps[i];
      // Steps with a clip are tagged [existing screen]; a step without one must stay silent.
      const clip = step[`audio_${lang}`] || step.audio_en;
      const at = `${where} step ${i + 1}${clip ? ' [existing screen]' : ''}`;
      if (!check(await waitFor(async () => (await A('label()')) === stepText(t, i + 1, total)), `${at}: step label not shown`)) break;
      await sleep(wait);

      if (i === 0) check(step.screen === 'phone_home_screen', `${where}: first step is not the phone home screen`);
      const info = await A(`target(${JSON.stringify(step.highlight_element)})`);
      if (!check(info, `${at}: target ${step.highlight_element} not found`)) break;
      seenIds.add(step.highlight_element);
      check(info.count === 1, `${at}: ${info.count} elements with id ${step.highlight_element}`);
      check(info.highlighted, `${at}: target not highlighted`);
      check(Math.min(info.w, info.h) >= 64, `${at}: target ${Math.round(info.w)}x${Math.round(info.h)} is under 64px`);
      for (const s of await A('smallText()')) check(false, `${at}: text under 18px: ${s}`);
      for (const s of await A('sideways()')) check(false, `${at}: ${s}`);
      const loops = (await A('loops()')).filter((n) => n !== 'highlight-ring');
      check(!loops.length, `${at}: looping animation other than the highlight pulse: ${loops.join(', ')}`);
      if (reduce) check((await A('loops()')).length === 0, `${at}: looping animation under Reduce motion`);

      // Text size: practice screen at 100%, chrome wraps by word, practice screen keeps its room,
      // Exit and Repeat Voice reachable, and a hint that scrolls (150% only) shows its scroll cue
      for (const s of await A('insulation()')) check(false, `${at}: ${s}`);
      for (const s of [...new Set(await A('chromeBreaks()'))]) check(false, `${at}: tutorial bar: ${s}`);
      for (const s of [...new Set(await A('hintBreaks()'))]) {
        if (scale >= 1.5) hintBreaksAt150.add(`${lang} ${w}x${h}: ${task.task_id} step ${i + 1}: ${s}`);
        else check(false, `${at}: instruction ${s}`);
      }
      const share = await A('replicaShare()');
      const floor = Math.max(0.4 * share.of, step.action === 'scroll' ? 336 : 284);
      check(share.px >= floor - 1, `${at}: practice screen is only ${Math.round(share.px)}px of ${Math.round(share.of)}px (needs ${Math.round(floor)}px)`);
      for (const l of [t.exitTutorial, t.replayAudio]) for (const s of await A(`reach(${JSON.stringify(l)})`)) check(false, `${at}: ${s}`);
      const hint = await A('hint()');
      if (hint?.scrolls) {
        check(scale >= 1.5, `${at}: the instruction scrolls at ${pct(scale)} (allowed only at 150%)`);
        check(hint.edge >= 2, `${at}: scrolling instruction has no bottom edge`);
        check(hint.bar && hint.bar.w >= 4 && hint.bar.thumb < hint.bar.h - 1, `${at}: scrolling instruction has no visible scrollbar`);
        check(hint.fade, `${at}: scrolling instruction has no fade while more text is below`);
        if (stepShots) await shot(`${tag}_${task.task_id}_step${i + 1}_hint_top`);
        await A('hintToEnd()');
        await sleep(100);
        check(!(await A('hint()')).fade, `${at}: fade still shown at the end of the instruction`);
      }

      // Narration: new steps (no clip) stay silent; existing steps play their own clip
      const disabled = await A(`replayDisabled(${JSON.stringify(t.replayAudio)})`);
      const stepPlays = (await cdp.eval('window.__plays')).slice(playMark);
      if (!clip) {
        check(disabled === 'true', `${at}: Repeat Voice not greyed out on a step without a clip`);
        check(stepPlays.length === 0, `${at}: a step without a clip made sound: ${stepPlays.join(', ')}`);
      } else {
        check(disabled === 'false', `${at}: Repeat Voice greyed out on a step with a clip`);
        check(stepPlays.some((p) => p.endsWith('/' + clip)), `${at}: clip ${clip} did not play`);
        check(!stepPlays.some((p) => p.startsWith('tts:') || p.includes('translate_tts')), `${at}: speech synthesis used`);
      }

      // Gentle nudge (one wrong tap per task, on the step label): stays inside the top bar, text not cut off
      if (i === 0) {
        const pp = await A('progressPoint()');
        await click(pp.cx, pp.cy);
        await sleep(reduce ? 100 : 350);
        const n = await A(`nudge(${JSON.stringify(step.highlight_element)})`);
        if (check(n, `${at}: wrong tap showed no nudge`)) {
          check(!n.coversTarget, `${at}: nudge covers the highlighted target (reaches ${n.below}px below the top bar)`);
          check(n.textFits, `${at}: nudge text cut off`);
        }
      }

      // Sample data on the Google Pay payment screens
      if (task.task_id === 'gpay_send_contact' && step.screen === 'gpay_amount_entry_screen') {
        check(await A(`textIncludes('₹1,000')`), `${at}: ₹1,000 missing`);
        check(await A(`textIncludes(${JSON.stringify(r.rameshSon)})`), `${at}: Ramesh missing`);
      }
      if (task.task_id === 'gpay_scan_qr' && step.screen === 'gpay_amount_entry_screen') {
        check(await A(`textIncludes('₹200')`), `${at}: ₹200 missing`);
        check(await A(`textIncludes(${JSON.stringify(r.shopName)})`), `${at}: Sharma Groceries missing`);
      }

      if (i === 0 && (task.task_id === 'whatsapp_send_text' || task.task_id === 'gpay_check_balance') && !reduce) {
        await shot(`${tag}_${task.app}_phone_home`);
      }

      if (step.action === 'scroll') {
        // Off-screen at the start, swipe hint shown, no "Show me" yet, nothing scrolls by itself
        check(info.top >= info.region.bottom, `${at}: Ramesh's chat is already on screen (top ${Math.round(info.top)}, visible bottom ${Math.round(info.region.bottom)})`);
        check(await A(`textIncludes(${JSON.stringify(t.swipeUp)})`), `${at}: swipe hint missing`);
        check(!(await A(`buttonWithText(${JSON.stringify(t.showMe)})`)), `${at}: "Show me" shown too early`);
        if (task.task_id === 'whatsapp_send_text') await shot(`${tag}_chat_list_hint`);

        if (showMeRun) {
          await sleep(9000 - wait);
          check(!(await A(`buttonWithText(${JSON.stringify(t.showMe)})`)), `${at}: "Show me" before 10 seconds`);
          check(await waitFor(() => A(`buttonWithText(${JSON.stringify(t.showMe)})`), 2500), `${at}: "Show me" did not appear after 10 seconds`);
          check((await A('list()')).scrollTop === 0, `${at}: the list scrolled on its own`);
          for (const s of await A(`reach(${JSON.stringify(t.showMe)})`)) check(false, `${at}: ${s}`);
          check((await A('list()')).scrollTop === 0, `${at}: the list scrolled on its own`);
          const b = await A(`buttonWithText(${JSON.stringify(t.showMe)})`);
          if (b) {
            check(b.h >= 64, `${at}: "Show me" is under 64px`);
            await sleep(300);
            await shot(`${tag}_show_me`);
            playMark = await cdp.eval('window.__plays.length');
            await click(b.cx, b.cy);
          }
          check(await waitFor(async () => (await A('label()')) === stepText(t, i + 2, total), 3000), `${at}: "Show me" did not complete the step`);
        } else {
          const method = SCROLL_METHODS[methodTurn++ % SCROLL_METHODS.length];
          let done = false;
          playMark = await cdp.eval('window.__plays.length');
          for (let k = 0; k < 40 && !done; k++) {
            await scrollOnce(method);
            done = await waitFor(async () => (await A('label()')) === stepText(t, i + 2, total), 400);
          }
          check(done, `${at}: scrolling by ${method} did not complete the step`);
          notes.push(`${at}: completed by ${method}`);
        }
        // Target fully visible once the step completes
        const after = await A(`target(${JSON.stringify(step.highlight_element)})`);
        check(after && after.gaps.top >= MARGIN && after.gaps.bottom >= MARGIN, `${at}: Ramesh's chat not fully visible after the scroll step`);
        continue;
      }

      // Fully visible, 12px clear of the edges, and nothing on top of it
      const g = info.gaps;
      const vertOk = g.top >= MARGIN && g.bottom >= MARGIN;
      const horzOk = g.left >= MARGIN && g.right >= MARGIN;
      check(vertOk, `${at}: ${step.highlight_element} not 12px clear top/bottom (top ${Math.round(g.top)}, bottom ${Math.round(g.bottom)})`);
      check(horzOk, `${at}: ${step.highlight_element} is ${Math.round(Math.min(g.left, g.right))}px from a side edge (needs 12px)`);
      // The pointer badge reaches 16px past the target's right edge: keep it on screen (not clipped sideways)
      check(g.right >= 16, `${at}: ${step.highlight_element} pointer badge clipped at the right edge (${Math.round(g.right)}px clear, needs 16px)`);
      check(info.hitInside, `${at}: ${step.highlight_element} is covered by another element`);
      const rc = await A(`ringContrast(${JSON.stringify(step.highlight_element)})`);
      check(rc && rc.ratio >= 3, `${at}: highlight ring washed out on ${rc && rc.bg} (contrast ${rc && rc.ratio.toFixed(1)})`);
      // Every label on the practice screen wraps by word (both replicas, every step)
      for (const s of [...new Set(await A('midWordBreaks()'))]) check(false, `${at}: ${s}`);
      if (stepShots) await shot(`${tag}_${task.task_id}_step${i + 1}`);
      if (step.highlight_element === 'chat_row_ramesh' && !reduce) await shot(`${tag}_${task.task_id}_tap_chat`);

      playMark = await cdp.eval('window.__plays.length');
      await click(info.cx, info.cy);
      if (i + 1 < total) {
        check(await waitFor(async () => (await A('label()')) === stepText(t, i + 2, total)), `${at}: tapping the target did not advance`);
      } else {
        check(await waitFor(() => A(`buttonWithText(${JSON.stringify(t.practiceAgain)})`), 3000), `${at}: completion screen not shown`);
        await sleep(reduce ? 100 : 400);
        for (const s of await A('sideways()')) check(false, `${where} completion: ${s}`);
        for (const s of [...new Set(await A(`midWordBreaks(document.querySelector('.screen-enter'))`))]) {
          if (scale >= 1.5) wordBreaksAt150.add(`${tag} completion: ${s}`);
          else check(false, `${where} completion: ${s}`);
        }
        for (const l of [t.practiceAgain, t.backToMenu]) for (const s of await A(`reach(${JSON.stringify(l)})`)) check(false, `${where} completion: ${s}`);
      }
    }
  }
}

if (!args['scales-only']) await timed('Tutorials at 100% (full matrix)', async () => {
  for (const [w, h] of SIZES) for (const lang of LANGS) for (const reduce of MOTIONS) await runTutorials(w, h, lang, reduce, 1);
});

// ---------- Hint fit sweep: every step's instruction at every Text size ----------
await timed('Hint fit sweep', async () => {
  for (const [w, h] of SIZES) {
    for (const lang of LANGS) {
      for (const scale of TEXT_SCALES) {
        const tag = `${lang}_${w}x${h}_ts${Math.round(scale * 100)}`;
        await setScreen(w, h, true);
        await openApp(profileFor(lang, true, scale));
        if (!check(await openTask(TASKS[0], I18N[lang], lang), `${tag} hint sweep: could not open a task`)) continue;
        const steps = TASKS.flatMap((task) => task.steps.map((s, i) => ({ where: `${task.task_id} step ${i + 1}`, text: s.hint_text[lang] || s.hint_text.en, scroll: s.action === 'scroll' })));
        const res = await cdp.eval(`${JSON.stringify(steps.map((s) => [s.text, s.scroll]))}.map(([x, sc]) => window.__audit.hintFits(x, sc))`);
        steps.forEach((s, k) => {
          if (!res[k].fits) {
            if (scale < 1.5) check(false, `${tag}: instruction scrolls at ${pct(scale)}: ${s.where} (${res[k].over}px too tall)`);
            else hintScrollsAt150.push(`${lang} ${w}x${h}: ${s.where} (${res[k].over}px more than fits)`);
          }
          for (const b of res[k].breaks) {
            if (scale < 1.5) check(false, `${tag}: instruction ${b} at ${pct(scale)}: ${s.where}`);
            else hintBreaksAt150.add(`${lang} ${w}x${h}: ${s.where}: ${b}`);
          }
        });
      }
    }
  }
});

// ---------- Text size pass: 130% and 150% ----------
await timed('Text size pass (130% and 150%)', async () => {
  for (const scale of SCALE_PASS.scales) {
    for (const [w, h] of SCALE_PASS.sizes) {
      for (const lang of LANGS) {
        const t = I18N[lang];
        const tag = `${lang}_${w}x${h}_ts${Math.round(scale * 100)}`;
        // Motion does not change layout (it is covered at 100%); Reduce motion halves the waits here
        await setScreen(w, h, true);
        const fresh = async () => {
          await openApp(profileFor(lang, true, scale));
          await sleep(100);
        };
        const go = async (text, waitText) => {
          const p = await A(`clickPointForText(${JSON.stringify(text)})`);
          if (!check(p, `${tag}: "${text}" not found`)) return false;
          await click(p.cx, p.cy);
          const ok = await waitFor(() => A(`textIncludes(${JSON.stringify(waitText)})`), 3000);
          await sleep(300);
          return check(ok, `${tag}: "${waitText}" not shown after tapping "${text}"`);
        };

        await fresh();
        check((await A('appTs()')) === String(scale), `${tag}: Text size applied as ${await A('appTs()')}`);
        await shot(`${tag}_home`);
        await checkScreen(tag, 'Home', [t.whatsAppTitle, t.gpayTitle, t.askStart, t.home, t.settings], scale);

        await fresh();
        if (await go(t.askMe, t.askMeSubtitle)) {
          await shot(`${tag}_askme`);
          await checkScreen(tag, 'Ask Me', [t.cancel, t.tapAndSpeak, t.send], scale);
        }

        await fresh();
        if (await go(t.settings, t.textSizePreview)) {
          await shot(`${tag}_settings`);
          await checkScreen(tag, 'Settings', [
            t.back, t.textSizeNormal, t.textSizeLarge, t.textSizeLarger, t.textSizeLargest,
            'English', 'हिन्दी', 'മലയാളം', t.slowSpeed, t.normalSpeed, t.reduceMotion, t.practiceScreens,
            t.resetProgress, t.continueBtn
          ], scale);
          // The setting itself: tapping Largest applies at once, is saved, and survives a reload
          if (scale === 1.3 && w === 360) {
            const p = await A(`clickPointForText(${JSON.stringify(t.textSizeLargest)})`);
            if (check(p, `${tag} Settings: "${t.textSizeLargest}" not found`)) {
              await click(p.cx, p.cy);
              check(await waitFor(async () => (await A('appTs()')) === '1.5', 1000), `${tag} Settings: tapping Largest did not apply 150%`);
              check((await A('savedScale()')) === 1.5, `${tag} Settings: Largest not saved`);
              await cdp.send('Page.reload', { ignoreCache: false });
              await waitFor(() => cdp.eval(`document.readyState === 'complete' && !!document.querySelector('.text-title')`), 8000);
              check((await A('appTs()')) === '1.5', `${tag}: Text size not kept after a reload (${await A('appTs()')})`);
            }
          }
        }

        for (const app of ['whatsapp', 'gpay']) {
          await fresh();
          const titles = TASKS.filter((k) => k.app === app).map((k) => k.title[lang] || k.title.en);
          if (await go(app === 'whatsapp' ? t.whatsAppTitle : t.gpayTitle, titles[0])) {
            await sleep(300); // task cards fade up
            await shot(`${tag}_${app}_list`);
            await checkScreen(tag, `${app} task list`, [t.back, ...titles], scale);
          }
        }

        await runTutorials(w, h, lang, true, scale);
      }
    }
  }
});

for (const id of replicaIds) check(seenIds.has(id), `highlight id ${id} never found on screen`);

browser.kill();
const secs = Math.round((Date.now() - t0) / 1000);
const report = [
  `Audit: ${checks} checks, ${failures.length} failed, ${secs}s`,
  ...timings.map((x) => 'TIME ' + x),
  ...failures.map((f) => 'FAIL ' + f),
  `Instructions that scroll at 150% (${hintScrollsAt150.length}):`,
  ...hintScrollsAt150.map((x) => '  SCROLLS ' + x),
  `Instructions with a word too long for one line at 150% (${hintBreaksAt150.size}):`,
  ...[...hintBreaksAt150].map((x) => '  BREAKS ' + x),
  `Screens with a word too long for one line at 150% (${wordBreaksAt150.size}):`,
  ...[...wordBreaksAt150].map((x) => '  BREAKS ' + x),
  ...notes.filter((n) => !n.includes('completed by')).map((n) => 'NOTE ' + n),
  `Scroll methods used: ${[...new Set(notes.filter((n) => n.includes('completed by')).map((n) => n.split('completed by ')[1]))].join(', ')}`,
  `Screenshots (${screenshots.length}) in ${OUT}`
].join('\n');
writeFileSync(join(OUT, 'audit-report.txt'), report);
console.log(report);
process.exit(failures.length ? 1 : 0);
