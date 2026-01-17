// ---------------------------------------------
//  BRAIN VISUALIZATION - ENERGY FLOW & EFFECTS
// ---------------------------------------------

let visualizationState = {
    energyParticles: [],
    neuronPulses: new Map(),  // neuronId -> pulse data
    connectionPulses: [],
    lastUpdateTime: 0
};

// Configuration
const VIZ_CONFIG = {
    PARTICLE_SPEED: 0.02,
    PARTICLE_SIZE: 2,
    PARTICLE_GLOW: 8,
    PULSE_SPEED: 2.0,
    PULSE_MIN_SIZE: 0.8,
    PULSE_MAX_SIZE: 1.5,
    MAX_PARTICLES_PER_CONN: 3
};

// ---------------------------------------------
//  ENERGY PARTICLES
// ---------------------------------------------

class EnergyParticle {
    constructor(fromNeuron, toNeuron, weight) {
        this.from = fromNeuron;
        this.to = toNeuron;
        this.progress = 0;
        this.weight = weight;
        this.speed = VIZ_CONFIG.PARTICLE_SPEED * (0.8 + Math.random() * 0.4);
        this.color = this.getColorForWeight(weight);
    }
    
    getColorForWeight(w) {
        // Blue (weak) -> Cyan -> Green -> Yellow -> Red (strong)
        const intensity = Math.min(1, Math.max(0, w));
        
        if (intensity < 0.25) {
            // Blue to Cyan
            const t = intensity / 0.25;
            return `rgb(${Math.floor(100 * t)}, ${Math.floor(100 + 155 * t)}, 255)`;
        } else if (intensity < 0.5) {
            // Cyan to Green
            const t = (intensity - 0.25) / 0.25;
            return `rgb(${Math.floor(100 - 100 * t)}, 255, ${Math.floor(255 - 155 * t)})`;
        } else if (intensity < 0.75) {
            // Green to Yellow
            const t = (intensity - 0.5) / 0.25;
            return `rgb(${Math.floor(255 * t)}, 255, ${Math.floor(100 - 100 * t)})`;
        } else {
            // Yellow to Red
            const t = (intensity - 0.75) / 0.25;
            return `rgb(255, ${Math.floor(255 - 155 * t)}, 0)`;
        }
    }
    
    update(dt) {
        this.progress += this.speed * dt;
        return this.progress < 1.0;  // Return true if still alive
    }
    
    getPosition() {
        // Smooth interpolation
        const t = this.progress;
        const smoothT = t * t * (3 - 2 * t);  // Smoothstep
        
        return {
            x: this.from.x + (this.to.x - this.from.x) * smoothT,
            y: this.from.y + (this.to.y - this.from.y) * smoothT,
            z: this.from.z + (this.to.z - this.from.z) * smoothT
        };
    }
}

// ---------------------------------------------
//  NEURON PULSES
// ---------------------------------------------

class NeuronPulse {
    constructor(neuronId, activation) {
        this.neuronId = neuronId;
        this.activation = activation;
        this.phase = 0;
        this.frequency = 1.0 + activation * 2.0;  // Higher activation = faster pulse
    }
    
    update(dt) {
        this.phase += this.frequency * VIZ_CONFIG.PULSE_SPEED * dt;
        if (this.phase > Math.PI * 2) {
            this.phase -= Math.PI * 2;
        }
    }
    
    getSize() {
        const pulse = Math.sin(this.phase) * 0.5 + 0.5;  // 0 to 1
        return VIZ_CONFIG.PULSE_MIN_SIZE + pulse * (VIZ_CONFIG.PULSE_MAX_SIZE - VIZ_CONFIG.PULSE_MIN_SIZE);
    }
    
    getGlow() {
        const pulse = Math.sin(this.phase) * 0.5 + 0.5;
        return pulse * this.activation;
    }
}

// ---------------------------------------------
//  VISUALIZATION UPDATE
// ---------------------------------------------

function updateVisualization(dt) {
    // Update energy particles
    visualizationState.energyParticles = visualizationState.energyParticles.filter(p => p.update(dt));
    
    // Update neuron pulses
    visualizationState.neuronPulses.forEach(pulse => pulse.update(dt));
    
    // Spawn new particles if encoding/recalling
    const attractorState = getAttractorState();
    if (attractorState.isEncoding || attractorState.isRecalling) {
        spawnEnergyParticles();
    }
    
    // Update neuron pulses based on activation
    updateNeuronPulses();
}

function spawnEnergyParticles() {
    if (!brain.neurons || brain.neurons.length === 0) return;
    
    // Spawn particles on active connections
    brain.neurons.forEach(neuron => {
        const activation = neuron.activation || 0;
        
        if (activation > 0.1) {
            neuron.connections.forEach(conn => {
                // Probabilistic spawning based on activation
                if (Math.random() < activation * 0.1) {
                    const targetNeuron = brain.neurons[conn.target];
                    
                    // Limit particles per connection
                    const existingCount = visualizationState.energyParticles.filter(
                        p => p.from.id === neuron.id && p.to.id === targetNeuron.id
                    ).length;
                    
                    if (existingCount < VIZ_CONFIG.MAX_PARTICLES_PER_CONN) {
                        visualizationState.energyParticles.push(
                            new EnergyParticle(neuron, targetNeuron, conn.weight)
                        );
                    }
                }
            });
        }
    });
}

function updateNeuronPulses() {
    if (!brain.neurons) return;
    
    brain.neurons.forEach(neuron => {
        const activation = neuron.activation || 0;
        
        if (activation > 0.05) {
            // Create or update pulse
            if (!visualizationState.neuronPulses.has(neuron.id)) {
                visualizationState.neuronPulses.set(neuron.id, new NeuronPulse(neuron.id, activation));
            } else {
                const pulse = visualizationState.neuronPulses.get(neuron.id);
                pulse.activation = activation;
                pulse.frequency = 1.0 + activation * 2.0;
            }
        } else {
            // Remove pulse if activation too low
            visualizationState.neuronPulses.delete(neuron.id);
        }
    });
}

// ---------------------------------------------
//  GET VISUALIZATION DATA (for rendering)
// ---------------------------------------------

function getVisualizationData() {
    return {
        energyParticles: visualizationState.energyParticles,
        neuronPulses: visualizationState.neuronPulses,
        attractorState: getAttractorState()
    };
}

// ---------------------------------------------
//  CLEAR VISUALIZATION
// ---------------------------------------------

function clearVisualization() {
    visualizationState.energyParticles = [];
    visualizationState.neuronPulses.clear();
}