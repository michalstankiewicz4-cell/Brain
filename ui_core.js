console.log("ui_core.js loaded");

// ---------------------------------------------
//  GLOBALNE ZMIENNE
// ---------------------------------------------

let selectedMemoryIndex = null;
let brainOutputCtx = null;

let currentPanelWidth = 340;
const MIN_PANEL_WIDTH = 20;
const MAX_PANEL_WIDTH_RATIO = 0.5; // 50% ekranu

// ---------------------------------------------
//  INICJALIZACJA UI
// ---------------------------------------------

function initUI() {

    // brain-output canvas
    const brainOutputCanvas = document.getElementById("brain-output");
    brainOutputCanvas.width = 64;
    brainOutputCanvas.height = 64;
    brainOutputCtx = brainOutputCanvas.getContext("2d");

    // tryb generatora
    const modeSelect = document.getElementById("brain-mode");
    const fixedParams = document.getElementById("fixed-params");
    const randomParams = document.getElementById("random-params");

    modeSelect.onchange = () => {
        const mode = modeSelect.value;
        fixedParams.style.display = mode === "fixed" ? "block" : "none";
        randomParams.style.display = mode === "random" ? "block" : "none";
        saveUIState();
    };

    // przyciski miniatur
    document.getElementById("btn-save").onclick = () => {
        const img = getPixelImage();
        saveMemory(img);
        refreshMemoryList();
    };

    document.getElementById("btn-recall").onclick = () => {
        if (selectedMemoryIndex !== null) {
            const memories = loadMemories();
            const img = memories[selectedMemoryIndex];
            setPixelImage(img);
        }
    };

    document.getElementById("btn-clear").onclick = () => {
        if (selectedMemoryIndex !== null) {
            deleteMemory(selectedMemoryIndex);
            selectedMemoryIndex = null;
            refreshMemoryList();
        }
    };

    // przyciski pamięci mózgu
    document.getElementById("btn-brain-save").onclick = () => {
        const saveMethod = document.getElementById("save-method").value;
        const img = getPixelImage();
        saveToBrain(saveMethod, img);
    };

    document.getElementById("btn-brain-load").onclick = () => {
        const loadMethod = document.getElementById("load-method").value;
        const img = loadFromBrain(loadMethod);
        drawBrainOutput(img);
    };

    // przycisk GENERUJ MÓZG
    document.getElementById("btn-generate-brain").onclick = () => {
        const count = parseInt(document.getElementById("brain-count").value, 10);
        const mode = document.getElementById("brain-mode").value;
        const connMode = document.getElementById("brain-connection-mode").value;

        if (mode === "fixed") {
            generateBrain(
                count,
                parseInt(document.getElementById("brain-dendrites").value, 10),
                parseInt(document.getElementById("brain-connections").value, 10),
                parseFloat(document.getElementById("brain-weight").value),
                connMode
            );
        } else {
            generateBrainRandom(
                count,
                parseInt(document.getElementById("dend-min").value, 10),
                parseInt(document.getElementById("dend-max").value, 10),
                parseInt(document.getElementById("conn-min").value, 10),
                parseInt(document.getElementById("conn-max").value, 10),
                parseFloat(document.getElementById("weight-min").value),
                parseFloat(document.getElementById("weight-max").value),
                connMode
            );
        }
    };

    // panel boczny: drag-resize
    initPanelResizer();

    // sekcje: drag-drop + collapsible
    initSectionsDragAndCollapse();

    // wczytaj stan UI
    loadUIState();

    refreshMemoryList();
}

// ---------------------------------------------
//  RYSOWANIE WYJŚCIA MÓZGU
// ---------------------------------------------

function drawBrainOutput(img) {
    brainOutputCtx.fillStyle = "rgb(0,0,0)";
    brainOutputCtx.fillRect(0, 0, 64, 64);

    for (let i = 0; i < 256; i++) {
        const col = img[i];
        if (col !== "rgb(0,0,0)") {
            const x = (i % 16) * 4;
            const y = Math.floor(i / 16) * 4;
            brainOutputCtx.fillStyle = col;
            brainOutputCtx.fillRect(x, y, 4, 4);
        }
    }
}

// ---------------------------------------------
//  MINIATURY – RGB
// ---------------------------------------------

function refreshMemoryList() {
    const list = loadMemories();
    const container = document.getElementById("memory-list");
    container.innerHTML = "";

    list.forEach((mem, index) => {
        const c = document.createElement("canvas");
        c.width = 48;
        c.height = 48;
        c.className = "memory-thumb";

        if (index === selectedMemoryIndex) {
            c.classList.add("selected");
        }

        const ctx = c.getContext("2d");
        ctx.fillStyle = "rgb(0,0,0)";
        ctx.fillRect(0, 0, 48, 48);

        mem.forEach((col, i) => {
            if (col !== "rgb(0,0,0)") {
                const x = (i % 16) * 3;
                const y = Math.floor(i / 16) * 3;
                ctx.fillStyle = col;
                ctx.fillRect(x, y, 3, 3);
            }
        });

        c.onclick = () => {
            selectedMemoryIndex = index;
            refreshMemoryList();
        };

        container.appendChild(c);
    });
}

function saveMemory(img) {
    const list = loadMemories();
    list.push([...img]);
    localStorage.setItem("memories", JSON.stringify(list));
}

function loadMemories() {
    const raw = localStorage.getItem("memories");
    if (!raw) return [];
    return JSON.parse(raw);
}

function deleteMemory(index) {
    const list = loadMemories();
    list.splice(index, 1);
    localStorage.setItem("memories", JSON.stringify(list));
}
