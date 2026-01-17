console.log("main.js loaded");

window.onload = () => {
    initBrain3D();
    initPixelEditor();
    initUI();

    const canvas = document.getElementById("brain-canvas");
    const ctx = canvas.getContext("2d");

    function resize() {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
    }

    window.addEventListener("resize", resize);
    resize();

    function loop() {
        const dt = 0.016;  // ~60 FPS
        
        updateBrain3D(dt);
        updateVisualization(dt);  // Update energy particles and pulses
        
        renderBrain(ctx, getBrainState());
        requestAnimationFrame(loop);
    }

    loop();
};
