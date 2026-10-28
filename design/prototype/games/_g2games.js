
/* ═════════ GAMES ═════════ */
const GAMES = [];
const def = g => GAMES.push(g);
const fin = async (P, T, ms = 900) => { T.stop(); P.hideFin(); if (T.done) { P.toast('Time!', '#FF8A8A'); await P.w(ms); } };

/* ── Colour word ── */
def({ sec: 'att', name: 'Colour word', kick: 'ATTENTION · 40 SEC', col: '#22A6FF', glow: '#4A5BFF', bg: 'grid', secs: 40, best: '1,180',
  steps: ['Look at the ink, not the word', 'Find that colour below', 'Tap it before the next word'],
  cap: 'Toy plastic keys with no labels, so the only thing to read is the ink. A slip names both colours so you see what tripped you.',
  round: async P => {
    const C = [['RED', '#FF4848'], ['BLUE', '#22A6FF'], ['GREEN', '#17D9A3'], ['YELLOW', '#FFC53D']];
    P.stage.innerHTML = `<div class="cwd"><b class="pre">RED</b></div><div class="cwb">${C.map(([, c]) => toy('k', c)).join('')}</div>`;
    const W = P.stage.querySelector('.cwd b'), K = [...P.stage.querySelectorAll('.cwb .k')]; const set = combo(P);
    const T = P.timer(40); let n = 0, right = 0, st = 0, slip = 0;
    while (!T.done && n < 14) { n++; P.setRound(`${n} OF 14`);
      const wi = Math.random() * 4 | 0; let ii = Math.random() * 4 | 0; if (ii === wi && Math.random() < .8) ii = (wi + 1 + (Math.random() * 3 | 0)) % 4;
      W.className = 'pre'; W.textContent = C[wi][0]; W.style.color = C[ii][1]; W.style.textShadow = `0 0 34px ${C[ii][1]}88`; void W.offsetWidth; W.className = ''; P.step(0); P.hint('Tap the ink colour');
      await P.w(rnd(450, 1000)); P.step(1);
      const wrong = n === 5 && wi !== ii && !slip; const pi = wrong ? wi : ii;
      await P.tap(K[pi]); P.press(K[pi]); P.step(2);
      if (pi === ii) { st++; right++; set(st); const pts = 10 + Math.max(0, st - 1) * 3; K[pi].classList.add('ok'); P.hit(K[pi], C[ii][1], `+${pts}`); P.addScore(pts); P.hint(st >= 3 ? `${st} in a row` : 'Right', 'good'); }
      else { slip++; st = 0; set(0); K[pi].classList.add('no'); P.oops(); P.hint(`Ink was ${C[ii][0].toLowerCase()}, not ${C[wi][0].toLowerCase()}`, 'bad'); await P.w(500); }
      await P.w(360); K.forEach(k => k.classList.remove('ok', 'no')); W.className = 'out'; await P.w(170); }
    await fin(P, T);
    return { title: right >= 12 ? 'Sharp focus' : 'Nice run', stars: right >= 13 ? 3 : right >= 9 ? 2 : 1, stats: [`${right} of ${n} right`, `${slip} slip${slip === 1 ? '' : 's'}`, '+90 XP'] };
  } });

/* ── Opposite day ── */
def({ sec: 'att', name: 'Opposite day', kick: 'FLEXIBILITY · 40 SEC', col: '#8B3DFF', bg: 'dots', secs: 40, best: '960', pieces: 1,
  steps: ['An arrow appears on the token', 'Think of the opposite way', 'Tap that arrow on the pad'],
  cap: 'The token is an enamel piece (switch to Candy gloss below). The pad is Toy plastic, laid out like a D-pad, with a recessed well in the middle.',
  round: async P => {
    const dirs = ['u', 'r', 'd', 'l'], opp = { u: 'd', d: 'u', l: 'r', r: 'l' };
    P.stage.innerHTML = `${piece(P, 'optk', '#FF3D8E', '<span class="ar"></span>')}<div class="opad">${dirs.map(d => toy('k ' + d, COL.violet, arrowSVG(d, 30))).join('')}<div class="ctr"></div></div>`;
    const tk = P.stage.querySelector('.optk'), ar = tk.querySelector('.ar'), K = {}; P.stage.querySelectorAll('.opad .k').forEach((k, i) => K[dirs[i]] = k);
    const set = combo(P); const T = P.timer(40); let n = 0, right = 0, st = 0, slip = 0, last = '';
    while (!T.done && n < 14) { n++; P.setRound(`${n} OF 14`);
      let d = pick(dirs); if (d === last) d = pick(dirs); last = d; ar.innerHTML = arrowSVG(d, 58);
      tk.classList.add('pre'); void tk.offsetWidth; tk.classList.remove('pre'); P.step(0); P.hint('Tap the opposite way'); await P.w(rnd(350, 750)); P.step(1);
      const wrong = n === 4 && !slip; const t = wrong ? d : opp[d]; await P.tap(K[t]); P.press(K[t]); P.step(2);
      if (!wrong) { st++; right++; set(st); const pts = 10 + Math.max(0, st - 1) * 3; P.hit(K[t], COL.violet, `+${pts}`); P.addScore(pts); P.hint(st >= 3 ? `${st} in a row` : 'Opposite', 'good'); ar.innerHTML = arrowSVG(opp[d], 58); }
      else { slip++; st = 0; set(0); K[t].classList.add('no'); P.oops(); P.hint('Same way. Tap the opposite', 'bad'); await P.w(450); K[t].classList.remove('no'); }
      await P.w(330); }
    await fin(P, T);
    return { title: 'Flexible thinking', stars: right >= 13 ? 3 : 2, stats: [`${right} of ${n} right`, `${slip} slip${slip === 1 ? '' : 's'}`, '+90 XP'] };
  } });

