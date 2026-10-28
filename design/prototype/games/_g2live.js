
/* ═════ the 7 games ported from Live games ═════ */
def({ sec: 'mem', name: 'Pattern recall', kick: 'MEMORY · 32 SEC', col: '#8B3DFF', bg: 'grid', secs: 32, best: '5 rounds',
  steps: ['Watch the pads light up', 'Wait for your turn', 'Tap them in the same order'],
  cap: 'Toy plastic pads, since they are buttons you press. The background goes quiet while the pattern plays. Lives instead of combo, since one wrong pad ends the round.',
  round: async P => {
    const cols = ['pink', 'mint', 'sun', 'sky', 'violet', 'orange', 'cobalt', 'coral', 'mint'];
    P.stage.innerHTML = `<div class="pads" data-m="toy">${cols.map(c => `<div class="pad mat" style="--c:${COL[c]}"></div>`).join('')}</div>`;
    const pads = [...P.stage.querySelectorAll('.pad')]; const lives = livesUI(P); let lv = 3, round = 1, mistakeDone = false;
    const T = P.timer(32);
    while (!T.done && round <= 5 && lv > 0) {
      P.setRound(`ROUND ${round} OF 5`); P.toast(`Round ${round}`); await P.w(1000);
      const seq = Array.from({ length: round + 2 }, () => Math.random() * 9 | 0);
      P.step(0); P.hint('Watch the pattern', 'watch'); P.quiet(1); await P.w(400);
      for (const i of seq) { if (T.done) break; pads[i].classList.add('on'); await P.w(420); pads[i].classList.remove('on'); await P.w(170); }
      P.quiet(0); P.step(1); P.hint('Your turn'); await P.w(250); let ok = true; P.step(2);
      for (let k = 0; k < seq.length && !T.done; k++) {
        let idx = seq[k]; if (round === 3 && k === 2 && !mistakeDone) { idx = (idx + 4) % 9; mistakeDone = true; }
        await P.w(rnd(180, 380)); await P.tap(pads[idx]); pads[idx].classList.add('on', 'dn'); setTimeout(() => pads[idx].classList.remove('dn'), 120); setTimeout(() => pads[idx].classList.remove('on'), 260);
        if (idx === seq[k]) { P.hit(pads[idx], getComputedStyle(pads[idx]).getPropertyValue('--c'), '+10'); P.addScore(10); }
        else { pads[idx].classList.add('bad'); setTimeout(() => pads[idx].classList.remove('bad'), 400); P.oops(); lv--; lives[lv].classList.add('lost'); P.hint('Not that one. Watch again', 'bad'); ok = false; await P.w(900); break; }
      }
      P.hideFin();
      if (ok && !T.done) { P.addScore(30); P.hint('Perfect round · +30', 'good'); pads.forEach((p, i) => setTimeout(() => { p.classList.add('on'); setTimeout(() => p.classList.remove('on'), 160); }, i * 40)); round++; await P.w(700); }
    }
    await fin(P, T);
    return { title: round > 5 ? 'Level complete' : 'Nice run', stars: round > 5 ? 3 : 2, stats: [`${Math.min(5, round - (round > 5 ? 1 : 0))} rounds`, `${lv} of 3 lives`, '+120 XP'] };
  } });

