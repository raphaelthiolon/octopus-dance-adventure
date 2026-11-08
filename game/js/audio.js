/* audio.js: generated waltz music, soft effects, voice (recorded clips first, then the best female browser voice). */
(function () {
  'use strict';
  var AA = (window.AA = {});
  var ctx = null, master = null, musicGain = null, sfxGain = null;
  var musicOn = true, voiceOn = true, running = false, timer = null;
  var nextTime = 0, barIndex = 0, beatIndex = 0, speaking = 0;
  var BEAT = 0.62;

  /* 8-bar waltz in C, melody (midi per beat) and bass roots. */
  var MELODY = [[64, 67, 72], [71, 67, 64], [62, 65, 69], [67, 64, 60], [64, 67, 72], [74, 71, 67], [65, 69, 74], [72, 0, 0]];
  var BASS = [48, 48, 50, 48, 48, 43, 50, 48];

  function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  AA.unlock = function () {
    if (!ctx) {
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return;
      ctx = new C();
      master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
      musicGain = ctx.createGain(); musicGain.gain.value = musicOn ? 0.5 : 0; musicGain.connect(master);
      sfxGain = ctx.createGain(); sfxGain.gain.value = musicOn ? 0.8 : 0; sfxGain.connect(master);
    }
    if (ctx.state === 'suspended') ctx.resume();
  };

  function tone(freq, t0, dur, type, vol, dest, attack) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    attack = attack || 0.015;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(dest);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }

  function scheduleBeat(t) {
    var m = MELODY[barIndex][beatIndex];
    if (m) {
      var len = (barIndex === 7 ? 3 : 1) * BEAT;
      tone(hz(m), t, len * 0.95, 'sine', 0.13, musicGain, 0.02);
      tone(hz(m + 12), t, len * 0.5, 'sine', 0.035, musicGain, 0.02);
    }
    var root = BASS[barIndex];
    if (beatIndex === 0) tone(hz(root), t, BEAT * 1.3, 'triangle', 0.14, musicGain, 0.03);
    else {
      tone(hz(root + 12), t, BEAT * 0.5, 'triangle', 0.04, musicGain, 0.02);
      tone(hz(root + 19), t, BEAT * 0.5, 'triangle', 0.03, musicGain, 0.02);
    }
    beatIndex++;
    if (beatIndex === 3) { beatIndex = 0; barIndex = (barIndex + 1) % 8; }
  }

  function tick() {
    if (!ctx || !running) return;
    if (nextTime < ctx.currentTime) nextTime = ctx.currentTime + 0.05;
    while (nextTime < ctx.currentTime + 0.3) { scheduleBeat(nextTime); nextTime += BEAT; }
  }

  AA.startMusic = function () {
    if (!ctx || running) return;
    running = true; nextTime = ctx.currentTime + 0.1;
    timer = setInterval(tick, 90);
  };
  AA.stopMusic = function () { running = false; if (timer) { clearInterval(timer); timer = null; } };

  AA.setMusic = function (on) {
    musicOn = !!on;
    if (ctx) {
      musicGain.gain.setTargetAtTime(musicOn ? (speaking ? 0.18 : 0.5) : 0, ctx.currentTime, 0.1);
      sfxGain.gain.setTargetAtTime(musicOn ? 0.8 : 0, ctx.currentTime, 0.05);
    }
  };
  AA.isMusic = function () { return musicOn; };
  AA.setVoice = function (on) { voiceOn = !!on; if (!on) AA.stopSpeech(); };
  AA.isVoice = function () { return voiceOn; };

  /* Soft effects. Never harsh. */
  AA.sfx = function (name) {
    if (!ctx || !musicOn) return;
    var t = ctx.currentTime + 0.01, n;
    switch (name) {
      case 'tap': tone(660, t, 0.12, 'sine', 0.12, sfxGain); break;
      case 'good': [523, 659, 784].forEach(function (f, i) { tone(f, t + i * 0.09, 0.35, 'triangle', 0.14, sfxGain); }); break;
      case 'oops': tone(392, t, 0.28, 'sine', 0.09, sfxGain, 0.04); tone(349, t + 0.18, 0.35, 'sine', 0.08, sfxGain, 0.04); break;
      case 'reward':
        [523, 659, 784, 988, 1175, 1568].forEach(function (f, i) { tone(f, t + i * 0.08, 0.5, 'triangle', 0.11, sfxGain); });
        break;
      case 'pop': tone(880, t, 0.08, 'sine', 0.12, sfxGain); tone(1320, t + 0.04, 0.1, 'sine', 0.08, sfxGain); break;
      case 'place': tone(740, t, 0.1, 'triangle', 0.12, sfxGain); tone(988, t + 0.06, 0.14, 'triangle', 0.1, sfxGain); break;
      case 'box':
        for (n = 0; n < 8; n++) tone(hz(72 + [0, 4, 7, 12, 16, 19, 24, 28][n]), t + n * 0.07, 0.6, 'triangle', 0.1, sfxGain);
        break;
    }
  };

  /* ---------- Voice ---------- */
  var cfg = { pitch: 1.4, rate: 1.0, names: { en: null, fr: null } };
  var voices = [];
  var manifest = null; /* {en:[keys], fr:[keys]} of recorded clips, optional */
  var clip = null;

  var FEMALE = {
    en: /aria|jenny|\bana\b|sonia|libby|maisie|\bmia\b|hazel|susan|zira|samantha|karen|moira|tessa|serena|kate|fiona|victoria|allison|\bava\b|joanna|\bivy\b|kendra|kimberly|salli|emma|amy|nicole|olivia|female/i,
    fr: /denise|eloise|hortense|julie|am[eé]lie|audrey|marie|aur[eé]lie|chlo[eé]|l[eé]a\b|c[eé]line|sylvie|brigitte|vivienne|female|femme/i
  };
  var CHILD = /\bana\b|maisie|eloise|\bivy\b|child|enfant/i;
  var MALE = /(^|[^a-z])male|guy|ryan|george|\bmark\b|\bpaul\b|thomas|henri|claude|antoine|daniel|david|\bfred\b|jean-|martin|rishi|james|oliver|\breed\b|rocko|eddy|bruce|homme/i;

  function loadVoices() { try { voices = window.speechSynthesis.getVoices() || []; } catch (e) { voices = []; } }
  if ('speechSynthesis' in window) {
    loadVoices();
    try { window.speechSynthesis.addEventListener('voiceschanged', loadVoices); } catch (e) { /* ignore */ }
  }

  function langMatch(v, lang) { return v.lang.toLowerCase().replace('_', '-').indexOf(lang) === 0; }
  function score(v, lang) {
    var s = 0, n = v.name;
    if (v.lang.toLowerCase().replace('_', '-') === AD.SPEECH[lang].toLowerCase()) s += 20;
    if (MALE.test(n)) s -= 500;
    if (FEMALE[lang].test(n)) s += 100;
    if (CHILD.test(n)) s += 40;
    if (/natural|neural|online/i.test(n)) s += 60;
    if (/google/i.test(n)) s += 10;
    return s;
  }
  /* Available voices for a language, best first. */
  AA.voicesFor = function (lang) {
    loadVoices();
    return voices.filter(function (v) { return langMatch(v, lang); })
      .map(function (v) { return { name: v.name, lang: v.lang, score: score(v, lang), voice: v }; })
      .sort(function (a, b) { return b.score - a.score; });
  };
  function pickVoice(lang) {
    var list = AA.voicesFor(lang);
    var chosen = cfg.names[lang] && list.filter(function (x) { return x.name === cfg.names[lang]; })[0];
    return (chosen || list[0] || {}).voice || null;
  }
  AA.hasVoice = function (lang) { return !!pickVoice(lang); };
  AA.voiceName = function (lang) { var v = pickVoice(lang); return v ? v.name : null; };
  AA.config = function (c) {
    if (!c) return cfg;
    if (typeof c.pitch === 'number') cfg.pitch = c.pitch;
    if (typeof c.rate === 'number') cfg.rate = c.rate;
    if (c.en !== undefined) cfg.names.en = c.en;
    if (c.fr !== undefined) cfg.names.fr = c.fr;
    return cfg;
  };

  AA.slug = function (text) {
    return AD.stripAccent(text.toLowerCase()).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
  };

  /* Optional recorded clips: audio/voice/manifest.json lists {en:[slugs], fr:[slugs]}. */
  AA.loadManifest = function () {
    try {
      fetch('audio/voice/manifest.json').then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { manifest = j; }).catch(function () { manifest = null; });
    } catch (e) { manifest = null; }
  };

  AA.stopSpeech = function () {
    try { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); } catch (e) { /* ignore */ }
    if (clip) { try { clip.pause(); } catch (e) { /* ignore */ } clip = null; }
  };

  function duck(on) {
    if (!ctx || !musicOn) return;
    musicGain.gain.setTargetAtTime(on ? 0.18 : 0.5, ctx.currentTime, on ? 0.05 : 0.2);
  }

  function speakTTS(text, lang, done) {
    if (!('speechSynthesis' in window)) { setTimeout(done, Math.min(500 + text.length * 70, 1200)); return; }
    try {
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = AD.SPEECH[lang];
      var v = pickVoice(lang); if (v) u.voice = v;
      u.rate = cfg.rate; u.pitch = cfg.pitch; u.volume = 1;
      u.onend = done; u.onerror = done;
      window.speechSynthesis.speak(u);
      setTimeout(done, 2500 + text.length * 90);
    } catch (e) { done(); }
  }

  /* Speak text. Resolves when done, or after a safety timeout. */
  AA.say = function (text, lang) {
    return new Promise(function (resolve) {
      if (!voiceOn || !text) { setTimeout(resolve, Math.min(500 + (text || '').length * 70, 1200)); return; }
      var finished = false;
      function done() {
        if (finished) return; finished = true; speaking = Math.max(0, speaking - 1);
        if (!speaking) duck(false);
        resolve();
      }
      speaking++; duck(true);
      var key = AA.slug(text);
      if (manifest && manifest[lang] && manifest[lang].indexOf(key) >= 0) {
        try {
          AA.stopSpeech();
          clip = new Audio('audio/voice/' + lang + '/' + key + '.mp3');
          clip.onended = done;
          clip.onerror = function () { clip = null; speakTTS(text, lang, done); };
          var p = clip.play(); if (p && p.catch) p.catch(function () { clip = null; speakTTS(text, lang, done); });
          setTimeout(done, 6000);
          return;
        } catch (e) { /* fall through to the browser voice */ }
      }
      speakTTS(text, lang, done);
    });
  };

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { if (ctx && ctx.state === 'running') ctx.suspend(); AA.stopSpeech(); }
    else if (ctx) ctx.resume();
  });
})();
