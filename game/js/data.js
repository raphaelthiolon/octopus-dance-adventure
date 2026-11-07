/* data.js: letters, numbers, words, texts and unicorns, English and French. No DOM. */
(function () {
  'use strict';
  var AD = (window.AD = {});

  AD.LANGS = ['en', 'fr'];
  AD.SPEECH = { en: 'en-GB', fr: 'fr-FR' };
  AD.LANG_NAME = { en: 'English', fr: 'Français' };

  AD.NUM = {
    en: ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
      'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'],
    fr: ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix',
      'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf', 'vingt']
  };

  AD.LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  /* Text sent to the browser voice. Placeholder until recorded audio replaces it [TO CONFIRM]. */
  AD.LETTER_SPEECH = {
    en: ['ay', 'bee', 'see', 'dee', 'ee', 'eff', 'jee', 'aitch', 'eye', 'jay', 'kay', 'el', 'em', 'en', 'oh', 'pee', 'cue',
      'ar', 'ess', 'tee', 'you', 'vee', 'double you', 'ex', 'why', 'zed'],
    fr: ['a', 'bé', 'cé', 'dé', 'eu', 'effe', 'gé', 'hache', 'i', 'ji', 'ka', 'elle', 'emme', 'enne', 'o', 'pé', 'ku',
      'erre', 'esse', 'té', 'u', 'vé', 'double vé', 'ixe', 'i grec', 'zède']
  };

  AD.SET1 = ['A', 'B', 'C', 'D', 'E'];

  AD.WORDS = {
    en: { A: { w: 'apple', e: '🍎' }, B: { w: 'butterfly', e: '🦋' }, C: { w: 'cat', e: '🐱' }, D: { w: 'dolphin', e: '🐬' }, E: { w: 'elephant', e: '🐘' } },
    fr: { A: { w: 'avion', e: '✈️' }, B: { w: 'bateau', e: '⛵' }, C: { w: 'chat', e: '🐱' }, D: { w: 'dauphin', e: '🐬' }, E: { w: 'éléphant', e: '🐘' } }
  };

  AD.SKINS = ['⭐', '🐚', '🐟', '🍬', '🌸', '💖'];

  AD.stripAccent = function (s) {
    return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
  };

  AD.UNICORNS = [
    { id: 'rosie', name: 'Rosie', body: '#fff3f8', mane: ['#ff6fae', '#c77dff'], horn: '#ffd54a' },
    { id: 'skye', name: 'Skye', body: '#eaf6ff', mane: ['#4cc9f0', '#4895ef'], horn: '#ffd54a' },
    { id: 'minty', name: 'Minty', body: '#eafff4', mane: ['#52d6a0', '#ff8fc7'], horn: '#ffe08a' },
    { id: 'goldie', name: 'Goldie', body: '#fff8dc', mane: ['#ffb703', '#fb8500'], horn: '#ff8fc7' },
    { id: 'lila', name: 'Lila', body: '#f4ecff', mane: ['#b388ff', '#ff8fc7'], horn: '#ffd54a' },
    { id: 'sunny', name: 'Sunny', body: '#fffbe0', mane: ['#ffd60a', '#ff7b00'], horn: '#c77dff' },
    { id: 'rainbow', name: 'Rainbow', body: '#ffffff', mane: ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93'], horn: '#ffd54a' },
    { id: 'starry', name: 'Starry', body: '#dcd6ff', mane: ['#3a2c8f', '#ff8fc7'], horn: '#ffd54a' }
  ];

  /* Texts. Every function returns {say, cap}: say is spoken, cap is the short caption. */
  var T = (AD.T = {});

  T.en = {
    hello: "Hi Andrea! Let's dance!",
    praise: ['Yes!', 'Wow!', 'Super!', 'You did it!'],
    tryAgain: 'Oops, try again!',
    itIs: function (x) { return 'It is ' + x + '.'; },
    surprise: 'A surprise!',
    tapBox: 'Tap the box!',
    newUnicorn: function (n) { return 'A new unicorn: ' + n + '!'; },
    allUnicorns: 'You have them all! Here are some candies!',
    chapterDone: 'Great dancing, Andrea!',
    cliff: ['Next time: a glowing cave is waiting!', 'Next time: the seahorse needs your help!', 'Next time: a big dance show is coming!'],
    findLetter: function (L, i) { return { say: 'Find the letter ' + AD.LETTER_SPEECH.en[i] + '.', cap: 'Find ' + L }; },
    matchCase: function (L, i) { return { say: 'Find the small letter that matches!', cap: 'Which small letter?' }; },
    firstLetter: function (word) { return { say: word + ' starts with...?', cap: word + ' starts with…' }; },
    count: function () { return { say: 'How many?', cap: 'How many?' }; },
    add: function (a, b) { return { say: AD.NUM.en[a] + ' and ' + AD.NUM.en[b] + ' make...?', cap: a + ' + ' + b + ' = ?' }; },
    make10: function (a) { return { say: AD.NUM.en[a] + ' and how many make ten?', cap: a + ' + ? = 10' }; }
  };

  T.fr = {
    hello: 'Coucou Andrea ! On danse !',
    praise: ['Oui !', 'Waouh !', 'Super !', 'Bravo !'],
    tryAgain: 'Oups, essaie encore !',
    itIs: function (x) { return "C'est " + x + '.'; },
    surprise: 'Une surprise !',
    tapBox: 'Touche la boîte !',
    newUnicorn: function (n) { return 'Une nouvelle licorne : ' + n + ' !'; },
    allUnicorns: 'Tu les as toutes ! Voici des bonbons !',
    chapterDone: 'Bravo, Andrea !',
    cliff: ["La prochaine fois : une grotte magique t'attend !", "La prochaine fois : l'hippocampe a besoin de toi !", 'La prochaine fois : un grand spectacle de danse arrive !'],
    findLetter: function (L, i) { return { say: 'Trouve la lettre ' + AD.LETTER_SPEECH.fr[i] + '.', cap: 'Trouve ' + L }; },
    matchCase: function (L, i) { return { say: 'Trouve la petite lettre pareille !', cap: 'Quelle petite lettre ?' }; },
    firstLetter: function (word) { return { say: word + ' commence par... ?', cap: word + ' commence par…' }; },
    count: function () { return { say: 'Combien ?', cap: 'Combien ?' }; },
    add: function (a, b) { return { say: AD.NUM.fr[a] + ' et ' + AD.NUM.fr[b] + ' font... ?', cap: a + ' + ' + b + ' = ?' }; },
    make10: function (a) { return { say: AD.NUM.fr[a] + ' et combien font dix ?', cap: a + ' + ? = 10' }; }
  };

  /* Prompt for a question q in language lang. */
  AD.prompt = function (q, lang) {
    var t = T[lang];
    var it = q.item;
    var idx = it.letter ? AD.LETTERS.indexOf(it.letter) : 0;
    switch (q.type) {
      case 'letter': return t.findLetter(it.letter, idx);
      case 'case': return t.matchCase(it.letter, idx);
      case 'first': return t.firstLetter(AD.WORDS[lang][it.letter].w);
      case 'count': return t.count();
      case 'add': return t.add(it.a, it.b);
      case 'make10': return t.make10(it.a);
    }
    return { say: '', cap: '' };
  };

  /* What the guide says when revealing the answer. */
  AD.answerSay = function (q, lang) {
    var t = T[lang];
    if (q.type === 'letter' || q.type === 'first') return t.itIs(AD.LETTER_SPEECH[lang][AD.LETTERS.indexOf(q.answer)]);
    if (q.type === 'case') return t.itIs(AD.LETTER_SPEECH[lang][AD.LETTERS.indexOf(q.answer.toUpperCase())]);
    return t.itIs(AD.NUM[lang][q.answer]);
  };
})();
