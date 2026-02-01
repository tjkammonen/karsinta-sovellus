// --- RENDER-MODALS.JS: Modaalien HTML-sisällöt ---

// --- APUFUNKTIOT (KOMPONENTIT) ---

function renderModalButtons(cancelAction, confirmAction, confirmText = "Tallenna") {
    return `
        <div class="modal-btn-group">
            <button class="btn-cancel" onclick="${cancelAction}">Peru</button>
            <button class="btn-save" onclick="${confirmAction}">${confirmText}</button>
        </div>
    `;
}

function renderAdjusterGrid(fnName, extraArgs = "") {
    const prefix = extraArgs ? `${extraArgs},` : "";
    return `
        <div class="control-grid">
            <button class="btn-large minus" onclick="${fnName}(${prefix}-5)">-&thinsp;5</button>
            <button class="btn-large plus" onclick="${fnName}(${prefix}1)">+&thinsp;1</button>
            <button class="btn-large plus" onclick="${fnName}(${prefix}5)">+&thinsp;5</button>
            <button class="btn-large minus" onclick="${fnName}(${prefix}-10)">-&thinsp;10</button>
            <button class="btn-large minus" onclick="${fnName}(${prefix}-1)">-&thinsp;1</button>
            <button class="btn-large plus" onclick="${fnName}(${prefix}10)">+&thinsp;10</button>
        </div>
    `;
}

function renderCorrectionGrid(fnName, extraArgs = "") {
    const prefix = extraArgs ? `${extraArgs},` : "";
    return `
        <div class="adjust-grid">
            <button class="btn-adjust" onclick="${fnName}(${prefix}-5)">-&thinsp;5</button>
            <button class="btn-adjust" onclick="${fnName}(${prefix}-1)">-&thinsp;1</button>
            <button class="btn-adjust" onclick="${fnName}(${prefix}1)">+&thinsp;1</button>
            <button class="btn-adjust" onclick="${fnName}(${prefix}5)">+&thinsp;5</button>
        </div>
    `;
}

function renderDangerButton(text, action, disabled = false, infoText = "") {
    if (disabled) {
        return `
            <div style="margin-top: 20px;">
                <span class="delete-info-text">${infoText}</span>
                <button class="btn-delete-room" disabled>${text}</button>
            </div>`;
    }
    return `
        <div style="margin-top: 20px;">
            <button class="btn-delete-room" onclick="${action}">${text}</button>
        </div>`;
}

function renderRenameButton(action) {
    return `<button class="btn-lock" onclick="${action}" style="width:100%; margin-top:10px;">Nimeä uudelleen</button>`;
}

function updateRoomNameFromTemplate(select) {
    const nameInput = document.getElementById('modal-room-name');
    if (!nameInput) return;

    const selectedOption = select.options[select.selectedIndex];
    if (!selectedOption || selectedOption.disabled) return;

    let newName = selectedOption.text.split('(')[0].trim();
    if (select.value === 'empty') newName = '';

    const currentVal = nameInput.value;
    const lastAuto = nameInput.getAttribute('data-last-autofilled') || '';

    if (currentVal === '' || currentVal === lastAuto) {
        nameInput.value = newName;
        nameInput.setAttribute('data-last-autofilled', newName);
    }
}

// --- UUSI LOGIIKKA: Huoneen lukituksen käsittely ---
function processRoomLock(roomId) {
    const room = state.find(r => r.id === roomId);
    if (!room) return;

    // 1. Vaihdetaan tila data.js:n funktiolla
    handleToggleRoomLock(roomId);

    // 2. Tarkistetaan uusi tila
    if (room.locked) {
        renderRoomVictoryModal(roomId);
    } else {
        renderRoomModal(roomId);
    }
}

