/* Maths, content and level-rule tests. Open tests.html in a browser. */
(function () {
  'use strict';
  var results = [];
  function test(name, fn) {
    try { fn(); results.push({ name: name, ok: true }); }
    catch (e) { results.push({ name: name, ok: false, msg: e.message }); }
  }
  function eq(a, b, m) { if (a !== b) throw new Error((m || 'expected') + ': ' + a + ' !== ' + b); }
  function ok(c, m) { if (!c) throw new Error(m || 'assertion failed'); }
  function seeded(seed) {
    return function () { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; var t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  var LANGS = AD.LANGS;
  function strip(s) { return AD.stripAccent(s); }
  function uniq(a) { var o = {}; a.forEach(function (x) { o[x] = 1; }); return Object.keys(o).length === a.length; }

  /* ---------- Maths ---------- */
  test('addition facts: 190 within 20 and 435 within 30, all exact, no duplicates', function () {
    [[20, 190], [30, 435]].forEach(function (p) {
      var f = AE.additionFacts(p[0]), seen = {};
      eq(f.length, p[1], 'count for ' + p[0]);
      f.forEach(function (x) {
        ok(x.a >= 1 && x.b >= 1 && x.sum <= p[0], 'range ' + x.a + '+' + x.b);
        eq(x.sum, x.a + x.b, 'sum');
        var k = x.a + '+' + x.b; ok(!seen[k], 'dup ' + k); seen[k] = 1;
      });
    });
  });

  test('every addition item is a valid fact (sum up to 30); each addition level has items', function () {
    var valid = {}; AE.additionFacts(30).forEach(function (x) { valid[x.a + '+' + x.b] = x.sum; });
    var lv = {};
    LANGS.forEach(function (l) {
      AE.catalog(l).filter(function (i) { return i.type === 'add'; }).forEach(function (i) {
        eq(valid[i.a + '+' + i.b], i.sum, i.id); ok(i.sum <= 30, 'max 30'); lv[i.level] = 1;
      });
    });
    [3, 4, 6, 7, 8, 10].forEach(function (n) { ok(lv[n], 'no addition items at level ' + n); });
    eq(AE.catalog('en').filter(function (i) { return i.type === 'add' && i.sum <= 10; }).length, 45, 'all 45 ordered facts within 10');
  });

  test('every subtraction, gap, double, half, groups and place-value item is exact', function () {
    AE.catalog('en').forEach(function (i) {
      var q;
      if (!/^(sub|gap|make10|dbl|half|pv|mul)$/.test(i.type)) return;
      for (var s = 1; s <= 5; s++) {
        q = AE.makeQuestion(i, seeded(s), 'en');
        switch (i.type) {
          case 'sub': eq(q.answer, i.a - i.b, i.id); ok(q.answer >= 1, 'positive'); break;
          case 'gap': eq(q.answer + i.a, i.c, i.id); break;
          case 'make10': eq(q.answer + i.a, 10, i.id); break;
          case 'dbl': eq(q.answer, i.n * 2, i.id); break;
          case 'half': eq(q.answer * 2, i.n, i.id); break;
          case 'pv': eq(q.tens * 10 + q.ones, i.n, i.id); eq(q.answer, i.n, i.id); break;
          case 'mul': eq(q.answer, i.g * i.s, i.id); ok(q.answer <= 30, 'product up to 30'); break;
        }
      }
    });
  });

  test('number words: English and French 0 to 100, French rules correct', function () {
    LANGS.forEach(function (l) {
      var all = []; for (var n = 0; n <= 100; n++) { var w = AD.numWord(n, l); ok(w && w.indexOf('undefined') < 0, l + n); all.push(w); }
      ok(uniq(all), 'unique ' + l);
    });
    var fr = { 0: 'zéro', 1: 'un', 17: 'dix-sept', 18: 'dix-huit', 19: 'dix-neuf', 20: 'vingt', 21: 'vingt et un', 22: 'vingt-deux', 30: 'trente', 31: 'trente et un',
      42: 'quarante-deux', 60: 'soixante', 61: 'soixante et un', 70: 'soixante-dix', 71: 'soixante et onze', 77: 'soixante-dix-sept', 80: 'quatre-vingts', 81: 'quatre-vingt-un',
      90: 'quatre-vingt-dix', 91: 'quatre-vingt-onze', 99: 'quatre-vingt-dix-neuf', 100: 'cent' };
    Object.keys(fr).forEach(function (n) { eq(AD.numWord(+n, 'fr'), fr[n], 'fr ' + n); });
    var en = { 0: 'zero', 13: 'thirteen', 20: 'twenty', 21: 'twenty-one', 30: 'thirty', 45: 'forty-five', 99: 'ninety-nine', 100: 'one hundred' };
    Object.keys(en).forEach(function (n) { eq(AD.numWord(+n, 'en'), en[n], 'en ' + n); });
  });

  /* ---------- Letters and words ---------- */
  test('26 letters and letter names in both languages', function () {
    eq(AD.LETTERS.length, 26); eq(AD.LETTER_SPEECH.en.length, 26); eq(AD.LETTER_SPEECH.fr.length, 26);
    AD.LETTER_SPEECH.en.concat(AD.LETTER_SPEECH.fr).forEach(function (s) { ok(s && s.length, 'empty letter speech'); });
    eq(AD.SETS.reduce(function (n, s) { return n + s.length; }, 0), 26, 'sets cover the alphabet');
  });

  test('first-letter pictures: each word starts with its letter and has a picture, both languages', function () {
    ok(AD.FIRST_LETTERS.length >= 20, 'enough letters');
    LANGS.forEach(function (l) {
      AD.FIRST_LETTERS.forEach(function (L) {
        var w = AD.FIRST[l][L]; ok(w, 'missing ' + l + L);
        eq(strip(w).charAt(0).toUpperCase(), L, l + ' ' + w);
        ok(AD.PIC[w], 'no picture for ' + w);
      });
    });
  });

  test('spelling words: all have pictures, sensible lengths, no duplicates; names set', function () {
    LANGS.forEach(function (l) {
      ok(uniq(AD.WL[l]), 'duplicates in ' + l);
      AD.WL[l].forEach(function (w) { ok(AD.PIC[w], 'no picture for ' + w); ok(w.length >= 3 && w.length <= 6, 'length ' + w); });
      [3, 4, 5, 6].forEach(function (n) { ok(AD.WL[l].filter(function (w) { return w.length === n; }).length >= 6, l + ' needs words of length ' + n); });
    });
    eq(AD.NAMES.en.map(function (x) { return x.w; }).join(), 'Andrea,Daddy,Mummy');
    eq(AD.NAMES.fr.map(function (x) { return x.w; }).join(), 'Andrea,Papa,Maman');
  });

  /* ---------- Questions ---------- */
  test('questions: every item, both languages, 12 seeds: answers correct, 3 unique choices (2 for compare)', function () {
    LANGS.forEach(function (l) {
      for (var s = 1; s <= 12; s++) {
        var rng = seeded(s * 31);
        AE.catalog(l).forEach(function (it) {
          var q = AE.makeQuestion(it, rng, l), id = l + ' ' + it.id, k;
          if (it.type === 'build') {
            eq(q.tiles.slice().sort().join(''), q.letters.slice().sort().join(''), 'tiles ' + id); ok(/^[a-z]+$/i.test(it.word), 'plain word ' + id);
          } else {
            eq(q.choices.length, it.type === 'cmp' ? 2 : 3, id);
            ok(uniq(q.choices.map(String)), 'unique ' + id);
            eq(q.choices.filter(function (c) { return c === q.answer; }).length, 1, 'answer once ' + id);
          }
          switch (it.type) {
            case 'letter': case 'first': eq(q.answer, it.letter, id); break;
            case 'case': eq(q.answer, it.letter.toLowerCase(), id); q.choices.forEach(function (c) { eq(c, c.toLowerCase(), id); }); break;
            case 'count': eq(q.answer, it.n, id); q.choices.forEach(function (c) { ok(c >= 1, id); }); break;
            case 'add': eq(q.answer, q.a + q.b, id); eq(q.a + q.b, it.sum, id); q.choices.forEach(function (c) { ok(c >= 1, id); }); break;
            case 'sub': eq(q.answer, q.a - q.b, id); q.choices.forEach(function (c) { ok(c >= 1, id); }); break;
            case 'gap': case 'make10': case 'dbl': case 'half': case 'pv': case 'mul': q.choices.forEach(function (c) { ok(c >= 1, id + ' choice ' + c); }); break;
            case 'next':
              k = q.letters.indexOf(null); eq(q.gap, k, id);
              var full = q.letters.slice(); full[k] = q.answer;
              full.forEach(function (c, j) { eq(AD.LETTERS.indexOf(c), AD.LETTERS.indexOf(full[0]) + j, 'consecutive ' + id); }); break;
            case 'seq':
              k = q.seq.indexOf(null); eq(q.gap, k, id); ok(k >= 1 && k <= 3, 'gap inside');
              var t = q.seq.slice(); t[k] = q.answer;
              for (var j = 1; j < 5; j++) eq(t[j] - t[j - 1], it.step, 'step ' + id);
              t.forEach(function (x) { ok(x >= 0 && x <= 100, 'range ' + id); }); break;
            case 'cmp':
              eq(q.nums[0], it.x, id); ok(q.nums[1] !== q.nums[0] && q.nums[1] >= 1 && q.nums[1] <= 30, 'second number ' + id);
              eq(q.answer, q.mode === 'big' ? Math.max.apply(null, q.nums) : Math.min.apply(null, q.nums), id);
              eq(q.choices.slice().sort().join(), q.nums.slice().sort().join(), id); break;
            case 'odd':
              eq(q.choices.length, 3); ok(q.choices.indexOf(q.answer) >= 0);
              var ini = q.choices.filter(function (w) { return w !== q.answer; }).map(function (w) { return strip(w).charAt(0); });
              eq(ini[0], ini[1], 'two share a letter ' + id); ok(strip(q.answer).charAt(0) !== ini[0], 'odd differs ' + id);
              q.choices.forEach(function (w) { ok(AD.PIC[w], 'pic ' + w); ok(AD.WL[l].indexOf(w) >= 0, 'word list ' + w); }); break;
            case 'miss':
              var chars = q.word.split(''); chars[q.idx] = q.answer;
              eq(chars.join('').toLowerCase(), it.word.toLowerCase(), 'miss ' + id);
              ok(AD.isPlain(q.answer), 'never hide an accented letter ' + id);
              ok(!(it.name && q.idx === 0), 'name first letter stays ' + id); break;
            case 'word':
              ok(q.choices.indexOf(it.word) >= 0, id); q.choices.forEach(function (w) { ok(AD.PIC[w], 'pic ' + w); }); break;
          }
        });
      }
    });
  });

  test('prompts and reveal lines exist in both languages, no undefined or NaN', function () {
    LANGS.forEach(function (l) {
      AE.catalog(l).forEach(function (it) {
        var q = AE.makeQuestion(it, seeded(7), l);
        var p = AD.prompt(q, l);
        ok(p.say && p.cap, 'empty ' + l + it.id);
        ok(!/undefined|NaN|null/.test(p.say + p.cap), 'bad text ' + l + it.id + ': ' + p.say + ' | ' + p.cap);
        var a = AD.answerSay(q, l); ok(a && !/undefined|NaN|null/.test(a), 'answer ' + l + it.id + ': ' + a);
      });
      ['hello', 'tryAgain', 'surprise', 'tapBox', 'allUnicorns', 'chapterDone'].forEach(function (k) { ok(AD.T[l][k], l + k); });
      ok(AD.T[l].praise.length >= 3 && AD.T[l].cliff.length >= 3);
    });
    eq(Object.keys(AD.T.en).sort().join(), Object.keys(AD.T.fr).sort().join(), 'same keys');
  });

  test('stories and narrated sums read correctly in both languages', function () {
    var a = { type: 'add', a: 12, b: 5, story: true }, s = { type: 'sub', a: 14, b: 6, story: true };
    eq(AD.prompt(a, 'en').say, 'A unicorn has twelve candies. It finds five more. How many now?');
    eq(AD.prompt(a, 'fr').say, 'Une licorne a douze bonbons. Elle en trouve cinq de plus. Combien en a-t-elle maintenant ?');
    eq(AD.prompt(s, 'en').say, 'A unicorn has fourteen candies and eats six. How many are left?');
    eq(AD.prompt({ type: 'add', a: 21, b: 9 }, 'fr').say, 'vingt et un et neuf font... ?');
  });

  /* ---------- Levels and items ---------- */
  test('every level of both tracks introduces items; gating by level; both languages', function () {
    LANGS.forEach(function (l) {
      ['lit', 'num'].forEach(function (tr) {
        var prev = 0;
        for (var lv = 1; lv <= AE.MAX_LEVEL[tr]; lv++) {
          var n = AE.itemsUpTo(tr, lv, l).length;
          ok(n > prev, l + ' ' + tr + ' level ' + lv + ' adds nothing (' + n + ' vs ' + prev + ')');
          prev = n;
        }
        eq(AE.itemsUpTo(tr, AE.MAX_LEVEL[tr] + 1, l).length, prev, 'no items above max level');
      });
    });
    var first = AE.itemsUpTo('num', 1, 'en').map(function (i) { return i.id; }).join();
    eq(first, 'N:1,N:2,N:3,N:4,N:5', 'numbers start with counting to 5');
  });

  test('letters track has missing-letter, spelling, odd-one-out and word games; numbers reach 30, groups, doubles, halves', function () {
    var lit = AE.itemsUpTo('lit', 8, 'en').map(function (i) { return i.type; });
    ['letter', 'case', 'first', 'next', 'odd', 'miss', 'build', 'word'].forEach(function (t) { ok(lit.indexOf(t) >= 0, 'lit ' + t); });
    var nm = AE.itemsUpTo('num', 10, 'en').map(function (i) { return i.type; });
    ['count', 'seq', 'cmp', 'add', 'sub', 'gap', 'make10', 'dbl', 'half', 'pv', 'mul'].forEach(function (t) { ok(nm.indexOf(t) >= 0, 'num ' + t); });
    var maxSum = Math.max.apply(null, AE.itemsUpTo('num', 10, 'en').filter(function (i) { return i.type === 'add'; }).map(function (i) { return i.sum; }));
    eq(maxSum, 30);
    ['Andrea', 'Daddy', 'Mummy'].forEach(function (w) { ok(AE.itemById('X:' + w), 'name item ' + w); });
    ['Andrea', 'Papa', 'Maman'].forEach(function (w) { ok(AE.catalog('fr').some(function (i) { return i.id === 'X:' + w; }), 'fr name item ' + w); });
  });

  /* ---------- Adaptive rules ---------- */
  function good(state, id) { return AE.record(state, id, { firstTry: true, revealed: false, ms: 1000, day: '2026-01-01' }); }
  function miss(state, id) { return AE.record(state, id, { firstTry: false, revealed: false, ms: 1000, day: '2026-01-01' }); }

  test('level goes up after 3 first-try correct in a row, per track', function () {
    var s = AE.newState();
    eq(good(s, 'L:A').levelChange, 0); eq(good(s, 'L:B').levelChange, 0);
    eq(good(s, 'L:C').levelChange, 1); eq(s.lv.lit, 2); eq(s.lv.num, 1, 'numbers untouched');
    good(s, 'N:1'); good(s, 'N:2'); eq(good(s, 'N:3').levelChange, 1); eq(s.lv.num, 2); eq(s.lv.lit, 2);
  });

  test('level goes down after 2 misses in a row, never below 1; a good answer in the other track does not rescue it', function () {
    var s = AE.newState(); s.lv.num = 3; s.lv.lit = 3;
    eq(miss(s, 'N:1').levelChange, 0); good(s, 'L:A'); eq(miss(s, 'N:1').levelChange, -1); eq(s.lv.num, 2); eq(s.lv.lit, 3);
    miss(s, 'N:1'); miss(s, 'N:1'); eq(s.lv.num, 1);
    for (var i = 0; i < 5; i++) miss(s, 'N:1'); eq(s.lv.num, 1, 'floor');
  });

  test('a correct answer breaks a miss streak, a miss breaks a good streak', function () {
    var s = AE.newState(); s.lv.lit = 3;
    miss(s, 'L:A'); good(s, 'L:A'); miss(s, 'L:A'); eq(s.lv.lit, 3, 'no drop');
    good(s, 'L:A'); good(s, 'L:A'); miss(s, 'L:A'); good(s, 'L:A'); good(s, 'L:A'); eq(s.lv.lit, 3, 'no rise');
  });

  test('levels never above each track maximum', function () {
    var s = AE.newState();
    for (var i = 0; i < 80; i++) { good(s, 'L:A'); good(s, 'N:1'); }
    eq(s.lv.lit, AE.MAX_LEVEL.lit); eq(s.lv.num, AE.MAX_LEVEL.num);
  });

  test('slow hesitation counts as a miss', function () {
    var s = AE.newState(); s.lv.lit = 3;
    AE.record(s, 'L:A', { firstTry: true, revealed: false, ms: AE.HESITATION_MS + 1, day: 'd' });
    eq(AE.record(s, 'L:A', { firstTry: true, revealed: false, ms: AE.HESITATION_MS + 1, day: 'd' }).levelChange, -1);
  });

  test('candies: 2 first try, 1 retry, 0 revealed, +2 on a streak of 3', function () {
    var s = AE.newState();
    eq(good(s, 'L:A').candies, 2); eq(miss(s, 'L:A').candies, 1);
    eq(AE.record(s, 'L:A', { firstTry: false, revealed: true, ms: 1000, day: 'd' }).candies, 0);
    var t = AE.newState(); good(t, 'L:A'); good(t, 'L:A'); eq(good(t, 'L:A').candies, 4); eq(t.candies, 8);
  });

  test('box moves up when fast and first try, down on miss, resets on reveal; mastery needs 3 days', function () {
    var s = AE.newState(); good(s, 'L:A'); eq(s.items['L:A'].box, 2);
    miss(s, 'L:A'); eq(s.items['L:A'].box, 1);
    AE.record(s, 'L:A', { firstTry: false, revealed: true, ms: 1000, day: 'd' }); eq(s.items['L:A'].box, 1);
    AE.record(s, 'L:B', { firstTry: true, revealed: false, ms: 9000, day: 'd' }); eq(s.items['L:B'].box, 1, 'slow first try does not advance');
    var m = AE.newState();
    ['d1', 'd1', 'd2'].forEach(function (d) { AE.record(m, 'L:A', { firstTry: true, revealed: false, ms: 1000, day: d }); });
    ok(!AE.isMastered(m.items['L:A']));
    AE.record(m, 'L:A', { firstTry: true, revealed: false, ms: 1000, day: 'd3' }); ok(AE.isMastered(m.items['L:A']));
  });

  test('pick: respects track level and language, never the same item twice running', function () {
    LANGS.forEach(function (l) {
      var rng = seeded(3), s = AE.newState(), last = null;
      for (var lv = 1; lv <= 10; lv++) {
        s.lv.lit = Math.min(lv, 8); s.lv.num = lv; s.requeue = [];
        for (var i = 0; i < 200; i++) {
          var it = AE.pick(s, last, rng, l);
          ok(it.level <= s.lv[it.track], 'level ' + it.id); ok(it.id !== last, 'repeat ' + it.id);
          ok(AE.catalog(l).some(function (x) { return x.id === it.id; }), 'in language ' + it.id);
          last = it.id;
        }
      }
    });
  });

  test('pick: letters and numbers alternate, never three of one kind in a row, about half each', function () {
    var rng = seeded(21), s = AE.newState(), seq = [], last = null, lit = 0, N = 1000;
    for (var i = 0; i < N; i++) { var it = AE.pick(s, last, rng, 'en'); last = it.id; seq.push(it.track); if (it.track === 'lit') lit++; }
    for (var j = 2; j < N; j++) ok(!(seq[j] === seq[j - 1] && seq[j] === seq[j - 2]), 'three in a row at ' + j);
    ok(Math.abs(lit / N - 0.5) < 0.08, 'share of letters ' + lit / N);
  });

  test('pick: weak / mid / strong drawn about 60 / 30 / 10 within a track', function () {
    var rng = seeded(11), s = AE.newState();
    AE.itemsUpTo('lit', 1, 'en').concat(AE.itemsUpTo('num', 1, 'en')).forEach(function (it, i) { AE.rec(s, it.id).box = i % 10 < 3 ? 1 : i % 10 < 6 ? 3 : 5; });
    var c = [0, 0, 0], last = null, N = 8000;
    for (var i = 0; i < N; i++) { var it = AE.pick(s, last, rng, 'en'); last = it.id; c[AE.tierOf(AE.rec(s, it.id))]++; }
    ok(Math.abs(c[0] / N - 0.6) < 0.08, 'weak ' + c[0] / N);
    ok(Math.abs(c[1] / N - 0.3) < 0.08, 'mid ' + c[1] / N);
    ok(Math.abs(c[2] / N - 0.1) < 0.06, 'strong ' + c[2] / N);
  });

  test('revealed item comes back within the gap, in its own language', function () {
    var s = AE.newState(), rng = seeded(5), ids = [];
    AE.record(s, 'L:D', { firstTry: false, revealed: true, ms: 1000, day: 'd', lang: 'en' });
    for (var i = 0; i < AE.REQUEUE_GAP + 1; i++) { var it = AE.pick(s, ids[ids.length - 1] || null, rng, 'en'); ids.push(it.id); good(s, it.id); }
    ok(ids.indexOf('L:D') >= 0, 'L:D must reappear: ' + ids.join(','));
  });

  test('unicorns unique until all collected; chapter resets', function () {
    var s = AE.newState(), rng = seeded(9), seen = {};
    for (var i = 0; i < AD.UNICORNS.length; i++) { var u = AE.awardUnicorn(s, rng); ok(u && !seen[u.id]); seen[u.id] = 1; }
    eq(AE.awardUnicorn(s, rng), null);
    eq(AE.CHAPTER_LEN, 10); s.chapter = { done: 10, ok: 7 }; AE.completeChapter(s); eq(s.chapter.done, 0); eq(s.chapters, 1);
  });

  test('save, load, backup round trip; earlier save migrates; bad data falls back safely', function () {
    var key = AE.KEY; AE.KEY = 'andrea_test_key';
    try {
      var s = AE.newState(); s.lang = 'fr'; s.candies = 12; good(s, 'L:A'); AE.save(s);
      var l = AE.load(); eq(l.lang, 'fr'); eq(l.candies, s.candies); eq(JSON.stringify(l.items), JSON.stringify(s.items)); eq(l.v, 2);
      eq(AE.importJSON(AE.exportJSON(s)).candies, s.candies);
      var old = { v: 1, lang: 'en', music: true, voice: true, candies: 30, unicorns: ['rosie'], level: 4, streakOk: 1, streakMiss: 0, items: { 'L:A': { n: 3, ok: 3, first: 3, box: 3, fastDays: [], lastMs: 900 } }, requeue: [], chapter: { done: 4, ok: 3 }, chapters: 2, taskCount: 9 };
      localStorage.setItem(AE.KEY, JSON.stringify(old));
      var m = AE.load();
      eq(m.v, 2); eq(m.candies, 30); eq(m.unicorns[0], 'rosie'); eq(m.lv.num, 4); eq(m.lv.lit, 3); eq(m.chapter.done, 4); ok(m.voiceCfg && m.voiceCfg.pitch > 1, 'voice settings added');
      var threw = false; try { AE.importJSON('{"nope":1}'); } catch (e) { threw = true; } ok(threw, 'invalid import must throw');
      localStorage.setItem(AE.KEY, '{broken'); eq(AE.load().lv.lit, 1, 'corrupt json');
    } finally { try { localStorage.removeItem('andrea_test_key'); } catch (e) { /* ignore */ } AE.KEY = key; }
  });

  /* ---------- Render ---------- */
  var out = document.getElementById('out'), pass = 0;
  results.forEach(function (r) {
    if (r.ok) pass++;
    var d = document.createElement('div');
    d.className = r.ok ? 'p' : 'f';
    d.textContent = (r.ok ? 'PASS  ' : 'FAIL  ') + r.name + (r.ok ? '' : '  -> ' + r.msg);
    out.appendChild(d);
  });
  var sum = document.getElementById('sum');
  sum.textContent = pass + ' / ' + results.length + ' tests pass';
  sum.className = pass === results.length ? 'p' : 'f';
  window.TEST_RESULT = { pass: pass, total: results.length, failures: results.filter(function (r) { return !r.ok; }) };
})();
