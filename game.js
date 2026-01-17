// Jeopardy Game Logic
class JeopardyGame {
    constructor() {
        this.currentRound = 1;
        this.players = [
            { name: 'David', score: 0, buzzerKey: '1' },
            { name: 'Ludde', score: 0, buzzerKey: '2' },
            { name: 'Lina', score: 0, buzzerKey: '3' },
            { name: 'Hanna', score: 0, buzzerKey: '4' }
        ];
        this.answeredQuestions = {
            round1: [],
            round2: [],
            round3: []
        };
        this.currentQuestion = null;
        this.buzzerActive = false;
        this.buzzerWinner = null;
        this.buzzerAttempts = [];
        this.autoCloseTimeout = null;
        this.answerShown = false;
        this.showingDeathCategoryAnswer = false; // För att kunna stänga med PageDown
        this.currentOwner = null; // Vem som senast svarade rätt (äger spelet)
        this.questionTimer = null; // 10s timer för frågor
        this.answerTimer = null; // 7s timer för svar
        this.timerInterval = null; // För grafisk timer
        this.timeRemaining = 0; // För grafisk display

        // Final Jeopardy state
        this.finalWagers = [0, 0, 0, 0];
        this.finalCurrentPlayer = 0;

        // Ämnesavslöjning
        this.revealedCategories = 0; // Hur många ämnen som är avslöjade
        this.categoriesRevealed = false; // Om alla ämnen är avslöjade
        this.valuesRevealed = false; // Om beloppen är avslöjade
        this.ownerSelected = false; // Om spelägaren har slumpats

        // Ljud och video
        this.dailyDoubleCount = 0; // Räkna antal Daily Doubles
        this.currentAudio = null; // För att kunna stoppa ljud
        this.introAudio = null; // Separat för intro-ljud som ska fortsätta
        this.currentVideo = null; // För att kunna stoppa video

        this.init();
    }

    init() {
        // Sätt upp event listeners men starta inte spelet än
        this.setupEventListeners();
        this.updatePlayerScores();

        // Lägg till event listener för startknappen
        const startBtn = document.getElementById('startGameBtn');
        if (startBtn) {
            startBtn.onclick = () => this.startGame();
        }
    }

    startGame() {
        // Spela jingel
        const jingle = this.playSound('sounds/jingel.mp3', 0.7);

        // När jingeln är klar, starta spelet
        jingle.onended = () => {
            // Dölj startskärmen
            document.getElementById('startScreen').style.display = 'none';
            // Visa spelet
            document.getElementById('gameContainer').style.display = 'block';

            // Rendera brädet och starta animationer
            this.renderBoard();

            // Starta beloppsanimation efter kort delay
            setTimeout(() => {
                this.revealValuesInWave();
            }, 500);
        };
    }

