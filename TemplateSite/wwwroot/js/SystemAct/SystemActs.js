// ═══ SystemActs.js ═══

/* ============================================================
   SystemActs.js — مدیریت تاریخچه عملیات (با تقویم شمسی)
   ------------------------------------------------------------
   - UI: input[type="date"] برای DateTime + تقویم شمسی
   - ارسال: DateTimeFa (شمسی) به سرور
   - سرور: تبدیل DateTimeFa → DateTime (میلادی)
   ============================================================ */

let SystemActList = [];
let editingSystemAct = false;

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

// ============================================================
// ابزار: نمایش تاریخ شمسی در جدول
// ============================================================
function getSystemActDateFa(data) {
    // 1) اگه سرور DateTimeFa داده → همون
    if (data.DateTimeFa) return data.DateTimeFa;

    // 2) وگرنه از DateTime میلادی تبدیل کن
    if (data.DateTime && window.PersianDateHelper) {
        return window.PersianDateHelper.toJalali(data.DateTime);
    }

    return '—';
}

// ============================================================
// ابزار: تبدیل میلادی به شمسی (برای ارسال به سرور)
// ============================================================
function toJalaliString(gregorianValue) {
    if (!gregorianValue) return '';
    if (window.PersianDateHelper && window.PersianDateHelper.toJalali) {
        return window.PersianDateHelper.toJalali(gregorianValue);
    }
    return gregorianValue;
}

// ============================================================
// دریافت پرسنل
// ============================================================
GetPersonelData();
function GetPersonelData() {
    showLoading();
    Http.postSecure('/Personels/GetAllData')
        .then(response => {
            if (response.isSuccess) {
                const dataConvert = JSON.parse(response.data);
                let options = '<option value="">انتخاب پرسنل</option>';
                dataConvert.forEach(function (item) {
                    const fullName = `${item.FirstName || ''} ${item.LastName || ''}`.trim();
                    options += `<option value="${item.PersonelId}">${fullName || item.PersonelId}</option>`;
                });
                document.getElementById("Personel").innerHTML = options;
            } else {
                alert(response.errorTitle);
            }
        })
        .catch(handleHttpError)
        .finally(hideLoading);
}

// ============================================================
// localStorage
// ============================================================
function saveToStorage() {
    showLoading();
    Http.postSecure('/SystemActs/GetAllData')
        .then(response => {
            if (response.isSuccess) {
                SystemActList = JSON.parse(response.data);
                localStorage.setItem("SystemActs", JSON.stringify(SystemActList));
                renderTable();
                if (SystemActList.length > 0) {
                    nextId = Math.max(...SystemActList.map(i => i.SystemActId));
                }
            } else {
                alert(response.errorTitle);
            }
        })
        .catch(handleHttpError)
        .finally(hideLoading);
}

function loadFromStorage() {
    const saved = localStorage.getItem("SystemActs");
    if (saved) {
        SystemActList = JSON.parse(saved);
        renderTable();
    } else {
        saveToStorage();
    }
}

// ============================================================
// آمار
// ============================================================
function renderStats() {
    const total = SystemActList.length;
    const active = SystemActList.filter(d => d.Status).length;
    const inactive = SystemActList.filter(d => !d.Status).length;

    document.getElementById("statsCards").innerHTML = `
        <div class="stat-card"><div class="stat-info"><div class="number">${total}</div><div class="label">کل تاریخچه عملیات</div></div><div class="stat-icon"><i class="fas fa-history"></i></div></div>
        <div class="stat-card"><div class="stat-info"><div class="number">${active}</div><div class="label">فعال</div></div><div class="stat-icon"><i class="fas fa-check-circle"></i></div></div>
        <div class="stat-card"><div class="stat-info"><div class="number">${inactive}</div><div class="label">غیرفعال</div></div><div class="stat-icon"><i class="fas fa-ban"></i></div></div>
    `;
}

