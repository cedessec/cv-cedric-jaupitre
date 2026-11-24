/* =========================================================
   MINI-GAME — "One last rally"
   A tiny table-tennis game against Cédric. Every ball the visitor returns
   unlocks one reason to hire him (texts: assets/content.js → 'gm.facts').
   ========================================================= */
(() => {
const cv = document.getElementById('game'); if (!cv) return;
const ctx = cv.getContext('2d'), wrap = cv.parentNode, over = document.getElementById('gOver'), msg = document.getElementById('gMsg'), btn = document.getElementById('gBtn'), cta = document.getElementById('gCta');
const scoreEl = document.getElementById('gScore'), factsEl = document.getElementById('gFacts');
const T = k => window.T(k), css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
let W = 0, H = 0, DPR = 1, VERT = false, CW = 0, CH = 0, running = false, unlocked = 0, rally = 0, best = 0, state = 'idle', last = 0, got = 0;
let ball = { x: 0, y: 0, vx: 0, vy: 0 }, me = 0.5, him = 0.5, trail = [], flash = 0;
const PH = 0.22;                     // paddle height (share of the table height)

/* phones: the table turns vertical — you play at the bottom, Cédric at the top, and you slide left/right.
   The game logic stays the same; W is always the length of the table and H its width. */
function size() {
  DPR = Math.min(2, devicePixelRatio || 1); CW = wrap.clientWidth; VERT = CW < 600;
  CH = VERT ? Math.round(Math.max(380, Math.min(innerHeight * 0.62, CW * 1.5))) : Math.max(230, Math.min(460, CW * 0.46));
  W = VERT ? CH : CW; H = VERT ? CW : CH;
  cv.style.height = CH + 'px'; cv.width = CW * DPR; cv.height = CH * DPR;
  wrap.style.cursor = VERT ? 'ew-resize' : '';
  const how = document.querySelector('[data-i18n="gm.how"]'); if (how) how.textContent = T(VERT ? 'gm.how2' : 'gm.how');
  draw();
}
function facts() { return T('gm.facts') || []; }
function renderFacts() {
  const f = facts();
  factsEl.innerHTML = f.map((x, i) => i < unlocked ? '<li class="on"><b>' + String(i + 1).padStart(2, '0') + '</b>' + x + '</li>' : '<li><b>' + String(i + 1).padStart(2, '0') + '</b><span>' + T('gm.locked') + '</span></li>').join('');
  scoreEl.textContent = T('gm.rally') + ' ' + rally + (best ? '  ·  ' + T('gm.best') + ' ' + best : '');
}
function panel() {
  const all = unlocked >= facts().length;
  msg.innerHTML = state === 'idle' ? T('gm.intro') : state === 'won' ? T('gm.win') : T('gm.lose').replace('{n}', got);
  btn.textContent = state === 'idle' ? T('gm.serve') : T('gm.again');
  cta.style.display = state === 'won' ? '' : 'none';
  over.classList.toggle('show', !running);
}
function serve() {
  rally = 0; unlocked = 0; trail = []; running = true; state = 'play';
  const sp = W * 0.00042;
  ball = { x: W * 0.72, y: H * (0.3 + Math.random() * 0.4), vx: -sp, vy: sp * (Math.random() < 0.5 ? -0.55 : 0.55) };
  him = ball.y / H; panel(); renderFacts(); last = performance.now(); requestAnimationFrame(loop);
}
/* a lost point resets the reasons, so the next rally unlocks them again from the first one */
function end(won) { running = false; state = won ? 'won' : 'lost'; best = Math.max(best, rally); got = unlocked; if (!won) { unlocked = 0; rally = 0; } panel(); renderFacts(); draw(); }

function loop(now) {
  if (!running) return;
  const dt = Math.min(32, now - last); last = now;
  const px = 26, hx = W - 26, r = 8, ph = H * PH;
  ball.x += ball.vx * dt; ball.y += ball.vy * dt;
  if (ball.y < r) { ball.y = r; ball.vy = Math.abs(ball.vy); } if (ball.y > H - r) { ball.y = H - r; ball.vy = -Math.abs(ball.vy); }
  // Cédric follows the ball — he has had some practice
  him += (ball.y / H - him) * Math.min(1, dt * 0.012);
  // visitor returns the ball
  if (ball.vx < 0 && ball.x - r < px + 7 && ball.x > px - 14 && Math.abs(ball.y - me * H) < ph / 2 + r) {
    const off = (ball.y - me * H) / (ph / 2), sp = Math.min(W * 0.0011, Math.hypot(ball.vx, ball.vy) * 1.07);
    ball.vx = Math.cos(off * 0.9) * sp; ball.vy = Math.sin(off * 0.9) * sp; ball.x = px + 7 + r;
    rally++; flash = 1; if (unlocked < facts().length) unlocked++;
    renderFacts();
    if (rally >= facts().length && unlocked >= facts().length) { setTimeout(() => end(true), 500); }
  }
  if (ball.vx > 0 && ball.x + r > hx - 7) { ball.vx = -Math.abs(ball.vx); ball.x = hx - 7 - r; ball.vy += (Math.random() - 0.5) * W * 0.0003; }
  if (ball.x < -30) return end(false);
  trail.push([ball.x, ball.y]); if (trail.length > 12) trail.shift();
  flash = Math.max(0, flash - dt * 0.004);
  draw(); requestAnimationFrame(loop);
}
function draw() {
  const acc = css('--accent') || '#d9b38c', P = css('--game-ink') || '#efebe3';
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, CW, CH);
  if (VERT) ctx.setTransform(0, -DPR, DPR, 0, 0, CH * DPR);   // table rotated: logical left (you) = bottom of the screen
  // table
  ctx.strokeStyle = P; ctx.globalAlpha = 0.28; ctx.lineWidth = 1.2; ctx.strokeRect(10, 10, W - 20, H - 20);
  ctx.globalAlpha = 0.14; ctx.beginPath(); ctx.moveTo(10, H / 2); ctx.lineTo(W - 10, H / 2); ctx.stroke();
  ctx.globalAlpha = 0.5; ctx.setLineDash([6, 8]); ctx.beginPath(); ctx.moveTo(W / 2, 4); ctx.lineTo(W / 2, H - 4); ctx.stroke(); ctx.setLineDash([]);
  // labels and rally number are written upright, in screen coordinates
  ctx.save(); ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.font = '500 11px "JetBrains Mono", monospace'; ctx.fillStyle = P; ctx.globalAlpha = 0.5; ctx.textAlign = 'left'; ctx.fillText(T('gm.you').toUpperCase(), 24, VERT ? CH - 22 : 32); ctx.textAlign = 'right'; ctx.fillStyle = acc; ctx.globalAlpha = 0.9; ctx.fillText('CÉDRIC', CW - 24, 32); ctx.textAlign = 'left';
  ctx.font = '400 ' + Math.round(Math.min(CW, CH) * 0.5) + 'px "Instrument Serif", serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = flash > 0 ? acc : P; ctx.globalAlpha = 0.06 + flash * 0.2; ctx.fillText(String(rally), CW / 2, CH / 2); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.restore();
  // paddles
  const ph = H * PH, rr = (x, y, w, h) => { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, 6) : ctx.rect(x, y, w, h); ctx.fill(); };
  ctx.globalAlpha = 1; ctx.fillStyle = P; rr(20, me * H - ph / 2, 12, ph); ctx.fillStyle = acc; rr(W - 32, Math.max(ph / 2, Math.min(H - ph / 2, him * H)) - ph / 2, 12, ph);
  // ball
  if (state !== 'idle') { ctx.fillStyle = acc; trail.forEach((p, i) => { ctx.globalAlpha = i / 12 * 0.35; ctx.beginPath(); ctx.arc(p[0], p[1], 3 + i * 0.35, 0, 7); ctx.fill(); }); ctx.globalAlpha = 1; ctx.fillStyle = P; ctx.beginPath(); ctx.arc(ball.x, ball.y, 8, 0, 7); ctx.fill(); }
  ctx.globalAlpha = 1;
}
// controls: mouse / finger / arrow keys
const move = e => { const r = cv.getBoundingClientRect(), k = VERT ? (e.clientX - r.left) / r.width : (e.clientY - r.top) / r.height; me = Math.max(PH / 2, Math.min(1 - PH / 2, k)); if (!running) draw(); };
wrap.addEventListener('pointermove', move); wrap.addEventListener('pointerdown', move);
addEventListener('keydown', e => { if (!running) return; if (e.key === (VERT ? 'ArrowLeft' : 'ArrowUp')) { me = Math.max(PH / 2, me - 0.08); e.preventDefault(); } if (e.key === (VERT ? 'ArrowRight' : 'ArrowDown')) { me = Math.min(1 - PH / 2, me + 0.08); e.preventDefault(); } });
btn.addEventListener('click', serve);
addEventListener('resize', size);
window.GAME = { refresh() { renderFacts(); panel(); size(); } };
size(); window.GAME.refresh();
})();