def({ sec: 'mem', name: 'Card pairs', kick: 'MEMORY · 40 SEC', col: '#FF3D8E', glow: '#17D9A3', bg: 'dots', secs: 40, best: '7 moves', pieces: 1,
  steps: ['Memorise the cards', 'They flip face down', 'Find the pairs'],
  cap: 'Cards are pieces you pick, so Enamel faces (switch to Candy gloss below). Cards flip in 3D, matches pop and glow, back-to-back pairs multiply the points.',
  round: async P => {
    const kinds = [['pink', 'polygon(50% 0,100% 50%,50% 100%,0 50%)'], ['mint', 'circle(50%)'], ['sun', 'polygon(50% 2%,62% 36%,98% 37%,69% 58%,80% 93%,50% 72%,20% 93%,31% 58%,2% 37%,38% 36%)'], ['sky', 'polygon(50% 0,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%)'], ['violet', 'inset(8% round 22%)'], ['orange', 'polygon(50% 4%,96% 92%,4% 92%)']];
    P.rt.innerHTML = `<div class="combo">Moves <b class="mv">0</b></div>`; let moves = 0;
    const deck = shuffle([...kinds.keys(), ...kinds.keys()]);
    P.stage.innerHTML = `<div class="cards">${deck.map(k => `<div class="card" data-r="piece" data-m="${PM(P)}" data-k="${k}"><div class="bk"></div><div class="fc mat" style="--c:${COL[kinds[k][0]]}"><span class="gl" style="clip-path:${kinds[k][1]}"></span></div></div>`).join('')}</div>`;
    const cards = [...P.stage.querySelectorAll('.card')]; P.setRound('6 PAIRS');
    P.step(0); P.hint('Memorise', 'watch'); P.quiet(1); cards.forEach((c, i) => setTimeout(() => c.classList.add('up'), i * 45)); await P.w(2000);
    P.step(1); cards.forEach((c, i) => setTimeout(() => c.classList.remove('up'), i * 30)); await P.w(500); P.quiet(0);
    P.step(2); P.hint('Find the pairs'); const T = P.timer(40); let found = 0, cmb = 0;
    for (const k of shuffle(kinds.map((_, k) => k))) {
      if (T.done) break;
      const [a, b] = cards.filter(c => +c.dataset.k === k && !c.classList.contains('done'));
      if (Math.random() < .4 && found < 5) { const o = pick(cards.filter(c => +c.dataset.k !== k && !c.classList.contains('done')));
        await P.tap(a); a.classList.add('up'); await P.w(rnd(350, 550)); await P.tap(o); o.classList.add('up'); moves++; P.rt.querySelector('.mv').textContent = moves; await P.w(600);
        a.classList.add('miss'); o.classList.add('miss'); P.oops(); cmb = 0; P.hint('Not a pair', 'bad'); await P.w(420); a.classList.remove('up', 'miss'); o.classList.remove('up', 'miss'); await P.w(350); P.hint('Find the pairs'); }
      if (T.done) break;
      await P.tap(a); a.classList.add('up'); await P.w(rnd(300, 500)); await P.tap(b); b.classList.add('up'); moves++; P.rt.querySelector('.mv').textContent = moves; await P.w(380);
      cmb++; a.classList.add('done'); b.classList.add('done'); const col = COL[kinds[k][0]]; P.hit(a, col); P.hit(b, col, cmb > 1 ? `+${20 * cmb} · ×${cmb}` : '+20'); P.addScore(20 * cmb); found++;
      P.hint(cmb > 1 ? `Pair! ${cmb} in a row` : 'Pair!', 'good'); await P.w(450);
    }
    P.hideFin(); T.stop(); if (found === 6) { P.toast('All pairs!', '#8BFAD8'); cards.forEach((c, i) => setTimeout(() => P.hit(c, '#8BFAD8'), i * 50)); await P.w(1000); } else { P.toast('Time!', '#FF8A8A'); await P.w(900); }
    return { title: found === 6 ? 'All pairs found' : 'Good memory', stars: found === 6 ? (moves <= 8 ? 3 : 2) : 1, stats: [`${moves} moves`, `${Math.round(40 - T.left())} s`, '+90 XP'] };
  } });

