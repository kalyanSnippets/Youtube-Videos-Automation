// Paperclip AI reel, isometric office shots (Isometric People Scene style), 1080x1920 portrait.
// One place (an office floor seen from above, far walls kept, near walls cut away), faceless people seen from behind,
// key words painted on the floor. Times are seconds inside each shot, matched to the narration of the cut.
import { iso, tri, C, TOPS, LEGS, onPlane, quad, fillPoly, rect, tracePath, phraseLayout, floorType, drawPerson, drawSeated, mix, hex, css, clamp, lerp, seg, ss, eo, eio, TAU, hash, W, H } from './kit.js';

export const DURS = { hook: 3.4, team: 8.15, org: 7.6, tasks: 6.5, starter: 4.6 };
const WALL = 9, WH = 3.0;
// s runs down the screen, d across it: x = (s + d) / 2, y = (s - d) / 2
const at = (s, d) => [(s + d) / 2, (s - d) / 2];
const camSD = (s, d, k) => { const [x, y] = at(s, d); return { x, y, z: 0, k }; };
const ROBOT = { body: '#3D6B59', head: '#A7C2B2', mid: '#6E9886' };

// ---------- the place ----------
function floor(g) {
  fillPoly(g, quad(rect(-WALL, 30, -WALL, 30), 0), C.carpet);
  g.save(); g.strokeStyle = css(mix(C.carpet, C.carpetEdge, .55)); g.lineWidth = 1.2;
  for (let i = -WALL; i <= 30; i += 1.5) { g.beginPath(); g.moveTo(...iso.P(i, -WALL, 0)); g.lineTo(...iso.P(i, 30, 0)); g.stroke(); g.beginPath(); g.moveTo(...iso.P(-WALL, i, 0)); g.lineTo(...iso.P(30, i, 0)); g.stroke(); }
  g.restore();
}
function walls(g) { // far walls only (the near ones are cut away), windows on them
  iso.boxNow(-WALL - .3, -WALL - .3, 0, .3, 40, WH, tri(C.wallIn));
  iso.boxNow(-WALL - .3, -WALL - .3, 0, 40, .3, WH, tri(C.wallIn));
  for (let i = 0; i < 8; i++) {
    const y = -WALL + 1 + i * 3.2; onPlane(g, -WALL, y, 2.5, 'yz', g2 => { g2.fillStyle = C.glass; g2.fillRect(-2.0, 0, 2.0, 1.4); g2.fillStyle = css(mix(C.glass, '#FFFFFF', .35)); g2.fillRect(-2.0, 0, .5, 1.4); });
    const x = -WALL + 1 + i * 3.2; onPlane(g, x, -WALL, 2.5, 'xz', g2 => { g2.fillStyle = C.glass; g2.fillRect(0, 0, 2.0, 1.4); g2.fillStyle = css(mix(C.glass, '#FFFFFF', .35)); g2.fillRect(1.5, 0, .5, 1.4); });
  }
}
// a desk: the sitter is at (x, y) facing −x; desk and screen in front of them, a low chair back behind
function desk(x, y, o = {}) {
  iso.box(x - 1.2, y - .8, 0, .8, 1.6, .74, tri('#C9A27A'));
  const lit = o.lit ?? 0;
  iso.box(x - 1.05, y - .4, .74, .08, .8, .5, tri('#3A3E3B'), { decal: (I, b) => { onPlane(I.g, b.x + b.w + .001, b.y + b.d - .05, b.z + b.h - .05, 'yz', g2 => { g2.fillStyle = css(mix('#2F3532', o.screen || ROBOT.head, lit)); g2.fillRect(0, 0, b.d - .1, b.h - .1); }); } });
  if (o.chair !== false) { iso.box(x - .25, y - .28, 0, .5, .56, .42, tri('#6A6358'), { bias: -.8 }); iso.box(x + .2, y - .28, .42, .07, .56, .16, tri('#6A6358')); }
}
function human(x, y, p, a = 1) { iso.bill(x, y, 0, gg => { gg.globalAlpha = a; drawSeated(gg, p); }); }
function drawRobot(g, s = 1) { // a seated AI agent from behind: rounded body, square head, antenna (no face)
  g.save(); g.scale(s, s);
  const B = tri(ROBOT.body, .18, .26), Hd = tri(ROBOT.head, .15, .2);
  g.beginPath(); g.roundRect(-.22, -1.0, .44, .52, .1); g.fillStyle = B[1]; g.fill();
  g.beginPath(); g.roundRect(.04, -1.0, .18, .52, [0, .1, .1, 0]); g.fillStyle = B[2]; g.fill();
  g.fillStyle = '#3A3E3B'; g.fillRect(-.04, -1.08, .08, .1);
  g.beginPath(); g.roundRect(-.17, -1.36, .34, .3, .07); g.fillStyle = Hd[1]; g.fill();
  g.beginPath(); g.roundRect(.03, -1.36, .14, .3, [0, .07, .07, 0]); g.fillStyle = Hd[2]; g.fill();
  g.strokeStyle = '#3A3E3B'; g.lineWidth = .03; g.beginPath(); g.moveTo(0, -1.36); g.lineTo(0, -1.5); g.stroke();
  g.beginPath(); g.arc(0, -1.53, .045, 0, TAU); g.fillStyle = C.ginger; g.fill();
  g.restore();
}
function robot(x, y, k = 1) { if (k <= 0) return; iso.bill(x, y, 0, gg => { const b = lerp(.6, 1, eo(k)); gg.globalAlpha = Math.min(1, k * 1.6); gg.translate(0, (1 - eo(k)) * -.3); drawRobot(gg, b); }); }
// accent outline on the floor ("stand here")
function outline(g, x0, x1, y0, y1, a, dash = false) {
  if (a <= 0) return; g.save(); g.globalAlpha = a; g.strokeStyle = C.accent; g.lineWidth = 5; if (dash) g.setLineDash([16, 12]);
  const P = quad(rect(x0, x1, y0, y1), .01); g.beginPath(); P.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.closePath(); g.stroke(); g.restore();
}
// flat accent arrow on the floor from a to b, grown to fraction p
function arrow(g, a, b, p, w = .34) {
  if (p <= 0) return; const L = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L, nx = -uy, ny = ux;
  const e = L * p, hx = a[0] + ux * e, hy = a[1] + uy * e, sh = Math.min(e, .8);
  const pts = [[a[0] + nx * w / 2, a[1] + ny * w / 2], [hx - ux * sh + nx * w / 2, hy - uy * sh + ny * w / 2], [hx - ux * sh + nx * w * 1.4, hy - uy * sh + ny * w * 1.4], [hx, hy], [hx - ux * sh - nx * w * 1.4, hy - uy * sh - ny * w * 1.4], [hx - ux * sh - nx * w / 2, hy - uy * sh - ny * w / 2], [a[0] - nx * w / 2, a[1] - ny * w / 2]];
  fillPoly(g, pts.map(q => iso.P(q[0], q[1], .015)), C.accent, .9);
}
// a floor phrase: lines of [text, kind]; Latin words land one after another
const phr = (x, y, t0, lines, o = {}) => { const P = { x, y, z: .02, t0, t1: o.t1 ?? 99, step: o.step ?? .12, scale: o.scale ?? 1, lines, dv: o.dv, indent: o.indent ?? 0 }; return [P, phraseLayout(P)]; };
const type = (g, t, PL) => floorType(g, t, PL[0], PL[1]);
function paper(x, y, z) { iso.box(x - .22, y - .3, z, .44, .6, .04, tri('#FAF4E8')); }
const cam = (x, y, k) => ({ x, y, z: 0, k });
const camLerp = (a, b, u) => ({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), z: 0, k: lerp(a.k, b.k, u) });
function begin(g, c) { iso.g = g; iso.cam = c; g.fillStyle = C.bg; g.fillRect(0, 0, W, H); floor(g); }

