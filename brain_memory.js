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
    energyParticles: [],  // for visualization
    storedPattern: null   // BACKUP: Store activation pattern directly
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
            
            // PHASE 3: SKIP PROPAGATION - Preserve exact pattern from encoding
            console.log("PHASE 3: Preserving activation pattern (no propagation)...");
            // NO propagateActivation() - it blurs the color pattern!
            
            setTimeout(() => {
                attractorState.phase = 'complete';
                attractorState.progress = 1.0;
                attractorState.isEncoding = false;
                
                // BACKUP: Store final activation pattern
                attractorState.storedPattern = brain.neurons.map(n => n.activation || 0);
                console.log("PHASE 4: Encoding complete! Pattern stored in neural structure.");
                console.log("Stored pattern backup with", attractorState.storedPattern.filter(a => a > 0.1).length, "active neurons");
                
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

    if (!attractorState.storedPattern) {
        console.warn("No pattern stored! Save something first.");
        if (onComplete) onComplete(new Array(256).fill("rgb(0,0,0)"));
        return;
    }

    attractorState.isRecalling = true;
    attractorState.phase = 'recalling';
    attractorState.progress = 0;

    // PHASE 1: LOAD STORED PATTERN - Restore from backup
    console.log("PHASE 1: Loading stored pattern...");
    clearActivations();
    
    // Restore activations from stored pattern
    brain.neurons.forEach((neuron, i) => {
        if (i < attractorState.storedPattern.length) {
            neuron.activation = attractorState.storedPattern[i];
        }
    });
    
    const activeAfterLoad = brain.neurons.filter(n => n.activation > 0.1).length;
    console.log(`Loaded ${activeAfterLoad} active neurons from stored pattern`);
    
    setTimeout(() => {
        attractorState.phase = 'converging';
        attractorState.progress = 0.33;
        
        // PHASE 2: SKIP PROPAGATION - Pattern is already correct!
        console.log("PHASE 2: Pattern loaded (skipping propagation to preserve accuracy)...");
        // NO propagateActivation() - it blurs the pattern!
        
        setTimeout(() => {
            attractorState.progress = 0.66;
            
            // PHASE 3: SKIP STABILIZATION - Not needed
            console.log("PHASE 3: Pattern ready...");
            // NO propagateActivation() - keep original pattern!
            
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
            
        }, 800);
        
    }, 1000);
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

function propagateWithDecay(iterations, decay) {
    for (let iter = 0; iter < iterations; iter++) {
        const newActivations = new Array(brain.neurons.length).fill(0);
        
        brain.neurons.forEach((neuron, i) => {
            let input = neuron.activation * decay; // Self-decay
            
            // Receive input from connected neurons
            neuron.connections.forEach(conn => {
                const sourceActivation = brain.neurons[conn.target].activation || 0;
                input += sourceActivation * conn.weight * 0.3; // Reduced influence
            });
            
            // Apply sigmoid with threshold
            const activated = sigmoid(input);
            newActivations[i] = activated > 0.3 ? activated : 0; // Threshold!
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
//  PURE ATTRACTOR - TRUE NEURAL MEMORY
//  (No backup, pattern stored only in connection weights)
// ---------------------------------------------

function savePureAttractorToBrain(img, onProgress, onComplete) {
    if (!brain.neurons || brain.neurons.length === 0) {
        console.warn("No brain generated. Please generate brain first.");
        if (onComplete) onComplete(false);
        return;
    }

    attractorState.isEncoding = true;
    attractorState.phase = 'encoding';
    attractorState.progress = 0;

    // PHASE 1: ENCODING - Activate input neurons
    console.log("PURE ATTRACTOR - PHASE 1: Encoding image to neurons...");
    stimulateBrainFromImage(img);
    
    setTimeout(() => {
        attractorState.phase = 'strengthening';
        attractorState.progress = 0.33;
        
        // PHASE 2: STRONG HEBBIAN LEARNING - Critical for pure attractor!
        console.log("PURE ATTRACTOR - PHASE 2: Strong Hebbian learning (NO backup!)...");
        strongHebbian(0.5); // Much stronger learning rate
        
        setTimeout(() => {
            attractorState.phase = 'reinforcing';
            attractorState.progress = 0.66;
            
            // PHASE 3: REINFORCEMENT - Multiple Hebbian passes
            console.log("PURE ATTRACTOR - PHASE 3: Reinforcing pattern in weights...");
            strongHebbian(0.3);
            strongHebbian(0.2);
            
            setTimeout(() => {
                attractorState.phase = 'complete';
                attractorState.progress = 1.0;
                attractorState.isEncoding = false;
                
                // NO BACKUP - Pattern stored ONLY in connection weights!
                console.log("PURE ATTRACTOR - PHASE 4: Pattern stored in connection weights only!");
                const activeCount = brain.neurons.filter(n => (n.activation || 0) > 0.1).length;
                console.log(`Training complete: ${activeCount} active neurons, weights updated`);
                
                if (onComplete) onComplete(true);
            }, 1000);
            
        }, 1200);
        
    }, 1200);
}

function loadPureAttractorFromBrain(onProgress, onComplete) {
    if (!brain.neurons || brain.neurons.length === 0) {
        console.warn("No brain generated.");
        if (onComplete) onComplete(null);
        return;
    }

    attractorState.isRecalling = true;
    attractorState.phase = 'recalling';
    attractorState.progress = 0;

    // PHASE 1: RANDOM INITIALIZATION - Start from noise
    console.log("PURE ATTRACTOR - PHASE 1: Starting from random noise...");
    clearActivations();
    addSpontaneousNoise(0.4); // Higher noise to explore state space
    
    setTimeout(() => {
        attractorState.phase = 'converging';
        attractorState.progress = 0.2;
        
        // PHASE 2: HEAVY CONVERGENCE - Let network find attractor with decay
        console.log("PURE ATTRACTOR - PHASE 2: Converging to attractor (20 iterations with decay)...");
        propagateWithDecay(20, 0.9); // Decay to prevent runaway activation
        
        setTimeout(() => {
            attractorState.progress = 0.5;
            
            // PHASE 3: DEEP STABILIZATION - Lock into pattern
            console.log("PURE ATTRACTOR - PHASE 3: Deep stabilization (15 iterations with decay)...");
            propagateWithDecay(15, 0.95); // Less decay for stabilization
            
            setTimeout(() => {
                attractorState.progress = 0.8;
                
                // PHASE 4: FINAL REFINEMENT
                console.log("PURE ATTRACTOR - PHASE 4: Final refinement (10 iterations)...");
                propagateWithDecay(10, 0.98); // Very light decay
                
                setTimeout(() => {
                    attractorState.phase = 'reading';
                    attractorState.progress = 1.0;
                    
                    // READ OUT - Extract pattern from converged state
                    console.log("PURE ATTRACTOR - PHASE 5: Reading converged pattern...");
                    const img = readImageFromBrain();
                    
                    // DEBUG
                    let activeCount = 0;
                    brain.neurons.forEach(n => {
                        if (n.activation > 0.1) activeCount++;
                    });
                    console.log(`Converged state: ${activeCount} / ${brain.neurons.length} active neurons`);
                    console.log("First 10 colors:", img.slice(0, 10));
                    
                    attractorState.isRecalling = false;
                    attractorState.phase = 'idle';
                    
                    if (onComplete) onComplete(img);
                }, 1000);
                
            }, 1500);
            
        }, 1500);
        
    }, 1200);
}

// Strong Hebbian learning with configurable rate
function strongHebbian(learningRate) {
    brain.neurons.forEach(neuron => {
        const act1 = neuron.activation || 0;
        
        neuron.connections.forEach(conn => {
            const targetNeuron = brain.neurons[conn.target];
            const act2 = targetNeuron.activation || 0;
            
            // Strong weight increase when both active
            const deltaWeight = learningRate * act1 * act2;
            conn.weight = Math.min(1.0, conn.weight + deltaWeight);
            
            // Weight decay when both inactive (anti-Hebbian)
            if (act1 < 0.1 && act2 < 0.1) {
                conn.weight = Math.max(0.0, conn.weight - learningRate * 0.05);
            }
        });
    });
}

// ---------------------------------------------
//  MAIN SAVE/LOAD INTERFACE
// ---------------------------------------------

function saveToBrain(method, img, onComplete) {
    if (method === "attractor") {
        saveAttractorToBrain(img, null, onComplete);
    } else if (method === "pure-attractor") {
        savePureAttractorToBrain(img, null, onComplete);
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
    } else if (method === "pure-attractor") {
        loadPureAttractorFromBrain(null, onComplete);
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