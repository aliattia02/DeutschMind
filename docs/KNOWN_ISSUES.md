# DeutschMind — Known Issues

The first audit ran on 2026-09-22 against commit `0f329ce`, using static analysis
of all files: a link checker, duplicate-code comparison, and manual review of
the shared JavaScript. The fixes in §1 came out of that audit. §2 lists what's
still open.

Severity: 🔴 users hit it today · 🟠 wrong or misleading behaviour · 🟡 maintainability / hygiene

---

## 1. Fixed

| Issue | Fix |
|---|---|
| 🔴 **~300 German sentences were missing required commas** (before *weil / dass / wenn / ob / aber / sondern*, after *Ja / Nein*, around relative clauses). The data format split every line on `,`, so commas had been removed from the German. | The data parsers now go through `splitCSVLine()`, which supports quoted fields (see [ARCHITECTURE.md §3](ARCHITECTURE.md#3-vocabulary-data-format)). Each sentence was reviewed by hand and corrected in all 26 Study-Ready and 25 Thematic units. Two sentences were also grammatically incomplete (*"wenn man aufgeht was man tut"*, *"Wie gehst du um wenn…"*) and are corrected. |
| 🔴 Unit 26 rows with decimal commas (*Note 1,6*, *8,7 von 10*) were split mid-sentence. | Quoted fields. |
| 🔴 **Units 04 (Body & Health) and 08 (Clothing) showed wrong conversations or crashed.** Unit 04 threw `ReferenceError: conversationsCSV is not defined`, which left its Conversations, Q&A and Sentences tables empty. Both files carried an unused copy of unit 02's family dialogues. | Stray copies removed. Both units now declare an empty `conversationsCSV` and show "No conversations". |
| 🔴 **All 25 Thematic units showed the same four family conversations**, whatever the topic. | Each Thematic unit now uses the topic-specific conversations from its Study-Ready counterpart. |
| 🔴 Homepage linked to five missing pages (C1, C2, Tools, Practice, Resources hubs). | Shown as greyed-out "Coming Soon" (`.is-soon`, no `href`). Category sub-links to placeholder pages are disabled the same way. |
| 🔴 Grammar "related topics" links used an old `a1-grammar-*.html` scheme. | Now point to the existing lessons. |
| 🟠 The A1 hub showed "Coming Soon" for four lessons that already exist (articles, plurals, present tense, nominative). The finished Perfekt lesson had no inbound links. | Enabled on `Pages/level-a1.html`. Perfekt is linked from `Pages/level-a2.html` and `Pages/grammar.html`. |
| 🟠 **German text was read with an English voice** when no German voice was installed, or when "No German voice" was selected. | `germanVoice` stays `null`, so the browser chooses a voice from `utterance.lang = 'de-DE'`. Applied to all 69 engine copies and `grammar-base.js`. |
| 🟠 The user's voice choice was reset every time `voiceschanged` fired. `grammar-base.js` also added another `change` listener on each reload of the voice list. | The current choice is kept. The listener is attached once. |
| 🟠 Record Mode chapter timestamps included paused time and had no hours field. | `_recElapsed()` excludes paused time. `_fmtTs` prints `h:mm:ss` after one hour. |
| 🟠 Record Mode word counts were hard-coded and stale. Unit 04 showed unit 03's numbers, unit 26 showed unit 25's, and 01/02 counted adjectives differently. | `_syncRecCounts()` computes them from the data when Record Mode starts. |
| 🟠 Unit 26 was titled and recorded as "25: Time & Daily Routine". | Relabelled "26: Jobs & Interviews". |
| 🟡 `escAttr()` only escaped `\` and `'` for values placed in `onclick="…"`. | Also HTML-escapes `&`, `"` and `<`. |
| 🟡 Thematic unit 01 nav used `../` instead of `../../`. | Fixed. |
| 🟡 File names with spaces and download suffixes: `26_Job_combined (4).html`, `german_phrases_tables (2).html`, six FSP `… (1).html` files. | Renamed (`26_Jobs__Interviews_combined.html`, suffixes dropped) and links updated. |
| 🟡 Dead files: `draft/`, `grammar/draft/`, empty `assets/css/main.css` and `assets/js/main.js`, stale `treemap.txt`. | Deleted; still available in git history. |
| 🟡 Minor: `replace('🔊')` removed only the first emoji; no-op `setTimeout` in `toggleRecPause`; disabled "Coming Soon" buttons had `href`s to missing files. | Fixed. |

After these fixes the link checker reports **0 broken internal links**, and every
changed page's inline scripts pass `node --check`.

---

## 2. Open

### Needs content or a decision

- 🔴 **Placeholder pages.** Everything in `tools/`, `practice/` and `resources/`, plus `about.html`,
  `contact.html` and `settings.html`, is a 13-line "Content coming soon…" page. The homepage disables
  its links to them, but the shared nav on every hub page still links to `tools/progress.html`.
- 🟠 **Units 04 and 08 have no conversations.** They need topic-appropriate dialogues, in both
  Study-Ready and Thematic.
- 🟠 **Orphaned legacy pages.** Nothing links to these. Link them or delete them:
  `vocabulary/a1-vocabulary-{body,family,Timing-Numbers}.html`,
  `vocabulary/basic-vocabulary{,-food,-home-living}.html`, `vocabulary/german_phrases_tables.html`,
  `vocabulary/german_vocab_tables6.html`, and `vocabulary/Study-Ready/01_PersonalInformation.html` and
  `02_FamilyRelationships.html` (the unfinished `vocab-engine.js` refactor).
- 🟡 The grammar stubs `grammar-cases`, `grammar-structure`, `grammar-tenses`, `grammar-verbs` and
  `grammar-plurals` are no longer linked. Delete them, or turn them into redirects.

### Content quality

- 🟠 **German punctuation beyond the reviewed set.** The correction pass covered sentences matched by
  conjunction and interjection patterns, reviewed by hand. Missing commas in lists
  (*"Luft Wasser oder Boden"*), before infinitive groups, and in less common constructions may remain.
  Native-speaker proofreading of the data is recommended.
- 🟠 **FSP data was not reviewed.** The FSP units have their own copies of the engine and still use
  plain comma splitting.
- 🟡 **English translations had their commas stripped too** (*"Yes he is very funny"*). They're
  readable, but unpolished.

### Code

- 🟡 **The vocabulary engine is still copy-pasted into ~75 files** (26 Study-Ready, 25 Thematic, FSP).
  Every fix in §1 was applied by script to each copy. The long-term fix is to finish extracting the
  engine into `vocabulary/Study-Ready/vocab-engine.js`, keep only data plus a `VocabEngine.init({...})`
  call per unit, and apply the same approach to Thematic.
- 🟡 **Unit 26 plays expressions in a different order.** Its `collectExprItems` plays the left column
  and then the right. Units 01–25 play row by row, which matches the table layout. Pick one.
- 🟡 **Record Mode timestamps start after the in-page countdown**, not when the screen recorder
  started. Start the recorder right before clicking Record Mode, or shift the chapter list.
- 🟡 199 `alert()` calls and ~500 `console.log` calls are left in production pages.
- 🟡 Some FSP file names have lost umlauts (`Arznimittel`, `Betubungsmittel`, `Buchfhrung`,
  `Pharmakokonomie`).

### SEO / metadata

- 🟡 No page has a `<meta name="description">`. There is no `sitemap.xml` or `robots.txt`.
- 🟡 Each Study-Ready unit shares its `<title>` with the matching Thematic unit. Seven legacy pages
  share "German Vocabulary - Interactive Audio Learning".
- 🟡 28 Study-Ready pages load Google Fonts, so they fall back to system fonts when offline.
