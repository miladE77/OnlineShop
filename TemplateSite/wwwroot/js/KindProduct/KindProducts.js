let KindProductList = [];
let editingKindProduct = false;


GetParentKindProductData(); function GetParentKindProductData() {
    $.post('/KindProducts/GetAllData', function (response) {
        if (response.isSuccess) {
            let dataConvert = JSON.parse(response.data);
            let options = "";
            dataConvert.forEach(function (item) {
                options = options + `<option value=\"${item.KindProductId}\">${item.KindProductCaption}</option>`;
            });
            document.getElementById("ParentKindProduct").innerHTML = options;
        }
        else {
            alert(response.errorTitle);
        }
    });
}
function saveToStorage() {
    $.post('/KindProducts/GetAllData', function (response) {
        if (response.isSuccess) {
            KindProductList = JSON.parse(response.data);
            localStorage.setItem("KindProducts", JSON.stringify(KindProductList));
            renderData();
            nextId = Math.max(...KindProductList.map(i => i.KindProductId));
        }
        else {
            alert(response.errorTitle);
        }
    });
}
function loadFromStorage() {
    const saved = localStorage.getItem("KindProducts");
    if (saved) {
        KindProductList = JSON.parse(saved);
    }
    else saveToStorage();
}
function renderStats() {
    const total = KindProductList.length, active = KindProductList.filter(data => data.Status).length, inactive = KindProductList.filter(data => !data.Status).length;
    document.getElementById("statsCards").innerHTML = `
            <div class="stat-card"><div class="stat-info"><div class="number">${total}</div><div class="label">کل دسته بندی محصولات</div></div><div class="stat-icon"><i class="fas fa-users"></i></div></div>
            <div class="stat-card"><div class="stat-info"><div class="number">${active}</div><div class="label">فعال</div></div><div class="stat-icon"><i class="fas fa-check-circle"></i></div></div>
            <div class="stat-card"><div class="stat-info"><div class="number">${inactive}</div><div class="label">غیرفعال</div></div><div class="stat-icon"><i class="fas fa-ban"></i></div></div>
        `;
}
function buildTree(parentId = null, level = 0, searchTerm = "") {
    let children = KindProductList.filter(c => c.ParentKindProductId === parentId);
    if (searchTerm) {
        children = children.filter(c => c.KindProductCaption.includes(searchTerm));
    }
    if (children.length === 0) return '';
    let html = '<ul class="children" style="list-style:none;padding-right:28px;">';
    children.forEach(cat => {
        const hasChildren = KindProductList.some(c => c.ParentKindProductId === cat.KindProductId);
        const statusClass = cat.Status === true ? "status-active" : "status-inactive";
        const statusText = cat.Status === true ? "فعال" : "غیرفعال";
        html += `<li class="tree-node">
                        <div class="node-item" data-id="${cat.KindProductId}">
                            <div class="node-info">
                                <i class="fas ${hasChildren ? 'fa-folder-open' : 'fa-folder'}"></i>
                                <span class="node-name">${cat.KindProductCaption}</span>
                                <div class="node-meta">
                                    <span class="status-badge ${statusClass}">${statusText}</span>
                                </div>
                            </div>
                            <div class="node-actions">
                                <button class="edit-cat-btn" data-id="${cat.KindProductId}" title="ویرایش"><i class="fas fa-edit"></i></button>
                                <button class="delete-cat-btn" data-id="${cat.KindProductId}" title="حذف"><i class="fas fa-trash-alt"></i></button>
                            </div>
                        </div>
                        ${buildTree(cat.KindProductId, level + 1, searchTerm)}
                    </li>`;
    });
    html += '</ul>';
    return html;
}

