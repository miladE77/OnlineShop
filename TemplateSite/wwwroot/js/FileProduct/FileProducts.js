let FileProductList = [];
let editingFileProduct = false;


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
    $.post('/FileProducts/GetAllData', function (response) {
        if (response.isSuccess) {
            FileProductList = JSON.parse(response.data);
            localStorage.setItem("FileProducts", JSON.stringify(FileProductList));
            renderTable();
            nextId = Math.max(...FileProductList.map(i => i.FileProductId));
        }
        else {
            alert(response.errorTitle);
        }
    });
}
function loadFromStorage() {
    const saved = localStorage.getItem("FileProducts");
    if (saved) {
        FileProductList = JSON.parse(saved);
    }
    else saveToStorage();
}
function renderStats() {
    const total = FileProductList.length, active = FileProductList.filter(data => data.Status).length, inactive = FileProductList.filter(data => !data.Status).length;
    document.getElementById("statsCards").innerHTML = `
            <div class="stat-card"><div class="stat-info"><div class="number">${total}</div><div class="label">کل آرشیو محصولات</div></div><div class="stat-icon"><i class="fas fa-users"></i></div></div>
            <div class="stat-card"><div class="stat-info"><div class="number">${active}</div><div class="label">فعال</div></div><div class="stat-icon"><i class="fas fa-check-circle"></i></div></div>
            <div class="stat-card"><div class="stat-info"><div class="number">${inactive}</div><div class="label">غیرفعال</div></div><div class="stat-icon"><i class="fas fa-ban"></i></div></div>
        `;
}
function renderTable() {
    const searchTerm = document.getElementById("searchFileProduct").value.toLowerCase();
    const statusFilter = document.getElementById("statusFilter").value;
    let filtered = [...FileProductList];
    if (searchTerm) filtered = filtered.filter(p =>p.FileProductCaption.toLowerCase().includes(searchTerm));
    if (statusFilter !== "all") filtered = filtered.filter(p => p.Status.toString() === statusFilter);
    const tbody = document.getElementById("FileProductTableBody");
    if (filtered.length === 0) { tbody.innerHTML = `<tr class="empty-row"><td colspan="7">هیچ رکورد یافت نشد</td></tr>`; renderStats(); return; }
    tbody.innerHTML = filtered.map(data => {
        
 const statusStatus = data.Status === true ? "فعال" : "غیرفعال";
        return `<tr>
                <td>
                  <div style="display:flex;align-items:center;gap:12px;">
                    <div><strong>${data.FileProductId}</strong></div>
                  </div>
                </td>
                
 <td>${data.FileProductCaption}</td>
 <td>${data.Detail}</td>
 <td>${data.ProductCaption}</td>
 <td>${statusStatus}</td>
                <td class="action-buttons">
                    
                    <button class="action-btn edit-btn" data-id="${data.FileProductId}" title="ویرایش"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete-btn" data-id="${data.FileProductId}" title="حذف"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>`;
    }).join('');
    
    document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', (e) => { const id = parseInt(btn.dataset.id); openEditModal(id); }));
    document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', (e) => { if (confirm("حذف رکورد؟")) deleteFileProduct(parseInt(btn.dataset.id)); }));
    renderStats();
}
function deleteFileProduct(FileProductId) {
    $.post('/FileProducts/DeleteData', { 'id': FileProductId }, function (response) {
        if (response.isSuccess) {
            FileProductList = FileProductList.filter(data => data.FileProductId !== FileProductId);
            saveToStorage();
            renderTable();
            alert(response.data);
        }
        else {
            alert(response.errorTitle);
        }
    });
}
const modal = document.getElementById("FileProductModal");
const modalTitle = document.getElementById("modalTitle");
const empFileProductId = document.getElementById("FileProductId");
const empFileProduct = document.getElementById("FileProductCaption");
const empDetail = document.getElementById("Detail");
const empProductId = document.getElementById("Product");
const empStatus = document.getElementById("Status");


