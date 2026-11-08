/* data.js: letters, numbers, words, names, texts and unicorns, English and French. No DOM. */
(function () {
  'use strict';
  var AD = (window.AD = {});

  AD.LANGS = ['en', 'fr'];
  AD.SPEECH = { en: 'en-GB', fr: 'fr-FR' };
  AD.LANG_NAME = { en: 'English', fr: 'Français' };

  AD.stripAccent = function (s) {
    return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
  };
  /* File name for a spoken piece: lower case, no accents, hyphens. */
  AD.slug = function (text) {
    return AD.stripAccent(text.toLowerCase()).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
  };

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
  /* Words 0 to 20, kept for earlier code. */
  AD.NUM = { en: [], fr: [] };
  for (var i = 0; i <= 20; i++) { AD.NUM.en.push(AD.numWord(i, 'en')); AD.NUM.fr.push(AD.numWord(i, 'fr')); }

  /* ---------- Letters ---------- */
  AD.LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  AD.SETS = [AD.LETTERS.slice(0, 5), AD.LETTERS.slice(5, 10), AD.LETTERS.slice(10, 15), AD.LETTERS.slice(15, 20), AD.LETTERS.slice(20, 26)];
  AD.SET1 = AD.SETS[0];

  /* Text sent to the voice. Replaced by recorded clips when they exist. */
  AD.LETTER_SPEECH = {
    en: ['ay', 'bee', 'see', 'dee', 'ee', 'eff', 'jee', 'aitch', 'eye', 'jay', 'kay', 'el', 'em', 'en', 'oh', 'pee', 'cue',
      'ar', 'ess', 'tee', 'you', 'vee', 'double you', 'ex', 'why', 'zed'],
    fr: ['a', 'bé', 'cé', 'dé', 'eu', 'effe', 'gé', 'hache', 'i', 'ji', 'ka', 'elle', 'emme', 'enne', 'o', 'pé', 'ku',
      'erre', 'esse', 'té', 'u', 'vé', 'double vé', 'ixe', 'i grec', 'zède']
  };

  /* First-letter game: letters that have a picture word in BOTH languages. */
  AD.FIRST = {
    en: { A: 'apple', B: 'butterfly', C: 'cat', D: 'dolphin', E: 'elephant', F: 'fish', G: 'giraffe', H: 'horse', I: 'ice cream', J: 'juice',
      K: 'kangaroo', L: 'lion', M: 'moon', N: 'nose', O: 'owl', P: 'pig', R: 'rabbit', S: 'sun', T: 'tiger', V: 'violin', Z: 'zebra' },
    fr: { A: 'avion', B: 'bateau', C: 'chat', D: 'dauphin', E: 'éléphant', F: 'fleur', G: 'girafe', H: 'hibou', I: 'île', J: 'jus',
      K: 'kangourou', L: 'lion', M: 'maison', N: 'nuage', O: 'ours', P: 'pomme', R: 'renard', S: 'soleil', T: 'tortue', V: 'vache', Z: 'zèbre' }
  };
  AD.FIRST_LETTERS = Object.keys(AD.FIRST.en).filter(function (l) { return AD.FIRST.fr[l]; });
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
    en: ('cat dog sun bus pig hat bed car bee egg owl fox cow ant bat key map ' +
      'fish frog duck bear lion star moon tree cake milk bird ship ball book shoe rain crab ' +
      'apple horse mouse house bread snake whale tiger zebra panda lemon pizza train plane truck shark camel sheep ' +
      'rabbit monkey turtle flower parrot spider rocket guitar cookie banana orange castle dragon').split(' '),
    fr: ('bus lit riz rat sac feu nez roi chat lion lune ours pain lait loup vélo ' +
      'pomme arbre vache singe crabe fleur train panda pizza avion lapin chien livre hibou ' +
      'soleil bateau ballon maison cheval souris tortue citron renard requin oiseau girafe gâteau étoile').split(' ')
  };

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

  /* ---------- Spoken text ----------
     Spoken strings are cut into pieces with "|". Fixed phrases go through F() (they are recorded once),
     variable parts (a number, a letter, a word) go through V(). Recorded clips play when every piece has one,
     otherwise the whole sentence is read by the browser voice with the "|" removed. */
  var FIXED = { en: {}, fr: {} };
  AD.cleanPiece = function (s) { return s.replace(/^[\s.,!?:;]+/, '').replace(/\s+$/, ''); };
  AD.hasWords = function (s) { return /[A-Za-zÀ-ÿ0-9]/.test(s); };
  AD.plain = function (s) { return String(s).replace(/\|/g, ''); };
  AD.pieces = function (text) {
    return String(text).split('|').map(AD.cleanPiece).filter(AD.hasWords);
  };
  function maker(lang) {
    return {
      F: function (s) { var c = AD.cleanPiece(s); if (AD.hasWords(c)) FIXED[lang][AD.slug(c)] = c; return '|' + s + '|'; },
      V: function (s) { return '|' + s + '|'; }
    };
  }

  var T = (AD.T = {});
  function L(lang, i) { return AD.LETTER_SPEECH[lang][i]; }
  function N(lang, n) { return AD.numWord(n, lang); }
  var en = maker('en'), fr = maker('fr');
  var Fe = en.F, Ve = en.V, Ff = fr.F, Vf = fr.V;

  T.en = {
    hello: Fe("Hi Andrea! Let's dance!"),
    praise: ['Yes!', 'Wow!', 'Super!', 'You did it!'].map(Fe),
    tryAgain: Fe('Oops, try again!'),
    itIs: function (x) { return Fe('It is ') + Ve(x) + '.'; },
    surprise: Fe('A surprise!'),
    tapBox: Fe('Tap the box!'),
    newUnicorn: function (n) { return Fe('A new unicorn: ') + Ve(n) + '!'; },
    allUnicorns: Fe('You have them all! Here are some candies!'),
    chapterDone: Fe('Great dancing, Andrea!'),
    cliff: ['Next time: a glowing cave is waiting!', 'Next time: the seahorse needs your help!', 'Next time: a big dance show is coming!'].map(Fe),
    letter: function (q) { return { say: Fe('Find the letter ') + Ve(L('en', q.idx)) + '.', cap: 'Find ' + q.item.letter }; },
    case: function () { return { say: Fe('Find the small letter that matches!'), cap: 'Which small letter?' }; },
    first: function (q, w) { return { say: Ve(w) + Fe(' starts with...?'), cap: w + ' starts with…' }; },
    next: function () { return { say: Fe('Which letter is missing?'), cap: 'Which letter is missing?' }; },
    odd: function () { return { say: Fe('Which one starts with a different letter?'), cap: 'Which is different?' }; },
    miss: function (q) { return { say: Ve(AD.wordSay(q.word, 'en')) + Fe('. Which letter is missing?'), cap: 'Which letter is missing?' }; },
    build: function (q) { return { say: Fe('Spell ') + Ve(AD.wordSay(q.word, 'en')) + '!', cap: 'Spell it!' }; },
    word: function (q) { return { say: Fe('Where does it say ') + Ve(q.word) + '?', cap: 'Find “' + q.word + '”' }; },
    count: function () { return { say: Fe('How many?'), cap: 'How many?' }; },
    seq: function () { return { say: Fe('Which number is missing?'), cap: 'Which number is missing?' }; },
    cmp: function (q) { return q.mode === 'big' ? { say: Fe('Which number is bigger?'), cap: 'Which is bigger?' } : { say: Fe('Which number is smaller?'), cap: 'Which is smaller?' }; },
    add: function (q) {
      var a = q.a, b = q.b;
      if (q.story) return { say: Fe('A unicorn has ') + Ve(N('en', a)) + Fe(' candies. It finds ') + Ve(N('en', b)) + Fe(' more. How many now?'), cap: a + ' + ' + b + ' = ?' };
      return { say: Ve(N('en', a)) + Fe(' and ') + Ve(N('en', b)) + Fe(' make...?'), cap: a + ' + ' + b + ' = ?' };
    },
    sub: function (q) {
      var a = q.a, b = q.b;
      if (q.story) return { say: Fe('A unicorn has ') + Ve(N('en', a)) + Fe(' candies and eats ') + Ve(N('en', b)) + Fe('. How many are left?'), cap: a + ' − ' + b + ' = ?' };
      return { say: Ve(N('en', a)) + Fe(' take away ') + Ve(N('en', b)) + Fe(' leaves...?'), cap: a + ' − ' + b + ' = ?' };
    },
    gap: function (q) { return { say: Ve(N('en', q.a)) + Fe(' and how many make ') + Ve(N('en', q.c)) + '?', cap: q.a + ' + ? = ' + q.c }; },
    make10: function (q) { return { say: Ve(N('en', q.a)) + Fe(' and how many make ten?'), cap: q.a + ' + ? = 10' }; },
    dbl: function (q) { return { say: Fe('What is double ') + Ve(N('en', q.n)) + '?', cap: 'Double ' + q.n }; },
    half: function (q) { return { say: Fe('Share ') + Ve(N('en', q.n)) + Fe(' candies between two unicorns. How many each?'), cap: q.n + ' ÷ 2 = ?' }; },
    pv: function () { return { say: Fe('How many in all?'), cap: 'How many in all?' }; },
    mul: function (q) { return { say: Ve(N('en', q.g)) + Fe(' groups of ') + Ve(N('en', q.s)) + Fe('. How many in all?'), cap: q.g + ' × ' + q.s + ' = ?' }; }
  };

  T.fr = {
    hello: Ff('Coucou Andrea ! On danse !'),
    praise: ['Oui !', 'Waouh !', 'Super !', 'Bravo !'].map(Ff),
    tryAgain: Ff('Oups, essaie encore !'),
    itIs: function (x) { return Ff("C'est ") + Vf(x) + '.'; },
    surprise: Ff('Une surprise !'),
    tapBox: Ff('Touche la boîte !'),
    newUnicorn: function (n) { return Ff('Une nouvelle licorne : ') + Vf(n) + ' !'; },
    allUnicorns: Ff('Tu les as toutes ! Voici des bonbons !'),
    chapterDone: Ff('Bravo, Andrea !'),
    cliff: ["La prochaine fois : une grotte magique t'attend !", "La prochaine fois : l'hippocampe a besoin de toi !", 'La prochaine fois : un grand spectacle de danse arrive !'].map(Ff),
    letter: function (q) { return { say: Ff('Trouve la lettre ') + Vf(L('fr', q.idx)) + '.', cap: 'Trouve ' + q.item.letter }; },
    case: function () { return { say: Ff('Trouve la petite lettre pareille !'), cap: 'Quelle petite lettre ?' }; },
    first: function (q, w) { return { say: Vf(w) + Ff(' commence par... ?'), cap: w + ' commence par…' }; },
    next: function () { return { say: Ff('Quelle lettre manque ?'), cap: 'Quelle lettre manque ?' }; },
    odd: function () { return { say: Ff('Lequel commence par une autre lettre ?'), cap: 'Lequel est différent ?' }; },
    miss: function (q) { return { say: Vf(AD.wordSay(q.word, 'fr')) + Ff('. Quelle lettre manque ?'), cap: 'Quelle lettre manque ?' }; },
    build: function (q) { return { say: Ff('Écris ') + Vf(AD.wordSay(q.word, 'fr')) + ' !', cap: 'Écris le mot !' }; },
    word: function (q) { return { say: Ff('Où est écrit ') + Vf(q.word) + ' ?', cap: 'Trouve « ' + q.word + ' »' }; },
    count: function () { return { say: Ff('Combien ?'), cap: 'Combien ?' }; },
    seq: function () { return { say: Ff('Quel nombre manque ?'), cap: 'Quel nombre manque ?' }; },
    cmp: function (q) { return q.mode === 'big' ? { say: Ff('Quel nombre est le plus grand ?'), cap: 'Le plus grand ?' } : { say: Ff('Quel nombre est le plus petit ?'), cap: 'Le plus petit ?' }; },
    add: function (q) {
      var a = q.a, b = q.b;
      if (q.story) return { say: Ff('Une licorne a ') + Vf(N('fr', a)) + Ff(' bonbons. Elle en trouve ') + Vf(N('fr', b)) + Ff(' de plus. Combien en a-t-elle maintenant ?'), cap: a + ' + ' + b + ' = ?' };
      return { say: Vf(N('fr', a)) + Ff(' et ') + Vf(N('fr', b)) + Ff(' font... ?'), cap: a + ' + ' + b + ' = ?' };
    },
    sub: function (q) {
      var a = q.a, b = q.b;
      if (q.story) return { say: Ff('Une licorne a ') + Vf(N('fr', a)) + Ff(' bonbons et en mange ') + Vf(N('fr', b)) + Ff('. Combien en reste-t-il ?'), cap: a + ' − ' + b + ' = ?' };
      return { say: Vf(N('fr', a)) + Ff(' moins ') + Vf(N('fr', b)) + Ff(', ça fait... ?'), cap: a + ' − ' + b + ' = ?' };
    },
    gap: function (q) { return { say: Vf(N('fr', q.a)) + Ff(' et combien font ') + Vf(N('fr', q.c)) + ' ?', cap: q.a + ' + ? = ' + q.c }; },
    make10: function (q) { return { say: Vf(N('fr', q.a)) + Ff(' et combien font dix ?'), cap: q.a + ' + ? = 10' }; },
    dbl: function (q) { return { say: Ff('Quel est le double de ') + Vf(N('fr', q.n)) + ' ?', cap: 'Double de ' + q.n }; },
    half: function (q) { return { say: Ff('Partage ') + Vf(N('fr', q.n)) + Ff(' bonbons entre deux licornes. Combien chacune ?'), cap: q.n + ' ÷ 2 = ?' }; },
    pv: function () { return { say: Ff('Combien en tout ?'), cap: 'Combien en tout ?' }; },
    mul: function (q) { return { say: Vf(N('fr', q.g)) + Ff(' groupes de ') + Vf(N('fr', q.s)) + Ff('. Combien en tout ?'), cap: q.g + ' × ' + q.s + ' = ?' }; }
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

  /* ---------- Recording list ----------
     Everything the voice can say, as separate pieces. Tier 1 covers the reactions, letters, numbers to 30 and names;
     tier 2 the larger numbers, picture words and unicorn names. */
  var recCache = {};
  AD.recordingList = function (lang) {
    if (recCache[lang]) return recCache[lang];
    /* Run every template once so that all fixed phrases are registered. */
    var item = { letter: 'A' };
    var samples = [
      { type: 'letter', idx: 0, item: item }, { type: 'case', item: item }, { type: 'first', item: item }, { type: 'next', item: item },
      { type: 'odd', item: item }, { type: 'miss', word: 'cat', item: item }, { type: 'build', word: 'cat', item: item }, { type: 'word', word: 'cat', item: item },
      { type: 'count', item: item }, { type: 'seq', item: item }, { type: 'cmp', mode: 'big', item: item }, { type: 'cmp', mode: 'small', item: item },
      { type: 'add', a: 1, b: 2, story: true, item: item }, { type: 'add', a: 1, b: 2, story: false, item: item },
      { type: 'sub', a: 5, b: 2, story: true, item: item }, { type: 'sub', a: 5, b: 2, story: false, item: item },
      { type: 'gap', a: 1, c: 5, item: item }, { type: 'make10', a: 3, item: item }, { type: 'dbl', n: 3, item: item },
      { type: 'half', n: 6, item: item }, { type: 'pv', n: 23, item: item }, { type: 'mul', g: 2, s: 3, item: item }
    ];
    samples.forEach(function (q) { AD.prompt(q, lang); });
    T[lang].itIs('x'); T[lang].newUnicorn('x');

    var out = [], seen = {};
    function add(text, tier, group) {
      var c = AD.cleanPiece(text), k = AD.slug(c);
      if (!k || seen[k]) return;
      seen[k] = 1; out.push({ key: k, text: c, tier: tier, group: group });
    }
    Object.keys(FIXED[lang]).map(function (k) { return FIXED[lang][k]; }).forEach(function (t) { add(t, 1, 'Phrases'); });
    AD.LETTER_SPEECH[lang].forEach(function (t, i) { add(t, 1, 'Letter ' + AD.LETTERS[i]); });
    var n;
    for (n = 0; n <= 30; n++) add(AD.numWord(n, lang), 1, 'Numbers');
    AD.NAMES[lang].forEach(function (x) { add(x.say, 1, 'Names'); });
    for (n = 31; n <= 59; n++) add(AD.numWord(n, lang), 2, 'Numbers');
    [60, 70, 80, 90, 100].forEach(function (x) { add(AD.numWord(x, lang), 2, 'Numbers'); });
    AD.WL[lang].forEach(function (w) { add(w, 2, 'Picture words'); });
    AD.FIRST_LETTERS.forEach(function (L2) { add(AD.FIRST[lang][L2], 2, 'Picture words'); });
    AD.UNICORNS.forEach(function (u) { add(u.name, 2, 'Unicorn names'); });
    recCache[lang] = out;
    return out;
  };
})();
