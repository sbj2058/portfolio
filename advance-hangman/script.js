// --- Fallback Local Banks ---
const fallbackBank = {
    tech: [{ word: "algorithm", hint: "A clear step-by-step procedure for processing computational tasks." }],
    places: [{ word: "london", hint: "The historic capital metropolis located along the River Thames." }],
    animals: [{ word: "leopard", hint: "A large solitary wild cat decorated with rosette spots." }]
};

const blitzWordLibrary = ["nexus", "matrix", "vector", "signal", "cyber", "system", "plasma", "quantum", "laser", "pixel"];

// --- State Variables ---
let currentMode = "tech";
let activeWord = "";
let currentHint = "";
let revealedIndex = -1;
let guessedLetters = new Set();
let score = 100;
let wrongGuesses = 0;
const maxStrikes = 6;
const hangmanParts = ["head", "torso", "left-arm", "right-arm", "left-leg", "right-leg"];

// --- Blitz State Engine Variables ---
let blitzTimerInterval = null;
let blitzTimeRemaining = 0;
let currentBlitzTarget = "";
let isBlitzActive = false;
let baseBlitzTimeWindow = 12; // Starts at 12 seconds per word

// --- DOM References Cache ---
const profileGate = document.getElementById("profile-gate");
const mainGameContainer = document.getElementById("main-game-container");
const playerNameInput = document.getElementById("player-name-input");
const startProfileBtn = document.getElementById("start-profile-btn");
const playerDisplay = document.getElementById("player-display");
const wordDisplay = document.getElementById("word-display");
const keyboardContainer = document.getElementById("keyboard");
const starterClue = document.getElementById("starter-clue");
const hintBtn = document.getElementById("hint-btn");
const hintText = document.getElementById("hint-text");
const scoreVal = document.getElementById("score-val");
const modeVal = document.getElementById("mode-val");
const gameplayArea = document.getElementById("core-gameplay-area");

// Blitz Controls
const blitzIdleView = document.getElementById("blitz-idle-view");
const blitzActiveView = document.getElementById("blitz-active-view");
const startBlitzBtn = document.getElementById("start-blitz-btn");
const abortBlitzBtn = document.getElementById("abort-blitz-btn");
const blitzTimerDisplay = document.getElementById("blitz-timer");
const blitzTargetDisplay = document.getElementById("blitz-target-word");
const blitzInputField = document.getElementById("blitz-input");

const resultModal = document.getElementById("result-modal");
const modalTitle = document.getElementById("modal-title");
const modalMessage = document.getElementById("modal-message");
const revealedWord = document.getElementById("revealed-word");
const restartBtn = document.getElementById("restart-btn");
const modeButtons = document.querySelectorAll(".mode-btn");

// --- Sound Synthesizer Engine (Web Audio API) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSynthSound(isCorrect) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    if (isCorrect) {
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.08);
        gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.start(); osc.stop(audioCtx.currentTime + 0.2);
    } else {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(120, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(60, audioCtx.currentTime + 0.25);
        gainNode.gain.setValueAtTime(0.18, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.28);
        osc.start(); osc.stop(audioCtx.currentTime + 0.28);
    }
}

// --- Player Initialization Gate ---
startProfileBtn.addEventListener("click", () => {
    const enteredName = playerNameInput.value.trim();
    if(enteredName.length < 2) return alert("Identify your handle.");
    playerDisplay.textContent = enteredName;
    profileGate.classList.add("hidden");
    mainGameContainer.classList.remove("hidden");
    initGame();
});

// --- Infinite Words API Streamer ---
async function fetchWordFromAPI(category) {
    let tag = "technology";
    if (category === "places") tag = "geography";
    if (category === "animals") tag = "zoology";
    const url = `https://api.datamuse.com/words?rel_jja=${tag}&md=d&max=40`;

    try {
        const response = await fetch(url);
        if(!response.ok) throw new Error();
        const data = await response.json();
        const validList = data.filter(item => 
            item.word.length >= 5 && item.word.length <= 10 && 
            /^[a-z]+$/.test(item.word) && item.defs && item.defs.length > 0
        );
        const chosen = validList[Math.floor(Math.random() * validList.length)];
        activeWord = chosen.word.toLowerCase();
        currentHint = chosen.defs[0].replace(/^[a-z\s]+\t/, "");
    } catch {
        const list = fallbackBank[category] || fallbackBank.tech;
        const fallback = list[Math.floor(Math.random() * list.length)];
        activeWord = fallback.word.toLowerCase();
        currentHint = fallback.hint;
    }
}

