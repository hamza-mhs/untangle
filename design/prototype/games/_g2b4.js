
/* ═════ BATCHES 4–7 ═════ */
const moveEl = (P, e, x0, y0, x1, y1, ms = 380, follow = true) => P.anim(p => { const k = easeIO(p); e.style.left = (x0 + (x1 - x0) * k) + 'px'; e.style.top = (y0 + (y1 - y0) * k) + 'px'; if (follow) { const [fx, fy] = P.rel(e); P.fin.style.left = fx + 'px'; P.fin.style.top = fy + 'px'; } }, ms);
const pxv = v => +String(v).replace('px', '');

/* ════ BATCH 4 ════ */
/* Shadow match */
const SHAPE = 'M0 0 H30 V10 H20 V40 H10 V20 H0 Z';
def({ sec: 'b4', name: 'Shadow match', kick: 'SPATIAL · 40 SEC', col: '#FFC53D', glow: '#FF7A1F', bg: 'persp', secs: 40, best: '6 matches', pieces: 1,
  steps: ['A silhouette appears on the wall', 'Turn the piece with the arrows', 'Line its shadow up with the silhouette'],
  cap: 'A clay piece on a turntable (Enamel / Candy below) casts a soft shadow onto a recessed wall. Toy plastic arrows turn it 90° at a time. When the shadow matches, it snaps in and glows.',
  round: async P => {
    P.stage.innerHTML = `<div data-m="well" style="display:contents"><div class="smw mat" style="--c:#1A1408"><svg class="smt" width="110" height="110" viewBox="-25 -25 80 90"><path d="${SHAPE}" fill="none" stroke="#FFC53D" stroke-width="2.5" stroke-dasharray="5 4" transform="translate(0 0)"/></svg><svg class="sms" width="110" height="110" viewBox="-25 -25 80 90"><path d="${SHAPE}" fill="rgba(0,0,0,.65)"/></svg></div></div>
      <div class="smtt"></div><div class="smo" data-r="piece" data-m="${PM(P)}"><svg width="96" height="96" viewBox="-25 -25 80 90"><defs><linearGradient id="smg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE29A"/><stop offset="1" stop-color="#E08A1E"/></linearGradient></defs><path d="${SHAPE}" fill="url(#smg)" stroke="#A85E0A" stroke-width="2" stroke-linejoin="round"/></svg></div>
      <div class="smb">${toy('k kl', COL.orange, '<span>⟲</span>')}${toy('k kr', COL.orange, '<span>⟳</span>')}</div>`;
    const tgt = P.stage.querySelector('.smt path'), sh = P.stage.querySelector('.sms'), ob = P.stage.querySelector('.smo svg'), KL = P.stage.querySelector('.kl'), KR = P.stage.querySelector('.kr'); const set = combo(P, 'Matches'); let rot = 0, got = 0, extra = 0;
    const T = P.timer(40); const TG = [90, 180, 270, 90, 0, 180];
    for (const [i, g] of TG.entries()) { if (T.done) break; P.setRound(`SHAPE ${i + 1}`); rot = (g + pick([90, 180, 270])) % 360; ob.style.transform = sh.style.transform = `rotate(${rot}deg)`; tgt.setAttribute('transform', `rotate(${g} 15 20)`); ob.style.transformOrigin = sh.style.transformOrigin = '50% 50%';
      P.stage.querySelector('.smw').classList.remove('ok'); P.step(0); P.hint('Match the shadow'); await P.w(600);
      const need = ((g - rot) % 360 + 360) % 360; let steps = need === 270 ? [-90] : need === 90 ? [90] : [90, 90]; if (i === 2) { steps = [-90].concat(steps).concat([90]); }
      for (const s of steps) { P.step(1); await P.w(rnd(200, 380)); const k = s > 0 ? KR : KL; await P.tap(k); P.press(k); rot += s; ob.style.transform = sh.style.transform = `rotate(${rot}deg)`; }
      if (i === 2) extra += 2; P.hideFin(); await P.w(320); P.step(2); got++; set(got); P.stage.querySelector('.smw').classList.add('ok'); const [x, y] = P.rel(P.stage.querySelector('.smw')); P.ring(x, y, '#FFC53D', 120); P.addScore(25); P.hint('Snapped in', 'good'); await P.w(700); }
    await fin(P, T);
    return { title: 'Good eye for angles', stars: extra ? 2 : 3, stats: [`${got} matches`, `${extra} extra turns`, '+80 XP'] };
  } });

/* Slide escape */
def({ sec: 'b4', name: 'Slide escape', kick: 'PLANNING · 60 SEC', col: '#17D9A3', glow: '#22A6FF', bg: 'grid', secs: 60, best: '2 boards, fewest moves', pieces: 1,
  steps: ['The gem has to slide out of the right side', 'Blocks only move along their own direction', 'Clear a path, then slide the gem out'],
  cap: 'Graphite blocks on recessed rails. The gem is a Candy piece. A block that can\'t move bumps and stays. When the path is clear, the gem slides out and springs off the board.',
  round: async P => {
    const S = 46, OX = (264 - 5 * S) / 2, OY = 20;
    const BOARDS = [{ gem: [2, 0], b: [['h', 0, 2, 2], ['v', 1, 2, 2], ['v', 2, 4, 2], ['v', 3, 1, 2]], moves: [[0, 0, -2], [1, -1, 0], [2, 1, 0]], bad: [3, -1, 0] },
      { gem: [2, 1], b: [['v', 1, 3, 2], ['h', 3, 2, 3], ['v', 1, 4, 2]], moves: [[0, -1, 0], [1, 0, -2], [2, 2, 0]] }];
    const set = combo(P, 'Escapes'); let esc = 0, mv = 0; const T = P.timer(60);
    for (const [bi, B] of BOARDS.entries()) { if (T.done) break; P.setRound(`BOARD ${bi + 1} OF 2`);
      P.stage.innerHTML = `<div data-m="well" style="display:contents"><div class="seb mat" style="--c:#061810;left:${OX - 6}px;top:${OY - 6}px"></div></div><div class="sexit" style="top:${OY + B.gem[0] * S}px"></div><div data-m="graphite" style="display:contents" class="sebl"></div><div data-m="candy" style="display:contents"><div class="segem mat" style="--c:#17D9A3"></div></div>`;
      const host = P.stage.querySelector('.sebl'), gem = P.stage.querySelector('.segem');
      const put = (e, r, c, w, h) => { e.style.left = (OX + c * S + 3) + 'px'; e.style.top = (OY + r * S + 3) + 'px'; e.style.width = (w * S - 6) + 'px'; e.style.height = (h * S - 6) + 'px'; };
      const BL = B.b.map(([d, r, c, len]) => { const e = document.createElement('div'); e.className = 'seblk mat ' + d; e.style.setProperty('--c', '#7A7B88'); host.appendChild(e); const o = { e, d, r, c, len }; put(e, r, c, d === 'h' ? len : 1, d === 'v' ? len : 1); return o; });
      put(gem, B.gem[0], B.gem[1], 2, 1); P.step(0); P.hint('Clear a path for the gem'); await P.w(700);
      if (B.bad) { const o = BL[B.bad[0]]; P.step(1); await P.w(300); await P.tap(o.e); o.e.classList.add('bad'); P.oops(); mv++; P.hint('Blocked that way', 'bad'); await P.w(450); o.e.classList.remove('bad'); }
      for (const [k, dr, dc] of B.moves) { if (T.done) break; const o = BL[k]; P.step(1); await P.w(rnd(250, 450)); await P.tap(o.e); const x0 = pxv(o.e.style.left), y0 = pxv(o.e.style.top); o.r += dr; o.c += dc; mv++; await moveEl(P, o.e, x0, y0, OX + o.c * S + 3, OY + o.r * S + 3, 300); }
      if (T.done) break; P.step(2); await P.w(300); await P.tap(gem); const gx = pxv(gem.style.left), gy = pxv(gem.style.top); await moveEl(P, gem, gx, gy, 300, gy, 500); P.hideFin(); esc++; set(esc); const [x, y] = P.rel(P.stage.querySelector('.sexit')); P.burst(x, y, '#17D9A3', 16); P.ring(x, y, '#8BFAD8', 100); P.addScore(60); P.toast('Escaped', '#8BFAD8'); await P.w(1100); }
    await fin(P, T);
    return { title: 'Way out', stars: 2 + (esc === 2 ? 1 : 0), stats: [`${esc} of 2 boards`, `${mv} moves`, '+90 XP'] };
  } });

/* Path painter */
const PP = [{ rocks: [[4, 4]], path: [...[0, 1, 2, 3, 4].map(c => [0, c]), ...[4, 3, 2, 1, 0].map(c => [1, c]), ...[0, 1, 2, 3, 4].map(c => [2, c]), ...[4, 3, 2, 1, 0].map(c => [3, c]), ...[0, 1, 2, 3].map(c => [4, c])] },
  { rocks: [[2, 2]], path: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [1, 4], [2, 4], [3, 4], [4, 4], [4, 3], [4, 2], [4, 1], [4, 0], [3, 0], [2, 0], [1, 0], [1, 1], [1, 2], [1, 3], [2, 3], [3, 3], [3, 2], [3, 1], [2, 1]] }];
