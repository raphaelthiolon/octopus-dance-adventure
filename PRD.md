# PRD: Alphabet and numbers game for Andrea

Version 0.3, 2026-11-08. Phase 1 built and first playtest done (feedback: voice, too easy, too number-heavy). Version 1.1 changes are in section 8. Single source of truth for scope, requirements and phases. Items marked `[TO CONFIRM]` need Raphael's answer. Items marked `[GUESS]` are my starting values, to tune after playtests.

## 1. Summary

A web game for Andrea (5) that teaches the English and French alphabets, counting and addition up to 20 in both languages, and very simple multiplication. It plays like an animated adventure, not a quiz: animals, an octopus, ballet, unicorns and candy, with music and movement everywhere. Difficulty rises after a few good answers and drops when she is stuck. She earns a reward almost every task.

Working title: "Andrea's Dance Adventure" `[TO CONFIRM]`.

## 2. User

- **Player:** Andrea, 5. Barely reads. Loves animals, octopuses, ballet and dance. Touch device, mostly tablet.
- **Parent (Raphael):** sets language, watches progress, resets or backs up. Hidden parent screen, not visible to Andrea.
- **Success looks like:** she asks to play again, and the parent screen shows letters, sounds and sums moving from shaky to fast and correct. Measured, not assumed.

## 3. Learning scope

Starting level and target range `[TO CONFIRM]`. Proposed ladder, each step unlocked by the adaptive engine, not by a fixed calendar.

**Alphabet (EN and FR, separate audio and example words)**
1. Hear and see letters in sets of about five (A to E, F to J, K to O, P to T, U to Z). Upper case first.
2. Match upper to lower case.
3. Hear a letter name, tap the letter.
4. Letter sounds. In French, letter name and sound are taught separately.
5. First letter of a pictured word (A for apple, A comme avion).
6. Later: finger tracing, accented French letters (é, è, ê, à, ç) `[TO CONFIRM: in scope?]`.

**Numbers**
1. Count objects 1 to 10, then 1 to 20, with spoken numbers (one to twenty, un à vingt).
2. Recognise numerals 0 to 20. Number words on screen come late, spoken first.

**Addition up to 20**
1. Within 5, with objects to count.
2. Within 10: doubles, making 10, counting on.
3. Within 20: bridging through 10.
- Fact set: every ordered pair a + b with a, b from 1 and sum up to 20 = 190 facts.

**Very simple multiplication**
1. Equal groups: count the groups, count the items.
2. Repeated addition (2 + 2 + 2 = 6).
3. Tables: ×2, ×10, then ×5 `[TO CONFIRM: which tables]`. Understanding first, recall later.

**Language mode:** English or French chosen at the start, one language per session, no mixing inside a question. Bilingual mode is a later phase `[TO CONFIRM]`.

## 4. Game design

**Structure.** Several themed worlds, each a different setting and kind of game, unlocked by finishing the previous one. A friendly guide character `[TO CONFIRM]` narrates. Chapters last 5 to 10 minutes and end on a win and a small cliffhanger.

**Theme and world ideas** (names and art to agree)
- Octopus Ballet Cove: an octopus dance school. Catch falling letters on the beat, count arms and tutus, add to fill a stage.
- Animal Dance Meadow: animals line up in pairs and groups, equal-groups and doubles.
- Candy Cloud Kingdom: unicorns and candy. Fill baskets to 10 and to 20, share candy into equal groups.
- Further worlds later, e.g. an ocean and a night-sky world. Also on Andrea's list: "novels" in my voice note, probably a mis-transcription (narwhals? stories?) `[TO CONFIRM]`.

**Game types, mixed so no two feel alike:** catch the letter, build a word from its first letter, count the fireflies, fill the basket to 10, balance the scales, dance sequence (tap the numbers in order), share equally, which group has more.