function renderCategoryTree() {
    const searchTerm = document.getElementById("searchKindProduct").value.trim();
    const roots = KindProductList.filter(c => c.ParentKindProductId === null);
    let html = '';
    if (roots.length === 0) {
        document.getElementById("categoryTree").innerHTML = `<div class="empty-state"><i class="fas fa-folder-open"></i> هیچ دسته‌بندی وجود ندارد. برای شروع دسته جدید اضافه کنید.</div>`;
        updateStats();
        return;
    }

    let filteredRoots = roots;
    if (searchTerm) {
        filteredRoots = roots.filter(r => r.KindProductCaption.includes(searchTerm));
    }

    filteredRoots.forEach(root => {
        const hasChildren = KindProductList.some(c => c.ParentKindProductId === root.KindProductId);
        const statusClass = root.Status === true ? "status-active" : "status-inactive";
        const statusText = root.Status === true ? "فعال" : "غیرفعال";
        html += `<li class="tree-node">
                        <div class="node-item" data-id="${root.KindProductId}">
                            <div class="node-info">
                                <i class="fas ${hasChildren ? 'fa-folder-open' : 'fa-folder'}"></i>
                                <span class="node-name">${root.KindProductCaption}</span>
                                <div class="node-meta">
                                    <span class="status-badge ${statusClass}">${statusText}</span>
                                    <small>زیردسته: ${KindProductList.filter(c => c.ParentKindProductId === root.KindProductId).length}</small>
                                </div>
                            </div>
                            <div class="node-actions">
                                <button class="add-sub-btn" data-id="${root.KindProductId}" title="افزودن زیردسته"><i class="fas fa-plus-circle"></i></button>
                                <button class="edit-cat-btn" data-id="${root.KindProductId}" title="ویرایش"><i class="fas fa-edit"></i></button>
                                <button class="delete-cat-btn" data-id="${root.KindProductId}" title="حذف"><i class="fas fa-trash-alt"></i></button>
                            </div>
                        </div>
                        ${buildTree(root.KindProductId, 0, searchTerm)}
                    </li>`;
    });

    document.getElementById("categoryTree").innerHTML = `<ul class="tree" style="list-style:none;padding:0;">${html}</ul>`;
    document.querySelectorAll('.add-sub-btn').forEach(btn => btn.addEventListener('click', (e) => { const id = parseInt(btn.dataset.id); addSubKindProduct(id); }));
    document.querySelectorAll('.edit-cat-btn').forEach(btn => btn.addEventListener('click', (e) => { const id = parseInt(btn.dataset.id); openEditModal(id); }));
    document.querySelectorAll('.delete-cat-btn').forEach(btn => btn.addEventListener('click', (e) => { if (confirm("حذف رکورد؟")) deleteKindProduct(parseInt(btn.dataset.id)); }));
    renderStats();
}
function addSubKindProduct(id) {
    openAddModal();
    empParentKindProductId.value = id;
}
function renderData() {
    const TypeShow = document.getElementById("typeShow").value;
    const tree = document.getElementById("treeData");
    const table = document.getElementById("tableData");
    console.log(TypeShow);
    if (TypeShow == 1) {
        renderCategoryTree();
        tree.classList.remove("hide");
        table.classList.add("hide");
    } else {
        renderTable();
        table.classList.remove("hide");
        tree.classList.add("hide");
    }
    console.log("ok");
    renderStats();
}
function renderTable() {
    const searchTerm = document.getElementById("searchKindProduct").value.toLowerCase();
    const statusFilter = document.getElementById("statusFilter").value;
    let filtered = [...KindProductList];
    if (searchTerm) filtered = filtered.filter(p => p.KindProductCaption.toLowerCase().includes(searchTerm) || p.CodeInternalKindProducts.toLowerCase().includes(searchTerm));
    console.log(filtered);
    if (statusFilter !== "all") filtered = filtered.filter(p => p.Status.toString() === statusFilter);
    const tbody = document.getElementById("KindProductTableBody");
    if (filtered.length === 0) { tbody.innerHTML = `<tr class="empty-row"><td colspan="7">هیچ رکورد یافت نشد</td></tr>`; renderStats(); return; }
    
    tbody.innerHTML = filtered.map(data => {
        
 const statusStatus = data.Status === true ? "فعال" : "غیرفعال";
        return `<tr>
                <td>
                  <div style="display:flex;align-items:center;gap:12px;">
                    <div><strong>${data.KindProductId}</strong></div>
                  </div>
                </td>
                
 <td>${data.KindProductCaption}</td>
 <td>${data.CodeInternalKindProducts}</td>
 <td>${data.ParentKindProductCaption}</td>
 <td>${statusStatus}</td>
                <td class="action-buttons">
                    
                    <button class="action-btn edit-btn" data-id="${data.KindProductId}" title="ویرایش"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete-btn" data-id="${data.KindProductId}" title="حذف"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>`;
    }).join('');
    
    document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', (e) => { const id = parseInt(btn.dataset.id); openEditModal(id); }));
    document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', (e) => { if (confirm("حذف رکورد؟")) deleteKindProduct(parseInt(btn.dataset.id)); }));
}
function deleteKindProduct(KindProductId) {
    $.post('/KindProducts/DeleteData', { 'id': KindProductId }, function (response) {
        if (response.isSuccess) {
            KindProductList = KindProductList.filter(data => data.KindProductId !== KindProductId);
            saveToStorage();
            renderData();
            alert(response.data);
        }
        else {
            alert(response.errorTitle);
        }
    });
}
const modal = document.getElementById("KindProductModal");
const modalTitle = document.getElementById("modalTitle");
const empKindProductId = document.getElementById("KindProductId");const empKindProductCaption = document.getElementById("KindProductCaption");const empCodeInternalKindProducts = document.getElementById("CodeInternalKindProducts");const empParentKindProductId = document.getElementById("ParentKindProduct");const empStatus = document.getElementById("Status");

