let pixelCanvas = null;
let pixelCtx = null;
let currentColor = "#ffffff"; // domyślny biały kolor

function initPixelEditor() {
    pixelCanvas = document.getElementById("pixel-editor");
    pixelCanvas.width = 64;
    pixelCanvas.height = 64;
    pixelCtx = pixelCanvas.getContext("2d");

    pixelCtx.fillStyle = "rgb(0,0,0)";
    pixelCtx.fillRect(0, 0, 64, 64);

    pixelCanvas.addEventListener("mousedown", paintPixel);
    pixelCanvas.addEventListener("mousemove", (e) => {
        if (e.buttons === 1) paintPixel(e);
    });

    // Event listenery dla palety kolorów
    const swatches = document.querySelectorAll('.color-swatch');
    swatches.forEach(swatch => {
        swatch.addEventListener('click', () => {
            currentColor = swatch.dataset.col;
            // Wizualne zaznaczenie wybranego koloru
            swatches.forEach(s => s.classList.remove('selected'));
            swatch.classList.add('selected');
        });
    });

    // Zaznacz pierwszy kolor jako domyślny
    if (swatches.length > 0) {
        swatches[swatches.length - 1].classList.add('selected'); // biały
    }
}

function paintPixel(e) {
    const rect = pixelCanvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / 4) * 4;
    const y = Math.floor((e.clientY - rect.top) / 4) * 4;

    pixelCtx.fillStyle = currentColor;
    pixelCtx.fillRect(x, y, 4, 4);
}

// ---------------------------------------------
//  RGB IMAGE → ARRAY[256]
// ---------------------------------------------

function getPixelImage() {
    const img = new Array(256);
    const data = pixelCtx.getImageData(0, 0, 64, 64).data;

    for (let i = 0; i < 256; i++) {
        const x = (i % 16) * 4;
        const y = Math.floor(i / 16) * 4;

        const idx = (y * 64 + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];

        if (a === 0) {
            img[i] = "rgb(0,0,0)";
        } else {
            img[i] = `rgb(${r},${g},${b})`;
        }
    }

    return img;
}

// ---------------------------------------------
//  ARRAY[256] → RGB IMAGE
// ---------------------------------------------

function setPixelImage(img) {
    // Najpierw wyczyść cały canvas na czarno
    pixelCtx.fillStyle = "rgb(0,0,0)";
    pixelCtx.fillRect(0, 0, 64, 64);

    // Następnie narysuj tylko niezerowe piksele
    for (let i = 0; i < 256; i++) {
        const col = img[i];
        if (col !== "rgb(0,0,0)") {
            const x = (i % 16) * 4;
            const y = Math.floor(i / 16) * 4;
            pixelCtx.fillStyle = col;
            pixelCtx.fillRect(x, y, 4, 4);
        }
    }
}
