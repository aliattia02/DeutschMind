/**
 * vocab-engine.js — Shared engine for all German Vocabulary units
 * aliattia02 · DerDieDas Method
 *
 * Usage in each topic HTML file:
 *   VocabEngine.init(config);
 *
 * config shape: { unit, topic, heading, subtitle, footerTopic,
 *   nounsCSV, adjectivesCSV, verbsCSV, expressionsCSV,
 *   conversationsCSV, qaCSV, sentencesCSV, recCards,
 *   units[] }   ← units is an array for the nav bar
 */

(function () {
    'use strict';

    // ── Private state ──────────────────────────────────────
    let _cfg = null;

    // Active data refs (set by init)
    let nounsCSV, adjectivesCSV, verbsCSV, expressionsCSV,
        conversationsCSV, qaCSV, sentencesCSV, REC_CARDS;

    let currentLevel = 'all';
    let vocabZoom = 100, phrasesZoom = 100;
    const zoomStep = 10, minZoom = 50, maxZoom = 200, baseFontSize = 0.7;

    // TTS
    let germanVoice = null, englishVoice = null;
    let isSpeaking = false, isPlayingSequence = false, ttsWarmedUp = false;

    // Playback
    let playAllActive = false, playAllIndex = 0, playAllTexts = [];
    let currentPlaySection = null, isPaused = false;

    // Record mode
    let recModeActive = false, recIsPaused = false;
    let recStartTime = null, recChapters = [], recTsInterval = null;

    // ── HTML shell builder ─────────────────────────────────
    function _buildShell(cfg) {
        const navLinks = (cfg.units || []).map(u =>
            `<a href="${u.file}" class="${u.unit === cfg.unit ? 'active' : ''}">${u.unit} — ${u.label}</a>`
        ).join('');

        return `
<button class="controls-toggle" id="controlsToggle" onclick="VocabEngine._toggleControls()">⚙ Controls</button>
<div class="controls" id="controlsPanel">
  <div class="controls-main">
    <div class="controls-top">
      <span class="filter-label">🎯</span>
      <button class="level-btn active" data-level="all" onclick="VocabEngine._filter('all')">All</button>
      <button class="level-btn" data-level="A1"  onclick="VocabEngine._filter('A1')">A1</button>
      <button class="level-btn" data-level="A2"  onclick="VocabEngine._filter('A2')">A2</button>
      <button class="level-btn" data-level="B1"  onclick="VocabEngine._filter('B1')">B1</button>
      <button class="level-btn" data-level="B2"  onclick="VocabEngine._filter('B2')">B2</button>
      <span class="filter-count" id="filterCount"></span>
      <button class="controls-close" onclick="VocabEngine._toggleControls()">✕</button>
    </div>
    <div class="audio-panel">
      <div class="audio-row-top">
        <span class="audio-panel-title">🔊</span>
        <label for="voiceSelect">Voice:</label>
        <select id="voiceSelect"><option value="">Loading…</option></select>
        <label for="speedControl">Speed:</label>
        <input type="range" id="speedControl" min="0.5" max="1.5" step="0.1" value="0.8">
        <span class="speed-val" id="speedValue">0.8×</span>
        <button class="play-all-btn" onclick="VocabEngine._playSection('all')">▶ All</button>
        <button class="pause-btn" id="pauseBtn" onclick="VocabEngine._togglePause()">⏸ Pause</button>
        <button class="record-btn" id="recModeBtn" onclick="VocabEngine._startRec()">🔴 Record</button>
        <button class="stop-rec-btn" id="stopRecBtn" onclick="VocabEngine._stopRec()">⏹ Stop</button>
        <span class="rec-start-label">from:</span>
        <select class="rec-start-select" id="recStartFrom">
          <option value="0">🎬 Cover</option>
          <option value="1">📖 Nouns</option>
          <option value="2">🔵 der</option>
          <option value="3">🟢 das</option>
          <option value="4">🔴 die</option>
          <option value="5">📖 Adj &amp; Verbs</option>
          <option value="6">🟠 Adjectives</option>
          <option value="7">🩵 Verbs</option>
          <option value="8">💬 Phrases Divider</option>
          <option value="9">🟣 Expressions</option>
          <option value="10">💙 Conversations</option>
          <option value="11">🤎 Q&amp;A</option>
          <option value="12">🔷 Sentences</option>
        </select>
      </div>
      <div class="audio-row-sections">
        <span class="audio-section-label">play:</span>
        <button class="section-play-btn" id="btnDer" data-art="der" onclick="VocabEngine._playSection('der')">▶ der</button>
        <button class="section-play-btn" id="btnDas" data-art="das" onclick="VocabEngine._playSection('das')">▶ das</button>
        <button class="section-play-btn" id="btnDie" data-art="die" onclick="VocabEngine._playSection('die')">▶ die</button>
        <span class="audio-sep">|</span>
        <button class="section-play-btn" id="btnAdj"  onclick="VocabEngine._playSection('adj')">▶ Adj</button>
        <button class="section-play-btn" id="btnVerb" onclick="VocabEngine._playSection('verb')">▶ Verbs</button>
      </div>
      <div class="audio-row-sections">
        <span class="audio-section-label">play:</span>
        <button class="section-play-btn" id="btnExpr" onclick="VocabEngine._playSection('expr')">▶ Expr</button>
        <button class="section-play-btn" id="btnConv" onclick="VocabEngine._playSection('conv')">▶ Conv</button>
        <button class="section-play-btn" id="btnQa"   onclick="VocabEngine._playSection('qa')">▶ Q&amp;A</button>
        <button class="section-play-btn" id="btnSent" onclick="VocabEngine._playSection('sent')">▶ Sent</button>
      </div>
    </div>
    <div class="secondary-controls-toggle">
      <button class="sec-toggle-btn" id="secToggleBtn" onclick="VocabEngine._toggleSecondary()">⚙ Zoom &amp; Print</button>
    </div>
    <div class="secondary-controls" id="secondaryControls">
      <div class="zoom-row">
        <span class="zoom-label">📚 Vocab:</span>
        <button class="zoom-btn" onclick="VocabEngine._zoomOutV()">−</button>
        <span class="zoom-level" id="zoomLevelVocab">100%</span>
        <button class="zoom-btn" onclick="VocabEngine._zoomInV()">+</button>
        <button class="zoom-btn" onclick="VocabEngine._zoomResetV()">⟲</button>
      </div>
      <span class="zoom-sep">|</span>
      <div class="zoom-row">
        <span class="zoom-label">💬 Phrases:</span>
        <button class="zoom-btn" onclick="VocabEngine._zoomOutP()">−</button>
        <span class="zoom-level" id="zoomLevelPhrases">100%</span>
        <button class="zoom-btn" onclick="VocabEngine._zoomInP()">+</button>
        <button class="zoom-btn" onclick="VocabEngine._zoomResetP()">⟲</button>
      </div>
      <button class="print-button" onclick="window.print()">🖨️ Print</button>
    </div>
  </div>
</div>

<div class="content-wrapper">
  <div class="header">
    <h1>${cfg.heading}</h1>
    <p style="font-size:0.75em;color:#555;">${cfg.subtitle}</p>
  </div>

  <div id="vocabSection">
    <div class="table-section">
      <h2>Table 1: Nouns (Die Nomen)</h2>
      <table class="noun-table">
        <colgroup>
          <col class="noun-col-art"><col class="noun-col-german">
          <col class="noun-col-plural"><col class="noun-col-eng">
          <col class="noun-col-art"><col class="noun-col-german">
          <col class="noun-col-plural"><col class="noun-col-eng">
        </colgroup>
        <thead><tr>
          <th>Article</th><th>German</th><th>Plural ±</th><th>English</th>
          <th>Article</th><th>German</th><th>Plural ±</th><th>English</th>
        </tr></thead>
        <tbody id="nounTableBody"></tbody>
      </table>
    </div>
    <div class="table-section">
      <h2>Table 2: Adjectives &amp; Verbs with Opposites</h2>
      <table class="word-table">
        <thead><tr>
          <th>German</th><th>English</th><th>German</th><th>English</th>
          <th>German</th><th>English</th><th>German</th><th>English</th>
        </tr></thead>
        <tbody id="wordTableBody"></tbody>
      </table>
    </div>
  </div>

  <div class="section-divider"><h2>💬 PHRASES &amp; SENTENCES</h2></div>

  <div id="phrasesSection">
    <div class="table-section">
      <h2>Table 3: Common Expressions</h2>
      <table class="expressions-table">
        <thead><tr><th>German</th><th>English</th><th>German</th><th>English</th></tr></thead>
        <tbody id="expressionsTableBody"></tbody>
      </table>
    </div>
    <div class="table-section">
      <h2>Table 4: Conversations</h2>
      <div id="conversationsContainer"></div>
    </div>
    <div class="table-section">
      <h2>Table 5: Questions &amp; Answers</h2>
      <table class="qa-table">
        <thead><tr><th>Question</th><th>Answer</th><th>Question</th><th>Answer</th></tr></thead>
        <tbody id="qaTableBody"></tbody>
      </table>
    </div>
    <div class="table-section">
      <h2>Table 6: Complete Sentences</h2>
      <table class="sentences-table">
        <thead><tr><th>German</th><th>English</th><th>German</th><th>English</th></tr></thead>
        <tbody id="sentencesTableBody"></tbody>
      </table>
    </div>
  </div>

  <div class="footer-info">
    <h3>📖 Reference Guide</h3>
    <p><strong>Topic:</strong> ${cfg.footerTopic} &nbsp;|&nbsp; <strong>Created:</strong> 2025 — aliattia02</p>
    <p><strong>Plural Notation:</strong> -e, -er, -n, -en = add ending | Full form = umlaut change | --- = no change | nur P = plural only | = = no change</p>
    <p><strong>Color Coding:</strong>
      <span style="color:#1565C0;font-weight:bold;">■ der (blue)</span> &nbsp;
      <span style="color:#2E7D32;font-weight:bold;">■ das (green)</span> &nbsp;
      <span style="color:#C62828;font-weight:bold;">■ die (red)</span> &nbsp;|&nbsp;
      Adjective rows: <span style="background:#FFF8E1;padding:1px 6px;border:1px solid #ddd;">yellow</span> &nbsp;
      Verb rows: <span style="background:#E1F5FE;padding:1px 6px;border:1px solid #ddd;">blue</span>
    </p>
    <p><strong>Prefix Guide:</strong> - = Adjective &nbsp;|&nbsp; * = Weak Verb (regular) &nbsp;|&nbsp; + = Strong Verb (irregular)</p>
    <p><strong>Levels:</strong>
      <span class="lvl-badge A1">A1</span> Beginner &nbsp;
      <span class="lvl-badge A2">A2</span> Elementary &nbsp;
      <span class="lvl-badge B1">B1</span> Intermediate &nbsp;
      <span class="lvl-badge B2">B2</span> Upper Intermediate
    </p>
  </div>
</div>

<!-- Record overlays -->
<div id="cardOverlay"><div id="overlayCardWrap"><div id="overlayCard"></div></div></div>
<div id="countdownOverlay"><div id="countdownNumber">3</div><div class="countdown-sub">Recording starts…</div></div>
<div id="recMiniBar">
  <div class="rec-indicator"></div>
  <span class="rec-label">REC</span>
  <span class="rec-ts" id="recTs">0:00</span>
  <button id="recPauseBtn" onclick="VocabEngine._toggleRecPause()">⏸ Pause</button>
  <div id="recZoomControls">
    <span class="rz-label">ZOOM</span>
    <span class="rz-label" style="color:rgba(255,255,255,0.5)">📚</span>
    <button class="rz-btn" onclick="VocabEngine._zoomOutV()">−</button>
    <span class="rz-btn" style="cursor:default;min-width:34px;text-align:center" id="recZoomV">100%</span>
    <button class="rz-btn" onclick="VocabEngine._zoomInV()">+</button>
    <span class="rz-sep">|</span>
    <span class="rz-label" style="color:rgba(255,255,255,0.5)">💬</span>
    <button class="rz-btn" onclick="VocabEngine._zoomOutP()">−</button>
    <span class="rz-btn" style="cursor:default;min-width:34px;text-align:center" id="recZoomP">100%</span>
    <button class="rz-btn" onclick="VocabEngine._zoomInP()">+</button>
  </div>
  <button onclick="VocabEngine._stopRec()" style="color:#f88;border-color:rgba(248,136,136,0.3);">⏹ Stop</button>
</div>
<div id="chapterModal">
  <div class="chapter-modal-box">
    <div class="chapter-modal-title">✅ Recording Complete</div>
    <div class="chapter-modal-sub">YouTube chapters copied to clipboard — paste into your video description.</div>
    <pre id="chapterText"></pre>
    <div class="chapter-modal-actions">
      <button onclick="navigator.clipboard.writeText(document.getElementById('chapterText').textContent)" style="background:#667eea;color:white;">📋 Copy Again</button>
      <button onclick="document.getElementById('chapterModal').style.display='none';VocabEngine._exitRec();" style="background:#333;color:rgba(255,255,255,0.65);">Close</button>
    </div>
  </div>
</div>
<div class="audio-status" id="audioStatus">
  <div class="spinner"></div><span id="audioStatusText">Speaking…</span>
</div>
${navLinks.length ? `<nav class="unit-nav"><span class="unit-nav-label">Units:</span>${navLinks}</nav>` : ''}`;
    }

    // ── CSV parser ─────────────────────────────────────────
    function _parseCSV(csv) {
        return csv.split('\n')
            .map(l => l.trim())
            .filter(l => l.length > 0 && !l.startsWith('//'))
            .map(l => l.split(',').map(c => c.trim()));
    }

    function _escAttr(s) { return (s || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }

    // ── Render: Nouns ──────────────────────────────────────
    function _renderNouns() {
        const data = _parseCSV(nounsCSV).filter(r => currentLevel === 'all' || r[0] === currentLevel);
        const grouped = { das: [], der: [], die: [] };
        data.forEach(r => { const [, art, ger, pn, pf, eng] = r; if (grouped[art]) grouped[art].push({ art, ger, pn, pf, eng }); });
        let html = '';
        [
            { key: 'der', label: 'Maskulinum (der)', rowClass: 'der-row', artClass: 'der-article' },
            { key: 'das', label: 'Neutrum (das)',    rowClass: 'das-row', artClass: 'das-article' },
            { key: 'die', label: 'Femininum (die)',  rowClass: 'die-row', artClass: 'die-article' },
        ].forEach(({ key, label, rowClass, artClass }) => {
            const words = grouped[key]; if (!words.length) return;
            html += `<tr class="separator"><td colspan="8">${label}</td></tr>`;
            const half = Math.ceil(words.length / 2);
            for (let i = 0; i < half; i++) {
                const w1 = words[i], w2 = words[i + half] || null;
                html += `<tr class="${rowClass}">`;
                html += `<td class="article-cell ${artClass} left-pair">${w1.art}</td>`;
                html += `<td class="german-cell left-pair">${w1.ger} <button class="audio-btn" onclick="event.stopPropagation();VocabEngine._speakNounRow('${_escAttr(w1.art)}','${_escAttr(w1.ger)}','${_escAttr(w1.pf)}','${_escAttr(w1.eng)}')">🔊</button></td>`;
                html += `<td class="plural-cell left-pair">${w1.pn}</td><td class="english-cell left-pair">${w1.eng}</td>`;
                if (w2) {
                    html += `<td class="article-cell ${artClass} right-pair">${w2.art}</td>`;
                    html += `<td class="german-cell right-pair">${w2.ger} <button class="audio-btn" onclick="event.stopPropagation();VocabEngine._speakNounRow('${_escAttr(w2.art)}','${_escAttr(w2.ger)}','${_escAttr(w2.pf)}','${_escAttr(w2.eng)}')">🔊</button></td>`;
                    html += `<td class="plural-cell right-pair">${w2.pn}</td><td class="english-cell right-pair">${w2.eng}</td>`;
                } else { html += `<td></td><td></td><td></td><td></td>`; }
                html += `</tr>`;
            }
        });
        document.getElementById('nounTableBody').innerHTML = html ||
            `<tr><td colspan="8" style="text-align:center;color:#999;padding:12px;">No nouns at ${currentLevel} level</td></tr>`;
    }

    // ── Render: Words (adj + verb) ─────────────────────────
    function _renderWords() {
        const adjData  = _parseCSV(adjectivesCSV).filter(r => currentLevel === 'all' || r[0] === currentLevel);
        const verbData = _parseCSV(verbsCSV).filter(r => currentLevel === 'all' || r[0] === currentLevel);
        let html = '';
        function buildRows(data, rowClass, sepLabel) {
            if (!data.length) return '';
            let h = `<tr class="separator"><td colspan="8">${sepLabel}</td></tr>`;
            const half = Math.ceil(data.length / 2);
            for (let i = 0; i < half; i++) {
                const r1 = data[i], r2 = data[i + half] || null;
                h += `<tr class="${rowClass}">`;
                h += `<td class="german-col left-pair">${r1[1]} <button class="audio-btn" onclick="event.stopPropagation();VocabEngine._speakPair('${_escAttr(r1[1])}','${_escAttr(r1[2])}','${_escAttr(r1[3])}','${_escAttr(r1[4])}')">🔊</button></td><td class="english-col left-pair">${r1[2]}</td>`;
                h += `<td class="german-col left-pair">${r1[3]}</td><td class="english-col left-pair">${r1[4]}</td>`;
                if (r2) {
                    h += `<td class="german-col right-pair">${r2[1]} <button class="audio-btn" onclick="event.stopPropagation();VocabEngine._speakPair('${_escAttr(r2[1])}','${_escAttr(r2[2])}','${_escAttr(r2[3])}','${_escAttr(r2[4])}')">🔊</button></td><td class="english-col right-pair">${r2[2]}</td>`;
                    h += `<td class="german-col right-pair">${r2[3]}</td><td class="english-col right-pair">${r2[4]}</td>`;
                } else { h += `<td></td><td></td><td></td><td></td>`; }
                h += `</tr>`;
            }
            return h;
        }
        html += buildRows(adjData,  'adjective-row', 'Adjectives (- prefix = opposite pairs)');
        html += buildRows(verbData, 'verb-row',      'Verbs (* Weak | + Strong — opposite / related pairs)');
        document.getElementById('wordTableBody').innerHTML = html ||
            `<tr><td colspan="8" style="text-align:center;color:#999;padding:12px;">No adjectives or verbs at ${currentLevel} level</td></tr>`;
    }

    // ── Render: Expressions ────────────────────────────────
    function _renderExpressions() {
        const data = _parseCSV(expressionsCSV).filter(r => currentLevel === 'all' || r[0] === currentLevel);
        let html = '';
        for (let i = 0; i < data.length; i += 2) {
            const [, ger1, ...e1] = data[i]; const eng1 = e1.join(',');
            html += `<tr>`;
            html += `<td class="german-cell left-pair">${ger1} <button class="audio-btn" onclick="event.stopPropagation();VocabEngine._speakBilingual('${_escAttr(eng1)}','${_escAttr(ger1)}')">🔊</button></td>`;
            html += `<td class="english-cell left-pair">${eng1}</td>`;
            if (i + 1 < data.length) {
                const [, ger2, ...e2] = data[i + 1]; const eng2 = e2.join(',');
                html += `<td class="german-cell right-pair">${ger2} <button class="audio-btn" onclick="event.stopPropagation();VocabEngine._speakBilingual('${_escAttr(eng2)}','${_escAttr(ger2)}')">🔊</button></td>`;
                html += `<td class="english-cell right-pair">${eng2}</td>`;
            } else { html += `<td></td><td></td>`; }
            html += `</tr>`;
        }
        document.getElementById('expressionsTableBody').innerHTML = html ||
            `<tr><td colspan="4" style="text-align:center;color:#999;padding:12px;">No expressions at ${currentLevel} level</td></tr>`;
    }

    // ── Render: Conversations ──────────────────────────────
    function _renderConversations() {
        const rawLines = conversationsCSV.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//'));
        const convs = {}, order = [];
        rawLines.forEach(line => {
            const fp = line.indexOf('|'), sp = line.indexOf('|', fp+1), fc = line.indexOf(',', sp+1);
            if (fp < 0 || sp < 0 || fc < 0) return;
            const level = line.slice(0, fp).trim(), title = line.slice(fp+1, sp).trim(), speaker = line.slice(sp+1, fc).trim();
            if (currentLevel !== 'all' && level !== currentLevel) return;
            const rest = line.slice(fc+1), sc = rest.indexOf(',');
            const german = rest.slice(0, sc).trim(), english = rest.slice(sc+1).trim();
            const key = `${level}|${title}`;
            if (!convs[key]) { convs[key] = []; order.push(key); }
            convs[key].push({ speaker, german, english });
        });
        const container = document.getElementById('conversationsContainer');
        if (!order.length) { container.innerHTML = `<p style="text-align:center;color:#999;padding:12px;">No conversations at ${currentLevel} level</p>`; return; }
        let html = '';
        order.forEach(key => {
            const title = key.split('|').slice(1).join('|'), lines = convs[key];
            const lA = lines.filter(l => l.speaker === 'A'), lB = lines.filter(l => l.speaker === 'B');
            html += `<table class="conversations-table">`;
            html += `<tr><td colspan="4" class="conversation-title">💬 ${title}</td></tr>`;
            html += `<tr><td class="conv-subheader" style="width:27%">Speaker A — Deutsch</td><td class="conv-subheader" style="width:23%">Speaker A — English</td><td class="conv-subheader" style="width:27%">Speaker B — Deutsch</td><td class="conv-subheader" style="width:23%">Speaker B — English</td></tr>`;
            const maxR = Math.max(lA.length, lB.length);
            for (let i = 0; i < maxR; i++) {
                const a = lA[i] || null, b = lB[i] || null;
                html += `<tr>`;
                html += `<td class="conv-ger-a">${a ? a.german + ` <button class="audio-btn" onclick="event.stopPropagation();VocabEngine._speakText('${_escAttr(a.german)}')">🔊</button>` : ''}</td>`;
                html += `<td class="conv-eng-a">${a ? a.english : ''}</td>`;
                html += `<td class="conv-ger-b">${b ? b.german + ` <button class="audio-btn" onclick="event.stopPropagation();VocabEngine._speakText('${_escAttr(b.german)}')">🔊</button>` : ''}</td>`;
                html += `<td class="conv-eng-b">${b ? b.english : ''}</td>`;
                html += `</tr>`;
            }
            html += `</table>`;
        });
        container.innerHTML = html;
    }

    // ── Render: Q&A ────────────────────────────────────────
    function _renderQA() {
        const rows = qaCSV.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//')).map(line => {
            const fc = line.indexOf(','), sc = line.indexOf(',', fc+1);
            if (fc < 0 || sc < 0) return null;
            return { level: line.slice(0,fc).trim(), question: line.slice(fc+1,sc).trim(), answer: line.slice(sc+1).trim() };
        }).filter(r => r && (currentLevel === 'all' || r.level === currentLevel));
        let html = '';
        for (let i = 0; i < rows.length; i += 2) {
            const r1 = rows[i], r2 = rows[i+1] || null;
            html += `<tr>`;
            html += `<td class="question-cell left-pair">${r1.question} <button class="audio-btn" onclick="event.stopPropagation();VocabEngine._speakText('${_escAttr(r1.question)}')">🔊</button></td>`;
            html += `<td class="answer-cell left-pair">${r1.answer}</td>`;
            if (r2) {
                html += `<td class="question-cell right-pair">${r2.question} <button class="audio-btn" onclick="event.stopPropagation();VocabEngine._speakText('${_escAttr(r2.question)}')">🔊</button></td>`;
                html += `<td class="answer-cell right-pair">${r2.answer}</td>`;
            } else { html += `<td></td><td></td>`; }
            html += `</tr>`;
        }
        document.getElementById('qaTableBody').innerHTML = html ||
            `<tr><td colspan="4" style="text-align:center;color:#999;padding:12px;">No Q&amp;A at ${currentLevel} level</td></tr>`;
    }

    // ── Render: Sentences ──────────────────────────────────
    function _renderSentences() {
        const rows = sentencesCSV.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//')).map(line => {
            const fc = line.indexOf(','), sc = line.indexOf(',', fc+1);
            if (fc < 0 || sc < 0) return null;
            return { level: line.slice(0,fc).trim(), german: line.slice(fc+1,sc).trim(), english: line.slice(sc+1).trim() };
        }).filter(r => r && (currentLevel === 'all' || r.level === currentLevel));
        let html = '';
        for (let i = 0; i < rows.length; i += 2) {
            const r1 = rows[i], r2 = rows[i+1] || null;
            html += `<tr>`;
            html += `<td class="german-cell left-pair">${r1.german} <button class="audio-btn" onclick="event.stopPropagation();VocabEngine._speakBilingual('${_escAttr(r1.english)}','${_escAttr(r1.german)}')">🔊</button></td>`;
            html += `<td class="english-cell left-pair">${r1.english}</td>`;
            if (r2) {
                html += `<td class="german-cell right-pair">${r2.german} <button class="audio-btn" onclick="event.stopPropagation();VocabEngine._speakBilingual('${_escAttr(r2.english)}','${_escAttr(r2.german)}')">🔊</button></td>`;
                html += `<td class="english-cell right-pair">${r2.english}</td>`;
            } else { html += `<td></td><td></td>`; }
            html += `</tr>`;
        }
        document.getElementById('sentencesTableBody').innerHTML = html ||
            `<tr><td colspan="4" style="text-align:center;color:#999;padding:12px;">No sentences at ${currentLevel} level</td></tr>`;
    }

    // ── Render all ─────────────────────────────────────────
    function _renderAll() {
        _renderNouns(); _renderWords(); _renderExpressions();
        _renderConversations(); _renderQA(); _renderSentences();
        _updateFilterCount();
    }

    // ── Filter ─────────────────────────────────────────────
    function _filter(level) {
        currentLevel = level;
        document.querySelectorAll('.level-btn').forEach(b => b.classList.toggle('active', b.dataset.level === level));
        _renderAll();
    }

    function _updateFilterCount() {
        const el = document.getElementById('filterCount'); if (!el) return;
        if (currentLevel === 'all') { el.textContent = ''; return; }
        let total = 0;
        [nounsCSV, adjectivesCSV, verbsCSV, expressionsCSV, qaCSV, sentencesCSV].forEach(csv => {
            _parseCSV(csv).forEach(r => { if (r[0] === currentLevel) total++; });
        });
        conversationsCSV.split('\n').forEach(l => {
            l = l.trim(); if (l && !l.startsWith('//') && l.startsWith(currentLevel + '|')) total++;
        });
        el.textContent = `${total} entries`;
    }

    // ── Zoom ───────────────────────────────────────────────
    function _updateVZoom() {
        document.getElementById('vocabSection').style.fontSize = `${baseFontSize * vocabZoom / 100}em`;
        document.getElementById('zoomLevelVocab').textContent = `${vocabZoom}%`;
        const rv = document.getElementById('recZoomV'); if (rv) rv.textContent = vocabZoom + '%';
    }
    function _updatePZoom() {
        document.getElementById('phrasesSection').style.fontSize = `${baseFontSize * phrasesZoom / 100}em`;
        document.getElementById('zoomLevelPhrases').textContent = `${phrasesZoom}%`;
        const rp = document.getElementById('recZoomP'); if (rp) rp.textContent = phrasesZoom + '%';
    }

    // ── UI toggles ─────────────────────────────────────────
    function _toggleControls() {
        const panel = document.getElementById('controlsPanel');
        const btn   = document.getElementById('controlsToggle');
        const collapsed = panel.classList.toggle('collapsed');
        btn.style.display = collapsed ? 'block' : 'none';
    }
    function _toggleSecondary() {
        const sec = document.getElementById('secondaryControls');
        const btn = document.getElementById('secToggleBtn');
        const open = sec.classList.toggle('open');
        btn.classList.toggle('open', open);
        btn.textContent = open ? '⚙ Zoom & Print ▲' : '⚙ Zoom & Print';
    }

    // ── TTS ────────────────────────────────────────────────
    function _loadVoices() {
        const voices = window.speechSynthesis.getVoices();
        const sel = document.getElementById('voiceSelect'); if (!sel) return;
        sel.innerHTML = '';
        const deVoices = voices.filter(v => v.lang.startsWith('de'));
        if (!deVoices.length) {
            sel.innerHTML = '<option value="">No German voice – using default</option>';
            germanVoice = voices.find(v => v.lang.includes('en')) || voices[0] || null;
        } else {
            deVoices.forEach(v => {
                const opt = document.createElement('option');
                opt.value = v.name; opt.textContent = `${v.name} (${v.lang})`;
                sel.appendChild(opt);
            });
            germanVoice = deVoices[0];
        }
        const enVoices = voices.filter(v => v.lang.startsWith('en'));
        englishVoice = enVoices.find(v => v.lang === 'en-US') || enVoices[0] || null;
    }

    function _warmUpTTS(cb) {
        if (ttsWarmedUp) { cb(); return; }
        const u = new SpeechSynthesisUtterance(' ');
        u.volume = 0; u.lang = 'de-DE'; if (germanVoice) u.voice = germanVoice;
        u.onend  = () => { ttsWarmedUp = true; setTimeout(cb, 50); };
        u.onerror= () => { ttsWarmedUp = true; setTimeout(cb, 50); };
        window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
    }

    function _speak(text, cb, lang) {
        if (!text || !text.trim()) { if (cb) cb(); return; }
        lang = lang || 'de-DE'; text = text.replace('🔊', '').trim();
        if (!isPlayingSequence) _stopAllSpeech();
        if (!ttsWarmedUp) _warmUpTTS(() => _speakNow(text, cb, lang));
        else { window.speechSynthesis.resume(); setTimeout(() => _speakNow(text, cb, lang), 100); }
    }

    function _speakNow(text, cb, lang) {
        if (!('speechSynthesis' in window)) { if (cb) cb(); return; }
        _showAudioStatus(text);
        const u = new SpeechSynthesisUtterance(text);
        u.lang = lang || 'de-DE';
        if (u.lang.startsWith('en')) { if (englishVoice) u.voice = englishVoice; }
        else { if (germanVoice) u.voice = germanVoice; }
        const sc = document.getElementById('speedControl');
        u.rate = sc ? parseFloat(sc.value) : 0.8; u.pitch = 1.0; u.volume = 1.0;
        let done = false;
        u.onstart = () => { isSpeaking = true; };
        u.onend  = () => { if (done) return; done = true; isSpeaking = false; _hideAudioStatus(); if (cb) setTimeout(cb, 100); };
        u.onerror= () => { if (done) return; done = true; isSpeaking = false; _hideAudioStatus(); if (cb) cb(); };
        try { window.speechSynthesis.speak(u); } catch(e) { isSpeaking = false; _hideAudioStatus(); if (cb) cb(); }
    }

    function _stopAllSpeech() {
        isPlayingSequence = false; playAllActive = false; isPaused = false;
        if (typeof speechSynthesis !== 'undefined') window.speechSynthesis.cancel();
        isSpeaking = false; _hideAudioStatus(); _hidePauseBtn();
    }

    function _showAudioStatus(t) {
        const el = document.getElementById('audioStatus'), tx = document.getElementById('audioStatusText');
        if (!el || !tx) return;
        tx.textContent = '🔊 ' + (t.length > 40 ? t.slice(0, 40) + '…' : t);
        el.classList.add('show');
    }
    function _hideAudioStatus() { setTimeout(() => { const el = document.getElementById('audioStatus'); if (el) el.classList.remove('show'); }, 300); }
    function _showPauseBtn() { const b = document.getElementById('pauseBtn'); if (b) b.style.display = 'inline-block'; }
    function _hidePauseBtn() { const b = document.getElementById('pauseBtn'); if (b) { b.style.display = 'none'; b.classList.remove('paused'); b.textContent = '⏸ Pause'; } }

    function _togglePause() {
        isPaused = !isPaused;
        const btn = document.getElementById('pauseBtn');
        if (isPaused) { window.speechSynthesis.pause(); btn.textContent = '▶ Resume'; btn.classList.add('paused'); }
        else { window.speechSynthesis.resume(); btn.textContent = '⏸ Pause'; btn.classList.remove('paused'); if (!isSpeaking) _playNext(); }
    }

    // ── Speak helpers ──────────────────────────────────────
    function _speakNounRow(art, ger, pf, eng) {
        isPlayingSequence = true;
        const go = () => _speak(art + ' ' + ger, () => {
            if (pf && pf !== '---' && pf !== 'kein Plural' && pf !== 'nur P')
                setTimeout(() => _speak(pf, () => { isPlayingSequence = false; }), 350);
            else isPlayingSequence = false;
        });
        if (eng) _speak(eng, () => setTimeout(go, 500), 'en-US'); else go();
    }
    function _speakPair(w1, e1, w2, e2) {
        const c1 = w1.replace(/[*+\-]/g,'').trim(), c2 = w2.replace(/[*+\-]/g,'').trim();
        isPlayingSequence = true;
        _speak(e1, () => setTimeout(() => _speak(c1, () => setTimeout(() => _speak(e2, () => setTimeout(() => _speak(c2, () => { isPlayingSequence = false; }), 500)), 800)), 500), 'en-US');
    }
    function _speakBilingual(eng, ger) {
        isPlayingSequence = true;
        _speak(eng, () => setTimeout(() => _speak(ger, () => { isPlayingSequence = false; }), 500), 'en-US');
    }
    function _speakText(t) { _speak(t); }

    // ── Collect items for playback ─────────────────────────
    function _collectNouns(art) {
        const data = _parseCSV(nounsCSV).filter(r => (currentLevel === 'all' || r[0] === currentLevel) && r[1] === art);
        const tbody = document.getElementById('nounTableBody');
        const domRows = Array.from(tbody.querySelectorAll('tr.' + art + '-row'));
        const items = [], half = Math.ceil(data.length / 2);
        function push(r, row, side) {
            const [,a,g,,pf,e] = r;
            if (e) items.push({ text: e, lang: 'en-US', el: row, side });
            items.push({ text: a + ' ' + g, el: row, side });
            if (pf && pf !== '---' && pf !== 'nur P' && pf !== '=' && pf !== 'kein Plural')
                items.push({ text: pf, el: row, side });
        }
        for (let i = 0; i < half; i++)           push(data[i],        domRows[i]       || null, 'left');
        for (let i = half; i < data.length; i++) push(data[i],        domRows[i - half] || null, 'right');
        return items;
    }
    function _collectWords(csv, rowClass) {
        const data = _parseCSV(csv).filter(r => currentLevel === 'all' || r[0] === currentLevel);
        const tbody = document.getElementById('wordTableBody');
        const domRows = Array.from(tbody.querySelectorAll('tr.' + rowClass));
        const items = [], half = Math.ceil(data.length / 2);
        function push(r, row, side) {
            const [,w1,e1,w2,e2] = r;
            if (e1) items.push({ text: e1, lang: 'en-US', el: row, side });
            items.push({ text: w1.replace(/[*+\-]/g,'').trim(), el: row, side });
            if (e2) items.push({ text: e2, lang: 'en-US', el: row, side });
            items.push({ text: w2.replace(/[*+\-]/g,'').trim(), el: row, side });
        }
        for (let i = 0; i < half; i++)           push(data[i],        domRows[i]       || null, 'left');
        for (let i = half; i < data.length; i++) push(data[i],        domRows[i - half] || null, 'right');
        return items;
    }
    function _collectExpr() {
        const data = _parseCSV(expressionsCSV).filter(r => currentLevel === 'all' || r[0] === currentLevel);
        const domRows = Array.from(document.getElementById('expressionsTableBody').querySelectorAll('tr'));
        const items = [];
        for (let i = 0; i < data.length; i += 2) {
            const row = domRows[Math.floor(i/2)] || null;
            const [,g1,...e1p] = data[i]; const e1 = e1p.join(',');
            if (e1) items.push({ text: e1, lang: 'en-US', el: row, side: 'left' });
            items.push({ text: g1, el: row, side: 'left' });
            if (i + 1 < data.length) {
                const [,g2,...e2p] = data[i+1]; const e2 = e2p.join(',');
                if (e2) items.push({ text: e2, lang: 'en-US', el: row, side: 'right' });
                items.push({ text: g2, el: row, side: 'right' });
            }
        }
        return items;
    }
    function _collectConv() {
        const lines = conversationsCSV.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//'));
        const convs = {}, order = [];
        lines.forEach(line => {
            const fp = line.indexOf('|'), sp = line.indexOf('|', fp+1), fc = line.indexOf(',', sp+1);
            if (fp < 0 || sp < 0 || fc < 0) return;
            const level = line.slice(0,fp).trim(), title = line.slice(fp+1,sp).trim(), speaker = line.slice(sp+1,fc).trim();
            if (currentLevel !== 'all' && level !== currentLevel) return;
            const rest = line.slice(fc+1), sc = rest.indexOf(',');
            const german = rest.slice(0,sc).trim();
            const key = `${level}|${title}`;
            if (!convs[key]) { convs[key] = []; order.push(key); }
            convs[key].push({ german });
        });
        const items = [];
        order.forEach(k => { convs[k].forEach(({ german }) => { if (german) items.push({ text: german }); }); });
        return items;
    }
    function _collectQA() {
        const rows = qaCSV.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//')).map(line => {
            const fc = line.indexOf(','), sc = line.indexOf(',', fc+1);
            if (fc < 0 || sc < 0) return null;
            return { level: line.slice(0,fc).trim(), question: line.slice(fc+1,sc).trim() };
        }).filter(r => r && (currentLevel === 'all' || r.level === currentLevel));
        const domRows = Array.from(document.getElementById('qaTableBody').querySelectorAll('tr'));
        const items = [], half = Math.ceil(rows.length / 2);
        for (let i = 0; i < half; i++) {
            const row = domRows[i] || null;
            if (rows[i])        items.push({ text: rows[i].question,        el: row, side: 'left' });
            if (rows[i + half]) items.push({ text: rows[i + half].question, el: row, side: 'right' });
        }
        return items;
    }
    function _collectSent() {
        const rows = sentencesCSV.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//')).map(line => {
            const fc = line.indexOf(','), sc = line.indexOf(',', fc+1);
            if (fc < 0 || sc < 0) return null;
            return { level: line.slice(0,fc).trim(), german: line.slice(fc+1,sc).trim(), english: line.slice(sc+1).trim() };
        }).filter(r => r && (currentLevel === 'all' || r.level === currentLevel));
        const domRows = Array.from(document.getElementById('sentencesTableBody').querySelectorAll('tr'));
        const items = [], half = Math.ceil(rows.length / 2);
        for (let i = 0; i < half; i++) {
            const row = domRows[i] || null;
            if (rows[i]) {
                if (rows[i].english) items.push({ text: rows[i].english, lang: 'en-US', el: row, side: 'left' });
                items.push({ text: rows[i].german, el: row, side: 'left' });
            }
            if (rows[i + half]) {
                if (rows[i + half].english) items.push({ text: rows[i + half].english, lang: 'en-US', el: row, side: 'right' });
                items.push({ text: rows[i + half].german, el: row, side: 'right' });
            }
        }
        return items;
    }

    // ── Playback engine ────────────────────────────────────
    function _clearHighlight() { document.querySelectorAll('tr[data-playing]').forEach(el => el.removeAttribute('data-playing')); }
    function _highlight(el, side) { _clearHighlight(); if (!el) return; el.setAttribute('data-playing', side || 'all'); }

    function _setPlayBtn(section) {
        ['btnDer','btnDas','btnDie','btnAdj','btnVerb','btnExpr','btnConv','btnQa','btnSent'].forEach(id => {
            const b = document.getElementById(id); if (b) b.classList.remove('playing');
        });
        if (!section) return;
        const map = { der:'btnDer', das:'btnDas', die:'btnDie', adj:'btnAdj', verb:'btnVerb', expr:'btnExpr', conv:'btnConv', qa:'btnQa', sent:'btnSent' };
        const b = document.getElementById(map[section]); if (b) b.classList.add('playing');
    }

    function _playSection(section) {
        _stopAllSpeech(); _clearHighlight();
        if (section === 'all') {
            playAllTexts = [
                ..._collectNouns('der'), ..._collectNouns('das'), ..._collectNouns('die'),
                ..._collectWords(adjectivesCSV, 'adjective-row'), ..._collectWords(verbsCSV, 'verb-row'),
                ..._collectExpr(), ..._collectConv(), ..._collectQA(), ..._collectSent()
            ];
        } else {
            const m = { der:()=>_collectNouns('der'), das:()=>_collectNouns('das'), die:()=>_collectNouns('die'),
                        adj:()=>_collectWords(adjectivesCSV,'adjective-row'), verb:()=>_collectWords(verbsCSV,'verb-row'),
                        expr:_collectExpr, conv:_collectConv, qa:_collectQA, sent:_collectSent };
            playAllTexts = m[section] ? m[section]() : [];
        }
        playAllTexts = playAllTexts.filter(i => i && i.text && i.text.trim());
        if (!playAllTexts.length) return;
        playAllActive = true; playAllIndex = 0; currentPlaySection = section;
        isPlayingSequence = true; isPaused = false;
        _setPlayBtn(section); _showPauseBtn(); _playNext();
    }

    function _playNext() {
        if (!playAllActive || playAllIndex >= playAllTexts.length) {
            playAllActive = false; isPlayingSequence = false; currentPlaySection = null;
            _setPlayBtn(null); _clearHighlight(); _hidePauseBtn(); return;
        }
        if (isPaused) return;
        const item = playAllTexts[playAllIndex++];
        _highlight(item.el || null, item.side || 'all');
        _speak(item.text, () => setTimeout(_playNext, 500), item.lang || 'de-DE');
    }

    // ── Record mode ────────────────────────────────────────
    function _fmtTs(ms) { const s = Math.floor(ms/1000); return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`; }
    function _logChapter(label) { const ts = recStartTime ? _fmtTs(Date.now() - recStartTime) : '0:00'; recChapters.push(`${ts} ${label}`); }

    function _showMiniBar() {
        const bar = document.getElementById('recMiniBar'); bar.style.display = 'flex';
        recTsInterval = setInterval(() => { if (recStartTime) document.getElementById('recTs').textContent = _fmtTs(Date.now() - recStartTime); }, 500);
    }
    function _hideMiniBar() { document.getElementById('recMiniBar').style.display = 'none'; clearInterval(recTsInterval); }

    function _toggleRecPause() {
        const btn = document.getElementById('recPauseBtn'), zc = document.getElementById('recZoomControls');
        recIsPaused = !recIsPaused;
        if (recIsPaused) {
            window.speechSynthesis.pause(); btn.textContent = '▶ Resume'; btn.style.color = '#FFCE00';
            zc.classList.add('visible');
            document.getElementById('recZoomV').textContent = vocabZoom + '%';
            document.getElementById('recZoomP').textContent = phrasesZoom + '%';
        } else {
            window.speechSynthesis.resume(); btn.textContent = '⏸ Pause'; btn.style.color = '';
            zc.classList.remove('visible');
        }
    }

    function _playSectionAsync(section) {
        return new Promise(resolve => {
            _stopAllSpeech(); _clearHighlight();
            const m = { der:()=>_collectNouns('der'), das:()=>_collectNouns('das'), die:()=>_collectNouns('die'),
                        adj:()=>_collectWords(adjectivesCSV,'adjective-row'), verb:()=>_collectWords(verbsCSV,'verb-row'),
                        expr:_collectExpr, conv:_collectConv, qa:_collectQA, sent:_collectSent };
            let items = (m[section] ? m[section]() : []).filter(i => i && i.text && i.text.trim());
            if (!items.length) { resolve(); return; }
            playAllActive = true; isPlayingSequence = true;
            let idx = 0;
            function next() {
                if (!recModeActive) { playAllActive = false; isPlayingSequence = false; _clearHighlight(); resolve(); return; }
                if (recIsPaused) { setTimeout(next, 150); return; }
                if (!playAllActive || idx >= items.length) { playAllActive = false; isPlayingSequence = false; _clearHighlight(); resolve(); return; }
                const item = items[idx++];
                _highlight(item.el || null, item.side || 'all');
                _speak(item.text, () => setTimeout(next, 500), item.lang || 'de-DE');
            }
            next();
        });
    }

    async function _startRec() {
        if (recModeActive) return;
        recModeActive = true; recIsPaused = false; recChapters = [];
        document.getElementById('controlsPanel').classList.add('collapsed');
        document.getElementById('controlsToggle').style.display = 'none';
        document.getElementById('recModeBtn').style.display = 'none';
        document.getElementById('stopRecBtn').style.display = 'inline-block';
        const startIdx = parseInt(document.getElementById('recStartFrom').value) || 0;
        _warmUpTTS(() => {});
        await _showCountdown();
        recStartTime = Date.now(); _showMiniBar();

        const FULL_SEQ = [
            { card:'cover',          chLabel: _cfg.recSeqLabel || ('🎬 Intro — ' + _cfg.topic), audio: null },
            { card:'nouns_all',      chLabel:'📖 Table 1 — Nouns (Die Nomen)',   audio: null },
            { card:'der',            chLabel:'🔵 der — Masculine Nouns',         audio: 'der'  },
            { card:'das',            chLabel:'🟢 das — Neuter Nouns',            audio: 'das'  },
            { card:'die',            chLabel:'🔴 die — Feminine Nouns',          audio: 'die'  },
            { card:'adj_verb_all',   chLabel:'📖 Table 2 — Adjectives & Verbs',  audio: null },
            { card:'adj',            chLabel:'🟠 Adjectives with Opposites',     audio: 'adj'  },
            { card:'verb',           chLabel:'🩵 Verbs with Opposites',          audio: 'verb' },
            { card:'phrases_divider',chLabel:'💬 Phrases & Sentences',           audio: null },
            { card:'expr',           chLabel:'🟣 Table 3 — Common Expressions',  audio: 'expr' },
            { card:'conv',           chLabel:'💙 Table 4 — Conversations',       audio: 'conv' },
            { card:'qa',             chLabel:'🤎 Table 5 — Questions & Answers', audio: 'qa'   },
            { card:'sent',           chLabel:'🔷 Table 6 — Complete Sentences',  audio: 'sent' },
        ];
        const seq = FULL_SEQ.slice(startIdx);
        for (const step of seq) {
            if (!recModeActive) break;
            _logChapter(step.chLabel);
            await _showCard(step.card, 3000);
            if (!recModeActive) break;
            if (step.audio) await _playSectionAsync(step.audio);
        }
        if (recModeActive) _finishRec();
    }

    function _finishRec() {
        recModeActive = false; _hideMiniBar();
        const text = recChapters.join('\n');
        navigator.clipboard.writeText(text).catch(() => {});
        document.getElementById('chapterText').textContent = text;
        document.getElementById('chapterModal').style.display = 'flex';
    }

    function _exitRec() {
        document.getElementById('controlsPanel').classList.remove('collapsed');
        document.getElementById('controlsToggle').style.display = '';
        document.getElementById('recModeBtn').style.display = '';
        document.getElementById('stopRecBtn').style.display = 'none';
    }

    function _stopRec() {
        recModeActive = false; _stopAllSpeech(); _hideMiniBar();
        document.getElementById('cardOverlay').style.display = 'none';
        document.getElementById('countdownOverlay').style.display = 'none';
        _exitRec();
    }

    // ── Overlay cards ──────────────────────────────────────
    function _titleFontSize(lines) {
        const m = Math.max(...lines.map(l => l.length));
        if (lines.length === 1 && m <= 10) return '9em';
        if (lines.length === 1 && m <= 14) return '7.5em';
        if (lines.length === 1)            return '6.2em';
        if (lines.length === 2 && m <= 10) return '6.5em';
        if (lines.length === 2 && m <= 14) return '5.5em';
        if (lines.length === 2)            return '4.8em';
        return '4em';
    }

    function _renderCard(c) {
        const card = document.getElementById('overlayCard'); if (!card || !c) return;
        const cs = c.isEmoji
            ? `font-size:11em;opacity:0.12;right:-10px;`
            : `font-size:13em;color:${c.cornerColor||'rgba(0,0,0,0.05)'};right:-18px;letter-spacing:-4px;`;
        const fs = _titleFontSize(c.titleLines), title = c.titleLines.join('<br>');
        let badges = '';
        if (c.type === 'cover' || c.type === 'table-header') {
            badges = `<div class="oc-badges-row">${(c.badges||[]).map(b => `<div class="oc-art-badge oc-med" style="background:rgba(0,0,0,0.05);border-color:${b.color};color:${b.color}">${b.label}</div>`).join('')}</div>`;
        } else if (c.type !== 'divider' && c.badge) {
            badges = `<div class="oc-badges-row"><div class="oc-art-badge oc-big" style="background:${c.badge.bg};border-color:${c.badge.border};color:${c.badge.color}">${c.badge.label}</div></div>`;
        }
        const main = (c.type === 'cover')
            ? `<div class="oc-cover-logo"><span class="oc-lc-der">Der</span><span class="oc-lc-die">Die</span><span class="oc-lc-das">Das</span>Method</div><div class="oc-section-tag">Unit ${_cfg.unit} · Topic Overview</div><div class="oc-card-title" style="font-size:${fs}">${title}</div>${badges}`
            : `<div class="oc-section-tag">${c.tag}</div><div class="oc-card-title" style="font-size:${fs}">${title}</div>${badges}`;
        card.innerHTML = `
          <div class="oc-card-bg-overlay" style="background:${c.overlay}"></div>
          <div class="oc-card-noise"></div>
          <div class="oc-corner-wm" style="${cs}">${c.cornerTxt||''}</div>
          <div class="oc-accent-line"></div>
          <div class="oc-card-inner">
            <div class="oc-card-top">
              <div class="oc-logo-mark"><span><span class="oc-lm-der">Der</span><span class="oc-lm-die">Die</span><span class="oc-lm-das">Das</span></span><span class="oc-thematic-sub">Method</span></div>
              <div class="oc-unit-info">Unit ${_cfg.unit} · ${_cfg.topic}</div>
              <div class="oc-level-pill">A1 – B2</div>
            </div>
            <div class="oc-card-main">${main}</div>
            <div class="oc-card-foot"><div class="oc-word-count">${c.bottomL||''}</div><div class="oc-foot-sub">${c.bottomR||''}</div></div>
          </div>`;
    }

    function _scaleCard() {
        const w = document.getElementById('overlayCardWrap'); if (!w) return;
        const s = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
        w.style.transform = `scale(${s})`;
        w.style.marginTop    = `${(720 * s - 720) / 2}px`;
        w.style.marginBottom = `${(720 * s - 720) / 2}px`;
    }

    function _showCard(cardId, duration) {
        return new Promise(resolve => {
            const c = REC_CARDS[cardId]; if (!c) { resolve(); return; }
            _renderCard(c); _scaleCard();
            const ov = document.getElementById('cardOverlay');
            ov.style.opacity = '0'; ov.style.transition = 'opacity 0.45s ease'; ov.style.display = 'flex';
            requestAnimationFrame(() => requestAnimationFrame(() => { ov.style.opacity = '1'; }));
            setTimeout(() => {
                ov.style.opacity = '0';
                setTimeout(() => { ov.style.display = 'none'; resolve(); }, 450);
            }, Math.max(duration - 450, 200));
        });
    }

    function _showCountdown() {
        return new Promise(resolve => {
            const ov = document.getElementById('countdownOverlay'), num = document.getElementById('countdownNumber');
            ov.style.display = 'flex'; let count = 3; num.textContent = count;
            const t = setInterval(() => {
                count--;
                if (count <= 0) { clearInterval(t); ov.style.display = 'none'; resolve(); }
                else { num.textContent = count; num.style.animation = 'none'; requestAnimationFrame(() => requestAnimationFrame(() => { num.style.animation = 'cdPulse 1s ease-in-out'; })); }
            }, 1000);
        });
    }

    // ── Setup & init ───────────────────────────────────────
    function _setup() {
        // TTS voices
        if (typeof speechSynthesis !== 'undefined' && speechSynthesis.onvoiceschanged !== undefined)
            speechSynthesis.onvoiceschanged = _loadVoices;
        setTimeout(_loadVoices, 100); setTimeout(_loadVoices, 600);

        // Speed control
        const sc = document.getElementById('speedControl');
        if (sc) sc.addEventListener('input', e => { const el = document.getElementById('speedValue'); if (el) el.textContent = e.target.value + '×'; });

        // Voice select
        const vs = document.getElementById('voiceSelect');
        if (vs) vs.addEventListener('change', e => {
            _stopAllSpeech();
            const voices = window.speechSynthesis.getVoices();
            germanVoice = voices.find(v => v.name === e.target.value) || voices[0] || null;
        });

        // Resize overlay card
        window.addEventListener('resize', _scaleCard);

        // Keyboard shortcuts
        document.addEventListener('keydown', e => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
            const map = { '0':'all', '1':'A1', '2':'A2', '3':'B1', '4':'B2' };
            if (map[e.key]) _filter(map[e.key]);
            if (e.key === 'p' || e.key === 'P') window.print();
        });

        // Initial zoom
        _updateVZoom(); _updatePZoom();

        // Initial render
        _renderAll();
    }

    // ── Public API ─────────────────────────────────────────
    window.VocabEngine = {
        init: function (cfg) {
            _cfg = cfg;
            // wire data
            nounsCSV         = cfg.nounsCSV;
            adjectivesCSV    = cfg.adjectivesCSV;
            verbsCSV         = cfg.verbsCSV;
            expressionsCSV   = cfg.expressionsCSV;
            conversationsCSV = cfg.conversationsCSV;
            qaCSV            = cfg.qaCSV;
            sentencesCSV     = cfg.sentencesCSV;
            REC_CARDS        = cfg.recCards;

            document.body.innerHTML = _buildShell(cfg);
            _setup();
        },
        // expose for inline onclick handlers
        _filter, _toggleControls, _toggleSecondary, _togglePause,
        _playSection, _stopAllSpeech,
        _speakNounRow, _speakPair, _speakBilingual, _speakText,
        _zoomInV:  () => { if (vocabZoom < maxZoom)   { vocabZoom   += zoomStep; _updateVZoom(); } },
        _zoomOutV: () => { if (vocabZoom > minZoom)   { vocabZoom   -= zoomStep; _updateVZoom(); } },
        _zoomResetV: () => { vocabZoom = 100;   _updateVZoom(); },
        _zoomInP:  () => { if (phrasesZoom < maxZoom) { phrasesZoom += zoomStep; _updatePZoom(); } },
        _zoomOutP: () => { if (phrasesZoom > minZoom) { phrasesZoom -= zoomStep; _updatePZoom(); } },
        _zoomResetP: () => { phrasesZoom = 100; _updatePZoom(); },
        _startRec, _stopRec, _exitRec, _toggleRecPause,
    };

})();
