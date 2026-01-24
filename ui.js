const expandedState = new Set();
let currentSort = 'created-asc'; 

// Modaalien tilat
let activeModal = null;      // { roomId, catId } -> Editointi
let activeAddRoomId = null;  // roomId -> Kategorian lisäys
let isAddRoomModalOpen = false; // -> Huoneen lisäys
let isSettingsModalOpen = false; // -> Asetukset

function handleToggleExpand(roomId) {
    if (expandedState.has(roomId)) {
        expandedState.delete(roomId);
    } else {
        expandedState.add(roomId);
    }
    draw();
}

function handleSortChange(value) {
    currentSort = value;
    draw();
}

// --- APUFUNKTIO: LISÄYS-MODAALIN NAPIT ---
function adjustAddModalInput(delta) {
    const input = document.getElementById('modal-cat-start');
    if (!input) return;
    let val = parseInt(input.value);
    if (isNaN(val)) val = 0;
    val = Math.max(0, val + delta);
    input.value = val;
}

// --- MODAALIEN HALLINTA ---

function resetModals() {
    activeModal = null;
    activeAddRoomId = null;
    isAddRoomModalOpen = false;
    isSettingsModalOpen = false;
    document.getElementById('edit-modal').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

function openModalBase() {
    resetModals(); // Varmistetaan että muut on kiinni
    document.getElementById('edit-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

// 1. Kategorian Muokkaus (Edit)
function openCategoryModal(roomId, catId) {
    openModalBase();
    activeModal = { roomId, catId };
    renderModal();
}
function closeCategoryModal() { resetModals(); draw(); }

// 2. Kategorian Lisäys (Add Cat)
function openAddCategoryModal(roomId) {
    openModalBase();
    activeAddRoomId = roomId;
    renderAddModal();
}
function closeAddCategoryModal() { resetModals(); draw(); }

// 3. Huoneen Luonti (Add Room)
function openAddRoomModal() {
    openModalBase();
    isAddRoomModalOpen = true;
    renderAddRoomModal();
}
function closeAddRoomModal() { resetModals(); draw(); }

// 4. Asetukset (Settings)
function openSettingsModal() {
    openModalBase();
    isSettingsModalOpen = true;
    renderSettingsModal();
}
function closeSettingsModal() { resetModals(); draw(); }


// --- MODAALIEN RENDERÖINTI ---

// ASETUKSET
function renderSettingsModal() {
    const container = document.getElementById('modal-body');
    container.innerHTML = `
        <div class="modal-header">
            <h2 style="margin:0; font-size:1.4em;">Asetukset</h2>
        </div>

        <div style="flex: 1; overflow-y: auto; padding-top: 10px;">
            
            <div class="settings-section">
                <span class="settings-label">Jaa edistyminen</span>
                <button class="btn-share" onclick="handleShareReport()">
                    📤 Jaa raportti (WhatsApp / Viesti)
                </button>
                <p style="font-size:0.8em; color:#666; margin-top:5px;">Luo yhteenvedon tilanteesta tekstimuodossa, jonka voit lähettää kaverille.</p>
            </div>

            <div class="settings-section">
                <span class="settings-label">Varmuuskopiointi (JSON)</span>
                <p style="font-size:0.8em; color:#666; margin-bottom:10px;">Kopioi kaikki tiedot talteen tai siirrä ne uuteen laitteeseen.</p>
                <div class="settings-grid">
                    <button class="btn-sec" onclick="handleCopyToClipboard()">📋 Kopioi tiedot</button>
                    <button class="btn-sec" onclick="handleTextTransfer()">📥 Tuo tiedot</button>
                </div>
            </div>

            <div class="settings-section">
                <span class="settings-label">Excel / Arkistointi</span>
                <div class="settings-grid">
                    <button class="btn-export" onclick="exportToCSV()">Lataa CSV</button>
                    <button class="btn-import" onclick="document.getElementById('fileInput').click()">Tuo CSV</button>
                </div>
            </div>

            <div class="danger-zone">
                <strong style="color:var(--danger)">Vaaravyöhyke</strong>
                <p style="font-size:0.8em; margin:5px 0;">Haluatko aloittaa alusta? Tämä poistaa kaikki tiedot.</p>
                <button class="btn-reset" onclick="handleResetApp()">Tyhjennä kaikki tiedot</button>
            </div>

        </div>

        <div class="modal-footer">
            <button class="btn-close-modal" onclick="closeSettingsModal()">Sulje</button>
        </div>
    `;
}

// HUONEEN LUONTI
function renderAddRoomModal() {
    const container = document.getElementById('modal-body');
    container.innerHTML = `
        <div class="modal-header">
            <h2 style="margin:0; font-size:1.4em;">Luo uusi huone</h2>
            <div style="color:#666; font-size:0.9em;">Aloita uusi karsintaprojekti</div>
        </div>
        <div style="flex: 1; overflow-y: auto; padding-top: 20px;">
            <div class="modal-input-group">
                <label class="modal-label">Huoneen nimi</label>
                <input type="text" id="modal-room-name" class="modal-input" placeholder="Esim. Varasto" autocomplete="off">
            </div>
            <p style="color:#666; font-size:0.9em; line-height:1.4;">Huoneeseen luodaan automaattisesti kategoria "Tavarat".</p>
        </div>
        <div class="modal-btn-group">
            <button class="btn-cancel" onclick="closeAddRoomModal()">Peruuta</button>
            <button class="btn-save" onclick="handleCreateRoom()">Luo huone</button>
        </div>
    `;
    setTimeout(() => { const i = document.getElementById('modal-room-name'); if(i) i.focus(); }, 100);
}

// KATEGORIAN LISÄYS
function renderAddModal() {
    if (!activeAddRoomId) return;
    const room = state.find(r => r.id === activeAddRoomId);
    if (!room) return closeAddCategoryModal();

    const container = document.getElementById('modal-body');

    container.innerHTML = `
        <div class="modal-header">
            <h2 style="margin:0; font-size:1.4em;">Lisää kategoria</h2>
            <div style="color:#666; font-size:0.9em;">Huone: ${room.name}</div>
        </div>

        <div style="flex: 1; overflow-y: auto; padding-top: 10px;">
            <div class="modal-input-group">
                <label class="modal-label">Kategorian nimi</label>
                <input type="text" id="modal-cat-name" class="modal-input" placeholder="Esim. Talvitakit" autocomplete="off">
            </div>

            <div class="modal-input-group" style="margin-bottom:10px;">
                <label class="modal-label">Tavaroiden määrä (arvio)</label>
                <input type="number" id="modal-cat-start" class="modal-input" placeholder="0">
            </div>

            <div class="control-grid" style="margin-bottom:20px;">
                <button class="btn-large minus" onclick="adjustAddModalInput(-5)">-&thinsp;5</button>
                <button class="btn-large plus" onclick="adjustAddModalInput(1)">+&thinsp;1</button>
                <button class="btn-large plus" onclick="adjustAddModalInput(5)">+&thinsp;5</button>
                
                <button class="btn-large minus" onclick="adjustAddModalInput(-10)">-&thinsp;10</button>
                <button class="btn-large minus" onclick="adjustAddModalInput(-1)">-&thinsp;1</button>
                <button class="btn-large plus" onclick="adjustAddModalInput(10)">+&thinsp;10</button>
            </div>
            
            <p style="color:#666; font-size:0.9em; line-height:1.4; text-align:center;">
                Tavoitteesi on poistaa 1/3 tästä määrästä.
            </p>
        </div>

        <div class="modal-btn-group">
            <button class="btn-cancel" onclick="closeAddCategoryModal()">Peruuta</button>
            <button class="btn-save" onclick="handleAddCategory(${room.id})">Tallenna</button>
        </div>
    `;
    setTimeout(() => { const i = document.getElementById('modal-cat-name'); if(i) i.focus(); }, 100);
}

// KATEGORIAN MUOKKAUS (EDIT)
function renderModal() {
    if (!activeModal) return;
    const { roomId, catId } = activeModal;
    const room = state.find(r => r.id === roomId);
    if (!room) return closeCategoryModal();
    const cat = room.categories.find(c => c.id === catId);
    if (!cat) return closeCategoryModal();

    const container = document.getElementById('modal-body');
    const goal = Math.ceil(cat.start / 3);
    const diff = cat.removed - goal;
    const isL = cat.locked;

    container.innerHTML = `
        <div class="modal-header">
            <h2 style="margin:0; font-size:1.4em;">${cat.name}</h2>
            <div style="color:#666; font-size:0.9em;">${room.name}</div>
        </div>
        <div class="big-stat-display">
            <div class="sub-label">Poistettu / Tavoite</div>
            <div class="stat-row"><span class="big-number">${cat.removed}</span><span class="goal-number">/ ${goal}</span></div>
             <div class="bar-bg" style="height:12px; margin-top:5px; background:#eee;"><div class="bar-fill" style="width:${Math.min(100, (cat.removed/goal)*100)}%"></div></div>
            <div style="margin-top:8px; font-weight:bold; font-size:0.9em; color: ${diff >= 0 ? 'var(--p)' : '#666'}">${diff >= 0 ? '🏆 Tavoite saavutettu!' : `Puuttuu: ${Math.abs(diff)}`}</div>
        </div>
        ${!isL ? `
        <div style="flex: 1; overflow-y: auto;">
            <div style="text-align:center; margin-bottom:10px; color:#888; font-size:0.8em; text-transform:uppercase;">Merkkaa poistetuksi</div>
            <div class="control-grid">
                <button class="btn-large minus" onclick="handleUpdateRemoved(${roomId},${catId},-5)">-&thinsp;5</button>
                <button class="btn-large plus" onclick="handleUpdateRemoved(${roomId},${catId},1)">+&thinsp;1</button>
                <button class="btn-large plus" onclick="handleUpdateRemoved(${roomId},${catId},5)">+&thinsp;5</button>
                <button class="btn-large minus" onclick="handleUpdateRemoved(${roomId},${catId},-10)">-&thinsp;10</button>
                <button class="btn-large minus" onclick="handleUpdateRemoved(${roomId},${catId},-1)">-&thinsp;1</button>
                <button class="btn-large plus" onclick="handleUpdateRemoved(${roomId},${catId},10)">+&thinsp;10</button>
            </div>
            <div style="margin-top:15px; border-top:1px solid #eee; padding-top:15px; padding-bottom:10px;">
                <div style="color:#666; font-size:0.85em; text-align:center; margin-bottom:5px;">Laskitko alkumäärän väärin? (Nykyinen: <strong>${cat.start}</strong>)</div>
                <div class="adjust-grid">
                    <button class="btn-adjust" onclick="handleEditStartAmount(${roomId},${catId},-5)">-&thinsp;5</button>
                    <button class="btn-adjust" onclick="handleEditStartAmount(${room.id},${cat.id},-1)">-&thinsp;1</button>
                    <button class="btn-adjust" onclick="handleEditStartAmount(${room.id},${cat.id},1)">+&thinsp;1</button>
                    <button class="btn-adjust" onclick="handleEditStartAmount(${room.id},${cat.id},5)">+&thinsp;5</button>
                </div>
            </div>
        </div>` : `
        <div style="text-align:center; padding:30px; background:#f0f9f9; border-radius:12px; margin-bottom:20px;">
            <div style="font-size:3em;">🔒</div><h3>Lukittu</h3><p>Avaa lukitus listanäkymästä jos haluat muokata.</p>
        </div>`}
        <div class="modal-footer"><button class="btn-close-modal" onclick="closeCategoryModal()">Valmis</button></div>
    `;
}

// --- PÄÄPIIRTO (DRAW) ---

function draw() {
    // Renderöidään oikea modaali
    if (activeModal) renderModal();
    else if (activeAddRoomId) renderAddModal();
    else if (isAddRoomModalOpen) renderAddRoomModal();
    else if (isSettingsModalOpen) renderSettingsModal();

    const container = document.getElementById('roomContainer');
    const dashboard = document.getElementById('room-dashboard');
    if (!container || !dashboard) return;

    container.innerHTML = '';
    dashboard.innerHTML = ''; 
    
    // 1. Data Laskenta
    let totalStart = 0, totalGoal = 0, totalRem = 0;
    const processedRooms = state.map(room => {
        if (room.pinned === undefined) room.pinned = false;
        if (room.lastEdited === undefined) room.lastEdited = room.id;
        let rStart = 0, rGoal = 0, rRem = 0;
        room.categories.forEach(cat => {
            const g = Math.ceil(cat.start / 3);
            rStart += cat.start; rGoal += g; rRem += cat.removed;
        });
        totalStart += rStart; totalGoal += rGoal; totalRem += rRem;
        const rPerc = rGoal > 0 ? (rRem / rGoal) * 100 : 0;
        return { ...room, rStart, rGoal, rRem, rPerc, hasLockedCats: room.categories.some(c => c.locked) };
    });

    const globalPerc = totalGoal > 0 ? Math.round((totalRem / totalGoal) * 100) : 0;
    const globalDiff = totalRem - totalGoal;

    // 2. Dashboard
    if (state.length > 0) {
        dashboard.innerHTML += `
            <div class="overall-summary">
                <div class="flex" style="margin-bottom:5px;">
                    <strong style="font-size:1.1em; color:var(--text);">Koko asunnon tilanne</strong>
                    <strong style="color:var(--p); font-size:1.2em;">${globalPerc}%</strong>
                </div>
                <div class="bar-bg" style="height:16px;"><div class="bar-fill" style="width:${Math.min(100, globalPerc)}%"></div></div>
                <div class="stats-grid">
                    <div class="stat-box"><span class="stat-label">Löydetty</span><span class="stat-value">${totalStart}</span></div>
                    <div class="stat-box"><span class="stat-label">Poistettu</span><span class="stat-value">${totalRem}</span></div>
                    <div class="stat-box"><span class="stat-label">Tavoite</span><span class="stat-value">${totalGoal}</span></div>
                </div>
                <div style="text-align:center; margin-top:10px; font-size:0.9em; font-weight:bold; color: ${globalDiff >= 0 ? 'var(--p)' : '#666'};">
                    ${globalDiff >= 0 ? `🎉 Olet poistanut ${globalDiff} tavaraa yli tavoitteen!` : `Matkaa tavoitteeseen vielä ${Math.abs(globalDiff)} tavaraa.`}
                </div>
            </div>
            <h3 style="margin-top:20px; border-top:1px solid #eee; padding-top:15px;">Huoneiden parhaimmisto</h3>
        `;
    } else {
        dashboard.innerHTML = '<p class="empty-msg">Aloita lisäämällä ensimmäinen huone.</p>';
    }

    const dashboardList = [...processedRooms].sort((a, b) => b.rPerc - a.rPerc);
    dashboardList.forEach(room => {
        dashboard.innerHTML += `
            <div class="dashboard-item">
                <div class="dashboard-label">
                    <span>${room.name} ${room.pinned ? '⭐' : ''} ${room.rPerc >= 100 ? '🏆' : ''}</span>
                    <span>${room.rRem}/${room.rGoal}</span>
                </div>
                <div class="bar-bg"><div class="bar-fill bar-room" style="width:${Math.min(100, room.rPerc)}%"></div></div>
            </div>`;
    });

    // 3. Lajittelu
    if (processedRooms.length > 0) {
        const sortDiv = document.createElement('div');
        sortDiv.className = 'sort-container';
        sortDiv.innerHTML = `
            <label>Järjestä huoneet:</label>
            <select onchange="handleSortChange(this.value)" class="sort-select">
                <option value="created-asc" ${currentSort==='created-asc'?'selected':''}>Vanhin ensin</option>
                <option value="last-edited" ${currentSort==='last-edited'?'selected':''}>Viimeksi muokattu</option>
                <option value="progress-desc" ${currentSort==='progress-desc'?'selected':''}>Valmius %</option>
                <option value="alpha-asc" ${currentSort==='alpha-asc'?'selected':''}>Aakkoset A-Ö</option>
            </select>`;
        container.appendChild(sortDiv);
    }

    // 4. Huonekortit
    const roomList = [...processedRooms].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1; 
        if (!a.pinned && b.pinned) return 1;  
        switch (currentSort) {
            case 'last-edited': return b.lastEdited - a.lastEdited;
            case 'progress-desc': return b.rPerc - a.rPerc;
            case 'alpha-asc': return a.name.localeCompare(b.name);
            default: return a.id - b.id;
        }
    });

    roomList.forEach(room => {
        const diff = room.rRem - room.rGoal;
        const isExpanded = expandedState.has(room.id);
        const catCount = room.categories.length;
        
        const rDiv = document.createElement('div');
        rDiv.className = 'room-section';
        rDiv.id = `room-card-${room.id}`; 
        if (room.pinned) rDiv.style.borderColor = 'var(--accent)'; 
        
        rDiv.innerHTML = `
            <div class="flex">
                <div style="display:flex; align-items:center; gap:8px;">
                    <button class="btn-star ${room.pinned ? 'active' : ''}" onclick="handleTogglePin(${room.id})" title="Kiinnitä ylös">★</button>
                    <h2>${room.name} ${room.rPerc >= 100 ? '🏆' : ''}</h2>
                </div>
            </div>
            
            <div class="room-summary">
                <div>Tavaroita: ${room.rStart} | Poistettu: ${room.rRem}/${room.rGoal}</div>
                <div class="bar-bg"><div class="bar-fill bar-room" style="width:${Math.min(100, room.rPerc)}%"></div></div>
                <div class="flex" style="margin-top: 5px; align-items: flex-start;">
                    <div style="font-size:0.8em; font-weight:bold;">${diff >= 0 ? `Tavoite ylitetty ${diff} kpl 💪` : `Matkaa tavoitteeseen ${Math.abs(diff)} kpl 🧐`}</div>
                    <div class="cat-count-badge">${catCount} kategoriaa</div>
                </div>
            </div>

            <button class="btn-toggle-wide" onclick="handleToggleExpand(${room.id})">
                ${isExpanded ? 'Pienennä ▲' : 'Näytä kategoriat ▼'}
            </button>

            <div class="room-details" style="display: ${isExpanded ? 'block' : 'none'}">
                <div id="cat-list-${room.id}"></div>
                
                <button class="btn-add-trigger" onclick="openAddCategoryModal(${room.id})">
                    + Lisää uusi kategoria
                </button>

                <div style="margin-top: 20px;">
                    ${room.hasLockedCats ? `<div class="delete-info-text">Huoneessa on valmiiksi merkittyjä kohteita.</div>` : ''}
                    <button class="btn-delete-room" onclick="handleDeleteRoom(${room.id})" ${room.hasLockedCats ? 'disabled' : ''}>Poista huone</button>
                </div>
            </div>`;

        const catList = rDiv.querySelector(`#cat-list-${room.id}`);
        room.categories.forEach(cat => {
            const goal = Math.ceil(cat.start/3);
            const perc = goal > 0 ? (cat.removed/goal)*100 : 0;
            const isL = cat.locked;
            const cDiv = document.createElement('div');
            cDiv.className = `category-item ${isL ? 'locked' : ''}`;
            cDiv.innerHTML = `
                <div class="flex"><strong>${cat.name} ${isL ? '🔒' : ''}</strong>
                    <div>${!isL ? `<button class="btn-del btn-small" onclick="handleDeleteCat(${room.id},${cat.id})">×</button>` : ''}</div>
                </div>
                <div style="font-size:0.9em; margin:5px 0;">Alkumäärä: ${cat.start} | Poistettu: ${cat.removed}</div>
                <div class="bar-bg"><div class="bar-fill" style="width:${Math.min(100, perc)}%"></div></div>
                <div class="flex" style="margin-top:10px;">
                    ${isL ? 
                        `<button class="btn-unlock" onclick="handleToggleLock(${room.id},${cat.id})" style="width:100%; padding:10px;">Avaa lukitus</button>` :
                        `<button class="btn-open-cat" onclick="openCategoryModal(${room.id}, ${cat.id})">Avaa / Muokkaa ➔</button>`
                    }
                </div>
                ${!isL ? `<button class="btn-lock" onclick="handleToggleLock(${room.id},${cat.id})" style="margin-top:5px; width:100%; font-size:0.8em; background:transparent; color:var(--p); border:1px solid var(--p);">Lukitse valmiiksi</button>` : ''}
            `;
            catList.appendChild(cDiv);
        });
        container.appendChild(rDiv);
    });
}

draw();