// ═══ DetailProducts.js ═══

let DetailProductList = [];
let editingDetailProduct = false;

const Http = window.HttpHelper;
const UI = window.UICore;

function handleHttpError(err) {
    if (err.message === 'AUTH_REQUIRED') return;
    if (err.message === 'CSRF_OR_BAD_REQUEST') {
        alert('نشست شما منقضی شده. صفحه را رفرش کنید.');
        return;
    }
    alert('خطا در ارتباط با سرور');
}

function showLoading() { if (UI && UI.showLoading) UI.showLoading(); }
function hideLoading() { if (UI && UI.hideLoading) UI.hideLoading(); }

GetOptionProductData(); function GetOptionProductData() {
    showLoading();
    Http.postSecure('/OptionProducts/GetAllData')
        .then(response => {
            if (response.isSuccess) {
                let dataConvert = JSON.parse(response.data);
                let options = "";
                dataConvert.forEach(function (item) {
                    options = options + `<option value=\"${item.OptionProductId}\">${item.OptionProductCaption}</option>`;
                });
                document.getElementById("OptionProduct").innerHTML = options;
            }
            else {
                alert(response.errorTitle);
            }
        })
        .catch(handleHttpError)
        .finally(hideLoading);
} GetProductData(); function GetProductData() {
    showLoading();
    Http.postSecure('/Products/GetAllData')
        .then(response => {
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
        })
        .catch(handleHttpError)
        .finally(hideLoading);
}
function saveToStorage() {
    showLoading();
    Http.postSecure('/DetailProducts/GetAllData')
        .then(response => {
            if (response.isSuccess) {
                DetailProductList = JSON.parse(response.data);
                localStorage.setItem("DetailProducts", JSON.stringify(DetailProductList));
                renderTable();
                nextId = Math.max(...DetailProductList.map(i => i.DetailProductId));
            }
            else {
                alert(response.errorTitle);
            }
        })
        .catch(handleHttpError)
        .finally(hideLoading);
}
function loadFromStorage() {
    const saved = localStorage.getItem("DetailProducts");
    if (saved) {
        DetailProductList = JSON.parse(saved);
    }
    else saveToStorage();
}
function renderStats() {
    const total = DetailProductList.length, active = DetailProductList.filter(data => data.Status).length, inactive = DetailProductList.filter(data => !data.Status).length;
    document.getElementById("statsCards").innerHTML = `
            <div class="stat-card"><div class="stat-info"><div class="number">${total}</div><div class="label">کل توضیحات محصول</div></div><div class="stat-icon"><i class="fas fa-users"></i></div></div>
            <div class="stat-card"><div class="stat-info"><div class="number">${active}</div><div class="label">فعال</div></div><div class="stat-icon"><i class="fas fa-check-circle"></i></div></div>
            <div class="stat-card"><div class="stat-info"><div class="number">${inactive}</div><div class="label">غیرفعال</div></div><div class="stat-icon"><i class="fas fa-ban"></i></div></div>
        `;
}
function renderTable() {
    const searchTerm = document.getElementById("searchDetailProduct").value.toLowerCase();
    const statusFilter = document.getElementById("statusFilter").value;
    let filtered = [...DetailProductList];
    if (searchTerm) filtered = filtered.filter(p => p.DetailProductCaption.toLowerCase().includes(searchTerm) || p.OptionProductId.toLowerCase().includes(searchTerm));
    if (statusFilter !== "all") filtered = filtered.filter(p => p.Status.toString() === statusFilter);
    const tbody = document.getElementById("DetailProductTableBody");
    if (filtered.length === 0) { tbody.innerHTML = `<tr class="empty-row"><td colspan="7">هیچ رکورد یافت نشد</td></tr>`; renderStats(); return; }

    tbody.innerHTML = filtered.map(data => {

        const statusStatus = data.Status === true ? "فعال" : "غیرفعال";
        return `<tr>
                <td>
                  <div style="display:flex;align-items:center;gap:12px;">
                    <div><strong>${data.DetailProductId}</strong></div>
                  </div>
                </td>
                
 <td>${data.DetailProductCaption}</td>
 <td>${data.OptionProductCaption}</td>
 <td>${data.ProductCaption}</td>
 <td>${statusStatus}</td>
                <td class="action-buttons">
                    
                    <button class="action-btn edit-btn" data-id="${data.DetailProductId}" title="ویرایش"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete-btn" data-id="${data.DetailProductId}" title="حذف"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>`;
    }).join('');

    document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', (e) => { const id = parseInt(btn.dataset.id); openEditModal(id); }));
    document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', (e) => { if (confirm("حذف رکورد؟")) deleteDetailProduct(parseInt(btn.dataset.id)); }));
    renderStats();
}
function deleteDetailProduct(DetailProductId) {
    showLoading();
    Http.postSecure('/DetailProducts/DeleteData', { 'id': DetailProductId })
        .then(response => {
            if (response.isSuccess) {
                DetailProductList = DetailProductList.filter(data => data.DetailProductId !== DetailProductId);
                saveToStorage();
                renderTable();
                alert(response.data);
            }
            else {
                alert(response.errorTitle);
            }
        })
        .catch(handleHttpError)
        .finally(hideLoading);
}
const modal = document.getElementById("DetailProductModal");
const modalTitle = document.getElementById("modalTitle");
const empDetailProductId = document.getElementById("DetailProductId"); const empDetailProductCaption = document.getElementById("DetailProductCaption"); const empOptionProductId = document.getElementById("OptionProduct"); const empProductId = document.getElementById("Product"); const empStatus = document.getElementById("Status");

