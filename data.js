// --- DATA.JS: Sovelluksen tila ja logiikka ---

// 1. APUFUNKTIOT (Global)
function escapeHtml(text) {
    if (!text) return "";
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function generateId() {
    return typeof crypto.randomUUID === 'function' 
        ? crypto.randomUUID() 
        : Date.now() + '-' + Math.floor(Math.random() * 1000);
}

// --- HUONEPOHJAT (TEMPLATES) ---
const ROOM_TEMPLATES = {
    'empty': { 
        label: 'Tyhjä huone (Aloita nollasta)', 
        categories: ['Tavarat'] 
    },
    'bedroom': { 
        label: 'Vaatekaappi & Makuuhuone', 
        categories: ['Yläosat', 'Alaosat', 'Sukat & Alusvaatteet', 'Vuodevaatteet', 'Yöpöydän sälä'] 
    },
    'kitchen': { 
        label: 'Keittiö', 
        categories: ['Arkiasiat', 'Lasit & Mukit', 'Ruoanvalmistus', 'Aterimet & Ottimet', 'Muovirasiat', 'Pienkoneet'] 
    },
    'entryway': { 
        label: 'Eteinen', 
        categories: ['Kengät', 'Takit & Päällysvaatteet', 'Asusteet (pipot/hanskat)', 'Laukut & Reput', 'Avaimet & Pikkusälä'] 
    },
    'bathroom': { 
        label: 'Kylpyhuone & WC', 
        categories: ['Pyyhkeet', 'Kosmetiikka & Meikit', 'Pesuaineet', 'Lääkkeet & Ensiapu', 'Siivousvälineet'] 
    },
    'livingroom': { 
        label: 'Olohuone & Viihde', 
        categories: ['Kirjat & Lehdet', 'Elektroniikka & Johdot', 'Koriste-esineet', 'Pelit & Harrasteet', 'Tekstiilit'] 
    },
    'office': { 
        label: 'Työhuone / Paperit', 
        categories: ['Toimistotarvikkeet', 'Paperit & Kansiot', 'Johdot & Laturit', 'Elektroniikkaromu', 'Kirjat'] 
    },
    'storage': { 
        label: 'Varasto / Autotalli', 
        categories: ['Työkalut', 'Kausivaatteet/varusteet', 'Harrastusvälineet', 'Ehkä tarvitsen joskus', 'Romu & Risat'] 
    }
};

// 2. DATAN LATAUS JA MIGRAATIO
const rawState = JSON.parse(localStorage.getItem('karsinta_final_v1')) || [];

let state = rawState.map(room => ({
    ...room,
    id: String(room.id),
    // Varmistetaan, että locked-ominaisuus on olemassa
    locked: room.locked === true, 
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
    const room = state.find(r => r.id === roomId); 
    if (room) room.lastEdited = Date.now();
}

// --- Toiminnot ---

function handleCreateRoom() {
    const nameInput = document.getElementById('modal-room-name');
    const templateSelect = document.getElementById('modal-room-template');
    
    if (!nameInput) return null;
    
    const name = nameInput.value.trim();
    if (!name) { alert("Nimi puuttuu!"); return null; }

    const templateKey = templateSelect ? templateSelect.value : 'empty';
    const template = ROOM_TEMPLATES[templateKey] || ROOM_TEMPLATES['empty'];

    const newCategories = template.categories.map(catName => ({
        id: generateId(),
        name: catName,
        start: 0,
        removed: 0,
        locked: false
    }));
    
    const newId = generateId();
    
    state.push({
        id: newId,
        name: name,
        pinned: false,
        locked: false, // Uusi huone ei ole lukittu
        lastEdited: Date.now(),
        categories: newCategories
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
            if (room.locked) { alert("Huone on lukittu!"); return; } // Estetään lisäys lukittuun
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

function handleRenameRoom(roomId) {
    const room = state.find(r => r.id === roomId);
    if (!room) return;
    if (room.locked) { alert("Avaa huoneen lukitus ensin."); return; }
    
    const newName = prompt("Anna huoneelle uusi nimi:", room.name);
    
    if (newName && newName.trim() !== "") {
        room.name = newName.trim();
        updateMeta(roomId);
        sync();
        if (typeof openRoomModal === 'function') openRoomModal(roomId);
    }
}

function handleRenameCategory(roomId, catId) {
    const room = state.find(r => r.id === roomId);
    if (!room) return;
    // Sallitaan kategorian nimeäminen, vaikka kategoria olisi lukittu (koska se on vain tekstiä),
    // mutta jos koko huone on lukittu, estetään se.
    if (room.locked) { alert("Huone on lukittu."); return; }

    const cat = room.categories.find(c => c.id === catId);
    if (!cat) return;
    
    const newName = prompt("Anna kategorialle uusi nimi:", cat.name);
    
    if (newName && newName.trim() !== "") {
        cat.name = newName.trim();
        updateMeta(roomId);
        sync();
        if (typeof openCategoryModal === 'function') openCategoryModal(roomId, catId);
    }
}

function handleEditStartAmount(roomId, catId, delta) {
    const room = state.find(r => r.id === roomId);
    if (room && room.locked) return; // Estetään muokkaus

    const cat = room?.categories.find(c => c.id === catId);
    if (!cat || cat.locked) return;
    
    cat.start = Math.max(0, cat.start + delta);
    if (cat.removed > cat.start) cat.removed = cat.start;
    updateMeta(roomId);
    sync();
}

function handleUpdateRemoved(roomId, catId, delta) {
    const room = state.find(r => r.id === roomId);
    if (room && room.locked) return; // Estetään muokkaus

    const cat = room?.categories.find(c => c.id === catId);
    if (!cat || cat.locked) return;
    
    cat.removed = Math.max(0, cat.removed + delta);
    if (cat.removed > cat.start) cat.start = cat.removed;
    updateMeta(roomId);
    sync();
}

function handleToggleLock(roomId, catId) {
    const room = state.find(r => r.id === roomId);
    // Huom: Kategorian lukituksen saa avata vaikka huone olisi lukittu, 
    // mutta se ei hyödytä ennen kuin huoneen avaa. 
    // Pidetään logiikka yksinkertaisena: "Lukot" ovat itsenäisiä.
    const cat = room?.categories.find(c => c.id === catId);
    if (cat) {
        cat.locked = !cat.locked;
        updateMeta(roomId);
        sync();
    }
}

// UUSI: Huoneen lukitus
function handleToggleRoomLock(roomId) {
    const room = state.find(r => r.id === roomId);
    if (room) {
        room.locked = !room.locked;
        updateMeta(roomId);
        sync();
        // Päivitetään näkymä heti, jos ollaan siinä
        if (typeof openRoomModal === 'function') openRoomModal(roomId);
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
    const room = state.find(r => r.id === roomId);
    if (room && room.locked) { alert("Huone on lukittu."); return; }

    if (confirm("Poistetaanko kategoria?")) {
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
                state = parsed.map(r => ({
                    ...r, 
                    id: String(r.id),
                    // Varmistetaan locked myös importissa
                    locked: r.locked === true,
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
            
            let r = newState.find(x => x.name === cols[0]);
            if (!r) { 
                r = { id: generateId(), name: cols[0], categories: [], pinned: false, locked: false, lastEdited: Date.now() }; 
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