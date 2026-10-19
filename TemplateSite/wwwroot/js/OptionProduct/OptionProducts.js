let OptionProductList = [];
let editingOptionProduct = false;


GetKindProductData(); function GetKindProductData() {
    $.post('/KindProducts/GetAllData', function (response) {
        if (response.isSuccess) {
            let dataConvert = JSON.parse(response.data);
            let options = "";
            dataConvert.forEach(function (item) {
                options = options + `<option value=\"${item.KindProductId}\">${item.KindProductCaption}</option>`;
            });
            document.getElementById("KindProduct").innerHTML = options;
        }
        else {
            alert(response.errorTitle);
        }
    });
}
function saveToStorage() {
    $.post('/OptionProducts/GetAllData', function (response) {
        if (response.isSuccess) {
            OptionProductList = JSON.parse(response.data);
            localStorage.setItem("OptionProducts", JSON.stringify(OptionProductList));
            renderTable();
            nextId = Math.max(...OptionProductList.map(i => i.OptionProductId));
        }
        else {
            alert(response.errorTitle);
        }
    });
}
function loadFromStorage() {
    const saved = localStorage.getItem("OptionProducts");
    if (saved) {
        OptionProductList = JSON.parse(saved);
    }
    else saveToStorage();
}
function renderStats() {
    const total = OptionProductList.length, active = OptionProductList.filter(data => data.Status).length, inactive = OptionProductList.filter(data => !data.Status).length;
    document.getElementById("statsCards").innerHTML = `
            <div class="stat-card"><div class="stat-info"><div class="number">${total}</div><div class="label">کل مشخصات فنی هر نوع محصول</div></div><div class="stat-icon"><i class="fas fa-users"></i></div></div>
            <div class="stat-card"><div class="stat-info"><div class="number">${active}</div><div class="label">فعال</div></div><div class="stat-icon"><i class="fas fa-check-circle"></i></div></div>
            <div class="stat-card"><div class="stat-info"><div class="number">${inactive}</div><div class="label">غیرفعال</div></div><div class="stat-icon"><i class="fas fa-ban"></i></div></div>
        `;
}
function renderTable() {
    const searchTerm = document.getElementById("searchOptionProduct").value.toLowerCase();
    const statusFilter = document.getElementById("statusFilter").value;
    let filtered = [...OptionProductList];
    if (searchTerm) filtered = filtered.filter(p =>p.OptionProductCaption.toLowerCase().includes(searchTerm));
    if (statusFilter !== "all") filtered = filtered.filter(p => p.Status.toString() === statusFilter);
    const tbody = document.getElementById("OptionProductTableBody");
    if (filtered.length === 0) { tbody.innerHTML = `<tr class="empty-row"><td colspan="7">هیچ رکورد یافت نشد</td></tr>`; renderStats(); return; }
    
    tbody.innerHTML = filtered.map(data => {
        
 const statusStatus = data.Status === true ? "فعال" : "غیرفعال";
        return `<tr>
                <td>
                  <div style="display:flex;align-items:center;gap:12px;">
                    <div><strong>${data.OptionProductId}</strong></div>
                  </div>
                </td>
                
 <td>${data.OptionProductCaption}</td>
 <td>${data.KindProductCaption}</td>
 <td>${statusStatus}</td>
                <td class="action-buttons">
                    
                    <button class="action-btn edit-btn" data-id="${data.OptionProductId}" title="ویرایش"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete-btn" data-id="${data.OptionProductId}" title="حذف"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>`;
    }).join('');
    
    document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', (e) => { const id = parseInt(btn.dataset.id); openEditModal(id); }));
    document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', (e) => { if (confirm("حذف رکورد؟")) deleteOptionProduct(parseInt(btn.dataset.id)); }));
    renderStats();
}
function deleteOptionProduct(OptionProductId) {
    $.post('/OptionProducts/DeleteData', { 'id': OptionProductId }, function (response) {
        if (response.isSuccess) {
            OptionProductList = OptionProductList.filter(data => data.OptionProductId !== OptionProductId);
            saveToStorage();
            renderTable();
            alert(response.data);
        }
        else {
            alert(response.errorTitle);
        }
    });
}
const modal = document.getElementById("OptionProductModal");
const modalTitle = document.getElementById("modalTitle");
const empOptionProductId = document.getElementById("OptionProductId");const empOptionProductCaption = document.getElementById("OptionProductCaption");const empKindProductId = document.getElementById("KindProduct");const empStatus = document.getElementById("Status");

function openAddModal() {
    editingOptionProduct = false;
    resetModal();
    openModal("OptionProductModal");
}
function openEditModal(OptionProductId) {
    const data = OptionProductList.find(data => data.OptionProductId === OptionProductId);
    if (data) {
        editingOptionProduct = true;
        
	 empOptionProductId.value = data.OptionProductId;
	 empOptionProductCaption.value = data.OptionProductCaption;
	 empKindProductId.value = data.KindProductId;
	 empStatus.checked = Boolean(data.Status);
        modalTitle.innerText = "ویرایش رکورد";
        openModal("OptionProductModal");
    }
}
function CanselSaveModal() {
    closeModal("OptionProductModal");
    resetModal();
}
function SaveNewModel() {
    
	 const OptionProductId = empOptionProductId.value.trim();
	 const OptionProductCaption = empOptionProductCaption.value.trim();
	 const KindProductId = empKindProductId.value.trim();
	 const Status = empStatus.checked;
    if (!OptionProductCaption || !KindProductId) {
        alert("لطفاً تمام فیلدها را پر کنید");
        return;
    }
    if (editingOptionProduct) { updateOptionProduct(OptionProductId,OptionProductCaption,KindProductId,Status); } else { addOptionProduct(OptionProductId,OptionProductCaption,KindProductId,Status); }
    closeModal("OptionProductModal");
}
function addOptionProduct(OptionProductId,OptionProductCaption,KindProductId,Status) {
    const newOptionProduct = {
        OptionProductId,OptionProductCaption,KindProductId,Status
    };
    newOptionProduct.OptionProductId = 0;
    SendData(newOptionProduct, true);
}
function updateOptionProduct(OptionProductId,OptionProductCaption,KindProductId,Status) {
    const idx = OptionProductList.findIndex(data => data.OptionProductId == OptionProductId);
    if (idx !== -1) {
        OptionProductList[idx] = { OptionProductId,OptionProductCaption,KindProductId,Status };
        SendData(OptionProductList[idx], false);
    }
}
function SendData(newOptionProduct, typeRequst) {
    $.post('/OptionProducts/UpdateData', newOptionProduct, function (response) {
        if (response.isSuccess) {
            if (typeRequst) {
                OptionProductList.push(newOptionProduct);
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
    
 empOptionProductId.value = "";
 empOptionProductCaption.value = "";
 empKindProductId.value = "";
 empStatus.checked = false;
    modalTitle.innerText = "افزودن رکورد جدید";
}
function openModal(Modal) {
    document.getElementById(Modal).classList.add("active");
}
function closeModal(Modal) {
    document.getElementById(Modal).classList.remove("active");
}

document.getElementById("searchOptionProduct").addEventListener("input", () => renderTable());
document.getElementById("statusFilter").addEventListener("change", () => renderTable());
modal.addEventListener("click", (e) => { if (e.target === modal) closeModal("OptionProductModal"); });

loadFromStorage(); renderTable();






