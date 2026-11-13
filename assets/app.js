/* =========================================================
   APP — languages, globe, scene switching, small interactions
   ========================================================= */
(() => {
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement, $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const EMAIL = 'cedric.jaupitre@essec.edu', LINKEDIN = 'https://www.linkedin.com/in/cedric-jaupitre';

/* =============== 1. LANGUAGES =============== */
const LANGS = ['en', 'ja', 'fr'];
let lang = 'en';
const T = window.T = k => (window.I18N[lang] && window.I18N[lang][k] !== undefined) ? window.I18N[lang][k] : window.I18N.en[k];
function firstLang() {
  const h = location.hash.slice(1), q = new URLSearchParams(location.search).get('lang');
  if (LANGS.includes(q)) return q;
  if (LANGS.includes(h)) return h;
  try { const s = localStorage.getItem('lang'); if (LANGS.includes(s)) return s; } catch (e) {}
  const n = (navigator.language || 'en').slice(0, 2);
  return LANGS.includes(n) ? n : 'en';
}
function renderNum(el, val) {
  const dec = +(el.dataset.dec || 0), pre = el.dataset.pre ? (T(el.dataset.pre) || '') : (el.dataset.prefix || ''), suf = el.dataset.suf ? (T(el.dataset.suf) || '') : (el.dataset.suffix || '');
  el.innerHTML = (pre.length > 1 ? '<small>' + pre + '</small>' : pre) + val.toFixed(dec) + suf;
}
function buildTicker() {
  const items = T('ticker').map(x => '<span>' + x + '</span>')
    .concat(['<a class="c" href="mailto:' + EMAIL + '">' + EMAIL + '</a>', '<a class="c" href="' + LINKEDIN + '" target="_blank" rel="noopener">linkedin.com/in/cedric-jaupitre ↗</a>']);
  $('#track').innerHTML = items.concat(items).join('');
}
function applyLang(l) {
  lang = l; root.lang = l;
  $$('[data-i18n]').forEach(el => { const v = T(el.dataset.i18n); if (v !== undefined) el.innerHTML = v; });
  $$('[data-i18n-list]').forEach(el => { el.innerHTML = (T(el.dataset.i18nList) || []).map(x => '<span class="tag">' + x + '</span>').join(''); });
  $$('[data-count]').forEach(el => renderNum(el, el._done ? parseFloat(el.dataset.count) : 0));
  $$('#langsw button').forEach(b => b.classList.toggle('on', b.dataset.lang === l));
  document.title = T('meta.title');
  buildTicker();
  try { localStorage.setItem('lang', l); } catch (e) {}
  renderEg(); if (window.GAME) window.GAME.refresh();
  if (current) { const on = current.id === 'beyond' && $('.tile.on'); on ? pickTile(on, true) : setScene(current.dataset, true); }
}
$('#langsw').addEventListener('click', e => { const b = e.target.closest('button'); if (b) applyLang(b.dataset.lang); });

let egSel = 1;
function renderEg() {
  if (!$('#egH')) return;
  $$('.eg-tab').forEach(x => { const on = +x.dataset.eg === egSel; x.classList.toggle('on', on); x.setAttribute('aria-selected', on); });
  $('#egK').innerHTML = T('eg' + egSel + '.k'); $('#egH').innerHTML = T('eg' + egSel + '.h'); $('#egP').innerHTML = T('eg' + egSel + '.p');
  $('#egLinks').innerHTML = ((window.ENGAGE_LINKS || {})[egSel] || []).map(l => '<a class="btn" href="' + l.url + '" target="_blank" rel="noopener">' + (T(l.label) || l.label) + ' ↗</a>').join('');
  const m = $('#egMedia'), list = (window.PHOTOS || {})['eg' + egSel]; m.classList.toggle('empty', !list); m.innerHTML = list ? gallery('eg' + egSel) : T('eg.soon');
}

/* greeting carousel */
const greetings = ['Bonjour,', 'Hello,', 'こんにちは、', 'Hola,', '你好，'];
const greet = $('#greet'); let gi = 0;
if (!reduce) setInterval(() => {
  const cur = greet.querySelector('span:last-child');
  gi = (gi + 1) % greetings.length;
  const nx = document.createElement('span'); nx.className = 'next'; nx.textContent = greetings[gi];
  greet.appendChild(nx);
  requestAnimationFrame(() => requestAnimationFrame(() => { cur.classList.add('out'); nx.classList.remove('next'); }));
  setTimeout(() => cur.remove(), 800);
}, 2400);

/* =============== 2. GLOBE =============== */
const cv = $('#globe'), ctx = cv.getContext('2d');
const raw = atob(window.LAND_POINTS || ''), buf = new Int16Array(raw.length / 2);
for (let i = 0; i < buf.length; i++) buf[i] = (raw.charCodeAt(i * 2) | (raw.charCodeAt(i * 2 + 1) << 8)) << 16 >> 16;
const RAD = Math.PI / 180, land = [];
for (let i = 0; i < buf.length; i += 2) { const la = buf[i] / 10 * RAD, lo = buf[i + 1] / 10 * RAD; land.push([Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo)]); }
const vec = (lat, lon) => [Math.cos(lat * RAD) * Math.sin(lon * RAD), Math.sin(lat * RAD), Math.cos(lat * RAD) * Math.cos(lon * RAD)];
const cities = { Paris: [48.86, 2.35], Lille: [50.63, 3.06], Shenzhen: [22.54, 114.06], Tokyo: [35.68, 139.69], Singapore: [1.35, 103.82] };
const route = ['Paris', 'Shenzhen', 'Lille', 'Tokyo', 'Paris', 'Singapore'];
const arcs = [];
for (let i = 0; i < route.length - 1; i++) {
  const a = vec(...cities[route[i]]), b = vec(...cities[route[i + 1]]);
  const om = Math.acos(Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])), pts = [];
  for (let k = 0; k <= 60; k++) {
    const t = k / 60, s1 = Math.sin((1 - t) * om) / Math.sin(om), s2 = Math.sin(t * om) / Math.sin(om), h = 1 + 0.12 * Math.sin(Math.PI * t) * om;
    pts.push([(a[0] * s1 + b[0] * s2) * h, (a[1] * s1 + b[1] * s2) * h, (a[2] * s1 + b[2] * s2) * h]);
  }
  arcs.push(pts);
}
let W, H, DPR, base, cx, cy;
const fxc = $('#fx'), fctx = fxc.getContext('2d');
let fxCur = null, fxState = null, fxWant = 'stars', fxK = 0, fxAcc = '#d9b38c', fxHold = 0;
function size() {
  DPR = Math.min(2, devicePixelRatio || 1);
  W = innerWidth; H = innerHeight;
  cv.width = W * DPR; cv.height = H * DPR; fxc.width = W * DPR; fxc.height = H * DPR;
  const mob = W < 900;
  base = mob ? W * 0.42 : Math.min(W * 0.235, H * 0.38); cx = mob ? W * 0.5 : W * 0.72; cy = mob ? H * 0.6 : H * 0.5;
  if (fxCur) fxState = window.FX[fxCur].init(W, H);
}
size(); addEventListener('resize', size);
let lon0 = 103.82, lat0 = 10, tLon = 103.82, tLat = 10, zoom = 1, tZoom = 1, mx = 0, my = 0, active = 'Singapore', spin = 0, accent = '#d9b38c';
addEventListener('pointermove', e => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; });
/* the globe can be grabbed and spun freely on the landing screen (mouse or pen) */
let drag = null, dragged = false, velLon = 0, velLat = 0;
const overGlobe = e => current === scenes[0] && Math.hypot(e.clientX - cx, e.clientY - cy) < base * zoom * 1.04 && !e.target.closest('a,button,.me,nav');
addEventListener('pointerdown', e => { if (e.pointerType === 'touch' || !overGlobe(e)) return; drag = { x: e.clientX, y: e.clientY }; dragged = true; velLon = velLat = 0; document.body.style.cursor = 'grabbing'; e.preventDefault(); });
addEventListener('pointermove', e => {
  if (!drag) { document.body.style.cursor = e.pointerType !== 'touch' && overGlobe(e) ? 'grab' : ''; return; }
  const k = 180 / (Math.PI * base * zoom); velLon = -(e.clientX - drag.x) * k; velLat = (e.clientY - drag.y) * k;
  tLon = lon0 = lon0 + velLon; tLat = lat0 = Math.max(-85, Math.min(85, lat0 + velLat)); drag = { x: e.clientX, y: e.clientY };
});
addEventListener('pointerup', () => { if (drag) { drag = null; document.body.style.cursor = ''; } });

