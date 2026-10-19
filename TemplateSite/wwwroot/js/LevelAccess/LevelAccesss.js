let LevelAccessList = [];
let editingLevelAccess = false;



function saveToStorage() {
    $.post('/LevelAccesss/GetAllData', function (response) {
        if (response.isSuccess) {
            LevelAccessList = JSON.parse(response.data);
            localStorage.setItem("LevelAccesss", JSON.stringify(LevelAccessList));
            renderTable();
            nextId = Math.max(...LevelAccessList.map(i => i.LevelAccessId));
        }
        else {
            alert(response.errorTitle);
        }
    });
}
function loadFromStorage() {
    const saved = localStorage.getItem("LevelAccesss");
    if (saved) {
        LevelAccessList = JSON.parse(saved);
    }
    else saveToStorage();
}
function renderStats() {
    const total = LevelAccessList.length, active = LevelAccessList.filter(data => data.Status).length, inactive = LevelAccessList.filter(data => !data.Status).length;
    document.getElementById("statsCards").innerHTML = `
            <div class="stat-card"><div class="stat-info"><div class="number">${total}</div><div class="label">کل دسترسی سیستم</div></div><div class="stat-icon"><i class="fas fa-users"></i></div></div>
            <div class="stat-card"><div class="stat-info"><div class="number">${active}</div><div class="label">فعال</div></div><div class="stat-icon"><i class="fas fa-check-circle"></i></div></div>
            <div class="stat-card"><div class="stat-info"><div class="number">${inactive}</div><div class="label">غیرفعال</div></div><div class="stat-icon"><i class="fas fa-ban"></i></div></div>
        `;
}
function renderTable() {
    const searchTerm = document.getElementById("searchLevelAccess").value.toLowerCase();
    const statusFilter = document.getElementById("statusFilter").value;
    let filtered = [...LevelAccessList];
    if (searchTerm) filtered = filtered.filter(p =>p.LevelAccessCaption.toLowerCase().includes(searchTerm));
    if (statusFilter !== "all") filtered = filtered.filter(p => p.Status.toString() === statusFilter);
    const tbody = document.getElementById("LevelAccessTableBody");
    if (filtered.length === 0) { tbody.innerHTML = `<tr class="empty-row"><td colspan="7">هیچ رکورد یافت نشد</td></tr>`; renderStats(); return; }
    
    tbody.innerHTML = filtered.map(data => {
        
 const statusStatus = data.Status === true ? "فعال" : "غیرفعال";
        return `<tr>
                <td>
                  <div style="display:flex;align-items:center;gap:12px;">
                    <div><strong>${data.LevelAccessId}</strong></div>
                  </div>
                </td>
                
 <td>${data.LevelAccessCaption}</td>
 <td>${data.CodeAccess}</td>
 <td>${statusStatus}</td>
                <td class="action-buttons">
                    
<button class="action-btn LevelAccessPage-btn" data-id="${data.LevelAccessId}" title="ویرایش"><i class="fas fa-edit"></i></button>
                    <button class="action-btn edit-btn" data-id="${data.LevelAccessId}" title="ویرایش"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete-btn" data-id="${data.LevelAccessId}" title="حذف"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>`;
    }).join('');
    
document.querySelectorAll('.LevelAccessPage-btn').forEach(btn => btn.addEventListener('click', (e) => { const id = parseInt(btn.dataset.id); GetLevelAccessPageData(id); }));
    document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', (e) => { const id = parseInt(btn.dataset.id); openEditModal(id); }));
    document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', (e) => { if (confirm("حذف رکورد؟")) deleteLevelAccess(parseInt(btn.dataset.id)); }));
    renderStats();
}
function deleteLevelAccess(LevelAccessId) {
    $.post('/LevelAccesss/DeleteData', { 'id': LevelAccessId }, function (response) {
        if (response.isSuccess) {
            LevelAccessList = LevelAccessList.filter(data => data.LevelAccessId !== LevelAccessId);
            saveToStorage();
            renderTable();
            alert(response.data);
        }
        else {
            alert(response.errorTitle);
        }
    });
}
const modal = document.getElementById("LevelAccessModal");
const modalTitle = document.getElementById("modalTitle");
const empLevelAccessId = document.getElementById("LevelAccessId");const empLevelAccessCaption = document.getElementById("LevelAccessCaption");const empCodeAccess = document.getElementById("CodeAccess");const empStatus = document.getElementById("Status");

