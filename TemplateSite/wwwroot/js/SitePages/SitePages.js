let SitePageList = [];
let editingSitePage = false;



function saveToStorage() {
    $.post('/SitePages/GetAllData', function (response) {
        if (response.isSuccess) {
            SitePageList = JSON.parse(response.data);
            localStorage.setItem("SitePages", JSON.stringify(SitePageList));
            renderTable();
            nextId = Math.max(...SitePageList.map(i => i.SitePageId));
        }
        else {
            alert(response.errorTitle);
        }
    });
}
function loadFromStorage() {
    const saved = localStorage.getItem("SitePages");
    if (saved) {
        SitePageList = JSON.parse(saved);
    }
    else saveToStorage();
}
function renderStats() {
    const total = SitePageList.length, active = SitePageList.filter(data => data.Status).length, inactive = SitePageList.filter(data => !data.Status).length;
    document.getElementById("statsCards").innerHTML = `
            <div class="stat-card"><div class="stat-info"><div class="number">${total}</div><div class="label">کل  تک صفحه نمایش</div></div><div class="stat-icon"><i class="fas fa-users"></i></div></div>
            <div class="stat-card"><div class="stat-info"><div class="number">${active}</div><div class="label">فعال</div></div><div class="stat-icon"><i class="fas fa-check-circle"></i></div></div>
            <div class="stat-card"><div class="stat-info"><div class="number">${inactive}</div><div class="label">غیرفعال</div></div><div class="stat-icon"><i class="fas fa-ban"></i></div></div>
        `;
}
function renderTable() {
    const searchTerm = document.getElementById("searchSitePage").value.toLowerCase();
    const statusFilter = document.getElementById("statusFilter").value;
    let filtered = [...SitePageList];

    if (statusFilter !== "all") filtered = filtered.filter(p => p.Status.toString() === statusFilter);
    const tbody = document.getElementById("SitePageTableBody");
    if (filtered.length === 0) { tbody.innerHTML = `<tr class="empty-row"><td colspan="7">هیچ رکورد یافت نشد</td></tr>`; renderStats(); return; }

    tbody.innerHTML = filtered.map(data => {

        const statusStatus = data.Status === true ? "فعال" : "غیرفعال";
        return `<tr>
                <td>
                  <div style="display:flex;align-items:center;gap:12px;">
                    <div><strong>${data.SitePageId}</strong></div>
                  </div>
                </td>
                
 <td>${data.SitePageCaption}</td>
 <td>${data.CodePage}</td>
 <td>${statusStatus}</td>
                <td class="action-buttons">
                    
                    <button class="action-btn edit-btn" data-id="${data.SitePageId}" title="ویرایش"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete-btn" data-id="${data.SitePageId}" title="حذف"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>`;
    }).join('');

    document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', (e) => { const id = parseInt(btn.dataset.id); openEditModal(id); }));
    document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', (e) => { if (confirm("حذف رکورد؟")) deleteSitePage(parseInt(btn.dataset.id)); }));
    renderStats();
}
function deleteSitePage(SitePageId) {
    $.post('/SitePages/DeleteData', { 'id': SitePageId }, function (response) {
        if (response.isSuccess) {
            SitePageList = SitePageList.filter(data => data.SitePageId !== SitePageId);
            saveToStorage();
            renderTable();
            alert(response.data);
        }
        else {
            alert(response.errorTitle);
        }
    });
}
const modal = document.getElementById("SitePageModal");
const modalTitle = document.getElementById("modalTitle");
const empSitePageId = document.getElementById("SitePageId"); const empSitePageCaption = document.getElementById("SitePageCaption"); const empSitePageHtml = document.getElementById("SitePageHtml"); const empCodePage = document.getElementById("CodePage"); const empStatus = document.getElementById("Status");