function drawGlobe() {
  const rad = base * zoom;
  const par = dragged && current === scenes[0] ? 0 : 1;   // no mouse parallax once the visitor has taken the globe in hand
  const L = (lon0 + par * mx * 12 / zoom) * RAD, Tt = (lat0 - par * my * 7 / zoom) * RAD;
  const cl = Math.cos(L), sl = Math.sin(L), ct = Math.cos(Tt), st = Math.sin(Tt);
  const proj = p => { const x = p[0] * cl - p[2] * sl, z1 = p[0] * sl + p[2] * cl; return [cx + x * rad, cy - (p[1] * ct - z1 * st) * rad, p[1] * st + z1 * ct]; };
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H);
  ctx.beginPath(); ctx.arc(cx, cy, rad, 0, 7); ctx.fillStyle = 'rgba(239,235,227,0.025)'; ctx.fill();
  ctx.strokeStyle = 'rgba(239,235,227,0.10)'; ctx.lineWidth = 1; ctx.stroke();
  const landK = 1 - 0.55 * Math.max(0, Math.min(1, (zoom - 1.3) / 1.2)); // the map steps back when zoomed so the drawing and the city pin lead
  const ac = vec(...cities[active]), dotR = Math.max(1, Math.min(2.3, rad / 300)), near0 = zoom > 1.6 ? 0.9965 : 0.985;
  for (const p of land) {
    const q = proj(p); if (q[2] < 0 || q[0] < -4 || q[0] > W + 4 || q[1] < -4 || q[1] > H + 4) continue;
    if (p[0] * ac[0] + p[1] * ac[1] + p[2] * ac[2] > near0) { ctx.fillStyle = accent; ctx.globalAlpha = 0.55 + 0.45 * q[2]; }
    else { ctx.fillStyle = '#efebe3'; ctx.globalAlpha = (0.08 + 0.5 * q[2] * q[2]) * landK; }
    ctx.fillRect(q[0] - dotR, q[1] - dotR, dotR * 2, dotR * 2);
  }
  ctx.globalAlpha = 1;
  arcs.forEach((pts, i) => {
    ctx.beginPath(); let on = false;
    for (const p of pts) { const q = proj(p); if (q[2] < 0.02) { on = false; continue; } on ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); on = true; }
    ctx.strokeStyle = 'rgba(239,235,227,0.22)'; ctx.lineWidth = 1; ctx.stroke();
    const k = (spin * 0.18 + i * 0.2) % 1, h = proj(pts[Math.max(0, Math.min(pts.length - 1, Math.floor(k * (pts.length - 1))))]);
    if (h[2] > 0) { ctx.beginPath(); ctx.arc(h[0], h[1], 2.2, 0, 7); ctx.fillStyle = accent; ctx.fill(); }
  });
  const close = zoom > 1.6;
  for (const name in cities) {
    const q = proj(vec(...cities[name])); if (q[2] < 0.05) continue;
    const on = name === active;
    ctx.beginPath(); ctx.arc(q[0], q[1], on ? (close ? 7 : 5) : 3, 0, 7); ctx.fillStyle = on ? accent : '#efebe3'; ctx.globalAlpha = on ? 1 : 0.7; ctx.fill(); ctx.globalAlpha = 1;
    if (on) for (let r = 0; r < (close ? 2 : 1); r++) {
      const pr = (spin * 0.6 + r * 0.5) % 1;
      ctx.beginPath(); ctx.arc(q[0], q[1], 6 + pr * (close ? 60 : 26), 0, 7); ctx.strokeStyle = accent; ctx.globalAlpha = 1 - pr; ctx.lineWidth = 1.5; ctx.stroke(); ctx.globalAlpha = 1;
    }
    if (!close && ((name === 'Lille' && active !== 'Lille') || (name === 'Paris' && active === 'Lille'))) continue; // Paris & Lille overlap when zoomed out
    if (on && close) {
      // hand-drawn pin: wobbly circle + handwritten city name, so the city stays in the foreground
      const bf = Math.floor(performance.now() / 190), wob = k => Math.sin(k * 12.9898 + bf * 78.233) * 43758.5453 % 1 - 0.5;
      const label = T('word.' + name) || name, big = Math.min(72, 34 + zoom * 12);
      ctx.strokeStyle = accent; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
      for (let pass = 0; pass < 2; pass++) { ctx.beginPath(); for (let i = 0; i <= 34; i++) { const a = i / 30 * 6.283 + pass, rr = 30 + pass * 3 + wob(i + pass * 50) * 4; ctx.lineTo(q[0] + Math.cos(a) * rr, q[1] + Math.sin(a) * rr * 0.9); } ctx.stroke(); }
      ctx.font = '700 ' + big + 'px Caveat, Yomogi, cursive';
      const tw = ctx.measureText(label).width, lx = q[0] + 46, ly = q[1] - 34;
      ctx.lineWidth = 9; ctx.strokeStyle = '#0b0c0f'; ctx.lineJoin = 'round'; ctx.strokeText(label, lx, ly);
      ctx.fillStyle = '#efebe3'; ctx.fillText(label, lx, ly);
      ctx.strokeStyle = accent; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(lx - 2 + wob(1) * 3, ly + 12 + wob(2) * 3); ctx.quadraticCurveTo(lx + tw / 2, ly + 18 + wob(3) * 5, lx + tw + 4 + wob(4) * 3, ly + 9 + wob(5) * 3); ctx.stroke();
      ctx.lineWidth = 1; continue;
    }
    ctx.font = (on ? '500 12px ' : '400 ' + (close ? 12 : 10) + 'px ') + 'JetBrains Mono, monospace';
    ctx.fillStyle = on ? '#efebe3' : 'rgba(239,235,227,.6)';
    ctx.fillText(name.toUpperCase(), q[0] + 10, q[1] + (name === 'Lille' ? -6 : 4));
  }
}