// ============================================================
// جدول
// ============================================================
function renderTable() {
    const searchTerm = (document.getElementById("searchSystemAct")?.value || "").toLowerCase();
    const statusFilter = document.getElementById("statusFilter")?.value || "all";

    let filtered = [...SystemActList];

    if (searchTerm) {
        filtered = filtered.filter(p =>
            (p.SystemActCaption || "").toLowerCase().includes(searchTerm) ||
            String(p.PersonelId || "").toLowerCase().includes(searchTerm) ||
            String(p.TypeSystemAct || "").toLowerCase().includes(searchTerm)
        );
    }

    if (statusFilter !== "all") {
        filtered = filtered.filter(p => p.Status.toString() === statusFilter);
    }

    const tbody = document.getElementById("SystemActTableBody");
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="7">هیچ رکورد یافت نشد</td></tr>`;
        renderStats();
        return;
    }

    tbody.innerHTML = filtered.map(data => {
        const statusText = data.Status === true ? "فعال" : "غیرفعال";
        const dateFa = getSystemActDateFa(data);

        // نام پرسنل
        const personelName = data.PersonelCaption ||
            `${data.FirstName || ''} ${data.LastName || ''}`.trim() ||
            `#${data.PersonelId}`;

        // نوع عملیات به فارسی
        const typeText = data.TypeSystemAct === 0 ? 'ورود' :
            data.TypeSystemAct === 1 ? 'خروج' :
                data.TypeSystemAct;

        return `<tr>
            <td><strong>${data.SystemActId}</strong></td>
            <td>${data.SystemActCaption || '—'}</td>
            <td>${personelName}</td>
            <td>${typeText}</td>
            <td>${dateFa}</td>
            <td>${statusText}</td>
            <td class="action-buttons">
                <button class="action-btn edit-btn" data-id="${data.SystemActId}" title="ویرایش"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete-btn" data-id="${data.SystemActId}" title="حذف"><i class="fas fa-trash-alt"></i></button>
            </td>
        </tr>`;
    }).join('');

    document.querySelectorAll('.edit-btn').forEach(btn =>
        btn.addEventListener('click', () => openEditModal(parseInt(btn.dataset.id))));

    document.querySelectorAll('.delete-btn').forEach(btn =>
        btn.addEventListener('click', () => {
            if (confirm("حذف رکورد؟")) deleteSystemAct(parseInt(btn.dataset.id));
        }));

    renderStats();
}

// ============================================================
// حذف
// ============================================================
function deleteSystemAct(systemActId) {
    showLoading();
    Http.postSecure('/SystemActs/DeleteData', { 'id': systemActId })
        .then(response => {
            if (response.isSuccess) {
                SystemActList = SystemActList.filter(d => d.SystemActId !== systemActId);
                localStorage.setItem("SystemActs", JSON.stringify(SystemActList));
                renderTable();
                alert(response.data);
            } else {
                alert(response.errorTitle);
            }
        })
        .catch(handleHttpError)
        .finally(hideLoading);
}

// ============================================================
// المان‌ها
// ============================================================
const modal = document.getElementById("SystemActModal");
const modalTitle = document.getElementById("modalTitle");
const empSystemActId = document.getElementById("SystemActId");
const empSystemActCaption = document.getElementById("SystemActCaption");
const empPersonelId = document.getElementById("Personel");
const empTypeSystemAct = document.getElementById("TypeSystemAct");
const empDateTime = document.getElementById("DateTime");   // ← input type="date"
const empStatus = document.getElementById("Status");

// ============================================================
// افزودن / ویرایش
// ============================================================
function openAddModal() {
    editingSystemAct = false;
    resetModal();
    openModal("SystemActModal");
}

function openEditModal(systemActId) {
    const data = SystemActList.find(d => d.SystemActId === systemActId);
    if (!data) return;

    editingSystemAct = true;

    empSystemActId.value = data.SystemActId || '';
    empSystemActCaption.value = data.SystemActCaption || '';
    empPersonelId.value = data.PersonelId || '';
    empTypeSystemAct.value = data.TypeSystemAct ?? '';

    // ✅ مقدار میلادی رو در input date بذار
    // PersianDateInit.js خودش شمسی نمایش می‌ده
    if (empDateTime) {
        let gregorianValue = '';

        if (data.DateTime) {
            // "2024-05-15T00:00:00" → "2024-05-15"
            gregorianValue = String(data.DateTime).split('T')[0];
        } else if (data.DateTimeFa && window.PersianDateHelper) {
            // "1403/02/26" → "2024-05-15"
            gregorianValue = window.PersianDateHelper.toGregorian(data.DateTimeFa);
        }

        empDateTime.value = gregorianValue;
        empDateTime.dispatchEvent(new Event('change', { bubbles: true }));
    }

    empStatus.checked = Boolean(data.Status);

    modalTitle.innerText = "ویرایش تاریخچه عملیات";
    openModal("SystemActModal");
}