// --- UUSI: HUONEKOHTAINEN VOITTOKORTTI ---
function renderRoomVictoryModal(roomId) {
    const room = state.find(r => r.id === roomId);
    if (!room) return;
    
    const container = document.getElementById('modal-body');
    const modal = document.getElementById('edit-modal');
    
    modal.style.backgroundColor = "rgba(0,0,0,0.92)";
    container.className = "modal-content"; 
    container.style.background = "transparent"; 
    container.style.boxShadow = "none";

    let rStart = 0, rGoal = 0, rRem = 0;
    room.categories.forEach(c => { 
        rStart += c.start;
        rGoal += Math.ceil(c.start / 3); 
        rRem += c.removed; 
    });
    const rPerc = rGoal > 0 ? Math.round((rRem / rGoal) * 100) : 0;
    
    let confettiHTML = '';
    for(let i=0; i<20; i++) {
        const left = Math.random() * 100;
        const delay = Math.random() * 2;
        const color = ['#FFD700', '#fff'][Math.floor(Math.random()*2)];
        confettiHTML += `<div class="confetti" style="left:${left}%; animation-delay:${delay}s; background:${color};"></div>`;
    }

    container.innerHTML = `
        <div style="height:100%; display:flex; flex-direction:column; justify-content:center; align-items:center;">
            ${confettiHTML}
            
            <div class="victory-card-container">
                <div class="victory-badge">HUONE VALMIS</div>
                <div class="victory-title" style="font-size:2em; margin-bottom:5px;">${escapeHtml(room.name)}</div>
                
                <hr style="border-color:#555; margin:15px 0;">
                
                <div class="victory-stat-big" style="font-size:3.5em; margin:10px 0;">${rRem}</div>
                <div style="font-size:1.1em; color:#ccc; text-transform:uppercase; letter-spacing:1px; margin-bottom:20px;">Tavaraa poistettu</div>
                
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; text-align:left; font-size:0.9em; color:#aaa;">
                    <div>Alkumäärä: <span style="color:#fff;">${rStart}</span></div>
                    <div>Tavoite: <span style="color:#fff;">${rGoal}</span></div>
                </div>
                
                <div style="margin-top:15px; font-weight:bold; color:#FFD700; font-size:1.2em;">
                    Suoritus: ${rPerc} %
                </div>
            </div>

            <div style="margin-top:30px; width:100%; max-width:400px;">
                <button class="btn-victory-share" onclick="handleShareRoomVictory('${room.id}')" style="width:100%; font-size:1em; padding:12px;">📤 Jaa Whatsappiin</button>
                <button class="btn-victory-close" onclick="closeRoomVictoryModal('${room.id}')" style="width:100%; background:#333; color:#ccc; border:none; margin-top:10px;">Sulje ja palaa</button>
                <p style="color:#666; font-size:0.8em; margin-top:10px; text-align:center;">Ota kuvakaappaus kortista ja jaa se somessa!</p>
            </div>
        </div>
    `;
}

function handleShareRoomVictory(roomId) {
    const room = state.find(r => r.id === roomId);
    if (!room) return;
    
    let rRem = 0; 
    room.categories.forEach(c => rRem += c.removed);

    const text = `✅ ${room.name} VALMIS!\n\nPoistin huoneesta ${rRem} turhaa tavaraa.\nProjekti etenee! #karsi33`;
    
    if (navigator.share) {
        navigator.share({ title: "Huone valmis!", text: text }).catch(err => console.log(err));
    } else {
        navigator.clipboard.writeText(text).then(() => alert("Teksti kopioitu leikepöydälle!"));
    }
}

function closeRoomVictoryModal(roomId) {
    const modal = document.getElementById('edit-modal');
    const container = document.getElementById('modal-body');
    modal.style.backgroundColor = "rgba(255, 255, 255, 0.98)";
    container.style.background = "#fff";
    container.style.boxShadow = "none";
    container.className = "modal-content";
    renderRoomModal(roomId);
}