function openAddModal() {
    editingLevelAccess = false;
    resetModal();
    openModal("LevelAccessModal");
}
function openEditModal(LevelAccessId) {
    const data = LevelAccessList.find(data => data.LevelAccessId === LevelAccessId);
    if (data) {
        editingLevelAccess = true;
        
	 empLevelAccessId.value = data.LevelAccessId;
	 empLevelAccessCaption.value = data.LevelAccessCaption;
	 empCodeAccess.value = data.CodeAccess;
	 empStatus.checked = Boolean(data.Status);
        modalTitle.innerText = "ویرایش رکورد";
        openModal("LevelAccessModal");
    }
}
function CanselSaveModal() {
    closeModal("LevelAccessModal");
    resetModal();
}
function SaveNewModel() {
    
	 const LevelAccessId = empLevelAccessId.value.trim();
	 const LevelAccessCaption = empLevelAccessCaption.value.trim();
	 const CodeAccess = empCodeAccess.value.trim();
	 const Status = empStatus.checked;
    if (!LevelAccessCaption || !CodeAccess) {
        alert("لطفاً تمام فیلدها را پر کنید");
        return;
    }
    if (editingLevelAccess) { updateLevelAccess(LevelAccessId,LevelAccessCaption,CodeAccess,Status); } else { addLevelAccess(LevelAccessId,LevelAccessCaption,CodeAccess,Status); }
    closeModal("LevelAccessModal");
}
function addLevelAccess(LevelAccessId,LevelAccessCaption,CodeAccess,Status) {
    const newLevelAccess = {
        LevelAccessId,LevelAccessCaption,CodeAccess,Status
    };
    newLevelAccess.LevelAccessId = 0;
    SendData(newLevelAccess, true);
}
function updateLevelAccess(LevelAccessId,LevelAccessCaption,CodeAccess,Status) {
    const idx = LevelAccessList.findIndex(data => data.LevelAccessId == LevelAccessId);
    if (idx !== -1) {
        LevelAccessList[idx] = { LevelAccessId,LevelAccessCaption,CodeAccess,Status };
        SendData(LevelAccessList[idx], false);
    }
}
function SendData(newLevelAccess, typeRequst) {
    $.post('/LevelAccesss/UpdateData', newLevelAccess, function (response) {
        if (response.isSuccess) {
            if (typeRequst) {
                LevelAccessList.push(newLevelAccess);
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
    
 empLevelAccessId.value = "";
 empLevelAccessCaption.value = "";
 empCodeAccess.value = "";
 empStatus.checked = false;
    modalTitle.innerText = "افزودن رکورد جدید";
}
function openModal(Modal) {
    document.getElementById(Modal).classList.add("active");
}
function closeModal(Modal) {
    document.getElementById(Modal).classList.remove("active");
}

document.getElementById("searchLevelAccess").addEventListener("input", () => renderTable());
document.getElementById("statusFilter").addEventListener("change", () => renderTable());
modal.addEventListener("click", (e) => { if (e.target === modal) closeModal("LevelAccessModal"); });

loadFromStorage(); renderTable();



GetLevelAccess();
let LevelAccessId = 0;
function saveLevelAccessPage() {
    let id = document.getElementById("LevelAccessPageId").value;
    $.post('/LevelAccessPage/AddData', { 'PageId': id, 'LevelAccessId': LevelAccessId }, function (response) {
        if (response.isSuccess) {
            GetLevelAccessPageData(LevelAccessId);
            alert(response.data);
        }
        else {
            alert(response.errorTitle);
        }
    });
}
function GetLevelAccess() {
    $.post('/Pages/GetAllData', function (response) {
        if (response.isSuccess) {
            let options = "";
            let dataConvert = JSON.parse(response.data);
            dataConvert.forEach(function (item) {
                options = options + `<option value=\"${item.PageId}\">${item.PageCaption}</option>`;
            });
            document.getElementById("LevelAccessPageId").innerHTML = options;
        }
        else {
            alert(response.errorTitle);
        }
    });
}
function GetLevelAccessPageData(id) {
    LevelAccessId = id;
  var LevelAccess = LevelAccessList.filter(p => p.LevelAccessId == id)[0];
    const modalLevelAccessPageTitle = document.getElementById("modalLevelAccessPageTitle");
    let title = modalLevelAccessPageTitle.innerHTML;
    modalLevelAccessPageTitle.innerHTML = title.split(" با ")[0] + " با " + LevelAccess.LevelAccessCaption;  $.post('/LevelAccessPage/GetData', { 'id': id }, function (response) {
        if (response.isSuccess) {
            openModal("LevelAccessPageModal");
            let options = "";
            let filtered = JSON.parse(response.data);
            document.getElementById("LevelAccessPageTableBody").innerHTML = filtered.map(data => {
                return `<tr>
                <td>${data.PageCaption}</td>
                <td class="action-buttons">
                    <button class="action-btn deleteLevelAccessPage-btn" data-id="${data.PageId}" title="حذف"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>`;
            }).join('');
            document.querySelectorAll('.deleteLevelAccessPage-btn').forEach(btn => btn.addEventListener('click', (e) => {
                if (confirm("حذف رکورد؟")) { deleteLevelAccessPage(parseInt(btn.dataset.id)); }
            }));
        }
        else {
            alert(response.errorTitle);
        }
    });
}
function deleteLevelAccessPage(PageId) {
    $.post('/LevelAccessPage/DeleteData', { 'PageId': PageId, 'LevelAccessId': LevelAccessId }, function (response) {
        if (response.isSuccess) {
            GetLevelAccessPageData(LevelAccessId);
            alert(response.data);
        }
        else {
            alert(response.errorTitle);
        }
    });
}
 const modalLevelAccessPage = document.getElementById("LevelAccessPageModal");
 modalLevelAccessPage.addEventListener("click", (e) => { if (e.target === modalLevelAccessPage) closeModal('LevelAccessPageModal'); });
 const modalAddLevelAccessPage = document.getElementById("AddLevelAccessPageModal");
 modalAddLevelAccessPage.addEventListener("click", (e) => { if (e.target === modalAddLevelAccessPage) closeModal('AddLevelAccessPageModal'); });



