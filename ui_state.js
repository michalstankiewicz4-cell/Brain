console.log("ui_state.js loaded");

// ---------------------------------------------
//  STAN UI – ZAPIS / ODCZYT
// ---------------------------------------------

function saveUIState() {
    const rightPanel = document.getElementById("right-panel");
    const sections = Array.from(rightPanel.querySelectorAll(".section"));

    const order = sections.map(sec => sec.dataset.section);

    const collapsed = {};
    sections.forEach(sec => {
        const content = sec.querySelector(".section-content");
        collapsed[sec.dataset.section] = content.dataset.collapsed === "true";
    });

    const state = {
        panelWidth: currentPanelWidth,
        order,
        collapsed
    };

    try {
        localStorage.setItem("ui_state", JSON.stringify(state));
    } catch (e) {
        console.warn("Nie udało się zapisać stanu UI:", e);
    }
}

function loadUIState() {
    let state = null;
    try {
        const raw = localStorage.getItem("ui_state");
        if (raw) state = JSON.parse(raw);
    } catch (e) {
        console.warn("Nie udało się odczytać stanu UI:", e);
    }

    const rightPanel = document.getElementById("right-panel");
    const totalWidth = window.innerWidth;
    const maxWidth = totalWidth * MAX_PANEL_WIDTH_RATIO;

    if (state && typeof state.panelWidth === "number") {
        let w = state.panelWidth;
        if (w < MIN_PANEL_WIDTH) w = MIN_PANEL_WIDTH;
        if (w > maxWidth) w = maxWidth;
        currentPanelWidth = w;
        rightPanel.style.width = currentPanelWidth + "px";
    }

    if (state && Array.isArray(state.order)) {
        const map = {};
        Array.from(rightPanel.querySelectorAll(".section")).forEach(sec => {
            map[sec.dataset.section] = sec;
        });

        state.order.forEach(key => {
            if (map[key]) {
                rightPanel.appendChild(map[key]);
            }
        });
    }

    if (state && state.collapsed) {
        Array.from(rightPanel.querySelectorAll(".section")).forEach(sec => {
            const key = sec.dataset.section;
            const content = sec.querySelector(".section-content");
            const isCollapsed = !!state.collapsed[key];

            if (isCollapsed) {
                content.dataset.collapsed = "true";
                content.style.maxHeight = "0px";
            } else {
                content.dataset.collapsed = "false";
                content.style.maxHeight = content.scrollHeight + "px";
            }
        });
    }
}
