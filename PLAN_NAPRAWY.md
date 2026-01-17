# PLAN NAPRAWY - PROJEKT BRAIN

Data: 2026-01-17
Cel: Pełna funkcjonalność przepływu: GENERUJ MÓZG → RYSUJ → ZAPISZ → ODTWÓRZ

---

## ETAP 1: UNIFIKACJA FORMATÓW KOLORÓW ⚡ PRIORYTET

**Cel:** Jeden spójny format kolorów w całym projekcie

### 1.1. Wybór formatu docelowego: `"rgb(r,g,b)"`
- ✓ Już używany w `pixel_editor.js`
- ✓ Już używany w `brain_memory.js`
- Wymaga zmiany w `brain3d.js`

### 1.2. Zmiany w `brain3d.js`
**Plik:** `brain3d.js`
**Linie do zmiany:** 79, 104

```javascript
// PRZED (linia 79):
if (col && col !== "#00000000") {

// PO:
if (col && col !== "rgb(0,0,0)") {
```

```javascript
// PRZED (linia 104):
img[i] = "#00000000";

// PO:
img[i] = "rgb(0,0,0)";
```

**Status:** DO WYKONANIA

---

## ETAP 2: DODANIE WYBORU KOLORU ⚡ PRIORYTET

**Cel:** Działający edytor kolorów

### 2.1. Inicjalizacja zmiennej `currentColor`
**Plik:** `pixel_editor.js`
**Dodać na początku pliku (po linii 1):**

```javascript
let currentColor = "#ffffff"; // domyślny biały
```

### 2.2. Event listenery dla palety
**Plik:** `pixel_editor.js`
**Dodać w funkcji `initPixelEditor()` (po linii 14):**

```javascript
const swatches = document.querySelectorAll('.color-swatch');
swatches.forEach(swatch => {
    swatch.addEventListener('click', () => {
        currentColor = swatch.dataset.col;
        // opcjonalnie: wizualne zaznaczenie wybranego koloru
        swatches.forEach(s => s.classList.remove('selected'));
        swatch.classList.add('selected');
    });
});
```

### 2.3. CSS dla zaznaczenia (opcjonalnie)
**Plik:** `style.css`
**Dodać:**

```css
.color-swatch.selected {
    border: 2px solid #ffcc00;
    box-shadow: 0 0 6px #ffcc00;
}
```

**Status:** DO WYKONANIA

---

## ETAP 3: POŁĄCZENIE STRUKTUR 3D Z ZAPISEM/ODCZYTEM ⚡⚡ KRYTYCZNE

**Cel:** Obrazy zapisywane do neuronów 3D z wizualizacją

### 3.1. Podpięcie `stimulateBrainFromImage()` do przycisku
**Plik:** `ui_core.js`
**Linia:** 43-47 (funkcja `btn-brain-save.onclick`)

```javascript
// OBECNY KOD:
document.getElementById("btn-brain-save").onclick = () => {
    const saveMethod = document.getElementById("save-method").value;
    const img = getPixelImage();
    saveToBrain(saveMethod, img);
};

// NOWY KOD:
document.getElementById("btn-brain-save").onclick = () => {
    const saveMethod = document.getElementById("save-method").value;
    const img = getPixelImage();
    
    // KROK 1: Zapisz do Hopfield (istniejąca funkcjonalność)
    saveToBrain(saveMethod, img);
    
    // KROK 2: Aktywuj neurony 3D (NOWE!)
    stimulateBrainFromImage(img);
    
    console.log("Obraz zapisany do mózgu i neuronów 3D");
};
```

### 3.2. Podpięcie `readImageFromBrain()` do przycisku
**Plik:** `ui_core.js`
**Linia:** 49-53 (funkcja `btn-brain-load.onclick`)

```javascript
// OBECNY KOD:
document.getElementById("btn-brain-load").onclick = () => {
    const loadMethod = document.getElementById("load-method").value;
    const img = loadFromBrain(loadMethod);
    drawBrainOutput(img);
};

// NOWY KOD:
document.getElementById("btn-brain-load").onclick = () => {
    const loadMethod = document.getElementById("load-method").value;
    
    let img;
    
    if (loadMethod === "direct") {
        // Odczyt bezpośrednio z neuronów 3D
        img = readImageFromBrain();
    } else {
        // Odczyt z Hopfield (istniejąca metoda)
        img = loadFromBrain(loadMethod);
    }
    
    drawBrainOutput(img);
    console.log("Obraz odtworzony z mózgu");
};
```

**Status:** DO WYKONANIA

---

## ETAP 4: IMPLEMENTACJA METODY "direct"

**Cel:** Bezpośredni zapis/odczyt z neuronów 3D

### 4.1. Modyfikacja `brain_memory.js`
**Dodać na początku pliku:**

```javascript
// Metoda "direct" - używa neuronów 3D bezpośrednio
function saveDirectToBrain(img) {
    stimulateBrainFromImage(img);
    console.log("Zapis bezpośredni do neuronów 3D");
}

function loadDirectFromBrain() {
    const img = readImageFromBrain();
    console.log("Odczyt bezpośredni z neuronów 3D");
    return img;
}
```

### 4.2. Modyfikacja funkcji `saveToBrain()`
**Plik:** `brain_memory.js`
**Linia:** 60-65

```javascript
function saveToBrain(method, img) {
    if (method === "direct") {
        saveDirectToBrain(img);
        return;
    }
    
    if (method !== "hopfield") {
        console.warn("Metoda 'hebb' nie jest jeszcze zaimplementowana.");
        return;
    }
    
    // ... reszta kodu Hopfield
}
```

