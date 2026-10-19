/* ============================================================
   ContactUss.js — مدیریت فرم تماس با ما (با تقویم شمسی)
   ------------------------------------------------------------
   - UI: input[type="date"] برای CreatedDate + تقویم شمسی
   - ارسال: CreatedDateFa (شمسی) به سرور
   - سرور: تبدیل CreatedDateFa → CreatedDate (میلادی)
   ============================================================ */

let ContactUsList = [];
let editingContactUs = false;

// ============================================================
// ابزار: نمایش تاریخ شمسی در جدول
// ============================================================
function getContactUsDateFa(data) {
    if (data.CreatedDateFa) return data.CreatedDateFa;
    if (data.CreatedDate && window.PersianDateHelper) {
        return window.PersianDateHelper.toJalali(data.CreatedDate);
    }
    return '—';
}

// ============================================================
// ابزار: تبدیل میلادی به شمسی
// ============================================================
function toJalaliString(gregorianValue) {
    if (!gregorianValue) return '';
    if (window.PersianDateHelper && window.PersianDateHelper.toJalali) {
        return window.PersianDateHelper.toJalali(gregorianValue);
    }
    return gregorianValue;
}

// ============================================================
// وضعیت پاسخ‌دهی
// ============================================================
function getCondetionText(condetion) {
    const map = {
        0: 'در انتظار پاسخ',
        1: 'پاسخ داده شده',
        2: 'رد شده',
        3: 'بایگانی'
    };
    return map[condetion] || 'نامشخص';
}

function getCondetionBadgeClass(condetion) {
    const map = {
        0: 'status-pending',
        1: 'status-answered',
        2: 'status-rejected',
        3: 'status-archive'
    };
    return map[condetion] || 'status-pending';
}

// ============================================================
// دریافت فروشگاه‌ها
// ============================================================
GetStoreData();
function GetStoreData() {
    $.post('/Stores/GetAllData', function (response) {
        if (response.isSuccess) {
            const dataConvert = JSON.parse(response.data);
            let options = '<option value="">انتخاب فروشگاه</option>';
            dataConvert.forEach(function (item) {
                options += `<option value="${item.StoreId}">${item.StoreCaption}</option>`;
            });
            document.getElementById("Store").innerHTML = options;
        } else {
            alert(response.errorTitle);
        }
    });
}

// ============================================================
// دریافت پرسنل
// ============================================================
GetPersonelData();
function GetPersonelData() {
    $.post('/Personels/GetAllData', function (response) {
        if (response.isSuccess) {
            const dataConvert = JSON.parse(response.data);
            let options = '<option value="">انتخاب پرسشگر</option>';
            dataConvert.forEach(function (item) {
                const fullName = `${item.FirstName || ''} ${item.LastName || ''}`.trim();
                options += `<option value="${item.PersonelId}">${fullName || item.PersonelId}</option>`;
            });
            document.getElementById("Personel").innerHTML = options;
        } else {
            alert(response.errorTitle);
        }
    });
}

// ============================================================
// localStorage
// ============================================================
function saveToStorage() {
    $.post('/ContactUss/GetAllData', function (response) {
        if (response.isSuccess) {
            ContactUsList = JSON.parse(response.data);
            localStorage.setItem("ContactUss", JSON.stringify(ContactUsList));
            renderTable();
            if (ContactUsList.length > 0) {
                nextId = Math.max(...ContactUsList.map(i => i.ContactUsId));
            }
        } else {
            alert(response.errorTitle);
        }
    });
}

function loadFromStorage() {
    const saved = localStorage.getItem("ContactUss");
    if (saved) {
        ContactUsList = JSON.parse(saved);
        renderTable();
    } else {
        saveToStorage();
    }
}

// ============================================================
// آمار
// ============================================================
function renderStats() {
    const total = ContactUsList.length;
    const active = ContactUsList.filter(d => d.Status).length;
    const inactive = ContactUsList.filter(d => !d.Status).length;

    document.getElementById("statsCards").innerHTML = `
        <div class="stat-card"><div class="stat-info"><div class="number">${total}</div><div class="label">کل فرم‌های تماس</div></div><div class="stat-icon"><i class="fas fa-envelope-open-text"></i></div></div>
        <div class="stat-card"><div class="stat-info"><div class="number">${active}</div><div class="label">فعال</div></div><div class="stat-icon"><i class="fas fa-check-circle"></i></div></div>
        <div class="stat-card"><div class="stat-info"><div class="number">${inactive}</div><div class="label">غیرفعال</div></div><div class="stat-icon"><i class="fas fa-ban"></i></div></div>
    `;
}