// --- VARSINAISET MODAALIT ---

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
            const lockIcon = room.locked ? '🔒' : '';
            listHTML += `
                <div class="stats-detailed-row">
                    <div class="flex">
                        <strong>${lockIcon} ${isDone ? '✅' : '📦'} ${escapeHtml(room.name)}</strong>
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

function renderVictoryModal() {
    const container = document.getElementById('modal-body');
    const modal = document.getElementById('edit-modal');
    
    modal.style.backgroundColor = "rgba(0,0,0,0.95)";
    container.className = "modal-content victory-modal-content"; 
    container.style.background = "#1a1a1a";
    container.style.boxShadow = "none";

    let totalStart = 0, totalRem = 0, totalGoal = 0;
    state.forEach(r => r.categories.forEach(c => {
        totalStart += c.start;
        totalRem += c.removed;
        totalGoal += Math.ceil(c.start/3);
    }));
    const perc = totalGoal > 0 ? Math.round((totalRem/totalGoal)*100) : 0;

    let confettiHTML = '';
    for(let i=0; i<30; i++) {
        const left = Math.random() * 100;
        const delay = Math.random() * 2;
        const color = ['#FFD700', '#FFF', '#FF4500'][Math.floor(Math.random()*3)];
        confettiHTML += `<div class="confetti" style="left:${left}%; animation-delay:${delay}s; background:${color};"></div>`;
    }

    container.innerHTML = `
        <div style="position:relative; overflow:hidden; height:100%; display:flex; flex-direction:column; justify-content:center; align-items:center;">
            ${confettiHTML}
            
            <div class="victory-title">Urakka<br>Valmis!</div>
            <div class="victory-subtitle">Karsintatavoite saavutettu</div>
            
            <div class="victory-stat-big">${totalRem}</div>
            <div style="font-size:1.2em; color:#fff; margin-bottom:10px;">tavaraa poistettu</div>
            
            <div style="background:rgba(255,255,255,0.1); padding:15px; border-radius:12px; margin-top:20px; width:80%;">
                <div style="display:flex; justify-content:space-between; margin-bottom:5px; color:#ccc; font-size:0.9em;">
                    <span>Alkumäärä</span>
                    <span>${totalStart}</span>
                </div>
                <div style="display:flex; justify-content:space-between; color:#FFD700; font-weight:bold; font-size:1.1em;">
                    <span>Valmiusaste</span>
                    <span>${perc} %</span>
                </div>
            </div>

            <button class="btn-victory-share" onclick="handleShareVictory()">📤 JAA TULOS</button>
            <button class="btn-victory-close" onclick="closeVictoryModal()">Sulje ja ihaile</button>
        </div>
    `;
}

function closeVictoryModal() {
    const modal = document.getElementById('edit-modal');
    const container = document.getElementById('modal-body');
    modal.style.backgroundColor = "rgba(255, 255, 255, 0.98)";
    container.className = "modal-content";
    container.style.background = "#fff";
    resetViews();
    draw();
}

function handleShareVictory() {
    let totalRem = 0;
    state.forEach(r => r.categories.forEach(c => totalRem += c.removed));
    
    const text = `🏆 URAKKA VALMIS!\n\nOlen karsinut kodistani ${totalRem} turhaa tavaraa.\nKoti on nyt 33% kevyempi.\n\n#karsi33`;
    
    if (navigator.share) {
        navigator.share({ title: "Karsi 33% - Valmis!", text: text }).catch(err => console.log(err));
    } else {
        navigator.clipboard.writeText(text).then(() => alert("Teksti kopioitu leikepöydälle!"));
    }
}

