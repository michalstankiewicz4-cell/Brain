# ATTRACTOR DYNAMICS - DOCUMENTATION

Date: 2026-01-17
Status: ✅ IMPLEMENTED

---

## 🎯 **OVERVIEW**

Attractor Dynamics is an adaptive neural memory system that:
- **Automatically adjusts** to the generated brain structure
- **Uses real neuron connections** (not artificial weight matrices)
- **Visualizes energy flow** during encoding/recall
- **Simulates cascading activation** through the network

---

## 🧠 **HOW IT WORKS**

### **ENCODING (Save to Brain)**

**Phase 1: ENCODING** (1.2s)
- Image pixels → neuron activations
- Uses existing `stimulateBrainFromImage()` function
- Visualization: Initial activation wave

**Phase 2: STRENGTHENING** (1.0s)
- Hebbian learning: "Neurons that fire together, wire together"
- Connection weights increase when both neurons are active
- Formula: `Δweight = 0.1 × activation₁ × activation₂`
- Visualization: Pulsing connections

**Phase 3: PROPAGATION** (0.8s)
- Activation spreads through network (5 iterations)
- Each neuron receives input from connected neurons
- Sigmoid activation function for smooth transitions
- Visualization: Energy particles flowing

**Phase 4: COMPLETE**
- Pattern stored in neural structure
- Visualization: Status overlay shows progress

### **RECALL (Load from Brain)**

**Phase 1: SPONTANEOUS ACTIVATION** (1.0s)
- Add random noise (strength 0.3) to break symmetry
- Prevents network from staying in inactive state
- Visualization: Scattered activation begins

**Phase 2: CONVERGENCE** (1.0s)
- Network settles into learned pattern (10 iterations)
- Strongly connected neurons activate each other
- Weak connections gradually fade
- Visualization: Energy flowing to stable pattern

**Phase 3: STABILIZATION** (1.0s)
- Final refinement (5 iterations)
- Pattern locks into attractor state
- Visualization: Pulsing slows down

**Phase 4: READING** (0.6s)
- Extract pattern from neuron activations
- Uses `readImageFromBrain()` function
- Returns RGB image array

---

## 🎨 **VISUALIZATION FEATURES**

### **Energy Particles**
- **Color gradient**: Blue (weak) → Cyan → Green → Yellow → Red (strong)
- **Speed**: Varies by connection weight
- **Smooth movement**: Smoothstep interpolation
- **Glow effect**: Radial gradient around particles
- **Limit**: Max 3 particles per connection

### **Neuron Pulses**
- **Size pulsing**: 0.8x to 1.5x base size
- **Frequency**: Higher activation = faster pulsing (1.0 - 3.0 Hz)
- **Glow**: Increases with activation level
- **Phase-based**: Smooth sine wave animation

### **Status Overlay**
- **Phase indicator**: Shows current operation
- **Progress bar**: 0-100% with gradient colors
- **Background**: Semi-transparent black panel
- **Auto-hide**: Disappears when idle

---

## 📐 **ALGORITHM DETAILS**

### **Propagation Function**
```javascript
for each iteration:
    for each neuron i:
        input = current_activation[i]
        
        for each connection from neuron i:
            target_activation = neurons[conn.target].activation
            input += target_activation × conn.weight × 0.5
        
        new_activation[i] = sigmoid(input)
    
    update all activations
```

### **Sigmoid Activation**
```javascript
sigmoid(x) = 1 / (1 + exp(-4 × (x - 0.5)))
```
- Centered at 0.5
- Steepness factor: 4
- Output range: 0 to 1

### **Hebbian Learning**
```javascript
for each neuron:
    for each connection:
        Δweight = 0.1 × activation₁ × activation₂
        new_weight = min(1.0, old_weight + Δweight)
```

---

## ⚙️ **CONFIGURATION**

### **Visualization Config** (`brain_visualization.js`)
```javascript
const VIZ_CONFIG = {
    PARTICLE_SPEED: 0.02,        // Base particle velocity
    PARTICLE_SIZE: 2,            // Core particle radius
    PARTICLE_GLOW: 8,            // Glow radius
    PULSE_SPEED: 2.0,            // Pulsation frequency multiplier
    PULSE_MIN_SIZE: 0.8,         // Minimum pulse size (×base)
    PULSE_MAX_SIZE: 1.5,         // Maximum pulse size (×base)
    MAX_PARTICLES_PER_CONN: 3    // Particle spawn limit
};
```

