// ---------------------------------------------
//  PAMIĘĆ MÓZGU – PEŁNE KOLORY RGB (Hopfield)
// ---------------------------------------------

let hopfieldR = null;
let hopfieldG = null;
let hopfieldB = null;

// ---------------------------------------------
//  Normalizacja
// ---------------------------------------------

function normalizeRGB(v) {
    return (v / 255) * 2 - 1;
}

function denormalizeRGB(v) {
    let x = Math.round((v + 1) / 2 * 255);
    if (x < 0) x = 0;
    if (x > 255) x = 255;
    return x;
}

// ---------------------------------------------
//  Hopfield
// ---------------------------------------------

function Hopfield(size) {
    this.size = size;
    this.weights = Array.from({ length: size }, () => Array(size).fill(0));
}

Hopfield.prototype.train = function (pattern) {
    for (let i = 0; i < this.size; i++) {
        for (let j = 0; j < this.size; j++) {
            if (i !== j) {
                this.weights[i][j] += pattern[i] * pattern[j];
            }
        }
    }
};

Hopfield.prototype.recall = function (input) {
    const output = [...input];

    for (let i = 0; i < this.size; i++) {
        let sum = 0;
        for (let j = 0; j < this.size; j++) {
            sum += this.weights[i][j] * output[j];
        }
        output[i] = sum >= 0 ? 1 : -1;
    }

    return output;
};

// ---------------------------------------------
//  ZAPIS DO MÓZGU
// ---------------------------------------------

function saveToBrain(method, img) {
    if (method !== "hopfield") {
        console.warn("Inne metody nie obsługują kolorów.");
        return;
    }

    const size = 256;

    if (!hopfieldR) hopfieldR = new Hopfield(size);
    if (!hopfieldG) hopfieldG = new Hopfield(size);
    if (!hopfieldB) hopfieldB = new Hopfield(size);

    const R = new Array(size);
    const G = new Array(size);
    const B = new Array(size);

    for (let i = 0; i < size; i++) {
        const col = img[i];

        if (col === "rgb(0,0,0)") {
            R[i] = -1;
            G[i] = -1;
            B[i] = -1;
        } else {
            const match = col.match(/rgb\((\d+),(\d+),(\d+)\)/);
            const r = parseInt(match[1]);
            const g = parseInt(match[2]);
            const b = parseInt(match[3]);

            R[i] = normalizeRGB(r);
            G[i] = normalizeRGB(g);
            B[i] = normalizeRGB(b);
        }
    }

    hopfieldR.train(R);
    hopfieldG.train(G);
    hopfieldB.train(B);

    console.log("Zapisano pełne kolory RGB do mózgu (Hopfield).");
}

// ---------------------------------------------
//  ODCZYT Z MÓZGU
// ---------------------------------------------

function loadFromBrain(method) {
    if (method !== "hopfield") {
        console.warn("Inne metody nie obsługują kolorów.");
        return new Array(256).fill("rgb(0,0,0)");
    }

    if (!hopfieldR || !hopfieldG || !hopfieldB) {
        console.warn("Mózg jest pusty.");
        return new Array(256).fill("rgb(0,0,0)");
    }

    const size = 256;
    const init = new Array(size).fill(-1);

    const R = hopfieldR.recall(init);
    const G = hopfieldG.recall(init);
    const B = hopfieldB.recall(init);

    const out = new Array(size);

    for (let i = 0; i < size; i++) {
        const r = denormalizeRGB(R[i]);
        const g = denormalizeRGB(G[i]);
        const b = denormalizeRGB(B[i]);

        out[i] = `rgb(${r},${g},${b})`;
    }

    return out;
}
