// ---------------------------------------------
//  BRAIN MEMORY SYSTEM
//  Supports: Hopfield (legacy) + Attractor Dynamics (new)
// ---------------------------------------------

let hopfieldR = null;
let hopfieldG = null;
let hopfieldB = null;

// Attractor Dynamics state
let attractorState = {
    isEncoding: false,
    isRecalling: false,
    phase: 'idle',  // idle, encoding, strengthening, recalling, converging
    progress: 0,
    animationFrame: null,
    energyParticles: []  // for visualization
};

// ---------------------------------------------
//  NORMALIZATION
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
//  HOPFIELD NETWORK (LEGACY)
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
//  ATTRACTOR DYNAMICS - ADAPTIVE NEURAL MEMORY
// ---------------------------------------------

function saveAttractorToBrain(img, onProgress, onComplete) {
    if (!brain.neurons || brain.neurons.length === 0) {
        console.warn("No brain generated. Please generate brain first.");
        if (onComplete) onComplete(false);
        return;
    }

    attractorState.isEncoding = true;
    attractorState.phase = 'encoding';
    attractorState.progress = 0;

    // PHASE 1: ENCODING - Activate input neurons
    console.log("PHASE 1: Encoding image to neurons...");
    stimulateBrainFromImage(img);
    
    const totalPhases = 4;
    let currentPhase = 1;
    
    setTimeout(() => {
        attractorState.phase = 'strengthening';
        attractorState.progress = 0.25;
        currentPhase = 2;
        
        // PHASE 2: STRENGTHENING - Hebbian learning on connections
        console.log("PHASE 2: Strengthening connections (Hebbian learning)...");
        strengthenConnections();
        
        setTimeout(() => {
            attractorState.phase = 'stabilizing';
            attractorState.progress = 0.5;
            currentPhase = 3;
            
            // PHASE 3: PROPAGATION - Let activation spread through network
            console.log("PHASE 3: Propagating activation through network...");
            propagateActivation(5); // 5 iterations
            
            setTimeout(() => {
                attractorState.phase = 'complete';
                attractorState.progress = 1.0;
                attractorState.isEncoding = false;
                
                console.log("PHASE 4: Encoding complete! Pattern stored in neural structure.");
                
                if (onComplete) onComplete(true);
            }, 800);
            
        }, 1000);
        
    }, 1200);
}

function loadAttractorFromBrain(onProgress, onComplete) {
    if (!brain.neurons || brain.neurons.length === 0) {
        console.warn("No brain generated.");
        if (onComplete) onComplete(null);
        return;
    }

    attractorState.isRecalling = true;
    attractorState.phase = 'recalling';
    attractorState.progress = 0;

    // PHASE 1: SPONTANEOUS ACTIVATION - Start with weak random pattern
    console.log("PHASE 1: Initiating spontaneous activation...");
    clearActivations();
    addSpontaneousNoise(0.2);  // Reduced noise - let network find pattern
    
    setTimeout(() => {
        attractorState.phase = 'converging';
        attractorState.progress = 0.33;
        
        // PHASE 2: CONVERGENCE - Let network settle into attractor (CRITICAL!)
        console.log("PHASE 2: Network converging to attractor...");
        propagateActivation(15); // MORE iterations for better convergence
        
        setTimeout(() => {
            attractorState.progress = 0.66;
            
            // PHASE 3: STABILIZATION - Final refinement
            console.log("PHASE 3: Stabilizing pattern...");
            propagateActivation(10); // More stabilization
            
            setTimeout(() => {
                attractorState.phase = 'reading';
                attractorState.progress = 1.0;
                
                // PHASE 4: READ OUT - Extract pattern from neurons
                console.log("PHASE 4: Reading pattern from neurons...");
                const img = readImageFromBrain();
                
                // DEBUG: Check activations
                let activeCount = 0;
                brain.neurons.forEach(n => {
                    if (n.activation > 0.1) activeCount++;
                });
                console.log(`Active neurons: ${activeCount} / ${brain.neurons.length}`);
                console.log("First 10 colors:", img.slice(0, 10));
                
                attractorState.isRecalling = false;
                attractorState.phase = 'idle';
                
                if (onComplete) onComplete(img);
            }, 600);
            
        }, 1200);  // Longer stabilization time
        
    }, 1200);  // Longer convergence time
}

// ---------------------------------------------
//  ATTRACTOR HELPER FUNCTIONS
// ---------------------------------------------

function strengthenConnections() {
    // Hebbian learning: neurons that fire together, wire together
    brain.neurons.forEach(neuron => {
        const act1 = neuron.activation || 0;
        
        neuron.connections.forEach(conn => {
            const targetNeuron = brain.neurons[conn.target];
            const act2 = targetNeuron.activation || 0;
            
            // Increase weight if both neurons are active
            const deltaWeight = 0.1 * act1 * act2;
            conn.weight = Math.min(1.0, conn.weight + deltaWeight);
        });
    });
}

function propagateActivation(iterations) {
    for (let iter = 0; iter < iterations; iter++) {
        const newActivations = new Array(brain.neurons.length).fill(0);
        
        brain.neurons.forEach((neuron, i) => {
            let input = neuron.activation || 0;
            
            // Receive input from connected neurons
            neuron.connections.forEach(conn => {
                const sourceActivation = brain.neurons[conn.target].activation || 0;
                input += sourceActivation * conn.weight * 0.5;
            });
            
            // Apply sigmoid activation function
            newActivations[i] = sigmoid(input);
        });
        
        // Update activations
        brain.neurons.forEach((neuron, i) => {
            neuron.activation = newActivations[i];
        });
    }
}

function addSpontaneousNoise(strength) {
    brain.neurons.forEach(neuron => {
        // Add small random activation to break symmetry
        neuron.activation = (neuron.activation || 0) + (Math.random() - 0.5) * strength;
        neuron.activation = Math.max(0, Math.min(1, neuron.activation));
    });
}

function sigmoid(x) {
    return 1 / (1 + Math.exp(-4 * (x - 0.5)));
}

// ---------------------------------------------
//  MAIN SAVE/LOAD INTERFACE
// ---------------------------------------------

function saveToBrain(method, img, onComplete) {
    if (method === "attractor") {
        saveAttractorToBrain(img, null, onComplete);
    } else if (method === "hopfield") {
        saveHopfieldToBrain(img);
        if (onComplete) onComplete(true);
    } else {
        console.warn("Method '" + method + "' not implemented yet.");
        if (onComplete) onComplete(false);
    }
}

function loadFromBrain(method, onComplete) {
    if (method === "attractor") {
        loadAttractorFromBrain(null, onComplete);
    } else if (method === "hopfield") {
        const img = loadHopfieldFromBrain();
        if (onComplete) onComplete(img);
        return img;
    } else {
        console.warn("Method '" + method + "' not implemented yet.");
        if (onComplete) onComplete(null);
        return new Array(256).fill("rgb(0,0,0)");
    }
}

// ---------------------------------------------
//  HOPFIELD LEGACY FUNCTIONS (renamed)
// ---------------------------------------------

function saveHopfieldToBrain(img) {
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

    console.log("Saved full RGB colors to brain (Hopfield).");
}

function loadHopfieldFromBrain() {
    if (!hopfieldR || !hopfieldG || !hopfieldB) {
        console.warn("Brain is empty.");
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

// ---------------------------------------------
//  GET ATTRACTOR STATE (for visualization)
// ---------------------------------------------

function getAttractorState() {
    return attractorState;
}