// ---------- shot 1: twelve desks, eleven become AI agents, one human stays ----------
const GRID = []; for (const S of [-8, -4.5, -1, 2.5]) for (const D of [-3.4, 0, 3.4]) GRID.push(at(S, D));
const ME = 7;
const PEOPLE = GRID.map((_, i) => ({ top: TOPS[i % 4], legs: LEGS[i % 4], h: 1.7, hairLong: i % 3 === 1 }));
const T_HOOK = { flip0: 1.0, gap: .075, me: 2.0, type: 2.15 };
const HOOK_TYPE = phr(...at(7.6, -3.8), T_HOOK.type, [[['1', 'na'], [' human', 'n']], [['11 AI agents', 'e']]], { dv: 1.4, scale: 1.05 });
function hook(g, t) {
  const c = camLerp(camSD(-3.6, 0, 112), camSD(-3.2, 0, 118), eio(seg(t, 0, 3.4)));
  begin(g, c); walls(g);
  const order = GRID.map((_, i) => i).filter(i => i !== ME);
  GRID.forEach(([x, y], i) => {
    const k = order.indexOf(i), tf = T_HOOK.flip0 + k * T_HOOK.gap, u = seg(t, tf, tf + .25);
    desk(x, y, { lit: i === ME ? 0 : ss(u) });
    if (i === ME || u < .5) human(x, y, PEOPLE[i], i === ME ? 1 : 1 - ss(seg(u, 0, .5)));
    if (i !== ME) robot(x, y, seg(u, .4, 1));
  });
  const [mx, my] = GRID[ME]; outline(g, mx - 1.4, mx + .7, my - 1.0, my + 1.0, ss(seg(t, T_HOOK.me, T_HOOK.me + .3)));
  iso.flush(); type(g, t, HOOK_TYPE);
}