def({ sec: 'b4', name: 'Path painter', kick: 'PLANNING · 60 SEC', col: '#22A6FF', glow: '#17D9A3', bg: 'dots', secs: 60, best: '2 boards, no backtracks',
  steps: ['Start anywhere and draw one path', 'Every square has to be painted once', 'Plan ahead so you don\'t get trapped'],
  cap: 'Dark ceramic squares in a recessed board turn bright enamel as the paint passes over. Rocks can\'t be painted. Get trapped and the board wipes clean.',
  round: async P => {
    const S = 46, OX = (264 - 5 * S) / 2, OY = 24, HUE = ['#22A6FF', '#17D9A3', '#FFC53D', '#FF7A1F', '#FF3D8E']; const set = combo(P, 'Boards'); let done = 0, wipes = 0; const T = P.timer(60);
    for (const [bi, B] of PP.entries()) { if (T.done) break; P.setRound(`BOARD ${bi + 1} OF 2`);
      P.stage.innerHTML = `<div data-m="well" style="display:contents"><div class="ppb mat" style="--c:#0A1022;left:${OX - 6}px;top:${OY - 6}px">${Array.from({ length: 25 }, (_, i) => { const r = Math.floor(i / 5), c = i % 5, rock = B.rocks.some(q => q[0] === r && q[1] === c); return `<i class="ppc ${rock ? 'rock' : ''}" data-i="${i}" style="left:${c * S + 6}px;top:${r * S + 6}px"></i>`; }).join('')}</div></div>`;
      const C = [...P.stage.querySelectorAll('.ppc')]; const paint = async seq => { for (const [k, [r, c]] of seq.entries()) { const e = C[r * 5 + c]; if (k === 0) await P.tap(e); else { const [x, y] = P.rel(e); P.fin.style.left = x + 'px'; P.fin.style.top = y + 'px'; await P.w(110); } e.classList.add('on'); e.style.setProperty('--c', HUE[Math.floor(k / 5) % HUE.length]); P.addScore(2); } };
      P.step(0); P.hint('One path, every square'); await P.w(700); P.step(1);
      if (bi === 0) { await paint([[2, 2], [2, 3], [1, 3], [1, 2], [1, 1], [2, 1]]); wipes++; P.oops(); P.hint('Trapped. Start in a corner', 'bad'); P.hideFin(); await P.w(800); C.forEach(e => e.classList.remove('on')); await P.w(300); }
      await paint(B.path); P.hideFin(); P.step(2); done++; set(done); P.ppb = P.stage.querySelector('.ppb'); P.ppb.classList.add('lit'); const [x, y] = P.rel(P.ppb); P.ring(x, y, '#22A6FF', 200); P.addScore(50); P.toast('All painted', '#8BE0FF'); await P.w(1200); }
    await fin(P, T);
    return { title: 'Clean coat', stars: wipes ? 2 : 3, stats: [`${done} of 2 boards`, `${wipes} wipe`, '+90 XP'] };
  } });

/* Sky glider */
def({ sec: 'b4', name: 'Sky glider', kick: 'COORDINATION · 40 SEC', col: '#22A6FF', glow: '#8B3DFF', bg: 'persp', secs: 40, best: '12 of 12 rings',
  steps: ['The glider flies on its own', 'Hold and drag up or down to steer', 'Thread the rings, then land softly'],
  cap: 'A glossy paper glider over drifting clouds. Rings come in at different heights; each one you thread chimes and counts. After the last ring a runway slides in for a smooth landing, so a round always ends.',
  round: async P => {
    P.stage.innerHTML = `<div class="sgc"><i style="top:40px"></i><i style="top:150px;left:120px"></i><i style="top:260px;left:40px"></i></div><div class="sgr"></div><div class="sgg"><svg width="46" height="28" viewBox="0 0 46 28"><path d="M2 14 L44 4 L22 16 L44 24 Z" fill="#F4F4F6" stroke="#9AA4C7" stroke-width="1.5" stroke-linejoin="round"/><path d="M22 16 L44 24 L30 15Z" fill="#C9D2F2"/></svg></div><div class="sgrun"></div><div class="sgpad"></div>`;
    const G = P.stage.querySelector('.sgg'), RH = P.stage.querySelector('.sgr'), run = P.stage.querySelector('.sgrun'), pad = P.stage.querySelector('.sgpad'); let gy = 180, ty = 180, rings = [], next = 600, passed = 0, missed = 0, n = 0;
    const ck = clock(P, () => {}); let last = ck.now(); const T = P.timer(40); P.setRound('12 RINGS'); P.fin.style.opacity = 1; P.hint('Drag to steer');
    try {
      while (!T.done && (n < 12 || rings.length)) { await P.w(16); const now = ck.now(), dt = Math.min(50, now - last); last = now;
        if (now > next && n < 12) { n++; next = now + 1250; const y = rnd(70, 300); const e = document.createElement('div'); e.className = 'sgring'; e.style.top = y + 'px'; RH.appendChild(e); rings.push({ e, x: 290, y }); }
        rings.forEach(r => { r.x -= .17 * dt; r.e.style.left = r.x + 'px'; if (!r.done && r.x < 66) { r.done = true; if (Math.abs(gy - r.y) < 24) { passed++; P.addScore(15); r.e.classList.add('ok'); const [x, y] = P.rel(r.e); P.burst(x, y, '#7CF6FF', 10); P.float(x, y - 20, '+15'); P.step(2); } else { missed++; r.e.classList.add('miss'); P.oops(); P.hint('Missed one', 'bad'); } } });
        rings = rings.filter(r => { if (r.x < -40) { r.e.remove(); return false; } return true; });
        const tgt = rings.find(r => !r.done); if (tgt) { ty = tgt.y + (n === 6 && tgt.x < 140 && missed === 0 ? 40 : 0); P.step(1); }
        gy += (ty - gy) * Math.min(1, dt / 180); G.style.top = gy + 'px'; G.style.transform = `translate(-50%,-50%) rotate(${Math.max(-18, Math.min(18, (ty - gy) * .3))}deg)`; pad.style.top = gy + 'px'; const [fx, fy] = P.rel(pad); P.fin.style.left = fx + 'px'; P.fin.style.top = fy + 'px'; }
    } finally { ck.stop(); }
    P.hideFin(); run.classList.add('on'); await P.anim(p => { gy = gy + (330 - gy) * p * .2; G.style.top = gy + 'px'; G.style.transform = 'translate(-50%,-50%) rotate(0deg)'; }, 1200); const [x, y] = P.rel(G); P.burst(x, y, '#C9D2F2', 12); P.toast('Smooth landing', '#C9D2F2'); P.addScore(40); await P.w(900);
    T.stop(); P.hideFin();
    return { title: 'Smooth flight', stars: missed === 0 ? 3 : 2, stats: [`${passed} of ${passed + missed} rings`, 'Soft landing', '+80 XP'] };
  } });

