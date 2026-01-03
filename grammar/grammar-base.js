/* ============================================ */
/* DEUTSCHMIND - GRAMMAR BASE JAVASCRIPT       */
/* Reusable JS for all grammar pages           */
/* Location: /grammar/grammar-base.js          */
/* Created by: aliattia02                      */
/* ============================================ */

// Global variables
let germanVoice = null;
let isSpeaking = false;

/* ============================================ */
/* SPEECH SYNTHESIS SYSTEM                     */
/* ============================================ */

function loadVoices() {
    const voices = window.speechSynthesis.getVoices();
    const voiceSelect = document.getElementById('voiceSelect');
    
    if (!voiceSelect) {
        console.warn('Voice select element not found');
        return;
    }
    
    voiceSelect.innerHTML = '';

    const germanVoices = voices.filter(voice => voice.lang.startsWith('de'));

    if (germanVoices.length === 0) {
        voiceSelect.innerHTML = '<option value="">No German voices found</option>';
        console.warn('No German voices available');
        return;
    }

    germanVoices.forEach((voice, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${voice.name} (${voice.lang})`;
        voiceSelect.appendChild(option);
    });

    germanVoice = germanVoices[0];
    
    voiceSelect.addEventListener('change', function() {
        germanVoice = germanVoices[this.value];
        console.log('Voice changed to:', germanVoice.name);
    });
}

// Load voices with multiple attempts (browser compatibility)
if (typeof speechSynthesis !== 'undefined') {
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadVoices;
    }
    loadVoices();
    setTimeout(loadVoices, 100);
    setTimeout(loadVoices, 500);
    setTimeout(loadVoices, 1000);
} else {
    console.error('Speech Synthesis not supported in this browser');
}

/**
 * Main speech function - speaks German text
 * @param {string} text - The German text to speak
 */
function speak(text) {
    if (!text || text.trim() === '') {
        console.warn('Empty text provided to speak()');
        return;
    }

    // Cancel any ongoing speech
    if (isSpeaking) {
        window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = germanVoice;
    
    // Get audio control values
    const speedControl = document.getElementById('speedControl');
    const pitchControl = document.getElementById('pitchControl');
    
    utterance.rate = speedControl ? parseFloat(speedControl.value) : 0.8;
    utterance.pitch = pitchControl ? parseFloat(pitchControl.value) : 1.0;
    utterance.lang = 'de-DE';

    const audioStatus = document.getElementById('audioStatus');
    const audioStatusText = document.getElementById('audioStatusText');

    utterance.onstart = function() {
        isSpeaking = true;
        if (audioStatus) audioStatus.classList.add('show');
        if (audioStatusText) {
            const displayText = text.length > 40 ? text.substring(0, 40) + '...' : text;
            audioStatusText.textContent = `Speaking: "${displayText}"`;
        }
    };

    utterance.onend = function() {
        isSpeaking = false;
        setTimeout(() => {
            if (audioStatus) audioStatus.classList.remove('show');
        }, 300);
    };

    utterance.onerror = function(event) {
        console.error('Speech error:', event);
        isSpeaking = false;
        if (audioStatus) audioStatus.classList.remove('show');
    };

    window.speechSynthesis.speak(utterance);
}

/**
 * Stop all speech
 */
function stopSpeaking() {
    window.speechSynthesis.cancel();
    isSpeaking = false;
    const audioStatus = document.getElementById('audioStatus');
    if (audioStatus) audioStatus.classList.remove('show');
}

/* ============================================ */
/* AUDIO CONTROL UPDATES                       */
/* ============================================ */

function initializeAudioControls() {
    const speedControl = document.getElementById('speedControl');
    const speedValue = document.getElementById('speedValue');
    const pitchControl = document.getElementById('pitchControl');
    const pitchValue = document.getElementById('pitchValue');

    if (speedControl && speedValue) {
        speedControl.addEventListener('input', function() {
            speedValue.textContent = this.value + 'x';
        });
    }

    if (pitchControl && pitchValue) {
        pitchControl.addEventListener('input', function() {
            pitchValue.textContent = this.value;
        });
    }
}

/* ============================================ */
/* TAB SWITCHING SYSTEM                        */
/* ============================================ */

/**
 * Switch between tabs
 * @param {string} tabName - The ID of the tab to show
 */
function showTab(tabName) {
    // Stop any playing audio
    stopSpeaking();

    // Hide all tab contents
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));

    // Remove active class from all buttons
    const buttons = document.querySelectorAll('.tab-button');
    buttons.forEach(btn => btn.classList.remove('active'));

    // Show selected tab
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.classList.add('active');
    } else {
        console.warn(`Tab with id "${tabName}" not found`);
    }

    // Add active class to clicked button
    if (event && event.target && event.target.classList.contains('tab-button')) {
        event.target.classList.add('active');
    }

    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ============================================ */
/* REVEAL CARD SYSTEM                          */
/* ============================================ */

/**
 * Toggle reveal card visibility
 * @param {HTMLElement} card - The card element to toggle
 */
function toggleReveal(card) {
    if (card) {
        card.classList.toggle('revealed');
    }
}

/* ============================================ */
/* SEPARABLE VERB ANIMATION                    */
/* ============================================ */

let isSeparated = false;

/**
 * Toggle separable verb animation
 */
function toggleSeparation() {
    const prefixPart = document.getElementById('prefixPart');
    const verbPart = document.getElementById('verbPart');
    const sentenceExample = document.getElementById('sentenceExample');
    
    if (!prefixPart || !verbPart || !sentenceExample) {
        console.warn('Separable verb elements not found');
        return;
    }
    
    // Access from window scope (defined in specific page)
    const separableVerbs = window.separableVerbs || [];
    let currentVerbIndex = window.currentVerbIndex || 0;

    if (separableVerbs.length === 0) {
        console.warn('No separable verbs data found');
        return;
    }

    const currentVerb = separableVerbs[currentVerbIndex];

    if (!isSeparated) {
        prefixPart.classList.add('separated');
        verbPart.textContent = currentVerb.verb.charAt(0).toUpperCase() + currentVerb.verb.slice(1);
        sentenceExample.innerHTML = '<strong>Conjugated:</strong> ' + currentVerb.sentence;
        speak(currentVerb.sentence);
        isSeparated = true;
    } else {
        prefixPart.classList.remove('separated');
        verbPart.textContent = currentVerb.verb;

        currentVerbIndex = (currentVerbIndex + 1) % separableVerbs.length;
        window.currentVerbIndex = currentVerbIndex; // Update global
        const nextVerb = separableVerbs[currentVerbIndex];

        prefixPart.textContent = nextVerb.prefix;
        verbPart.textContent = nextVerb.verb;
        sentenceExample.innerHTML = 'Infinitive: <strong>' + nextVerb.prefix + nextVerb.verb + '</strong> (' + nextVerb.meaning + ')';

        isSeparated = false;
    }
}
/* ============================================ */
/* PLAY ALL CONJUGATIONS                       */
/* ============================================ */

/**
 * Play all conjugations sequentially
 * This function should be overridden in individual grammar pages
 */
function playAllConjugations() {
    console.log('playAllConjugations() should be overridden in your specific grammar page');
    
    // Default fallback: extract and play all German text from active tab
    const germanTexts = extractGermanTextFromActiveTab();
    if (germanTexts.length > 0) {
        speakSequentially(germanTexts, 1500);
    } else {
        alert('No German text found to play. Please customize the playAllConjugations() function for this grammar topic!');
    }
}

/* ============================================ */
/* KEYBOARD SHORTCUTS                          */
/* ============================================ */

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Don't trigger shortcuts if user is typing in an input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }

        // Stop audio: S or Escape
        if (e.key === 's' || e.key === 'S' || e.key === 'Escape') {
            stopSpeaking();
        }

        // Tab switching: 1-9 keys
        const tabMap = {
            '1': 0, '2': 1, '3': 2, '4': 3,
            '5': 4, '6': 5, '7': 6, '8': 7, '9': 8
        };

        if (tabMap.hasOwnProperty(e.key)) {
            const buttons = document.querySelectorAll('.tab-button');
            if (buttons[tabMap[e.key]]) {
                buttons[tabMap[e.key]].click();
            }
        }
    });
}

/* ============================================ */
/* UTILITY FUNCTIONS                           */
/* ============================================ */

/**
 * Sequential speech with delays
 * @param {Array} textArray - Array of text strings to speak
 * @param {number} delay - Delay between speeches in milliseconds
 */
function speakSequentially(textArray, delay = 1500) {
    let index = 0;
    
    function speakNext() {
        if (index < textArray.length) {
            speak(textArray[index]);
            index++;
            setTimeout(speakNext, delay);
        } else {
            console.log(`✅ Finished playing all ${textArray.length} items!`);
        }
    }
    
    speakNext();
}

/**
 * Extract all German text from active tab
 * @returns {Array} Array of German text strings
 */
function extractGermanTextFromActiveTab() {
    const activeTab = document.querySelector('.tab-content.active');
    if (!activeTab) return [];
    
    const germanTexts = [];
    
    // Extract from tables
    const tableRows = activeTab.querySelectorAll('tr[onclick]');
    tableRows.forEach(row => {
        const onclick = row.getAttribute('onclick');
        if (onclick && onclick.includes('speak(')) {
            const match = onclick.match(/speak\(['"](.+?)['"]\)/);
            if (match) germanTexts.push(match[1]);
        }
    });
    
    // Extract from cards
    const cards = activeTab.querySelectorAll('[onclick*="speak"]');
    cards.forEach(card => {
        const onclick = card.getAttribute('onclick');
        if (onclick) {
            const match = onclick.match(/speak\(['"](.+?)['"]\)/);
            if (match && !germanTexts.includes(match[1])) {
                germanTexts.push(match[1]);
            }
        }
    });
    
    // Extract from example cards
    const exampleCards = activeTab.querySelectorAll('.example-german');
    exampleCards.forEach(card => {
        const text = card.textContent.trim();
        if (text && !germanTexts.includes(text)) {
            germanTexts.push(text);
        }
    });
    
    return germanTexts;
}

/* ============================================ */
/* CLEANUP                                     */
/* ============================================ */

function setupCleanup() {
    // Cleanup on page unload
    window.addEventListener('beforeunload', function() {
        window.speechSynthesis.cancel();
    });

    // Cleanup when page becomes hidden
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            stopSpeaking();
        }
    });
}

/* ============================================ */
/* INITIALIZATION                              */
/* ============================================ */

/**
 * Initialize all base functionality
 */
function initializeGrammarBase() {
    console.log('🇩🇪 DeutschMind Grammar Base Initializing...');
    
    // Load voices
    loadVoices();
    
    // Setup audio controls
    initializeAudioControls();
    
    // Setup keyboard shortcuts
    setupKeyboardShortcuts();
    
    // Setup cleanup handlers
    setupCleanup();
    
    console.log('✅ Grammar Base Loaded!');
    console.log('💡 Shortcuts: S/Esc=Stop Audio | 1-9=Switch Tabs');
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGrammarBase);
} else {
    initializeGrammarBase();
}

/* ============================================ */
/* EXPORT FOR USE IN OTHER FILES               */
/* ============================================ */

// Make functions globally available
window.GrammarBase = {
    speak,
    stopSpeaking,
    showTab,
    toggleReveal,
    toggleSeparation,
    speakSequentially,
    extractGermanTextFromActiveTab,
    playAllConjugations
};