// ============================================================
// جدول
// ============================================================
function renderTable() {
    const searchTerm = (document.getElementById("searchContactUs")?.value || "").toLowerCase();
    const statusFilter = document.getElementById("statusFilter")?.value || "all";

    let filtered = [...ContactUsList];

    if (searchTerm) {
        filtered = filtered.filter(p =>
            (p.ContactUsCaption || "").toLowerCase().includes(searchTerm) ||
            (p.FullName || "").toLowerCase().includes(searchTerm) ||
            (p.Email || "").toLowerCase().includes(searchTerm) ||
            (p.PhoneNumber || "").toLowerCase().includes(searchTerm) ||
            (p.StoreCaption || "").toLowerCase().includes(searchTerm)
        );
    }

    if (statusFilter !== "all") {
        filtered = filtered.filter(p => p.Status.toString() === statusFilter);
    }

    const tbody = document.getElementById("ContactUsTableBody");
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="13">هیچ رکورد یافت نشد</td></tr>`;
        renderStats();
        return;
    }

    tbody.innerHTML = filtered.map(data => {
        const statusText = data.Status === true ? "فعال" : "غیرفعال";
        const dateFa = getContactUsDateFa(data);
        const condetionText = getCondetionText(data.Condetion);
        const condetionClass = getCondetionBadgeClass(data.Condetion);
        const storeCaption = data.StoreCaption || '—';
        const personelCaption = data.PersonelCaption || '—';
        const shortMessage = (data.Messages || '').length > 40
            ? (data.Messages || '').substring(0, 40) + '...'
            : (data.Messages || '—');

        return `<tr>
            <td><strong>${data.ContactUsId}</strong></td>
            <td>${data.ContactUsCaption || '—'}</td>
            <td>${data.FullName || '—'}</td>
            <td>${data.Email || '—'}</td>
            <td>${data.PhoneNumber || '—'}</td>
            <td title="${(data.Messages || '').replace(/"/g, '&quot;')}">${shortMessage}</td>
            <td>${dateFa}</td>
            <td>${storeCaption}</td>
            <td>${personelCaption}</td>
            <td>${data.UserIP || '—'}</td>
            <td><span class="status-badge ${condetionClass}">${condetionText}</span></td>
            <td>${statusText}</td>
            <td class="action-buttons">
                <button class="action-btn edit-btn" data-id="${data.ContactUsId}" title="ویرایش"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete-btn" data-id="${data.ContactUsId}" title="حذف"><i class="fas fa-trash-alt"></i></button>
            </td>
        </tr>`;
    }).join('');

    document.querySelectorAll('.edit-btn').forEach(btn =>
        btn.addEventListener('click', () => openEditModal(parseInt(btn.dataset.id))));

    document.querySelectorAll('.delete-btn').forEach(btn =>
        btn.addEventListener('click', () => {
            if (confirm("حذف رکورد؟")) deleteContactUs(parseInt(btn.dataset.id));
        }));

    renderStats();
}

// ============================================================
// حذف
// ============================================================
function deleteContactUs(contactUsId) {
    $.post('/ContactUss/DeleteData', { 'id': contactUsId }, function (response) {
        if (response.isSuccess) {
            ContactUsList = ContactUsList.filter(d => d.ContactUsId !== contactUsId);
            localStorage.setItem("ContactUss", JSON.stringify(ContactUsList));
            renderTable();
            alert(response.data);
        } else {
            alert(response.errorTitle);
        }
    });
}

// ============================================================
// المان‌ها
// ============================================================
const modal = document.getElementById("ContactUsModal");
const modalTitle = document.getElementById("modalTitle");
const empContactUsId = document.getElementById("ContactUsId");
const empContactUsCaption = document.getElementById("ContactUsCaption");
const empFullName = document.getElementById("FullName");
const empEmail = document.getElementById("Email");
const empPhoneNumber = document.getElementById("PhoneNumber");
const empMessages = document.getElementById("Messages");
const empCreatedDate = document.getElementById("CreatedDate");   // ← input date
const empStoreId = document.getElementById("Store");
const empPersonelId = document.getElementById("Personel");
const empUserIP = document.getElementById("UserIP");
const empCondetion = document.getElementById("Condetion");
const empStatus = document.getElementById("Status");

// ============================================================
// افزودن / ویرایش
// ============================================================
function openAddModal() {
    editingContactUs = false;
    resetModal();
    openModal("ContactUsModal");
}

function openEditModal(contactUsId) {
    const data = ContactUsList.find(d => d.ContactUsId === contactUsId);
    if (!data) return;

    editingContactUs = true;

    empContactUsId.value = data.ContactUsId || '';
    empContactUsCaption.value = data.ContactUsCaption || '';
    empFullName.value = data.FullName || '';
    empEmail.value = data.Email || '';
    empPhoneNumber.value = data.PhoneNumber || '';
    empMessages.value = data.Messages || '';

    // ✅ مقدار میلادی رو در input date بذار
    if (empCreatedDate) {
        let gregorianValue = '';

        if (data.CreatedDate) {
            gregorianValue = String(data.CreatedDate).split('T')[0];
        } else if (data.CreatedDateFa && window.PersianDateHelper) {
            gregorianValue = window.PersianDateHelper.toGregorian(data.CreatedDateFa);
        }

        empCreatedDate.value = gregorianValue;
        empCreatedDate.dispatchEvent(new Event('change', { bubbles: true }));
    }

    empStoreId.value = data.StoreId ?? '';
    empPersonelId.value = data.PersonelId ?? '';
    empUserIP.value = data.UserIP || '';
    empCondetion.value = data.Condetion ?? 0;
    empStatus.checked = Boolean(data.Status);

    modalTitle.innerText = "ویرایش فرم تماس با ما";
    openModal("ContactUsModal");
}

function CanselSaveModal() {
    closeModal("ContactUsModal");
    resetModal();
}

function resetModal() {
    empContactUsId.value = "";
    empContactUsCaption.value = "";
    empFullName.value = "";
    empEmail.value = "";
    empPhoneNumber.value = "";
    empMessages.value = "";

    if (empCreatedDate) {
        empCreatedDate.value = "";
        empCreatedDate.dispatchEvent(new Event('change', { bubbles: true }));
    }

    empStoreId.value = "";
    empPersonelId.value = "";
    empUserIP.value = "";
    empCondetion.value = "0";
    empStatus.checked = false;
    modalTitle.innerText = "افزودن فرم تماس با ما جدید";
}

// ============================================================
// ذخیره
// ============================================================
function SaveNewModel() {
    const ContactUsId = empContactUsId.value.trim();
    const ContactUsCaption = empContactUsCaption.value.trim();
    const FullName = empFullName.value.trim();
    const Email = empEmail.value.trim();
    const PhoneNumber = empPhoneNumber.value.trim();
    const Messages = empMessages.value.trim();

    // ✅ input date → میلادی
    const dateGregorian = empCreatedDate ? empCreatedDate.value.trim() : '';

    // ✅ تبدیل به شمسی برای ارسال به سرور
    const CreatedDateFa = toJalaliString(dateGregorian);

    const StoreId = empStoreId.value.trim();
    const PersonelId = empPersonelId.value.trim();
    const UserIP = empUserIP.value.trim();
    const Condetion = empCondetion.value.trim();
    const Status = empStatus.checked;

    if (!ContactUsCaption) { alert("لطفاً موضوع متن را وارد کنید"); return; }
    if (!FullName) { alert("لطفاً نام و نام خانوادگی را وارد کنید"); return; }
    if (!Email) { alert("لطفاً ایمیل را وارد کنید"); return; }
    if (!PhoneNumber) { alert("لطفاً شماره تماس را وارد کنید"); return; }
    if (!Messages) { alert("لطفاً متن پیام را وارد کنید"); return; }
    if (!dateGregorian) { alert("لطفاً تاریخ ثبت را انتخاب کنید"); return; }
    if (!StoreId) { alert("لطفاً فروشگاه را انتخاب کنید"); return; }
    if (!PersonelId) { alert("لطفاً پرسشگر را انتخاب کنید"); return; }
    if (!UserIP) { alert("لطفاً IP را وارد کنید"); return; }

    if (editingContactUs) {
        updateContactUs(ContactUsId, ContactUsCaption, FullName, Email, PhoneNumber, Messages, CreatedDateFa, StoreId, PersonelId, UserIP, Condetion, Status);
    } else {
        addContactUs(ContactUsId, ContactUsCaption, FullName, Email, PhoneNumber, Messages, CreatedDateFa, StoreId, PersonelId, UserIP, Condetion, Status);
    }

    closeModal("ContactUsModal");
}

function addContactUs(ContactUsId, ContactUsCaption, FullName, Email, PhoneNumber, Messages, CreatedDateFa, StoreId, PersonelId, UserIP, Condetion, Status) {
    const newContactUs = {
        ContactUsId: 0,
        ContactUsCaption,
        FullName,
        Email,
        PhoneNumber,
        Messages,
        CreatedDateFa,          // ← شمسی
        StoreId: parseInt(StoreId),
        PersonelId: parseInt(PersonelId),
        UserIP,
        Condetion: parseInt(Condetion),
        Status
    };
    SendData(newContactUs, true);
}

function updateContactUs(ContactUsId, ContactUsCaption, FullName, Email, PhoneNumber, Messages, CreatedDateFa, StoreId, PersonelId, UserIP, Condetion, Status) {
    const idx = ContactUsList.findIndex(d => d.ContactUsId == ContactUsId);
    if (idx === -1) return;

    const updated = {
        ContactUsId: parseInt(ContactUsId),
        ContactUsCaption,
        FullName,
        Email,
        PhoneNumber,
        Messages,
        CreatedDateFa,          // ← شمسی
        StoreId: parseInt(StoreId),
        PersonelId: parseInt(PersonelId),
        UserIP,
        Condetion: parseInt(Condetion),
        Status
    };

    ContactUsList[idx] = { ...ContactUsList[idx], ...updated };
    SendData(updated, false);
}

function SendData(contactUs, isAdd) {
    $.post('/ContactUss/UpdateData', contactUs, function (response) {
        if (response.isSuccess) {
            saveToStorage();
            alert(response.data);
        } else {
            alert(response.errorTitle);
        }
    }).fail(function () {
        alert("خطا در ارتباط با سرور");
    });
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
document.getElementById("searchContactUs")?.addEventListener("input", renderTable);
document.getElementById("statusFilter")?.addEventListener("change", renderTable);

if (modal) {
    modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal("ContactUsModal");
    });
}

// ============================================================
// شروع
// ============================================================
loadFromStorage();