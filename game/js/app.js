/* app.js: screens, task flow, rewards, parent area. */
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
  }, { once: false });

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
      }, onmouseenter: null });
    });
    setScreen([h('div', { class: 'center' }, [makeGuide('big'), h('div', { class: 'row' }, tiles)])], 'nohome');
  }

  /* ---------- Home ---------- */
  function home(greet) {
    if (!state.lang) return langScreen();
    var inChapter = state.chapter.done > 0 && state.chapter.done < AE.CHAPTER_LEN;
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

  function objs(n, skin, extra) {
    var out = [];
    for (var i = 0; i < n; i++) {
      var o = h('span', { class: 'obj', text: skin });
      o.style.animationDelay = '-' + (Math.random() * 2.4).toFixed(2) + 's';
      out.push(o);
    }
    return out;
  }

  function nextTask() {
    var item = AE.pick(state, lastId, AE.rng);
    lastId = item.id;
    var q = AE.makeQuestion(item, AE.rng);
    if (location.hash === '#debug') { window.__q = q; window.__state = state; }
    var t = token + 1; /* setScreen will bump to this value */
    var ctxq = { q: q, misses: 0, locked: false, start: performance.now(), counters: [] };
    var prompt = AD.prompt(q, lang());

    /* visual */
    var play = h('div', { class: 'play' });
    var objEls = [];
    switch (q.type) {
      case 'letter':
        play.appendChild(h('button', { class: 'replay', style: 'width:clamp(90px,22vmin,150px);height:clamp(90px,22vmin,150px)', 'aria-label': 'Hear again', html: Art.icon('speakerOn'), onclick: function () { replay(); } }));
        break;
      case 'case':
        play.appendChild(h('div', { class: 'bigcard', text: q.item.letter }));
        break;
      case 'first':
        play.appendChild(h('div', { class: 'bigpic', text: AD.WORDS[lang()][q.item.letter].e }));
        break;
      case 'count':
        var st = h('div', { class: 'stack' }, objs(q.item.n, q.skin)); objEls = [].slice.call(st.children); play.appendChild(st);
        break;
      case 'add':
        var s1 = h('div', { class: 'stack a' }, objs(q.item.a, q.skin));
        var s2 = h('div', { class: 'stack b' }, objs(q.item.b, q.skin));
        objEls = [].slice.call(s1.children).concat([].slice.call(s2.children));
        play.appendChild(s1); play.appendChild(h('div', { class: 'plus', text: '+' })); play.appendChild(s2);
        break;
      case 'make10':
        var s3 = h('div', { class: 'stack ten' }, []);
        for (var i = 0; i < 10; i++) {
          if (i < q.item.a) { var o = h('span', { class: 'obj', text: q.skin }); s3.appendChild(o); }
          else s3.appendChild(h('span', { class: 'obj ghost' }));
        }
        objEls = [].slice.call(s3.children); play.appendChild(s3);
        break;
    }

    /* choices */
    var skinClass = { letter: 'ch-bubble', case: 'ch-card', first: 'ch-bubble', count: 'ch-star', add: 'ch-card', make10: 'ch-star' }[q.type];
    var choicesEl = h('div', { class: 'choices' });
    q.choices.forEach(function (v) {
      var b = h('button', { class: 'ch ' + skinClass, 'aria-label': String(v), text: String(v) });
      b.addEventListener('click', function () { choose(b, v); });
      choicesEl.appendChild(b);
    });

    var cap = h('span', { class: 'cap', text: prompt.cap });
    var talk = h('div', { class: 'talk' }, [cap, h('button', { class: 'replay', 'aria-label': 'Hear again', html: Art.icon('speakerOn'), onclick: function () { replay(); } })]);
    var game = h('div', { class: 'game' }, [
      h('div', { class: 'side' }, [makeGuide(), talk, dotsEl()]),
      h('div', { class: 'main' }, [play, choicesEl])
    ]);
    setScreen([game]);

    function alive() { return token === t; }

    function replay() { say(prompt.say); }
    say(prompt.say).then(function () { if (alive() && ctxq.misses === 0 && !ctxq.locked) ctxq.start = performance.now(); });

    async function countAloud(els, from) {
      for (var i = 0; i < els.length; i++) {
        if (!alive()) return;
        var el = els[i];
        el.classList.remove('hl'); void el.offsetWidth; el.classList.add('hl');
        AA.sfx('pop');
        await say(AD.NUM[lang()][(from || 0) + i + 1]);
        await wait(80);
      }
    }

    async function hint() {
      switch (q.type) {
        case 'letter':
        case 'case': {
          if (q.type === 'letter') { play.innerHTML = ''; play.appendChild(h('div', { class: 'bigcard', text: q.item.letter })); }
          await say(AD.LETTER_SPEECH[lang()][AD.LETTERS.indexOf(q.item.letter)]);
          break;
        }
        case 'first':
          await say(AD.WORDS[lang()][q.item.letter].w);
          await say(AD.LETTER_SPEECH[lang()][AD.LETTERS.indexOf(q.item.letter)]);
          break;
        case 'count':
        case 'add':
          await countAloud(objEls);
          break;
        case 'make10': {
          var filled = q.item.a;
          await countAloud(objEls.slice(0, filled));
          await countAloud(objEls.slice(filled), filled);
          break;
        }
      }
    }

    async function choose(btn, v) {
      if (ctxq.locked || !alive()) return;
      var ms = performance.now() - ctxq.start;
      var ok = v === q.answer;
      if (ok) {
        ctxq.locked = true;
        [].forEach.call(choicesEl.children, function (b) { b.disabled = true; });
        btn.disabled = false; btn.classList.add('ok');
        await finishTask(btn, ms, ctxq.misses === 0, false);
        return;
      }
      ctxq.misses++;
      btn.disabled = true; btn.classList.add('wob');
      AA.sfx('oops'); guideDo('think');
      if (ctxq.misses >= 2) {
        ctxq.locked = true;
        var right = [].filter.call(choicesEl.children, function (b) { return b.textContent === String(q.answer); })[0];
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
      await hint();
      if (alive()) ctxq.start = performance.now();
    }

    async function finishTask(btn, ms, firstTry, revealed) {
      var res = AE.record(state, q.item.id, { firstTry: firstTry, revealed: revealed, ms: ms, day: AE.today() });
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

  function itemLabel(it) {
    switch (it.type) {
      case 'letter': return it.letter + ' (hear)';
      case 'case': return it.letter + ' / ' + it.letter.toLowerCase();
      case 'first': return it.letter + ' (word)';
      case 'count': return 'count ' + it.n;
      case 'add': return it.a + ' + ' + it.b;
      case 'make10': return it.a + ' + ? = 10';
    }
    return it.id;
  }

  function parent() {
    var box = h('div', { class: 'parent' });
    function rebuild() { box.innerHTML = ''; build(); }
    function build() {
      var mastered = 0, seen = 0, cat = AE.catalog();
      cat.forEach(function (it) { var r = state.items[it.id]; if (r && r.n) seen++; if (AE.isMastered(r)) mastered++; });
      box.appendChild(h('h2', { text: 'Parent area' }));
      box.appendChild(h('p', { text: 'Level ' + state.level + ' of ' + AE.MAX_LEVEL + ' · ' + state.chapters + ' chapters done · ' + state.candies + ' candies · ' + state.unicorns.length + ' unicorns · ' + seen + '/' + cat.length + ' items seen · ' + mastered + ' mastered' }));
      box.appendChild(h('h3', { text: 'Language' }));
      AD.LANGS.forEach(function (l) { box.appendChild(h('button', { class: 'pb' + (state.lang === l ? ' sel' : ''), text: AD.LANG_NAME[l], onclick: function () { state.lang = l; save(); rebuild(); } })); });
      box.appendChild(h('h3', { text: 'Voice and level' }));
      box.appendChild(h('button', { class: 'pb' + (state.voice ? ' sel' : ''), text: 'Voice ' + (state.voice ? 'on' : 'off'), onclick: function () { state.voice = !state.voice; AA.setVoice(state.voice); save(); rebuild(); } }));
      box.appendChild(h('button', { class: 'pb', text: 'Level −', onclick: function () { state.level = Math.max(1, state.level - 1); save(); rebuild(); } }));
      box.appendChild(h('button', { class: 'pb', text: 'Level +', onclick: function () { state.level = Math.min(AE.MAX_LEVEL, state.level + 1); save(); rebuild(); } }));
      var vf = AD.LANGS.map(function (l) { return AD.LANG_NAME[l] + ': ' + (AA.hasVoice(l) ? 'voice found' : 'NO voice on this device'); }).join(' · ');
      box.appendChild(h('p', { text: vf }));
      box.appendChild(h('h3', { text: 'Items (red = weak, green = strong, outlined = mastered)' }));
      var grid = h('div', { class: 'stats' });
      cat.forEach(function (it) {
        var r = state.items[it.id];
        var cls = !r || !r.n ? 'nv' : 'b' + r.box;
        if (AE.isMastered(r)) cls += ' m';
        grid.appendChild(h('div', { class: 'stat ' + cls, html: '<b>' + itemLabel(it) + '</b>' + (r && r.n ? r.ok + '/' + r.n + ' ok · ' + r.first + ' first' : 'new') + ' · L' + it.level }));
      });
      box.appendChild(grid);
      box.appendChild(h('h3', { text: 'Backup' }));
      var ta = h('textarea', { placeholder: 'Paste a backup here to restore' });
      box.appendChild(h('button', { class: 'pb', text: 'Show backup text', onclick: function () { ta.value = AE.exportJSON(state); ta.select(); } }));
      box.appendChild(h('button', { class: 'pb', text: 'Restore from text', onclick: function () {
        try { state = AE.importJSON(ta.value); save(); AA.setMusic(state.music); AA.setVoice(state.voice); rebuild(); } catch (e) { ta.value = ''; ta.placeholder = 'That is not a valid backup. Paste the full backup text.'; }
      } }));
      box.appendChild(ta);
      var armed = false;
      var rb = h('button', { class: 'pb warn', text: 'Reset everything', onclick: function () {
        if (!armed) { armed = true; rb.textContent = 'Tap again to erase all progress'; setTimeout(function () { armed = false; rb.textContent = 'Reset everything'; }, 3500); return; }
        AE.clearSave(); state = AE.newState(); save(); lastId = null; home();
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
