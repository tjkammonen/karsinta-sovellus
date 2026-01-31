// --- UI-LOGIC.JS: Käyttöliittymän tila ja ohjaus ---

let currentSort = 'created-asc'; 

let activeRoomId = null;     
let activeCatId = null;      
let activeAddRoom = false;   
let activeSettings = false;  
let activeStats = false;     

// Käynnistä sovellus kun kaikki on ladattu
window.addEventListener('DOMContentLoaded', () => {
    if (typeof draw === 'function') draw();
});

// Lisätty: Escape-nappi sulkee modaalit
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        // Suljetaan modaali, jos sellainen on auki.
        // resetViews palauttaa päänäkymään, tai voit muokata sitä palaamaan tason ylöspäin.
        // Tässä yksinkertainen "sulje kaikki" -logiikka.
        const modal = document.getElementById('edit-modal');
        if (modal && !modal.classList.contains('hidden')) {
            resetViews();
            draw();
        }
    }
});

function handleSortChange(value) {
    currentSort = value;
    draw();
}

function adjustAddModalInput(delta) {
    const display = document.getElementById('modal-cat-start');
    if (!display) return;
    
    let val = parseInt(display.innerText);
    if (isNaN(val)) val = 0;
    
    val = Math.max(0, val + delta);
    display.innerText = val;
}

// --- NAVIGOINTI LOGIIKKA ---

function resetViews() {
    activeRoomId = null;
    activeCatId = null;
    activeAddRoom = false;
    activeSettings = false;
    activeStats = false;
    const modal = document.getElementById('edit-modal');
    if (modal) modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

function openModalBase() {
    const modal = document.getElementById('edit-modal');
    if (modal) modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

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

function openAddCategoryModal(roomId) {
    activeRoomId = roomId;
    activeCatId = 'NEW'; 
    if(typeof renderAddCategoryModal === 'function') renderAddCategoryModal(roomId);
}

function closeAddCategoryModal() {
    activeCatId = null;
    openRoomModal(activeRoomId);
}

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

function openSettingsModal() {
    resetViews();
    activeSettings = true;
    openModalBase();
    if(typeof renderSettingsModal === 'function') renderSettingsModal();
}
function closeSettingsModal() { resetViews(); draw(); }

function openStatsModal() {
    resetViews();
    activeStats = true;
    openModalBase();
    if(typeof renderStatsModal === 'function') renderStatsModal();
}
function closeStatsModal() { resetViews(); draw(); }