**Adaptive engine**
- Every item (a letter, a sound, a sum) has a level and a record: correct first try, hints used, time taken.
- Up: 3 correct in a row on first try moves her up a level `[GUESS]`.
- Down: 2 misses in a row, or long hesitation, steps back to easier items and adds a hint `[GUESS]`.
- Selection: most items drawn from her weak and mid items, a few strong ones for confidence, a few from earlier worlds for review `[GUESS: 60/30/10]`.
- Weak items return inside new game types.
- Mastery of an item (for the parent screen): correct and quick on 3 separate days `[GUESS]`.
- No timers visible to her. Time is measured silently.

**Wrong answers.** Never punished. The guide shows the answer with a hint (objects to count, the letter heard again) and she tries again. After a second miss the answer is revealed and the item returns a few tasks later. Nothing is lost.

**Rewards**
- Frequent: a small animated reward after almost every task (sparkle, candy, a dance move from the guide).
- Collection: unicorns in colours and kinds, candies, stickers, treasures, kept for good.
- Surprise boxes at chapter ends. Dress up and look after a unicorn. A candy land or stage that grows with progress.
- Rewards follow effort, streaks and improvement, not only correct answers.
- Original unicorn, candy and animal art only. No flashing.

## 5. Animation, music and audio

- **Animation first:** CSS, SVG and canvas. Characters dance, react to every answer, and letters and numbers move. Nothing important is a static image.
- **Music and rhythm:** generated in the browser, with alphabet and counting songs and ballet-style beats. Sound toggle always visible.
- **Video:** short animated clips as chapter openers and big rewards, only if approved `[TO CONFIRM]`. Local files, small, compressed, loaded per world, offline, skippable, no flashing, sound follows the toggle.
- **Voice:** recorded audio preferred (parent's voice or a clean recording) because letter names and sounds must be right in both languages. Text-to-speech only as a fallback, after testing English and French voices on the target devices `[TO CONFIRM]`. Personal recordings live in `game/audio/private/`, never published.

## 6. Requirements

**Functional**
- F1. Language choice at start, remembered.
- F2. Worlds, chapters and tasks as in section 4, driven by the adaptive engine.
- F3. Instruction for every task spoken aloud and shown with an image. On-screen text limited to a letter, a number or one word.
- F4. Tap and drag only. No typing.
- F5. Save after every answer, resume mid-chapter. Device storage only.
- F6. Reward collection screen, persistent.
- F7. Parent screen (hidden, press and hold): per-item stats, language and level settings, backup export and import, reset. Layout `[TO CONFIRM]`.

**Non-functional**
- Plain HTML, CSS and JS. No framework, no build step, no dependency without approval.
- Works offline once loaded. Tablet and phone first, desktop too.
- Very large touch targets, big friendly type, strong contrast, no flashing, sound toggle.
- Smooth animation on a mid-range tablet `[TO CONFIRM: which device?]`.
- Original characters and art. No copyrighted characters or brands.

**Safety**
- No ads, accounts, chat, external links, tracking or personal data. Progress on device only. "Andrea" is the only personal detail on screen.

## 7. Content and testing

- Maths exact. Automated tests cover all 190 addition facts (sum up to 20), every multiplication fact in scope, the question generator, the answer checker, and the level up and down rules.
- French is native-quality, not translated English: number words (dix-sept, dix-huit, dix-neuf, vingt), letter names, gender, grammar. Raphael reviews French and English copy before release.
- Every letter and number has audio in both languages. A test lists any item missing audio.
- No claims about learning science without a source. Mark `[TO CONFIRM]`.
- Preview in the built-in browser at tablet and phone widths before each playtest.

## 8. Phases

0. **PRD agreed** (this document).
1. **Smallest playable (BUILT 2026-11-07, 21 tests pass, not yet playtested):** language choice, save and resume, adaptive engine, one world (Octopus Ballet Cove) with letters set 1 and counting and addition within 10, reward collection (unicorns and candy), animated guide, generated music, parent screen basics. Tests for the maths and the level rules.
2. **Full content:** all 26 letters with sounds, addition to 20, 2 to 3 more worlds, more game types, surprise boxes, unicorn care.
3. **Multiplication and songs:** equal groups, repeated addition, ×2, ×10, ×5. Alphabet and counting songs. Video clips if approved.
4. **Polish and publish:** tablet testing, performance, hosting choice `[TO CONFIRM]`, private audio excluded from any host.

Phase 1 as built: 5 levels (letters A to E, counting 1 to 10, upper/lower case, first letter of a picture word, addition within 5, within 10, make 10), 10-task chapters, surprise box with 8 collectible unicorns, candies, octopus guide, waltz music, parent area. Not in phase 1 yet: letter sounds, addition 11 to 20, unicorn care, more worlds, songs, video, recorded voice. Picture words and counting objects use emoji (not original art) `[TO CONFIRM]`.

**Version 1.1 (2026-11-08), after Andrea's first playtest.** Feedback: the voice is poor and not young or fun, the maths is too easy, letters are too easy and numbers dominate. Changes:
- **Two tracks.** Letters and numbers each have their own level and alternate about 50/50 (never three of one kind in a row). Levels rise after 3 first-try correct answers in that track and fall after 2 misses. Letters go to level 8, numbers to level 10.
- **Letters:** all 26 letters (names, upper/lower case), first letter of a picture (21 letters), alphabet gaps (A _ C), odd one out by first letter, missing letter in a word or name (Andrea, Daddy, Mummy / Papa, Maman), spell a word by tapping scrambled letters (3 to 6 letters, names included), pick the written word for a picture. About 60 picture words per language.
- **Numbers:** counting to 20, number patterns (steps of 1, 2, 5, 10, also counting back), bigger/smaller to 30, addition to 30 (teens, bridging ten, tens plus ones), subtraction within 20, missing number (a + ? = b, make 10 and 20), doubles to 15, halves of even numbers to 20, tens and ones to 59, equal groups (2 to 5 groups of 2, 3 or 5, up to 25). Story versions of sums with a unicorn from level 6.
- **Curriculum basis:** England Year 1 (number bonds and subtraction within 20, groups and sharing, doubling and halving) and the French CP cycle 2 programme 2024 (doubles to 10, halves of even numbers to 20, mental calculation within 100) [sources in MEMORY.md]. The exact Year 1 and CP wording was not checked against the original documents `[TO CONFIRM]`.
- **Voice:** the game now picks the best female browser voice per language (favouring "Natural" and child-like voices where installed), with a higher pitch. The parent area has a voice picker, pitch and speed, and a Test button. Recorded clips are supported (`audio/voice/manifest.json`) and the parent area lists every phrase to record. A truly young, fun voice needs recordings `[TO CONFIRM]`.
- **Not in 1.1:** letter sounds, recorded voice, songs, video, more worlds, unicorn care.

Playtest with Andrea after phases 1, 2 and 3. Feedback goes back to me in one batch.

## 9. Open questions

1. Starting level and target range.
2. Which multiplication tables, and when.
3. Guide character, world names, game title.
4. What "novels" meant (narwhals? stories?).
5. Video clips: yes or no, and source.
6. Voice: recorded parent voice or text-to-speech.
7. Accented French letters: now or later.
8. Adaptive thresholds (3 up, 2 down, mastery rule): confirm or tune after the first playtest.
9. Target device for performance testing.
10. Hosting for phase 4.

## 10. Risks

- **Animation scope.** Rich animation in plain JS is the biggest effort. Mitigation: a small set of reusable animated characters and effects, reused across worlds.
- **Voice quality.** Wrong letter sounds teach the wrong thing. Mitigation: recorded audio, reviewed by Raphael.
- **Too much stimulation.** Heavy rewards can distract from the task. Mitigation: playtest, keep rewards short, tie them to answers.
- **Difficulty tuning.** Thresholds are guesses. Mitigation: tune after the first session with Andrea.
