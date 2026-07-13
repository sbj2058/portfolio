// App Initializer & UI Layer Handlers
document.addEventListener("DOMContentLoaded", () => {
    // Render static documentation drawers from matrix files
    populateFixedGrid('vowelGrid', vowelDisplayList);
    populateFixedGrid('consonantGrid', consonantDisplayList);
    populateFixedGrid('conjunctGrid', conjunctDisplayList);
    compileBarakhariMatrix();
    
    // Wire main live keystroke listener
    const inputField = document.getElementById('romanInput');
    inputField.addEventListener('input', () => {
        const rawVal = inputField.value;
        const unicodeString = processTransliteration(rawVal);
        document.getElementById('unicodeOutput').value = unicodeString;
        document.getElementById('preetiOutput').value = processPreetiStream(unicodeString);
    });

    // Wire component toggle elements
    document.getElementById('mapDrawerBtn').addEventListener('click', toggleMapDrawer);
    document.getElementById('themeModeBtn').addEventListener('click', toggleThemeMode);

    document.querySelectorAll('.tab-item').forEach(button => {
        button.addEventListener('click', (e) => {
            const targetTab = e.currentTarget.getAttribute('data-tab');
            switchDrawerTab(e, targetTab);
        });
    });

    document.querySelectorAll('.btn-copy').forEach(button => {
        button.addEventListener('click', (e) => {
            const targetFieldId = e.currentTarget.getAttribute('data-target');
            copyField(targetFieldId, e.currentTarget);
        });
    });
});

function populateFixedGrid(elementId, dataArray) {
    document.getElementById(elementId).innerHTML = dataArray.map(node => `
        <div class="matrix-cell">
            <div class="cell-glyph">${node.u}</div>
            <div class="cell-key">${node.k}</div>
        </div>
    `).join('');
}

function compileBarakhariMatrix() {
    const rootKeys = ['k', 'g', 'ch', 't', 'T', 'p', 's', 'h'];
    let matrixHtml = "";

    rootKeys.forEach(root => {
        matrixHtml += `<div class="matrix-scroll-row">`;
        barakhariModifiers.forEach(mod => {
            let generatedKey = mod.k.replace('p', root);
            let evaluatedUnicode = processTransliteration(generatedKey);
            matrixHtml += `
                <div class="matrix-scroll-cell">
                    <span>${evaluatedUnicode}</span>
                    <span>${generatedKey}</span>
                </div>
            `;
        });
        matrixHtml += `</div>`;
    });
    document.getElementById('barakhariMatrixContainer').innerHTML = matrixHtml;
}

function toggleMapDrawer() {
    const fileDrawer = document.getElementById('mappingDrawer');
    const triggerBtn = document.getElementById('mapDrawerBtn');
    fileDrawer.classList.toggle('show');
    
    if (fileDrawer.classList.contains('show')) {
        triggerBtn.innerText = "❌ Close Character Maps";
        triggerBtn.classList.add('active');
    } else {
        triggerBtn.innerText = "📋 Open Character Maps";
        triggerBtn.classList.remove('active');
    }
}

function switchDrawerTab(eventRef, gridId) {
    document.querySelectorAll('.tab-item').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.grid-view').forEach(view => view.classList.remove('active'));
    
    eventRef.currentTarget.classList.add('active');
    document.getElementById(gridId).classList.add('active');
}

function toggleThemeMode() {
    const rootElement = document.body;
    const stateBtn = document.getElementById('themeModeBtn');
    if (rootElement.getAttribute('data-theme') === 'dark') {
        rootElement.setAttribute('data-theme', 'light');
        stateBtn.innerText = "🌙 Dark Mode";
    } else {
        rootElement.setAttribute('data-theme', 'dark');
        stateBtn.innerText = "☀️ Light Mode";
    }
}

function copyField(fieldId, actionBtn) {
    const fieldDom = document.getElementById(fieldId);
    fieldDom.select();
    navigator.clipboard.writeText(fieldDom.value).then(() => {
        actionBtn.innerText = "✓ Saved";
        actionBtn.classList.add('copied');
        setTimeout(() => {
            actionBtn.innerText = "Copy Field";
            actionBtn.classList.remove('copied');
        }, 1200);
    });
}