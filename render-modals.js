// --- RENDER-MODALS.JS ---

// 1. TILASTOT / ERITTELY
function renderStatsModal() {
    const container = document.getElementById('modal-body');
    
    let totalStart = 0, totalGoal = 0, totalRem = 0;
    const sortedRooms = [...state].map(room => {
        let rStart = 0, rGoal = 0, rRem = 0;
        room.categories.forEach(c => { 
            rStart += c.start;
            rGoal += Math.ceil(c.start / 3); 
            rRem += c.removed; 
        });
        totalStart += rStart; totalGoal += rGoal; totalRem += rRem;
        const rPerc = rGoal > 0 ? (rRem / rGoal) * 100 : 0;
        const rDiff = rRem - rGoal;
        return { ...room, rStart, rGoal, rRem, rPerc, rDiff };
    }).sort((a, b) => b.rPerc - a.rPerc);

    const globalPerc = totalGoal > 0 ? Math.round((totalRem / totalGoal) * 100) : 0;
    const globalDiff = totalRem - totalGoal;

    let listHTML = '';
    if (sortedRooms.length > 0) {
        listHTML = '<div class="stats-list-container">';
        sortedRooms.forEach(room => {
            const isDone = room.rPerc >= 100;
            listHTML += `
                <div class="stats-detailed-row">
                    <div class="flex">
                        <strong>${isDone ? '✅' : '📦'} ${room.name}</strong>
                        <span style="color:${isDone ? 'var(--p)' : '#666'}; font-weight:bold;">${Math.round(room.rPerc)}&thinsp;%</span>
                    </div>
                    <div class="bar-bg" style="height:8px; margin:5px 0;"><div class="bar-fill" style="width:${Math.min(100, room.rPerc)}%"></div></div>
                    <div class="stats-mini-grid">
                        <div>Alku: ${room.rStart}</div>
                        <div>Tavoite: ${room.rGoal}</div>
                        <div style="font-weight:bold; color:var(--text);">Poistettu: ${room.rRem}</div>
                    </div>
                </div>`;
        });
        listHTML += '</div>';
    } else {
        listHTML = '<p style="text-align:center; color:#999;">Ei huoneita.</p>';
    }

    container.innerHTML = `
        <div class="modal-header">
             <div style="display:flex; align-items:center; gap:10px;">
                <button onclick="closeStatsModal()" style="background:none; border:none; font-size:1.5em; padding:0; cursor:pointer; color:#666;">←</button>
                <h2 style="margin:0; font-size:1.4em;">Yhteenveto</h2>
            </div>
        </div>
        
        <div style="flex: 1; overflow-y: auto; padding-top: 10px;">
            <div class="overall-summary" style="margin-bottom:20px;">
                <div class="flex" style="margin-bottom:5px;">
                    <strong style="font-size:1.1em; color:var(--text);">Valmis</strong>
                    <strong style="color:var(--p); font-size:1.2em;">${globalPerc}&thinsp;%</strong>
                </div>
                <div class="bar-bg" style="height:16px;"><div class="bar-fill" style="width:${Math.min(100, globalPerc)}%"></div></div>
                <div class="stats-grid">
                    <div class="stat-box"><span class="stat-label">Alkumäärä</span><span class="stat-value">${totalStart}</span></div>
                    <div class="stat-box"><span class="stat-label">Poistettu</span><span class="stat-value">${totalRem}</span></div>
                    <div class="stat-box"><span class="stat-label">Tavoite</span><span class="stat-value">${totalGoal}</span></div>
                </div>
                <div style="text-align:center; margin-top:10px; font-size:0.9em; font-weight:bold; color: ${globalDiff >= 0 ? 'var(--p)' : '#666'};">
                    ${globalDiff >= 0 ? `Tavoite ylitetty (+${globalDiff})` : `Puuttuu: ${Math.abs(globalDiff)}`}
                </div>
            </div>

            <h3 style="font-size:1em; color:#666; text-transform:uppercase; margin-bottom:10px; border-bottom:1px solid #eee; padding-bottom:5px;">Huoneet</h3>
            ${listHTML}

            <div style="margin-top:20px;">
                <button class="btn-share" onclick="handleShareReport()">📤 Jaa tilanne</button>
            </div>
        </div>
    `;
}