def({ sec: 'mem', name: 'Number span', kick: 'WORKING MEMORY · 45 SEC', col: '#4A5BFF', bg: 'grid', secs: 45, best: '6 digits',
  steps: ['Digits flash one at a time', 'Hold them in your head', 'Type them back in order'],
  cap: 'Toy plastic keypad, since keys are buttons. Digits drop into recessed wells, which turn mint or red as you type.',
  round: async P => {
    const lives = livesUI(P); let lv = 3, len = 4, mistakeDone = false;
    P.stage.innerHTML = `<div class="disp"><small>Get ready</small></div><div class="slots"></div><div class="keys" data-m="toy">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '⌫', 0, '✓'].map(k => `<div class="k mat" data-k="${k}" style="--c:${k === '✓' ? COL.mint : k === '⌫' ? COL.coral : COL.cobalt}">${k}</div>`).join('')}</div>`;
    const disp = P.stage.querySelector('.disp'), slots = P.stage.querySelector('.slots'), keys = [...P.stage.querySelectorAll('.k')]; const key = d => keys.find(k => k.dataset.k == d);
    const T = P.timer(45);
    while (!T.done && len <= 6 && lv > 0) {
      P.setRound(`${len} DIGITS`); const seq = Array.from({ length: len }, () => Math.random() * 10 | 0);
      slots.innerHTML = '<div></div>'.repeat(len); const S = [...slots.children];
      P.step(0); P.hint('Remember the digits', 'watch'); P.quiet(1); disp.innerHTML = `<small>Watch</small>`; await P.w(500);
      for (const d of seq) { if (T.done) break; disp.innerHTML = `<span>${d}</span>`; await P.w(620); disp.innerHTML = ''; await P.w(140); }
      P.step(1); P.quiet(0); disp.innerHTML = `<small>Your turn</small>`; P.hint('Type them in order'); await P.w(300); let ok = true; P.step(2);
      for (let i = 0; i < len && !T.done; i++) {
        S.forEach(x => x.classList.remove('cur')); S[i].classList.add('cur');
        let d = seq[i]; if (len === 5 && i === 3 && !mistakeDone) { d = (d + 3) % 10; mistakeDone = true; }
        await P.w(rnd(220, 420)); const k = key(d); await P.tap(k); k.classList.add('dn'); setTimeout(() => k.classList.remove('dn'), 110);
        S[i].innerHTML = `<span>${d}</span>`;
        if (d === seq[i]) { S[i].classList.add('ok'); P.hit(S[i], COL.mint); P.addScore(10); }
        else { S[i].classList.add('no'); P.oops(); lv--; lives[lv].classList.add('lost'); P.hint(`It was ${seq[i]}`, 'bad'); ok = false; await P.w(1100); break; }
      }
      S.forEach(x => x.classList.remove('cur')); P.hideFin();
      if (ok && !T.done) { await P.tap(key('✓')); P.hit(key('✓'), COL.mint, '+30'); P.addScore(30); P.toast(`${len} digits!`, '#8BFAD8'); len++; P.hint('Perfect', 'good'); await P.w(900); }
    }
    await fin(P, T);
    return { title: 'Great span', stars: len > 6 ? 3 : 2, stats: [`Longest ${Math.min(6, len - 1)} digits`, `${lv} of 3 lives`, '+90 XP'] };
  } });

