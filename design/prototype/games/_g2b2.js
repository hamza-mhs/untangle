
/* ═════ BATCH 2 ═════ */
const easeIO = p => p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;

/* ── Block fit ── */
const BF_SH = { I2v: [[0, 0], [1, 0]], I3: [[0, 0], [0, 1], [0, 2]], O: [[0, 0], [0, 1], [1, 0], [1, 1]], L: [[0, 0], [1, 0], [1, 1]], I2: [[0, 0], [0, 1]] };
def({ sec: 'b2', name: 'Block fit', kick: 'SPATIAL · 45 SEC', col: '#22A6FF', glow: '#4A5BFF', bg: 'grid', secs: 45, best: '6 lines in a round', pieces: 1,
  steps: ['Pick a block from the tray', 'Drop it where it fits on the board', 'Fill a whole row or column to clear it'],
  cap: 'Blocks are Enamel pieces (Candy gloss below) on a recessed 7×7 board. A block that won\'t fit snaps back. A full line sweeps away with a flash, and two at once is a combo. Capped to short rounds on purpose: block puzzles are the most "one more go" genre there is.',
  round: async P => {
    const N = 7, CS = 30, G = 2, BX = (264 - (N * CS + (N - 1) * G)) / 2, BY = 14, COLS = [COL.sky, COL.pink, COL.sun, COL.mint, COL.violet, COL.orange];
    const pos = (r, c) => [BX + c * (CS + G), BY + r * (CS + G)];
    P.stage.innerHTML = `<div data-m="well" style="display:contents"><div class="bfb mat" style="--c:#0A1530;left:${BX - 6}px;top:${BY - 6}px;width:${N * CS + (N - 1) * G + 12}px;height:${N * CS + (N - 1) * G + 12}px"></div></div><div class="bfc" data-r="piece" data-m="${PM(P)}"></div><div class="bftray"></div>`;
    const box = P.stage.querySelector('.bfc'); const set = combo(P, 'Lines'); let lines = 0, miss = 0;
    const grid = Array.from({ length: N }, () => Array(N).fill(null));
    const cell = (r, c, col) => { const e = document.createElement('div'); e.className = 'bfk mat'; const [x, y] = pos(r, c); e.style.cssText = `left:${x}px;top:${y}px;--c:${col}`; box.appendChild(e); grid[r][c] = e; return e; };
    const clear = () => { box.innerHTML = ''; grid.forEach(r => r.fill(null)); };
    const ROUNDS = [{ fill: (r, c) => r === 6 && !(c >= 2 && c <= 4), noise: 5, ans: ['I3', 6, 2], tray: ['O', 'I3', 'L'] },
      { fill: (r, c) => (r === 5 || r === 6) && c > 1, noise: 4, ans: ['O', 5, 0], tray: ['I2', 'L', 'O'], wrong: ['L', 5, 2] },
      { fill: (r, c) => c === 6 && r !== 1 && r !== 2, noise: 5, ans: ['I2v', 1, 6], tray: ['I3', 'I2v', 'O'] }];
    const T = P.timer(45);
    for (const [ri, R] of ROUNDS.entries()) { if (T.done) break; P.setRound(`BOARD ${ri + 1} OF 3`); clear();
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (R.fill(r, c)) cell(r, c, pick(COLS));
      let k = 0; while (k < R.noise) { const r = Math.random() * 4 | 0, c = Math.random() * 6 | 0; if (!grid[r][c] && !(ri === 1 && r === 2 && c >= 3 && c <= 4)) { cell(r, c, pick(COLS)); k++; } }
      const tray = P.stage.querySelector('.bftray'); tray.innerHTML = '';
      const TP = R.tray.map((sh, i) => { const g = document.createElement('div'); g.className = 'bfp'; g.dataset.sh = sh; const col = COLS[(ri * 3 + i) % COLS.length]; g.dataset.col = col;
        g.innerHTML = BF_SH[sh].map(([dr, dc]) => `<div data-m="${PM(P)}" data-r="piece" style="display:contents"><i class="bfk mat" style="position:absolute;left:${dc * 22}px;top:${dr * 22}px;width:20px;height:20px;--c:${col}"></i></div>`).join('');
        const tx = 24 + i * 82, ty = 290; g.style.left = tx + 'px'; g.style.top = ty + 'px'; g.dataset.x = tx; g.dataset.y = ty; P.stage.appendChild(g); return g; });
      P.step(0); P.hint('Fill a row or column'); await P.w(800);
      const drag = async (sh, r, c) => { const g = TP.find(x => x.dataset.sh === sh); await P.w(rnd(250, 450)); await P.tap(g); const [x1, y1] = pos(r, c), x0 = +g.dataset.x, y0 = +g.dataset.y; P.step(1);
        const [fx, fy] = P.rel(g); g.classList.add('lift'); await P.anim(p => { const k = easeIO(p); g.style.left = (x0 + (x1 - x0) * k) + 'px'; g.style.top = (y0 + (y1 - y0) * k) + 'px'; g.style.transform = `scale(${1 + .4545 * k})`; const [gx, gy] = P.rel(g); P.fin.style.left = gx + 'px'; P.fin.style.top = gy + 'px'; }, 420); return g; };
      if (R.wrong) { const g = await drag(...R.wrong); g.classList.add('bad'); P.oops(); miss++; P.hint("Doesn't fit there", 'bad'); await P.w(450); g.classList.remove('bad', 'lift'); await P.anim(p => { const k = easeIO(p); g.style.left = (+g.style.left.replace('px', '') + (+g.dataset.x - +g.style.left.replace('px', '')) * k) + 'px'; g.style.top = (+g.style.top.replace('px', '') + (+g.dataset.y - +g.style.top.replace('px', '')) * k) + 'px'; g.style.transform = `scale(${1.4545 - .4545 * k})`; }, 300); }
      const [sh, r0, c0] = R.ans; const g = await drag(sh, r0, c0); g.remove(); BF_SH[sh].forEach(([dr, dc]) => { const e = cell(r0 + dr, c0 + dc, g.dataset.col); e.animate([{ transform: 'scale(1.2)' }, { transform: 'none' }], { duration: 200 }); }); P.hideFin();
      await P.w(250); const full = []; for (let r = 0; r < N; r++) if (grid[r].every(Boolean)) full.push(grid[r]); for (let c = 0; c < N; c++) if (grid.every(row => row[c])) full.push(grid.map(row => row[c]));
      P.step(2); full.forEach(line => line.forEach((e, i) => setTimeout(() => { e.classList.add('sweep'); }, i * 35))); lines += full.length; set(lines);
      const pts = full.length * 40 * full.length; const [x, y] = P.rel(full[0][3]); P.ring(x, y, '#fff', 200); P.float(x, y - 20, `+${pts}`); P.addScore(pts); if (full.length > 1) P.toast(`${full.length} lines`, '#8BE0FF'); P.hint(full.length > 1 ? 'Double clear' : 'Line cleared', 'good');
      await P.w(700); full.forEach(line => line.forEach(e => e.remove())); await P.w(500); TP.forEach(t => t.remove()); }
    await fin(P, T);
    return { title: 'Clean board', stars: miss ? 2 : 3, stats: [`${lines} lines`, `${miss} misfit`, '+90 XP'] };
  } });