// 2. ASETUKSET
function renderSettingsModal() {
    document.getElementById('modal-body').innerHTML = `
        <div class="modal-header"><h2 style="margin:0; font-size:1.4em;">Asetukset</h2></div>
        <div style="flex: 1; overflow-y: auto; padding-top: 10px;">
            <div class="settings-section">
                <span class="settings-label">Varmuuskopiointi</span>
                <div class="settings-grid">
                    <button class="btn-sec" onclick="handleCopyToClipboard()">📋 Kopioi</button>
                    <button class="btn-sec" onclick="handleTextTransfer()">📥 Liitä</button>
                </div>
            </div>
            <div class="settings-section">
                <span class="settings-label">Excel / CSV</span>
                <div class="settings-grid">
                    <button class="btn-export" onclick="exportToCSV()">Lataa</button>
                    <button class="btn-import" onclick="document.getElementById('fileInput').click()">Tuo</button>
                </div>
            </div>
            <div class="danger-zone">
                <strong style="color:var(--danger)">Nollaus</strong>
                <button class="btn-reset" onclick="handleResetApp()">Tyhjennä kaikki tiedot</button>
            </div>
        </div>
        <div class="modal-footer"><button class="btn-close-modal" onclick="closeSettingsModal()">Sulje</button></div>
    `;
}

// 3. HUONEEN LUONTI
function renderAddRoomModal() {
    document.getElementById('modal-body').innerHTML = `
        <div class="modal-header"><h2 style="margin:0; font-size:1.4em;">Uusi huone</h2></div>
        <div style="flex: 1; overflow-y: auto; padding-top: 20px;">
            <div class="modal-input-group">
                <label class="modal-label">Nimi</label>
                <input type="text" id="modal-room-name" class="modal-input" placeholder="Esim. Varasto" autocomplete="off">
            </div>
        </div>
        <div class="modal-btn-group">
            <button class="btn-cancel" onclick="closeAddRoomModal()">Peru</button>
            <button class="btn-save" onclick="triggerCreateRoom()">Luo</button>
        </div>
    `;
    setTimeout(() => { const i = document.getElementById('modal-room-name'); if(i) i.focus(); }, 100);
}

// 4. KATEGORIAN LISÄYS (PÄIVITETTY: Ei inputtia, vaan iso näyttö)
function renderAddCategoryModal(activeAddRoomId) {
    if (!activeAddRoomId) return;
    const room = state.find(r => r.id === activeAddRoomId);
    if (!room) return;

    document.getElementById('modal-body').innerHTML = `
        <div class="modal-header">
             <div style="display:flex; align-items:center; gap:10px;">
                <button onclick="closeAddCategoryModal()" style="background:none; border:none; font-size:1.5em; padding:0; cursor:pointer; color:#666;">←</button>
                <h2 style="margin:0; font-size:1.4em;">Lisää kategoria</h2>
            </div>
            <div style="color:#666; font-size:0.9em; margin-left:35px;">${room.name}</div>
        </div>
        <div style="flex: 1; overflow-y: auto; padding-top: 10px;">
            <div class="modal-input-group">
                <label class="modal-label">Kategoria</label>
                <input type="text" id="modal-cat-name" class="modal-input" placeholder="Esim. Takit" autocomplete="off">
            </div>
            
            <div class="modal-input-group" style="margin-bottom:10px; text-align:center;">
                <label class="modal-label">Montako?</label>
                <div id="modal-cat-start" class="big-number" style="font-size:3em; color:var(--text);">0</div>
            </div>

            <div class="control-grid" style="margin-bottom:20px;">
                <button class="btn-large minus" onclick="adjustAddModalInput(-5)">-&thinsp;5</button>
                <button class="btn-large plus" onclick="adjustAddModalInput(1)">+&thinsp;1</button>
                <button class="btn-large plus" onclick="adjustAddModalInput(5)">+&thinsp;5</button>
                <button class="btn-large minus" onclick="adjustAddModalInput(-10)">-&thinsp;10</button>
                <button class="btn-large minus" onclick="adjustAddModalInput(-1)">-&thinsp;1</button>
                <button class="btn-large plus" onclick="adjustAddModalInput(10)">+&thinsp;10</button>
            </div>
            <p style="color:#666; font-size:0.9em; text-align:center;">Tavoite: 33&thinsp;% tästä</p>
        </div>
        <div class="modal-btn-group">
            <button class="btn-cancel" onclick="closeAddCategoryModal()">Peru</button>
            <button class="btn-save" onclick="handleAddCategory(${room.id})">Tallenna</button>
        </div>
    `;
    setTimeout(() => { const i = document.getElementById('modal-cat-name'); if(i) i.focus(); }, 100);
}

