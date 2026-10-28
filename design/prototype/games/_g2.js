
/* ═════════ GAMES V2 ENGINE ═════════ */
const ABORT = 'abort';
function mkAPI(o) {
  const P = Object.assign({ score: 0, shown: 0, tok: 0, paused: false, off: false }, o);
  P.alive = t => t === P.tok;
  P.w = async ms => { const t = P.tok; let left = ms; while (left > 0) { if (t !== P.tok) throw ABORT; const s = Math.min(40, left); await sleep(s); if (!P.paused && !P.off) left -= s; } if (t !== P.tok) throw ABORT; };
  P.frozen = () => P.paused || P.off;
  P.setRound = t => { if (o.rdEl) o.rdEl.textContent = t; };
  P.hint = (t, cls = '') => { if (!o.hintEl) return; o.hintEl.className = 'hint ' + cls; o.hintEl.querySelector('span').textContent = t; };
  P.addScore = n => { P.score += n; };
  P.reset = () => { P.score = 0; P.shown = 0; if (o.svEl) o.svEl.textContent = '0'; };
  if (o.svEl) (function roll() { requestAnimationFrame(roll); if (P.shown !== P.score) { P.shown += Math.ceil((P.score - P.shown) * .2); if (Math.abs(P.score - P.shown) < 1) P.shown = P.score; o.svEl.textContent = P.shown.toLocaleString('en-US'); } })();
  P.toast = (t, col = '#fff') => { const e = o.toastEl; if (!e) return; e.textContent = t; e.style.color = col; e.classList.remove('show'); void e.offsetWidth; e.classList.add('show'); };
  P.oops = () => { o.el.classList.add('oops'); setTimeout(() => o.el.classList.remove('oops'), 220); };
  P.rel = el => { const a = el.getBoundingClientRect(), b = o.el.getBoundingClientRect(); return [a.left - b.left + a.width / 2, a.top - b.top + a.height / 2]; };
  P.ring = (x, y, col, size = 70) => { const r = document.createElement('i'); r.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${size}px;height:${size}px;margin:${-size / 2}px 0 0 ${-size / 2}px;border-radius:50%;border:3px solid ${col}`; o.fxl.appendChild(r); r.animate([{ transform: 'scale(.5)', opacity: 1 }, { transform: 'scale(1.9)', opacity: 0, borderWidth: '1px' }], { duration: 480, easing: 'cubic-bezier(.2,.7,.3,1)' }).onfinish = () => r.remove(); };
  P.burst = (x, y, col, n = 9) => { for (let i = 0; i < n; i++) { const p = document.createElement('i'); const s = rnd(4, 8); p.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${s}px;height:${s}px;margin:${-s / 2}px;border-radius:${Math.random() < .5 ? '50%' : '2px'};background:${Math.random() < .25 ? '#fff' : col};box-shadow:0 0 6px ${col}`; o.fxl.appendChild(p); const a = Math.PI * 2 * i / n + rnd(-.3, .3), d = rnd(30, 58); p.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d}px) scale(.3)`, opacity: 0 }], { duration: rnd(380, 560), easing: 'cubic-bezier(.1,.7,.3,1)' }).onfinish = () => p.remove(); } };
  P.float = (x, y, t, col = '#fff') => { const f = document.createElement('b'); f.textContent = t; f.style.cssText = `position:absolute;left:${x}px;top:${y}px;transform:translate(-50%,-50%);font:900 18px var(--ui);color:${col};text-shadow:0 2px 10px rgba(0,0,0,.6);white-space:nowrap`; o.fxl.appendChild(f); f.animate([{ transform: 'translate(-50%,-50%) scale(.6)', opacity: 0 }, { transform: 'translate(-50%,-110%) scale(1.1)', opacity: 1, offset: .25 }, { transform: 'translate(-50%,-230%) scale(1)', opacity: 0 }], { duration: 800, easing: 'ease-out' }).onfinish = () => f.remove(); };
  P.hit = (el, col, pts) => { const [x, y] = P.rel(el); P.ring(x, y, col, Math.min(110, el.offsetWidth * 1.05 * (o.scale || 1))); P.burst(x, y, col); if (pts) P.float(x, y - 20, pts); };
  P.tap = async (el, dx = 0, dy = 0) => { const [x, y] = P.rel(el); o.fin.style.opacity = 1; o.fin.style.left = x + dx + rnd(-4, 4) + 'px'; o.fin.style.top = y + dy + rnd(-3, 6) + 'px'; await P.w(230); o.fin.classList.add('dn'); await P.w(90); o.fin.classList.remove('dn'); };
  P.press = (el, ms = 120) => { el.classList.add('dn'); setTimeout(() => el.classList.remove('dn'), ms); };
  P.hideFin = () => { o.fin.style.opacity = 0; };
  P.step = i => o.onStep && o.onStep(i);
  P.quiet = v => { if (o.bg) o.bg.quiet = v; };
  P.anim = (fn, ms) => new Promise((res, rej) => { const t = P.tok; let el = 0, last = performance.now(); const f = now => { if (t !== P.tok) return rej(ABORT); const d = now - last; last = now; if (!P.frozen()) el += d; const p = Math.min(1, el / ms); fn(p); p < 1 ? requestAnimationFrame(f) : res(); }; requestAnimationFrame(f); });
  P.timer = total => {
    if (o.demo) { const T = { total, done: false, left: () => total, stop() {} }; return T; }
    const T = { total, done: false }; let t0 = performance.now(), acc = 0, ps = null; const pc = o.el.querySelector('.tp circle.p'), tn = o.el.querySelector('.tn'), bar = o.el.querySelector('.tbar i'); let lastN = -1;
    T.left = () => { const now = performance.now(); const pa = acc + (ps ? now - ps : 0); return Math.max(0, total - (now - t0 - pa) / 1000); };
    T.hold = on => { if (on && !ps) ps = performance.now(); else if (!on && ps) { acc += performance.now() - ps; ps = null; } };
    const tick = () => { if (T.stopped) return; T.hold(P.frozen()); const l = T.left(), f = l / total; bar.style.width = (f * 100) + '%'; if (pc) pc.style.strokeDashoffset = 138.2 * (1 - f); const n = Math.ceil(l); if (tn && n !== lastN) { tn.textContent = n; lastN = n; if (l <= 5 && l > 0 && !o.calm) { tn.classList.remove('tick'); void tn.offsetWidth; tn.classList.add('tick'); } }
      if (!o.calm) { o.el.classList.toggle('warn', f <= .4 && l > 5); o.el.classList.toggle('low', l <= 5 && l > 0); } if (l <= 0) { T.done = true; o.el.classList.remove('warn', 'low'); return; } requestAnimationFrame(tick); };
    tick(); T.stop = () => { T.stopped = true; o.el.classList.remove('warn', 'low'); }; P.T = T; return T; };
  return P;
}

const SECT = {};
function Game(g) {
  const host = SECT[g.sec]; const calm = !!g.calm;
  const step = document.createElement('div'); step.className = 'step';
  const piecesToggle = g.pieces ? `<span class="swl">PIECES</span><button data-pm="enamel" aria-pressed="true">Enamel</button><button data-pm="candy" aria-pressed="false">Candy gloss</button>` : '';
  step.innerHTML = `<div class="ph ${calm ? 'calm' : ''} introOn" style="--gc:${g.col}"><canvas class="bg" data-type="${g.bg}" data-glow="${g.glow || g.col}"></canvas><div class="vig"></div><div class="sb"><span>9:41</span><span>●●● ▮</span></div>
    <div class="ui"><div class="hdr"><span class="xb" title="Pause">✕</span><div class="ttl"><b>${g.name}</b><span class="rd">ROUND 1</span></div>
      <div class="tp"><svg width="52" height="52"><circle cx="26" cy="26" r="22" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="4"/><circle class="p" cx="26" cy="26" r="22" fill="none" stroke-width="4" stroke-linecap="round" stroke-dasharray="138.2" stroke-dashoffset="0"/></svg><b class="tn">${g.secs}</b></div></div>
      <div class="tbar"><i></i></div><div class="row"><div class="sc"><span class="sv">0</span><small>pts</small></div><div class="rt"></div></div>
      <div class="stage"></div><div class="hint"><i></i><span>Get ready</span></div></div>
    <div class="intro"><div class="ihd"><span class="bk2">✕</span></div>
      <div class="demo"><div class="dsc"><div class="stage"></div></div><div class="fxl"></div><div class="finger"></div></div>
      <div class="itx"><div class="ichips">${g.kick.split(' · ').map((t, i) => `<span class="${i ? '' : 'cat'}">${t.charAt(0) + t.slice(1).toLowerCase()}</span>`).join('')}</div><h3>${g.name}</h3>
      <p class="isent">${(g.how || g.steps.map(x => x.replace(/[.\s]+$/, '')).join('. ') + '.')}</p>
      <button class="pill p-w istart">${calm ? 'Begin' : 'Start'}</button></div></div>
    <div class="cdim"></div><div class="cd"><b></b></div>
    <div class="toast"></div><div class="fxl"></div><div class="finger"></div>
    <div class="succ ${calm ? 'calm' : ''}"><div class="rays" style="--rc:color-mix(in srgb,${g.col} 22%,transparent)"></div><span class="k">${g.name.toUpperCase()}</span><h3 class="sh">Level complete</h3>${calm ? '<div class="chk"><svg width="40" height="40" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></div><p class="cl"></p>' : '<div class="stars"></div><div class="big">0</div>'}<div class="st"></div><div class="grow"></div><button class="pill p-w">Done for now</button><button class="pill p-t">${calm ? 'Again' : 'Another round'}</button></div>
    <div class="pz"><div class="dimall"></div><div class="sheet"><div class="gr"></div><p class="t">Paused</p><p class="s">Leave now and this round won't count. Your streak is safe.</p><button class="pill p-w" data-a="resume">Resume</button><button class="pill p-t" data-a="restart" style="margin-top:4px">Restart</button><button class="pill p-t" data-a="quit" style="color:#FF8A8A">Quit</button></div></div></div>
    <div class="sw">${piecesToggle}<button class="lv" data-leave="1">Simulate leaving the app</button></div>
    <div class="cap"><b>${g.name}</b>${g.cap}</div>`;
  host.appendChild(step);
  const el = step.querySelector('.ph'), q = s => el.querySelector(s);
  const cv = el.querySelector('canvas'); const bg = BG(cv); io.observe(cv); requestAnimationFrame(() => bg.build());
  const ui = q('.ui'), intro = q('.intro'), demo = q('.demo');
  const P = mkAPI({ el, stage: ui.querySelector('.stage'), fxl: el.querySelector(':scope > .fxl'), fin: el.querySelector(':scope > .finger'), rt: q('.rt'), rdEl: q('.rd'), hintEl: q('.hint'), svEl: q('.sv'), toastEl: q('.toast'), bg, calm });
  const stepsLi = [...intro.querySelectorAll('.isteps li')];
  const D = mkAPI({ el: demo, stage: demo.querySelector('.stage'), fxl: demo.querySelector('.fxl'), fin: demo.querySelector('.finger'), rt: document.createElement('div'), demo: true, scale: .84, onStep: i => stepsLi.forEach((li, k) => li.classList.toggle('on', k === i)) });
  // materials toggle for pieces
  step.querySelectorAll('[data-pm]').forEach(b => b.onclick = () => { el.dataset.pm = b.dataset.pm; el.querySelectorAll('[data-r=piece]').forEach(x => x.dataset.m = b.dataset.pm); step.querySelectorAll('[data-pm]').forEach(x => x.setAttribute('aria-pressed', x === b)); });
  P.pm = () => el.dataset.pm || 'enamel'; D.pm = P.pm;
  // pause
  const pz = q('.pz'); let playing = false, next = null;
  el._mode = m => { if (m === 'game') { el._go && el._go(); } else { if (playing || P.paused) { pz.classList.remove('on'); P.paused = false; next = null; P.tok++; } else { const s = q('.succ'); s && s.classList.remove('on'); } } };
  const setOff = v => { P.off = v; D.off = v; };
  new IntersectionObserver(es => es.forEach(e => setOff(!e.isIntersecting)), { rootMargin: '200px' }).observe(el);
  const pause = why => { if (!playing || P.paused) return; P.paused = true; pz.querySelector('.s').textContent = why === 'bg' ? 'You left the app, so we paused. The timer stopped with you.' : (calm ? 'Take your time. Nothing is lost.' : "Leave now and this round won't count. Your streak is safe."); pz.classList.add('on'); };
  q('.xb').onclick = () => pause('x');
  step.querySelector('[data-leave]').onclick = () => { if (!playing) return; el.animate([{ filter: 'brightness(1)' }, { filter: 'brightness(.2)' }, { filter: 'brightness(1)' }], { duration: 700 }); setTimeout(() => pause('bg'), 350); };
  const countdown = async (short) => { const cd = q('.cd b'), dim = q('.cdim'); dim.classList.add('on'); const W = el.clientWidth, H = el.clientHeight;
    for (const t of short ? ['3', '2', '1'] : ['3', '2', '1', 'Go']) { cd.textContent = t; cd.animate([{ transform: 'scale(1.8)', opacity: 0 }, { transform: 'scale(1)', opacity: 1, offset: .35 }, { transform: 'scale(.92)', opacity: 1, offset: .8 }, { transform: 'scale(.8)', opacity: 0 }], { duration: 620, easing: 'cubic-bezier(.3,1.2,.5,1)', fill: 'forwards' }); P.ring(W / 2, H / 2, t === 'Go' ? g.col : 'rgba(255,255,255,.8)', t === 'Go' ? 260 : 170); if (t === 'Go') P.burst(W / 2, H / 2, g.col, 16); await sleep(640); }
    dim.classList.remove('on'); };
  pz.querySelectorAll('[data-a]').forEach(b => b.onclick = async () => { const a = b.dataset.a; pz.classList.remove('on');
    if (a === 'resume') { if (!calm) await countdown(true); P.paused = false; }
    else { next = a; P.paused = false; P.tok++; } });
  // intro with live demo
  const runIntro = async () => { if (window.GMODE === 'game') { intro.classList.add('off'); el.classList.remove('introOn'); return; }
    el.classList.add('introOn'); intro.classList.remove('off'); stepsLi.forEach(l => l.classList.remove('on')); P.hint('');
    let go = false; const st = q('.istart'); st.onclick = () => { go = true; }; el._go = () => { go = true; };
    const loopDemo = (async () => { while (!go) { D.tok++; D.stage.innerHTML = ''; D.fxl.innerHTML = ''; try { await g.round(D); } catch (e) { if (e !== ABORT) { console.log(g.name, e); return; } } } })();
    while (!go) await sleep(60);
    el._go = null; D.tok++; D.hideFin(); P.hideFin(); intro.classList.add('off'); el.classList.remove('introOn'); await sleep(360); };
  const success = async r => { P.hideFin(); const s = q('.succ'); s.querySelector('.sh').textContent = r.title;
    if (calm) s.querySelector('.cl').textContent = r.line || ''; else { s.querySelector('.big').textContent = P.score.toLocaleString('en-US'); s.querySelector('.stars').innerHTML = [0, 1, 2].map(i => `<span class="${i === 1 ? 'mid' : ''}" style="--d:${.25 + i * .25}s;position:relative">${i < r.stars ? star(i === 1 ? 96 : 70) : starEmpty(i === 1 ? 96 : 70)}</span>`).join(''); }
    s.querySelector('.st').innerHTML = (r.stats || []).map(t => `<span>${t}</span>`).join(''); s.classList.add('on'); await sleep(4400); s.classList.remove('on'); await sleep(450); };
  (async () => { await sleep(300 + Math.random() * 900); let skip = false;
    for (;;) {
      try {
        if (!skip) await runIntro(); skip = false; P.stage.innerHTML = ''; P.rt.innerHTML = ''; P.reset(); P.setRound(g.round0 || ''); P.hint(calm ? '' : 'Get ready');
        if (calm) { P.hint(g.settle || 'Get comfortable'); await sleep(1200); } else await countdown();
        playing = true; next = null; const r = await g.round(P); playing = false; P.T && P.T.stop(); P.hideFin(); P.quiet(0); await success(r);
      } catch (e) { playing = false; P.T && P.T.stop(); P.hideFin(); P.quiet(0); if (e !== ABORT) { console.log(g.name, e); await sleep(2000); } skip = next === 'restart'; }
    } })();
}

/* ═════════ helpers for pieces ═════════ */
const PM = P => P.pm ? P.pm() : 'enamel';
const piece = (P, cls, c, inner = '', extra = '') => `<div data-r="piece" data-m="${PM(P)}" style="display:contents"><div class="${cls} mat" style="--c:${c};${extra}">${inner}</div></div>`;
const toy = (cls, c, inner = '', extra = '') => `<div data-m="toy" style="display:contents"><div class="${cls} mat" style="--c:${c};${extra}">${inner}</div></div>`;
const arrowSVG = (dir, s = 34, col = '#fff') => { const r = { u: -90, r: 0, d: 90, l: 180 }[dir]; return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" style="transform:rotate(${r}deg)"><path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="${col}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`; };
const starSVG = (s = 38) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><path d="M12 2.8l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 16.8l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" fill="#FFE14D" stroke="#C98A00" stroke-width="1.2" stroke-linejoin="round"/></svg>`;
const combo = (P, label = 'Streak') => { P.rt.innerHTML = `<div class="combo">${label} <b class="ck">0</b></div>`; const cb = P.rt.querySelector('.combo'), ck = P.rt.querySelector('.ck'); return n => { ck.textContent = n; cb.classList.toggle('hot', n >= 3); cb.classList.remove('pop'); void cb.offsetWidth; cb.classList.add('pop'); }; };
const livesUI = (P, n = 3) => { P.rt.innerHTML = `<div class="lives">${'<i></i>'.repeat(n)}</div>`; return [...P.rt.querySelectorAll('i')]; };
