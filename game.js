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

        this.init();
    }

    init() {
        this.renderBoard();
        this.setupEventListeners();
        this.updatePlayerScores();
        this.playIntroMusic();

        // Starta beloppsanimation efter kort delay
        setTimeout(() => {
            this.revealValuesInWave();
        }, 500);
    }

    playIntroMusic() {
        const audio = new Audio('jeopardy-intro.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {
            console.log('Intro-musik inte tillgänglig');
        });
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
                } else if (this.categoriesRevealed) {
                    questionDiv.textContent = question.value;
                    questionDiv.onclick = () => this.selectQuestion(col, row, isDailyDouble);
                } else if (this.valuesRevealed) {
                    // Visa belopp men inte klickbart förrän kategorier är avslöjade
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

        // Sätt spelaren som äger spelet till glad
        this.setPlayerFaces(this.currentOwner);

        const ownerName = this.currentOwner !== null ? this.players[this.currentOwner].name : 'Ingen';
        const ownerScore = this.currentOwner !== null ? this.players[this.currentOwner].score : 0;
        const maxValue = this.currentQuestion.data.value;
        const maxWager = Math.max(maxValue, ownerScore);

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
                <br><br>
                <p style="font-size: 1rem; color: #aaa; margin-top: 10px;">
                    Tryck högerpil (→) för att fortsätta
                </p>
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

        document.getElementById('questionText').textContent = this.currentQuestion.data.question;
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
        document.getElementById('questionText').textContent = this.currentQuestion.data.question;
        document.getElementById('buzzerStatus').textContent = '';

        // Dölj allt som inte behövs
        document.getElementById('questionAnswer').classList.add('hidden');

        // Sätt alla spelare till neutrala när ny fråga visas
        this.setPlayerFaces(null);

        // Aktivera buzzer och starta 10-sekunders timer
        this.activateBuzzer();
        this.startQuestionTimer();
    }

    startQuestionTimer() {
        this.clearTimers();
        this.timeRemaining = 10;
        // Ingen synlig timer under frågan, bara intern nedräkning
        document.getElementById('timerDisplay').classList.add('hidden');

        this.timerInterval = setInterval(() => {
            this.timeRemaining--;

            if (this.timeRemaining <= 0) {
                this.clearTimers();
                // Automatiskt stäng frågan efter 10 sekunder
                if (!this.answerShown) {
                    // Ingen lyckas svara - alla blir neutrala
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

            // Stoppa frågetimer och starta svartimer
            this.clearTimers();
            this.startAnswerTimer();

            const player = this.players[playerIndex];
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
        } else if (this.buzzerWinner !== null) {
            // Vanlig fråga
            const value = this.currentQuestion.data.value;
            this.players[this.buzzerWinner].score += value;
            this.currentOwner = this.buzzerWinner; // Ny ägare!
            winnerIndex = this.buzzerWinner;
        }

        this.updatePlayerScores();
        this.updateOwnerDisplay();

        // Visa vinnaren glad, resten ledsna
        if (winnerIndex !== null) {
            this.setPlayerFaces(winnerIndex);
        }

        this.markQuestionAsAnswered();
        this.closeQuestionModal();
    }

    answerWrong() {
        this.clearTimers();

        if (this.currentQuestion.isDailyDouble && this.currentOwner !== null) {
            // Daily Double - förlora insatsen
            const wager = this.currentQuestion.wager || this.currentQuestion.data.value;
            this.players[this.currentOwner].score -= wager;
            this.updatePlayerScores();

            // Alla blir neutrala när Daily Double misslyckas
            this.setPlayerFaces(null);

            this.markQuestionAsAnswered();
            this.closeQuestionModal();
        } else if (this.buzzerWinner !== null) {
            // Vanlig fråga
            const value = this.currentQuestion.data.value;
            this.players[this.buzzerWinner].score -= value;
            this.updatePlayerScores();

            const playerElement = document.getElementById(`player${this.buzzerWinner + 1}`);
            playerElement.classList.remove('buzzed', 'active');

            if (this.buzzerAttempts.length < 4) {
                this.buzzerWinner = null;
                this.buzzerActive = true;
                document.getElementById('buzzerStatus').textContent = '';

                // Starta ny timer
                this.startQuestionTimer();
            } else {
                // Alla har försökt och ingen lyckas - alla blir neutrala
                this.setPlayerFaces(null);

                this.markQuestionAsAnswered();
                this.closeQuestionModal();
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

        document.getElementById('questionModal').classList.add('hidden');
        this.buzzerActive = false;
        this.buzzerWinner = null;
        this.currentQuestion = null;
        this.answerShown = false;

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
                // Gå till Final Jeopardy
                setTimeout(() => {
                    this.startFinalJeopardy();
                }, 1000);
            }
        }
    }

    showRoundTransition() {
        const nextRound = this.currentRound + 1;
        const roundNames = ['', 'Jeopardy', 'Double Jeopardy', 'Triple Jeopardy'];

        const modal = document.getElementById('transitionModal');
        document.getElementById('transitionText').textContent =
            `Nästa omgång: ${roundNames[nextRound]}!`;
        modal.classList.remove('hidden');

        setTimeout(() => {
            modal.classList.add('hidden');
            this.startNextRound();
        }, 2000);
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

        this.renderBoard();

        // Starta beloppsanimation för nya omgången
        setTimeout(() => {
            this.revealValuesInWave();
        }, 500);
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

        document.getElementById('finalCategory').textContent = gameData.final.category;
        document.getElementById('finalQuestionText').textContent = gameData.final.question;
        document.getElementById('finalAnswerText').textContent = gameData.final.answer;

        document.getElementById('finalModal').classList.remove('hidden');
        document.getElementById('finalWagerSection').classList.remove('hidden');
        document.getElementById('finalCategorySection').classList.add('hidden');
        document.getElementById('finalQuestionSection').classList.add('hidden');
        document.getElementById('finalAnswerSection').classList.add('hidden');
        document.getElementById('finalRevealSection').classList.add('hidden');

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

        document.getElementById('finalCurrentPlayer').textContent = player.name;
        document.getElementById('finalPlayerScore').textContent = `Poäng: ${player.score} kr`;
        document.getElementById('finalWagerInput').value = 0;
        document.getElementById('finalWagerInput').max = maxWager;
        document.getElementById('finalMaxWager').textContent = `Max: ${maxWager} kr`;
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
    }

    showFinalAnswer() {
        document.getElementById('finalAnswerSection').classList.remove('hidden');
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

        document.getElementById('revealPlayerName').textContent = player.name;
        document.getElementById('revealWager').textContent = `Satsning: ${wager} kr`;

        document.getElementById('revealCorrectBtn').classList.remove('hidden');
        document.getElementById('revealWrongBtn').classList.remove('hidden');
    }

    finalAnswerCorrect() {
        const wager = this.finalWagers[this.finalCurrentPlayer];
        this.players[this.finalCurrentPlayer].score += wager;
        this.updatePlayerScores();

        document.getElementById('revealCorrectBtn').classList.add('hidden');
        document.getElementById('revealWrongBtn').classList.add('hidden');

        this.finalCurrentPlayer++;

        setTimeout(() => {
            this.showNextPlayerReveal();
        }, 1000);
    }

    finalAnswerWrong() {
        const wager = this.finalWagers[this.finalCurrentPlayer];
        this.players[this.finalCurrentPlayer].score -= wager;
        this.updatePlayerScores();

        document.getElementById('revealCorrectBtn').classList.add('hidden');
        document.getElementById('revealWrongBtn').classList.add('hidden');

        this.finalCurrentPlayer++;

        setTimeout(() => {
            this.showNextPlayerReveal();
        }, 1000);
    }

    finishGame() {
        document.getElementById('finalModal').classList.add('hidden');
        this.showWinner();
    }

    showWinner() {
        const sortedPlayers = [...this.players].sort((a, b) => b.score - a.score);
        const winner = sortedPlayers[0];

        let winnerText = `<h3>${winner.name} vinner med ${winner.score} kr!</h3><br>`;
        winnerText += '<h4>Slutresultat:</h4>';
        sortedPlayers.forEach((player, index) => {
            winnerText += `<p style="font-size: 1.3rem; margin: 10px 0;">
                ${index + 1}. ${player.name}: ${player.score} kr
            </p>`;
        });

        document.getElementById('winnerText').innerHTML = winnerText;
        document.getElementById('winnerModal').classList.remove('hidden');
    }

    newGame() {
        location.reload();
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

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            const modal = document.getElementById('questionModal');
            const finalModal = document.getElementById('finalModal');
            const finalRevealSection = document.getElementById('finalRevealSection');
            const finalWagerSection = document.getElementById('finalWagerSection');

            // Högerpil för kategoriavslöjning (när ingen modal är öppen och belopp är avslöjade)
            if (e.key === 'ArrowRight' &&
                this.valuesRevealed &&
                !this.categoriesRevealed &&
                modal.classList.contains('hidden') &&
                finalModal.classList.contains('hidden')) {
                e.preventDefault();
                this.revealNextCategory();
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

            // Final Jeopardy Reveal - högsta prioritet
            if (!finalRevealSection.classList.contains('hidden') &&
                !finalModal.classList.contains('hidden')) {
                const revealCorrectBtn = document.getElementById('revealCorrectBtn');
                const revealWrongBtn = document.getElementById('revealWrongBtn');

                if (!revealCorrectBtn.classList.contains('hidden') &&
                    !revealWrongBtn.classList.contains('hidden')) {
                    if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        this.finalAnswerCorrect();
                        return;
                    } else if (e.key === 'ArrowDown') {
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
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    this.confirmWager();
                    return;
                }
            }

            // Daily Double wager-input
            const dailyDoubleWagerInput = document.getElementById('dailyDoubleWager');
            if (dailyDoubleWagerInput && !modal.classList.contains('hidden')) {
                if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    const wager = parseInt(dailyDoubleWagerInput.value) || 0;
                    this.showDailyDoubleQuestion(wager);
                    return;
                }
            }

            // Vanlig frågemodal eller Daily Double-fråga
            if (!modal.classList.contains('hidden')) {
                // Högerpil - rätt svar (om någon har buzzat ELLER om det är Daily Double)
                if (e.key === 'ArrowRight' && (this.buzzerWinner !== null || this.currentQuestion.isDailyDouble)) {
                    e.preventDefault();
                    this.answerCorrect();
                    return;
                }

                // Vänsterpil - fel svar (om någon har buzzat ELLER om det är Daily Double)
                if (e.key === 'ArrowLeft' && (this.buzzerWinner !== null || this.currentQuestion.isDailyDouble)) {
                    e.preventDefault();
                    this.answerWrong();
                    return;
                }
            }
        });

        // Final Jeopardy buttons
        const showFinalQuestionBtn = document.getElementById('showFinalQuestionBtn');
        const showFinalAnswerBtn = document.getElementById('showFinalAnswerBtn');
        const confirmWagerBtn = document.getElementById('confirmWagerBtn');
        const revealCorrectBtn = document.getElementById('revealCorrectBtn');
        const revealWrongBtn = document.getElementById('revealWrongBtn');

        if (showFinalQuestionBtn) showFinalQuestionBtn.onclick = () => this.showActualFinalQuestion();
        if (showFinalAnswerBtn) showFinalAnswerBtn.onclick = () => this.showFinalAnswer();
        if (confirmWagerBtn) confirmWagerBtn.onclick = () => this.confirmWager();
        if (revealCorrectBtn) revealCorrectBtn.onclick = () => this.finalAnswerCorrect();
        if (revealWrongBtn) revealWrongBtn.onclick = () => this.finalAnswerWrong();

        // Other buttons
        const newGameBtn = document.getElementById('newGameBtn');
        const debugClearBoardBtn = document.getElementById('debugClearBoardBtn');

        if (newGameBtn) newGameBtn.onclick = () => this.newGame();
        if (debugClearBoardBtn) debugClearBoardBtn.onclick = () => this.debugClearBoard();
    }
}

let game;
window.addEventListener('DOMContentLoaded', () => {
    game = new JeopardyGame();
});
