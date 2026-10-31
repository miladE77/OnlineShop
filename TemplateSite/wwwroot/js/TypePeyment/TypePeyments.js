// ═══ TypePeyments.js ═══

let TypePeymentList = [];
let editingTypePeyment = false;

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
    Http.postSecure('/TypePeyments/GetAllData')
        .then(response => {
            if (response.isSuccess) {
                TypePeymentList = JSON.parse(response.data);
                localStorage.setItem("TypePeyments", JSON.stringify(TypePeymentList));
                renderTable();
                nextId = Math.max(...TypePeymentList.map(i => i.TypePeymentId));
            }
            else {
                alert(response.errorTitle);
            }
        })
        .catch(handleHttpError)
        .finally(hideLoading);
}
function loadFromStorage() {
    const saved = localStorage.getItem("TypePeyments");
    if (saved) {
        TypePeymentList = JSON.parse(saved);
    }
    else saveToStorage();
}
function renderStats() {
    const total = TypePeymentList.length, active = TypePeymentList.filter(data => data.Status).length, inactive = TypePeymentList.filter(data => !data.Status).length;
    document.getElementById("statsCards").innerHTML = `
            <div class="stat-card"><div class="stat-info"><div class="number">${total}</div><div class="label">کل نوع پرداخت</div></div><div class="stat-icon"><i class="fas fa-users"></i></div></div>
            <div class="stat-card"><div class="stat-info"><div class="number">${active}</div><div class="label">فعال</div></div><div class="stat-icon"><i class="fas fa-check-circle"></i></div></div>
            <div class="stat-card"><div class="stat-info"><div class="number">${inactive}</div><div class="label">غیرفعال</div></div><div class="stat-icon"><i class="fas fa-ban"></i></div></div>
        `;
}
function renderTable() {
    const searchTerm = document.getElementById("searchTypePeyment").value.toLowerCase();
    const statusFilter = document.getElementById("statusFilter").value;
    let filtered = [...TypePeymentList];
    if (searchTerm) filtered = filtered.filter(p => p.TypePeymentCaption.toLowerCase().includes(searchTerm));
    if (statusFilter !== "all") filtered = filtered.filter(p => p.Status.toString() === statusFilter);
    const tbody = document.getElementById("TypePeymentTableBody");
    if (filtered.length === 0) { tbody.innerHTML = `<tr class="empty-row"><td colspan="7">هیچ رکورد یافت نشد</td></tr>`; renderStats(); return; }

    tbody.innerHTML = filtered.map(data => {

        const statusStatus = data.Status === true ? "فعال" : "غیرفعال";
        return `<tr>
                <td>
                  <div style="display:flex;align-items:center;gap:12px;">
                    <div><strong>${data.TypePeymentId}</strong></div>
                  </div>
                </td>
                
 <td>${data.TypePeymentCaption}</td>
 <td>${statusStatus}</td>
                <td class="action-buttons">
                    
                    <button class="action-btn edit-btn" data-id="${data.TypePeymentId}" title="ویرایش"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete-btn" data-id="${data.TypePeymentId}" title="حذف"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>`;
    }).join('');

    document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', (e) => { const id = parseInt(btn.dataset.id); openEditModal(id); }));
    document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', (e) => { if (confirm("حذف رکورد؟")) deleteTypePeyment(parseInt(btn.dataset.id)); }));
    renderStats();
}
function deleteTypePeyment(TypePeymentId) {
    showLoading();
    Http.postSecure('/TypePeyments/DeleteData', { 'id': TypePeymentId })
        .then(response => {
            if (response.isSuccess) {
                TypePeymentList = TypePeymentList.filter(data => data.TypePeymentId !== TypePeymentId);
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
const modal = document.getElementById("TypePeymentModal");
const modalTitle = document.getElementById("modalTitle");
const empTypePeymentId = document.getElementById("TypePeymentId"); const empTypePeymentCaption = document.getElementById("TypePeymentCaption"); const empStatus = document.getElementById("Status");

function openAddModal() {
    editingTypePeyment = false;
    resetModal();
    openModal("TypePeymentModal");
}
function openEditModal(TypePeymentId) {
    const data = TypePeymentList.find(data => data.TypePeymentId === TypePeymentId);
    if (data) {
        editingTypePeyment = true;

        empTypePeymentId.value = data.TypePeymentId;
        empTypePeymentCaption.value = data.TypePeymentCaption;
        empStatus.checked = Boolean(data.Status);
        modalTitle.innerText = "ویرایش رکورد";
        openModal("TypePeymentModal");
    }
}
function CanselSaveModal() {
    closeModal("TypePeymentModal");
    resetModal();
}
function SaveNewModel() {

    const TypePeymentId = empTypePeymentId.value.trim();
    const TypePeymentCaption = empTypePeymentCaption.value.trim();
    const Status = empStatus.checked;
    if (!TypePeymentCaption) {
        alert("لطفاً تمام فیلدها را پر کنید");
        return;
    }
    if (editingTypePeyment) { updateTypePeyment(TypePeymentId, TypePeymentCaption, Status); } else { addTypePeyment(TypePeymentId, TypePeymentCaption, Status); }
    closeModal("TypePeymentModal");
}
function addTypePeyment(TypePeymentId, TypePeymentCaption, Status) {
    const newTypePeyment = {
        TypePeymentId, TypePeymentCaption, Status
    };
    newTypePeyment.TypePeymentId = 0;
    SendData(newTypePeyment, true);
}
function updateTypePeyment(TypePeymentId, TypePeymentCaption, Status) {
    const idx = TypePeymentList.findIndex(data => data.TypePeymentId == TypePeymentId);
    if (idx !== -1) {
        TypePeymentList[idx] = { TypePeymentId, TypePeymentCaption, Status };
        SendData(TypePeymentList[idx], false);
    }
}
function SendData(newTypePeyment, typeRequst) {
    const url = typeRequst
        ? '/TypePeyments/AddData'
        : '/TypePeyments/UpdateData';

    showLoading();
    Http.postSecure(url, newTypePeyment)
        .then(response => {
            if (response.isSuccess) {
                if (typeRequst) {
                    TypePeymentList.push(newTypePeyment);
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
}
function resetModal() {

    empTypePeymentId.value = "";
    empTypePeymentCaption.value = "";
    empStatus.checked = false;
    modalTitle.innerText = "افزودن رکورد جدید";
}
function openModal(Modal) {
    document.getElementById(Modal).classList.add("active");
}
function closeModal(Modal) {
    document.getElementById(Modal).classList.remove("active");
}

document.getElementById("searchTypePeyment").addEventListener("input", () => renderTable());
document.getElementById("statusFilter").addEventListener("change", () => renderTable());
modal.addEventListener("click", (e) => { if (e.target === modal) closeModal("TypePeymentModal"); });

loadFromStorage(); renderTable();