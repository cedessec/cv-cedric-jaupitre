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
let W = 0, H = 0, DPR = 1, running = false, unlocked = 0, rally = 0, best = 0, state = 'idle', last = 0;
let ball = { x: 0, y: 0, vx: 0, vy: 0 }, me = 0.5, him = 0.5, trail = [], flash = 0;
const PH = 0.22;                     // paddle height (share of the table height)

function size() { DPR = Math.min(2, devicePixelRatio || 1); W = wrap.clientWidth; H = Math.max(230, Math.min(460, W * 0.46)); cv.style.height = H + 'px'; cv.width = W * DPR; cv.height = H * DPR; draw(); }
function facts() { return T('gm.facts') || []; }
function renderFacts() {
  const f = facts();
  factsEl.innerHTML = f.map((x, i) => i < unlocked ? '<li class="on"><b>' + String(i + 1).padStart(2, '0') + '</b>' + x + '</li>' : '<li><b>' + String(i + 1).padStart(2, '0') + '</b><span>' + T('gm.locked') + '</span></li>').join('');
  scoreEl.textContent = T('gm.rally') + ' ' + rally + (best ? '  ·  ' + T('gm.best') + ' ' + best : '');
}
function panel() {
  const all = unlocked >= facts().length;
  msg.innerHTML = state === 'idle' ? T('gm.intro') : state === 'won' ? T('gm.win') : T('gm.lose');
  btn.textContent = state === 'idle' ? T('gm.serve') : T('gm.again');
  cta.style.display = state === 'won' || (all && state !== 'idle') ? '' : 'none';
  over.classList.toggle('show', !running);
}
function serve() {
  rally = 0; trail = []; running = true; state = 'play';
  const sp = W * 0.00042;
  ball = { x: W * 0.72, y: H * (0.3 + Math.random() * 0.4), vx: -sp, vy: sp * (Math.random() < 0.5 ? -0.55 : 0.55) };
  him = ball.y / H; panel(); renderFacts(); last = performance.now(); requestAnimationFrame(loop);
}
function end(won) { running = false; state = won ? 'won' : 'lost'; best = Math.max(best, rally); panel(); renderFacts(); draw(); }

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
  const acc = css('--accent') || '#d9b38c', P = '#efebe3';
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H);
  // table
  ctx.strokeStyle = P; ctx.globalAlpha = 0.28; ctx.lineWidth = 1.2; ctx.strokeRect(10, 10, W - 20, H - 20);
  ctx.globalAlpha = 0.14; ctx.beginPath(); ctx.moveTo(10, H / 2); ctx.lineTo(W - 10, H / 2); ctx.stroke();
  ctx.globalAlpha = 0.5; ctx.setLineDash([6, 8]); ctx.beginPath(); ctx.moveTo(W / 2, 4); ctx.lineTo(W / 2, H - 4); ctx.stroke(); ctx.setLineDash([]);
  ctx.font = '500 11px "JetBrains Mono", monospace'; ctx.fillStyle = P; ctx.globalAlpha = 0.5; ctx.textAlign = 'left'; ctx.fillText(T('gm.you').toUpperCase(), 24, 32); ctx.textAlign = 'right'; ctx.fillStyle = acc; ctx.globalAlpha = 0.9; ctx.fillText('CÉDRIC', W - 24, 32); ctx.textAlign = 'left';
  // big rally number
  ctx.font = '400 ' + Math.round(H * 0.5) + 'px "Instrument Serif", serif'; ctx.textAlign = 'center'; ctx.fillStyle = flash > 0 ? acc : P; ctx.globalAlpha = 0.06 + flash * 0.2; ctx.fillText(String(rally), W / 2, H * 0.66); ctx.textAlign = 'left';
  // paddles
  const ph = H * PH, rr = (x, y, w, h) => { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, 6) : ctx.rect(x, y, w, h); ctx.fill(); };
  ctx.globalAlpha = 1; ctx.fillStyle = P; rr(20, me * H - ph / 2, 12, ph); ctx.fillStyle = acc; rr(W - 32, Math.max(ph / 2, Math.min(H - ph / 2, him * H)) - ph / 2, 12, ph);
  // ball
  if (state !== 'idle') { ctx.fillStyle = acc; trail.forEach((p, i) => { ctx.globalAlpha = i / 12 * 0.35; ctx.beginPath(); ctx.arc(p[0], p[1], 3 + i * 0.35, 0, 7); ctx.fill(); }); ctx.globalAlpha = 1; ctx.fillStyle = P; ctx.beginPath(); ctx.arc(ball.x, ball.y, 8, 0, 7); ctx.fill(); }
  ctx.globalAlpha = 1;
}
// controls: mouse / finger / arrow keys
const move = e => { const r = cv.getBoundingClientRect(); me = Math.max(PH / 2, Math.min(1 - PH / 2, (e.clientY - r.top) / r.height)); if (!running) draw(); };
wrap.addEventListener('pointermove', move); wrap.addEventListener('pointerdown', move);
addEventListener('keydown', e => { if (!running) return; if (e.key === 'ArrowUp') { me = Math.max(PH / 2, me - 0.08); e.preventDefault(); } if (e.key === 'ArrowDown') { me = Math.min(1 - PH / 2, me + 0.08); e.preventDefault(); } });
btn.addEventListener('click', serve);
addEventListener('resize', size);
window.GAME = { refresh() { renderFacts(); panel(); draw(); } };
size(); window.GAME.refresh();
})();
