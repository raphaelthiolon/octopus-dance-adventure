/* art.js: original SVG art (octopus guide, unicorns, candy, gift box, flags, icons). */
(function () {
  'use strict';
  var Art = (window.Art = {});

  /* Octopus ballet dancer, the guide. Animated by CSS classes in styles.css. */
  Art.octopus = function () {
    var tent = '';
    var xs = [36, 56, 74, 91, 109, 126, 144, 164];
    var out = [30, 20, 11, 4];
    for (var i = 0; i < 8; i++) {
      var x = xs[i], dir = i < 4 ? -1 : 1, k = i < 4 ? i : 7 - i;
      var sp = out[k];
      tent += '<g class="tent t' + (i + 1) + '" style="transform-origin:' + x + 'px 138px">' +
        '<path d="M' + x + ' 138 C ' + (x + dir * sp * 0.3) + ' 165, ' + (x + dir * sp) + ' 180, ' + (x + dir * (sp + 8)) + ' 200 ' +
        'C ' + (x + dir * (sp + 12)) + ' 212, ' + (x + dir * (sp - 2)) + ' 218, ' + (x + dir * (sp - 8)) + ' 210" ' +
        'fill="none" stroke="#9468ee" stroke-width="14" stroke-linecap="round"/></g>';
    }
    return '<svg viewBox="0 0 200 230" class="octo" aria-hidden="true">' +
      '<g class="body">' + tent +
      '<ellipse cx="100" cy="70" rx="60" ry="58" fill="#a574f5"/>' +
      '<ellipse cx="76" cy="38" rx="20" ry="11" fill="#c9a8ff" opacity=".7" transform="rotate(-25 76 38)"/>' +
      '<g class="eyes"><ellipse cx="78" cy="72" rx="13" ry="15" fill="#fff"/><ellipse cx="122" cy="72" rx="13" ry="15" fill="#fff"/>' +
      '<circle cx="80" cy="74" r="7" fill="#2b1b5e"/><circle cx="120" cy="74" r="7" fill="#2b1b5e"/>' +
      '<circle cx="83" cy="70" r="2.6" fill="#fff"/><circle cx="123" cy="70" r="2.6" fill="#fff"/></g>' +
      '<circle cx="60" cy="94" r="9" fill="#ff9fc7" opacity=".75"/><circle cx="140" cy="94" r="9" fill="#ff9fc7" opacity=".75"/>' +
      '<path class="smile" d="M86 94 Q100 110 114 94" fill="none" stroke="#2b1b5e" stroke-width="4.5" stroke-linecap="round"/>' +
      '<path d="M128 14 L152 2 L152 30 Z" fill="#ff6fae"/><path d="M128 14 L104 2 L104 30 Z" fill="#ff6fae"/>' +
      '<circle cx="128" cy="14" r="8" fill="#ff3e92"/>' +
      '<ellipse cx="100" cy="142" rx="78" ry="13" fill="#ffd1e6"/>' +
      '<ellipse cx="100" cy="135" rx="64" ry="11" fill="#ffb3d6"/>' +
      '<ellipse cx="100" cy="129" rx="48" ry="9" fill="#ff93c3"/>' +
      '</g></svg>';
  };

  /* Unicorn. u = entry of AD.UNICORNS. locked = silhouette. */
  Art.unicorn = function (u, locked) {
    var body = locked ? '#3b3470' : u.body;
    var mane = locked ? ['#2f2a5c'] : u.mane;
    var horn = locked ? '#3b3470' : u.horn;
    var s = '<svg viewBox="0 0 220 180" class="uni" aria-hidden="true">';
    var i;
    /* tail */
    for (i = mane.length - 1; i >= 0; i--) {
      s += '<path d="M54 98 C ' + (18 - i * 4) + ' ' + (92 + i * 5) + ', ' + (6 - i * 3) + ' ' + (136 + i * 4) + ', ' + (30 - i * 3) + ' ' + (158 + i * 2) +
        ' C ' + (24 + i * 2) + ' 128, ' + (44 + i * 2) + ' 118, 60 112 Z" fill="' + mane[i] + '"/>';
    }
    /* back legs, body, front legs */
    s += '<g fill="' + body + '" stroke="' + (locked ? 'none' : '#e0c8ee') + '" stroke-width="2">' +
      '<rect x="60" y="118" width="13" height="42" rx="6"/><rect x="78" y="120" width="13" height="40" rx="6"/>' +
      '<ellipse cx="100" cy="106" rx="54" ry="31"/>' +
      '<rect x="118" y="120" width="13" height="40" rx="6"/><rect x="136" y="118" width="13" height="42" rx="6"/>' +
      '<path d="M118 100 L150 44 L174 58 L150 116 Z"/>' +
      '<ellipse cx="168" cy="55" rx="25" ry="19" transform="rotate(-18 168 55)"/>' +
      '<ellipse cx="186" cy="68" rx="15" ry="12"/></g>';
    var hoof = locked ? '#2f2a5c' : mane[0];
    s += '<g fill="' + hoof + '"><rect x="60" y="154" width="13" height="8" rx="3"/><rect x="78" y="154" width="13" height="8" rx="3"/>' +
      '<rect x="118" y="154" width="13" height="8" rx="3"/><rect x="136" y="154" width="13" height="8" rx="3"/></g>';
    /* ear, horn */
    s += '<path d="M150 40 L152 20 L164 38 Z" fill="' + body + '" stroke="' + (locked ? 'none' : '#e0c8ee') + '" stroke-width="2"/>';
    s += '<path d="M168 38 L181 2 L178 42 Z" fill="' + horn + '"/>';
    if (!locked) s += '<path d="M172 28 L179 25 M171 20 L179 17 M170 34 L178 32" stroke="#fff" stroke-width="1.6" opacity=".7"/>';
    /* mane */
    for (i = mane.length - 1; i >= 0; i--) {
      s += '<path d="M' + (148 - i * 5) + ' 36 C ' + (118 - i * 5) + ' ' + (38 + i * 3) + ', ' + (112 - i * 4) + ' ' + (72 + i * 3) + ', ' + (124 - i * 3) + ' ' + (96 + i * 2) +
        ' C ' + (130 - i * 2) + ' 72, ' + (140 - i * 3) + ' 62, ' + (158 - i * 2) + ' 50 Z" fill="' + mane[i] + '"/>';
    }
    if (!locked) {
      s += '<circle cx="174" cy="52" r="3.4" fill="#2b1b5e"/><circle cx="175" cy="51" r="1.1" fill="#fff"/>' +
        '<circle cx="180" cy="66" r="4.5" fill="#ff9fc7" opacity=".6"/>' +
        '<path d="M190 70 Q194 72 196 69" stroke="#2b1b5e" stroke-width="1.8" fill="none" stroke-linecap="round"/>';
    }
    return s + '</svg>';
  };

  Art.candy = function (c1, c2) {
    c1 = c1 || '#ff4fa3'; c2 = c2 || '#fff';
    return '<svg viewBox="0 0 64 40" class="candy" aria-hidden="true">' +
      '<path d="M14 20 L2 8 L2 32 Z" fill="' + c1 + '"/><path d="M50 20 L62 8 L62 32 Z" fill="' + c1 + '"/>' +
      '<circle cx="32" cy="20" r="15" fill="' + c1 + '"/>' +
      '<path d="M22 10 Q32 20 22 30" stroke="' + c2 + '" stroke-width="4" fill="none" stroke-linecap="round"/>' +
      '<path d="M32 6 Q42 20 32 34" stroke="' + c2 + '" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/></svg>';
  };

  Art.gift = function () {
    return '<svg viewBox="0 0 160 160" class="gift" aria-hidden="true">' +
      '<g class="lid"><rect x="14" y="40" width="132" height="34" rx="8" fill="#ff6fae"/>' +
      '<rect x="68" y="40" width="24" height="34" fill="#ffd54a"/>' +
      '<path d="M80 40 C60 6 30 14 44 36 Z" fill="#ffd54a"/><path d="M80 40 C100 6 130 14 116 36 Z" fill="#ffd54a"/></g>' +
      '<rect x="22" y="74" width="116" height="74" rx="8" fill="#c77dff"/>' +
      '<rect x="68" y="74" width="24" height="74" fill="#ffd54a"/>' +
      '<circle cx="42" cy="100" r="5" fill="#fff" opacity=".6"/><circle cx="116" cy="124" r="5" fill="#fff" opacity=".6"/></svg>';
  };

  Art.flag = function (lang) {
    if (lang === 'fr') {
      return '<svg viewBox="0 0 60 40" class="flag" aria-hidden="true"><rect width="20" height="40" fill="#0055a4"/><rect x="20" width="20" height="40" fill="#fff"/><rect x="40" width="20" height="40" fill="#ef4135"/></svg>';
    }
    return '<svg viewBox="0 0 60 40" class="flag" aria-hidden="true"><rect width="60" height="40" fill="#012169"/>' +
      '<path d="M0 0L60 40M60 0L0 40" stroke="#fff" stroke-width="8"/><path d="M0 0L60 40M60 0L0 40" stroke="#c8102e" stroke-width="3"/>' +
      '<path d="M30 0V40M0 20H60" stroke="#fff" stroke-width="12"/><path d="M30 0V40M0 20H60" stroke="#c8102e" stroke-width="7"/></svg>';
  };

  var I = {
    home: '<path d="M4 13 L16 3 L28 13 V28 H19 V19 H13 V28 H4 Z" fill="currentColor"/>',
    play: '<path d="M9 5 L27 16 L9 27 Z" fill="currentColor"/>',
    speakerOn: '<path d="M4 12 H10 L17 6 V26 L10 20 H4 Z" fill="currentColor"/><path d="M21 11 Q26 16 21 21 M24 7 Q31 16 24 25" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round"/>',
    speakerOff: '<path d="M4 12 H10 L17 6 V26 L10 20 H4 Z" fill="currentColor"/><path d="M22 11 L30 21 M30 11 L22 21" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/>',
    gear: '<circle cx="16" cy="16" r="5" fill="none" stroke="currentColor" stroke-width="3"/><path d="M16 3 V8 M16 24 V29 M3 16 H8 M24 16 H29 M7 7 L10.5 10.5 M21.5 21.5 L25 25 M25 7 L21.5 10.5 M10.5 21.5 L7 25" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
    back: '<path d="M20 5 L8 16 L20 27" stroke="currentColor" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    next: '<path d="M10 5 L22 16 L10 27" stroke="currentColor" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    unicorn: '<path d="M20 3 L23 11 L18 12 Z" fill="currentColor"/><path d="M9 28 V17 C9 11 14 9 19 12 L26 15 C28 16 28 19 26 20 L22 21 L22 28 Z" fill="currentColor"/>'
  };
  Art.icon = function (name, size) {
    return '<svg viewBox="0 0 32 32" width="' + (size || 32) + '" height="' + (size || 32) + '" aria-hidden="true">' + I[name] + '</svg>';
  };
})();
