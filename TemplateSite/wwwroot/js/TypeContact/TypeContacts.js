// ═══ TypeContacts.js ═══

let TypeContactList = [];
let editingTypeContact = false;

const Http = window.HttpHelper;
const UI = window.UICore;

function handleHttpError(err) {
    if (err.message === 'AUTH_REQUIRED') return;
    if (err.message === 'CSRF_OR_BAD_REQUEST') {
        alert('نشست شما منقضی شده. صفحه را رفرش کنید.');
        return;
    }
    alert('خطا در ارتباط با سرور');
}

function showLoading() { if (UI && UI.showLoading) UI.showLoading(); }
function hideLoading() { if (UI && UI.hideLoading) UI.hideLoading(); }

function saveToStorage() {

    showLoading();
    Http.postSecure('/TypeContacts/GetAllData')
        .then(response => {
            if (response.isSuccess) {
                TypeContactList = JSON.parse(response.data);
                localStorage.setItem("TypeContacts", JSON.stringify(TypeContactList));
                renderTable();
                nextId = Math.max(...TypeContactList.map(i => i.TypeContactId));
            }
            else {
                alert(response.errorTitle);
            }
        })
        .catch(handleHttpError)
        .finally(hideLoading);
}
function loadFromStorage() {
    const saved = localStorage.getItem("TypeContacts");
    if (saved) {
        TypeContactList = JSON.parse(saved);
    }
    else saveToStorage();
}
function renderStats() {
    const total = TypeContactList.length, active = TypeContactList.filter(data => data.Status).length, inactive = TypeContactList.filter(data => !data.Status).length;
    document.getElementById("statsCards").innerHTML = `
            <div class="stat-card"><div class="stat-info"><div class="number">${total}</div><div class="label">کل نوع پلتفورم ارتباطی</div></div><div class="stat-icon"><i class="fas fa-users"></i></div></div>
            <div class="stat-card"><div class="stat-info"><div class="number">${active}</div><div class="label">فعال</div></div><div class="stat-icon"><i class="fas fa-check-circle"></i></div></div>
            <div class="stat-card"><div class="stat-info"><div class="number">${inactive}</div><div class="label">غیرفعال</div></div><div class="stat-icon"><i class="fas fa-ban"></i></div></div>
        `;
}
function renderTable() {
    const searchTerm = document.getElementById("searchTypeContact").value.toLowerCase();
    const statusFilter = document.getElementById("statusFilter").value;
    let filtered = [...TypeContactList];

    if (statusFilter !== "all") filtered = filtered.filter(p => p.Status.toString() === statusFilter);
    const tbody = document.getElementById("TypeContactTableBody");
    if (filtered.length === 0) { tbody.innerHTML = `<tr class="empty-row"><td colspan="7">هیچ رکورد یافت نشد</td></tr>`; renderStats(); return; }

    tbody.innerHTML = filtered.map(data => {

        const statusStatus = data.Status === true ? "فعال" : "غیرفعال";
        return `<tr>
                <td>
                  <div style="display:flex;align-items:center;gap:12px;">
                    <div><strong>${data.TypeContactId}</strong></div>
                  </div>
                </td>
                
 <td>${data.TypeContactCaption}</td>
 <td>${data.TypeContactArm}</td>
 <td>${statusStatus}</td>
                <td class="action-buttons">
                    
                    <button class="action-btn delete-btn" data-id="${data.TypeContactId}" title="حذف"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>`;
    }).join('');

    document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', (e) => { const id = parseInt(btn.dataset.id); openEditModal(id); }));
    document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', (e) => { if (confirm("حذف رکورد؟")) deleteTypeContact(parseInt(btn.dataset.id)); }));
    renderStats();
}
function deleteTypeContact(TypeContactId) {
    showLoading();
    Http.postSecure('/TypeContacts/DeleteData', { 'id': TypeContactId })
        .then(response => {
            if (response.isSuccess) {
                TypeContactList = TypeContactList.filter(data => data.TypeContactId !== TypeContactId);
                saveToStorage();
                renderTable();
                alert(response.data);
            }
            else {
                alert(response.errorTitle);
            }
        })
        .catch(handleHttpError)
        .finally(hideLoading);
}
const modal = document.getElementById("TypeContactModal");
const modalTitle = document.getElementById("modalTitle");
const empTypeContactId = document.getElementById("TypeContactId");
const empTypeContactCaption = document.getElementById("TypeContactCaption");
const empTypeContactArm = document.getElementById("TypeContactArm");
const empStatus = document.getElementById("Status");

