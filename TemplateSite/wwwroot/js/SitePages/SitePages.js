/* ═══════════════════════════════════════════════════════
   SitePages.js — مدیریت صفحات HTML
   ═══════════════════════════════════════════════════════ */

let SitePageList = [];
let editingSitePage = false;
let currentSitePageId = 0;   // ⭐ شناسه جاری (0 = جدید)

const Http = window.HttpHelper;
const UI = window.UICore;

function handleHttpError(err) {
    console.error('[SitePage] HTTP error:', err);
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
// GetAllData
// ═══════════════════════════════════════════════════════
function saveToStorage() {
    showLoading();
    Http.postSecure('/SitePages/GetAllData')
        .then(res => {
            if (res.isSuccess) {
                SitePageList = JSON.parse(res.data);
                localStorage.setItem("SitePages", JSON.stringify(SitePageList));
                renderTable();
            } else {
                alert(res.errorTitle);
            }
        })
        .catch(handleHttpError)
        .finally(hideLoading);
}

function loadFromStorage() {
    const saved = localStorage.getItem("SitePages");
    if (saved) {
        try {
            SitePageList = JSON.parse(saved);
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
    const total = SitePageList.length;
    const active = SitePageList.filter(d => d.Status).length;
    const inactive = SitePageList.filter(d => !d.Status).length;

    const el = document.getElementById("statsCards");
    if (!el) return;

    el.innerHTML = `
        <div class="stat-card"><div class="stat-info"><div class="number">${total}</div><div class="label">کل صفحات</div></div><div class="stat-icon"><i class="fas fa-file-code"></i></div></div>
        <div class="stat-card"><div class="stat-info"><div class="number">${active}</div><div class="label">فعال</div></div><div class="stat-icon"><i class="fas fa-check-circle"></i></div></div>
        <div class="stat-card"><div class="stat-info"><div class="number">${inactive}</div><div class="label">غیرفعال</div></div><div class="stat-icon"><i class="fas fa-ban"></i></div></div>
    `;
}

// ═══════════════════════════════════════════════════════
// جدول
// ═══════════════════════════════════════════════════════
function renderTable() {
    const searchEl = document.getElementById("searchSitePage");
    const statusEl = document.getElementById("statusFilter");
    const tbody = document.getElementById("SitePageTableBody");
    if (!tbody) return;

    const searchTerm = (searchEl?.value || "").toLowerCase().trim();
    const statusFilter = statusEl?.value || "all";

    let filtered = [...SitePageList];

    if (searchTerm) {
        filtered = filtered.filter(p =>
            (p.SitePageCaption || "").toLowerCase().includes(searchTerm) ||
            (p.CodePage || "").toLowerCase().includes(searchTerm)
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
        return `<tr>
            <td><strong>${data.SitePageId}</strong></td>
            <td>${escapeHtml(data.SitePageCaption || '—')}</td>
            <td><code>${escapeHtml(data.CodePage || '—')}</code></td>
            <td>${statusText}</td>
            <td class="action-buttons">
                <button class="action-btn edit-btn" data-id="${data.SitePageId}" title="ویرایش"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete-btn" data-id="${data.SitePageId}" title="حذف"><i class="fas fa-trash-alt"></i></button>
            </td>
        </tr>`;
    }).join('');

    document.querySelectorAll('.edit-btn').forEach(btn =>
        btn.addEventListener('click', () => openEditModal(parseInt(btn.dataset.id))));

    document.querySelectorAll('.delete-btn').forEach(btn =>
        btn.addEventListener('click', () => {
            if (confirm("حذف رکورد؟")) deleteSitePage(parseInt(btn.dataset.id));
        }));

    renderStats();
}

// ═══════════════════════════════════════════════════════
// حذف
// ═══════════════════════════════════════════════════════
function deleteSitePage(id) {
    showLoading();
    Http.postSecure('/SitePages/DeleteData', { 'id': id })
        .then(res => {
            if (res.isSuccess) {
                SitePageList = SitePageList.filter(d => d.SitePageId !== id);
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
// المان‌ها
// ═══════════════════════════════════════════════════════
const modal = document.getElementById("SitePageModal");
const modalTitle = document.getElementById("modalTitle");
const displaySitePageId = document.getElementById("displaySitePageId");
const displayCodePage = document.getElementById("displayCodePage");
const empSitePageCaption = document.getElementById("SitePageCaption");
const empSitePageHtml = document.getElementById("SitePageHtml");
const empStatus = document.getElementById("Status");

// ═══════════════════════════════════════════════════════
// Modal
// ═══════════════════════════════════════════════════════
function openAddModal() {
    editingSitePage = false;
    currentSitePageId = 0;
    resetModal();
    openModal("SitePageModal");
}

function openEditModal(id) {
    const data = SitePageList.find(d => d.SitePageId === id);
    if (!data) return;

    editingSitePage = true;
    currentSitePageId = data.SitePageId;

    // ═══ نمایش متنی شناسه ═══
    if (displaySitePageId) displaySitePageId.textContent = data.SitePageId;

    // ═══ نمایش متنی کد ═══
    if (displayCodePage) displayCodePage.textContent = data.CodePage || '—';

    // ═══ فیلدها ═══
    empSitePageCaption.value = data.SitePageCaption || '';
    empSitePageHtml.value = data.SitePageHtml || '';
    empStatus.checked = Boolean(data.Status);

    modalTitle.innerText = "ویرایش صفحه";
    switchHtmlTab('code');
    openModal("SitePageModal");
}

function CanselSaveModal() {
    closeModal("SitePageModal");
    resetModal();
}

function resetModal() {
    currentSitePageId = 0;

    if (displaySitePageId) displaySitePageId.textContent = 'جدید';
    if (displayCodePage) displayCodePage.textContent = 'خودکار تولید می‌شود';

    empSitePageCaption.value = '';
    empSitePageHtml.value = '';
    empStatus.checked = false;

    modalTitle.innerText = "افزودن صفحه جدید";
    switchHtmlTab('code');
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
    const caption = empSitePageCaption.value.trim();
    const html = empSitePageHtml.value.trim();
    const status = empStatus.checked;

    if (!caption) { alert("لطفاً عنوان صفحه را وارد کنید"); return; }
    if (!html) { alert("لطفاً کد HTML را وارد کنید"); return; }

    const data = {
        SitePageId: currentSitePageId,
        SitePageCaption: caption,
        SitePageHtml: html,
        CodePage: '',      // ⭐ خالی — سرور خودش تولید می‌کند
        Status: status
    };

    // ═══ ⭐ تفکیک Add / Update ═══
    const url = currentSitePageId === 0
        ? '/SitePages/AddData'
        : '/SitePages/UpdateData';

    showLoading();
    Http.postSecure(url, data)
        .then(res => {
            if (res.isSuccess) {
                saveToStorage();
                alert(res.data);
                closeModal("SitePageModal");
            } else {
                alert(res.errorTitle);
            }
        })
        .catch(handleHttpError)
        .finally(hideLoading);
}

// ═══════════════════════════════════════════════════════
// تب‌های ادیتور HTML
// ═══════════════════════════════════════════════════════
function switchHtmlTab(tabName) {
    if (tabName === 'fullscreen') {
        openFullScreenPreview();
        return;
    }

    document.querySelectorAll('.html-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === tabName);
    });

    document.getElementById('htmlCodePanel').classList.toggle('active', tabName === 'code');
    document.getElementById('htmlPreviewPanel').classList.toggle('active', tabName === 'preview');

    if (tabName === 'preview') {
        renderHtmlPreview();
    }
}

function renderHtmlPreview() {
    const iframe = document.getElementById('SitePageHtmlPreview');
    const htmlContent = empSitePageHtml.value || '<p style="color:#999;text-align:center;padding:20px;">هیچ محتوایی برای نمایش وجود ندارد</p>';

    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(`
        <!DOCTYPE html>
        <html lang="fa" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Tahoma, sans-serif; padding: 15px; margin: 0; }
                img { max-width: 100%; }
            </style>
        </head>
        <body>${htmlContent}</body>
        </html>
    `);
    doc.close();
}

function openFullScreenPreview() {
    const htmlContent = empSitePageHtml.value.trim();

    if (!htmlContent) {
        alert('هیچ محتوایی برای نمایش وجود ندارد. ابتدا کد HTML را وارد کنید.');
        return;
    }

    const newWindow = window.open('', '_blank');

    if (!newWindow) {
        alert('مرورگر شما اجازه باز کردن پنجره جدید را نداد. لطفاً پاپ‌آپ را فعال کنید.');
        return;
    }

    newWindow.document.open();
    newWindow.document.write(`
        <!DOCTYPE html>
        <html lang="fa" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>پیش‌نمایش - ${escapeHtml(empSitePageCaption.value.trim() || 'بدون عنوان')}</title>
            <style>
                * { box-sizing: border-box; }
                body { margin: 0; padding: 0; font-family: Tahoma, sans-serif; }
                img { max-width: 100%; height: auto; }
                iframe, video { max-width: 100%; }
                table { max-width: 100%; }
                .preview-toolbar {
                    position: fixed; top: 10px; left: 10px; z-index: 999999;
                    display: flex; gap: 8px; direction: ltr;
                }
                .preview-toolbar button {
                    padding: 8px 14px; border: none; border-radius: 6px; cursor: pointer;
                    font-family: inherit; font-size: 13px; background: #2563eb; color: #fff;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                }
                .preview-toolbar button:hover { background: #1d4ed8; }
                .preview-toolbar button.close-btn { background: #dc2626; }
                .preview-toolbar button.close-btn:hover { background: #b91c1c; }
            </style>
        </head>
        <body>
            <div class="preview-toolbar">
                <button onclick="window.print()">🖨 چاپ</button>
                <button class="close-btn" onclick="window.close()">✕ بستن</button>
            </div>
            ${htmlContent}
        </body>
        </html>
    `);
    newWindow.document.close();
}

// ═══════════════════════════════════════════════════════
// رویدادها
// ═══════════════════════════════════════════════════════
document.getElementById("searchSitePage")?.addEventListener("input", () => renderTable());
document.getElementById("statusFilter")?.addEventListener("change", () => renderTable());

if (modal) {
    modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal("SitePageModal");
    });
}

// ═══════════════════════════════════════════════════════
// شروع
// ═══════════════════════════════════════════════════════
loadFromStorage();
renderTable();