/* Balance lab */
const BAL = [{ left: [[3, 2]], tray: [1, 2, 3], ans: [2, 3], wrong: [3, 1] }, { left: [[2, 2], [1, 2]], tray: [2, 3, 1], ans: [3, 2] }, { left: [[1, 1], [2, 1]], tray: [1, 3, 2], ans: [3, 1] }];
def({ sec: 'b4', name: 'Balance lab', kick: 'REASONING · 60 SEC', col: '#FFC53D', glow: '#FF7A1F', bg: 'grid', secs: 60, best: '3 balanced, first try', pieces: 1,
  steps: ['Weights sit on the left of the seesaw', 'Weight × distance has to match on the right', 'Place one toy so the beam settles level'],
  cap: 'Toy weights (Enamel / Candy below) on a brass seesaw. Heavier further out tips harder. The beam tilts live as you place, and a level beam glints.',
  round: async P => {
    const set = combo(P, 'Level'); let ok = 0, wr = 0; const T = P.timer(60);
    for (const [bi, B0] of BAL.entries()) { if (T.done) break; P.setRound(`PUZZLE ${bi + 1} OF 3`);
      const B = B0;
      P.stage.innerHTML = `<div class="blf"></div><div class="blbeam"><div class="bln">${[-3, -2, -1, 1, 2, 3].map(d => `<i style="left:${50 + d * 15}%"></i>`).join('')}</div></div><div class="blw" data-r="piece" data-m="${PM(P)}"></div><div class="bltray"></div>`;
      const beam = P.stage.querySelector('.blbeam'), W = P.stage.querySelector('.blw'); const U = 36;
      const mk = (kg, x, y) => { const e = document.createElement('div'); e.className = 'blk mat'; e.style.cssText = `--c:${['', COL.sky, COL.pink, COL.violet][kg]};left:${x}px;top:${y}px;width:${22 + kg * 6}px;height:${22 + kg * 6}px`; e.innerHTML = `<span>${kg}</span>`; e.dataset.kg = kg; W.appendChild(e); return e; };
      const L = B.left.map(([kg, d]) => mk(kg, 132 - d * U - (11 + kg * 3), 150 - (22 + kg * 6)));
      const tq = () => B.left.reduce((s, [k, d]) => s + k * d, 0); let rT = 0; const tilt = () => { const a = Math.max(-14, Math.min(14, (rT - tq()) * 2.2)); beam.style.transform = `rotate(${a}deg)`; W.style.transform = `rotate(${a}deg)`; return a; };
      tilt(); const tray = B.tray.map((kg, i) => mk(kg, 50 + i * 70, 300)); P.step(0); P.hint('Balance the beam'); await P.w(800);
      const place = async (kg, d) => { const e = tray.find(t => +t.dataset.kg === kg && !t.dataset.used); e.dataset.used = 1; P.step(1); await P.w(rnd(250, 400)); await P.tap(e); const x1 = 132 + d * U - (11 + kg * 3), y1 = 150 - (22 + kg * 6); await moveEl(P, e, pxv(e.style.left), pxv(e.style.top), x1, y1, 420); rT += kg * d; return e; };
      if (B.wrong) { const e = await place(...B.wrong); tilt(); wr++; P.oops(); P.hint('Tips left. Needs more weight', 'bad'); await P.w(900); rT -= B.wrong[0] * B.wrong[1]; delete e.dataset.used; await moveEl(P, e, pxv(e.style.left), pxv(e.style.top), 50 + B.tray.indexOf(B.wrong[0]) * 70, 300, 300, false); tilt(); }
      const need = tq(); const [kg, d] = B.ans; await place(kg, d); const a = tilt(); P.hideFin();
      if (Math.abs(a) < .5) { ok++; set(ok); P.step(2); beam.classList.add('lvl'); const [x, y] = P.rel(beam); P.ring(x, y, '#FFE29A', 160); P.addScore(50); P.toast('Level', '#FFE29A'); P.hint(`${need} on each side`, 'good'); }
      await P.w(1200); }
    await fin(P, T);
    return { title: 'Perfect balance', stars: wr ? 2 : 3, stats: [`${ok} of 3 balanced`, `${wr} wrong try`, '+90 XP'] };
  } });

/* ════ BATCH 5 ════ */
/* Lane dash */
def({ sec: 'b5', name: 'Lane dash', kick: 'QUICK DECISIONS · 30 SEC', col: '#FF3D8E', glow: '#8B3DFF', bg: 'persp', secs: 30, best: '30 gems, no hits', pieces: 1,
  steps: ['Red blocks and white gems come at you', 'Swipe left or right to switch lanes', 'It speeds up the longer you last'],
  cap: 'The neon sibling of Tiny dash: a glowing car on four lanes, swipe instead of buttons. Overlaps with Tiny dash, so pick one for the app.',
  round: async P => {
    const LX = [42, 102, 162, 222], RY = 300;
    P.stage.innerHTML = `${LX.map(x => `<i class="ldl" style="left:${x}px"></i>`).join('')}<div class="ldo" data-r="piece" data-m="${PM(P)}"></div><div class="ldcar"></div><div class="ldsw">SWIPE ←  →</div>`;
    const ob = P.stage.querySelector('.ldo'), car = P.stage.querySelector('.ldcar'), sw = P.stage.querySelector('.ldsw'); let lane = 1, gems = 0, hits = 0, objs = [], spawnT = 0;
    const setLane = l => { lane = l; car.style.left = LX[l] + 'px'; }; setLane(1);
    const ck = clock(P, el => { const sp = .2 + el / 70000; if (el > spawnT) { spawnT = el + rnd(380, 600); const l = Math.random() * 4 | 0, red = Math.random() < .6; const e = document.createElement('div'); e.className = red ? 'ldb mat' : 'ldg'; if (red) e.style.setProperty('--c', '#FF3B3B'); e.style.left = LX[l] + 'px'; ob.appendChild(e); objs.push({ e, l, y: -30, red }); }
      objs.forEach(o => { o.y += sp * 17; o.e.style.top = o.y + 'px'; if (!o.hit && o.l === lane && Math.abs(o.y - RY) < 20) { o.hit = true; if (o.red) { hits++; car.classList.add('bump'); setTimeout(() => car.classList.remove('bump'), 400); P.oops(); } else { gems++; P.addScore(10); o.e.remove(); } } });
      objs = objs.filter(o => { if (o.y > 420 || (o.hit && !o.red)) { if (o.y > 420) o.e.remove(); return false; } return true; }); });
    const T = P.timer(30); P.setRound('DASH'); P.hint('Swipe to switch lanes'); let busy = false;
    try { while (!T.done) { await P.w(50); if (busy) continue; const th = objs.find(o => o.red && !o.hit && o.l === lane && o.y > RY - 140 && o.y < RY - 15);
        if (th) { const opts = [lane - 1, lane + 1].filter(l => l >= 0 && l < 4 && !objs.some(q => q.red && q.l === l && q.y > RY - 110 && q.y < RY + 20)); if (opts.length) { busy = true; const to = opts[Math.random() * opts.length | 0]; P.step(1); const [x, y] = P.rel(car); P.fin.style.opacity = 1; P.fin.style.left = x + 'px'; P.fin.style.top = (y + 40) + 'px'; await P.w(90); setLane(to); P.fin.style.left = (x + (to > lane ? 50 : -50)) + 'px'; await P.w(160); P.hideFin(); P.step(2); busy = false; } } } } finally { ck.stop(); }
    T.stop(); P.hideFin(); P.toast('Finish', '#FFB3D1'); await P.w(800);
    return { title: 'Fast lanes', stars: hits === 0 ? 3 : hits < 3 ? 2 : 1, stats: [`${gems} gems`, `${hits} hit${hits === 1 ? '' : 's'}`, '+80 XP'] };
  } });

/* Stop on the beep */
def({ sec: 'b5', name: 'Stop on the beep', kick: 'SELF-CONTROL · 40 SEC', col: '#17D9A3', glow: '#22A6FF', bg: 'grid', secs: 40, best: '16 of 16, every stop held',
  steps: ['An arrow appears: tap that way fast', 'If the screen flashes red, freeze', 'Holding still on a flash scores too'],
  cap: 'Two big Toy plastic buttons. Most rounds are a race, but a red flash (and a beep, with sound on) means stop. The point is the brake, not the speed.',
  round: async P => {
    P.stage.innerHTML = `<div class="sbf"></div><div class="sba"></div><div class="sbb">${toy('k kl', COL.mint, '<span>←</span>')}${toy('k kr', COL.mint, '<span>→</span>')}</div>`;
    const A = P.stage.querySelector('.sba'), F = P.stage.querySelector('.sbf'), K = { l: P.stage.querySelector('.kl'), r: P.stage.querySelector('.kr') }; const set = combo(P); let n = 0, right = 0, held = 0, slip = 0, st = 0;
    const T = P.timer(40);
    while (!T.done && n < 16) { n++; P.setRound(`${n} OF 16`); const d = pick(['l', 'r']), stop = n % 4 === 0; A.innerHTML = arrowSVG(d === 'l' ? 'l' : 'r', 90); A.className = 'sba on'; P.step(0); P.hint('Tap that way');
      if (stop) { await P.w(rnd(120, 220)); F.classList.add('on'); P.step(1); P.hint('Freeze', 'bad');
        if (n === 8) { await P.tap(K[d]); P.press(K[d]); slip++; st = 0; set(0); P.oops(); P.hint('That was a stop', 'bad'); }
        else { await P.w(900); held++; st++; set(st); P.addScore(20); P.hint('Held it', 'good'); const [x, y] = P.rel(A); P.ring(x, y, '#8BFAD8', 120); } F.classList.remove('on'); }
      else { await P.w(rnd(80, 200)); await P.tap(K[d]); P.press(K[d]); right++; st++; set(st); P.hit(K[d], COL.mint, '+10'); P.addScore(10); P.step(2); }
      A.className = 'sba'; P.hideFin(); await P.w(380); }
    await fin(P, T);
    return { title: 'Good brakes', stars: slip ? 2 : 3, stats: [`${right} fast taps`, `${held} of ${held + slip} stops held`, '+80 XP'] };
  } });