function openAddModal() {
    editingTypeContact = false;
    resetModal();
    openModal("TypeContactModal");
}
function openEditModal(TypeContactId) {
    const data = TypeContactList.find(data => data.TypeContactId === TypeContactId);
    if (data) {
        editingTypeContact = true;
        empTypeContactId.value = data.TypeContactId;
        empTypeContactCaption.value = data.TypeContactCaption;
        empStatus.checked = Boolean(data.Status);
        modalTitle.innerText = "ویرایش رکورد";
        openModal("TypeContactModal");
    }
}
function CanselSaveModal() {
    closeModal("TypeContactModal");
    resetModal();
}
function SaveNewModel() {

    const TypeContactId = empTypeContactId.value.trim();
    const TypeContactCaption = empTypeContactCaption.value.trim();
    const File = empTypeContactArm.files[0];
    const Status = empStatus.checked;

    if (!TypeContactCaption || !TypeContactArm) {
        alert("لطفاً تمام فیلدها را پر کنید");
        return;
    }
    if (editingTypeContact) { updateTypeContact(TypeContactId, TypeContactCaption, File, Status); } else { addTypeContact(TypeContactId, TypeContactCaption, File, Status); }
    closeModal("TypeContactModal");
}
function addTypeContact(TypeContactId, TypeContactCaption, File, Status) {
    const newTypeContact = {
        TypeContactId, TypeContactCaption, File, Status
    };
    newTypeContact.TypeContactId = 0;
    SendData(newTypeContact, true);
}
function updateTypeContact(TypeContactId, TypeContactCaption, File, Status) {
    const idx = TypeContactList.findIndex(data => data.TypeContactId == TypeContactId);
    if (idx !== -1) {
        TypeContactList[idx] = { TypeContactId, TypeContactCaption, File, Status };
        SendData(TypeContactList[idx], false);
    }
}
function SendData(newTypeContact, typeRequst) {
    if (newTypeContact.File.size > 400000) {
        alert("حداکثر حجم مجاز برای آپلود 400 KB است");
    }
    else {
        var type = newTypeContact.File.type.split("/")[1];
        if (type == "png" || type == "jpeg") {
            var Data = new FormData();
            Data.append('TypeContactId', newTypeContact.TypeContactId);
            Data.append('TypeContactCaption', newTypeContact.TypeContactCaption);
            Data.append('TypeContactArm', newTypeContact.File.name);
            Data.append('File', newTypeContact.File);
            Data.append('Status', newTypeContact.Status);
            showLoading();
            fetch('/TypeContacts/UpdateData', {
                method: 'POST',
                body: Data,
                headers: {
                    'RequestVerificationToken': Http.getCsrfToken(),
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
                .then(r => r.json())
                .then(response => {
                    if (response.isSuccess) {
                        if (typeRequst) {
                            const newTypeContact2 = {};
                            newTypeContact2.TypeContactId = newTypeContact.TypeContactId;
                            newTypeContact2.TypeContactCaption = newTypeContact.TypeContactCaption;
                            newTypeContact2.TypeContactArm = newTypeContact.File.name;
                            newTypeContact2.File = newTypeContact.File;
                            newTypeContact2.Status = newTypeContact.Status;
                            TypeContactList.push(newTypeContact2);
                        }
                        saveToStorage();
                        renderTable();
                        alert(response.data);
                    }
                    else {
                        alert(response.errorTitle);
                    }
                })
                .catch(handleHttpError)
                .finally(hideLoading);
        } else {
            alert("فرمت فایل ورودی درست نمی باشد.");
        }
    }
}
function resetModal() {

    empTypeContactId.value = "";
    empTypeContactCaption.value = "";
    empTypeContactArm.value = "";
    empStatus.checked = false;
    modalTitle.innerText = "افزودن رکورد جدید";
}
function openModal(Modal) {
    document.getElementById(Modal).classList.add("active");
}
function closeModal(Modal) {
    document.getElementById(Modal).classList.remove("active");
}

document.getElementById("searchTypeContact").addEventListener("input", () => renderTable());
document.getElementById("statusFilter").addEventListener("change", () => renderTable());
modal.addEventListener("click", (e) => { if (e.target === modal) closeModal("TypeContactModal"); });

loadFromStorage(); renderTable();