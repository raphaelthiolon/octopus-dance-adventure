/* audio.js: generated waltz music, soft effects, browser voice. No files, works offline. */
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
      case 'box':
        for (n = 0; n < 8; n++) tone(hz(72 + [0, 4, 7, 12, 16, 19, 24, 28][n]), t + n * 0.07, 0.6, 'triangle', 0.1, sfxGain);
        break;
    }
  };

  /* ---------- Voice ---------- */
  var voices = [];
  function loadVoices() { try { voices = window.speechSynthesis.getVoices() || []; } catch (e) { voices = []; } }
  if ('speechSynthesis' in window) {
    loadVoices();
    try { window.speechSynthesis.addEventListener('voiceschanged', loadVoices); } catch (e) { /* ignore */ }
  }

  function pickVoice(lang) {
    var want = AD.SPEECH[lang].toLowerCase(), pre = lang;
    var exact = voices.filter(function (v) { return v.lang.toLowerCase().replace('_', '-') === want; });
    var near = voices.filter(function (v) { return v.lang.toLowerCase().indexOf(pre) === 0; });
    var list = exact.length ? exact : near;
    var nice = list.filter(function (v) { return /natural|google|online/i.test(v.name); });
    return (nice[0] || list[0]) || null;
  }

  AA.hasVoice = function (lang) { loadVoices(); return !!pickVoice(lang); };

  AA.stopSpeech = function () {
    try { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); } catch (e) { /* ignore */ }
  };

  /* Speak text. Resolves when done, or after a safety timeout. */
  AA.say = function (text, lang) {
    return new Promise(function (resolve) {
      var fallback = 500 + text.length * 70;
      if (!voiceOn || !text || !('speechSynthesis' in window)) { setTimeout(resolve, Math.min(fallback, 1200)); return; }
      var done = false;
      function finish() {
        if (done) return; done = true; speaking = Math.max(0, speaking - 1);
        if (ctx && musicOn && !speaking) musicGain.gain.setTargetAtTime(0.5, ctx.currentTime, 0.2);
        resolve();
      }
      try {
        window.speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(text);
        u.lang = AD.SPEECH[lang];
        var v = pickVoice(lang); if (v) u.voice = v;
        u.rate = 0.85; u.pitch = 1.15; u.volume = 1;
        u.onend = finish; u.onerror = finish;
        speaking++;
        if (ctx && musicOn) musicGain.gain.setTargetAtTime(0.18, ctx.currentTime, 0.05);
        window.speechSynthesis.speak(u);
        setTimeout(finish, fallback + 2500);
      } catch (e) { finish(); }
    });
  };

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { if (ctx && ctx.state === 'running') ctx.suspend(); AA.stopSpeech(); }
    else if (ctx) ctx.resume();
  });
})();
