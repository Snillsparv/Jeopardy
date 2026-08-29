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

### Med telefonstyrning (rekommenderas)

1. Kör `node server.js` i spelmappen (kräver bara [Node.js](https://nodejs.org), inga paket)
2. Öppna `http://localhost:8080` på datorn/TV:n — det är spelskärmen
3. Skanna QR-koderna på startskärmen med telefonerna (allt på samma wifi):
   - **Programledaren** → `/host`: starta spelet, avslöja kategorier, öppna frågor
     från ett minibräde, se **facit i handen**, rätta med stora RÄTT/FEL-knappar,
     mata in insatser och justera poäng
   - **Spelarna** → `/play`: välj vem du är och få en stor buzzerknapp som tänds
     när frågan är öppen (vibrerar på Android)

Tangentbordet på datorn fungerar parallellt hela tiden, så fysiska buzz-kontroller
och telefoner kan användas om vartannat.

### Utan server (som tidigare)

Öppna `index.html` direkt eller via valfri webbserver (t.ex.
`python3 -m http.server 8000`) och styr allt med tangentbordet — fjärrläget är
helt avstängt då.

## Spelflöde och kontroller

Programledaren styr spelet med tangentbordet (en presentationsklicker som skickar
PageDown/PageUp fungerar utmärkt):

| Tangent | Gör |
|---|---|
| **PageDown** | Nästa steg: avslöja kategori, slumpa spelägare, **öppna för buzz** när frågan är uppläst, markera **rätt svar**, bekräfta insats, nästa steg i finalen |
| **PageUp** | Markera **fel svar** (frågor och finalrättning) |
| **1–4** | Buzzer för spelare 1–4 (David, Ludde, Lina, Hanna) — kan bindas om, se nedan |
| **F** | Växla fullskärm |
| **R** | Öppna/stäng poängjustering |
| **B** | (Debug) Rensa hela spelplanen och gå till nästa omgång |
| **J** | (Debug) Hoppa direkt till vinnarskärmen |

**Koppla fysiska buzzers:** klicka **🔧 Ställ in buzzers** på startskärmen och tryck
på varje spelares buzzer i tur och ordning — spelet binder då knapparna till vad
kontrollerna faktiskt skickar. Fungerar både med kontroller som beter sig som
tangentbord och med handkontroller/gamepads som **PlayStation Buzz!** (läses via
webbläsarens Gamepad API — inga mappningsprogram behövs). Valen sparas i
webbläsaren på den datorn; "Återställ till 1–4" nollställer.

En omgång: beloppen snurrar fram → PageDown avslöjar kategorierna en i taget →
PageDown slumpar spelägare → ägaren väljer fråga (klick) → **buzzrarna är låsta
tills värden läst klart och öppnar med PageDown** (en guldram runt skärmen tänds
när det är fritt att buzza) → spelarna buzzar → PageDown/PageUp rättar.
Bild- och symbolfrågor öppnas för buzz direkt; ljudfrågor öppnas automatiskt när
klippet spelats klart (värden kan öppna tidigare). Vid Daily Double svarar
spelägaren ensam efter att ha valt insats. Frågor stängs automatiskt 10 sekunder
efter att buzzen öppnats om ingen buzzar.

I `/host`-läget finns motsvarande **🔔 Öppna för buzz**-knapp, och under **🧪 Test**
finns knappar för att rensa spelplanen (hoppa till nästa omgång) och gå direkt
till vinnarskärmen.

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
- `server.js` – LAN-server för telefonstyrning (beroendefri Node, SSE-buss)
- `remote.js` – brygga i spelskärmen: rapporterar tillstånd, tar emot kommandon
  (aktiveras bara när spelet serveras av `server.js`)
- `host.html` / `play.html` – programledarens fjärr respektive spelarnas buzzer
- `vendor/qrcode.min.js` – QR-koder på startskärmen ([qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator), MIT)
- `convert_ny_omgang_to_gamedata.py` / `convert_excel_to_gamedata.py` – konverterare
- `images/`, `sounds/`, `videos/` – media (videofiler versioneras med Git LFS)

Telefonstyrningen är byggd för ett privat wifi: ingen inloggning, och skärmen är
alltid auktoritativ — telefonerna skickar bara kommandon (motsvarande
tangenttryck) och ritar sitt UI från skärmens tillståndsrapporter.

## Anpassningar

- **Buzzer-tangenter**: ändra `buzzerKey` i spelarlistan i början av `game.js`
- **Spelare**: namn i `index.html`/`game.js`; bilder i `images/` (`namn.png`,
  `namn_glad.png`, `namn_ledsen.png`, `namn_1.png`–`namn_4.png` för placeringar)
- **Färger/design**: `styles.css`

Lycka till med ditt Jeopardy-spel! 🎉
