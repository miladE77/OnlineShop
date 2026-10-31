/* ═══════════════════════════════════════════════════════
   LevelAccesss.js — مدیریت دسترسی سیستم
   ═══════════════════════════════════════════════════════ */

let LevelAccessList = [];
let PagesList = [];
let editingLevelAccess = false;

const Http = window.HttpHelper;
const UI = window.UICore;

// ═══════════════════════════════════════════════════════
// مدیریت CodeAccess (چک‌باکس‌ها + رزرو)
// ═══════════════════════════════════════════════════════
function getSelectedCodeAccess() {
    const checks = document.querySelectorAll('.code-access-checkbox:checked');
    const parts = Array.from(checks).map(c => c.value);

    const reserveCheck = document.getElementById('codeAccessReserve');
    const reserveInput = document.getElementById('CodeAccessReserveInput');

    if (reserveCheck && reserveCheck.checked && reserveInput) {
        const custom = reserveInput.value.trim().toUpperCase().replace(/[^A-Z]/g, '');
        if (custom) parts.push(custom);
    }

    return parts.join('');
}

function setCodeAccess(value) {
    const val = (value || '').toUpperCase();

    // ═══ چک‌باکس‌های استاندارد ═══
    const standardCodes = ['V', 'A', 'U', 'D', 'F'];
    const checkboxes = document.querySelectorAll('.code-access-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = val.includes(cb.value);
    });

    // ═══ رزرو: اگر کاراکترهای دیگری بود ═══
    const reserveCheck = document.getElementById('codeAccessReserve');
    const reserveInput = document.getElementById('CodeAccessReserveInput');
    const wrapper = document.getElementById('reserveInputWrapper');

    const remaining = val.split('').filter(c => !standardCodes.includes(c)).join('');

    if (remaining) {
        if (reserveCheck) reserveCheck.checked = true;
        if (reserveInput) reserveInput.value = remaining;
        if (wrapper) wrapper.style.display = 'block';
    } else {
        if (reserveCheck) reserveCheck.checked = false;
        if (reserveInput) reserveInput.value = '';
        if (wrapper) wrapper.style.display = 'none';
    }

    updateCodeAccessPreview();
}

function updateCodeAccessPreview() {
    const preview = document.getElementById('codeAccessPreview');
    if (!preview) return;

    const val = getSelectedCodeAccess();
    preview.textContent = val || '—';
}

// ═══════════════════════════════════════════════════════
// رویدادهای CodeAccess
// ═══════════════════════════════════════════════════════
document.querySelectorAll('.code-access-checkbox').forEach(cb => {
    cb.addEventListener('change', updateCodeAccessPreview);
});

const reserveCheckEl = document.getElementById('codeAccessReserve');
const reserveWrapperEl = document.getElementById('reserveInputWrapper');
const reserveInputEl = document.getElementById('CodeAccessReserveInput');

if (reserveCheckEl) {
    reserveCheckEl.addEventListener('change', function () {
        if (reserveWrapperEl) {
            reserveWrapperEl.style.display = this.checked ? 'block' : 'none';
        }
        if (!this.checked && reserveInputEl) {
            reserveInputEl.value = '';
        }
        updateCodeAccessPreview();
    });
}

if (reserveInputEl) {
    reserveInputEl.addEventListener('input', function () {
        // فقط A-Z
        this.value = this.value.toUpperCase().replace(/[^A-Z]/g, '');
        updateCodeAccessPreview();
    });
}

function handleHttpError(err) {
    console.error('[LevelAccess] HTTP error:', err);
    if (err.message === 'AUTH_REQUIRED') return;
    if (err.message === 'CSRF_OR_BAD_REQUEST') {
        alert('نشست شما منقضی شده. صفحه را رفرش کنید.');
        return;
    }
    alert('خطا در ارتباط با سرور');
}

function showLoading() { if (UI && UI.showLoading) UI.showLoading(); }
function hideLoading() { if (UI && UI.hideLoading) UI.hideLoading(); }

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
// GetPages — برای پر کردن چک‌باکس‌ها
// ═══════════════════════════════════════════════════════
function GetPages() {
    return Http.postSecure('/LevelAccesss/GetPages')
        .then(res => {
            if (res.isSuccess) {
                PagesList = JSON.parse(res.data);
                renderPagesCheckboxes();
            }
        })
        .catch(handleHttpError);
}

