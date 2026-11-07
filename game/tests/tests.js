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
  var cat = AE.catalog();

  test('190 addition facts, all exact, no duplicates', function () {
    var f = AE.additionFacts(), seen = {};
    eq(f.length, 190, 'count');
    f.forEach(function (x) {
      ok(x.a >= 1 && x.b >= 1 && x.sum <= 20, 'range ' + x.a + '+' + x.b);
      eq(x.sum, x.a + x.b, 'sum');
      var k = x.a + '+' + x.b; ok(!seen[k], 'dup ' + k); seen[k] = 1;
    });
  });

  test('every catalogue addition item is a valid fact and sums within 10', function () {
    var facts = {}; AE.additionFacts().forEach(function (x) { facts[x.a + '+' + x.b] = x.sum; });
    var n = 0;
    cat.filter(function (i) { return i.type === 'add'; }).forEach(function (i) {
      eq(facts[i.a + '+' + i.b], i.sum, i.id); ok(i.sum <= 10, 'phase 1 is within 10'); n++;
    });
    eq(n, 45, 'all 45 facts within 10');
  });

  test('number words: 21 per language, French 17 to 20 correct', function () {
    eq(AD.NUM.en.length, 21); eq(AD.NUM.fr.length, 21);
    eq(AD.NUM.fr[17], 'dix-sept'); eq(AD.NUM.fr[18], 'dix-huit'); eq(AD.NUM.fr[19], 'dix-neuf'); eq(AD.NUM.fr[20], 'vingt');
    eq(AD.NUM.en[13], 'thirteen'); eq(AD.NUM.en[20], 'twenty'); eq(AD.NUM.fr[1], 'un');
  });

  test('26 letters and letter names in both languages', function () {
    eq(AD.LETTERS.length, 26); eq(AD.LETTER_SPEECH.en.length, 26); eq(AD.LETTER_SPEECH.fr.length, 26);
    AD.LETTER_SPEECH.en.concat(AD.LETTER_SPEECH.fr).forEach(function (s) { ok(s && s.length, 'empty letter speech'); });
  });

  test('picture words start with their letter, both languages', function () {
    AD.LANGS.forEach(function (l) {
      AD.SET1.forEach(function (L) {
        var w = AD.WORDS[l][L];
        ok(w && w.w && w.e, 'missing ' + l + L);
        eq(AD.stripAccent(w.w).charAt(0).toUpperCase(), L, l + ' ' + w.w);
      });
    });
  });

  test('questions: answer exact, 3 unique choices, answer once, in range (all items, 100 seeds)', function () {
    for (var s = 1; s <= 100; s++) {
      var rng = seeded(s);
      cat.forEach(function (it) {
        var q = AE.makeQuestion(it, rng);
        eq(q.choices.length, 3, it.id);
        var u = {}; q.choices.forEach(function (c) { u[c] = 1; });
        eq(Object.keys(u).length, 3, 'unique ' + it.id);
        eq(q.choices.filter(function (c) { return c === q.answer; }).length, 1, 'answer once ' + it.id);
        switch (it.type) {
          case 'add': eq(q.answer, it.a + it.b, it.id); q.choices.forEach(function (c) { ok(c >= 2 && c <= 10, it.id); }); break;
          case 'make10': eq(q.answer + it.a, 10, it.id); q.choices.forEach(function (c) { ok(c >= 1 && c <= 9, it.id); }); break;
          case 'count': eq(q.answer, it.n, it.id); q.choices.forEach(function (c) { ok(c >= 1 && c <= 10, it.id); }); break;
          case 'letter': case 'first': eq(q.answer, it.letter, it.id); break;
          case 'case': eq(q.answer, it.letter.toLowerCase(), it.id); q.choices.forEach(function (c) { eq(c, c.toLowerCase()); }); break;
        }
      });
    }
  });

  test('prompts and answer lines exist in both languages, no "undefined"', function () {
    AD.LANGS.forEach(function (l) {
      cat.forEach(function (it) {
        var q = AE.makeQuestion(it, seeded(7));
        var p = AD.prompt(q, l);
        ok(p.say && p.cap, 'empty ' + l + it.id);
        ok(p.say.indexOf('undefined') < 0 && p.cap.indexOf('undefined') < 0, 'undefined ' + l + it.id);
        var a = AD.answerSay(q, l); ok(a && a.indexOf('undefined') < 0, 'answer ' + l + it.id);
      });
      ['hello', 'tryAgain', 'surprise', 'tapBox', 'allUnicorns', 'chapterDone'].forEach(function (k) { ok(AD.T[l][k], l + k); });
      ok(AD.T[l].praise.length >= 3 && AD.T[l].cliff.length >= 3);
      ok(AD.T[l].newUnicorn('Rosie').indexOf('Rosie') >= 0);
    });
    eq(Object.keys(AD.T.en).sort().join(), Object.keys(AD.T.fr).sort().join(), 'same keys');
  });

  function good(state, id) { return AE.record(state, id, { firstTry: true, revealed: false, ms: 1000, day: '2026-01-01' }); }
  function miss(state, id) { return AE.record(state, id, { firstTry: false, revealed: false, ms: 1000, day: '2026-01-01' }); }

  test('level goes up after 3 first-try correct in a row', function () {
    var s = AE.newState();
    eq(good(s, 'L:A').levelChange, 0); eq(good(s, 'L:B').levelChange, 0);
    eq(good(s, 'L:C').levelChange, 1); eq(s.level, 2);
  });

  test('level goes down after 2 misses in a row, never below 1', function () {
    var s = AE.newState(); s.level = 3;
    eq(miss(s, 'L:A').levelChange, 0); eq(miss(s, 'L:A').levelChange, -1); eq(s.level, 2);
    miss(s, 'L:A'); miss(s, 'L:A'); eq(s.level, 1);
    miss(s, 'L:A'); miss(s, 'L:A'); miss(s, 'L:A'); eq(s.level, 1, 'floor');
  });

  test('a correct answer breaks a miss streak, a miss breaks a good streak', function () {
    var s = AE.newState(); s.level = 3;
    miss(s, 'L:A'); good(s, 'L:A'); miss(s, 'L:A'); eq(s.level, 3, 'no drop');
    good(s, 'L:A'); good(s, 'L:A'); miss(s, 'L:A'); good(s, 'L:A'); good(s, 'L:A'); eq(s.level, 3, 'no rise');
  });

  test('level never above max', function () {
    var s = AE.newState();
    for (var i = 0; i < 60; i++) good(s, 'L:A');
    eq(s.level, AE.MAX_LEVEL);
  });

  test('slow hesitation counts as a miss', function () {
    var s = AE.newState(); s.level = 3;
    AE.record(s, 'L:A', { firstTry: true, revealed: false, ms: AE.HESITATION_MS + 1, day: 'd' });
    var r = AE.record(s, 'L:A', { firstTry: true, revealed: false, ms: AE.HESITATION_MS + 1, day: 'd' });
    eq(r.levelChange, -1);
  });

  test('candies: 2 first try, 1 retry, 0 revealed, +2 on streak of 3', function () {
    var s = AE.newState();
    eq(good(s, 'L:A').candies, 2); eq(miss(s, 'L:A').candies, 1);
    eq(AE.record(s, 'L:A', { firstTry: false, revealed: true, ms: 1000, day: 'd' }).candies, 0);
    var t = AE.newState(); good(t, 'L:A'); good(t, 'L:A'); eq(good(t, 'L:A').candies, 4);
    eq(t.candies, 8);
  });

  test('box moves up when fast and first try, down on miss, resets on reveal', function () {
    var s = AE.newState(); good(s, 'L:A'); eq(s.items['L:A'].box, 2);
    miss(s, 'L:A'); eq(s.items['L:A'].box, 1);
    good(s, 'L:A'); good(s, 'L:A'); eq(s.items['L:A'].box, 3);
    AE.record(s, 'L:A', { firstTry: false, revealed: true, ms: 1000, day: 'd' }); eq(s.items['L:A'].box, 1);
    AE.record(s, 'L:B', { firstTry: true, revealed: false, ms: 9000, day: 'd' }); eq(s.items['L:B'].box, 1, 'slow first try does not advance');
  });

  test('mastery needs fast first tries on 3 separate days', function () {
    var s = AE.newState();
    ['d1', 'd1', 'd2'].forEach(function (d) { AE.record(s, 'L:A', { firstTry: true, revealed: false, ms: 1000, day: d }); });
    ok(!AE.isMastered(s.items['L:A']));
    AE.record(s, 'L:A', { firstTry: true, revealed: false, ms: 1000, day: 'd3' });
    ok(AE.isMastered(s.items['L:A']));
  });

  test('pick: only items up to the level, never same item twice running', function () {
    var rng = seeded(3), s = AE.newState(), last = null;
    for (var lv = 1; lv <= AE.MAX_LEVEL; lv++) {
      s.level = lv; s.requeue = [];
      for (var i = 0; i < 300; i++) {
        var it = AE.pick(s, last, rng);
        ok(it.level <= lv, 'level ' + it.id); ok(it.id !== last, 'repeat ' + it.id);
        last = it.id;
      }
    }
  });

  test('pick: weak / mid / strong drawn about 60 / 30 / 10', function () {
    var rng = seeded(11), s = AE.newState(), items = AE.itemsUpTo(1);
    items.forEach(function (it, i) { AE.rec(s, it.id).box = i < 3 ? 1 : i < 6 ? 3 : 5; });
    var c = [0, 0, 0], last = null, N = 6000;
    for (var i = 0; i < N; i++) { var it = AE.pick(s, last, rng); last = it.id; c[AE.tierOf(AE.rec(s, it.id))]++; }
    ok(Math.abs(c[0] / N - 0.6) < 0.07, 'weak ' + c[0] / N);
    ok(Math.abs(c[1] / N - 0.3) < 0.07, 'mid ' + c[1] / N);
    ok(Math.abs(c[2] / N - 0.1) < 0.05, 'strong ' + c[2] / N);
  });

  test('revealed item comes back after the gap', function () {
    var s = AE.newState(), rng = seeded(5);
    AE.record(s, 'L:D', { firstTry: false, revealed: true, ms: 1000, day: 'd' });
    var ids = [];
    for (var i = 0; i < AE.REQUEUE_GAP; i++) { var it = AE.pick(s, ids[ids.length - 1] || null, rng); ids.push(it.id); good(s, it.id); }
    ok(ids.indexOf('L:D') >= 0, 'L:D must reappear within ' + AE.REQUEUE_GAP + ' tasks: ' + ids.join(','));  });

  test('unicorns: unique until all collected, then null', function () {
    var s = AE.newState(), rng = seeded(9), seen = {};
    for (var i = 0; i < AD.UNICORNS.length; i++) { var u = AE.awardUnicorn(s, rng); ok(u && !seen[u.id]); seen[u.id] = 1; }
    eq(AE.awardUnicorn(s, rng), null); eq(s.unicorns.length, AD.UNICORNS.length);
  });

  test('chapter length 10 and completeChapter resets progress', function () {
    eq(AE.CHAPTER_LEN, 10);
    var s = AE.newState(); s.chapter = { done: 10, ok: 7 }; AE.completeChapter(s);
    eq(s.chapter.done, 0); eq(s.chapters, 1);
  });

  test('save, load, backup round trip; bad data falls back safely', function () {
    var key = AE.KEY; AE.KEY = 'andrea_test_key';
    try {
      var s = AE.newState(); s.lang = 'fr'; s.candies = 12; good(s, 'L:A'); AE.save(s);
      var l = AE.load(); eq(l.lang, 'fr'); eq(l.candies, s.candies); eq(JSON.stringify(l.items), JSON.stringify(s.items));
      var b = AE.importJSON(AE.exportJSON(s)); eq(b.candies, s.candies);
      var threw = false; try { AE.importJSON('{"nope":1}'); } catch (e) { threw = true; } ok(threw, 'invalid import must throw');
      localStorage.setItem(AE.KEY, '{broken'); eq(AE.load().level, 1, 'corrupt json');
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
