const expandedState = new Set();
let currentSort = 'created-asc'; 

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

function draw() {
    const container = document.getElementById('roomContainer');
    const dashboard = document.getElementById('room-dashboard');
    if (!container || !dashboard) return;

    container.innerHTML = '';
    dashboard.innerHTML = ''; // Tyhjennetään koko dashboard
    
    // 1. LASKETAAN GLOBAALIT TILASTOT
    let totalStart = 0;
    let totalGoal = 0;
    let totalRem = 0;
    
    // Käydään läpi data kertaalleen laskentaa varten
    const processedRooms = state.map(room => {
        if (room.pinned === undefined) room.pinned = false;
        if (room.lastEdited === undefined) room.lastEdited = room.id;

        let rStart = 0, rGoal = 0, rRem = 0;
        room.categories.forEach(cat => {
            const g = Math.ceil(cat.start / 3);
            rStart += cat.start;
            rGoal += g;
            rRem += cat.removed;
        });

        // Summataan globaaleihin
        totalStart += rStart;
        totalGoal += rGoal;
        totalRem += rRem;
        
        const rPerc = rGoal > 0 ? (rRem / rGoal) * 100 : 0;
        
        return {
            ...room,
            rStart, rGoal, rRem, rPerc,
            hasLockedCats: room.categories.some(c => c.locked)
        };
    });

    // Lasketaan globaali prosentti
    const globalPerc = totalGoal > 0 ? Math.round((totalRem / totalGoal) * 100) : 0;
    const globalDiff = totalRem - totalGoal;

    // 2. PIIRRETÄÄN KOKONAISTILANNE (SUMMARY CARD)
    // Tämä tulee nyt ylimmäksi dashboardiin
    if (state.length > 0) {
        dashboard.innerHTML += `
            <div class="overall-summary">
                <div class="flex" style="margin-bottom:5px;">
                    <strong style="font-size:1.1em; color:var(--text);">Koko asunnon tilanne</strong>
                    <strong style="color:var(--p); font-size:1.2em;">${globalPerc}%</strong>
                </div>
                
                <div class="bar-bg" style="height:16px;">
                    <div class="bar-fill" style="width:${Math.min(100, globalPerc)}%"></div>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-box">
                        <span class="stat-label">Löydetty yhteensä</span>
                        <span class="stat-value">${totalStart} kpl</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-label">Poistettu</span>
                        <span class="stat-value">${totalRem} kpl</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-label">Tavoite (1/3)</span>
                        <span class="stat-value">${totalGoal} kpl</span>
                    </div>
                </div>
                
                <div style="text-align:center; margin-top:10px; font-size:0.9em; font-weight:bold; color: ${globalDiff >= 0 ? 'var(--p)' : '#666'};">
                    ${globalDiff >= 0 ? 
                        `🎉 Olet poistanut ${globalDiff} tavaraa yli tavoitteen!` : 
                        `Matkaa tavoitteeseen vielä ${Math.abs(globalDiff)} tavaraa.`}
                </div>
            </div>
            <h3 style="margin-top:20px; border-top:1px solid #eee; padding-top:15px;">Huoneiden parhaimmisto</h3>
        `;
    } else {
        dashboard.innerHTML = '<p class="empty-msg">Aloita lisäämällä ensimmäinen huone.</p>';
    }

    // 3. PIIRRETÄÄN TULOSTAULU (TOP LIST)
    const dashboardList = [...processedRooms].sort((a, b) => b.rPerc - a.rPerc);
    
    dashboardList.forEach(room => {
        dashboard.innerHTML += `
            <div class="dashboard-item">
                <div class="dashboard-label">
                    <span>${room.name} ${room.pinned ? '⭐' : ''} ${room.rPerc >= 100 ? '🏆' : ''}</span>
                    <span>${room.rRem}/${room.rGoal}</span>
                </div>
                <div class="bar-bg">
                    <div class="bar-fill bar-room" style="width:${Math.min(100, room.rPerc)}%"></div>
                </div>
            </div>`;
    });

    // 4. LAJITTELUVALIKKO
    if (processedRooms.length > 0) {
        const sortDiv = document.createElement('div');
        sortDiv.className = 'sort-container';
        sortDiv.innerHTML = `
            <label>Järjestä huoneet:</label>
            <select onchange="handleSortChange(this.value)" class="sort-select">
                <option value="created-asc" ${currentSort === 'created-asc' ? 'selected' : ''}>Vanhin ensin</option>
                <option value="last-edited" ${currentSort === 'last-edited' ? 'selected' : ''}>Viimeksi muokattu</option>
                <option value="progress-desc" ${currentSort === 'progress-desc' ? 'selected' : ''}>Valmius %</option>
                <option value="alpha-asc" ${currentSort === 'alpha-asc' ? 'selected' : ''}>Aakkoset A-Ö</option>
            </select>
        `;
        container.appendChild(sortDiv);
    }

    // 5. HUONEKORTIT
    const roomList = [...processedRooms].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1; 
        if (!a.pinned && b.pinned) return 1;  
        
        switch (currentSort) {
            case 'last-edited': return b.lastEdited - a.lastEdited;
            case 'progress-desc': return b.rPerc - a.rPerc;
            case 'alpha-asc': return a.name.localeCompare(b.name);
            case 'created-asc':
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
                ${!room.hasLockedCats ? `<button class="btn-del btn-x" onclick="handleDeleteRoom(${room.id})" title="Poista huone">×</button>` : ''}
            </div>
            
            <div class="room-summary">
                <div>Tavaroita: ${room.rStart} | Poistettu: ${room.rRem}/${room.rGoal}</div>
                <div class="bar-bg"><div class="bar-fill bar-room" style="width:${Math.min(100, room.rPerc)}%"></div></div>
                
                <div class="flex" style="margin-top: 5px; align-items: flex-start;">
                    <div style="font-size:0.8em; font-weight:bold;">
                        ${diff >= 0 ? 
                            `Tavoite ylitetty ${diff} kpl 💪` : 
                            `Matkaa tavoitteeseen ${Math.abs(diff)} kpl 🧐`}
                    </div>
                    <div class="cat-count-badge">${catCount} kategoriaa</div>
                </div>
            </div>

            <button class="btn-toggle-wide" onclick="handleToggleExpand(${room.id})">
                ${isExpanded ? 'Pienennä ▲' : 'Näytä kategoriat ▼'}
            </button>

            <div class="room-details" style="display: ${isExpanded ? 'block' : 'none'}">
                <div id="cat-list-${room.id}"></div>
                <div class="category-form">
                    <div class="flex">
                        <input type="text" id="catName-${room.id}" placeholder="Kategoria">
                        <input type="number" id="catCount-${room.id}" placeholder="Kpl" style="max-width:70px;">
                    </div>
                    <button class="btn-add" onclick="handleAddCategory(${room.id})">Lisää kategoria</button>
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
                    <div><button class="${isL?'btn-unlock':'btn-lock'}" onclick="handleToggleLock(${room.id},${cat.id})">${isL?'Avaa':'Lukitse'}</button>
                    ${!isL?`<button class="btn-del btn-small" onclick="handleDeleteCat(${room.id},${cat.id})">×</button>`:''}</div>
                </div>
                
                <div style="margin: 10px 0;">
                    <span class="control-label">Alkumäärä: <strong>${cat.start}</strong> (Tavoite: ${goal})</span>
                    ${!isL ? `
                    <div class="edit-controls">
                        <button class="btn-edit btn-sec" onclick="handleEditStartAmount(${room.id},${cat.id},-10)">-10</button>
                        <button class="btn-edit btn-sec" onclick="handleEditStartAmount(${room.id},${cat.id},-5)">-5</button>
                        <button class="btn-edit btn-sec" onclick="handleEditStartAmount(${room.id},${cat.id},-1)">-1</button>
                        <button class="btn-edit" onclick="handleEditStartAmount(${room.id},${cat.id},1)">+1</button>
                        <button class="btn-edit" onclick="handleEditStartAmount(${room.id},${cat.id},5)">+5</button>
                        <button class="btn-edit" onclick="handleEditStartAmount(${room.id},${cat.id},10)">+10</button>
                    </div>` : ''}
                </div>

                <div class="bar-bg"><div class="bar-fill" style="width:${Math.min(100, perc)}%"></div></div>
                
                <div class="flex">
                    <span>Poistettu: <strong>${cat.removed}</strong> / ${goal}</span>
                </div>
                
                ${!isL ? `
                <div class="edit-controls">
                    <button class="btn-small btn-sec" onclick="handleUpdateRemoved(${room.id},${cat.id},-10)">-10</button>
                    <button class="btn-small btn-sec" onclick="handleUpdateRemoved(${room.id},${cat.id},-5)">-5</button>
                    <button class="btn-small btn-sec" onclick="handleUpdateRemoved(${room.id},${cat.id},-1)">-1</button>
                    <button class="btn-small" onclick="handleUpdateRemoved(${room.id},${cat.id},1)">+1</button>
                    <button class="btn-small" onclick="handleUpdateRemoved(${room.id},${cat.id},5)">+5</button>
                    <button class="btn-small" onclick="handleUpdateRemoved(${room.id},${cat.id},10)">+10</button>
                </div>` : ''}
            `;
            catList.appendChild(cDiv);
        });
        
        container.appendChild(rDiv);
    });
}

draw();