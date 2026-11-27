// HEADROOM · GitHub Goldmine reel · CRT ASCII Terminal (amber P3), 1080×1920.
// t = time on the reel's cut (edl.json). Kalyan's face sections (0–7.94, 60.42–70.12, 79.36–end) are covered in Remotion; here they draw black.
import { initTerm, glyph, text, inverse, cursor, ATLAS } from './term.js';
import { makeCRT } from './crt.js';

const W = 1080, H = 1920;
const out = document.getElementById('c'); out.width = W; out.height = H;
const crt = makeCRT(out);
const scene = document.createElement('canvas'); scene.width = W; scene.height = H;
const g = scene.getContext('2d');
await initTerm();
const WC = await (await fetch('words_cut.json')).json();
const Q = new URLSearchParams(location.search);

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const eio = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const eo = t => 1 - Math.pow(1 - clamp(t), 3);
const lerp = (a, b, t) => a + (b - a) * t;
const lerpLog = (a, b, t) => Math.exp(lerp(Math.log(a), Math.log(b), t));
const hsh = (a, b = 0) => { let h = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return h - Math.floor(h); };
const TAU = .12;
const decay = (t, tOff) => t < tOff ? 1 : Math.exp(-(t - tOff) / TAU);
const blink = (t, t0, period = .6) => t < t0 ? 0 : (((t - t0) % period) < period / 2 ? 1 : decay((t - t0) % period, period / 2));
function begin() { g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.fillStyle = '#000'; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'lighter'; }
function blackRect(x, y, w, h) { g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.fillStyle = '#000'; g.fillRect(x, y, w, h); g.globalCompositeOperation = 'lighter'; }
const view = (cols, oy = 250) => { const cw = 960 / cols; return { ox: (W - cols * cw) / 2, oy, cw, cols }; };

const EV = [];
const ev = (t, type, o = {}) => EV.push({ t: +t.toFixed(4), type, ...o });

// ---------------- sections on the cut ----------------
const S = {
  on: 7.94, ask: 10.70, flood: 12.60, wide0: 13.6, wide1: 15.2, full: 20.75, clear: 21.55,
  wrapCmd: 27.55, name: 29.62, pull0: 30.70, pull1: 31.90, fold: 35.85, compact: 39.40, end1: 41.45,
  tower0: 41.45, tower1: 43.2, band: 51.55, auto: 54.70, days: 57.15, off1: 60.42,
  tease: 70.12, maze: 76.95, off2: 79.36, dur: WC.duration,
};
const CRT_ON = t => (t >= S.on && t < S.off1) || (t >= S.tease && t < S.off2);

// ---------------- flood text: illustrative, generic output ----------------
const REP = [' PASS  src/auth/login.test.ts', '[vite] hmr update /src/App.tsx', 'WARN  deprecated request@2.88.2', '  at runTest (jest-circus/utils.js:298:28)'];
const POOL = ['> app@1.4.2 test', '> jest --watch --verbose', 'RUNS  src/auth/session.test.ts', ' FAIL  src/auth/login.test.ts', '  * login > rejects expired token', '    expect(received).toBe(expected)', '    Expected: 401', '    Received: 200', 'GET /api/session 200 12ms', 'POST /api/login 500 48ms', '[db] pool connected (10/10)', 'npm WARN EBADENGINE unsupported engine', '[watch] compiled with 3 warnings', 'TypeError: cannot read "exp" of undefined', '  at verify (src/auth/jwt.ts:41:17)', '  at login (src/auth/login.ts:88:9)', 'Tests: 1 failed, 41 passed, 42 total', '[eslint] 12 problems (0 errors, 12 warn)', 'retrying connection (attempt 3/5)...', 'Snapshot Summary: 3 obsolete'];
const lineAt = i => { const h = hsh(i, 7); return h < .46 ? { s: REP[Math.floor(hsh(i, 3) * REP.length)], rep: true } : { s: POOL[Math.floor(hsh(i, 5) * POOL.length)], rep: false }; };
// lines emitted since S.flood: rate rises from 5/s to 70/s
const RATE = x => 5 * x + 9 * x * x * x;          // cumulative lines after x s
const nLines = t => t < S.flood ? 0 : Math.floor(RATE(Math.min(t, S.full) - S.flood) + 3);
for (let k = 0; k < 60; k++) { const x = Math.cbrt(k / 9) ; const tt = S.flood + x; if (tt < S.full) ev(tt, 'tick', { n: 1 + Math.floor(k / 12) }); }

