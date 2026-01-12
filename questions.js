// Frågor för Jeopardy-spelet
// Två omgångar: Jeopardy (omgång 1) och Double Jeopardy (omgång 2)
// Värden: Omgång 1: 200, 400, 600, 800, 1000
// Värden: Omgång 2: 400, 800, 1200, 1600, 2000

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
        ]
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
                { value: 400, question: "Platshållare fråga 1", answer: "Vad är svaret?" },
                { value: 800, question: "Platshållare fråga 2", answer: "Vad är svaret?" },
                { value: 1200, question: "Platshållare fråga 3", answer: "Vad är svaret?" },
                { value: 1600, question: "Platshållare fråga 4", answer: "Vad är svaret?" },
                { value: 2000, question: "Platshållare fråga 5", answer: "Vad är svaret?" }
            ],
            // Kategori 2
            [
                { value: 400, question: "Platshållare fråga 1", answer: "Vad är svaret?" },
                { value: 800, question: "Platshållare fråga 2", answer: "Vad är svaret?" },
                { value: 1200, question: "Platshållare fråga 3", answer: "Vad är svaret?" },
                { value: 1600, question: "Platshållare fråga 4", answer: "Vad är svaret?" },
                { value: 2000, question: "Platshållare fråga 5", answer: "Vad är svaret?" }
            ],
            // Kategori 3
            [
                { value: 400, question: "Platshållare fråga 1", answer: "Vad är svaret?" },
                { value: 800, question: "Platshållare fråga 2", answer: "Vad är svaret?" },
                { value: 1200, question: "Platshållare fråga 3", answer: "Vad är svaret?" },
                { value: 1600, question: "Platshållare fråga 4", answer: "Vad är svaret?" },
                { value: 2000, question: "Platshållare fråga 5", answer: "Vad är svaret?" }
            ],
            // Kategori 4
            [
                { value: 400, question: "Platshållare fråga 1", answer: "Vad är svaret?" },
                { value: 800, question: "Platshållare fråga 2", answer: "Vad är svaret?" },
                { value: 1200, question: "Platshållare fråga 3", answer: "Vad är svaret?" },
                { value: 1600, question: "Platshållare fråga 4", answer: "Vad är svaret?" },
                { value: 2000, question: "Platshållare fråga 5", answer: "Vad är svaret?" }
            ],
            // Kategori 5
            [
                { value: 400, question: "Platshållare fråga 1", answer: "Vad är svaret?" },
                { value: 800, question: "Platshållare fråga 2", answer: "Vad är svaret?" },
                { value: 1200, question: "Platshållare fråga 3", answer: "Vad är svaret?" },
                { value: 1600, question: "Platshållare fråga 4", answer: "Vad är svaret?" },
                { value: 2000, question: "Platshållare fråga 5", answer: "Vad är svaret?" }
            ],
            // Kategori 6
            [
                { value: 400, question: "Platshållare fråga 1", answer: "Vad är svaret?" },
                { value: 800, question: "Platshållare fråga 2", answer: "Vad är svaret?" },
                { value: 1200, question: "Platshållare fråga 3", answer: "Vad är svaret?" },
                { value: 1600, question: "Platshållare fråga 4", answer: "Vad är svaret?" },
                { value: 2000, question: "Platshållare fråga 5", answer: "Vad är svaret?" }
            ]
        ]
    },
    final: {
        category: "Final Kategori",
        question: "Detta är Final Jeopardy-frågan (platshållare)",
        answer: "Vad är det rätta svaret?"
    }
};