function openAddModal() {
    editingDetailProduct = false;
    resetModal();
    openModal("DetailProductModal");
}
function openEditModal(DetailProductId) {
    const data = DetailProductList.find(data => data.DetailProductId === DetailProductId);
    if (data) {
        editingDetailProduct = true;

        empDetailProductId.value = data.DetailProductId;
        empDetailProductCaption.value = data.DetailProductCaption;
        empOptionProductId.value = data.OptionProductId;
        empProductId.value = data.ProductId;
        empStatus.checked = Boolean(data.Status);
        modalTitle.innerText = "ویرایش رکورد";
        openModal("DetailProductModal");
    }
}
function CanselSaveModal() {
    closeModal("DetailProductModal");
    resetModal();
}
function SaveNewModel() {

    const DetailProductId = empDetailProductId.value.trim();
    const DetailProductCaption = empDetailProductCaption.value.trim();
    const OptionProductId = empOptionProductId.value.trim();
    const ProductId = empProductId.value.trim();
    const Status = empStatus.checked;
    if (!DetailProductCaption || !OptionProductId || !ProductId) {
        alert("لطفاً تمام فیلدها را پر کنید");
        return;
    }
    if (editingDetailProduct) { updateDetailProduct(DetailProductId, DetailProductCaption, OptionProductId, ProductId, Status); } else { addDetailProduct(DetailProductId, DetailProductCaption, OptionProductId, ProductId, Status); }
    closeModal("DetailProductModal");
}
function addDetailProduct(DetailProductId, DetailProductCaption, OptionProductId, ProductId, Status) {
    const newDetailProduct = {
        DetailProductId, DetailProductCaption, OptionProductId, ProductId, Status
    };
    newDetailProduct.DetailProductId = 0;
    SendData(newDetailProduct, true);
}
function updateDetailProduct(DetailProductId, DetailProductCaption, OptionProductId, ProductId, Status) {
    const idx = DetailProductList.findIndex(data => data.DetailProductId == DetailProductId);
    if (idx !== -1) {
        DetailProductList[idx] = { DetailProductId, DetailProductCaption, OptionProductId, ProductId, Status };
        SendData(DetailProductList[idx], false);
    }
}
function SendData(newDetailProduct, typeRequst) {
    const url = typeRequst
        ? '/DetailProducts/AddData'
        : '/DetailProducts/UpdateData';

    showLoading();
    Http.postSecure(url, newDetailProduct)
        .then(response => {
            if (response.isSuccess) {
                if (typeRequst) {
                    DetailProductList.push(newDetailProduct);
                }
                saveToStorage();
                renderTable();
                alert(response.data);
            }
            else {
                alert(response.errorTitle);
            }
        })
        .catch(handleHttpError)
        .finally(hideLoading);
}
function resetModal() {

    empDetailProductId.value = "";
    empDetailProductCaption.value = "";
    empOptionProductId.value = "";
    empProductId.value = "";
    empStatus.checked = false;
    modalTitle.innerText = "افزودن رکورد جدید";
}
function openModal(Modal) {
    document.getElementById(Modal).classList.add("active");
}
function closeModal(Modal) {
    document.getElementById(Modal).classList.remove("active");
}

document.getElementById("searchDetailProduct").addEventListener("input", () => renderTable());
document.getElementById("statusFilter").addEventListener("change", () => renderTable());
modal.addEventListener("click", (e) => { if (e.target === modal) closeModal("DetailProductModal"); });

loadFromStorage(); renderTable();