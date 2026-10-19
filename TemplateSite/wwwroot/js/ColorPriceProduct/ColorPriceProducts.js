let ColorPriceProductList = [];
let editingColorPriceProduct = false;


GetProductData(); function GetProductData() {
    $.post('/Products/GetAllData', function (response) {
        if (response.isSuccess) {
            let dataConvert = JSON.parse(response.data);
            let options = "";
            dataConvert.forEach(function (item) {
                options = options + `<option value=\"${item.ProductId}\">${item.ProductCaption}</option>`;
            });
            document.getElementById("Product").innerHTML = options;
        }
        else {
            alert(response.errorTitle);
        }
    });
}
function saveToStorage() {
    $.post('/ColorPriceProducts/GetAllData', function (response) {
        if (response.isSuccess) {
            ColorPriceProductList = JSON.parse(response.data);
            localStorage.setItem("ColorPriceProducts", JSON.stringify(ColorPriceProductList));
            renderTable();
            nextId = Math.max(...ColorPriceProductList.map(i => i.ColorPriceProductId));
        }
        else {
            alert(response.errorTitle);
        }
    });
}
function loadFromStorage() {
    const saved = localStorage.getItem("ColorPriceProducts");
    if (saved) {
        ColorPriceProductList = JSON.parse(saved);
    }
    else saveToStorage();
}
function renderStats() {
    const total = ColorPriceProductList.length, active = ColorPriceProductList.filter(data => data.Status).length, inactive = ColorPriceProductList.filter(data => !data.Status).length;
    document.getElementById("statsCards").innerHTML = `
            <div class="stat-card"><div class="stat-info"><div class="number">${total}</div><div class="label">کل رنگ بندی محصولات</div></div><div class="stat-icon"><i class="fas fa-users"></i></div></div>
            <div class="stat-card"><div class="stat-info"><div class="number">${active}</div><div class="label">فعال</div></div><div class="stat-icon"><i class="fas fa-check-circle"></i></div></div>
            <div class="stat-card"><div class="stat-info"><div class="number">${inactive}</div><div class="label">غیرفعال</div></div><div class="stat-icon"><i class="fas fa-ban"></i></div></div>
        `;
}
function renderTable() {
    const searchTerm = document.getElementById("searchColorPriceProduct").value.toLowerCase();
    const statusFilter = document.getElementById("statusFilter").value;
    let filtered = [...ColorPriceProductList];
    if (searchTerm) filtered = filtered.filter(p =>p.ColorPriceProductCaption.toLowerCase().includes(searchTerm) || p.Offer.toLowerCase().includes(searchTerm) || p.InStore.toLowerCase().includes(searchTerm));
    if (statusFilter !== "all") filtered = filtered.filter(p => p.Status.toString() === statusFilter);
    const tbody = document.getElementById("ColorPriceProductTableBody");
    if (filtered.length === 0) { tbody.innerHTML = `<tr class="empty-row"><td colspan="7">هیچ رکورد یافت نشد</td></tr>`; renderStats(); return; }
    
    tbody.innerHTML = filtered.map(data => {
        
 const statusStatus = data.Status === true ? "فعال" : "غیرفعال";
        return `<tr>
                <td>
                  <div style="display:flex;align-items:center;gap:12px;">
                    <div><strong>${data.ColorPriceProductId}</strong></div>
                  </div>
                </td>
                
 <td>${data.ColorPriceProductCaption}</td>
 <td>${data.PriceProduct}</td>
 <td>${data.Offer}</td>
 <td>${data.ProductCaption}</td>
 <td>${data.InStore}</td>
 <td>${statusStatus}</td>
                <td class="action-buttons">
                    
                    <button class="action-btn edit-btn" data-id="${data.ColorPriceProductId}" title="ویرایش"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete-btn" data-id="${data.ColorPriceProductId}" title="حذف"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>`;
    }).join('');
    
    document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', (e) => { const id = parseInt(btn.dataset.id); openEditModal(id); }));
    document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', (e) => { if (confirm("حذف رکورد؟")) deleteColorPriceProduct(parseInt(btn.dataset.id)); }));
    renderStats();
}
function deleteColorPriceProduct(ColorPriceProductId) {
    $.post('/ColorPriceProducts/DeleteData', { 'id': ColorPriceProductId }, function (response) {
        if (response.isSuccess) {
            ColorPriceProductList = ColorPriceProductList.filter(data => data.ColorPriceProductId !== ColorPriceProductId);
            saveToStorage();
            renderTable();
            alert(response.data);
        }
        else {
            alert(response.errorTitle);
        }
    });
}
const modal = document.getElementById("ColorPriceProductModal");
const modalTitle = document.getElementById("modalTitle");
const empColorPriceProductId = document.getElementById("ColorPriceProductId");const empColorPriceProductCaption = document.getElementById("ColorPriceProductCaption");const empPriceProduct = document.getElementById("PriceProduct");const empOffer = document.getElementById("Offer");const empProductId = document.getElementById("Product");const empInStore = document.getElementById("InStore");const empStatus = document.getElementById("Status");

