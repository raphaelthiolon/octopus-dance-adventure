/* data.js: letters, numbers, words, names, texts and unicorns, English and French. No DOM. */
(function () {
  'use strict';
  var AD = (window.AD = {});

  AD.LANGS = ['en', 'fr'];
  AD.SPEECH = { en: 'en-GB', fr: 'fr-FR' };
  AD.LANG_NAME = { en: 'English', fr: 'Français' };

  /* ---------- Numbers in words, 0 to 100 ---------- */
  var EN_UNITS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  var EN_TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  var FR_UNITS = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix',
    'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  var FR_TENS = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante'];

  AD.numWord = function (n, lang) {
    if (lang === 'en') {
      if (n < 20) return EN_UNITS[n];
      if (n === 100) return 'one hundred';
      var t = Math.floor(n / 10), u = n % 10;
      return EN_TENS[t] + (u ? '-' + EN_UNITS[u] : '');
    }
    if (n < 20) return FR_UNITS[n];
    if (n === 100) return 'cent';
    var tens = Math.floor(n / 10), ones = n % 10;
    if (tens <= 6) {
      if (ones === 0) return FR_TENS[tens];
      return FR_TENS[tens] + (ones === 1 ? ' et un' : '-' + FR_UNITS[ones]);
    }
    if (tens === 7) return ones === 1 ? 'soixante et onze' : 'soixante-' + FR_UNITS[10 + ones];
    if (tens === 8) return ones === 0 ? 'quatre-vingts' : 'quatre-vingt-' + FR_UNITS[ones];
    return 'quatre-vingt-' + FR_UNITS[10 + ones];
  };
  /* Kept for the earlier tests and code: words 0 to 20. */
  AD.NUM = { en: [], fr: [] };
  for (var i = 0; i <= 20; i++) { AD.NUM.en.push(AD.numWord(i, 'en')); AD.NUM.fr.push(AD.numWord(i, 'fr')); }

  /* ---------- Letters ---------- */
  AD.LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  AD.SETS = [AD.LETTERS.slice(0, 5), AD.LETTERS.slice(5, 10), AD.LETTERS.slice(10, 15), AD.LETTERS.slice(15, 20), AD.LETTERS.slice(20, 26)];
  AD.SET1 = AD.SETS[0];

  /* Text sent to the browser voice. Placeholder until recorded audio replaces it [TO CONFIRM]. */
  AD.LETTER_SPEECH = {
    en: ['ay', 'bee', 'see', 'dee', 'ee', 'eff', 'jee', 'aitch', 'eye', 'jay', 'kay', 'el', 'em', 'en', 'oh', 'pee', 'cue',
      'ar', 'ess', 'tee', 'you', 'vee', 'double you', 'ex', 'why', 'zed'],
    fr: ['a', 'bé', 'cé', 'dé', 'eu', 'effe', 'gé', 'hache', 'i', 'ji', 'ka', 'elle', 'emme', 'enne', 'o', 'pé', 'ku',
      'erre', 'esse', 'té', 'u', 'vé', 'double vé', 'ixe', 'i grec', 'zède']
  };

  /* First-letter game: letters that have a picture word in BOTH languages. */
  AD.FIRST_LETTERS = 'ABCDEFGHIJKLMNORSTVZ'.split('').filter(function (l) { return l !== 'Q'; });
  AD.FIRST = {
    en: { A: 'apple', B: 'butterfly', C: 'cat', D: 'dolphin', E: 'elephant', F: 'fish', G: 'giraffe', H: 'horse', I: 'ice cream', J: 'juice',
      K: 'kangaroo', L: 'lion', M: 'moon', N: 'nose', O: 'owl', P: 'pig', R: 'rabbit', S: 'sun', T: 'tiger', V: 'violin', Z: 'zebra' },
    fr: { A: 'avion', B: 'bateau', C: 'chat', D: 'dauphin', E: 'éléphant', F: 'fleur', G: 'girafe', H: 'hibou', I: 'île', J: 'jus',
      K: 'kangourou', L: 'lion', M: 'maison', N: 'nuage', O: 'ours', P: 'pomme', R: 'renard', S: 'soleil', T: 'tortue', V: 'vache', Z: 'zèbre' }
  };
  AD.FIRST_LETTERS = Object.keys(AD.FIRST.en).filter(function (l) { return AD.FIRST.fr[l]; });
  /* Kept for the earlier code path: set 1 words with their pictures. */
  AD.WORDS = { en: {}, fr: {} };

  /* Pictures. One map for every picture word in both languages. */
  AD.PIC = {
    apple: '🍎', butterfly: '🦋', cat: '🐱', dolphin: '🐬', elephant: '🐘', fish: '🐟', giraffe: '🦒', horse: '🐴', 'ice cream': '🍦', juice: '🧃',
    kangaroo: '🦘', lion: '🦁', moon: '🌙', nose: '👃', owl: '🦉', pig: '🐷', rabbit: '🐰', sun: '☀️', tiger: '🐯', violin: '🎻', zebra: '🦓',
    avion: '✈️', bateau: '⛵', chat: '🐱', dauphin: '🐬', 'éléphant': '🐘', fleur: '🌸', girafe: '🦒', hibou: '🦉', 'île': '🏝️', jus: '🧃',
    kangourou: '🦘', lune: '🌙', maison: '🏠', nuage: '☁️', ours: '🐻', pomme: '🍎', renard: '🦊', soleil: '☀️', tortue: '🐢', vache: '🐮', 'zèbre': '🦓',
    dog: '🐶', bus: '🚌', hat: '🎩', bed: '🛏️', car: '🚗', bee: '🐝', egg: '🥚', fox: '🦊', cow: '🐮', ant: '🐜', bat: '🦇', key: '🔑', map: '🗺️',
    frog: '🐸', duck: '🦆', bear: '🐻', star: '⭐', tree: '🌳', cake: '🍰', milk: '🥛', bird: '🐦', ship: '🚢', ball: '⚽', book: '📖', shoe: '👟', rain: '🌧️', crab: '🦀',
    house: '🏠', mouse: '🐭', bread: '🍞', snake: '🐍', whale: '🐳', panda: '🐼', lemon: '🍋', pizza: '🍕', train: '🚆', plane: '✈️', truck: '🚚', shark: '🦈', camel: '🐫', sheep: '🐑',
    monkey: '🐵', turtle: '🐢', flower: '🌸', parrot: '🦜', spider: '🕷️', rocket: '🚀', guitar: '🎸', cookie: '🍪', banana: '🍌', orange: '🍊', castle: '🏰', dragon: '🐉',
    lit: '🛏️', riz: '🍚', rat: '🐀', sac: '🎒', feu: '🔥', nez: '👃', roi: '🤴', lait: '🥛', loup: '🐺', pain: '🍞', 'vélo': '🚲',
    arbre: '🌳', singe: '🐵', crabe: '🦀', chien: '🐶', livre: '📖', lapin: '🐰', cheval: '🐴', souris: '🐭', citron: '🍋', requin: '🦈', oiseau: '🐦', ballon: '⚽',
    'gâteau': '🍰', 'étoile': '⭐'
  };

  /* Picture words for spelling games, by language. Names are separate. */
  AD.WL = {
    en: 'cat dog sun bus pig hat bed car bee egg owl fox cow ant bat key map ' +
      'fish frog duck bear lion star moon tree cake milk bird ship ball book shoe rain crab ' +
      'apple horse mouse house bread snake whale tiger zebra panda lemon pizza train plane truck shark camel sheep ' +
      'rabbit monkey turtle flower parrot spider rocket guitar cookie banana orange castle dragon',
    fr: 'bus lit riz rat sac feu nez roi chat lion lune ours pain lait loup vélo ' +
      'pomme arbre vache singe crabe fleur train panda pizza avion lapin chien livre hibou ' +
      'soleil bateau ballon maison cheval souris tortue citron renard requin oiseau girafe gâteau étoile'
  };
  AD.WL.en = AD.WL.en.split(' ');
  AD.WL.fr = AD.WL.fr.split(' ');

  AD.NAMES = {
    en: [{ w: 'Andrea', say: 'Andrea' }, { w: 'Daddy', say: 'Daddy' }, { w: 'Mummy', say: 'Mummy' }],
    fr: [{ w: 'Andrea', say: 'Andréa' }, { w: 'Papa', say: 'Papa' }, { w: 'Maman', say: 'Maman' }]
  };

  AD.isPlain = function (ch) { return /^[a-z]$/i.test(ch); };
  AD.wordSay = function (w, lang) {
    var n = AD.NAMES[lang].filter(function (x) { return x.w === w; })[0];
    return n ? n.say : w;
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

  /* ---------- Texts. Prompt builders return {say, cap}. ---------- */
  var T = (AD.T = {});
  function L(lang, i) { return AD.LETTER_SPEECH[lang][i]; }
  function N(lang, n) { return AD.numWord(n, lang); }

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
    letter: function (q) { return { say: 'Find the letter ' + L('en', q.idx) + '.', cap: 'Find ' + q.item.letter }; },
    case: function () { return { say: 'Find the small letter that matches!', cap: 'Which small letter?' }; },
    first: function (q, w) { return { say: w + ' starts with...?', cap: w + ' starts with…' }; },
    next: function () { return { say: 'Which letter is missing?', cap: 'Which letter is missing?' }; },
    odd: function () { return { say: 'Which one starts with a different letter?', cap: 'Which is different?' }; },
    miss: function (q) { return { say: AD.wordSay(q.word, 'en') + '. Which letter is missing?', cap: 'Which letter is missing?' }; },
    build: function (q) { return { say: 'Spell ' + AD.wordSay(q.word, 'en') + '!', cap: 'Spell it!' }; },
    word: function (q) { return { say: 'Where does it say ' + q.word + '?', cap: 'Find “' + q.word + '”' }; },
    count: function () { return { say: 'How many?', cap: 'How many?' }; },
    seq: function () { return { say: 'Which number is missing?', cap: 'Which number is missing?' }; },
    cmp: function (q) { return q.mode === 'big' ? { say: 'Which number is bigger?', cap: 'Which is bigger?' } : { say: 'Which number is smaller?', cap: 'Which is smaller?' }; },
    add: function (q) {
      var a = q.a, b = q.b;
      if (q.story) return { say: 'A unicorn has ' + N('en', a) + ' candies. It finds ' + N('en', b) + ' more. How many now?', cap: a + ' + ' + b + ' = ?' };
      return { say: N('en', a) + ' and ' + N('en', b) + ' make...?', cap: a + ' + ' + b + ' = ?' };
    },
    sub: function (q) {
      var a = q.a, b = q.b;
      if (q.story) return { say: 'A unicorn has ' + N('en', a) + ' candies and eats ' + N('en', b) + '. How many are left?', cap: a + ' − ' + b + ' = ?' };
      return { say: N('en', a) + ' take away ' + N('en', b) + ' leaves...?', cap: a + ' − ' + b + ' = ?' };
    },
    gap: function (q) { return { say: N('en', q.a) + ' and how many make ' + N('en', q.c) + '?', cap: q.a + ' + ? = ' + q.c }; },
    make10: function (q) { return { say: N('en', q.a) + ' and how many make ten?', cap: q.a + ' + ? = 10' }; },
    dbl: function (q) { return { say: 'What is double ' + N('en', q.n) + '?', cap: 'Double ' + q.n }; },
    half: function (q) { return { say: 'Share ' + N('en', q.n) + ' candies between two unicorns. How many each?', cap: q.n + ' ÷ 2 = ?' }; },
    pv: function () { return { say: 'How many in all?', cap: 'How many in all?' }; },
    mul: function (q) { return { say: N('en', q.g) + ' groups of ' + N('en', q.s) + '. How many in all?', cap: q.g + ' × ' + q.s + ' = ?' }; }
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
    letter: function (q) { return { say: 'Trouve la lettre ' + L('fr', q.idx) + '.', cap: 'Trouve ' + q.item.letter }; },
    case: function () { return { say: 'Trouve la petite lettre pareille !', cap: 'Quelle petite lettre ?' }; },
    first: function (q, w) { return { say: w + ' commence par... ?', cap: w + ' commence par…' }; },
    next: function () { return { say: 'Quelle lettre manque ?', cap: 'Quelle lettre manque ?' }; },
    odd: function () { return { say: 'Lequel commence par une autre lettre ?', cap: 'Lequel est différent ?' }; },
    miss: function (q) { return { say: AD.wordSay(q.word, 'fr') + '. Quelle lettre manque ?', cap: 'Quelle lettre manque ?' }; },
    build: function (q) { return { say: 'Écris ' + AD.wordSay(q.word, 'fr') + ' !', cap: 'Écris le mot !' }; },
    word: function (q) { return { say: 'Où est écrit ' + q.word + ' ?', cap: 'Trouve « ' + q.word + ' »' }; },
    count: function () { return { say: 'Combien ?', cap: 'Combien ?' }; },
    seq: function () { return { say: 'Quel nombre manque ?', cap: 'Quel nombre manque ?' }; },
    cmp: function (q) { return q.mode === 'big' ? { say: 'Quel nombre est le plus grand ?', cap: 'Le plus grand ?' } : { say: 'Quel nombre est le plus petit ?', cap: 'Le plus petit ?' }; },
    add: function (q) {
      var a = q.a, b = q.b;
      if (q.story) return { say: 'Une licorne a ' + N('fr', a) + ' bonbons. Elle en trouve ' + N('fr', b) + ' de plus. Combien en a-t-elle maintenant ?', cap: a + ' + ' + b + ' = ?' };
      return { say: N('fr', a) + ' et ' + N('fr', b) + ' font... ?', cap: a + ' + ' + b + ' = ?' };
    },
    sub: function (q) {
      var a = q.a, b = q.b;
      if (q.story) return { say: 'Une licorne a ' + N('fr', a) + ' bonbons et en mange ' + N('fr', b) + '. Combien en reste-t-il ?', cap: a + ' − ' + b + ' = ?' };
      return { say: N('fr', a) + ' moins ' + N('fr', b) + ', ça fait... ?', cap: a + ' − ' + b + ' = ?' };
    },
    gap: function (q) { return { say: N('fr', q.a) + ' et combien font ' + N('fr', q.c) + ' ?', cap: q.a + ' + ? = ' + q.c }; },
    make10: function (q) { return { say: N('fr', q.a) + ' et combien font dix ?', cap: q.a + ' + ? = 10' }; },
    dbl: function (q) { return { say: 'Quel est le double de ' + N('fr', q.n) + ' ?', cap: 'Double de ' + q.n }; },
    half: function (q) { return { say: 'Partage ' + N('fr', q.n) + ' bonbons entre deux licornes. Combien chacune ?', cap: q.n + ' ÷ 2 = ?' }; },
    pv: function () { return { say: 'Combien en tout ?', cap: 'Combien en tout ?' }; },
    mul: function (q) { return { say: N('fr', q.g) + ' groupes de ' + N('fr', q.s) + '. Combien en tout ?', cap: q.g + ' × ' + q.s + ' = ?' }; }
  };

  AD.prompt = function (q, lang) {
    var t = T[lang];
    if (q.type === 'first') return t.first(q, AD.FIRST[lang][q.item.letter]);
    var f = t[q.type];
    return f ? f(q) : { say: '', cap: '' };
  };

  /* What the guide says when revealing the answer. */
  AD.answerSay = function (q, lang) {
    var t = T[lang];
    switch (q.kind) {
      case 'letter': return t.itIs(L(lang, AD.LETTERS.indexOf(q.answer)));
      case 'lower': return t.itIs(L(lang, AD.LETTERS.indexOf(q.answer.toUpperCase())));
      case 'pic': return t.itIs(AD.wordSay(q.oddWord, lang));
      case 'word': return t.itIs(q.answer);
      case 'build': return t.itIs(AD.wordSay(q.answer, lang));
      default: return t.itIs(N(lang, q.answer));
    }
  };
})();
