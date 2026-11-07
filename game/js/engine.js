/* engine.js: items, questions, adaptive level, rewards, save. No audio, no UI. */
(function () {
  'use strict';
  var AE = (window.AE = {});

  AE.KEY = 'andrea_game_v1';
  AE.MAX_LEVEL = 5;
  AE.UP_AFTER = 3;          /* [GUESS] first-try correct in a row to go up */
  AE.DOWN_AFTER = 2;        /* [GUESS] misses in a row to go down */
  AE.HESITATION_MS = 15000; /* [GUESS] correct but slower than this counts as a miss */
  AE.FAST_MS = { letter: 4000, case: 4000, first: 5000, count: 6000, add: 7000, make10: 8000 }; /* [GUESS] */
  AE.MASTERY_DAYS = 3;      /* [GUESS] fast and first-try on this many separate days */
  AE.CHAPTER_LEN = 10;
  AE.REQUEUE_GAP = 3;
  AE.TIER_WEIGHTS = [0.6, 0.3, 0.1]; /* [GUESS] weak / mid / strong */
  AE.rng = Math.random;

  /* All ordered addition facts a+b with a,b >= 1 and sum <= 20: 190 facts. */
  AE.additionFacts = function () {
    var out = [];
    for (var a = 1; a <= 19; a++) for (var b = 1; a + b <= 20; b++) out.push({ a: a, b: b, sum: a + b });
    return out;
  };

  /* Item catalogue for phase 1. level = first level where the item appears. */
  AE.catalog = function () {
    var out = [], a, b, n;
    AD.SET1.forEach(function (L) { out.push({ id: 'L:' + L, type: 'letter', level: 1, letter: L }); });
    for (n = 1; n <= 10; n++) out.push({ id: 'N:' + n, type: 'count', level: n <= 5 ? 1 : 2, n: n });
    AD.SET1.forEach(function (L) { out.push({ id: 'C:' + L, type: 'case', level: 2, letter: L }); });
    AD.SET1.forEach(function (L) { out.push({ id: 'W:' + L, type: 'first', level: 3, letter: L }); });
    for (a = 1; a <= 9; a++) for (b = 1; a + b <= 10; b++) {
      out.push({ id: 'S:' + a + '+' + b, type: 'add', level: a + b <= 5 ? 3 : 4, a: a, b: b, sum: a + b });
    }
    for (a = 1; a <= 9; a++) out.push({ id: 'M:' + a, type: 'make10', level: 5, a: a });
    return out;
  };
  var CATALOG = AE.catalog();
  var BY_ID = {};
  CATALOG.forEach(function (it) { BY_ID[it.id] = it; });
  AE.itemById = function (id) { return BY_ID[id]; };
  AE.itemsUpTo = function (level) { return CATALOG.filter(function (it) { return it.level <= level; }); };

  function shuffle(arr, rng) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  AE.shuffle = shuffle;

  function numChoices(answer, lo, hi, n, rng) {
    var pool = [];
    for (var v = lo; v <= hi; v++) if (v !== answer) pool.push(v);
    pool = shuffle(pool, rng).sort(function (x, y) { return Math.abs(x - answer) - Math.abs(y - answer); }).slice(0, n - 1);
    return shuffle(pool.concat([answer]), rng);
  }

  function letterChoices(answer, n, rng) {
    var pool = shuffle(AD.SET1.filter(function (l) { return l !== answer; }), rng).slice(0, n - 1);
    return shuffle(pool.concat([answer]), rng);
  }

  /* Build a question for an item. choices are always 3. */
  AE.makeQuestion = function (item, rng) {
    rng = rng || AE.rng;
    var q = { item: item, type: item.type, skin: AD.SKINS[Math.floor(rng() * AD.SKINS.length)] };
    switch (item.type) {
      case 'letter':
        q.answer = item.letter; q.kind = 'letter'; q.choices = letterChoices(item.letter, 3, rng); break;
      case 'case':
        q.answer = item.letter.toLowerCase(); q.kind = 'lower';
        q.choices = letterChoices(item.letter, 3, rng).map(function (l) { return l.toLowerCase(); }); break;
      case 'first':
        q.answer = item.letter; q.kind = 'letter'; q.choices = letterChoices(item.letter, 3, rng); break;
      case 'count':
        q.answer = item.n; q.kind = 'num'; q.choices = numChoices(item.n, 1, 10, 3, rng); break;
      case 'add':
        q.answer = item.a + item.b; q.kind = 'num'; q.choices = numChoices(q.answer, 2, 10, 3, rng); break;
      case 'make10':
        q.answer = 10 - item.a; q.kind = 'num'; q.choices = numChoices(q.answer, 1, 9, 3, rng); break;
    }
    return q;
  };

  /* ---------- State ---------- */
  AE.newState = function () {
    return {
      v: 1, lang: null, music: true, voice: true, candies: 0, unicorns: [],
      level: 1, streakOk: 0, streakMiss: 0, items: {}, requeue: [],
      chapter: { done: 0, ok: 0 }, chapters: 0, taskCount: 0
    };
  };

  AE.rec = function (state, id) {
    if (!state.items[id]) state.items[id] = { n: 0, ok: 0, first: 0, box: 1, fastDays: [], lastMs: 0 };
    return state.items[id];
  };

  AE.isMastered = function (rec) { return !!rec && rec.fastDays.length >= AE.MASTERY_DAYS; };
  AE.tierOf = function (rec) { return rec.box <= 2 ? 0 : rec.box === 3 ? 1 : 2; };

  /* Record one finished task. o = {firstTry, revealed, ms, day}. Returns {levelChange, streak, candies}. */
  AE.record = function (state, id, o) {
    var item = BY_ID[id], r = AE.rec(state, id);
    var fast = o.ms <= AE.FAST_MS[item.type];
    r.n++; r.lastMs = o.ms;
    if (!o.revealed) r.ok++;
    if (o.firstTry) {
      r.first++;
      if (fast) {
        r.box = Math.min(5, r.box + 1);
        if (o.day && r.fastDays.indexOf(o.day) < 0) r.fastDays.push(o.day);
      }
    } else if (o.revealed) {
      r.box = 1;
    } else {
      r.box = Math.max(1, r.box - 1);
    }
    if (o.revealed) {
      state.requeue.push({ id: id, due: state.taskCount + AE.REQUEUE_GAP });
    }
    state.taskCount++;

    var good = o.firstTry && !o.revealed && o.ms <= AE.HESITATION_MS;
    var change = 0, streak = 0;
    if (good) { state.streakOk++; state.streakMiss = 0; } else { state.streakOk = 0; state.streakMiss++; }
    streak = state.streakOk;
    if (state.streakOk >= AE.UP_AFTER && state.level < AE.MAX_LEVEL) {
      state.level++; state.streakOk = 0; change = 1;
    } else if (state.streakMiss >= AE.DOWN_AFTER && state.level > 1) {
      state.level--; state.streakMiss = 0; change = -1;
    }
    var candies = o.revealed ? 0 : (o.firstTry ? 2 : 1);
    if (good && streak > 0 && streak % AE.UP_AFTER === 0) candies += 2;
    state.candies += candies;
    return { levelChange: change, streak: streak, candies: candies };
  };

  /* Pick the next item: requeued misses first, then a tiered weighted draw. */
  AE.pick = function (state, lastId, rng) {
    rng = rng || AE.rng;
    var pool = AE.itemsUpTo(state.level);
    for (var i = 0; i < state.requeue.length; i++) {
      var rq = state.requeue[i];
      if (rq.due <= state.taskCount && BY_ID[rq.id] && BY_ID[rq.id].level <= state.level && rq.id !== lastId) {
        state.requeue.splice(i, 1);
        return BY_ID[rq.id];
      }
    }
    state.requeue = state.requeue.filter(function (r) { return BY_ID[r.id] && BY_ID[r.id].level <= state.level; });
    var cand = pool.length > 1 ? pool.filter(function (it) { return it.id !== lastId; }) : pool;
    var tiers = [[], [], []];
    cand.forEach(function (it) { tiers[AE.tierOf(AE.rec(state, it.id))].push(it); });
    var r = rng(), w = AE.TIER_WEIGHTS, order;
    if (r < w[0]) order = [0, 1, 2]; else if (r < w[0] + w[1]) order = [1, 0, 2]; else order = [2, 1, 0];
    var chosen = null;
    for (var k = 0; k < 3; k++) if (tiers[order[k]].length) { chosen = tiers[order[k]]; break; }
    var total = 0;
    var weights = chosen.map(function (it) { var x = it.level === state.level ? 2 : 1; total += x; return x; });
    var t = rng() * total;
    for (var j = 0; j < chosen.length; j++) { t -= weights[j]; if (t < 0) return chosen[j]; }
    return chosen[chosen.length - 1];
  };

  /* Unicorn reward: a random uncollected unicorn, or null when she has them all. */
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

  function fill(parsed) {
    var base = AE.newState();
    Object.keys(base).forEach(function (k) { if (parsed[k] === undefined || parsed[k] === null && k !== 'lang') parsed[k] = base[k]; });
    return parsed;
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
      if (!p || p.v !== 1 || typeof p.items !== 'object') return AE.newState();
      return fill(p);
    } catch (e) { return AE.newState(); }
  };

  AE.exportJSON = function (state) { return JSON.stringify(state); };
  AE.importJSON = function (text) {
    var p = JSON.parse(text);
    if (!p || p.v !== 1 || typeof p.items !== 'object' || typeof p.level !== 'number') throw new Error('Not an Andrea backup');
    return fill(p);
  };
  AE.clearSave = function () { memory = null; try { localStorage.removeItem(AE.KEY); } catch (e) { /* ignore */ } };
})();
