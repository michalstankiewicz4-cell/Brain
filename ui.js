console.log("ui.js loaded");

let selectedMemoryIndex = null;

function initUI() {
    // przełączanie trybu generatora
    const modeSelect = document.getElementById("brain-mode");
    const fixedParams = document.getElementById("fixed-params");
    const randomParams = document.getElementById("random-params");

    modeSelect.onchange = () => {
        const mode = modeSelect.value;
        fixedParams.style.display = mode === "fixed" ? "block" : "none";
        randomParams.style.display = mode === "random" ? "block" : "none";
    };

    // przycisk ZAPAMIĘTAJ (prawa pamięć)
    document.getElementById("btn-save").onclick = () => {
        const img = getPixelImage();
        saveMemory(img);
        refreshMemoryList();
    };

    // przycisk ODTWÓRZ (prawa pamięć)
    document.getElementById("btn-recall").onclick = () => {
        if (selectedMemoryIndex !== null) {
            const memories = loadMemories();
            const img = recallMemory(memories[selectedMemoryIndex]);
            setPixelImage(img);
        }
    };

    // przycisk WYCZYŚĆ (usuwa wybraną miniaturę z pamięci)
    document.getElementById("btn-clear").onclick = () => {
        if (selectedMemoryIndex !== null) {
            deleteMemory(selectedMemoryIndex);
            selectedMemoryIndex = null;
            refreshMemoryList();
        }
    };

    // przycisk ŁADOWANIE / ODTWARZANIE (mózg)
    document.getElementById("btn-brain").onclick = () => {
        const saveMethod = document.getElementById("save-method").value;
        const loadMethod = document.getElementById("load-method").value;

        const img = getPixelImage();
        saveToBrain(saveMethod, img);

        const loaded = loadFromBrain(loadMethod);
        if (loaded) {
            setPixelImage(loaded);
        }
    };

    // przycisk GENERUJ MÓZG
    document.getElementById("btn-generate-brain").onclick = () => {
        const count = parseInt(document.getElementById("brain-count").value, 10);
        const mode = document.getElementById("brain-mode").value;
        const connMode = document.getElementById("brain-connection-mode").value; // <-- NOWE

        if (mode === "fixed") {
            generateBrain(
                count,
                parseInt(document.getElementById("brain-dendrites").value, 10),
                parseInt(document.getElementById("brain-connections").value, 10),
                parseFloat(document.getElementById("brain-weight").value),
                connMode // <-- NOWE
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
                connMode // <-- NOWE
            );
        }
    };

    refreshMemoryList();
}

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
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, 48, 48);

        mem.forEach((col, i) => {
            if (col !== "#00000000") {
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
