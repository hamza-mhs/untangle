
/* ═════ BATCH 1 (from the catalogue) ═════ */
const clock = (P, frame) => { const tok = P.tok; let el = 0, last = performance.now(), on = true;
  const loop = n => { if (!on || tok !== P.tok) return; const d = Math.min(64, n - last); last = n; if (!P.frozen()) el += d; frame(el); requestAnimationFrame(loop); }; requestAnimationFrame(loop);
  return { now: () => el, stop: () => { on = false; } }; };

/* ── Stack tower ── */
def({ sec: 'b1', name: 'Stack tower', kick: 'TIMING · 40 SEC', col: '#FFC53D', glow: '#FF7A1F', bg: 'persp', secs: 40, best: '17 floors', pieces: 1,
  steps: ['A slab slides back and forth', 'Tap to drop it on the tower', 'Whatever hangs over gets cut off'],
  cap: 'Slabs are Enamel pieces (Candy gloss below) on a recessed base. A perfect drop keeps the full width and builds a combo. Overhang breaks off and falls. The tower scrolls down as it grows.',
  round: async P => {
    const HUE = ['#FF3D8E', '#FF7A1F', '#FFC53D', '#17D9A3', '#22A6FF', '#8B3DFF'];
    P.stage.innerHTML = `<div class="stk"><div class="stkin" data-r="piece" data-m="${PM(P)}"></div></div><div data-m="well" style="display:contents"><div class="stkbase mat" style="--c:#2A1608"></div></div><div class="stktap">Tap to drop</div>`;
    const box = P.stage.querySelector('.stkin'), W = 264, H = 22; const set = combo(P, 'Perfect');
    const slab = (n, l, w) => { const e = document.createElement('div'); e.className = 'slb mat'; e.style.cssText = `left:${l}px;width:${w}px;bottom:${n * H}px;--c:${HUE[n % HUE.length]}`; box.appendChild(e); return e; };
    let L0 = 52, w = 160, n = 0, perf = 0, best = 0; slab(0, L0, w);
    const T = P.timer(40); const errs = [0, 7, -12, 2, 15, -4, 0, -19, 9, 1, -6, 22, 0, -11];
    while (!T.done && n < 14 && w > 0) { n++; P.setRound(`FLOOR ${n}`); if (n > 8) box.style.transform = `translateY(${(n - 8) * H}px)`;
      const v = .16 + n * .012, err = errs[n - 1]; let target = Math.max(0, Math.min(W - w, L0 + err)); const start = target > (W - w) / 2 ? 0 : W - w; const e = slab(n, start, w);
      P.step(0); P.hint('Tap to drop'); const dur = Math.max(450, Math.abs(target - start) / v);
      const a = P.anim(p => e.style.left = (start + (target - start) * p) + 'px', dur); a.catch(() => {}); await P.w(Math.max(0, dur - 320)); P.step(1); await P.tap(e); await a;
      if (Math.abs(err) <= 3) { target = L0; e.style.left = L0 + 'px'; perf++; set(perf); P.hit(e, '#fff', `+${20 + perf * 5}`); P.addScore(20 + perf * 5); P.hint('Perfect drop', 'good'); if (perf > 1) P.toast(`Perfect ×${perf}`, '#FFE14D'); }
      else { const nl = Math.max(L0, target), nr = Math.min(L0 + w, target + w), ov = nr - nl; P.step(2);
        const cut = document.createElement('div'); cut.className = 'slb mat'; const cl = target < L0 ? target : nr, cw = w - ov; cut.style.cssText = `left:${cl}px;width:${cw}px;bottom:${n * H}px;--c:${HUE[n % HUE.length]}`; box.appendChild(cut);
        cut.animate([{ transform: 'none', opacity: 1 }, { transform: `translate(${target < L0 ? -30 : 30}px,180px) rotate(${target < L0 ? -40 : 40}deg)`, opacity: 0 }], { duration: 800, easing: 'cubic-bezier(.5,0,.8,.6)', fill: 'forwards' }).onfinish = () => cut.remove();
        e.style.left = nl + 'px'; e.style.width = ov + 'px'; L0 = nl; w = ov; perf = 0; set(0); P.hit(e, HUE[n % HUE.length], '+10'); P.addScore(10); P.hint(cw > 14 ? 'Trimmed. Watch the edge' : 'Close', cw > 14 ? 'bad' : 'good'); }
      best = n; P.hideFin(); await P.w(300); }
    await fin(P, T);
    return { title: 'Tall tower', stars: best >= 13 ? 3 : 2, stats: [`${best} floors`, `${Math.round(w)} px wide at the top`, '+90 XP'] };
  } });

