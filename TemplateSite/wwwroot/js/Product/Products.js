


let optionProducts = [];
let kindProducts = [];
let products = [];

let nextProductId = 3;
let nextColorId = 5;
let nextFileId = 4;
let nextDetailId = 5;
let nextOptionId = 8;

// ============================================================
// ذخیره در localStorage
// ============================================================

GetKindProductData(); function GetKindProductData() {
    $.post('/KindProducts/GetAllData', function (response) {
        if (response.isSuccess) {
            let dataConvert = JSON.parse(response.data);
            kindProducts = dataConvert;
            populateKindSelect();
            GetOptionProductsData();
        }
        else {
            alert(response.errorTitle);
        }
    });
}
function GetOptionProductsData() {
    $.post('/OptionProducts/GetAllData', function (response) {
        if (response.isSuccess) {
            let dataConvert = JSON.parse(response.data);
            optionProducts = dataConvert;
            loadFromServer();
        }
        else {
            alert(response.errorTitle);
        }
    });
}

function loadFromServer() {
    $.post('/Products/GetAllData', function (response) {
        if (response.isSuccess) {
            products = JSON.parse(response.data);
            renderProductsTable();
        }
        else {
            alert(response.errorTitle);
        }
    });
}

// ============================================================
// توابع کمکی
// ============================================================

function getKindName(id) {
    const k = kindProducts.find(k => k.KindProductId === id);
    return k ? k.KindProductCaption : "بدون دسته";
}

function getOptionName(id) {
    const o = optionProducts.find(o => o.OptionProductId === id);
    return o ? o.OptionProductCaption : "نامشخص";
}



function getOptionsByKind(kindId) {
    return optionProducts.filter(o => o.KindProductId === kindId && o.Status === true);
}

// ============================================================
// رندر جدول
// ============================================================

function renderStats() {
    const total = products.length;
    const active = products.filter(p => p.Status === true).length;
    const inactive = products.filter(p => p.Status === false).length;
    const totalColors = products.reduce((sum, p) => sum + (p.Colors ? p.Colors.length : 0), 0);
    const totalFiles = products.reduce((sum, p) => sum + (p.Files ? p.Files.length : 0), 0);
    const totalDetails = products.reduce((sum, p) => sum + (p.Details ? p.Details.length : 0), 0);
    document.getElementById("statsCards").innerHTML = `
                <div class="stat-card"><div class="stat-info"><div class="number">${total}</div><div class="label">کل محصولات</div></div><div class="stat-icon"><i class="fas fa-box"></i></div></div>
                <div class="stat-card"><div class="stat-info"><div class="number">${active}</div><div class="label">فعال</div></div><div class="stat-icon"><i class="fas fa-check-circle"></i></div></div>
                <div class="stat-card"><div class="stat-info"><div class="number">${inactive}</div><div class="label">غیرفعال</div></div><div class="stat-icon"><i class="fas fa-ban"></i></div></div>
                <div class="stat-card"><div class="stat-info"><div class="number">${totalColors}</div><div class="label">رنگ‌بندی</div></div><div class="stat-icon"><i class="fas fa-palette"></i></div></div>
                <div class="stat-card"><div class="stat-info"><div class="number">${totalFiles}</div><div class="label">تصاویر</div></div><div class="stat-icon"><i class="fas fa-images"></i></div></div>
                <div class="stat-card"><div class="stat-info"><div class="number">${totalDetails}</div><div class="label">توضیحات</div></div><div class="stat-icon"><i class="fas fa-list-ul"></i></div></div>
            `;
}