/* =============== 3. MAIN LOOP (globe + animated background) =============== */
let t0 = performance.now();
function frame(now) {
  const dt = reduce ? 0 : Math.max(0, Math.min(50, now - t0)); t0 = now;
  spin += dt * 0.0015;
  const d = ((tLon - lon0 + 540) % 360) - 180, e = reduce ? 1 : 0.05;
  lon0 += d * e; lat0 += (tLat - lat0) * e; zoom += (tZoom - zoom) * (reduce ? 1 : 0.045);
  if (!drag && (Math.abs(velLon) > 0.02 || Math.abs(velLat) > 0.02)) { velLon *= 0.94; velLat *= 0.94; tLon = lon0 = lon0 + velLon; tLat = lat0 = Math.max(-85, Math.min(85, lat0 + velLat)); }   // inertia after a throw
  drawGlobe();
  if (current === scenes[0] && !dragged && W >= 900) { ctx.font = '700 22px Caveat, Yomogi, cursive'; ctx.fillStyle = 'rgba(239,235,227,.6)'; ctx.textAlign = 'center'; ctx.fillText('↻ ' + T('hero.drag'), cx, cy + base * zoom + 34); ctx.textAlign = 'left'; }
  // background scene: fade the old one out, wait for the globe to arrive, fade the new one in
  if (fxWant !== fxCur) { fxK -= (reduce ? 1 : dt / 300); if (fxK <= 0 && now >= fxHold) { fxCur = fxWant; fxState = window.FX[fxCur].init(W, H); fxK = 0; } }
  else fxK = Math.min(1, fxK + (reduce ? 1 : dt / 900));
  fctx.setTransform(DPR, 0, 0, DPR, 0, 0); fctx.clearRect(0, 0, W, H);
  if (fxCur && fxK > 0) { fctx.save(); window.FX[fxCur].draw(fctx, fxState, reduce ? 4000 : now, dt, W, H, fxAcc, a => { fctx.globalAlpha = Math.max(0, Math.min(1, fxK * a)); }); fctx.restore(); fctx.globalAlpha = 1; fctx.shadowBlur = 0; }
  requestAnimationFrame(frame);
}