/* ── Rocket hop ── */
def({ sec: 'b1', name: 'Rocket hop', kick: 'TIMING · 40 SEC', col: '#22A6FF', glow: '#4A5BFF', bg: 'dots', secs: 40, best: '6 hops',
  steps: ['The next planet swings side to side', 'Wait until it lines up above you', 'Tap to launch and land on it'],
  cap: 'A toy rocket on a candy planet. The next planet swings; launch too early or late and the rocket sails past and you lose a life. Each landing scrolls the world down to the next planet.',
  round: async P => {
    const PC = ['#FF7A1F', '#8B3DFF', '#17D9A3', '#FF3D8E', '#FFC53D', '#22A6FF', '#FF4848'];
    const rocket = `<svg width="30" height="44" viewBox="0 0 30 44"><path class="flm" d="M10 34 Q15 48 20 34 Z" fill="#FFC53D"/><path d="M15 2 C 26 10, 25 26, 21 34 L 9 34 C 5 26, 4 10, 15 2 Z" fill="#F4F4F6"/><path d="M15 2 C 20 6, 22 10, 23 14 L 7 14 C 8 10, 10 6, 15 2Z" fill="#FF4848"/><circle cx="15" cy="21" r="4.5" fill="#22A6FF" stroke="#0E3A66" stroke-width="2"/><path d="M9 26 L3 35 L9 33 Z M21 26 L27 35 L21 33 Z" fill="#FF4848"/></svg>`;
    P.stage.innerHTML = `<div class="rkw"></div><div class="rk">${rocket}</div>`;
    const W = P.stage.querySelector('.rkw'), R = P.stage.querySelector('.rk'); const lives = livesUI(P); let lv = 3, hops = 0, ci = 0;
    const planet = c => { const e = document.createElement('div'); e.className = 'pln'; e.style.setProperty('--c', c); e.innerHTML = '<i></i><i></i>'; W.appendChild(e); return e; };
    const BOT = 330, TOP = 120, RAD = 34, A = 88, OM = 2 * Math.PI / 2600; let phi = 0;
    let lo = planet(PC[0]), hi = planet(PC[1]); lo.style.left = '132px'; lo.style.top = BOT + 'px'; hi.style.top = TOP + 'px';
    let rx = 132, ry = BOT - RAD - 22, ride = 'lo', flying = false;
    const ck = clock(P, el => { const x = 132 + A * Math.sin(phi + OM * el); if (ride !== 'move') { hi.style.left = x + 'px'; hi.dataset.x = x; } if (ride === 'hi') rx = x; R.style.left = rx + 'px'; R.style.top = ry + 'px'; });
    const T = P.timer(40); const errs = [40, -60, 270, 30, -25, 80, 0, -40];
    try {
      while (!T.done && hops < 6 && lv > 0) { P.setRound(`HOP ${hops + 1}`); P.step(0); P.hint('Wait for it to line up', 'watch');
        const el = ck.now(); const k = Math.ceil((OM * (el + 1300) + phi) / Math.PI); const tz = (k * Math.PI - phi) / OM; const err = errs[(hops + (3 - lv)) % errs.length];
        const tL = tz - 600 + err; while (ck.now() < tL - 320) await P.w(16); P.step(1); P.fin.style.opacity = 1; { const [fx, fy] = P.rel(R); P.fin.style.left = fx + 'px'; P.fin.style.top = fy + 'px'; } while (ck.now() < tL) await P.w(16); P.fin.classList.add('dn'); setTimeout(() => P.fin.classList.remove('dn'), 90); P.step(2); R.classList.add('fly'); flying = true;
        const y0 = ry; await P.anim(p => { ry = y0 + (TOP - RAD - 22 - y0) * p; }, 600);
        const hx = +hi.dataset.x; if (Math.abs(hx - 132) < 30) {
          hops++; ride = 'hi'; R.classList.remove('fly'); const pts = 20 + Math.max(0, 40 - Math.round(Math.abs(hx - 132))); P.hit(hi, hi.style.getPropertyValue('--c'), `+${pts}`); P.addScore(pts); P.hint(Math.abs(hx - 132) < 10 ? 'Bullseye' : 'Landed', 'good');
          await P.w(350); const xh = hx; const old = lo; ci++; const nw = planet(PC[(ci + 1) % PC.length]); nw.style.top = (TOP - 220) + 'px'; nw.style.left = '132px'; phi = phi + OM * ck.now() * 0;
          ride = 'move'; await P.anim(p => { const e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; hi.style.top = (TOP + (BOT - TOP) * e) + 'px'; hi.style.left = (xh + (132 - xh) * e) + 'px'; old.style.top = (BOT + 220 * e) + 'px'; nw.style.top = (TOP - 220 + 220 * e) + 'px'; rx = xh + (132 - xh) * e; ry = TOP - RAD - 22 + (BOT - TOP) * e; }, 700);
          old.remove(); lo = hi; hi = nw; lo.dataset.x = 132; phi = -OM * ck.now(); ride = 'lo'; rx = 132; ry = BOT - RAD - 22; }
        else { R.classList.add('fly'); await P.anim(p => { ry = TOP - RAD - 22 - 200 * p; R.style.opacity = 1 - p; }, 500); lv--; lives[lv].classList.add('lost'); P.oops(); P.hint('Missed it. Wait for the line-up', 'bad');
          R.classList.remove('fly'); ry = BOT - RAD - 22; R.style.opacity = 1; R.animate([{ transform: 'translate(-50%,-50%) scale(0)' }, { transform: 'translate(-50%,-50%) scale(1)' }], { duration: 300, easing: 'cubic-bezier(.3,1.6,.5,1)' }); await P.w(500); }
        flying = false; P.hideFin(); }
    } finally { ck.stop(); }
    await fin(P, T);
    return { title: hops ? 'Smooth landings' : 'Lift-off', stars: hops >= 6 && lv === 3 ? 3 : hops >= 3 ? 2 : 1, stats: [`${hops} hops`, `${lv} of 3 lives`, '+80 XP'] };
  } });

