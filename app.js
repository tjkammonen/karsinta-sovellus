let state = JSON.parse(localStorage.getItem('karsinta_final_v1')) || [];

function sync() {
    localStorage.setItem('karsinta_final_v1', JSON.stringify(state));
    if (typeof draw === 'function') draw(); // Kutsuu ui.js:n piirtotoimintoa
}

function handleCreateRoom() {
    const name = document.getElementById('roomInput').value;
    if (!name) return;
    state.push({
        id: Date.now(),
        name: name,
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
        sync();
    }
}

function handleEditStartAmount(roomId, catId, delta) {
    const room = state.find(r => r.id === roomId);
    const cat = room.categories.find(c => c.id === catId);
    if (cat.locked) return;
    cat.start = Math.max(0, cat.start + delta);
    sync();
}

function handleUpdateRemoved(roomId, catId, delta) {
    const room = state.find(r => r.id === roomId);
    const cat = room.categories.find(c => c.id === catId);
    if (cat.locked) return;
    
    cat.removed = Math.max(0, cat.removed + delta);
    if (cat.removed > cat.start) cat.start = cat.removed;
    
    sync();
}

function handleToggleLock(roomId, catId) {
    const room = state.find(r => r.id === roomId);
    const cat = room.categories.find(c => c.id === catId);
    cat.locked = !cat.locked;
    sync();
}

function handleDeleteRoom(roomId) {
    const room = state.find(r => r.id === roomId);
    if (room.categories.some(cat => cat.locked)) {
        alert("Huoneessa on lukittuja kategorioita!");
        return;
    }
    if (confirm("Poistetaanko huone?")) {
        state = state.filter(r => r.id !== roomId);
        sync();
    }
}

function handleDeleteCat(roomId, catId) {
    const room = state.find(r => r.id === roomId);
    room.categories = room.categories.filter(c => c.id !== catId);
    sync();
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
            if (!r) { r = {id: Date.now()+i, name: cols[0], categories: []}; newState.push(r); }
            r.categories.push({id: Date.now()+i+100, name: cols[1], start: parseInt(cols[2])||0, removed: parseInt(cols[4])||0, locked: false});
        }
        state = newState; sync();
    };
    reader.readAsText(event.target.files[0]);
}