// 5. KATEGORIAN MUOKKAUS
function renderCategoryEditModal(roomId, catId) {
    const room = state.find(r => r.id === roomId);
    if (!room) return;
    const cat = room.categories.find(c => c.id === catId);
    if (!cat) return;

    const goal = Math.ceil(cat.start / 3);
    const diff = cat.removed - goal;
    const isL = cat.locked;

    document.getElementById('modal-body').innerHTML = `
        <div class="modal-header">
            <div style="display:flex; align-items:center; gap:10px;">
                <button onclick="closeCategoryModal()" style="background:none; border:none; font-size:1.5em; padding:0; cursor:pointer; color:#666;">←</button>
                <h2 style="margin:0; font-size:1.4em;">${cat.name}</h2>
            </div>
            <div style="color:#666; font-size:0.9em; margin-left:35px;">${room.name}</div>
        </div>

        <div class="big-stat-display">
            <div class="sub-label">Poistettu</div>
            <div class="stat-row"><span class="big-number">${cat.removed}</span><span class="goal-number">/ ${goal}</span></div>
             <div class="bar-bg" style="height:12px; margin-top:5px; background:#eee;"><div class="bar-fill" style="width:${Math.min(100, (cat.removed/goal)*100)}%"></div></div>
            <div style="margin-top:8px; font-weight:bold; font-size:0.9em; color: ${diff >= 0 ? 'var(--p)' : '#666'}">${diff >= 0 ? 'Tavoite saavutettu!' : `Puuttuu: ${Math.abs(diff)}`}</div>
        </div>
        ${!isL ? `
        <div style="flex: 1; overflow-y: auto;">
            <div class="control-grid" style="margin-top:20px;">
                <button class="btn-large minus" onclick="handleUpdateRemoved(${roomId},${catId},-5)">-&thinsp;5</button>
                <button class="btn-large plus" onclick="handleUpdateRemoved(${roomId},${catId},1)">+&thinsp;1</button>
                <button class="btn-large plus" onclick="handleUpdateRemoved(${roomId},${catId},5)">+&thinsp;5</button>
                <button class="btn-large minus" onclick="handleUpdateRemoved(${roomId},${catId},-10)">-&thinsp;10</button>
                <button class="btn-large minus" onclick="handleUpdateRemoved(${roomId},${catId},-1)">-&thinsp;1</button>
                <button class="btn-large plus" onclick="handleUpdateRemoved(${roomId},${catId},10)">+&thinsp;10</button>
            </div>
            
            <div style="margin-top:15px; border-top:1px solid #eee; padding-top:15px; padding-bottom:10px;">
                <div style="color:#666; font-size:0.85em; text-align:center; margin-bottom:5px;">Korjaa alkumäärää (Nyt: <strong>${cat.start}</strong>)</div>
                <div class="adjust-grid">
                    <button class="btn-adjust" onclick="handleEditStartAmount(${roomId},${catId},-5)">-&thinsp;5</button>
                    <button class="btn-adjust" onclick="handleEditStartAmount(${room.id},${cat.id},-1)">-&thinsp;1</button>
                    <button class="btn-adjust" onclick="handleEditStartAmount(${room.id},${cat.id},1)">+&thinsp;1</button>
                    <button class="btn-adjust" onclick="handleEditStartAmount(${room.id},${cat.id},5)">+&thinsp;5</button>
                </div>
            </div>
            <div style="margin-top: 20px;">
                <button class="btn-lock" onclick="handleToggleLock(${room.id},${cat.id})" style="width:100%; font-size:0.9em; padding:12px; background:white; color:var(--p); border:1px solid var(--p); margin-bottom:10px;">Lukitse</button>
                <button class="btn-delete-room" onclick="handleDeleteCat(${room.id},${cat.id})" style="width:100%; border:1px solid var(--danger); color:var(--danger); background:white;">Poista</button>
            </div>
        </div>` : `
        <div style="text-align:center; padding:30px; background:#f0f9f9; border-radius:12px; margin-bottom:20px;">
            <div style="font-size:3em;">🔒</div><h3>Lukittu</h3>
            <button class="btn-unlock" onclick="handleToggleLock(${room.id},${cat.id})" style="margin-top:20px; padding:15px; font-size:1em; width:100%;">Avaa</button>
        </div>`}
        <div class="modal-footer"><button class="btn-close-modal" onclick="closeCategoryModal()">Valmis</button></div>
    `;
}

