/* ============================================================
   Stores.js — مدیریت فروشگاه (AdminPlan)
   ============================================================ */

let StoreList = [];
let editingStore = false;

// ═══════════════════════════════════════════════════════
// HttpHelper و UICore
// ═══════════════════════════════════════════════════════
const Http = window.HttpHelper;
const UI = window.UICore;

// ═══════════════════════════════════════════════════════
// مدیریت خطا
// ═══════════════════════════════════════════════════════
function handleHttpError(err) {
    console.error('[Stores] HTTP error:', err);
    if (err.message === 'AUTH_REQUIRED') return;
    if (err.message === 'CSRF_OR_BAD_REQUEST') {
        alert('نشست شما منقضی شده. صفحه را رفرش کنید.');
        return;
    }
    alert('خطا در ارتباط با سرور');
}

function showLoading() { if (UI && UI.showLoading) UI.showLoading(); }
function hideLoading() { if (UI && UI.hideLoading) UI.hideLoading(); }

// ═══════════════════════════════════════════════════════
// تاریخ: تبدیل میلادی ↔ شمسی
// ═══════════════════════════════════════════════════════
function toJalali(gregorianValue) {
    if (!gregorianValue) return '';
    if (window.PersianDateHelper && window.PersianDateHelper.toJalali) {
        return window.PersianDateHelper.toJalali(gregorianValue);
    }
    return '';
}

function toGregorian(jalaliValue) {
    if (!jalaliValue) return '';
    if (window.PersianDateHelper && window.PersianDateHelper.toGregorian) {
        return window.PersianDateHelper.toGregorian(jalaliValue);
    }
    return '';
}

function getDateFa(data) {
    if (data.StoreRecordFa) return data.StoreRecordFa;
    if (data.StoreRecord) {
        const g = String(data.StoreRecord).split('T')[0];
        return toJalali(g) || g;
    }
    return '—';
}

// ═══════════════════════════════════════════════════════
// Select صاحب فروشگاه
// ═══════════════════════════════════════════════════════
function GetPersonelData() {
    Http.postSecure('/Personels/GetAllData')
        .then(response => {
            if (response.isSuccess) {
                let dataConvert = JSON.parse(response.data);
                let options = '<option value="">انتخاب صاحب فروشگاه</option>';
                dataConvert.forEach(function (item) {
                    const fullName = `${item.FirstName || ''} ${item.LastName || ''}`.trim();
                    options += `<option value="${item.PersonelId}">${fullName || item.PersonelId}</option>`;
                });
                document.getElementById("Personel").innerHTML = options;
            } else {
                alert(response.errorTitle);
            }
        })
        .catch(handleHttpError);
}

GetPersonelData();

// ═══════════════════════════════════════════════════════
// GetAllData
// ═══════════════════════════════════════════════════════
function saveToStorage() {
    showLoading();
    Http.postSecure('/Stores/GetAllData')
        .then(response => {
            if (response.isSuccess) {
                StoreList = JSON.parse(response.data);
                localStorage.setItem("Stores", JSON.stringify(StoreList));
                renderTable();
                if (StoreList.length > 0) {
                    nextId = Math.max(...StoreList.map(i => i.StoreId));
                }
            } else {
                alert(response.errorTitle);
            }
        })
        .catch(handleHttpError)
        .finally(hideLoading);
}

function loadFromStorage() {
    const saved = localStorage.getItem("Stores");
    if (saved) {
        try {
            StoreList = JSON.parse(saved);
            renderTable();
        } catch {
            saveToStorage();
        }
    } else {
        saveToStorage();
    }
}

// ═══════════════════════════════════════════════════════
// آمار
// ═══════════════════════════════════════════════════════
function renderStats() {
    const total = StoreList.length;
    const active = StoreList.filter(d => d.Status).length;
    const inactive = StoreList.filter(d => !d.Status).length;

    const el = document.getElementById("statsCards");
    if (!el) return;

    el.innerHTML = `
        <div class="stat-card"><div class="stat-info"><div class="number">${total}</div><div class="label">کل فروشگاه</div></div><div class="stat-icon"><i class="fas fa-store"></i></div></div>
        <div class="stat-card"><div class="stat-info"><div class="number">${active}</div><div class="label">فعال</div></div><div class="stat-icon"><i class="fas fa-check-circle"></i></div></div>
        <div class="stat-card"><div class="stat-info"><div class="number">${inactive}</div><div class="label">غیرفعال</div></div><div class="stat-icon"><i class="fas fa-ban"></i></div></div>
    `;
}

