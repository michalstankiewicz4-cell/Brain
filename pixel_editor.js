console.log("pixel_editor.js loaded");

let pixelEditorCtx;
let pixelData = new Array(256).fill("#00000000");
let currentColor = "#44ff44";

function initPixelEditor() {
    const canvas = document.getElementById("pixel-editor");
    pixelEditorCtx = canvas.getContext("2d");

    canvas.width = 256;
    canvas.height = 256;

    // wybór koloru
    document.querySelectorAll(".color-swatch").forEach(s => {
        s.onclick = () => {
            currentColor = s.dataset.col;
        };
    });

    canvas.addEventListener("click", e => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const x = Math.floor((e.clientX - rect.left) * scaleX / 16);
        const y = Math.floor((e.clientY - rect.top) * scaleY / 16);

        const i = y * 16 + x;

        // gumka = klik drugi raz
        pixelData[i] = pixelData[i] === currentColor ? "#00000000" : currentColor;

        drawPixelEditor();
    });

    drawPixelEditor();
}

function getPixelImage() {
    return [...pixelData];
}

function setPixelImage(data) {
    pixelData = [...data];
    drawPixelEditor();
}

function drawPixelEditor() {
    pixelEditorCtx.fillStyle = "#000";
    pixelEditorCtx.fillRect(0, 0, 256, 256);

    for (let i = 0; i < 256; i++) {
        if (pixelData[i] !== "#00000000") {
            const x = (i % 16) * 16;
            const y = Math.floor(i / 16) * 16;
            pixelEditorCtx.fillStyle = pixelData[i];
            pixelEditorCtx.fillRect(x, y, 16, 16);
        }
    }
}
