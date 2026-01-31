// --- DATA.JS: Sovelluksen tila ja logiikka ---

// 1. APUFUNKTIOT (Global)
// Estää XSS-hyökkäykset puhdistamalla HTML-merkit käyttäjän syötteistä
function escapeHtml(text) {
    if (!text) return "";
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Uniikki ID-generaattori (Palauttaa aina merkkijonon)
function generateId() {
    return typeof crypto.randomUUID === 'function' 
        ? crypto.randomUUID() 
        : Date.now() + '-' + Math.floor(Math.random() * 1000);
}

// 2. DATAN LATAUS JA MIGRAATIO
const rawState = JSON.parse(localStorage.getItem('karsinta_final_v1')) || [];

// Varmistetaan, että kaikki ID:t ovat merkkijonoja (String).
// Tämä korjaa vanhan datan (numerot) ja uuden datan (stringit) yhteensopivuuden.
let state = rawState.map(room => ({
    ...room,
    id: String(room.id),
    categories: room.categories.map(cat => ({
        ...cat,
        id: String(cat.id)
    }))
}));

function sync() {
    localStorage.setItem('karsinta_final_v1', JSON.stringify(state));
    if (typeof draw === 'function') draw();
}

function updateMeta(roomId) {
    // Nyt voimme käyttää turvallista === vertailua, koska kaikki ID:t ovat stringejä
    const room = state.find(r => r.id === roomId); 
    if (room) room.lastEdited = Date.now();
}

// --- Toiminnot ---

function handleCreateRoom() {
    const nameInput = document.getElementById('modal-room-name');
    if (!nameInput) return null;
    const name = nameInput.value.trim();
    
    if (!name) { alert("Nimi puuttuu!"); return null; }
    
    const newId = generateId();
    
    state.push({
        id: newId,
        name: name,
        pinned: false,
        lastEdited: Date.now(),
        categories: [{ id: generateId(), name: "Tavarat", start: 0, removed: 0, locked: false }]
    });
    
    sync();
    return newId;
}

function handleAddCategory(roomId) {
    const nameInput = document.getElementById('modal-cat-name');
    const countDisplay = document.getElementById('modal-cat-start');
    
    if (!nameInput || !countDisplay) return;

    const name = nameInput.value.trim();
    const count = parseInt(countDisplay.innerText);

    if (name && !isNaN(count)) {
        const room = state.find(r => r.id === roomId);
        if (room) {
            room.categories.push({ 
                id: generateId(), name: name, start: count, removed: 0, locked: false 
            });
            updateMeta(roomId);
            sync();
            if (typeof closeAddCategoryModal === 'function') closeAddCategoryModal();
        }
    } else {
        alert("Tiedot puuttuvat!");
    }
}

function handleEditStartAmount(roomId, catId, delta) {
    const room = state.find(r => r.id === roomId);
    const cat = room?.categories.find(c => c.id === catId);
    if (!cat || cat.locked) return;
    
    cat.start = Math.max(0, cat.start + delta);
    if (cat.removed > cat.start) cat.removed = cat.start;
    updateMeta(roomId);
    sync();
}

function handleUpdateRemoved(roomId, catId, delta) {
    const room = state.find(r => r.id === roomId);
    const cat = room?.categories.find(c => c.id === catId);
    if (!cat || cat.locked) return;
    
    cat.removed = Math.max(0, cat.removed + delta);
    if (cat.removed > cat.start) cat.start = cat.removed;
    updateMeta(roomId);
    sync();
}

function handleToggleLock(roomId, catId) {
    const room = state.find(r => r.id === roomId);
    const cat = room?.categories.find(c => c.id === catId);
    if (cat) {
        cat.locked = !cat.locked;
        updateMeta(roomId);
        sync();
    }
}

function handleTogglePin(roomId) {
    const room = state.find(r => r.id === roomId);
    if (room) {
        room.pinned = !room.pinned;
        updateMeta(roomId);
        sync();
    }
}

function handleDeleteRoom(roomId) {
    if (confirm("Poistetaanko huone ja kaikki sen tiedot?")) {
        state = state.filter(r => r.id !== roomId);
        sync();
    }
}

function handleDeleteCat(roomId, catId) {
    if (confirm("Poistetaanko kategoria?")) {
        const room = state.find(r => r.id === roomId);
        if (room) {
            room.categories = room.categories.filter(c => c.id !== catId);
            updateMeta(roomId);
            sync();
            if (typeof closeCategoryModal === 'function') closeCategoryModal();
        }
    }
}

function handleResetApp() {
    if (confirm("Nollataanko kaikki? Tätä ei voi perua.")) {
        state = [];
        sync();
        if (typeof closeSettingsModal === 'function') closeSettingsModal();
    }
}

// --- Raportointi & Vienti ---

function handleShareReport() {
    let totalGoal = 0, totalRem = 0;
    state.forEach(room => {
        room.categories.forEach(c => {
            totalGoal += Math.ceil(c.start/3); 
            totalRem += c.removed;
        });
    });
    
    const totalPerc = totalGoal > 0 ? Math.round((totalRem/totalGoal)*100) : 0;
    const roomStats = state.map(room => {
        let rGoal = 0, rRem = 0;
        room.categories.forEach(c => {
            rGoal += Math.ceil(c.start/3); 
            rRem += c.removed;
        });
        const rPerc = rGoal > 0 ? Math.round((rRem/rGoal)*100) : 0;
        return { name: room.name, perc: rPerc, rem: rRem, goal: rGoal, isDone: rPerc >= 100 };
    });

    roomStats.sort((a, b) => b.perc - a.perc);

    let roomText = "";
    roomStats.forEach(room => {
        roomText += `${room.isDone ? '✅' : '📦'} ${room.name}: ${room.perc} % (${room.rem}/${room.goal})\n`;
    });

    const text = `Karsi 33% 🏠\nYhteensä: ${totalPerc} % (${totalRem}/${totalGoal})\n\n${roomText}`;

    if (navigator.share) {
        navigator.share({ title: "Karsi 33%", text: text }).catch(err => console.log(err));
    } else {
        navigator.clipboard.writeText(text).then(() => alert("Kopioitu leikepöydälle!"));
    }
}

function handleCopyToClipboard() {
    const data = JSON.stringify(state);
    navigator.clipboard.writeText(data).then(() => {
        alert("✅ Data kopioitu!");
    }).catch(err => {
        prompt("Kopioi tästä:", data);
    });
}

function handleTextTransfer() {
    const currentData = JSON.stringify(state);
    const input = prompt("Liitä data tähän:", currentData);
    if (input && input !== currentData) {
        try { 
            const parsed = JSON.parse(input);
            if (Array.isArray(parsed)) {
                // Migraatio myös liitetylle datalle varmuuden vuoksi
                state = parsed.map(r => ({
                    ...r, 
                    id: String(r.id),
                    categories: r.categories.map(c => ({...c, id: String(c.id)}))
                }));
                sync();
            } else {
                throw new Error("Invalid format");
            }
        } catch(e) { 
            alert("Virheellinen data!"); 
        }
    }
}

function exportToCSV() {
    let csv = "Huone;Kategoria;Alku;Tavoite;Poistettu\n";
    state.forEach(r => r.categories.forEach(c => {
        const g = Math.ceil(c.start/3);
        csv += `${r.name};${c.name};${c.start};${g};${c.removed}\n`;
    }));
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], {type: 'text/csv'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'karsintaraportti.csv';
    a.click();
}

function importFromCSV(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const lines = e.target.result.split(/\r?\n/);
        const newState = [];
        for(let i=1; i<lines.length; i++) {
            const cols = lines[i].split(';');
            if (cols.length < 4 || !cols[0]) continue;
            
            // CSV tuonnissa varmistetaan myös string ID:t
            let r = newState.find(x => x.name === cols[0]);
            if (!r) { 
                r = { id: generateId(), name: cols[0], categories: [], pinned: false, lastEdited: Date.now() }; 
                newState.push(r); 
            }
            r.categories.push({
                id: generateId(), 
                name: cols[1] || "Tavarat", 
                start: parseInt(cols[2])||0, 
                removed: parseInt(cols[4])||0, 
                locked: false
            });
        }
        if (newState.length > 0) {
            state = newState; 
            sync(); 
        } else {
            alert("CSV-tiedostosta ei löytynyt tietoja.");
        }
    };
    reader.readAsText(file);
}