// --- Core Game Initialization ---
async function initGame() {
    if(isBlitzActive) cancelBlitzMode();
    guessedLetters.clear();
    wrongGuesses = 0;
    hintText.textContent = "Premium definitions offline.";
    updateScoreDisplay();
    resetVisualizer();
    
    starterClue.textContent = "Downloading matrix nodes...";
    wordDisplay.innerHTML = "<div class='hint-text'>Syncing grid data...</div>";

    await fetchWordFromAPI(currentMode);

    revealedIndex = Math.floor(Math.random() * activeWord.length);
    guessedLetters.add(activeWord.charAt(revealedIndex));

    generateStarterHint();
    renderWordSlots();
    buildKeyboard();
    evaluateHintButtonState();
}

function generateStarterHint() {
    const len = activeWord.length;
    const characterRevealed = activeWord.charAt(revealedIndex).toUpperCase();
    starterClue.textContent = `Target length: ${len} letters. Telemetry decrypted character '${characterRevealed}' at position index #${revealedIndex + 1}.`;
}

function renderWordSlots() {
    wordDisplay.innerHTML = "";
    [...activeWord].forEach((char) => {
        const slot = document.createElement("div");
        slot.classList.add("letter-slot");
        if(guessedLetters.has(char)) {
            slot.textContent = char;
            slot.classList.add("revealed");
        }
        wordDisplay.appendChild(slot);
    });
}

function updateWordSlots() {
    const slots = document.querySelectorAll(".letter-slot");
    [...activeWord].forEach((char, index) => {
        if(guessedLetters.has(char)) {
            slots[index].textContent = char;
            slots[index].classList.add("revealed");
        }
    });
}

function buildKeyboard() {
    keyboardContainer.innerHTML = "";
    const alphabet = "abcdefghijklmnopqrstuvwxyz";
    [...alphabet].forEach(letter => {
        const button = document.createElement("button");
        button.textContent = letter;
        button.id = `key-${letter}`;
        button.classList.add("key");
        if (guessedLetters.has(letter) && letter === activeWord.charAt(revealedIndex)) {
            button.classList.add("correct-guess");
            button.disabled = true;
        }
        button.addEventListener("click", () => processInputGuess(letter));
        keyboardContainer.appendChild(button);
    });
}

function processInputGuess(letter) {
    if(guessedLetters.has(letter) || wrongGuesses >= maxStrikes || isBlitzActive) return;
    guessedLetters.add(letter);
    
    const virtualBtn = document.getElementById(`key-${letter}`);
    if(virtualBtn) virtualBtn.disabled = true;

    if(activeWord.includes(letter)) {
        if(virtualBtn) virtualBtn.classList.add("correct-guess");
        playSynthSound(true);
        score += 15;
        updateWordSlots();
        checkWinCondition();
    } else {
        if(virtualBtn) virtualBtn.classList.add("wrong-guess");
        playSynthSound(false);
        score = Math.max(0, score - 10);
        if(wrongGuesses < maxStrikes) {
            document.querySelector(`.${hangmanParts[wrongGuesses]}`).classList.add("visible");
        }
        wrongGuesses++;
        checkLoseCondition();
    }
    updateScoreDisplay();
    evaluateHintButtonState();
}

// Hardware Keyboard Interceptor Rules
window.addEventListener("keydown", (e) => {
    if (isBlitzActive || document.activeElement === playerNameInput || document.activeElement === blitzInputField) return;
    const pressedKey = e.key.toLowerCase();
    if (/^[a-z]$/.test(pressedKey)) processInputGuess(pressedKey);
});

function resetVisualizer() {
    hangmanParts.forEach(part => {
        document.querySelector(`.${part}`).classList.remove("visible");
    });
}

// --- Paywalled Hint Processor ---
hintBtn.addEventListener("click", () => {
    const cost = 25;
    if(score >= cost) {
        score -= cost;
        updateScoreDisplay();
        hintText.textContent = `DECRYPTED HINT: "${currentHint}"`;
        hintBtn.disabled = true;
        evaluateHintButtonState();
    }
});

function evaluateHintButtonState() {
    const isAlreadyUnlocked = hintText.textContent.startsWith("DECRYPTED");
    if(score < 25 || isAlreadyUnlocked || wrongGuesses >= maxStrikes) {
        hintBtn.disabled = true;
    } else {
        hintBtn.disabled = false;
    }
}

