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
// --audio-only (only the narration clip check; no browser, server or --out needed),
// --reset-only (only the Settings reset confirmation pass),
// --task <task_id> (only that task's tutorial runs, at 100% and in the Text size pass, plus the hint fit
// sweep; skips Home, the other screens of the Text size pass and the reset pass).
//
// Passes: (1) Home and every tutorial step at 100% for every size, language and motion setting;
// (2) hint fit sweep: every step's instruction at every Text size, language and size (no hint may
// scroll below 150%; steps that scroll at 150% are listed); (3) Text size pass: 130% and 150% for
// en/hi/ml at 360x690 and 412x915 on Home, Settings, Ask Me, both task lists and every tutorial step;
// (4) Reset progress: the confirmation at 360x690 and 412x915, en/hi/ml, Text size 100% and 150%, and that
// Yes clears progress only (settings kept, task list ticks gone without a reload) while No changes nothing.
// The chat search, document and location tasks also check: no ordinal or (attach sheet) colour wording, new
// Malayalam instructions in 2 lines, typing completes on the first character, filtering by name and digits,
// clear and no-match, the keyboard-open screen (360x400), inert picker and live-location taps, and their results.
// The status, block and forward tasks also check: no colour in their own instructions, typing the status (first
// character, emptied field, keyboard open, never saved), the scam link and Cancel nudging, the press-and-hold by
// mouse and by finger (a short tap nudges with the hold wording, a drifting hold does nothing), changing the
// contact, and their results (taps there ignored).
// The Pay anyone, recharge, bank transfer and history tasks also check: no ordinal, colour or fixed amount in their own
// instructions, Malayalam in 2 lines, the fake number range and invented UPI IDs, operators and bank; Pay anyone's
// typing (first character, filtering by name, UPI ID and digits, clear, no-match lists everyone, keyboard open, never
// saved); any number and plan; the account and IFSC filling only on their taps, Continue grey until then; history
// rows in words with + and green (4.5:1) for money received; and their results (success screen or payment details).
// Exit code 1 if any check fails.

import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync, readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { I18N } from '../src/config/i18n.ts';
import { REPLICA_STRINGS } from '../src/replicas/replicaStrings.ts';
import { UNKNOWN_NUMBER, MY_NUMBER, UPI_PAYEES, RECHARGE_OPERATORS, RECHARGE_PLANS, PRACTICE_BANK, MOCK_TRANSACTIONS } from '../src/config/mockData.ts';

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
const TASK_ONLY = typeof args.task === 'string' ? args.task : null;
if (TASK_ONLY && !TASKS.some((t) => t.task_id === TASK_ONLY)) {
  console.error(`--task ${TASK_ONLY}: no such task in tasks.json`);
  process.exit(2);
}
const RUN_TASKS = TASK_ONLY ? TASKS.filter((t) => t.task_id === TASK_ONLY) : TASKS;
// Send money: the learner types any amount, so no instruction may name a fixed one
for (const s of TASKS.find((t) => t.task_id === 'gpay_send_contact').steps)
  for (const l of LANGS) if (/₹\s?\d/.test(s.hint_text[l])) failures.push(`gpay_send_contact ${s.highlight_element} (${l}): instruction names a fixed amount: ${s.hint_text[l]}`);