/* ── Tiny dash ── */
def({ sec: 'b2', name: 'Tiny dash', kick: 'QUICK DECISIONS · 30 SEC', col: '#8B3DFF', glow: '#FF3D8E', bg: 'persp', secs: 30, best: '24 sparks, no bumps', pieces: 1,
  steps: ['Blocks and sparks come down the lanes', 'Tap ◀ or ▶ to switch lanes', 'Dodge the red, grab the sparks'],
  cap: 'A little runner on three recessed lanes, with Toy plastic lane buttons. Red blocks are Enamel (Candy gloss below). It speeds up as you go, and the finish arch arrives at 30 seconds, so a round always ends.',
  round: async P => {
    const LX = [62, 132, 202], RY = 268;
    P.stage.innerHTML = `${LX.map(x => `<div data-m="well" style="display:contents"><div class="tdl mat" style="--c:#160C2C;left:${x - 30}px"></div></div>`).join('')}<div class="tdobj" data-r="piece" data-m="${PM(P)}"></div>
      <div class="tdrun"><i></i></div><div class="tdbtn">${toy('k kl', COL.violet, '<span>◀</span>')}${toy('k kr', COL.violet, '<span>▶</span>')}</div><div class="tdarch"></div>`;
    const ob = P.stage.querySelector('.tdobj'), run = P.stage.querySelector('.tdrun'), KL = P.stage.querySelector('.kl'), KR = P.stage.querySelector('.kr'), arch = P.stage.querySelector('.tdarch');
    const lives = livesUI(P); let lv = 3, lane = 1, sparks = 0, bumps = 0, objs = [], spawnT = 0, busy = false, done = false;
    const setLane = l => { lane = l; run.style.left = LX[l] + 'px'; };
    setLane(1); const T = P.timer(30); P.setRound('DASH');
    const ck = clock(P, el => { if (done) return; const sp = .16 + el / 90000; const dt = 16;
      if (el > spawnT) { spawnT = el + rnd(520, 820) - Math.min(250, el / 120); const l = Math.random() * 3 | 0; const red = Math.random() < .55; const e = document.createElement('div'); e.className = red ? 'tdb mat' : 'tdg'; if (red) e.style.setProperty('--c', '#FF3B3B'); e.style.left = LX[l] + 'px'; ob.appendChild(e); objs.push({ e, l, y: -30, red, hit: false }); }
      objs.forEach(o => { o.y += sp * dt * 1.1; o.e.style.top = o.y + 'px'; if (!o.hit && o.l === lane && Math.abs(o.y - RY) < 22) { o.hit = true; if (o.red) { bumps++; if (lv > 0) { lv--; lives[lv].classList.add('lost'); } run.classList.add('bump'); setTimeout(() => run.classList.remove('bump'), 400); P.oops(); P.hint('Bump', 'bad'); } else { sparks++; P.addScore(10); const [x, y] = P.rel(o.e); P.burst(x, y, '#7CF6FF', 8); P.float(x, y - 16, '+10', '#B6FBFF'); o.e.remove(); } } });
      objs = objs.filter(o => { if (o.y > 420) { o.e.remove(); return false; } return !(o.hit && !o.red); }); });
    try {
      P.step(0); P.hint('Dodge red, grab sparks'); let botMiss = 0;
      while (!T.done && lv > 0) { await P.w(60); if (busy) continue;
        const threat = objs.find(o => o.red && !o.hit && o.l === lane && o.y > RY - 150 && o.y < RY - 20);
        const gem = objs.find(o => !o.red && !o.hit && o.l !== lane && o.y > RY - 170 && o.y < RY - 60 && !objs.some(q => q.red && q.l === o.l && Math.abs(q.y - RY) < 90));
        let to = null; if (threat) { const opts = [lane - 1, lane + 1].filter(l => l >= 0 && l < 3 && !objs.some(q => q.red && !q.hit && q.l === l && q.y > RY - 120 && q.y < RY + 20)); if (opts.length) to = opts[0]; if (T.left() < 18 && botMiss < 1 && Math.random() < .3) { botMiss++; to = null; } }
        else if (gem && Math.abs(gem.l - lane) === 1) to = gem.l;
        if (to !== null) { busy = true; P.step(1); const k = to < lane ? KL : KR; await P.tap(k); P.press(k); setLane(to); P.step(2); busy = false; } }
      P.hideFin(); if (T.done) { done = true; arch.classList.add('on'); P.toast('Finish', '#C9A8FF'); const [x, y] = P.rel(arch); P.burst(x, y, '#C9A8FF', 18); await P.w(1000); }
    } finally { ck.stop(); }
    T.stop(); P.hideFin();
    return { title: lv > 0 ? 'Made the arch' : 'Wiped out', stars: bumps === 0 ? 3 : lv > 0 ? 2 : 1, stats: [`${sparks} sparks`, `${bumps} bump${bumps === 1 ? '' : 's'}`, '+80 XP'] };
  } });

