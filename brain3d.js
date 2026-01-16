console.log("brain3d.js loaded");

let brain = {
    neurons: [],
    params: {}
};

let brainRotation = 0; // kąt obrotu mózgu (radiany)

// mapowanie: indeks piksela 0..255 -> id neuronu 0..count-1
let pixelToNeuronMap = new Array(256).fill(null);

function initBrain3D() {
    console.log("Init brain 3D");
}

function updateBrain3D(dt) {
    // prosty, stały obrót wokół osi Y
    brainRotation += dt * 0.3;
}

function getBrainState() {
    return {
        brain: brain,
        rotation: brainRotation
    };
}

function randomPointInSphere() {
    let x, y, z;
    do {
        x = Math.random() * 2 - 1;
        y = Math.random() * 2 - 1;
        z = Math.random() * 2 - 1;
    } while (x * x + y * y + z * z > 1);
    return { x, y, z };
}

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// -------------------------
// MAPOWANIE PIKSELI → NEURONY
// -------------------------

function setupPixelMapping() {
    const count = brain.neurons.length;
    pixelToNeuronMap = new Array(256).fill(null);

    if (count === 0) return;

    // dla każdego z 256 pikseli losujemy neuron
    for (let i = 0; i < 256; i++) {
        pixelToNeuronMap[i] = randInt(0, count - 1);
    }

    console.log("Pixel-to-neuron map created for", count, "neurons");
}

function clearActivations() {
    for (let i = 0; i < brain.neurons.length; i++) {
        brain.neurons[i].activation = 0;
    }
}

// USTAWIENIE AKTYWACJI NA PODSTAWIE OBRAZU 16×16
// image: tablica 256 kolorów (tak jak w edytorze)
function stimulateBrainFromImage(image) {
    if (!brain.neurons || brain.neurons.length === 0) return;

    clearActivations();

    for (let i = 0; i < 256 && i < image.length; i++) {
        const col = image[i];
        if (col && col !== "#00000000") {
            const neuronId = pixelToNeuronMap[i];
            if (neuronId !== null && neuronId >= 0 && neuronId < brain.neurons.length) {
                // prosta aktywacja binarna
                brain.neurons[neuronId].activation = 1;
            }
        }
    }

    console.log("Brain stimulated from image");
}

// ODCZYT OBRAZU Z AKTYWACJI NEURONÓW
// proste: jeśli neuron przypisany do piksela ma activation>0, rysujemy biały piksel
function readImageFromBrain() {
    const img = new Array(256).fill("#00000000");
    if (!brain.neurons || brain.neurons.length === 0) return img;

    for (let i = 0; i < 256; i++) {
        const neuronId = pixelToNeuronMap[i];
        if (neuronId !== null && neuronId >= 0 && neuronId < brain.neurons.length) {
            const act = brain.neurons[neuronId].activation || 0;
            if (act > 0.5) {
                img[i] = "#ffffff";
            }
        }
    }

    return img;
}

// -------------------------
// GENERATORY MÓZGU (STAŁE / LOSOWE + TRYB POŁĄCZEŃ)
// -------------------------

// STAŁE WARTOŚCI
function generateBrain(count, dendrites, connections, weight, connMode) {
    brain.neurons = [];
    brain.params = { count, dendrites, connections, weight, connMode, mode: "fixed" };

    // tworzymy neurony
    for (let i = 0; i < count; i++) {
        const pos = randomPointInSphere();
        brain.neurons.push({
            id: i,
            x: pos.x,
            y: pos.y,
            z: pos.z,
            connections: [],
            activation: 0
        });
    }

    if (connMode === "random") {
        // LOSOWE POŁĄCZENIA
        for (let i = 0; i < count; i++) {
            const n = brain.neurons[i];
            for (let c = 0; c < connections; c++) {
                let target = randInt(0, count - 1);
                if (target === i) target = (target + 1) % count;
                n.connections.push({ target, weight });
            }
        }
    } else {
        // POŁĄCZENIA DO NAJBLIŻSZYCH
        for (let i = 0; i < count; i++) {
            const n = brain.neurons[i];
            const distances = brain.neurons
                .filter(m => m.id !== i)
                .map(m => ({
                    id: m.id,
                    dist: (n.x - m.x) ** 2 + (n.y - m.y) ** 2 + (n.z - m.z) ** 2
                }))
                .sort((a, b) => a.dist - b.dist);

            for (let c = 0; c < connections && c < distances.length; c++) {
                n.connections.push({
                    target: distances[c].id,
                    weight
                });
            }
        }
    }

    setupPixelMapping();
    console.log("Brain generated (fixed, " + connMode + "):", brain);
}

// LOSOWE WARTOŚCI
function generateBrainRandom(count, dendMin, dendMax, connMin, connMax, wMin, wMax, connMode) {
    brain.neurons = [];
    brain.params = { count, dendMin, dendMax, connMin, connMax, wMin, wMax, connMode, mode: "random" };

    // tworzymy neurony
    for (let i = 0; i < count; i++) {
        const pos = randomPointInSphere();
        brain.neurons.push({
            id: i,
            x: pos.x,
            y: pos.y,
            z: pos.z,
            connections: [],
            activation: 0
        });
    }

    if (connMode === "random") {
        // LOSOWE POŁĄCZENIA
        for (let i = 0; i < count; i++) {
            const n = brain.neurons[i];
            const connCount = randInt(connMin, connMax);
            for (let c = 0; c < connCount; c++) {
                let target = randInt(0, count - 1);
                if (target === i) target = (target + 1) % count;
                const w = wMin + Math.random() * (wMax - wMin);
                n.connections.push({ target, weight: w });
            }
        }
    } else {
        // POŁĄCZENIA DO NAJBLIŻSZYCH
        for (let i = 0; i < count; i++) {
            const n = brain.neurons[i];
            const connCount = randInt(connMin, connMax);

            const distances = brain.neurons
                .filter(m => m.id !== i)
                .map(m => ({
                    id: m.id,
                    dist: (n.x - m.x) ** 2 + (n.y - m.y) ** 2 + (n.z - m.z) ** 2
                }))
                .sort((a, b) => a.dist - b.dist);

            for (let c = 0; c < connCount && c < distances.length; c++) {
                const w = wMin + Math.random() * (wMax - wMin);
                n.connections.push({
                    target: distances[c].id,
                    weight: w
                });
            }
        }
    }

    setupPixelMapping();
    console.log("Brain generated (random, " + connMode + "):", brain);
}
