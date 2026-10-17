// Tutorial audit: plays every step of every task in a real (headless) Edge or Chrome and checks
// layout and behaviour for each language, screen size and Reduce motion setting.
//
// Needs no extra packages: the browser is driven over the DevTools protocol with Node's built-in
// WebSocket (Node 20: --experimental-websocket), and tsx (already a dev dependency) loads the strings.
//
//   npm run build && npx vite preview --port 3000 --strictPort
//   node --experimental-websocket --import tsx scripts/audit-tutorials.mjs --out <screenshot folder>
//
// Options: --url (default http://localhost:3000), --out (required: keep screenshots OUT of the
// project), --browser (path to msedge.exe / chrome.exe), --quick (one size, motion off).
// Exit code 1 if any check fails.

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync, readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { I18N } from '../src/config/i18n.ts';
import { REPLICA_STRINGS } from '../src/replicas/replicaStrings.ts';

const args = Object.fromEntries(
  process.argv.slice(2).map((a, i, all) => (a.startsWith('--') ? [a.slice(2), all[i + 1]?.startsWith('--') ? true : all[i + 1] ?? true] : null)).filter(Boolean)
);
const URL_BASE = args.url || 'http://localhost:3000';
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

const TASKS = JSON.parse(readFileSync(new URL('../src/config/tasks.json', import.meta.url), 'utf8'));
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
const LANGS = ['en', 'hi', 'ml'];
const MOTIONS = args.quick ? [false] : [false, true];
const SCROLL_METHODS = ['touch', 'wheel', 'keyboard'];
const MARGIN = 12;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const failures = [];
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
  }
  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((ok, reject) => this.pending.set(id, { resolve: ok, reject }));
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
    // Typed text that wraps in the middle of a word: a new line must start right after a space
    midWordBreaks(id) {
      const el = document.querySelector('[data-element-id="' + id + '"]');
      const out = [];
      if (!el) return out;
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const s = n.textContent;
        let lastTop = null;
        // Step by grapheme so Indic clusters are measured whole
        const parts = [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(s)];
        for (const { segment, index } of parts) {
          const range = document.createRange();
          range.setStart(n, index); range.setEnd(n, index + segment.length);
          const top = range.getBoundingClientRect().top;
          if (lastTop !== null && top > lastTop + 4 && segment.trim() && index > 0 && s[index - 1] !== ' ')
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
    focusList() { document.querySelector('[data-scroll-area]')?.focus(); }
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

// An older saved profile (no practice-screen setting) must still load
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 360, height: 690, deviceScaleFactor: 1, mobile: true });
await openApp({ name: 'User', language: 'en', completedTasks: ['whatsapp_send_text'], firstLaunchCompleted: true });
check(await A(`clickPointForText(${JSON.stringify(I18N.en.whatsAppTitle)})`), 'old saved profile: Home did not load');

let methodTurn = 0;
for (const [w, h] of SIZES) {
  for (const lang of LANGS) {
    for (const reduce of MOTIONS) {
      const t = I18N[lang];
      const r = REPLICA_STRINGS[lang];
      const tag = `${lang}_${w}x${h}_${reduce ? 'reduced' : 'motion'}`;
      await cdp.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: true });
      await cdp.send('Emulation.setEmulatedMedia', {
        features: [{ name: 'prefers-reduced-motion', value: reduce ? 'reduce' : 'no-preference' }]
      });
      const wait = reduce ? 450 : 900; // screen slide + scroll-into-view (smooth when motion is on)

      for (const task of TASKS) {
        const where = `${tag} ${task.task_id}`;
        await openApp({
          name: 'User', language: lang, completedTasks: [], firstLaunchCompleted: true,
          reduceMotion: reduce, replicaLanguage: 'follow'
        });
        if (!check(await openTask(task, t, lang), `${where}: could not open the task`)) continue;
        const total = task.steps.length;
        const showMeRun = task.task_id === 'whatsapp_send_text';
        let playMark = 0;

        for (let i = 0; i < total; i++) {
          const step = task.steps[i];
          // Original steps keep their clips; new steps have none yet. Tag findings on unchanged screens.
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
          if (step.screen === 'whatsapp_chat_screen_typed') {
            for (const s of await A(`midWordBreaks('chat_input')`)) check(false, `${at}: typed message ${s}`);
          }
          if (w === 360 && h === 690 && !reduce) await shot(`${tag}_${task.task_id}_step${i + 1}`);
          if (step.highlight_element === 'chat_row_ramesh' && !reduce) await shot(`${tag}_${task.task_id}_tap_chat`);

          playMark = await cdp.eval('window.__plays.length');
          await click(info.cx, info.cy);
          if (i + 1 < total) {
            check(await waitFor(async () => (await A('label()')) === stepText(t, i + 2, total)), `${at}: tapping the target did not advance`);
          } else {
            check(await waitFor(() => A(`buttonWithText(${JSON.stringify(t.practiceAgain)})`), 3000), `${at}: completion screen not shown`);
          }
        }
      }
    }
  }
}

for (const id of replicaIds) check(seenIds.has(id), `highlight id ${id} never found on screen`);

browser.kill();
const secs = Math.round((Date.now() - t0) / 1000);
const report = [
  `Audit: ${checks} checks, ${failures.length} failed, ${secs}s`,
  ...failures.map((f) => 'FAIL ' + f),
  ...notes.filter((n) => !n.includes('completed by')).map((n) => 'NOTE ' + n),
  `Scroll methods used: ${[...new Set(notes.filter((n) => n.includes('completed by')).map((n) => n.split('completed by ')[1]))].join(', ')}`,
  `Screenshots (${screenshots.length}) in ${OUT}`
].join('\n');
writeFileSync(join(OUT, 'audit-report.txt'), report);
console.log(report);
process.exit(failures.length ? 1 : 0);
