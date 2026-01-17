console.log("ui_panel.js loaded");

// ---------------------------------------------
//  PANEL BOCZNY – DRAG RESIZE
// ---------------------------------------------

function initPanelResizer() {
    const resizer = document.getElementById("panel-resizer");
    const rightPanel = document.getElementById("right-panel");

    let isDragging = false;
    let startX = 0;
    let startWidth = 0;

    resizer.addEventListener("mousedown", (e) => {
        isDragging = true;
        startX = e.clientX;
        startWidth = rightPanel.getBoundingClientRect().width;
        e.preventDefault();
    });

    window.addEventListener("mousemove", (e) => {
        if (!isDragging) return;

        const dx = e.clientX - startX;
        let newWidth = startWidth + dx;

        const totalWidth = window.innerWidth;
        const maxWidth = totalWidth * MAX_PANEL_WIDTH_RATIO;

        if (newWidth < MIN_PANEL_WIDTH) newWidth = MIN_PANEL_WIDTH;
        if (newWidth > maxWidth) newWidth = maxWidth;

        currentPanelWidth = newWidth;
        rightPanel.style.width = currentPanelWidth + "px";

        saveUIState();
    });

    window.addEventListener("mouseup", () => {
        isDragging = false;
    });
}

// ---------------------------------------------
//  SEKCJE – DRAG & COLLAPSE
// ---------------------------------------------

function initSectionsDragAndCollapse() {
    const panel = document.getElementById("right-panel");
    const sections = Array.from(panel.querySelectorAll(".section"));

    // collapsible
    sections.forEach(section => {
        const header = section.querySelector(".section-header");
        const title = header.querySelector(".collapsible-toggle");
        const content = section.querySelector(".section-content");

        content.style.maxHeight = content.scrollHeight + "px";

        title.addEventListener("click", () => {
            const isCollapsed = content.dataset.collapsed === "true";
            if (isCollapsed) {
                content.dataset.collapsed = "false";
                content.style.maxHeight = content.scrollHeight + "px";
            } else {
                content.dataset.collapsed = "true";
                content.style.maxHeight = "0px";
            }
            saveUIState();
        });
    });

    // drag & drop sekcji
    let draggedSection = null;

    sections.forEach(section => {
        const handle = section.querySelector(".drag-handle");

        handle.addEventListener("mousedown", (e) => {
            draggedSection = section;
            section.classList.add("dragging");
            e.preventDefault();
        });
    });

    panel.addEventListener("mousemove", (e) => {
        if (!draggedSection) return;

        const sections = Array.from(panel.querySelectorAll(".section"));
        const mouseY = e.clientY;

        let closest = null;
        let closestOffset = Number.NEGATIVE_INFINITY;

        sections.forEach(sec => {
            if (sec === draggedSection) return;
            const rect = sec.getBoundingClientRect();
            const offset = mouseY - (rect.top + rect.height / 2);
            if (offset < 0 && offset > closestOffset) {
                closestOffset = offset;
                closest = sec;
            }
        });

        if (!closest) {
            panel.appendChild(draggedSection);
        } else {
            panel.insertBefore(draggedSection, closest);
        }
    });

    window.addEventListener("mouseup", () => {
        if (draggedSection) {
            draggedSection.classList.remove("dragging");
            draggedSection = null;
            saveUIState();
        }
    });
}
