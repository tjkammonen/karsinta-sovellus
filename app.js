// Ladataan tallennettu tila tai luodaan tyhjä lista
let state = JSON.parse(localStorage.getItem('karsinta_final_v1')) || [];

// Tallentaa tilan ja piirtää käyttöliittymän uudelleen
function sync() {
    localStorage.setItem('karsinta_final_v1', JSON.stringify(state));
    // Tarkistetaan onko draw-funktio olemassa (ui.js) ja kutsutaan sitä
    if (typeof draw === 'function') draw();
}

// APUFUNKTIO: Päivittää huoneen "viimeksi muokattu" -aikaleiman
function updateMeta(roomId) {
    const room = state.find(r => r.id === roomId);
    if (room) {
        room.lastEdited = Date.now();
    }
}

// Luo uuden huoneen (Lukee tiedot modaalista)
function handleCreateRoom() {
    const nameInput = document.getElementById('modal-room-name');
    
    // Jos inputtia ei löydy, lopetetaan
    if (!nameInput) return;
    
    const name = nameInput.value;
    
    if (!name) {
        alert("Anna huoneelle nimi!");
        return;
    }
    
    state.push({
        id: Date.now(),
        name: name,
        pinned: false,
        lastEdited: Date.now(),
        // Luodaan oletuksena yksi tyhjä kategoria
        categories: [{ id: Date.now()+1, name: "Tavarat", start: 0, removed: 0, locked: false }]
    });
    
    sync();

    // Suljetaan modaali onnistumisen jälkeen
    if (typeof closeAddRoomModal === 'function') {
        closeAddRoomModal();
    }
}

// Lisää uuden kategorian (Lukee tiedot modaalista)
function handleAddCategory(roomId) {
    const nameInput = document.getElementById('modal-cat-name');
    const countInput = document.getElementById('modal-cat-start');

    // Jos elementtejä ei löydy (virhetilanne), lopetetaan
    if (!nameInput || !countInput) return;

    const name = nameInput.value;
    const count = parseInt(countInput.value);

    if (name && !isNaN(count)) {
        const room = state.find(r => r.id === roomId);
        if (room) {
            room.categories.push({ 
                id: Date.now(), 
                name: name, 
                start: count, 
                removed: 0, 
                locked: false 
            });
            
            updateMeta(roomId);
            sync();

            // Suljetaan modaali onnistuneen lisäyksen jälkeen
            if (typeof closeAddCategoryModal === 'function') {
                closeAddCategoryModal();
            }
        }
    } else {
        alert("Täytä molemmat kentät!");
    }
}

// Muokkaa alkumäärää (käytetään modaalissa korjaamiseen)
function handleEditStartAmount(roomId, catId, delta) {
    const room = state.find(r => r.id === roomId);
    const cat = room.categories.find(c => c.id === catId);
    
    if (cat.locked) return;
    
    cat.start = Math.max(0, cat.start + delta);
    
    // Varmistetaan, ettei poistettujen määrä ylitä uutta alkumäärää
    if (cat.removed > cat.start) cat.removed = cat.start;

    updateMeta(roomId);
    sync();
}

// Päivittää poistettujen määrää (Isot napit)
function handleUpdateRemoved(roomId, catId, delta) {
    const room = state.find(r => r.id === roomId);
    const cat = room.categories.find(c => c.id === catId);
    
    if (cat.locked) return;
    
    cat.removed = Math.max(0, cat.removed + delta);
    
    // Jos poistettuja on enemmän kuin alkumäärä, nostetaan alkumäärää automaattisesti
    if (cat.removed > cat.start) cat.start = cat.removed;
    
    updateMeta(roomId);
    sync();
}

// Lukitsee / Avaa kategorian
function handleToggleLock(roomId, catId) {
    const room = state.find(r => r.id === roomId);
    const cat = room.categories.find(c => c.id === catId);
    cat.locked = !cat.locked;
    updateMeta(roomId);
    sync();
}

// Merkitsee huoneen suosikiksi (Pinnaus)
function handleTogglePin(roomId) {
    const room = state.find(r => r.id === roomId);
    if (room.pinned === undefined) room.pinned = false;
    room.pinned = !room.pinned;
    updateMeta(roomId);
    sync();
}

