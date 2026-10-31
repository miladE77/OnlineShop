// ═══ EmailNewss.js ═══

let EmailNewsList = [];
let editingEmailNews = false;
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

GetStoreData(); function GetStoreData() {
    showLoading();
    Http.postSecure('/Stores/GetAllData')
        .then(response => {
            if (response.isSuccess) {
                let dataConvert = JSON.parse(response.data);
                let options = "";
                dataConvert.forEach(function (item) {
                    options = options + `<option value=\"${item.StoreId}\">${item.StoreCaption}</option>`;
                });
                document.getElementById("Store").innerHTML = options;
            }
            else {
                alert(response.errorTitle);
            }
        })
        .catch(handleHttpError)
        .finally(hideLoading);
}
function saveToStorage() {
    showLoading();
    Http.postSecure('/EmailNewss/GetAllData')
        .then(response => {
            if (response.isSuccess) {
                EmailNewsList = JSON.parse(response.data);
                localStorage.setItem("EmailNewss", JSON.stringify(EmailNewsList));
                renderTable();
                nextId = Math.max(...EmailNewsList.map(i => i.EmailNewsId));
            }
            else {
                alert(response.errorTitle);
            }
        })
        .catch(handleHttpError)
        .finally(hideLoading);
}
function loadFromStorage() {
    const saved = localStorage.getItem("EmailNewss");
    if (saved) {
        EmailNewsList = JSON.parse(saved);
    }
    else saveToStorage();
}
function renderStats() {
    const total = EmailNewsList.length, active = EmailNewsList.filter(data => data.Status).length, inactive = EmailNewsList.filter(data => !data.Status).length;
    document.getElementById("statsCards").innerHTML = `
            <div class="stat-card"><div class="stat-info"><div class="number">${total}</div><div class="label">کل ایمیل اخبار</div></div><div class="stat-icon"><i class="fas fa-users"></i></div></div>
            <div class="stat-card"><div class="stat-info"><div class="number">${active}</div><div class="label">فعال</div></div><div class="stat-icon"><i class="fas fa-check-circle"></i></div></div>
            <div class="stat-card"><div class="stat-info"><div class="number">${inactive}</div><div class="label">غیرفعال</div></div><div class="stat-icon"><i class="fas fa-ban"></i></div></div>
        `;
}
function renderTable() {
    const searchTerm = document.getElementById("searchEmailNews").value.toLowerCase();
    const statusFilter = document.getElementById("statusFilter").value;
    let filtered = [...EmailNewsList];
    if (searchTerm) filtered = filtered.filter(p => p.EmailNewsCaption.toLowerCase().includes(searchTerm) || p.StoreId.toLowerCase().includes(searchTerm));
    if (statusFilter !== "all") filtered = filtered.filter(p => p.Status.toString() === statusFilter);
    const tbody = document.getElementById("EmailNewsTableBody");
    if (filtered.length === 0) { tbody.innerHTML = `<tr class="empty-row"><td colspan="7">هیچ رکورد یافت نشد</td></tr>`; renderStats(); return; }

    tbody.innerHTML = filtered.map(data => {

        const statusStatus = data.Status === true ? "فعال" : "غیرفعال";
        return `<tr>
                <td>
                  <div style="display:flex;align-items:center;gap:12px;">
                    <div><strong>${data.EmailNewsId}</strong></div>
                  </div>
                </td>
                
 <td>${data.EmailNewsCaption}</td>
 <td>${data.StoreCaption}</td>
 <td>${statusStatus}</td>
                <td class="action-buttons">
                    
                    <button class="action-btn edit-btn" data-id="${data.EmailNewsId}" title="ویرایش"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete-btn" data-id="${data.EmailNewsId}" title="حذف"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>`;
    }).join('');

    document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', (e) => { const id = parseInt(btn.dataset.id); openEditModal(id); }));
    document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', (e) => { if (confirm("حذف رکورد؟")) deleteEmailNews(parseInt(btn.dataset.id)); }));
    renderStats();
}
function deleteEmailNews(EmailNewsId) {
    showLoading();
    Http.postSecure('/EmailNewss/DeleteData', { 'id': EmailNewsId })
        .then(response => {
            if (response.isSuccess) {
                EmailNewsList = EmailNewsList.filter(data => data.EmailNewsId !== EmailNewsId);
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
const modal = document.getElementById("EmailNewsModal");
const modalTitle = document.getElementById("modalTitle");
const empEmailNewsId = document.getElementById("EmailNewsId"); const empEmailNewsCaption = document.getElementById("EmailNewsCaption"); const empStoreId = document.getElementById("Store"); const empStatus = document.getElementById("Status");

function openAddModal() {
    editingEmailNews = false;
    resetModal();
    openModal("EmailNewsModal");
}
function openEditModal(EmailNewsId) {
    const data = EmailNewsList.find(data => data.EmailNewsId === EmailNewsId);
    if (data) {
        editingEmailNews = true;

        empEmailNewsId.value = data.EmailNewsId;
        empEmailNewsCaption.value = data.EmailNewsCaption;
        empStoreId.value = data.StoreId;
        empStatus.checked = Boolean(data.Status);
        modalTitle.innerText = "ویرایش رکورد";
        openModal("EmailNewsModal");
    }
}
function CanselSaveModal() {
    closeModal("EmailNewsModal");
    resetModal();
}
function SaveNewModel() {

    const EmailNewsId = empEmailNewsId.value.trim();
    const EmailNewsCaption = empEmailNewsCaption.value.trim();
    const StoreId = empStoreId.value.trim();
    const Status = empStatus.checked;
    if (!EmailNewsCaption || !StoreId) {
        alert("لطفاً تمام فیلدها را پر کنید");
        return;
    }
    if (editingEmailNews) { updateEmailNews(EmailNewsId, EmailNewsCaption, StoreId, Status); } else { addEmailNews(EmailNewsId, EmailNewsCaption, StoreId, Status); }
    closeModal("EmailNewsModal");
}
function addEmailNews(EmailNewsId, EmailNewsCaption, StoreId, Status) {
    const newEmailNews = {
        EmailNewsId, EmailNewsCaption, StoreId, Status
    };
    newEmailNews.EmailNewsId = 0;
    SendData(newEmailNews, true);
}
function updateEmailNews(EmailNewsId, EmailNewsCaption, StoreId, Status) {
    const idx = EmailNewsList.findIndex(data => data.EmailNewsId == EmailNewsId);
    if (idx !== -1) {
        EmailNewsList[idx] = { EmailNewsId, EmailNewsCaption, StoreId, Status };
        SendData(EmailNewsList[idx], false);
    }
}
function SendData(newEmailNews, typeRequst) {
    const url = typeRequst
        ? '/EmailNewss/AddData'
        : '/EmailNewss/UpdateData';

    showLoading();
    Http.postSecure(url, newEmailNews)
        .then(response => {
            if (response.isSuccess) {
                if (typeRequst) {
                    EmailNewsList.push(newEmailNews);
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

    empEmailNewsId.value = "";
    empEmailNewsCaption.value = "";
    empStoreId.value = "";
    empStatus.checked = false;
    modalTitle.innerText = "افزودن رکورد جدید";
}
function openModal(Modal) {
    document.getElementById(Modal).classList.add("active");
}
function closeModal(Modal) {
    document.getElementById(Modal).classList.remove("active");
}

document.getElementById("searchEmailNews").addEventListener("input", () => renderTable());
document.getElementById("statusFilter").addEventListener("change", () => renderTable());
modal.addEventListener("click", (e) => { if (e.target === modal) closeModal("EmailNewsModal"); });

loadFromStorage(); renderTable();