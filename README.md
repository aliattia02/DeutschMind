# DeutschMind 🇩🇪

**A browser-based German learning platform: no server, no login, no build step.**

Live at **[deutschmind.clidatech.com](https://deutschmind.clidatech.com)** (GitHub Pages).

---

## ✨ What Makes DeutschMind Different

### 🔵🔴🟢 Der·Die·Das Color Coding
Grammatical gender has the same color on every vocabulary page: `der` blue,
`die` red, `das` green. Gender becomes visual memory.

### 🏥 FSP Exam Preparation
A dedicated module for the **Fachsprachenprüfung**, the German specialty-language
exam for pharmacy and healthcare professionals. It covers 10+ legal and
professional topics, including drug law, narcotics law, labor law, pharmacy
operations, health insurance (SGB V) and pharmacoeconomics.

### 🎙️ Built-in Text-to-Speech
German pronunciation comes from the **Web Speech API**, with no audio files to
host. Speed is adjustable and a voice selector lists every installed German
voice. Every row can be played on its own, and each table can be played in
sequence with the playing row highlighted. You can hear German only, or German
and English together.

> Quality depends on the voices installed in your OS/browser. Chrome and Edge
> ship good German voices. On Linux you may need to install one.

### 📹 Record Mode
Study-Ready units have a presentation mode for making video lessons. It shows
full-screen title cards, plays each section's audio, and at the end copies a
list of **chapter timestamps** for the video description. Use it together with
any screen recorder.

### 🎓 CEFR-Tagged Content
Every vocabulary entry is tagged A1–B2. Each vocabulary page has a one-click
filter: A1 / A2 / B1 / B2 / All.

---

## 📚 What's Available

| Section | Location | Content |
|---|---|---|
| **Study-Ready vocabulary** | `vocabulary/Study-Ready/` | 26 thematic units. Each has nouns (der/das/die), adjective and verb opposite pairs, expressions, conversations, Q&A and full sentences |
| **Thematic (interactive)** | `vocabulary/Thematic/` | 25 tabbed versions of the same topics |
| **FSP** | `vocabulary/FSP/` | Pharmacy-law vocabulary for the Fachsprachenprüfung |
| **Grammar** | `grammar/` | Articles, nominative case, plurals, present tense, sentence structure, Perfekt (A2) |
| **Level hubs** | `Pages/level-a1…b2.html` | A curated path through the material per CEFR level |

**Not built yet:** flashcards, quiz, progress tracker, study planner,
practice pages, resources, about/contact/settings, and C1/C2 levels. These
pages exist as placeholders. See [docs/KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md).

---

## 🚀 Quick Start

```bash
git clone https://github.com/aliattia02/DeutschMind.git
cd DeutschMind
python -m http.server 8080    # then open http://localhost:8080
```

You can also open `index.html` directly. Pages work from `file://`. Study-Ready
pages load Google Fonts and fall back to system fonts when offline.

---

## 🗂️ Project Structure

```
index.html, 404.html        Landing page and GitHub Pages 404
Pages/                      Level hubs (A1–B2) and vocabulary/grammar hubs
vocabulary/
  Study-Ready/              Main vocabulary units (NN_Topic_combined.html) + hub main.html
  Thematic/                 Older tabbed "interactive" units
  FSP/                      Fachsprachenprüfung units + hub main.html
grammar/                    Grammar lessons + shared grammar-base.css/js
tools/ practice/ resources/ Placeholders for planned features
docs/                       Developer documentation
```

Each vocabulary page is self-contained. Its word lists live in CSV-style
template strings inside the page's `<script>` block, next to the rendering and
audio engine. When editing that data, put double quotes around any German text
that contains a comma: `A1,"Ja, gern.",Yes please.` See
[docs/ARCHITECTURE.md §3](docs/ARCHITECTURE.md#3-vocabulary-data-format).

---

## 🛠️ Developer Documentation

- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**: page templates, the vocabulary data format,
  how the engine and Record Mode work, and how to add a new unit
- **[docs/KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md)**: audit of broken links, bugs,
  content errors and technical debt, ranked by impact

---

## Tech Stack

Plain **HTML5, CSS3 and vanilla JavaScript (ES6+)**. No frameworks, no bundler,
no npm dependencies. The only external resource is Google Fonts on the
Study-Ready pages.

## Deploy

Push to `main`. GitHub Pages serves the repository root, and the custom domain
is set in `CNAME`. Any static host works as well: set the publish directory to
`.` with no build command.

> GitHub Pages uses case-sensitive paths. Check that link case matches file
> names exactly.

## License

Proprietary. All rights reserved. See [LICENSE](LICENSE) and contact the author
before reusing any content or code.
