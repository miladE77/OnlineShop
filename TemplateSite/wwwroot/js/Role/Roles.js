let RoleList = [];
let editingRole = false;



function saveToStorage() {
    $.post('/Roles/GetAllData', function (response) {
        if (response.isSuccess) {
            RoleList = JSON.parse(response.data);
            localStorage.setItem("Roles", JSON.stringify(RoleList));
            renderTable();
            nextId = Math.max(...RoleList.map(i => i.RoleId));
        }
        else {
            alert(response.errorTitle);
        }
    });
}
function loadFromStorage() {
    const saved = localStorage.getItem("Roles");
    if (saved) {
        RoleList = JSON.parse(saved);
    }
    else saveToStorage();
}
function renderStats() {
    const total = RoleList.length, active = RoleList.filter(data => data.Status).length, inactive = RoleList.filter(data => !data.Status).length;
    document.getElementById("statsCards").innerHTML = `
            <div class="stat-card"><div class="stat-info"><div class="number">${total}</div><div class="label">کل نقش سیستم</div></div><div class="stat-icon"><i class="fas fa-users"></i></div></div>
            <div class="stat-card"><div class="stat-info"><div class="number">${active}</div><div class="label">فعال</div></div><div class="stat-icon"><i class="fas fa-check-circle"></i></div></div>
            <div class="stat-card"><div class="stat-info"><div class="number">${inactive}</div><div class="label">غیرفعال</div></div><div class="stat-icon"><i class="fas fa-ban"></i></div></div>
        `;
}
function renderTable() {
    const searchTerm = document.getElementById("searchRole").value.toLowerCase();
    const statusFilter = document.getElementById("statusFilter").value;
    let filtered = [...RoleList];
    if (searchTerm) filtered = filtered.filter(p =>p.RoleCaption.toLowerCase().includes(searchTerm));
    if (statusFilter !== "all") filtered = filtered.filter(p => p.Status.toString() === statusFilter);
    const tbody = document.getElementById("RoleTableBody");
    if (filtered.length === 0) { tbody.innerHTML = `<tr class="empty-row"><td colspan="7">هیچ رکورد یافت نشد</td></tr>`; renderStats(); return; }
    
    tbody.innerHTML = filtered.map(data => {
        
 const statusStatus = data.Status === true ? "فعال" : "غیرفعال";
        return `<tr>
                <td>
                  <div style="display:flex;align-items:center;gap:12px;">
                    <div><strong>${data.RoleId}</strong></div>
                  </div>
                </td>
                
 <td>${data.RoleCaption}</td>
 <td>${statusStatus}</td>
                <td class="action-buttons">
                    

<button class="action-btn LevelAccessRole-btn" data-id="${data.RoleId}" title="ویرایش"><i class="fas fa-edit"></i></button>
                    <button class="action-btn edit-btn" data-id="${data.RoleId}" title="ویرایش"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete-btn" data-id="${data.RoleId}" title="حذف"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>`;
    }).join('');
    

document.querySelectorAll('.LevelAccessRole-btn').forEach(btn => btn.addEventListener('click', (e) => { const id = parseInt(btn.dataset.id); GetLevelAccessRoleData(id); }));
    document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', (e) => { const id = parseInt(btn.dataset.id); openEditModal(id); }));
    document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', (e) => { if (confirm("حذف رکورد؟")) deleteRole(parseInt(btn.dataset.id)); }));
    renderStats();
}
function deleteRole(RoleId) {
    $.post('/Roles/DeleteData', { 'id': RoleId }, function (response) {
        if (response.isSuccess) {
            RoleList = RoleList.filter(data => data.RoleId !== RoleId);
            saveToStorage();
            renderTable();
            alert(response.data);
        }
        else {
            alert(response.errorTitle);
        }
    });
}
const modal = document.getElementById("RoleModal");
const modalTitle = document.getElementById("modalTitle");
const empRoleId = document.getElementById("RoleId");const empRoleCaption = document.getElementById("RoleCaption");const empStatus = document.getElementById("Status");

