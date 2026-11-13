/* =========================================================
   HAND-DRAWN BACKGROUNDS ("scenes")
   Everything here is drawn like a sketchbook: wobbly pencil lines that
   "boil" a few times per second, hatching instead of flat fills,
   handwritten notes, and each drawing is traced on screen when it appears.

   A section picks its scene in index.html with data-fx="name".
   Each scene:  init(W,H) -> state    draw(c, state, t, dt, W, H, accent, A)
   A(alpha) sets the opacity of the next thing drawn.
   ========================================================= */
(function () {
const P = '#efebe3', BG = '#0b0c0f';
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const R = (a, b) => a + Math.random() * (b - a);
const MONO = '"JetBrains Mono", monospace', HAND = '"Caveat", "Yomogi", cursive', HAND_JP = '"Yomogi", "Caveat", cursive', HAND_ZH = '"Ma Shan Zheng", "Yomogi", cursive';
const clamp = v => Math.max(0, Math.min(1, v));
const FX = {};

/* ---------- the pencil: every scene draws with these helpers ---------- */
function pencil(c, t, s) {
  if (!s.t0) s.t0 = t;
  const f = Math.floor(t / 190); let n = 0, sd = 1;      // f = "boil" frame: the wobble changes ~5x per second
  const seed = () => { n++; sd = ((n * 7919 + f * 104729) % 233280) + 1; };
  const r = () => { sd = (sd * 9301 + 49297) % 233280; return sd / 233280 - 0.5; };
  const age = RM ? 99 : (t - s.t0) / 1000;
  c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = 1.35;
  const K = {
    age,
    /* P(start, duration): how much of a drawing is traced yet (0 → 1) */
    P: (start, dur = 0.8) => clamp((age - start) / dur),
    line(x1, y1, x2, y2, p = 1, j = 1.8) {
      seed(); if (p <= 0) return;
      const ex = x1 + (x2 - x1) * p, ey = y1 + (y2 - y1) * p;
      for (let k = 0; k < 2; k++) { c.beginPath(); c.moveTo(x1 + r() * j, y1 + r() * j); c.quadraticCurveTo((x1 + ex) / 2 + r() * j * 3, (y1 + ey) / 2 + r() * j * 3, ex + r() * j, ey + r() * j); c.stroke(); }
    },
    poly(pts, close, p = 1, j) {
      const m = close ? pts.length : pts.length - 1;
      for (let i = 0; i < m; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; K.line(a[0], a[1], b[0], b[1], clamp(p * m - i), j); }
    },
    /* smooth wobbly curve through many points (ribbons, ridges, mountains) */
    curve(pts, p = 1, j = 2) {
      seed(); if (p <= 0) return;
      const m = Math.max(2, Math.floor(pts.length * p));
      for (let k = 0; k < 2; k++) { c.beginPath(); for (let i = 0; i < m; i++) { const X = pts[i][0] + r() * j, Y = pts[i][1] + r() * j; i ? c.lineTo(X, Y) : c.moveTo(X, Y); } c.stroke(); }
    },
    circ(x, y, rad, p = 1, j = 0.07) {
      seed(); if (p <= 0) return;
      for (let k = 0; k < 2; k++) {
        const a0 = r() * 6.28, N = 30, rx = rad * (1 + r() * j), ry = rad * (1 + r() * j);
        c.beginPath();
        for (let i = 0; i <= N * p * 1.07; i++) { const a = a0 + i / N * 6.283, w = 1 + r() * j * 0.25; const X = x + Math.cos(a) * rx * w, Y = y + Math.sin(a) * ry * w; i ? c.lineTo(X, Y) : c.moveTo(X, Y); }
        c.stroke();
      }
    },
    rect(x, y, w, h, rot = 0, p = 1) {
      const cs = Math.cos(rot), sn = Math.sin(rot), q = (dx, dy) => [x + dx * cs - dy * sn, y + dx * sn + dy * cs];
      const pts = [q(-w / 2, -h / 2), q(w / 2, -h / 2), q(w / 2, h / 2), q(-w / 2, h / 2)]; K.poly(pts, true, p); return pts;
    },
    /* pencil hatching inside a shape. clip = function that traces the shape */
    hatch(clip, x, y, w, h, gap = 9, p = 1) {
      c.save(); clip(); c.clip();
      const total = Math.ceil((w + h) / gap); let i = 0;
      for (let d = -h; d < w; d += gap, i++) K.line(x + d, y + h, x + d + h, y, clamp(p * total - i), 1.2);
      c.restore();
    },
    arrow(x1, y1, x2, y2, p = 1) {
      K.line(x1, y1, x2, y2, p); if (p < 1) { seed(); seed(); return; }
      const a = Math.atan2(y2 - y1, x2 - x1);
      K.line(x2, y2, x2 - Math.cos(a - 0.5) * 12, y2 - Math.sin(a - 0.5) * 12); K.line(x2, y2, x2 - Math.cos(a + 0.5) * 12, y2 - Math.sin(a + 0.5) * 12);
    },
    text(str, x, y, size, rot = 0, font = HAND, align = 'left') {
      c.save(); c.translate(x, y); c.rotate(rot); c.font = '700 ' + size + 'px ' + font; c.textAlign = align; c.fillText(str, 0, 0); c.restore();
    }
  };
  return K;
}
const cloud = (K, x, y, w, p) => { const pts = []; [[-0.55, 0, 0.3], [-0.15, -0.16, 0.36], [0.3, -0.05, 0.3], [0.62, 0.04, 0.2]].forEach(([dx, dy, r]) => { for (let a = Math.PI; a <= Math.PI * 2.01; a += 0.35) pts.push([x + dx * w + Math.cos(a) * r * w, y + dy * w + Math.sin(a) * r * w * 0.8]); }); pts.push([x + 0.82 * w, y + 0.06 * w], [x - 0.85 * w, y + 0.06 * w], pts[0]); K.curve(pts, p, 1.2); };
const ink = (c, col) => { c.strokeStyle = col; c.fillStyle = col; };

/* floating handwritten words */
function words(list, font) { return list.map((txt, i) => ({ txt, x: R(0.03, 0.9), y: (i + R(0, 0.7)) / list.length, sz: R(26, 54), sp: R(0.4, 1), ph: R(0, 6.28), rot: R(-0.12, 0.12), font })); }
function drawWords(c, K, ws, t, dt, W, H, A) {
  c.fillStyle = P;
  for (const w of ws) {
    w.y -= dt * 0.000012 * w.sp; if (w.y < -0.1) { w.y = 1.06; w.x = R(0.03, 0.9); }
    A((0.10 + 0.14 * (0.5 + 0.5 * Math.sin(t * 0.0006 * w.sp + w.ph))) * K.P(0.2, 1.5));
    K.text(w.txt, w.x * W, w.y * H, Math.round(w.sz), w.rot, w.font);
  }
}

/* ---------- default: sketchbook sky with a paper plane ---------- */
FX.stars = {
  init() { return { p: Array.from({ length: 46 }, () => ({ x: R(0, 1), y: R(0, 1), s: R(3, 8), ph: R(0, 6.28), k: Math.random() < 0.3 })) }; },
  draw(c, s, t, dt, W, H, acc, A) {
    const K = pencil(c, t, s);
    for (const p of s.p) {
      const tw = 0.6 + 0.4 * Math.sin(t * 0.0012 + p.ph), x = p.x * W, y = p.y * H, d = p.s * tw;
      ink(c, p.k ? acc : P); A(0.16 + 0.3 * tw);
      K.line(x - d, y, x + d, y, 1, 1); K.line(x, y - d, x, y + d, 1, 1);
      if (p.k) { K.line(x - d * 0.6, y - d * 0.6, x + d * 0.6, y + d * 0.6, 1, 1); K.line(x - d * 0.6, y + d * 0.6, x + d * 0.6, y - d * 0.6, 1, 1); }
    }
    // paper plane following a dotted route
    const u = (t * 0.00004) % 1.2, path = k => [k * (W + 200) - 100, H * (0.82 - 0.5 * k) + Math.sin(k * 9) * H * 0.07];
    ink(c, P); A(0.35);
    for (let k = 0; k < u; k += 0.012) { const q = path(k); c.beginPath(); c.arc(q[0], q[1], 1.3, 0, 7); c.fill(); }
    const a = path(u), b = path(u + 0.01), an = Math.atan2(b[1] - a[1], b[0] - a[0]);
    c.save(); c.translate(a[0], a[1]); c.rotate(an); ink(c, acc); A(0.95);
    K.poly([[18, 0], [-14, -11], [-7, 0], [-14, 11]], true); K.line(-7, 0, 18, 0); c.restore();
  }
};

/* ---------- Samsung: a product designer's notebook — devices, traces, notes ---------- */
FX.circuit = {
  init(W, H) {
    const g = 34, paths = [], dirs = [[1, 0], [0, 1], [-1, 0], [0, -1]];
    for (let i = 0; i < 24; i++) {
      let x = Math.round(R(0, W) / g) * g, y = Math.round(R(0, H) / g) * g, d = Math.floor(R(0, 4));
      const pts = [[x, y]]; let len = 0;
      for (let k = 0, m = Math.floor(R(3, 6)); k < m; k++) { const L = Math.floor(R(2, 7)) * g, v = dirs[d]; x += v[0] * L; y += v[1] * L; pts.push([x, y]); len += L; d = (d + (Math.random() < 0.5 ? 1 : 3)) % 4; }
      paths.push({ pts, len, off: R(0, 1), sp: R(0.05, 0.13), at: R(0, 1.6) });
    }
    return { paths };
  },
  draw(c, s, t, dt, W, H, acc, A) {
    const K = pencil(c, t, s), m = Math.min(W, H);
    // traces, drawn one after the other
    for (const p of s.paths) {
      const pr = K.P(p.at, 1.2); ink(c, P); A(0.2); K.poly(p.pts, false, pr, 1.2);
      if (pr >= 1) { const a = p.pts[0], b = p.pts[p.pts.length - 1]; A(0.4); K.circ(a[0], a[1], 4); K.circ(b[0], b[1], 4); }
      // signal running along the trace
      let d = ((t * 0.001 * p.sp + p.off) % 1) * p.len, q = null;
      for (let i = 1; i < p.pts.length && !q; i++) { const a = p.pts[i - 1], b = p.pts[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (d <= L) q = [a[0] + (b[0] - a[0]) * d / L, a[1] + (b[1] - a[1]) * d / L]; d -= L; }
      if (q && pr >= 1) { ink(c, acc); A(0.95); c.beginPath(); c.arc(q[0], q[1], 3.2, 0, 7); c.fill(); A(0.25); c.beginPath(); c.arc(q[0], q[1], 8, 0, 7); c.fill(); }
    }
    // laptop
    let x = W * 0.82, y = H * 0.25, z = m * 0.125, p = K.P(0.4, 1.4);
    const scr = () => { c.beginPath(); c.rect(x - z, y - z * 0.65, z * 2, z * 1.2); };
    A(1); c.fillStyle = BG; scr(); c.fill();
    ink(c, P); A(0.75); K.poly([[x - z, y - z * 0.65], [x + z, y - z * 0.65], [x + z, y + z * 0.55], [x - z, y + z * 0.55]], true, p);
    K.poly([[x - z, y + z * 0.55], [x - z * 1.3, y + z * 0.8], [x + z * 1.3, y + z * 0.8], [x + z, y + z * 0.55]], false, K.P(1.2));
    // growing sales bars on the screen
    ink(c, acc); A(0.9);
    [0.3, 0.42, 0.55, 0.8].forEach((hgt, i) => { const bx = x - z * 0.7 + i * z * 0.4, bh = z * hgt * K.P(1.8 + i * 0.25, 0.6), by = y + z * 0.4; if (bh > 1) K.hatch(() => { c.beginPath(); c.rect(bx, by - bh, z * 0.24, bh); }, bx, by - bh, z * 0.24, bh, 6); K.poly([[bx, by], [bx, by - bh], [bx + z * 0.24, by - bh], [bx + z * 0.24, by]], false, bh > 1 ? 1 : 0); });
    A(0.95 * K.P(3)); K.text('×1.2 YoY', x + z * 0.05, y - z * 0.75, 30, -0.06);
    // earbuds + case
    x = W * 0.69; y = H * 0.76; z = m * 0.042; p = K.P(1);
    ink(c, P); A(0.7); K.rect(x, y + z * 1.3, z * 3.4, z * 2, 0, p); K.line(x - z * 1.7, y + z * 0.9, x + z * 1.7, y + z * 0.9, p);
    K.poly([[x - z * 1.7, y + z * 0.3], [x - z * 1.5, y - z * 0.5], [x + z * 1.5, y - z * 0.5], [x + z * 1.7, y + z * 0.3]], false, p); K.circ(x - z * 0.75, y + z * 0.75, z * 0.5, p); K.circ(x + z * 0.75, y + z * 0.75, z * 0.5, p);
    ink(c, acc); A(0.9 * K.P(2.4)); K.text('Buds4 Pro', x - z * 1.9, y + z * 3.7, 24, 0.04);
    // watch
    x = W * 0.93; y = H * 0.55; z = m * 0.05; p = K.P(1.5);
    ink(c, P); A(0.7); K.circ(x, y, z, p); K.circ(x, y, z * 0.8, p); K.rect(x, y - z * 1.55, z * 1.0, z * 1.0, 0, p); K.rect(x, y + z * 1.55, z * 1.0, z * 1.0, 0, p);
    ink(c, acc); A(0.9); const ha = t * 0.0006; K.line(x, y, x + Math.cos(ha) * z * 0.6, y + Math.sin(ha) * z * 0.6, p); K.line(x, y, x + Math.cos(ha * 0.08 - 1) * z * 0.4, y + Math.sin(ha * 0.08 - 1) * z * 0.4, p);
    // tablet
    x = W * 0.86; y = H * 0.78; z = m * 0.075; p = K.P(1.9);
    ink(c, P); A(0.7); K.rect(x, y, z * 1.5, z * 2.1, 0.12, p); A(0.35); for (let i = 0; i < 5; i++) K.line(x - z * 0.5 + i * 3, y - z * 0.6 + i * z * 0.25, x + z * (0.5 - (i % 2) * 0.3), y - z * 0.55 + i * z * 0.25, K.P(2.4 + i * 0.1, 0.4));
    // notes in the margins
    ink(c, P); A(0.6 * K.P(2.8)); K.text('go-to-market →', W * 0.63, H * 0.12, 30, -0.04); K.text('launch day!', W * 0.63, H * 0.66, 28, -0.05);
  }
};

/* ---------- UNIQLO / Tokyo: sketched skyline under a scribbled red sun ---------- */
FX.tokyo = {
  init(W, H) {
    const b = []; let x = -10, i = 0;
    while (x < W + 20) { const w = R(40, 96), h = R(0.10, 0.3) * H; b.push({ x, w, h, at: 0.3 + i * 0.05, win: Array.from({ length: Math.floor(w * h / 2600) }, () => [R(0.15, 0.85), R(0.1, 0.85), R(0, 6.28)]) }); x += w + R(0, 8); i++; }
    return { b, cl: [[0.12, 0.2, 90], [0.48, 0.12, 120], [0.86, 0.26, 80]] };
  },
  draw(c, s, t, dt, W, H, acc, A) {
    const K = pencil(c, t, s), m = Math.min(W, H), sx = W > 900 ? W * 0.72 : W * 0.5, sy = W > 900 ? H * 0.5 : H * 0.6, sr = m * 0.25;
    // sun: outline + hatching
    ink(c, acc); A(0.95); K.circ(sx, sy, sr, K.P(0, 1.2));
    A(0.75); K.hatch(() => { c.beginPath(); c.arc(sx, sy, sr, 0, 7); }, sx - sr, sy - sr, sr * 2, sr * 2, 7, K.P(0.6, 1.6));
    // clouds
    ink(c, P);
    for (const cl of s.cl) { const x = ((cl[0] * W + t * 0.008) % (W + 300)) - 150, y = cl[1] * H, w = cl[2]; A(0.5); cloud(K, x, y, w, K.P(1)); }
    // tower
    const tx = W * 0.93, tb = H, th = H * 0.62, tw = 64, tp = K.P(0.6, 1.2);
    A(0.75); K.line(tx - tw, tb, tx - 3, tb - th, tp); K.line(tx + tw, tb, tx + 3, tb - th, tp); K.line(tx, tb - th, tx, tb - th - 44, K.P(1.9));
    for (let k = 0.1, i = 0; k < 0.92; k += 0.1, i++) { const y = tb - th * k, hw = tw * (1 - k) + 3, y2 = tb - th * (k + 0.1), hw2 = tw * (1 - k - 0.1) + 3, q = K.P(1 + i * 0.1, 0.4); K.line(tx - hw, y, tx + hw, y, q); K.line(tx - hw, y, tx + hw2, y2, q); K.line(tx + hw, y, tx - hw2, y2, q); }
    // buildings (each one is traced, then its windows flicker)
    for (const b of s.b) {
      const p = K.P(b.at, 0.9), y = H - b.h;
      A(1); c.fillStyle = BG; c.fillRect(b.x, H - b.h * p, b.w, b.h * p);
      ink(c, P); A(0.7); K.poly([[b.x, H], [b.x, y], [b.x + b.w, y], [b.x + b.w, H]], false, p);
      if (p >= 1) for (const w of b.win) { const on = Math.sin(t * 0.0009 + w[2]) > -0.2; ink(c, w[2] > 5 ? acc : P); A(on ? 0.6 : 0.12); const wx = b.x + w[0] * b.w, wy = y + w[1] * b.h; K.line(wx, wy, wx, wy + 7, 1, 0.8); K.line(wx + 4, wy, wx + 4, wy + 7, 1, 0.8); }
    }
    // notes
    ink(c, P); A(0.7 * K.P(2.6)); K.text('東京 2025', W * 0.62, H * 0.15, 44, -0.06, HAND_JP);
    ink(c, acc); A(0.95 * K.P(3)); K.text('1 / 53', W * 0.86, H * 0.13, 40, -0.05); A(0.8); K.circ(W * 0.86 + 52, H * 0.13 - 13, 62, K.P(3.3, 0.6), 0.1);
  }
};

/* ---------- Swiss Life: a rebranding moodboard — ribbons, swatches, notes ---------- */
FX.waves = {
  init() { return { fr: [[0.68, 0.2, 150, 110, -0.08, 0], [0.89, 0.3, 120, 150, 0.1, 1], [0.92, 0.66, 130, 96, 0.06, 2], [0.67, 0.82, 110, 80, -0.12, 3], [0.83, 0.86, 110, 70, 0.07, 1]] }; },
  draw(c, s, t, dt, W, H, acc, A) {
    const K = pencil(c, t, s);
    // ribbons across the whole page
    for (let i = 0; i < 7; i++) {
      const pts = []; for (let x = -20; x <= W + 20; x += 36) pts.push([x, H * (0.16 + 0.115 * i) + Math.sin(x * 0.0042 + t * 0.0003 + i * 0.7) * (40 + i * 6) + Math.sin(x * 0.0016 - t * 0.0002 + i) * 34]);
      ink(c, i % 3 === 0 ? P : acc); A(i % 3 === 0 ? 0.3 : 0.42); K.curve(pts, K.P(i * 0.18, 1.6), 1.6);
    }
    // moodboard frames
    s.fr.forEach((f, i) => {
      const x = f[0] * W, y = f[1] * H + Math.sin(t * 0.0005 + i) * 6, p = K.P(1 + i * 0.3);
      const pts = (() => { const cs = Math.cos(f[4]), sn = Math.sin(f[4]); return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(q => [x + q[0] * f[2] / 2 * cs - q[1] * f[3] / 2 * sn, y + q[0] * f[2] / 2 * sn + q[1] * f[3] / 2 * cs]); })();
      const clip = () => { c.beginPath(); pts.forEach((q, k) => k ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath(); };
      A(1); c.fillStyle = BG; clip(); c.fill();
      if (f[5] !== 2) { ink(c, f[5] % 2 ? acc : P); A(f[5] % 2 ? 0.7 : 0.3); K.hatch(clip, x - f[2], y - f[3], f[2] * 2, f[3] * 2, f[5] === 3 ? 5 : 9, K.P(1.5 + i * 0.3, 1)); }
      else { ink(c, P); A(0.5 * p); K.text('Aa', x - 40, y + 22, 64, f[4]); }
      ink(c, P); A(0.8); K.poly(pts, true, p);
      // a piece of tape on top
      ink(c, acc); A(0.55 * p); K.rect(pts[0][0] + (pts[1][0] - pts[0][0]) / 2, pts[0][1] + (pts[1][1] - pts[0][1]) / 2, 44, 14, f[4] - 0.2, p);
    });
    ink(c, P); A(0.7 * K.P(2.6)); K.text('rebranding', W * 0.74, H * 0.38, 40, -0.05); A(0.55 * K.P(3)); K.text('v1  →  v2 ✓', W * 0.76, H * 0.7, 28, 0.04);
    ink(c, acc); A(0.95 * K.P(3.2)); K.text('20+ assets', W * 0.63, H * 0.66, 34, -0.04);
  }
};

/* ---------- Stellantis: a little sketched car on the road ---------- */
FX.road = {
  init(W) { return { trees: Array.from({ length: 9 }, (_, i) => ({ x: R(0, 1), h: R(40, 90), at: 0.6 + i * 0.12 })), hills: [0.6, 0.66] }; },
  draw(c, s, t, dt, W, H, acc, A) {
    const K = pencil(c, t, s), gy = H * 0.84;
    // sun + hills
    ink(c, acc); A(0.6); K.circ(W * 0.88, H * 0.2, 46, K.P(0.2)); for (let i = 0; i < 10; i++) { const a = i / 10 * 6.28 + t * 0.0001; K.line(W * 0.88 + Math.cos(a) * 60, H * 0.2 + Math.sin(a) * 60, W * 0.88 + Math.cos(a) * 80, H * 0.2 + Math.sin(a) * 80, K.P(0.6 + i * 0.05, 0.3)); }
    ink(c, P);
    [[0.62, 70, 0.003, 0], [0.7, 50, 0.005, 2]].forEach(([y0, amp, fq, ph], i) => { const pts = []; for (let x = -20; x <= W + 20; x += 30) pts.push([x, H * y0 - Math.sin(x * fq + ph) * amp - Math.sin(x * fq * 2.3 + ph) * amp * 0.3]); A(0.35 + i * 0.12); K.curve(pts, K.P(i * 0.4, 1.5)); });
    // trees scroll slowly (parallax)
    for (const tr of s.trees) { const x = (((tr.x * (W + 200) - t * 0.03) % (W + 200)) + W + 200) % (W + 200) - 100, p = K.P(tr.at); A(0.6); K.line(x, gy, x, gy - tr.h, p); ink(c, acc); A(0.5); K.circ(x, gy - tr.h - tr.h * 0.28, tr.h * 0.34, p, 0.14); ink(c, P); }
    // road + moving dashes
    A(0.8); K.line(-10, gy, W + 10, gy, K.P(0, 1.2), 2.4); A(0.4); K.line(-10, gy + 54, W + 10, gy + 54, K.P(0.3, 1.2), 2.4);
    A(0.6); for (let i = 0; i < 12; i++) { const x = (((i * 140 - t * 0.28) % (W + 280)) + W + 280) % (W + 280) - 140; K.line(x, gy + 27, x + 60, gy + 27, K.P(1), 1.2); }
    // signpost
    const sx = (((W * 0.9 - t * 0.06) % (W + 300)) + W + 300) % (W + 300) - 150;
    A(0.7); K.line(sx, gy, sx, gy - 120, K.P(1.4)); ink(c, acc); A(0.95); K.rect(sx + 34, gy - 120, 92, 40, -0.04, K.P(1.6)); A(0.95 * K.P(2)); K.text('+7 pts', sx - 2, gy - 111, 26, -0.04);
    // the car (drives across, wheels turning, bouncing a little)
    const cx = ((t * 0.15 + W * 0.9) % (W + 520)) - 260, by = gy - 16 + Math.sin(t * 0.012) * 1.5, u = 1.25, q = (a, b) => [cx + a * u, by - b * u];
    const body = [q(-100, 0), q(-104, 26), q(-82, 34), q(-56, 62), q(22, 64), q(60, 36), q(98, 28), q(104, 0)];
    A(1); c.fillStyle = BG; c.beginPath(); body.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.fill();
    ink(c, P); A(0.95); K.poly(body, true); K.poly([q(-48, 56), q(-70, 36), q(-12, 36), q(-12, 56)], true); K.poly([q(-4, 56), q(-4, 36), q(48, 36), q(18, 56)], true); K.line(...q(-12, 34), ...q(-12, 4));
    ink(c, acc); A(0.95); K.line(...q(92, 22), ...q(102, 22)); K.line(...q(-100, 20), ...q(-92, 20));
    for (const wx of [-62, 62]) { const w = q(wx, 0); A(1); c.fillStyle = BG; c.beginPath(); c.arc(w[0], w[1], 22, 0, 7); c.fill(); ink(c, P); A(0.95); K.circ(w[0], w[1], 21, 1, 0.05); K.circ(w[0], w[1], 9, 1, 0.1); const a = t * 0.006; for (let k = 0; k < 3; k++) K.line(w[0], w[1], w[0] + Math.cos(a + k * 2.09) * 19, w[1] + Math.sin(a + k * 2.09) * 19, 1, 0.6); }
    ink(c, P); A(0.5); for (let k = 0; k < 4; k++) { const y = by - 14 - k * 16, l = 40 + ((k * 37 + Math.floor(t / 190) * 13) % 50); K.line(cx - 150 - l, y, cx - 150, y, 1, 1.2); }
    ink(c, P); A(0.6 * K.P(2.6)); K.text('pricing · CRM · KPIs', W * 0.63, H * 0.3, 30, -0.04);
  }
};

/* ---------- MUJI: ruled paper, a brushed ensō, a few plain objects ---------- */
FX.muji = {
  init() { return { p: Array.from({ length: 30 }, () => ({ x: R(0, 1), y: R(0, 1), r: R(0.6, 2), s: R(0.3, 1) })) }; },
  draw(c, s, t, dt, W, H, acc, A) {
    const K = pencil(c, t, s), m = Math.min(W, H);
    ink(c, P); let i = 0; for (let y = 70; y < H; y += 62, i++) { A(0.16); K.line(0, y, W, y, K.P(i * 0.08, 1), 1.4); }
    // ensō, brushed once then resting
    const cyc = RM ? 1 : (t - s.t0) * 0.00012 % 1.6, prog = clamp(cyc / 0.7), fade = cyc > 1.35 ? 1 - (cyc - 1.35) / 0.25 : 1, ease = 1 - Math.pow(1 - prog, 3), cx = W > 900 ? W * 0.72 : W * 0.5, cy = W > 900 ? H * 0.5 : H * 0.6, r = m * 0.23;
    c.strokeStyle = acc;
    for (let k = 0; k < 6; k++) { c.lineWidth = 17 - k * 3; A((0.12 + k * 0.07) * fade); c.beginPath(); c.arc(cx + k * 1.4, cy - k, r - k * 2.3 + Math.sin(k * 5) * 2, -1.2, -1.2 + 5.9 * ease * (1 - k * 0.014)); c.stroke(); }
    c.lineWidth = 1.35;
    // notebook, pen, cup
    let x = W * 0.9, y = H * 0.2, p = K.P(1.2);
    ink(c, P); A(0.75); K.rect(x, y, 120, 150, 0.08, p); A(0.35); for (let k = 0; k < 5; k++) K.line(x - 40 + k * 2, y - 40 + k * 22, x + 44 + k * 2, y - 34 + k * 22, K.P(1.8 + k * 0.1, 0.4));
    A(0.75); K.line(x - 110, y + 70, x - 190, y - 40, K.P(2)); K.line(x - 104, y + 66, x - 184, y - 44, K.P(2)); K.line(x - 110, y + 70, x - 104, y + 66, K.P(2.6, 0.2));
    x = W * 0.9; y = H * 0.8; p = K.P(1.6);
    A(0.75); K.curve([[x - 44, y - 40], [x - 40, y + 10], [x - 22, y + 34], [x + 22, y + 34], [x + 40, y + 10], [x + 44, y - 40]], p); K.curve([[x - 44, y - 40], [x, y - 32], [x + 44, y - 40], [x, y - 48], [x - 44, y - 40]], p);
    A(0.4); for (let k = 0; k < 2; k++) { const sw = Math.sin(t * 0.0015 + k) * 6; K.curve([[x - 10 + k * 20, y - 56], [x - 16 + k * 20 + sw, y - 76], [x - 6 + k * 20 - sw, y - 96], [x - 12 + k * 20, y - 116]], K.P(2.4)); }
    for (const d of s.p) { d.y -= dt * 0.000012 * d.s; if (d.y < 0) d.y = 1; A(0.2 * d.s + 0.06); c.beginPath(); c.arc(d.x * W, d.y * H, d.r, 0, 7); c.fill(); }
    A(0.6 * K.P(2.8)); K.text('less, but better.', W * 0.62, H * 0.14, 30, -0.03); ink(c, acc); A(0.8 * K.P(3)); K.text('online ⇄ store', W * 0.63, H * 0.9, 28, -0.04);
  }
};

/* ---------- Leadership & commitments: under the sea (sea-life association) ---------- */
FX.ocean = {
  init() {
    return {
      fish: Array.from({ length: 13 }, (_, i) => ({ x: R(0, 1), y: R(0.2, 0.86), z: i === 0 ? 46 : R(12, 26), sp: R(0.5, 1.2), ph: R(0, 6.28), hot: i === 0 || Math.random() < 0.25 })),
      bub: Array.from({ length: 26 }, () => ({ x: R(0, 1), y: R(0, 1), r: R(2, 7), sp: R(0.4, 1) })),
      weed: Array.from({ length: 16 }, (_, i) => ({ x: (i + R(0, 0.8)) / 16, h: R(60, 170), ph: R(0, 6.28) }))
    };
  },
  draw(c, s, t, dt, W, H, acc, A) {
    const K = pencil(c, t, s);
    // surface + light rays
    ink(c, P);
    for (let i = 0; i < 3; i++) { const pts = []; for (let x = -20; x <= W + 20; x += 30) pts.push([x, H * (0.1 + i * 0.035) + Math.sin(x * 0.012 + t * 0.0008 + i * 1.7) * 9]); A(0.5 - i * 0.13); K.curve(pts, K.P(i * 0.2, 1.2), 1.2); }
    ink(c, acc); for (let i = 0; i < 6; i++) { const x = W * (0.12 + i * 0.16) + Math.sin(t * 0.0003 + i) * 30; A(0.16); K.line(x, H * 0.14, x - 110, H * 0.62, K.P(0.6 + i * 0.1, 0.8), 3); }
    // seaweed
    for (const w of s.weed) { const pts = []; for (let k = 0; k <= 1.001; k += 0.125) pts.push([w.x * W + Math.sin(t * 0.0012 + w.ph + k * 4) * 14 * k, H - k * w.h]); ink(c, acc); A(0.5); K.curve(pts, K.P(0.8 + w.x, 0.9), 1); }
    ink(c, P); A(0.5); K.line(-10, H - 2, W + 10, H - 2, K.P(0.2, 1), 3);
    // fish
    for (const f of s.fish) {
      f.x += dt * 0.00003 * f.sp; if (f.x > 1.15) { f.x = -0.15; f.y = R(0.2, 0.86); }
      const x = f.x * W, y = f.y * H + Math.sin(t * 0.001 + f.ph) * 10, z = f.z, wag = Math.sin(t * 0.008 * f.sp + f.ph) * z * 0.22, body = [];
      for (let a = 0; a <= 6.4; a += 0.42) body.push([x + Math.cos(a) * z, y + Math.sin(a) * z * 0.44]);
      ink(c, f.hot ? acc : P); A(f.hot ? 0.95 : 0.6); K.curve(body, K.P(1, 0.5), z * 0.03 + 0.5);
      K.poly([[x - z * 0.95, y], [x - z * 1.6, y - z * 0.42 + wag], [x - z * 1.6, y + z * 0.42 + wag]], true, K.P(1.2, 0.4), 1);
      K.line(x + z * 0.1, y - z * 0.42, x - z * 0.2, y - z * 0.75, K.P(1.4, 0.3), 1); K.line(x - z * 0.2, y - z * 0.75, x - z * 0.45, y - z * 0.36, K.P(1.4, 0.3), 1);
      c.beginPath(); c.arc(x + z * 0.6, y - z * 0.08, Math.max(1.4, z * 0.06), 0, 7); c.fill();
    }
    // bubbles
    ink(c, P);
    for (const b of s.bub) { b.y -= dt * 0.00005 * b.sp; if (b.y < 0.12) { b.y = 1.02; b.x = R(0, 1); } A(0.4); c.beginPath(); c.arc(b.x * W + Math.sin(t * 0.002 + b.r) * 6, b.y * H, b.r, 0, 7); c.stroke(); }
  }
};

/* ---------- Table tennis: a rally in a packed arena ---------- */
FX.stadium = {
  init() { const crowd = []; for (let r = 0; r < 5; r++) for (let i = 0; i < 52; i++) crowd.push({ r, u: (i + R(0, 0.8)) / 52, ph: R(0, 6.28), a: Math.random() < 0.16 }); return { crowd, trail: [], pts: [0, 0], lastU: 0 }; },
  draw(c, s, t, dt, W, H, acc, A) {
    const K = pencil(c, t, s), wide = W > 900, ox = wide ? W * 0.57 : W * 0.04, fw = W - ox;
    const rowY = (r, u) => H * (0.2 + r * 0.058) - Math.pow(u - 0.5, 2) * H * 0.22;
    // floodlights
    [0.16, 0.5, 0.84].forEach((fx, i) => {
      const x = W * fx, y = -14;
      c.fillStyle = acc; A(0.05 + 0.015 * Math.sin(t * 0.002 + i)); c.beginPath(); c.moveTo(x - 30, y + 10); c.lineTo(x + 30, y + 10); c.lineTo(x + 330, H); c.lineTo(x - 330, H); c.fill();
    });
    // stands + crowd
    for (let r = 0; r < 5; r++) { const pts = []; for (let u = 0; u <= 1.001; u += 0.04) pts.push([u * W, rowY(r, u)]); ink(c, P); A(0.4); K.curve(pts, K.P(0.3 + r * 0.15, 1), 1.2); }
    const u = (t * 0.0007) % 2, v = u < 1 ? u : u - 1, cheer = v > 0.74 ? 1 : 0.25;
    c.lineWidth = 1.2;
    for (const p of s.crowd) { const x = p.u * W, y = rowY(p.r, p.u) - 8 - Math.abs(Math.sin(t * 0.006 + p.ph)) * 5 * cheer; c.strokeStyle = p.a ? acc : P; A((p.a ? 0.9 : 0.45) * K.P(0.9 + p.r * 0.15, 0.6)); c.beginPath(); c.arc(x, y, 4, 0, 7); c.stroke(); c.beginPath(); c.moveTo(x - 5, y + 11); c.quadraticCurveTo(x, y + 3, x + 5, y + 11); c.stroke(); }
    c.lineWidth = 1.35;
    // court boards
    ink(c, P); const by0 = H * 0.56;
    for (let i = 0; i < 9; i++) { const x = (i + 0.5) / 9 * W; A(0.5); K.rect(x, by0, W / 9 - 10, 34, 0, K.P(1.2 + i * 0.06, 0.5)); }
    // table, net, paddles, ball
    const xl = ox + fw * 0.14, xr = ox + fw * 0.86, ty = H * 0.76, mid = (xl + xr) / 2;
    A(0.95); K.line(xl - 30, ty, xr + 30, ty, K.P(1.6, 0.8), 2); K.line(xl - 30, ty + 8, xr + 30, ty + 8, K.P(1.7, 0.8), 2); K.line(xl - 4, ty + 8, xl + 14, ty + 100, K.P(2)); K.line(xr + 4, ty + 8, xr - 14, ty + 100, K.P(2));
    A(0.7); K.line(mid, ty, mid, ty - 36, K.P(2.1)); K.hatch(() => { c.beginPath(); c.rect(mid - 5, ty - 36, 10, 36); }, mid - 5, ty - 36, 10, 36, 5, K.P(2.2));
    const bounce = 0.74, x = u < 1 ? xl + (xr - xl) * v : xr - (xr - xl) * v, seg = v < bounce ? v / bounce : (v - bounce) / (1 - bounce), by = ty - 9 - (v < bounce ? H * 0.26 : H * 0.08) * Math.sin(Math.PI * seg);
    [[xl - 40, u >= 1 && v > 0.8 || u < 1 && v < 0.12], [xr + 40, u < 1 && v > 0.8 || u >= 1 && v < 0.12]].forEach(([px, hit], i) => { const py = ty - 74 - (hit ? 26 : 0), dir = i ? -1 : 1; ink(c, acc); A(0.95); K.circ(px, py, 27, K.P(2.2)); A(0.7); K.hatch(() => { c.beginPath(); c.arc(px, py, 27, 0, 7); }, px - 27, py - 27, 54, 54, 6, K.P(2.5)); ink(c, P); A(0.85); K.line(px - dir * 14, py + 23, px - dir * 30, py + 52, K.P(2.3), 1); K.line(px - dir * 8, py + 27, px - dir * 24, py + 56, K.P(2.3), 1); });
    s.trail.push([x, by]); if (s.trail.length > 14) s.trail.shift();
    ink(c, P); s.trail.forEach((p, i) => { if (i % 2) { A(i / 14 * 0.6); c.beginPath(); c.arc(p[0], p[1], 1.6, 0, 7); c.fill(); } });
    A(1); c.fillStyle = BG; c.beginPath(); c.arc(x, by, 8, 0, 7); c.fill(); ink(c, P); K.circ(x, by, 8, 1, 0.1);
    // scoreboard
    if (u < s.lastU) s.pts[s.pts[0] <= s.pts[1] ? 0 : 1] = (s.pts[s.pts[0] <= s.pts[1] ? 0 : 1] + 1) % 12; s.lastU = u;
    const sbx = mid, sby = H * 0.47, sp = K.P(2.6);
    A(1); c.fillStyle = BG; c.fillRect(sbx - 70, sby - 28, 140, 56); ink(c, P); A(0.9); K.rect(sbx, sby, 140, 56, 0, sp); ink(c, acc); A(0.95 * sp); K.text(s.pts[0] + '  :  ' + s.pts[1], sbx, sby + 13, 40, 0, HAND, 'center');
  }
};

/* ---------- Piano: a grand piano on a concert-hall stage ---------- */
FX.concert = {
  init() { return { notes: [], last: 0, n: 0 }; },
  draw(c, s, t, dt, W, H, acc, A) {
    const K = pencil(c, t, s), wide = W > 900, px = wide ? W * 0.79 : W * 0.56, fy = H * 0.8, u = Math.min(W, H) / 820, q = (a, b) => [px + a * u, fy - b * u];
    // spotlight
    c.fillStyle = acc; A(0.07 + 0.015 * Math.sin(t * 0.0015)); c.beginPath(); c.moveTo(px - 30, 0); c.lineTo(px + 30, 0); c.lineTo(px + 330 * u, fy); c.lineTo(px - 330 * u, fy); c.fill();
    A(0.1); c.beginPath(); c.ellipse(px, fy + 6, 330 * u, 22, 0, 0, 7); c.fill();
    // curtains + valance
    ink(c, acc);
    for (const sg of [0, 1]) for (let i = 0; i < 7; i++) { const pts = []; for (let y = 0; y <= H * 0.86; y += 40) { const xx = i * W * 0.017 + Math.sin(y * 0.008 + i * 1.3 + t * 0.0004) * 7 + (y / H) * i * 5; pts.push([sg ? W - xx : xx, y]); } A(0.75 - i * 0.07); K.curve(pts, K.P(i * 0.12, 1), 1); }
    const val = []; for (let x = 0; x <= W + 1; x += 18) val.push([x, 62 + Math.abs(Math.sin(x / W * Math.PI * 7)) * 30]); A(0.8); K.curve(val, K.P(0.4, 1.2), 1.2); A(0.22); K.hatch(() => { c.beginPath(); c.moveTo(0, 0); val.forEach(p => c.lineTo(p[0], p[1])); c.lineTo(W, 0); c.closePath(); }, 0, 0, W, 90, 12, K.P(1, 1.4));
    // stage
    ink(c, P); A(0.8); K.line(-10, fy, W + 10, fy, K.P(0.3, 1.2), 2.4); A(0.3); K.line(-10, fy + 14, W + 10, fy + 14, K.P(0.5, 1.2), 2.4);
    // grand piano
    const body = [q(-170, 60), q(-170, 96), q(150, 96), q(178, 82), q(178, 60)], clip = () => { c.beginPath(); body.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); };
    A(1); c.fillStyle = BG; clip(); c.fill();
    ink(c, P); A(0.95); K.poly(body, true, K.P(1, 1)); A(0.35); K.hatch(clip, px - 180 * u, fy - 100 * u, 370 * u, 44 * u, 7, K.P(1.8, 1));
    A(0.95); K.poly([q(-170, 76), q(-212, 76), q(-212, 62), q(-170, 62)], false, K.P(1.6)); for (let k = 0; k < 6; k++) K.line(...q(-206 + k * 6, 76), ...q(-206 + k * 6, 66), K.P(2 + k * 0.05, 0.2), 0.6);
    K.line(...q(-150, 96), ...q(150, 200), K.P(2, 0.8), 2); K.curve([q(150, 200), q(176, 176), q(186, 140), q(178, 96)], K.P(2.6, 0.5), 1); K.line(...q(74, 96), ...q(100, 182), K.P(2.9, 0.4));
    K.poly([q(-158, 96), q(-150, 128), q(-112, 128), q(-104, 96)], false, K.P(2.4));
    for (const lx of [-150, 0, 150]) { K.line(...q(lx - 5, 60), ...q(lx - 3, 10), K.P(1.9)); K.line(...q(lx + 5, 60), ...q(lx + 3, 10), K.P(1.9)); K.circ(...q(lx, 5), 5 * u, K.P(2.2), 0.1); }
    K.line(...q(-72, 60), ...q(-68, 16), K.P(2.3)); K.line(...q(-52, 60), ...q(-56, 16), K.P(2.3)); K.line(...q(-78, 14), ...q(-46, 14), K.P(2.5));
    K.rect(...q(-272, 52), 64 * u, 12 * u, 0, K.P(2.6)); K.line(...q(-296, 46), ...q(-300, 0), K.P(2.8)); K.line(...q(-248, 46), ...q(-244, 0), K.P(2.8));
    // audience
    for (let i = 0, n = Math.ceil(W / 46) + 1; i < n; i++) { const x = i * 46 + (i % 2) * 8, y = H * 0.975 + Math.sin(i * 2.3) * 6; A(1); c.fillStyle = BG; c.beginPath(); c.arc(x, y, 15, 0, 7); c.fill(); c.fillRect(x - 24, y + 12, 48, 40); ink(c, P); A(0.6); K.circ(x, y, 15, K.P(0.6 + i * 0.03, 0.4), 0.08); K.curve([[x - 24, y + 34], [x - 18, y + 18], [x, y + 14], [x + 18, y + 18], [x + 24, y + 34]], K.P(0.8 + i * 0.03, 0.4), 1); }
    // notes flying out of the piano
    if (t - s.last > 520 && !RM && K.age > 2.6) { s.last = t; s.notes.push({ x: px + R(-60, 120) * u, y: fy - R(120, 190) * u, a: 1, g: ['♪', '♫', '♩', '♬'][s.n++ % 4], z: R(26, 48), vx: R(-0.03, 0.05), ph: R(0, 6.28), hot: s.n % 3 === 0 }); }
    s.notes = s.notes.filter(n => n.a > 0);
    for (const n of s.notes) { n.y -= dt * 0.055; n.x += dt * n.vx + Math.sin(t * 0.003 + n.ph) * 0.6; n.a -= dt * 0.00022; c.fillStyle = n.hot ? acc : P; A(Math.max(0, Math.min(1, n.a * 1.4))); c.save(); c.translate(n.x, n.y); c.rotate(Math.sin(t * 0.002 + n.ph) * 0.3); c.font = Math.round(n.z) + 'px serif'; c.fillText(n.g, 0, 0); c.restore(); }
  }
};

/* =========================================================
   LANGUAGE SCENES (Toolkit section) — one per language
   ========================================================= */

/* Japanese: Mount Fuji, sakura in the wind, kanji written by hand */
FX.fuji = {
  init() {
    return {
      petals: Array.from({ length: 70 }, () => ({ x: R(0, 1.2), y: R(-0.1, 1), s: R(5, 11), vx: R(0.5, 1.3), vy: R(0.25, 0.7), r: R(0, 6.28), vr: R(-2, 2), ph: R(0, 6.28) })),
      cols: [['一期一会', 0.58, 0.13], ['七転八起', 0.95, 0.12], ['継続は力なり', 0.65, 0.15], ['挑戦', 0.58, 0.46], ['日本語', 0.975, 0.5]].map(([txt, x, y], i) => ({ txt, x, y, ph: i * 1.3 })),
      wind: Array.from({ length: 5 }, (_, i) => ({ y: R(0.12, 0.7), ph: R(0, 1), sp: R(0.5, 1) }))
    };
  },
  draw(c, s, t, dt, W, H, acc, A) {
    const K = pencil(c, t, s), wide = W > 900, px = wide ? W * 0.74 : W * 0.5, py = H * 0.4, base = H * 0.95, hw = wide ? W * 0.36 : W * 0.6, m = Math.min(W, H);
    // sun: scribbled
    const sx = px + hw * 0.36, sy = py - H * 0.07, sr = m * 0.15;
    ink(c, acc); A(0.9); K.circ(sx, sy, sr, K.P(0, 1.2)); A(0.5); K.hatch(() => { c.beginPath(); c.arc(sx, sy, sr, 0, 7); }, sx - sr, sy - sr, sr * 2, sr * 2, 8, K.P(0.5, 1.4));
    // kanji columns, appearing stroke by stroke
    c.fillStyle = P;
    for (const k of s.cols) [...k.txt].forEach((ch, i) => { A((0.28 + 0.2 * (0.5 + 0.5 * Math.sin(t * 0.0005 + k.ph))) * K.P(1.5 + k.ph * 0.3 + i * 0.25, 0.5)); K.text(ch, k.x * W, k.y * H + i * 44, 36, 0, HAND_JP, 'center'); });
    // mountain
    const side = sg => { const pts = []; for (let k = 0; k <= 1.001; k += 0.05) { const a = 1 - k, x0 = px + sg * hw, x1 = px + sg * hw * 0.34, x2 = px + sg * hw * 0.075, y1 = base - (base - py) * 0.42; pts.push([a * a * x0 + 2 * a * k * x1 + k * k * x2, a * a * base + 2 * a * k * y1 + k * k * py]); } return pts; };
    const L = side(-1), Rr = side(1), crater = [[px - hw * 0.035, py + 7], [px + hw * 0.02, py + 2]];
    const clip = () => { c.beginPath(); L.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); crater.forEach(q => c.lineTo(q[0], q[1])); [...Rr].reverse().forEach(q => c.lineTo(q[0], q[1])); c.closePath(); };
    A(1); c.fillStyle = BG; clip(); c.fill();
    ink(c, P); A(0.9); K.curve(L, K.P(0.3, 1.2)); K.curve([L[L.length - 1], ...crater, Rr[Rr.length - 1]], K.P(1.4, 0.3), 1); K.curve([...Rr].reverse(), K.P(1.6, 1.2));
    // snow line + shading
    const sh = (base - py) * 0.2, zig = []; for (let k = 0; k <= 12; k++) zig.push([px - hw * 0.4 + k * (hw * 0.8 / 12), py + sh + (k % 2 ? -sh * 0.42 : sh * 0.2) + (k % 3) * 6]);
    c.save(); clip(); c.clip(); A(0.9); K.curve(zig, K.P(2.4, 0.8), 1.5);
    A(0.5); K.hatch(() => { c.beginPath(); c.moveTo(px - hw, py - 30); c.lineTo(px + hw, py - 30); [...zig].reverse().forEach(q => c.lineTo(q[0], q[1])); c.closePath(); }, px - hw * 0.5, py - 20, hw, sh * 1.6, 6, K.P(2.8, 0.8));
    A(0.16); K.hatch(() => { c.beginPath(); c.moveTo(px + hw * 0.03, py); c.lineTo(px + hw, base); c.lineTo(px + hw * 0.3, base); c.closePath(); }, px, py, hw, base - py, 14, K.P(3, 1.4));
    c.restore();
    // torii gate
    const gx = wide ? W * 0.62 : W * 0.14, gy = H * 0.93, g = 52, gp = K.P(2.2);
    ink(c, acc); A(0.95); K.line(gx - g * 0.7, gy, gx - g * 0.6, gy - g * 1.5, gp); K.line(gx + g * 0.7, gy, gx + g * 0.6, gy - g * 1.5, gp); K.line(gx - g * 1.1, gy - g * 1.55, gx + g * 1.1, gy - g * 1.55, gp, 2.4); K.line(gx - g * 1.15, gy - g * 1.68, gx + g * 1.15, gy - g * 1.68, gp, 2.4); K.line(gx - g * 0.8, gy - g * 1.15, gx + g * 0.8, gy - g * 1.15, gp);
    // wind strokes
    ink(c, P);
    for (const w of s.wind) { const k = (t * 0.00012 * w.sp + w.ph) % 1, x = W * (1.2 - k * 1.5), y = w.y * H; A(0.3 * Math.sin(k * Math.PI)); const pts = []; for (let d = 0; d <= 260; d += 13) pts.push([x + 260 - d, y + Math.sin(d * 0.03 + w.ph * 6) * 9 - d * 0.03]); K.curve(pts, 1, 0.8); }
    // petals
    const gust = 1 + 0.6 * Math.sin(t * 0.0004);
    for (const p of s.petals) {
      p.x -= dt * 0.00009 * p.vx * gust; p.y += dt * 0.00006 * p.vy + Math.sin(t * 0.001 + p.ph) * 0.0006 * (dt ? 1 : 0); p.r += dt * 0.001 * p.vr;
      if (p.x < -0.05 || p.y > 1.05) { p.x = R(0.4, 1.25); p.y = p.x < 1 ? -0.05 : R(-0.2, 0.5); }
      c.save(); c.translate(p.x * W, p.y * H); c.rotate(p.r); const q = p.s, sq = 0.45 + 0.4 * Math.abs(Math.sin(p.r * 0.7));
      c.beginPath(); c.moveTo(-q, 0); c.quadraticCurveTo(0, -q * sq, q, 0); c.quadraticCurveTo(q * 0.75, q * sq * 0.5, q * 0.55, q * sq * 0.2); c.quadraticCurveTo(0, q * sq, -q, 0);
      c.fillStyle = acc; A(0.5); c.fill(); c.strokeStyle = acc; c.lineWidth = 1; A(0.95); c.stroke(); c.restore();
    }
  }
};

/* French: iron tower sketched line by line */
FX.paris = {
  init() { return { w: words(['Bonjour', 'savoir-faire', 'élan', 'stratégie', 'lancement', 'marché', 'marque'], HAND) }; },
  draw(c, s, t, dt, W, H, acc, A) {
    const K = pencil(c, t, s), tx = W > 900 ? W * 0.74 : W * 0.5, tb = H * 0.98, th = H * 0.82, tw = Math.min(190, W * 0.2);
    drawWords(c, K, s.w, t, dt, W, H, A);
    const hw = k => tw * Math.pow(1 - k, 2.1) + 3, leg = (sg, f) => { const pts = []; for (let k = 0; k <= 1.001; k += 0.06) pts.push([tx + sg * hw(k) * f, tb - th * k]); return pts; };
    ink(c, acc); A(0.95); K.curve(leg(-1, 1), K.P(0, 1.4)); K.curve(leg(1, 1), K.P(0.2, 1.4)); A(0.6); K.curve(leg(-1, 0.5), K.P(0.5, 1.4)); K.curve(leg(1, 0.5), K.P(0.7, 1.4));
    A(0.95); K.line(tx, tb - th, tx, tb - th - 50, K.P(1.8, 0.4));
    K.curve([[tx - tw * 0.5, tb], [tx - tw * 0.3, tb - th * 0.1], [tx, tb - th * 0.14], [tx + tw * 0.3, tb - th * 0.1], [tx + tw * 0.5, tb]], K.P(1.4));
    [0.2, 0.42, 0.7].forEach((k, i) => { K.rect(tx, tb - th * k, hw(k) * 2 + 12, 11, 0, K.P(1.6 + i * 0.3)); });
    A(0.45); let i = 0; for (let k = 0.03; k < 0.9; k += 0.058, i++) { const q = K.P(1.8 + i * 0.09, 0.3); K.line(tx - hw(k), tb - th * k, tx + hw(k + 0.058), tb - th * (k + 0.058), q, 1); K.line(tx + hw(k), tb - th * k, tx - hw(k + 0.058), tb - th * (k + 0.058), q, 1); }
    ink(c, P); A(0.5 + 0.5 * Math.abs(Math.sin(t * 0.003))); const d = 9; K.line(tx - d, tb - th - 50, tx + d, tb - th - 50, K.P(2.6, 0.2), 1); K.line(tx, tb - th - 50 - d, tx, tb - th - 50 + d, K.P(2.6, 0.2), 1);
    // clouds + birds
    [[0.5, 0.2, 80], [0.92, 0.36, 70], [0.1, 0.9, 60]].forEach((cl, k) => { const x = ((cl[0] * W + t * 0.006) % (W + 300)) - 150 + 0, y = cl[1] * H, w = cl[2]; A(0.45); cloud(K, x, y, w, K.P(1 + k * 0.4)); });
    for (let k = 0; k < 3; k++) { const x = W * 0.56 + k * 34 + Math.sin(t * 0.0006 + k) * 12, y = H * 0.3 - k * 16 + Math.cos(t * 0.0008 + k) * 6, fl = Math.sin(t * 0.008 + k) * 4; A(0.7 * K.P(2.6)); K.line(x - 10, y - fl, x, y, 1, 0.8); K.line(x, y, x + 10, y - fl, 1, 0.8); }
  }
};

/* English: a sketched globe with flight paths */
FX.rings = {
  init() { return { w: words(['Hello', 'go-to-market', 'insight', 'launch', 'strategy', 'growth', 'brand'], HAND) }; },
  draw(c, s, t, dt, W, H, acc, A) {
    const K = pencil(c, t, s), cx = W > 900 ? W * 0.74 : W * 0.5, cy = H * 0.5, r = Math.min(W * 0.4, H * 0.36);
    drawWords(c, K, s.w, t, dt, W, H, A);
    ink(c, P); A(0.85); K.circ(cx, cy, r, K.P(0, 1.2), 0.04);
    for (let i = 0; i < 5; i++) { const k = Math.abs(Math.cos(t * 0.00022 + i * Math.PI / 5)), pts = []; for (let a = 0; a <= 6.4; a += 0.26) pts.push([cx + Math.cos(a) * r * k, cy + Math.sin(a) * r]); ink(c, acc); A(0.25 + 0.45 * k); K.curve(pts, K.P(0.6 + i * 0.2, 1), 1.2); }
    ink(c, P); for (let i = -2; i <= 2; i++) { const y = cy + i * r / 3, w2 = Math.sqrt(Math.max(0, r * r - (i * r / 3) ** 2)); A(0.35); K.curve([[cx - w2, y], [cx - w2 * 0.5, y + 8], [cx, y + 11], [cx + w2 * 0.5, y + 8], [cx + w2, y]], K.P(1.6 + (i + 2) * 0.15, 0.6), 1); }
    // stand
    A(0.7); K.line(cx, cy + r, cx, cy + r + 40, K.P(2.2, 0.3)); K.line(cx - 70, cy + r + 40, cx + 70, cy + r + 40, K.P(2.4, 0.3), 2.4);
    // little plane circling
    const a = t * 0.0004, px = cx + Math.cos(a) * r * 1.22, py = cy + Math.sin(a) * r * 0.5;
    A(0.4); for (let k = 0.08; k < 1.2; k += 0.09) { c.beginPath(); c.arc(cx + Math.cos(a - k) * r * 1.22, cy + Math.sin(a - k) * r * 0.5, 1.4, 0, 7); c.fill(); }
    c.save(); c.translate(px, py); c.rotate(Math.atan2(Math.cos(a) * 0.5, -Math.sin(a) * 1.22)); ink(c, acc); A(0.95); K.poly([[16, 0], [-12, -9], [-6, 0], [-12, 9]], true); c.restore();
  }
};

/* Spanish: a scribbled sun */
FX.sol = {
  init() { return { w: words(['Hola', 'mercado', 'estrategia', 'lanzamiento', 'marca', 'crecimiento'], HAND) }; },
  draw(c, s, t, dt, W, H, acc, A) {
    const K = pencil(c, t, s), cx = W > 900 ? W * 0.74 : W * 0.5, cy = H * 0.5, r = Math.min(W, H) * 0.17;
    drawWords(c, K, s.w, t, dt, W, H, A);
    ink(c, acc); A(0.95); K.circ(cx, cy, r, K.P(0, 1)); A(0.7); K.hatch(() => { c.beginPath(); c.arc(cx, cy, r, 0, 7); }, cx - r, cy - r, r * 2, r * 2, 7, K.P(0.5, 1.2));
    for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283 + t * 0.00012, l0 = r * 1.22, l1 = r * (i % 2 ? 1.75 : 2.2), p = K.P(1 + i * 0.07, 0.4); A(0.9); K.line(cx + Math.cos(a) * l0, cy + Math.sin(a) * l0, cx + Math.cos(a) * l1, cy + Math.sin(a) * l1, p, 2.4); if (i % 2 === 0) { const wv = []; for (let k = 0; k <= 1; k += 0.2) wv.push([cx + Math.cos(a + 0.2 + Math.sin(k * 9) * 0.03) * (l0 + (l1 - l0) * k), cy + Math.sin(a + 0.2 + Math.sin(k * 9) * 0.03) * (l0 + (l1 - l0) * k)]); A(0.5); K.curve(wv, p, 1); } }
    // horizon with waves
    ink(c, P); for (let i = 0; i < 4; i++) { const pts = []; for (let x = -20; x <= W + 20; x += 34) pts.push([x, H * (0.86 + i * 0.04) + Math.sin(x * 0.02 + t * 0.001 + i * 2) * 6]); A(0.45 - i * 0.08); K.curve(pts, K.P(1.6 + i * 0.2, 1.2), 1.2); }
  }
};

/* Mandarin: ink mountains, lanterns, brush characters */
FX.ink = {
  init() { return { w: words(['你好', '市场', '学习', '品牌', '策略', '深圳'], HAND_ZH) }; },
  draw(c, s, t, dt, W, H, acc, A) {
    const K = pencil(c, t, s);
    drawWords(c, K, s.w, t, dt, W, H, A);
    const sx = W * 0.78, sy = H * 0.3, sr = Math.min(W, H) * 0.1;
    ink(c, acc); A(0.9); K.circ(sx, sy, sr, K.P(0, 1)); A(0.6); K.hatch(() => { c.beginPath(); c.arc(sx, sy, sr, 0, 7); }, sx - sr, sy - sr, sr * 2, sr * 2, 7, K.P(0.5));
    [[0.56, 110, 0.004, 0, 0.5], [0.68, 80, 0.006, 2, 0.7], [0.82, 56, 0.009, 4, 0.9]].forEach(([y0, amp, fq, ph, al], li) => {
      const pts = []; for (let x = -20; x <= W + 20; x += 22) pts.push([x, H * y0 - Math.abs(Math.sin(x * fq + ph)) * amp - Math.sin(x * fq * 2.7 + ph) * amp * 0.3]);
      const clip = () => { c.beginPath(); c.moveTo(-20, H); pts.forEach(q => c.lineTo(q[0], q[1])); c.lineTo(W + 20, H); c.closePath(); };
      A(1); c.fillStyle = BG; clip(); c.fill(); ink(c, P); A(al); K.curve(pts, K.P(0.4 + li * 0.5, 1.4));
      A(0.14 + li * 0.05); K.hatch(clip, 0, H * y0 - amp * 1.3, W, amp * 1.6, 16 - li * 3, K.P(1.2 + li * 0.5, 1.4));
    });
    // lanterns
    [[0.5, 0.2], [0.64, 0.13], [0.93, 0.17], [0.03, 0.72]].forEach(([fx, fy], i) => {
      const sw = Math.sin(t * 0.0012 + i * 2) * 0.09, y = H * fy, p = K.P(1.8 + i * 0.3);
      c.save(); c.translate(W * fx, y - 120); c.rotate(sw); ink(c, P); A(0.6); K.line(0, 0, 0, 96, p, 1);
      const clip = () => { c.beginPath(); c.ellipse(0, 120, 19, 24, 0, 0, 7); };
      A(1); c.fillStyle = BG; clip(); c.fill(); ink(c, acc); A(0.95); K.circ(0, 120, 21, p, 0.12); A(0.8); K.hatch(clip, -20, 96, 40, 48, 5, K.P(2.2 + i * 0.3));
      A(0.95); K.line(-9, 97, 9, 97, p, 1); K.line(-9, 143, 9, 143, p, 1); K.line(0, 144, 0, 166, p, 1); K.line(-4, 146, -5, 162, p, 1); K.line(4, 146, 5, 162, p, 1); c.restore();
    });
  }
};

/* =========================================================
   TOOL SCENES (Toolkit → Tools & skills) — hovering a tool sketches
   a window that evokes its interface. One drawing per kind of tool.
   ========================================================= */
const UI = {
  /* spreadsheet */
  sheet(c, K, A, acc, x, y, w, h, t) {
    const cols = 6, rows = 9, cw = w / cols, rh = h / (rows + 1);
    ink(c, P); A(0.5); for (let i = 0; i <= cols; i++) K.line(x + i * cw, y, x + i * cw, y + h, K.P(0.8 + i * 0.06, 0.5), 1); for (let j = 0; j <= rows + 1; j++) K.line(x, y + j * rh, x + w, y + j * rh, K.P(1 + j * 0.05, 0.5), 1);
    c.fillStyle = P; 'ABCDEF'.split('').forEach((l, i) => { A(0.6 * K.P(1.4)); K.text(l, x + i * cw + cw / 2, y + rh * 0.72, 20, 0, HAND, 'center'); });
    const vals = [[120, 96, 143, 171], [88, 110, 132, 158], [64, 71, 85, 102], [40, 52, 49, 77]];
    vals.forEach((r, j) => r.forEach((v, i) => { A(0.75 * K.P(1.6 + (j * 4 + i) * 0.08, 0.3)); K.text(String(v), x + (i + 1) * cw + cw / 2, y + (j + 2) * rh - rh * 0.28, 20, 0, HAND, 'center'); }));
    ink(c, acc); A(0.95); K.rect(x + 4.5 * cw, y + 6.5 * rh, cw, rh, 0, K.P(2.6, 0.4)); A(0.95 * K.P(3)); K.text('=SUM(B2:E5)', x + cw * 0.2, y + 6.5 * rh + 7, 22); K.text('1 558', x + 4.5 * cw, y + 6.5 * rh + 7, 22, 0, HAND, 'center');
    [0.35, 0.5, 0.7, 0.95].forEach((v, i) => { const bx = x + cw * (1.3 + i * 0.75), bh = rh * 2.2 * v * K.P(3.2 + i * 0.15, 0.4), by = y + h - 6; if (bh > 1) { A(0.8); K.hatch(() => { c.beginPath(); c.rect(bx, by - bh, cw * 0.5, bh); }, bx, by - bh, cw * 0.5, bh, 6); K.rect(bx + cw * 0.25, by - bh / 2, cw * 0.5, bh); } });
  },
  /* dashboard */
  dash(c, K, A, acc, x, y, w, h, t) {
    ['+18%', '1.2×', '4.6k'].forEach((v, i) => { const tx = x + (i + 0.5) * w / 3; ink(c, P); A(0.7); K.rect(tx, y + h * 0.1, w / 3 - 16, h * 0.18, 0, K.P(0.8 + i * 0.2, 0.5)); ink(c, i === 1 ? acc : P); A(0.95 * K.P(1.4 + i * 0.2)); K.text(v, tx, y + h * 0.13, 34, 0, HAND, 'center'); });
    const by = y + h * 0.92; ink(c, P); A(0.6); K.line(x, by, x + w * 0.46, by, K.P(1.4)); K.line(x, by, x, y + h * 0.3, K.P(1.4));
    [0.3, 0.55, 0.42, 0.8, 0.66, 0.95].forEach((v, i) => { const bx = x + 14 + i * w * 0.072, bw = w * 0.05, bh = h * 0.55 * v * K.P(1.8 + i * 0.12, 0.5); if (bh > 1) { ink(c, i === 5 ? acc : P); A(i === 5 ? 0.9 : 0.5); K.hatch(() => { c.beginPath(); c.rect(bx, by - bh, bw, bh); }, bx, by - bh, bw, bh, 6); K.rect(bx + bw / 2, by - bh / 2, bw, bh); } });
    const lx = x + w * 0.54, lw = w * 0.46, pts = [0.7, 0.62, 0.66, 0.5, 0.42, 0.46, 0.3, 0.2].map((v, i) => [lx + i * lw / 7, y + h * (0.3 + v * 0.3)]);
    ink(c, acc); A(0.95); K.curve(pts, K.P(2.2, 1), 0.8); pts.forEach((p, i) => { A(0.95 * K.P(2.3 + i * 0.12, 0.2)); c.beginPath(); c.arc(p[0], p[1], 3.5, 0, 7); c.fill(); });
    const dx = lx + lw * 0.3, dy = y + h * 0.8, dr = h * 0.11; ink(c, P); A(0.7); K.circ(dx, dy, dr, K.P(2.8)); K.circ(dx, dy, dr * 0.5, K.P(3)); ink(c, acc); A(0.8); K.hatch(() => { c.beginPath(); c.moveTo(dx, dy); c.arc(dx, dy, dr, -1.57, 0.9); c.closePath(); }, dx - dr, dy - dr, dr * 2, dr * 2, 5, K.P(3.2));
    ink(c, P); for (let i = 0; i < 3; i++) { A(0.5); K.line(dx + dr * 1.6, dy - 18 + i * 18, dx + dr * 1.6 + lw * (0.36 - i * 0.07), dy - 18 + i * 18, K.P(3.2 + i * 0.1, 0.3)); }
  },
  /* web analytics */
  analytics(c, K, A, acc, x, y, w, h, t) {
    ink(c, P); A(0.6); K.line(x, y + h * 0.9, x + w, y + h * 0.9, K.P(0.8)); K.line(x, y + h * 0.9, x, y + h * 0.2, K.P(0.8));
    const pts = []; for (let i = 0; i <= 16; i++) pts.push([x + i * w / 16, y + h * (0.78 - 0.5 * (i / 16) - Math.sin(i * 1.3) * 0.06 - Math.sin(i * 0.5) * 0.05)]);
    ink(c, acc); A(0.5); K.hatch(() => { c.beginPath(); c.moveTo(x, y + h * 0.9); pts.forEach(p => c.lineTo(p[0], p[1])); c.lineTo(x + w, y + h * 0.9); c.closePath(); }, x, y + h * 0.15, w, h * 0.75, 9, K.P(2, 1.2));
    A(0.95); K.curve(pts, K.P(1.2, 1.2), 0.8);
    const last = pts[pts.length - 1], pr = (t * 0.001) % 1; if (K.P(2.4) >= 1) { c.beginPath(); c.arc(last[0], last[1], 5, 0, 7); c.fill(); A(1 - pr); c.beginPath(); c.arc(last[0], last[1], 6 + pr * 22, 0, 7); c.stroke(); }
    c.fillStyle = P; A(0.8 * K.P(2.6)); K.text('users ↑', x + 8, y + h * 0.1, 30); c.fillStyle = acc; A(0.95 * K.P(2.9)); K.text('conversion +7 pts', x + w * 0.42, y + h * 0.12, 28, -0.03);
    ink(c, P); ['organic', 'paid', 'CRM'].forEach((l, i) => { A(0.55 * K.P(3 + i * 0.15)); K.text(l, x + 8 + i * w * 0.3, y + h * 0.99, 20); });
  },
  /* statistics */
  stats(c, K, A, acc, x, y, w, h, t) {
    const by = y + h * 0.78, cx = x + w * 0.5; ink(c, P); A(0.6); K.line(x, by, x + w, by, K.P(0.8));
    for (let i = 0; i < 13; i++) { const u = (i - 6) / 6, v = Math.exp(-u * u * 2.6), bx = x + w * 0.06 + i * w * 0.068, bh = h * 0.6 * v * K.P(1 + i * 0.07, 0.4), bw = w * 0.052; if (bh > 1) { A(0.45); K.rect(bx + bw / 2, by - bh / 2, bw, bh); } }
    const pts = []; for (let i = 0; i <= 30; i++) { const u = (i - 15) / 15; pts.push([x + w * 0.04 + i * w * 0.92 / 30, by - h * 0.62 * Math.exp(-u * u * 2.6)]); }
    ink(c, acc); A(0.95); K.curve(pts, K.P(2, 1), 0.8); A(0.8); K.line(cx, by, cx, by - h * 0.62, K.P(2.8), 1);
    c.fillStyle = P; A(0.8 * K.P(3)); K.text('μ', cx + 8, by - h * 0.64, 30); K.text('n = 312', x + 6, y + h * 0.12, 26); c.fillStyle = acc; A(0.95 * K.P(3.2)); K.text('p < .05 ✓', x + w * 0.68, y + h * 0.14, 30, -0.04);
    ink(c, P); for (let i = 0; i < 3; i++) { A(0.4); K.line(x, by + h * (0.07 + i * 0.06), x + w * (0.9 - i * 0.2), by + h * (0.07 + i * 0.06), K.P(3.2 + i * 0.1, 0.3)); }
  },
  /* survey */
  survey(c, K, A, acc, x, y, w, h, t) {
    for (let q = 0; q < 3; q++) {
      const qy = y + h * (0.08 + q * 0.28), p = K.P(0.8 + q * 0.5);
      ink(c, P); A(0.75 * p); K.text('Q' + (q + 1), x, qy + 8, 26); A(0.5); K.line(x + 44, qy, x + w * (0.8 - q * 0.12), qy, p); K.line(x + 44, qy + 14, x + w * (0.5 + q * 0.1), qy + 14, p);
      for (let i = 0; i < 5; i++) { const rx = x + 60 + i * w * 0.17, ry = qy + h * 0.13, pick = i === [3, 4, 2][q]; ink(c, pick ? acc : P); A(pick ? 0.95 : 0.6); K.circ(rx, ry, 11, K.P(1.2 + q * 0.5 + i * 0.06, 0.3), 0.1); if (pick && K.P(2 + q * 0.5, 0.2) >= 1) { c.beginPath(); c.arc(rx, ry, 5.5, 0, 7); c.fill(); } }
    }
    ink(c, acc); A(0.95); K.rect(x + w - 70, y + h * 0.95, 120, 40, 0, K.P(3)); A(0.95 * K.P(3.2)); K.text('Next →', x + w - 70, y + h * 0.95 + 8, 26, 0, HAND, 'center');
    ink(c, P); A(0.5); K.line(x, y + h * 0.95, x + w * 0.5, y + h * 0.95, K.P(3)); ink(c, acc); A(0.9); K.line(x, y + h * 0.95, x + w * 0.33, y + h * 0.95, K.P(3.2), 3);
  },
  /* code editors */
  code(c, K, A, acc, x, y, w, h, t, lines, extra) {
    const typed = Math.floor(Math.max(0, K.age - 0.8) * 34); let n = 0; c.font = '500 ' + Math.max(13, Math.min(17, w / 34)) + 'px ' + MONO; const lh = Math.max(24, h * 0.085);
    lines.forEach((ln, i) => { const show = Math.max(0, Math.min(ln[0].length, typed - n)); n += ln[0].length; if (!show) return; c.fillStyle = P; A(0.35); c.fillText(String(i + 1), x, y + (i + 1) * lh); c.fillStyle = ln[1] ? acc : P; A(0.9); c.fillText(ln[0].slice(0, show), x + 34, y + (i + 1) * lh); if (show < ln[0].length && Math.floor(t / 300) % 2) c.fillRect(x + 34 + c.measureText(ln[0].slice(0, show)).width + 2, y + (i + 1) * lh - 13, 8, 16); });
    const done = clamp((typed - n) / 20), oy = y + lines.length * lh + lh * 0.9;
    ink(c, P); A(0.5); K.line(x, oy, x + w, oy, done);
    extra(oy + 14, y + h - oy - 14, done);
  },
  /* browser + scraping */
  web(c, K, A, acc, x, y, w, h, t) {
    ink(c, P); A(0.7); K.rect(x + w * 0.5, y + 16, w, 32, 0, K.P(0.8)); A(0.7 * K.P(1.2)); c.font = '14px ' + MONO; c.fillText('https://…/products?page=1', x + 14, y + 21);
    for (let i = 0; i < 3; i++) { const cy = y + h * (0.22 + i * 0.2), p = K.P(1.2 + i * 0.3); A(0.7); K.rect(x + w * 0.21, cy + h * 0.06, w * 0.42, h * 0.16, 0, p); A(0.4); K.hatch(() => { c.beginPath(); c.rect(x + 10, cy, h * 0.12, h * 0.12); }, x + 10, cy, h * 0.12, h * 0.12, 6, p); A(0.5); K.line(x + h * 0.12 + 24, cy + 12, x + w * 0.38, cy + 12, p); ink(c, acc); A(0.95 * p); K.text(['€ 249', '€ 1 199', '€ 329'][i], x + h * 0.12 + 24, cy + h * 0.11, 24); ink(c, P);
      ink(c, acc); A(0.9); K.arrow(x + w * 0.45, cy + h * 0.06, x + w * 0.58, y + h * (0.3 + i * 0.12), K.P(2.2 + i * 0.3, 0.4)); ink(c, P); }
    const tx = x + w * 0.6, ty = y + h * 0.2, tw = w * 0.4; A(0.6); for (let j = 0; j <= 4; j++) K.line(tx, ty + j * h * 0.12, tx + tw, ty + j * h * 0.12, K.P(2 + j * 0.1, 0.3), 1); for (let i = 0; i <= 2; i++) K.line(tx + i * tw / 2, ty, tx + i * tw / 2, ty + h * 0.48, K.P(2.2, 0.4), 1);
    c.fillStyle = P; ['name', 'price'].forEach((l, i) => { A(0.7 * K.P(2.6)); K.text(l, tx + 8 + i * tw / 2, ty + h * 0.085, 20); }); c.fillStyle = acc; ['249', '1199', '329'].forEach((v, i) => { A(0.95 * K.P(3 + i * 0.3, 0.2)); K.text(v, tx + tw / 2 + 8, ty + h * (0.205 + i * 0.12), 20); });
    c.fillStyle = P; A(0.6 * K.P(3.6)); c.font = '14px ' + MONO; c.fillText('<span class="price">', x + 6, y + h * 0.9); c.fillText('soup.select(".price")', x + 6, y + h * 0.97);
  },
  /* design tool */
  design(c, K, A, acc, x, y, w, h, t) {
    ink(c, P); for (let i = 0; i < 6; i++) { A(0.6); K.rect(x + 18, y + 20 + i * 42, 30, 30, 0, K.P(0.8 + i * 0.08, 0.3)); } A(0.5); K.line(x + 46, y, x + 46, y + h, K.P(0.8), 1);
    const lx = x + w * 0.76; K.line(lx, y, lx, y + h, K.P(0.9), 1); for (let i = 0; i < 5; i++) { A(i === 1 ? 0.9 : 0.5); ink(c, i === 1 ? acc : P); K.rect(lx + (w * 0.24) / 2 + 4, y + 26 + i * 44, w * 0.2, 32, 0, K.P(1.2 + i * 0.1, 0.3)); } ink(c, P);
    const ax = x + 70, aw = lx - ax - 20, cx = ax + aw / 2, cy = y + h / 2;
    A(0.7); K.rect(cx, cy, aw * 0.86, h * 0.8, 0, K.P(1.4));
    ink(c, acc); A(0.9); K.circ(cx - aw * 0.16, cy - h * 0.12, h * 0.16, K.P(2)); A(0.6); K.hatch(() => { c.beginPath(); c.arc(cx - aw * 0.16, cy - h * 0.12, h * 0.16, 0, 7); }, cx - aw * 0.4, cy - h * 0.3, aw * 0.5, h * 0.36, 7, K.P(2.3));
    ink(c, P); A(0.85); K.poly([[cx + aw * 0.05, cy + h * 0.24], [cx + aw * 0.2, cy - h * 0.08], [cx + aw * 0.34, cy + h * 0.24]], true, K.P(2.4));
    const b = [[cx - aw * 0.36, cy + h * 0.26], [cx - aw * 0.2, cy + h * 0.02], [cx - aw * 0.02, cy + h * 0.32], [cx + aw * 0.02, cy + h * 0.14]], pts = []; for (let k = 0; k <= 1.001; k += 0.05) { const a = 1 - k; pts.push([a * a * a * b[0][0] + 3 * a * a * k * b[1][0] + 3 * a * k * k * b[2][0] + k * k * k * b[3][0], a * a * a * b[0][1] + 3 * a * a * k * b[1][1] + 3 * a * k * k * b[2][1] + k * k * k * b[3][1]]); }
    ink(c, acc); A(0.95); K.curve(pts, K.P(2.8), 0.6); ink(c, P); A(0.6); K.line(b[0][0], b[0][1], b[1][0], b[1][1], K.P(3.2), 0.8); K.line(b[3][0], b[3][1], b[2][0], b[2][1], K.P(3.2), 0.8); b.forEach((q, i) => { A(0.9 * K.P(3.3)); c.strokeRect(q[0] - 4, q[1] - 4, 8, 8); });
    c.fillStyle = P; A(0.7 * K.P(3.4)); K.text('Aa', cx + aw * 0.18, cy - h * 0.2, 44);
  },
  /* AI assistant */
  chat(c, K, A, acc, x, y, w, h, t) {
    const B = [[0, 0.04, 0.62, 2, 0.8], [1, 0.24, 0.7, 3, 1.6], [0, 0.5, 0.5, 1, 2.6], [1, 0.66, 0.74, 3, 3.3]];
    for (const [me, fy, fw, n, at] of B) { const bw = w * fw, bh = 26 + n * 20, bx = me ? x + w - bw : x, by = y + h * fy, p = K.P(at, 0.5); ink(c, me ? acc : P); A(0.85); K.rect(bx + bw / 2, by + bh / 2, bw, bh, 0, p); for (let i = 0; i < n; i++) { A(0.5); K.line(bx + 14, by + 20 + i * 20, bx + bw * (i === n - 1 ? 0.55 : 0.92), by + 20 + i * 20, K.P(at + 0.4 + i * 0.15, 0.3)); } }
    if (K.P(4) >= 1) { c.fillStyle = P; for (let i = 0; i < 3; i++) { A(0.3 + 0.6 * Math.abs(Math.sin(t * 0.005 - i * 0.7))); c.beginPath(); c.arc(x + 14 + i * 16, y + h * 0.95, 4.5, 0, 7); c.fill(); } }
    c.fillStyle = acc; A(0.95 * K.P(3.8)); K.text('✦ prompt → insight', x + w * 0.3, y + h * 0.98, 26, -0.02);
  }
};
function ui(kind) {
  return {
    init() { return {}; },
    draw(c, s, t, dt, W, H, acc, A) {
      const K = pencil(c, t, s), wide = W > 900, x0 = wide ? W * 0.61 : W * 0.05, x1 = wide ? W * 0.975 : W * 0.95, y0 = H * 0.15, y1 = H * 0.87, w = x1 - x0, h = y1 - y0;
      A(0.92); c.fillStyle = BG; c.fillRect(x0, y0, w, h);
      ink(c, P); A(0.85); K.rect(x0 + w / 2, y0 + h / 2, w, h, 0, K.P(0, 0.8)); K.line(x0, y0 + 40, x1, y0 + 40, K.P(0.5, 0.4));
      for (let i = 0; i < 3; i++) { ink(c, i === 0 ? acc : P); A(0.8); K.circ(x0 + 24 + i * 20, y0 + 20, 5.5, K.P(0.6), 0.12); }
      c.fillStyle = P; A(0.75 * K.P(0.8)); K.text(window.UI_TITLE || '', x0 + 92, y0 + 28, 26);
      const x = x0 + 26, y = y0 + 62, cw = w - 52, ch = h - 88;
      if (kind === 'sql') UI.code(c, K, A, acc, x, y, cw, ch, t, [['SELECT product, SUM(sales) AS total', 1], ['FROM   launches', 0], ['WHERE  market = \'FR\'', 0], ['GROUP  BY product', 0], ['ORDER  BY total DESC;', 1]], (oy, oh, d) => {
        ink(c, P); for (let j = 0; j <= 4; j++) { A(0.6); K.line(x, oy + j * oh / 4, x + cw * 0.7, oy + j * oh / 4, d, 1); } for (let i = 0; i <= 2; i++) { A(0.6); K.line(x + i * cw * 0.35, oy, x + i * cw * 0.35, oy + oh, d, 1); }
        if (d >= 1) { c.fillStyle = P; A(0.8); K.text('product', x + 10, oy + oh * 0.17, 22); K.text('total', x + cw * 0.35 + 10, oy + oh * 0.17, 22); [['Buds4 Pro', '1.2×'], ['Book 6', '1.0×'], ['Tab 12', '—']].forEach((r, i) => { c.fillStyle = P; A(0.7); K.text(r[0], x + 10, oy + oh * (0.42 + i * 0.25), 22); c.fillStyle = acc; A(0.95); K.text(r[1], x + cw * 0.35 + 10, oy + oh * (0.42 + i * 0.25), 22); }); } });
      else if (kind === 'py' || kind === 'r') UI.code(c, K, A, acc, x, y, cw, ch, t, kind === 'py' ? [['import pandas as pd', 1], ['df = pd.read_csv("sales.csv")', 0], ['top = df.groupby("sku").sum()', 0], ['top.plot(kind="scatter")', 1]] : [['library(ggplot2)', 1], ['df <- read.csv("customers.csv")', 0], ['fit <- lm(spend ~ visits, df)', 0], ['ggplot(df) + geom_point()', 1]], (oy, oh, d) => {
        ink(c, P); A(0.6); K.line(x + 20, oy + oh - 8, x + cw * 0.8, oy + oh - 8, d); K.line(x + 20, oy + oh - 8, x + 20, oy + 6, d);
        if (d >= 1) { c.fillStyle = P; for (let i = 0; i < 22; i++) { const u = (i * 0.618) % 1, v = u * 0.7 + ((i * 0.37) % 1) * 0.28; A(0.7); c.beginPath(); c.arc(x + 34 + u * cw * 0.7, oy + oh - 18 - v * (oh - 40), 3.5, 0, 7); c.fill(); } ink(c, acc); A(0.95); K.line(x + 30, oy + oh - 22, x + cw * 0.76, oy + oh * 0.22, clamp((K.age - 5) / 0.6), 1.2); } });
      else UI[kind](c, K, A, acc, x, y, cw, ch, t);
    }
  };
}
['sheet', 'dash', 'analytics', 'stats', 'survey', 'sql', 'py', 'r', 'web', 'design', 'chat'].forEach(k => { FX['ui-' + k] = ui(k); });

window.FX = FX;
})();
