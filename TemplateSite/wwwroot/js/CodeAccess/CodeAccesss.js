let CodeAccessList = [];
let editingCodeAccess = false;



function saveToStorage() {
    $.post('/CodeAccesss/GetAllData', function (response) {
        if (response.isSuccess) {
            CodeAccessList = JSON.parse(response.data);
            localStorage.setItem("CodeAccesss", JSON.stringify(CodeAccessList));
            renderTable();
            nextId = Math.max(...CodeAccessList.map(i => i.CodeAccessId));
        }
        else {
            alert(response.errorTitle);
        }
    });
}
function loadFromStorage() {
    const saved = localStorage.getItem("CodeAccesss");
    if (saved) {
        CodeAccessList = JSON.parse(saved);
    }
    else saveToStorage();
}
function renderStats() {
    const total = CodeAccessList.length, active = CodeAccessList.filter(data => data.Status).length, inactive = CodeAccessList.filter(data => !data.Status).length;
    document.getElementById("statsCards").innerHTML = `
            <div class="stat-card"><div class="stat-info"><div class="number">${total}</div><div class="label">کل کد اختصاصی</div></div><div class="stat-icon"><i class="fas fa-users"></i></div></div>
            <div class="stat-card"><div class="stat-info"><div class="number">${active}</div><div class="label">فعال</div></div><div class="stat-icon"><i class="fas fa-check-circle"></i></div></div>
            <div class="stat-card"><div class="stat-info"><div class="number">${inactive}</div><div class="label">غیرفعال</div></div><div class="stat-icon"><i class="fas fa-ban"></i></div></div>
        `;
}
function renderTable() {
    const searchTerm = document.getElementById("searchCodeAccess").value.toLowerCase();
    const statusFilter = document.getElementById("statusFilter").value;
    let filtered = [...CodeAccessList];
    if (searchTerm) filtered = filtered.filter(p =>p.CodeAccessCaption.toLowerCase().includes(searchTerm) || p.TypeCode.toLowerCase().includes(searchTerm));
    if (statusFilter !== "all") filtered = filtered.filter(p => p.Status.toString() === statusFilter);
    const tbody = document.getElementById("CodeAccessTableBody");
    if (filtered.length === 0) { tbody.innerHTML = `<tr class="empty-row"><td colspan="7">هیچ رکورد یافت نشد</td></tr>`; renderStats(); return; }
    
    tbody.innerHTML = filtered.map(data => {
        
 const statusStatus = data.Status === true ? "فعال" : "غیرفعال";
        return `<tr>
                <td>
                  <div style="display:flex;align-items:center;gap:12px;">
                    <div><strong>${data.CodeAccessId}</strong></div>
                  </div>
                </td>
                
 <td>${data.CodeAccessCaption}</td>
 <td>${data.TypeCode}</td>
 <td>${statusStatus}</td>
                <td class="action-buttons">
                    
                    <button class="action-btn edit-btn" data-id="${data.CodeAccessId}" title="ویرایش"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete-btn" data-id="${data.CodeAccessId}" title="حذف"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>`;
    }).join('');
    
    document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', (e) => { const id = parseInt(btn.dataset.id); openEditModal(id); }));
    document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', (e) => { if (confirm("حذف رکورد؟")) deleteCodeAccess(parseInt(btn.dataset.id)); }));
    renderStats();
}
function deleteCodeAccess(CodeAccessId) {
    $.post('/CodeAccesss/DeleteData', { 'id': CodeAccessId }, function (response) {
        if (response.isSuccess) {
            CodeAccessList = CodeAccessList.filter(data => data.CodeAccessId !== CodeAccessId);
            saveToStorage();
            renderTable();
            alert(response.data);
        }
        else {
            alert(response.errorTitle);
        }
    });
}
const modal = document.getElementById("CodeAccessModal");
const modalTitle = document.getElementById("modalTitle");
const empCodeAccessId = document.getElementById("CodeAccessId");const empCodeAccessCaption = document.getElementById("CodeAccessCaption");const empTypeCode = document.getElementById("TypeCode");const empStatus = document.getElementById("Status");

function openAddModal() {
    editingCodeAccess = false;
    resetModal();
    openModal("CodeAccessModal");
}
function openEditModal(CodeAccessId) {
    const data = CodeAccessList.find(data => data.CodeAccessId === CodeAccessId);
    if (data) {
        editingCodeAccess = true;
        
	 empCodeAccessId.value = data.CodeAccessId;
	 empCodeAccessCaption.value = data.CodeAccessCaption;
	 empTypeCode.value = data.TypeCode;
	 empStatus.checked = Boolean(data.Status);
        modalTitle.innerText = "ویرایش رکورد";
        openModal("CodeAccessModal");
    }
}
function CanselSaveModal() {
    closeModal("CodeAccessModal");
    resetModal();
}
function SaveNewModel() {
    
	 const CodeAccessId = empCodeAccessId.value.trim();
	 const CodeAccessCaption = empCodeAccessCaption.value.trim();
	 const TypeCode = empTypeCode.value.trim();
	 const Status = empStatus.checked;
    if (!CodeAccessCaption || !TypeCode) {
        alert("لطفاً تمام فیلدها را پر کنید");
        return;
    }
    if (editingCodeAccess) { updateCodeAccess(CodeAccessId,CodeAccessCaption,TypeCode,Status); } else { addCodeAccess(CodeAccessId,CodeAccessCaption,TypeCode,Status); }
    closeModal("CodeAccessModal");
}
function addCodeAccess(CodeAccessId,CodeAccessCaption,TypeCode,Status) {
    const newCodeAccess = {
        CodeAccessId,CodeAccessCaption,TypeCode,Status
    };
    newCodeAccess.CodeAccessId = 0;
    SendData(newCodeAccess, true);
}
function updateCodeAccess(CodeAccessId,CodeAccessCaption,TypeCode,Status) {
    const idx = CodeAccessList.findIndex(data => data.CodeAccessId == CodeAccessId);
    if (idx !== -1) {
        CodeAccessList[idx] = { CodeAccessId,CodeAccessCaption,TypeCode,Status };
        SendData(CodeAccessList[idx], false);
    }
}
function SendData(newCodeAccess, typeRequst) {
    $.post('/CodeAccesss/UpdateData', newCodeAccess, function (response) {
        if (response.isSuccess) {
            if (typeRequst) {
                CodeAccessList.push(newCodeAccess);
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
    
 empCodeAccessId.value = "";
 empCodeAccessCaption.value = "";
 empTypeCode.value = "";
 empStatus.checked = false;
    modalTitle.innerText = "افزودن رکورد جدید";
}
function openModal(Modal) {
    document.getElementById(Modal).classList.add("active");
}
function closeModal(Modal) {
    document.getElementById(Modal).classList.remove("active");
}

document.getElementById("searchCodeAccess").addEventListener("input", () => renderTable());
document.getElementById("statusFilter").addEventListener("change", () => renderTable());
modal.addEventListener("click", (e) => { if (e.target === modal) closeModal("CodeAccessModal"); });

loadFromStorage(); renderTable();






