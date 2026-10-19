let PageList = [];
let editingPage = false;



function saveToStorage() {
    $.post('/Pages/GetAllData', function (response) {
        if (response.isSuccess) {
            PageList = JSON.parse(response.data);
            localStorage.setItem("Pages", JSON.stringify(PageList));
            renderTable();
            nextId = Math.max(...PageList.map(i => i.PageId));
        }
        else {
            alert(response.errorTitle);
        }
    });
}
function loadFromStorage() {
    const saved = localStorage.getItem("Pages");
    if (saved) {
        PageList = JSON.parse(saved);
    }
    else saveToStorage();
}
function renderStats() {
    const total = PageList.length, active = PageList.filter(data => data.Status).length, inactive = PageList.filter(data => !data.Status).length;
    document.getElementById("statsCards").innerHTML = `
            <div class="stat-card"><div class="stat-info"><div class="number">${total}</div><div class="label">کل صفحه سایت</div></div><div class="stat-icon"><i class="fas fa-users"></i></div></div>
            <div class="stat-card"><div class="stat-info"><div class="number">${active}</div><div class="label">فعال</div></div><div class="stat-icon"><i class="fas fa-check-circle"></i></div></div>
            <div class="stat-card"><div class="stat-info"><div class="number">${inactive}</div><div class="label">غیرفعال</div></div><div class="stat-icon"><i class="fas fa-ban"></i></div></div>
        `;
}
function renderTable() {
    const searchTerm = document.getElementById("searchPage").value.toLowerCase();
    const statusFilter = document.getElementById("statusFilter").value;
    let filtered = [...PageList];
    if (searchTerm) filtered = filtered.filter(p =>p.PageCaption.toLowerCase().includes(searchTerm) || p.TitlePage.toLowerCase().includes(searchTerm));
    if (statusFilter !== "all") filtered = filtered.filter(p => p.Status.toString() === statusFilter);
    const tbody = document.getElementById("PageTableBody");
    if (filtered.length === 0) { tbody.innerHTML = `<tr class="empty-row"><td colspan="7">هیچ رکورد یافت نشد</td></tr>`; renderStats(); return; }
    
    tbody.innerHTML = filtered.map(data => {
        
 const statusStatus = data.Status === true ? "فعال" : "غیرفعال";
        return `<tr>
                <td>
                  <div style="display:flex;align-items:center;gap:12px;">
                    <div><strong>${data.PageId}</strong></div>
                  </div>
                </td>
                
 <td>${data.PageCaption}</td>
 <td>${data.TitlePage}</td>
 <td>${data.DetailPage}</td>
 <td>${statusStatus}</td>
                <td class="action-buttons">
                    
                    <button class="action-btn edit-btn" data-id="${data.PageId}" title="ویرایش"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete-btn" data-id="${data.PageId}" title="حذف"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>`;
    }).join('');
    
    document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', (e) => { const id = parseInt(btn.dataset.id); openEditModal(id); }));
    document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', (e) => { if (confirm("حذف رکورد؟")) deletePage(parseInt(btn.dataset.id)); }));
    renderStats();
}
function deletePage(PageId) {
    $.post('/Pages/DeleteData', { 'id': PageId }, function (response) {
        if (response.isSuccess) {
            PageList = PageList.filter(data => data.PageId !== PageId);
            saveToStorage();
            renderTable();
            alert(response.data);
        }
        else {
            alert(response.errorTitle);
        }
    });
}
const modal = document.getElementById("PageModal");
const modalTitle = document.getElementById("modalTitle");
const empPageId = document.getElementById("PageId");const empPageCaption = document.getElementById("PageCaption");const empTitlePage = document.getElementById("TitlePage");const empDetailPage = document.getElementById("DetailPage");const empStatus = document.getElementById("Status");

function openAddModal() {
    editingPage = false;
    resetModal();
    openModal("PageModal");
}
function openEditModal(PageId) {
    const data = PageList.find(data => data.PageId === PageId);
    if (data) {
        editingPage = true;
        
	 empPageId.value = data.PageId;
	 empPageCaption.value = data.PageCaption;
	 empTitlePage.value = data.TitlePage;
	 empDetailPage.value = data.DetailPage;
	 empStatus.checked = Boolean(data.Status);
        modalTitle.innerText = "ویرایش رکورد";
        openModal("PageModal");
    }
}
function CanselSaveModal() {
    closeModal("PageModal");
    resetModal();
}
function SaveNewModel() {
    
	 const PageId = empPageId.value.trim();
	 const PageCaption = empPageCaption.value.trim();
	 const TitlePage = empTitlePage.value.trim();
	 const DetailPage = empDetailPage.value.trim();
	 const Status = empStatus.checked;
    if (!PageCaption || !TitlePage || !DetailPage) {
        alert("لطفاً تمام فیلدها را پر کنید");
        return;
    }
    if (editingPage) { updatePage(PageId,PageCaption,TitlePage,DetailPage,Status); } else { addPage(PageId,PageCaption,TitlePage,DetailPage,Status); }
    closeModal("PageModal");
}
function addPage(PageId,PageCaption,TitlePage,DetailPage,Status) {
    const newPage = {
        PageId,PageCaption,TitlePage,DetailPage,Status
    };
    newPage.PageId = 0;
    SendData(newPage, true);
}
function updatePage(PageId,PageCaption,TitlePage,DetailPage,Status) {
    const idx = PageList.findIndex(data => data.PageId == PageId);
    if (idx !== -1) {
        PageList[idx] = { PageId,PageCaption,TitlePage,DetailPage,Status };
        SendData(PageList[idx], false);
    }
}
function SendData(newPage, typeRequst) {
    $.post('/Pages/UpdateData', newPage, function (response) {
        if (response.isSuccess) {
            if (typeRequst) {
                PageList.push(newPage);
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
    
 empPageId.value = "";
 empPageCaption.value = "";
 empTitlePage.value = "";
 empDetailPage.value = "";
 empStatus.checked = false;
    modalTitle.innerText = "افزودن رکورد جدید";
}
function openModal(Modal) {
    document.getElementById(Modal).classList.add("active");
}
function closeModal(Modal) {
    document.getElementById(Modal).classList.remove("active");
}

document.getElementById("searchPage").addEventListener("input", () => renderTable());
document.getElementById("statusFilter").addEventListener("change", () => renderTable());
modal.addEventListener("click", (e) => { if (e.target === modal) closeModal("PageModal"); });

loadFromStorage(); renderTable();