/* Mini crossword */
def({ sec: 'b5', name: 'Mini crossword', kick: 'WORDS · 90 SEC', col: '#F4F4F6', glow: '#8B3DFF', bg: 'grid', secs: 90, best: 'Solved in 0:41',
  steps: ['Read the clue for the highlighted row', 'Type the answer on the keys', 'Crossing letters help with the down words'],
  cap: 'A 3×3 word square on cream raised squares. The active clue sits above; letters type in, crossings glow, and the finished grid lifts. A real version needs a daily puzzle feed.',
  round: async P => {
    const W = ['BAT', 'ARE', 'TEN'], CL = ['Flying mammal that sleeps upside down', 'Plural of "is"', 'One more than nine'], KEYS = 'ABENRTSOL';
    P.stage.innerHTML = `<div class="mcq"></div><div class="mcg">${Array.from({ length: 9 }, (_, i) => `<i data-i="${i}"><small>${[1, 2, 3, 4, '', '', 5, '', ''][i]}</small><b></b></i>`).join('')}</div><div class="mck">${[...KEYS].map(k => toy('k', '#ECECF2', `<span>${k}</span>`)).join('')}</div>`;
    const q = P.stage.querySelector('.mcq'), G = [...P.stage.querySelectorAll('.mcg i')], K = [...P.stage.querySelectorAll('.mck .k')]; let typed = 0, wrong = 0;
    const T = P.timer(90); P.setRound('3 × 3');
    for (const [r, w] of W.entries()) { if (T.done) break; q.innerHTML = `<b>${r === 0 ? '1' : r === 1 ? '4' : '5'} ACROSS</b>${CL[r]}`; G.forEach((g, i) => g.classList.toggle('row', Math.floor(i / 3) === r)); P.step(0); P.hint('Fill the row'); await P.w(900);
      for (let c = 0; c < 3; c++) { const cell = G[r * 3 + c]; if (cell.querySelector('b').textContent) continue; let ch = w[c]; P.step(1);
        if (r === 1 && c === 1 && !wrong) { const k = K.find(x => x.textContent === 'O'); await P.tap(k); P.press(k); cell.querySelector('b').textContent = 'O'; cell.classList.add('bad'); wrong++; P.oops(); P.hint('Doesn\'t fit 2 down', 'bad'); await P.w(600); cell.classList.remove('bad'); cell.querySelector('b').textContent = ''; }
        const k = K.find(x => x.textContent === ch); await P.w(rnd(150, 300)); await P.tap(k); P.press(k); cell.querySelector('b').textContent = ch; cell.classList.add('in'); typed++; P.addScore(5);
        if (r > 0) G[c].classList.add('x'); }
      P.hideFin(); P.step(2); P.hint('Row done', 'good'); P.addScore(20); await P.w(500); }
    G.forEach(g => g.classList.remove('row')); const grid = P.stage.querySelector('.mcg'); grid.classList.add('lift'); q.innerHTML = '<b>SOLVED</b>Down words read the same: BAT, ARE, TEN'; const [x, y] = P.rel(grid); P.ring(x, y, '#fff', 180); P.toast('Solved', '#fff'); P.addScore(60); await P.w(1300);
    await fin(P, T);
    return { title: 'Crossword done', stars: wrong ? 2 : 3, stats: [`${typed} letters`, `${wrong} wrong letter`, '+90 XP'] };
  } });

/* Word bridge */
def({ sec: 'b5', name: 'Word bridge', kick: 'WORDS · 60 SEC', col: '#17D9A3', glow: '#22A6FF', bg: 'dots', secs: 60, best: 'COLD → WARM in 4',
  steps: ['Get from the top word to the bottom word', 'Change one letter per step', 'Every step has to be a real word'],
  cap: 'Each new rung flips its changed letter in and locks. A step that isn\'t a word shakes off. Short ladders, so it fits a one-minute detour.',
  round: async P => {
    const LAD = ['COLD', 'CORD', 'WORD', 'WARD', 'WARM'];
    P.stage.innerHTML = `<div class="wbl">${LAD.map((w, i) => `<div class="wbr ${i === 0 || i === 4 ? 'fix' : ''}">${[...w].map(ch => `<i>${i === 0 || i === 4 ? ch : ''}</i>`).join('')}</div>`).join('')}</div><div class="wbk">${[...'RWAMBLT'].map(k => toy('k', COL.mint, `<span>${k}</span>`)).join('')}</div>`;
    const R = [...P.stage.querySelectorAll('.wbr')], K = [...P.stage.querySelectorAll('.wbk .k')]; let steps = 0, bad = 0; const T = P.timer(60); P.setRound('COLD → WARM');
    for (let i = 1; i < 4; i++) { if (T.done) break; const prev = LAD[i - 1], cur = LAD[i]; const pos = [...cur].findIndex((ch, k) => ch !== prev[k]); const cells = [...R[i].children]; cells.forEach((c, k) => c.textContent = prev[k]); R[i].classList.add('act'); P.step(0); P.hint(`Change one letter of ${prev}`); await P.w(700);
      if (i === 2 && !bad) { P.step(1); await P.tap(cells[0]); cells[0].classList.add('sel'); const k = K.find(x => x.textContent === 'B'); await P.tap(k); P.press(k); cells[0].textContent = 'B'; R[i].classList.add('bad'); bad++; P.oops(); P.hint('BORD isn\'t a word', 'bad'); await P.w(600); R[i].classList.remove('bad'); cells[0].textContent = prev[0]; cells[0].classList.remove('sel'); }
      P.step(1); await P.tap(cells[pos]); cells[pos].classList.add('sel'); await P.w(150); const k = K.find(x => x.textContent === cur[pos]); await P.tap(k); P.press(k); cells[pos].textContent = cur[pos]; cells[pos].classList.remove('sel'); cells[pos].animate([{ transform: 'rotateX(90deg)' }, { transform: 'none' }], { duration: 300 }); R[i].classList.remove('act'); R[i].classList.add('ok'); steps++; P.step(2); P.hit(R[i], COL.mint, '+20'); P.addScore(20); P.hint(cur, 'good'); P.hideFin(); await P.w(500); }
    R[4].classList.add('ok'); const [x, y] = P.rel(R[4]); P.burst(x, y, COL.mint, 16); P.toast('Bridged', '#8BFAD8'); P.addScore(50); await P.w(1100);
    await fin(P, T);
    return { title: 'Bridge of words', stars: bad ? 2 : 3, stats: [`${steps + 1} steps`, `${bad} non-word`, '+80 XP'] };
  } });

/* Track the stars */
def({ sec: 'b5', name: 'Track the stars', kick: 'FOCUS · 45 SEC', col: '#22A6FF', glow: '#4A5BFF', bg: 'dots', secs: 45, best: '4 tracked, 4 rounds',
  steps: ['A few beads glow for a moment', 'Then they all look the same and drift', 'When they stop, tap the ones you followed'],
  cap: 'Glass beads in a recessed field. The background goes quiet while you track. The classic multiple-object tracking task, made calm and pretty.',
  round: async P => {
    P.stage.innerHTML = `<div data-m="well" style="display:contents"><div class="tsf mat" style="--c:#06101E"></div></div><div class="tsb" data-m="candy"></div>`;
    const box = P.stage.querySelector('.tsb'); const set = combo(P, 'Rounds'); let rounds = 0, picked = 0, missT = 0; const T = P.timer(45);
    for (let r = 0; r < 4 && !T.done; r++) { P.setRound(`ROUND ${r + 1} OF 4`); const n = 8, k = 2 + Math.min(2, r); box.innerHTML = '';
      const B = Array.from({ length: n }, (_, i) => { const e = document.createElement('div'); e.className = 'tsd mat'; e.style.setProperty('--c', '#5A6A8A'); box.appendChild(e); return { e, x: rnd(30, 234), y: rnd(30, 300), vx: rnd(-1, 1), vy: rnd(-1, 1) }; });
      const place = () => B.forEach(b => { b.e.style.left = b.x + 'px'; b.e.style.top = b.y + 'px'; }); place();
      const tg = B.slice(0, k); tg.forEach(b => { b.e.classList.add('glow'); b.e.style.setProperty('--c', '#7CF6FF'); }); P.step(0); P.hint(`Follow these ${k}`, 'watch'); await P.w(1300);
      tg.forEach(b => { b.e.classList.remove('glow'); b.e.style.setProperty('--c', '#5A6A8A'); }); P.step(1); P.quiet(1); P.hint('Keep your eyes on them', 'watch');
      await P.anim(() => { B.forEach(b => { b.vx += rnd(-.15, .15); b.vy += rnd(-.15, .15); const s = Math.hypot(b.vx, b.vy) || 1; b.vx = b.vx / s * 1.6; b.vy = b.vy / s * 1.6; b.x += b.vx; b.y += b.vy; if (b.x < 22 || b.x > 242) b.vx *= -1; if (b.y < 22 || b.y > 310) b.vy *= -1; b.x = Math.max(22, Math.min(242, b.x)); b.y = Math.max(22, Math.min(310, b.y)); }); place(); }, 3600);
      P.quiet(0); P.step(2); P.hint(`Tap the ${k} you followed`);
      for (const [i, b] of tg.entries()) { let t = b; if (r === 2 && i === 1) { t = B[k + 1]; } await P.w(rnd(200, 400)); await P.tap(t.e); if (t === b) { t.e.style.setProperty('--c', '#3BE3B2'); t.e.classList.add('glow'); picked++; P.hit(t.e, '#3BE3B2', '+15'); P.addScore(15); } else { missT++; t.e.classList.add('bad'); P.oops(); P.hint('Not one of them', 'bad'); b.e.style.setProperty('--c', '#7CF6FF'); b.e.classList.add('glow'); } }
      P.hideFin(); rounds++; set(rounds); await P.w(1000); }
    await fin(P, T);
    return { title: 'Locked on', stars: missT ? 2 : 3, stats: [`${picked} tracked`, `${missT} lost`, '+80 XP'] };
  } });