// Chat search, document and location tasks: the learner chooses freely, so no instruction may use ordinal
// wording; and on the attach sheet an instruction names the pill, never its colour (Gallery's purple is the
// only unique one, and it belongs to the photo task)
const NEW_WA_TASKS = ['whatsapp_search_contact', 'whatsapp_send_document', 'whatsapp_share_location', 'whatsapp_add_status', 'whatsapp_block_number', 'whatsapp_forward_message'];
// Status, block and forward tasks: an instruction of their own leads with the label and names no colour at all
// (the shared start steps keep their existing text)
const LABEL_FIRST_TASKS = ['whatsapp_add_status', 'whatsapp_block_number', 'whatsapp_forward_message'];
const ORDINALS = {
  en: /\b(first|second|third|fourth|last|1st|2nd|3rd|top one)\b/i,
  hi: /(पहल|दूसर|तीसर|चौथ|आखिरी|अंतिम)/,
  ml: /(ആദ്യ|രണ്ടാമ|മൂന്നാമ|നാലാമ|അവസാന)/
};
const COLOURS = {
  en: /\b(green|blue|red|orange|yellow|pink|purple)\b/i,
  hi: /(हरे|हरा|हरी|नील|लाल|नारंगी|पील|गुलाबी|बैंगनी)/,
  ml: /(പച്ച|നീല|ചുവപ്പ|ഓറഞ്ച|മഞ്ഞ|പിങ്ക|പർപ്പിൾ)/
};
for (const id of NEW_WA_TASKS) {
  TASKS.find((t) => t.task_id === id).steps.forEach((s, i) => {
    for (const l of LANGS) {
      if (ORDINALS[l].test(s.hint_text[l])) failures.push(`${id} step ${i + 1} (${l}): ordinal wording in the instruction: ${s.hint_text[l]}`);
      if (s.screen === 'whatsapp_attachment_sheet' && COLOURS[l].test(s.hint_text[l])) failures.push(`${id} step ${i + 1} (${l}): attach sheet instruction names a colour: ${s.hint_text[l]}`);
    }
  });
}
for (const id of LABEL_FIRST_TASKS) {
  TASKS.find((t) => t.task_id === id).steps.forEach((s, i) => {
    const shared = TASKS.some((o) => !LABEL_FIRST_TASKS.includes(o.task_id) && o.steps.some((x) => x.hint_text.en === s.hint_text.en));
    if (shared) return;
    for (const l of LANGS) if (COLOURS[l].test(s.hint_text[l])) failures.push(`${id} step ${i + 1} (${l}): instruction names a colour: ${s.hint_text[l]}`);
  });
}
// The block task's number is in the fake range
if (!/^\+91 90000 000\d\d$/.test(UNKNOWN_NUMBER)) failures.push(`block task: unknown number ${UNKNOWN_NUMBER} is not in the fake range +91 90000 000xx`);
// Pay anyone, recharge, bank transfer and history: an instruction of their own (not shared with the older tasks)
// has no ordinal wording, names no colour and no fixed amount
const NEW_GPAY_TASKS = ['gpay_pay_upi_or_phone', 'gpay_recharge_mobile', 'gpay_bank_transfer', 'gpay_transaction_history'];
const ownGpayHint = (s) => !TASKS.some((o) => !NEW_GPAY_TASKS.includes(o.task_id) && o.steps.some((x) => x.hint_text.en === s.hint_text.en));
for (const id of NEW_GPAY_TASKS) {
  TASKS.find((t) => t.task_id === id).steps.forEach((s, i) => {
    if (!ownGpayHint(s)) return;
    for (const l of LANGS) {
      if (ORDINALS[l].test(s.hint_text[l])) failures.push(`${id} step ${i + 1} (${l}): ordinal wording in the instruction: ${s.hint_text[l]}`);
      if (COLOURS[l].test(s.hint_text[l])) failures.push(`${id} step ${i + 1} (${l}): instruction names a colour: ${s.hint_text[l]}`);
      if (/₹\s?\d/.test(s.hint_text[l])) failures.push(`${id} step ${i + 1} (${l}): instruction names a fixed amount: ${s.hint_text[l]}`);
    }
  });
  // Every pay flow ends on the PIN tap with the success screen as its result; history ends on the payment details
  const last = TASKS.find((t) => t.task_id === id).steps.at(-1);
  const want = id === 'gpay_transaction_history' ? 'gpay_history_detail_screen' : 'gpay_payment_success_screen';
  if (last.result_screen !== want) failures.push(`${id}: last step's result screen is ${last.result_screen}, expected ${want}`);
}
// Practice data: the learner's number in the fake range, UPI IDs that never read as e-mail addresses, and only
// invented operator and bank names
if (!/^\+91 90000 000\d\d$/.test(MY_NUMBER) || MY_NUMBER <= '+91 90000 00003') failures.push(`recharge: ${MY_NUMBER} is not a new number in the fake range +91 90000 000xx`);
for (const p of UPI_PAYEES) if (/@[^@\s]*\./.test(p.upiId)) failures.push(`Pay anyone: UPI ID ${p.upiId} has a dot after the @ (reads as an e-mail address)`);
for (const op of RECHARGE_OPERATORS) if (!/^(Practice|Demo|Sample) /.test(op)) failures.push(`recharge: operator "${op}" is not an invented name`);
if (PRACTICE_BANK.name !== 'Practice Bank' || PRACTICE_BANK.accountMasked !== '••••0001' || PRACTICE_BANK.ifsc !== 'PRAC0000001') failures.push('bank transfer: practice bank data changed');
// Pay anyone runs in turn: what is typed, the payees that must be listed (in order) and the one picked. Digits find a
// payee by number; a UPI ID part finds its owner.
const UPI_RUNS = [
  { q: 'shop', rows: ['shop'], pick: 'shop' },
  { q: '98765', rows: ['ramesh', 'priya'], pick: 'priya' },
  { q: 'ramesh@', rows: ['ramesh'], pick: 'ramesh' }
];
let upiTurn = 0;
// Recharge runs in turn: the number and the plan picked
const RECHARGE_RUNS = [
  { num: 'me', plan: 'basic' },
  { num: 'ramesh', plan: 'long' },
  { num: 'priya', plan: 'value' }
];
let rechargeTurn = 0;
// History runs in turn: the payment opened (the received one first)
const HIST_PICKS = ['history_item_2', 'history_item_1', 'history_item_3'];
let histTurn = 0;
const personName = (r, key) => ({ shop: r.shopName, ramesh: r.ramesh, priya: r.priya, me: r.myNumber })[key];
// Chat search runs in turn: what is typed, the chats that must be listed (in order) and the one opened
// (not always the top row: any chat may be chosen). Digits find a chat by its number.
const SEARCHES = [
  { q: 'pri', rows: ['priya'], open: 'priya' },
  { q: '98765', rows: ['priya', 'ramesh'], open: 'ramesh' },
  { q: '00001', rows: ['shop'], open: 'shop' },
  { q: 'sharma', rows: ['shop', 'doctor'], open: 'doctor' }
];
let searchTurn = 0;
const chatName = (r, key) => ({ priya: `${r.priya} (${r.daughter})`, ramesh: r.rameshSon, shop: r.shopName, doctor: r.chatListDoctor, family: r.chatListFamily })[key];
// Document picker: the (invented) file each run chooses, in turn
const DOC_PICKS = ['Garden_flower.jpg', 'Sunrise_view.jpg', 'Family_photo_01.jpg'];
let docTurn = 0;
// Text status: what each run types (the first character completes the typing step)
const STATUS_TEXTS = ['Good morning, all', 'Happy Sunday', 'At the temple today'];
let statusTurn = 0;
// Forward task, one per run in turn: the message held, how (mouse or finger) and the contact it goes to
const FWD_PICKS = [
  { msg: 'festival', method: 'mouse', to: 'priya' },
  { msg: 'greeting', method: 'touch', to: 'doctor' },
  { msg: 'photo', method: 'mouse', to: 'family' },
  { msg: 'festival', method: 'touch', to: 'shop' }
];
let fwdTurn = 0;
// Hold timing in the audit: a short tap lifts well before the app's 400ms, a hold well after it; a moved hold
// drifts sideways further than the app's 14px
const SHORT_TAP_MS = 100;
const HOLD_WAIT_MS = 700;
const HOLD_DRIFT_PX = 30;
// Amounts typed on the send-money number pad, one per run in turn (9,99,999 is the 6-digit maximum)
const SEND_AMOUNTS = ['999999', '500', '1250', '75'];
let amountTurn = 0;
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
        // A text field's value is drawn by the field itself, not laid out as page text
        if (!vis(el) || el.children.length || !el.textContent.trim() || el.matches('textarea, input')) continue;
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
    // Send-money number pad: the typed amount, the arrow's state, which of the two has the ring, key sizes,
    // and how far the practice screen scrolls
    amountPad() {
      const d = document.querySelector('[data-amount]');
      if (!d) return null;
      const arrow = document.querySelector('[data-element-id="amount_next_button"]');
      const keys = [...document.querySelectorAll('[data-key]')].map((k) => k.getBoundingClientRect().height);
      const rep = this.replicaRoot();
      return {
        typed: d.getAttribute('data-amount'),
        shown: d.textContent.trim(),
        arrowActive: arrow.firstElementChild.getAttribute('aria-disabled') === 'false',
        arrowRing: arrow.classList.contains('highlight-active'),
        padRing: document.querySelector('[data-element-id="amount_keypad"]').classList.contains('highlight-active'),
        keyMin: Math.min(...keys),
        keyMax: Math.max(...keys),
        scrolls: Math.round(rep.scrollHeight - rep.clientHeight)
      };
    },
    // Centre of a number pad key, brought into view first if the practice screen scrolls
    keyPoint(k) {
      const el = document.querySelector('[data-key="' + k + '"]');
      el.scrollIntoView({ block: 'nearest' });
      const r = el.getBoundingClientRect();
      return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
    },
    // Centre of a target, brought into view first (the learner scrolls a practice screen that does not fit)
    targetPoint(id) {
      const el = document.querySelector('[data-element-id="' + id + '"]');
      el.scrollIntoView({ block: 'nearest' });
      const r = el.getBoundingClientRect();
      return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
    },
    nudgeShown: () => !!document.querySelector('[role="status"].pointer-events-none'),
    // Chat search: the typed text, the listed chats (keys), which of field and list has the ring, the empty line
    searchState() {
      const input = document.querySelector('[data-search-input]');
      if (!input) return null;
      const ring = (id) => !!document.querySelector('[data-element-id="' + id + '"]')?.classList.contains('highlight-active');
      return {
        value: input.value,
        rows: [...document.querySelectorAll('[data-search-row]')].map((r) => r.getAttribute('data-search-row')),
        fieldRing: ring('search_input'),
        listRing: ring('search_results'),
        empty: !!document.querySelector('[data-search-empty]'),
        focused: document.activeElement === input
      };
    },
    // Centre and height of the first element matching a selector, brought into view first
    point(sel) {
      const el = document.querySelector(sel);
      if (!el) return null;
      el.scrollIntoView({ block: 'nearest' });
      const r = el.getBoundingClientRect();
      return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, h: r.height };
    },
    heights: (sel) => [...document.querySelectorAll(sel)].map((e) => e.getBoundingClientRect().height),
    // Phone keyboard open (short screen): the instruction bar, the search field and the first result are
    // fully on screen and the topmost element at their centre
    keyboardFit(field = '[data-search-input]', row = '[data-search-row]') {
      const out = [];
      const inView = (el, name) => {
        if (!el) return out.push(name + ' not found');
        const r = el.getBoundingClientRect(), g = this.region(el);
        const top = Math.max(0, g.top), bottom = Math.min(innerHeight, g.bottom);
        if (r.top < top - 1 || r.bottom > bottom + 1) out.push(name + ' not fully visible (' + Math.round(r.top) + '..' + Math.round(r.bottom) + ' of ' + Math.round(top) + '..' + Math.round(bottom) + ')');
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        if (!hit || !el.contains(hit)) out.push(name + ' covered at its centre');
      };
      inView(document.getElementById('tutorial-hint')?.closest('[aria-live]'), 'instruction bar');
      inView(document.querySelector(field), 'text field');
      inView(document.querySelector(row), 'first result');
      return out;
    },
    // Pay anyone: the typed text, the listed payees (keys), which of field and list has the ring, the no-match line
    payState() {
      const input = document.querySelector('[data-payanyone-input]');
      if (!input) return null;
      const ring = (id) => !!document.querySelector('[data-element-id="' + id + '"]')?.classList.contains('highlight-active');
      return {
        value: input.value,
        rows: [...document.querySelectorAll('[data-payanyone-row]')].map((r) => r.getAttribute('data-payanyone-row')),
        fieldRing: ring('payanyone_input'),
        listRing: ring('payanyone_results'),
        noMatch: !!document.querySelector('[data-payanyone-nomatch]'),
        focused: document.activeElement === input
      };
    },
    // Empties a text field the way the keyboard's delete key would (React sees an input event)
    clearInput(sel) {
      const input = document.querySelector(sel);
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, '');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    },
    // History rows: id, received or paid, the words line, the amount and its colour
    historyRows() {
      return [...document.querySelectorAll('[data-history-row]')].map((row) => {
        const amt = row.querySelector('[data-history-amount]');
        return {
          id: row.getAttribute('data-history-row'),
          credit: row.getAttribute('data-credit') === 'true',
          words: row.querySelector('[data-history-words]')?.textContent.trim(),
          amount: amt?.textContent.trim(),
          color: amt && getComputedStyle(amt).color,
          h: row.getBoundingClientRect().height
        };
      });
    },
    // Contrast of an element's text colour on white (the history page)
    contrastOnWhite(sel) {
      const el = document.querySelector(sel);
      if (!el) return 0;
      const c = getComputedStyle(el).color.match(/[\\d.]+/g).slice(0, 3).map(Number);
      const lum = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
      const L = 0.2126 * lum[0] + 0.7152 * lum[1] + 0.0722 * lum[2];
      return 1.05 / (L + 0.05);
    },
    attr: (sel, name) => document.querySelector(sel)?.getAttribute(name) ?? null,
    // Text status: the typed text, focus, and which of field and Send has the ring
    statusState() {
      const input = document.querySelector('[data-status-input]');
      if (!input) return null;
      const el = (id) => document.querySelector('[data-element-id="' + id + '"]');
      return {
        value: input.value,
        focused: document.activeElement === input,
        fieldRing: !!el('status_text_input')?.classList.contains('highlight-active'),
        send: !!el('status_send_button'),
        sendRing: !!el('status_send_button')?.classList.contains('highlight-active')
      };
    },
    // Empties the status field the way the keyboard's delete key would (React sees an input event)
    clearStatus() {
      const input = document.querySelector('[data-status-input]');
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(input, '');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    },
    // Phone keyboard open on the text status: the instruction bar, the field and Send fully on screen
    statusKeyboardFit() {
      const out = [];
      for (const [el, name] of [
        [document.getElementById('tutorial-hint')?.closest('[aria-live]'), 'instruction bar'],
        [document.querySelector('[data-status-input]'), 'status field'],
        [document.querySelector('[data-element-id="status_send_button"]'), 'Send']
      ]) {
        if (!el) { out.push(name + ' not found'); continue; }
        const r = el.getBoundingClientRect(), g = this.region(el);
        const top = Math.max(0, g.top), bottom = Math.min(innerHeight, g.bottom);
        if (r.top < top - 1 || r.bottom > bottom + 1) out.push(name + ' not fully visible (' + Math.round(r.top) + '..' + Math.round(r.bottom) + ' of ' + Math.round(top) + '..' + Math.round(bottom) + ')');
      }
      return out;
    },
    // Does any saved value (local or session storage) contain this text?
    storedAnywhere(text) {
      for (const s of [localStorage, sessionStorage])
        for (let i = 0; i < s.length; i++) if ((s.getItem(s.key(i)) || '').includes(text)) return true;
      return false;
    },
    // Forward task: the held (selected) message, and whether the photo ignores the pointer and cannot be dragged
    selectedMsg: () => document.querySelector('[data-selected]')?.getAttribute('data-fwd-msg') || null,
    photoInert() {
      const el = document.querySelector('[data-fwd-msg="photo"] [draggable="false"]');
      return !!el && getComputedStyle(el).pointerEvents === 'none';
    },
    textOf: (sel) => document.querySelector(sel)?.textContent.trim() ?? null,
    // Attach sheet: number of pills, which pills are purple, and the size of each target pill
    attachPills() {
      const box = document.querySelector('[data-attach-pills]');
      if (!box) return null;
      const pills = [...box.children];
      return {
        count: pills.length,
        purple: pills.filter((p) => getComputedStyle(p.querySelector('svg')).color === 'rgb(166, 63, 196)').map((p) => p.getAttribute('data-element-id') || p.textContent.trim()),
        targets: pills.filter((p) => p.hasAttribute('data-element-id')).map((p) => {
          const r = p.getBoundingClientRect();
          return { id: p.getAttribute('data-element-id'), w: r.width, h: r.height };
        })
      };
    },
    hintLines() {
      const el = document.getElementById('tutorial-hint');
      return Math.round(el.scrollHeight / parseFloat(getComputedStyle(el).lineHeight));
    },
    // A sent bubble on the practice screen (result screens only): is it fully inside its visible region
    sentBubble() {
      const b = document.querySelector('[data-sent-bubble]');
      if (!b || !vis(b)) return null;
      const r = b.getBoundingClientRect(), g = this.region(b);
      return {
        inside: r.top >= g.top - 1 && r.bottom <= g.bottom + 1 && r.left >= g.left - 1 && r.right <= g.right + 1,
        // Taller than the chat area (smallest practice screen): the chat shows its newest end, time and ticks
        tallEndShown: r.height > g.bottom - g.top && r.bottom <= g.bottom + 1 && r.bottom >= g.top + 40 && r.left >= g.left - 1 && r.right <= g.right + 1
      };
    },
    // Gallery: number of thumbnails, whether one is a video, and the smallest thumbnail side
    gallery() {
      const first = document.querySelector('[data-element-id="photo_thumbnail_1"]');
      const grid = first && first.parentElement;
      if (!grid) return null;
      const tiles = [...grid.children];
      return {
        count: tiles.length,
        video: !!grid.querySelector('[data-gallery-video]'),
        minSide: Math.min(...tiles.map((t) => { const r = t.getBoundingClientRect(); return Math.min(r.width, r.height); }))
      };
    },
    // The reset confirmation: every text inside the panel and the panel inside the screen (after scrolling to it)
    resetDialog() {
      const d = document.querySelector('[role="alertdialog"]');
      if (!d || !vis(d)) return null;
      const out = [];
      const dr = d.getBoundingClientRect();
      if (dr.left < -1 || dr.right > innerWidth + 1) out.push('panel wider than the screen');
      for (const el of d.querySelectorAll('*')) {
        if (!vis(el) || el.children.length || !el.textContent.trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(el);
        const tr = range.getBoundingClientRect();
        if (tr.left < dr.left - 1 || tr.right > dr.right + 1 || tr.top < dr.top - 1 || tr.bottom > dr.bottom + 1)
          out.push('"' + el.textContent.trim().slice(0, 30) + '" sticks out of the panel');
      }
      return out;
    },
    doneCards: () => document.querySelectorAll('.bg-success-soft.rounded-card').length,
    savedProfile: () => JSON.parse(localStorage.getItem('olearn_user_profile_v1') || '{}'),
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
// Press at a point, wait, and lift: by mouse or by finger (touch emulation), optionally drifting sideways first
const pressFor = async (x, y, ms, method, drift = 0) => {
  if (method === 'touch') {
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    for (let k = 1; k <= 3 && drift; k++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + (drift * k) / 3, y }] });
    await sleep(ms);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: false });
  } else {
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
    await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 });
    for (let k = 1; k <= 3 && drift; k++) await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x + (drift * k) / 3, y, button: 'left', buttons: 1 });
    await sleep(ms);
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: x + drift, y, button: 'left', buttons: 0, clickCount: 1 });
  }
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
const replicaIds = new Set(RUN_TASKS.flatMap((t) => t.steps.map((s) => s.highlight_element)));
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
if (!args['scales-only'] && !args['reset-only'] && !TASK_ONLY) await timed('Home at 100%', async () => {
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

  for (const task of RUN_TASKS) {
    const where = `${tag} ${task.task_id}`;
    await openApp(profileFor(lang, reduce, scale));
    if (!check(await openTask(task, t, lang), `${where}: could not open the task`)) continue;
    const total = task.steps.length;
    const showMeRun = task.task_id === 'whatsapp_send_text';
    let playMark = 0;
    // Send money: the amount this run types on the number pad, and how the app must show it
    const keypadTask = ['gpay_send_contact', 'gpay_pay_upi_or_phone', 'gpay_bank_transfer'].includes(task.task_id);
    const sendAmount = keypadTask ? SEND_AMOUNTS[amountTurn++ % SEND_AMOUNTS.length] : null;
    // Pay anyone, recharge and history: this run's choices (recharge pays the plan's price)
    const upiRun = task.task_id === 'gpay_pay_upi_or_phone' ? UPI_RUNS[upiTurn++ % UPI_RUNS.length] : null;
    const rechargeRun = task.task_id === 'gpay_recharge_mobile' ? RECHARGE_RUNS[rechargeTurn++ % RECHARGE_RUNS.length] : null;
    const histPick = task.task_id === 'gpay_transaction_history' ? HIST_PICKS[histTurn++ % HIST_PICKS.length] : null;
    const planPrice = rechargeRun && RECHARGE_PLANS.find((p) => p.key === rechargeRun.plan).price;
    const sendShown = sendAmount ? '₹' + Number(sendAmount).toLocaleString('en-IN') : planPrice ? '₹' + planPrice : null;
    // Who the payment goes to, as the success screen names them
    const payeeShown = upiRun ? personName(r, upiRun.pick) : rechargeRun ? personName(r, rechargeRun.num) : task.task_id === 'gpay_bank_transfer' ? r.ramesh : null;
    const search = task.task_id === 'whatsapp_search_contact' ? SEARCHES[searchTurn++ % SEARCHES.length] : null;
    const docPick = task.task_id === 'whatsapp_send_document' ? DOC_PICKS[docTurn++ % DOC_PICKS.length] : null;
    const statusText = task.task_id === 'whatsapp_add_status' ? STATUS_TEXTS[statusTurn++ % STATUS_TEXTS.length] : null;
    const fwd = task.task_id === 'whatsapp_forward_message' ? FWD_PICKS[fwdTurn++ % FWD_PICKS.length] : null;

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

      // Nothing is shown as sent before the final Send tap
      check(!(await A('sentBubble()')), `${at}: a sent bubble is shown before the Send tap`);
      if (step.screen === 'whatsapp_chat_screen_typed') {
        check(await A(`textIncludes(${JSON.stringify(r.chatTyped)})`), `${at}: typed practice message missing from the message box`);
        check(!(await A(`textIncludes(${JSON.stringify(r.chatSent)})`)), `${at}: the sent message is shown before the Send tap`);
      }
      // Gallery: several photos and a video, every thumbnail tappable size
      if (step.screen === 'whatsapp_gallery_screen') {
        const gl = await A('gallery()');
        if (check(gl, `${at}: gallery grid not found`)) {
          check(gl.count >= 6, `${at}: gallery shows ${gl.count} thumbnails (needs 6)`);
          check(gl.video, `${at}: gallery has no video thumbnail`);
          check(gl.minSide >= 64, `${at}: a gallery thumbnail is ${Math.round(gl.minSide)}px (needs 64px)`);
        }
        check(await A(`textIncludes(${JSON.stringify(r.galleryRecent)})`), `${at}: gallery photo count line missing`);
      }

      // New WhatsApp tasks: a new Malayalam instruction takes at most 2 lines at 360px (100% text). Steps shared
      // with the older tasks (start steps, paperclip) keep their existing text and are not checked here.
      const sharedHint = TASKS.some((o) => !NEW_WA_TASKS.includes(o.task_id) && o.steps.some((s) => s.hint_text.en === step.hint_text.en));
      const newOwnHint = (NEW_WA_TASKS.includes(task.task_id) && !sharedHint) || (NEW_GPAY_TASKS.includes(task.task_id) && ownGpayHint(step));
      if (newOwnHint && w === 360 && scale === 1) {
        const lines = await A('hintLines()');
        if (lang === 'ml') check(lines <= 2, `${at}: Malayalam instruction takes ${lines} lines at 360px (max 2)`);
        else if (lines > 2) notes.push(`${at}: instruction takes ${lines} lines at ${w}x${h}`);
      }
      // Attach sheet: eight pills, Gallery the only purple one, the target pills at least 64px
      if (step.screen === 'whatsapp_attachment_sheet') {
        const ap = await A('attachPills()');
        if (check(ap, `${at}: attach sheet pills not found`)) {
          check(ap.count === 8, `${at}: attach sheet shows ${ap.count} pills (needs 8)`);
          check(ap.purple.length === 1 && ap.purple[0] === 'gallery_icon', `${at}: purple pills: ${ap.purple.join(', ') || 'none'} (only Gallery may be purple)`);
          for (const p of ap.targets) check(Math.min(p.w, p.h) >= 64, `${at}: ${p.id} is ${Math.round(p.w)}x${Math.round(p.h)} (needs 64px)`);
        }
        for (const s of [r.gallery, r.location, r.contact, r.document, r.poll, r.payment, r.event, r.aiImages])
          check(await A(`textIncludes(${JSON.stringify(s)})`), `${at}: "${s}" missing on the attach sheet`);
      }
      if (step.highlight_element === 'search_input') {
        for (const s of [r.chipUnread, r.chipPhotos, r.chipVideos, r.chipLinks])
          check(await A(`textIncludes(${JSON.stringify(s)})`), `${at}: chip "${s}" missing before typing`);
      }
      // Chat search: no chat is open before a result is tapped
      if (search) check(!(await A(`point('[data-chat-name]')`)), `${at}: a chat is shown before a result is tapped`);
      if (step.screen === 'whatsapp_document_picker') {
        for (const s of [r.recent, r.chipImages, r.chipAudio, r.chipVideos, r.chipDocuments, r.browseOtherApps, r.recentFiles])
          check(await A(`textIncludes(${JSON.stringify(s)})`), `${at}: "${s}" missing on the document picker`);
      }
      // Document preview: the file chosen in the picker, and who it goes to
      if (step.screen === 'whatsapp_document_preview') {
        check(await A(`textIncludes(${JSON.stringify(docPick)})`), `${at}: chosen file ${docPick} not shown on the preview`);
        for (const s of [r.rameshSon, r.addCaption]) check(await A(`textIncludes(${JSON.stringify(s)})`), `${at}: "${s}" missing on the preview`);
      }
      if (step.screen === 'whatsapp_send_location') {
        for (const s of [r.sendLocation, r.shareLiveLocation, r.nearbyPlaces, r.sendCurrentLocation, r.accurateTo])
          check(await A(`textIncludes(${JSON.stringify(s)})`), `${at}: "${s}" missing on the send location screen`);
      }

      // Status, block and forward screens: what is on them
      const has = async (list, what) => {
        for (const s of list) check(await A(`textIncludes(${JSON.stringify(s)})`), `${at}: "${s}" missing on ${what}`);
      };
      if (step.highlight_element === 'tab_updates') await has([r.tabUpdates], 'the chat list tabs (the Updates tab must be named)');
      if (step.screen === 'whatsapp_updates_screen') await has([r.tabUpdates, r.statusTitle, r.addStatus, r.priya, r.channels, r.explore], 'the Updates tab');
      if (step.screen === 'whatsapp_add_status_sheet') await has([r.addStatus, r.statusText, r.statusMusic, r.statusLayout, r.statusVoice, r.recents], 'the Add status sheet');
      if (step.screen === 'whatsapp_chat_list_unknown') await has([UNKNOWN_NUMBER], 'the chat list');
      if (step.screen === 'whatsapp_unknown_chat') {
        check((await A(`textOf('[data-chat-name]')`)) === UNKNOWN_NUMBER, `${at}: the chat header does not show ${UNKNOWN_NUMBER}`);
        await has([r.scamMsg, 'prize-claim.example/win', r.notAContact, r.safetyTools, r.block, r.add], 'the unknown chat');
      }
      if (step.screen === 'whatsapp_block_dialog') await has([r.blockQuestion(UNKNOWN_NUMBER), r.blockBody, r.reportTo, r.reportBody, r.cancel], 'the Block confirmation');
      if (step.screen === 'whatsapp_chat_forward') {
        await has([r.chatReceived, r.fwdMsg], 'the forward chat');
        check(!(await A('selectedMsg()')), `${at}: a message is selected before the hold`);
      }
      if (step.screen === 'whatsapp_forward_list') await has([r.forwardTo, r.myStatus, r.frequentlyContacted, r.recentChats], 'the Forward to list');

      // Sample data on the Google Pay payment screens
      if (step.screen === 'gpay_amount_keypad_screen' && step.highlight_element === 'amount_keypad') {
        // The header names who is paid: Ramesh (send money), the payee picked (Pay anyone) or the practice account
        const header =
          upiRun ? [r.paying(payeeShown), UPI_PAYEES.find((p) => p.key === upiRun.pick).upiId]
          : task.task_id === 'gpay_bank_transfer' ? [r.paying(r.ramesh), r.bankingName(r.ramesh), `${PRACTICE_BANK.name} ${PRACTICE_BANK.accountMasked}`]
          : [r.payingRamesh, r.bankingName(r.ramesh), r.upiId('ramesh@practice')];
        for (const s of [...header, r.addNote, r.keyNext])
          check(await A(`textIncludes(${JSON.stringify(s)})`), `${at}: "${s}" missing on the amount screen`);
      }
      if (step.screen === 'gpay_payment_method_sheet' || step.screen === 'gpay_recharge_paysheet') {
        for (const s of [r.selectPaymentMethod, 'State Bank of India', '•••• 4829', r.checkNow, r.payAmount(sendShown)])
          check(await A(`textIncludes(${JSON.stringify(s)})`), `${at}: "${s}" missing on the payment method sheet`);
        if (sendAmount === '999999') check(await A(`textIncludes(${JSON.stringify(r.payAmount('₹9,99,999'))})`), `${at}: Pay button does not show ₹9,99,999`);
      }
      if (task.task_id === 'gpay_send_contact' && step.screen === 'gpay_payment_success_screen') {
        check(await A(`textIncludes(${JSON.stringify(sendShown + '.00')})`), `${at}: typed amount ${sendShown}.00 missing on the success screen`);
        if (sendAmount === '999999') check(await A(`textIncludes('₹9,99,999.00')`), `${at}: success screen does not show ₹9,99,999.00`);
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

      const sameStep = async () => (await A('label()')) === stepText(t, i + 1, total);
      const typeText = async (text) => {
        await cdp.send('Input.insertText', { text });
        await sleep(150);
      };
      const tapClear = async () => {
        const cp = await A(`point(${JSON.stringify(`button[aria-label="${r.clearSearch}"]`)})`);
        if (check(cp, `${at}: clear button not found`)) await click(cp.cx, cp.cy);
        await sleep(150);
      };
      // Where the step's final tap goes when it is not the target's centre (a chosen row of a ringed list)
      let tapAt = null;

      // Chat search, typing step: a tap on the field focuses it (no nudge, no step); the first character completes the step
      if (step.highlight_element === 'search_input') {
        await waitFor(async () => !(await A('nudgeShown()')), 3500);
        let st = await A('searchState()');
        if (!check(st, `${at}: search field not found`)) break;
        check(st.value === '' && st.fieldRing && !st.listRing && !st.rows.length, `${at}: before typing: "${st.value}", ${st.rows.length} result(s), ring on ${st.fieldRing ? 'field' : 'not the field'}`);
        const fp = await A(`point('[data-search-input]')`);
        await click(fp.cx, fp.cy);
        await sleep(150);
        check((await sameStep()) && !(await A('nudgeShown()')), `${at}: tapping the search field nudged or changed the step`);
        check((await A('searchState()')).focused, `${at}: the search field is not focused (the phone keyboard would not open)`);
        playMark = await cdp.eval('window.__plays.length');
        await cdp.send('Input.insertText', { text: search.q[0] });
        check(await waitFor(async () => (await A('label()')) === stepText(t, i + 2, total)), `${at}: typing the first character did not complete the step`);
        st = await A('searchState()');
        check(st && st.value === search.q[0], `${at}: first character not typed ("${st && st.value}")`);
        check(!(await A('nudgeShown()')), `${at}: typing nudged`);
        continue;
      }

      // Chat search, results step: more typing filters by name or digits; clear and a no-match never dead-end;
      // with the keyboard open the instruction, the field and a result stay in view; any result opens
      if (step.highlight_element === 'search_results') {
        for (const s of [r.chipLinks, r.chipPhotos, r.chipDocuments, r.chipStickers])
          check(await A(`textIncludes(${JSON.stringify(s)})`), `${at}: chip "${s}" missing after typing`);
        await typeText(search.q.slice(1));
        let st = await A('searchState()');
        check(st.value === search.q && st.rows.join() === search.rows.join(), `${at}: typed "${st.value}", listed [${st.rows}] (expected [${search.rows}])`);
        check(st.listRing && !st.fieldRing, `${at}: with results the ring is not on the list`);
        check((await sameStep()) && !(await A('nudgeShown()')), `${at}: typing more nudged or changed the step`);
        for (const hgt of await A(`heights('[data-search-row]')`)) check(hgt >= 64, `${at}: a result row is ${Math.round(hgt)}px (needs 64px)`);
        if (w === 360 && h === 690 && scale === 1) {
          // The Android WebView shrinks when the keyboard opens: emulate it with a 360x400 screen
          await cdp.send('Emulation.setDeviceMetricsOverride', { width: 360, height: 400, deviceScaleFactor: 1, mobile: true });
          await sleep(400);
          for (const s of await A('keyboardFit()')) check(false, `${at}: keyboard open (360x400): ${s}`);
          if (!reduce) await shot(`${tag}_search_keyboard_360x400`);
          await setScreen(w, h, reduce);
          await sleep(400);
        }
        await tapClear();
        st = await A('searchState()');
        check(st.value === '' && !st.rows.length && st.fieldRing && !st.listRing && !st.empty, `${at}: after clearing: "${st.value}", ${st.rows.length} result(s), ring on ${st.fieldRing ? 'field' : 'not the field'}`);
        check(st.focused, `${at}: clearing took the focus from the field (the keyboard would close)`);
        check((await sameStep()) && !(await A('nudgeShown()')), `${at}: clearing nudged or changed the step`);
        await typeText('zzq');
        st = await A('searchState()');
        check(st.empty && !st.rows.length && st.fieldRing && !st.listRing, `${at}: no match: empty line ${st.empty ? 'shown' : 'missing'}, ${st.rows.length} result(s), ring on ${st.fieldRing ? 'field' : 'not the field'}`);
        for (const s of [r.noResults, r.noResultsHelp]) check(await A(`textIncludes(${JSON.stringify(s)})`), `${at}: no match: "${s}" missing`);
        check((await sameStep()) && !(await A('nudgeShown()')), `${at}: a no-match nudged or changed the step`);
        if (stepShots) await shot(`${tag}_search_no_results`);
        await tapClear();
        await typeText(search.q);
        st = await A('searchState()');
        check(st.rows.join() === search.rows.join() && st.listRing, `${at}: retyped "${search.q}": listed [${st.rows}]`);
        if (stepShots) await shot(`${tag}_search_results`);
        tapAt = await A(`point('[data-search-row="${search.open}"]')`);
        check(tapAt, `${at}: result ${search.open} not found`);
      }

      // A tap on something that is not the step: a gentle nudge, same step
      const inertTap = async (pt, name) => {
        await waitFor(async () => !(await A('nudgeShown()')), 3500);
        if (!check(pt, `${at}: ${name} not found`)) return;
        await click(pt.cx, pt.cy);
        check(await waitFor(() => A('nudgeShown()'), 1000), `${at}: tapping ${name} did not nudge`);
        check(await sameStep(), `${at}: tapping ${name} changed the step`);
      };

      // Add status sheet: Music is not the step
      if (step.highlight_element === 'status_text_option') await inertTap(await A(`clickPointForText(${JSON.stringify(r.statusMusic)})`), 'Music');

      // Pay anyone, typing step: the practice line is shown; a tap on the field focuses it (no nudge, no step);
      // the first character completes the step
      if (step.highlight_element === 'payanyone_input') {
        await waitFor(async () => !(await A('nudgeShown()')), 3500);
        check(await A(`textIncludes(${JSON.stringify(r.payAnyonePractice)})`), `${at}: the practice line is missing`);
        let st = await A('payState()');
        if (!check(st, `${at}: Pay anyone field not found`)) break;
        check(st.value === '' && st.fieldRing && !st.listRing && !st.rows.length, `${at}: before typing: "${st.value}", ${st.rows.length} row(s), ring on ${st.fieldRing ? 'field' : 'not the field'}`);
        const fp = await A(`point('[data-payanyone-input]')`);
        await click(fp.cx, fp.cy);
        await sleep(150);
        check((await sameStep()) && !(await A('nudgeShown()')), `${at}: tapping the field nudged or changed the step`);
        check((await A('payState()')).focused, `${at}: the field is not focused (the phone keyboard would not open)`);
        playMark = await cdp.eval('window.__plays.length');
        await cdp.send('Input.insertText', { text: upiRun.q[0] });
        check(await waitFor(async () => (await A('label()')) === stepText(t, i + 2, total)), `${at}: typing the first character did not complete the step`);
        st = await A('payState()');
        check(st && st.value === upiRun.q[0], `${at}: first character not typed ("${st && st.value}")`);
        check(!(await A('nudgeShown()')), `${at}: typing nudged`);
        continue;
      }

      // Pay anyone, list step: more typing filters by name, UPI ID or digits; clearing gives the ring back to the
      // field; a no-match lists every practice payee (any name will do); with the keyboard open the instruction,
      // the field and a payee stay in view; the typed text is never saved; the run's payee is picked
      if (step.highlight_element === 'payanyone_results') {
        await typeText(upiRun.q.slice(1));
        let st = await A('payState()');
        check(st.value === upiRun.q && st.rows.join() === upiRun.rows.join() && !st.noMatch, `${at}: typed "${st.value}", listed [${st.rows}] (expected [${upiRun.rows}])`);
        check(st.listRing && !st.fieldRing, `${at}: with payees listed the ring is not on the list`);
        check((await sameStep()) && !(await A('nudgeShown()')), `${at}: typing more nudged or changed the step`);
        for (const hgt of await A(`heights('[data-payanyone-row]')`)) check(hgt >= 64, `${at}: a payee row is ${Math.round(hgt)}px (needs 64px)`);
        if (w === 360 && h === 690 && scale === 1) {
          await cdp.send('Emulation.setDeviceMetricsOverride', { width: 360, height: 400, deviceScaleFactor: 1, mobile: true });
          await sleep(400);
          for (const s of await A(`keyboardFit('[data-payanyone-input]', '[data-payanyone-row]')`)) check(false, `${at}: keyboard open (360x400): ${s}`);
          if (!reduce) await shot(`${tag}_payanyone_keyboard_360x400`);
          await setScreen(w, h, reduce);
          await sleep(400);
        }
        await A(`clearInput('[data-payanyone-input]')`);
        await sleep(150);
        st = await A('payState()');
        check(st.value === '' && !st.rows.length && st.fieldRing && !st.listRing, `${at}: after clearing: "${st.value}", ${st.rows.length} row(s), ring on ${st.fieldRing ? 'field' : 'not the field'}`);
        check((await sameStep()) && !(await A('nudgeShown()')), `${at}: clearing nudged or changed the step`);
        await typeText('zzq');
        st = await A('payState()');
        check(st.noMatch && st.rows.join() === 'shop,ramesh,priya' && st.listRing, `${at}: no match: line ${st.noMatch ? 'shown' : 'missing'}, listed [${st.rows}], ring ${st.listRing ? 'on' : 'not on'} the list`);
        check((await sameStep()) && !(await A('nudgeShown()')), `${at}: a no-match nudged or changed the step`);
        if (stepShots) await shot(`${tag}_payanyone_no_match`);
        await A(`clearInput('[data-payanyone-input]')`);
        await typeText(upiRun.q);
        st = await A('payState()');
        check(st.rows.join() === upiRun.rows.join() && st.listRing, `${at}: retyped "${upiRun.q}": listed [${st.rows}]`);
        check(!(await A(`storedAnywhere(${JSON.stringify(upiRun.q)})`)), `${at}: the typed text was saved in browser storage`);
        if (stepShots) await shot(`${tag}_payanyone_results`);
        tapAt = await A(`point('[data-payanyone-row="${upiRun.pick}"]')`);
        check(tapAt, `${at}: payee ${upiRun.pick} not found`);
      }

      // Mobile recharge: three numbers of at least 64px, the operators inert; the run's number is picked
      if (step.highlight_element === 'recharge_numbers') {
        await has([r.mobileRecharge, r.enterMobileNumber, r.myRecharges, r.myNumber, MY_NUMBER], 'the recharge screen');
        const hs = await A(`heights('[data-recharge-row]')`);
        check(hs.length === 3 && Math.min(...hs) >= 64, `${at}: My recharges shows ${hs.length} row(s), smallest ${Math.round(Math.min(...hs))}px`);
        await inertTap(await A(`clickPointForText(${JSON.stringify(r.prepaid(RECHARGE_OPERATORS[1]))})`), 'an operator');
        tapAt = await A(`point('[data-recharge-row="${rechargeRun.num}"]')`);
        check(tapAt, `${at}: number ${rechargeRun.num} not found`);
      }
      // Plans: for the number picked; three plans of at least 64px; the run's plan is picked
      if (step.highlight_element === 'recharge_plans') {
        check((await A(`textOf('[data-recharge-for]')`)) === personName(r, rechargeRun.num), `${at}: plans are for "${await A(`textOf('[data-recharge-for]')`)}", expected ${personName(r, rechargeRun.num)}`);
        const hs = await A(`heights('[data-recharge-plan]')`);
        check(hs.length === 3 && Math.min(...hs) >= 64, `${at}: ${hs.length} plan(s), smallest ${Math.round(Math.min(...hs))}px`);
        tapAt = await A(`point('[data-recharge-plan="${rechargeRun.plan}"]')`);
        check(tapAt, `${at}: plan ${rechargeRun.plan} not found`);
      }

      // Bank transfer: "To self" is not the step; the account fills in only on its tap, the IFSC code only after the
      // bank is chosen, and Continue stays grey (a nudge) until both are filled
      if (step.highlight_element === 'bank_account_field') {
        check((await A(`textOf('[data-bank-account]')`)) === r.accountNumberField, `${at}: account field shows "${await A(`textOf('[data-bank-account]')`)}" before its tap`);
        check(!(await A(`textIncludes(${JSON.stringify(PRACTICE_BANK.ifsc)})`)), `${at}: IFSC code shown before the bank is chosen`);
        check((await A(`attr('[data-element-id="bank_continue_button"] > div', 'aria-disabled')`)) === 'true', `${at}: Continue is active before the form is filled`);
        await inertTap(await A(`point('[data-bank-to-self]')`), 'To self');
      }
      if (step.highlight_element === 'ifsc_search_link') {
        check((await A(`textIncludes(${JSON.stringify(PRACTICE_BANK.accountMasked)})`)), `${at}: the account ${PRACTICE_BANK.accountMasked} was not filled in`);
        check(!(await A(`textIncludes(${JSON.stringify(PRACTICE_BANK.ifsc)})`)), `${at}: IFSC code shown before the bank is chosen`);
        await inertTap(await A(`targetPoint('bank_continue_button')`), 'the grey Continue');
        tapAt = await A(`targetPoint('ifsc_search_link')`);
      }
      if (step.highlight_element === 'practice_bank_row') {
        await inertTap(await A(`clickPointForText(${JSON.stringify(r.searchBank)})`), 'the bank search box');
        tapAt = await A(`targetPoint('practice_bank_row')`);
      }
      if (step.highlight_element === 'bank_continue_button') {
        await has([PRACTICE_BANK.accountMasked, PRACTICE_BANK.ifsc, PRACTICE_BANK.name, r.bankingName(r.ramesh)], 'the filled bank form');
        check((await A(`attr('[data-element-id="bank_continue_button"] > div', 'aria-disabled')`)) === 'false', `${at}: Continue is not active once the form is filled`);
        tapAt = await A(`targetPoint('bank_continue_button')`);
      }

      // History: the note says what "Received from" means and that receiving needs no PIN; every row says in words
      // which way the money went, received amounts carry + and green (4.5:1 on white), paid ones neither; a
      // payment is not the reading step; on the list step any payment opens (the run's pick)
      if (step.highlight_element === 'history_note_ok' || step.highlight_element === 'history_list') {
        const rows = await A('historyRows()');
        check(rows.length === MOCK_TRANSACTIONS.length, `${at}: ${rows.length} history row(s)`);
        for (const row of rows) {
          const txn = MOCK_TRANSACTIONS.find((x) => x.id === row.id);
          const name = txn.merchant[lang] || txn.merchant.en;
          check(row.words === (txn.isCredit ? r.receivedFrom(name) : r.paidTo(name)), `${at}: row ${row.id} reads "${row.words}"`);
          check(row.h >= 64, `${at}: row ${row.id} is ${Math.round(row.h)}px (needs 64px)`);
          if (txn.isCredit) check(row.amount === '+ ' + txn.amount && row.color === 'rgb(20, 108, 46)', `${at}: received row ${row.id}: "${row.amount}" in ${row.color}`);
          else check(row.amount === txn.amount && row.color === 'rgb(31, 31, 31)', `${at}: paid row ${row.id}: "${row.amount}" in ${row.color}`);
        }
        check(rows.some((x) => x.credit) && rows.some((x) => !x.credit), `${at}: history needs a received and a paid row`);
        check((await A(`contrastOnWhite('[data-credit="true"] [data-history-amount]')`)) >= 4.5, `${at}: the received amount's green is under 4.5:1 on white`);
        await has([r.historyNote], 'the history note');
        if (step.highlight_element === 'history_note_ok') {
          await inertTap(await A(`point('[data-history-row="history_item_1"]')`), 'a payment on the reading step');
          tapAt = await A(`targetPoint('history_note_ok')`);
        } else {
          check(!(await A(`target('history_note_ok')`)), `${at}: Got it is still shown after it was tapped`);
          tapAt = await A(`point('[data-history-row="${histPick}"]')`);
          check(tapAt, `${at}: payment ${histPick} not found`);
        }
      }

      // Text status, typing step: a tap on the field focuses it (no nudge, no step), no Send yet; the first
      // character completes the step
      if (step.highlight_element === 'status_text_input') {
        await waitFor(async () => !(await A('nudgeShown()')), 3500);
        let st = await A('statusState()');
        if (!check(st, `${at}: status field not found`)) break;
        check(st.value === '' && st.fieldRing && !st.send, `${at}: before typing: "${st.value}", ring ${st.fieldRing ? 'on' : 'not on'} the field, Send ${st.send ? 'shown' : 'hidden'}`);
        const fp = await A(`point('[data-status-input]')`);
        await click(fp.cx, fp.cy);
        await sleep(150);
        check((await sameStep()) && !(await A('nudgeShown()')), `${at}: tapping the status field nudged or changed the step`);
        check((await A('statusState()')).focused, `${at}: the status field is not focused (the phone keyboard would not open)`);
        playMark = await cdp.eval('window.__plays.length');
        await cdp.send('Input.insertText', { text: statusText[0] });
        check(await waitFor(async () => (await A('label()')) === stepText(t, i + 2, total)), `${at}: typing the first character did not complete the step`);
        st = await A('statusState()');
        check(st && st.value === statusText[0] && st.send, `${at}: first character not typed or Send not shown ("${st && st.value}")`);
        check(!(await A('nudgeShown()')), `${at}: typing nudged`);
        continue;
      }

      // Text status, Send step: more typing never nudges; with the keyboard open the instruction, the field and
      // Send stay in view; an emptied field takes the ring back (no Send); the text is never saved
      if (step.highlight_element === 'status_send_button') {
        await typeText(statusText.slice(1));
        let st = await A('statusState()');
        check(st.value === statusText && st.sendRing && !st.fieldRing, `${at}: typed "${st.value}", ring on ${st.sendRing ? 'Send' : st.fieldRing ? 'the field' : 'nothing'}`);
        check((await sameStep()) && !(await A('nudgeShown()')), `${at}: typing more nudged or changed the step`);
        if (w === 360 && h === 690 && scale === 1) {
          await cdp.send('Emulation.setDeviceMetricsOverride', { width: 360, height: 400, deviceScaleFactor: 1, mobile: true });
          await sleep(400);
          for (const s of await A('statusKeyboardFit()')) check(false, `${at}: keyboard open (360x400): ${s}`);
          if (!reduce) await shot(`${tag}_status_keyboard_360x400`);
          await setScreen(w, h, reduce);
          await sleep(400);
        }
        await A('clearStatus()');
        await sleep(150);
        st = await A('statusState()');
        check(st.value === '' && !st.send && st.fieldRing, `${at}: emptied: Send ${st.send ? 'still shown' : 'hidden'}, ring ${st.fieldRing ? 'on' : 'not on'} the field`);
        check((await sameStep()) && !(await A('nudgeShown()')), `${at}: emptying the field nudged or changed the step`);
        await typeText(statusText);
        st = await A('statusState()');
        check(st.value === statusText && st.sendRing, `${at}: retyped "${st.value}"`);
        check(!(await A(`storedAnywhere(${JSON.stringify(statusText)})`)), `${at}: the typed status was saved in browser storage`);
        tapAt = await A(`targetPoint('status_send_button')`);
      }

      // Unknown chat: the scam link is not the step (a gentle nudge, nothing opens)
      // (bringing the link into view scrolls the chat, so Block is measured again)
      if (step.highlight_element === 'unknown_block_button') {
        await inertTap(await A(`point('[data-scam-link]')`), 'the scam link');
        tapAt = await A(`targetPoint('unknown_block_button')`);
      }
      // Block confirmation: Cancel is not the step; the box stays
      if (step.highlight_element === 'dialog_block_button') {
        await inertTap(await A(`clickPointForText(${JSON.stringify(r.cancel)})`), 'Cancel');
        check(await A(`point('[data-block-dialog]')`), `${at}: the Block confirmation closed after Cancel`);
        tapAt = await A(`targetPoint('dialog_block_button')`);
      }

      // Forward, press and hold: a short tap nudges (and says to press and hold), a hold that drifts does
      // nothing, the photo cannot be dragged; a hold past 400ms by mouse or finger selects that message
      if (step.action === 'hold') {
        await waitFor(async () => !(await A('nudgeShown()')), 3500);
        check(await A('photoInert()'), `${at}: the photo in the chat is draggable or takes the pointer`);
        let p = await A(`point('[data-fwd-msg="${fwd.msg}"]')`);
        if (!check(p, `${at}: message ${fwd.msg} not found`)) break;
        await pressFor(p.cx, p.cy, SHORT_TAP_MS, fwd.method);
        check(await waitFor(() => A('nudgeShown()'), 1000), `${at}: a short ${fwd.method} tap did not nudge`);
        check(await A(`textIncludes(${JSON.stringify(t.holdNudge)})`), `${at}: the nudge after a short tap does not say to press and hold`);
        check((await sameStep()) && !(await A('selectedMsg()')), `${at}: a short ${fwd.method} tap changed the step or selected a message`);
        if (stepShots) await shot(`${tag}_hold_nudge`);
        await waitFor(async () => !(await A('nudgeShown()')), 3500);
        await pressFor(p.cx, p.cy, HOLD_WAIT_MS, fwd.method, HOLD_DRIFT_PX);
        await sleep(150);
        check((await sameStep()) && !(await A('selectedMsg()')), `${at}: a ${fwd.method} hold that drifted ${HOLD_DRIFT_PX}px changed the step`);
        check(!(await A('nudgeShown()')), `${at}: a ${fwd.method} hold that drifted ${HOLD_DRIFT_PX}px nudged`);
        p = await A(`point('[data-fwd-msg="${fwd.msg}"]')`);
        playMark = await cdp.eval('window.__plays.length');
        await pressFor(p.cx, p.cy, HOLD_WAIT_MS, fwd.method);
        check(await waitFor(async () => (await A('label()')) === stepText(t, i + 2, total)), `${at}: a ${HOLD_WAIT_MS}ms ${fwd.method} hold did not complete the step`);
        check((await A('selectedMsg()')) === fwd.msg, `${at}: held ${fwd.msg}, selected ${await A('selectedMsg()')}`);
        await sleep(200);
        check(!(await A('nudgeShown()')), `${at}: the hold nudged`);
        notes.push(`${at}: held ${fwd.msg} by ${fwd.method}`);
        continue;
      }
      // Selected message: the other actions are not the step
      if (step.highlight_element === 'forward_arrow') {
        check((await A(`textOf('[data-selected-count]')`)) === '1', `${at}: selection count is not 1`);
        check((await A('selectedMsg()')) === fwd.msg, `${at}: the held message is not shown selected`);
        await inertTap(await A(`point('[data-select-action]')`), 'Reply');
      }
      // Forward to: contact rows at least 64px, "My status" is not a contact; the run's contact is chosen
      if (step.highlight_element === 'forward_contacts') {
        for (const hgt of await A(`heights('[data-forward-row]')`)) check(hgt >= 64, `${at}: a contact row is ${Math.round(hgt)}px (needs 64px)`);
        await inertTap(await A(`point('[data-forward-status]')`), 'My status');
        tapAt = await A(`point('[data-forward-row="${fwd.to}"]')`);
        check(tapAt, `${at}: contact ${fwd.to} not found`);
      }
      // Send: the chosen contact is named; tapping another contact moves the tick quietly, then back
      if (step.highlight_element === 'forward_send_button') {
        check((await A(`textOf('[data-forward-chosen]')`)) === chatName(r, fwd.to), `${at}: chosen contact shown as "${await A(`textOf('[data-forward-chosen]')`)}"`);
        const other = fwd.to === 'priya' ? 'shop' : 'priya';
        for (const key of [other, fwd.to]) {
          const op = await A(`point('[data-forward-row="${key}"]')`);
          if (op) await click(op.cx, op.cy);
          await sleep(150);
          check((await A(`textOf('[data-forward-chosen]')`)) === chatName(r, key), `${at}: tapping ${key} did not move the tick`);
        }
        check((await sameStep()) && !(await A('nudgeShown()')), `${at}: changing the contact nudged or changed the step`);
        tapAt = await A(`targetPoint('forward_send_button')`);
      }

      // Document picker: three photo rows, the rest of the screen inert (a gentle nudge); the run's file is chosen
      if (step.highlight_element === 'doc_recent_files') {
        const hs = await A(`heights('[data-doc-file]')`);
        check(hs.length === 3 && Math.min(...hs) >= 64, `${at}: Recent files shows ${hs.length} row(s), smallest ${Math.round(Math.min(...hs))}px`);
        await waitFor(async () => !(await A('nudgeShown()')), 3500);
        const bp = await A(`clickPointForText(${JSON.stringify(r.browseOtherApps)})`);
        if (check(bp, `${at}: "${r.browseOtherApps}" not found`)) {
          await click(bp.cx, bp.cy);
          check(await waitFor(() => A('nudgeShown()'), 1000), `${at}: tapping "${r.browseOtherApps}" did not nudge`);
          check(await sameStep(), `${at}: tapping "${r.browseOtherApps}" changed the step`);
        }
        tapAt = await A(`point('[data-doc-file="${docPick}"]')`);
        check(tapAt, `${at}: file ${docPick} not found`);
      }

      // Send location: "Share live location" is not the step: a gentle nudge, nothing sent, same step
      if (step.highlight_element === 'send_current_location') {
        await waitFor(async () => !(await A('nudgeShown()')), 3500);
        const lp = await A(`point('[data-live-location]')`);
        await click(lp.cx, lp.cy);
        check(await waitFor(() => A('nudgeShown()'), 1000), `${at}: tapping Share live location did not nudge`);
        check((await sameStep()) && !(await A('sentBubble()')), `${at}: tapping Share live location changed the step or sent something`);
        if (stepShots) await shot(`${tag}_live_location_nudge`);
      }

      // Send money: the learner types on the number pad. Keys never nudge; only the first real digit
      // completes the "type" step, and only the blue arrow (once an amount is typed) completes the next.
      if (step.highlight_element === 'amount_keypad' || step.highlight_element === 'amount_next_button') {
        const press = async (k) => {
          const kp = await A(`keyPoint(${JSON.stringify(k)})`);
          await click(kp.cx, kp.cy);
          await sleep(80);
        };
        const pad = () => A('amountPad()');
        const sameStep = async () => (await A('label()')) === stepText(t, i + 1, total);
        const ringOn = (p) => (p.arrowRing ? 'arrow' : p.padRing ? 'keypad' : 'nothing');
        // Wait out an earlier nudge so a new one can be seen
        await waitFor(async () => !(await A('nudgeShown()')), 3500);
        let p = await pad();
        if (!check(p, `${at}: number pad not found`)) break;
        check(p.keyMin >= 52 - 0.5 && p.keyMax <= 64 + 0.5, `${at}: number pad keys are ${Math.round(p.keyMin)}-${Math.round(p.keyMax)}px tall (need 52-64px)`);
        if (step.highlight_element === 'amount_keypad') {
          if (p.scrolls > 1) {
            // Fits with no scrolling in English and Hindi at 100%; Malayalam and larger text may scroll
            if (scale === 1 && lang !== 'ml') check(false, `${at}: amount screen scrolls by ${p.scrolls}px at 100%`);
            else notes.push(`${at}: amount screen scrolls by ${p.scrolls}px (keys ${Math.round(p.keyMin)}px)`);
          }
          check(p.typed === '' && !p.arrowActive && !p.arrowRing && p.padRing, `${at}: before typing: amount "${p.typed}", arrow ${p.arrowActive ? 'active' : 'inactive'}, ring on ${ringOn(p)}`);
          await press('0');
          await press('back');
          p = await pad();
          check(p.typed === '' && (await sameStep()), `${at}: 0 or backspace on an empty amount changed something (amount "${p.typed}")`);
          check(!(await A('nudgeShown()')), `${at}: 0 or backspace on an empty amount nudged`);
          playMark = await cdp.eval('window.__plays.length');
          await press(sendAmount[0]);
          check(await waitFor(async () => (await A('label()')) === stepText(t, i + 2, total)), `${at}: typing the first digit did not complete the step`);
          check((await pad()).typed === sendAmount[0], `${at}: first digit not typed`);
          check(!(await A('nudgeShown()')), `${at}: typing a digit nudged`);
          continue;
        }
        // Arrow step: keep typing (no nudge, no new step), then the edge cases
        check(p.typed === sendAmount[0] && p.arrowActive && p.arrowRing && !p.padRing, `${at}: after the first digit: amount "${p.typed}", arrow ${p.arrowActive ? 'active' : 'inactive'}, ring on ${ringOn(p)}`);
        for (const d of sendAmount.slice(1)) await press(d);
        p = await pad();
        check(p.typed === sendAmount && p.shown === sendShown, `${at}: typed ${sendAmount}, screen shows "${p.shown}" (expected ${sendShown})`);
        if (sendAmount === '999999') check(p.shown === '₹9,99,999', `${at}: 999999 shown as "${p.shown}", expected ₹9,99,999`);
        check((await sameStep()) && !(await A('nudgeShown()')), `${at}: typing more digits nudged or changed the step`);
        if (sendAmount.length === 6) {
          await press('1');
          check((await pad()).typed === sendAmount, `${at}: a 7th digit was accepted`);
        }
        await press('back');
        check((await pad()).typed === sendAmount.slice(0, -1), `${at}: backspace did not remove the last digit`);
        for (let k = 1; k < sendAmount.length; k++) await press('back');
        p = await pad();
        check(p.typed === '' && !p.arrowActive && !p.arrowRing && p.padRing, `${at}: emptied: amount "${p.typed}", arrow ${p.arrowActive ? 'active' : 'inactive'}, ring on ${ringOn(p)}`);
        let ap = await A(`targetPoint('amount_next_button')`);
        await click(ap.cx, ap.cy);
        check(await waitFor(() => A('nudgeShown()'), 1000), `${at}: tapping the grey arrow did not nudge`);
        check(await sameStep(), `${at}: tapping the grey arrow changed the step`);
        await waitFor(async () => !(await A('nudgeShown()')), 3500);
        for (const d of sendAmount) await press(d);
        p = await pad();
        check(p.typed === sendAmount && p.arrowActive && p.arrowRing, `${at}: retyped: amount "${p.typed}", arrow ${p.arrowActive ? 'active' : 'inactive'}`);
        // The arrow is the target again: let its scroll-into-view (300ms after it is ringed) settle before a key is
        // measured, or a screen that scrolls (larger text) moves under the tap
        await sleep(reduce ? 450 : 900);
        await press('next');
        check(await waitFor(() => A('nudgeShown()'), 1000), `${at}: the keyboard's Next key did not nudge`);
        check(await sameStep(), `${at}: the keyboard's Next key changed the step`);
        playMark = await cdp.eval('window.__plays.length');
        ap = await A(`targetPoint('amount_next_button')`);
        await click(ap.cx, ap.cy);
        check(await waitFor(async () => (await A('label()')) === stepText(t, i + 2, total)), `${at}: tapping the blue arrow did not advance`);
        continue;
      }

      playMark = await cdp.eval('window.__plays.length');
      const at2 = tapAt || info;
      await click(at2.cx, at2.cy);
      if (i + 1 < total) {
        check(await waitFor(async () => (await A('label()')) === stepText(t, i + 2, total)), `${at}: tapping the target did not advance`);
      } else {
        // Result screen (sent message, photo, voice note, document or location; the opened chat after a search):
        // shown after the tap, for about 2s, before "Well done"
        if (step.result_screen) {
          if (search) {
            const want = chatName(r, search.open);
            check(
              await waitFor(async () => (await cdp.eval(`document.querySelector('[data-chat-name]')?.textContent || ''`)) === want, 1000),
              `${at}: tapping a result did not open the chat with ${want}`
            );
            await sleep(reduce ? 100 : 350);
          } else if (statusText) {
            check(await waitFor(() => A(`point('[data-status-posted]')`), 1000), `${at}: "My status" not shown after the Send tap`);
            await sleep(reduce ? 100 : 350);
            check((await A(`textOf('[data-status-posted]')`))?.includes(statusText), `${at}: "My status" does not show the typed text`);
            await has([r.myStatus, r.justNow], 'the posted status');
          } else if (payeeShown) {
            // Pay anyone, recharge, bank transfer: the success screen after the PIN tap, with who was paid and how much
            check(await waitFor(() => A(`textIncludes(${JSON.stringify(r.paidSuccessfully)})`), 1000), `${at}: the success screen is not shown after the PIN tap`);
            await sleep(reduce ? 100 : 350);
            await has([sendShown + '.00', payeeShown], 'the success screen');
          } else if (histPick) {
            // History: the details of the payment tapped, in words and with its sample reference and bank
            check(await waitFor(() => A(`point('[data-history-detail]')`), 1000), `${at}: the payment details are not shown after the tap`);
            await sleep(reduce ? 100 : 350);
            const txn = MOCK_TRANSACTIONS.find((x) => x.id === histPick);
            const name = txn.merchant[lang] || txn.merchant.en;
            check((await A(`attr('[data-history-detail]', 'data-history-detail')`)) === histPick, `${at}: details shown for ${await A(`attr('[data-history-detail]', 'data-history-detail')`)}, tapped ${histPick}`);
            check((await A(`textOf('[data-detail-words]')`)) === (txn.isCredit ? r.receivedFrom(name) : r.paidTo(name)), `${at}: details read "${await A(`textOf('[data-detail-words]')`)}"`);
            check((await A(`textOf('[data-detail-amount]')`)) === (txn.isCredit ? '+ ' : '') + txn.amount, `${at}: details amount "${await A(`textOf('[data-detail-amount]')`)}"`);
            await has([txn.upiRef, r.completed, txn.date[lang]], 'the payment details');
          } else if (task.task_id === 'whatsapp_block_number') {
            check(await waitFor(() => A(`point('[data-blocked]')`), 1000), `${at}: the blocked notice is not shown after the Block tap`);
            await sleep(reduce ? 100 : 350);
            check((await A(`textOf('[data-blocked]')`)) === r.youBlocked, `${at}: blocked notice reads "${await A(`textOf('[data-blocked]')`)}"`);
            check(!(await A(`target('unknown_block_button')`)), `${at}: the Block button is still shown after blocking`);
          } else {
            check(await waitFor(() => A('sentBubble()'), 1000), `${at}: no sent bubble after the Send tap`);
            await sleep(reduce ? 100 : 350); // its 250ms fade-in
            const sb = await A('sentBubble()');
            if (sb) {
              check(sb.inside || sb.tallEndShown, `${at}: sent bubble not fully visible`);
              if (!sb.inside && sb.tallEndShown) notes.push(`${at}: sent bubble taller than the chat area, its end (time and ticks) shown`);
            }
          }
          check(!(await A(`buttonWithText(${JSON.stringify(t.practiceAgain)})`)), `${at}: "Well done" shown before the result screen`);
          if (task.task_id === 'whatsapp_send_text') check(await A(`textIncludes(${JSON.stringify(r.chatSent)})`), `${at}: sent message text missing`);
          if (docPick) check((await A(`textIncludes(${JSON.stringify(docPick)})`)) && (await A(`textIncludes('JPG • ')`)), `${at}: document bubble does not show ${docPick} with "JPG •"`);
          if (fwd) {
            check((await A(`textOf('[data-chat-name]')`)) === chatName(r, fwd.to), `${at}: forwarded to "${await A(`textOf('[data-chat-name]')`)}", expected ${chatName(r, fwd.to)}`);
            check((await A(`textOf('[data-forwarded]')`)) === r.forwarded, `${at}: the forwarded bubble is not marked "${r.forwarded}"`);
            check((await cdp.eval(`document.querySelector('[data-forwarded-msg]')?.getAttribute('data-forwarded-msg')`)) === fwd.msg, `${at}: the forwarded bubble does not show the held message ${fwd.msg}`);
          }
          // Taps on the result screen are ignored (no nudge)
          if (statusText || fwd || task.task_id === 'whatsapp_block_number' || payeeShown || histPick) {
            const pp = await A('progressPoint()');
            await click(pp.cx, pp.cy);
            await sleep(200);
            check(!(await A('nudgeShown()')), `${at} result: a tap on the result screen nudged`);
          }
          if (task.task_id === 'whatsapp_share_location')
            check((await A(`point('[data-location-bubble]')`)) && (await A(`textIncludes(${JSON.stringify(r.addrMainRoad)})`)), `${at}: location bubble with map and place missing`);
          for (const s of await A('smallText()')) check(false, `${at} result: text under 18px: ${s}`);
          for (const s of await A('sideways()')) check(false, `${at} result: ${s}`);
          check(!(await A('loops()')).length, `${at} result: looping animation on the result screen`);
          check(!(await cdp.eval(`!!document.querySelector('.highlight-active')`)), `${at} result: something is highlighted on the result screen`);
          if (stepShots) await shot(`${tag}_${task.task_id}_result`);
        }
        check(await waitFor(() => A(`buttonWithText(${JSON.stringify(t.practiceAgain)})`), 4000), `${at}: completion screen not shown`);
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

if (!args['scales-only'] && !args['reset-only']) await timed('Tutorials at 100% (full matrix)', async () => {
  for (const [w, h] of SIZES) for (const lang of LANGS) for (const reduce of MOTIONS) await runTutorials(w, h, lang, reduce, 1);
});

// ---------- Hint fit sweep: every step's instruction at every Text size ----------
if (!args['reset-only']) await timed('Hint fit sweep', async () => {
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
if (!args['reset-only']) await timed('Text size pass (130% and 150%)', async () => {
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

        // --task: only the tutorial runs below
        if (!TASK_ONLY) {
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

        }

        await runTutorials(w, h, lang, true, scale);
      }
    }
  }
});

// ---------- Reset progress: the app's own confirmation, and what a reset clears ----------
if (!TASK_ONLY) await timed('Reset progress dialog', async () => {
  for (const [w, h] of [[360, 690], [412, 915]]) {
    for (const lang of LANGS) {
      for (const scale of [1, 1.5]) {
        const t = I18N[lang];
        const tag = `${lang}_${w}x${h}_ts${Math.round(scale * 100)}`;
        const start = { ...profileFor(lang, true, scale), completedTasks: ['whatsapp_send_text'] };
        const full = w === 360 && scale === 1; // also follows the ticks on the task list
        await setScreen(w, h, true);
        await openApp(start);
        const tapText = async (text, waitText, what) => {
          const p = await A(`clickPointForText(${JSON.stringify(text)})`);
          if (!check(p, `${tag} reset: "${text}" not found (${what})`)) return false;
          await click(p.cx, p.cy);
          const ok = await waitFor(() => A(`textIncludes(${JSON.stringify(waitText)})`), 3000);
          await sleep(300);
          return check(ok, `${tag} reset: "${waitText}" not shown after tapping "${text}" (${what})`);
        };
        const waTitles = TASKS.filter((k) => k.app === 'whatsapp').map((k) => k.title[lang] || k.title.en);

        if (full && (await tapText(t.whatsAppTitle, waTitles[0], 'task list before'))) {
          check((await A('doneCards()')) === 1, `${tag} reset: the finished task is not ticked before the reset`);
          await tapText(t.home, t.gpayTitle, 'back to Home');
        }
        if (!(await tapText(t.settings, t.textSizePreview, 'open Settings'))) continue;
        if (!(await tapText(t.resetProgress, t.resetConfirmTitle, 'open the confirmation'))) continue;

        await shot(`${tag}_reset_dialog`);
        if (await cdp.eval(`(() => { const o = document.querySelector('[role="alertdialog"]').parentElement; return o.scrollHeight > o.clientHeight + 1; })()`))
          notes.push(`${tag} reset dialog: taller than the screen, scrolls to reach "${t.resetConfirmYes}"`);
        for (const s of (await A('resetDialog()')) || ['confirmation not found']) check(false, `${tag} reset dialog: ${s}`);
        for (const s of await A('smallText()')) check(false, `${tag} reset dialog: text under 18px: ${s}`);
        for (const s of await A('sideways()')) check(false, `${tag} reset dialog: ${s}`);
        for (const s of [...new Set(await A(`midWordBreaks(document.querySelector('[role="alertdialog"]'))`))]) {
          if (scale >= 1.5) wordBreaksAt150.add(`${tag} reset dialog: ${s}`);
          else check(false, `${tag} reset dialog: ${s}`);
        }
        check((await cdp.eval('document.activeElement && document.activeElement.textContent.trim()')) === t.resetConfirmNo, `${tag} reset dialog: "No" is not focused`);
        for (const l of [t.resetConfirmNo, t.resetConfirmYes]) for (const s of await A(`reach(${JSON.stringify(l)})`)) check(false, `${tag} reset dialog: ${s}`);

        // No: closes and changes nothing
        const no = await A(`buttonWithText(${JSON.stringify(t.resetConfirmNo)})`);
        if (check(no, `${tag} reset dialog: "No" not found`)) {
          await click(no.cx, no.cy);
          check(await waitFor(async () => !(await A('resetDialog()')), 1000), `${tag} reset dialog: "No" did not close it`);
          check(JSON.stringify(await A('savedProfile()')) === JSON.stringify(start), `${tag} reset dialog: "No" changed the saved profile`);
        }

        // Yes: progress cleared, every setting kept, confirmation line shown
        if (!(await tapText(t.resetProgress, t.resetConfirmTitle, 'reopen the confirmation'))) continue;
        await A(`reach(${JSON.stringify(t.resetConfirmYes)})`); // scrolls it into view, as the learner would
        const yes = await A(`buttonWithText(${JSON.stringify(t.resetConfirmYes)})`);
        if (!check(yes, `${tag} reset dialog: "Yes" not found`)) continue;
        await click(yes.cx, yes.cy);
        check(await waitFor(async () => !(await A('resetDialog()')), 1000), `${tag} reset dialog: "Yes" did not close it`);
        check(JSON.stringify(await A('savedProfile()')) === JSON.stringify({ ...start, completedTasks: [] }), `${tag} reset: saved profile after Yes is ${JSON.stringify(await A('savedProfile()'))}`);
        check(await A(`textIncludes(${JSON.stringify(t.resetDone)})`), `${tag} reset: "${t.resetDone}" not shown`);
        check((await A('appTs()')) === String(scale), `${tag} reset: Text size changed to ${await A('appTs()')}`);

        if (full && (await tapText(t.home, t.gpayTitle, 'back to Home after the reset')) && (await tapText(t.whatsAppTitle, waTitles[0], 'task list after'))) {
          check((await A('doneCards()')) === 0, `${tag} reset: task list still shows a tick after the reset (no reload)`);
        }
      }
    }
  }
});

if (!args['reset-only']) for (const id of replicaIds) check(seenIds.has(id), `highlight id ${id} never found on screen`);

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
