// Fjärrstyrningsbrygga för spelskärmen.
//
// Aktiveras ENDAST när spelet serveras av server.js (som sprutar in flaggan
// window.JEOPARDY_SERVER i index.html). Öppnas spelet som vanlig fil eller via
// annan webbserver gör den här filen ingenting alls.
//
// Bryggan gör två saker:
//  1. Rapporterar spelets tillstånd till servern (så telefonerna kan rita UI)
//  2. Tar emot kommandon från telefonerna och matar in dem i spelet — oftast
//     som vanliga tangenttryck, så att all befintlig spellogik återanvänds.

(() => {
    if (!window.JEOPARDY_SERVER) return;

    const post = (message) => fetch('/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
    }).catch(() => {});

    const pressKey = (key) => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    };

    const isHidden = (id) => {
        const el = document.getElementById(id);
        return !el || el.classList.contains('hidden');
    };

    // --- Tillståndsrapportering --------------------------------------------

    function finalPhase() {
        if (isHidden('finalModal')) return null;
        if (!isHidden('finalIntroSection')) return 'intro';
        if (!isHidden('finalCategoryRevealSection')) return 'categoryReveal';
        if (!isHidden('finalWagerSection')) return 'wager';
        if (!isHidden('finalCategorySection')) return 'ready';
        if (!isHidden('finalQuestionSection')) return 'question';
        if (!isHidden('finalCorrectionSection')) return 'correction';
        if (!isHidden('finalRevealSection')) return 'reveal';
        return null;
    }

    function collectState() {
        const g = window.game;
        if (!g) return null;

        const startScreen = document.getElementById('startScreen');
        const q = g.currentQuestion;

        return {
            gameStarted: !!startScreen && startScreen.style.display === 'none',
            round: g.currentRound,
            categories: g.getCurrentRoundData().categories,
            answered: g.answeredQuestions[`round${g.currentRound}`],
            scores: g.players.map(p => p.score),
            names: g.players.map(p => p.name),
            owner: g.currentOwner,
            valuesRevealed: g.valuesRevealed,
            categoriesRevealed: g.categoriesRevealed,
            revealedCategories: g.revealedCategories,
            ownerSelected: g.ownerSelected,
            question: q ? {
                col: q.col,
                row: q.row,
                value: q.data.value,
                category: q.category,
                isDailyDouble: q.isDailyDouble,
                wager: q.wager || null,
                maxWager: q.maxWager || null,
                kind: g.questionKind(q),
            } : null,
            awaitingRead: g.buzzAwaitingRead === true,
            ddAwaitingWager: !!document.getElementById('dailyDoubleWager'),
            buzzerActive: g.buzzerActive,
            buzzerWinner: g.buzzerWinner,
            buzzerAttempts: g.buzzerAttempts,
            finalPhase: finalPhase(),
            finalPlayer: g.finalCurrentPlayer,
            finalWagerMax: (g.finalCurrentPlayer < 4 && g.players[g.finalCurrentPlayer])
                ? g.players[g.finalCurrentPlayer].score : 0,
            revealButtonsVisible: !isHidden('revealCorrectBtn') && finalPhase() === 'reveal',
            standingsOpen: !isHidden('standingsModal'),
            winnerOpen: !isHidden('winnerModal'),
            prizeOpen: !isHidden('prizeModal'),
            statsOpen: !isHidden('statsModal'),
            statsTitle: (g.statsIndex !== null && g.statSlides[g.statsIndex])
                ? g.statSlides[g.statsIndex].title : '',
            statsLast: g.statsIndex !== null && g.statsIndex === g.statSlides.length - 1,
            prizeText: (g.prizeIndex !== null && typeof PRIZES !== 'undefined')
                ? `${PRIZES[g.prizeIndex].rank ? PRIZES[g.prizeIndex].rank + ': ' : ''}${PRIZES[g.prizeIndex].title}`
                : '',
            prizeLast: typeof PRIZES !== 'undefined' && g.prizeIndex === PRIZES.length - 1,
        };
    }

    let lastSent = '';
    setInterval(() => {
        const state = collectState();
        if (!state) return;
        const json = JSON.stringify(state);
        if (json !== lastSent) {
            lastSent = json;
            post({ kind: 'state', state });
        }
    }, 150);

    // --- Kommandon från telefonerna ----------------------------------------

    function handleCommand(cmd) {
        const g = window.game;
        if (!g) return;

        switch (cmd.type) {
            case 'start': {
                const btn = document.getElementById('startGameBtn');
                if (btn && document.getElementById('startScreen').style.display !== 'none') {
                    btn.click();
                }
                break;
            }
            case 'key':
                if (cmd.key === 'PageDown' || cmd.key === 'PageUp' ||
                    cmd.key === 'r' || cmd.key === 'j' || cmd.key === 'b') {
                    pressKey(cmd.key);
                }
                break;
            case 'select': {
                const cell = document.querySelector(
                    `.question-cell.clickable[data-col="${+cmd.col}"][data-row="${+cmd.row}"]`);
                if (cell) cell.click();
                break;
            }
            case 'buzz':
                if (Number.isInteger(cmd.player) && cmd.player >= 0 && cmd.player < 4) {
                    g.handleBuzzer(cmd.player);
                }
                break;
            case 'wager': {
                const amount = parseInt(cmd.amount, 10) || 0;
                const ddInput = document.getElementById('dailyDoubleWager');
                const finalInput = document.getElementById('finalWagerInput');
                if (ddInput) {
                    ddInput.value = amount;
                    pressKey('PageDown');
                } else if (finalInput && !isHidden('finalWagerSection')) {
                    finalInput.value = amount;
                    pressKey('PageDown');
                }
                break;
            }
            case 'scores':
                if (Array.isArray(cmd.values) && cmd.values.length === 4) {
                    g.players.forEach((p, i) => {
                        p.score = parseInt(cmd.values[i], 10) || 0;
                    });
                    g.updatePlayerScores();
                    g.updateOwnerDisplay();
                    lastSent = ''; // tvinga ut nytt tillstånd direkt
                }
                break;
            case 'newgame':
                location.reload();
                break;
        }
    }

    function connect() {
        const source = new EventSource('/events');
        source.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.kind === 'command') handleCommand(message);
            } catch { /* ignorera trasiga meddelanden */ }
        };
        // EventSource återansluter automatiskt vid avbrott
    }

    // --- QR-panel på startskärmen ------------------------------------------

    async function showJoinPanel() {
        try {
            const info = await (await fetch('/server-info')).json();
            if (!info.jeopardy) return;

            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'vendor/qrcode.min.js';
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });

            const qrSvg = (url) => {
                const qr = qrcode(0, 'M');
                qr.addData(url);
                qr.make();
                return qr.createSvgTag({ cellSize: 4, margin: 2 });
            };

            const panel = document.createElement('div');
            panel.className = 'join-panel';
            panel.innerHTML = `
                <div class="join-card">
                    <div class="join-qr">${qrSvg(info.hostUrl)}</div>
                    <div class="join-label">Programledare</div>
                    <div class="join-url">${info.hostUrl}</div>
                </div>
                <div class="join-card">
                    <div class="join-qr">${qrSvg(info.playUrl)}</div>
                    <div class="join-label">Spelare</div>
                    <div class="join-url">${info.playUrl}</div>
                </div>
            `;
            document.querySelector('.start-content').appendChild(panel);

            // Har datorn flera nätverksadresser kan QR-koden peka på fel —
            // visa då alternativen så man kan skriva in adressen för hand.
            const extra = (info.addresses || []).slice(1);
            if (extra.length) {
                const alt = document.createElement('div');
                alt.className = 'join-url';
                alt.style.marginTop = '14px';
                alt.textContent = 'Funkar inte QR-koden? Prova i stället: ' +
                    extra.map(ip => `http://${ip}:${info.port}/host`).join('  ·  ');
                document.querySelector('.start-content').appendChild(alt);
            }
        } catch { /* utan QR-panel funkar allt ändå */ }
    }

    window.addEventListener('DOMContentLoaded', () => {
        connect();
        showJoinPanel();
    });
})();
