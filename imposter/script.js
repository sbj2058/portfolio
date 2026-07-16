// Local Database with fallback definitions to ensure custom smart properties apply instantly
const wordPool = {
    food: [
        { word: "Pizza", property: "Baked" }, { word: "Burger", property: "Meaty" },
        { word: "Sushi", property: "Raw" }, { word: "Icecream", property: "Frozen" }
    ],
    vehicles: [
        { word: "Submarine", property: "Underwater" }, { word: "Airplane", property: "Winged" },
        { word: "Bicycle", property: "Two-Wheeled" }, { word: "Train", property: "Track-bound" }
    ],
    places: [
        { word: "Hospital", property: "Medical" }, { word: "Library", property: "Quiet" },
        { word: "Desert", property: "Arid" }, { word: "Airport", property: "Terminal" }
    ],
    things: [
        { word: "Umbrella", property: "Waterproof" }, { word: "Mirror", property: "Reflective" },
        { word: "Guitar", property: "Acoustic" }, { word: "Clock", property: "Ticking" }
    ]
};

let totalPlayers = 4;
let imposterIndex = 0;
let startingPlayer = 0;
let currentDistributePlayer = 0;
let secretWord = "";
let customPropertyHint = "";
let hasPeekedCurrentTurn = false;
let peekTimer = null;

const pad = document.getElementById('peek-pad');

// Multi-device event mapping (Supports Desktop & Mobile Native Touch)
pad.addEventListener('mousedown', startPeek);
pad.addEventListener('mouseup', endPeek);
pad.addEventListener('mouseleave', endPeek);
pad.addEventListener('touchstart', (e) => { e.preventDefault(); startPeek(); });
pad.addEventListener('touchend', endPeek);

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

async function initiateGame() {
    totalPlayers = parseInt(document.getElementById('player-count').value);
    const category = document.getElementById('category').value;
    
    showScreen('screen-loading');

    const dataset = wordPool[category];
    const selection = dataset[Math.floor(Math.random() * dataset.length)];
    secretWord = selection.word;
    customPropertyHint = selection.property; // Default smart property fallback

    // Dynamic extraction from Free Dictionary API
    try {
        const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${secretWord.toLowerCase()}`);
        if(res.ok) {
            const data = await res.json();
            const definition = data[0]?.meanings[0]?.definitions[0]?.definition || "";
            
            // Clean dynamic string processing to locate an API-driven use/property hint
            if(definition.includes("used for")) {
                const parts = definition.split("used for");
                customPropertyHint = parts[1].trim().split(" ")[0].replace(/[^a-zA-Z]/g, "").toUpperCase();
            } else if (data[0]?.meanings[0]?.partOfSpeech) {
                customPropertyHint = data[0].meanings[0].partOfSpeech.toUpperCase();
            }
        }
    } catch(err) {
        console.log("Dictionary API offline. Smooth transition to contextual local property hints.");
    }

    // Algorithmic assignment of randomized roles and player mechanics
    imposterIndex = Math.floor(Math.random() * totalPlayers);
    startingPlayer = Math.floor(Math.random() * totalPlayers) + 1;
    currentDistributePlayer = 0;

    loadPlayerDistributionView();
    showScreen('screen-distribute');
}

function loadPlayerDistributionView() {
    hasPeekedCurrentTurn = false;
    document.getElementById('next-player-btn').disabled = true;
    document.getElementById('view-reminder').style.display = "block";
    document.getElementById('player-badge').innerText = `PLAYER ${currentDistributePlayer + 1}`;
    document.getElementById('pad-prompt').innerText = "HOLD TO PEEK";
    document.getElementById('secret-content').style.display = "none";
}

function startPeek() {
    const content = document.getElementById('secret-content');
    document.getElementById('pad-prompt').innerText = "";
    
    if (currentDistributePlayer === imposterIndex) {
        content.innerHTML = `<span style="color:#f59e0b; font-size:1.1rem;">CLUE PROPERTY:</span><br>${customPropertyHint.toUpperCase()}<br><span style="color:#ef4444; font-size:0.8rem;">YOU ARE THE IMPOSTER</span>`;
    } else {
        content.innerText = secretWord;
    }
    content.style.display = "block";

    // Anti-cheat rule: Check if held down for at least 1.5 seconds
    peekTimer = setTimeout(() => {
        hasPeekedCurrentTurn = true;
        document.getElementById('next-player-btn').disabled = false;
        document.getElementById('view-reminder').style.display = "none";
    }, 1500);
}

function endPeek() {
    clearTimeout(peekTimer);
    document.getElementById('secret-content').style.display = "none";
    document.getElementById('pad-prompt').innerText = "HOLD TO PEEK";
}

function handleNextPlayer() {
    if(!hasPeekedCurrentTurn) return;

    currentDistributePlayer++;
    if(currentDistributePlayer < totalPlayers) {
        loadPlayerDistributionView();
    } else {
        document.getElementById('starter-display').innerText = `Player ${startingPlayer}`;
        showScreen('screen-gameplay');
    }
}


function revealAndReset() {
    // Populate the new custom UI dialogue text elements
    document.getElementById('reveal-word').innerText = secretWord;
    document.getElementById('reveal-imposter').innerText = `Player ${imposterIndex + 1}`;
    
    // Smoothly display the modal using the CSS layout trigger
    document.getElementById('game-overlay').classList.add('show');
}

function closeModalAndReset() {
    // Hide the overlay modal framework and bounce back to home screen
    document.getElementById('game-overlay').classList.remove('show');
    showScreen('screen-setup');
}