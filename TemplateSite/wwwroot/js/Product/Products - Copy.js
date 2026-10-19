let ProductList = [];
let editingProduct = false;


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
}GetStoreData(); function GetStoreData() {
    $.post('/Stores/GetAllData', function (response) {
        if (response.isSuccess) {
            let dataConvert = JSON.parse(response.data);
            let options = "";
            dataConvert.forEach(function (item) {
                options = options + `<option value=\"${item.StoreId}\">${item.StoreCaption}</option>`;
            });
            document.getElementById("Store").innerHTML = options;
        }
        else {
            alert(response.errorTitle);
        }
    });
}
function saveToStorage() {
    $.post('/Products/GetAllData', function (response) {
        if (response.isSuccess) {
            ProductList = JSON.parse(response.data);
            localStorage.setItem("Products", JSON.stringify(ProductList));
            renderTable();
            nextId = Math.max(...ProductList.map(i => i.ProductId));
        }
        else {
            alert(response.errorTitle);
        }
    });
}
function loadFromStorage() {
    const saved = localStorage.getItem("Products");
    if (saved) {
        ProductList = JSON.parse(saved);
    }
    else saveToStorage();
}
function renderStats() {
    const total = ProductList.length, active = ProductList.filter(data => data.Status).length, inactive = ProductList.filter(data => !data.Status).length;
    document.getElementById("statsCards").innerHTML = `
            <div class="stat-card"><div class="stat-info"><div class="number">${total}</div><div class="label">کل محصولات</div></div><div class="stat-icon"><i class="fas fa-users"></i></div></div>
            <div class="stat-card"><div class="stat-info"><div class="number">${active}</div><div class="label">فعال</div></div><div class="stat-icon"><i class="fas fa-check-circle"></i></div></div>
            <div class="stat-card"><div class="stat-info"><div class="number">${inactive}</div><div class="label">غیرفعال</div></div><div class="stat-icon"><i class="fas fa-ban"></i></div></div>
        `;
}
function renderTable() {
    const searchTerm = document.getElementById("searchProduct").value.toLowerCase();
    const statusFilter = document.getElementById("statusFilter").value;
    let filtered = [...ProductList];
    if (searchTerm) filtered = filtered.filter(p =>p.ProductCaption.toLowerCase().includes(searchTerm) || p.KindProductId.toLowerCase().includes(searchTerm) || p.DetailProducts.toLowerCase().includes(searchTerm) || p.StoreId.toLowerCase().includes(searchTerm));
    if (statusFilter !== "all") filtered = filtered.filter(p => p.Status.toString() === statusFilter);
    const tbody = document.getElementById("ProductTableBody");
    if (filtered.length === 0) { tbody.innerHTML = `<tr class="empty-row"><td colspan="7">هیچ رکورد یافت نشد</td></tr>`; renderStats(); return; }
    
    tbody.innerHTML = filtered.map(data => {
        
 const statusStatus = data.Status === true ? "فعال" : "غیرفعال";
        return `<tr>
                <td>
                  <div style="display:flex;align-items:center;gap:12px;">
                    <div><strong>${data.ProductId}</strong></div>
                  </div>
                </td>
                
 <td>${data.ProductCaption}</td>
 <td>${data.CodeInternalProducts}</td>
 <td>${data.KindProductCaption}</td>
 <td>${data.DetailProducts}</td>
 <td>${data.PriceProduct}</td>
 <td>${data.StoreCaption}</td>
 <td>${statusStatus}</td>
                <td class="action-buttons">
                    
                    <button class="action-btn edit-btn" data-id="${data.ProductId}" title="ویرایش"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete-btn" data-id="${data.ProductId}" title="حذف"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>`;
    }).join('');
    
    document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', (e) => { const id = parseInt(btn.dataset.id); openEditModal(id); }));
    document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', (e) => { if (confirm("حذف رکورد؟")) deleteProduct(parseInt(btn.dataset.id)); }));
    renderStats();
}
function deleteProduct(ProductId) {
    $.post('/Products/DeleteData', { 'id': ProductId }, function (response) {
        if (response.isSuccess) {
            ProductList = ProductList.filter(data => data.ProductId !== ProductId);
            saveToStorage();
            renderTable();
            alert(response.data);
        }
        else {
            alert(response.errorTitle);
        }
    });
}
const modal = document.getElementById("ProductModal");
const modalTitle = document.getElementById("modalTitle");
const empProductId = document.getElementById("ProductId");const empProductCaption = document.getElementById("ProductCaption");const empCodeInternalProducts = document.getElementById("CodeInternalProducts");const empKindProductId = document.getElementById("KindProduct");const empDetailProducts = document.getElementById("DetailProducts");const empPriceProduct = document.getElementById("PriceProduct");const empStoreId = document.getElementById("Store");const empStatus = document.getElementById("Status");