/* ── Flow lines ── */
const FLOWS = [{ A: [[0, 0], [0, 1], [0, 2], [0, 3], [1, 3]], B: [[0, 4], [1, 4], [2, 4], [3, 4], [4, 4], [4, 3]], C: [[1, 2], [1, 1], [1, 0], [2, 0], [3, 0], [4, 0], [4, 1]], D: [[3, 1], [2, 1], [2, 2], [2, 3]], E: [[4, 2], [3, 2], [3, 3]] },
  { A: [[0, 1], [0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [4, 1]], B: [[0, 2], [0, 3], [0, 4], [1, 4], [2, 4], [3, 4]], C: [[2, 1], [1, 1], [1, 2], [1, 3]], D: [[2, 2], [2, 3], [3, 3], [4, 3], [4, 4]], E: [[3, 1], [3, 2], [4, 2]] }];
const FCOL = { A: '#FF3D8E', B: '#22A6FF', C: '#FFC53D', D: '#17D9A3', E: '#8B3DFF' };
def({ sec: 'b2', name: 'Flow lines', kick: 'PLANNING · 60 SEC', col: '#17D9A3', glow: '#22A6FF', bg: 'dots', secs: 60, best: '2 boards, no redraws', pieces: 1,
  steps: ['Each colour has two jewels', 'Draw a tube to join each pair', 'No crossings, and fill every square'],
  cap: 'Jewels are Candy pieces in a recessed 5×5 board (switch to Enamel below). Tubes follow the finger cell by cell. A finished board lights up like a circuit.',
  round: async P => {
    const S = 48, OX = (264 - 5 * S) / 2, OY = 20, ctr = ([r, c]) => [OX + c * S + S / 2, OY + r * S + S / 2]; const set = combo(P, 'Boards'); let boards = 0, redraw = 0;
    const T = P.timer(60);
    for (const [bi, F] of FLOWS.entries()) { if (T.done) break; P.setRound(`BOARD ${bi + 1} OF 2`);
      P.stage.innerHTML = `<div data-m="well" style="display:contents"><div class="flb mat" style="--c:#06141A;left:${OX - 6}px;top:${OY - 6}px">${Array.from({ length: 25 }, (_, i) => `<i style="left:${(i % 5) * S + 6}px;top:${Math.floor(i / 5) * S + 6}px"></i>`).join('')}</div></div>
        <svg class="flsv" width="264" height="300">${Object.keys(F).map(k => `<polyline data-k="${k}" fill="none" stroke="${FCOL[k]}" stroke-width="20" stroke-linecap="round" stroke-linejoin="round" opacity=".92"/><polyline data-h="${k}" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" transform="translate(-3,-4)"/>`).join('')}</svg>
        <div data-r="piece" data-m="${PM(P) === 'enamel' ? 'candy' : 'enamel'}" style="display:contents">${Object.entries(F).map(([k, p]) => [p[0], p[p.length - 1]].map(q => { const [x, y] = ctr(q); return `<div class="fje mat" data-j="${k}" style="--c:${FCOL[k]};left:${x - 15}px;top:${y - 15}px"></div>`; }).join('')).join('')}</div>`;
      const pl = k => P.stage.querySelector(`polyline[data-k="${k}"]`), hl = k => P.stage.querySelector(`polyline[data-h="${k}"]`);
      P.step(0); P.hint('Join each pair'); await P.w(800);
      for (const k of Object.keys(F)) { if (T.done) break; const path = F[k]; P.step(1); await P.w(rnd(200, 400));
        const draw = async (pts, keep) => { const st = P.stage.querySelector(`.fje[data-j="${k}"]`); await P.tap(st); const D = []; for (const q of pts) { D.push(ctr(q)); const s = D.map(p => p.join(',')).join(' '); pl(k).setAttribute('points', s); hl(k).setAttribute('points', s); const [x, y] = ctr(q); const r = P.stage.getBoundingClientRect(), b = P.el.getBoundingClientRect(), sc = P.scale || 1; P.fin.style.left = (r.left - b.left + x * sc) + 'px'; P.fin.style.top = (r.top - b.top + y * sc) + 'px'; await P.w(115); } };
        if (bi === 0 && k === 'C') { await draw([[1, 2], [2, 2], [2, 1]]); redraw++; P.oops(); P.hint('That blocks green. Redraw', 'bad'); await P.w(500); pl(k).setAttribute('points', ''); hl(k).setAttribute('points', ''); await P.w(250); }
        await draw(path); P.step(2); const [x, y] = ctr(path[path.length - 1]); const r = P.stage.getBoundingClientRect(), b = P.el.getBoundingClientRect(), sc = P.scale || 1; P.ring(r.left - b.left + x * sc, r.top - b.top + y * sc, FCOL[k], 40); P.addScore(15); P.hint('Connected', 'good'); }
      P.hideFin(); if (T.done) break; boards++; set(boards); const svg = P.stage.querySelector('.flsv'); svg.classList.add('lit'); P.toast('Board lit', '#8BFAD8'); P.addScore(50); await P.w(1400); }
    await fin(P, T);
    return { title: 'All connected', stars: redraw ? 2 : 3, stats: [`${boards} of 2 boards`, `${redraw} redraw`, '+90 XP'] };
  } });

/* ── Word trails ── */
def({ sec: 'b2', name: 'Word trails', kick: 'WORDS · 60 SEC', col: '#8B3DFF', glow: '#FF3D8E', bg: 'dots', secs: 60, best: '5 of 5 words',
  steps: ['Slide through the letter beads', 'Let go to try the word', 'Find every word in the tray'],
  cap: 'Six glass beads in a ring. A glowing trail follows the finger, the word builds above, and right answers fly into the tray. Words that aren\'t in the tray shake off.',
  round: async P => {
    const L = ['C', 'A', 'L', 'M', 'E', 'D'], WORDS = ['CALM', 'MEAL', 'CAME', 'MEDAL', 'CAMEL'], CX = 132, CY = 268, RR = 72;
    const bp = i => { const a = -Math.PI / 2 + i * Math.PI * 2 / 6; return [CX + RR * Math.cos(a), CY + RR * Math.sin(a)]; };
    P.stage.innerHTML = `<div class="wtt">${WORDS.map(w => `<div class="wtw" data-w="${w}">${[...w].map(() => '<i></i>').join('')}</div>`).join('')}</div><div class="wtcur"></div>
      <div data-m="well" style="display:contents"><div class="wtring mat" style="--c:#160C2C"></div></div><svg class="wtsv" width="264" height="396"><polyline fill="none" stroke="#C9A8FF" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/></svg>
      <div data-m="candy" style="display:contents">${L.map((l, i) => { const [x, y] = bp(i); return `<div class="wtb mat" style="--c:#8B3DFF;left:${x - 24}px;top:${y - 24}px"><span>${l}</span></div>`; }).join('')}</div>`;
    const B = [...P.stage.querySelectorAll('.wtb')], pl = P.stage.querySelector('.wtsv polyline'), cur = P.stage.querySelector('.wtcur'); const set = combo(P, 'Words'); let found = 0, tries = 0;
    const T = P.timer(60); P.setRound('5 WORDS');
    const plan = ['CALM', 'MEAL', 'CLAD', 'CAME', 'MEDAL', 'CAMEL'];
    for (const w of plan) { if (T.done) break; P.step(0); P.hint('Slide through the letters'); await P.w(rnd(400, 700)); tries++;
      const idx = [...w].map(ch => L.indexOf(ch)); const pts = []; cur.textContent = '';
      await P.tap(B[idx[0]]);
      for (const [n, i] of idx.entries()) { const [x, y] = bp(i); if (n) { const [px, py] = bp(idx[n - 1]); await P.anim(p => { const s = pts.concat([[px + (x - px) * p, py + (y - py) * p]]); pl.setAttribute('points', s.map(q => q.join(',')).join(' ')); const [fx, fy] = P.rel(B[idx[n - 1]]), [tx, ty] = P.rel(B[i]); P.fin.style.left = (fx + (tx - fx) * p) + 'px'; P.fin.style.top = (fy + (ty - fy) * p) + 'px'; }, 170); }
        pts.push([x, y]); pl.setAttribute('points', pts.map(q => q.join(',')).join(' ')); B[i].classList.add('on'); cur.textContent += L[i]; cur.animate([{ transform: 'scale(1.1)' }, { transform: 'none' }], { duration: 150 }); }
      P.step(1); await P.w(200); P.hideFin();
      const row = P.stage.querySelector(`.wtw[data-w="${w}"]`);
      if (row && !row.classList.contains('ok')) { row.classList.add('ok'); [...row.children].forEach((s, k) => setTimeout(() => { s.textContent = w[k]; s.classList.add('in'); }, k * 60)); found++; set(found); P.step(2); const [x, y] = P.rel(row); P.ring(x, y, '#C9A8FF', 80); P.addScore(w.length * 10); P.float(x, y, `+${w.length * 10}`); P.hint(w.length >= 5 ? 'Long one' : 'Found', 'good'); }
      else { cur.classList.add('bad'); P.oops(); P.hint(`${w} isn't in this one`, 'bad'); await P.w(400); cur.classList.remove('bad'); }
      await P.w(450); B.forEach(b => b.classList.remove('on')); pl.setAttribute('points', ''); cur.textContent = ''; }
    await fin(P, T);
    return { title: 'Word finder', stars: found === 5 ? 3 : 2, stats: [`${found} of 5 words`, `${tries - found} miss`, '+90 XP'] };
  } });

/* ── Mini nonogram ── */
const NONO = [[0, 1, 0, 1, 0], [1, 1, 1, 1, 1], [1, 1, 1, 1, 1], [0, 1, 1, 1, 0], [0, 0, 1, 0, 0]];
const clue = a => { const o = []; let n = 0; a.forEach(v => { if (v) n++; else if (n) { o.push(n); n = 0; } }); if (n) o.push(n); return o.length ? o : [0]; };
def({ sec: 'b2', name: 'Mini nonogram', kick: 'LOGIC · 90 SEC', col: '#FF3D8E', glow: '#8B3DFF', bg: 'grid', secs: 90, best: 'Solved, no mistakes',
  steps: ['Numbers say how many squares in a row are filled', 'Tap squares to fill them, start with the sure ones', 'Solve it and the picture appears'],
  cap: 'Paint-by-number logic on a recessed 5×5 board. Clues turn green when their line is done. A wrong square shows a red ✕ and costs a life. The solved picture lifts off the board.',
  round: async P => {
    const S = 36, OX = 66, OY = 76, rows = NONO.map(clue), cols = [0, 1, 2, 3, 4].map(c => clue(NONO.map(r => r[c])));
    P.stage.innerHTML = `${cols.map((c, i) => `<div class="nnc" style="left:${OX + i * S}px">${c.join('<br>')}</div>`).join('')}${rows.map((r, i) => `<div class="nnr" style="top:${OY + i * S}px">${r.join('&nbsp;&nbsp;')}</div>`).join('')}
      <div data-m="well" style="display:contents"><div class="nnb mat" style="--c:#14081A;left:${OX - 5}px;top:${OY - 5}px">${Array.from({ length: 25 }, (_, i) => `<i class="nnk" data-i="${i}" style="left:${(i % 5) * S + 5}px;top:${Math.floor(i / 5) * S + 5}px"></i>`).join('')}</div></div><div class="nnpic"></div>`;
    const K = [...P.stage.querySelectorAll('.nnk')], RC = [...P.stage.querySelectorAll('.nnr')], CC = [...P.stage.querySelectorAll('.nnc')]; const lives = livesUI(P); let lv = 3, mist = 0;
    const st = Array(25).fill(0); const chk = () => { RC.forEach((e, r) => e.classList.toggle('ok', NONO[r].every((v, c) => !v || st[r * 5 + c]))); CC.forEach((e, c) => e.classList.toggle('ok', NONO.every((row, r) => !row[c] || st[r * 5 + c]))); };
    const T = P.timer(90); P.setRound('HEART'); P.step(0); P.hint('Start with the full rows', 'watch'); await P.w(1200);
    const order = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 0, 16, 17, 18, 22, 1, 3];
    for (const i of order) { if (T.done) break; P.step(1); P.hint(i < 15 ? 'Rows 2 and 3 are full' : 'Now the edges'); await P.w(rnd(150, 300)); await P.tap(K[i]);
      if (NONO[Math.floor(i / 5)][i % 5]) { st[i] = 1; K[i].classList.add('f'); K[i].animate([{ transform: 'scale(.6)' }, { transform: 'none' }], { duration: 200, easing: 'cubic-bezier(.3,1.6,.5,1)' }); P.addScore(5); chk(); }
      else { K[i].classList.add('x'); mist++; if (lv) { lv--; lives[lv].classList.add('lost'); } P.oops(); P.hint('Not part of it. Check the column', 'bad'); await P.w(600); } }
    P.hideFin(); if (st.filter(Boolean).length === 16) { P.step(2); K.forEach((k, i) => { if (k.classList.contains('x')) k.classList.remove('x'); if (st[i]) setTimeout(() => k.classList.add('pic'), i * 25); }); await P.w(700); const b = P.stage.querySelector('.nnb'); b.classList.add('lift'); const [x, y] = P.rel(b); P.ring(x, y, '#FF6FA8', 200); P.burst(x, y, '#FF6FA8', 18); P.toast('A heart', '#FFB3D1'); P.addScore(80); await P.w(1400); }
    await fin(P, T);
    return { title: 'Picture solved', stars: mist ? 2 : 3, stats: ['1 picture', `${mist} mistake`, '+100 XP'] };
  } });