/* =============== 4. SCENES: what happens when a section comes on screen =============== */
const hudCity = $('#hudCity'), hudCoord = $('#hudCoord'), hudTime = $('#hudTime'), word = $('#cityWord');
let tz = 'Asia/Singapore', current = null;
const fmt = (v, p, n) => Math.abs(v).toFixed(2) + '°' + (v >= 0 ? p : n);
function setScene(d, quiet) {
  velLon = velLat = 0;
  accent = d.accent; root.style.setProperty('--accent', d.accent);
  active = d.city; tLon = +d.lon; tZoom = +(d.zoom || 1);
  tLat = tZoom > 1.3 ? +d.lat : Math.max(-10, Math.min(38, +d.lat * 0.7));
  cv.style.opacity = d.globe || 1;
  const fx = d.fx || 'stars';
  if (fx !== fxWant) { fxWant = fx; fxHold = performance.now() + (quiet ? 0 : 650); }
  fxAcc = d.accent;
  hudCity.textContent = d.city; hudCoord.textContent = fmt(+d.lat, 'N', 'S') + ' ' + fmt(+d.lon, 'E', 'W');
  tz = d.tz || tz; tick();
  const w = d.word ? (T('word.' + d.word) || d.word) : '';
  if (word.dataset.w !== w) { word.dataset.w = w; word.classList.add('swap'); setTimeout(() => { word.textContent = w; if (w) word.classList.remove('swap'); }, 350); }
}
function tick() { try { hudTime.textContent = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: tz }).format(new Date()) + ' ' + T('local'); } catch (e) {} }
setInterval(tick, 20000);
const scenes = $$('[data-scene]');
function pickScene() {
  const mid = innerHeight * 0.5; let best = scenes[0];
  for (const s of scenes) if (s.getBoundingClientRect().top <= mid) best = s;
  if (best !== current) { current = best; langPick = null; setScene(best.dataset); if (best.id === 'toolkit') markLang($('.lang[data-fx="fuji"]')); if (best.id === 'beyond') $$('.tile').forEach((x, i) => x.classList.toggle('on', i === 0)); }
  const h = document.documentElement.scrollHeight - innerHeight;
  $('#progress').style.width = (scrollY / h * 100) + '%';
  let sec = null; $$('section[id]').forEach(s => { if (s.getBoundingClientRect().top <= mid) sec = s.id; });
  $$('[data-nav]').forEach(a => a.classList.toggle('active', a.dataset.nav === sec));
}