def({ sec: 'att', name: 'Spot the odd one', kick: 'ATTENTION · 30 SEC', col: '#FFC53D', bg: 'dots', secs: 30, best: '8 found', pieces: 1,
  steps: ['Sixteen tiles appear', 'One is a shade off or flipped', 'Tap the odd one out'],
  cap: 'Tiles are pieces you tap, so Enamel (switch to Candy gloss below). It gets subtler each round. Everything else dims when you find it.',
  round: async P => {
    P.rt.innerHTML = `<div class="combo">Found <b class="fd">0</b></div>`; const fd = P.rt.querySelector('.fd'), cb = P.rt.querySelector('.combo');
    P.stage.innerHTML = `<div class="odd" data-r="piece" data-m="${PM(P)}"></div>`; const G = P.stage.querySelector('.odd'); let r = 0, found = 0;
    const T = P.timer(30);
    while (!T.done && r < 8) {
      r++; P.setRound(`ROUND ${r}`); const base = pick([COL.pink, COL.sky, COL.mint, COL.violet, COL.orange, COL.sun]);
      const diff = Math.max(8, 30 - r * 3); const oi = Math.random() * 16 | 0; const kind = r % 3 === 0 ? 'rot' : 'col';
      G.innerHTML = Array.from({ length: 16 }, (_, i) => `<div class="o mat" style="--c:${i === oi && kind === 'col' ? `color-mix(in srgb,${base} ${100 - diff}%,#fff)` : base}"><i style="${i === oi && kind === 'rot' ? 'transform:rotate(180deg)' : ''}"></i></div>`).join('');
      const tiles = [...G.children]; tiles.forEach((t, i) => setTimeout(() => t.classList.add('in'), i * 18)); P.step(0); P.hint('Tap the odd one out');
      await P.w(rnd(800, 1500)); if (T.done) break; P.step(1);
      if (r === 4) { const w = tiles[(oi + 5) % 16]; await P.tap(w); w.classList.add('bad'); P.oops(); P.hint('Not that one', 'bad'); await P.w(600); P.hint('Tap the odd one out'); }
      P.step(2); await P.tap(tiles[oi]); found++; fd.textContent = found; cb.classList.remove('pop'); void cb.offsetWidth; cb.classList.add('pop'); cb.classList.toggle('hot', found >= 4);
      tiles.forEach((t, i) => i !== oi && t.classList.add('dim')); tiles[oi].classList.add('win'); const pts = 10 + r * 5; P.hit(tiles[oi], base, `+${pts}`); P.addScore(pts);
      P.hint(kind === 'rot' ? 'Flipped one. Good eye' : diff < 16 ? 'Sharp eyes' : 'Found it', 'good'); P.hideFin(); await P.w(700);
      tiles.forEach(t => t.classList.remove('in')); await P.w(260);
    }
    await fin(P, T);
    return { title: 'Good eye', stars: found >= 7 ? 3 : 2, stats: [`${found} found`, '1 miss', '+80 XP'] };
  } });

def({ sec: 'att', name: 'Rule flip', kick: 'FLEXIBILITY · 40 SEC', col: '#FF3D8E', bg: 'dots', secs: 40, best: '15 of 16', pieces: 1,
  steps: ['Read the rule at the top', 'Send each piece to its side', 'When the rule flips, follow the new one'],
  cap: 'The piece is Enamel (Candy gloss below), the bins are recessed wells. When the rule flips, the badge turns white and flips over.',
  round: async P => {
    const C = { pink: COL.pink, blue: COL.sky };
    const icon = t => t === 'pink' ? `<i style="border-radius:50%;background:${COL.pink}"></i>` : t === 'blue' ? `<i style="border-radius:50%;background:${COL.sky}"></i>` : t === 'circle' ? `<i style="border-radius:50%;background:#fff"></i>` : `<i style="border-radius:7px;background:#fff"></i>`;
    const set = combo(P);
    P.stage.innerHTML = `<div class="rule"><span class="rl">Sort by colour</span></div><div class="bin l"></div><div class="bin r"></div><div class="rfp" data-r="piece" data-m="${PM(P)}" style="position:absolute;inset:0;pointer-events:none"></div>`;
    const rl = P.stage.querySelector('.rule'), bins = [...P.stage.querySelectorAll('.bin')], box = P.stage.querySelector('.rfp');
    let rule = 'colour'; const setBins = () => { const L = rule === 'colour' ? ['pink', 'blue'] : ['circle', 'square']; bins.forEach((b, i) => b.innerHTML = `${icon(L[i])}<span>${L[i][0].toUpperCase() + L[i].slice(1)}</span>`); rl.querySelector('.rl').textContent = rule === 'colour' ? 'Sort by colour' : 'Sort by shape'; };
    setBins(); P.setRound('RULE: COLOUR'); P.step(0); await P.w(600);
    const T = P.timer(40); P.hint('Send it to the right side'); let streak = 0, n = 0, right = 0, mistakeDone = false;
    while (!T.done && n < 16) {
      n++;
      if (n === 7 || n === 13) { rule = rule === 'colour' ? 'shape' : 'colour'; P.step(2); P.quiet(1); P.toast('Rule flip!', '#fff'); rl.classList.remove('flip'); void rl.offsetWidth; rl.classList.add('flip'); setBins(); P.setRound('RULE: ' + rule.toUpperCase()); await P.w(1100); P.quiet(0); }
      let col = pick(['pink', 'blue']), shp = pick(['c', 's']);
      const afterFlip = n === 7 && !mistakeDone; if (afterFlip) { col = 'pink'; shp = 's'; }
      const c = document.createElement('div'); c.className = `rcard mat ${shp}`; c.style.setProperty('--c', C[col]); box.appendChild(c); requestAnimationFrame(() => c.classList.add('in'));
      const ok = rule === 'colour' ? (col === 'pink' ? 0 : 1) : (shp === 'c' ? 0 : 1);
      let side = ok; if (afterFlip) { side = 0; mistakeDone = true; }
      await P.w(rnd(450, 800)); if (T.done) { c.remove(); break; } if (n !== 7 && n !== 13) P.step(1);
      await P.tap(c); const b = bins[side]; const [bx, by] = P.rel(b), [cx, cy] = P.rel(c); const sc = P.scale || 1;
      P.fin.style.left = bx + 'px'; P.fin.style.top = by + 'px'; c.style.transform = `translate(${(bx - cx) / sc}px,${(by - cy) / sc}px) scale(.45)`; await P.w(380);
      if (side === ok) { streak++; right++; const pts = 10 + Math.max(0, streak - 1) * 2; b.classList.add('glow'); P.hit(b, C[col], `+${pts}`); P.addScore(pts); P.hint(streak >= 4 ? `${streak} in a row` : 'Right side', 'good'); }
      else { streak = 0; b.classList.add('badb'); P.oops(); P.hint('New rule: shape!', 'bad'); }
      set(streak); c.style.opacity = 0; setTimeout(() => c.remove(), 300); await P.w(260); bins.forEach(x => x.classList.remove('glow', 'badb')); P.hideFin();
    }
    await fin(P, T);
    return { title: 'Flexible thinking', stars: right >= 14 ? 3 : 2, stats: [`${right} of ${n} sorted`, '2 rule flips', '+100 XP'] };
  } });

def({ sec: 'tim', name: "Don't tap red", kick: 'SELF-CONTROL · 30 SEC', col: '#22A6FF', bg: 'persp', secs: 30, best: '×4 combo', pieces: 1,
  steps: ['Shapes pop up all over', 'Tap every one that isn\'t red', 'Let the red ones pass'],
  cap: 'Shapes are pieces you tap, so Enamel (Candy gloss below). Combo climbs ×2 to ×4 and turns orange. Letting a red one pass earns a small "+2", so restraint is rewarded too.',
  round: async P => {
    P.rt.innerHTML = `<div class="combo"><span class="cx">×1</span></div>`; const cb = P.rt.querySelector('.combo'), cx = P.rt.querySelector('.cx');
    const setC = n => { const m = Math.min(4, 1 + Math.floor(n / 4)); cx.textContent = (m >= 3 ? '🔥 ' : '') + '×' + m; cb.classList.toggle('hot', m >= 3); cb.classList.remove('pop'); void cb.offsetWidth; cb.classList.add('pop'); return m; };
    P.stage.innerHTML = `<div class="nrb" data-r="piece" data-m="${PM(P)}" style="position:absolute;inset:0"></div>`; const box = P.stage.querySelector('.nrb');
    let streak = 0, mult = setC(0), hits = 0, slips = 0, wrongDone = false;
    P.setRound('30 SECONDS'); const T = P.timer(30); P.step(0); P.hint('Tap everything except red');
    const W = P.stage.clientWidth, H = P.stage.clientHeight; const cells = []; for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) cells.push([(c + .5) * W / 3, (r + .5) * H / 4]);
    const busy = new Set(); const queue = []; let alive = true;
    const spawn = (async () => { while (!T.done && alive) {
      const free = cells.map((_, i) => i).filter(i => !busy.has(i)); if (free.length) { const ci = pick(free); busy.add(ci); const red = Math.random() < .3; const kind = pick(['c', 's', 'p']); const col = red ? '#FF3B3B' : COL[pick(['mint', 'sky', 'sun', 'violet', 'pink'])];
        const e = document.createElement('div'); e.className = `shp mat ${kind} ${red ? 'red' : ''}`; e.style.cssText = `left:${cells[ci][0]}px;top:${cells[ci][1]}px;--c:${col}`; box.appendChild(e); requestAnimationFrame(() => e.classList.add('in'));
        const item = { e, red, col, ci, alive: true }; queue.push(item);
        P.w(rnd(1300, 1700)).then(() => { if (!item.alive) return; item.alive = false; e.classList.add('gone'); busy.delete(ci); if (red) { P.step(2); const [x, y] = P.rel(e); P.float(x, y, '✓ +2', '#8BFAD8'); P.addScore(2); } setTimeout(() => e.remove(), 320); }).catch(() => {}); }
      await P.w(rnd(420, 620)); } })().catch(() => {});
    try {
      while (!T.done) {
        const target = queue.find(it => it.alive && (!it.red || (!wrongDone && T.left() < 14 && Math.random() < .5)));
        if (!target) { await P.w(60); continue; }
        await P.w(rnd(140, 320)); if (!target.alive || T.done) continue;
        await P.tap(target.e); if (!target.alive) continue; target.alive = false; busy.delete(target.ci); P.step(1);
        if (target.red) { wrongDone = true; slips++; target.e.classList.add('bad'); P.oops(); streak = 0; mult = setC(0); P.hint('That was red. Combo lost', 'bad'); setTimeout(() => { target.e.classList.add('gone'); setTimeout(() => target.e.remove(), 300); P.hint('Tap everything except red'); }, 450); }
        else { hits++; streak++; const m = setC(streak); if (m !== mult && m > 1) P.toast(`Combo ×${m}`, '#FFB01F'); mult = m; P.hit(target.e, target.col, `+${10 * mult}`); P.addScore(10 * mult); target.e.classList.add('out'); setTimeout(() => target.e.remove(), 260); }
      }
    } finally { alive = false; }
    await spawn; P.hideFin(); T.stop(); queue.forEach(it => { if (it.alive) { it.alive = false; it.e.classList.add('gone'); } }); P.toast('Time!', '#FF8A8A'); await P.w(1000);
    return { title: 'Sharp hands', stars: slips ? 2 : 3, stats: [`${hits} hits`, `${slips} slip${slips === 1 ? '' : 's'}`, '+110 XP'] };
  } });

def({ sec: 'tim', name: 'Quick maths', kick: 'QUICK DECISIONS · 30 SEC', col: '#FF7A1F', bg: 'grid', secs: 30, best: '10 of 10',
  steps: ['A sum appears', 'Work it out before the ring closes', 'Tap the right answer'],
  cap: 'Answers are Toy plastic buttons. Two timers: the game timer at the top and a small ring per question, so quick calls feel quick.',
  round: async P => {
    const set = combo(P); let streak = 0, right = 0, n = 0;
    P.stage.innerHTML = `<div class="qcard"><b>0</b><div class="qring"><svg width="30" height="30"><circle cx="15" cy="15" r="12" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="3"/><circle class="qp" cx="15" cy="15" r="12" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-dasharray="75.4"/></svg></div></div><div class="ans" data-m="toy">${[0, 1, 2, 3].map(() => `<div class="a mat" style="--c:${COL.orange}">0</div>`).join('')}</div>`;
    const qc = P.stage.querySelector('.qcard'), qb = qc.querySelector('b'), qp = qc.querySelector('.qp'), As = [...P.stage.querySelectorAll('.a')];
    const T = P.timer(30); P.hint('Pick the answer');
    while (!T.done && n < 10) {
      n++; P.setRound(`${n} OF 10`);
      const op = pick(['+', '−', '×']); let a, b, r; if (op === '×') { a = 3 + (Math.random() * 10 | 0); b = 2 + (Math.random() * 8 | 0); r = a * b; } else if (op === '+') { a = 12 + (Math.random() * 60 | 0); b = 5 + (Math.random() * 30 | 0); r = a + b; } else { a = 30 + (Math.random() * 60 | 0); b = 5 + (Math.random() * 25 | 0); r = a - b; }
      const opts = shuffle([r, r + pick([1, 2, 10]), r - pick([1, 3, 10]), r + pick([4, 11, 12])].filter((v, i, s) => s.indexOf(v) === i)).slice(0, 4); while (opts.length < 4) opts.push(r + opts.length * 7);
      qc.classList.add('pre'); qb.textContent = `${a} ${op} ${b}`; As.forEach((el, i) => { el.textContent = opts[i]; el.className = 'a mat'; el.style.setProperty('--c', COL.orange); }); void qc.offsetWidth; qc.classList.remove('pre'); P.step(0);
      const qT = 4.5; let qdone = false; P.anim(p => { if (qdone) return; const f = 1 - p; qp.style.strokeDashoffset = 75.4 * (1 - f); qp.style.stroke = f < .35 ? '#FF4848' : f < .6 ? '#FFC53D' : '#fff'; }, qT * 1000).catch(() => {});
      await P.w(400); P.step(1); await P.w(rnd(500, 1500)); if (T.done) { qdone = true; break; }
      const wrong = n === 4 || (n > 6 && Math.random() < .15); const ci = opts.indexOf(r); const pi = wrong ? (ci + 1 + (Math.random() * 3 | 0)) % 4 : ci;
      P.step(2); await P.tap(As[pi]); As[pi].classList.add('dn'); setTimeout(() => As[pi].classList.remove('dn'), 120); qdone = true;
      if (!wrong) { As[pi].style.setProperty('--c', COL.mint); As[pi].classList.add('ok'); As.forEach((e, i) => i !== pi && e.classList.add('dim')); streak++; right++; const pts = 10 + Math.max(0, streak - 1) * 5; P.hit(As[pi], COL.mint, `+${pts}`); P.addScore(pts); set(streak); P.hint(streak >= 3 ? `${streak} in a row` : 'Right', 'good'); }
      else { As[pi].classList.add('no'); As[ci].classList.add('show'); P.oops(); streak = 0; set(0); P.hint(`It was ${r}`, 'bad'); }
      await P.w(650); P.hideFin(); qc.classList.add('out'); await P.w(260); qc.classList.remove('out'); P.hint('Pick the answer');
    }
    await fin(P, T);
    return { title: right >= 8 ? 'Quick thinking' : 'Nice run', stars: right >= 9 ? 3 : right >= 6 ? 2 : 1, stats: [`${right} of ${n} right`, 'Best streak', '+100 XP'] };
  } });
