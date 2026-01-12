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
            round2: []
        };
        this.currentQuestion = null;
        this.buzzerActive = false;
        this.buzzerWinner = null;
        this.buzzerAttempts = [];

        this.init();
    }

    init() {
        this.renderBoard();
        this.setupEventListeners();
        this.updatePlayerScores();
    }

    renderBoard() {
        const board = document.getElementById('gameBoard');
        board.innerHTML = '';

        const currentData = this.currentRound === 1 ? gameData.round1 : gameData.round2;
        const roundKey = this.currentRound === 1 ? 'round1' : 'round2';

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
                if (this.answeredQuestions[roundKey].includes(questionId)) {
                    questionDiv.classList.add('answered');
                    questionDiv.textContent = '';
                } else {
                    questionDiv.textContent = question.value;
                    questionDiv.onclick = () => this.selectQuestion(col, row);
                }

                board.appendChild(questionDiv);
            }
        }
    }

    selectQuestion(col, row) {
        const currentData = this.currentRound === 1 ? gameData.round1 : gameData.round2;
        const question = currentData.questions[col][row];
        const category = currentData.categories[col];

        this.currentQuestion = {
            col,
            row,
            data: question,
            category
        };

        // Visa frågemodal
        document.getElementById('questionValue').textContent = question.value + ' kr';
        document.getElementById('questionCategory').textContent = category;
        document.getElementById('questionText').textContent = question.question;
        document.getElementById('questionAnswer').textContent = question.answer;
        document.getElementById('buzzerStatus').textContent = 'Väntar på buzzer...';

        document.getElementById('questionAnswer').classList.add('hidden');
        document.getElementById('correctBtn').classList.add('hidden');
        document.getElementById('wrongBtn').classList.add('hidden');
        document.getElementById('questionModal').classList.remove('hidden');

        // Aktivera buzzer
        this.activateBuzzer();
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
        const roundKey = this.currentRound === 1 ? 'round1' : 'round2';
        const questionId = `${this.currentQuestion.col}-${this.currentQuestion.row}`;
        this.answeredQuestions[roundKey].push(questionId);
    }

    closeQuestionModal() {
        document.getElementById('questionModal').classList.add('hidden');
        this.buzzerActive = false;
        this.buzzerWinner = null;
        this.currentQuestion = null;

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
        const roundKey = this.currentRound === 1 ? 'round1' : 'round2';
        const totalQuestions = 30; // 6 kategorier * 5 frågor

        if (this.answeredQuestions[roundKey].length === totalQuestions) {
            if (this.currentRound === 1) {
                // Gå till omgång 2
                setTimeout(() => {
                    if (confirm('Omgång 1 är klar! Fortsätta till Double Jeopardy?')) {
                        this.startRound2();
                    }
                }, 500);
            } else {
                // Gå till Final Jeopardy
                setTimeout(() => {
                    if (confirm('Double Jeopardy är klar! Fortsätta till Final Jeopardy?')) {
                        this.startFinalJeopardy();
                    }
                }, 500);
            }
        }
    }

    startRound2() {
        this.currentRound = 2;
        document.getElementById('roundIndicator').textContent = 'Omgång 2: Double Jeopardy';
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
        const wagers = [];
        const results = [];

        for (let i = 0; i < 4; i++) {
            const wager = parseInt(document.getElementById(`wager${i + 1}`).value) || 0;
            const correct = document.getElementById(`finalCorrect${i + 1}`).checked;

            wagers.push(wager);
            results.push(correct);

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

    updatePlayerScores() {
        this.players.forEach((player, index) => {
            const scoreElement = document.getElementById(`player${index + 1}`)
                .querySelector('.player-score');
            scoreElement.textContent = player.score + ' kr';
        });
    }

    setupEventListeners() {
        // Buzzer-tangenter
        document.addEventListener('keydown', (e) => {
            if (this.buzzerActive) {
                const playerIndex = this.players.findIndex(p => p.buzzerKey === e.key);
                if (playerIndex !== -1) {
                    this.handleBuzzer(playerIndex);
                }
            }
        });

        // Frågemodal-knappar
        document.getElementById('showAnswerBtn').onclick = () => {
            document.getElementById('questionAnswer').classList.remove('hidden');
        };

        document.getElementById('correctBtn').onclick = () => {
            this.answerCorrect();
        };

        document.getElementById('wrongBtn').onclick = () => {
            this.answerWrong();
        };

        document.getElementById('closeBtn').onclick = () => {
            this.closeQuestionModal();
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
    }
}

// Starta spelet när sidan laddas
let game;
window.addEventListener('DOMContentLoaded', () => {
    game = new JeopardyGame();
});
