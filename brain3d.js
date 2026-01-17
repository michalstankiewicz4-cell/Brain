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
// PIXEL → NEURON MAPPING (DISTRIBUTED COLOR CODING)
// -------------------------

function setupPixelMapping() {
    const count = brain.neurons.length;
    pixelToNeuronMap = new Array(256);

    if (count === 0) return;

    // Calculate neurons per pixel (adaptive compression)
    const neuronsPerPixel = Math.max(1, Math.floor(count / 256));
    
    console.log(`Distributed Color Coding: ${neuronsPerPixel} neurons per pixel`);

    // Assign neuron groups to each pixel
    for (let i = 0; i < 256; i++) {
        const group = [];
        
        for (let j = 0; j < neuronsPerPixel; j++) {
            // Deterministic but well-distributed mapping
            const neuronId = (i * neuronsPerPixel + j) % count;
            group.push(neuronId);
        }
        
        pixelToNeuronMap[i] = group;
    }

    console.log("Pixel-to-neuron map created for", count, "neurons");
}

function clearActivations() {
    for (let i = 0; i < brain.neurons.length; i++) {
        brain.neurons[i].activation = 0;
    }
}

// SET ACTIVATION BASED ON 16×16 IMAGE (DISTRIBUTED COLOR CODING)
// Encodes RGB colors as activation patterns across neuron groups
function stimulateBrainFromImage(image) {
    if (!brain.neurons || brain.neurons.length === 0) return;

    clearActivations();

    for (let i = 0; i < 256 && i < image.length; i++) {
        const col = image[i];
        const neuronGroup = pixelToNeuronMap[i];
        
        if (!neuronGroup || neuronGroup.length === 0) continue;
        
        // Parse RGB color
        const rgb = parseRGB(col);
        
        // Encode color as distributed pattern
        encodeColorToNeurons(neuronGroup, rgb);
    }

    console.log("Brain stimulated from image (distributed color coding)");
}

// Helper: Parse RGB string to {r, g, b} values (0-255)
function parseRGB(colorStr) {
    if (colorStr === "rgb(0,0,0)" || !colorStr) {
        return { r: 0, g: 0, b: 0 };
    }
    
    const match = colorStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!match) return { r: 0, g: 0, b: 0 };
    
    return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3])
    };
}

// Helper: Encode RGB color as activation pattern
function encodeColorToNeurons(neuronGroup, rgb) {
    const groupSize = neuronGroup.length;
    
    if (groupSize >= 3) {
        // CASE 1: 3+ neurons - direct RGB encoding
        // First 3 neurons encode R, G, B directly
        brain.neurons[neuronGroup[0]].activation = rgb.r / 255;
        brain.neurons[neuronGroup[1]].activation = rgb.g / 255;
        brain.neurons[neuronGroup[2]].activation = rgb.b / 255;
        
        // Additional neurons encode combinations for robustness
        for (let i = 3; i < groupSize; i++) {
            // Use HSV-like encoding for extra neurons
            const max = Math.max(rgb.r, rgb.g, rgb.b);
            const min = Math.min(rgb.r, rgb.g, rgb.b);
            const brightness = max / 255;
            const saturation = max === 0 ? 0 : (max - min) / max;
            
            if (i === 3) brain.neurons[neuronGroup[i]].activation = brightness;
            else if (i === 4) brain.neurons[neuronGroup[i]].activation = saturation;
            else {
                // Additional neurons: weighted combinations
                const weight = (i - 5) / Math.max(1, groupSize - 5);
                brain.neurons[neuronGroup[i]].activation = 
                    (rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114) / 255 * weight;
            }
        }
    } else if (groupSize === 2) {
        // CASE 2: 2 neurons - compressed encoding
        // Neuron 1: luminance (grayscale)
        // Neuron 2: chrominance (color info)
        const luminance = (rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114) / 255;
        const chrominance = Math.abs(rgb.r - rgb.b) / 255;
        
        brain.neurons[neuronGroup[0]].activation = luminance;
        brain.neurons[neuronGroup[1]].activation = chrominance;
    } else if (groupSize === 1) {
        // CASE 3: 1 neuron - grayscale only
        const gray = (rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114) / 255;
        brain.neurons[neuronGroup[0]].activation = gray;
    }
}

// READ IMAGE FROM NEURON ACTIVATIONS (DISTRIBUTED COLOR DECODING)
// Decodes RGB colors from activation patterns
function readImageFromBrain() {
    const img = new Array(256).fill("rgb(0,0,0)");
    if (!brain.neurons || brain.neurons.length === 0) return img;

    for (let i = 0; i < 256; i++) {
        const neuronGroup = pixelToNeuronMap[i];
        if (!neuronGroup || neuronGroup.length === 0) continue;
        
        // Decode color from neuron activations
        const rgb = decodeColorFromNeurons(neuronGroup);
        img[i] = `rgb(${rgb.r},${rgb.g},${rgb.b})`;
    }

    return img;
}

// Helper: Decode RGB color from activation pattern
function decodeColorFromNeurons(neuronGroup) {
    const groupSize = neuronGroup.length;
    
    if (groupSize >= 3) {
        // CASE 1: 3+ neurons - direct RGB decoding
        const r = Math.round((brain.neurons[neuronGroup[0]].activation || 0) * 255);
        const g = Math.round((brain.neurons[neuronGroup[1]].activation || 0) * 255);
        const b = Math.round((brain.neurons[neuronGroup[2]].activation || 0) * 255);
        
        return {
            r: Math.max(0, Math.min(255, r)),
            g: Math.max(0, Math.min(255, g)),
            b: Math.max(0, Math.min(255, b))
        };
    } else if (groupSize === 2) {
        // CASE 2: 2 neurons - decompress from luminance + chrominance
        const luminance = brain.neurons[neuronGroup[0]].activation || 0;
        const chrominance = brain.neurons[neuronGroup[1]].activation || 0;
        
        // Approximate color reconstruction
        const gray = Math.round(luminance * 255);
        const colorShift = Math.round(chrominance * 100);
        
        return {
            r: Math.max(0, Math.min(255, gray + colorShift)),
            g: gray,
            b: Math.max(0, Math.min(255, gray - colorShift))
        };
    } else if (groupSize === 1) {
        // CASE 3: 1 neuron - grayscale reconstruction
        const gray = Math.round((brain.neurons[neuronGroup[0]].activation || 0) * 255);
        return { r: gray, g: gray, b: gray };
    }
    
    return { r: 0, g: 0, b: 0 };
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
