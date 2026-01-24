// --- RENDER-MAIN.JS: Päänäkymän piirto ---

function draw() {
    // Jos jokin modaali on auki, piirretään se (render-modals.js)
    if (activeModal) renderModal(activeModal);
    else if (activeAddRoomId) renderAddModal(activeAddRoomId);
    else if (isAddRoomModalOpen) renderAddRoomModal();
    else if (isSettingsModalOpen) renderSettingsModal();
    else if (isStatsModalOpen) renderStatsModal();

    const container = document.getElementById('roomContainer');
    const dashboard = document.getElementById('room-dashboard');
    if (!container || !dashboard) return;

    container.innerHTML = '';
    dashboard.innerHTML = ''; 
    
    // 1. Datan koonti
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
                <button class="btn-stats" onclick="openStatsModal()">📊 Näytä huoneiden erittely</button>
            </div>
        `;
    } else {
        dashboard.innerHTML = '<p class="empty-msg">Aloita lisäämällä ensimmäinen huone.</p>';
    }

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

    // 4. Huonekorttien piirto
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
                <button class="btn-add-trigger" onclick="openAddCategoryModal(${room.id})">+ Lisää uusi kategoria</button>
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