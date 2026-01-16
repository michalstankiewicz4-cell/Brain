console.log("brain_memory.js loaded");

// prawa pamięć – miniatury

function saveMemory(imageData) {
    let list = JSON.parse(localStorage.getItem("memories") || "[]");
    list.push(imageData);
    localStorage.setItem("memories", JSON.stringify(list));
}

function loadMemories() {
    return JSON.parse(localStorage.getItem("memories") || "[]");
}

function deleteMemory(index) {
    let list = JSON.parse(localStorage.getItem("memories") || "[]");
    list.splice(index, 1);
    localStorage.setItem("memories", JSON.stringify(list));
}

function recallMemory(memory) {
    return memory;
}

// -------------------------
// ZAPIS / ODCZYT DO / Z MÓZGU
// -------------------------

// zapis do mózgu: obraz -> aktywacja neuronów
function saveToBrain(method, image) {
    // na razie ignorujemy "method" – fundament to aktywacja
    stimulateBrainFromImage(image);

    // opcjonalnie zachowujemy obraz w localStorage, żeby mieć podgląd
    localStorage.setItem("brain_saved_method", method);
    localStorage.setItem("brain_saved_image", JSON.stringify(image));
}

// odczyt z mózgu: aktywacja neuronów -> obraz
function loadFromBrain(method) {
    // na razie ignorujemy "method"
    const img = readImageFromBrain();
    return img;
}
