// --- UI-LOGIC.JS: Käyttöliittymän tila ja ohjaus ---

let currentSort = 'created-asc'; 

// Tila: Mikä näkymä on aktiivinen?
let activeRoomId = null;     
let activeCatId = null;      
let activeAddRoom = false;   
let activeSettings = false;  
let activeStats = false;     

// Käynnistä sovellus
if (typeof draw === 'function') draw();

function handleSortChange(value) {
    currentSort = value;
    draw();
}

// PÄIVITETTY FUNKTIO: Käsittelee nyt DIViä, ei inputtia
function adjustAddModalInput(delta) {
    const display = document.getElementById('modal-cat-start');
    if (!display) return;
    
    let val = parseInt(display.innerText);
    if (isNaN(val)) val = 0;
    
    val = Math.max(0, val + delta);
    display.innerText = val; // Päivitetään teksti
}

// --- NAVIGOINTI LOGIIKKA (The Stack) ---

function resetViews() {
    activeRoomId = null;
    activeCatId = null;
    activeAddRoom = false;
    activeSettings = false;
    activeStats = false;
    document.getElementById('edit-modal').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

function openModalBase() {
    document.getElementById('edit-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

// 1. ETUSIVU -> HUONE
function openRoomModal(roomId) {
    resetViews(); 
    activeRoomId = roomId;
    openModalBase();
    if(typeof renderRoomModal === 'function') renderRoomModal(roomId);
}

function closeRoomModal() {
    resetViews(); 
    draw();
}

// 2. HUONE -> KATEGORIAN MUOKKAUS
function openCategoryModal(roomId, catId) {
    activeRoomId = roomId; 
    activeCatId = catId;
    if(typeof renderCategoryEditModal === 'function') renderCategoryEditModal(roomId, catId);
}

function closeCategoryModal() {
    activeCatId = null;
    if (activeRoomId) {
        openRoomModal(activeRoomId); 
    } else {
        closeRoomModal();
    }
}

// 3. HUONE -> KATEGORIAN LISÄYS
function openAddCategoryModal(roomId) {
    activeRoomId = roomId;
    activeCatId = 'NEW'; 
    if(typeof renderAddCategoryModal === 'function') renderAddCategoryModal(roomId);
}

function closeAddCategoryModal() {
    activeCatId = null;
    openRoomModal(activeRoomId);
}

// 4. ETUSIVU -> HUONEEN LUONTI
function openAddRoomModal() {
    resetViews();
    activeAddRoom = true;
    openModalBase();
    if(typeof renderCreateRoomModal === 'function') renderCreateRoomModal();
}

function triggerCreateRoom() {
    const newId = handleCreateRoom(); 
    if (newId) {
        openRoomModal(newId);
    }
}
function closeAddRoomModal() { resetViews(); draw(); }

// 5. ETUSIVU -> ASETUKSET
function openSettingsModal() {
    resetViews();
    activeSettings = true;
    openModalBase();
    if(typeof renderSettingsModal === 'function') renderSettingsModal();
}
function closeSettingsModal() { resetViews(); draw(); }

// 6. ETUSIVU -> TILASTOT
function openStatsModal() {
    resetViews();
    activeStats = true;
    openModalBase();
    if(typeof renderStatsModal === 'function') renderStatsModal();
}
function closeStatsModal() { resetViews(); draw(); }