// Poistaa huoneen
function handleDeleteRoom(roomId) {
    if (confirm("Haluatko varmasti poistaa koko huoneen ja kaikki sen tiedot?")) {
        state = state.filter(r => r.id !== roomId);
        sync();
    }
}

// Poistaa kategorian
function handleDeleteCat(roomId, catId) {
    if (confirm("Haluatko varmasti poistaa tämän kategorian?")) {
        const room = state.find(r => r.id === roomId);
        room.categories = room.categories.filter(c => c.id !== catId);
        updateMeta(roomId);
        sync();
    }
}

// --- TIEDONSIIRTO (Import / Export) ---

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
            if (!r) { 
                r = {
                    id: Date.now()+i, 
                    name: cols[0], 
                    categories: [], 
                    pinned: false, 
                    lastEdited: Date.now()
                }; 
                newState.push(r); 
            }
            r.categories.push({
                id: Date.now()+i+100, 
                name: cols[1], 
                start: parseInt(cols[2])||0, 
                removed: parseInt(cols[4])||0, 
                locked: false
            });
        }
        state = newState; 
        sync();
    };
    reader.readAsText(event.target.files[0]);
}

// --- JAA RAPORTTI (WhatsApp ym.) ---
function handleShareReport() {
    // 1. Lasketaan tilastot
    let totalGoal = 0, totalRem = 0;
    let roomText = "";

    state.forEach(room => {
        let rGoal = 0, rRem = 0;
        room.categories.forEach(c => {
            const g = Math.ceil(c.start/3);
            rGoal += g;
            rRem += c.removed;
        });
        totalGoal += rGoal;
        totalRem += rRem;
        
        const rPerc = rGoal > 0 ? Math.round((rRem/rGoal)*100) : 0;
        // Lisätään huone listaan
        roomText += `${rPerc >= 100 ? '✅' : '📦'} ${room.name}: ${rPerc}% (${rRem}/${rGoal})\n`;
    });

    const totalPerc = totalGoal > 0 ? Math.round((totalRem/totalGoal)*100) : 0;

    // 2. Muodostetaan viesti
    const title = "Karsinta-apurin tilanne 🏠";
    const text = `
${title}
Koko koti: ${totalPerc}% valmis (${totalRem}/${totalGoal} poistettu)

Huoneet:
${roomText}
_Lähetetty Karsinta-apurista_`;

    // 3. Käytetään selaimen jakotoimintoa (Mobiili)
    if (navigator.share) {
        navigator.share({
            title: title,
            text: text
        }).catch(err => console.log('Jako peruttu', err));
    } else {
        // Fallback tietokoneelle: Kopioidaan leikepöydälle
        navigator.clipboard.writeText(text).then(() => {
            alert("Raportti kopioitu leikepöydälle! Voit liittää sen viestiin.");
        });
    }
}

// --- NOLLAA SOVELLUS ---
function handleResetApp() {
    const confirm1 = confirm("VAROITUS: Tämä poistaa kaikki huoneet ja tiedot lopullisesti.\n\nHaluatko varmasti jatkaa?");
    if (confirm1) {
        const confirm2 = confirm("Oletko aivan varma? Tätä toimintoa ei voi peruuttaa.");
        if (confirm2) {
            state = []; // Tyhjennetään tila
            sync();     // Tallennetaan ja päivitetään näyttö
            
            // Suljetaan modaali jos se on auki (ui.js funktio)
            if (typeof closeSettingsModal === 'function') {
                closeSettingsModal();
            }
        }
    }
}

// (Säilytä vanhat handleTextTransfer, exportToCSV ja importFromCSV funktiot ennallaan täällä)

// UUSI: Kopioi JSON-tila suoraan leikepöydälle
function handleCopyToClipboard() {
    const data = JSON.stringify(state);
    
    // Käytetään selaimen Clipboard APIa
    navigator.clipboard.writeText(data).then(() => {
        alert("✅ Kaikki tiedot kopioitu leikepöydälle!\n\nVoit nyt liittää ne (Ctrl+V) toisen laitteen 'Tuo tiedot' -kohtaan tai lähettää sähköpostilla itsellesi.");
    }).catch(err => {
        console.error('Kopiointi epäonnistui:', err);
        // Fallback: Jos automaattinen kopiointi ei toimi, käytetään vanhaa tapaa
        prompt("Automaattinen kopiointi ei onnistunut. Kopioi tämä teksti manuaalisesti:", data);
    });
}