function renderSettingsModal() {
    const resetButton = renderDangerButton("Tyhjennä kaikki tiedot", "handleResetApp()");

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
                ${resetButton}
            </div>
        </div>
        <div class="modal-footer"><button class="btn-close-modal" onclick="closeSettingsModal()">Sulje</button></div>
    `;
}

function renderCreateRoomModal() {
    const buttons = renderModalButtons("closeAddRoomModal()", "triggerCreateRoom()", "Luo");

    let options = '';
    const keys = Object.keys(ROOM_TEMPLATES);
    const sortedKeys = ['empty', ...keys.filter(k => k !== 'empty')];

    sortedKeys.forEach(key => {
        const tpl = ROOM_TEMPLATES[key];
        options += `<option value="${key}">${tpl.label}</option>`;
    });

    document.getElementById('modal-body').innerHTML = `
        <div class="modal-header"><h2 style="margin:0; font-size:1.4em;">Uusi huone</h2></div>
        <div style="flex: 1; overflow-y: auto; padding-top: 20px;">
            
            <div class="modal-input-group">
                <label class="modal-label">Valitse pohja</label>
                <select id="modal-room-template" class="modal-input" onchange="updateRoomNameFromTemplate(this)">
                    <option value="" disabled selected>Valitse listasta...</option>
                    ${options}
                </select>
            </div>

            <div class="modal-input-group">
                <label class="modal-label">Nimi</label>
                <input type="text" id="modal-room-name" class="modal-input" placeholder="Esim. Varasto" autocomplete="off" data-last-autofilled="">
            </div>
            
            <div style="font-size:0.9em; color:#666; margin-top:10px;">
                Valitse pohja nopeuttaaksesi aloitusta. Pohja luo valmiit kategoriat.
            </div>
        </div>
        ${buttons}
    `;
    setTimeout(() => { 
        const s = document.getElementById('modal-room-template'); 
        if(s) s.focus(); 
    }, 100);
}

function renderAddCategoryModal(activeAddRoomId) {
    if (!activeAddRoomId) return;
    const room = state.find(r => r.id === activeAddRoomId); 
    if (!room) return;

    const buttons = renderModalButtons("closeAddCategoryModal()", `handleAddCategory('${room.id}')`, "Tallenna");
    const adjusterGrid = renderAdjusterGrid("adjustAddModalInput");

    document.getElementById('modal-body').innerHTML = `
        <div class="modal-header">
             <div style="display:flex; align-items:center; gap:10px;">
                <button onclick="closeAddCategoryModal()" style="background:none; border:none; font-size:1.5em; padding:0; cursor:pointer; color:#666;">←</button>
                <h2 style="margin:0; font-size:1.4em;">Lisää kategoria</h2>
            </div>
            <div style="color:#666; font-size:0.9em; margin-left:35px;">${escapeHtml(room.name)}</div>
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

            <div style="margin-bottom:20px;">
                ${adjusterGrid}
            </div>

            <p style="color:#666; font-size:0.9em; text-align:center;">Tavoite: 33&thinsp;% tästä</p>
        </div>
        ${buttons}
    `;
    setTimeout(() => { const i = document.getElementById('modal-cat-name'); if(i) i.focus(); }, 100);
}

function renderCategoryEditModal(roomId, catId) {
    const room = state.find(r => r.id === roomId);
    if (!room) return;
    const cat = room.categories.find(c => c.id === catId);
    if (!cat) return;

    const goal = Math.ceil(cat.start / 3);
    const diff = cat.removed - goal;
    const isL = cat.locked;
    const isRoomLocked = room.locked;

    const deleteButton = renderDangerButton("Poista", `handleDeleteCat('${room.id}','${cat.id}')`);
    const renameButton = renderRenameButton(`handleRenameCategory('${room.id}','${cat.id}')`);
    const removedGrid = renderAdjusterGrid("handleUpdateRemoved", `'${roomId}','${catId}'`);
    const correctionGrid = renderCorrectionGrid("handleEditStartAmount", `'${roomId}','${catId}'`);

    if (isRoomLocked) {
        document.getElementById('modal-body').innerHTML = `
            <div class="modal-header">
                <div style="display:flex; align-items:center; gap:10px;">
                    <button onclick="closeCategoryModal()" style="background:none; border:none; font-size:1.5em; padding:0; cursor:pointer; color:#666;">←</button>
                    <h2 style="margin:0; font-size:1.4em;">${escapeHtml(cat.name)}</h2>
                </div>
                <div style="color:#666; font-size:0.9em; margin-left:35px;">${escapeHtml(room.name)}</div>
            </div>
            <div style="text-align:center; padding:30px; background:#f0f9f9; border-radius:12px; margin-top:20px;">
                <div style="font-size:3em;">🔒</div>
                <h3>Huone on lukittu</h3>
                <p>Avaa huoneen lukitus muokataksesi kategoriaa.</p>
            </div>
            <div class="modal-footer"><button class="btn-close-modal" onclick="closeCategoryModal()">Sulje</button></div>
        `;
        return;
    }

    document.getElementById('modal-body').innerHTML = `
        <div class="modal-header">
            <div style="display:flex; align-items:center; gap:10px;">
                <button onclick="closeCategoryModal()" style="background:none; border:none; font-size:1.5em; padding:0; cursor:pointer; color:#666;">←</button>
                <h2 style="margin:0; font-size:1.4em;">${escapeHtml(cat.name)}</h2>
            </div>
            <div style="color:#666; font-size:0.9em; margin-left:35px;">${escapeHtml(room.name)}</div>
        </div>

        <div class="big-stat-display">
            <div class="sub-label">Poistettu</div>
            <div class="stat-row"><span class="big-number">${cat.removed}</span><span class="goal-number">/ ${goal}</span></div>
             <div class="bar-bg" style="height:12px; margin-top:5px; background:#eee;"><div class="bar-fill" style="width:${Math.min(100, (cat.removed/goal)*100)}%"></div></div>
            <div style="margin-top:8px; font-weight:bold; font-size:0.9em; color: ${diff >= 0 ? 'var(--p)' : '#666'}">${diff >= 0 ? 'Tavoite saavutettu!' : `Puuttuu: ${Math.abs(diff)}`}</div>
        </div>
        ${!isL ? `
        <div style="flex: 1; overflow-y: auto;">
            <div style="margin-top:20px;">
                ${removedGrid}
            </div>
            
            <div style="margin-top:15px; border-top:1px solid #eee; padding-top:15px; padding-bottom:10px;">
                <div style="color:#666; font-size:0.85em; text-align:center; margin-bottom:5px;">Korjaa alkumäärää (Nyt: <strong>${cat.start}</strong>)</div>
                ${correctionGrid}
            </div>
            <div style="margin-top: 20px;">
                <button class="btn-lock" onclick="handleToggleLock('${room.id}','${cat.id}')" style="width:100%; font-size:0.9em; padding:12px; background:white; color:var(--p); border:1px solid var(--p); margin-bottom:10px;">Lukitse</button>
                ${renameButton}
                ${deleteButton}
            </div>
        </div>` : `
        <div style="text-align:center; padding:30px; background:#f0f9f9; border-radius:12px; margin-bottom:20px;">
            <div style="font-size:3em;">🔒</div><h3>Lukittu</h3>
            <button class="btn-unlock" onclick="handleToggleLock('${room.id}','${cat.id}')" style="margin-top:20px; padding:15px; font-size:1em; width:100%;">Avaa</button>
        </div>`}
        <div class="modal-footer"><button class="btn-close-modal" onclick="closeCategoryModal()">Valmis</button></div>
    `;
}

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

    // --- UUSI: Tarkistetaan, onko huone "kultainen" myös modaalissa ---
    const isRoomGold = room.locked && rPerc >= 100;
    
    // Jos kultainen, lisätään kultaiset tyylit ja klikkaustoiminto
    const summaryClass = isRoomGold ? "overall-summary gold-mode hover-card" : "overall-summary";
    const summaryStyle = isRoomGold ? "margin-bottom:0; padding:10px; cursor:pointer;" : "margin-bottom:0; padding:10px; background:#f0f9f9;";
    const summaryClick = isRoomGold ? `onclick="renderRoomVictoryModal('${room.id}')"` : "";

    let catListHTML = '';
    room.categories.forEach(cat => {
        const goal = Math.ceil(cat.start/3);
        const perc = goal > 0 ? (cat.removed/goal)*100 : 0;
        const isL = cat.locked;
        catListHTML += `
            <div class="category-item ${isL ? 'locked' : ''}" onclick="openCategoryModal('${room.id}', '${cat.id}')" style="cursor:pointer;">
                <div class="flex">
                    <strong>${escapeHtml(cat.name)} ${isL ? '🔒' : ''}</strong>
                    <div style="color:var(--p);">➔</div>
                </div>
                <div style="font-size:0.9em; margin:5px 0;">Alku: ${cat.start} | Poistettu: ${cat.removed}</div>
                <div class="bar-bg"><div class="bar-fill" style="width:${Math.min(100, perc)}%"></div></div>
            </div>
        `;
    });

    const deleteButton = renderDangerButton("Poista huone", `handleDeleteRoom('${room.id}')`, hasLockedCats, "Huoneessa on lukittuja kategorioita.");
    const renameButton = renderRenameButton(`handleRenameRoom('${room.id}')`);

    const lockText = room.locked ? "🔓 Avaa huone" : "🔒 Lukitse huone (Valmis)";
    const lockAction = `processRoomLock('${room.id}')`;

    const lockButton = `
        <button onclick="${lockAction}" 
        style="width:100%; margin-top:20px; padding:15px; font-size:1.1em; border-radius:8px; 
               background:${room.locked ? 'var(--accent)' : 'var(--white)'}; 
               color:${room.locked ? 'white' : 'var(--p)'}; 
               border: 2px solid ${room.locked ? 'transparent' : 'var(--p)'};">
            ${lockText}
        </button>
    `;

    const addCatBtn = room.locked 
        ? `<div style="text-align:center; padding:10px; color:var(--accent); font-weight:bold;">🔒 HUONE LUKITTU</div>` 
        : `<button class="btn-add-trigger" onclick="openAddCategoryModal('${room.id}')" style="margin-top:10px; padding:10px; font-size:0.9em;">+ Uusi kategoria</button>`;

    const managementButtons = room.locked 
        ? '' 
        : `
             <div style="margin-top:10px;">
                ${renameButton}
                ${deleteButton}
             </div>
        `;
        
    const percColor = isRoomGold ? "#4a3b00" : "var(--p)";

    const container = document.getElementById('modal-body');
    container.innerHTML = `
        <div class="modal-header">
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
                <button onclick="closeRoomModal()" style="background:none; border:none; font-size:1.5em; padding:0; cursor:pointer; color:#666;">←</button>
                <h2 style="margin:0; font-size:1.4em;">${room.locked ? '🔒 ' : ''}${escapeHtml(room.name)}</h2>
            </div>
            
            <div class="${summaryClass}" style="${summaryStyle}" ${summaryClick}>
                <div class="flex" style="margin-bottom:5px;">
                    <strong style="font-size:0.9em; color:var(--text);">${isRoomGold ? '🏆 VALMIS' : 'Valmis'}</strong>
                    <strong style="color:${percColor}; font-size:1.1em;">${Math.round(rPerc)}&thinsp;%</strong>
                </div>
                <div class="bar-bg" style="height:10px; margin:5px 0;"><div class="bar-fill" style="width:${Math.min(100, rPerc)}%"></div></div>
                <div style="font-size:0.8em; margin-top:5px; color:#666;">
                    Yhteensä: ${rStart} tavaraa
                </div>
            </div>
        </div>

        <div style="flex: 1; overflow-y: auto;">
             ${addCatBtn}
             <div style="margin-top:10px;">
                ${catListHTML}
             </div>
             
             ${lockButton}
             ${managementButtons}
        </div>
    `;
}