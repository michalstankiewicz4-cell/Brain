console.log("brain_render.js loaded");

function renderBrain(ctx, state) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    ctx.clearRect(0, 0, w, h);

    if (!state || !state.brain || state.brain.neurons.length === 0) {
        ctx.fillStyle = "#444";
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.fillText("No brain – use GENERATE BRAIN", w / 2, h / 2);
        return;
    }

    const neurons = state.brain.neurons;
    const angle = state.rotation || 0;

    const cx = w / 2;
    const cy = h / 2;
    const baseScale = Math.min(w, h) * 0.4;

    // Project 3D neurons to 2D screen
    const projected = neurons.map(n => {
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);

        const x = n.x * cosA - n.z * sinA;
        const z = n.x * sinA + n.z * cosA;
        const y = n.y;

        const depth = (z + 1.5) / 3;
        const s = baseScale * (0.4 + 0.6 * (1 - depth));

        const sx = cx + x * s;
        const sy = cy + y * s;

        return {
            id: n.id,
            sx,
            sy,
            depth,
            activation: n.activation,
            neuron: n,
            scale: s,
            x3d: { x, y, z }
        };
    });

    const projById = {};
    projected.forEach(p => {
        projById[p.id] = p;
    });

    // Get visualization data
    const vizData = getVisualizationData();

    // RENDER CONNECTIONS
    ctx.lineWidth = 1;
    ctx.save();
    ctx.globalAlpha = 0.4;

    projected.forEach(p => {
        const n = p.neuron;
        n.connections.forEach(conn => {
            const targetProj = projById[conn.target];
            if (!targetProj) return;

            const intensity = Math.min(1, Math.max(0, conn.weight));
            const col = Math.floor(80 + 175 * intensity);
            ctx.strokeStyle = `rgb(${col},${col},255)`;

            ctx.beginPath();
            ctx.moveTo(p.sx, p.sy);
            ctx.lineTo(targetProj.sx, targetProj.sy);
            ctx.stroke();
        });
    });

    ctx.restore();

    // RENDER ENERGY PARTICLES
    ctx.save();
    vizData.energyParticles.forEach(particle => {
        const pos3d = particle.getPosition();
        
        // Project particle position
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        const x = pos3d.x * cosA - pos3d.z * sinA;
        const z = pos3d.x * sinA + pos3d.z * cosA;
        const y = pos3d.y;
        
        const depth = (z + 1.5) / 3;
        const s = baseScale * (0.4 + 0.6 * (1 - depth));
        
        const px = cx + x * s;
        const py = cy + y * s;
        
        // Draw particle with glow
        const size = 2;
        
        // Glow
        const gradient = ctx.createRadialGradient(px, py, 0, px, py, 8);
        gradient.addColorStop(0, particle.color);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(px, py, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Core
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.restore();

    // RENDER NEURONS
    projected.forEach(p => {
        const baseSize = 3;
        let size = baseSize + (1 - p.depth) * 3;

        const act = p.activation || 0;
        const actClamped = Math.min(1, Math.max(0, act));

        // Check if neuron has a pulse
        const pulse = vizData.neuronPulses.get(p.id);
        if (pulse) {
            size *= pulse.getSize();
            
            // Draw glow for active neurons
            const glowIntensity = pulse.getGlow();
            if (glowIntensity > 0) {
                const glowSize = size * 3;
                const gradient = ctx.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, glowSize);
                
                const r = 80 + 175 * actClamped;
                const g = 120 + 100 * actClamped;
                
                gradient.addColorStop(0, `rgba(${r},${g},255,${glowIntensity * 0.5})`);
                gradient.addColorStop(1, 'rgba(0,0,0,0)');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(p.sx, p.sy, glowSize, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Neuron color based on activation
        const r = 80 + 175 * actClamped;
        const g = 120 + 100 * actClamped;
        const b = 255;

        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, size, 0, Math.PI * 2);
        ctx.fill();
    });

    // RENDER STATUS INFO (if encoding/recalling)
    if (vizData.attractorState.phase !== 'idle') {
        renderStatusInfo(ctx, w, h, vizData.attractorState);
    }
}

// ---------------------------------------------
//  STATUS INFO OVERLAY
// ---------------------------------------------

function renderStatusInfo(ctx, w, h, attractorState) {
    const padding = 20;
    const barWidth = 200;
    const barHeight = 20;
    
    ctx.save();
    
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(padding, padding, barWidth + 40, 80);
    
    // Title
    ctx.fillStyle = '#ffcc66';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    
    const phaseText = attractorState.phase.toUpperCase();
    ctx.fillText(phaseText, padding + 20, padding + 25);
    
    // Progress bar background
    ctx.fillStyle = '#333';
    ctx.fillRect(padding + 20, padding + 40, barWidth, barHeight);
    
    // Progress bar fill
    const progress = attractorState.progress;
    const fillWidth = barWidth * progress;
    
    // Gradient fill
    const gradient = ctx.createLinearGradient(padding + 20, 0, padding + 20 + fillWidth, 0);
    gradient.addColorStop(0, '#44ff44');
    gradient.addColorStop(0.5, '#ffcc66');
    gradient.addColorStop(1, '#ff4444');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(padding + 20, padding + 40, fillWidth, barHeight);
    
    // Progress text
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(progress * 100)}%`, padding + 20 + barWidth / 2, padding + 55);
    
    ctx.restore();
}