/* ════ BATCH 6 ════ */
/* Path memory */
def({ sec: 'b6', name: 'Path memory', kick: 'MEMORY · 45 SEC', col: '#8B3DFF', glow: '#4A5BFF', bg: 'grid', secs: 45, best: '8-step path', pieces: 1,
  steps: ['A dot walks a route across the grid', 'Remember every turn', 'Redraw the route from the start'],
  cap: 'A glowing dot walks a route on a recessed 5×5 grid, leaving a fading trail. Then you trace it back. Routes grow by one step each round.',
  round: async P => {
    const S = 46, OX = (264 - 5 * S) / 2, OY = 30, ctr = (r, c) => [OX + c * S + S / 2, OY + r * S + S / 2];
    P.stage.innerHTML = `<div data-m="well" style="display:contents"><div class="pmb mat" style="--c:#0E0A22;left:${OX - 6}px;top:${OY - 6}px">${Array.from({ length: 25 }, (_, i) => `<i class="pmc" style="left:${(i % 5) * S + 6}px;top:${Math.floor(i / 5) * S + 6}px"></i>`).join('')}</div></div><div data-r="piece" data-m="${PM(P) === 'enamel' ? 'candy' : 'enamel'}" style="display:contents"><div class="pmd mat" style="--c:#A57BFF"></div></div>`;
    const C = [...P.stage.querySelectorAll('.pmc')], dot = P.stage.querySelector('.pmd'); const lives = livesUI(P); let lv = 3, len = 4, best = 0; const T = P.timer(45);
    const route = n => { let r = 2, c = 0; const p = [[r, c]]; while (p.length < n) { const o = [[0, 1], [1, 0], [-1, 0], [0, -1]].map(([a, b]) => [r + a, c + b]).filter(([a, b]) => a >= 0 && a < 5 && b >= 0 && b < 5 && !p.some(q => q[0] === a && q[1] === b)); if (!o.length) break; [r, c] = pick(o); p.push([r, c]); } return p; };
    while (!T.done && len <= 8 && lv > 0) { P.setRound(`${len} STEPS`); const p = route(len); C.forEach(c => c.className = 'pmc'); dot.style.opacity = 1; P.step(0); P.quiet(1); P.hint('Watch the route', 'watch');
      for (const [r, c] of p) { const [x, y] = ctr(r, c); dot.style.left = (x - 13) + 'px'; dot.style.top = (y - 13) + 'px'; C[r * 5 + c].classList.add('trail'); await P.w(380); setTimeout(() => C[r * 5 + c].classList.remove('trail'), 500); }
      dot.style.opacity = 0; P.quiet(0); await P.w(500); P.step(1); P.hint('Now trace it'); let ok = true;
      for (const [k, [r, c]] of p.entries()) { let rr = r, cc = c; if (len === 6 && k === 3) { cc = c === 4 ? 3 : c + 1; rr = r; if (p.some(q => q[0] === rr && q[1] === cc)) { rr = r === 4 ? 3 : r + 1; } }
        const e = C[rr * 5 + cc]; if (k === 0) await P.tap(e); else { const [x, y] = P.rel(e); P.fin.style.left = x + 'px'; P.fin.style.top = y + 'px'; await P.w(220); }
        if (rr === r && cc === c) { e.classList.add('on'); P.addScore(5); } else { e.classList.add('no'); ok = false; P.oops(); lv--; lives[lv].classList.add('lost'); P.hint('Wrong turn', 'bad'); C[r * 5 + c].classList.add('show'); break; } }
      P.hideFin(); P.step(2); if (ok) { best = len; P.addScore(20); P.toast(`${len} steps`, '#C9A8FF'); len++; } await P.w(900); }
    await fin(P, T);
    return { title: 'Good recall', stars: lv === 3 ? 3 : 2, stats: [`Longest ${best} steps`, `${3 - lv} wrong turn`, '+80 XP'] };
  } });

/* Letter orbit */
def({ sec: 'b6', name: 'Letter orbit', kick: 'WORDS · 45 SEC', col: '#4A5BFF', glow: '#8B3DFF', bg: 'dots', secs: 45, best: '3 words', pieces: 1,
  steps: ['Letters sit on a ring that clicks round', 'Turn it until the letter you want is at the top', 'Feed it into the socket to spell the clue word'],
  cap: 'A machined ring of Enamel letter beads (Candy below) turns one click at a time. The top slot feeds the centre socket. Spell the word the clue describes.',
  round: async P => {
    const WORDS = [['CALM', 'Not stressed'], ['FOCUS', 'What this app trains']]; const RING = 'CAFOLMUSD'; const N = RING.length, CX = 132, CY = 200, RR = 92;
    P.stage.innerHTML = `<div class="loq"></div><div class="lows"></div><div data-m="well" style="display:contents"><div class="lorg mat" style="--c:#0A0E28"></div></div><div class="lor" data-r="piece" data-m="${PM(P)}">${[...RING].map((ch, i) => `<div class="lob mat" style="--c:#4A5BFF"><span>${ch}</span></div>`).join('')}</div><div class="lonotch"></div>
      <div class="lobt">${toy('k kl', COL.cobalt, '<span>⟲</span>')}${toy('k kf', COL.sun, '<span>FEED</span>')}${toy('k kr', COL.cobalt, '<span>⟳</span>')}</div>`;
    const beads = [...P.stage.querySelectorAll('.lob')], q = P.stage.querySelector('.loq'), ws = P.stage.querySelector('.lows'), KL = P.stage.querySelector('.kl'), KR = P.stage.querySelector('.kr'), KF = P.stage.querySelector('.kf'); let off = 0, words = 0, clicks = 0;
    const lay = () => beads.forEach((b, i) => { const a = -Math.PI / 2 + (i - off) * Math.PI * 2 / N; b.style.left = (CX + RR * Math.cos(a) - 18) + 'px'; b.style.top = (CY + RR * Math.sin(a) - 18) + 'px'; b.classList.toggle('top', ((i - off) % N + N) % N === 0); }); lay();
    const T = P.timer(45);
    for (const [w, clue] of WORDS) { if (T.done) break; P.setRound(`${w.length} LETTERS`); P.hint('Turn the ring, then feed'); q.innerHTML = `<b>CLUE</b>${clue}`; ws.innerHTML = [...w].map(() => '<i></i>').join(''); const S = [...ws.children]; P.step(0); await P.w(700);
      for (const [k, ch] of [...w].entries()) { if (T.done) break; const ti = RING.indexOf(ch); let d = ((ti - off) % N + N) % N; const dir = d <= N / 2 ? 1 : -1; let steps = dir > 0 ? d : N - d; P.step(1);
        while (steps-- > 0) { const btn = dir > 0 ? KR : KL; await P.tap(btn); P.press(btn); off = (off + dir + N) % N; lay(); clicks++; await P.w(60); }
        await P.tap(KF); P.press(KF); P.step(2); S[k].textContent = ch; S[k].classList.add('in'); const b = beads[ti]; b.animate([{ transform: 'scale(1.2)' }, { transform: 'none' }], { duration: 250 }); P.addScore(10); }
      words++; P.hideFin(); const [x, y] = P.rel(ws); P.ring(x, y, '#8BA0FF', 140); P.toast(w, '#B9C4FF'); P.addScore(30); await P.w(1000); }
    await fin(P, T);
    return { title: 'Spelled it', stars: 3, stats: [`${words} words`, `${clicks} clicks`, '+70 XP'] };
  } });

