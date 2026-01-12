// Frågor för Jeopardy-spelet
// Tre omgångar: Jeopardy (omgång 1), Double Jeopardy (omgång 2) och Triple Jeopardy (omgång 3)
// Värden: Omgång 1: 100, 200, 300, 400, 500
// Värden: Omgång 2: 200, 400, 600, 800, 1000
// Värden: Omgång 3: 300, 600, 900, 1200, 1500
// Daily Doubles: Omgång 1 (1 st), Omgång 2 (2 st), Omgång 3 (3 st)

const gameData = {
    round1: {
        categories: [
            "Kategori 1",
            "Kategori 2",
            "Kategori 3",
            "Kategori 4",
            "Kategori 5",
            "Kategori 6"
        ],
        questions: [
            // Kategori 1
            [
                { value: 100, question: "Platshållare fråga 1", answer: "Vad är svaret?" },
                { value: 200, question: "Platshållare fråga 2", answer: "Vad är svaret?" },
                { value: 300, question: "Platshållare fråga 3", answer: "Vad är svaret?" },
                { value: 400, question: "Platshållare fråga 4", answer: "Vad är svaret?" },
                { value: 500, question: "Platshållare fråga 5", answer: "Vad är svaret?" }
            ],
            // Kategori 2
            [
                { value: 100, question: "Platshållare fråga 1", answer: "Vad är svaret?" },
                { value: 200, question: "Platshållare fråga 2", answer: "Vad är svaret?" },
                { value: 300, question: "Platshållare fråga 3", answer: "Vad är svaret?" },
                { value: 400, question: "Platshållare fråga 4", answer: "Vad är svaret?" },
                { value: 500, question: "Platshållare fråga 5", answer: "Vad är svaret?" }
            ],
            // Kategori 3
            [
                { value: 100, question: "Platshållare fråga 1", answer: "Vad är svaret?" },
                { value: 200, question: "Platshållare fråga 2", answer: "Vad är svaret?" },
                { value: 300, question: "Platshållare fråga 3", answer: "Vad är svaret?" },
                { value: 400, question: "Platshållare fråga 4", answer: "Vad är svaret?" },
                { value: 500, question: "Platshållare fråga 5", answer: "Vad är svaret?" }
            ],
            // Kategori 4
            [
                { value: 100, question: "Platshållare fråga 1", answer: "Vad är svaret?" },
                { value: 200, question: "Platshållare fråga 2", answer: "Vad är svaret?" },
                { value: 300, question: "Platshållare fråga 3", answer: "Vad är svaret?" },
                { value: 400, question: "Platshållare fråga 4", answer: "Vad är svaret?" },
                { value: 500, question: "Platshållare fråga 5", answer: "Vad är svaret?" }
            ],
            // Kategori 5
            [
                { value: 100, question: "Platshållare fråga 1", answer: "Vad är svaret?" },
                { value: 200, question: "Platshållare fråga 2", answer: "Vad är svaret?" },
                { value: 300, question: "Platshållare fråga 3", answer: "Vad är svaret?" },
                { value: 400, question: "Platshållare fråga 4", answer: "Vad är svaret?" },
                { value: 500, question: "Platshållare fråga 5", answer: "Vad är svaret?" }
            ],
            // Kategori 6
            [
                { value: 100, question: "Platshållare fråga 1", answer: "Vad är svaret?" },
                { value: 200, question: "Platshållare fråga 2", answer: "Vad är svaret?" },
                { value: 300, question: "Platshållare fråga 3", answer: "Vad är svaret?" },
                { value: 400, question: "Platshållare fråga 4", answer: "Vad är svaret?" },
                { value: 500, question: "Platshållare fråga 5", answer: "Vad är svaret?" }
            ]
        ],
        // Daily Double placeras slumpmässigt, här anges vilket index (col-row format)
        dailyDoubles: ["2-3"] // 1 Daily Double i omgång 1
    },
    round2: {
        categories: [
            "Double Kategori 1",
            "Double Kategori 2",
            "Double Kategori 3",
            "Double Kategori 4",
            "Double Kategori 5",
            "Double Kategori 6"
        ],
        questions: [
            // Kategori 1
            [
                { value: 200, question: "Platshållare fråga 1", answer: "Vad är svaret?" },
                { value: 400, question: "Platshållare fråga 2", answer: "Vad är svaret?" },
                { value: 600, question: "Platshållare fråga 3", answer: "Vad är svaret?" },
                { value: 800, question: "Platshållare fråga 4", answer: "Vad är svaret?" },
                { value: 1000, question: "Platshållare fråga 5", answer: "Vad är svaret?" }
            ],
            // Kategori 2
            [
                { value: 200, question: "Platshållare fråga 1", answer: "Vad är svaret?" },
                { value: 400, question: "Platshållare fråga 2", answer: "Vad är svaret?" },
                { value: 600, question: "Platshållare fråga 3", answer: "Vad är svaret?" },
                { value: 800, question: "Platshållare fråga 4", answer: "Vad är svaret?" },
                { value: 1000, question: "Platshållare fråga 5", answer: "Vad är svaret?" }
            ],
            // Kategori 3
            [
                { value: 200, question: "Platshållare fråga 1", answer: "Vad är svaret?" },
                { value: 400, question: "Platshållare fråga 2", answer: "Vad är svaret?" },
                { value: 600, question: "Platshållare fråga 3", answer: "Vad är svaret?" },
                { value: 800, question: "Platshållare fråga 4", answer: "Vad är svaret?" },
                { value: 1000, question: "Platshållare fråga 5", answer: "Vad är svaret?" }
            ],
            // Kategori 4
            [
                { value: 200, question: "Platshållare fråga 1", answer: "Vad är svaret?" },
                { value: 400, question: "Platshållare fråga 2", answer: "Vad är svaret?" },
                { value: 600, question: "Platshållare fråga 3", answer: "Vad är svaret?" },
                { value: 800, question: "Platshållare fråga 4", answer: "Vad är svaret?" },
                { value: 1000, question: "Platshållare fråga 5", answer: "Vad är svaret?" }
            ],
            // Kategori 5
            [
                { value: 200, question: "Platshållare fråga 1", answer: "Vad är svaret?" },
                { value: 400, question: "Platshållare fråga 2", answer: "Vad är svaret?" },
                { value: 600, question: "Platshållare fråga 3", answer: "Vad är svaret?" },
                { value: 800, question: "Platshållare fråga 4", answer: "Vad är svaret?" },
                { value: 1000, question: "Platshållare fråga 5", answer: "Vad är svaret?" }
            ],
            // Kategori 6
            [
                { value: 200, question: "Platshållare fråga 1", answer: "Vad är svaret?" },
                { value: 400, question: "Platshållare fråga 2", answer: "Vad är svaret?" },
                { value: 600, question: "Platshållare fråga 3", answer: "Vad är svaret?" },
                { value: 800, question: "Platshållare fråga 4", answer: "Vad är svaret?" },
                { value: 1000, question: "Platshållare fråga 5", answer: "Vad är svaret?" }
            ]
        ],
        dailyDoubles: ["1-2", "4-4"] // 2 Daily Doubles i omgång 2
    },
    round3: {
        categories: [
            "Triple Kategori 1",
            "Triple Kategori 2",
            "Triple Kategori 3",
            "Triple Kategori 4",
            "Triple Kategori 5",
            "Triple Kategori 6"
        ],
        questions: [
            // Kategori 1
            [
                { value: 300, question: "Platshållare fråga 1", answer: "Vad är svaret?" },
                { value: 600, question: "Platshållare fråga 2", answer: "Vad är svaret?" },
                { value: 900, question: "Platshållare fråga 3", answer: "Vad är svaret?" },
                { value: 1200, question: "Platshållare fråga 4", answer: "Vad är svaret?" },
                { value: 1500, question: "Platshållare fråga 5", answer: "Vad är svaret?" }
            ],
            // Kategori 2
            [
                { value: 300, question: "Platshållare fråga 1", answer: "Vad är svaret?" },
                { value: 600, question: "Platshållare fråga 2", answer: "Vad är svaret?" },
                { value: 900, question: "Platshållare fråga 3", answer: "Vad är svaret?" },
                { value: 1200, question: "Platshållare fråga 4", answer: "Vad är svaret?" },
                { value: 1500, question: "Platshållare fråga 5", answer: "Vad är svaret?" }
            ],
            // Kategori 3
            [
                { value: 300, question: "Platshållare fråga 1", answer: "Vad är svaret?" },
                { value: 600, question: "Platshållare fråga 2", answer: "Vad är svaret?" },
                { value: 900, question: "Platshållare fråga 3", answer: "Vad är svaret?" },
                { value: 1200, question: "Platshållare fråga 4", answer: "Vad är svaret?" },
                { value: 1500, question: "Platshållare fråga 5", answer: "Vad är svaret?" }
            ],
            // Kategori 4
            [
                { value: 300, question: "Platshållare fråga 1", answer: "Vad är svaret?" },
                { value: 600, question: "Platshållare fråga 2", answer: "Vad är svaret?" },
                { value: 900, question: "Platshållare fråga 3", answer: "Vad är svaret?" },
                { value: 1200, question: "Platshållare fråga 4", answer: "Vad är svaret?" },
                { value: 1500, question: "Platshållare fråga 5", answer: "Vad är svaret?" }
            ],
            // Kategori 5
            [
                { value: 300, question: "Platshållare fråga 1", answer: "Vad är svaret?" },
                { value: 600, question: "Platshållare fråga 2", answer: "Vad är svaret?" },
                { value: 900, question: "Platshållare fråga 3", answer: "Vad är svaret?" },
                { value: 1200, question: "Platshållare fråga 4", answer: "Vad är svaret?" },
                { value: 1500, question: "Platshållare fråga 5", answer: "Vad är svaret?" }
            ],
            // Kategori 6
            [
                { value: 300, question: "Platshållare fråga 1", answer: "Vad är svaret?" },
                { value: 600, question: "Platshållare fråga 2", answer: "Vad är svaret?" },
                { value: 900, question: "Platshållare fråga 3", answer: "Vad är svaret?" },
                { value: 1200, question: "Platshållare fråga 4", answer: "Vad är svaret?" },
                { value: 1500, question: "Platshållare fråga 5", answer: "Vad är svaret?" }
            ]
        ],
        dailyDoubles: ["0-1", "3-3", "5-4"] // 3 Daily Doubles i omgång 3
    },
    final: {
        category: "Final Kategori",
        question: "Detta är Final Jeopardy-frågan (platshållare)",
        answer: "Vad är det rätta svaret?"
    }
};
