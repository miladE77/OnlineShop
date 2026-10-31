// ═══ Receipts.js ═══

/* ============================================================
   Receipts.js — مدیریت رسید پرداخت (با تقویم شمسی)
   ------------------------------------------------------------
   - UI: input[type="date"] برای DateTimePeyment + تقویم شمسی
   - ارسال: DateTimePeymentFa (شمسی) به سرور
   - سرور: تبدیل DateTimePeymentFa → DateTimePeyment (میلادی)
   ============================================================ */
const H = window.HttpHelper;
const Http = window.HttpHelper;
const UI = window.UICore;
let ReceiptList = [];
let editingReceipt = false;

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
function getReceiptDateFa(data) {
    if (data.DateTimePeymentFa) return data.DateTimePeymentFa;
    if (data.DateTimePeyment && window.PersianDateHelper) {
        return window.PersianDateHelper.toJalali(data.DateTimePeyment);
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
// دریافت نوع پرداخت
// ============================================================
GetTypePeymentData();
function GetTypePeymentData() {

    showLoading();
    Http.postSecure('/TypePeyments/GetAllData')
        .then(response => {
            if (response.isSuccess) {
                const dataConvert = JSON.parse(response.data);
                let options = '<option value="">انتخاب نوع پرداخت</option>';
                dataConvert.forEach(function (item) {
                    options += `<option value="${item.TypePeymentId}">${item.TypePeymentCaption}</option>`;
                });
                document.getElementById("TypePeyment").innerHTML = options;
            } else {
                alert(response.errorTitle);
            }
        })
        .catch(handleHttpError)
        .finally(hideLoading);
}

// ============================================================
// دریافت لیست سفارشات (Recommendations)
// ============================================================
GetRecommendationsData();
function GetRecommendationsData() {

    showLoading();
    Http.postSecure('/Recommendationss/GetAllData')
        .then(response => {
            if (response.isSuccess) {
                const dataConvert = JSON.parse(response.data);
                let options = '<option value="">انتخاب سفارش</option>';
                dataConvert.forEach(function (item) {
                    const caption = item.RecommendationsCaption || `سفارش #${item.RecommendationsId}`;
                    options += `<option value="${item.RecommendationsId}">${caption}</option>`;
                });
                document.getElementById("Recommendations").innerHTML = options;
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
    Http.postSecure('/Receipts/GetAllData')
        .then(response => {
            if (response.isSuccess) {
                ReceiptList = JSON.parse(response.data);
                localStorage.setItem("Receipts", JSON.stringify(ReceiptList));
                renderTable();
                if (ReceiptList.length > 0) {
                    nextId = Math.max(...ReceiptList.map(i => i.ReceiptId));
                }
            } else {
                alert(response.errorTitle);
            }
        })
        .catch(handleHttpError)
        .finally(hideLoading);
}

function loadFromStorage() {
    const saved = localStorage.getItem("Receipts");
    if (saved) {
        ReceiptList = JSON.parse(saved);
        renderTable();
    } else {
        saveToStorage();
    }
}

// ============================================================
// آمار
// ============================================================
function renderStats() {
    const total = ReceiptList.length;
    const active = ReceiptList.filter(d => d.Status).length;
    const inactive = ReceiptList.filter(d => !d.Status).length;

    document.getElementById("statsCards").innerHTML = `
        <div class="stat-card"><div class="stat-info"><div class="number">${total}</div><div class="label">کل رسید پرداخت</div></div><div class="stat-icon"><i class="fas fa-receipt"></i></div></div>
        <div class="stat-card"><div class="stat-info"><div class="number">${active}</div><div class="label">فعال</div></div><div class="stat-icon"><i class="fas fa-check-circle"></i></div></div>
        <div class="stat-card"><div class="stat-info"><div class="number">${inactive}</div><div class="label">غیرفعال</div></div><div class="stat-icon"><i class="fas fa-ban"></i></div></div>
    `;
}

// ============================================================
// جدول
// ============================================================
function renderTable() {
    const searchTerm = (document.getElementById("searchReceipt")?.value || "").toLowerCase();
    const statusFilter = document.getElementById("statusFilter")?.value || "all";

    let filtered = [...ReceiptList];

    if (searchTerm) {
        filtered = filtered.filter(p =>
            (p.ReceiptCaption || "").toLowerCase().includes(searchTerm) ||
            (p.TypePeymentCaption || "").toLowerCase().includes(searchTerm) ||
            (p.RecommendationsCaption || "").toLowerCase().includes(searchTerm)
        );
    }

    if (statusFilter !== "all") {
        filtered = filtered.filter(p => p.Status.toString() === statusFilter);
    }

    const tbody = document.getElementById("ReceiptTableBody");
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="8">هیچ رکورد یافت نشد</td></tr>`;
        renderStats();
        return;
    }

    tbody.innerHTML = filtered.map(data => {
        const statusText = data.Status === true ? "فعال" : "غیرفعال";
        const dateFa = getReceiptDateFa(data);
        const typeCaption = data.TypePeymentCaption || `#${data.TypePeymentId}`;
        const recCaption = data.RecommendationsCaption || `#${data.RecommendationsId}`;
        const valueFormatted = (data.ValuePeyment || 0).toLocaleString();

        return `<tr>
            <td><strong>${data.ReceiptId}</strong></td>
            <td>${data.ReceiptCaption || '—'}</td>
            <td>${typeCaption}</td>
            <td>${recCaption}</td>
            <td>${valueFormatted} تومان</td>
            <td>${dateFa}</td>
            <td>${statusText}</td>
            <td class="action-buttons">
                <button class="action-btn edit-btn" data-id="${data.ReceiptId}" title="ویرایش"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete-btn" data-id="${data.ReceiptId}" title="حذف"><i class="fas fa-trash-alt"></i></button>
            </td>
        </tr>`;
    }).join('');

    document.querySelectorAll('.edit-btn').forEach(btn =>
        btn.addEventListener('click', () => openEditModal(parseInt(btn.dataset.id))));

    document.querySelectorAll('.delete-btn').forEach(btn =>
        btn.addEventListener('click', () => {
            if (confirm("حذف رکورد؟")) deleteReceipt(parseInt(btn.dataset.id));
        }));

    renderStats();
}

// ============================================================
// حذف
// ============================================================
function deleteReceipt(receiptId) {
    showLoading();
    Http.postSecure('/Receipts/DeleteData', { 'id': receiptId })
        .then(response => {
            if (response.isSuccess) {
                ReceiptList = ReceiptList.filter(d => d.ReceiptId !== receiptId);
                localStorage.setItem("Receipts", JSON.stringify(ReceiptList));
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
const modal = document.getElementById("ReceiptModal");
const modalTitle = document.getElementById("modalTitle");
const empReceiptId = document.getElementById("ReceiptId");
const empReceiptCaption = document.getElementById("ReceiptCaption");
const empTypePeymentId = document.getElementById("TypePeyment");
const empRecommendationsId = document.getElementById("Recommendations");   // ← جدید
const empValuePeyment = document.getElementById("ValuePeyment");
const empDateTimePeyment = document.getElementById("DateTimePeyment");     // ← input date
const empStatus = document.getElementById("Status");

// ============================================================
// افزودن / ویرایش
// ============================================================
function openAddModal() {
    editingReceipt = false;
    resetModal();
    openModal("ReceiptModal");
}

function openEditModal(receiptId) {
    const data = ReceiptList.find(d => d.ReceiptId === receiptId);
    if (!data) return;

    editingReceipt = true;

    empReceiptId.value = data.ReceiptId || '';
    empReceiptCaption.value = data.ReceiptCaption || '';
    empTypePeymentId.value = data.TypePeymentId || '';

    // ✅ سفارش مرتبط
    if (empRecommendationsId) {
        empRecommendationsId.value = data.RecommendationsId || '';
    }

    empValuePeyment.value = data.ValuePeyment ?? '';

    // ✅ مقدار میلادی رو در input date بذار
    if (empDateTimePeyment) {
        let gregorianValue = '';

        if (data.DateTimePeyment) {
            gregorianValue = String(data.DateTimePeyment).split('T')[0];
        } else if (data.DateTimePeymentFa && window.PersianDateHelper) {
            gregorianValue = window.PersianDateHelper.toGregorian(data.DateTimePeymentFa);
        }

        empDateTimePeyment.value = gregorianValue;
        empDateTimePeyment.dispatchEvent(new Event('change', { bubbles: true }));
    }

    empStatus.checked = Boolean(data.Status);

    modalTitle.innerText = "ویرایش رسید پرداخت";
    openModal("ReceiptModal");
}

function CanselSaveModal() {
    closeModal("ReceiptModal");
    resetModal();
}

function resetModal() {
    empReceiptId.value = "";
    empReceiptCaption.value = "";
    empTypePeymentId.value = "";

    if (empRecommendationsId) {
        empRecommendationsId.value = "";
    }

    empValuePeyment.value = "";

    if (empDateTimePeyment) {
        empDateTimePeyment.value = "";
        empDateTimePeyment.dispatchEvent(new Event('change', { bubbles: true }));
    }

    empStatus.checked = false;
    modalTitle.innerText = "افزودن رسید پرداخت جدید";
}

// ============================================================
// ذخیره
// ============================================================
function SaveNewModel() {
    const ReceiptId = empReceiptId.value.trim();
    const ReceiptCaption = empReceiptCaption.value.trim();
    const TypePeymentId = empTypePeymentId.value.trim();
    const RecommendationsId = empRecommendationsId ? empRecommendationsId.value.trim() : '';
    const ValuePeyment = empValuePeyment.value.trim();

    // ✅ input date → میلادی
    const dateGregorian = empDateTimePeyment ? empDateTimePeyment.value.trim() : '';

    // ✅ تبدیل به شمسی برای ارسال به سرور
    const DateTimePeymentFa = toJalaliString(dateGregorian);

    const Status = empStatus.checked;

    if (!ReceiptCaption) { alert("لطفاً عنوان پرداخت را وارد کنید"); return; }
    if (!TypePeymentId) { alert("لطفاً نوع پرداخت را انتخاب کنید"); return; }
    if (!RecommendationsId) { alert("لطفاً سفارش مرتبط را انتخاب کنید"); return; }
    if (!ValuePeyment) { alert("لطفاً حجم پرداخت را وارد کنید"); return; }
    if (!dateGregorian) { alert("لطفاً تاریخ پرداخت را انتخاب کنید"); return; }

    if (editingReceipt) {
        updateReceipt(ReceiptId, ReceiptCaption, TypePeymentId, RecommendationsId, ValuePeyment, DateTimePeymentFa, Status);
    } else {
        addReceipt(ReceiptId, ReceiptCaption, TypePeymentId, RecommendationsId, ValuePeyment, DateTimePeymentFa, Status);
    }

    closeModal("ReceiptModal");
}

function addReceipt(ReceiptId, ReceiptCaption, TypePeymentId, RecommendationsId, ValuePeyment, DateTimePeymentFa, Status) {
    const newReceipt = {
        ReceiptId: 0,
        ReceiptCaption,
        TypePeymentId: parseInt(TypePeymentId),
        RecommendationsId: parseInt(RecommendationsId),
        ValuePeyment: parseInt(ValuePeyment),
        DateTimePeymentFa,           // ← شمسی
        Status
    };
    SendData(newReceipt, true);
}

function updateReceipt(ReceiptId, ReceiptCaption, TypePeymentId, RecommendationsId, ValuePeyment, DateTimePeymentFa, Status) {
    const idx = ReceiptList.findIndex(d => d.ReceiptId == ReceiptId);
    if (idx === -1) return;

    const updated = {
        ReceiptId: parseInt(ReceiptId),
        ReceiptCaption,
        TypePeymentId: parseInt(TypePeymentId),
        RecommendationsId: parseInt(RecommendationsId),
        ValuePeyment: parseInt(ValuePeyment),
        DateTimePeymentFa,           // ← شمسی
        Status
    };

    ReceiptList[idx] = { ...ReceiptList[idx], ...updated };
    SendData(updated, false);
}

function SendData(receipt, isAdd) {
    const url = isAdd
        ? '/Receipts/AddData'
        : '/Receipts/UpdateData';

    showLoading();
    Http.postSecure(url, receipt)
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
document.getElementById("searchReceipt")?.addEventListener("input", renderTable);
document.getElementById("statusFilter")?.addEventListener("change", renderTable);

if (modal) {
    modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal("ReceiptModal");
    });
}

// ============================================================
// شروع
// ============================================================
loadFromStorage();