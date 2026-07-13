// Conversion Parsing Engines
function processTransliteration(text) {
    let compiled = "";
    let index = 0;
    while (index < text.length) {
        let hit = false;
        for (const rule of translationRules) {
            if (text.startsWith(rule.r, index)) {
                compiled += rule.u;
                index += rule.r.length;
                hit = true;
                break;
            }
        }
        if (!hit) {
            compiled += text[index];
            index++;
        }
    }
    return compiled
        .replace(/्अ/g, '')
        .replace(/्आ/g, 'ा').replace(/्ा/g, 'ा')
        .replace(/्इ/g, 'ि').replace(/्ि/g, 'ि')
        .replace(/्ई/g, 'ी').replace(/्ी/g, 'ी')
        .replace(/्उ/g, 'ु').replace(/्ु/g, 'ु')
        .replace(/्ऊ/g, 'ू').replace(/्ू/g, 'ू')
        .replace(/्ए/g, 'े').replace(/्े/g, 'े')
        .replace(/्ऐ/g, 'ै').replace(/्ै/g, 'ै')
        .replace(/्ओ/g, 'ो').replace(/्ो/g, 'ो')
        .replace(/्औ/g, 'ौ').replace(/्ौ/g, 'ौ')
        .replace(/्ं/g, 'ं').replace(/्ः/g, 'ः')
        .replace(/्ऋ/g, 'ृ');
}

function processPreetiStream(uniText) {
    if (!uniText) return "";
    let result = "";
    let idx = 0;
    while (idx < uniText.length) {
        let currentSymbol = uniText[idx];
        let lookaheadSymbol = uniText[idx + 1];

        if (lookaheadSymbol === 'ि') {
            let parsedPreeti = unicodeToPreetiMap[currentSymbol] !== undefined ? unicodeToPreetiMap[currentSymbol] : currentSymbol;
            result += 'l' + parsedPreeti;
            idx += 2;
            continue;
        }

        if (unicodeToPreetiMap[currentSymbol] !== undefined) {
            result += unicodeToPreetiMap[currentSymbol];
        } else {
            result += currentSymbol;
        }
        idx++;
    }
    return result;
}