### **Timing** (`brain_memory.js`)
- Encoding Phase 1: 1200ms
- Encoding Phase 2: 1000ms
- Encoding Phase 3: 800ms
- Recall Phase 1: 1000ms
- Recall Phase 2: 1000ms
- Recall Phase 3: 1000ms
- Recall Phase 4: 600ms

**Total:**
- Encoding: ~3 seconds
- Recall: ~3.6 seconds

---

## 🔧 **API**

### **Save to Brain**
```javascript
saveToBrain(method, img, onComplete)
```
- `method`: "attractor" | "hopfield"
- `img`: Array[256] of RGB color strings
- `onComplete`: Callback function(success: boolean)

### **Load from Brain**
```javascript
loadFromBrain(method, onComplete)
```
- `method`: "attractor" | "hopfield"
- `onComplete`: Callback function(img: Array[256] | null)

### **Get Attractor State**
```javascript
getAttractorState()
```
Returns:
```javascript
{
    isEncoding: boolean,
    isRecalling: boolean,
    phase: 'idle' | 'encoding' | 'strengthening' | 'recalling' | 'converging',
    progress: 0.0 - 1.0,
    energyParticles: Array
}
```

### **Get Visualization Data**
```javascript
getVisualizationData()
```
Returns:
```javascript
{
    energyParticles: Array<EnergyParticle>,
    neuronPulses: Map<neuronId, NeuronPulse>,
    attractorState: Object
}
```

---

## 📊 **PERFORMANCE**

- **60 FPS** target frame rate
- **Particle culling**: Old particles automatically removed
- **Pulse management**: Only active neurons pulse
- **Efficient rendering**: Single pass for all effects

---

## 🎮 **USER EXPERIENCE**

### **Workflow**
1. Generate brain (GENERATE BRAIN button)
2. Draw image in 16×16 editor
3. Select "Attractor Dynamics" as save method
4. Click "SAVE TO BRAIN"
   - Watch encoding animation (~3s)
   - See energy particles flowing
   - See neurons pulsing
5. Click "LOAD FROM BRAIN"
   - Watch recall animation (~3.6s)
   - Pattern appears in "brain-output" canvas

### **Visual Feedback**
- Status overlay shows current phase
- Progress bar indicates completion
- Energy particles show information flow
- Neuron pulsing shows activation level
- Colors indicate connection strength

---

## 🔬 **SCIENTIFIC BASIS**

### **Hopfield Networks**
- Energy-based attractor dynamics
- Patterns stored as stable states
- Network converges to nearest attractor

### **Hebbian Learning**
- "Fire together, wire together"
- Biological learning rule
- Unsupervised learning

### **Neural Dynamics**
- Activation propagation
- Sigmoid neurons
- Recurrent connections

---

## 🚀 **FUTURE ENHANCEMENTS**

Possible improvements:
1. **Adjustable speed** (user configurable)
2. **Multiple patterns** (pattern storage limit)
3. **Pattern interference** (when multiple patterns interact)
4. **Energy decay** (gradual activation fade)
5. **Learning rate** (adjustable Hebbian strength)
6. **Noise tolerance** (robustness to degraded input)

---

## 📝 **FILES MODIFIED**

1. **brain_memory.js** - Core attractor logic
2. **brain_visualization.js** - NEW - Visual effects
3. **brain_render.js** - Rendering with particles
4. **main.js** - Update loop integration
5. **ui_core.js** - Async callbacks
6. **index.html** - Script includes, option labels

---

## ✅ **TESTING CHECKLIST**

- [x] Syntax check (no errors)
- [ ] Generate brain works
- [ ] Encoding animation plays
- [ ] Recall animation plays
- [ ] Energy particles appear
- [ ] Neuron pulses work
- [ ] Status overlay shows
- [ ] Pattern actually saves
- [ ] Pattern actually recalls
- [ ] Hopfield still works (backward compatibility)

---

**Ready to test!** 🎉