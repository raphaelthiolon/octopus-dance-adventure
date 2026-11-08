/* engine.js: items, questions, adaptive levels (letters and numbers), rewards, save. No audio, no UI. */
(function () {
  'use strict';
  var AE = (window.AE = {});

  AE.KEY = 'andrea_game_v1';
  AE.TRACKS = ['lit', 'num'];
  AE.MAX_LEVEL = { lit: 8, num: 10 };
  AE.UP_AFTER = 3;          /* [GUESS] first-try correct in a row to go up */
  AE.DOWN_AFTER = 2;        /* [GUESS] misses in a row to go down */
  AE.HESITATION_MS = 15000; /* [GUESS] correct but slower than this counts as a miss */
  AE.FAST_MS = { letter: 4000, case: 4000, first: 5000, next: 5000, odd: 6000, miss: 7000, build: 15000, word: 8000,
    count: 6000, seq: 7000, cmp: 5000, add: 7000, sub: 8000, gap: 8000, make10: 8000, dbl: 6000, half: 8000, pv: 8000, mul: 9000 }; /* [GUESS] */
  AE.MASTERY_DAYS = 3;      /* [GUESS] fast first try on this many separate days */
  AE.CHAPTER_LEN = 10;
  AE.REQUEUE_GAP = 3;
  AE.TIER_WEIGHTS = [0.6, 0.3, 0.1]; /* [GUESS] weak / mid / strong */
  AE.rng = Math.random;

  /* All ordered addition facts a+b with a,b >= 1 and sum <= max (default 20: 190 facts; 30: 435 facts). */
  AE.additionFacts = function (max) {
    max = max || 20;
    var out = [];
    for (var a = 1; a < max; a++) for (var b = 1; a + b <= max; b++) out.push({ a: a, b: b, sum: a + b });
    return out;
  };

  /* ---------- Helpers ---------- */
  function shuffle(arr, rng) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  AE.shuffle = shuffle;
  function pickOne(arr, rng) { return arr[Math.floor(rng() * arr.length)]; }
  function initial(w) { return AD.stripAccent(w).charAt(0).toUpperCase(); }
  function plainWord(w) { return /^[a-z]+$/i.test(w); }
  function setIndexOf(letter) { for (var i = 0; i < AD.SETS.length; i++) if (AD.SETS[i].indexOf(letter) >= 0) return i; return 0; }
  function setEnd(letter) { return AD.SETS.slice(0, setIndexOf(letter) + 1).reduce(function (n, s) { return n + s.length; }, 0); }

  /* Distractor numbers: prefs first (plausible mistakes), then the nearest numbers. */
  function numChoices(answer, n, rng, prefs, lo, hi) {
    lo = lo === undefined ? Math.max(1, answer - 6) : lo;
    hi = hi === undefined ? answer + 6 : hi;
    var seen = {}; seen[answer] = 1;
    var good = [];
    (prefs || []).forEach(function (v) { if (v >= lo && v <= hi && v >= 0 && !seen[v]) { seen[v] = 1; good.push(v); } });
    var picked = shuffle(good, rng).slice(0, n - 1);
    var pool = [];
    for (var v = lo; v <= hi; v++) if (v !== answer && picked.indexOf(v) < 0) pool.push(v);
    pool = shuffle(pool, rng).sort(function (x, y) { return Math.abs(x - answer) - Math.abs(y - answer); });
    for (var i = 0; picked.length < n - 1 && i < pool.length; i++) picked.push(pool[i]);
    return shuffle(picked.concat([answer]), rng);
  }
  AE.numChoices = numChoices;

  function letterChoices(answer, n, rng, pool) {
    var rest = shuffle(pool.filter(function (l) { return l !== answer; }), rng).slice(0, n - 1);
    return shuffle(rest.concat([answer]), rng);
  }

  /* ---------- Word groups ---------- */
  var groupCache = {};
  AE.groups = function (lang) {
    if (!groupCache[lang]) {
      var g = {};
      AD.WL[lang].forEach(function (w) { var k = initial(w); (g[k] = g[k] || []).push(w); });
      groupCache[lang] = g;
    }
    return groupCache[lang];
  };

  /* ---------- Item catalogue ---------- */
  function lit(id, type, level, extra) { var o = { id: id, type: type, track: 'lit', level: level }; for (var k in extra) o[k] = extra[k]; return o; }
  function num(id, type, level, extra) { var o = { id: id, type: type, track: 'num', level: level }; for (var k in extra) o[k] = extra[k]; return o; }

  function wordLevel(kind, w) {
    var n = w.length;
    if (kind === 'miss') return n <= 3 ? 5 : n <= 5 ? 7 : 8;
    if (kind === 'build') return n <= 3 ? 6 : n === 4 ? 7 : 8;
    return n <= 4 ? 6 : n === 5 ? 7 : 8; /* word */
  }

  function litItems(lang) {
    var out = [], i;
    var letterLv = [1, 2, 3, 4, 5], caseLv = [1, 3, 4, 5, 6];
    AD.SETS.forEach(function (set, si) {
      set.forEach(function (L) {
        out.push(lit('L:' + L, 'letter', letterLv[si], { letter: L }));
        out.push(lit('C:' + L, 'case', caseLv[si], { letter: L }));
      });
    });
    var firstLv = [2, 3, 4, 5, 5];
    AD.FIRST_LETTERS.forEach(function (L) { out.push(lit('W:' + L, 'first', firstLv[setIndexOf(L)], { letter: L })); });
    for (i = 0; i < 24; i++) out.push(lit('A:' + AD.LETTERS[i], 'next', i < 8 ? 3 : 6, { letter: AD.LETTERS[i], start: i }));
    var groups = AE.groups(lang);
    Object.keys(groups).forEach(function (L) { if (groups[L].length >= 2) out.push(lit('O:' + L, 'odd', 5, { letter: L })); });
    AD.NAMES[lang].forEach(function (nm) {
      out.push(lit('X:' + nm.w, 'miss', 4, { word: nm.w, name: true }));
      out.push(lit('B:' + nm.w, 'build', wordLevel('build', nm.w) + (nm.w.length >= 5 ? 0 : 0), { word: nm.w, name: true }));
    });
    AD.WL[lang].forEach(function (w) {
      out.push(lit('X:' + w, 'miss', wordLevel('miss', w), { word: w }));
      if (plainWord(w)) out.push(lit('B:' + w, 'build', wordLevel('build', w), { word: w }));
      out.push(lit('R:' + w, 'word', wordLevel('word', w), { word: w }));
    });
    return out;
  }

  function numItems() {
    var out = [], a, b, c, n, s, st;
    for (n = 1; n <= 10; n++) out.push(num('N:' + n, 'count', n <= 5 ? 1 : 2, { n: n }));
    for (n = 11; n <= 20; n++) out.push(num('N:' + n, 'count', 6, { n: n }));
    function seq(step, start, level) { out.push(num('Q:' + step + ':' + start, 'seq', level, { step: step, start: start })); }
    for (st = 1; st <= 26; st++) seq(1, st, st <= 6 ? 2 : st <= 16 ? 4 : 8);
    for (st = 1; st <= 22; st++) seq(2, st, st <= 12 ? 4 : 8);
    for (st = 5; st <= 30; st += 5) seq(5, st, 7);
    for (st = 10; st <= 50; st += 10) seq(10, st, 7);
    for (st = 6; st <= 20; st++) seq(-1, st, 9);
    for (st = 10; st <= 24; st += 2) seq(-2, st, 9);
    for (st = 25; st <= 50; st += 5) seq(-5, st, 9);
    for (st = 50; st <= 100; st += 10) seq(-10, st, 9);
    for (n = 1; n <= 30; n++) out.push(num('B:' + n, 'cmp', n <= 10 ? 3 : n <= 20 ? 6 : 8, { x: n }));
    /* addition: ordered within 10 (earlier ids), then teens, bridging, within 30 */
    for (a = 1; a <= 9; a++) for (b = 1; a + b <= 10; b++) out.push(num('S:' + a + '+' + b, 'add', a + b <= 5 ? 3 : 4, { a: a, b: b, sum: a + b }));
    for (a = 10; a <= 19; a++) for (b = 1; b <= 9 && a + b <= 20; b++) out.push(num('S:' + a + '+' + b, 'add', 6, { a: a, b: b, sum: a + b }));
    out.push(num('S:10+10', 'add', 6, { a: 10, b: 10, sum: 20 }));
    for (s = 11; s <= 18; s++) for (b = 2; b <= 9; b++) { a = s - b; if (a >= b && a <= 9) out.push(num('S:' + a + '+' + b, 'add', 7, { a: a, b: b, sum: s })); }
    for (s = 21; s <= 30; s++) for (b = 1; b <= 10; b++) out.push(num('S:' + (s - b) + '+' + b, 'add', 8, { a: s - b, b: b, sum: s }));
    for (s = 22; s <= 30; s++) for (b = 11; b <= s - b; b++) out.push(num('S:' + (s - b) + '+' + b, 'add', 10, { a: s - b, b: b, sum: s }));
    for (a = 2; a <= 10; a++) for (b = 1; b < a; b++) out.push(num('T:' + a + '-' + b, 'sub', 5, { a: a, b: b }));
    for (a = 11; a <= 20; a++) for (b = 1; b <= 9; b++) out.push(num('T:' + a + '-' + b, 'sub', 7, { a: a, b: b }));
    for (a = 1; a <= 9; a++) out.push(num('M:' + a, 'make10', 4, { a: a }));
    for (c = 3; c <= 9; c++) for (a = 1; a < c; a++) out.push(num('G:' + a + '+?=' + c, 'gap', 5, { a: a, c: c }));
    for (c = 11; c <= 19; c++) for (a = 10; a < c; a++) out.push(num('G:' + a + '+?=' + c, 'gap', 7, { a: a, c: c }));
    for (a = 1; a <= 19; a++) out.push(num('G:' + a + '+?=20', 'gap', 8, { a: a, c: 20 }));
    for (n = 1; n <= 15; n++) out.push(num('D:' + n, 'dbl', n <= 5 ? 5 : n <= 10 ? 7 : 10, { n: n }));
    for (n = 2; n <= 20; n += 2) out.push(num('H:' + n, 'half', 9, { n: n }));
    for (n = 11; n <= 59; n++) out.push(num('P:' + n, 'pv', n <= 20 ? 6 : n <= 30 ? 8 : 10, { n: n }));
    [2, 3, 4, 5].forEach(function (g) { [2, 3, 5].forEach(function (z) { out.push(num('U:' + g + 'x' + z, 'mul', g <= 3 ? 9 : 10, { g: g, s: z })); }); });
    return out;
  }

  var CAT = {}, BY_ID = {};
  AE.catalog = function (lang) {
    lang = lang || 'en';
    if (!CAT[lang]) {
      CAT[lang] = numItems().concat(litItems(lang));
      CAT[lang].forEach(function (it) { BY_ID[it.id] = it; });
    }
    return CAT[lang];
  };
  AE.catalog('en'); AE.catalog('fr');
  AE.itemById = function (id) { return BY_ID[id]; };
  AE.itemsUpTo = function (track, level, lang) {
    return AE.catalog(lang).filter(function (it) { return it.track === track && it.level <= level; });
  };

  /* ---------- Questions ---------- */
  AE.makeQuestion = function (item, rng, lang) {
    rng = rng || AE.rng; lang = lang || 'en';
    var q = { item: item, type: item.type, track: item.track, skin: pickOne(AD.SKINS, rng) };
    var pool, i, a, b, ans, prefs, d, y, cap, chars, idxs, idx, w;
    switch (item.type) {
      case 'letter':
        q.idx = AD.LETTERS.indexOf(item.letter); q.answer = item.letter; q.kind = 'letter';
        q.choices = letterChoices(item.letter, 3, rng, AD.LETTERS.slice(0, setEnd(item.letter))); break;
      case 'case':
        q.answer = item.letter.toLowerCase(); q.kind = 'lower';
        q.choices = letterChoices(item.letter, 3, rng, AD.LETTERS.slice(0, setEnd(item.letter))).map(function (l) { return l.toLowerCase(); }); break;
      case 'first':
        q.answer = item.letter; q.kind = 'letter'; q.word = AD.FIRST[lang][item.letter];
        q.choices = letterChoices(item.letter, 3, rng, AD.FIRST_LETTERS.filter(function (l) { return AD.LETTERS.indexOf(l) < setEnd(item.letter); })); break;
      case 'next':
        i = item.start; idx = Math.floor(rng() * 3);
        q.letters = [AD.LETTERS[i], AD.LETTERS[i + 1], AD.LETTERS[i + 2]]; q.answer = q.letters[idx]; q.gap = idx; q.kind = 'letter';
        pool = []; for (d = Math.max(0, i - 3); d <= Math.min(25, i + 5); d++) pool.push(AD.LETTERS[d]);
        q.choices = letterChoices(q.answer, 3, rng, pool); q.letters = q.letters.map(function (l, k) { return k === idx ? null : l; }); break;
      case 'odd':
        var g = AE.groups(lang), same = shuffle(g[item.letter], rng).slice(0, 2);
        var others = []; Object.keys(g).forEach(function (k) { if (k !== item.letter) others = others.concat(g[k]); });
        q.oddWord = pickOne(others, rng); q.answer = q.oddWord; q.kind = 'pic';
        q.choices = shuffle(same.concat([q.oddWord]), rng); break;
      case 'miss':
        w = item.word; chars = w.split(''); idxs = [];
        chars.forEach(function (ch, k) { if (AD.isPlain(ch) && !(item.name && k === 0)) idxs.push(k); });
        idx = pickOne(idxs, rng); q.word = w; q.idx = idx; q.pic = AD.PIC[w] || null; q.kind = 'lower';
        var up = idx === 0 && /[A-Z]/.test(chars[0]);
        var vow = 'aeiou'.indexOf(chars[idx].toLowerCase()) >= 0;
        pool = 'abcdefghijklmnopqrstuvwxyz'.split('').filter(function (l) { return l !== chars[idx].toLowerCase() && ('aeiou'.indexOf(l) >= 0) === vow; });
        q.answer = up ? chars[idx].toUpperCase() : chars[idx].toLowerCase();
        q.choices = shuffle(shuffle(pool, rng).slice(0, 2).concat([chars[idx].toLowerCase()]), rng).map(function (l) { return up ? l.toUpperCase() : l; });
        break;
      case 'build':
        w = item.word; chars = w.split(''); q.word = w; q.pic = AD.PIC[w] || null; q.kind = 'build'; q.answer = w; q.letters = chars;
        q.tiles = shuffle(chars, rng);
        for (i = 0; i < 6 && q.tiles.join('') === w && chars.length > 2; i++) q.tiles = shuffle(chars, rng);
        break;
      case 'word':
        w = item.word; q.word = w; q.pic = AD.PIC[w]; q.kind = 'word'; q.answer = w;
        pool = AD.WL[lang].filter(function (x) { return x !== w && Math.abs(x.length - w.length) <= (w.length <= 3 ? 1 : 1); });
        var sameLen = pool.filter(function (x) { return x.length === w.length; });
        pool = sameLen.length >= 2 ? sameLen : pool;
        q.choices = shuffle(shuffle(pool, rng).slice(0, 2).concat([w]), rng); break;
      case 'count':
        q.answer = item.n; q.kind = 'num'; q.choices = numChoices(item.n, 3, rng, [item.n + 1, item.n - 1]); break;
      case 'seq':
        var terms = []; for (i = 0; i < 5; i++) terms.push(item.start + i * item.step);
        idx = 1 + Math.floor(rng() * 3); q.answer = terms[idx]; q.gap = idx; q.kind = 'num';
        q.seq = terms.map(function (t, k) { return k === idx ? null : t; });
        q.choices = numChoices(q.answer, 3, rng, [q.answer + 1, q.answer - 1, q.answer + Math.abs(item.step), q.answer - Math.abs(item.step), q.answer + 2, q.answer - 2], Math.max(1, q.answer - 12), q.answer + 12);
        break;
      case 'cmp':
        a = item.x; cap = a <= 10 ? 10 : a <= 20 ? 20 : 30;
        d = 1 + Math.floor(rng() * 5); y = rng() < 0.5 ? a + d : a - d;
        if (y < 1 || y > cap) y = a + (a + d > cap ? -d : d);
        if (y < 1) y = a + 1;
        q.mode = rng() < 0.5 ? 'big' : 'small'; q.nums = [a, y]; q.kind = 'num';
        q.answer = q.mode === 'big' ? Math.max(a, y) : Math.min(a, y); q.choices = shuffle([a, y], rng); break;
      case 'add':
        if (rng() < 0.5) { q.a = item.a; q.b = item.b; } else { q.a = item.b; q.b = item.a; }
        ans = item.a + item.b; q.answer = ans; q.kind = 'num'; q.story = item.sum > 10 && rng() < 0.4;
        prefs = [ans + 1, ans - 1, ans + 2, ans - 2, item.a, item.b]; if (ans > 20) prefs.push(ans + 10, ans - 10);
        q.choices = numChoices(ans, 3, rng, prefs, Math.max(1, ans - 10), ans + 10); break;
      case 'sub':
        q.a = item.a; q.b = item.b; q.answer = item.a - item.b; q.kind = 'num'; q.story = item.a > 10 && rng() < 0.4;
        q.choices = numChoices(q.answer, 3, rng, [q.answer + 1, q.answer - 1, item.a + item.b, item.b, q.answer + 2, q.answer - 2], Math.max(1, q.answer - 6), q.answer + 6); break;
      case 'gap':
        q.a = item.a; q.c = item.c; q.answer = item.c - item.a; q.kind = 'num';
        q.choices = numChoices(q.answer, 3, rng, [q.answer + 1, q.answer - 1, item.c, item.a], Math.max(1, q.answer - 6), q.answer + 6); break;
      case 'make10':
        q.a = item.a; q.answer = 10 - item.a; q.kind = 'num';
        q.choices = numChoices(q.answer, 3, rng, [q.answer + 1, q.answer - 1], 1, 9); break;
      case 'dbl':
        q.n = item.n; q.answer = item.n * 2; q.kind = 'num';
        q.choices = numChoices(q.answer, 3, rng, [item.n, q.answer + 1, q.answer - 1, q.answer + 2, q.answer - 2], Math.max(1, q.answer - 6), q.answer + 6); break;
      case 'half':
        q.n = item.n; q.answer = item.n / 2; q.kind = 'num';
        q.choices = numChoices(q.answer, 3, rng, [q.answer + 1, q.answer - 1, item.n - q.answer + 1], 1, 14); break;
      case 'pv':
        q.n = item.n; q.tens = Math.floor(item.n / 10); q.ones = item.n % 10; q.answer = item.n; q.kind = 'num';
        prefs = [item.n + 1, item.n - 1, item.n + 10, item.n - 10]; if (q.ones && q.ones !== q.tens) prefs.push(q.ones * 10 + q.tens);
        q.choices = numChoices(item.n, 3, rng, prefs, Math.max(1, item.n - 12), item.n + 12); break;
      case 'mul':
        q.g = item.g; q.s = item.s; q.answer = item.g * item.s; q.kind = 'num';
        q.choices = numChoices(q.answer, 3, rng, [item.g + item.s, q.answer + item.s, q.answer - item.s, q.answer + item.g, q.answer - item.g, q.answer + 1, q.answer - 1], 2, 40); break;
    }
    return q;
  };

  /* ---------- State ---------- */
  AE.newState = function () {
    return {
      v: 2, lang: null, music: true, voice: true,
      voiceCfg: { pitch: 1.4, rate: 1.0, en: null, fr: null },
      candies: 0, unicorns: [],
      lv: { lit: 1, num: 1 }, ok: { lit: 0, num: 0 }, miss: { lit: 0, num: 0 }, recent: [],
      items: {}, requeue: [], chapter: { done: 0, ok: 0 }, chapters: 0, taskCount: 0
    };
  };

  AE.rec = function (state, id) {
    if (!state.items[id]) state.items[id] = { n: 0, ok: 0, first: 0, box: 1, fastDays: [], lastMs: 0 };
    return state.items[id];
  };
  AE.isMastered = function (rec) { return !!rec && rec.fastDays.length >= AE.MASTERY_DAYS; };
  AE.tierOf = function (rec) { return rec.box <= 2 ? 0 : rec.box === 3 ? 1 : 2; };

  /* Record one finished task. o = {firstTry, revealed, ms, day}. Returns {levelChange, track, streak, candies}. */
  AE.record = function (state, id, o) {
    var item = BY_ID[id], tr = item.track, r = AE.rec(state, id);
    var fast = o.ms <= AE.FAST_MS[item.type];
    r.n++; r.lastMs = o.ms;
    if (!o.revealed) r.ok++;
    if (o.firstTry) {
      r.first++;
      if (fast) {
        r.box = Math.min(5, r.box + 1);
        if (o.day && r.fastDays.indexOf(o.day) < 0) r.fastDays.push(o.day);
      }
    } else if (o.revealed) { r.box = 1; } else { r.box = Math.max(1, r.box - 1); }
    if (o.revealed) state.requeue.push({ id: id, due: state.taskCount + AE.REQUEUE_GAP, lang: o.lang || null });
    state.taskCount++;

    var good = o.firstTry && !o.revealed && o.ms <= AE.HESITATION_MS;
    if (good) { state.ok[tr]++; state.miss[tr] = 0; } else { state.ok[tr] = 0; state.miss[tr]++; }
    var streak = state.ok[tr], change = 0;
    if (state.ok[tr] >= AE.UP_AFTER && state.lv[tr] < AE.MAX_LEVEL[tr]) { state.lv[tr]++; state.ok[tr] = 0; change = 1; }
    else if (state.miss[tr] >= AE.DOWN_AFTER && state.lv[tr] > 1) { state.lv[tr]--; state.miss[tr] = 0; change = -1; }
    var candies = o.revealed ? 0 : (o.firstTry ? 2 : 1);
    if (good && streak > 0 && streak % AE.UP_AFTER === 0) candies += 2;
    state.candies += candies;
    return { levelChange: change, track: tr, streak: streak, candies: candies };
  };

  /* Letters and numbers alternate: about half each, never three of one kind in a row. */
  function chooseTrack(state, rng) {
    var rc = state.recent;
    if (rc.length >= 2 && rc[rc.length - 1] === rc[rc.length - 2]) return rc[rc.length - 1] === 'lit' ? 'num' : 'lit';
    return rng() < 0.5 ? 'lit' : 'num';
  }

  /* Pick the next item: requeued misses first, then a tiered weighted draw within one track. */
  AE.pick = function (state, lastId, rng, lang) {
    rng = rng || AE.rng; lang = lang || 'en';
    var i, rq, it;
    for (i = 0; i < state.requeue.length; i++) {
      rq = state.requeue[i]; it = BY_ID[rq.id];
      if (it && rq.due <= state.taskCount && it.level <= state.lv[it.track] && rq.id !== lastId && (!rq.lang || rq.lang === lang)) {
        state.requeue.splice(i, 1);
        state.recent.push(it.track); state.recent = state.recent.slice(-2);
        return it;
      }
    }
    state.requeue = state.requeue.filter(function (r) { var x = BY_ID[r.id]; return x && x.level <= state.lv[x.track]; });
    var track = chooseTrack(state, rng);
    var pool = AE.itemsUpTo(track, state.lv[track], lang);
    var cand = pool.length > 1 ? pool.filter(function (x) { return x.id !== lastId; }) : pool;
    var tiers = [[], [], []];
    cand.forEach(function (x) { tiers[AE.tierOf(AE.rec(state, x.id))].push(x); });
    var r = rng(), w = AE.TIER_WEIGHTS, order;
    if (r < w[0]) order = [0, 1, 2]; else if (r < w[0] + w[1]) order = [1, 0, 2]; else order = [2, 1, 0];
    var chosen = null;
    for (var k = 0; k < 3; k++) if (tiers[order[k]].length) { chosen = tiers[order[k]]; break; }
    var total = 0;
    var weights = chosen.map(function (x) { var m = x.level === state.lv[track] ? 2 : 1; total += m; return m; });
    var t = rng() * total, pickIt = chosen[chosen.length - 1];
    for (var j = 0; j < chosen.length; j++) { t -= weights[j]; if (t < 0) { pickIt = chosen[j]; break; } }
    state.recent.push(track); state.recent = state.recent.slice(-2);
    return pickIt;
  };

  AE.awardUnicorn = function (state, rng) {
    rng = rng || AE.rng;
    var left = AD.UNICORNS.filter(function (u) { return state.unicorns.indexOf(u.id) < 0; });
    if (!left.length) return null;
    var u = left[Math.floor(rng() * left.length)];
    state.unicorns.push(u.id);
    return u;
  };

  AE.completeChapter = function (state) {
    state.chapters++;
    state.chapter = { done: 0, ok: 0 };
  };

  /* ---------- Save ---------- */
  var memory = null;
  AE.today = function () {
    var d = new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  };

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function fill(p) {
    if (p.v === 1) { /* earlier single-level save: keep candies, unicorns and item stats */
      var old = typeof p.level === 'number' ? p.level : 1;
      p.lv = { lit: clamp(old, 1, 3), num: clamp(old, 1, 5) };
      p.ok = { lit: 0, num: 0 }; p.miss = { lit: 0, num: 0 }; p.recent = [];
      delete p.level; delete p.streakOk; delete p.streakMiss;
      p.v = 2;
    }
    var base = AE.newState();
    Object.keys(base).forEach(function (k) {
      if (p[k] === undefined || (p[k] === null && k !== 'lang')) p[k] = base[k];
      else if (base[k] && typeof base[k] === 'object' && !Array.isArray(base[k]) && k !== 'items') {
        Object.keys(base[k]).forEach(function (kk) { if (p[k][kk] === undefined) p[k][kk] = base[k][kk]; });
      }
    });
    return p;
  }

  AE.save = function (state) {
    var s = JSON.stringify(state);
    memory = s;
    try { localStorage.setItem(AE.KEY, s); } catch (e) { /* storage blocked: memory only */ }
  };
  AE.load = function () {
    var s = null;
    try { s = localStorage.getItem(AE.KEY); } catch (e) { s = memory; }
    if (!s) return AE.newState();
    try {
      var p = JSON.parse(s);
      if (!p || (p.v !== 1 && p.v !== 2) || typeof p.items !== 'object') return AE.newState();
      return fill(p);
    } catch (e) { return AE.newState(); }
  };
  AE.exportJSON = function (state) { return JSON.stringify(state); };
  AE.importJSON = function (text) {
    var p = JSON.parse(text);
    if (!p || (p.v !== 1 && p.v !== 2) || typeof p.items !== 'object' || (typeof p.level !== 'number' && typeof p.lv !== 'object')) throw new Error('Not an Andrea backup');
    return fill(p);
  };
  AE.clearSave = function () { memory = null; try { localStorage.removeItem(AE.KEY); } catch (e) { /* ignore */ } };
})();
