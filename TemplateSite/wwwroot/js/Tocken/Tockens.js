let TockenList = [];
let editingTocken = false;



function saveToStorage() {
    $.post('/Tockens/GetAllData', function (response) {
        if (response.isSuccess) {
            TockenList = JSON.parse(response.data);
            localStorage.setItem("Tockens", JSON.stringify(TockenList));
            renderTable();
            nextId = Math.max(...TockenList.map(i => i.TockenId));
        }
        else {
            alert(response.errorTitle);
        }
    });
}
function loadFromStorage() {
    const saved = localStorage.getItem("Tockens");
    if (saved) {
        TockenList = JSON.parse(saved);
    }
    else saveToStorage();
}
function renderStats() {
    const total = TockenList.length, active = TockenList.filter(data => data.Status).length, inactive = TockenList.filter(data => !data.Status).length;
    document.getElementById("statsCards").innerHTML = `
            <div class="stat-card"><div class="stat-info"><div class="number">${total}</div><div class="label">کل توکن دسترسی</div></div><div class="stat-icon"><i class="fas fa-users"></i></div></div>
            <div class="stat-card"><div class="stat-info"><div class="number">${active}</div><div class="label">فعال</div></div><div class="stat-icon"><i class="fas fa-check-circle"></i></div></div>
            <div class="stat-card"><div class="stat-info"><div class="number">${inactive}</div><div class="label">غیرفعال</div></div><div class="stat-icon"><i class="fas fa-ban"></i></div></div>
        `;
}
function renderTable() {
    const searchTerm = document.getElementById("searchTocken").value.toLowerCase();
    const statusFilter = document.getElementById("statusFilter").value;
    let filtered = [...TockenList];
    if (searchTerm) filtered = filtered.filter(p =>p.TockenCaption.toLowerCase().includes(searchTerm) || p.TockenDetail.toLowerCase().includes(searchTerm));
    if (statusFilter !== "all") filtered = filtered.filter(p => p.Status.toString() === statusFilter);
    const tbody = document.getElementById("TockenTableBody");
    if (filtered.length === 0) { tbody.innerHTML = `<tr class="empty-row"><td colspan="7">هیچ رکورد یافت نشد</td></tr>`; renderStats(); return; }
    
    tbody.innerHTML = filtered.map(data => {
        
 const statusStatus = data.Status === true ? "فعال" : "غیرفعال";
        return `<tr>
                <td>
                  <div style="display:flex;align-items:center;gap:12px;">
                    <div><strong>${data.TockenId}</strong></div>
                  </div>
                </td>
                
 <td>${data.TockenCaption}</td>
 <td>${data.TockenDetail}</td>
 <td>${statusStatus}</td>
                <td class="action-buttons">
                    

<button class="action-btn LevelAccessTocken-btn" data-id="${data.TockenId}" title="ویرایش"><i class="fas fa-edit"></i></button>
                    <button class="action-btn edit-btn" data-id="${data.TockenId}" title="ویرایش"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete-btn" data-id="${data.TockenId}" title="حذف"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>`;
    }).join('');
    

document.querySelectorAll('.LevelAccessTocken-btn').forEach(btn => btn.addEventListener('click', (e) => { const id = parseInt(btn.dataset.id); GetLevelAccessTockenData(id); }));
    document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', (e) => { const id = parseInt(btn.dataset.id); openEditModal(id); }));
    document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', (e) => { if (confirm("حذف رکورد؟")) deleteTocken(parseInt(btn.dataset.id)); }));
    renderStats();
}
function deleteTocken(TockenId) {
    $.post('/Tockens/DeleteData', { 'id': TockenId }, function (response) {
        if (response.isSuccess) {
            TockenList = TockenList.filter(data => data.TockenId !== TockenId);
            saveToStorage();
            renderTable();
            alert(response.data);
        }
        else {
            alert(response.errorTitle);
        }
    });
}
const modal = document.getElementById("TockenModal");
const modalTitle = document.getElementById("modalTitle");
const empTockenId = document.getElementById("TockenId");const empTockenCaption = document.getElementById("TockenCaption");const empTockenDetail = document.getElementById("TockenDetail");const empStatus = document.getElementById("Status");

