let PersonelList = [];
let editingPersonel = false;


GetRoleData(); function GetRoleData() {
    $.post('/Roles/GetAllData', function (response) {
        if (response.isSuccess) {
            let dataConvert = JSON.parse(response.data);
            let options = "";
            dataConvert.forEach(function (item) {
                options = options + `<option value=\"${item.RoleId}\">${item.RoleCaption}</option>`;
            });
            document.getElementById("Role").innerHTML = options;
        }
        else {
            alert(response.errorTitle);
        }
    });
}
function saveToStorage() {
    $.post('/Personels/GetAllData', function (response) {
        if (response.isSuccess) {
            PersonelList = JSON.parse(response.data);
            localStorage.setItem("Personels", JSON.stringify(PersonelList));
            renderTable();
            nextId = Math.max(...PersonelList.map(i => i.PersonelId));
        }
        else {
            alert(response.errorTitle);
        }
    });
}
function loadFromStorage() {
    const saved = localStorage.getItem("Personels");
    if (saved) {
        PersonelList = JSON.parse(saved);
    }
    else saveToStorage();
}
function renderStats() {
    const total = PersonelList.length, active = PersonelList.filter(data => data.Status).length, inactive = PersonelList.filter(data => !data.Status).length;
    document.getElementById("statsCards").innerHTML = `
            <div class="stat-card"><div class="stat-info"><div class="number">${total}</div><div class="label">کل پرسنل</div></div><div class="stat-icon"><i class="fas fa-users"></i></div></div>
            <div class="stat-card"><div class="stat-info"><div class="number">${active}</div><div class="label">فعال</div></div><div class="stat-icon"><i class="fas fa-check-circle"></i></div></div>
            <div class="stat-card"><div class="stat-info"><div class="number">${inactive}</div><div class="label">غیرفعال</div></div><div class="stat-icon"><i class="fas fa-ban"></i></div></div>
        `;
}
function renderTable() {
    const searchTerm = document.getElementById("searchPersonel").value.toLowerCase();
    const statusFilter = document.getElementById("statusFilter").value;
    let filtered = [...PersonelList];
    if (searchTerm) filtered = filtered.filter(p =>p.FirstName.toLowerCase().includes(searchTerm) || p.LastName.toLowerCase().includes(searchTerm) || p.Lational_code.toLowerCase().includes(searchTerm) || p.Address.toLowerCase().includes(searchTerm));
    if (statusFilter !== "all") filtered = filtered.filter(p => p.Status.toString() === statusFilter);
    const tbody = document.getElementById("PersonelTableBody");
    if (filtered.length === 0) { tbody.innerHTML = `<tr class="empty-row"><td colspan="7">هیچ رکورد یافت نشد</td></tr>`; renderStats(); return; }
    
    tbody.innerHTML = filtered.map(data => {
        
 const statusStatus = data.Status === true ? "فعال" : "غیرفعال";
        return `<tr>
                <td>
                  <div style="display:flex;align-items:center;gap:12px;">
                    <div><strong>${data.PersonelId}</strong></div>
                  </div>
                </td>
                
 <td>${data.FirstName}</td>
 <td>${data.LastName}</td>
 <td>${data.Date_of_birth}</td>
 <td>${data.Lational_code}</td>
 <td>${data.Address}</td>
 <td>${data.Detail}</td>
 <td>${statusStatus}</td>
 <td>${data.RoleCaption}</td>
                <td class="action-buttons">
                    
                    <button class="action-btn edit-btn" data-id="${data.PersonelId}" title="ویرایش"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete-btn" data-id="${data.PersonelId}" title="حذف"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>`;
    }).join('');
    
    document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', (e) => { const id = parseInt(btn.dataset.id); openEditModal(id); }));
    document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', (e) => { if (confirm("حذف رکورد؟")) deletePersonel(parseInt(btn.dataset.id)); }));
    renderStats();
}
function deletePersonel(PersonelId) {
    $.post('/Personels/DeleteData', { 'id': PersonelId }, function (response) {
        if (response.isSuccess) {
            PersonelList = PersonelList.filter(data => data.PersonelId !== PersonelId);
            saveToStorage();
            renderTable();
            alert(response.data);
        }
        else {
            alert(response.errorTitle);
        }
    });
}
const modal = document.getElementById("PersonelModal");
const modalTitle = document.getElementById("modalTitle");
const empPersonelId = document.getElementById("PersonelId");const empFirstName = document.getElementById("FirstName");const empLastName = document.getElementById("LastName");const empDate_of_birth = document.getElementById("Date_of_birth");const empLational_code = document.getElementById("Lational_code");const empAddress = document.getElementById("Address");const empDetail = document.getElementById("Detail");const empStatus = document.getElementById("Status");const empRoleId = document.getElementById("Role");

