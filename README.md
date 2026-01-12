# Jeopardy-spel

Ett klassiskt Jeopardy-spel byggt i HTML, CSS och JavaScript för fyra spelare med buzzer-kontroller.

## Funktioner

- ✅ Två spelomgångar (Jeopardy och Double Jeopardy)
- ✅ Final Jeopardy med insatser
- ✅ Fyra spelare
- ✅ Buzzer-system med tangentbordskontroller
- ✅ Poänghantering (rätt/fel svar)
- ✅ Klassisk Jeopardy-design med blå spelplan

## Hur man startar spelet

1. Öppna `index.html` i en webbläsare
2. Spelet startar automatiskt med omgång 1

## Spelregler

### Omgång 1: Jeopardy
- 6 kategorier med 5 frågor vardera
- Poängvärden: 200, 400, 600, 800, 1000 kr

### Omgång 2: Double Jeopardy
- 6 nya kategorier med 5 frågor vardera
- Poängvärden: 400, 800, 1200, 1600, 2000 kr

### Final Jeopardy
- En kategori med en fråga
- Spelarna placerar insatser baserat på sina poäng
- Rätt svar ger poängen, fel svar drar av poängen

## Buzzer-kontroller

Varje spelare har en tangent för att buzza in:

- **Spelare 1**: Tangent `1`
- **Spelare 2**: Tangent `2`
- **Spelare 3**: Tangent `3`
- **Spelare 4**: Tangent `4`

Om du använder fysiska USB-buzzerkontroller, konfigurera dem att skicka motsvarande tangentbordstryckningar.

## Hur spelet fungerar

1. **Välja fråga**: Klicka på ett poängvärde på spelplanen
2. **Buzza in**: När frågan visas, tryck på din tangent för att buzza in
3. **Svara**: Den första spelaren som buzzar får svara
4. **Bedömning**:
   - Klicka på "Visa svar" för att se rätt svar
   - Klicka på "Rätt" om spelaren svarade korrekt (poäng läggs till)
   - Klicka på "Fel" om spelaren svarade fel (poäng dras av)
   - Om fel: andra spelare kan försöka buzza in
5. **Nästa fråga**: Klicka "Stäng" eller välj nästa fråga

## Redigera frågor

Öppna filen `questions.js` för att redigera frågor, kategorier och svar.

Strukturen är:

```javascript
const gameData = {
    round1: {
        categories: ["Kategori 1", "Kategori 2", ...],
        questions: [
            // Kategori 1
            [
                { value: 200, question: "Frågan här", answer: "Svaret här" },
                { value: 400, question: "Frågan här", answer: "Svaret här" },
                ...
            ],
            // Kategori 2
            [...],
            ...
        ]
    },
    round2: { ... },
    final: {
        category: "Final Kategori",
        question: "Final frågan",
        answer: "Svaret"
    }
};
```

## Teknisk information

### Filer

- `index.html` - Huvudstrukturen
- `styles.css` - All styling
- `game.js` - Spellogik och buzzer-system
- `questions.js` - Frågor och svar

### Spellogik

Spelet hanterar automatiskt:
- Vem som buzzar först
- Poänguppdateringar
- Förhindra flera buzz från samma spelare
- Övergång mellan omgångar
- Final Jeopardy-insatser och poängberäkning
- Slutresultat och vinnare

## Tips

- Testa buzzer-tangenterna innan spelet startar
- Ha en spelledare som bedömer svar och klickar på Rätt/Fel
- För bästa upplevelse, använd spelet på en stor skärm eller projektor
- Du kan pausa spelet genom att stänga frågemodalen och fortsätta senare

## Anpassningar

### Ändra buzzer-tangenter

I `game.js`, ändra `buzzerKey` för varje spelare:

```javascript
this.players = [
    { name: 'Spelare 1', score: 0, buzzerKey: '1' },
    { name: 'Spelare 2', score: 0, buzzerKey: '2' },
    ...
];
```

### Ändra spelarnamn

Redigera spelarnamnen direkt i `game.js` eller lägg till en namnformulär vid spelstart.

### Ändra färger/design

Alla färger och design finns i `styles.css`. Den klassiska Jeopardy-blå färgen är `#060CE9`.

Lycka till med ditt Jeopardy-spel! 🎉
