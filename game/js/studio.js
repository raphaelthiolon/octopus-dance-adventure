/* studio.js: record the game's phrases in the browser, trim, convert to WAV, export a zip. */
(function () {
  'use strict';
  var SR = 16000;
  var db = null, stream = null, recorder = null, chunks = [], live = null, meterTimer = null, analyser = null, actx = null;
  var clips = {}; /* "lang/slug" -> Blob (WAV) */
  var $ = function (id) { return document.getElementById(id); };
  var langSel = $('lang'), tierSel = $('tier'), listEl = $('list'), msgEl = $('msg');

  /* ---------- WAV and ZIP (no libraries) ---------- */
  function wavBlob(samples) {
    var n = samples.length, buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf), i;
    function str(o, s) { for (var k = 0; k < s.length; k++) v.setUint8(o + k, s.charCodeAt(k)); }
    str(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); str(8, 'WAVE'); str(12, 'fmt ');
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, SR, true);
    v.setUint32(28, SR * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); str(36, 'data'); v.setUint32(40, n * 2, true);
    for (i = 0; i < n; i++) { var s = Math.max(-1, Math.min(1, samples[i])); v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true); }
    return new Blob([buf], { type: 'audio/wav' });
  }

  var CRC = (function () { var t = [], c, n, k; for (n = 0; n < 256; n++) { c = n; for (k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(u8) { var c = 0xffffffff; for (var i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
  /* files: [{name, data: Uint8Array}] -> Blob. Stored, not compressed. */
  function makeZip(files) {
    var enc = new TextEncoder(), parts = [], central = [], offset = 0;
    files.forEach(function (f) {
      var name = enc.encode(f.name), crc = crc32(f.data), size = f.data.length;
      var lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
      lh.setUint16(10, 0, true); lh.setUint16(12, 0x21, true); lh.setUint32(14, crc, true); lh.setUint32(18, size, true); lh.setUint32(22, size, true);
      lh.setUint16(26, name.length, true); lh.setUint16(28, 0, true);
      parts.push(lh.buffer, name, f.data);
      var ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true);
      ch.setUint16(12, 0, true); ch.setUint16(14, 0x21, true); ch.setUint32(16, crc, true); ch.setUint32(20, size, true); ch.setUint32(24, size, true);
      ch.setUint16(28, name.length, true); ch.setUint16(30, 0, true); ch.setUint16(32, 0, true); ch.setUint16(34, 0, true); ch.setUint16(36, 0, true);
      ch.setUint32(38, 0, true); ch.setUint32(42, offset, true);
      central.push(ch.buffer, name);
      offset += 30 + name.length + size;
    });
    var csize = central.reduce(function (n, p) { return n + (p.byteLength !== undefined ? p.byteLength : p.length); }, 0);
    var end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(4, 0, true); end.setUint16(6, 0, true); end.setUint16(8, files.length, true);
    end.setUint16(10, files.length, true); end.setUint32(12, csize, true); end.setUint32(16, offset, true); end.setUint16(20, 0, true);
    return new Blob(parts.concat(central, [end.buffer]), { type: 'application/zip' });
  }
  window.StudioTools = { wavBlob: wavBlob, crc32: crc32, makeZip: makeZip };

  /* ---------- Storage (IndexedDB, so clips survive a reload) ---------- */
  function openDB() {
    return new Promise(function (res) {
      try {
        var r = indexedDB.open('andrea-voice', 1);
        r.onupgradeneeded = function () { r.result.createObjectStore('clips'); };
        r.onsuccess = function () { db = r.result; res(); };
        r.onerror = function () { res(); };
      } catch (e) { res(); }
    });
  }
  function loadAll() {
    return new Promise(function (res) {
      if (!db) return res();
      var tx = db.transaction('clips', 'readonly'), st = tx.objectStore('clips'), req = st.openCursor();
      req.onsuccess = function () { var c = req.result; if (c) { clips[c.key] = c.value; c.continue(); } else res(); };
      req.onerror = function () { res(); };
    });
  }
  function putClip(key, blob) { clips[key] = blob; if (db) db.transaction('clips', 'readwrite').objectStore('clips').put(blob, key); }
  function delClip(key) { delete clips[key]; if (db) db.transaction('clips', 'readwrite').objectStore('clips').delete(key); }

  /* ---------- Audio processing ---------- */
  function decode(ab) {
    return new Promise(function (res, rej) {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      var p = actx.decodeAudioData(ab, res, rej);
      if (p && p.then) p.then(res, rej);
    });
  }
  async function toWav(blob) {
    var ab = await new Promise(function (res, rej) { var fr = new FileReader(); fr.onload = function () { res(fr.result); }; fr.onerror = rej; fr.readAsArrayBuffer(blob); });
    var buf = await decode(ab);
    var oc = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, Math.max(1, Math.ceil(buf.duration * SR)), SR);
    var src = oc.createBufferSource(); src.buffer = buf; src.connect(oc.destination); src.start();
    var out = await oc.startRendering();
    var d = out.getChannelData(0), n = d.length, thr = 0.02, a = 0, b = n - 1, i, peak = 0;
    while (a < n && Math.abs(d[a]) < thr) a++;
    while (b > a && Math.abs(d[b]) < thr) b--;
    if (a >= b) throw new Error('quiet');
    var pad = Math.round(0.08 * SR);
    a = Math.max(0, a - pad); b = Math.min(n - 1, b + pad);
    var s = d.slice(a, b + 1);
    for (i = 0; i < s.length; i++) peak = Math.max(peak, Math.abs(s[i]));
    var gain = peak > 0.05 ? 0.9 / peak : 1;
    for (i = 0; i < s.length; i++) s[i] *= gain;
    return wavBlob(s);
  }

  /* ---------- Recording ---------- */
  function say(m) { msgEl.textContent = m || ''; }
  async function ensureStream() {
    if (stream) return stream;
    stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } });
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    var node = actx.createMediaStreamSource(stream); analyser = actx.createAnalyser(); analyser.fftSize = 512; node.connect(analyser);
    return stream;
  }
  function meter(on) {
    clearInterval(meterTimer); $('level').style.width = '0';
    if (!on || !analyser) return;
    var data = new Uint8Array(analyser.fftSize);
    meterTimer = setInterval(function () {
      analyser.getByteTimeDomainData(data);
      var m = 0; for (var i = 0; i < data.length; i++) m = Math.max(m, Math.abs(data[i] - 128));
      $('level').style.width = Math.min(100, m / 90 * 100) + '%';
    }, 60);
  }
  async function start(item) {
    if (recorder) return;
    try { await ensureStream(); } catch (e) { say('The microphone is blocked. Allow it in the browser address bar, then try again. (Use https or localhost.)'); return; }
    var types = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus'], mt = '';
    for (var i = 0; i < types.length; i++) if (window.MediaRecorder && MediaRecorder.isTypeSupported(types[i])) { mt = types[i]; break; }
    chunks = []; recorder = mt ? new MediaRecorder(stream, { mimeType: mt }) : new MediaRecorder(stream);
    live = item;
    recorder.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
    recorder.onstop = async function () {
      var it = live, blob = new Blob(chunks, { type: recorder.mimeType || mt });
      recorder = null; live = null; meter(false);
      try { putClip(it.lang + '/' + it.key, await toWav(blob)); say('Saved: ' + it.text); }
      catch (e) { say(e.message === 'quiet' ? 'That was too quiet. Move closer and record it again.' : 'Could not read that recording. Try again.'); }
      render();
    };
    recorder.start(); meter(true); say('Recording… say: ' + item.text); render();
  }
  function stop() { if (recorder && recorder.state !== 'inactive') setTimeout(function () { recorder.stop(); }, 250); }

  /* ---------- Screen ---------- */
  var player = null;
  function play(key) {
    if (player) { try { player.pause(); } catch (e) { /* ignore */ } }
    player = new Audio(URL.createObjectURL(clips[key])); player.play();
  }
  function items() {
    var lang = langSel.value, tier = +tierSel.value;
    return AD.recordingList(lang).filter(function (x) { return x.tier <= tier; }).map(function (x) { return { key: x.key, text: x.text, group: x.group, tier: x.tier, lang: lang }; });
  }
  function render() {
    var list = items(), done = list.filter(function (x) { return clips[x.lang + '/' + x.key]; }).length, last = null;
    $('count').textContent = done + ' of ' + list.length + ' recorded';
    listEl.innerHTML = '';
    list.forEach(function (it) {
      var id = it.lang + '/' + it.key, has = !!clips[id], isLive = live && live.key === it.key && live.lang === it.lang;
      if (it.group !== last) { var g = document.createElement('div'); g.className = 'group'; g.textContent = it.group; listEl.appendChild(g); last = it.group; }
      var row = document.createElement('div'); row.className = 'row' + (has ? ' done' : '') + (isLive ? ' live' : ''); row.id = 'row-' + id.replace('/', '-');
      var tick = document.createElement('div'); tick.className = 'tick'; tick.textContent = has ? '✓' : '';
      var t = document.createElement('div'); t.className = 't'; t.textContent = it.text;
      var k = document.createElement('span'); k.className = 'k'; k.textContent = id + '.wav'; t.appendChild(k);
      row.appendChild(tick); row.appendChild(t);
      var rb = document.createElement('button');
      rb.className = isLive ? 'stop' : 'rec'; rb.textContent = isLive ? 'Stop' : (has ? 'Redo' : 'Record'); rb.disabled = !!recorder && !isLive;
      rb.onclick = function () { if (isLive) stop(); else start(it); };
      row.appendChild(rb);
      if (has) {
        var pb = document.createElement('button'); pb.textContent = 'Play'; pb.onclick = function () { play(id); }; row.appendChild(pb);
        var db2 = document.createElement('button'); db2.textContent = '✕'; db2.setAttribute('aria-label', 'Delete'); db2.disabled = !!recorder;
        db2.onclick = function () { delClip(id); render(); }; row.appendChild(db2);
      }
      listEl.appendChild(row);
    });
    $('next').disabled = !!recorder || done === list.length;
  }

  function downloadZip() {
    var files = [], man = { en: [], fr: [] }, keys = Object.keys(clips);
    if (!keys.length) { say('Nothing recorded yet.'); return; }
    Promise.all(keys.map(function (k) {
      return new Promise(function (res) { var fr = new FileReader(); fr.onload = function () { files.push({ name: 'audio/voice/' + k + '.wav', data: new Uint8Array(fr.result) }); res(); }; fr.readAsArrayBuffer(clips[k]); });
    })).then(function () {
      keys.forEach(function (k) { var p = k.split('/'); if (man[p[0]]) man[p[0]].push(p[1]); });
      files.push({ name: 'audio/voice/manifest.json', data: new TextEncoder().encode(JSON.stringify(man, null, 1)) });
      var url = URL.createObjectURL(makeZip(files)), a = document.createElement('a');
      a.href = url; a.download = 'andrea-voice-clips.zip'; document.body.appendChild(a); a.click(); a.remove();
      say('Downloaded ' + keys.length + ' clips. Unzip inside the game folder.');
    });
  }

  if (!langSel) return; /* loaded by the test page without the studio screen */
  AD.LANGS.forEach(function (l) { var o = document.createElement('option'); o.value = l; o.textContent = AD.LANG_NAME[l]; langSel.appendChild(o); });
  langSel.onchange = tierSel.onchange = render;
  $('zip').onclick = downloadZip;
  $('next').onclick = function () {
    var it = items().filter(function (x) { return !clips[x.lang + '/' + x.key]; })[0];
    if (!it) return;
    var row = $('row-' + (it.lang + '/' + it.key).replace('/', '-'));
    if (row && row.scrollIntoView) row.scrollIntoView({ block: 'center', behavior: 'smooth' });
    start(it);
  };
  openDB().then(loadAll).then(render);
})();
