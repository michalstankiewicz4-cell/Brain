// ---------------------------------------------
//  PIXEL EDITOR - CONFIGURATION
// ---------------------------------------------

let pixelCanvas = null;
let pixelCtx = null;
let currentColor = "#ffffff"; // default white color

// Configuration constants
const CANVAS_SIZE = 64;
const GRID_SIZE = 16;
const PIXEL_SIZE = CANVAS_SIZE / GRID_SIZE;  // 4px
const TOTAL_PIXELS = GRID_SIZE * GRID_SIZE;  // 256

// ---------------------------------------------
//  HELPER FUNCTIONS - COORDINATE CONVERSION
// ---------------------------------------------

// Convert grid coordinates (0-15) to canvas coordinates (0-60)
function gridToCanvas(gridX, gridY) {
    return {
        x: gridX * PIXEL_SIZE,
        y: gridY * PIXEL_SIZE
    };
}

// Convert linear index (0-255) to grid coordinates (0-15)
function indexToGrid(index) {
    return {
        x: index % GRID_SIZE,
        y: Math.floor(index / GRID_SIZE)
    };
}

// Get pixel color from ImageData at canvas coordinates
function getPixelColor(imageData, canvasX, canvasY) {
    const idx = (canvasY * CANVAS_SIZE + canvasX) * 4;  // RGBA index
    const r = imageData.data[idx];
    const g = imageData.data[idx + 1];
    const b = imageData.data[idx + 2];
    const a = imageData.data[idx + 3];
    
    return a === 0 ? "rgb(0,0,0)" : `rgb(${r},${g},${b})`;
}

// ---------------------------------------------
//  INITIALIZATION
// ---------------------------------------------

function initPixelEditor() {
    pixelCanvas = document.getElementById("pixel-editor");
    pixelCanvas.width = CANVAS_SIZE;
    pixelCanvas.height = CANVAS_SIZE;
    pixelCtx = pixelCanvas.getContext("2d");

    // Clear canvas to black
    pixelCtx.fillStyle = "rgb(0,0,0)";
    pixelCtx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Mouse event listeners
    pixelCanvas.addEventListener("mousedown", paintPixel);
    pixelCanvas.addEventListener("mousemove", (e) => {
        if (e.buttons === 1) paintPixel(e);
    });

    // Color picker event listeners
    const swatches = document.querySelectorAll('.color-swatch');
    swatches.forEach(swatch => {
        swatch.addEventListener('click', () => {
            currentColor = swatch.dataset.col;
            // Visual selection of chosen color
            swatches.forEach(s => s.classList.remove('selected'));
            swatch.classList.add('selected');
        });
    });

    // Select last color (white) as default
    if (swatches.length > 0) {
        swatches[swatches.length - 1].classList.add('selected');
    }
}

// ---------------------------------------------
//  PAINTING
// ---------------------------------------------

function paintPixel(e) {
    const rect = pixelCanvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Convert mouse position to grid coordinates
    const gridX = Math.floor(mouseX / PIXEL_SIZE);
    const gridY = Math.floor(mouseY / PIXEL_SIZE);
    
    // Boundary check
    if (gridX < 0 || gridX >= GRID_SIZE || gridY < 0 || gridY >= GRID_SIZE) {
        return;
    }
    
    // Convert to canvas coordinates (snapped to grid)
    const canvas = gridToCanvas(gridX, gridY);
    
    pixelCtx.fillStyle = currentColor;
    pixelCtx.fillRect(canvas.x, canvas.y, PIXEL_SIZE, PIXEL_SIZE);
}

// ---------------------------------------------
//  IMAGE CONVERSION - CANVAS → ARRAY[256]
// ---------------------------------------------

function getPixelImage() {
    const img = new Array(TOTAL_PIXELS);
    const imageData = pixelCtx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    for (let i = 0; i < TOTAL_PIXELS; i++) {
        const grid = indexToGrid(i);
        const canvas = gridToCanvas(grid.x, grid.y);
        img[i] = getPixelColor(imageData, canvas.x, canvas.y);
    }

    return img;
}

// ---------------------------------------------
//  IMAGE CONVERSION - ARRAY[256] → CANVAS
// ---------------------------------------------

function setPixelImage(img) {
    // Clear entire canvas to black
    pixelCtx.fillStyle = "rgb(0,0,0)";
    pixelCtx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw only non-black pixels
    for (let i = 0; i < TOTAL_PIXELS; i++) {
        if (img[i] !== "rgb(0,0,0)") {
            const grid = indexToGrid(i);
            const canvas = gridToCanvas(grid.x, grid.y);
            
            pixelCtx.fillStyle = img[i];
            pixelCtx.fillRect(canvas.x, canvas.y, PIXEL_SIZE, PIXEL_SIZE);
        }
    }
}