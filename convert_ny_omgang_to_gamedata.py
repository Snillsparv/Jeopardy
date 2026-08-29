#!/usr/bin/env python3
"""
Konverterar frågor_jeopardy_ny_omgång.xlsx till gamedata.js

Nytt arkformat (ett blad, "Blad1"):
- Kategorirubrik: rad där kolumn A är tom och kolumn B har kategorinamnet
- Fråga: kolumn A = svar/facit, kolumn B = ledtråd
- Ledtråden "bild" → bildfråga: images/questions/<slug-av-svaret>.png
- Ledtråden "ljud" → ljudfråga: sounds/questions/<slug-av-svaret>.mp3
- Sist: "Final Jeopardy"-rad följd av finalfrågans svar + ledtråd

Kategoriplacering (vilken spelplan och kolumnordning) styrs av PLACEMENT nedan.
Daily Doubles: 1 i omgång 1, 2 i omgång 2, 3 i omgång 3 — slumpas med fast
frö så att körningen är reproducerbar.
"""

import openpyxl
import random
import json
import re
import html

XLSX = 'frågor_jeopardy_ny_omgång.xlsx'
OUT = 'gamedata.js'

# 6 kategorinamn per omgång, i kolumnordning vänster→höger.
# Beslutad utifrån svårighetskurva, mediaspridning och dramaturgi:
# lättsam start, klassisk quizmitt, personligt klimax i omgång 3.
PLACEMENT = [
    [
        'Kända par',
        'Tecken i tiden',
        'Att bygga en dator',
        'I Bamses värld',
        'Alla dessa Kallar',
        'På bebisspråk',
    ],
    [
        'En odyssé',
        'Ord med ursprung',
        'Alias',
        'Vilket år',
        'Dåliga låtöversättningar',
        'Ljud utan bild',
    ],
    [
        'Kända matematiker',
        'Land efter yta',
        'Spårvagnar',
        'Avsluta ordvitsen',
        'Två av oss',
        'Om programledaren',
    ],
]

RANDOM_SEED = 20260829


def slugify(text):
    """Konverterar text till filnamn-vänlig sträng (samma som gamla skriptet)"""
    text = text.lower()
    text = re.sub(r'[åä]', 'a', text)
    text = re.sub(r'ö', 'o', text)
    text = re.sub(r'[^a-z0-9]+', '_', text)
    return text.strip('_')


def parse_sheet(path):
    wb = openpyxl.load_workbook(path)
    sh = wb['Blad1']
    rows = [r for r in sh.iter_rows(values_only=True) if any(v is not None for v in r)]

    categories = {}
    order = []
    final = None
    current = None
    i = 0
    while i < len(rows):
        a, b = rows[i][0], rows[i][1]
        if a is None and b is not None:
            current = []
            categories[str(b)] = current
            order.append(str(b))
        elif a == 'Final Jeopardy':
            fa, fb = rows[i + 1][0], rows[i + 1][1]
            final = {'category': str(b), 'answer': str(fa), 'question': str(fb)}
            i += 1
        elif a is not None:
            answer = str(int(a)) if isinstance(a, float) and a == int(a) else str(a)
            current.append({'answer': answer, 'clue': str(b)})
        i += 1
    return categories, order, final


def build_question(entry):
    """Returnerar (frågetext-html, mediasökväg eller None)"""
    clue, answer = entry['clue'], entry['answer']
    if clue == 'bild':
        path = f"images/questions/{slugify(answer)}.png"
        alt = html.escape(answer, quote=True)
        return f'<img src="{path}" alt="{alt}" class="question-image">', path
    if clue == 'ljud':
        path = f"sounds/questions/{slugify(answer)}.mp3"
        return (f'<div class="intro-question" data-audio-src="{path}">'
                f'<p style="font-size: 8rem;">🔊</p></div>'), path
    if len(clue) <= 2 and not clue.isalnum():
        # Enstaka tecken (Tecken i tiden) visas i jätteformat
        return f'<p style="font-size: 10rem; margin: 0;">{html.escape(clue)}</p>', None
    return clue, None


def js_str(s):
    return '"' + s.replace('\\', '\\\\').replace('"', '\\"').replace('\n', '\\n') + '"'


def main():
    random.seed(RANDOM_SEED)
    categories, order, final = parse_sheet(XLSX)

    if PLACEMENT is None:
        raise SystemExit('PLACEMENT är inte satt — fyll i kategorifördelningen först.')

    placed = [name for round_cats in PLACEMENT for name in round_cats]
    assert sorted(placed) == sorted(order), (
        f'Placering matchar inte arket:\n  saknas: {set(order) - set(placed)}'
        f'\n  okända: {set(placed) - set(order)}')

    media_paths = []
    out = '// Jeopardy Game Data\n'
    out += '// Genererad från frågor_jeopardy_ny_omgång.xlsx av convert_ny_omgang_to_gamedata.py\n\n'
    out += 'const gameData = {\n'

    dd_counts = [1, 2, 3]
    for r, (round_cats, dd_count) in enumerate(zip(PLACEMENT, dd_counts), start=1):
        base = r * 100
        values = [base * m for m in (1, 2, 3, 4, 5)]
        out += f'    round{r}: {{\n'
        out += f'        categories: {json.dumps(round_cats, ensure_ascii=False)},\n'
        out += '        questions: [\n'
        for cat in round_cats:
            out += '            [\n'
            for value, entry in zip(values, categories[cat]):
                q, media = build_question(entry)
                if media:
                    media_paths.append(media)
                out += (f'                {{value: {value}, question: {js_str(q)}, '
                        f'answer: {js_str(entry["answer"])}}},\n')
            out += '            ],\n'
        out += '        ],\n'

        # Daily Doubles i olika kategorier, aldrig på lägsta värdet
        columns = random.sample(range(len(round_cats)), dd_count)
        dds = [f'{c}-{random.randint(1, 4)}' for c in columns]
        out += f'        dailyDoubles: {json.dumps(dds)}\n'
        out += '    },\n\n'

    out += '    final: {\n'
    out += f'        category: {js_str(final["category"])},\n'
    out += f'        question: {js_str(final["question"])},\n'
    out += f'        answer: {js_str(final["answer"])}\n'
    out += '    }\n'
    out += '};\n'

    with open(OUT, 'w', encoding='utf-8') as f:
        f.write(out)

    print(f'✅ {OUT} skapad!')
    print(f'\n📁 Mediafilar som refereras ({len(media_paths)} st):')
    for p in media_paths:
        print(f'   - {p}')


if __name__ == '__main__':
    main()
