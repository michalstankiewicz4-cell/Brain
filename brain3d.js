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

    // for each of 256 pixels, we randomly assign a neuron
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

// SET ACTIVATION BASED ON 16×16 IMAGE
// image: array of 256 colors (as in the editor)
function stimulateBrainFromImage(image) {
    if (!brain.neurons || brain.neurons.length === 0) return;

    clearActivations();

    for (let i = 0; i < 256 && i < image.length; i++) {
        const col = image[i];
        if (col && col !== "rgb(0,0,0)") {
            const neuronId = pixelToNeuronMap[i];
            if (neuronId !== null && neuronId >= 0 && neuronId < brain.neurons.length) {
                // simple binary activation
                brain.neurons[neuronId].activation = 1;
            }
        }
    }

    console.log("Brain stimulated from image");
}

// READ IMAGE FROM NEURON ACTIVATIONS
// simple: if neuron assigned to pixel has activation>0, draw white pixel
function readImageFromBrain() {
    const img = new Array(256).fill("rgb(0,0,0)");
    if (!brain.neurons || brain.neurons.length === 0) return img;

    for (let i = 0; i < 256; i++) {
        const neuronId = pixelToNeuronMap[i];
        if (neuronId !== null && neuronId >= 0 && neuronId < brain.neurons.length) {
            const act = brain.neurons[neuronId].activation || 0;
            if (act > 0.5) {
                img[i] = "rgb(255,255,255)";
            }
        }
    }

    return img;
}

// -------------------------
// BRAIN GENERATORS (FIXED / RANDOM + CONNECTION MODE)
// -------------------------

// FIXED VALUES
function generateBrain(count, dendrites, connections, weight, connMode) {
    brain.neurons = [];
    brain.params = { count, dendrites, connections, weight, connMode, mode: "fixed" };

    // create neurons
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
        // RANDOM CONNECTIONS
        for (let i = 0; i < count; i++) {
            const n = brain.neurons[i];
            for (let c = 0; c < connections; c++) {
                let target = randInt(0, count - 1);
                if (target === i) target = (target + 1) % count;
                n.connections.push({ target, weight });
            }
        }
    } else {
        // CONNECTIONS TO NEAREST NEIGHBORS
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

// RANDOM VALUES
function generateBrainRandom(count, dendMin, dendMax, connMin, connMax, wMin, wMax, connMode) {
    brain.neurons = [];
    brain.params = { count, dendMin, dendMax, connMin, connMax, wMin, wMax, connMode, mode: "random" };

    // create neurons
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
        // RANDOM CONNECTIONS
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
        // CONNECTIONS TO NEAREST NEIGHBORS
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
