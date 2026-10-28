
/* ═════ BATCH 3 ═════ */
const angD = (a, b) => { let d = (a - b) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };

/* ── Category clusters ── */
const CATS3 = [['Fruit', '#FF7A1F', ['APPLE', 'MANGO', 'PEAR', 'PLUM']], ['Colours', '#FF3D8E', ['LIME', 'CORAL', 'NAVY', 'ROSE']], ['Planets', '#22A6FF', ['MARS', 'VENUS', 'EARTH', 'SATURN']]];
def({ sec: 'b3', name: 'Category clusters', kick: 'WORDS · 60 SEC', col: '#FF3D8E', glow: '#8B3DFF', bg: 'dots', secs: 60, best: '3 groups, no slips', pieces: 1,
  steps: ['Twelve words, three hidden groups of four', 'Tap four that belong together', 'Watch for words that fit two groups'],
  cap: 'Word capsules are Enamel pieces (Candy gloss below). A right group flies up into a recessed tray with its name. Three of four right shakes with "One away". Lime and plum are the traps.',
  round: async P => {
    const all = shuffle(CATS3.flatMap(([n, c, w]) => w.map(x => [x, n])));
    P.stage.innerHTML = `<div class="ccrows"></div><div class="ccg" data-r="piece" data-m="${PM(P)}">${all.map(([w, n]) => `<div class="ccw mat" data-g="${n}" style="--c:#3A3B48"><span>${w}</span></div>`).join('')}</div>`;
    const rows = P.stage.querySelector('.ccrows'), G = P.stage.querySelector('.ccg'); const lives = livesUI(P, 4); let lv = 4, solved = 0, slips = 0;
    const T = P.timer(60); P.setRound('3 GROUPS'); P.step(0); P.hint('Find a group of four'); await P.w(900);
    const plan = [['Planets'], ['Colours', 'PLUM'], ['Colours'], ['Fruit']];
    for (const [g, swap] of plan) { if (T.done) break; const W = [...G.children]; let pickE = W.filter(e => e.dataset.g === g).slice(0, 4);
      if (swap) { pickE = pickE.slice(0, 3).concat(W.filter(e => e.textContent === swap)); }
      P.step(1); for (const e of pickE) { await P.w(rnd(200, 380)); await P.tap(e); e.classList.add('sel'); }
      await P.w(300); P.hideFin();
      if (!swap) { const [n, col] = CATS3.find(c => c[0] === g); const row = document.createElement('div'); row.className = 'ccr'; row.style.setProperty('--c', col); row.innerHTML = `<b>${n}</b><span>${pickE.map(e => e.textContent).join(' · ')}</span>`;
        pickE.forEach(e => e.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(-60px) scale(.6)', opacity: 0 }], { duration: 380, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'forwards' })); await P.w(380); pickE.forEach(e => e.remove()); rows.appendChild(row);
        row.animate([{ transform: 'scale(.8)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 380, easing: 'cubic-bezier(.3,1.5,.5,1)' }); solved++; P.addScore(60); const [x, y] = P.rel(row); P.ring(x, y, col, 120); P.burst(x, y, col, 12); P.step(2); P.hint(`${n}`, 'good'); }
      else { pickE.forEach(e => { e.classList.add('bad'); }); slips++; lv--; lives[lv].classList.add('lost'); P.oops(); P.hint('One away. Plum is a fruit too', 'bad'); await P.w(600); pickE.forEach(e => e.classList.remove('bad', 'sel')); }
      await P.w(500); }
    if (G.children.length === 0 || solved === 3) { P.toast('All grouped', '#FFB3D1'); await P.w(700); }
    await fin(P, T);
    return { title: 'Sharp sorting', stars: slips ? 2 : 3, stats: [`${solved} of 3 groups`, `${slips} slip`, '+90 XP'] };
  } });

/* ── Orbit switch ── */
def({ sec: 'b3', name: 'Orbit switch', kick: 'TIMING · 30 SEC', col: '#22A6FF', glow: '#8B3DFF', bg: 'dots', secs: 30, best: '9 laps', pieces: 1,
  steps: ['The marble races round its ring', 'Tap to hop between inner and outer ring', 'Dodge the red, collect the sparks'],
  cap: 'A Candy marble on two recessed rings (switch to Enamel below). Red arcs block one ring at a time, so there is always a way through. Each lap adds a new block and speeds up a little.',
  round: async P => {
    const CX = 132, CY = 170, RI = 62, RO = 106; let ring = 1, ang = -Math.PI / 2, laps = 0, lastA = ang, sparks = 0, bumps = 0;
    P.stage.innerHTML = `<svg class="orsv" width="264" height="340"><circle cx="${CX}" cy="${CY}" r="${RO}" fill="none" stroke="#14152A" stroke-width="22"/><circle cx="${CX}" cy="${CY}" r="${RI}" fill="none" stroke="#14152A" stroke-width="22"/><g class="obs"></g><g class="gms"></g></svg>
      <div data-r="piece" data-m="${PM(P) === 'enamel' ? 'candy' : 'enamel'}" style="display:contents"><div class="orm mat" style="--c:#22A6FF"></div></div><div class="ortap">TAP TO SWITCH</div>`;
    const m = P.stage.querySelector('.orm'), og = P.stage.querySelector('.obs'), gg = P.stage.querySelector('.gms'); const lives = livesUI(P); let lv = 3;
    const arc = (r, a0, a1) => { const p = a => [CX + r * Math.cos(a), CY + r * Math.sin(a)]; const [x0, y0] = p(a0), [x1, y1] = p(a1); return `M${x0} ${y0} A${r} ${r} 0 0 1 ${x1} ${y1}`; };
    let OB = [], GM = [];
    const layout = () => { const n = Math.min(4, 2 + laps); OB = Array.from({ length: n }, (_, i) => ({ r: (i + 1) % 2, a: -Math.PI / 2 + 1.3 + (Math.PI * 2 - 1.8) * i / n + rnd(-.1, .1), s: .28 }));
      GM = OB.map(o => ({ r: 1 - o.r, a: o.a, got: false }));
      og.innerHTML = OB.map(o => `<path d="${arc(o.r ? RO : RI, o.a - o.s, o.a + o.s)}" stroke="#FF4848" stroke-width="18" stroke-linecap="round" fill="none" style="filter:drop-shadow(0 0 6px #FF4848)"/>`).join('');
      gg.innerHTML = GM.map((g, i) => `<circle data-i="${i}" cx="${CX + (g.r ? RO : RI) * Math.cos(g.a)}" cy="${CY + (g.r ? RO : RI) * Math.sin(g.a)}" r="5" fill="#7CF6FF" style="filter:drop-shadow(0 0 6px #7CF6FF)"/>`).join(''); };
    layout(); let sp = 1.9, curR = RO, hitCool = 0;
    const ck = clock(P, el => { });
    const T = P.timer(30); P.setRound('LAP 1'); P.hint('Tap to switch rings'); let last = ck.now(), switching = false;
    try {
      while (!T.done && lv > 0) { await P.w(16); const now = ck.now(), dt = Math.min(50, now - last) / 1000; last = now; ang += sp * dt; curR += ((ring ? RO : RI) - curR) * Math.min(1, dt * 14);
        m.style.left = (CX + curR * Math.cos(ang)) + 'px'; m.style.top = (CY + curR * Math.sin(ang)) + 'px';
        if (ang - lastA > Math.PI * 2) { lastA += Math.PI * 2; laps++; sp += .12; P.setRound(`LAP ${laps + 1}`); P.addScore(20); P.float(CX, CY, `Lap ${laps}`); layout(); }
        const settled = Math.abs(curR - (ring ? RO : RI)) < 6;
        OB.forEach(o => { if (o.r === ring && settled && Math.abs(angD(ang, o.a)) < o.s && now > hitCool) { hitCool = now + 700; bumps++; lv--; lives[Math.max(0, lv)].classList.add('lost'); m.classList.add('bad'); setTimeout(() => m.classList.remove('bad'), 400); P.oops(); P.hint('Bumped', 'bad'); } });
        GM.forEach((g, i) => { if (!g.got && g.r === ring && settled && Math.abs(angD(ang, g.a)) < .12) { g.got = true; sparks++; P.addScore(10); const c = gg.querySelector(`[data-i="${i}"]`); if (c) c.remove(); const [x, y] = P.rel(m); P.burst(x, y, '#7CF6FF', 8); } });
        if (!switching) { const fw = o => { let d = (o.a + o.s - ang) % (Math.PI * 2); if (d < 0) d += Math.PI * 2; return d - 2 * o.s; }; const nx = OB.slice().sort((x, y) => fw(x) - fw(y))[0]; const ahead = nx && nx.r === ring && fw(nx) < sp * .55; const otherClear = true; const skip = false;
          if (ahead && otherClear && !skip) { switching = true; P.step(1); ring = 1 - ring; P.tap(P.stage.querySelector('.ortap')).then(() => { P.step(2); switching = false; }).catch(() => {}); } else P.step(0); } }
    } finally { ck.stop(); }
    P.hideFin(); await fin(P, T);
    return { title: 'In orbit', stars: bumps === 0 ? 3 : lv > 0 ? 2 : 1, stats: [`${laps} laps`, `${sparks} sparks · ${bumps} bump${bumps === 1 ? '' : 's'}`, '+80 XP'] };
  } });

/* ── Micro defender ── */
def({ sec: 'b3', name: 'Micro defender', kick: 'FOCUS · 45 SEC', col: '#8B3DFF', glow: '#22A6FF', bg: 'grid', secs: 45, best: '30 blocked, crystal untouched',
  steps: ['Little blobs drift toward your crystal', 'Drag the shield round to face them', 'Every bounce turns a blob into sparkles'],
  cap: 'No combat: friendly blobs bounce off a glowing shield arc and burst into sparkles. The crystal is a Candy piece; it flickers if a blob gets through. Blobs come from more directions as the round goes on.',
  round: async P => {
    const CX = 132, CY = 180, SR = 64; let sa = -Math.PI / 2, blocked = 0, through = 0, blobs = [], spawnAt = 0;
    P.stage.innerHTML = `<svg class="mdsv" width="264" height="360"><circle cx="${CX}" cy="${CY}" r="${SR}" fill="none" stroke="rgba(165,123,255,.12)" stroke-width="2" stroke-dasharray="4 6"/><path class="shd" fill="none" stroke="#C9A8FF" stroke-width="10" stroke-linecap="round" style="filter:drop-shadow(0 0 10px #A57BFF)"/></svg>
      <div data-m="candy" style="display:contents"><div class="mdc mat" style="--c:#22A6FF"></div></div><div class="mdb"></div><div class="mdgrab"></div>`;
    const shd = P.stage.querySelector('.shd'), cr = P.stage.querySelector('.mdc'), box = P.stage.querySelector('.mdb'), grab = P.stage.querySelector('.mdgrab'); const lives = livesUI(P); let lv = 3;
    const drawS = () => { const a0 = sa - .55, a1 = sa + .55, p = a => [CX + SR * Math.cos(a), CY + SR * Math.sin(a)]; const [x0, y0] = p(a0), [x1, y1] = p(a1); shd.setAttribute('d', `M${x0} ${y0} A${SR} ${SR} 0 0 1 ${x1} ${y1}`); grab.style.left = (CX + (SR + 22) * Math.cos(sa)) + 'px'; grab.style.top = (CY + (SR + 22) * Math.sin(sa)) + 'px'; };
    drawS(); const T = P.timer(45); P.setRound('WAVE 1'); P.hint('Turn the shield to meet them'); const ck = clock(P, () => { }); let last = ck.now(), lag = 0;
    P.fin.style.opacity = 1;
    try {
      while (!T.done && lv > 0) { await P.w(16); const now = ck.now(), dt = Math.min(50, now - last) / 1000; last = now;
        if (now > spawnAt) { const wave = Math.min(3, 1 + Math.floor(now / 15000)); P.setRound(`WAVE ${wave}`); spawnAt = now + rnd(1300, 1900) - wave * 250; const a = rnd(0, Math.PI * 2); const e = document.createElement('div'); e.className = 'mdblob'; e.style.setProperty('--c', pick([COL.pink, COL.mint, COL.sun, COL.orange])); e.innerHTML = '<i></i><i></i>'; box.appendChild(e); blobs.push({ e, a, r: 175, v: rnd(48, 62) + wave * 8 }); }
        blobs.forEach(b => { b.r -= b.v * dt; b.e.style.left = (CX + b.r * Math.cos(b.a)) + 'px'; b.e.style.top = (CY + b.r * Math.sin(b.a)) + 'px';
          if (!b.done && b.r < SR + 8 && b.r > SR - 6 && Math.abs(angD(b.a, sa)) < .62) { b.done = 'bounce'; blocked++; P.addScore(10); const [x, y] = P.rel(b.e); P.burst(x, y, b.e.style.getPropertyValue('--c'), 10); P.float(x, y - 14, '+10'); b.e.remove(); P.step(2); }
          else if (!b.done && b.r < 22) { b.done = 'hit'; through++; lv--; lives[Math.max(0, lv)].classList.add('lost'); cr.classList.add('hurt'); setTimeout(() => cr.classList.remove('hurt'), 500); P.oops(); P.hint('One got through', 'bad'); b.e.remove(); } });
        blobs = blobs.filter(b => !b.done);
        const tgt = blobs.slice().sort((x, y) => x.r - y.r)[0]; if (tgt) { P.step(1); const d = angD(tgt.a, sa); const slow = (blocked === 6 && through === 0) || lag > now; if (blocked === 6 && through === 0 && lag < now) lag = now + 1500; const vmax = (slow ? 1.2 : 6.5) * dt; sa += Math.max(-vmax, Math.min(vmax, d)); drawS(); const [gx, gy] = P.rel(grab); P.fin.style.left = gx + 'px'; P.fin.style.top = gy + 'px'; P.fin.classList.toggle('dn', Math.abs(d) > .05); } else P.step(0); }
    } finally { ck.stop(); P.fin.classList.remove('dn'); }
    P.hideFin(); await fin(P, T);
    return { title: through ? 'Crystal saved' : 'Untouched', stars: through === 0 ? 3 : lv > 0 ? 2 : 1, stats: [`${blocked} blocked`, `${through} got through`, '+80 XP'] };
  } });

/* ── One-line art ── */
const DRAWS = [{ n: 'House', N: { A: [40, 250], B: [200, 250], C: [200, 150], D: [40, 150], E: [120, 70] }, E: ['AB', 'BC', 'CD', 'DA', 'AC', 'BD', 'DE', 'CE'], path: 'ABCDACEDB', wrong: 'CBADCEDB' },
  { n: 'Bow tie', N: { A: [40, 90], B: [40, 250], C: [120, 170], D: [200, 90], E: [200, 250] }, E: ['AB', 'BC', 'CA', 'CD', 'DE', 'EC'], path: 'ABCDECA' }];
def({ sec: 'b3', name: 'One-line art', kick: 'PLANNING · 60 SEC', col: '#FFC53D', glow: '#FF7A1F', bg: 'grid', secs: 60, best: '2 drawings, first try',
  steps: ['Trace the whole drawing in one go', 'Never lift your finger, never repeat a line', 'Tip: start where an odd number of lines meet'],
  cap: 'Lines light up gold as the finger passes. Get stuck and the drawing resets with the tip about where to start. The finished icon lights up and pops.',
  round: async P => {
    let drawn = 0, resets = 0; const set = combo(P, 'Drawings'); const T = P.timer(60);
    for (const [di, Dw] of DRAWS.entries()) { if (T.done) break; P.setRound(`${Dw.n.toUpperCase()}`);
      const key = (a, b) => [a, b].sort().join('');
      P.stage.innerHTML = `<svg class="olsv" width="264" height="330">${Dw.E.map(e => { const [a, b] = [Dw.N[e[0]], Dw.N[e[1]]]; return `<line data-e="${key(e[0], e[1])}" x1="${a[0] + 12}" y1="${a[1]}" x2="${b[0] + 12}" y2="${b[1]}" stroke="#2A2B33" stroke-width="10" stroke-linecap="round"/>`; }).join('')}
        ${Object.entries(Dw.N).map(([k, [x, y]]) => `<circle data-n="${k}" cx="${x + 12}" cy="${y}" r="9" fill="#3A3B44" stroke="#050507" stroke-width="3"/>`).join('')}</svg>`;
      const svg = P.stage.querySelector('svg'); const node = k => svg.querySelector(`[data-n="${k}"]`);
      const trace = async seq => { const used = new Set(); await P.tap(node(seq[0])); node(seq[0]).setAttribute('fill', '#FFC53D');
        for (let i = 1; i < seq.length; i++) { const a = seq[i - 1], b = seq[i], k = key(a, b); if (used.has(k)) return false; used.add(k); const ln = svg.querySelector(`[data-e="${k}"]`);
          const [fa, fb] = [P.rel(node(a)), P.rel(node(b))]; await P.anim(p => { P.fin.style.left = (fa[0] + (fb[0] - fa[0]) * p) + 'px'; P.fin.style.top = (fa[1] + (fb[1] - fa[1]) * p) + 'px'; }, 260);
          ln.setAttribute('stroke', '#FFC53D'); ln.style.filter = 'drop-shadow(0 0 6px #FFC53D)'; node(b).setAttribute('fill', '#FFC53D'); P.addScore(5); }
        return used.size === Dw.E.length; };
      const reset = () => { svg.querySelectorAll('line').forEach(l => { l.setAttribute('stroke', '#2A2B33'); l.style.filter = ''; }); svg.querySelectorAll('circle').forEach(c => c.setAttribute('fill', '#3A3B44')); };
      P.step(0); P.hint('One stroke, every line'); await P.w(800); P.step(1);
      if (Dw.wrong) { await trace(Dw.wrong); resets++; P.oops(); P.hideFin(); P.step(2); P.hint('Stuck. Start where 3 lines meet', 'bad'); await P.w(1100); reset(); await P.w(300); }
      if (await trace(Dw.path)) { drawn++; set(drawn); P.hideFin(); svg.classList.add('done'); const [x, y] = P.rel(svg); P.ring(x, y, '#FFC53D', 180); P.burst(x, y, '#FFE14D', 16); P.toast(Dw.n, '#FFE14D'); P.addScore(40); P.hint('One line', 'good'); await P.w(1300); } }
    await fin(P, T);
    return { title: 'Steady hand', stars: resets ? 2 : 3, stats: [`${drawn} of 2 drawings`, `${resets} reset`, '+90 XP'] };
  } });

/* ── Rhythm relay ── */
def({ sec: 'b3', name: 'Rhythm relay', kick: 'MEMORY · 45 SEC', col: '#FF3D8E', glow: '#FF7A1F', bg: 'grid', secs: 45, best: '6 beats, all on time',
  steps: ['Watch the pads play a beat', 'Notice the gaps, not just the order', 'Play it back on time'],
  cap: 'Four Toy plastic pads (they hum in the real app; muted mode just lights them). A timeline under the pads shows the beat as white marks and your taps as dots, so you can see if you were early or late.',
  round: async P => {
    const PC = [COL.pink, COL.sun, COL.mint, COL.sky];
    P.stage.innerHTML = `<div class="rrp" data-m="toy">${PC.map(c => `<div class="pad mat" style="--c:${c}"><b>♪</b></div>`).join('')}</div><div class="rrt"><div class="rrl"></div></div>`;
    const pads = [...P.stage.querySelectorAll('.pad')], tl = P.stage.querySelector('.rrt'); const lives = livesUI(P); let lv = 3, round = 0, onTime = 0, total = 0;
    const T = P.timer(45);
    while (!T.done && round < 4 && lv > 0) { round++; P.setRound(`BEAT ${round} OF 4`); const len = 2 + round;
      const seq = Array.from({ length: len }, (_, i) => ({ p: Math.random() * 4 | 0, gap: i ? pick([300, 300, 600]) : 0 })); let t = 0; seq.forEach(s => { t += s.gap; s.t = t; }); const span = t || 1;
      tl.querySelectorAll('i').forEach(e => e.remove()); seq.forEach(s => { const m = document.createElement('i'); m.className = 'bm'; m.style.left = (8 + s.t / span * 84) + '%'; tl.appendChild(m); });
      P.step(0); P.hint('Listen and watch', 'watch'); P.quiet(1); await P.w(600);
      for (const s of seq) { await P.w(s.gap); pads[s.p].classList.add('on'); setTimeout(() => pads[s.p].classList.remove('on'), 200); }
      P.quiet(0); await P.w(700); P.step(1); P.hint('Your turn'); let ok = true; let errSum = 0;
      for (const [i, s] of seq.entries()) { const err = rnd(-70, 70) + (round === 2 && i === 2 ? 220 : 0); const pi = round === 3 && i === 1 ? (s.p + 1) % 4 : s.p;
        await P.w(Math.max(0, s.gap + err - 320)); await P.tap(pads[pi]); pads[pi].classList.add('on', 'dn'); setTimeout(() => pads[pi].classList.remove('on', 'dn'), 180); P.step(2);
        const d = document.createElement('i'); d.className = 'td'; d.style.left = (8 + Math.max(0, Math.min(span, s.t + (i ? err : 0))) / span * 84) + '%'; tl.appendChild(d); total++;
        if (pi !== s.p) { ok = false; d.classList.add('x'); pads[pi].classList.add('bad'); setTimeout(() => pads[pi].classList.remove('bad'), 400); P.oops(); lv--; lives[lv].classList.add('lost'); P.hint('Wrong pad', 'bad'); break; }
        if (Math.abs(err) < 120) { onTime++; d.classList.add('ok'); P.hit(pads[pi], PC[pi], '+10'); P.addScore(10); } else { d.classList.add('late'); P.hint(err > 0 ? 'A little late' : 'A little early'); P.addScore(4); } }
      P.hideFin(); if (ok) { P.addScore(20); P.hint('Beat matched', 'good'); P.toast(`${len} beats`, '#FFB3D1'); } await P.w(1000); }
    await fin(P, T);
    return { title: 'Good rhythm', stars: lv === 3 && onTime >= total - 1 ? 3 : 2, stats: [`${onTime} of ${total} on time`, `${3 - lv} wrong pad`, '+80 XP'] };
  } });