// ---------------- LOG strip: Kalyan's words, typed in sync ----------------
const SY = 1430, SCW = 22, SCOLS = 40;           // strip: 3 rows of 40 columns above Instagram's bottom UI
const KEY = new Set(['TOKENS.', 'HEADROOM.', 'HEADROOM', 'COMPACT', 'AUTOMATICALLY,', 'GOLD', 'COMPRESSING']);
const SENT = []; { let cur = null; for (const w of WC.words) { if (!cur || cur.beat !== w.beat) { cur = { beat: w.beat, words: [] }; SENT.push(cur); } cur.words.push(w); } }
function strip(t) {
  if (Q.has('nosub')) return;
  blackRect(0, SY - 20, W, 200);
  const v = { ox: 60, oy: SY, cw: SCW };
  text(g, '-'.repeat(43), 0, -1, { ox: 60, oy: SY - 12, cw: SCW }, .22);
  const s = SENT.filter(x => x.words[0].s - .05 <= t && t < Math.max(x.words[x.words.length - 1].e + .6, x.words[0].s + 1.8)).pop();
  inverse(g, ' KALYAN ', 0, 0, v, .75);
  if (!s) { text(g, '>', 9, 0, v, .7); cursor(g, 11, 0, v, blink(t, 0, 1) * .7); return; }
  // words typed: a word appears letter by letter across its own spoken duration
  const toks = [];
  for (const w of s.words) { if (t < w.s) break; const u = w.w.toUpperCase().replace(/[“”"]/g, ''); const k = Math.ceil(u.length * clamp((t - w.s) / Math.max(.08, w.e - w.s))); toks.push({ u, shown: u.slice(0, k), key: KEY.has(u) }); }
  // wrap into lines of SCOLS-2, keep the last 3
  const lines = [[]]; let len = 0;
  for (const tk of toks) { if (len + tk.u.length + 1 > SCOLS - 2 && len) { lines.push([]); len = 0; } lines[lines.length - 1].push(tk); len += tk.u.length + 1; }
  const shown = lines.slice(-3);
  shown.forEach((ln, r) => {
    let c = r === 0 ? 0 : 0, col = 2; const row = r + 1;
    if (r === 0) text(g, '>', 0, row, v, .8);
    for (const tk of ln) { text(g, tk.shown, col, row, v, tk.key ? 1.6 : 1); col += tk.u.length + 1; }
    if (r === shown.length - 1 && toks.length && toks[toks.length - 1].shown.length < toks[toks.length - 1].u.length) cursor(g, col - 1 - (toks[toks.length - 1].u.length - toks[toks.length - 1].shown.length), row, v, .9);
  });
}

// ---------------- typing helpers ----------------
const typed = (t, t0, times, str) => { let n = 0; for (const x of times) if (t >= t0 + x) n++; return str.slice(0, n); };
const human = (str, dur, seed) => { const raw = [...str].map((c, i) => .5 + hsh(i, seed) + (c === ' ' ? .6 : 0)); const sum = raw.reduce((a, b) => a + b, 0); let acc = 0; return raw.map(r => (acc += r) / sum * dur - r / sum * dur); };
const ASK = 'fix the login bug';
const ASK_T = human(ASK, 1.4, 11);
ASK_T.forEach((x, i) => ev(S.ask + x, ASK[i] === ' ' ? 'space' : 'key')); ev(S.ask + 1.65, 'enter');
const WRAP = '$ headroom wrap claude';
const WRAP_T = [...WRAP].map((_, i) => i * .055);
WRAP_T.forEach((x, i) => ev(S.wrapCmd + x, 'keyLight')); ev(S.wrapCmd + WRAP.length * .055 + .1, 'enter');

// ---------------- block letters for HEADROOM ----------------
const BL = { H: ['#...#', '#...#', '#####', '#...#', '#...#'], E: ['#####', '#....', '####.', '#....', '#####'], A: ['.###.', '#...#', '#####', '#...#', '#...#'], D: ['####.', '#...#', '#...#', '#...#', '####.'], R: ['####.', '#...#', '####.', '#..#.', '#...#'], O: ['.###.', '#...#', '#...#', '#...#', '.###.'], G: ['.####', '#....', '#.###', '#...#', '.###.'], L: ['#....', '#....', '#....', '#....', '#####'], I: ['#####', '..#..', '..#..', '..#..', '#####'], N: ['#...#', '##..#', '#.#.#', '#..##', '#...#'], M: ['#...#', '##.##', '#.#.#', '#...#', '#...#'] };
const NAME = 'HEADROOM';
for (let k = 0; k < NAME.length; k++) ev(S.name + k * .07, 'key');
function bigWord(word, cx, cy, cell, a, nShown = word.length, fill = '#') {
  // one letter pixel = two glyph columns x one row, so pixels are square (cells are 1:2)
  const wpx = word.length * 6 * 2 * cell - 2 * cell; const x0 = cx - wpx / 2, y0 = cy - 5 * cell;
  for (let k = 0; k < nShown; k++) { const p = BL[word[k]]; if (!p) continue; for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) if (p[r][c] === '#') { glyph(g, fill, x0 + (k * 6 + c) * 2 * cell, y0 + r * cell * 2, cell, a); glyph(g, fill, x0 + ((k * 6 + c) * 2 + 1) * cell, y0 + r * cell * 2, cell, a); } }
}

// ======================= scenes =======================
function header(t, v, label = ' CLAUDE CODE ', right = '~/app') {
  inverse(g, label, 0, 0, v, .85);
  text(g, right, label.length + 1, 0, v, .55);
}
function ctxBar(t, v, p, row = 1) {
  const n = v.cols - 12, k = Math.round(clamp(p) * n);
  text(g, 'CONTEXT [' + '#'.repeat(k) + '.'.repeat(n - k) + ']', 0, row, v, .8);
  if (p >= 1) { const f = Math.floor((t - S.full) / .25) % 2 === 0; if (f) inverse(g, ' CONTEXT FULL ', Math.floor((v.cols - 14) / 2), row + 1, v, 1); }
}

function sSession(t) {
  // grid: 40 columns, widening to 56 as the flood starts
  const z = eio(seg(t, S.wide0, S.wide1));
  const cols = Math.round(lerp(40, 56, z));
  const v = view(cols, 250);
  header(t, v);
  const n = nLines(t);
  ctxBar(t, v, clamp(n / RATE(S.full - S.flood)));
  // prompt line
  const top = 3, rows = Math.floor((1360 - v.oy) / (v.cw * 2)) - top;
  const buf = [];
  buf.push({ s: '> ' + typed(t, S.ask, ASK_T, ASK), a: 1, prompt: true });
  if (t >= S.ask + 1.7) buf.push({ s: '  * Reading 1 file... running tests', a: .7 });
  for (let i = 0; i < n; i++) { const L = lineAt(i); buf.push({ s: L.s, a: L.rep ? .5 : .9, rep: L.rep }); }
  const vis = buf.slice(-rows);
  vis.forEach((L, r) => text(g, L.s.slice(0, cols), 0, top + r, v, L.a));
  if (t < S.ask + 1.7) { const last = vis[vis.length - 1]; cursor(g, Math.min(cols - 1, last.s.length), top + vis.length - 1, v, t < S.ask + 1.4 ? 1 : blink(t, S.ask)); }
  // repeated tally
  if (n > 0) { let reps = 0; for (let i = 0; i < n; i++) if (lineAt(i).rep) reps++; const s = 'REPEATED x' + reps; text(g, s, cols - s.length, 0, v, .9); }
}
function sQuestion(t) {
  // hard clear: only the prompt and a blinking cursor; the flood's afterglow fades
  const v = view(40, 250);
  const ghost = decay(t, S.clear);
  if (ghost > .02) { g.globalAlpha = 1; const vv = view(56, 250); for (let r = 0; r < 22; r++) text(g, lineAt(900 + r).s.slice(0, 56), 0, 3 + r, vv, .6 * ghost); }
  header(t, v);
  text(g, '$', 0, 3, v, .9);
  if (t < S.wrapCmd) cursor(g, 2, 3, v, blink(t, S.clear + .2, .7));
}
function sName(t) {
  const v = view(40, 250);
  header(t, v, ' TERMINAL ', '~/app');
  const s = typed(t, S.wrapCmd, WRAP_T, WRAP);
  text(g, s, 0, 3, v, 1);
  if (s.length < WRAP.length || t < S.name) cursor(g, s.length + (s.length === WRAP.length ? 1 : 0), 3, v, s.length < WRAP.length ? 1 : blink(t, S.wrapCmd + 1.3));
  if (t >= S.name) {
    // push in: block letters grow from small to big
    const k = Math.min(NAME.length, Math.floor((t - S.name) / .07) + 1);
    const cell = lerpLog(4.5, 10, eo(seg(t, S.name, S.name + .9)));
    bigWord(NAME, W / 2, 820, cell, 1, k);
    if (t > S.name + .8) text(g, 'context compression for coding agents', 1, 26, view(40, 250), .6 * seg(t, S.name + .8, S.name + 1.2));
  }
}
// three-tier diagram: AGENT / HEADROOM / MODEL
const COMPACT = ['FAIL login.test.ts', ' rejects expired token', ' expected 401, got 200', ' at verify jwt.ts:41', '(212 passing lines folded)'];
function sDiagram(t) {
  const z = eio(seg(t, S.pull0, S.pull1));
  const v = view(44, 250);
  const a = z;
  // the title shrinks into the band
  if (z < 1) bigWord(NAME, W / 2, lerp(820, 250 + 11 * v.cw * 2 + v.cw, z), lerpLog(10, 3.2, z), 1 - .4 * z);
  if (a <= .02) return;
  const box = (r0, r1, label) => {
    text(g, '+' + '-'.repeat(42) + '+', 0, r0, v, .55 * a);
    for (let r = r0 + 1; r < r1; r++) { text(g, '|', 0, r, v, .55 * a); text(g, '|', 43, r, v, .55 * a); }
    text(g, '+' + '-'.repeat(42) + '+', 0, r1, v, .55 * a);
    inverse(g, label, 2, r0, v, .85 * a);
  };
  box(0, 8, ' AGENT: CLAUDE CODE ');
  box(16, 23, ' MODEL ');
  // HEADROOM band
  for (let r = 10; r <= 13; r++) text(g, '='.repeat(44), 0, r, v, (r === 10 || r === 13 ? .7 : .12) * a);
  if (z >= 1) inverse(g, ' HEADROOM ', 17, 11, v, 1);
  // agent output keeps scrolling in the top box
  const sp = 9, base = Math.floor((t - S.pull0) * sp);
  for (let r = 0; r < 7; r++) { const L = lineAt(400 + base + r); text(g, L.s.slice(0, 40), 2, 1 + r, v, (L.rep ? .45 : .85) * a); }
  // lines drop through the pipe cell by cell
  if (t > S.pull1) {
    for (let k = 0; k < 6; k++) {
      const ph = ((t - S.pull1) * 2.2 + k / 6) % 1; const row = 8 + Math.floor(ph * 8);
      const L = lineAt(700 + k + Math.floor((t - S.pull1) * 2.2) * 6);
      if (row >= 9 && row < 10) text(g, L.s.slice(0, 30), 7, row, v, .8 * a);
      else if (row > 13 && row < 16 && !L.rep) text(g, L.s.slice(0, 30), 7, row, v, .8 * a);
    }
  }
  // folding tally inside the band
  if (t > S.fold - .3) {
    const f = Math.floor(Math.min(212, (t - (S.fold - .3)) * 60));
    const s = `x${String(f).padStart(3, ' ')}  repeated lines folded`;
    text(g, s, Math.floor((44 - s.length) / 2), 12, v, 1.2);
  }
  // compact block lands in MODEL: the one second colour
  COMPACT.forEach((s, k) => { const t0 = S.compact + k * .12; if (t >= t0) text(g, s, 3, 18 + k, v, 1.1 * a, 1); });
  if (t < S.compact) { text(g, 'waiting for context...', 3, 18, v, .45 * a); cursor(g, 26, 18, v, blink(t, 0, .8) * .6 * a); }
}
// tower: a huge project's logs, pulled out to hundreds of columns
function sTower(t) {
  const z = eio(seg(t, S.tower0, S.tower1));
  const cols = Math.round(lerpLog(44, 150, z));
  const v = view(cols, 250);
  const rows = Math.floor((1380 - v.oy) / (v.cw * 2));
  const scroll = Math.floor((t - S.tower0) * (6 + 30 * z));
  const err = seg(t, 47.2, 47.8);
  const bandIn = seg(t, S.band, S.band + .5);
  for (let r = 0; r < rows; r++) {
    const idx = scroll + r, L = lineAt(2000 + idx);
    const isErr = L.s.includes('FAIL') || L.s.includes('Error') || L.s.includes('500');
    let s = L.s; if (cols > 60) s = (s + '   ' + lineAt(5000 + idx).s + '   ' + lineAt(9000 + idx).s + '   ' + lineAt(13000 + idx).s).slice(0, cols);
    let a = (L.rep ? .4 : .75) * (isErr ? 1 + .9 * err : 1);
    // particles: from the band moment, rows dissolve from the top into the band
    if (t >= S.band) { const fall = seg(t, S.band + r / rows * 2.2, S.band + .6 + r / rows * 2.2); a *= 1 - fall; }
    text(g, s, 0, r, v, a);
  }
  if (t >= S.band) {
    const vb = view(44, 250);
    const by = 11;
    blackRect(0, vb.oy + (by - 1) * vb.cw * 2, W, vb.cw * 2 * 6);
    for (let r = by - 1; r <= by + 4; r++) text(g, '='.repeat(44), 0, r, vb, (r === by - 1 || r === by + 4 ? .75 : .1) * bandIn);
    inverse(g, ' HEADROOM ', 17, by + 1, vb, 1 * bandIn);
    // particles falling into the band (deterministic)
    for (let i = 0; i < 260; i++) {
      const t0 = S.band + hsh(i, 1) * 2.6, life = .9;
      const p = seg(t, t0, t0 + life); if (p <= 0 || p >= 1) continue;
      const sx = hsh(i, 2) * W, sy = 250 + hsh(i, 3) * 1100, ex = W / 2 + (hsh(i, 4) - .5) * 600, ey = vb.oy + (by + 1.5) * vb.cw * 2;
      const e = eio(p); const ch = '.:-=+*#'[Math.floor(hsh(i, 5) * 7)];
      glyph(g, ch, lerp(sx, ex, e), lerp(sy, ey, e), 12, (.4 + .6 * Math.sin(p * Math.PI)) * (p > .9 ? 1.6 : 1));
    }
    // compact output under the band, ice white, from "automatically"
    if (t >= S.auto - .4) { COMPACT.forEach((s, k) => { if (t >= S.auto - .4 + k * .1) text(g, s, 8, by + 6 + k, vb, 1.1, 1); }); text(g, 'headroom: active  /  automatic', 8, by + 12, vb, .7 * seg(t, S.auto, S.auto + .3)); }
  }
}
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
DAYS.forEach((d, k) => ev(S.days + .3 + k * .55, 'bootline'));
function sDays(t) {
  const v = view(40, 250);
  header(t, v, ' HEADROOM LOG ', 'this week');
  DAYS.forEach((d, k) => {
    const t0 = S.days + .3 + k * .55; if (t < t0) return;
    const full = `${d}  session ${String(k * 7 + 3).padStart(2, '0')}  context [###.......]  ok`;
    text(g, full.slice(0, Math.floor(clamp((t - t0) / .012, 0, full.length))), 0, 3 + k * 2, v, .9);
  });
  if (t > S.days + 3) cursor(g, 0, 3 + 10, v, blink(t, S.days + 3));
}
// ---------------- tease: GitHub Goldmine, find 02 ----------------
const MZ = 21, MR = 21;     // maze cells
const maze = (() => { // deterministic DFS maze
  const N = 10, seen = new Set(), walls = new Set(); const st = [[0, 0]]; seen.add('0,0'); let s = 3;
  const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
  const path = [];
  while (st.length) { const [x, y] = st[st.length - 1]; const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [x + dx, y + dy]).filter(([a, b]) => a >= 0 && b >= 0 && a < N && b < N && !seen.has(a + ',' + b));
    if (!nb.length) { st.pop(); continue; } const [nx, ny] = nb[Math.floor(rnd() * nb.length)]; walls.add([x, y, nx, ny].join()); walls.add([nx, ny, x, y].join()); seen.add(nx + ',' + ny); st.push([nx, ny]); }
  const grid = []; for (let r = 0; r < 2 * N + 1; r++) { grid.push([]); for (let c = 0; c < 2 * N + 1; c++) grid[r].push(r % 2 === 0 || c % 2 === 0 ? '#' : ' '); }
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { if (walls.has([x, y, x + 1, y].join())) grid[2 * y + 1][2 * x + 2] = ' '; if (walls.has([x, y, x, y + 1].join())) grid[2 * y + 2][2 * x + 1] = ' '; }
  // solve (BFS) from (0,0) to (N-1,N-1)
  const q = [[1, 1]], prev = { '1,1': null };
  while (q.length) { const [r, c] = q.shift(); if (r === 2 * N - 1 && c === 2 * N - 1) break; for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = (r + dr) + ',' + (c + dc); if (grid[r + dr][c + dc] === ' ' && !(k in prev)) { prev[k] = r + ',' + c; q.push([r + dr, c + dc]); } } }
  let k = (2 * N - 1) + ',' + (2 * N - 1); while (k) { path.unshift(k.split(',').map(Number)); k = prev[k]; }
  return { grid, path };
})();
for (let k = 0; k < 18; k++) ev(S.maze + .2 + k * .1, 'tick', { n: 1 });
function sTease(t) {
  const v = view(40, 250);
  header(t, v, ' GITHUB GOLDMINE ', 'finds');
  const l1 = 'FIND 01  HEADROOM ........ FOUND';
  const l2t = 'FIND 02  ';
  if (t > S.tease + .5) text(g, l1.slice(0, Math.floor((t - S.tease - .5) / .015)), 0, 3, v, .9);
  if (t > S.tease + 1.2) {
    const p = seg(t, S.tease + 1.4, S.off2 - .4); const k = Math.floor(p * 14);
    text(g, l2t + '[' + '#'.repeat(k) + '.'.repeat(14 - k) + '] LOADING', 0, 5, v, 1);
  }
  if (t > S.tease + 2.2 && t < S.maze + .4) { const k = Math.min(8, Math.floor((t - S.tease - 2.2) / .07) + 1); bigWord('GOLDMINE', W / 2, 1000, 7.6, t < S.maze ? 1 : decay(t, S.maze), k); text(g, 'a series of insane github finds', 5, 20, v, .6 * seg(t, S.tease + 3, S.tease + 3.4) * (t < S.maze ? 1 : decay(t, S.maze))); }
  // the maze of a massive codebase
  const mz = view(21 * 2, 250), cw = 960 / 42;
  if (t >= S.maze) {
    const rev = seg(t, S.maze, S.maze + 1.0);
    const ox = (W - 21 * 2 * cw) / 2, oy = 610;
    maze.grid.forEach((row, r) => row.forEach((c, cc) => { if (c === '#' && hsh(r, cc) < rev * 1.05) { glyph(g, '+', ox + cc * 2 * cw, oy + r * cw * 1.45, cw, .55); glyph(g, '-', ox + (cc * 2 + 1) * cw, oy + r * cw * 1.45, cw, cc < 20 && row[cc + 1] === '#' ? .55 : 0); } }));
    const n = Math.floor(seg(t, S.maze + 1.0, S.off2 - .3) * maze.path.length);
    maze.path.slice(0, n).forEach(([r, c]) => glyph(g, '*', ox + c * 2 * cw, oy + r * cw * 1.45, cw, 1.3));
  }
}

