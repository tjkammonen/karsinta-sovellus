// --- UI-LOGIC.JS: Käyttöliittymän tila ja ohjaus ---

const expandedState = new Set();
let currentSort = 'created-asc'; 

// Modaalien tilat
let activeModal = null;
let activeAddRoomId = null;
let isAddRoomModalOpen = false;
let isSettingsModalOpen = false;
let isStatsModalOpen = false;

// Käynnistä sovellus
if (typeof draw === 'function') draw();

function handleToggleExpand(roomId) {
    if (expandedState.has(roomId)) expandedState.delete(roomId);
    else expandedState.add(roomId);
    draw();
}

function handleSortChange(value) {
    currentSort = value;
    draw();
}

function adjustAddModalInput(delta) {
    const input = document.getElementById('modal-cat-start');
    if (!input) return;
    let val = parseInt(input.value);
    if (isNaN(val)) val = 0;
    val = Math.max(0, val + delta);
    input.value = val;
}

// Modaalien hallinta

function resetModals() {
    activeModal = null;
    activeAddRoomId = null;
    isAddRoomModalOpen = false;
    isSettingsModalOpen = false;
    isStatsModalOpen = false;
    document.getElementById('edit-modal').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

function openModalBase() {
    resetModals();
    document.getElementById('edit-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

// 1. Edit Category
function openCategoryModal(roomId, catId) {
    openModalBase();
    activeModal = { roomId, catId };
    if(typeof renderModal === 'function') renderModal(activeModal);
}
function closeCategoryModal() { resetModals(); draw(); }

// 2. Add Category
function openAddCategoryModal(roomId) {
    openModalBase();
    activeAddRoomId = roomId;
    if(typeof renderAddModal === 'function') renderAddModal(activeAddRoomId);
}
function closeAddCategoryModal() { resetModals(); draw(); }

// 3. Add Room
function openAddRoomModal() {
    openModalBase();
    isAddRoomModalOpen = true;
    if(typeof renderAddRoomModal === 'function') renderAddRoomModal();
}
function closeAddRoomModal() { resetModals(); draw(); }

// 4. Settings
function openSettingsModal() {
    openModalBase();
    isSettingsModalOpen = true;
    if(typeof renderSettingsModal === 'function') renderSettingsModal();
}
function closeSettingsModal() { resetModals(); draw(); }

// 5. Stats
function openStatsModal() {
    openModalBase();
    isStatsModalOpen = true;
    if(typeof renderStatsModal === 'function') renderStatsModal();
}
function closeStatsModal() { resetModals(); draw(); }