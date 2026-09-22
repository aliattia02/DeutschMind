# DeutschMind — Architecture

DeutschMind is a static site: plain HTML/CSS/JS files served as-is. There is no
build step, no package manager and no backend. Every page is self-contained
enough to open directly from disk (`file://`).

The site is deployed to GitHub Pages at the custom domain in [`CNAME`](../CNAME)
(`deutschmind.clidatech.com`).

---

## 1. Directory layout

| Path | Purpose | Status |
|---|---|---|
| `index.html` | Landing page: level cards (A1–C2) and category cards | Live |
| `404.html` | GitHub Pages "not found" page | Live |
| `about.html`, `contact.html`, `settings.html` | Top-level info pages | **Stubs** ("Content coming soon") |
| `Pages/` | Hub pages: `level-a1…b2.html`, `vocabulary.html`, `grammar.html` | Live |
| `grammar/` | Grammar lessons + shared `grammar-base.css/js` | Mixed — see §2.5 |
| `vocabulary/Study-Ready/` | 26 "combined" vocabulary units (the main product) | Live |
| `vocabulary/Thematic/` | 25 older "interactive" versions of the same units | Live, linked from `Pages/vocabulary.html` |
| `vocabulary/FSP/` | Fachsprachenprüfung (pharmacy law) units | Live |
| `vocabulary/*.html` (top level) | Early vocabulary pages (`a1-vocabulary-*`, `basic-vocabulary-*`, `german_*_tables`) | Mostly orphaned |
| `vocabulary/Nouns.xlsx` | Source spreadsheet for noun data (not used at runtime) | Source data |
| `practice/`, `tools/`, `resources/` | Planned features (flashcards, quiz, progress…) | **All stubs** |
| `docs/` | This document and [KNOWN_ISSUES.md](KNOWN_ISSUES.md) | |

---

## 2. Page families

There are four distinct page "templates". They do **not** share code with each
other; each copies its CSS and JS inline.

### 2.1 Hub pages (`index.html`, `Pages/*.html`)
Static navigation pages with inline `<style>` and a tiny inline script for the
mobile nav toggle (`#navToggle` / `#navLinks`). "Coming soon" buttons are `<a>`
elements **without** an `href`: `class="card-action-btn disabled"` on hub pages,
`class="… is-soon"` on `index.html`. Both set `pointer-events: none`. To turn
one on, add the `href` and remove the class.

### 2.2 Study-Ready vocabulary units (`vocabulary/Study-Ready/NN_*_combined.html`)
The main learning pages. Each file is ~135–160 KB and contains:

1. ~1,100 lines of inline CSS
2. The page markup (controls panel, six tables, Record Mode overlay)
3. One inline `<script>` holding **both** the unit's data (seven CSV template
   strings) **and** a full copy of the vocabulary engine (~1,400 lines)