function openAddModal() {
    editingKindProduct = false;
    resetModal();
    openModal("KindProductModal");
}
function openEditModal(KindProductId) {
    const data = KindProductList.find(data => data.KindProductId === KindProductId);
    if (data) {
        editingKindProduct = true;
        
	 empKindProductId.value = data.KindProductId;
	 empKindProductCaption.value = data.KindProductCaption;
	 empCodeInternalKindProducts.value = data.CodeInternalKindProducts;
	 empParentKindProductId.value = data.ParentKindProductId;
	 empStatus.checked = Boolean(data.Status);
        modalTitle.innerText = "ویرایش رکورد";
        openModal("KindProductModal");
    }
}
function CanselSaveModal() {
    closeModal("KindProductModal");
    resetModal();
}
function SaveNewModel() {
    
	 const KindProductId = empKindProductId.value.trim();
	 const KindProductCaption = empKindProductCaption.value.trim();
	 const CodeInternalKindProducts = empCodeInternalKindProducts.value.trim();
	 const ParentKindProductId = empParentKindProductId.value;
    const Status = empStatus.checked;
    console.log(ParentKindProductId);
    if (!KindProductCaption || !CodeInternalKindProducts) {
        alert("لطفاً تمام فیلدها را پر کنید");
        return;
    }
    if (editingKindProduct) { updateKindProduct(KindProductId,KindProductCaption,CodeInternalKindProducts,ParentKindProductId,Status); } else { addKindProduct(KindProductId,KindProductCaption,CodeInternalKindProducts,ParentKindProductId,Status); }
    closeModal("KindProductModal");
}
function addKindProduct(KindProductId,KindProductCaption,CodeInternalKindProducts,ParentKindProductId,Status) {
    const newKindProduct = {
        KindProductId,KindProductCaption,CodeInternalKindProducts,ParentKindProductId,Status
    };
    newKindProduct.KindProductId = 0;
    SendData(newKindProduct, true);
}
function updateKindProduct(KindProductId,KindProductCaption,CodeInternalKindProducts,ParentKindProductId,Status) {
    const idx = KindProductList.findIndex(data => data.KindProductId == KindProductId);
    if (idx !== -1) {
        KindProductList[idx] = { KindProductId,KindProductCaption,CodeInternalKindProducts,ParentKindProductId,Status };
        SendData(KindProductList[idx], false);
    }
}
function SendData(newKindProduct, typeRequst) {
    $.post('/KindProducts/UpdateData', newKindProduct, function (response) {
        if (response.isSuccess) {
            if (typeRequst) {
                KindProductList.push(newKindProduct);
            }
            saveToStorage();
            renderData();
            alert(response.data);
        }
        else {
            alert(response.errorTitle);
        }
    });
}
function resetModal() {
    
 empKindProductId.value = "";
 empKindProductCaption.value = "";
 empCodeInternalKindProducts.value = "";
 empParentKindProductId.value = "";
 empStatus.checked = false;
    modalTitle.innerText = "افزودن رکورد جدید";
}
function openModal(Modal) {
    document.getElementById(Modal).classList.add("active");
}
function closeModal(Modal) {
    document.getElementById(Modal).classList.remove("active");
}

document.getElementById("searchKindProduct").addEventListener("input", () => renderData());
document.getElementById("typeShow").addEventListener("change", () => renderData());
document.getElementById("statusFilter").addEventListener("change", () => renderData());
modal.addEventListener("click", (e) => { if (e.target === modal) closeModal("KindProductModal"); });

loadFromStorage(); renderData();