function openAddModal() {
    editingFileProduct = false;
    resetModal();
    openModal("FileProductModal");
}
function openEditModal(FileProductId) {
    const data = FileProductList.find(data => data.FileProductId === FileProductId);
    if (data) {
        editingFileProduct = true;
	    empFileProductId.value = data.FileProductId;
	    //empFileProductCaption.value = data.FileProductCaption;
	    empDetail.value = data.Detail;
	    empProductId.value = data.ProductId;
	    empStatus.checked = Boolean(data.Status);
        modalTitle.innerText = "ویرایش رکورد";
        openModal("FileProductModal");
    }
}
function CanselSaveModal() {
    closeModal("FileProductModal");
    resetModal();
}
function SaveNewModel() {
	 const FileProductId = empFileProductId.value.trim();
     const File = empFileProduct.files[0];
	 const Detail = empDetail.value.trim();
	 const ProductId = empProductId.value.trim();
	 const Status = empStatus.checked;
    if (!FileProductCaption || !Detail || !ProductId) {
        alert("لطفاً تمام فیلدها را پر کنید");
        return;
    }
    if (editingFileProduct) { updateFileProduct(FileProductId, File, Detail, ProductId, Status); } else { addFileProduct(FileProductId, File,Detail,ProductId,Status); }
    closeModal("FileProductModal");
}
function addFileProduct(FileProductId,File,Detail,ProductId,Status) {
    const newFileProduct = {};
    newFileProduct.FileProductId = 0;
    newFileProduct.FileProductCaption =  File.name;
    newFileProduct.Detail = Detail;
    newFileProduct.ProductId = ProductId;
    newFileProduct.Status = Status;
    newFileProduct.File = File;
    SendData(newFileProduct, true);
}
function updateFileProduct(FileProductId,File,Detail,ProductId,Status) {
    const idx = FileProductList.findIndex(data => data.FileProductId == FileProductId);
    if (idx !== -1) {
        FileProductList[idx].FileProductId = FileProductId;
        FileProductList[idx].FileProductCaption = File.name;
        FileProductList[idx].Detail = Detail;
        FileProductList[idx].ProductId = ProductId;
        FileProductList[idx].Status = Status;
        FileProductList[idx].File = File;
        SendData(FileProductList[idx], false);
    }
}
function SendData(newFileProduct, typeRequst) {
    if (newFileProduct.File.size > 400000) {
        alert("حداکثر حجم مجاز برای آپلود 400 KB است");
    }
    else {
        var type = newFileProduct.File.type.split("/")[1];
        if (type == "png" || type == "jpeg") {
            var Data = new FormData();
            Data.append('FileProductId', newFileProduct.FileProductId);
            Data.append('FileProductCaption', newFileProduct.File.name);
            Data.append('File', newFileProduct.File);
            Data.append('ProductId', newFileProduct.ProductId);
            Data.append('Detail', newFileProduct.Detail);
            Data.append('Status', newFileProduct.Status);
            $.ajax({
                type: "post",
                url: '/FileProducts/UpdateData',
                data: Data,
                contentType: false,
                processData: false,
                success: function (response) {
                    if (response.isSuccess) {
                        if (typeRequst) {
                            const newFileProduct2 = {};
                            newFileProduct2.FileProductId = newFileProduct.FileProductId;
                            newFileProduct2.FileProductCaption = newFileProduct.File.name;
                            newFileProduct2.Detail = newFileProduct.Detail;
                            newFileProduct2.ProductId = newFileProduct.ProductId;
                            newFileProduct2.Status = newFileProduct.Status;
                            FileProductList.push(newFileProduct2);
                        }
                        saveToStorage();
                        renderTable();
                        alert(response.data);
                    }
                    else {
                        alert(response.errorTitle);
                    }
                }
            });
        } else {
            alert("فرمت فایل ورودی درست نمی باشد.");
        }
    }
    
}
function resetModal() {
    
 empFileProductId.value = "";
 empFileProduct.value = "";
 empDetail.value = "";
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

document.getElementById("searchFileProduct").addEventListener("input", () => renderTable());
document.getElementById("statusFilter").addEventListener("change", () => renderTable());
modal.addEventListener("click", (e) => { if (e.target === modal) closeModal("FileProductModal"); });

loadFromStorage(); renderTable();