// 6. HUONE-NÄKYMÄ (PÄIVITETTY YLÄOSA)
function renderRoomModal(roomId) {
    const room = state.find(r => r.id === roomId);
    if (!room) return closeRoomModal();

    let rStart = 0, rGoal = 0, rRem = 0;
    room.categories.forEach(cat => {
        const g = Math.ceil(cat.start / 3);
        rStart += cat.start; rGoal += g; rRem += cat.removed;
    });
    const rPerc = rGoal > 0 ? (rRem / rGoal) * 100 : 0;
    const hasLockedCats = room.categories.some(c => c.locked);

    let catListHTML = '';
    room.categories.forEach(cat => {
        const goal = Math.ceil(cat.start/3);
        const perc = goal > 0 ? (cat.removed/goal)*100 : 0;
        const isL = cat.locked;
        catListHTML += `
            <div class="category-item ${isL ? 'locked' : ''}" onclick="openCategoryModal(${room.id}, ${cat.id})" style="cursor:pointer;">
                <div class="flex">
                    <strong>${cat.name} ${isL ? '🔒' : ''}</strong>
                    <div style="color:var(--p);">➔</div>
                </div>
                <div style="font-size:0.9em; margin:5px 0;">Alku: ${cat.start} | Poistettu: ${cat.removed}</div>
                <div class="bar-bg"><div class="bar-fill" style="width:${Math.min(100, perc)}%"></div></div>
            </div>
        `;
    });

    const container = document.getElementById('modal-body');
    container.innerHTML = `
        <div class="modal-header">
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
                <button onclick="closeRoomModal()" style="background:none; border:none; font-size:1.5em; padding:0; cursor:pointer; color:#666;">←</button>
                <h2 style="margin:0; font-size:1.4em;">${room.name}</h2>
            </div>
            
            <div class="overall-summary" style="margin-bottom:0; padding:10px;">
                <div class="flex" style="margin-bottom:5px;">
                    <strong style="font-size:0.9em; color:var(--text);">Valmis</strong>
                    <strong style="color:var(--p); font-size:1.1em;">${Math.round(rPerc)}&thinsp;%</strong>
                </div>
                <div class="bar-bg" style="height:10px; margin:5px 0;"><div class="bar-fill" style="width:${Math.min(100, rPerc)}%"></div></div>
                <div class="stats-mini-grid" style="margin-top:5px;">
                    <div>Alku: ${rStart}</div>
                    <div>Tavoite: ${rGoal}</div>
                    <div style="font-weight:bold;">Poistettu: ${rRem}</div>
                </div>
            </div>
        </div>

        <div style="flex: 1; overflow-y: auto; padding-top: 10px;">
            <div id="cat-list">${catListHTML}</div>
            
            <button class="btn-add-trigger" onclick="openAddCategoryModal(${room.id})">
                + Uusi kategoria
            </button>

            <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
                ${hasLockedCats ? `<div class="delete-info-text">Huoneessa on lukittuja kategorioita.</div>` : ''}
                <button class="btn-delete-room" onclick="handleDeleteRoom(${room.id})" ${hasLockedCats ? 'disabled' : ''}>Poista huone</button>
            </div>
        </div>
    `;
}