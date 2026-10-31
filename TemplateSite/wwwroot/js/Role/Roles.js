/* ═══════════════════════════════════════════════════════
   Roles.js — مدیریت نقش سیستم
   ═══════════════════════════════════════════════════════ */

let RoleList = [];
let LevelAccessesList = [];
let editingRole = false;

const Http = window.HttpHelper;
const UI = window.UICore;

function handleHttpError(err) {
    console.error('[Role] HTTP error:', err);
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
    return Http.postSecure('/Roles/GetLevelAccesses')
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
    Http.postSecure('/Roles/GetAllData')
        .then(res => {
            if (res.isSuccess) {
                RoleList = JSON.parse(res.data);
                localStorage.setItem("Roles", JSON.stringify(RoleList));
                renderTable();
            } else {
                alert(res.errorTitle);
            }
        })
        .catch(handleHttpError)
        .finally(hideLoading);
}

function loadFromStorage() {
    const saved = localStorage.getItem("Roles");
    if (saved) {
        try {
            RoleList = JSON.parse(saved);
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
    const total = RoleList.length;
    const active = RoleList.filter(d => d.Status).length;
    const inactive = RoleList.filter(d => !d.Status).length;

    const el = document.getElementById("statsCards");
    if (!el) return;

    el.innerHTML = `
        <div class="stat-card"><div class="stat-info"><div class="number">${total}</div><div class="label">کل نقش‌ها</div></div><div class="stat-icon"><i class="fas fa-user-tag"></i></div></div>
        <div class="stat-card"><div class="stat-info"><div class="number">${active}</div><div class="label">فعال</div></div><div class="stat-icon"><i class="fas fa-check-circle"></i></div></div>
        <div class="stat-card"><div class="stat-info"><div class="number">${inactive}</div><div class="label">غیرفعال</div></div><div class="stat-icon"><i class="fas fa-ban"></i></div></div>
    `;
}

// ═══════════════════════════════════════════════════════
// جدول
// ═══════════════════════════════════════════════════════
function renderTable() {
    const searchEl = document.getElementById("searchRole");
    const statusEl = document.getElementById("statusFilter");
    const tbody = document.getElementById("RoleTableBody");
    if (!tbody) return;

    const searchTerm = (searchEl?.value || "").toLowerCase().trim();
    const statusFilter = statusEl?.value || "all";

    let filtered = [...RoleList];

    if (searchTerm) {
        filtered = filtered.filter(p =>
            (p.RoleCaption || "").toLowerCase().includes(searchTerm)
        );
    }

    if (statusFilter !== "all") {
        filtered = filtered.filter(p => p.Status.toString() === statusFilter);
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="5">هیچ رکورد یافت نشد</td></tr>`;
        renderStats();
        return;
    }

    tbody.innerHTML = filtered.map(data => {
        const statusText = data.Status === true ? "فعال" : "غیرفعال";
        const levelAccessIds = (data.LevelAccessIds || "").split(',').filter(x => x);
        const count = levelAccessIds.length;

        return `<tr>
            <td><strong>${data.RoleId}</strong></td>
            <td>${escapeHtml(data.RoleCaption || '—')}</td>
            <td><span class="badge">${count} دسترسی</span></td>
            <td>${statusText}</td>
            <td class="action-buttons">
                <button class="action-btn edit-btn" data-id="${data.RoleId}" title="ویرایش"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete-btn" data-id="${data.RoleId}" title="حذف"><i class="fas fa-trash-alt"></i></button>
            </td>
        </tr>`;
    }).join('');

    document.querySelectorAll('.edit-btn').forEach(btn =>
        btn.addEventListener('click', () => openEditModal(parseInt(btn.dataset.id))));

    document.querySelectorAll('.delete-btn').forEach(btn =>
        btn.addEventListener('click', () => {
            if (confirm("حذف رکورد؟")) deleteRole(parseInt(btn.dataset.id));
        }));

    renderStats();
}

// ═══════════════════════════════════════════════════════
// حذف
// ═══════════════════════════════════════════════════════
function deleteRole(id) {
    showLoading();
    Http.postSecure('/Roles/DeleteData', { 'id': id })
        .then(res => {
            if (res.isSuccess) {
                RoleList = RoleList.filter(d => d.RoleId !== id);
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
const modal = document.getElementById("RoleModal");
const modalTitle = document.getElementById("modalTitle");
const empRoleId = document.getElementById("RoleId");
const empRoleCaption = document.getElementById("RoleCaption");
const empStatus = document.getElementById("Status");

function openAddModal() {
    editingRole = false;
    resetModal();
    renderLevelAccessCheckboxes([]);
    openModal("RoleModal");
}

function openEditModal(id) {
    const data = RoleList.find(d => d.RoleId === id);
    if (!data) return;

    editingRole = true;

    empRoleId.value = data.RoleId || 0;
    empRoleCaption.value = data.RoleCaption || '';
    empStatus.checked = Boolean(data.Status);

    const levelAccessIds = (data.LevelAccessIds || "").split(',').filter(x => x).map(x => parseInt(x));
    renderLevelAccessCheckboxes(levelAccessIds);

    modalTitle.innerText = "ویرایش نقش";
    openModal("RoleModal");
}

function CanselSaveModal() {
    closeModal("RoleModal");
    resetModal();
}

function resetModal() {
    empRoleId.value = 0;
    empRoleCaption.value = '';
    empStatus.checked = false;
    modalTitle.innerText = "افزودن نقش جدید";
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
    const id = parseInt(empRoleId.value) || 0;
    const caption = empRoleCaption.value.trim();
    const status = empStatus.checked;
    const levelAccessIds = getSelectedLevelAccessIds();

    if (!caption) { alert("لطفاً عنوان نقش را وارد کنید"); return; }

    const data = {
        RoleId: id,
        RoleCaption: caption,
        Status: status,
        levelAccessIds: levelAccessIds
    };

    const url = id === 0 ? '/Roles/AddData' : '/Roles/UpdateData';

    showLoading();
    Http.postSecure(url, data)
        .then(res => {
            if (res.isSuccess) {
                saveToStorage();
                alert(res.data);
                closeModal("RoleModal");
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
document.getElementById("searchRole")?.addEventListener("input", () => renderTable());
document.getElementById("statusFilter")?.addEventListener("change", () => renderTable());

if (modal) {
    modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal("RoleModal");
    });
}

// ═══════════════════════════════════════════════════════
// شروع
// ═══════════════════════════════════════════════════════
loadFromStorage();
GetLevelAccesses();