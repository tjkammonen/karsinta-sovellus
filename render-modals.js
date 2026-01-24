// --- RENDER-MODALS.JS: Modaalien HTML-sisällöt ---

// 1. TILASTOT
function renderStatsModal() {
    const container = document.getElementById('modal-body');
    const sortedRooms = [...state].map(room => {
        let rGoal = 0, rRem = 0;
        room.categories.forEach(c => { rGoal += Math.ceil(c.start / 3); rRem += c.removed; });
        const rPerc = rGoal > 0 ? (rRem / rGoal) * 100 : 0;
        return { ...room, rRem, rGoal, rPerc };
    }).sort((a, b) => b.rPerc - a.rPerc);

    let listHTML = sortedRooms.length > 0 ? '<div class="stats-list-container">' : '<p style="text-align:center; color:#999;">Ei huoneita.</p>';
    if (sortedRooms.length > 0) {
        sortedRooms.forEach(room => {
            const isDone = room.rPerc >= 100;
            listHTML += `
                <div class="stats-row">
                    <span>${isDone ? '✅' : '📦'} <strong>${room.name}</strong></span>
                    <span style="color:${isDone ? 'var(--p)' : '#666'}">${Math.round(room.rPerc)}% <small>(${room.rRem}/${room.rGoal})</small></span>
                </div>`;
        });
        listHTML += '</div>';
    }

    container.innerHTML = `
        <div class="modal-header"><h2 style="margin:0; font-size:1.4em;">Huoneiden erittely</h2></div>
        <div style="flex: 1; overflow-y: auto; padding-top: 10px;">
            ${listHTML}
            <p style="text-align:center; font-size:0.85em; color:#888; margin-top:15px;">Järjestetty valmiusasteen mukaan.</p>
        </div>
        <div class="modal-footer"><button class="btn-close-modal" onclick="closeStatsModal()">Sulje</button></div>
    `;
}

// 2. ASETUKSET
function renderSettingsModal() {
    document.getElementById('modal-body').innerHTML = `
        <div class="modal-header"><h2 style="margin:0; font-size:1.4em;">Asetukset</h2></div>
        <div style="flex: 1; overflow-y: auto; padding-top: 10px;">
            <div class="settings-section">
                <span class="settings-label">Jaa edistyminen</span>
                <button class="btn-share" onclick="handleShareReport()">📤 Jaa raportti (WhatsApp)</button>
            </div>
            <div class="settings-section">
                <span class="settings-label">Varmuuskopiointi (JSON)</span>
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
                <button class="btn-reset" onclick="handleResetApp()">Tyhjennä kaikki tiedot</button>
            </div>
        </div>
        <div class="modal-footer"><button class="btn-close-modal" onclick="closeSettingsModal()">Sulje</button></div>
    `;
}

// 3. HUONEEN LUONTI
function renderAddRoomModal() {
    document.getElementById('modal-body').innerHTML = `
        <div class="modal-header"><h2 style="margin:0; font-size:1.4em;">Luo uusi huone</h2></div>
        <div style="flex: 1; overflow-y: auto; padding-top: 20px;">
            <div class="modal-input-group">
                <label class="modal-label">Huoneen nimi</label>
                <input type="text" id="modal-room-name" class="modal-input" placeholder="Esim. Varasto" autocomplete="off">
            </div>
            <p style="color:#666; font-size:0.9em; line-height:1.4;">Luo automaattisesti kategorian "Tavarat".</p>
        </div>
        <div class="modal-btn-group">
            <button class="btn-cancel" onclick="closeAddRoomModal()">Peruuta</button>
            <button class="btn-save" onclick="handleCreateRoom()">Luo huone</button>
        </div>
    `;
    setTimeout(() => { const i = document.getElementById('modal-room-name'); if(i) i.focus(); }, 100);
}

// 4. KATEGORIAN LISÄYS
function renderAddModal(activeAddRoomId) {
    if (!activeAddRoomId) return;
    const room = state.find(r => r.id === activeAddRoomId);
    if (!room) return;

    document.getElementById('modal-body').innerHTML = `
        <div class="modal-header"><h2 style="margin:0; font-size:1.4em;">Lisää kategoria</h2><div style="color:#666; font-size:0.9em;">Huone: ${room.name}</div></div>
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
            <p style="color:#666; font-size:0.9em; text-align:center;">Tavoitteesi on poistaa 1/3 tästä määrästä.</p>
        </div>
        <div class="modal-btn-group">
            <button class="btn-cancel" onclick="closeAddCategoryModal()">Peruuta</button>
            <button class="btn-save" onclick="handleAddCategory(${room.id})">Tallenna</button>
        </div>
    `;
    setTimeout(() => { const i = document.getElementById('modal-cat-name'); if(i) i.focus(); }, 100);
}

// 5. KATEGORIAN MUOKKAUS
function renderModal(activeModal) {
    if (!activeModal) return;
    const { roomId, catId } = activeModal;
    const room = state.find(r => r.id === roomId);
    if (!room) return;
    const cat = room.categories.find(c => c.id === catId);
    if (!cat) return;

    const goal = Math.ceil(cat.start / 3);
    const diff = cat.removed - goal;
    const isL = cat.locked;

    document.getElementById('modal-body').innerHTML = `
        <div class="modal-header"><h2 style="margin:0; font-size:1.4em;">${cat.name}</h2><div style="color:#666; font-size:0.9em;">${room.name}</div></div>
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