let tempList = [];
let editingtemp = false;


/*AddOtherClass*/
function saveToStorage() {
    $.post('/temps/GetAllData', function (response) {
        if (response.isSuccess) {
            tempList = JSON.parse(response.data);
            localStorage.setItem("temps", JSON.stringify(tempList));
            renderTable();
            nextId = Math.max(...tempList.map(i => i.tempId));
        }
        else {
            alert(response.errorTitle);
        }
    });
}
function loadFromStorage() {
    const saved = localStorage.getItem("temps");
    if (saved) {
        tempList = JSON.parse(saved);
    }
    else saveToStorage();
}
function renderStats() {
    const total = tempList.length, active = tempList.filter(data => data.Status).length, inactive = tempList.filter(data => !data.Status).length;
    document.getElementById("statsCards").innerHTML = `
            <div class="stat-card"><div class="stat-info"><div class="number">${total}</div><div class="label">کل قالب</div></div><div class="stat-icon"><i class="fas fa-users"></i></div></div>
            <div class="stat-card"><div class="stat-info"><div class="number">${active}</div><div class="label">فعال</div></div><div class="stat-icon"><i class="fas fa-check-circle"></i></div></div>
            <div class="stat-card"><div class="stat-info"><div class="number">${inactive}</div><div class="label">غیرفعال</div></div><div class="stat-icon"><i class="fas fa-ban"></i></div></div>
        `;
}
function renderTable() {
    const searchTerm = document.getElementById("searchtemp").value.toLowerCase();
    const statusFilter = document.getElementById("statusFilter").value;
    let filtered = [...tempList];
    /*searchItem*/
    if (statusFilter !== "all") filtered = filtered.filter(p => p.Status.toString() === statusFilter);
    const tbody = document.getElementById("tempTableBody");
    if (filtered.length === 0) { tbody.innerHTML = `<tr class="empty-row"><td colspan="7">هیچ رکورد یافت نشد</td></tr>`; renderStats(); return; }
    
    tbody.innerHTML = filtered.map(data => {
        /*AdditionalItem*/
        return `<tr>
                <td>
                  <div style="display:flex;align-items:center;gap:12px;">
                    <div><strong>${data.tempId}</strong></div>
                  </div>
                </td>
                <!--RowsTable-->
                <td class="action-buttons">
                    /*EnterToOtherClass*/
                    <button class="action-btn edit-btn" data-id="${data.tempId}" title="ویرایش"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete-btn" data-id="${data.tempId}" title="حذف"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>`;
    }).join('');
    /*ClickEventToOtherClass*/
    document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', (e) => { const id = parseInt(btn.dataset.id); openEditModal(id); }));
    document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', (e) => { if (confirm("حذف رکورد؟")) deletetemp(parseInt(btn.dataset.id)); }));
    renderStats();
}
function deletetemp(tempId) {
    $.post('/temps/DeleteData', { 'id': tempId }, function (response) {
        if (response.isSuccess) {
            tempList = tempList.filter(data => data.tempId !== tempId);
            saveToStorage();
            renderTable();
            alert(response.data);
        }
        else {
            alert(response.errorTitle);
        }
    });
}
const modal = document.getElementById("tempModal");
const modalTitle = document.getElementById("modalTitle");
/*TransferModelView*/

function openAddModal() {
    editingtemp = false;
    resetModal();
    openModal("tempModal");
}
function openEditModal(tempId) {
    const data = tempList.find(data => data.tempId === tempId);
    if (data) {
        editingtemp = true;
        /*EditeModelView*/
        modalTitle.innerText = "ویرایش رکورد";
        openModal("tempModal");
    }
}
function CanselSaveModal() {
    closeModal("tempModal");
    resetModal();
}
function SaveNewModel() {
    /*TrimSaveModel*/
    if (/*CheckClass*/) {
        alert("لطفاً تمام فیلدها را پر کنید");
        return;
    }
    if (editingtemp) { updatetemp(/*ModeInputFun*/); } else { addtemp(/*ModeInputFun*/); }
    closeModal("tempModal");
}
function addtemp(/*ModeInputFun*/) {
    const newtemp = {
        /*ModeInputFun*/
    };
    newtemp.tempId = 0;
    SendData(newtemp, true);
}
function updatetemp(/*ModeInputFun*/) {
    const idx = tempList.findIndex(data => data.tempId == tempId);
    if (idx !== -1) {
        tempList[idx] = { /*ModeInputFun*/ };
        SendData(tempList[idx], false);
    }
}
function SendData(newtemp, typeRequst) {
    $.post('/temps/UpdateData', newtemp, function (response) {
        if (response.isSuccess) {
            if (typeRequst) {
                tempList.push(newtemp);
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
    /*ResetModelView*/
    modalTitle.innerText = "افزودن رکورد جدید";
}
function openModal(Modal) {
    document.getElementById(Modal).classList.add("active");
}
function closeModal(Modal) {
    document.getElementById(Modal).classList.remove("active");
}

document.getElementById("searchtemp").addEventListener("input", () => renderTable());
document.getElementById("statusFilter").addEventListener("change", () => renderTable());
modal.addEventListener("click", (e) => { if (e.target === modal) closeModal("tempModal"); });

loadFromStorage(); renderTable();


/*OtherModel*/