function renderPagesCheckboxes(selectedIds = []) {
    const container = document.getElementById('pagesList');
    if (!container) return;

    if (!PagesList || PagesList.length === 0) {
        container.innerHTML = '<div style="text-align:center; color:var(--text-secondary); padding:10px;">هیچ صفحه‌ای ثبت نشده است</div>';
        return;
    }

    container.innerHTML = PagesList.map(p => {
        const checked = selectedIds.includes(p.PageId) ? 'checked' : '';
        return `
            <label style="display:flex; align-items:center; padding:6px; cursor:pointer; border-bottom:1px solid var(--border-light);">
                <input type="checkbox" class="page-checkbox" value="${p.PageId}" ${checked} style="margin-left:8px; width:18px; height:18px;">
                <span>${escapeHtml(p.PageCaption)}</span>
            </label>
        `;
    }).join('');
}

function getSelectedPageIds() {
    const checkboxes = document.querySelectorAll('.page-checkbox:checked');
    return Array.from(checkboxes).map(cb => cb.value).join(',');
}

// ═══════════════════════════════════════════════════════
// GetAllData
// ═══════════════════════════════════════════════════════
function saveToStorage() {
    showLoading();
    Http.postSecure('/LevelAccesss/GetAllData')
        .then(res => {
            if (res.isSuccess) {
                LevelAccessList = JSON.parse(res.data);
                localStorage.setItem("LevelAccesss", JSON.stringify(LevelAccessList));
                renderTable();
            } else {
                alert(res.errorTitle);
            }
        })
        .catch(handleHttpError)
        .finally(hideLoading);
}

