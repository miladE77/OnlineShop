/* ═══════════════════════════════════════════════════════
   Tockens.js — مدیریت توکن دسترسی
   ═══════════════════════════════════════════════════════ */

let TockenList = [];
let LevelAccessesList = [];
let editingTocken = false;

const Http = window.HttpHelper;
const UI = window.UICore;

function handleHttpError(err) {
    console.error('[Tocken] HTTP error:', err);
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
// GetLevelAccesses — برای پر کردن چک‌باکس‌ها
// ═══════════════════════════════════════════════════════
function GetLevelAccesses() {
    return Http.postSecure('/Tockens/GetLevelAccesses')
        .then(res => {
            if (res.isSuccess) {
                LevelAccessesList = JSON.parse(res.data);
                renderLevelAccessCheckboxes();
            }
        })
        .catch(handleHttpError);
}

function renderLevelAccessCheckboxes(selectedIds = []) {
    const container = document.getElementById('levelAccessList');
    if (!container) return;

    if (!LevelAccessesList || LevelAccessesList.length === 0) {
        container.innerHTML = '<div style="text-align:center; color:var(--text-secondary); padding:10px;">هیچ دسترسی‌ای ثبت نشده است</div>';
        return;
    }

    container.innerHTML = LevelAccessesList.map(l => {
        const checked = selectedIds.includes(l.LevelAccessId) ? 'checked' : '';
        return `
            <label style="display:flex; align-items:center; padding:6px; cursor:pointer; border-bottom:1px solid var(--border-light);">
                <input type="checkbox" class="levelaccess-checkbox" value="${l.LevelAccessId}" ${checked} style="margin-left:8px; width:18px; height:18px;">
                <span>${escapeHtml(l.LevelAccessCaption)} <code style="font-size:0.7rem; color:var(--primary);">${escapeHtml(l.CodeAccess || '')}</code></span>
            </label>
        `;
    }).join('');
}

function getSelectedLevelAccessIds() {
    const checkboxes = document.querySelectorAll('.levelaccess-checkbox:checked');
    return Array.from(checkboxes).map(cb => cb.value).join(',');
}

// ═══════════════════════════════════════════════════════
// GetAllData
// ═══════════════════════════════════════════════════════
function saveToStorage() {
    showLoading();
    Http.postSecure('/Tockens/GetAllData')
        .then(res => {
            if (res.isSuccess) {
                TockenList = JSON.parse(res.data);
                localStorage.setItem("Tockens", JSON.stringify(TockenList));
                renderTable();
            } else {
                alert(res.errorTitle);
            }
        })
        .catch(handleHttpError)
        .finally(hideLoading);
}

function loadFromStorage() {
    const saved = localStorage.getItem("Tockens");
    if (saved) {
        try {
            TockenList = JSON.parse(saved);
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
    const total = TockenList.length;
    const active = TockenList.filter(d => d.Status).length;
    const inactive = TockenList.filter(d => !d.Status).length;

    const el = document.getElementById("statsCards");
    if (!el) return;

    el.innerHTML = `
        <div class="stat-card"><div class="stat-info"><div class="number">${total}</div><div class="label">کل توکن‌ها</div></div><div class="stat-icon"><i class="fas fa-key"></i></div></div>
        <div class="stat-card"><div class="stat-info"><div class="number">${active}</div><div class="label">فعال</div></div><div class="stat-icon"><i class="fas fa-check-circle"></i></div></div>
        <div class="stat-card"><div class="stat-info"><div class="number">${inactive}</div><div class="label">غیرفعال</div></div><div class="stat-icon"><i class="fas fa-ban"></i></div></div>
    `;
}

// ═══════════════════════════════════════════════════════
// جدول
// ═══════════════════════════════════════════════════════
function renderTable() {
    const searchEl = document.getElementById("searchTocken");
    const statusEl = document.getElementById("statusFilter");
    const tbody = document.getElementById("TockenTableBody");
    if (!tbody) return;

    const searchTerm = (searchEl?.value || "").toLowerCase().trim();
    const statusFilter = statusEl?.value || "all";

    let filtered = [...TockenList];

    if (searchTerm) {
        filtered = filtered.filter(p =>
            (p.TockenCaption || "").toLowerCase().includes(searchTerm) ||
            (p.TockenDetail || "").toLowerCase().includes(searchTerm)
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
        const levelAccessIds = (data.LevelAccessIds || "").split(',').filter(x => x);
        const count = levelAccessIds.length;

        return `<tr>
            <td><strong>${data.TockenId}</strong></td>
            <td>${escapeHtml(data.TockenCaption || '—')}</td>
            <td>${escapeHtml(data.TockenDetail || '—')}</td>
            <td><span class="badge">${count} دسترسی</span></td>
            <td>${statusText}</td>
            <td class="action-buttons">
                <button class="action-btn edit-btn" data-id="${data.TockenId}" title="ویرایش"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete-btn" data-id="${data.TockenId}" title="حذف"><i class="fas fa-trash-alt"></i></button>
            </td>
        </tr>`;
    }).join('');

    document.querySelectorAll('.edit-btn').forEach(btn =>
        btn.addEventListener('click', () => openEditModal(parseInt(btn.dataset.id))));

    document.querySelectorAll('.delete-btn').forEach(btn =>
        btn.addEventListener('click', () => {
            if (confirm("حذف رکورد؟")) deleteTocken(parseInt(btn.dataset.id));
        }));

    renderStats();
}

// ═══════════════════════════════════════════════════════
// حذف
// ═══════════════════════════════════════════════════════
function deleteTocken(id) {
    showLoading();
    Http.postSecure('/Tockens/DeleteData', { 'id': id })
        .then(res => {
            if (res.isSuccess) {
                TockenList = TockenList.filter(d => d.TockenId !== id);
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
const modal = document.getElementById("TockenModal");
const modalTitle = document.getElementById("modalTitle");
const empTockenId = document.getElementById("TockenId");
const empTockenCaption = document.getElementById("TockenCaption");
const empTockenDetail = document.getElementById("TockenDetail");
const empStatus = document.getElementById("Status");

function openAddModal() {
    editingTocken = false;
    resetModal();
    renderLevelAccessCheckboxes([]);
    openModal("TockenModal");
}

function openEditModal(id) {
    const data = TockenList.find(d => d.TockenId === id);
    if (!data) return;

    editingTocken = true;

    empTockenId.value = data.TockenId || 0;
    empTockenCaption.value = data.TockenCaption || '';
    empTockenDetail.value = data.TockenDetail || '';
    empStatus.checked = Boolean(data.Status);

    const levelAccessIds = (data.LevelAccessIds || "").split(',').filter(x => x).map(x => parseInt(x));
    renderLevelAccessCheckboxes(levelAccessIds);

    modalTitle.innerText = "ویرایش توکن";
    openModal("TockenModal");
}

function CanselSaveModal() {
    closeModal("TockenModal");
    resetModal();
}

function resetModal() {
    empTockenId.value = 0;
    empTockenCaption.value = '';
    empTockenDetail.value = '';
    empStatus.checked = false;
    modalTitle.innerText = "افزودن توکن جدید";
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
    const id = parseInt(empTockenId.value) || 0;
    const caption = empTockenCaption.value.trim();
    const detail = empTockenDetail.value.trim();
    const status = empStatus.checked;
    const levelAccessIds = getSelectedLevelAccessIds();

    if (!caption) { alert("لطفاً عنوان توکن را وارد کنید"); return; }

    const data = {
        TockenId: id,
        TockenCaption: caption,
        TockenDetail: detail,
        Status: status,
        levelAccessIds: levelAccessIds
    };

    const url = id === 0 ? '/Tockens/AddData' : '/Tockens/UpdateData';

    showLoading();
    Http.postSecure(url, data)
        .then(res => {
            if (res.isSuccess) {
                saveToStorage();
                alert(res.data);
                closeModal("TockenModal");
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
document.getElementById("searchTocken")?.addEventListener("input", () => renderTable());
document.getElementById("statusFilter")?.addEventListener("change", () => renderTable());

if (modal) {
    modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal("TockenModal");
    });
}

// ═══════════════════════════════════════════════════════
// شروع
// ═══════════════════════════════════════════════════════
loadFromStorage();
GetLevelAccesses();