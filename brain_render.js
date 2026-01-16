console.log("brain_render.js loaded");

function renderBrain(ctx, state) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    ctx.clearRect(0, 0, w, h);

    if (!state || !state.brain || state.brain.neurons.length === 0) {
        ctx.fillStyle = "#444";
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Brak mózgu – użyj GENERUJ MÓZG", w / 2, h / 2);
        return;
    }

    const neurons = state.brain.neurons;
    const angle = state.rotation || 0;

    const cx = w / 2;
    const cy = h / 2;
    const baseScale = Math.min(w, h) * 0.4;

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
            neuron: n
        };
    });

    const projById = {};
    projected.forEach(p => {
        projById[p.id] = p;
    });

    // połączenia
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

    // neurony
    projected.forEach(p => {
        const baseSize = 3;
        const size = baseSize + (1 - p.depth) * 3;

        const act = p.activation || 0;
        const actClamped = Math.min(1, Math.max(0, act));

        const r = 80 + 175 * actClamped;
        const g = 120 + 100 * actClamped;
        const b = 255;

        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, size, 0, Math.PI * 2);
        ctx.fill();
    });
}
