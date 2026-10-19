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
 <td>${data.SitePageHtml}</td>
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
const empSitePageId = document.getElementById("SitePageId");const empSitePageCaption = document.getElementById("SitePageCaption");const empSitePageHtml = document.getElementById("SitePageHtml");const empCodePage = document.getElementById("CodePage");const empStatus = document.getElementById("Status");

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
    if (!SitePageCaption || !SitePageHtml || !CodePage) {
        alert("لطفاً تمام فیلدها را پر کنید");
        return;
    }
    if (editingSitePage) { updateSitePage(SitePageId,SitePageCaption,SitePageHtml,CodePage,Status); } else { addSitePage(SitePageId,SitePageCaption,SitePageHtml,CodePage,Status); }
    closeModal("SitePageModal");
}
function addSitePage(SitePageId,SitePageCaption,SitePageHtml,CodePage,Status) {
    const newSitePage = {
        SitePageId,SitePageCaption,SitePageHtml,CodePage,Status
    };
    newSitePage.SitePageId = 0;
    SendData(newSitePage, true);
}
function updateSitePage(SitePageId,SitePageCaption,SitePageHtml,CodePage,Status) {
    const idx = SitePageList.findIndex(data => data.SitePageId == SitePageId);
    if (idx !== -1) {
        SitePageList[idx] = { SitePageId,SitePageCaption,SitePageHtml,CodePage,Status };
        SendData(SitePageList[idx], false);
    }
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
function resetModal() {
    
 empSitePageId.value = "";
 empSitePageCaption.value = "";
 empSitePageHtml.value = "";
 empCodePage.value = "";
 empStatus.checked = false;
    modalTitle.innerText = "افزودن رکورد جدید";
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