    playIntroMusic() {
        const audio = new Audio('jeopardy-intro.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {
            console.log('Intro-musik inte tillgänglig');
        });
    }

    // Ljudhantering
    playSound(soundFile, volume = 0.7) {
        // Stoppa tidigare ljud om det finns
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
        }

        this.currentAudio = new Audio(soundFile);
        this.currentAudio.volume = volume;
        this.currentAudio.play().catch((error) => {
            console.log(`Kunde inte spela ${soundFile}:`, error);
        });

        return this.currentAudio;
    }

    stopSound() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }
    }

    playIntroSound(soundFile, volume = 0.7) {
        // Stoppa tidigare intro-ljud om det finns
        if (this.introAudio) {
            this.introAudio.pause();
            this.introAudio.currentTime = 0;
        }

        this.introAudio = new Audio(soundFile);
        this.introAudio.volume = volume;
        this.introAudio.play().catch((error) => {
            console.log(`Kunde inte spela ${soundFile}:`, error);
        });

        return this.introAudio;
    }

    stopIntroSound() {
        if (this.introAudio) {
            this.introAudio.pause();
            this.introAudio.currentTime = 0;
            this.introAudio = null;
        }
    }

    // Videohantering
    playVideo(videoFile, onEnded = null) {
        // Skapa video-element om det inte finns
        let videoElement = document.getElementById('gameVideo');
        if (!videoElement) {
            videoElement = document.createElement('video');
            videoElement.id = 'gameVideo';
            videoElement.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 95vw;
                height: 95vh;
                object-fit: contain;
                z-index: 10000;
                background: black;
            `;
            document.body.appendChild(videoElement);
        }

        videoElement.src = videoFile;
        videoElement.style.display = 'block';
        videoElement.play();

        if (onEnded) {
            videoElement.onended = () => {
                videoElement.style.display = 'none';
                onEnded();
            };
        } else {
            videoElement.onended = () => {
                videoElement.style.display = 'none';
            };
        }

        this.currentVideo = videoElement;
        return videoElement;
    }

    stopVideo() {
        const videoElement = document.getElementById('gameVideo');
        if (videoElement) {
            videoElement.pause();
            videoElement.style.display = 'none';
        }
    }

    renderBoard() {
        const board = document.getElementById('gameBoard');
        board.innerHTML = '';

        const currentData = this.getCurrentRoundData();
        const roundKey = `round${this.currentRound}`;

        // Rendera kategorier
        currentData.categories.forEach((category, index) => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'category';
            categoryDiv.dataset.categoryIndex = index;

            // Lägg till mindre font för långa kategorinamn
            if (category.length > 20) {
                categoryDiv.classList.add('category-long');
            }

            // Visa antingen "JEOPARDY" eller ämnet beroende på om det är avslöjat
            if (this.categoriesRevealed || index < this.revealedCategories) {
                categoryDiv.textContent = category;
                categoryDiv.classList.add('revealed');
            } else {
                categoryDiv.textContent = 'JEOPARDY';
                categoryDiv.style.color = '#ffd700';
            }

            board.appendChild(categoryDiv);
        });

        // Rendera frågor
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 6; col++) {
                const question = currentData.questions[col][row];
                const questionDiv = document.createElement('div');
                questionDiv.className = 'question-cell';
                questionDiv.dataset.col = col;
                questionDiv.dataset.row = row;

                const questionId = `${col}-${row}`;
                const isDailyDouble = currentData.dailyDoubles &&
                                     currentData.dailyDoubles.includes(questionId);

                if (this.answeredQuestions[roundKey].includes(questionId)) {
                    questionDiv.classList.add('answered');
                    questionDiv.textContent = '';
                } else if (this.categoriesRevealed && this.ownerSelected) {
                    questionDiv.textContent = question.value;
                    questionDiv.onclick = () => this.selectQuestion(col, row, isDailyDouble);
                } else if (this.categoriesRevealed || this.valuesRevealed) {
                    // Visa belopp men inte klickbart förrän kategorier är avslöjade OCH ägare vald
                    questionDiv.textContent = question.value;
                    questionDiv.style.cursor = 'default';
                } else {
                    // Om belopp inte är avslöjade, visa tom ruta
                    questionDiv.textContent = '';
                    questionDiv.style.cursor = 'default';
                }

                board.appendChild(questionDiv);
            }
        }

        // Markera ägaren av spelet
        this.updateOwnerDisplay();
    }

    getCurrentRoundData() {
        if (this.currentRound === 1) return gameData.round1;
        if (this.currentRound === 2) return gameData.round2;
        if (this.currentRound === 3) return gameData.round3;
    }

    revealValuesInWave() {
        if (this.valuesRevealed) {
            console.log('Values already revealed, skipping animation');
            return;
        }

        // Spela ljud när beloppen snurrar upp
        this.playSound('sounds/ämnen_visas.mp3', 0.6);

        const currentData = this.getCurrentRoundData();

        if (!currentData) {
            console.error('Could not get current round data');
            return;
        }

        // Vänta lite extra för att säkerställa att DOM är redo
        setTimeout(() => {
            const questionCells = document.querySelectorAll('.question-cell');
            console.log('Starting wave animation, found', questionCells.length, 'cells');

            if (questionCells.length !== 30) {
                console.error('Expected 30 cells, found', questionCells.length);
            }

            // Animera fram varje fråga i en våg (från vänster till höger, rad för rad)
            const animations = [];

            for (let row = 0; row < 5; row++) {
                for (let col = 0; col < 6; col++) {
                    const index = row * 6 + col;
                    const delay = (col * 100) + (row * 150);

                    animations.push({
                        index,
                        row,
                        col,
                        delay
                    });
                }
            }

            // Kör alla animationer
            animations.forEach(anim => {
                const cell = questionCells[anim.index];
                const question = currentData.questions[anim.col][anim.row];

                if (!cell) {
                    console.error('Cell not found at index', anim.index);
                    return;
                }

                if (!question) {
                    console.error('Question not found at col:', anim.col, 'row:', anim.row);
                    return;
                }

                setTimeout(() => {
                    console.log('Animating cell', anim.index, 'with value', question.value);
                    cell.classList.add('value-revealing');

                    // Byt text i mitten av rotationen (0.3s)
                    setTimeout(() => {
                        cell.textContent = String(question.value);
                    }, 300);

                    // Ta bort animation-klass när den är klar
                    setTimeout(() => {
                        cell.classList.remove('value-revealing');
                    }, 600);
                }, anim.delay);
            });

            // Markera att alla belopp är avslöjade efter sista animationen
            const maxDelay = Math.max(...animations.map(a => a.delay));
            setTimeout(() => {
                this.valuesRevealed = true;
                console.log('All values revealed! valuesRevealed =', this.valuesRevealed);
            }, maxDelay + 600);
        }, 100);
    }

    revealNextCategory() {
        if (!this.valuesRevealed) return; // Kan inte avslöja kategorier förrän beloppen är klara
        if (this.categoriesRevealed) return;

        const currentData = this.getCurrentRoundData();
        if (this.revealedCategories >= currentData.categories.length) {
            this.categoriesRevealed = true;
            this.renderBoard();
            return;
        }

        // Hitta kategori-diven som ska avslöjas
        const categoryIndex = this.revealedCategories;
        const categoryDivs = document.querySelectorAll('.category');
        const categoryDiv = categoryDivs[categoryIndex];

        if (categoryDiv) {
            // Lägg till rotation-animation
            categoryDiv.classList.add('flipping');

            // Efter halva animationen (0.3s), byt text
            setTimeout(() => {
                categoryDiv.textContent = currentData.categories[categoryIndex];
                categoryDiv.style.color = 'white';
            }, 300);

            // När animationen är klar, ta bort class
            setTimeout(() => {
                categoryDiv.classList.remove('flipping');
                categoryDiv.classList.add('revealed');
            }, 600);
        }

        this.revealedCategories++;

        // Om alla kategorier är avslöjade, visa frågor
        if (this.revealedCategories >= currentData.categories.length) {
            setTimeout(() => {
                this.categoriesRevealed = true;
                this.renderBoard();
            }, 700);
        }
    }

    updateOwnerDisplay() {
        document.querySelectorAll('.player').forEach((p, index) => {
            if (index === this.currentOwner) {
                p.classList.add('owner');
            } else {
                p.classList.remove('owner');
            }
        });
    }

    startOwnerRandomization() {
        const playerElements = document.querySelectorAll('.player');

        let currentIndex = 0;
        let iterations = 0;
        const maxIterations = 20; // Slumpa 20 gånger
        const initialDelay = 80; // Börja på 80ms

        const randomize = () => {
            iterations++;

            // Ta bort owner från alla spelare
            playerElements.forEach(p => p.classList.remove('owner'));

            // Välj en slumpmässig spelare
            currentIndex = Math.floor(Math.random() * 4);

            // Lägg till owner på den valda spelaren
            playerElements[currentIndex].classList.add('owner');

            if (iterations < maxIterations) {
                // Öka fördröjningen gradvis för att sakta ner
                const delay = initialDelay + (iterations * 25);
                setTimeout(randomize, delay);
            } else {
                // Slumpning klar - behåll den slutgiltiga ägaren
                setTimeout(() => {
                    this.currentOwner = currentIndex;
                    this.ownerSelected = true;
                    this.updateOwnerDisplay();
                }, 300);
            }
        };

        randomize();
    }

    selectQuestion(col, row, isDailyDouble) {
        const currentData = this.getCurrentRoundData();
        const question = currentData.questions[col][row];
        const category = currentData.categories[col];

        this.currentQuestion = {
            col,
            row,
            data: question,
            category,
            isDailyDouble
        };

        this.answerShown = false;

        // Hitta frågekortet och få dess position
        const questionCells = document.querySelectorAll('.question-cell');
        const questionIndex = row * 6 + col;
        const questionCell = questionCells[questionIndex];

        if (questionCell) {
            const rect = questionCell.getBoundingClientRect();
            this.animateQuestionFromPosition(rect, isDailyDouble);
        } else {
            // Fallback om vi inte hittar elementet
            if (isDailyDouble) {
                this.showDailyDouble();
            } else {
                this.showQuestion();
            }
        }
    }

    animateQuestionFromPosition(rect, isDailyDouble) {
        const modal = document.getElementById('questionModal');
        const modalContent = modal.querySelector('.modal-content');

        // Visa modalen dold först
        modal.classList.remove('hidden');
        modal.style.opacity = '0';

        // Visa frågan
        if (isDailyDouble) {
            this.showDailyDouble();
        } else {
            this.showQuestion();
        }

        // Starta från en mycket liten ruta i mitten av skärmen
        modalContent.style.transform = 'scale(0.1)';
        modalContent.style.transition = 'none';
        modal.style.opacity = '1';

        // Trigga zoom-animation efter ett kort delay
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                modalContent.style.transition = 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
                modalContent.style.transform = 'scale(1)';
            });
        });

        // Rensa styles efter animationen
        setTimeout(() => {
            modalContent.style.transition = '';
            modalContent.style.transform = '';
        }, 600);
    }

    showDailyDouble() {
        document.getElementById('questionValue').textContent = 'DUBBELCHANS!';
        document.getElementById('questionValue').style.color = '#ff6b6b';
        document.getElementById('questionValue').style.fontSize = '4rem';
        document.getElementById('questionCategory').textContent = this.currentQuestion.category;

        // Spela Daily Double-ljud
        this.dailyDoubleCount++;
        if (this.dailyDoubleCount === 1) {
            // Första gången - spela dubbelchans_1
            this.playSound('sounds/dubbelchans_1.mp3');
        } else {
            // Slumpa mellan 1, 2 och 3
            const randomSound = Math.floor(Math.random() * 3) + 1;
            this.playSound(`sounds/dubbelchans_${randomSound}.mp3`);
        }

        // Sätt spelaren som äger spelet till glad
        this.setPlayerFaces(this.currentOwner);

        const ownerName = this.currentOwner !== null ? this.players[this.currentOwner].name : 'Ingen';
        const ownerScore = this.currentOwner !== null ? this.players[this.currentOwner].score : 0;

        // Hitta högsta värdet på brädet för denna runda
        const currentData = this.getCurrentRoundData();
        let maxBoardValue = 0;
        currentData.questions.forEach(category => {
            category.forEach(q => {
                if (q.value > maxBoardValue) {
                    maxBoardValue = q.value;
                }
            });
        });

        const maxWager = Math.max(maxBoardValue, ownerScore);

        // Visa glad bild på spelaren
        const ownerImageSrc = this.currentOwner !== null ?
            `images/${['david', 'ludde', 'lina', 'hanna'][this.currentOwner]}_glad.png` : '';

        document.getElementById('questionText').innerHTML = `
            <div style="text-align: center;">
                <img src="${ownerImageSrc}" alt="${ownerName}"
                    style="width: 200px; height: 200px; border-radius: 50%; object-fit: cover; margin-bottom: 20px;">
                <p style="font-size: 1.2rem; margin-bottom: 20px;">
                    Nuvarande poäng: ${ownerScore} kr<br>
                    Maxinsats: ${maxWager} kr
                </p>
                <label style="font-size: 1.5rem; display: block; margin-bottom: 15px;">
                    Välj insats:
                </label>
                <input type="number" id="dailyDoubleWager"
                    min="0" max="${maxWager}" value="${Math.min(1000, maxWager)}"
                    step="100"
                    style="font-size: 2.5rem; padding: 20px; width: 350px; text-align: center; border: 3px solid #ffd700; border-radius: 10px;">
            </div>
        `;

        document.getElementById('questionAnswer').classList.add('hidden');
        document.getElementById('buzzerStatus').textContent = '';
        document.getElementById('timerDisplay').classList.add('hidden');
    }

    showDailyDoubleQuestion(wager) {
        this.currentQuestion.wager = wager;

        document.getElementById('questionValue').style.color = '#ffd700';
        document.getElementById('questionValue').style.fontSize = '3rem';
        document.getElementById('questionValue').textContent = `DUBBELCHANS: ${wager} kr`;

        document.getElementById('questionText').innerHTML = this.currentQuestion.data.question;
        document.getElementById('questionAnswer').classList.add('hidden');

        document.getElementById('buzzerStatus').textContent =
            `${this.players[this.currentOwner].name} svarar...`;

        // Starta 10-sekunders timer för Daily Double
        this.startAnswerTimer(10);
    }

    showQuestion() {
        document.getElementById('questionValue').style.color = '#ffd700';
        document.getElementById('questionValue').style.fontSize = '3rem';
        document.getElementById('questionValue').textContent = this.currentQuestion.data.value + ' kr';
        document.getElementById('questionCategory').textContent = this.currentQuestion.category;
        document.getElementById('questionText').innerHTML = this.currentQuestion.data.question;
        document.getElementById('buzzerStatus').textContent = '';

        // Dölj allt som inte behövs
        document.getElementById('questionAnswer').classList.add('hidden');

        // Sätt alla spelare till neutrala när ny fråga visas
        this.setPlayerFaces(null);

        // Kolla om det är en intro-fråga och spela ljudet i bakgrunden
        const introQuestion = document.querySelector('.intro-question');
        if (introQuestion && introQuestion.dataset.audioSrc) {
            this.playIntroSound(introQuestion.dataset.audioSrc, 0.7);
        }

        // Aktivera buzzer och starta timer (20s för "Vem har dött", annars 10s)
        this.activateBuzzer();
        const isDeathCategory = this.currentQuestion.category.toLowerCase().includes('vem har dött');
        this.startQuestionTimer(isDeathCategory ? 20 : 10);
    }

    startQuestionTimer(seconds = 10) {
        this.clearTimers();
        this.timeRemaining = seconds;
        // Ingen synlig timer under frågan, bara intern nedräkning
        document.getElementById('timerDisplay').classList.add('hidden');

        this.timerInterval = setInterval(() => {
            this.timeRemaining--;

            if (this.timeRemaining <= 0) {
                this.clearTimers();
                // Automatiskt stäng frågan efter 10 sekunder
                if (!this.answerShown) {
                    // Stoppa intro-ljud om det spelar
                    this.stopIntroSound();

                    // Ingen lyckas svara - spela inget_svar ljud
                    this.playSound('sounds/inget_svar.mp3', 0.5);

                    // Alla blir neutrala
                    this.setPlayerFaces(null);
                    this.markQuestionAsAnswered();
                    this.closeQuestionModal();
                }
            }
        }, 1000);
    }

    startAnswerTimer(seconds = 7) {
        this.clearTimers();
        this.timeRemaining = seconds;
        this.totalTime = seconds;
        this.createTimerBars(seconds);
        this.updateTimerDisplay();
        document.getElementById('timerDisplay').classList.remove('hidden');

        this.timerInterval = setInterval(() => {
            this.timeRemaining--;
            this.updateTimerDisplay();

            if (this.timeRemaining <= 0) {
                this.clearTimers();
                // Time's up - behandla som fel svar
                if (!this.answerShown && this.buzzerWinner !== null) {
                    this.answerWrong();
                } else if (!this.answerShown && this.currentQuestion.isDailyDouble) {
                    // Daily Double timeout
                    this.answerWrong();
                }
            }
        }, 1000);
    }

    createTimerBars(count) {
        const timerEl = document.getElementById('timerDisplay');
        timerEl.innerHTML = ''; // Rensa gamla streck

        // Skapa streck
        for (let i = 0; i < count; i++) {
            const bar = document.createElement('div');
            bar.className = 'timer-bar';
            bar.dataset.index = i;
            timerEl.appendChild(bar);
        }
    }

    updateTimerDisplay() {
        const timerEl = document.getElementById('timerDisplay');
        const bars = timerEl.querySelectorAll('.timer-bar');
        const totalBars = bars.length;

        if (totalBars === 0) return;

        // Beräkna hur många par som ska släckas
        // Släck från båda hållen samtidigt, symmetriskt
        const barsToKeepLit = this.timeRemaining;
        const pairsToTurnOff = Math.floor((totalBars - barsToKeepLit) / 2);

        bars.forEach((bar, index) => {
            // Släck från båda kanter samtidigt
            // Vänster: 0 till pairsToTurnOff-1
            // Höger: totalBars-pairsToTurnOff till totalBars-1
            if (index < pairsToTurnOff || index >= totalBars - pairsToTurnOff) {
                bar.classList.add('off');
            } else {
                bar.classList.remove('off');
            }
        });
    }

    clearTimers() {
        if (this.questionTimer) {
            clearTimeout(this.questionTimer);
            this.questionTimer = null;
        }
        if (this.answerTimer) {
            clearTimeout(this.answerTimer);
            this.answerTimer = null;
        }
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        document.getElementById('timerDisplay').classList.add('hidden');
    }

    showAnswer() {
        this.clearTimers();
        this.answerShown = true;
        this.markQuestionAsAnswered();

        this.autoCloseTimeout = setTimeout(() => {
            this.closeQuestionModal();
        }, 5000);
    }

    activateBuzzer() {
        this.buzzerActive = true;
        this.buzzerWinner = null;
        this.buzzerAttempts = [];

        document.querySelectorAll('.player').forEach(p => {
            p.classList.remove('active', 'buzzed');
        });
    }

    handleBuzzer(playerIndex) {
        if (!this.buzzerActive) return;
        if (this.buzzerAttempts.includes(playerIndex)) return;

        this.buzzerAttempts.push(playerIndex);

        if (this.buzzerWinner === null) {
            this.buzzerWinner = playerIndex;
            this.buzzerActive = false;

            // Pausa intro-ljud om det spelar
            if (this.introAudio && !this.introAudio.paused) {
                this.introAudio.pause();
            }

            // Spela buzzer-ljud
            const buzzerSound = new Audio('sounds/buzzer.mp3');
            buzzerSound.volume = 0.6;
            buzzerSound.play().catch(() => {});

            // Dölj frågetexten och visa spelarens ansikte istället
            const player = this.players[playerIndex];
            const playerNames = ['david', 'ludde', 'lina', 'hanna'];
            const playerImageSrc = `images/${playerNames[playerIndex]}.png`;

            document.getElementById('questionText').innerHTML = `
                <div style="text-align: center;">
                    <img src="${playerImageSrc}" alt="${player.name}"
                        style="width: 300px; height: 300px; object-fit: cover; border-radius: 50%; margin-bottom: 20px;">
                    <p style="font-size: 2rem; color: #ffd700;">${player.name} svarar...</p>
                </div>
            `;

            // Stoppa frågetimer och starta svartimer
            this.clearTimers();
            this.startAnswerTimer();

            document.getElementById('buzzerStatus').textContent = `${player.name} buzzade in!`;

            const playerElement = document.getElementById(`player${playerIndex + 1}`);
            playerElement.classList.add('buzzed', 'active');
        }
    }

    answerCorrect() {
        this.clearTimers();

        let winnerIndex = null;

        if (this.buzzerWinner === null && this.currentQuestion.isDailyDouble && this.currentOwner !== null) {
            // Daily Double
            const wager = this.currentQuestion.wager || this.currentQuestion.data.value;
            this.players[this.currentOwner].score += wager;
            this.currentOwner = this.currentOwner; // Behåller äganderätten
            winnerIndex = this.currentOwner;

            // Spela applåd för rätt svar på Daily Double
            this.playSound('sounds/applåd.mp3', 0.7);
        } else if (this.buzzerWinner !== null) {
            // Vanlig fråga
            const value = this.currentQuestion.data.value;
            this.players[this.buzzerWinner].score += value;
            this.currentOwner = this.buzzerWinner; // Ny ägare!
            winnerIndex = this.buzzerWinner;
        }

        this.updatePlayerScores();
        this.updateOwnerDisplay();

        this.markQuestionAsAnswered();

        // Visa glatt ansikte i 0.2 sekunder
        if (winnerIndex !== null) {
            const playerNames = ['david', 'ludde', 'lina', 'hanna'];
            const playerImageSrc = `images/${playerNames[winnerIndex]}_glad.png`;
            const player = this.players[winnerIndex];

            document.getElementById('questionText').innerHTML = `
                <div style="text-align: center;">
                    <img src="${playerImageSrc}" alt="${player.name}"
                        style="width: 300px; height: 300px; object-fit: cover; border-radius: 50%; margin-bottom: 20px;">
                    <p style="font-size: 2rem; color: #90EE90;">✓ Rätt svar!</p>
                </div>
            `;
        }

        // För "Vem har dött" kategorin, visa frågan i 10 sekunder extra
        const isDeathCategory = this.currentQuestion.category.toLowerCase().includes('vem har dött');
        if (isDeathCategory) {
            // Vänta 400ms för att visa glatt ansikte, sedan visa frågan
            setTimeout(() => {
                document.getElementById('questionText').innerHTML = this.currentQuestion.data.question;
                document.getElementById('buzzerStatus').textContent = '✓ Rätt svar!';

                // Uppdatera ansikten permanent
                this.setPlayerFaces(winnerIndex);

                // Sätt flagga för att kunna stänga med PageDown
                this.showingDeathCategoryAnswer = true;

                // Vänta 10 sekunder innan modalen stängs
                this.autoCloseTimeout = setTimeout(() => {
                    this.showingDeathCategoryAnswer = false;
                    this.closeQuestionModal();
                }, 10000);
            }, 400);
        } else {
            // Vänta 400ms för att visa glatt ansikte, sedan stäng
            setTimeout(() => {
                // Uppdatera ansikten permanent
                this.setPlayerFaces(winnerIndex);
                this.closeQuestionModal();
            }, 400);
        }
    }

    answerWrong() {
        this.clearTimers();

        if (this.currentQuestion.isDailyDouble && this.currentOwner !== null) {
            // Daily Double - förlora insatsen
            const wager = this.currentQuestion.wager || this.currentQuestion.data.value;
            this.players[this.currentOwner].score -= wager;
            this.updatePlayerScores();

            // Visa ledset ansikte i 0.4 sekunder
            const playerNames = ['david', 'ludde', 'lina', 'hanna'];
            const playerImageSrc = `images/${playerNames[this.currentOwner]}_ledsen.png`;
            const player = this.players[this.currentOwner];

            document.getElementById('questionText').innerHTML = `
                <div style="text-align: center;">
                    <img src="${playerImageSrc}" alt="${player.name}"
                        style="width: 300px; height: 300px; object-fit: cover; border-radius: 50%; margin-bottom: 20px;">
                    <p style="font-size: 2rem; color: #dc3545;">✗ Fel svar!</p>
                </div>
            `;

            setTimeout(() => {
                // Alla blir neutrala när Daily Double misslyckas
                this.setPlayerFaces(null);
                this.markQuestionAsAnswered();
                this.closeQuestionModal();
            }, 400);
        } else if (this.buzzerWinner !== null) {
            // Vanlig fråga
            const value = this.currentQuestion.data.value;
            this.players[this.buzzerWinner].score -= value;
            this.updatePlayerScores();

            const playerElement = document.getElementById(`player${this.buzzerWinner + 1}`);
            playerElement.classList.remove('buzzed', 'active');

            // Visa ledset ansikte i 0.4 sekunder
            const playerNames = ['david', 'ludde', 'lina', 'hanna'];
            const playerImageSrc = `images/${playerNames[this.buzzerWinner]}_ledsen.png`;
            const player = this.players[this.buzzerWinner];

            document.getElementById('questionText').innerHTML = `
                <div style="text-align: center;">
                    <img src="${playerImageSrc}" alt="${player.name}"
                        style="width: 300px; height: 300px; object-fit: cover; border-radius: 50%; margin-bottom: 20px;">
                    <p style="font-size: 2rem; color: #dc3545;">✗ Fel svar!</p>
                </div>
            `;

            if (this.buzzerAttempts.length < 4) {
                setTimeout(() => {
                    this.buzzerWinner = null;
                    this.buzzerActive = true;
                    document.getElementById('buzzerStatus').textContent = '';

                    // Återställ frågetexten
                    document.getElementById('questionText').innerHTML = this.currentQuestion.data.question;

                    // Fortsätt spela intro-ljud om det var pausat
                    if (this.introAudio && this.introAudio.paused) {
                        this.introAudio.play().catch(() => {});
                    }

                    // Starta ny timer
                    const isDeathCategory = this.currentQuestion.category.toLowerCase().includes('vem har dött');
                    this.startQuestionTimer(isDeathCategory ? 20 : 10);
                }, 400);
            } else {
                setTimeout(() => {
                    // Alla har försökt och ingen lyckas - spela inget_svar ljud
                    this.playSound('sounds/inget_svar.mp3', 0.5);

                    // Alla blir neutrala
                    this.setPlayerFaces(null);

                    this.markQuestionAsAnswered();
                    this.closeQuestionModal();
                }, 400);
            }
        }
    }

    markQuestionAsAnswered() {
        const roundKey = `round${this.currentRound}`;
        const questionId = `${this.currentQuestion.col}-${this.currentQuestion.row}`;
        if (!this.answeredQuestions[roundKey].includes(questionId)) {
            this.answeredQuestions[roundKey].push(questionId);
        }
    }

    closeQuestionModal() {
        this.clearTimers();

        if (this.autoCloseTimeout) {
            clearTimeout(this.autoCloseTimeout);
            this.autoCloseTimeout = null;
        }

        // Stoppa intro-ljud om det spelar
        this.stopIntroSound();

        document.getElementById('questionModal').classList.add('hidden');
        this.buzzerActive = false;
        this.buzzerWinner = null;
        this.currentQuestion = null;
        this.answerShown = false;
        this.showingDeathCategoryAnswer = false;

        document.querySelectorAll('.player').forEach(p => {
            p.classList.remove('active', 'buzzed');
        });

        this.renderBoard();
        this.checkRoundComplete();
    }

    checkRoundComplete() {
        const roundKey = `round${this.currentRound}`;
        const totalQuestions = 30;

        if (this.answeredQuestions[roundKey].length === totalQuestions) {
            if (this.currentRound < 3) {
                // Automatisk övergång till nästa omgång
                this.showRoundTransition();
            } else {
                // Gå till Final Jeopardy - visa ställningen först
                this.showStandings();
            }
        }
    }

    showRoundTransition() {
        const nextRound = this.currentRound + 1;
        const roundNames = ['', 'Jeopardy', 'Double Jeopardy', 'Triple Jeopardy'];

        // Uppdatera ansikten baserat på placering
        this.setPlayerFacesByPlacement();

        // Spela slut på runda-ljud
        this.playSound('sounds/slut_på_runda.mp3', 0.7);

        // Spela transition-video
        this.playVideo('sounds/transition.mp4', () => {
            // När videon är klar, visa textmodalen
            const modal = document.getElementById('transitionModal');
            document.getElementById('transitionText').textContent =
                `Nästa omgång: ${roundNames[nextRound]}!`;
            modal.classList.remove('hidden');

            setTimeout(() => {
                modal.classList.add('hidden');
                this.startNextRound();
            }, 2000);
        });
    }

    startNextRound() {
        this.currentRound++;
        const roundNames = ['', 'Jeopardy', 'Double Jeopardy', 'Triple Jeopardy'];
        document.getElementById('roundIndicator').textContent =
            `Omgång ${this.currentRound}: ${roundNames[this.currentRound]}`;

        // Återställ kategori- och beloppsavslöjning för nya omgången
        this.revealedCategories = 0;
        this.categoriesRevealed = false;
        this.valuesRevealed = false;
        this.ownerSelected = false; // Slumpa ny ägare varje runda

        this.renderBoard();

        // Starta beloppsanimation för nya omgången
        setTimeout(() => {
            this.revealValuesInWave();
        }, 500);
    }

    showStandings() {
        // Uppdatera ansikten baserat på placering
        this.setPlayerFacesByPlacement();

        // Sortera spelare efter poäng (högst till lägst)
        const sortedPlayers = this.players.map((player, index) => ({
            ...player,
            index
        })).sort((a, b) => b.score - a.score);

        // Bygg upp HTML för spelarna
        const standingsContainer = document.getElementById('standingsPlayers');
        const playerNames = ['david', 'ludde', 'lina', 'hanna'];

        standingsContainer.innerHTML = sortedPlayers.map((player, rank) => {
            const rankText = ['1:a plats', '2:a plats', '3:e plats', '4:e plats'][rank];
            const imageName = playerNames[player.index];
            const imageSrc = rank === 0
                ? `images/${imageName}_glad.png`
                : rank === 1
                    ? `images/${imageName}.png`
                    : `images/${imageName}_ledsen.png`;

            return `
                <div class="standings-player">
                    <img src="${imageSrc}" alt="${player.name}" class="standings-player-image">
                    <div class="standings-player-info">
                        <div class="standings-player-name">${player.name}</div>
                        <div class="standings-player-score">${player.score} kr</div>
                        <div class="standings-player-rank">${rankText}</div>
                    </div>
                </div>
            `;
        }).join('');

        // Visa ställningsmodal
        document.getElementById('standingsModal').classList.remove('hidden');
    }

    proceedToPriserna() {
        // Dölj ställningsmodal
        document.getElementById('standingsModal').classList.add('hidden');

        // Visa priserna-video och sedan starta Final Jeopardy
        this.playVideo('sounds/priserna.mp4', () => {
            this.startFinalJeopardy();
        });
    }

    startFinalJeopardy() {
        // Filtrera ut spelare med negativa poäng
        const eligiblePlayers = this.players.filter(p => p.score > 0);

        if (eligiblePlayers.length === 0) {
            alert('Inga spelare kan delta i Final Jeopardy!');
            this.showWinner();
            return;
        }

        this.finalCurrentPlayer = 0;
        this.finalWagers = [null, null, null, null];

        // Spara kategori och fråga
        document.getElementById('finalCategory').textContent = gameData.final.category;
        document.getElementById('finalCategorySmall').textContent = gameData.final.category;
        document.getElementById('finalQuestionText').innerHTML = gameData.final.question;
        document.getElementById('finalAnswerText').textContent = gameData.final.answer;

        // Visa FINAL! screen först
        document.getElementById('finalModal').classList.remove('hidden');
        document.getElementById('finalIntroSection').classList.remove('hidden');
        document.getElementById('finalCategoryRevealSection').classList.add('hidden');
        document.getElementById('finalWagerSection').classList.add('hidden');
        document.getElementById('finalCategorySection').classList.add('hidden');
        document.getElementById('finalQuestionSection').classList.add('hidden');
        document.getElementById('finalAnswerSection').classList.add('hidden');
        document.getElementById('finalRevealSection').classList.add('hidden');
    }

    showFinalCategoryReveal() {
        document.getElementById('finalIntroSection').classList.add('hidden');
        document.getElementById('finalCategoryRevealSection').classList.remove('hidden');

        // Spela sista_frågan.mp3 när kategorin avslöjas
        this.playSound('sounds/sista_frågan.mp3', 0.6);
    }

    startFinalWagers() {
        document.getElementById('finalCategoryRevealSection').classList.add('hidden');
        document.getElementById('finalWagerSection').classList.remove('hidden');
        this.showNextWager();
    }

    showNextWager() {
        // Hitta nästa spelare som kan satsa
        while (this.finalCurrentPlayer < 4 && this.players[this.finalCurrentPlayer].score <= 0) {
            this.finalWagers[this.finalCurrentPlayer] = 0;
            this.finalCurrentPlayer++;
        }

        if (this.finalCurrentPlayer >= 4) {
            // Alla har satsat
            this.showFinalQuestion();
            return;
        }

        const player = this.players[this.finalCurrentPlayer];
        const maxWager = player.score;
        const playerNames = ['david', 'ludde', 'lina', 'hanna'];

        // Visa spelarens glada bild
        document.getElementById('finalPlayerImage').src = `images/${playerNames[this.finalCurrentPlayer]}_glad.png`;
        document.getElementById('finalCurrentPlayer').textContent = player.name;
        document.getElementById('finalPlayerScore').textContent = `Poäng: ${player.score} kr`;
        document.getElementById('finalWagerInput').value = 0;
        document.getElementById('finalWagerInput').max = maxWager;
        document.getElementById('finalMaxWager').textContent = `Maxinsats: ${maxWager} kr`;
    }

    confirmWager() {
        const wager = parseInt(document.getElementById('finalWagerInput').value) || 0;
        this.finalWagers[this.finalCurrentPlayer] = wager;
        this.finalCurrentPlayer++;
        this.showNextWager();
    }

    showFinalQuestion() {
        document.getElementById('finalWagerSection').classList.add('hidden');
        document.getElementById('finalCategorySection').classList.remove('hidden');
        document.getElementById('finalQuestionSection').classList.add('hidden');
    }

    showActualFinalQuestion() {
        document.getElementById('finalCategorySection').classList.add('hidden');
        document.getElementById('finalQuestionSection').classList.remove('hidden');

        // Spela Final Jeopardy-musik
        const music = this.playSound('sounds/musik_finalsvar.mp3', 0.7);

        // När musiken tar slut, visa rättningsskärmen
        music.onended = () => {
            this.showCorrectionScreen();
        };
    }

    showCorrectionScreen() {
        document.getElementById('finalQuestionSection').classList.add('hidden');
        document.getElementById('finalCorrectionSection').classList.remove('hidden');
    }

    showFinalAnswer() {
        document.getElementById('finalCorrectionSection').classList.add('hidden');
        // Svaret ska inte visas - bara rättning av spelarna
        document.getElementById('finalRevealSection').classList.remove('hidden');

        this.finalCurrentPlayer = 0;
        this.showNextPlayerReveal();
    }

    showNextPlayerReveal() {
        // Hitta nästa spelare som kan vara med
        while (this.finalCurrentPlayer < 4 && this.players[this.finalCurrentPlayer].score <= 0) {
            this.finalCurrentPlayer++;
        }

        if (this.finalCurrentPlayer >= 4) {
            // Alla spelare är klara
            this.finishGame();
            return;
        }

        const player = this.players[this.finalCurrentPlayer];
        const wager = this.finalWagers[this.finalCurrentPlayer];
        const playerNames = ['david', 'ludde', 'lina', 'hanna'];
        const playerImageSrc = `images/${playerNames[this.finalCurrentPlayer]}.png`;

        // Återställ och visa spelarinformation
        document.getElementById('revealPlayerImage').src = playerImageSrc;
        document.getElementById('revealPlayerName').textContent = player.name;
        document.getElementById('revealCurrentScore').textContent = `Nuvarande: ${player.score} kr`;
        document.getElementById('revealWager').textContent = `Satsning: ${wager} kr`;
        document.getElementById('revealWager').style.display = 'block';
        document.getElementById('revealFinalScore').style.display = 'none';

        document.getElementById('revealCorrectBtn').classList.remove('hidden');
        document.getElementById('revealWrongBtn').classList.remove('hidden');
    }

    finalAnswerCorrect() {
        const wager = this.finalWagers[this.finalCurrentPlayer];
        const oldScore = this.players[this.finalCurrentPlayer].score;
        this.players[this.finalCurrentPlayer].score += wager;
        const newScore = this.players[this.finalCurrentPlayer].score;
        this.updatePlayerScores();

        document.getElementById('revealCorrectBtn').classList.add('hidden');
        document.getElementById('revealWrongBtn').classList.add('hidden');

        // Visa glatt ansikte
        const playerNames = ['david', 'ludde', 'lina', 'hanna'];
        const gladImageSrc = `images/${playerNames[this.finalCurrentPlayer]}_glad.png`;
        document.getElementById('revealPlayerImage').src = gladImageSrc;
        document.getElementById('revealCurrentScore').innerHTML = `<span style="color: #90EE90;">✓ Rätt svar!</span>`;
        document.getElementById('revealWager').style.display = 'none';

        // Vänta 2 sekunder, sedan visa slutpoäng
        setTimeout(() => {
            document.getElementById('revealFinalScore').textContent = `Slutpoäng: ${newScore} kr`;
            document.getElementById('revealFinalScore').style.display = 'block';

            // Vänta 2 sekunder till, sedan nästa spelare
            setTimeout(() => {
                this.finalCurrentPlayer++;
                this.showNextPlayerReveal();
            }, 2000);
        }, 2000);
    }

    finalAnswerWrong() {
        const wager = this.finalWagers[this.finalCurrentPlayer];
        const oldScore = this.players[this.finalCurrentPlayer].score;
        this.players[this.finalCurrentPlayer].score -= wager;
        const newScore = this.players[this.finalCurrentPlayer].score;
        this.updatePlayerScores();

        document.getElementById('revealCorrectBtn').classList.add('hidden');
        document.getElementById('revealWrongBtn').classList.add('hidden');

        // Visa ledset ansikte
        const playerNames = ['david', 'ludde', 'lina', 'hanna'];
        const sadImageSrc = `images/${playerNames[this.finalCurrentPlayer]}_ledsen.png`;
        document.getElementById('revealPlayerImage').src = sadImageSrc;
        document.getElementById('revealCurrentScore').innerHTML = `<span style="color: #dc3545;">✗ Fel svar!</span>`;
        document.getElementById('revealWager').style.display = 'none';

        // Vänta 2 sekunder, sedan visa slutpoäng
        setTimeout(() => {
            document.getElementById('revealFinalScore').textContent = `Slutpoäng: ${newScore} kr`;
            document.getElementById('revealFinalScore').style.display = 'block';

            // Vänta 2 sekunder till, sedan nästa spelare
            setTimeout(() => {
                this.finalCurrentPlayer++;
                this.showNextPlayerReveal();
            }, 2000);
        }, 2000);
    }

    finishGame() {
        document.getElementById('finalModal').classList.add('hidden');
        this.showWinner();
    }

    showWinner() {
        // Uppdatera ansikten baserat på placering
        this.setPlayerFacesByPlacement();

        const playerNames = ['david', 'ludde', 'lina', 'hanna'];
        const sortedPlayers = this.players.map((player, index) => ({
            ...player,
            index
        })).sort((a, b) => b.score - a.score);

        const winner = sortedPlayers[0];

        // Spela vinnarens video
        const winnerName = playerNames[winner.index];
        this.playVideo(`videos/vinnarvideo_${winnerName}.mp4`, () => {
            // När videon är klar, visa vinnarmodalen

            // Visa alla placeringar bredvid varandra
            const placementsContainer = document.getElementById('allPlacementsContainer');

            placementsContainer.innerHTML = sortedPlayers.map((player, index) => {
                const rank = index + 1; // 1:a, 2:a, 3:e, 4:e
                const rankText = rank === 1 ? '1:a plats' : rank === 2 ? '2:a plats' : rank === 3 ? '3:e plats' : '4:e plats';
                const imageName = playerNames[player.index];
                const imageSrc = `images/${imageName}_${rank}.png`;
                const isWinner = rank === 1;

                return `
                    <div class="placement-item ${isWinner ? 'placement-winner' : ''}">
                        <div class="placement-rank">${rankText}</div>
                        <img src="${imageSrc}" alt="${player.name}" class="placement-image">
                        <div class="placement-name">${player.name}</div>
                        <div class="placement-score">${player.score} kr</div>
                    </div>
                `;
            }).join('');

            document.getElementById('winnerModal').classList.remove('hidden');
        });
    }

    newGame() {
        location.reload();
    }

    toggleScoreManagement() {
        const scoreModal = document.getElementById('scoreModal');

        if (scoreModal.classList.contains('hidden')) {
            // Öppna modalen och ladda in nuvarande poäng
            this.players.forEach((player, index) => {
                const input = document.getElementById(`scoreInput${index}`);
                if (input) {
                    input.value = player.score;
                }
            });
            scoreModal.classList.remove('hidden');
        } else {
            // Stäng modalen
            scoreModal.classList.add('hidden');
        }
    }

    applyScoreChanges() {
        // Uppdatera alla spelarpoäng från inputs
        this.players.forEach((player, index) => {
            const input = document.getElementById(`scoreInput${index}`);
            if (input) {
                const newScore = parseInt(input.value) || 0;
                player.score = newScore;
            }
        });

        // Uppdatera displayen
        this.updatePlayerScores();
        this.updateOwnerDisplay();

        // Stäng modalen
        document.getElementById('scoreModal').classList.add('hidden');
    }

    cancelScoreChanges() {
        // Bara stäng modalen utan att spara ändringar
        document.getElementById('scoreModal').classList.add('hidden');
    }

    debugClearBoard() {
        // Avslöja allt först
        this.valuesRevealed = true;
        this.categoriesRevealed = true;

        const roundKey = `round${this.currentRound}`;
        for (let col = 0; col < 6; col++) {
            for (let row = 0; row < 5; row++) {
                const questionId = `${col}-${row}`;
                if (!this.answeredQuestions[roundKey].includes(questionId)) {
                    this.answeredQuestions[roundKey].push(questionId);
                }
            }
        }
        this.renderBoard();
        this.checkRoundComplete();
    }

    updatePlayerScores() {
        this.players.forEach((player, index) => {
            const scoreElement = document.getElementById(`player${index + 1}`)
                .querySelector('.player-score');
            scoreElement.textContent = player.score + ' kr';
        });
    }

    setPlayerFaces(winnerIndex = null) {
        const playerNames = ['david', 'ludde', 'lina', 'hanna'];

        this.players.forEach((player, index) => {
            const imageElement = document.getElementById(`player${index + 1}-image`);
            if (!imageElement) return;

            const playerName = playerNames[index];

            if (winnerIndex === null) {
                // Alla neutrala
                imageElement.src = `images/${playerName}.png`;
            } else if (index === winnerIndex) {
                // Vinnaren är glad
                imageElement.src = `images/${playerName}_glad.png`;
            } else {
                // Resten är ledsna
                imageElement.src = `images/${playerName}_ledsen.png`;
            }
        });
    }

    setPlayerFacesByPlacement() {
        const playerNames = ['david', 'ludde', 'lina', 'hanna'];

        // Skapa kopia av spelare med deras index
        const playersWithIndex = this.players.map((player, index) => ({
            player,
            index,
            score: player.score
        }));

        // Sortera efter poäng (högst till lägst)
        playersWithIndex.sort((a, b) => b.score - a.score);

        // Tilldela placering
        playersWithIndex.forEach((item, placement) => {
            const imageElement = document.getElementById(`player${item.index + 1}-image`);
            if (!imageElement) return;

            const playerName = playerNames[item.index];

            if (placement === 0) {
                // Första plats: glad
                imageElement.src = `images/${playerName}_glad.png`;
            } else if (placement === 1) {
                // Andra plats: neutral
                imageElement.src = `images/${playerName}.png`;
            } else {
                // Tredje och fjärde plats: ledsna
                imageElement.src = `images/${playerName}_ledsen.png`;
            }
        });
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            const modal = document.getElementById('questionModal');
            const finalModal = document.getElementById('finalModal');
            const standingsModal = document.getElementById('standingsModal');
            const scoreModal = document.getElementById('scoreModal');
            const finalRevealSection = document.getElementById('finalRevealSection');
            const finalWagerSection = document.getElementById('finalWagerSection');

            // R key - toggle score management modal
            if (e.key === 'r' || e.key === 'R') {
                e.preventDefault();
                this.toggleScoreManagement();
                return;
            }

            // B key - debug clear board
            if (e.key === 'b' || e.key === 'B') {
                e.preventDefault();
                this.debugClearBoard();
                return;
            }

            // J key - jump to winner screen
            if (e.key === 'j' || e.key === 'J') {
                e.preventDefault();
                finalModal.classList.add('hidden');
                this.showWinner();
                return;
            }

            // If score modal is open, don't process other keys
            if (!scoreModal.classList.contains('hidden')) {
                return;
            }

            // Standings modal - fortsätt till priserna
            if (!standingsModal.classList.contains('hidden') && e.key === 'PageDown') {
                e.preventDefault();
                this.proceedToPriserna();
                return;
            }

            // Högerpil för kategoriavslöjning (när ingen modal är öppen och belopp är avslöjade)
            if (e.key === 'PageDown' &&
                this.valuesRevealed &&
                !this.categoriesRevealed &&
                modal.classList.contains('hidden') &&
                finalModal.classList.contains('hidden')) {
                e.preventDefault();
                this.revealNextCategory();
                return;
            }

            // Ägareslumpning efter kategorierna avslöjats
            if (e.key === 'PageDown' &&
                this.categoriesRevealed &&
                !this.ownerSelected &&
                modal.classList.contains('hidden') &&
                finalModal.classList.contains('hidden')) {
                e.preventDefault();
                this.startOwnerRandomization();
                return;
            }

            // Buzzer-tangenter
            if (this.buzzerActive) {
                const playerIndex = this.players.findIndex(p => p.buzzerKey === e.key);
                if (playerIndex !== -1) {
                    e.preventDefault();
                    this.handleBuzzer(playerIndex);
                    return;
                }
            }

            // PILTANGENTER - Prioriterad hantering

            // Final Jeopardy Intro - visa kategori
            const finalIntroSection = document.getElementById('finalIntroSection');
            if (!finalIntroSection.classList.contains('hidden') &&
                !finalModal.classList.contains('hidden')) {
                if (e.key === 'PageDown') {
                    e.preventDefault();
                    this.showFinalCategoryReveal();
                    return;
                }
            }

            // Final Jeopardy Category Reveal - börja satsa
            const finalCategoryRevealSection = document.getElementById('finalCategoryRevealSection');
            if (!finalCategoryRevealSection.classList.contains('hidden') &&
                !finalModal.classList.contains('hidden')) {
                if (e.key === 'PageDown') {
                    e.preventDefault();
                    this.startFinalWagers();
                    return;
                }
            }

            // Final Jeopardy Category Section - visa frågan
            const finalCategorySection = document.getElementById('finalCategorySection');
            if (!finalCategorySection.classList.contains('hidden') &&
                !finalModal.classList.contains('hidden')) {
                if (e.key === 'PageDown') {
                    e.preventDefault();
                    this.showActualFinalQuestion();
                    return;
                }
            }

            // Final Jeopardy Question Section - musiken spelar, vänta tills den är klar
            const finalQuestionSection = document.getElementById('finalQuestionSection');
            if (!finalQuestionSection.classList.contains('hidden') &&
                !finalModal.classList.contains('hidden')) {
                // Låt musiken spela klart, ingen action här
            }

            // Final Jeopardy Correction Section - visa svaret
            const finalCorrectionSection = document.getElementById('finalCorrectionSection');
            if (!finalCorrectionSection.classList.contains('hidden') &&
                !finalModal.classList.contains('hidden')) {
                if (e.key === 'PageDown') {
                    e.preventDefault();
                    this.showFinalAnswer();
                    return;
                }
            }

            // Final Jeopardy Reveal - högsta prioritet
            if (!finalRevealSection.classList.contains('hidden') &&
                !finalModal.classList.contains('hidden')) {
                const revealCorrectBtn = document.getElementById('revealCorrectBtn');
                const revealWrongBtn = document.getElementById('revealWrongBtn');

                if (!revealCorrectBtn.classList.contains('hidden') &&
                    !revealWrongBtn.classList.contains('hidden')) {
                    if (e.key === 'PageDown') {
                        e.preventDefault();
                        this.finalAnswerCorrect();
                        return;
                    } else if (e.key === 'PageUp') {
                        e.preventDefault();
                        this.finalAnswerWrong();
                        return;
                    }
                }
            }

            // Final Jeopardy Wager
            if (!finalWagerSection.classList.contains('hidden') &&
                !finalModal.classList.contains('hidden')) {
                const input = document.getElementById('finalWagerInput');
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    input.value = Math.min(parseInt(input.max), parseInt(input.value || 0) + 100);
                    return;
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    input.value = Math.max(0, parseInt(input.value || 0) - 100);
                    return;
                } else if (e.key === 'Enter' || e.key === 'PageDown') {
                    e.preventDefault();
                    this.confirmWager();
                    return;
                }
            }

            // Daily Double wager-input
            const dailyDoubleWagerInput = document.getElementById('dailyDoubleWager');
            if (dailyDoubleWagerInput && !modal.classList.contains('hidden')) {
                if (e.key === 'PageDown') {
                    e.preventDefault();
                    const wager = parseInt(dailyDoubleWagerInput.value) || 0;
                    this.showDailyDoubleQuestion(wager);
                    return;
                }
            }

            // Vanlig frågemodal eller Daily Double-fråga
            if (!modal.classList.contains('hidden')) {
                // PageDown för att stänga dödskateg orifråga när den visas efter rätt svar
                if (e.key === 'PageDown' && this.showingDeathCategoryAnswer) {
                    e.preventDefault();
                    if (this.autoCloseTimeout) {
                        clearTimeout(this.autoCloseTimeout);
                        this.autoCloseTimeout = null;
                    }
                    this.showingDeathCategoryAnswer = false;
                    this.closeQuestionModal();
                    return;
                }

                // Högerpil - rätt svar (om någon har buzzat ELLER om det är Daily Double)
                if (e.key === 'PageDown' && (this.buzzerWinner !== null || this.currentQuestion.isDailyDouble)) {
                    e.preventDefault();
                    this.answerCorrect();
                    return;
                }

                // Vänsterpil - fel svar (om någon har buzzat ELLER om det är Daily Double)
                if (e.key === 'PageUp' && (this.buzzerWinner !== null || this.currentQuestion.isDailyDouble)) {
                    e.preventDefault();
                    this.answerWrong();
                    return;
                }
            }
        });

        // Final Jeopardy buttons (removed showFinalQuestionBtn and showFinalAnswerBtn - using Page Down instead)
        const revealCorrectBtn = document.getElementById('revealCorrectBtn');
        const revealWrongBtn = document.getElementById('revealWrongBtn');

        if (revealCorrectBtn) revealCorrectBtn.onclick = () => this.finalAnswerCorrect();
        if (revealWrongBtn) revealWrongBtn.onclick = () => this.finalAnswerWrong();

        // Other buttons
        const newGameBtn = document.getElementById('newGameBtn');
        const applyScoresBtn = document.getElementById('applyScoresBtn');
        const cancelScoresBtn = document.getElementById('cancelScoresBtn');

        if (newGameBtn) newGameBtn.onclick = () => this.newGame();
        if (applyScoresBtn) applyScoresBtn.onclick = () => this.applyScoreChanges();
        if (cancelScoresBtn) cancelScoresBtn.onclick = () => this.cancelScoreChanges();
    }
}

let game;
window.addEventListener('DOMContentLoaded', () => {
    game = new JeopardyGame();
});
