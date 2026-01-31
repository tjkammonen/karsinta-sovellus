// --- RENDER-MAIN.JS: Päänäkymän piirto ---

function draw() {
    if (activeSettings) renderSettingsModal();
    else if (activeStats) renderStatsModal();
    else if (activeAddRoom) renderCreateRoomModal();
    else if (activeRoomId && activeCatId === 'NEW') renderAddCategoryModal(activeRoomId);
    else if (activeRoomId && activeCatId) renderCategoryEditModal(activeRoomId, activeCatId);
    else if (activeRoomId) renderRoomModal(activeRoomId);

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
            <div class="overall-summary hover-card" onclick="openStatsModal()" style="cursor:pointer;">
                <div class="flex" style="margin-bottom:10px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <h2 style="margin:0; font-size:1.2em; color:var(--text);">Yhteenveto</h2>
                    </div>
                    <div style="color:var(--p); font-size:1.2em;">➔</div>
                </div>

                <div class="flex" style="margin-bottom:5px;">
                    <strong style="font-size:1em; color:var(--text);">Valmis</strong>
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
        `;
    } else {
        dashboard.innerHTML = '<p class="empty-msg">Aloita luomalla huone.</p>';
    }

    // 3. Lajittelu
    if (processedRooms.length > 0) {
        const sortDiv = document.createElement('div');
        sortDiv.className = 'sort-container';
        sortDiv.innerHTML = `
            <label>Järjestys:</label>
            <select onchange="handleSortChange(this.value)" class="sort-select">
                <option value="created-asc" ${currentSort==='created-asc'?'selected':''}>Vanhin</option>
                <option value="last-edited" ${currentSort==='last-edited'?'selected':''}>Muokattu</option>
                <option value="progress-desc" ${currentSort==='progress-desc'?'selected':''}>Valmius %</option>
                <option value="alpha-asc" ${currentSort==='alpha-asc'?'selected':''}>Aakkoset</option>
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
            default: 
                // ID on nyt string, joten ei voi vähentää. Käytetään localeCompare.
                return String(a.id).localeCompare(String(b.id));
        }
    });

    roomList.forEach(room => {
        const diff = room.rRem - room.rGoal;
        const catCount = room.categories.length;
        
        const rDiv = document.createElement('div');
        rDiv.className = 'room-section hover-card'; 
        rDiv.onclick = (e) => {
            if(!e.target.classList.contains('btn-star')) {
                openRoomModal(room.id);
            }
        };
        rDiv.style.cursor = 'pointer';
        if (room.pinned) rDiv.style.borderColor = 'var(--accent)'; 
        
        rDiv.innerHTML = `
            <div class="flex">
                <div style="display:flex; align-items:center; gap:8px;">
                    <button class="btn-star ${room.pinned ? 'active' : ''}" onclick="handleTogglePin('${room.id}')" title="Kiinnitä">★</button>
                    <h2>${escapeHtml(room.name)} ${room.rPerc >= 100 ? '🏆' : ''}</h2>
                </div>
                <div style="color:var(--p); font-size:1.2em;">➔</div>
            </div>
            
            <div class="room-summary" style="margin-bottom:0; pointer-events:none;">
                <div>Alku: ${room.rStart} | Poistettu: ${room.rRem}/${room.rGoal}</div>
                <div class="bar-bg"><div class="bar-fill bar-room" style="width:${Math.min(100, room.rPerc)}%"></div></div>
                <div class="flex" style="margin-top: 5px; align-items: flex-start;">
                    <div style="font-size:0.8em; font-weight:bold;">${diff >= 0 ? `+${diff}` : `Puuttuu: ${Math.abs(diff)}`}</div>
                    <div class="cat-count-badge">${catCount} kategoriaa</div>
                </div>
            </div>
        `;
        container.appendChild(rDiv);
    });
}