/* schools: hovering one flies the globe to its campus */
$$('.school').forEach(s => {
  const go = () => { $$('.school').forEach(x => x.classList.toggle('on', x === s)); setScene({ ...s.dataset, word: 'Campus', zoom: 2.4, fx: 'stars' }, true); };
  s.addEventListener('mouseenter', go); s.addEventListener('click', go);
});
/* languages: hovering one changes the whole ambiance */
const say = $('#say'); let langPick = null;
function markLang(l) { $$('.lang').forEach(x => x.classList.toggle('on', x === l)); if (say) say.textContent = l.dataset.say; }
$$('.lang').forEach(l => {
  const go = () => { if (langPick === l) return; langPick = l; markLang(l); setScene({ ...$('#toolkit').dataset, fx: l.dataset.fx, accent: l.dataset.accent }, true); };
  l.addEventListener('mouseenter', go); l.addEventListener('click', go); l.addEventListener('focus', go);
});

/* photo galleries: rows sized by each photo's proportions; click opens the photo full screen */
function gallery(key, cls) {
  const list = window.PHOTOS[key], rows = list.length <= 3 ? [list] : [list.slice(0, 2), list.slice(2)]; let i = 0;
  return '<div class="gal ' + (cls || '') + '">' + rows.map(r => '<div class="row" style="aspect-ratio:' + r.reduce((n, p) => n + p.w / p.h, 0).toFixed(3) + '">' + r.map(p => '<button style="--r:' + (p.w / p.h).toFixed(3) + '" data-g="' + key + '" data-i="' + (i++) + '" aria-label="' + p.alt + '"><img loading="lazy" src="' + p.src + '" alt="' + p.alt + '"></button>').join('') + '</div>').join('') + '</div>';
}
$$('.chapter').forEach((ch, i) => { if ((window.PHOTOS || {})['ch' + (i + 1)]) ch.querySelector('.photo').outerHTML = gallery('ch' + (i + 1), 'reveal'); });
const lb = $('#lb'); let lbG = null, lbI = 0;
function lbShow(d) { const l = window.PHOTOS[lbG]; lbI = (lbI + (d || 0) + l.length) % l.length; $('#lbImg').src = l[lbI].src; $('#lbImg').alt = l[lbI].alt; $('#lbCap').textContent = l[lbI].alt + (l.length > 1 ? '  ·  ' + (lbI + 1) + ' / ' + l.length : ''); lb.querySelector('.pv').style.display = lb.querySelector('.nx').style.display = l.length > 1 ? '' : 'none'; }
document.addEventListener('click', e => { const b = e.target.closest('.gal button'); if (!b) return; lbG = b.dataset.g; lbI = +b.dataset.i; lbShow(); lb.classList.add('show'); });
lb.addEventListener('click', e => { if (e.target.closest('.pv')) return lbShow(-1); if (e.target.closest('.nx')) return lbShow(1); if (e.target.id !== 'lbImg') lb.classList.remove('show'); });
addEventListener('keydown', e => { if (!lb.classList.contains('show')) return; if (e.key === 'Escape') lb.classList.remove('show'); if (e.key === 'ArrowLeft') lbShow(-1); if (e.key === 'ArrowRight') lbShow(1); });