function loadFromStorage() {
    const saved = localStorage.getItem("LevelAccesss");
    if (saved) {
        try {
            LevelAccessList = JSON.parse(saved);
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
    const total = LevelAccessList.length;
    const active = LevelAccessList.filter(d => d.Status).length;
    const inactive = LevelAccessList.filter(d => !d.Status).length;

    const el = document.getElementById("statsCards");
    if (!el) return;

    el.innerHTML = `
        <div class="stat-card"><div class="stat-info"><div class="number">${total}</div><div class="label">کل دسترسی‌ها</div></div><div class="stat-icon"><i class="fas fa-user-shield"></i></div></div>
        <div class="stat-card"><div class="stat-info"><div class="number">${active}</div><div class="label">فعال</div></div><div class="stat-icon"><i class="fas fa-check-circle"></i></div></div>
        <div class="stat-card"><div class="stat-info"><div class="number">${inactive}</div><div class="label">غیرفعال</div></div><div class="stat-icon"><i class="fas fa-ban"></i></div></div>
    `;
}

// ═══════════════════════════════════════════════════════
// جدول
// ═══════════════════════════════════════════════════════
function renderTable() {
    const searchEl = document.getElementById("searchLevelAccess");
    const statusEl = document.getElementById("statusFilter");
    const tbody = document.getElementById("LevelAccessTableBody");
    if (!tbody) return;

    const searchTerm = (searchEl?.value || "").toLowerCase().trim();
    const statusFilter = statusEl?.value || "all";

    let filtered = [...LevelAccessList];

    if (searchTerm) {
        filtered = filtered.filter(p =>
            (p.LevelAccessCaption || "").toLowerCase().includes(searchTerm) ||
            (p.CodeAccess || "").toLowerCase().includes(searchTerm)
        );
    }

    if (statusFilter !== "all") {
        filtered = filtered.filter(p => p.Status.toString() === statusFilter);
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="6">هیچ رکورد یافت نشد</td></tr>`;
        renderStats();
        return;
    }

    tbody.innerHTML = filtered.map(data => {
        const statusText = data.Status === true ? "فعال" : "غیرفعال";
        const pageIds = (data.PageIds || "").split(',').filter(x => x);
        const pageCount = pageIds.length;

        return `<tr>
            <td><strong>${data.LevelAccessId}</strong></td>
            <td>${escapeHtml(data.LevelAccessCaption || '—')}</td>
            <td><code>${escapeHtml(data.CodeAccess || '—')}</code></td>
            <td><span class="badge">${pageCount} صفحه</span></td>
            <td>${statusText}</td>
            <td class="action-buttons">
                <button class="action-btn edit-btn" data-id="${data.LevelAccessId}" title="ویرایش"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete-btn" data-id="${data.LevelAccessId}" title="حذف"><i class="fas fa-trash-alt"></i></button>
            </td>
        </tr>`;
    }).join('');

    document.querySelectorAll('.edit-btn').forEach(btn =>
        btn.addEventListener('click', () => openEditModal(parseInt(btn.dataset.id))));

    document.querySelectorAll('.delete-btn').forEach(btn =>
        btn.addEventListener('click', () => {
            if (confirm("حذف رکورد؟")) deleteLevelAccess(parseInt(btn.dataset.id));
        }));

    renderStats();
}

// ═══════════════════════════════════════════════════════
// حذف
// ═══════════════════════════════════════════════════════
function deleteLevelAccess(id) {
    showLoading();
    Http.postSecure('/LevelAccesss/DeleteData', { 'id': id })
        .then(res => {
            if (res.isSuccess) {
                LevelAccessList = LevelAccessList.filter(d => d.LevelAccessId !== id);
                saveToStorage();
                renderTable();
                alert(res.data);
            } else {
                alert(res.errorTitle);
            }
        })
        .catch(handleHttpError)
        .finally(hideLoading);
}

// ═══════════════════════════════════════════════════════
// Modal
// ═══════════════════════════════════════════════════════
const modal = document.getElementById("LevelAccessModal");
const modalTitle = document.getElementById("modalTitle");
const empLevelAccessId = document.getElementById("LevelAccessId");
const empLevelAccessCaption = document.getElementById("LevelAccessCaption");
const empCodeAccess = document.getElementById("CodeAccess");
const empStatus = document.getElementById("Status");

function openAddModal() {
    editingLevelAccess = false;
    resetModal();
    renderPagesCheckboxes([]);
    openModal("LevelAccessModal");
}

function openEditModal(id) {
    const data = LevelAccessList.find(d => d.LevelAccessId === id);
    if (!data) return;

    editingLevelAccess = true;

    empLevelAccessId.value = data.LevelAccessId || 0;
    empLevelAccessCaption.value = data.LevelAccessCaption || '';

    // ═══ CodeAccess — ست کردن چک‌باکس‌ها و رزرو ═══
    setCodeAccess(data.CodeAccess || '');

    empStatus.checked = Boolean(data.Status);

    const pageIds = (data.PageIds || "").split(',').filter(x => x).map(x => parseInt(x));
    renderPagesCheckboxes(pageIds);

    modalTitle.innerText = "ویرایش دسترسی";
    openModal("LevelAccessModal");
}

function CanselSaveModal() {
    closeModal("LevelAccessModal");
    resetModal();
}

function resetModal() {
    empLevelAccessId.value = 0;
    empLevelAccessCaption.value = '';

    // ═══ CodeAccess — خالی کردن ═══
    document.querySelectorAll('.code-access-checkbox').forEach(cb => cb.checked = false);
    const reserveCheck = document.getElementById('codeAccessReserve');
    const reserveInput = document.getElementById('CodeAccessReserveInput');
    const wrapper = document.getElementById('reserveInputWrapper');
    if (reserveCheck) reserveCheck.checked = false;
    if (reserveInput) reserveInput.value = '';
    if (wrapper) wrapper.style.display = 'none';
    updateCodeAccessPreview();

    empStatus.checked = false;
    modalTitle.innerText = "افزودن دسترسی جدید";
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
    const id = parseInt(empLevelAccessId.value) || 0;
    const caption = empLevelAccessCaption.value.trim();
    const codeAccess = getSelectedCodeAccess();  
    const status = empStatus.checked;
    const pageIds = getSelectedPageIds();

    if (!caption) { alert("لطفاً عنوان دسترسی را وارد کنید"); return; }
    if (!codeAccess) { alert("لطفاً حداقل یک نوع عملیات انتخاب کنید"); return; }

    const data = {
        LevelAccessId: id,
        LevelAccessCaption: caption,
        CodeAccess: codeAccess,
        Status: status,
        pageIds: pageIds
    };

    const url = id === 0 ? '/LevelAccesss/AddData' : '/LevelAccesss/UpdateData';

    showLoading();
    Http.postSecure(url, data)
        .then(res => {
            if (res.isSuccess) {
                saveToStorage();
                alert(res.data);
                closeModal("LevelAccessModal");
            } else {
                alert(res.errorTitle);
            }
        })
        .catch(handleHttpError)
        .finally(hideLoading);
}
// ═══════════════════════════════════════════════════════
// رویدادها
// ═══════════════════════════════════════════════════════
document.getElementById("searchLevelAccess")?.addEventListener("input", () => renderTable());
document.getElementById("statusFilter")?.addEventListener("change", () => renderTable());

if (modal) {
    modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal("LevelAccessModal");
    });
}

// ═══════════════════════════════════════════════════════
// شروع
// ═══════════════════════════════════════════════════════
loadFromStorage();
GetPages();