function openAddModal() {
    editingColorPriceProduct = false;
    resetModal();
    openModal("ColorPriceProductModal");
}
function openEditModal(ColorPriceProductId) {
    const data = ColorPriceProductList.find(data => data.ColorPriceProductId === ColorPriceProductId);
    if (data) {
        editingColorPriceProduct = true;
        
	 empColorPriceProductId.value = data.ColorPriceProductId;
	 empColorPriceProductCaption.value = data.ColorPriceProductCaption;
	 empPriceProduct.value = data.PriceProduct;
	 empOffer.value = data.Offer;
	 empProductId.value = data.ProductId;
	 empInStore.value = data.InStore;
	 empStatus.checked = Boolean(data.Status);
        modalTitle.innerText = "ویرایش رکورد";
        openModal("ColorPriceProductModal");
    }
}
function CanselSaveModal() {
    closeModal("ColorPriceProductModal");
    resetModal();
}
function SaveNewModel() {
    
	 const ColorPriceProductId = empColorPriceProductId.value.trim();
	 const ColorPriceProductCaption = empColorPriceProductCaption.value.trim();
	 const PriceProduct = empPriceProduct.value.trim();
	 const Offer = empOffer.value.trim();
	 const ProductId = empProductId.value.trim();
	 const InStore = empInStore.value.trim();
	 const Status = empStatus.checked;
    if (!ColorPriceProductCaption || !PriceProduct || !Offer || !ProductId || !InStore) {
        alert("لطفاً تمام فیلدها را پر کنید");
        return;
    }
    if (editingColorPriceProduct) { updateColorPriceProduct(ColorPriceProductId,ColorPriceProductCaption,PriceProduct,Offer,ProductId,InStore,Status); } else { addColorPriceProduct(ColorPriceProductId,ColorPriceProductCaption,PriceProduct,Offer,ProductId,InStore,Status); }
    closeModal("ColorPriceProductModal");
}
function addColorPriceProduct(ColorPriceProductId,ColorPriceProductCaption,PriceProduct,Offer,ProductId,InStore,Status) {
    const newColorPriceProduct = {
        ColorPriceProductId,ColorPriceProductCaption,PriceProduct,Offer,ProductId,InStore,Status
    };
    newColorPriceProduct.ColorPriceProductId = 0;
    SendData(newColorPriceProduct, true);
}
function updateColorPriceProduct(ColorPriceProductId,ColorPriceProductCaption,PriceProduct,Offer,ProductId,InStore,Status) {
    const idx = ColorPriceProductList.findIndex(data => data.ColorPriceProductId == ColorPriceProductId);
    if (idx !== -1) {
        ColorPriceProductList[idx] = { ColorPriceProductId,ColorPriceProductCaption,PriceProduct,Offer,ProductId,InStore,Status };
        SendData(ColorPriceProductList[idx], false);
    }
}
function SendData(newColorPriceProduct, typeRequst) {
    $.post('/ColorPriceProducts/UpdateData', newColorPriceProduct, function (response) {
        if (response.isSuccess) {
            if (typeRequst) {
                ColorPriceProductList.push(newColorPriceProduct);
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
    
 empColorPriceProductId.value = "";
 empColorPriceProductCaption.value = "";
 empPriceProduct.value = "";
 empOffer.value = "";
 empProductId.value = "";
 empInStore.value = "";
 empStatus.checked = false;
    modalTitle.innerText = "افزودن رکورد جدید";
}
function openModal(Modal) {
    document.getElementById(Modal).classList.add("active");
}
function closeModal(Modal) {
    document.getElementById(Modal).classList.remove("active");
}

document.getElementById("searchColorPriceProduct").addEventListener("input", () => renderTable());
document.getElementById("statusFilter").addEventListener("change", () => renderTable());
modal.addEventListener("click", (e) => { if (e.target === modal) closeModal("ColorPriceProductModal"); });

loadFromStorage(); renderTable();