function CanselSaveModal() {
    closeModal("SystemActModal");
    resetModal();
}

function resetModal() {
    empSystemActId.value = "";
    empSystemActCaption.value = "";
    empPersonelId.value = "";
    empTypeSystemAct.value = "";

    if (empDateTime) {
        empDateTime.value = "";
        empDateTime.dispatchEvent(new Event('change', { bubbles: true }));
    }

    empStatus.checked = false;
    modalTitle.innerText = "افزودن تاریخچه عملیات جدید";
}

// ============================================================
// ذخیره
// ============================================================
function SaveNewModel() {
    const SystemActId = empSystemActId.value.trim();
    const SystemActCaption = empSystemActCaption.value.trim();
    const PersonelId = empPersonelId.value.trim();
    const TypeSystemAct = empTypeSystemAct.value.trim();

    // ✅ input date → میلادی
    const dateGregorian = empDateTime ? empDateTime.value.trim() : '';

    // ✅ تبدیل به شمسی برای ارسال به سرور
    const DateTimeFa = toJalaliString(dateGregorian);

    const Status = empStatus.checked;

    if (!SystemActCaption) { alert("لطفاً عنوان را وارد کنید"); return; }
    if (!PersonelId) { alert("لطفاً پرسنل را انتخاب کنید"); return; }
    if (!TypeSystemAct) { alert("لطفاً نوع عملیات را وارد کنید"); return; }
    if (!dateGregorian) { alert("لطفاً تاریخ عملیات را انتخاب کنید"); return; }

    if (editingSystemAct) {
        updateSystemAct(SystemActId, SystemActCaption, PersonelId, TypeSystemAct, DateTimeFa, Status);
    } else {
        addSystemAct(SystemActId, SystemActCaption, PersonelId, TypeSystemAct, DateTimeFa, Status);
    }

    closeModal("SystemActModal");
}

function addSystemAct(SystemActId, SystemActCaption, PersonelId, TypeSystemAct, DateTimeFa, Status) {
    const newSystemAct = {
        SystemActId: 0,
        SystemActCaption,
        PersonelId: parseInt(PersonelId),
        TypeSystemAct: parseInt(TypeSystemAct),
        DateTimeFa,             // ← شمسی: "1403/02/26"
        Status
    };
    SendData(newSystemAct, true);
}

function updateSystemAct(SystemActId, SystemActCaption, PersonelId, TypeSystemAct, DateTimeFa, Status) {
    const idx = SystemActList.findIndex(d => d.SystemActId == SystemActId);
    if (idx === -1) return;

    const updated = {
        SystemActId: parseInt(SystemActId),
        SystemActCaption,
        PersonelId: parseInt(PersonelId),
        TypeSystemAct: parseInt(TypeSystemAct),
        DateTimeFa,             // ← شمسی
        Status
    };

    SystemActList[idx] = { ...SystemActList[idx], ...updated };
    SendData(updated, false);
}

function SendData(systemAct, isAdd) {
    const url = isAdd
        ? '/SystemActs/AddData'
        : '/SystemActs/UpdateData';

    showLoading();
    Http.postSecure(url, systemAct)
        .then(response => {
            if (response.isSuccess) {
                saveToStorage();
                alert(response.data);
            } else {
                alert(response.errorTitle);
            }
        })
        .catch(handleHttpError)
        .finally(hideLoading);
}

// ============================================================
// ابزار مودال
// ============================================================
function openModal(id) {
    document.getElementById(id).classList.add("active");
}

function closeModal(id) {
    document.getElementById(id).classList.remove("active");
}

// ============================================================
// رویدادها
// ============================================================
document.getElementById("searchSystemAct")?.addEventListener("input", renderTable);
document.getElementById("statusFilter")?.addEventListener("change", renderTable);

if (modal) {
    modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal("SystemActModal");
    });
}

// ============================================================
// شروع
// ============================================================
loadFromStorage();