### 4.3. Modyfikacja funkcji `loadFromBrain()`
**Plik:** `brain_memory.js`
**Linia:** 98-104

```javascript
function loadFromBrain(method) {
    if (method === "direct") {
        return loadDirectFromBrain();
    }
    
    if (method !== "hopfield") {
        console.warn("Metoda 'hebb' nie jest jeszcze zaimplementowana.");
        return new Array(256).fill("rgb(0,0,0)");
    }
    
    // ... reszta kodu Hopfield
}
```

**Status:** DO WYKONANIA

---

## ETAP 5: IMPLEMENTACJA METODY "hebb" (OPCJONALNIE)

**Cel:** Uczenie Hebbiańskie jako alternatywa

### 5.1. Klasa Hebbian Network
**Plik:** `brain_memory.js`
**Dodać przed funkcją `saveToBrain()`:**

```javascript
function HebbNetwork(size) {
    this.size = size;
    this.weights = Array.from({ length: size }, () => Array(size).fill(0));
}

HebbNetwork.prototype.train = function(pattern) {
    for (let i = 0; i < this.size; i++) {
        for (let j = 0; j < this.size; j++) {
            if (i !== j) {
                this.weights[i][j] += pattern[i] * pattern[j];
            }
        }
    }
};

HebbNetwork.prototype.recall = function(input) {
    const output = new Array(this.size);
    for (let i = 0; i < this.size; i++) {
        let sum = 0;
        for (let j = 0; j < this.size; j++) {
            sum += this.weights[i][j] * input[j];
        }
        output[i] = sum >= 0 ? 1 : -1;
    }
    return output;
};
```

### 5.2. Zmienne globalne
```javascript
let hebbNetworkR = null;
let hebbNetworkG = null;
let hebbNetworkB = null;
```

### 5.3. Obsługa w `saveToBrain()` i `loadFromBrain()`
Similar to Hopfield but using HebbNetwork class

**Status:** OPCJONALNE (może być później)

---

## ETAP 6: DENDRYTY - STRUKTURA NEURONU

**Cel:** Dendryty jako wejścia neuronu

### 6.1. Modyfikacja struktury neuronu
**Plik:** `brain3d.js`

```javascript
// OBECNIE:
brain.neurons.push({
    id: i,
    x: pos.x,
    y: pos.y,
    z: pos.z,
    connections: [],  // wyjścia (aksony)
    activation: 0
});

// NOWA STRUKTURA:
brain.neurons.push({
    id: i,
    x: pos.x,
    y: pos.y,
    z: pos.z,
    dendrites: [],    // NOWE: wejścia
    connections: [],  // wyjścia (aksony)
    activation: 0
});
```

### 6.2. Generowanie dendrytów
**Dodać w `generateBrain()` po utworzeniu neuronów:**

```javascript
// Dodanie dendrytów
for (let i = 0; i < count; i++) {
    const n = brain.neurons[i];
    for (let d = 0; d < dendrites; d++) {
        let source = randInt(0, count - 1);
        if (source === i) source = (source + 1) % count;
        n.dendrites.push({ source });
    }
}
```

**Status:** DO ROZWAŻENIA (czy potrzebne do podstawowej funkcjonalności?)

---

## ETAP 7: POPRAWKI DROBNE

### 7.1. Naprawa `setPixelImage()`
**Plik:** `pixel_editor.js`
**Linia:** 58-68

```javascript
function setPixelImage(img) {
    // Najpierw wyczyść cały canvas na czarno
    pixelCtx.fillStyle = "rgb(0,0,0)";
    pixelCtx.fillRect(0, 0, 64, 64);

    // Następnie narysuj tylko niezerowe piksele
    for (let i = 0; i < 256; i++) {
        const col = img[i];
        if (col !== "rgb(0,0,0)") {
            const x = (i % 16) * 4;
            const y = Math.floor(i / 16) * 4;
            pixelCtx.fillStyle = col;
            pixelCtx.fillRect(x, y, 4, 4);
        }
    }
}
```

**Status:** DO WYKONANIA

---

## KOLEJNOŚĆ WYKONANIA (REKOMENDOWANA)

### ✅ FAZA 1 - PODSTAWY (1-2h)
1. ✓ Analiza błędów (DONE)
2. ETAP 1: Unifikacja formatów kolorów
3. ETAP 2: Wybór koloru w edytorze
4. ETAP 7.1: Naprawa setPixelImage()

### ✅ FAZA 2 - GŁÓWNA FUNKCJONALNOŚĆ (2-3h)
5. ETAP 3.1: Podpięcie stimulateBrainFromImage()
6. ETAP 3.2: Podpięcie readImageFromBrain()
7. ETAP 4: Implementacja metody "direct"

### ✅ FAZA 3 - ROZSZERZENIA (opcjonalnie)
8. ETAP 5: Metoda "hebb"
9. ETAP 6: Dendryty

---

## TEST KOŃCOWY

Po wykonaniu Fazy 1 i 2, przepływ powinien działać:

```
1. Kliknij "GENERUJ MÓZG" → zobaczysz wirującą kulę neuronów
2. Narysuj coś w edytorze 16×16
3. Kliknij "ZAPISZ DO MÓZGU" → neurony się zaświecą (aktywacja)
4. Kliknij "ODTWÓRZ Z MÓZGU" → obraz pojawi się w "brain-output"
5. Wizualizacja 3D pokazuje aktywne neurony
```

---

## PYTANIA DO USERA

1. Czy chcesz rozpocząć od Fazy 1?
2. Czy dendryty są ważne dla wizualizacji czy możemy je pominąć?
3. Czy metoda "hebb" jest potrzebna czy wystarczy "direct" + "hopfield"?
