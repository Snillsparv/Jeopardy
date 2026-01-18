// Jeopardy Game Logic
class JeopardyGame {
    constructor() {
        this.currentRound = 1;
        this.players = [
            { name: 'Spelare 1', score: 0, buzzerKey: '1' },
            { name: 'Spelare 2', score: 0, buzzerKey: '2' },
            { name: 'Spelare 3', score: 0, buzzerKey: '3' },
            { name: 'Spelare 4', score: 0, buzzerKey: '4' }
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

        this.init();
    }

    init() {
        // Slumpa vem som äger spelet vid start av första rundan
        this.currentOwner = Math.floor(Math.random() * 4);

        this.renderBoard();
        this.setupEventListeners();
        this.updatePlayerScores();
        this.playIntroMusic();
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
        currentData.categories.forEach(category => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'category';
            categoryDiv.textContent = category;
            board.appendChild(categoryDiv);
        });

        // Rendera frågor
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 6; col++) {
                const question = currentData.questions[col][row];
                const questionDiv = document.createElement('div');
                questionDiv.className = 'question-cell';

                const questionId = `${col}-${row}`;
                const isDailyDouble = currentData.dailyDoubles &&
                                     currentData.dailyDoubles.includes(questionId);

                if (this.answeredQuestions[roundKey].includes(questionId)) {
                    questionDiv.classList.add('answered');
                    questionDiv.textContent = '';
                } else {
                    questionDiv.textContent = question.value;
                    questionDiv.onclick = () => this.selectQuestion(col, row, isDailyDouble);
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

        if (isDailyDouble) {
            this.showDailyDouble();
        } else {
            this.showQuestion();
        }
    }

    showDailyDouble() {
        const modal = document.getElementById('questionModal');
        document.getElementById('questionValue').textContent = 'DAILY DOUBLE!';
        document.getElementById('questionValue').style.color = '#ff6b6b';
        document.getElementById('questionValue').style.fontSize = '4rem';
        document.getElementById('questionCategory').textContent = this.currentQuestion.category;

        const ownerName = this.currentOwner !== null ? this.players[this.currentOwner].name : 'Ingen';
        const ownerScore = this.currentOwner !== null ? this.players[this.currentOwner].score : 0;
        const maxValue = this.currentQuestion.data.value;
        const maxWager = Math.max(maxValue, ownerScore);

        document.getElementById('questionText').innerHTML = `
            <div style="text-align: center;">
                <p style="font-size: 1.5rem; margin-bottom: 20px;">
                    ${ownerName} äger spelet och får svara!
                </p>
                <p style="font-size: 1.2rem; margin-bottom: 20px;">
                    Nuvarande poäng: ${ownerScore} kr<br>
                    Max insats: ${maxWager} kr
                </p>
                <label style="font-size: 1.2rem; display: block; margin-bottom: 10px;">
                    Välj insats:
                </label>
                <input type="number" id="dailyDoubleWager"
                    min="0" max="${maxWager}" value="${Math.min(1000, maxWager)}"
                    step="100"
                    style="font-size: 1.5rem; padding: 10px; width: 200px; text-align: center;">
            </div>
        `;

        document.getElementById('questionAnswer').classList.add('hidden');
        document.getElementById('buzzerStatus').textContent = '';
        document.getElementById('timerDisplay').classList.add('hidden');

        document.getElementById('correctBtn').classList.add('hidden');
        document.getElementById('wrongBtn').classList.add('hidden');
        modal.classList.remove('hidden');

        document.getElementById('showAnswerBtn').textContent = 'Fortsätt';
        document.getElementById('showAnswerBtn').onclick = () => {
            const wager = parseInt(document.getElementById('dailyDoubleWager').value) || 0;
            this.showDailyDoubleQuestion(wager);
        };
    }

    showDailyDoubleQuestion(wager) {
        this.currentQuestion.wager = wager;

        document.getElementById('questionValue').style.color = '#ffd700';
        document.getElementById('questionValue').style.fontSize = '3rem';
        document.getElementById('questionValue').textContent = `DAILY DOUBLE: ${wager} kr`;

        document.getElementById('questionText').textContent = this.currentQuestion.data.question;
        document.getElementById('questionAnswer').textContent = this.currentQuestion.data.answer;
        document.getElementById('questionAnswer').classList.add('hidden');

        document.getElementById('correctBtn').classList.remove('hidden');
        document.getElementById('wrongBtn').classList.remove('hidden');
        document.getElementById('buzzerStatus').textContent =
            `${this.players[this.currentOwner].name} svarar...`;

        document.getElementById('showAnswerBtn').textContent = 'Visa svar';
        document.getElementById('showAnswerBtn').onclick = () => {
            this.showAnswer();
        };

        // Starta 7-sekunders timer för svar
        this.startAnswerTimer();
    }

    showQuestion() {
        document.getElementById('questionValue').style.color = '#ffd700';
        document.getElementById('questionValue').style.fontSize = '3rem';
        document.getElementById('questionValue').textContent = this.currentQuestion.data.value + ' kr';
        document.getElementById('questionCategory').textContent = this.currentQuestion.category;
        document.getElementById('questionText').textContent = this.currentQuestion.data.question;
        document.getElementById('questionAnswer').textContent = this.currentQuestion.data.answer;
        document.getElementById('buzzerStatus').textContent = 'Väntar på buzzer...';

        document.getElementById('questionAnswer').classList.add('hidden');
        document.getElementById('correctBtn').classList.add('hidden');
        document.getElementById('wrongBtn').classList.add('hidden');
        document.getElementById('questionModal').classList.remove('hidden');

        document.getElementById('showAnswerBtn').textContent = 'Visa svar';
        document.getElementById('showAnswerBtn').onclick = () => {
            this.showAnswer();
        };

        // Aktivera buzzer och starta 10-sekunders timer
        this.activateBuzzer();
        this.startQuestionTimer();
    }

    startQuestionTimer() {
        this.clearTimers();
        this.timeRemaining = 10;
        this.updateTimerDisplay();
        document.getElementById('timerDisplay').classList.remove('hidden');

        this.timerInterval = setInterval(() => {
            this.timeRemaining--;
            this.updateTimerDisplay();

            if (this.timeRemaining <= 0) {
                this.clearTimers();
                // Automatiskt visa svar efter 10 sekunder
                if (!this.answerShown) {
                    this.showAnswer();
                }
            }
        }, 1000);
    }

    startAnswerTimer() {
        this.clearTimers();
        this.timeRemaining = 7;
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
                }
            }
        }, 1000);
    }

    updateTimerDisplay() {
        const timerEl = document.getElementById('timerDisplay');
        timerEl.textContent = `⏱️ ${this.timeRemaining}s`;

        // Färgkodning
        if (this.timeRemaining <= 3) {
            timerEl.style.color = '#ff6b6b';
        } else if (this.timeRemaining <= 5) {
            timerEl.style.color = '#ffa500';
        } else {
            timerEl.style.color = '#90EE90';
        }
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
        document.getElementById('questionAnswer').classList.remove('hidden');
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

            document.getElementById('correctBtn').classList.remove('hidden');
            document.getElementById('wrongBtn').classList.remove('hidden');

            const playerElement = document.getElementById(`player${playerIndex + 1}`);
            playerElement.classList.add('buzzed', 'active');
        }
    }

    answerCorrect() {
        this.clearTimers();

        if (this.buzzerWinner === null && this.currentQuestion.isDailyDouble && this.currentOwner !== null) {
            // Daily Double
            const wager = this.currentQuestion.wager || this.currentQuestion.data.value;
            this.players[this.currentOwner].score += wager;
            this.currentOwner = this.currentOwner; // Behåller äganderätten
        } else if (this.buzzerWinner !== null) {
            // Vanlig fråga
            const value = this.currentQuestion.data.value;
            this.players[this.buzzerWinner].score += value;
            this.currentOwner = this.buzzerWinner; // Ny ägare!
        }

        this.updatePlayerScores();
        this.updateOwnerDisplay();
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
                document.getElementById('buzzerStatus').textContent = 'Väntar på nästa buzzer...';
                document.getElementById('correctBtn').classList.add('hidden');
                document.getElementById('wrongBtn').classList.add('hidden');

                // Starta ny timer
                this.startQuestionTimer();
            } else {
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
        this.renderBoard();
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

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            const modal = document.getElementById('questionModal');
            const finalModal = document.getElementById('finalModal');
            const finalRevealSection = document.getElementById('finalRevealSection');
            const finalWagerSection = document.getElementById('finalWagerSection');

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

            // Vanlig frågemodal
            if (!modal.classList.contains('hidden')) {
                // Högerpil för navigering
                if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    if (!this.answerShown) {
                        this.showAnswer();
                    } else {
                        this.closeQuestionModal();
                    }
                    return;
                }

                // Uppåt/nedåt pilar för rätt/fel
                const correctBtn = document.getElementById('correctBtn');
                const wrongBtn = document.getElementById('wrongBtn');

                // Kolla om knapparna är synliga (inte hidden)
                const correctVisible = !correctBtn.classList.contains('hidden');
                const wrongVisible = !wrongBtn.classList.contains('hidden');

                if (correctVisible && wrongVisible) {
                    if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        this.answerCorrect();
                        return;
                    } else if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        this.answerWrong();
                        return;
                    }
                }
            }
        });

        document.getElementById('closeBtn').onclick = () => this.closeQuestionModal();
        document.getElementById('correctBtn').onclick = () => this.answerCorrect();
        document.getElementById('wrongBtn').onclick = () => this.answerWrong();

        document.getElementById('showFinalQuestionBtn').onclick = () => this.showFinalQuestion();
        document.getElementById('showFinalAnswerBtn').onclick = () => this.showFinalAnswer();
        document.getElementById('confirmWagerBtn').onclick = () => this.confirmWager();
        document.getElementById('revealCorrectBtn').onclick = () => this.finalAnswerCorrect();
        document.getElementById('revealWrongBtn').onclick = () => this.finalAnswerWrong();

        document.getElementById('newGameBtn').onclick = () => this.newGame();
        document.getElementById('debugClearBoardBtn').onclick = () => this.debugClearBoard();
    }
}

let game;
window.addEventListener('DOMContentLoaded', () => {
    game = new JeopardyGame();
});