Units 01–25 carry identical engine code apart from per-unit config.
Unit 26 (`26_Jobs__Interviews_combined.html`) differs slightly: it plays
expressions column by column (see [KNOWN_ISSUES.md](KNOWN_ISSUES.md#code)).

`vocab-engine.js` / `vocab-engine.css` in the same folder are an unfinished
attempt to extract that engine. Only the two orphaned pages
`01_PersonalInformation.html` and `02_FamilyRelationships.html` use them, and
that engine version predates Record Mode.

### 2.3 Thematic interactive units (`vocabulary/Thematic/*_interactive.html`)
An older, tabbed variant of the same 25 topics (~1,700 lines each). It uses the
same data format and `splitCSVLine()` parser, with a simpler engine
(`renderNouns`, `renderAdjectives`, …, `showTab`, `playAllInSection`) and no
Record Mode. Conversations are stored in `conversationsRaw` instead of
`conversationsCSV`, with the same content as the matching Study-Ready unit.
Keep the two in sync when you edit one.

### 2.4 FSP units (`vocabulary/FSP/*`)
Pharmacy-law vocabulary for the Fachsprachenprüfung. The `_combined` files are
derived from the Study-Ready template (without Record Mode); the `_interactive`
files follow the Thematic template.

### 2.5 Grammar lessons (`grammar/*.html`)
Six real lessons link the shared `grammar-base.css` and `grammar-base.js`
(`grammar-articles`, `nominative-case`, `plurals`, `present-tense`, `sentence`,
`a2-grammar-perfekt`). `grammar-base.js` provides tabs, reveal cards, TTS and
keyboard shortcuts, and exposes them as `window.GrammarBase`.

The files `grammar-cases`, `grammar-plurals`, `grammar-structure`,
`grammar-tenses` and `grammar-verbs` are 13-line stubs, and nothing links to
them any more.

---

## 3. Vocabulary data format

Each unit defines seven template strings of comma-separated lines. Blank lines
and lines starting with `//` are skipped; the `//` lines are cluster headings
for the author. Every line is split by `splitCSVLine()`:

```js
splitCSVLine('A1,"Ja, gern.",Yes please.')            // → ['A1', 'Ja, gern.', 'Yes please.']
splitCSVLine('A1,Frage?,Antwort, mit Komma.', 3)      // → ['A1', 'Frage?', 'Antwort, mit Komma.']
```

**Rule: if a German field contains a comma, wrap it in double quotes.** German
needs commas before *weil / dass / wenn / ob / aber / sondern*, after
*Ja / Nein*, around relative clauses, and in decimals (`1,6`). Leaving the
quotes off shifts every column after it. The last column never needs quotes:
the English column and the Q&A answer column take the rest of the line. The
data must not contain a literal `"` other than as field delimiters. Use „…“
for German quotation marks.

| Constant | Columns | Example |
|---|---|---|
| `nounsCSV` | `level,article,singular,pluralSuffix,pluralFull,english` | `A1,das,Haus,Häuser,die Häuser,House` |
| `adjectivesCSV` | `level,word1,english1,word2,english2` — `-` prefix marks an opposite pair | `A1,-sauber,clean,-schmutzig,dirty` |
| `verbsCSV` | `level,verb1,english1,verb2,english2` — `*` weak, `+` strong | `A1,*putzen,clean,*aufräumen,tidy up` |
| `expressionsCSV` | `level,german,english…` | `A1,Das ist mein Zimmer.,This is my room.` |
| `conversationsCSV` | `level\|title\|speaker,german,english…` | `A1\|Neue Wohnung besichtigen\|B,"Ja, und es ist hell. Das Fenster geht auf den Garten.",Yes and it is bright. …` |
| `qaCSV` | `level,question,answer (translation)…` | `A2,"Was machst du, wenn du krank bist?",Ich bleibe im Bett und trinke viel. (I stay in bed and drink a lot.)` |
| `sentencesCSV` | `level,german,english…` | `A1,Die Wohnung hat drei Zimmer.,The flat has three rooms.` |

`level` is one of `A1`, `A2`, `B1`, `B2`. The level filter
(`filterByLevel`) re-renders every table with rows where
`currentLevel === 'all' || row[0] === currentLevel`.

Values are inserted into the page with `innerHTML` and inline `onclick`
handlers. `escAttr()` escapes each value for the JS string literal and then for
the HTML attribute. Displayed cell text is inserted as-is, so keep `<` and `&`
out of the data.

---

## 4. Vocabulary engine (Study-Ready template)

The main function groups, in the order they appear in each file:

| Area | Functions | Notes |
|---|---|---|
| Rendering | `renderNounsTable`, `renderWordsTable`, `renderExpressionsTable`, `renderConversations`, `renderQATable`, `renderSentencesTable` | Nouns are grouped by der/das/die. Adjective/verb tables put row `i` on the left and row `i + ceil(n/2)` on the right. Expressions put rows `i` and `i+1` side by side. |
| Level filter | `filterByLevel`, `updateFilterCount`, `badge` | |
| Zoom | `zoomIn/Out/ResetVocab`, `zoomIn/Out/ResetPhrases` | Two independent zoom levels (vocabulary tables and phrase tables) |
| Text-to-speech | `loadVoices`, `warmUpTTS`, `speak`, `speakNow`, `stopAllSpeech`, `speakEnglish`, `speakNounRow`, `speakPair`, `speakBilingual` | Web Speech API. German utterances use `de-DE`; English ones use `en-US` and the best English voice found. If no German voice is installed, `germanVoice` stays `null` and the browser picks one from the language tag. **Never** fall back to an arbitrary voice. `loadVoices` runs several times as voices load, and it keeps the user's selection. Rate comes from `#speedControl` (default 0.8). |
| Sequenced playback | `collect*Items`, `playSection`, `playNextInSequence`, `togglePause`, `toggleGermanOnly` | `collect*Items` builds `{text, lang, el, side}` items from the data **and** the rendered DOM rows so the playing row can be highlighted. The collectors must mirror the renderer's layout. |
| Record Mode | `startRecordingMode`, `_syncRecCounts`, `showCard`, `renderOverlayCard`, `showCountdown`, `playAudioSectionAsync`, `_logChapter`, `_recElapsed`, `_finishRecording` | See §5 |

Per-unit configuration inside the script:

- `REC_UNIT`, `REC_TOPIC` — unit number and title
- `REC_CARDS` — title cards for Record Mode. The word counts in `bottomL` are
  overwritten from the data by `_syncRecCounts()` when Record Mode starts, so
  the values in the file are only placeholders.
- The `FULL_SEQ` chapter labels in `startRecordingMode` repeat the topic name.

---

## 5. Record Mode

Record Mode is a **presentation mode for an external screen recorder** (for
example to make YouTube lessons). It does not record anything itself.

1. The user starts a screen recorder, then clicks **Record Mode**.
2. After a countdown, the page steps through `FULL_SEQ`. It shows a full-screen
   title card (`showCard`, 3 s) and then plays that section's audio.
3. Each step adds a `m:ss Label` line (`h:mm:ss` after one hour) to
   `recChapters`. Times are measured from the end of the countdown, and time
   spent paused (⏸ in the mini bar) is left out.
4. When playback ends, the chapter list is copied to the clipboard and shown in
   `#chapterModal`, ready to paste into a video description.

Pausing is left out because the recorder is expected to be paused along with the
page. If you keep recording through a pause, the chapters after it will be
early by the paused time. Timestamps also start after the countdown, so start
the recorder right before clicking Record Mode.

---

## 6. Adding a new Study-Ready unit

Until the engine is extracted into a shared file (recommended — see
KNOWN_ISSUES), use this procedure:

1. Copy an existing unit from 01–25, for example
   `25_Time__Daily_Routine_combined.html`. Name the copy
   `NN_Topic_Name_combined.html`, with no spaces or parentheses.
2. Replace the seven CSV blocks. Put double quotes around any German field that
   contains a comma (see §3).
3. Update `REC_UNIT`, `REC_TOPIC` and the cover card's `titleLines`. Word counts
   are computed automatically.
4. Update the `<title>`, the `<h1>`, the "Topic:" footer line, and the intro
   label in `FULL_SEQ`.
5. Add a card linking to the new file in `vocabulary/Study-Ready/main.html`.
6. Open the file locally. Check each level filter, each section's ▶ Play, and
   one Record Mode run. The browser console should show no errors.

---

## 7. Local development

```bash
# either open directly
start index.html          # Windows
open index.html           # macOS

# or serve (closer to GitHub Pages behaviour: case-sensitive paths, 404.html)
python -m http.server 8080
```

GitHub Pages is served from a case-sensitive file system. A link whose case
differs from the file name works on Windows and macOS but returns 404 in
production.