/* ── What changed? ── */
def({ sec: 'mem', name: 'What changed?', kick: 'ATTENTION · 45 SEC', col: '#17D9A3', bg: 'grid', secs: 45, best: '420', pieces: 1,
  steps: ['Remember the six pieces', 'Caps come down and one changes', 'Tap the one that changed'],
  cap: 'Pieces sit in recessed wells; graphite caps drop over them. The background goes quiet while you memorise.',
  round: async P => {
    const SH = ['c', 's', 't', 'd'], CL = [COL.mint, COL.pink, COL.sun, COL.sky, COL.orange, COL.violet];
    P.stage.innerHTML = `<div class="wcg">${Array.from({ length: 6 }, () => `<div class="wcs"><div data-r="piece" data-m="${PM(P)}" style="display:contents"><div class="pc mat"></div></div><div data-m="graphite" style="display:contents"><div class="cap mat" style="--c:${COL.mint}"></div></div></div>`).join('')}</div>`;
    const S = [...P.stage.querySelectorAll('.wcs')], pcs = S.map(s => s.querySelector('.pc')), caps = S.map(s => s.querySelector('.cap'));
    const lv = livesUI(P); const T = P.timer(45); let r = 0, found = 0, lost = 0;
    const paint = (i, sh, c) => { pcs[i].className = 'pc mat ' + sh; pcs[i].style.setProperty('--c', c); pcs[i].dataset.sh = sh; pcs[i].dataset.c = c; };
    while (!T.done && r < 5 && lost < 3) { r++; P.setRound(`ROUND ${r} OF 5`); S.forEach(s => s.classList.remove('win', 'no'));
      const cols = shuffle(CL); S.forEach((_, i) => paint(i, pick(SH), cols[i])); pcs.forEach((p, i) => p.animate([{ transform: 'scale(.3)' }, { transform: 'scale(1)' }], { duration: 300, delay: i * 40, easing: 'cubic-bezier(.3,1.6,.5,1)' }));
      P.step(0); P.hint('Remember them', 'watch'); P.quiet(1); await P.w(Math.max(1200, 2200 - r * 200));
      P.step(1); P.hint('Something is changing', 'watch'); caps.forEach((c, i) => setTimeout(() => c.classList.add('on'), i * 50)); await P.w(700);
      const ci = Math.random() * 6 | 0; if (Math.random() < .5) paint(ci, SH[(SH.indexOf(pcs[ci].dataset.sh) + 1 + (Math.random() * 3 | 0)) % 4], pcs[ci].dataset.c); else paint(ci, pcs[ci].dataset.sh, CL.find(c => !cols.slice(0, 6).includes(c)) || '#fff');
      await P.w(500); caps.forEach(c => c.classList.remove('on')); P.quiet(0); await P.w(300); P.step(2); P.hint('Tap the one that changed');
      await P.w(rnd(500, 1000));
      if (r === 3) { const w = S[(ci + 2) % 6]; await P.tap(w); w.classList.add('no'); P.oops(); lv[lost++].classList.add('lost'); P.hint('Not that one', 'bad'); await P.w(500); }
      await P.tap(S[ci]); found++; S[ci].classList.add('win'); pcs[ci].animate([{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 400 }); const pts = 20 + r * 5; P.hit(S[ci], COL.mint, `+${pts}`); P.addScore(pts); P.hint('Spotted it', 'good'); P.hideFin(); await P.w(800); }
    await fin(P, T);
    return { title: 'Good eye', stars: lost === 0 ? 3 : 2, stats: [`${found} of ${r} spotted`, `${3 - lost} of 3 lives`, '+80 XP'] };
  } });

/* ── Swap it ── */
def({ sec: 'att', name: 'Swap it', kick: 'FOCUS · 40 SEC', col: '#5B4BC4', glow: '#4A5BFF', bg: 'persp', secs: 40, best: '5 rounds', pieces: 1,
  steps: ['See which card hides the star', 'Follow it while the cards swap', 'Tap where it ended up'],
  cap: 'Enamel card shells glide on a recessed track; one lifts and one dips on every swap so the path is easy to follow. Swaps speed up each round.',
  round: async P => {
    const X = [48, 132, 216];
    P.stage.innerHTML = `<div class="swtray"></div><div class="swp">${[0, 1, 2].map(i => `<div class="swc" style="left:${X[i]}px"><div class="in"><div data-r="piece" data-m="${PM(P)}" style="display:contents"><div class="b mat" style="--c:#5B4BC4"><i></i></div><div class="f mat" style="--c:#EDEDF2">${i === 1 ? starSVG(40) : ''}</div></div></div></div>`).join('')}</div>`;
    const C = [...P.stage.querySelectorAll('.swc')]; let pos = [0, 1, 2]; const set = combo(P, 'Found');
    const T = P.timer(40); let r = 0, found = 0, miss = 0;
    while (!T.done && r < 5) { r++; P.setRound(`ROUND ${r} OF 5`); const dur = Math.max(240, 440 - r * 45); C.forEach(c => c.style.transitionDuration = dur + 'ms');
      P.step(0); P.hint('Watch the star', 'watch'); C[1].classList.add('up'); await P.w(900); C[1].classList.remove('up'); await P.w(450);
      P.step(1); P.quiet(1); P.hint('Follow it', 'watch');
      for (let k = 0; k < 2 + r; k++) { const a = Math.random() * 3 | 0, b = (a + 1 + (Math.random() * 2 | 0)) % 3; const ca = C.findIndex((_, i) => pos[i] === a), cb = C.findIndex((_, i) => pos[i] === b); pos[ca] = b; pos[cb] = a;
        C[ca].style.left = X[b] + 'px'; C[cb].style.left = X[a] + 'px'; C[ca].classList.add('lift'); C[cb].classList.add('sink'); C[ca].style.animationDuration = C[cb].style.animationDuration = dur + 'ms';
        await P.w(dur + 70); C[ca].classList.remove('lift'); C[cb].classList.remove('sink'); }
      P.quiet(0); P.step(2); P.hint('Where is the star?'); await P.w(rnd(400, 800));
      const pickC = r === 3 ? C[(1 + 1) % 3] : C[1]; await P.tap(pickC); pickC.classList.add('up');
      if (pickC === C[1]) { found++; set(found); P.hit(pickC, '#FFE14D', `+${20 + r * 5}`); P.addScore(20 + r * 5); P.hint('Found it', 'good'); }
      else { miss++; pickC.classList.add('no'); P.oops(); await P.w(350); C[1].classList.add('up'); P.hint('It was here', 'bad'); }
      P.hideFin(); await P.w(900); C.forEach(c => c.classList.remove('up', 'no')); await P.w(450); }
    await fin(P, T);
    return { title: 'Locked on', stars: miss ? 2 : 3, stats: [`${found} of ${r} found`, `${miss} miss${miss === 1 ? '' : 'es'}`, '+80 XP'] };
  } });

/* ── Flash count ── */
def({ sec: 'att', name: 'Flash count', kick: 'FOCUS · 40 SEC', col: '#FFC53D', bg: 'dots', secs: 40, best: '7 in a row',
  steps: ['Dots flash for a moment', 'Count them without blinking', 'Tap how many you saw'],
  cap: 'Candy beads flash inside a recessed well, then come back faint so you can check your count. Answer keys are Toy plastic.',
  round: async P => {
    P.stage.innerHTML = `<div class="fcw"><div class="cue">Get ready</div></div><div class="fca">${[0, 1, 2, 3].map(() => toy('k', COL.sun, '<span>0</span>')).join('')}</div>`;
    const well = P.stage.querySelector('.fcw'), cue = well.querySelector('.cue'), K = [...P.stage.querySelectorAll('.fca .k')]; const set = combo(P);
    const T = P.timer(40); let n = 0, right = 0, st = 0, slip = 0;
    while (!T.done && n < 8) { n++; P.setRound(`${n} OF 8`); well.querySelectorAll('.bdw').forEach(b => b.remove()); K.forEach(k => k.className = 'k mat');
      const cnt = Math.min(9, 3 + Math.floor(n * .8) + (Math.random() * 2 | 0)); const pts = []; let tries = 0; while (pts.length < cnt && tries++ < 400) { const p = [rnd(26, 238), rnd(26, 174)]; if (pts.every(q => Math.hypot(q[0] - p[0], q[1] - p[1]) > 40)) pts.push(p); }
      cue.textContent = 'Watch'; P.step(0); P.hint('Count the dots', 'watch'); P.quiet(1); await P.w(500); cue.textContent = '';
      const B = pts.map(([x, y]) => { const w = document.createElement('div'); w.className = 'bdw'; w.innerHTML = `<div data-m="candy" style="display:contents"><div class="bd mat" style="left:${x}px;top:${y}px;--c:${COL.sun}"></div></div>`; well.appendChild(w); return w.querySelector('.bd'); });
      B.forEach(b => b.classList.add('on')); P.step(1); await P.w(Math.max(450, 900 - n * 50)); B.forEach(b => b.classList.remove('on')); P.quiet(0);
      cue.textContent = 'How many?'; P.step(2); const opts = shuffle([cnt, cnt - 1, cnt + 1, cnt + (Math.random() < .5 ? 2 : -2)]); K.forEach((k, i) => k.querySelector('span').textContent = opts[i]); P.hint('Tap how many');
      await P.w(rnd(500, 1000)); const wrong = n === 5 && !slip; const ci = opts.indexOf(cnt), pi = wrong ? opts.indexOf(cnt + 1) : ci;
      await P.tap(K[pi]); P.press(K[pi]); cue.textContent = ''; B.forEach(b => b.classList.add('ghost'));
      if (!wrong) { st++; right++; set(st); K[pi].classList.add('ok'); K.forEach((k, i) => i !== pi && k.classList.add('dim')); const p = 10 + cnt * 2; P.hit(K[pi], COL.sun, `+${p}`); P.addScore(p); P.hint(`${cnt}. Right`, 'good'); }
      else { slip++; st = 0; set(0); K[pi].classList.add('no'); K[ci].classList.add('ok'); P.oops(); P.hint(`It was ${cnt}`, 'bad'); }
      P.hideFin(); await P.w(900); }
    await fin(P, T);
    return { title: 'Quick eyes', stars: right >= 7 ? 3 : 2, stats: [`${right} of ${n} right`, `${slip} slip${slip === 1 ? '' : 's'}`, '+80 XP'] };
  } });

/* ── Time it right ── */
def({ sec: 'tim', name: 'Time it right', kick: 'TIMING · 5 TRIES', col: '#FF7A1F', bg: 'persp', secs: 45, best: '±0.08 s',
  steps: ['The hand starts sweeping', 'At 2 seconds it hides', 'Tap when you feel 5 seconds'],
  cap: 'A quiet dial in a recessed face. After the tap, two markers meet on the line: white is 5.00 s, orange is you. One big Toy button, nothing else to press.',
  round: async P => {
    const ticks = Array.from({ length: 20 }, (_, i) => { const a = i / 20 * Math.PI * 2 - Math.PI / 2, big = i % 4 === 0; return `<line x1="${95 + 84 * Math.cos(a)}" y1="${95 + 84 * Math.sin(a)}" x2="${95 + (big ? 72 : 78) * Math.cos(a)}" y2="${95 + (big ? 72 : 78) * Math.sin(a)}" stroke="rgba(255,255,255,${big ? .5 : .18})" stroke-width="${big ? 2.5 : 1.5}" stroke-linecap="round"/>`; }).join('');
    P.stage.innerHTML = `<div class="tir"><div class="face"></div><svg width="190" height="190">${ticks}<circle class="arc" cx="95" cy="95" r="62" fill="none" stroke="${COL.orange}" stroke-width="5" stroke-dasharray="0 390" transform="rotate(-90 95 95)" opacity=".85"/><line class="hand" x1="95" y1="95" x2="95" y2="30" stroke="#fff" stroke-width="4" stroke-linecap="round"/><circle cx="95" cy="95" r="6" fill="#fff"/></svg>
      <div class="hid"><b>Keep counting…</b></div><div class="rv"><b>0.00</b><span></span></div></div>
      <div class="tline"><div class="ln"></div><span class="lb" style="left:0">3 s</span><span class="lb" style="left:50%">5 s</span><span class="lb" style="left:100%">7 s</span><div class="tg" style="left:50%"></div><div class="yu"></div></div>
      <div class="tries2">${'<i>—</i>'.repeat(5)}</div>${toy('tbtn', COL.orange, '<span>Tap at 5 seconds</span>')}`;
    const hand = P.stage.querySelector('.hand'), arc = P.stage.querySelector('.arc'), svg = P.stage.querySelector('.tir svg'), hid = P.stage.querySelector('.hid'), rv = P.stage.querySelector('.rv'), yu = P.stage.querySelector('.yu'), tries = [...P.stage.querySelectorAll('.tries2 i')], btn = P.stage.querySelector('.tbtn');
    const T = P.timer(45); let k = 0, best = 9;
    while (!T.done && k < 5) { P.setRound(`TRY ${k + 1} OF 5`); rv.classList.remove('on'); hid.classList.remove('on'); yu.style.opacity = 0; yu.style.left = '50%'; svg.style.opacity = 1; hand.style.transform = 'rotate(0deg)'; arc.setAttribute('stroke-dasharray', '0 390');
      P.hint('Get ready'); await P.w(700); P.step(0); P.hint('Count along', 'watch');
      await P.anim(p => { hand.style.transform = `rotate(${p * 144}deg)`; arc.setAttribute('stroke-dasharray', `${p * 155.8} 390`); }, 2000);
      P.step(1); svg.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' }); hid.classList.add('on'); P.quiet(1);
      const err = [.31, -.18, .12, -.07, .22][k] + rnd(-.03, .03); const target = 3000 + err * 1000; P.step(2); await P.w(target - 320); await P.tap(btn); P.press(btn); P.quiet(0);
      const tm = 5 + err; hid.classList.remove('on'); rv.classList.add('on'); rv.querySelector('b').textContent = tm.toFixed(2) + ' s'; const sp = rv.querySelector('span'); sp.textContent = (err > 0 ? '+' : '−') + Math.abs(err).toFixed(2) + ' s'; sp.style.color = Math.abs(err) < .1 ? '#8BFAD8' : Math.abs(err) < .25 ? '#FFD771' : '#FF8A8A';
      yu.style.opacity = 1; yu.style.left = Math.max(0, Math.min(100, (tm - 3) / 4 * 100)) + '%'; svg.getAnimations().forEach(a => a.cancel());
      const pts = Math.max(5, Math.round(100 - Math.abs(err) * 300)); P.hit(yu, COL.orange, `+${pts}`); P.addScore(pts); tries[k].textContent = (err > 0 ? '+' : '−') + Math.abs(err).toFixed(2); tries[k].classList.add('f');
      if (Math.abs(err) < best) { best = Math.abs(err); tries.forEach(t => t.classList.remove('best')); tries[k].classList.add('best'); if (k) P.toast('Closest yet', '#8BFAD8'); }
      P.hint(Math.abs(err) < .1 ? 'Spot on' : err > 0 ? 'A little late' : 'A little early', Math.abs(err) < .25 ? 'good' : 'bad'); P.hideFin(); k++; await P.w(1300); }
    await fin(P, T);
    return { title: 'Inner clock', stars: best < .1 ? 3 : 2, stats: [`Closest ±${best.toFixed(2)} s`, `${k} tries`, '+70 XP'] };
  } });

/* ── Make the target ── */
def({ sec: 'tim', name: 'Make the target', kick: 'QUICK DECISIONS · 45 SEC', col: '#FF3D8E', bg: 'grid', secs: 45, best: '6 targets', pieces: 1,
  steps: ['A target number appears', 'Tap tiles that add up to it', 'Hit it exactly. Go over and it resets'],
  cap: 'The target sits in a recessed well, the number tiles are enamel pieces that lift when picked. Going over shakes the tiles back.',
  round: async P => {
    P.stage.innerHTML = `<div data-m="well" style="display:contents"><div class="mtw mat" style="--c:#3A0E22"><small>TARGET</small><b>0</b></div></div><div class="mtsum">Tap to add</div><div class="mtg"></div>`;
    const tb = P.stage.querySelector('.mtw b'), sum = P.stage.querySelector('.mtsum'), grid = P.stage.querySelector('.mtg'); const set = combo(P, 'Hit');
    const T = P.timer(45); let r = 0, hits = 0, overs = 0;
    while (!T.done && r < 6) { r++; P.setRound(`TARGET ${r}`);
      const nums = Array.from({ length: 6 }, () => 1 + (Math.random() * (r < 3 ? 9 : 12) | 0)); const sol = shuffle([0, 1, 2, 3, 4, 5]).slice(0, r < 3 ? 2 : 3); const target = sol.reduce((s, i) => s + nums[i], 0);
      grid.innerHTML = nums.map(v => piece(P, 't', COL.pink, `<span>${v}</span>`)).join(''); const Ts = [...grid.querySelectorAll('.t')]; Ts.forEach((t, i) => t.animate([{ transform: 'scale(.4)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 320, delay: i * 40, easing: 'cubic-bezier(.3,1.6,.5,1)' }));
      tb.textContent = target; tb.animate([{ transform: 'scale(1.4)' }, { transform: 'scale(1)' }], { duration: 350, easing: 'cubic-bezier(.3,1.6,.5,1)' }); P.step(0); sum.className = 'mtsum'; sum.innerHTML = 'Tap to add'; P.hint(`Make ${target}`); await P.w(700);
      let picks = [...sol]; if (r === 2) { const big = nums.map((v, i) => [v, i]).filter(([, i]) => !sol.includes(i)).sort((a, b) => b[0] - a[0])[0][1]; picks = [sol[0], big, ...sol]; }
      let s = 0, sel = [];
      for (const i of picks) { if (T.done) break; P.step(1); await P.w(rnd(250, 500)); await P.tap(Ts[i]); Ts[i].classList.add('sel'); sel.push(i); s += nums[i]; sum.innerHTML = `<b>${s}</b> of ${target}`;
        if (s > target) { overs++; set(0); sum.className = 'mtsum over'; P.oops(); sel.forEach(j => { Ts[j].classList.add('no'); Ts[j].classList.remove('sel'); }); P.hint(`${s} is over. Try again`, 'bad'); await P.w(600); sel.forEach(j => Ts[j].classList.remove('no')); sel = []; s = 0; sum.className = 'mtsum'; sum.innerHTML = `<b>0</b> of ${target}`; P.hint(`Make ${target}`); continue; }
        if (s === target) break; }
      if (s === target) { hits++; set(hits); P.step(2); const pts = 20 + sel.length * 10; P.hit(P.stage.querySelector('.mtw'), COL.pink, `+${pts}`); P.addScore(pts); P.hint(`${target}. Exactly`, 'good'); sel.forEach((j, k) => setTimeout(() => Ts[j].classList.add('used'), k * 60)); }
      P.hideFin(); await P.w(800); }
    await fin(P, T);
    return { title: 'Right on target', stars: hits >= 6 ? 3 : 2, stats: [`${hits} targets`, `${overs} went over`, '+90 XP'] };
  } });

/* ── Letter guess ── */
def({ sec: 'words', name: 'Letter guess', kick: 'WORDS · 60 SEC', col: '#17D9A3', bg: 'dots', secs: 60, best: '3 words',
  steps: ['Read the clue', 'Tap a letter you think is in the word', 'Solve it before five misses'],
  cap: 'Letters stamp into carved wells; the rack is Toy plastic in the game colour. Wrong letters go dark so you never guess one twice.',
  round: async P => {
    const WORDS = [['FOCUS', 'WHAT THIS APP TRAINS', 'EOAUSCFTR'], ['QUIET', 'THE OPPOSITE OF A FEED', 'EAIUTQSRN'], ['PAUSE', 'A SHORT BREAK', 'EAUSPRTLN']];
    const lv = livesUI(P, 5); const T = P.timer(60); let solved = 0, w = 0, misses = 0;
    while (!T.done && w < 2) { const [word, clue, plan] = WORDS[(w + (Math.random() * 3 | 0)) % 3]; w++; P.setRound(`WORD ${w} OF 2`);
      const pool = shuffle([...new Set((word + 'TRNLMDH').split(''))]).slice(0, 10); [...word].forEach(c => { if (!pool.includes(c)) pool[pool.findIndex(x => !word.includes(x))] = c; }); const rack = pool.sort();
      P.stage.innerHTML = `<div class="lgclue">${clue}</div><div class="lgs">${[...word].map(() => '<div></div>').join('')}</div><div class="lgmiss">${'<i></i>'.repeat(5)}</div><div class="lgk">${rack.map(c => toy('k', COL.mint, `<span>${c}</span>`)).join('')}</div>`;
      const slots = [...P.stage.querySelectorAll('.lgs div')], keys = [...P.stage.querySelectorAll('.lgk .k')], mk = [...P.stage.querySelectorAll('.lgmiss i')]; let wm = 0;
      P.step(0); P.hint('Guess a letter'); await P.w(900);
      const order = [...plan].filter(c => rack.includes(c)); const left = new Set(word);
      for (const c of order) { if (T.done || !left.size || wm >= 5) break; const key = keys.find(k => k.textContent === c); if (!key || key.classList.contains('hit') || key.classList.contains('miss')) continue;
        P.step(1); await P.w(rnd(250, 520)); await P.tap(key); P.press(key);
        if (word.includes(c)) { key.classList.add('hit'); left.delete(c); [...word].forEach((x, i) => { if (x === c) { slots[i].innerHTML = `<span>${c}</span>`; slots[i].classList.add('ok'); } }); P.hit(key, COL.mint, '+10'); P.addScore(10); P.hint('In the word', 'good'); }
        else { key.classList.add('miss'); mk[wm++].classList.add('x'); misses++; P.oops(); P.hint('Not in this one', 'bad'); }
        P.step(2); await P.w(260); }
      P.hideFin(); if (!left.size) { solved++; P.stage.querySelector('.lgs').classList.add('solved'); slots.forEach((s, i) => s.style.animationDelay = i * 60 + 'ms'); P.toast(word, '#8BFAD8'); P.addScore(50); const [x, y] = P.rel(P.stage.querySelector('.lgs')); P.burst(x, y, COL.mint, 16); P.ring(x, y, COL.mint, 160); }
      await P.w(1300); }
    lv.forEach((l, i) => l.classList.toggle('lost', i < Math.min(5, misses)));
    await fin(P, T);
    return { title: 'Word found', stars: misses <= 2 ? 3 : 2, stats: [`${solved} of ${w} words`, `${misses} misses`, '+90 XP'] };
  } });

/* ── Paragraph recall ── */
def({ sec: 'mem', name: 'Paragraph recall', kick: 'MEMORY · ABOUT 1 MIN', col: '#4A5BFF', bg: 'grid', secs: 60, best: '4 of 4',
  steps: ['Read the short text', 'It goes away', 'Answer one question about it'],
  cap: 'A high-contrast reading card with a reading bar. After you answer, the card comes back with the line that holds the answer lit.',
  round: async P => {
    const PR = [[['Mia leaves for the market at nine.', ' She buys three green apples, a loaf of rye bread and flowers for her sister.', ' On the way home it starts to rain.'], 'How many apples did Mia buy?', ['Two', 'Three', 'Five'], 1, 1],
      [['The night train leaves from platform six.', ' Tom saves a window seat and reads until midnight.', ' He wakes as the sun comes up over the river.'], 'Which platform did the train leave from?', ['Four', 'Six', 'Nine'], 1, 0],
      [['Ana planted tomatoes in May.', ' By August the plants were taller than her brother.', ' She gave the first basket to her neighbour Leo.'], 'Who got the first basket?', ['Her brother', 'Leo', 'Her mum'], 1, 2]];
    const set = combo(P, 'Right'); const T = P.timer(60); let k = 0, right = 0;
    for (const [lines, qn, opts, ans, li] of shuffle(PR).slice(0, 2)) { if (T.done) break; k++; P.setRound(`TEXT ${k} OF 2`);
      P.stage.innerHTML = `<div class="prc"><p>${lines.map(l => `<span>${l}</span>`).join('')}</p><div class="rd"><i></i></div></div><div class="prq">${qn}</div><div class="pro">${opts.map(o => toy('k', COL.cobalt, `<span>${o}</span>`)).join('')}</div>`;
      const card = P.stage.querySelector('.prc'), bar = card.querySelector('.rd i'), q = P.stage.querySelector('.prq'), K = [...P.stage.querySelectorAll('.pro .k')], sp = [...card.querySelectorAll('span')];
      P.step(0); P.hint('Read it once', 'watch'); P.quiet(1); await P.anim(p => bar.style.width = p * 100 + '%', 5200); P.quiet(0);
      P.step(1); card.classList.add('gone'); P.hint('Question'); await P.w(400); q.classList.add('on'); K.forEach((x, i) => setTimeout(() => x.classList.add('on'), 120 + i * 90)); P.step(2); await P.w(rnd(900, 1400));
      const pi = ans; await P.tap(K[pi]); P.press(K[pi]);
      right++; set(right); K[pi].classList.add('ok'); K.forEach((x, i) => i !== pi && x.classList.add('dim')); P.hit(K[pi], COL.mint, '+40'); P.addScore(40); P.hint('Right', 'good'); P.hideFin(); await P.w(700);
      q.classList.remove('on'); K.forEach(x => x.style.opacity = 0); card.classList.remove('gone'); card.classList.add('back'); await P.w(350); sp[li].classList.add('lit'); P.hint('Here is where it was', 'good'); await P.w(1700); }
    await fin(P, T);
    return { title: 'Good recall', stars: right === k ? 3 : 2, stats: [`${right} of ${k} right`, 'No rereads', '+70 XP'] };
  } });

/* ── Read aloud ── */
def({ sec: 'words', name: 'Read aloud', kick: 'WORDS · ABOUT 1 MIN', col: '#8B3DFF', bg: 'dots', secs: 60, best: '2 of 2 clear',
  steps: ['Tap the mic', 'Read the line out loud at your pace', 'Words light up as you say them'],
  cap: 'Needs the microphone and on-device speech recognition, so here the voice is simulated. The mic is a big Toy button that rings while it listens.',
  round: async P => {
    const LINES = ['Slow down. Notice the room around you, the light, and the sound of your own voice.', 'One thing at a time is still the fastest way to finish anything.'];
    const micSVG = '<svg width="34" height="34" viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="12" rx="3" fill="#fff"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>';
    const T = P.timer(60); let k = 0, words = 0;
    for (const line of LINES) { if (T.done) break; k++; P.setRound(`LINE ${k} OF 2`);
      const W = line.split(' '); P.stage.innerHTML = `<div class="rac"><p>${W.map(w => `<span>${w}</span>`).join(' ')}</p></div><div class="wav">${'<i></i>'.repeat(22)}</div><span class="simtag">PROTOTYPE · VOICE IS SIMULATED</span>${toy('mic', COL.violet, micSVG)}`;
      const S = [...P.stage.querySelectorAll('.rac span')], bars = [...P.stage.querySelectorAll('.wav i')], mic = P.stage.querySelector('.mic');
      P.step(0); P.hint('Tap the mic, then read'); await P.w(900); await P.tap(mic); P.press(mic); mic.classList.add('live'); P.hideFin(); P.step(1); P.hint('Listening…', 'watch');
      let live = true; const t = P.tok; (async () => { while (live && P.alive(t)) { bars.forEach(b => b.style.height = (P.frozen() ? 6 : rnd(6, 46)) + 'px'); await sleep(90); } bars.forEach(b => b.style.height = '6px'); })();
      for (let i = 0; i < S.length; i++) { S[i].classList.add('cur'); await P.w(170 + S[i].textContent.length * 28); S[i].classList.remove('cur'); S[i].classList.add('on'); if (i === 1) P.step(2); }
      live = false; mic.classList.remove('live'); words += W.length; P.addScore(W.length * 5); const [x, y] = P.rel(P.stage.querySelector('.rac')); P.burst(x, y, COL.violet, 14); P.float(x, y - 30, `+${W.length * 5}`); P.hint('Clear and steady', 'good'); await P.w(1400); }
    await fin(P, T);
    return { title: 'Clear and steady', stars: 3, stats: [`${words} words`, 'About 130 wpm', '+60 XP'] };
  } });

/* ═════ CALM ═════ */
def({ sec: 'calm', calm: 1, name: 'Breath count', kick: 'CALM · 90 SEC', col: '#4A5BFF', bg: 'dots', secs: 45, len: '90 sec', settle: 'Sit back. Shoulders down.',
  steps: ['Breathe in as the pearl grows', 'Breathe out as it shrinks', 'Tap once on each out-breath, up to nine'],
  cap: 'Nothing to win and no score. One soft pearl, nine dots that fill. The prototype runs about twice as fast as the real thing.',
  round: async P => {
    P.stage.innerHTML = `<div class="bcue">Breathe in</div><div class="pearl"></div><div class="bdots">${'<i></i>'.repeat(9)}</div>`;
    const pl = P.stage.querySelector('.pearl'), cue = P.stage.querySelector('.bcue'), dots = [...P.stage.querySelectorAll('.bdots i')]; P.quiet(1);
    const T = P.timer(45); P.setRound('NINE BREATHS');
    for (let i = 0; i < 9; i++) { P.step(0); cue.textContent = 'Breathe in'; P.hint(`Breath ${i + 1} of 9`);
      await P.anim(p => { const e = .5 - Math.cos(p * Math.PI) / 2; pl.style.transform = `scale(${.55 + .45 * e})`; }, 2300);
      P.step(1); cue.textContent = 'And out'; const out = P.anim(p => { const e = .5 - Math.cos(p * Math.PI) / 2; pl.style.transform = `scale(${1 - .45 * e})`; }, 2700);
      await P.w(900); P.step(2); await P.tap(pl, 0, 30); dots[i].classList.add('on'); const [x, y] = P.rel(dots[i]); P.ring(x, y, '#C9D2FF', 30); P.hideFin(); await out; }
    T.stop(); P.quiet(0); cue.textContent = 'That\'s nine';
    return { title: 'Nine breaths', line: 'Nothing to win. Just a slower minute and a half.', stats: ['9 breaths', '90 sec'] };
  } });

def({ sec: 'calm', calm: 1, name: 'Silence', kick: 'CALM · 2–5 MIN', col: '#5B4BC4', bg: 'dots', secs: 120, len: '2 min', settle: 'Put the phone down if you like.',
  steps: ['Choose how long', 'Let it be quiet. Nothing to do', 'A soft chime when time is up'],
  cap: 'Dark starlight and one slow ring. The only thing moving is the time. Sped up 6× here so you can see it end.',
  round: async P => {
    P.stage.innerHTML = `<div class="sil">${Array.from({ length: 26 }, (_, i) => `<i class="st" style="left:${(i * 37) % 100}%;top:${(i * 61) % 100}%;width:${i % 4 ? 2 : 3}px;height:${i % 4 ? 2 : 3}px;animation-delay:${(i * .41) % 3}s"></i>`).join('')}</div>
      <div class="silr"><svg width="200" height="200"><circle cx="100" cy="100" r="92" fill="none" stroke="rgba(255,255,255,.06)" stroke-width="3"/><circle class="sa" cx="100" cy="100" r="92" fill="none" stroke="rgba(201,190,255,.7)" stroke-width="3" stroke-linecap="round" stroke-dasharray="0 578" transform="rotate(-90 100 100)"/></svg><div class="c"><b class="sv2">2:00</b><span>of quiet</span></div></div>`;
    const sa = P.stage.querySelector('.sa'), sv = P.stage.querySelector('.sv2'); P.quiet(1); P.setRound('2 MINUTES'); const cues = ['Nothing to do', 'Notice the quiet', 'If your mind wanders, that\'s fine', 'Almost there'];
    const T = P.timer(20); P.step(0); await P.w(400); P.step(1);
    await P.anim(p => { sa.setAttribute('stroke-dasharray', `${578 * p} 578`); const s = Math.ceil(120 * (1 - p)); sv.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; P.hint(cues[Math.min(3, Math.floor(p * 4))]); if (p > .9) P.step(2); }, 20000);
    T.stop(); P.quiet(0); const [x, y] = P.rel(P.stage.querySelector('.silr')); P.ring(x, y, '#C9BEFF', 220); await P.w(600);
    return { title: 'Two quiet minutes', line: 'No feed, no sound. That counts.', stats: ['2 min', 'Calm'] };
  } });

def({ sec: 'calm', calm: 1, name: 'Urge surfing', kick: 'SELF-CONTROL · 60–90 SEC', col: '#22A6FF', bg: 'dots', secs: 60, len: '60–90 sec', settle: 'Notice the pull. No need to fight it.',
  steps: ['Notice the urge to open the app', 'Watch it rise and fall like a wave', 'Then choose what to do, on purpose'],
  cap: 'Opens from the block screen. A light rides one slow wave while the urge meter rises and falls, then two choices, with "Back to my day" first.',
  round: async P => {
    P.stage.innerHTML = `<div class="urq">Notice the urge</div><div class="urg"><svg width="300" height="220" viewBox="0 0 300 220"><defs><linearGradient id="ugw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22A6FF" stop-opacity=".35"/><stop offset="1" stop-color="#22A6FF" stop-opacity="0"/></linearGradient></defs><path class="wf" fill="url(#ugw)"/><path class="wl" fill="none" stroke="#7CC8FF" stroke-width="3" stroke-linecap="round"/><circle class="wd" r="9" fill="#fff" style="filter:drop-shadow(0 0 10px #7CC8FF)"/></svg></div>
      <div class="urm"><i></i></div><div class="urml"><span>CALM</span><span>STRONG URGE</span></div>
      <div class="urc">${toy('pill k1', '#FFFFFF', '<span style="position:relative;z-index:2;color:#000">Back to my day</span>', 'height:50px;border-radius:25px;display:flex;align-items:center;justify-content:center;font-weight:800')}<button class="pill p-t">Open Instagram anyway</button></div>`;
    const wf = P.stage.querySelector('.wf'), wl = P.stage.querySelector('.wl'), wd = P.stage.querySelector('.wd'), m = P.stage.querySelector('.urm i'), q = P.stage.querySelector('.urq'), ch = P.stage.querySelector('.urc'); P.quiet(1); P.setRound('RIDE IT OUT');
    const cues = ['Notice the urge', 'Let it build. Don\'t act on it', 'This is the peak', 'And it passes'];
    const T = P.timer(22); P.step(0);
    await P.anim(p => { const amp = 70 * Math.sin(Math.PI * Math.min(1, p * 1.05)), ph = p * 14; let d = ''; for (let x = 0; x <= 300; x += 6) { const y = 150 - amp * Math.exp(-Math.pow((x - 150) / 80, 2)) + 6 * Math.sin(x / 22 + ph); d += (x ? 'L' : 'M') + x + ',' + y.toFixed(1); } wl.setAttribute('d', d); wf.setAttribute('d', d + 'L300,220L0,220Z'); const y0 = 150 - amp + 6 * Math.sin(150 / 22 + ph); wd.setAttribute('cx', 150); wd.setAttribute('cy', y0); m.style.width = (Math.max(0, amp) / 70 * 100) + '%'; const c = Math.min(3, Math.floor(p * 4)); q.textContent = cues[c]; P.hint(c === 3 ? 'Breathe out' : ''); if (p > .3) P.step(1); }, 20000);
    T.stop(); P.quiet(0); P.step(2); q.textContent = 'What now?'; ch.classList.add('on'); await P.w(1100); const k1 = P.stage.querySelector('.k1'); await P.tap(k1); P.press(k1); P.hit(k1, '#7CC8FF'); P.hideFin(); await P.w(500);
    return { title: 'You rode it out', line: 'The urge rose and passed, and you chose what came next.', stats: ['Back to your day', '1 urge resisted'] };
  } });

/* ═════ ACTIVITY ═════ */
def({ sec: 'act', calm: 1, name: 'Phone away', kick: 'ACTIVITY · 25 MIN', col: '#7A7B88', glow: '#4A5BFF', bg: 'persp', secs: 25, len: '25 min', settle: 'Pick a spot out of reach.',
  steps: ['Pick how long, 25 minutes here', 'Put your phone face down', 'Pick it up early and the timer pauses'],
  cap: 'Needs the motion sensor to know the phone is face down, so it\'s simulated here and sped up. On iPhone the app has to stay open with the screen dimmed, which is worth testing early.',
  round: async P => {
    P.stage.innerHTML = `<div class="paph"></div><div class="pacue">Turn your phone face down</div><span class="simtag" style="top:300px">PROTOTYPE · MOTION IS SIMULATED</span><div class="paw"><b class="pt">25:00</b><span>Phone away</span></div><div class="pawarn">You picked it up, so the timer paused.<br><span style="color:#9B9CA1;font-weight:500">Put it back down to keep going.</span></div>`;
    const ph = P.stage.querySelector('.paph'), paw = P.stage.querySelector('.paw'), pt = P.stage.querySelector('.pt'), warn = P.stage.querySelector('.pawarn'); P.setRound('25 MINUTES');
    const T = P.timer(25); P.step(0); P.hint('Ready when you are'); await P.w(1100); P.step(1); ph.classList.add('down'); await P.w(1000); paw.classList.add('on'); P.quiet(1); P.hint('');
    const show = p => { const s = Math.ceil(1500 * (1 - p)); pt.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
    await P.anim(p => show(p * .45), 4500); P.step(2); paw.classList.remove('on'); ph.classList.remove('down'); warn.classList.add('on'); await P.w(2200); warn.classList.remove('on'); ph.classList.add('down'); await P.w(800); paw.classList.add('on');
    await P.anim(p => show(.45 + p * .55), 5500); T.stop(); paw.classList.remove('on'); P.quiet(0); ph.classList.remove('down');
    return { title: '25 minutes away', line: 'Your phone stayed face down. One pick-up, and you put it back.', stats: ['25 min', '1 pick-up'] };
  } });

def({ sec: 'act', calm: 1, name: 'Move first', kick: 'ACTIVITY · ABOUT 1 MIN', col: '#FF7A1F', bg: 'persp', secs: 30, len: '10 reps', settle: 'Stand up. Phone in your hand.',
  steps: ['Stand up', 'Do 10 squats with your phone in hand', 'Your phone counts the reps'],
  cap: 'Uses the motion sensor to count reps, so it\'s simulated here. Big count in a progress ring, a simple figure moving in time, nothing else on screen.',
  round: async P => {
    P.stage.innerHTML = `<div class="mvr"><svg width="200" height="200"><circle cx="100" cy="100" r="88" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="10"/><circle class="ma" cx="100" cy="100" r="88" fill="none" stroke="${COL.orange}" stroke-width="10" stroke-linecap="round" stroke-dasharray="0 553" transform="rotate(-90 100 100)" style="filter:drop-shadow(0 0 10px rgba(255,122,31,.6))"/></svg><div class="c"><b class="mc">0</b><span>of 10 squats</span></div></div>
      <svg class="mvfig" viewBox="0 0 80 90"><g class="fg" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none"><circle cx="40" cy="14" r="8" fill="#fff" stroke="none"/><path class="bd2" d="M40 24 L40 52"/><path class="lg" d="M40 52 L28 86 M40 52 L52 86"/><path class="ar2" d="M40 32 L22 46 M40 32 L58 46"/></g></svg><div class="mvcue">Down…</div><span class="simtag" style="top:360px">PROTOTYPE · MOTION IS SIMULATED</span>`;
    const ma = P.stage.querySelector('.ma'), mc = P.stage.querySelector('.mc'), fg = P.stage.querySelector('.fg'), bd = P.stage.querySelector('.bd2'), lg = P.stage.querySelector('.lg'), ar = P.stage.querySelector('.ar2'), cue = P.stage.querySelector('.mvcue'); P.setRound('10 SQUATS');
    const pose = e => { const hy = 52 + e * 14; fg.setAttribute('transform', `translate(0 ${e * 16})`); bd.setAttribute('d', `M40 24 L40 ${hy - e * 16}`); lg.setAttribute('d', `M40 ${hy - e * 16} L${28 - e * 8} ${86 - e * 16} M40 ${hy - e * 16} L${52 + e * 8} ${86 - e * 16}`); ar.setAttribute('d', `M40 32 L${22 - e * 6} ${46 - e * 10} M40 32 L${58 + e * 6} ${46 - e * 10}`); };
    const T = P.timer(30); P.step(0); await P.w(700); P.step(1);
    for (let i = 1; i <= 10; i++) { cue.textContent = 'Down…'; await P.anim(p => pose(.5 - Math.cos(p * Math.PI) / 2), 650); cue.textContent = 'And up'; await P.anim(p => pose(.5 + Math.cos(p * Math.PI) / 2), 650);
      if (i === 2) P.step(2); mc.textContent = i; mc.animate([{ transform: 'scale(1.3)' }, { transform: 'scale(1)' }], { duration: 300, easing: 'cubic-bezier(.3,1.6,.5,1)' }); ma.setAttribute('stroke-dasharray', `${553 * i / 10} 553`); if (i % 5 === 0) { const [x, y] = P.rel(P.stage.querySelector('.mvr')); P.ring(x, y, COL.orange, 200); } }
    T.stop(); cue.textContent = 'Done. Shake it out.'; const [x, y] = P.rel(P.stage.querySelector('.mvr')); P.burst(x, y, COL.orange, 18); await P.w(700);
    return { title: 'Moved first', line: 'Ten squats before the scroll.', stats: ['10 reps', 'About 40 sec'] };
  } });

/* ═════ build page ═════ */
document.querySelectorAll('[data-sec]').forEach(s => SECT[s.dataset.sec] = s);
GAMES.forEach(g => Game(g));
