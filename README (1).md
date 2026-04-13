# DeutschMind 🇩🇪

**A fully offline, browser-based German language learning platform — no server, no login, no build step.**

---

## ✨ What Makes DeutschMind Different

### 🔵🔴🟢 Der·Die·Das Color Coding
Grammatical gender is color-coded consistently across every vocabulary page — `der` in blue, `die` in red, `das` in green. No more guessing. Gender becomes visual memory.

### 🏥 FSP Exam Preparation
A dedicated module for the **Fachsprachenprüfung** — the German specialty-language exam required for pharmacy and healthcare professionals. Covers 10 legal and professional topics including drug law, narcotics law, labor law, pharmacy operations, health insurance, and pharmacoeconomics. Rare to find this in any free language tool.

### 🎙️ Built-in Text-to-Speech Engine
Native German pronunciation via the **Web Speech API** — no audio files to host or download. Adjustable speed (0.5×–1.5×) and pitch, with a voice selector to choose from available system voices. Works in Chrome, Edge, Firefox, and Safari.

### 📹 Record Mode with Chapter Timestamps
The vocabulary engine includes a built-in **screen-recording helper** that automatically generates chapter timestamps as audio plays through vocabulary sections — useful for creating study recordings you can rewind by topic.

### 📶 Fully Offline — Zero Dependencies
No npm, no CDN, no external fonts, no analytics, no tracking. The entire platform runs from a single folder with `open index.html`. It also works served from `file://` — no localhost required.

### 🎓 CEFR-Structured Content (A1 → C2)
All 3,000+ vocabulary words and 60+ grammar topics are tagged and filterable by level. Switch between A1 / A2 / B1 / B2 / All with one click on any vocabulary page.

---

## Quick Start

```bash
git clone https://github.com/aliattia02/DeutschMind.git
cd DeutschMind
open index.html
# or serve locally:
python3 -m http.server 8080
```

No install step. No configuration.

---

## Tech Stack

Pure **HTML5 + CSS3 + Vanilla JavaScript (ES6+)**. No frameworks, no bundler, no dependencies.

---

## Deploy

Push to any static host — GitHub Pages, Netlify, or Vercel. Set the publish directory to `.` (root). No build command needed.

---

## License

No license file detected. Contact the author before reuse.