// ---------- shot 2: a normal start-up: CEO, developers, designers, marketers walk in; launched: 0 ----------
const TEAM = [
  { role: 'CEO', s: -6.5, d: 0, at: 2.45, p: { top: TOPS[0], legs: LEGS[0], h: 1.75 } },
  { role: 'developers', s: -1, d: -3.6, at: 3.63, p: { top: TOPS[1], legs: LEGS[1], h: 1.72 } },
  { role: 'designers', s: -1, d: 0, at: 4.17, p: { top: TOPS[2], legs: LEGS[2], h: 1.68, hairLong: true } },
  { role: 'marketers', s: -1, d: 3.6, at: 4.43, p: { top: TOPS[3], legs: LEGS[3], h: 1.7 } },
].map(m => { const [x, y] = at(m.s, m.d); return { ...m, x, y }; });
const TEAM_ROLE = TEAM.map(m => phr(m.x + 1.55, m.y + (m.d > 0 ? 2.9 : 1.25), m.at, [[[m.role, 'e']]], { scale: .46 }));
const TEAM_TYPE = phr(...at(7.6, -3.8), 7.15, [[['launched', 'n']], [['0', 'na'], [' products', 'e']]], { dv: 1.7, scale: 1.0 });
const TEAM_HEAD = phr(...at(7.6, -3.8), .25, [[['a software', 'e']], [['company', 'n']]], { dv: 1.6, t1: 6.6, scale: 1.0 });
function walkIn(m, t) { // walk up-right along −y to the chair, then sit; 1.5 m/s, arrives at m.at
  const dist = 3.2, t0 = m.at - dist / 1.5;
  if (t < t0) return;
  if (t < m.at) { const u = seg(t, t0, m.at), y = m.y + dist * (1 - u); iso.bill(m.x + .45, y, 0, gg => drawPerson(gg, m.p, { walking: true, phase: (t - t0) * 9 })); return; }
  human(m.x, m.y, m.p);
}
function team(g, t) {
  const c = camLerp(camSD(-3.8, 0, 116), camSD(-3.4, 0, 122), eio(seg(t, 0, 8.15)));
  begin(g, c); walls(g);
  TEAM.forEach(m => desk(m.x, m.y));
  TEAM.forEach(m => walkIn(m, t));
  { const a = ss(seg(t, 5.6, 6.0)); if (a > 0) { g.save(); g.globalAlpha = a; g.strokeStyle = C.accent; g.lineWidth = 5; g.setLineDash([16, 12]); const P = [at(-8.6, 0), at(.8, -6.4), at(1.6, 0), at(.8, 6.4)].map(([x, y]) => iso.P(x, y, .01)); g.beginPath(); P.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.closePath(); g.stroke(); g.restore(); } }
  iso.flush(); type(g, t, TEAM_HEAD); TEAM_ROLE.forEach(R => type(g, t, R)); type(g, t, TEAM_TYPE);
}

// ---------- shot 3: AI agents organised like a company; the camera visits CEO, developer, marketing ----------
const ORG = [{ role: 'CEO agent', s: -5.6, d: 0, in: .55 }, { role: 'developer', s: .4, d: -3.4, in: .85 }, { role: 'marketing', s: .4, d: 3.4, in: 1.05 }].map(m => { const [x, y] = at(m.s, m.d); return { ...m, x, y }; });
const ORG_ROLE = ORG.map((m, i) => phr(m.x + 1.55, m.y + (m.d > 0 ? 2.9 : 1.25), [4.15, 5.45, 6.8][i], [[[m.role, 'e']]], { scale: .58 }));
const ORG_TYPE = phr(...at(7.6, -3.8), .3, [[['AI agents', 'n']], [['= a company', 'e']]], { dv: 1.6, t1: 3.7, scale: 1.0 });
function org(g, t) {
  const stops = [[0, camSD(-3.6, 0, 116)], [4.15, camSD(-4.2, 0, 170)], [5.45, camSD(1.6, -2.4, 170)], [6.8, camSD(1.6, 2.4, 170)]];
  let c = stops[0][1]; for (let i = 1; i < stops.length; i++) c = camLerp(c, stops[i][1], eio(seg(t, stops[i][0] - .35, stops[i][0] + .35)));
  begin(g, c); walls(g);
  ORG.forEach((m, i) => { const focus = [4.15, 5.45, 6.8][i]; desk(m.x, m.y, { lit: ss(seg(t, focus - .2, focus + .2)) }); robot(m.x, m.y, seg(t, m.in, m.in + .4)); });
  iso.flush();
  arrow(g, at(-3.8, -.8), at(-1.2, -2.8), eo(seg(t, 1.6, 2.2)));
  arrow(g, at(-3.8, .8), at(-1.2, 2.8), eo(seg(t, 1.8, 2.4)));
  type(g, t, ORG_TYPE); ORG_ROLE.forEach(R => type(g, t, R));
}

