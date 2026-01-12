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
        this.answerShown = false; // För högerpil-navigering

        this.init();
    }

    init() {
        this.renderBoard();
        this.setupEventListeners();
        this.updatePlayerScores();
        this.playIntroMusic();
    }

    playIntroMusic() {
        // Försök spela intro-musik om filen finns
        const audio = new Audio('jeopardy-intro.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {
            // Om ljudfilen inte finns, fortsätt utan ljud
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

                // Kolla om det är en Daily Double
                const isDailyDouble = currentData.dailyDoubles &&
                                     currentData.dailyDoubles.includes(questionId);

                if (this.answeredQuestions[roundKey].includes(questionId)) {
                    questionDiv.classList.add('answered');
                    questionDiv.textContent = '';
                } else {
                    // Visa poäng som vanligt (Daily Double avslöjas när man klickar)
                    questionDiv.textContent = question.value;
                    questionDiv.onclick = () => this.selectQuestion(col, row, isDailyDouble);
                }

                board.appendChild(questionDiv);
            }
        }
    }

    getCurrentRoundData() {
        if (this.currentRound === 1) return gameData.round1;
        if (this.currentRound === 2) return gameData.round2;
        if (this.currentRound === 3) return gameData.round3;
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

        this.answerShown = false; // Återställ för högerpil-navigering

        // Om det är Daily Double, visa det först
        if (isDailyDouble) {
            this.showDailyDouble();
        } else {
            this.showQuestion();
        }
    }

    showDailyDouble() {
        document.getElementById('questionValue').textContent = 'DAILY DOUBLE!';
        document.getElementById('questionValue').style.color = '#ff6b6b';
        document.getElementById('questionValue').style.fontSize = '4rem';
        document.getElementById('questionCategory').textContent = this.currentQuestion.category;
        document.getElementById('questionText').textContent =
            'En spelare väljer insats och svarar ensam!';
        document.getElementById('questionAnswer').classList.add('hidden');
        document.getElementById('buzzerStatus').textContent = '';

        document.getElementById('correctBtn').classList.add('hidden');
        document.getElementById('wrongBtn').classList.add('hidden');
        document.getElementById('questionModal').classList.remove('hidden');

        // Ändra "Visa svar"-knappen till "Fortsätt"
        document.getElementById('showAnswerBtn').textContent = 'Fortsätt';
        document.getElementById('showAnswerBtn').onclick = () => {
            this.showQuestion();
        };
    }

    showQuestion() {
        // Återställ Daily Double-styling
        document.getElementById('questionValue').style.color = '#ffd700';
        document.getElementById('questionValue').style.fontSize = '3rem';

        document.getElementById('questionValue').textContent =
            this.currentQuestion.data.value + ' kr';
        document.getElementById('questionCategory').textContent =
            this.currentQuestion.category;
        document.getElementById('questionText').textContent =
            this.currentQuestion.data.question;
        document.getElementById('questionAnswer').textContent =
            this.currentQuestion.data.answer;
        document.getElementById('buzzerStatus').textContent = 'Väntar på buzzer...';

        document.getElementById('questionAnswer').classList.add('hidden');
        document.getElementById('correctBtn').classList.add('hidden');
        document.getElementById('wrongBtn').classList.add('hidden');
        document.getElementById('questionModal').classList.remove('hidden');

        // Återställ "Visa svar"-knappen
        document.getElementById('showAnswerBtn').textContent = 'Visa svar';
        document.getElementById('showAnswerBtn').onclick = () => {
            this.showAnswer();
        };

        // Aktivera buzzer (om inte Daily Double)
        if (!this.currentQuestion.isDailyDouble) {
            this.activateBuzzer();
        }
    }

    showAnswer() {
        document.getElementById('questionAnswer').classList.remove('hidden');
        this.answerShown = true;

        // Markera frågan som besvarad
        this.markQuestionAsAnswered();

        // Stäng automatiskt efter 5 sekunder
        this.autoCloseTimeout = setTimeout(() => {
            this.closeQuestionModal();
        }, 5000);
    }

    activateBuzzer() {
        this.buzzerActive = true;
        this.buzzerWinner = null;
        this.buzzerAttempts = [];

        // Rensa tidigare aktiva spelare
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

            const player = this.players[playerIndex];
            document.getElementById('buzzerStatus').textContent =
                `${player.name} buzzade in!`;

            // Visa rätt/fel knappar
            document.getElementById('correctBtn').classList.remove('hidden');
            document.getElementById('wrongBtn').classList.remove('hidden');

            // Markera spelaren
            const playerElement = document.getElementById(`player${playerIndex + 1}`);
            playerElement.classList.add('buzzed', 'active');
        }
    }

    answerCorrect() {
        if (this.buzzerWinner === null || !this.currentQuestion) return;

        const value = this.currentQuestion.data.value;
        this.players[this.buzzerWinner].score += value;
        this.updatePlayerScores();

        this.markQuestionAsAnswered();
        this.closeQuestionModal();
    }

    answerWrong() {
        if (this.buzzerWinner === null || !this.currentQuestion) return;

        const value = this.currentQuestion.data.value;
        this.players[this.buzzerWinner].score -= value;
        this.updatePlayerScores();

        // Rensa buzzad spelare
        const playerElement = document.getElementById(`player${this.buzzerWinner + 1}`);
        playerElement.classList.remove('buzzed', 'active');

        // Kolla om alla har försökt
        if (this.buzzerAttempts.length < 4) {
            // Låt andra spelare försöka
            this.buzzerWinner = null;
            this.buzzerActive = true;
            document.getElementById('buzzerStatus').textContent =
                'Väntar på nästa buzzer...';
            document.getElementById('correctBtn').classList.add('hidden');
            document.getElementById('wrongBtn').classList.add('hidden');
        } else {
            // Alla har försökt, stäng frågan
            this.markQuestionAsAnswered();
            this.closeQuestionModal();
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
        // Rensa auto-stäng timer om den finns
        if (this.autoCloseTimeout) {
            clearTimeout(this.autoCloseTimeout);
            this.autoCloseTimeout = null;
        }

        document.getElementById('questionModal').classList.add('hidden');
        this.buzzerActive = false;
        this.buzzerWinner = null;
        this.currentQuestion = null;
        this.answerShown = false;

        // Rensa alla spelarmarkeringar
        document.querySelectorAll('.player').forEach(p => {
            p.classList.remove('active', 'buzzed');
        });

        // Uppdatera brädet
        this.renderBoard();

        // Kolla om omgången är klar
        this.checkRoundComplete();
    }

    checkRoundComplete() {
        const roundKey = `round${this.currentRound}`;
        const totalQuestions = 30; // 6 kategorier * 5 frågor

        if (this.answeredQuestions[roundKey].length === totalQuestions) {
            if (this.currentRound < 3) {
                // Gå till nästa omgång
                setTimeout(() => {
                    const nextRound = this.currentRound + 1;
                    const roundName = nextRound === 2 ? 'Double Jeopardy' : 'Triple Jeopardy';
                    if (confirm(`Omgång ${this.currentRound} är klar! Fortsätta till ${roundName}?`)) {
                        this.startNextRound();
                    }
                }, 500);
            } else {
                // Gå till Final Jeopardy
                setTimeout(() => {
                    if (confirm('Triple Jeopardy är klar! Fortsätta till Final Jeopardy?')) {
                        this.startFinalJeopardy();
                    }
                }, 500);
            }
        }
    }

    startNextRound() {
        this.currentRound++;
        const roundNames = ['', 'Jeopardy', 'Double Jeopardy', 'Triple Jeopardy'];
        document.getElementById('roundIndicator').textContent =
            `Omgång ${this.currentRound}: ${roundNames[this.currentRound]}`;
        this.renderBoard();
    }

    startFinalJeopardy() {
        document.getElementById('finalCategory').textContent = gameData.final.category;
        document.getElementById('finalQuestionText').textContent = gameData.final.question;
        document.getElementById('finalAnswerText').textContent = gameData.final.answer;

        // Sätt max för insatser
        this.players.forEach((player, index) => {
            const wagerInput = document.getElementById(`wager${index + 1}`);
            wagerInput.max = Math.max(0, player.score);
            wagerInput.value = 0;
        });

        document.getElementById('finalModal').classList.remove('hidden');
    }

    showFinalQuestion() {
        document.getElementById('finalQuestionSection').classList.remove('hidden');
    }

    showFinalAnswer() {
        document.getElementById('finalAnswerSection').classList.remove('hidden');
    }

    finishGame() {
        // Hämta insatser och resultat
        for (let i = 0; i < 4; i++) {
            const wager = parseInt(document.getElementById(`wager${i + 1}`).value) || 0;
            const correct = document.getElementById(`finalCorrect${i + 1}`).checked;

            // Uppdatera poäng
            if (correct) {
                this.players[i].score += wager;
            } else {
                this.players[i].score -= wager;
            }
        }

        this.updatePlayerScores();

        // Stäng final modal
        document.getElementById('finalModal').classList.add('hidden');

        // Visa vinnare
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
        // Markera alla frågor som besvarade
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
        // Buzzer-tangenter och högerpil-navigering
        document.addEventListener('keydown', (e) => {
            // Buzzer-tangenter
            if (this.buzzerActive) {
                const playerIndex = this.players.findIndex(p => p.buzzerKey === e.key);
                if (playerIndex !== -1) {
                    this.handleBuzzer(playerIndex);
                }
            }

            // Högerpil för navigering i frågemodal
            if (e.key === 'ArrowRight') {
                const modal = document.getElementById('questionModal');
                if (!modal.classList.contains('hidden')) {
                    e.preventDefault();

                    if (!this.answerShown) {
                        // Visa svar
                        this.showAnswer();
                    } else {
                        // Stäng modalen
                        this.closeQuestionModal();
                    }
                }
            }
        });

        // Stäng-knapp
        document.getElementById('closeBtn').onclick = () => {
            this.closeQuestionModal();
        };

        // Rätt/Fel-knappar
        document.getElementById('correctBtn').onclick = () => {
            this.answerCorrect();
        };

        document.getElementById('wrongBtn').onclick = () => {
            this.answerWrong();
        };

        // Final Jeopardy-knappar
        document.getElementById('showFinalQuestionBtn').onclick = () => {
            this.showFinalQuestion();
        };

        document.getElementById('showFinalAnswerBtn').onclick = () => {
            this.showFinalAnswer();
        };

        document.getElementById('finishGameBtn').onclick = () => {
            this.finishGame();
        };

        // Nytt spel
        document.getElementById('newGameBtn').onclick = () => {
            this.newGame();
        };

        // Debug: Töm brädet
        document.getElementById('debugClearBoardBtn').onclick = () => {
            this.debugClearBoard();
        };
    }
}

// Starta spelet när sidan laddas
let game;
window.addEventListener('DOMContentLoaded', () => {
    game = new JeopardyGame();
});