function renderProductsTable() {
    const searchTerm = document.getElementById("searchProduct").value.toLowerCase();
    const kindFilter = document.getElementById("kindFilter").value;
    const statusFilter = document.getElementById("statusFilter").value;

    let filtered = [...products];
    if (searchTerm) {
        filtered = filtered.filter(p =>
            p.ProductCaption.toLowerCase().includes(searchTerm) ||
            (p.CodeInternalProducts && p.CodeInternalProducts.toLowerCase().includes(searchTerm)) ||
            getKindName(p.KindProductId).toLowerCase().includes(searchTerm)
        );
    }
    if (kindFilter !== "all") {
        filtered = filtered.filter(p => p.KindProductId === parseInt(kindFilter));
    }
    if (statusFilter !== "all") {
        filtered = filtered.filter(p => p.Status === (statusFilter === "active"));
    }

    const tbody = document.getElementById("productsTableBody");
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="7">هیچ محصولی یافت نشد</td></tr>`;
        renderStats();
        return;
    }

    let html = '';
    filtered.forEach(p => {
        const statusClass = p.Status ? "status-active" : "status-inactive";
        const statusText = p.Status ? "فعال" : "غیرفعال";
        const price = p.PriceProduct ? p.PriceProduct.toLocaleString() : "—";
        const kindName = getKindName(p.KindProductId);
        const hasChildren = (p.Colors && p.Colors.length > 0) || (p.Files && p.Files.length > 0) || (p
            .Details && p.Details.length > 0);

        html += `
                    <tr class="product-row" data-id="${p.ProductId}" id="row-${p.ProductId}">
                        <td><button class="action-btn expand-btn" data-id="${p.ProductId}"><i class="fas ${hasChildren ? 'fa-chevron-down' : 'fa-plus-circle'}"></i></button></td>
                        <td><strong>${p.ProductCaption}</strong></td>
                        <td>${p.CodeInternalProducts || '—'}</td>
                        <td>${kindName}</td>
                        <td>${price}</td>
                        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                        <td class="action-buttons">
                            <button class="action-btn toggle-status-btn" data-id="${p.ProductId}" title="تغییر وضعیت"><i class="fas ${p.Status ? 'fa-eye-slash' : 'fa-eye'}"></i></button>
                            <button class="action-btn edit-btn" data-id="${p.ProductId}" title="ویرایش"><i class="fas fa-edit"></i></button>
                            <button class="action-btn delete-btn" data-id="${p.ProductId}" title="حذف"><i class="fas fa-trash-alt"></i></button>
                        </td>
                    </tr>
                `;

        // زیرمجموعه‌ها (expand)
        html += `
                    <tr class="sub-row" id="sub-${p.ProductId}" style="display:none;">
                        <td colspan="7">
                            <div class="sub-content">
                                <div class="sub-section">
                                    <h4><i class="fas fa-palette"></i> رنگ‌بندی (ColorPriceProduct)</h4>
                                    <div class="sub-items" id="colors-${p.ProductId}">
                                        ${(p.Colors || []).map(c => `
                                            <div class="sub-item">
                                                <span>${c.ColorPriceProductCaption}</span>
                                                <span style="color:var(--primary);font-weight:600;">${c.PriceProduct ? c.PriceProduct.toLocaleString() : '—'}</span>
                                                <span style="font-size:0.7rem;">موجودی: ${c.InStore ?? '—'}</span>
                                                <button class="remove-sub" data-type="color" data-id="${c.ColorPriceProductId}" data-product="${p.ProductId}"><i class="fas fa-times-circle"></i></button>
                                            </div>
                                        `).join('')}
                                        <button class="add-sub-btn" data-type="color" data-product="${p.ProductId}"><i class="fas fa-plus"></i> افزودن رنگ</button>
                                    </div>
                                </div>

                                <div class="sub-section">
                                    <h4><i class="fas fa-images"></i> تصاویر (FileProduct)</h4>
                                    <div class="sub-items" id="files-${p.ProductId}">
                                        ${(p.Files || []).map(f => `
                                            <div class="sub-item">
                                                <img src="/Images/Product/${f.CodeFileProduct}" alt="${f.FileProductCaption}" onerror="this.src='https://picsum.photos/id/20/100/100'" style='width: 50px;'>
                                                <span>${f.FileProductCaption}</span>
                                                <button class="remove-sub" data-type="file" data-id="${f.FileProductId}" data-product="${p.ProductId}"><i class="fas fa-times-circle"></i></button>
                                            </div>
                                        `).join('')}
                                        <button class="add-sub-btn" data-type="file" data-product="${p.ProductId}"><i class="fas fa-plus"></i> افزودن تصویر</button>
                                    </div>
                                </div>

                                <div class="sub-section">
                                    <h4><i class="fas fa-list-ul"></i> توضیحات (DetailProduct) با مشخصه فنی</h4>
                                    <div class="sub-items" id="details-${p.ProductId}">
                                        ${(p.Details || []).map(d => `
                                            <div class="sub-item">
                                                <span style="font-weight:600;">${getOptionName(d.OptionProductId)}:</span>
                                                <span>${d.DetailProductCaption}</span>
                                                <button class="remove-sub" data-type="detail" data-id="${d.DetailProductId}" data-product="${p.ProductId}"><i class="fas fa-times-circle"></i></button>
                                            </div>
                                        `).join('')}
                                        <button class="add-sub-btn" data-type="detail" data-product="${p.ProductId}"><i class="fas fa-plus"></i> افزودن توضیحات</button>
                                    </div>
                                </div>
                            </div>
                        </td>
                    </tr>
                `;
    });

    tbody.innerHTML = html;
    renderStats();

    // رویدادها
    attachEvents();
}

// ============================================================
// رویدادها
// ============================================================

function attachEvents() {
    // Expand/Collapse
    document.querySelectorAll('.expand-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            const id = parseInt(this.dataset.id);
            const subRow = document.getElementById(`sub-${id}`);
            if (subRow.style.display === 'none') {
                subRow.style.display = 'table-row';
                this.innerHTML = '<i class="fas fa-chevron-up"></i>';
            } else {
                subRow.style.display = 'none';
                this.innerHTML = '<i class="fas fa-chevron-down"></i>';
            }
        });
    });

    // Toggle Status
    document.querySelectorAll('.toggle-status-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            const id = parseInt(this.dataset.id);
            toggleProductStatus(id);
        });
    });

    // Edit Product
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            const id = parseInt(this.dataset.id);
            openEditProductModal(id);
        });
    });

    // Delete Product
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            const id = parseInt(this.dataset.id);
            if (confirm("آیا از حذف این محصول اطمینان دارید؟")) {
                deleteProduct(id);
            }
        });
    });

    // Add Sub buttons
    document.querySelectorAll('.add-sub-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            const type = this.dataset.type;
            const productId = parseInt(this.dataset.product);
            if (type === 'color') openColorModal(productId);
            else if (type === 'file') openFileModal(productId);
            else if (type === 'detail') openDetailModal(productId);
        });
    });

    // Remove Sub
    document.querySelectorAll('.remove-sub').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            const type = this.dataset.type;
            const id = parseInt(this.dataset.id);
            const productId = parseInt(this.dataset.product);
            if (confirm("حذف این آیتم؟")) {
                removeSubItem(type, id, productId);
            }
        });
    });
}

// ============================================================
// عملیات CRUD محصول
// ============================================================

function toggleProductStatus(id) {
    const p = products.find(p => p.ProductId === id);
    if (p) {
        p.Status = !p.Status;
        renderProductsTable();
    }
}

function deleteProduct(id) {
    $.post('/Products/DeleteData', { 'id': id }, function (response) {
        if (response.isSuccess) {
            alert(response.data);
            products = products.filter(p => p.ProductId !== id);
            renderProductsTable();
        }
        else {
            alert(response.errorTitle);
        }
    });
}

function addProduct(caption, code, kindId, price, status) {
    const newProduct = {
        ProductId: 0,
        ProductCaption: caption,
        CodeInternalProducts: code || null,
        KindProductId: parseInt(kindId),
        DetailProducts: null,
        PriceProduct: price ? parseInt(price) : null,
        StoreId: 1,
        Status: status === "true",
        Colors: [],
        Files: [],
        Details: []
    };
    $.post('/Products/UpdateData', newProduct, function (response) {
        if (response.isSuccess) {
            alert(response.data);
            product.push(newProduct);
            loadFromServer();
        }
        else {
            alert(response.errorTitle);
        }
    });
}

function updateProduct(id, caption, code, kindId, price, status) {
    const idx = products.findIndex(p => p.ProductId === id);
    if (idx !== -1) {
        products[idx] = {
            ...products[idx],
            ProductCaption: caption,
            CodeInternalProducts: code || null,
            KindProductId: parseInt(kindId),
            PriceProduct: price ? parseInt(price) : null,
            Status: status === "true"
        };
        $.post('/Products/UpdateData', products[idx], function (response) {
            if (response.isSuccess) {
                alert(response.data);
                loadFromServer();
            }
            else {
                alert(response.errorTitle);
            }
        });
    }
}

// ============================================================
// عملیات زیرمجموعه‌ها
// ============================================================

function removeSubItem(type, id, productId) {
    const product = products.find(p => p.ProductId === productId);
    if (!product) return;
    if (type === 'color') {
        $.post('/ColorPriceProducts/DeleteData', { 'id': id }, function (response) {
            if (response.isSuccess) {
                alert(response.data);
                product.Colors = (product.Colors || []).filter(c => c.ColorPriceProductId !== id);
                renderProductsTable();
            }
            else {
                alert(response.errorTitle);
            }
        });
    } else if (type === 'file') {
        $.post('/FileProducts/DeleteData', { 'id': id }, function (response) {
            if (response.isSuccess) {
                alert(response.data);
                product.Files = (product.Files || []).filter(f => f.FileProductId !== id);
                renderProductsTable();
            }
            else {
                alert(response.errorTitle);
            }
        });
        
    } else if (type === 'detail') {
        $.post('/DetailProducts/DeleteData', { 'id': id }, function (response) {
            if (response.isSuccess) {
                alert(response.data);
                product.Details = (product.Details || []).filter(d => d.DetailProductId !== id);
                renderProductsTable();
            }
            else {
                alert(response.errorTitle);
            }
        });
        
    }
    
}

function addColor(productId, caption, price, offer, stock, status) {
    const product = products.find(p => p.ProductId === productId);
    if (!product) return;
    if (!product.Colors) product.Colors = [];
    newColor = {
        ProductId: productId,
        ColorPriceProductId: 0,
        ColorPriceProductCaption: caption,
        PriceProduct: price ? parseInt(price) : null,
        Offer: offer ? parseInt(offer) : 0,
        InStore: stock ? parseInt(stock) : null,
        Status: status === "true"
    }
    $.post('/ColorPriceProducts/UpdateData', newColor, function (response) {
        if (response.isSuccess) {
            alert(response.data);
            product.Colors.push(newColor);
            loadFromServer();
        }
        else {
            alert(response.errorTitle);
        }
    });
    
}

function addFile(productId, FileProduct, status) {
    const product = products.find(p => p.ProductId === productId);
    if (!product) return;
    if (!product.Files) product.Files = [];
    if (FileProduct.size > 400000) {
        alert("حداکثر حجم مجاز برای آپلود 400 KB است");
    }
    else {
        var type = FileProduct.type.split("/")[1];
        if (type == "png" || type == "jpeg") {
            var Data = new FormData();
            Data.append('FileProductId', 0);
            Data.append('File', FileProduct );
            Data.append('ProductId', productId);
            Data.append('Status', status === "true");
            $.ajax({
                type: "post",
                url: '/FileProducts/UpdateData',
                data: Data,
                contentType: false,
                processData: false,
                success: function (response) {
                    if (response.isSuccess) {
                        alert(response.data);
                        const newFile = {};
                        newFile.FileProductId = 0;
                        newFile.FileProductCaption = FileProduct.name;
                        newFile.File = FileProduct;
                        newFile.Status = status === "true";
                        product.Files.push(newFile);
                        loadFromServer();
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

function addDetail(productId, optionId, caption, status) {
    const product = products.find(p => p.ProductId === productId);
    if (!product) return;
    if (!product.Details) product.Details = [];
    newDetail = {
        productId: productId,
        DetailProductId: 0,
        DetailProductCaption: caption,
        OptionProductId: parseInt(optionId),
        ProductId: productId,
        Status: status === "true"
    }
    $.post('/DetailProducts/UpdateData', newDetail, function (response) {
        if (response.isSuccess) {
            alert(response.data);
            product.Details.push(newDetail);
            loadFromServer();
        }
        else {
            alert(response.errorTitle);
        }
    });
}

// ============================================================
// مودال‌ها
// ============================================================

// ----- مودال محصول اصلی -----
const productModal = document.getElementById("productModal");
const modalTitle = document.getElementById("modalTitle");
const prodCaption = document.getElementById("prodCaption");
const prodCode = document.getElementById("prodCode");
const prodKind = document.getElementById("prodKind");
const prodPrice = document.getElementById("prodPrice");
const prodStatus = document.getElementById("prodStatus");
let editingProductId = null;

function populateKindSelect() {
    prodKind.innerHTML = '<option value="">انتخاب دسته‌بندی *</option>';
    kindProducts.forEach(k => {
        if (k.ParentKindProductId) {
            prodKind.innerHTML += `<option value="${k.KindProductId}">${k.KindProductCaption}</option>`;
        }
    });
    // فیلتر دسته‌بندی
    const kindFilter = document.getElementById("kindFilter");
    kindFilter.innerHTML = '<option value="all">همه دسته‌بندی‌ها</option>';
    kindProducts.forEach(k => {
        if (k.ParentKindProductId) {
            kindFilter.innerHTML += `<option value="${k.KindProductId}">${k.KindProductCaption}</option>`;
        }
    });
}

function resetProductModal() {
    prodCaption.value = "";
    prodCode.value = "";
    prodKind.value = "";
    prodPrice.value = "";
    prodStatus.value = "true";
    editingProductId = null;
    modalTitle.innerText = "افزودن محصول جدید";
}

function openProductModal() {
    resetProductModal();
    productModal.classList.add("active");
}

function openEditProductModal(id) {
    const p = products.find(p => p.ProductId === id);
    if (p) {
        prodCaption.value = p.ProductCaption;
        prodCode.value = p.CodeInternalProducts || "";
        prodKind.value = p.KindProductId;
        prodPrice.value = p.PriceProduct || "";
        prodStatus.value = p.Status ? "true" : "false";
        editingProductId = p.ProductId;
        modalTitle.innerText = "ویرایش محصول";
        productModal.classList.add("active");
    }
}

function closeProductModal() {
    productModal.classList.remove("active");
    resetProductModal();
}

function saveProductHandler() {
    const caption = prodCaption.value.trim();
    const code = prodCode.value.trim();
    const kindId = prodKind.value;
    const price = prodPrice.value.trim();
    const status = prodStatus.value;
    if (!caption) { alert("لطفاً نام محصول را وارد کنید"); return; }
    if (!kindId) { alert("لطفاً دسته‌بندی را انتخاب کنید"); return; }
    if (editingProductId !== null) {
        updateProduct(editingProductId, caption, code, kindId, price, status);
    } else {
        addProduct(caption, code, kindId, price, status);
    }
    closeProductModal();
}

document.getElementById("openProductModal").addEventListener("click", openProductModal);
document.getElementById("saveProductBtn").addEventListener("click", saveProductHandler);
document.getElementById("closeProductModal").addEventListener("click", closeProductModal);
productModal.addEventListener("click", (e) => { if (e.target === productModal) closeProductModal(); });

// ----- مودال رنگ -----
const colorModal = document.getElementById("colorModal");
const colorCaption = document.getElementById("colorCaption");
const colorPrice = document.getElementById("colorPrice");
const colorOffer = document.getElementById("colorOffer");
const colorStock = document.getElementById("colorStock");
const colorStatus = document.getElementById("colorStatus");
const colorProductId = document.getElementById("colorProductId");

function openColorModal(productId) {
    colorCaption.value = "";
    colorPrice.value = "";
    colorOffer.value = "";
    colorStock.value = "";
    colorStatus.value = "true";
    colorProductId.value = productId;
    document.getElementById("colorModalTitle").innerText = "افزودن رنگ به محصول";
    colorModal.classList.add("active");
}

function closeColorModal() {
    colorModal.classList.remove("active");
}

document.getElementById("saveColorBtn").addEventListener("click", function () {
    const productId = parseInt(colorProductId.value);
    const caption = colorCaption.value.trim();
    const price = colorPrice.value.trim();
    const offer = colorOffer.value.trim();
    const stock = colorStock.value.trim();
    const status = colorStatus.value;
    if (!caption) { alert("لطفاً نام رنگ را وارد کنید"); return; }
    addColor(productId, caption, price, offer, stock, status);
    closeColorModal();
});
document.getElementById("closeColorModal").addEventListener("click", closeColorModal);
colorModal.addEventListener("click", (e) => { if (e.target === colorModal) closeColorModal(); });

// ----- مودال تصویر -----
const fileModal = document.getElementById("fileModal");
const empFileProduct = document.getElementById("FileProduct");
const fileStatus = document.getElementById("fileStatus");
const fileProductId = document.getElementById("fileProductId");

function openFileModal(productId) {
    empFileProduct.value = "";
    fileStatus.value = "true";
    fileProductId.value = productId;
    document.getElementById("fileModalTitle").innerText = "افزودن تصویر به محصول";
    fileModal.classList.add("active");
}

function closeFileModal() {
    fileModal.classList.remove("active");
}

document.getElementById("saveFileBtn").addEventListener("click", function () {
    const productId = parseInt(fileProductId.value);
    const FileProduct = empFileProduct.files[0];
    const status = fileStatus.value;
    if (!FileProduct) { alert("لطفاً تصویر را وارد کنید"); return; }
    addFile(productId, FileProduct, status);
    closeFileModal();
});
document.getElementById("closeFileModal").addEventListener("click", closeFileModal);
fileModal.addEventListener("click", (e) => { if (e.target === fileModal) closeFileModal(); });

// ----- مودال توضیحات با انتخاب OptionProduct -----
const detailModal = document.getElementById("detailModal");
const detailOptionSelect = document.getElementById("detailOptionSelect");
const detailCaptionInput = document.getElementById("detailCaption");
const detailStatusSelect = document.getElementById("detailStatus");
const detailProductIdHidden = document.getElementById("detailProductId");
let currentDetailProductId = null;

function populateOptionSelect(kindId) {
    detailOptionSelect.innerHTML = '<option value="">انتخاب مشخصه فنی *</option>';
    const options = getOptionsByKind(kindId);
    options.forEach(o => {
        detailOptionSelect.innerHTML +=
            `<option value="${o.OptionProductId}">${o.OptionProductCaption}</option>`;
    });
    if (options.length === 0) {
        detailOptionSelect.innerHTML +=
            `<option value="" disabled>هیچ مشخصه‌ای برای این دسته تعریف نشده است</option>`;
    }
}

function openDetailModal(productId) {
    const product = products.find(p => p.ProductId === productId);
    if (!product) return;
    currentDetailProductId = productId;
    detailCaptionInput.value = "";
    detailStatusSelect.value = "true";
    detailProductIdHidden.value = productId;
    // پر کردن لیست مشخصه‌ها بر اساس دسته‌بندی محصول
    populateOptionSelect(product.KindProductId);
    document.getElementById("detailModalTitle").innerText = `افزودن توضیحات به "${product.ProductCaption}"`;
    detailModal.classList.add("active");
}

function closeDetailModal() {
    detailModal.classList.remove("active");
    currentDetailProductId = null;
}

document.getElementById("saveDetailBtn").addEventListener("click", function () {
    const productId = parseInt(detailProductIdHidden.value);
    const optionId = detailOptionSelect.value;
    const caption = detailCaptionInput.value.trim();
    const status = detailStatusSelect.value;
    if (!optionId) { alert("لطفاً مشخصه فنی را انتخاب کنید"); return; }
    if (!caption) { alert("لطفاً مقدار مشخصه را وارد کنید"); return; }
    addDetail(productId, optionId, caption, status);
    closeDetailModal();
});

document.getElementById("closeDetailModal").addEventListener("click", closeDetailModal);
detailModal.addEventListener("click", (e) => { if (e.target === detailModal) closeDetailModal(); });

// ============================================================
// جستجو و فیلتر
// ============================================================

document.getElementById("searchProduct").addEventListener("input", () => renderProductsTable());
document.getElementById("kindFilter").addEventListener("change", () => renderProductsTable());
document.getElementById("statusFilter").addEventListener("change", () => renderProductsTable());



