let state = JSON.parse(localStorage.getItem('karsinta_final_v1')) || [];

function sync() {
    localStorage.setItem('karsinta_final_v1', JSON.stringify(state));
    if (typeof draw === 'function') draw();
}

// APUFUNKTIO: Päivittää huoneen "viimeksi muokattu" -aikaleiman
function updateMeta(roomId) {
    const room = state.find(r => r.id === roomId);
    if (room) {
        room.lastEdited = Date.now();
    }
}

function handleCreateRoom() {
    const name = document.getElementById('roomInput').value;
    if (!name) return;
    state.push({
        id: Date.now(),
        name: name,
        // UUDET KENTÄT: pinned ja lastEdited
        pinned: false,
        lastEdited: Date.now(),
        categories: [{ id: Date.now()+1, name: "Tavarat", start: 0, removed: 0, locked: false }]
    });
    document.getElementById('roomInput').value = '';
    sync();
}

function handleAddCategory(roomId) {
    const nameInput = document.getElementById(`catName-${roomId}`);
    const countInput = document.getElementById(`catCount-${roomId}`);
    const name = nameInput.value;
    const count = parseInt(countInput.value);

    if (name && !isNaN(count)) {
        const room = state.find(r => r.id === roomId);
        room.categories.push({ id: Date.now(), name: name, start: count, removed: 0, locked: false });
        updateMeta(roomId); // Päivitä aika
        sync();
    }
}

function handleEditStartAmount(roomId, catId, delta) {
    const room = state.find(r => r.id === roomId);
    const cat = room.categories.find(c => c.id === catId);
    if (cat.locked) return;
    cat.start = Math.max(0, cat.start + delta);
    updateMeta(roomId); // Päivitä aika
    sync();
}

function handleUpdateRemoved(roomId, catId, delta) {
    const room = state.find(r => r.id === roomId);
    const cat = room.categories.find(c => c.id === catId);
    if (cat.locked) return;
    
    cat.removed = Math.max(0, cat.removed + delta);
    if (cat.removed > cat.start) cat.start = cat.removed;
    
    updateMeta(roomId); // Päivitä aika
    sync();
}

function handleToggleLock(roomId, catId) {
    const room = state.find(r => r.id === roomId);
    const cat = room.categories.find(c => c.id === catId);
    cat.locked = !cat.locked;
    updateMeta(roomId); // Päivitä aika
    sync();
}

// UUSI: Suosikin valinta
function handleTogglePin(roomId) {
    const room = state.find(r => r.id === roomId);
    // Varmistetaan että kenttä on olemassa (vanhat tallennukset)
    if (room.pinned === undefined) room.pinned = false;
    room.pinned = !room.pinned;
    updateMeta(roomId);
    sync();
}

// UUSI: Hyppää huoneeseen (Wildcard B)
function handleJumpToRoom(roomId) {
    // Varmistetaan että huone on auki UI:ssa
    // Huom: expandedState on ui.js:ssä, mutta voimme kutsua globaalia funktiota jos se on window-objektissa,
    // tai yksinkertaisemmin: annetaan ui.js:n hoitaa avaus piirron yhteydessä, me vain skrollaamme.
    const element = document.getElementById(`room-card-${roomId}`);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Korostetaan hetkeksi
        element.style.transition = "transform 0.3s";
        element.style.transform = "scale(1.02)";
        setTimeout(() => element.style.transform = "scale(1)", 300);
    }
}

function handleDeleteRoom(roomId) {
    if (confirm("Haluatko varmasti poistaa koko huoneen ja kaikki sen tiedot?")) {
        state = state.filter(r => r.id !== roomId);
        sync();
    }
}

function handleDeleteCat(roomId, catId) {
    if (confirm("Haluatko varmasti poistaa tämän kategorian?")) {
        const room = state.find(r => r.id === roomId);
        room.categories = room.categories.filter(c => c.id !== catId);
        updateMeta(roomId);
        sync();
    }
}

function handleTextTransfer() {
    const currentData = JSON.stringify(state);
    const input = prompt("Kopioi tila tai liitä uusi:", currentData);
    if (input && input !== currentData) {
        try {
            state = JSON.parse(input);
            sync();
        } catch(e) { alert("Virhe datassa!"); }
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
    const reader = new FileReader();
    reader.onload = (e) => {
        const lines = e.target.result.split('\n');
        const newState = [];
        for(let i=1; i<lines.length; i++) {
            const cols = lines[i].split(';');
            if (cols.length < 4) continue;
            let r = newState.find(x => x.name === cols[0]);
            if (!r) { r = {id: Date.now()+i, name: cols[0], categories: [], pinned: false, lastEdited: Date.now()}; newState.push(r); }
            r.categories.push({id: Date.now()+i+100, name: cols[1], start: parseInt(cols[2])||0, removed: parseInt(cols[4])||0, locked: false});
        }
        state = newState; sync();
    };
    reader.readAsText(event.target.files[0]);
}