function updateScoreDisplay() {
    scoreVal.textContent = score;
}

// --- Dynamic Blitz Mode with Decaying Difficulty & Absolute Limits ---
startBlitzBtn.addEventListener("click", () => {
    isBlitzActive = true;
    gameplayArea.classList.add("disabled-blur");
    blitzIdleView.classList.add("hidden");
    blitzActiveView.classList.remove("hidden");
    
    baseBlitzTimeWindow = 12; // Reset initial difficulty baseline timer
    blitzTimeRemaining = baseBlitzTimeWindow;
    blitzTimerDisplay.textContent = `${blitzTimeRemaining}s`;
    
    nextBlitzTargetWord();
    blitzInputField.value = "";
    blitzInputField.removeAttribute("disabled");
    blitzInputField.focus();
    
    blitzTimerInterval = setInterval(() => {
        blitzTimeRemaining--;
        
        // Strict baseline cap guard ensuring the clock terminates right at zero seconds
        if(blitzTimeRemaining <= 0) {
            blitzTimeRemaining = 0;
            blitzTimerDisplay.textContent = "0s";
            stopBlitzEarningSystem("TIME EXPIRED! Harvester core shut down.");
            return;
        }
        blitzTimerDisplay.textContent = `${blitzTimeRemaining}s`;
    }, 1000);
});

// Explicit Manual "Abort & Exit" Button Implementation
abortBlitzBtn.addEventListener("click", () => {
    stopBlitzEarningSystem("Blitz farming session terminated by operative command.");
});

function nextBlitzTargetWord() {
    currentBlitzTarget = blitzWordLibrary[Math.floor(Math.random() * blitzWordLibrary.length)];
    blitzTargetDisplay.textContent = currentBlitzTarget.toUpperCase();
}

blitzInputField.addEventListener("input", () => {
    if(!isBlitzActive || blitzTimeRemaining <= 0) return;
    
    if(blitzInputField.value.trim().toLowerCase() === currentBlitzTarget) {
        score += 30; // Inject points safely
        updateScoreDisplay();
        playSynthSound(true);
        blitzInputField.value = "";
        
        // Decreasing Allowed Word Entrance Window - Make the next word speed drop
        baseBlitzTimeWindow = Math.max(4, baseBlitzTimeWindow - 1.5); // Never drops lower than a frantic 4 seconds
        blitzTimeRemaining = Math.round(baseBlitzTimeWindow);
        
        blitzTimerDisplay.textContent = `${blitzTimeRemaining}s`;
        nextBlitzTargetWord();
    }
});

function stopBlitzEarningSystem(messageText) {
    clearInterval(blitzTimerInterval);
    blitzInputField.setAttribute("disabled", "true"); // Lock out structural changes immediately
    blitzInputField.value = "";
    playSynthSound(false);
    
    alert(messageText);
    cancelBlitzMode();
}

function cancelBlitzMode() {
    clearInterval(blitzTimerInterval);
    isBlitzActive = false;
    gameplayArea.classList.remove("disabled-blur");
    blitzActiveView.classList.add("hidden");
    blitzIdleView.classList.remove("hidden");
}

// --- End Conditions ---
function checkWinCondition() {
    if([...activeWord].every(char => guessedLetters.has(char))) endGame(true);
}

function checkLoseCondition() {
    if(wrongGuesses >= maxStrikes) endGame(false);
}

function endGame(win) {
    resultModal.classList.remove("hidden");
    revealedWord.textContent = activeWord.toUpperCase();
    if(win) {
        modalTitle.textContent = "TRANSMISSION SECURED";
        modalTitle.style.color = "var(--correct)";
        modalMessage.textContent = `Operative passed authorization. Final balance: ${score} pts.`;
    } else {
        modalTitle.textContent = "CORE SYSTEM TERMINATED";
        modalTitle.style.color = "var(--wrong)";
        modalMessage.textContent = "Structural integrity collapsed under strain.";
    }
}

// --- Global Setup UI Binding Listeners ---
modeButtons.forEach(btn => {
    btn.addEventListener("click", (e) => {
        modeButtons.forEach(b => b.classList.remove("active"));
        e.target.classList.add("active");
        currentMode = e.target.dataset.mode;
        modeVal.textContent = e.target.textContent;
        initGame();
    });
});

restartBtn.addEventListener("click", () => {
    resultModal.classList.add("hidden");
    initGame();
});