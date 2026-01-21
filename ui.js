function draw() {
    const container = document.getElementById('roomContainer');
    const dashboard = document.getElementById('room-dashboard');
    if (!container || !dashboard) return;

    container.innerHTML = '';
    dashboard.innerHTML = '<h3>Huoneiden tilanne</h3>';
    
    let tGoal = 0, tRem = 0;

    const sortedRooms = [...state].map(room => {
        let rGoal = 0, rRem = 0;
        room.categories.forEach(cat => {
            const g = Math.ceil(cat.start / 3);
            rGoal += g; rRem += cat.removed;
        });
        return { ...room, sortPerc: rGoal > 0 ? (rRem / rGoal) : -1 };
    }).sort((a, b) => b.sortPerc - a.sortPerc);

    sortedRooms.forEach(room => {
        let rStart = 0, rGoal = 0, rRem = 0;
        room.categories.forEach(c => {
            const g = Math.ceil(c.start/3);
            rStart += c.start; rGoal += g; rRem += c.removed;
            tGoal += g; tRem += Math.min(g, c.removed);
        });

        const rPerc = rGoal > 0 ? (rRem/rGoal)*100 : 0;
        const diff = rRem - rGoal;

        dashboard.innerHTML += `
            <div class="dashboard-item">
                <div class="dashboard-label"><span>${room.name}</span><span>${rRem}/${rGoal}</span></div>
                <div class="bar-bg"><div class="bar-fill bar-room" style="width:${Math.min(100, rPerc)}%"></div></div>
            </div>`;

        const rDiv = document.createElement('div');
        rDiv.className = 'room-section';
        rDiv.innerHTML = `
            <div class="flex"><h2>${room.name}</h2><button class="btn-del btn-small" onclick="handleDeleteRoom(${room.id})">Poista</button></div>
            <div class="room-summary">
                <div>Tavaroita: ${rStart} | Poistettu: ${rRem}/${rGoal}</div>
                <div class="bar-bg"><div class="bar-fill bar-room" style="width:${Math.min(100, rPerc)}%"></div></div>
                <div style="font-size:0.8em; font-weight:bold;">${diff >= 0 ? 'Tavoite ylitetty 💪' : 'Vielä matkaa 🧐'}</div>
            </div>
            <div id="cat-list-${room.id}"></div>
            <div class="category-form">
                <div class="flex"><input type="text" id="catName-${room.id}" placeholder="Kategoria"><input type="number" id="catCount-${room.id}" placeholder="Kpl" style="max-width:70px;"></div>
                <button class="btn-add" onclick="handleAddCategory(${room.id})">Lisää kategoria</button>
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
                    <div><button class="${isL?'btn-unlock':'btn-lock'}" onclick="handleToggleLock(${room.id},${cat.id})">${isL?'Avaa lukitus':'Lukitse'}</button>
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

    const totalPerc = tGoal > 0 ? Math.round((tRem / tGoal) * 100) : 0;
    const mainBar = document.getElementById('main-bar');
    if (mainBar) mainBar.style.width = totalPerc + '%';
    const overallText = document.querySelector('#overall strong');
    if (overallText) overallText.innerText = `Koko kodin edistyminen: ${totalPerc}%`;
}

// Ensimmäinen piirto kun sivu latautuu
draw();