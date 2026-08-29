# Jeopardy-spel

Ett klassiskt Jeopardy-spel byggt i HTML, CSS och JavaScript för fyra spelare (David, Ludde, Lina, Hanna) med buzzer-kontroller och Jonas som programledare.

## Funktioner

- ✅ Tre spelomgångar (Jeopardy, Double Jeopardy och Triple Jeopardy)
- ✅ Daily Doubles (dubbelchanser): 1 i omgång 1, 2 i omgång 2, 3 i omgång 3
- ✅ Final Jeopardy med insatser per spelare
- ✅ Bild- och ljudfrågor
- ✅ Buzzer-system via tangentbordet (fungerar med USB-buzzers som skickar tangenttryck)
- ✅ Spelägare ("Mumin King") som väljer nästa fråga, slumpas fram varje omgång
- ✅ Ljudjinglar, övergångsvideor och vinnarvideo
- ✅ Klassisk Jeopardy-design med blå spelplan

## Hur man startar spelet

1. Starta en lokal webbserver i mappen, t.ex. `python3 -m http.server 8000`
2. Öppna `http://localhost:8000` i en webbläsare (helst i helskärm på stor skärm/projektor)
3. Klicka på **Starta spelet** — jingeln spelas och spelplanen byggs upp

Att öppna `index.html` direkt som fil fungerar oftast också, men en lokal server ger pålitligast ljud/video.

## Spelflöde och kontroller

Programledaren styr spelet med tangentbordet (en presentationsklicker som skickar
PageDown/PageUp fungerar utmärkt):

| Tangent | Gör |
|---|---|
| **PageDown** | Nästa steg: avslöja kategori, slumpa spelägare, markera **rätt svar**, bekräfta insats, nästa steg i finalen |
| **PageUp** | Markera **fel svar** (frågor och finalrättning) |
| **1–4** | Buzzer för spelare 1–4 (David, Ludde, Lina, Hanna) |
| **R** | Öppna/stäng poängjustering |
| **B** | (Debug) Rensa hela spelplanen och gå till nästa omgång |
| **J** | (Debug) Hoppa direkt till vinnarskärmen |

En omgång: beloppen snurrar fram → PageDown avslöjar kategorierna en i taget →
PageDown slumpar spelägare → ägaren väljer fråga (klick) → spelarna buzzar med 1–4 →
PageDown/PageUp rättar. Vid Daily Double svarar spelägaren ensam efter att ha valt insats.
Frågor stängs automatiskt efter 10 sekunder om ingen buzzar.

## Redigera frågor

Frågorna ligger i `gamedata.js`, som **genereras** från ett Excel-ark — redigera helst
arket och kör om konverteringen:

- Nuvarande omgång: `frågor_jeopardy_ny_omgång.xlsx` → `python3 convert_ny_omgang_to_gamedata.py`
  (arkformat: svar i kolumn A, ledtråd i kolumn B; kategorirubrik = rad med tom kolumn A;
  ledtråden `bild`/`ljud` ger en mediafråga vars fil namnges efter svaret)
- Föregående omgångs format: `frågor_jeopardy_2026.xlsx` → `convert_excel_to_gamedata.py`

Bildfrågor ligger i `images/questions/`, ljudfrågor i `sounds/questions/`.
Fullständiga frågelistor med facit finns i `frågor_jeopardy_ny_omgång.md` (nuvarande)
och `frågor_jeopardy_2026.md` (spelad).

`gamedata.js` har denna struktur om du vill handredigera:

```javascript
const gameData = {
    round1: {
        categories: ["Kategori 1", ...],          // 6 kategorier
        questions: [                               // 6 kolumner à 5 frågor
            [ { value: 100, question: "...", answer: "..." }, ... ],
            ...
        ],
        dailyDoubles: ["2-3"]                      // "kolumn-rad", 0-indexerat
    },
    round2: { ... },                               // värden 200–1000
    round3: { ... },                               // värden 300–1500
    final: { category: "...", question: "...", answer: "..." }
};
```

## Teknisk information

- `index.html` – sidstruktur och modaler
- `styles.css` – all styling (Jeopardy-blått: `#060CE9`)
- `game.js` – spellogik, buzzer, timers, ljud/video
- `gamedata.js` – frågedata (genererad)
- `convert_ny_omgang_to_gamedata.py` / `convert_excel_to_gamedata.py` – konverterare
- `images/`, `sounds/`, `videos/` – media (videofiler versioneras med Git LFS)

## Anpassningar

- **Buzzer-tangenter**: ändra `buzzerKey` i spelarlistan i början av `game.js`
- **Spelare**: namn i `index.html`/`game.js`; bilder i `images/` (`namn.png`,
  `namn_glad.png`, `namn_ledsen.png`, `namn_1.png`–`namn_4.png` för placeringar)
- **Färger/design**: `styles.css`

Lycka till med ditt Jeopardy-spel! 🎉