/* ── Merge garden ── */
const GSVG = [null,
  '<svg viewBox="0 0 40 40"><ellipse cx="20" cy="23" rx="10" ry="12.5" fill="#B9773E"/><ellipse cx="16" cy="18" rx="3" ry="5" fill="#EBB57E" opacity=".85"/><path d="M20 10.5 q3 -5 8 -4" stroke="#6B3E1A" stroke-width="2.6" fill="none" stroke-linecap="round"/></svg>',
  '<svg viewBox="0 0 40 40"><ellipse cx="20" cy="33" rx="12" ry="4" fill="#5A3417"/><path d="M20 33 V18" stroke="#2E9E5B" stroke-width="3" stroke-linecap="round"/><path d="M20 22 C 10 22, 7 13, 9 9 C 16 9, 20 14, 20 22Z" fill="#3BE37A"/><path d="M20 19 C 29 19, 33 11, 31 7 C 24 7, 20 11, 20 19Z" fill="#22C55E"/></svg>',
  '<svg viewBox="0 0 40 40"><path d="M20 36 V22" stroke="#2E9E5B" stroke-width="3" stroke-linecap="round"/><path d="M20 30 C 13 30, 11 25, 12 23 C 17 23, 20 26, 20 30Z" fill="#3BE37A"/>' + [0, 72, 144, 216, 288].map(a => `<ellipse cx="20" cy="9" rx="5.2" ry="7" fill="#FF6FA8" transform="rotate(${a} 20 16)"/>`).join('') + '<circle cx="20" cy="16" r="4.6" fill="#FFC53D"/></svg>'];