/* Shop sprint */
def({ sec: 'b6', name: 'Shop sprint', kick: 'QUICK DECISIONS · 40 SEC', col: '#FFC53D', glow: '#FF7A1F', bg: 'grid', secs: 40, best: '10 of 10 deals', pieces: 1,
  steps: ['Two offers appear', 'Work out which is cheaper per item', 'Tap the better deal before the bar runs out'],
  cap: 'Two price tags (Enamel / Candy below) with a shrinking bar under them. Quick per-item maths, with a reveal of the real price per item after each pick.',
  round: async P => {
    const DEALS = [[[3, 5], [2, 3]], [[4, 6], [5, 8]], [[2, 7], [3, 9]], [[6, 9], [4, 7]], [[3, 4], [5, 7]], [[2, 5], [5, 13]], [[4, 10], [3, 7]], [[5, 6], [3, 4]], [[2, 9], [3, 12]], [[4, 5], [6, 8]]];
    P.stage.innerHTML = `<div class="ssh">Which is the better deal?</div><div class="sso" data-r="piece" data-m="${PM(P)}"><div class="ssc mat" style="--c:#FF7A1F"></div><div class="ssc mat" style="--c:#22A6FF"></div></div><div class="ssbar"><i></i></div><div class="ssr"></div>`;
    const C = [...P.stage.querySelectorAll('.ssc')], bar = P.stage.querySelector('.ssbar i'), rv = P.stage.querySelector('.ssr'); const set = combo(P); let n = 0, right = 0, st = 0; const T = P.timer(40);
    for (const D of DEALS) { if (T.done) break; n++; P.setRound(`${n} OF 10`); C.forEach((c, i) => { c.innerHTML = `<b>${D[i][0]} for $${D[i][1]}</b><span>tap to pick</span>`; c.classList.remove('ok', 'no', 'dim'); }); rv.textContent = ''; P.step(0);
      const per = D.map(([q, p]) => p / q), best = per[0] < per[1] ? 0 : 1; const bt = P.anim(p => bar.style.width = (100 - p * 100) + '%', 3500); bt.catch(() => {}); await P.w(rnd(800, 1600)); P.step(1);
      const pickI = n === 5 ? 1 - best : best; await P.tap(C[pickI]); P.step(2);
      rv.innerHTML = D.map(([q, p], i) => `<span style="color:${i === best ? '#8BFAD8' : '#9B9CA1'}">$${(p / q).toFixed(2)} each</span>`).join('');
      if (pickI === best) { right++; st++; set(st); C[pickI].classList.add('ok'); C[1 - pickI].classList.add('dim'); P.hit(C[pickI], '#FFE29A', `+${10 + st * 2}`); P.addScore(10 + st * 2); P.hint('Better deal', 'good'); } else { st = 0; set(0); C[pickI].classList.add('no'); C[best].classList.add('ok'); P.oops(); P.hint('The other was cheaper each', 'bad'); }
      P.hideFin(); await P.w(900); }
    await fin(P, T);
    return { title: 'Bargain hunter', stars: right >= 9 ? 3 : 2, stats: [`${right} of ${n} deals`, 'Quick maths', '+80 XP'] };
  } });

/* Hold the line (calm) */
def({ sec: 'b6', calm: 1, name: 'Hold the line', kick: 'CALM · 45 SEC', col: '#22A6FF', bg: 'dots', secs: 30, len: '45 sec', settle: 'Hold the phone flat. Breathe.',
  steps: ['A dot wobbles inside a ring', 'Tilt the phone gently to keep it centred', 'Small, slow moves work best'],
  cap: 'Needs the motion sensor, so the tilt is simulated here. A soft ring fills while the dot stays inside. No score, just a steady half-minute.',
  round: async P => {
    P.stage.innerHTML = `<div class="hlr"><svg width="220" height="220"><circle cx="110" cy="110" r="70" fill="none" stroke="rgba(124,200,255,.25)" stroke-width="2"/><circle class="hla" cx="110" cy="110" r="96" fill="none" stroke="#7CC8FF" stroke-width="4" stroke-linecap="round" stroke-dasharray="0 604" transform="rotate(-90 110 110)"/></svg><div class="hld"></div></div><div class="hlph"><i></i></div><span class="simtag" style="top:320px">PROTOTYPE · TILT IS SIMULATED</span>`;
    const d = P.stage.querySelector('.hld'), arc = P.stage.querySelector('.hla'), ph = P.stage.querySelector('.hlph i'); P.quiet(1); P.setRound('STAY STEADY'); const T = P.timer(30); let inside = 0;
    P.step(0); await P.w(600); P.step(1); let x = 0, y = 0, tx = 0, ty = 0;
    await P.anim(p => { const t = p * 30; const wob = [Math.sin(t * 1.7) * 30 + Math.sin(t * .6) * 20, Math.cos(t * 1.3) * 26]; tx = -wob[0] * .8; ty = -wob[1] * .8; x = wob[0] + tx + Math.sin(t * 5) * 6; y = wob[1] + ty + Math.cos(t * 4) * 6; if (p > .4 && p < .48) { x += 60; } d.style.transform = `translate(${x}px,${y}px)`; ph.style.transform = `rotateX(${ty * .6}deg) rotateY(${-tx * .6}deg)`; const ok = Math.hypot(x, y) < 64; d.classList.toggle('out', !ok); if (ok) inside++; arc.setAttribute('stroke-dasharray', `${604 * p} 604`); P.hint(ok ? 'Steady' : 'Ease it back'); if (p > .5) P.step(2); }, 30000);
    T.stop(); P.quiet(0);
    return { title: 'Steady hands', line: 'Half a minute of small, careful movements.', stats: ['30 sec', 'Mostly centred'] };
  } });