function openAddModal() {
    editingProduct = false;
    resetModal();
    openModal("ProductModal");
}
function openEditModal(ProductId) {
    const data = ProductList.find(data => data.ProductId === ProductId);
    if (data) {
        editingProduct = true;
        
	 empProductId.value = data.ProductId;
	 empProductCaption.value = data.ProductCaption;
	 empCodeInternalProducts.value = data.CodeInternalProducts;
	 empKindProductId.value = data.KindProductId;
	 empDetailProducts.value = data.DetailProducts;
	 empPriceProduct.value = data.PriceProduct;
	 empStoreId.value = data.StoreId;
	 empStatus.checked = Boolean(data.Status);
        modalTitle.innerText = "ویرایش رکورد";
        openModal("ProductModal");
    }
}
function CanselSaveModal() {
    closeModal("ProductModal");
    resetModal();
}
function SaveNewModel() {
    
	 const ProductId = empProductId.value.trim();
	 const ProductCaption = empProductCaption.value.trim();
	 const CodeInternalProducts = empCodeInternalProducts.value.trim();
	 const KindProductId = empKindProductId.value.trim();
	 const DetailProducts = empDetailProducts.value.trim();
	 const PriceProduct = empPriceProduct.value.trim();
	 const StoreId = empStoreId.value.trim();
	 const Status = empStatus.checked;
    if (!ProductCaption || !CodeInternalProducts || !KindProductId || !DetailProducts || !PriceProduct || !StoreId) {
        alert("لطفاً تمام فیلدها را پر کنید");
        return;
    }
    if (editingProduct) { updateProduct(ProductId,ProductCaption,CodeInternalProducts,KindProductId,DetailProducts,PriceProduct,StoreId,Status); } else { addProduct(ProductId,ProductCaption,CodeInternalProducts,KindProductId,DetailProducts,PriceProduct,StoreId,Status); }
    closeModal("ProductModal");
}
function addProduct(ProductId,ProductCaption,CodeInternalProducts,KindProductId,DetailProducts,PriceProduct,StoreId,Status) {
    const newProduct = {
        ProductId,ProductCaption,CodeInternalProducts,KindProductId,DetailProducts,PriceProduct,StoreId,Status
    };
    newProduct.ProductId = 0;
    SendData(newProduct, true);
}
function updateProduct(ProductId,ProductCaption,CodeInternalProducts,KindProductId,DetailProducts,PriceProduct,StoreId,Status) {
    const idx = ProductList.findIndex(data => data.ProductId == ProductId);
    if (idx !== -1) {
        ProductList[idx] = { ProductId,ProductCaption,CodeInternalProducts,KindProductId,DetailProducts,PriceProduct,StoreId,Status };
        SendData(ProductList[idx], false);
    }
}
function SendData(newProduct, typeRequst) {
    $.post('/Products/UpdateData', newProduct, function (response) {
        if (response.isSuccess) {
            if (typeRequst) {
                ProductList.push(newProduct);
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
    
 empProductId.value = "";
 empProductCaption.value = "";
 empCodeInternalProducts.value = "";
 empKindProductId.value = "";
 empDetailProducts.value = "";
 empPriceProduct.value = "";
 empStoreId.value = "";
 empStatus.checked = false;
    modalTitle.innerText = "افزودن رکورد جدید";
}
function openModal(Modal) {
    document.getElementById(Modal).classList.add("active");
}
function closeModal(Modal) {
    document.getElementById(Modal).classList.remove("active");
}

document.getElementById("searchProduct").addEventListener("input", () => renderTable());
document.getElementById("statusFilter").addEventListener("change", () => renderTable());
modal.addEventListener("click", (e) => { if (e.target === modal) closeModal("ProductModal"); });

loadFromStorage(); renderTable();






