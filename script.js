document.addEventListener('DOMContentLoaded', () => {
    console.log("Valentine's Site Ready ❤️");

    // --- DOM ELEMENTS ---
    const unlockScreen = document.getElementById('audio-unlock');
    const bearBtn = document.getElementById('bear-container');
    const fadingText = document.getElementById('fading-text');
    const balloonContainer = document.getElementById('balloon-container');
    
    const sections = {
        start: document.getElementById('start-screen'),
        narrative: document.getElementById('narrative-screen'),
        puzzle: document.getElementById('puzzle-screen')
    };

    // --- MAIN NAVIGATION LOGIC ---
    function goToSection(key) {
        Object.values(sections).forEach(s => { if(s) s.classList.remove('active'); });
        if(sections[key]) sections[key].classList.add('active');
    }

    function safePlay(id) {
        const el = document.getElementById(id);
        if (el) {
            el.pause();
            el.currentTime = 0;
            el.play().catch(e => console.log("Playback prevented:", id));
        }
    }

    function safePause(id) {
        const el = document.getElementById(id);
        if (el) el.pause();
    }

    // 1. Click Start -> Show Bear
    if (unlockScreen) {
        unlockScreen.addEventListener('click', () => {
            safePlay('loop-1');
            unlockScreen.style.display = 'none';
        });
    }

    // 2. Click Bear -> Transition to Narrative
    if (bearBtn) {
        bearBtn.addEventListener('click', async () => {
            bearBtn.classList.add('fade-out-content');
            safePlay('press-me-audio');
            safePause('loop-1');

            await new Promise(r => setTimeout(r, 800));
            goToSection('narrative');
            safePlay('loop-2');
            startNarrative();
        });
    }

    // 3. Narrative Sequence
    async function startNarrative() {
        // Show balloons from narrative onward
        if (balloonContainer) {
            balloonContainer.classList.remove('hidden');
            createBalloons();
        }
        
        const messages = [
            "Dear Wife,", 
            "I'm so sorry I can't be there in person.",
            "But you should know...", 
            "No matter the distance,", 
            "I am always with you.",
            "Like literally we are on the call...",
            "ALL THE TIME!!! 😅",
            "Even now as you are reading this hehe.",
            "Alright...",
            "I have a little game ready for you. 🤓", 
            "Took me all night to make this",
            "Don't worry,",
            "you won't have much to do!", 
            "Just put the letters together;",
            "And see what it entails. 😅"
        ];
        
        if (!fadingText) return;

        let skipWait = null;
        sections.narrative.onclick = () => {
            safePlay('button-click');
            if (skipWait) skipWait(); 
        };

        for (let i = 0; i < messages.length; i++) {
            fadingText.classList.remove('visible');
            fadingText.innerText = messages[i];
            await new Promise(r => setTimeout(r, 50));
            fadingText.classList.add('visible');

            await new Promise(resolve => { skipWait = resolve; });
            fadingText.classList.remove('visible');
            await new Promise(resolve => {
                const timeout = setTimeout(resolve, 1000);
                skipWait = () => { clearTimeout(timeout); resolve(); };
            });
        }
        
        // Move to Game
        goToSection('puzzle');
        initPuzzle(finishGame);
    }

    // 4. Final Win Reveal (Movie Credits)
    async function finishGame() {
    safePause('loop-2');
    
    // 1. Fade out the puzzle
    const puzzleScreen = document.getElementById('puzzle-screen');
    if (puzzleScreen) puzzleScreen.classList.add('fade-out');

    // 2. Clear the "game version" of the balloons
    const container = document.getElementById('balloon-container');
    if (container) container.innerHTML = ''; 

    await new Promise(r => setTimeout(r, 1200));
    
    // 3. Prepare the Win Overlay
    const winOverlay = document.getElementById('win-overlay');
    if (winOverlay) {
        winOverlay.classList.remove('hidden');
        
        // --- THE MAGIC PART ---
        // Lift the container to z-index 5001 so it shows on the win screen
        if (container) container.classList.add('on-top');
        
        setTimeout(() => {
            winOverlay.classList.add('visible');
            safePlay('fav-song');
            
            // Start fresh, "cinematic" balloons for the credits
            createBalloons(15); 
        }, 50);
    }
}

    // --- THE GAME ENGINE ---
    function initPuzzle(onWin) {
        const slotContainer = document.getElementById('answer-slots');
        const keyboard = document.getElementById('scrambled-keyboard');
        const undoBtn = document.getElementById('undo-btn');
        const hintBtn = document.getElementById('hint-btn');
        const feedbackMsg = document.getElementById('feedback-msg');
        const hintDisplay = document.getElementById('hint-display');
        const closeHint = document.getElementById('close-hint');
        
        // Updated Word Order: BE MY (Line 1), FOREVER (Line 2), VALENTINE (Line 3)
        const words = ["BE", "MY", "FOREVER", "VALENTINE!"];
        const pool = "YMEBLENAVENITROFEEVR".split(""); 
        let slots = [];
        let moveHistory = []; 

        // Build Board
        words.forEach((word, wordIndex) => {
            const wordDiv = document.createElement('div');
            wordDiv.className = "word-block";
            word.split("").forEach((char) => {
                const s = document.createElement('div');
                // The "!" is provided/fixed, others are empty slots
                s.className = char === "!" ? "slot is-fixed" : "slot";
                s.innerText = char === "!" ? "!" : "";
                wordDiv.appendChild(s);
                slots.push(s);
            });
            slotContainer.appendChild(wordDiv);

            // Structure:
            // Line 1: BE MY
            // Line 2: FOREVER
            // Line 3: VALENTINE!
            if (wordIndex === 1 || wordIndex === 2) {
                const br = document.createElement('div');
                br.className = "break";
                slotContainer.appendChild(br);
            }
        });

        undoBtn.onclick = () => {
            const lastMove = moveHistory.pop();
            if (lastMove) { 
                safePlay('button-click'); 
                lastMove.slot.innerText = ""; 
                lastMove.key.classList.remove('used'); 
            }
        };

        hintBtn.onclick = () => { safePlay('button-click'); hintDisplay.classList.remove('hidden'); };
        closeHint.onclick = () => { safePlay('button-click'); hintDisplay.classList.add('hidden'); };

        const scrambled = pool.sort(() => Math.random() - 0.5);
        scrambled.forEach(char => {
            const k = document.createElement('div');
            k.className = "key";
            k.innerText = char;
            k.onclick = () => {
                // Find next empty slot that is NOT the fixed "!"
                const nextSlot = slots.find(s => s.innerText === "" && s.className === "slot");
                if (nextSlot) {
                    safePlay('button-click');
                    nextSlot.innerText = char;
                    k.classList.add('used');
                    moveHistory.push({ key: k, slot: nextSlot });
                    
                    const letterSlots = slots.filter(s => s.className === "slot");
                    if (letterSlots.every(s => s.innerText !== "")) {
                        const result = slots.map(s => s.innerText).join("");
                        // Check against the new concatenated string
                        if (result === "BEMYFOREVERVALENTINE!") {
                            safePlay('wow-audio');
                            spawnHeartConfetti();
                            onWin();
                        } else {
                            feedbackMsg.classList.remove('hidden');
                            safePlay('wrong-audio');
                            feedbackMsg.onclick = () => {
                                feedbackMsg.classList.add('hidden');
                                letterSlots.forEach(s => s.innerText = "");
                                moveHistory.forEach(m => m.key.classList.remove('used'));
                                moveHistory = [];
                                safePlay('button-click');
                            };
                        }
                    }
                }
            };
            keyboard.appendChild(k);
        });
    }

    // --- EFFECTS ---
    function spawnHeartConfetti() {
        const heartSVG = `<svg viewBox="0 0 32 32"><path d="M16 28.5L14.1 26.8C7.1 20.6 2.5 16.4 2.5 11.2 2.5 7 5.7 3.8 9.8 3.8c2.3 0 4.6 1.1 6.2 2.8 1.6-1.7 3.9-2.8 6.2-2.8 4.1 0 7.3 3.2 7.3 7.4 0 5.2-4.6 9.4-11.6 15.6L16 28.5z"/></svg>`;
        for (let i = 0; i < 20; i++) {
            const container = document.createElement('div');
            container.className = 'confetti';
            container.innerHTML = heartSVG;
            container.style.width = `${Math.floor(Math.random() * 15) + 20}px`;
            container.style.left = Math.random() * 100 + "vw";
            container.style.animationDuration = `${Math.random() * 4 + 4}s`;
            container.style.animationDelay = `${Math.random() * 10}s`;
            const colors = ['#d63031', '#ff4d4d', '#ff7675', '#fab1a0', '#fd79a8'];
            container.style.fill = colors[Math.floor(Math.random() * colors.length)];
            document.body.appendChild(container);
        }
    }

    function createBalloons(count = 15) {
    const container = document.getElementById('balloon-container');
    if (!container) return;
    for (let i = 0; i < count; i++) {
        const b = document.createElement('div');
        b.className = 'balloon';
        b.style.left = Math.random() * 90 + "vw";
        b.style.animationDelay = Math.random() * 5 + "s";
        b.style.backgroundColor = `hsl(${Math.random() * 30 + 340}, 70%, 80%)`;
        container.appendChild(b);
    }
}
});