function openAddModal() {
    editingPersonel = false;
    resetModal();
    openModal("PersonelModal");
}
function openEditModal(PersonelId) {
    const data = PersonelList.find(data => data.PersonelId === PersonelId);
    if (data) {
        editingPersonel = true;
        
	 empPersonelId.value = data.PersonelId;
	 empFirstName.value = data.FirstName;
	 empLastName.value = data.LastName;
	 empDate_of_birth.value = data.Date_of_birth;
	 empLational_code.value = data.Lational_code;
	 empAddress.value = data.Address;
	 empDetail.value = data.Detail;
	 empStatus.checked = Boolean(data.Status);
	 empRoleId.value = data.RoleId;
        modalTitle.innerText = "ویرایش رکورد";
        openModal("PersonelModal");
    }
}
function CanselSaveModal() {
    closeModal("PersonelModal");
    resetModal();
}
function SaveNewModel() {
    
	 const PersonelId = empPersonelId.value.trim();
	 const FirstName = empFirstName.value.trim();
	 const LastName = empLastName.value.trim();
	 const Date_of_birth = empDate_of_birth.value.trim();
	 const Lational_code = empLational_code.value.trim();
	 const Address = empAddress.value.trim();
	 const Detail = empDetail.value.trim();
	 const Status = empStatus.checked;
	 const RoleId = empRoleId.value.trim();
    if (!FirstName || !LastName || !Date_of_birth || !Lational_code || !Address || !Detail ) {
        alert("لطفاً تمام فیلدها را پر کنید");
        return;
    }
    if (editingPersonel) { updatePersonel(PersonelId,FirstName,LastName,Date_of_birth,Lational_code,Address,Detail,Status,RoleId); } else { addPersonel(PersonelId,FirstName,LastName,Date_of_birth,Lational_code,Address,Detail,Status,RoleId); }
    closeModal("PersonelModal");
}
function addPersonel(PersonelId,FirstName,LastName,Date_of_birth,Lational_code,Address,Detail,Status,RoleId) {
    const newPersonel = {
        PersonelId,FirstName,LastName,Date_of_birth,Lational_code,Address,Detail,Status,RoleId
    };
    newPersonel.PersonelId = 0;
    SendData(newPersonel, true);
}
function updatePersonel(PersonelId,FirstName,LastName,Date_of_birth,Lational_code,Address,Detail,Status,RoleId) {
    const idx = PersonelList.findIndex(data => data.PersonelId == PersonelId);
    if (idx !== -1) {
        PersonelList[idx] = { PersonelId,FirstName,LastName,Date_of_birth,Lational_code,Address,Detail,Status,RoleId };
        SendData(PersonelList[idx], false);
    }
}
function SendData(newPersonel, typeRequst) {
    $.post('/Personels/UpdateData', newPersonel, function (response) {
        if (response.isSuccess) {
            if (typeRequst) {
                PersonelList.push(newPersonel);
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
    
 empPersonelId.value = "";
 empFirstName.value = "";
 empLastName.value = "";
 empDate_of_birth.value = "";
 empLational_code.value = "";
 empAddress.value = "";
 empDetail.value = "";
 empStatus.checked = false;
 empRoleId.value = "";
    modalTitle.innerText = "افزودن رکورد جدید";
}
function openModal(Modal) {
    document.getElementById(Modal).classList.add("active");
}
function closeModal(Modal) {
    document.getElementById(Modal).classList.remove("active");
}

document.getElementById("searchPersonel").addEventListener("input", () => renderTable());
document.getElementById("statusFilter").addEventListener("change", () => renderTable());
modal.addEventListener("click", (e) => { if (e.target === modal) closeModal("PersonelModal"); });

loadFromStorage(); renderTable();