/* Pocket terrarium (calm) */
def({ sec: 'b6', calm: 1, name: 'Pocket terrarium', kick: 'CALM · NO TIMER', col: '#17D9A3', bg: 'dots', secs: 60, len: 'As long as you like', settle: 'No timer. No score.',
  steps: ['Pick plants, stones and a little creature', 'Tap a spot in the jar to place them', 'Close the lid when it feels right'],
  cap: 'A glass jar and a small tray of pieces. No goal and no timer: the calm, creative one. The finished jar is saved to your collection.',
  round: async P => {
    const IT = [['🌿', 'fern'], ['🌵', 'cactus'], ['🍄', 'mushroom'], ['🪨', 'stone'], ['🐌', 'snail'], ['🌸', 'bloom']];
    P.stage.innerHTML = `<div class="ptj"><div class="ptlid"></div><div class="ptsoil"></div><div class="ptin"></div></div><div class="ptt">${IT.map(([e]) => `<i>${e}</i>`).join('')}</div>`;
    const jin = P.stage.querySelector('.ptin'), tray = [...P.stage.querySelectorAll('.ptt i')], lid = P.stage.querySelector('.ptlid'); P.setRound('YOUR JAR'); const T = P.timer(60);
    const spots = [[40, 120], [120, 116], [80, 128], [150, 130], [60, 98], [104, 100]]; P.step(0);
    for (const [k, i] of [0, 3, 1, 4, 5, 2].entries()) { await P.w(rnd(500, 800)); P.step(k < 2 ? 0 : 1); await P.tap(tray[i]); tray[i].classList.add('used'); const e = document.createElement('i'); e.textContent = IT[i][0]; e.style.left = spots[k][0] + 'px'; e.style.top = spots[k][1] + 'px'; jin.appendChild(e); e.animate([{ transform: 'translateY(-60px) scale(.6)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 450, easing: 'cubic-bezier(.3,1.5,.5,1)' }); P.hint(`A ${IT[i][1]}`); }
    P.hideFin(); P.step(2); await P.w(700); lid.classList.add('on'); P.hint('Lid on'); const [x, y] = P.rel(lid); P.burst(x, y + 60, '#8BFAD8', 14); await P.w(1200); T.stop();
    return { title: 'Your little jar', line: 'Saved to your collection. Nothing to win here.', stats: ['6 pieces', 'No timer'] };
  } });

/* ════ BATCH 7 ════ */
/* Spin it */
const SPIN = 'M0 0 H24 V8 H8 V16 H18 V24 H8 V36 H0 Z';
def({ sec: 'b7', name: 'Spin it', kick: 'FLEXIBILITY · 40 SEC', col: '#5B4BC4', glow: '#4A5BFF', bg: 'grid', secs: 40, best: '10 of 10', pieces: 1,
  steps: ['A shape sits at the top', 'Below are two copies, both turned', 'One is only turned, one is mirrored: tap the turned one'],
  cap: 'Mental rotation with an F-shaped piece. Enamel shapes (Candy below). After each answer the mirrored one flips to show why.',
  round: async P => {
    P.stage.innerHTML = `<div data-m="well" style="display:contents"><div class="spt mat" style="--c:#0E0A22"></div></div><div class="sptg"></div><div class="spo" data-r="piece" data-m="${PM(P)}"><div class="spc mat" style="--c:#6E5BEF"></div><div class="spc mat" style="--c:#6E5BEF"></div></div>`;
    const tg = P.stage.querySelector('.sptg'), C = [...P.stage.querySelectorAll('.spc')]; const set = combo(P); let n = 0, right = 0, st = 0; const T = P.timer(40);
    const svg = (rot, flip, c = '#fff') => `<svg width="70" height="70" viewBox="-14 -10 52 56"><g transform="rotate(${rot} 12 18) ${flip ? 'translate(24 0) scale(-1 1)' : ''}"><path d="${SPIN}" fill="${c}"/></g></svg>`;
    while (!T.done && n < 10) { n++; P.setRound(`${n} OF 10`); const r0 = pick([0, 90, 180, 270]); tg.innerHTML = svg(r0, false, '#C9C2FF'); const good = Math.random() * 2 | 0; C.forEach((c, i) => { c.innerHTML = svg(r0 + pick([90, 180, 270]), i !== good); c.classList.remove('ok', 'no', 'dim'); });
      P.step(0); P.hint('Tap the one that is only turned'); await P.w(rnd(700, 1300)); P.step(1); const pi = n === 4 ? 1 - good : good; await P.tap(C[pi]); P.step(2);
      if (pi === good) { right++; st++; set(st); C[pi].classList.add('ok'); C[1 - pi].classList.add('dim'); P.hit(C[pi], '#C9C2FF', '+10'); P.addScore(10 + st * 2); P.hint('Just turned', 'good'); } else { st = 0; set(0); C[pi].classList.add('no'); C[good].classList.add('ok'); P.oops(); P.hint('That one was mirrored', 'bad'); }
      P.hideFin(); await P.w(800); }
    await fin(P, T);
    return { title: 'Spatial sense', stars: right >= 9 ? 3 : 2, stats: [`${right} of ${n}`, 'Mirror spotted', '+70 XP'] };
  } });

/* Letter forge */
def({ sec: 'b7', name: 'Letter forge', kick: 'WORDS · 60 SEC', col: '#FF7A1F', glow: '#FFC53D', bg: 'dots', secs: 60, best: '7 letters used',
  steps: ['Seven letter tiles in your rack', 'Tap tiles to build a word in the tray', 'Longer words earn more'],
  cap: 'Engraved Toy plastic letter tiles snap from the rack into a recessed word tray. Close to Letter guess in feel, so it\'s the one to drop if the words set feels crowded.',
  round: async P => {
    const RACK = 'PLANETS', PLAY = ['SLANT', 'PLANET', 'PLAN', 'PANELS'];
    P.stage.innerHTML = `<div class="lfw"></div><div data-m="well" style="display:contents"><div class="lft mat" style="--c:#1E1206"></div></div><div class="lfr">${[...RACK].map(ch => toy('k', COL.orange, `<span>${ch}</span>`)).join('')}</div><div class="lfgo">${toy('k kgo', COL.mint, '<span>Forge</span>')}</div>`;
    const R = [...P.stage.querySelectorAll('.lfr .k')], tray = P.stage.querySelector('.lft'), list = P.stage.querySelector('.lfw'), GO = P.stage.querySelector('.kgo'); let words = 0, best = 0; const T = P.timer(60); P.setRound('RACK: PLANETS');
    for (const w of PLAY) { if (T.done) break; P.step(0); tray.innerHTML = ''; R.forEach(k => k.classList.remove('used')); await P.w(500); P.step(1);
      for (const ch of w) { const k = R.find(x => x.textContent === ch && !x.classList.contains('used')); await P.w(rnd(120, 250)); await P.tap(k); P.press(k); k.classList.add('used'); const t = document.createElement('i'); t.textContent = ch; tray.appendChild(t); t.animate([{ transform: 'translateY(40px) scale(.6)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 260, easing: 'cubic-bezier(.3,1.5,.5,1)' }); }
      await P.tap(GO); P.press(GO); P.step(2); const pts = w.length * w.length * 2; words++; best = Math.max(best, w.length); const row = document.createElement('span'); row.textContent = `${w} +${pts}`; list.appendChild(row); P.hit(tray, COL.orange, `+${pts}`); P.addScore(pts); P.hint(w.length >= 6 ? 'Long one' : 'Forged', 'good'); P.hideFin(); await P.w(600); }
    await fin(P, T);
    return { title: 'Word smith', stars: best >= 6 ? 3 : 2, stats: [`${words} words`, `Longest ${best}`, '+80 XP'] };
  } });

/* Middle arrow */
def({ sec: 'b7', name: 'Middle arrow', kick: 'FOCUS · 40 SEC', col: '#22A6FF', glow: '#4A5BFF', bg: 'grid', secs: 40, best: '16 of 16, avg 480 ms', pieces: 1,
  steps: ['Five arrows appear in a row', 'Only the middle one counts', 'Tap its direction, ignore the crowd'],
  cap: 'The classic attention task (the flanker test). Raised arrow tokens (Enamel / Candy below), the middle one slightly brighter. Toy plastic buttons. Shows your reaction time.',
  round: async P => {
    P.stage.innerHTML = `<div class="maw" data-r="piece" data-m="${PM(P)}">${'<div class="mat mat5" style="--c:#2E3A66"></div>'.repeat(5)}</div><div class="mart"></div><div class="mab">${toy('k kl', COL.sky, '<span>←</span>')}${toy('k kr', COL.sky, '<span>→</span>')}</div>`;
    const A = [...P.stage.querySelectorAll('.mat5')], K = { l: P.stage.querySelector('.kl'), r: P.stage.querySelector('.kr') }, rt = P.stage.querySelector('.mart'); const set = combo(P); let n = 0, right = 0, st = 0, sum = 0; const T = P.timer(40);
    while (!T.done && n < 16) { n++; P.setRound(`${n} OF 16`); const mid = pick(['l', 'r']), inc = Math.random() < .5, fl = inc ? (mid === 'l' ? 'r' : 'l') : mid;
      A.forEach((a, i) => { a.innerHTML = arrowSVG(i === 2 ? mid : fl, 28); a.classList.toggle('mid', i === 2); a.style.opacity = 1; }); P.step(0); const rtm = Math.round(rnd(380, 620) + (inc ? 60 : 0)); await P.w(Math.max(0, rtm - 320)); P.step(1);
      const ans = n === 6 && inc ? fl : mid; await P.tap(K[ans]); P.press(K[ans]); P.step(2);
      if (ans === mid) { right++; st++; set(st); sum += rtm; rt.textContent = `${rtm} ms`; P.hit(A[2], '#8BE0FF', '+10'); P.addScore(10 + st); P.hint(inc ? 'Ignored the crowd' : 'Right', 'good'); } else { st = 0; set(0); rt.textContent = ''; P.oops(); P.hint('The crowd pulled you', 'bad'); }
      A.forEach(a => a.style.opacity = .15); P.hideFin(); await P.w(380); }
    await fin(P, T);
    return { title: 'Steady focus', stars: right >= 15 ? 3 : 2, stats: [`${right} of ${n}`, `Avg ${Math.round(sum / Math.max(1, right))} ms`, '+80 XP'] };
  } });

/* Bigger total */
def({ sec: 'b7', name: 'Bigger total', kick: 'QUICK DECISIONS · 40 SEC', col: '#FF7A1F', glow: '#FFC53D', bg: 'grid', secs: 40, best: '12 of 12', pieces: 1,
  steps: ['Two stacks of number tiles', 'Add each stack in your head', 'Tap the bigger one before the bar runs out'],
  cap: 'Raised number tiles (Enamel / Candy below) in two recessed bins. The totals flip up after you pick, so you can check your maths.',
  round: async P => {
    P.stage.innerHTML = `<div class="btw" data-r="piece" data-m="${PM(P)}"><div class="bts" data-m="well"></div><div class="bts" data-m="well"></div></div><div class="ssbar"><i></i></div>`;
    const S = [...P.stage.querySelectorAll('.bts')], bar = P.stage.querySelector('.ssbar i'); const set = combo(P); let n = 0, right = 0, st = 0; const T = P.timer(40);
    while (!T.done && n < 12) { n++; P.setRound(`${n} OF 12`); const a = Array.from({ length: 3 }, () => 1 + (Math.random() * 9 | 0)), b = Array.from({ length: 3 }, () => 1 + (Math.random() * 9 | 0)); let sa = a.reduce((x, y) => x + y), sb = b.reduce((x, y) => x + y); if (sa === sb) { b[0] = b[0] === 9 ? 8 : b[0] + 1; sb = b.reduce((x, y) => x + y); }
      [a, b].forEach((arr, i) => { S[i].innerHTML = arr.map(v => `<div class="btt mat" style="--c:${i ? COL.sky : COL.orange}"><span>${v}</span></div>`).join('') + `<b class="btsum"></b>`; S[i].classList.remove('ok', 'no'); });
      const bt = P.anim(p => bar.style.width = (100 - p * 100) + '%', 3500); bt.catch(() => {}); P.step(0); await P.w(rnd(900, 1500)); P.step(1); const best = sa > sb ? 0 : 1, pi = n === 7 ? 1 - best : best; await P.tap(S[pi]); P.step(2);
      S[0].querySelector('.btsum').textContent = sa; S[1].querySelector('.btsum').textContent = sb; S.forEach(s => s.classList.add('show'));
      if (pi === best) { right++; st++; set(st); S[pi].classList.add('ok'); P.hit(S[pi], '#FFE29A', `+${10 + st}`); P.addScore(10 + st); P.hint('Bigger', 'good'); } else { st = 0; set(0); S[pi].classList.add('no'); S[best].classList.add('ok'); P.oops(); P.hint(`${Math.max(sa, sb)} beats ${Math.min(sa, sb)}`, 'bad'); }
      P.hideFin(); await P.w(900); S.forEach(s => s.classList.remove('show')); }
    await fin(P, T);
    return { title: 'Quick adder', stars: right >= 11 ? 3 : 2, stats: [`${right} of ${n}`, 'Mental maths', '+80 XP'] };
  } });

/* Sort the stream */
def({ sec: 'b7', name: 'Sort the stream', kick: 'FLEXIBILITY · 40 SEC', col: '#17D9A3', glow: '#22A6FF', bg: 'dots', secs: 40, best: '20 sorted', pieces: 1,
  steps: ['Cards stream in one after another', 'Swipe left or right by the rule', 'When the rule switches, switch with it'],
  cap: 'Like Rule flip but faster and continuous: cards keep coming, and the rule banner flips from colour to shape mid-stream. Overlaps Rule flip, so keep only one in the app.',
  round: async P => {
    P.stage.innerHTML = `<div class="rule"><span class="rl">Colour: pink ← → blue</span></div><div class="sts" data-r="piece" data-m="${PM(P)}"></div><div class="stl">← PINK</div><div class="str">BLUE →</div>`;
    const box = P.stage.querySelector('.sts'), rl = P.stage.querySelector('.rule'), L = P.stage.querySelector('.stl'), R = P.stage.querySelector('.str'); const set = combo(P); let n = 0, right = 0, st = 0, rule = 'colour'; const T = P.timer(40);
    while (!T.done && n < 20) { n++; P.setRound(`RULE: ${rule.toUpperCase()}`); if (n === 9) { rule = 'shape'; rl.querySelector('.rl').textContent = 'Shape: circle ← → square'; rl.classList.remove('flip'); void rl.offsetWidth; rl.classList.add('flip'); L.textContent = '← CIRCLE'; R.textContent = 'SQUARE →'; P.toast('Rule switch', '#fff'); P.quiet(1); await P.w(1000); P.quiet(0); }
      const col = pick(['pink', 'blue']), shp = pick(['c', 's']); const c = document.createElement('div'); c.className = `stc mat ${shp}`; c.style.setProperty('--c', col === 'pink' ? COL.pink : COL.sky); box.appendChild(c); c.animate([{ transform: 'translateY(-40px) scale(.7)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 220 });
      const side = rule === 'colour' ? (col === 'pink' ? -1 : 1) : (shp === 'c' ? -1 : 1); P.step(n >= 9 ? 2 : 0); await P.w(rnd(250, 450)); const s = n === 10 ? -side : side; await P.tap(c); P.step(1);
      c.animate([{ transform: 'none' }, { transform: `translateX(${s * 150}px) rotate(${s * 20}deg)`, opacity: 0 }], { duration: 260, fill: 'forwards' }); setTimeout(() => c.remove(), 270);
      if (s === side) { right++; st++; set(st); P.addScore(8 + st); P.hint(st > 4 ? `${st} in a row` : 'Sorted', 'good'); } else { st = 0; set(0); P.oops(); P.hint('New rule: shape', 'bad'); } P.hideFin(); await P.w(150); }
    await fin(P, T);
    return { title: 'Switched on', stars: right >= 19 ? 3 : 2, stats: [`${right} of ${n} sorted`, '1 rule switch', '+80 XP'] };
  } });

/* Echo */
def({ sec: 'b7', name: 'Echo', kick: 'MEMORY · 45 SEC', col: '#FF3D8E', glow: '#8B3DFF', bg: 'grid', secs: 45, best: '14 of 16', pieces: 1,
  steps: ['Shapes slide past one at a time', 'Press Match if it\'s the same as two back', 'Otherwise just let it pass'],
  cap: 'A 2-back memory task on a recessed track: the last three shapes stay visible faintly, the one two back is outlined. It\'s the hardest game here, so it suits a "challenge" slot rather than a detour.',
  round: async P => {
    const SH = ['c', 's', 't', 'd'];
    P.stage.innerHTML = `<div data-m="well" style="display:contents"><div class="ect mat" style="--c:#1A0A16"></div></div><div class="ecs" data-r="piece" data-m="${PM(P)}"></div><div class="ecb">${toy('k km', COL.pink, '<span>Match</span>')}</div>`;
    const box = P.stage.querySelector('.ecs'), KM = P.stage.querySelector('.km'); const set = combo(P); let n = 0, right = 0, st = 0; const hist = []; const T = P.timer(45);
    while (!T.done && n < 16) { n++; P.setRound(`${n} OF 16`); const match = hist.length >= 2 && Math.random() < .35; const s = match ? hist[hist.length - 2] : pick(SH.filter(x => hist.length < 2 || x !== hist[hist.length - 2])); hist.push(s);
      [...box.children].forEach(e => { const x = pxv(e.style.left) - 70; e.style.left = x + 'px'; e.classList.toggle('two', x === 62 - 140 + 70); if (x < -60) e.remove(); });
      const e = document.createElement('div'); e.className = `ecp mat ${s}`; e.style.setProperty('--c', COL[['pink', 'sun', 'mint', 'sky'][SH.indexOf(s)]]); e.style.left = '202px'; box.appendChild(e); e.animate([{ transform: 'translateX(60px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 300 });
      [...box.children].forEach(x => x.classList.remove('two')); const two = box.children[box.children.length - 3]; if (two) two.classList.add('two');
      P.step(match ? 1 : 0); await P.w(rnd(500, 800)); const press = match ? !(n === 9) : (n === 12);
      if (press) { await P.tap(KM); P.press(KM); } P.step(2);
      if (press === match) { right++; st++; set(st); if (press) { P.hit(e, '#FFB3D1', '+15'); P.addScore(15); } else P.addScore(3); P.hint(match ? 'Match' : 'Let it pass', 'good'); } else { st = 0; set(0); P.oops(); P.hint(match ? 'That was a match' : 'Not a match', 'bad'); }
      P.hideFin(); await P.w(450); }
    await fin(P, T);
    return { title: 'Sharp memory', stars: right >= 14 ? 3 : 2, stats: [`${right} of ${n}`, '2-back', '+90 XP'] };
  } });

/* Odd sound out */
def({ sec: 'b7', name: 'Odd sound out', kick: 'FOCUS · 40 SEC', col: '#8B3DFF', glow: '#FF3D8E', bg: 'dots', secs: 40, best: '9 of 10',
  steps: ['Three tones play, one after another', 'Two are the same, one is a little different', 'Tap the odd one'],
  cap: 'Listening focus. Needs sound: here each tone is drawn as a bar whose height is its pitch, which is also the muted fallback. The weakest fit in the catalogue, because many people play with sound off.',
  round: async P => {
    P.stage.innerHTML = `<div class="osw">${[0, 1, 2].map(i => `<div class="osb">${toy('k', COL.violet, `<span>${i + 1}</span>`)}<div class="osbar"><i></i></div></div>`).join('')}</div><span class="simtag" style="top:330px">PROTOTYPE · SOUND SHOWN AS PITCH BARS</span>`;
    const B = [...P.stage.querySelectorAll('.osb')], K = B.map(b => b.querySelector('.k')), bars = B.map(b => b.querySelector('.osbar i')); const set = combo(P); let n = 0, right = 0, st = 0; const T = P.timer(40);
    while (!T.done && n < 10) { n++; P.setRound(`${n} OF 10`); const base = rnd(30, 70), diff = Math.max(6, 22 - n * 1.5), odd = Math.random() * 3 | 0; bars.forEach(b => b.style.height = '0%'); B.forEach(b => b.classList.remove('ok', 'no'));
      P.step(0); P.quiet(1); P.hint('Listen', 'watch'); for (let i = 0; i < 3; i++) { K[i].classList.add('dn'); bars[i].style.height = (i === odd ? base + diff : base) + '%'; await P.w(500); K[i].classList.remove('dn'); await P.w(150); }
      P.quiet(0); P.step(1); P.hint('Which was different?'); await P.w(rnd(400, 800)); const pi = n === 6 ? (odd + 1) % 3 : odd; await P.tap(K[pi]); P.press(K[pi]); P.step(2);
      if (pi === odd) { right++; st++; set(st); B[pi].classList.add('ok'); P.hit(K[pi], '#C9A8FF', '+10'); P.addScore(10 + st); P.hint('Good ear', 'good'); } else { st = 0; set(0); B[pi].classList.add('no'); B[odd].classList.add('ok'); P.oops(); P.hint(`It was number ${odd + 1}`, 'bad'); }
      P.hideFin(); await P.w(700); }
    await fin(P, T);
    return { title: 'Good ear', stars: right >= 9 ? 3 : 2, stats: [`${right} of ${n}`, 'Listening focus', '+70 XP'] };
  } });