// ═══════════════════════════════════════════════════════
// جدول
// ═══════════════════════════════════════════════════════
function renderTable() {
    const searchEl = document.getElementById("searchStore");
    const statusEl = document.getElementById("statusFilter");
    const tbody = document.getElementById("StoreTableBody");
    if (!tbody) return;

    const searchTerm = (searchEl?.value || "").toLowerCase().trim();
    const statusFilter = statusEl?.value || "all";

    let filtered = [...StoreList];

    if (searchTerm) {
        filtered = filtered.filter(p =>
            (p.StoreCaption || "").toLowerCase().includes(searchTerm) ||
            (p.CodeStore || "").toLowerCase().includes(searchTerm) ||
            (p.AddressStore || "").toLowerCase().includes(searchTerm) ||
            (p.FirstName || "").toLowerCase().includes(searchTerm) ||
            (p.LastName || "").toLowerCase().includes(searchTerm)
        );
    }

    if (statusFilter !== "all") {
        filtered = filtered.filter(p => p.Status.toString() === statusFilter);
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="8">هیچ رکورد یافت نشد</td></tr>`;
        renderStats();
        return;
    }

    tbody.innerHTML = filtered.map(data => {
        const statusStatus = data.Status === true ? "فعال" : "غیرفعال";
        const dateFa = getDateFa(data);
        const fullName = `${data.FirstName || ''} ${data.LastName || ''}`.trim() || '—';

        return `<tr>
            <td><strong>${data.StoreId}</strong></td>
            <td>${escapeHtml(data.StoreCaption || '—')}</td>
            <td>${escapeHtml(fullName)}</td>
            <td>${escapeHtml(data.CodeStore || '—')}</td>
            <td>${dateFa}</td>
            <td>${escapeHtml(data.AddressStore || '—')}</td>
            <td>${statusStatus}</td>
            <td class="action-buttons">
                <button class="action-btn edit-btn" data-id="${data.StoreId}" title="ویرایش"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete-btn" data-id="${data.StoreId}" title="حذف"><i class="fas fa-trash-alt"></i></button>
            </td>
        </tr>`;
    }).join('');

    document.querySelectorAll('.edit-btn').forEach(btn =>
        btn.addEventListener('click', () => openEditModal(parseInt(btn.dataset.id))));

    document.querySelectorAll('.delete-btn').forEach(btn =>
        btn.addEventListener('click', () => {
            if (confirm("حذف رکورد؟")) deleteStore(parseInt(btn.dataset.id));
        }));

    renderStats();
}

function escapeHtml(s) {
    if (s === null || s === undefined) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ═══════════════════════════════════════════════════════
// حذف
// ═══════════════════════════════════════════════════════
function deleteStore(StoreId) {
    showLoading();
    Http.postSecure('/Stores/DeleteData', { 'id': StoreId })
        .then(response => {
            if (response.isSuccess) {
                StoreList = StoreList.filter(data => data.StoreId !== StoreId);
                saveToStorage();
                renderTable();
                alert(response.data);
            } else {
                alert(response.errorTitle);
            }
        })
        .catch(handleHttpError)
        .finally(hideLoading);
}

// ═══════════════════════════════════════════════════════
// المان‌ها
// ═══════════════════════════════════════════════════════
const modal = document.getElementById("StoreModal");
const modalTitle = document.getElementById("modalTitle");
const empStoreId = document.getElementById("StoreId");
const empStoreCaption = document.getElementById("StoreCaption");
const empPersonelId = document.getElementById("Personel");
const empCodeStore = document.getElementById("CodeStore");
const empStoreRecord = document.getElementById("StoreRecord");
const empAddressStore = document.getElementById("AddressStore");
const empStatus = document.getElementById("Status");

// ═══════════════════════════════════════════════════════
// Modal
// ═══════════════════════════════════════════════════════
function openAddModal() {
    editingStore = false;
    resetModal();
    openModal("StoreModal");
}

function openEditModal(StoreId) {
    const data = StoreList.find(d => d.StoreId === StoreId);
    if (!data) return;

    editingStore = true;

    empStoreId.value = data.StoreId || 0;
    empStoreCaption.value = data.StoreCaption || '';
    empPersonelId.value = data.PersonelId || '';
    empCodeStore.value = data.CodeStore || '';
    empAddressStore.value = data.AddressStore || '';
    empStatus.checked = Boolean(data.Status);

    // ─── تنظیم input date با میلادی ───
    if (empStoreRecord) {
        let g = '';
        if (data.StoreRecord) {
            g = String(data.StoreRecord).split('T')[0];
        } else if (data.StoreRecordFa) {
            g = toGregorian(data.StoreRecordFa);
        }
        empStoreRecord.value = g;
        empStoreRecord.dispatchEvent(new Event('change', { bubbles: true }));
    }

    modalTitle.innerText = "ویرایش رکورد";
    openModal("StoreModal");
}

function CanselSaveModal() {
    closeModal("StoreModal");
    resetModal();
}

function resetModal() {
    empStoreId.value = 0;
    empStoreCaption.value = '';
    empPersonelId.value = '';
    empCodeStore.value = '';
    empAddressStore.value = '';
    empStatus.checked = false;

    if (empStoreRecord) {
        empStoreRecord.value = '';
        empStoreRecord.dispatchEvent(new Event('change', { bubbles: true }));
    }

    modalTitle.innerText = "افزودن رکورد جدید";
}

function openModal(Id) {
    const el = document.getElementById(Id);
    if (el) el.classList.add("active");
}

function closeModal(Id) {
    const el = document.getElementById(Id);
    if (el) el.classList.remove("active");
}

// ═══════════════════════════════════════════════════════
// ذخیره
// ═══════════════════════════════════════════════════════
function SaveNewModel() {
    const StoreId = parseInt(empStoreId.value) || 0;
    const StoreCaption = empStoreCaption.value.trim();
    const PersonelId = parseInt(empPersonelId.value) || 0;
    const CodeStore = empCodeStore.value.trim();
    const AddressStore = empAddressStore.value.trim();
    const Status = empStatus.checked;

    // ─── تاریخ: input date → شمسی ───
    const dateGregorian = empStoreRecord ? empStoreRecord.value.trim() : '';
    const StoreRecordFa = toJalali(dateGregorian);

    // ─── اعتبارسنجی ───
    if (!StoreCaption) { alert("لطفاً عنوان فروشگاه را وارد کنید"); return; }
    if (!PersonelId) { alert("لطفاً صاحب فروشگاه را انتخاب کنید"); return; }
    if (!dateGregorian) { alert("لطفاً تاریخ تاسیس را انتخاب کنید"); return; }
    if (!AddressStore) { alert("لطفاً آدرس فروشگاه را وارد کنید"); return; }

    const store = {
        StoreId: StoreId,
        StoreCaption: StoreCaption,
        PersonelId: PersonelId,
        CodeStore: CodeStore,
        StoreRecordFa: StoreRecordFa,
        AddressStore: AddressStore,
        Status: Status
    };

    SendData(store, StoreId === 0);
    closeModal("StoreModal");
}

// ═══════════════════════════════════════════════════════
// SendData — تفکیک Add/Update
// ═══════════════════════════════════════════════════════
function SendData(store, isAdd) {
    const url = isAdd ? '/Stores/AddData' : '/Stores/UpdateData';

    showLoading();
    Http.postSecure(url, store)
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

// ═══════════════════════════════════════════════════════
// رویدادها
// ═══════════════════════════════════════════════════════
document.getElementById("searchStore")?.addEventListener("input", () => renderTable());
document.getElementById("statusFilter")?.addEventListener("change", () => renderTable());

if (modal) {
    modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal("StoreModal");
    });
}

// ═══════════════════════════════════════════════════════
// شروع
// ═══════════════════════════════════════════════════════
loadFromStorage();