// ---------- shot 4: one goal, broken into tasks, the agents coordinate ----------
const GOAL_TYPE = phr(...at(7.6, -3.8), .9, [[['1', 'na'], [' goal', 'n']], [['a simple productivity app', 'e']]], { dv: 1.6, t1: 3.7, scale: 1.0 });
const TASK_TYPE = phr(...at(7.6, -3.8), 4.2, [[['tasks', 'n']], [['shared out', 'e']]], { dv: 1.6, scale: 1.0 });
function tasks(g, t) {
  const c = camLerp(camSD(-3.6, 0, 116), camSD(-3.2, 0, 122), eio(seg(t, 0, 6.5)));
  begin(g, c); walls(g);
  ORG.forEach((m, i) => { const done = 5.3 + i * .3; desk(m.x, m.y, { lit: ss(seg(t, done, done + .2)), screen: C.greenLt }); robot(m.x, m.y, 1); });
  // three task sheets leave the CEO desk for each desk
  ORG.forEach((m, i) => { const u = eio(seg(t, 3.9 + i * .18, 4.9 + i * .18)); if (t < 3.6) return; const s = at(-6.6, 0), e = [m.x - .9, m.y]; paper(lerp(s[0], e[0], u), lerp(s[1], e[1], u), .76 + Math.sin(Math.PI * u) * .9); });
  iso.flush();
  arrow(g, at(-3.8, -.8), at(-1.2, -2.8), eo(seg(t, 3.8, 4.4)));
  arrow(g, at(-3.8, .8), at(-1.2, 2.8), eo(seg(t, 3.9, 4.5)));
  if (t > 5.2) arrow(g, at(2.4, -2.0), at(2.4, 2.0), eo(seg(t, 5.3, 6.0)), .26);
  type(g, t, GOAL_TYPE); type(g, t, TASK_TYPE);
}

// ---------- shot 5: start with just two agents, a researcher and a writer ----------
const PAIR = [{ role: 'researcher', s: -2.4, d: -2.8, at: 2.7 }, { role: 'writer', s: -2.4, d: 2.8, at: 3.6 }].map(m => { const [x, y] = at(m.s, m.d); return { ...m, x, y }; });
const PAIR_ROLE = PAIR.map(m => phr(m.x + 1.55, m.y + (m.d > 0 ? 2.4 : 1.25), m.at, [[[m.role, 'e']]], { scale: .62 }));
const PAIR_TYPE = phr(...at(6.6, -3.2), 1.2, [[['just', 'n'], [' 2', 'na']], [['agents', 'e']]], { scale: 1.15, dv: 1.5 });
function starter(g, t) {
  const c = camLerp(camSD(-3.6, 0, 132), camSD(-3.3, 0, 138), eio(seg(t, 0, 4.6)));
  begin(g, c); walls(g);
  PAIR.forEach(m => { desk(m.x, m.y, { lit: ss(seg(t, m.at, m.at + .2)) }); robot(m.x, m.y, seg(t, m.at - .7, m.at - .3)); });
  if (t > 3.7) { const u = ((t - 3.7) % 1.1) / 1.1, a = at(-3.8, -2.2), b = at(-3.8, 2.2); paper(lerp(a[0], b[0], eio(u)), lerp(a[1], b[1], eio(u)), .76 + Math.sin(Math.PI * u) * .7); }
  iso.flush();
  arrow(g, at(-.6, -1.6), at(-.6, 1.6), eo(seg(t, 3.7, 4.2)));
  type(g, t, PAIR_TYPE); PAIR_ROLE.forEach(R => type(g, t, R));
}

const SHOTS = { hook, team, org, tasks, starter };
export function render(g, t, shot) { SHOTS[shot](g, t); }