function openAddModal() {
    editingRole = false;
    resetModal();
    openModal("RoleModal");
}
function openEditModal(RoleId) {
    const data = RoleList.find(data => data.RoleId === RoleId);
    if (data) {
        editingRole = true;
        
	 empRoleId.value = data.RoleId;
	 empRoleCaption.value = data.RoleCaption;
	 empStatus.checked = Boolean(data.Status);
        modalTitle.innerText = "ویرایش رکورد";
        openModal("RoleModal");
    }
}
function CanselSaveModal() {
    closeModal("RoleModal");
    resetModal();
}
function SaveNewModel() {
    
	 const RoleId = empRoleId.value.trim();
	 const RoleCaption = empRoleCaption.value.trim();
	 const Status = empStatus.checked;
    if (!RoleCaption) {
        alert("لطفاً تمام فیلدها را پر کنید");
        return;
    }
    if (editingRole) { updateRole(RoleId,RoleCaption,Status); } else { addRole(RoleId,RoleCaption,Status); }
    closeModal("RoleModal");
}
function addRole(RoleId,RoleCaption,Status) {
    const newRole = {
        RoleId,RoleCaption,Status
    };
    newRole.RoleId = 0;
    SendData(newRole, true);
}
function updateRole(RoleId,RoleCaption,Status) {
    const idx = RoleList.findIndex(data => data.RoleId == RoleId);
    if (idx !== -1) {
        RoleList[idx] = { RoleId,RoleCaption,Status };
        SendData(RoleList[idx], false);
    }
}
function SendData(newRole, typeRequst) {
    $.post('/Roles/UpdateData', newRole, function (response) {
        if (response.isSuccess) {
            if (typeRequst) {
                RoleList.push(newRole);
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
    
 empRoleId.value = "";
 empRoleCaption.value = "";
 empStatus.checked = false;
    modalTitle.innerText = "افزودن رکورد جدید";
}
function openModal(Modal) {
    document.getElementById(Modal).classList.add("active");
}
function closeModal(Modal) {
    document.getElementById(Modal).classList.remove("active");
}

document.getElementById("searchRole").addEventListener("input", () => renderTable());
document.getElementById("statusFilter").addEventListener("change", () => renderTable());
modal.addEventListener("click", (e) => { if (e.target === modal) closeModal("RoleModal"); });

loadFromStorage(); renderTable();




GetRole();
let RoleId = 0;
function saveLevelAccessRole() {
    let id = document.getElementById("LevelAccessRoleId").value;
    $.post('/LevelAccessRole/AddData', { 'LevelAccessId': id, 'RoleId': RoleId }, function (response) {
        if (response.isSuccess) {
            GetLevelAccessRoleData(RoleId);
            alert(response.data);
        }
        else {
            alert(response.errorTitle);
        }
    });
}
function GetRole() {
    $.post('/LevelAccesss/GetAllData', function (response) {
        if (response.isSuccess) {
            let options = "";
            let dataConvert = JSON.parse(response.data);
            dataConvert.forEach(function (item) {
                options = options + `<option value=\"${item.LevelAccessId}\">${item.LevelAccessCaption}</option>`;
            });
            document.getElementById("LevelAccessRoleId").innerHTML = options;
        }
        else {
            alert(response.errorTitle);
        }
    });
}
function GetLevelAccessRoleData(id) {
    RoleId = id;
  var Role = RoleList.filter(p => p.RoleId == id)[0];
    const modalLevelAccessRoleTitle = document.getElementById("modalLevelAccessRoleTitle");
    let title = modalLevelAccessRoleTitle.innerHTML;
    modalLevelAccessRoleTitle.innerHTML = title.split(" با ")[0] + " با " + Role.RoleCaption;  $.post('/LevelAccessRole/GetData', { 'id': id }, function (response) {
        if (response.isSuccess) {
            openModal("LevelAccessRoleModal");
            let options = "";
            let filtered = JSON.parse(response.data);
            document.getElementById("LevelAccessRoleTableBody").innerHTML = filtered.map(data => {
                return `<tr>
                <td>${data.LevelAccessCaption}</td>
                <td class="action-buttons">
                    <button class="action-btn deleteLevelAccessRole-btn" data-id="${data.LevelAccessId}" title="حذف"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>`;
            }).join('');
            document.querySelectorAll('.deleteLevelAccessRole-btn').forEach(btn => btn.addEventListener('click', (e) => {
                if (confirm("حذف رکورد؟")) { deleteLevelAccessRole(parseInt(btn.dataset.id)); }
            }));
        }
        else {
            alert(response.errorTitle);
        }
    });
}
function deleteLevelAccessRole(LevelAccessId) {
    $.post('/LevelAccessRole/DeleteData', { 'LevelAccessId': LevelAccessId, 'RoleId': RoleId }, function (response) {
        if (response.isSuccess) {
            GetLevelAccessRoleData(RoleId);
            alert(response.data);
        }
        else {
            alert(response.errorTitle);
        }
    });
}
 const modalLevelAccessRole = document.getElementById("LevelAccessRoleModal");
 modalLevelAccessRole.addEventListener("click", (e) => { if (e.target === modalLevelAccessRole) closeModal('LevelAccessRoleModal'); });
 const modalAddLevelAccessRole = document.getElementById("AddLevelAccessRoleModal");
 modalAddLevelAccessRole.addEventListener("click", (e) => { if (e.target === modalAddLevelAccessRole) closeModal('AddLevelAccessRoleModal'); });



