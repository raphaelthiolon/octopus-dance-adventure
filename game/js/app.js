/* app.js: screens, game types, rewards, parent area. */
(function () {
  'use strict';
  var state = AE.load();
  var token = 0;          /* bumps on every screen change to cancel old async flows */
  var lastId = null;
  var screenEl = document.getElementById('screen');
  var fx = document.getElementById('fx');
  var guideEl = null;

  function $(id) { return document.getElementById(id); }
  function h(tag, props, kids) {
    var e = document.createElement(tag);
    props = props || {};
    Object.keys(props).forEach(function (k) {
      var v = props[k];
      if (k === 'class') e.className = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k === 'text') e.textContent = v;
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v);
    });
    (kids || []).forEach(function (c) { if (c) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function save() { AE.save(state); }
  function lang() { return state.lang || 'en'; }
  function rnd(a) { return a[Math.floor(AE.rng() * a.length)]; }
  function say(text) { return AA.say(text, lang()); }
  function sayN(n) { return AA.say(AD.numWord(n, lang()), lang()); }
  function applyVoiceCfg() {
    var c = state.voiceCfg;
    AA.config({ pitch: c.pitch, rate: c.rate, en: c.en, fr: c.fr });
  }
  applyVoiceCfg();
  AA.loadManifest();

  /* ---------- Static chrome ---------- */
  $('btnHome').innerHTML = Art.icon('home');
  $('btnColl').innerHTML = Art.icon('unicorn');
  $('jarIcon').innerHTML = Art.candy();
  $('parentHot').innerHTML = Art.icon('gear');
  function refreshChrome() {
    $('candyCount').textContent = state.candies;
    $('btnSound').innerHTML = Art.icon(AA.isMusic() ? 'speakerOn' : 'speakerOff');
    document.documentElement.lang = lang();
  }
  var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (calm) document.body.classList.add('calm');

  (function bubbles() {
    var box = $('bubbles');
    for (var i = 0; i < 14; i++) {
      var s = 14 + Math.random() * 46;
      var b = h('div', { class: 'b' });
      b.style.cssText = 'left:' + (Math.random() * 100) + '%;width:' + s + 'px;height:' + s + 'px;animation-duration:' + (14 + Math.random() * 16) + 's;animation-delay:-' + (Math.random() * 20) + 's;--dx:' + ((Math.random() - .5) * 120) + 'px';
      box.appendChild(b);
    }
  })();

  /* ---------- Audio start (first touch) ---------- */
  var started = false;
  document.addEventListener('pointerdown', function () {
    AA.unlock();
    if (!started) { started = true; AA.setMusic(state.music); AA.setVoice(state.voice); if (state.music) AA.startMusic(); refreshChrome(); }
  });

  $('btnSound').addEventListener('click', function () {
    state.music = !AA.isMusic(); AA.setMusic(state.music);
    if (state.music) AA.startMusic();
    save(); refreshChrome();
  });
  $('btnHome').addEventListener('click', function () { AA.stopSpeech(); home(); });
  $('btnColl').addEventListener('click', function () { AA.stopSpeech(); collection(); });

  /* ---------- Screen helpers ---------- */
  function setScreen(children, chrome) {
    token++;
    AA.stopSpeech();
    screenEl.innerHTML = '';
    children.forEach(function (c) { screenEl.appendChild(c); });
    $('btnHome').style.visibility = chrome === 'nohome' ? 'hidden' : 'visible';
    refreshChrome();
  }
  function makeGuide(cls) {
    var g = h('div', { class: 'guide ' + (cls || ''), html: Art.octopus() });
    guideEl = g;
    return g;
  }
  function guideDo(cls) {
    if (!guideEl) return;
    guideEl.classList.remove('cheer', 'think');
    void guideEl.offsetWidth;
    guideEl.classList.add(cls);
    setTimeout(function () { if (guideEl) guideEl.classList.remove(cls); }, 1300);
  }
  function bigButton(icon, label, fn, cls) {
    return h('button', { class: cls || 'bigbtn', 'aria-label': label, html: Art.icon(icon), onclick: function () { AA.sfx('tap'); fn(); } });
  }

  /* ---------- Effects ---------- */
  function sparkle(x, y) {
    if (calm) return;
    var icons = ['✨', '⭐', '💖', '🌸'];
    for (var i = 0; i < 9; i++) {
      var s = h('span', { class: 'sp', text: icons[i % icons.length] });
      s.style.left = x + 'px'; s.style.top = y + 'px';
      fx.appendChild(s);
      var ang = (Math.PI * 2 * i) / 9, dist = 60 + Math.random() * 60;
      var a = s.animate([
        { transform: 'translate(-50%,-50%) scale(.4)', opacity: 1 },
        { transform: 'translate(calc(-50% + ' + Math.cos(ang) * dist + 'px), calc(-50% + ' + Math.sin(ang) * dist + 'px)) scale(1.2)', opacity: 0 }
      ], { duration: 800, easing: 'ease-out' });
      a.onfinish = (function (el) { return function () { el.remove(); }; })(s);
    }
  }
  function flyCandy(x, y, n) {
    var jar = $('jar').getBoundingClientRect();
    var tx = jar.left + 30, ty = jar.top + 30;
    for (var i = 0; i < Math.max(1, Math.min(n, 4)); i++) {
      (function (i) {
        var c = h('div', { class: 'flycandy', html: Art.candy(rnd(['#ff4fa3', '#4cc9f0', '#52d6a0', '#ffb703', '#b388ff'])) });
        c.style.left = x - 28 + 'px'; c.style.top = y - 20 + 'px';
        fx.appendChild(c);
        var a = c.animate([
          { transform: 'translate(0,0) scale(.5) rotate(0)', opacity: 0 },
          { transform: 'translate(' + (i * 14 - 20) + 'px,-60px) scale(1.1) rotate(20deg)', opacity: 1, offset: .35 },
          { transform: 'translate(' + (tx - x) + 'px,' + (ty - y) + 'px) scale(.5) rotate(-20deg)', opacity: 1 }
        ], { duration: calm ? 300 : 900, delay: i * 120, easing: 'ease-in-out', fill: 'both' });
        a.onfinish = function () { c.remove(); $('jar').classList.remove('pop'); void $('jar').offsetWidth; $('jar').classList.add('pop'); $('candyCount').textContent = state.candies; };
      })(i);
    }
  }
  function centerOf(el) { var r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }

  /* ---------- Language ---------- */
  function langScreen() {
    var tiles = AD.LANGS.map(function (l) {
      return h('button', { class: 'tile', 'aria-label': AD.LANG_NAME[l], html: Art.flag(l) + '<span>' + AD.LANG_NAME[l] + '</span>', onclick: function () {
        state.lang = l; save(); AA.unlock(); AA.sfx('good'); home(true);
      } });
    });
    setScreen([h('div', { class: 'center' }, [makeGuide('big'), h('div', { class: 'row' }, tiles)])], 'nohome');
  }

  /* ---------- Home ---------- */
  function home(greet) {
    if (!state.lang) return langScreen();
    var langBtn = h('button', { class: 'tile mini', 'aria-label': 'Language', html: Art.flag(lang()) + '<span>' + AD.LANG_NAME[lang()] + '</span>', onclick: function () { AA.sfx('tap'); state.lang = null; save(); langScreen(); } });
    var collBtn = h('button', { class: 'tile mini', 'aria-label': 'Unicorns', html: '<span style="display:inline-block;width:52px">' + Art.unicorn(AD.UNICORNS[0], false) + '</span><b>' + state.unicorns.length + '/' + AD.UNICORNS.length + '</b>', onclick: function () { AA.sfx('tap'); collection(); } });
    setScreen([h('div', { class: 'center' }, [
      h('h1', { class: 'title', text: "Andrea's Dance Adventure" }),
      makeGuide('big'),
      bigButton('play', 'Play', function () { startPlay(); }),
      h('div', { class: 'row' }, [collBtn, langBtn])
    ])], 'nohome');
    $('btnHome').style.visibility = 'hidden';
    if (greet) say(AD.T[lang()].hello);
  }

  /* ---------- Collection ---------- */
  function collection() {
    if (!state.lang) return langScreen();
    var cards = AD.UNICORNS.map(function (u) {
      var have = state.unicorns.indexOf(u.id) >= 0;
      var c = h('div', { class: 'ucard' + (have ? '' : ' locked'), html: Art.unicorn(u, !have) + '<span>' + (have ? u.name : '?') + '</span>' });
      if (have) c.addEventListener('click', function () {
        AA.sfx('good'); c.classList.add('prance'); say(u.name);
        setTimeout(function () { c.classList.remove('prance'); }, 2400);
      });
      return c;
    });
    setScreen([
      h('div', { class: 'collhead' }, [bigButton('back', 'Back', home, 'round'), h('h1', { class: 'title', text: state.unicorns.length + ' / ' + AD.UNICORNS.length })]),
      h('div', { class: 'scroll' }, [h('div', { class: 'grid' }, cards)])
    ]);
  }

  /* ---------- Building blocks for the game screens ---------- */
  function emoji(n, skin) {
    var out = [];
    for (var i = 0; i < n; i++) {
      var o = h('span', { class: 'obj', text: skin });
      o.style.animationDelay = '-' + (Math.random() * 2.4).toFixed(2) + 's';
      out.push(o);
    }
    return out;
  }
  /* A group of n things: emoji for n < 10, tens rods and ones cubes from 10. */
  function group(n, skin, cls, forceBlocks) {
    var g = { node: null, rods: [], cubes: [], all: [] };
    if (n < 10 && !forceBlocks) {
      g.cubes = emoji(n, skin);
      g.node = h('div', { class: 'stack ' + (cls || '') }, g.cubes);
      g.all = g.cubes;
      return g;
    }
    var tens = Math.floor(n / 10), ones = n % 10, i, j;
    g.node = h('div', { class: 'stack blocks ' + (cls || '') });
    var col = h('div', { class: 'rodcol' });
    for (i = 0; i < tens; i++) {
      var rod = h('div', { class: 'rod' });
      for (j = 0; j < 10; j++) rod.appendChild(h('i'));
      g.rods.push(rod); col.appendChild(rod);
    }
    if (tens) g.node.appendChild(col);
    if (ones) {
      var cb = h('div', { class: 'cubes' });
      for (i = 0; i < ones; i++) { var c = h('i', { class: 'cube' }); g.cubes.push(c); cb.appendChild(c); }
      g.node.appendChild(cb);
    }
    g.all = g.rods.concat(g.cubes);
    return g;
  }
  function hl(el) { if (!el) return; el.classList.remove('hl'); void el.offsetWidth; el.classList.add('hl'); }
  function tileRow(items, cls) {
    return h('div', { class: 'seqrow ' + (cls || '') }, items.map(function (v) {
      return h('div', { class: 'seqtile' + (v === null ? ' blank' : ''), text: v === null ? '?' : String(v) });
    }));
  }
  function wordRow(chars, blankIdx) {
    return h('div', { class: 'wordrow' }, chars.map(function (ch, i) {
      return h('div', { class: 'lt' + (i === blankIdx ? ' blank' : ''), text: i === blankIdx ? '?' : ch });
    }));
  }

  var SKIN = { letter: 'ch-bubble', case: 'ch-card', first: 'ch-bubble', next: 'ch-bubble', odd: 'ch-card pic', miss: 'ch-bubble', word: 'ch-card wide',
    build: 'ch-bubble sm', count: 'ch-star', seq: 'ch-star', cmp: 'ch-card', add: 'ch-card', sub: 'ch-card', gap: 'ch-star', make10: 'ch-star',
    dbl: 'ch-star', half: 'ch-star', pv: 'ch-card', mul: 'ch-star' };

  /* A view = {play: [nodes], hint: async function(alive)}. Built per question type. */
  function buildView(q, V) {
    var L = lang(), v = { play: [], objs: [], hint: null };
    var letterName = function (l) { return AD.LETTER_SPEECH[L][AD.LETTERS.indexOf(l.toUpperCase())]; };
    var sayLetter = function (l) { return say(letterName(l)); };
    switch (q.type) {
      case 'letter':
        v.play.push(h('button', { class: 'replay', style: 'width:clamp(90px,22vmin,150px);height:clamp(90px,22vmin,150px)', 'aria-label': 'Hear again', html: Art.icon('speakerOn'), onclick: function () { V.replay(); } }));
        v.hint = async function () { V.play.innerHTML = ''; V.play.appendChild(h('div', { class: 'bigcard', text: q.item.letter })); await sayLetter(q.item.letter); };
        break;
      case 'case':
        v.play.push(h('div', { class: 'bigcard', text: q.item.letter }));
        v.hint = async function () { await sayLetter(q.item.letter); };
        break;
      case 'first':
        v.play.push(h('div', { class: 'bigpic', text: AD.PIC[q.word] }));
        v.hint = async function () { await say(q.word); await sayLetter(q.item.letter); };
        break;
      case 'next':
        v.play.push(tileRow(q.letters, 'letters'));
        v.hint = async function (alive) { var tiles = V.play.querySelectorAll('.seqtile'); for (var i = 0; i < q.letters.length; i++) { if (!alive()) return; hl(tiles[i]); if (q.letters[i]) await sayLetter(q.letters[i]); else await wait(500); } };
        break;
      case 'odd':
        v.play.push(h('button', { class: 'replay', style: 'width:clamp(90px,22vmin,150px);height:clamp(90px,22vmin,150px)', 'aria-label': 'Hear again', html: Art.icon('speakerOn'), onclick: function () { V.replay(); } }));
        v.hint = async function (alive) { for (var i = 0; i < q.choices.length; i++) { if (!alive()) return; hl(V.choices.children[i]); await say(q.choices[i]); } };
        break;
      case 'miss':
        if (q.pic) v.play.push(h('div', { class: 'bigpic small', text: q.pic }));
        v.play.push(wordRow(q.word.split(''), q.idx));
        v.hint = async function (alive) { var ts = V.play.querySelectorAll('.lt'); await say(AD.wordSay(q.word, L)); for (var i = 0; i < ts.length; i++) { if (!alive()) return; hl(ts[i]); if (i !== q.idx) await sayLetter(q.word.charAt(i)); else await wait(500); } };
        break;
      case 'word':
        v.play.push(h('div', { class: 'bigpic', text: q.pic }));
        v.hint = async function (alive) { for (var i = 0; i < q.choices.length; i++) { if (!alive()) return; hl(V.choices.children[i]); await say(q.choices[i]); } };
        break;
      case 'count':
        v.objs = emoji(q.item.n, q.skin);
        v.play.push(h('div', { class: 'stack' + (q.item.n > 10 ? ' many ten' : '') }, v.objs));
        v.hint = async function (alive) { for (var i = 0; i < v.objs.length; i++) { if (!alive()) return; hl(v.objs[i]); AA.sfx('pop'); await sayN(i + 1); } };
        break;
      case 'seq':
        v.play.push(tileRow(q.seq, 'nums'));
        v.hint = async function (alive) { var tiles = V.play.querySelectorAll('.seqtile'); for (var i = 0; i < q.seq.length; i++) { if (!alive()) return; hl(tiles[i]); if (q.seq[i] !== null) await sayN(q.seq[i]); else await wait(500); } };
        break;
      case 'cmp':
        var ga = group(q.nums[0], q.skin, 'a', q.nums[0] >= 10), gb = group(q.nums[1], q.skin, 'b', q.nums[1] >= 10);
        v.play.push(ga.node, gb.node);
        v.hint = async function (alive) { for (var i = 0; i < 2; i++) { if (!alive()) return; hl(V.choices.children[i]); await sayN(q.choices[i]); } };
        break;
      case 'add':
        var A = group(q.a, q.skin, 'a'), B = group(q.b, q.skin, 'b');
        v.play.push(A.node, h('div', { class: 'plus', text: '+' }), B.node);
        v.hint = async function (alive) {
          var tot = q.a; await sayN(tot);
          for (var i = 0; i < B.rods.length; i++) { if (!alive()) return; tot += 10; hl(B.rods[i]); await sayN(tot); }
          for (var j = 0; j < B.cubes.length; j++) { if (!alive()) return; tot += 1; hl(B.cubes[j]); AA.sfx('pop'); await sayN(tot); }
        };
        break;
      case 'sub':
        var keep = q.a - q.b, os = emoji(q.a, q.skin);
        os.forEach(function (o, i) { if (i >= keep) o.classList.add('empty'); });
        v.play.push(h('div', { class: 'stack' + (q.a > 10 ? ' many ten' : '') }, os));
        v.hint = async function (alive) { for (var i = 0; i < keep; i++) { if (!alive()) return; hl(os[i]); AA.sfx('pop'); await sayN(i + 1); } };
        break;
      case 'gap':
      case 'make10':
        var c = q.type === 'make10' ? 10 : q.c, a0 = q.a, cells = [], ghosts = [];
        for (var i = 0; i < c; i++) {
          if (i < a0) cells.push(h('span', { class: 'obj', text: q.skin }));
          else { var gh = h('span', { class: 'obj ghost' }); ghosts.push(gh); cells.push(gh); }
        }
        v.play.push(h('div', { class: 'stack ten' + (c > 10 ? ' many' : '') }, cells));
        v.hint = async function (alive) { for (var k = 0; k < ghosts.length; k++) { if (!alive()) return; hl(ghosts[k]); AA.sfx('pop'); await sayN(a0 + k + 1); } };
        break;
      case 'dbl':
        var d1 = emoji(q.n, q.skin), d2 = emoji(q.n, q.skin);
        v.play.push(h('div', { class: 'stack a' + (q.n > 6 ? ' many' : '') }, d1), h('div', { class: 'plus', text: '+' }), h('div', { class: 'stack b' + (q.n > 6 ? ' many' : '') }, d2));
        v.hint = async function (alive) { var all = d1.concat(d2); for (var i = 0; i < all.length; i++) { if (!alive()) return; hl(all[i]); await sayN(i + 1); } };
        break;
      case 'half':
        var tot = emoji(q.n, q.skin);
        var duo = h('div', { class: 'duo', html: '<span>🦄</span><span>🦄</span>' });
        v.play.push(h('div', { class: 'stack many ten' }, tot), duo);
        v.hint = async function (alive) {
          V.play.innerHTML = '';
          var l1 = h('div', { class: 'stack many' }), l2 = h('div', { class: 'stack many' });
          V.play.appendChild(h('div', { class: 'halfbox' }, [h('span', { class: 'uni', text: '🦄' }), l1])); V.play.appendChild(h('div', { class: 'halfbox' }, [h('span', { class: 'uni', text: '🦄' }), l2]));
          for (var i = 0; i < q.n; i++) { if (!alive()) return; (i % 2 ? l2 : l1).appendChild(h('span', { class: 'obj hl', text: q.skin })); AA.sfx('pop'); await wait(260); }
          await sayN(q.n / 2);
        };
        break;
      case 'pv':
        var P = group(q.n, q.skin, '', true);
        v.play.push(P.node);
        v.hint = async function (alive) {
          for (var i = 0; i < P.rods.length; i++) { if (!alive()) return; hl(P.rods[i]); await sayN((i + 1) * 10); }
          for (var j = 0; j < P.cubes.length; j++) { if (!alive()) return; hl(P.cubes[j]); await sayN(q.tens * 10 + j + 1); }
        };
        break;
      case 'mul':
        var boxes = [], per = [];
        for (var gi = 0; gi < q.g; gi++) { var ob = emoji(q.s, q.skin); per.push(ob); boxes.push(h('div', { class: 'stack a' }, ob)); }
        v.play.push(h('div', { class: 'groups' }, boxes));
        v.hint = async function (alive) { for (var k = 0; k < boxes.length; k++) { if (!alive()) return; per[k].forEach(hl); AA.sfx('pop'); await sayN((k + 1) * q.s); } };
        break;
    }
    return v;
  }

  /* ---------- Chapter flow ---------- */
  function startPlay() {
    if (state.chapter.done >= AE.CHAPTER_LEN) return boxScreen();
    nextTask();
  }

  function dotsEl() {
    var d = h('div', { class: 'dots' });
    for (var i = 0; i < AE.CHAPTER_LEN; i++) d.appendChild(h('i', { class: i < state.chapter.done ? 'on' : '' }));
    return d;
  }

  function choiceNode(q, v) {
    if (q.kind === 'pic') return { text: AD.PIC[v], label: v };
    return { text: String(v), label: String(v) };
  }

  function nextTask() {
    var item = (location.hash === '#debug' && window.__forceId) ? AE.itemById(window.__forceId) : AE.pick(state, lastId, AE.rng, lang());
    lastId = item.id;
    if (location.hash === '#debug') window.__go = nextTask;
    var q = AE.makeQuestion(item, AE.rng, lang());
    if (location.hash === '#debug') { window.__q = q; window.__state = state; }
    var t = token + 1; /* setScreen will bump to this value */
    var ctxq = { q: q, misses: 0, locked: false, start: performance.now() };
    var prompt = AD.prompt(q, lang());
    var play = h('div', { class: 'play' });
    var choicesEl = h('div', { class: 'choices' });
    var V = { play: play, choices: choicesEl, replay: function () { say(prompt.say); } };
    var view = buildView(q, V);
    view.play.forEach(function (n) { play.appendChild(n); });
    var isBuild = q.type === 'build';

    /* choices (or spelling tiles) */
    var skinClass = SKIN[q.type];
    var slots = [], builtPos = 0;
    if (isBuild) {
      if (q.pic) play.appendChild(h('div', { class: 'bigpic small', text: q.pic }));
      var srow = h('div', { class: 'wordrow' });
      q.letters.forEach(function () { var s = h('div', { class: 'lt slot', text: '' }); slots.push(s); srow.appendChild(s); });
      play.appendChild(srow);
      q.tiles.forEach(function (ch) {
        var b = h('button', { class: 'ch ' + skinClass, 'aria-label': ch, text: ch });
        b.addEventListener('click', function () { tapTile(b, ch); });
        choicesEl.appendChild(b);
      });
      view.hint = async function () { await say(AD.wordSay(q.word, lang())); };
    } else {
      q.choices.forEach(function (val) {
        var cn = choiceNode(q, val);
        var b = h('button', { class: 'ch ' + skinClass, 'aria-label': cn.label, text: cn.text });
        b._v = val;
        b.addEventListener('click', function () { choose(b, val); });
        choicesEl.appendChild(b);
      });
    }

    var cap = h('span', { class: 'cap', text: prompt.cap });
    var talk = h('div', { class: 'talk' }, [cap, h('button', { class: 'replay', 'aria-label': 'Hear again', html: Art.icon('speakerOn'), onclick: function () { V.replay(); } })]);
    var game = h('div', { class: 'game' }, [
      h('div', { class: 'side' }, [makeGuide(), talk, dotsEl()]),
      h('div', { class: 'main' }, [play, choicesEl])
    ]);
    setScreen([game]);

    function alive() { return token === t; }
    say(prompt.say).then(function () { if (alive() && ctxq.misses === 0 && !ctxq.locked) ctxq.start = performance.now(); });

    async function runHint() { if (view.hint) await view.hint(alive); }

    async function choose(btn, val) {
      if (ctxq.locked || !alive()) return;
      var ms = performance.now() - ctxq.start;
      if (val === q.answer) {
        ctxq.locked = true;
        [].forEach.call(choicesEl.children, function (b) { b.disabled = true; });
        btn.disabled = false; btn.classList.add('ok');
        if (q.type === 'miss') { var bl = play.querySelector('.lt.blank'); if (bl) { bl.textContent = q.answer; bl.classList.remove('blank'); bl.classList.add('filled'); } }
        await finishTask(btn, ms, ctxq.misses === 0, false);
        return;
      }
      ctxq.misses++;
      btn.disabled = true; btn.classList.add('wob');
      AA.sfx('oops'); guideDo('think');
      if (ctxq.misses >= 2) {
        ctxq.locked = true;
        var right = [].filter.call(choicesEl.children, function (b) { return b._v === q.answer; })[0];
        if (right) { right.disabled = false; right.classList.add('glow'); }
        await say(AD.answerSay(q, lang()));
        await wait(700);
        if (!alive()) return;
        await finishTask(right || btn, ms, false, true);
        return;
      }
      await wait(350);
      if (!alive()) return;
      await say(AD.T[lang()].tryAgain);
      await runHint();
      if (alive()) ctxq.start = performance.now();
    }

    async function tapTile(btn, ch) {
      if (ctxq.locked || !alive()) return;
      var ms = (performance.now() - ctxq.start) / q.letters.length * 3; /* pace per letter, scaled to a 3-letter word */
      if (ch === q.letters[builtPos]) {
        slots[builtPos].textContent = ch; slots[builtPos].classList.add('filled'); hl(slots[builtPos]);
        builtPos++; btn.disabled = true; AA.sfx('place');
        if (builtPos === q.letters.length) {
          ctxq.locked = true;
          await say(AD.wordSay(q.word, lang()));
          await finishTask(slots[slots.length - 1], ms, ctxq.misses === 0, false);
        }
        return;
      }
      ctxq.misses++;
      btn.classList.add('wob'); setTimeout(function () { btn.classList.remove('wob'); }, 600);
      AA.sfx('oops'); guideDo('think');
      if (ctxq.misses >= 3) {
        ctxq.locked = true;
        await say(AD.answerSay(q, lang()));
        for (; builtPos < q.letters.length; builtPos++) {
          if (!alive()) return;
          slots[builtPos].textContent = q.letters[builtPos]; slots[builtPos].classList.add('filled'); hl(slots[builtPos]); AA.sfx('place'); await wait(300);
        }
        await wait(500);
        if (alive()) await finishTask(slots[slots.length - 1], ms, false, true);
        return;
      }
      if (ctxq.misses === 1) { await say(AD.T[lang()].tryAgain); await runHint(); }
    }

    async function finishTask(btn, ms, firstTry, revealed) {
      var res = AE.record(state, q.item.id, { firstTry: firstTry, revealed: revealed, ms: ms, day: AE.today(), lang: lang() });
      state.chapter.done++;
      if (firstTry) state.chapter.ok++;
      save();
      if (!revealed) {
        var c = centerOf(btn);
        AA.sfx(res.candies >= 3 ? 'reward' : 'good');
        guideDo('cheer'); sparkle(c.x, c.y); flyCandy(c.x, c.y, res.candies);
        say(rnd(AD.T[lang()].praise));
        if (res.levelChange > 0 && !calm) { setTimeout(function () { if (alive()) { guideDo('cheer'); sparkle(window.innerWidth / 2, window.innerHeight / 3); } }, 900); }
      }
      await wait(revealed ? 600 : 1700);
      if (!alive()) return;
      if (state.chapter.done >= AE.CHAPTER_LEN) boxScreen(); else nextTask();
    }
  }

  /* ---------- Chapter end: surprise box, unicorn, cliffhanger ---------- */
  function boxScreen() {
    var t = token + 1;
    var box = h('button', { class: 'boxbtn', 'aria-label': 'Open', html: Art.gift(), onclick: function () { open(); } });
    setScreen([h('div', { class: 'center' }, [makeGuide(), h('h1', { class: 'title', text: AD.T[lang()].surprise }), box])]);
    guideDo('cheer'); AA.sfx('reward');
    say(AD.T[lang()].surprise).then(function () { if (token === t) say(AD.T[lang()].tapBox); });

    function open() {
      var u = AE.awardUnicorn(state, AE.rng);
      var bonus = u ? 3 : 8;
      state.candies += bonus;
      AE.completeChapter(state);
      save();
      AA.sfx('box');
      var node;
      if (u) {
        node = h('div', { class: 'center' }, [
          h('div', { class: 'reveal', html: Art.unicorn(u, false) }),
          h('div', { class: 'uniname', text: u.name }),
          bigButton('next', 'Next', function () { cliffScreen(); }, 'bigbtn')
        ]);
      } else {
        node = h('div', { class: 'center' }, [makeGuide('big'), bigButton('next', 'Next', function () { cliffScreen(); }, 'bigbtn')]);
      }
      var t2 = token + 1;
      setScreen([node]);
      sparkle(window.innerWidth / 2, window.innerHeight / 2);
      sparkle(window.innerWidth / 3, window.innerHeight / 2.4);
      sparkle(window.innerWidth * 0.7, window.innerHeight / 2.4);
      $('candyCount').textContent = state.candies;
      say(u ? AD.T[lang()].newUnicorn(u.name) : AD.T[lang()].allUnicorns).then(function () { if (token === t2) say(AD.T[lang()].chapterDone); });
    }
  }

  function cliffScreen() {
    var line = AD.T[lang()].cliff[state.chapters % AD.T[lang()].cliff.length];
    setScreen([h('div', { class: 'center' }, [
      makeGuide('big'),
      h('div', { class: 'talk' }, [h('span', { class: 'cap', text: line })]),
      h('div', { class: 'row' }, [bigButton('play', 'Play', startPlay, 'bigbtn'), bigButton('home', 'Home', home, 'round')])
    ])]);
    say(line);
  }

  /* ---------- Parent area (press and hold the gear, or Shift+click) ---------- */
  (function parentHold() {
    var el = $('parentHot'), tm = null;
    function down() { el.classList.add('hold'); tm = setTimeout(function () { el.classList.remove('hold'); parent(); }, 1200); }
    function up() { el.classList.remove('hold'); clearTimeout(tm); }
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up); el.addEventListener('pointerleave', up); el.addEventListener('pointercancel', up);
    el.addEventListener('click', function (e) { if (e.shiftKey) parent(); });
  })();

  var TYPE_LABEL = { letter: 'Letter names', case: 'Upper and lower case', first: 'First letter of a picture', next: 'Alphabet gap', odd: 'Odd one out',
    miss: 'Missing letter', build: 'Spell the word', word: 'Read the word', count: 'Counting', seq: 'Number patterns', cmp: 'Bigger or smaller',
    add: 'Addition', sub: 'Subtraction', gap: 'Missing number', make10: 'Make ten', dbl: 'Doubles', half: 'Halves', pv: 'Tens and ones', mul: 'Groups (times)' };

  function parent() {
    var box = h('div', { class: 'parent' });
    function rebuild() { box.innerHTML = ''; build(); }
    function build() {
      var L = lang(), cat = AE.catalog(L), mastered = 0, seen = 0;
      cat.forEach(function (it) { var r = state.items[it.id]; if (r && r.n) seen++; if (AE.isMastered(r)) mastered++; });
      box.appendChild(h('h2', { text: 'Parent area' }));
      box.appendChild(h('p', { text: 'Letters level ' + state.lv.lit + ' of ' + AE.MAX_LEVEL.lit + ' · Numbers level ' + state.lv.num + ' of ' + AE.MAX_LEVEL.num + ' · ' + state.chapters + ' chapters · ' + state.candies + ' candies · ' + state.unicorns.length + ' unicorns · ' + seen + '/' + cat.length + ' items seen · ' + mastered + ' mastered' }));
      box.appendChild(h('h3', { text: 'Language' }));
      AD.LANGS.forEach(function (l) { box.appendChild(h('button', { class: 'pb' + (state.lang === l ? ' sel' : ''), text: AD.LANG_NAME[l], onclick: function () { state.lang = l; save(); rebuild(); } })); });

      box.appendChild(h('h3', { text: 'Voice' }));
      box.appendChild(h('button', { class: 'pb' + (state.voice ? ' sel' : ''), text: 'Voice ' + (state.voice ? 'on' : 'off'), onclick: function () { state.voice = !state.voice; AA.setVoice(state.voice); save(); rebuild(); } }));
      AD.LANGS.forEach(function (l) {
        var list = AA.voicesFor(l);
        var sel = h('select', { id: 'vsel-' + l, 'aria-label': AD.LANG_NAME[l] + ' voice' });
        sel.appendChild(h('option', { value: '', text: 'Automatic (best female voice)' }));
        list.forEach(function (x) { sel.appendChild(h('option', { value: x.name, text: x.name + ' (' + x.lang + ')' })); });
        sel.value = state.voiceCfg[l] || '';
        sel.addEventListener('change', function () { state.voiceCfg[l] = sel.value || null; applyVoiceCfg(); save(); });
        var test = h('button', { class: 'pb', text: 'Test', onclick: function () { AA.say(AD.T[l].hello, l); } });
        box.appendChild(h('p', {}, [h('b', { text: AD.LANG_NAME[l] + ': ' }), sel, test, h('span', { text: list.length ? ' now using ' + AA.voiceName(l) : ' no voice found on this device' })]));
      });
      function slider(id, label, min, max, step, key) {
        var out = h('span', { text: ' ' + state.voiceCfg[key] });
        var inp = h('input', { type: 'range', id: id, min: min, max: max, step: step, value: state.voiceCfg[key], 'aria-label': label });
        inp.addEventListener('input', function () { state.voiceCfg[key] = parseFloat(inp.value); out.textContent = ' ' + inp.value; applyVoiceCfg(); save(); });
        box.appendChild(h('p', {}, [h('b', { text: label + ': ' }), inp, out]));
      }
      slider('v-pitch', 'Pitch (higher sounds younger)', 0.8, 2, 0.1, 'pitch');
      slider('v-rate', 'Speed', 0.7, 1.3, 0.05, 'rate');
      box.appendChild(h('p', { class: 'note', text: 'Browser voices differ by device. The best ones are the "Natural" or "Online" voices in Edge and Chrome, and the Apple voices on iPad. For a truly young, fun voice, record clips: see the voice script below.' }));

      box.appendChild(h('h3', { text: 'Levels' }));
      [['lit', 'Letters'], ['num', 'Numbers']].forEach(function (tr) {
        box.appendChild(h('p', {}, [
          h('b', { text: tr[1] + ' ' + state.lv[tr[0]] + ': ' }),
          h('button', { class: 'pb', text: '−', onclick: function () { state.lv[tr[0]] = Math.max(1, state.lv[tr[0]] - 1); save(); rebuild(); } }),
          h('button', { class: 'pb', text: '+', onclick: function () { state.lv[tr[0]] = Math.min(AE.MAX_LEVEL[tr[0]], state.lv[tr[0]] + 1); save(); rebuild(); } })
        ]));
      });

      box.appendChild(h('h3', { text: 'Progress by game (' + AD.LANG_NAME[L] + ')' }));
      var rows = {};
      cat.forEach(function (it) {
        var r = rows[it.type] = rows[it.type] || { total: 0, seen: 0, weak: 0, mastered: 0 };
        var rec = state.items[it.id]; r.total++;
        if (rec && rec.n) { r.seen++; if (rec.box <= 2) r.weak++; }
        if (AE.isMastered(rec)) r.mastered++;
      });
      var tbl = h('div', { class: 'stats' });
      Object.keys(TYPE_LABEL).forEach(function (k) {
        var r = rows[k]; if (!r) return;
        tbl.appendChild(h('div', { class: 'stat ' + (r.seen ? (r.weak > r.seen / 2 ? 'b2' : 'b4') : 'nv'), html: '<b>' + TYPE_LABEL[k] + '</b>' + r.seen + '/' + r.total + ' seen · ' + r.weak + ' weak · ' + r.mastered + ' mastered' }));
      });
      box.appendChild(tbl);

      box.appendChild(h('h3', { text: 'Voice script (for recording clips)' }));
      var vs = h('textarea', { id: 'voice-script', placeholder: 'Press the button to list the phrases' });
      box.appendChild(h('button', { class: 'pb', text: 'List phrases to record', onclick: function () {
        var lines = ['Record each line as audio/voice/<language>/<name>.mp3 and list the names in audio/voice/manifest.json as {"en":[...],"fr":[...]}.', ''];
        AD.LANGS.forEach(function (l) {
          var seenKeys = {}, add = function (s) { var k = AA.slug(s); if (!seenKeys[k]) { seenKeys[k] = 1; lines.push(l + '/' + k + '.mp3 = ' + s); } };
          add(AD.T[l].hello); add(AD.T[l].tryAgain); add(AD.T[l].surprise); add(AD.T[l].tapBox); add(AD.T[l].chapterDone); add(AD.T[l].allUnicorns);
          AD.T[l].praise.forEach(add); AD.T[l].cliff.forEach(add);
          AD.LETTER_SPEECH[l].forEach(add);
          for (var n = 0; n <= 30; n++) add(AD.numWord(n, l));
          [10, 20, 30, 40, 50, 60, 70, 80, 90, 100].forEach(function (n) { add(AD.numWord(n, l)); });
          AD.NAMES[l].forEach(function (x) { add(x.say); });
          AD.WL[l].forEach(add);
        });
        vs.value = lines.join('\n'); vs.select();
      } }));
      box.appendChild(vs);

      box.appendChild(h('h3', { text: 'Backup' }));
      var ta = h('textarea', { id: 'backup-text', placeholder: 'Paste a backup here to restore' });
      box.appendChild(h('button', { class: 'pb', text: 'Show backup text', onclick: function () { ta.value = AE.exportJSON(state); ta.select(); } }));
      box.appendChild(h('button', { class: 'pb', text: 'Restore from text', onclick: function () {
        try { state = AE.importJSON(ta.value); save(); AA.setMusic(state.music); AA.setVoice(state.voice); applyVoiceCfg(); rebuild(); } catch (e) { ta.value = ''; ta.placeholder = 'That is not a valid backup. Paste the full backup text.'; }
      } }));
      box.appendChild(ta);
      var armed = false;
      var rb = h('button', { class: 'pb warn', text: 'Reset everything', onclick: function () {
        if (!armed) { armed = true; rb.textContent = 'Tap again to erase all progress'; setTimeout(function () { armed = false; rb.textContent = 'Reset everything'; }, 3500); return; }
        AE.clearSave(); state = AE.newState(); save(); lastId = null; applyVoiceCfg(); home();
      } });
      box.appendChild(h('div', {}, [rb]));
    }
    build();
    setScreen([
      h('div', { class: 'collhead' }, [bigButton('back', 'Back', home, 'round')]),
      h('div', { class: 'scroll' }, [box])
    ]);
  }

  /* ---------- Offline cache ---------- */
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register('sw.js').catch(function () { /* offline cache is optional */ });
  }

  /* ---------- Go ---------- */
  refreshChrome();
  home(false);
})();