// ======================= render =======================
const SEC = [];
function render(t) {
  begin();
  let power = 1, off = 0;
  if (!CRT_ON(t)) { crt.render(scene, Math.round(t * 30), { expo: 0, power: 0 }); return; }
  if (t < S.clear) sSession(t);
  else if (t < S.wrapCmd) sQuestion(t);
  else if (t < S.pull0) sName(t);
  else if (t < S.end1) sDiagram(t);
  else if (t < S.days) sTower(t);
  else if (t < S.off1) sDays(t);
  else sTease(t);
  strip(t);
  if (t >= S.on && t < S.on + .55) power = seg(t, S.on, S.on + .55);
  if (t >= S.tease && t < S.tease + .55) power = seg(t, S.tease, S.tease + .55);
  crt.render(scene, Math.round(t * 30), { power, off, expo: 1 });
}
ev(S.on, 'degauss'); ev(S.tease, 'degauss'); ev(S.clear, 'clunk'); ev(S.full, 'bel'); ev(S.full + .3, 'bel');
ev(S.compact, 'chord'); ev(S.band, 'particles'); ev(S.auto, 'chord');
window.DUR = S.dur;
window.EV = EV.sort((a, b) => a.t - b.t);
window.render = render;
window.READY = true;
for (let k = 0; k < 8; k++) ev(S.tease + 2.2 + k * .07, 'key');