/* =============== 5. SMALL INTERACTIONS =============== */
function count(el) {
  const to = parseFloat(el.dataset.count); el._done = true;
  if (reduce) return renderNum(el, to);
  const t1 = performance.now();
  (function step(t) { const k = Math.min(1, Math.max(0, (t - t1) / 1400)); renderNum(el, to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); })(t1);
}
const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.classList.add('in');
  e.target.querySelectorAll('[data-count]').forEach(count);
  e.target.querySelectorAll('.meter i').forEach(i => i.style.width = i.dataset.w + '%');
  io.unobserve(e.target);
}), { threshold: 0.2 });
$$('.reveal').forEach(el => io.observe(el));

$('#filters').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  $$('#filters button').forEach(x => x.classList.toggle('on', x === b));
  $$('#chips .chip').forEach(c => c.classList.toggle('off', b.dataset.f !== 'all' && c.dataset.g !== b.dataset.f));
});
if (!reduce) $$('[data-tilt]').forEach(c => {
  c.addEventListener('pointermove', e => { const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5; c.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`; });
  c.addEventListener('pointerleave', () => c.style.transform = '');
});
$('#copy').addEventListener('click', async e => {
  try { await navigator.clipboard.writeText(EMAIL); e.target.textContent = T('copied'); } catch (err) { e.target.textContent = EMAIL; }
  setTimeout(() => e.target.textContent = T('copy'), 2000);
});
/* panels: the border lights up near the cursor, the block tilts slightly and its shadow shifts */
$$('[data-panel]').forEach(p => {
  p.insertAdjacentHTML('afterbegin', '<i class="plate"></i><i class="edge"></i>');
  if (reduce) return;
  const flat = p.dataset.panel === 'flat';
  p.addEventListener('pointermove', e => {
    const r = p.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    p.style.setProperty('--mx', x * 100 + '%'); p.style.setProperty('--my', y * 100 + '%');
    p.style.setProperty('--sx', -(x - 0.5) * 30 + 'px'); p.style.setProperty('--sy', -(y - 0.5) * 24 + 'px');
    if (!flat) p.style.transform = `perspective(1400px) rotateY(${(x - 0.5) * 1.8}deg) rotateX(${-(y - 0.5) * 1.8}deg)`;
  });
  p.addEventListener('pointerleave', () => { p.style.transform = ''; p.style.setProperty('--sx', '0px'); p.style.setProperty('--sy', '0px'); });
});
/* tools: hovering a tool sketches its interface in the background; leaving brings the language scene back */
const toolkit = $('#toolkit');
function langScene() { const l = $('.lang.on'); $$('.chip').forEach(x => x.classList.remove('on')); if (current === toolkit) setScene({ ...toolkit.dataset, fx: l.dataset.fx, accent: l.dataset.accent }, true); }
$$('.chip[data-ui]').forEach(ch => {
  const go = () => { $$('.chip').forEach(x => x.classList.toggle('on', x === ch)); window.UI_TITLE = ch.dataset.title; setScene({ ...toolkit.dataset, fx: 'ui-' + ch.dataset.ui, accent: ch.dataset.accent }, true); };
  ch.addEventListener('mouseenter', go); ch.addEventListener('focus', go); ch.addEventListener('click', go);
});
$('#chips').addEventListener('mouseleave', langScene);

/* leadership: pick a commitment on the left, its detail (text, links, photos) shows on the right */
$$('.eg-tab').forEach(tb => tb.addEventListener('click', () => { if (egSel === +tb.dataset.eg) return; egSel = +tb.dataset.eg; const b = $('#egBody'); b.classList.add('swap'); setTimeout(() => { renderEg(); b.classList.remove('swap'); }, reduce ? 0 : 260); }));

/* beyond work: each tile switches the scene (arena / concert hall) */
function pickTile(tile, quiet) { $$('.tile').forEach(x => x.classList.toggle('on', x === tile)); setScene({ ...$('#beyond').dataset, fx: tile.dataset.fx, accent: tile.dataset.accent }, quiet); }
$$('.tile').forEach(tl => tl.addEventListener('click', () => pickTile(tl, true)));
/* profile card: opens on hover (desktop) or tap (touch) */
const me = $('#me');
me.querySelector('.logo').addEventListener('click', e => { if (matchMedia('(hover: none)').matches) { e.preventDefault(); me.classList.toggle('open'); } });
document.addEventListener('click', e => { if (!me.contains(e.target)) me.classList.remove('open'); });

/* logos & photos appear by themselves once the file exists (see README) */
$$('img[data-auto]').forEach(img => {
  const ok = () => img.parentNode.classList.add('has'), ko = () => img.remove();
  if (img.complete) (img.naturalWidth ? ok : ko)(); else { img.addEventListener('load', ok); img.addEventListener('error', ko); }
});

/* =============== START =============== */
if (document.fonts && document.fonts.load) { document.fonts.load('30px "Noto Serif JP"', '一期一会七転八起継続は力なり挑戦日本語你好市场学习品牌策略深圳').catch(() => {}); document.fonts.load('italic 40px "Instrument Serif"', 'Bonjour').catch(() => {}); document.fonts.load('700 30px "Caveat"', 'Paris').catch(() => {}); document.fonts.load('700 30px "Yomogi"', '一期一会七転八起継続は力なり挑戦日本語東京').catch(() => {}); document.fonts.load('700 30px "Ma Shan Zheng"', '你好市场学习品牌策略深圳').catch(() => {}); }
applyLang(firstLang());
addEventListener('scroll', pickScene, { passive: true }); pickScene();
requestAnimationFrame(frame);
})();
