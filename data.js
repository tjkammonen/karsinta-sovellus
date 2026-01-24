// --- DATA.JS: Sovelluksen tila ja logiikka ---

// 1. Tilan alustus
let state = JSON.parse(localStorage.getItem('karsinta_final_v1')) || [];

// 2. Tallennus ja synkronointi
function sync() {
    localStorage.setItem('karsinta_final_v1', JSON.stringify(state));
    // Kutsuu piirtofunktiota, jos se on ladattu (render-main.js)
    if (typeof draw === 'function') draw();
}

function updateMeta(roomId) {
    const room = state.find(r => r.id === roomId);
    if (room) room.lastEdited = Date.now();
}

// 3. Toimintojen käsittelijät (Handlers)

function handleCreateRoom() {
    const nameInput = document.getElementById('modal-room-name');
    if (!nameInput) return;
    const name = nameInput.value;
    
    if (!name) { alert("Anna huoneelle nimi!"); return; }
    
    state.push({
        id: Date.now(),
        name: name,
        pinned: false,
        lastEdited: Date.now(),
        categories: [{ id: Date.now()+1, name: "Tavarat", start: 0, removed: 0, locked: false }]
    });
    
    sync();
    if (typeof closeAddRoomModal === 'function') closeAddRoomModal();
}

function handleAddCategory(roomId) {
    const nameInput = document.getElementById('modal-cat-name');
    const countInput = document.getElementById('modal-cat-start');
    if (!nameInput || !countInput) return;

    const name = nameInput.value;
    const count = parseInt(countInput.value);

    if (name && !isNaN(count)) {
        const room = state.find(r => r.id === roomId);
        if (room) {
            room.categories.push({ 
                id: Date.now(), name: name, start: count, removed: 0, locked: false 
            });
            updateMeta(roomId);
            sync();
            if (typeof closeAddCategoryModal === 'function') closeAddCategoryModal();
        }
    } else {
        alert("Täytä molemmat kentät!");
    }
}

function handleEditStartAmount(roomId, catId, delta) {
    const room = state.find(r => r.id === roomId);
    const cat = room.categories.find(c => c.id === catId);
    if (cat.locked) return;
    
    cat.start = Math.max(0, cat.start + delta);
    if (cat.removed > cat.start) cat.removed = cat.start;
    updateMeta(roomId);
    sync();
}

function handleUpdateRemoved(roomId, catId, delta) {
    const room = state.find(r => r.id === roomId);
    const cat = room.categories.find(c => c.id === catId);
    if (cat.locked) return;
    
    cat.removed = Math.max(0, cat.removed + delta);
    if (cat.removed > cat.start) cat.start = cat.removed;
    updateMeta(roomId);
    sync();
}

function handleToggleLock(roomId, catId) {
    const room = state.find(r => r.id === roomId);
    const cat = room.categories.find(c => c.id === catId);
    cat.locked = !cat.locked;
    updateMeta(roomId);
    sync();
}

function handleTogglePin(roomId) {
    const room = state.find(r => r.id === roomId);
    if (room.pinned === undefined) room.pinned = false;
    room.pinned = !room.pinned;
    updateMeta(roomId);
    sync();
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

function handleResetApp() {
    if (confirm("VAROITUS: Tämä poistaa kaikki tiedot lopullisesti. Haluatko jatkaa?")) {
        if (confirm("Oletko aivan varma?")) {
            state = [];
            sync();
            if (typeof closeSettingsModal === 'function') closeSettingsModal();
        }
    }
}

// 4. Tuonti / Vienti / Jako

function handleShareReport() {
    let totalGoal = 0, totalRem = 0;
    let roomText = "";

    state.forEach(room => {
        let rGoal = 0, rRem = 0;
        room.categories.forEach(c => {
            rGoal += Math.ceil(c.start/3); rRem += c.removed;
        });
        totalGoal += rGoal; totalRem += rRem;
        const rPerc = rGoal > 0 ? Math.round((rRem/rGoal)*100) : 0;
        roomText += `${rPerc >= 100 ? '✅' : '📦'} ${room.name}: ${rPerc}% (${rRem}/${rGoal})\n`;
    });

    const totalPerc = totalGoal > 0 ? Math.round((totalRem/totalGoal)*100) : 0;
    const text = `Karsinta-apurin tilanne 🏠\nKoko koti: ${totalPerc}% valmis (${totalRem}/${totalGoal})\n\nHuoneet:\n${roomText}\n_Lähetetty Karsinta-apurista_`;

    if (navigator.share) {
        navigator.share({ title: "Karsintatilanne", text: text }).catch(err => console.log(err));
    } else {
        navigator.clipboard.writeText(text).then(() => alert("Raportti kopioitu leikepöydälle!"));
    }
}

function handleCopyToClipboard() {
    const data = JSON.stringify(state);
    navigator.clipboard.writeText(data).then(() => {
        alert("✅ Tiedot kopioitu leikepöydälle!");
    }).catch(err => {
        prompt("Kopioi tästä:", data);
    });
}

function handleTextTransfer() {
    const currentData = JSON.stringify(state);
    const input = prompt("Kopioi tila tai liitä uusi:", currentData);
    if (input && input !== currentData) {
        try { state = JSON.parse(input); sync(); } catch(e) { alert("Virhe datassa!"); }
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
            if (!r) { 
                r = { id: Date.now()+i, name: cols[0], categories: [], pinned: false, lastEdited: Date.now() }; 
                newState.push(r); 
            }
            r.categories.push({
                id: Date.now()+i+100, name: cols[1], start: parseInt(cols[2])||0, removed: parseInt(cols[4])||0, locked: false
            });
        }
        state = newState; sync();
    };
    reader.readAsText(event.target.files[0]);
}