function openAddModal() {
    editingSitePage = false;
    resetModal();
    openModal("SitePageModal");
}
function openEditModal(SitePageId) {
    const data = SitePageList.find(data => data.SitePageId === SitePageId);
    if (data) {
        editingSitePage = true;

        empSitePageId.value = data.SitePageId;
        empSitePageCaption.value = data.SitePageCaption;
        empSitePageHtml.value = data.SitePageHtml;
        empCodePage.value = data.CodePage;
        empStatus.checked = Boolean(data.Status);
        modalTitle.innerText = "ویرایش رکورد";
        switchHtmlTab('code');
        openModal("SitePageModal");
    }
}
function CanselSaveModal() {
    closeModal("SitePageModal");
    resetModal();
}
function SaveNewModel() {

    const SitePageId = empSitePageId.value.trim();
    const SitePageCaption = empSitePageCaption.value.trim();
    const SitePageHtml = empSitePageHtml.value.trim();
    const CodePage = empCodePage.value.trim();
    const Status = empStatus.checked;
    if (!SitePageCaption || !SitePageHtml) {
        alert("لطفاً تمام فیلدها را پر کنید");
        return;
    }
    if (editingSitePage) { updateSitePage(SitePageId, SitePageCaption, SitePageHtml, CodePage, Status); } else { addSitePage(SitePageId, SitePageCaption, SitePageHtml, CodePage, Status); }
    closeModal("SitePageModal");
}
function addSitePage(SitePageId, SitePageCaption, SitePageHtml, CodePage, Status) {
    const newSitePage = {
        SitePageId, SitePageCaption, SitePageHtml, CodePage, Status
    };
    newSitePage.SitePageId = 0;
    SendData(newSitePage, true);
}
function updateSitePage(SitePageId, SitePageCaption, SitePageHtml, CodePage, Status) {
    const idx = SitePageList.findIndex(data => data.SitePageId == SitePageId);
    if (idx !== -1) {
        SitePageList[idx] = { SitePageId, SitePageCaption, SitePageHtml, CodePage, Status };
        SendData(SitePageList[idx], false);
    }
}
// ===== مدیریت تب‌های ادیتور HTML =====
function switchHtmlTab(tabName) {
    // تب سوم پنل ندارد؛ فقط اکشن است
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
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function truncate(str, len) {
    if (!str) return '';
    return str.length > len ? str.substring(0, len) + '...' : str;
}
function renderHtmlPreview() {
    const iframe = document.getElementById('SitePageHtmlPreview');
    const htmlContent = empSitePageHtml.value || '<p style="color:#999;text-align:center;padding:20px;">هیچ محتوایی برای نمایش وجود ندارد</p>';

    // نوشتن داخل iframe به‌صورت امن
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
function SendData(newSitePage, typeRequst) {
    $.post('/SitePages/UpdateData', newSitePage, function (response) {
        if (response.isSuccess) {
            if (typeRequst) {
                SitePageList.push(newSitePage);
            }
            saveToStorage();
            renderTable();
            alert(response.data);
        }
        else {
            alert(response.errorTitle);
        }
    });
}
// ===== باز کردن پیش‌نمایش در تب جدید مرورگر (تمام صفحه) =====
function openFullScreenPreview() {
    const htmlContent = empSitePageHtml.value.trim();

    if (!htmlContent) {
        alert('هیچ محتوایی برای نمایش وجود ندارد. ابتدا کد HTML را وارد کنید.');
        return;
    }

    // یک تب جدید باز می‌کنیم
    const newWindow = window.open('', '_blank');

    if (!newWindow) {
        alert('مرورگر شما اجازه باز کردن پنجره جدید را نداد. لطفاً پاپ‌آپ را فعال کنید.');
        return;
    }

    // ساخت سند کامل برای نمایش
    newWindow.document.open();
    newWindow.document.write(`
        <!DOCTYPE html>
        <html lang="fa" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>پیش‌نمایش تمام صفحه - ${escapeHtml(empSitePageCaption.value.trim() || 'بدون عنوان')}</title>
            <style>
                * { box-sizing: border-box; }
                body {
                    margin: 0;
                    padding: 0;
                    font-family: Tahoma, 'Segoe UI', sans-serif;
                }
                img { max-width: 100%; height: auto; }
                iframe, video { max-width: 100%; }
                table { max-width: 100%; }

                /* نوار ابزار کوچک بالای صفحه */
                .preview-toolbar {
                    position: fixed;
                    top: 10px;
                    left: 10px;
                    z-index: 999999;
                    display: flex;
                    gap: 8px;
                    direction: ltr;
                }
                .preview-toolbar button {
                    padding: 8px 14px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-family: inherit;
                    font-size: 13px;
                    background: #2563eb;
                    color: #fff;
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

            <!-- محتوای HTML کاربر -->
            ${htmlContent}
        </body>
        </html>
    `);
    newWindow.document.close();
}
function resetModal() {
    empSitePageId.value = "";
    empSitePageCaption.value = "";
    empSitePageHtml.value = "";
    empCodePage.value = "";
    empStatus.checked = false;
    modalTitle.innerText = "افزودن رکورد جدید";
    switchHtmlTab('code');
}
function openModal(Modal) {
    document.getElementById(Modal).classList.add("active");
}
function closeModal(Modal) {
    document.getElementById(Modal).classList.remove("active");
}

document.getElementById("searchSitePage").addEventListener("input", () => renderTable());
document.getElementById("statusFilter").addEventListener("change", () => renderTable());
modal.addEventListener("click", (e) => { if (e.target === modal) closeModal("SitePageModal"); });

loadFromStorage(); renderTable();