def({ sec: 'b1', name: 'Merge garden', kick: 'PLANNING · 45 SEC', col: '#17D9A3', bg: 'dots', secs: 45, best: '3 flowers in 9 moves',
  steps: ['Drag a seed onto a matching seed', 'Two seeds make a sprout, two sprouts a flower', 'Grow three flowers in as few moves as you can'],
  cap: 'Clay seeds, sprouts and flowers in recessed soil wells. Each merge pops, a new seed drops in, and every finished flower flies up to the goal row.',
  round: async P => {
    P.stage.innerHTML = `<div class="mgo"><span>GOAL</span>${'<i></i>'.repeat(3)}</div><div class="mgb">${Array.from({ length: 16 }, () => '<div data-m="well" style="display:contents"><div class="mgc mat" style="--c:#2B1C10"></div></div>').join('')}</div>`;
    const cells = [...P.stage.querySelectorAll('.mgc')], goals = [...P.stage.querySelectorAll('.mgo i')], lv = Array(16).fill(0);
    P.rt.innerHTML = `<div class="combo">Moves <b class="mv">0</b></div>`; const mv = P.rt.querySelector('.mv'); let moves = 0, flowers = 0;
    const put = (i, l, drop) => { lv[i] = l; cells[i].innerHTML = l ? `<div class="gi">${GSVG[l]}</div>` : ''; if (l && drop) cells[i].firstChild.animate([{ transform: 'translateY(-26px) scale(.6)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 380, easing: 'cubic-bezier(.3,1.6,.5,1)' }); };
    shuffle([...Array(16).keys()]).slice(0, 8).forEach((i, k) => put(i, k === 0 ? 2 : 1, true));
    const T = P.timer(45); P.setRound('3 FLOWERS');
    while (!T.done && flowers < 3) {
      let pair = null; for (const L of [2, 1]) { const idx = lv.map((v, i) => v === L ? i : -1).filter(i => i >= 0); if (idx.length >= 2) { pair = idx.slice(0, 2); break; } }
      if (!pair) { const e = lv.map((v, i) => v ? -1 : i).filter(i => i >= 0); if (!e.length) break; put(pick(e), 1, true); await P.w(300); continue; }
      const [a, b] = Math.random() < .5 ? pair : [pair[1], pair[0]]; P.step(0); P.hint('Drag to a match'); await P.w(rnd(250, 500));
      await P.tap(cells[a]); const it = cells[a].firstChild; const [ax, ay] = P.rel(cells[a]), [bx, by] = P.rel(cells[b]); const sc = P.scale || 1;
      P.fin.style.left = bx + 'px'; P.fin.style.top = by + 'px'; it.style.zIndex = 5; await P.anim(p => it.style.transform = `translate(${(bx - ax) * p / sc}px,${(by - ay) * p / sc}px) scale(${1 + .15 * Math.sin(p * Math.PI)})`, 320);
      moves++; mv.textContent = moves; const nl = lv[b] + 1; put(a, 0); P.step(1);
      if (nl === 3) { put(b, 3); const fl = cells[b].firstChild; P.hit(cells[b], '#FF6FA8', '+40'); P.addScore(40); P.hint('A flower', 'good'); await P.w(380); const [gx, gy] = P.rel(goals[flowers]); fl.animate([{ transform: 'none' }, { transform: `translate(${(gx - bx) / sc}px,${(gy - by) / sc}px) scale(.5)`, opacity: .2 }], { duration: 450, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'forwards' }); await P.w(450); goals[flowers].classList.add('on'); goals[flowers].innerHTML = GSVG[3]; flowers++; put(b, 0); P.step(2); }
      else { put(b, nl); cells[b].firstChild.animate([{ transform: 'scale(.6)' }, { transform: 'scale(1.15)' }, { transform: 'none' }], { duration: 380, easing: 'cubic-bezier(.3,1.6,.5,1)' }); P.hit(cells[b], '#3BE37A', '+10'); P.addScore(10); P.hint('Sprouted', 'good'); }
      const e = lv.map((v, i) => v ? -1 : i).filter(i => i >= 0); if (e.length && lv.filter(Boolean).length < 9) put(pick(e), 1, true); P.hideFin(); await P.w(250); }
    await fin(P, T);
    return { title: flowers === 3 ? 'Garden grown' : 'Nearly there', stars: flowers === 3 ? (moves <= 10 ? 3 : 2) : 1, stats: [`${flowers} of 3 flowers`, `${moves} moves`, '+90 XP'] };
  } });

/* ── Laser lab ── */
const LVLS = [{ em: [0, 0], re: [3, 0], walls: [], m: [[0, 3, '\\', '/'], [3, 3, '/', '\\']], extra: [] },
  { em: [4, 0], re: [3, 4], walls: [[0, 2]], m: [[4, 2, '/', '\\'], [1, 2, '/', '\\'], [1, 4, '\\', '/'], [3, 1, '/', '/']], extra: [2] },
  { em: [2, 0], re: [4, 0], walls: [[2, 4], [0, 1]], m: [[2, 3, '\\', '/'], [4, 3, '/', '\\'], [0, 3, '\\', '\\']], extra: [] }];
def({ sec: 'b1', name: 'Laser lab', kick: 'PLANNING · 60 SEC', col: '#FF3D8E', glow: '#8B3DFF', bg: 'grid', secs: 60, best: '3 labs, 0 extra turns', pieces: 1,
  steps: ['A beam fires from the emitter', 'Tap a mirror to turn it', 'Route the beam into the reactor'],
  cap: 'Mirrors are Enamel pieces you tap to turn (Candy gloss below), sitting in a recessed grid. The beam re-routes live after every tap, and the reactor ignites when it lands.',
  round: async P => {
    const S = 50, ctr = (r, c) => [c * S + S / 2, r * S + S / 2]; const set = combo(P, 'Labs'); let labs = 0, taps = 0, extra = 0;
    const T = P.timer(60);
    for (const [li, L] of LVLS.entries()) { if (T.done) break; P.setRound(`LAB ${li + 1} OF 3`);
      const st = L.m.map(m => m[3]);
      P.stage.innerHTML = `<div data-m="well" style="display:contents"><div class="llb mat" style="--c:#0C0D18">${Array.from({ length: 25 }, (_, i) => `<i class="llc" style="left:${(i % 5) * S}px;top:${Math.floor(i / 5) * S}px"></i>`).join('')}
        <svg class="llbeam" width="250" height="250"><defs><filter id="lg${li}"><feGaussianBlur stdDeviation="3"/></filter></defs><polyline class="bg" fill="none" stroke="#FF3D8E" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" filter="url(#lg${li})" opacity=".8"/><polyline class="bc" fill="none" stroke="#FFE1EE" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <div data-m="toy" style="display:contents"><div class="lem mat" style="--c:#4A5BFF;left:${L.em[1] * S + 5}px;top:${L.em[0] * S + 5}px"><i></i></div></div>
        ${L.walls.map(([r, c]) => `<div data-m="graphite" style="display:contents"><div class="lwl mat" style="--c:#555;left:${c * S + 5}px;top:${r * S + 5}px"></div></div>`).join('')}
        <div class="lre" style="left:${L.re[1] * S + 5}px;top:${L.re[0] * S + 5}px"><i></i></div>
        <div data-r="piece" data-m="${PM(P)}" style="display:contents">${L.m.map(([r, c], k) => `<div class="lmr mat" data-k="${k}" style="--c:#6B3DFF;left:${c * S + 8}px;top:${r * S + 8}px"></div>`).join('')}</div>
        ${L.m.map(([r, c], k) => `<div class="lmb" style="left:${c * S + 5}px;top:${r * S + 5}px"><b class="mb" style="transform:rotate(${st[k] === '/' ? -45 : 45}deg)"></b></div>`).join('')}</div></div>`;
      const M = [...P.stage.querySelectorAll('.lmr')], MB = [...P.stage.querySelectorAll('.lmb .mb')], bg = P.stage.querySelector('.bg'), bc = P.stage.querySelector('.bc'), re = P.stage.querySelector('.lre');
      const trace = () => { let [r, c] = L.em, d = 'R'; const [ex, ey] = ctr(r, c); const pts = [[ex + 22, ey]]; let hit = false;
        for (let s = 0; s < 40; s++) { const [dr, dc] = { R: [0, 1], L: [0, -1], U: [-1, 0], D: [1, 0] }[d]; r += dr; c += dc;
          if (r < 0 || r > 4 || c < 0 || c > 4) { const [x, y] = ctr(r - dr, c - dc); pts.push([x + dc * S / 2, y + dr * S / 2]); break; }
          if (L.walls.some(w => w[0] === r && w[1] === c)) { const [x, y] = ctr(r, c); pts.push([x - dc * 20, y - dr * 20]); break; }
          if (L.re[0] === r && L.re[1] === c) { const [x, y] = ctr(r, c); pts.push([x - dc * 19, y - dr * 19]); hit = true; break; }
          const k = L.m.findIndex(m => m[0] === r && m[1] === c); if (k >= 0) { pts.push(ctr(r, c)); d = st[k] === '/' ? { R: 'U', U: 'R', L: 'D', D: 'L' }[d] : { R: 'D', D: 'R', L: 'U', U: 'L' }[d]; } }
        const s = pts.map(p => p.join(',')).join(' '); bg.setAttribute('points', s); bc.setAttribute('points', s); return hit; };
      trace(); P.step(0); P.hint('Route the beam'); await P.w(700);
      const order = []; L.m.forEach((m, k) => { if (m[2] !== m[3]) order.push(k); }); if (li === 1) order.splice(1, 0, 1, 1);
      for (const k of order) { if (T.done) break; P.step(1); await P.w(rnd(300, 600)); await P.tap(M[k]); taps++; st[k] = st[k] === '/' ? '\\' : '/'; const b = MB[k]; b.style.transform = `rotate(${st[k] === '/' ? -45 : 45}deg)`; M[k].animate([{ transform: 'scale(.9)' }, { transform: 'none' }], { duration: 200 });
        if (trace()) break; }
      if (li === 1) extra += 2;
      if (trace()) { labs++; set(labs); P.step(2); re.classList.add('on'); const [x, y] = P.rel(re); P.ring(x, y, '#FF3D8E', 90); P.burst(x, y, '#FFE1EE', 16); P.float(x, y - 24, '+50'); P.addScore(50); P.toast('Ignited', '#FFB3D1'); P.hint(li === 1 ? 'Two extra turns' : 'Clean route', li === 1 ? '' : 'good'); }
      P.hideFin(); await P.w(1300); }
    await fin(P, T);
    return { title: 'Reactors lit', stars: extra ? 2 : 3, stats: [`${labs} of 3 labs`, `${taps} turns, ${extra} extra`, '+100 XP'] };
  } });

/* ── Bridge builder ── */
const BLV = [{ seg: [4, 2], tray: [3, 4, 2, 1] }, { seg: [2, 2, 2], tray: [2, 1, 2, 3, 2] }, { seg: [1, 3, 2], tray: [2, 3, 1, 4] }];
def({ sec: 'b1', name: 'Bridge builder', kick: 'PLANNING · 60 SEC', col: '#FF7A1F', glow: '#FFC53D', bg: 'persp', secs: 60, best: '3 bridges, 0 misfits', pieces: 1,
  steps: ['Look at each gap between the posts', 'Drag a beam that fits it exactly', 'Fill every gap, then watch Pip cross'],
  cap: 'Beams are Enamel pieces (Candy gloss below) in a tray. A beam that doesn\'t fit shakes back. When every gap is filled, a little creature walks across, the bridge dips under it, and it waves from the far side.',
  round: async P => {
    const U = 32, X0 = 36, DECK = 176; let built = 0, misfit = 0; const set = combo(P, 'Bridges'); const T = P.timer(60);
    const pip = `<svg width="34" height="34" viewBox="0 0 34 34"><ellipse cx="17" cy="20" rx="13" ry="11" fill="#7CF0C6"/><ellipse cx="13" cy="16" rx="4" ry="2.5" fill="#fff" opacity=".5"/><circle cx="12.5" cy="20" r="2.4" fill="#063"/><circle cx="21.5" cy="20" r="2.4" fill="#063"/><path d="M14 25 q3 2 6 0" stroke="#063" stroke-width="1.8" fill="none" stroke-linecap="round"/><path class="arm" d="M29 18 q5 -4 3 -9" stroke="#7CF0C6" stroke-width="3.5" fill="none" stroke-linecap="round"/></svg>`;
    for (const [li, L] of BLV.entries()) { if (T.done) break; P.setRound(`BRIDGE ${li + 1} OF 3`);
      const posts = [X0]; L.seg.forEach(s => posts.push(posts[posts.length - 1] + s * U));
      P.stage.innerHTML = `<div class="bbsky"></div><div class="bbwater"></div><div data-m="graphite" style="display:contents"><div class="bbcl l mat" style="--c:#555"></div><div class="bbcl r mat" style="--c:#555"></div>${posts.slice(1, -1).map(x => `<div class="bbpo mat" style="--c:#555;left:${x - 5}px"></div>`).join('')}</div>
        ${L.seg.map((s, i) => `<div class="bbsl" style="left:${posts[i]}px;width:${s * U}px"><span>${s}</span></div>`).join('')}<div class="bbpip">${pip}</div>
        <div class="bbtray"></div><div data-r="piece" data-m="${PM(P)}" class="bbbeams" style="position:absolute;inset:0;pointer-events:none"></div>`;
      const beams = P.stage.querySelector('.bbbeams'), slots = [...P.stage.querySelectorAll('.bbsl')], pipE = P.stage.querySelector('.bbpip');
      let tx = 12, ty = 300; const B = L.tray.map(len => { const w = len * U; if (tx + w > 252) { tx = 12; ty += 34; } const e = document.createElement('div'); e.className = 'bbm mat'; e.style.cssText = `--c:#E39A3B;left:${tx}px;top:${ty}px;width:${w}px`; e.dataset.len = len; e.dataset.x = tx; e.dataset.y = ty; e.innerHTML = '<i></i><i></i>'; beams.appendChild(e); tx += w + 10; return e; });
      pipE.style.left = '8px'; pipE.style.top = (DECK - 30) + 'px'; P.step(0); P.hint('Fill each gap'); await P.w(700);
      for (const [si, s] of L.seg.entries()) { if (T.done) break;
        const tryBeam = async e => { P.step(1); await P.w(rnd(250, 450)); await P.tap(e); const [sx, sy] = P.rel(slots[si]); P.fin.style.left = sx + 'px'; P.fin.style.top = sy + 'px';
          const x0 = +e.dataset.x, y0 = +e.dataset.y, x1 = posts[si], y1 = DECK; await P.anim(p => { const k = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; e.style.left = (x0 + (x1 - x0) * k) + 'px'; e.style.top = (y0 + (y1 - y0) * k - 30 * Math.sin(p * Math.PI)) + 'px'; }, 420); };
        if (li === 0 && si === 0) { const wrong = B.find(e => +e.dataset.len !== s && !e.dataset.used); await tryBeam(wrong); misfit++; wrong.classList.add('bad'); P.oops(); P.hint(+wrong.dataset.len < s ? 'Too short for that gap' : 'Too long for that gap', 'bad'); await P.w(450); wrong.classList.remove('bad');
          const x = +wrong.dataset.x, y = +wrong.dataset.y; wrong.style.left = x + 'px'; wrong.style.top = y + 'px'; await P.w(350); }
        const ok = B.find(e => +e.dataset.len === s && !e.dataset.used); ok.dataset.used = 1; await tryBeam(ok); slots[si].classList.add('ok'); P.hit(slots[si], '#FFC53D', '+15'); P.addScore(15); P.hint('Fits', 'good'); }
      P.hideFin(); if (T.done) break; P.step(2); P.hint('Here comes Pip', 'watch'); const placed = B.filter(e => e.dataset.used); const endX = 232;
      await P.anim(p => { const x = 8 + (endX - 8) * p; pipE.style.left = x + 'px'; const bob = Math.abs(Math.sin(p * 18)) * 4; const c = x + 17;
        let dip = 0; placed.forEach(e => { const l = +e.style.left.replace('px', ''), w = e.offsetWidth; const on = c > l && c < l + w; const d = on ? 3 * Math.sin((c - l) / w * Math.PI) : 0; e.style.transform = `translateY(${d}px)`; if (on) dip = d; }); pipE.style.top = (DECK - 30 + dip - bob) + 'px'; }, 2400);
      placed.forEach(e => e.style.transform = 'none'); const arm = pipE.querySelector('.arm'); arm.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-25deg)' }, { transform: 'rotate(10deg)' }, { transform: 'rotate(-25deg)' }, { transform: 'rotate(0)' }], { duration: 800 });
      built++; set(built); const [x, y] = P.rel(pipE); P.burst(x, y, '#7CF0C6', 14); P.float(x, y - 20, '+50'); P.addScore(50); P.hint('Pip made it', 'good'); await P.w(1100); }
    await fin(P, T);
    return { title: 'Safe crossing', stars: misfit ? 2 : 3, stats: [`${built} of 3 bridges`, `${misfit} misfit`, '+100 XP'] };
  } });