function openAddModal() {
    editingTocken = false;
    resetModal();
    openModal("TockenModal");
}
function openEditModal(TockenId) {
    const data = TockenList.find(data => data.TockenId === TockenId);
    if (data) {
        editingTocken = true;
        
	 empTockenId.value = data.TockenId;
	 empTockenCaption.value = data.TockenCaption;
	 empTockenDetail.value = data.TockenDetail;
	 empStatus.checked = Boolean(data.Status);
        modalTitle.innerText = "ویرایش رکورد";
        openModal("TockenModal");
    }
}
function CanselSaveModal() {
    closeModal("TockenModal");
    resetModal();
}
function SaveNewModel() {
    
	 const TockenId = empTockenId.value.trim();
	 const TockenCaption = empTockenCaption.value.trim();
	 const TockenDetail = empTockenDetail.value.trim();
	 const Status = empStatus.checked;
    if (!TockenCaption || !TockenDetail) {
        alert("لطفاً تمام فیلدها را پر کنید");
        return;
    }
    if (editingTocken) { updateTocken(TockenId,TockenCaption,TockenDetail,Status); } else { addTocken(TockenId,TockenCaption,TockenDetail,Status); }
    closeModal("TockenModal");
}
function addTocken(TockenId,TockenCaption,TockenDetail,Status) {
    const newTocken = {
        TockenId,TockenCaption,TockenDetail,Status
    };
    newTocken.TockenId = 0;
    SendData(newTocken, true);
}
function updateTocken(TockenId,TockenCaption,TockenDetail,Status) {
    const idx = TockenList.findIndex(data => data.TockenId == TockenId);
    if (idx !== -1) {
        TockenList[idx] = { TockenId,TockenCaption,TockenDetail,Status };
        SendData(TockenList[idx], false);
    }
}
function SendData(newTocken, typeRequst) {
    $.post('/Tockens/UpdateData', newTocken, function (response) {
        if (response.isSuccess) {
            if (typeRequst) {
                TockenList.push(newTocken);
            }
            saveToStorage();
            renderTable();
            alert(response.data);
        }
        else {
            alert(response.errorTitle);
        }
    });
}
function resetModal() {
    
 empTockenId.value = "";
 empTockenCaption.value = "";
 empTockenDetail.value = "";
 empStatus.checked = false;
    modalTitle.innerText = "افزودن رکورد جدید";
}
function openModal(Modal) {
    document.getElementById(Modal).classList.add("active");
}
function closeModal(Modal) {
    document.getElementById(Modal).classList.remove("active");
}

document.getElementById("searchTocken").addEventListener("input", () => renderTable());
document.getElementById("statusFilter").addEventListener("change", () => renderTable());
modal.addEventListener("click", (e) => { if (e.target === modal) closeModal("TockenModal"); });

loadFromStorage(); renderTable();




GetTocken();
let TockenId = 0;
function saveLevelAccessTocken() {
    let id = document.getElementById("LevelAccessTockenId").value;
    $.post('/LevelAccessTocken/AddData', { 'LevelAccessId': id, 'TockenId': TockenId }, function (response) {
        if (response.isSuccess) {
            GetLevelAccessTockenData(TockenId);
            alert(response.data);
        }
        else {
            alert(response.errorTitle);
        }
    });
}
function GetTocken() {
    $.post('/LevelAccesss/GetAllData', function (response) {
        if (response.isSuccess) {
            let options = "";
            let dataConvert = JSON.parse(response.data);
            dataConvert.forEach(function (item) {
                options = options + `<option value=\"${item.LevelAccessId}\">${item.LevelAccessCaption}</option>`;
            });
            document.getElementById("LevelAccessTockenId").innerHTML = options;
        }
        else {
            alert(response.errorTitle);
        }
    });
}
function GetLevelAccessTockenData(id) {
    TockenId = id;
  var Tocken = TockenList.filter(p => p.TockenId == id)[0];
    const modalLevelAccessTockenTitle = document.getElementById("modalLevelAccessTockenTitle");
    let title = modalLevelAccessTockenTitle.innerHTML;
    modalLevelAccessTockenTitle.innerHTML = title.split(" با ")[0] + " با " + Tocken.TockenCaption;  $.post('/LevelAccessTocken/GetData', { 'id': id }, function (response) {
        if (response.isSuccess) {
            openModal("LevelAccessTockenModal");
            let options = "";
            let filtered = JSON.parse(response.data);
            document.getElementById("LevelAccessTockenTableBody").innerHTML = filtered.map(data => {
                return `<tr>
                <td>${data.LevelAccessCaption}</td>
                <td class="action-buttons">
                    <button class="action-btn deleteLevelAccessTocken-btn" data-id="${data.LevelAccessId}" title="حذف"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>`;
            }).join('');
            document.querySelectorAll('.deleteLevelAccessTocken-btn').forEach(btn => btn.addEventListener('click', (e) => {
                if (confirm("حذف رکورد؟")) { deleteLevelAccessTocken(parseInt(btn.dataset.id)); }
            }));
        }
        else {
            alert(response.errorTitle);
        }
    });
}
function deleteLevelAccessTocken(LevelAccessId) {
    $.post('/LevelAccessTocken/DeleteData', { 'LevelAccessId': LevelAccessId, 'TockenId': TockenId }, function (response) {
        if (response.isSuccess) {
            GetLevelAccessTockenData(TockenId);
            alert(response.data);
        }
        else {
            alert(response.errorTitle);
        }
    });
}
 const modalLevelAccessTocken = document.getElementById("LevelAccessTockenModal");
 modalLevelAccessTocken.addEventListener("click", (e) => { if (e.target === modalLevelAccessTocken) closeModal('LevelAccessTockenModal'); });
 const modalAddLevelAccessTocken = document.getElementById("AddLevelAccessTockenModal");
 modalAddLevelAccessTocken.addEventListener("click", (e) => { if (e.target === modalAddLevelAccessTocken) closeModal('AddLevelAccessTockenModal'); });



