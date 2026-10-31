// ═══ Orders.js ═══

/* ============================================================
   Orders.js — مدیریت سفارشات
   ------------------------------------------------------------
   - مطابق با OrderView (Product + ColorPriceProduct)
   - انتخاب محصول → فیلتر رنگ‌های همون محصول
   ============================================================ */

let OrderList = [];
let ProductList = [];
let AllColorPriceProducts = [];     // همه‌ی رنگ‌ها
let editingOrder = false;

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

// ============================================================
// دریافت محصولات + همه‌ی رنگ‌ها
// ============================================================
function GetInitialData() {
    // محصولات

    showLoading();
    Http.postSecure('/Products/GetAllData')
        .then(response => {
            if (response.isSuccess) {
                ProductList = JSON.parse(response.data);

                let options = '<option value="">انتخاب محصول</option>';
                ProductList.forEach(function (item) {
                    options += `<option value="${item.ProductId}">${item.ProductCaption || 'بدون عنوان'}</option>`;
                });
                document.getElementById("Product").innerHTML = options;
            } else {
                alert(response.errorTitle);
            }
        })
        .catch(handleHttpError)
        .finally(hideLoading);

    // همه‌ی رنگ‌بندی‌ها

    showLoading();
    Http.postSecure('/ColorPriceProducts/GetAllData')
        .then(response => {
            if (response.isSuccess) {
                AllColorPriceProducts = JSON.parse(response.data);
            } else {
                alert(response.errorTitle);
            }
        })
        .catch(handleHttpError)
        .finally(hideLoading);
}

GetInitialData();

// ============================================================
// وقتی محصول انتخاب می‌شه → رنگ‌های همون محصول رو پر کن
// ============================================================
function loadColorsByProduct(productId) {
    const colorSelect = document.getElementById("ColorPriceProduct");
    if (!colorSelect) return;

    const filtered = AllColorPriceProducts.filter(c => c.ProductId === parseInt(productId));

    let options = '<option value="">انتخاب رنگ</option>';
    filtered.forEach(function (item) {
        const price = item.PriceProduct ? ` - ${item.PriceProduct.toLocaleString()} تومان` : '';
        options += `<option value="${item.ColorPriceProductId}">${item.ColorPriceProductCaption || 'بدون رنگ'}${price}</option>`;
    });

    colorSelect.innerHTML = options;

    if (filtered.length === 0 && productId) {
        colorSelect.innerHTML = '<option value="">این محصول رنگ‌بندی ندارد</option>';
    }
}

// ============================================================
// localStorage
// ============================================================
function saveToStorage() {
    showLoading();
    Http.postSecure('/Orders/GetAllData')
        .then(response => {
            if (response.isSuccess) {
                OrderList = JSON.parse(response.data);
                localStorage.setItem("Orders", JSON.stringify(OrderList));
                renderTable();
                if (OrderList.length > 0) {
                    nextId = Math.max(...OrderList.map(i => i.OrderId));
                }
            } else {
                alert(response.errorTitle);
            }
        })
        .catch(handleHttpError)
        .finally(hideLoading);
}

function loadFromStorage() {
    const saved = localStorage.getItem("Orders");
    if (saved) {
        OrderList = JSON.parse(saved);
        renderTable();
    } else {
        saveToStorage();
    }
}

// ============================================================
// آمار
// ============================================================
function renderStats() {
    const total = OrderList.length;
    const active = OrderList.filter(d => d.Status).length;
    const inactive = OrderList.filter(d => !d.Status).length;

    document.getElementById("statsCards").innerHTML = `
        <div class="stat-card"><div class="stat-info"><div class="number">${total}</div><div class="label">کل سفارش</div></div><div class="stat-icon"><i class="fas fa-shopping-cart"></i></div></div>
        <div class="stat-card"><div class="stat-info"><div class="number">${active}</div><div class="label">فعال</div></div><div class="stat-icon"><i class="fas fa-check-circle"></i></div></div>
        <div class="stat-card"><div class="stat-info"><div class="number">${inactive}</div><div class="label">غیرفعال</div></div><div class="stat-icon"><i class="fas fa-ban"></i></div></div>
    `;
}

// ============================================================
// جدول
// ============================================================
function renderTable() {
    const searchTerm = (document.getElementById("searchOrder")?.value || "").toLowerCase();
    const statusFilter = document.getElementById("statusFilter")?.value || "all";

    let filtered = [...OrderList];

    if (searchTerm) {
        filtered = filtered.filter(p =>
            (p.OrderCaption || "").toLowerCase().includes(searchTerm) ||
            (p.ProductCaption || "").toLowerCase().includes(searchTerm) ||
            (p.ColorPriceProductCaption || "").toLowerCase().includes(searchTerm) ||
            String(p.ProductId || "").toLowerCase().includes(searchTerm)
        );
    }

    if (statusFilter !== "all") {
        filtered = filtered.filter(p => p.Status.toString() === statusFilter);
    }

    const tbody = document.getElementById("OrderTableBody");
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="7">هیچ رکورد یافت نشد</td></tr>`;
        renderStats();
        return;
    }

    tbody.innerHTML = filtered.map(data => {
        const statusText = data.Status === true ? "فعال" : "غیرفعال";
        const productName = data.ProductCaption || `#${data.ProductId}` || '—';
        const colorName = data.ColorPriceProductCaption || '—';

        return `<tr>
            <td><strong>${data.OrderId}</strong></td>
            <td>${data.OrderCaption || '—'}</td>
            <td>
                <span class="product-badge">
                    <i class="fas fa-box"></i> ${productName}
                </span>
            </td>
            <td>
                <span class="color-badge">
                    <i class="fas fa-palette"></i> ${colorName}
                </span>
            </td>
            <td>${data.NumberProduct ?? 0}</td>
            <td>${statusText}</td>
            <td class="action-buttons">
                <button class="action-btn edit-btn" data-id="${data.OrderId}" title="ویرایش"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete-btn" data-id="${data.OrderId}" title="حذف"><i class="fas fa-trash-alt"></i></button>
            </td>
        </tr>`;
    }).join('');

    document.querySelectorAll('.edit-btn').forEach(btn =>
        btn.addEventListener('click', () => openEditModal(parseInt(btn.dataset.id))));

    document.querySelectorAll('.delete-btn').forEach(btn =>
        btn.addEventListener('click', () => {
            if (confirm("حذف رکورد؟")) deleteOrder(parseInt(btn.dataset.id));
        }));

    renderStats();
}

// ============================================================
// حذف
// ============================================================
function deleteOrder(orderId) {
    showLoading();
    Http.postSecure('/Orders/DeleteData', { 'id': orderId })
        .then(response => {
            if (response.isSuccess) {
                OrderList = OrderList.filter(d => d.OrderId !== orderId);
                localStorage.setItem("Orders", JSON.stringify(OrderList));
                renderTable();
                alert(response.data);
            } else {
                alert(response.errorTitle);
            }
        })
        .catch(handleHttpError)
        .finally(hideLoading);
}

// ============================================================
// المان‌ها
// ============================================================
const modal = document.getElementById("OrderModal");
const modalTitle = document.getElementById("modalTitle");
const empOrderId = document.getElementById("OrderId");
const empOrderCaption = document.getElementById("OrderCaption");
const empProductId = document.getElementById("Product");
const empColorPriceProductId = document.getElementById("ColorPriceProduct");   // ← جدید
const empNumberProduct = document.getElementById("NumberProduct");
const empStatus = document.getElementById("Status");

// ═══ وقتی محصول عوض شد → رنگ‌ها رو لود کن ═══
if (empProductId) {
    empProductId.addEventListener("change", function () {
        loadColorsByProduct(this.value);
    });
}

// ============================================================
// افزودن / ویرایش
// ============================================================
function openAddModal() {
    editingOrder = false;
    resetModal();
    openModal("OrderModal");
}

function openEditModal(orderId) {
    const data = OrderList.find(d => d.OrderId === orderId);
    if (!data) return;

    editingOrder = true;

    empOrderId.value = data.OrderId || '';
    empOrderCaption.value = data.OrderCaption || '';
    empProductId.value = data.ProductId || '';

    // ✅ بعد از انتخاب محصول، رنگ‌های همون محصول رو لود کن
    loadColorsByProduct(data.ProductId);

    // ✅ بعد رنگ رو انتخاب کن
    if (empColorPriceProductId) {
        empColorPriceProductId.value = data.ColorPriceProductId || '';
    }

    empNumberProduct.value = data.NumberProduct ?? '';
    empStatus.checked = Boolean(data.Status);

    modalTitle.innerText = "ویرایش سفارش";
    openModal("OrderModal");
}

function CanselSaveModal() {
    closeModal("OrderModal");
    resetModal();
}

function resetModal() {
    empOrderId.value = "";
    empOrderCaption.value = "";
    empProductId.value = "";

    if (empColorPriceProductId) {
        empColorPriceProductId.innerHTML = '<option value="">ابتدا محصول را انتخاب کنید</option>';
    }

    empNumberProduct.value = "";
    empStatus.checked = false;
    modalTitle.innerText = "افزودن سفارش جدید";
}

// ============================================================
// ذخیره
// ============================================================
function SaveNewModel() {
    const OrderId = empOrderId.value.trim();
    const OrderCaption = empOrderCaption.value.trim();
    const ProductId = empProductId.value.trim();
    const ColorPriceProductId = empColorPriceProductId ? empColorPriceProductId.value.trim() : '';
    const NumberProduct = empNumberProduct.value.trim();
    const Status = empStatus.checked;

    if (!OrderCaption) { alert("لطفاً عنوان سفارش را وارد کنید"); return; }
    if (!ProductId) { alert("لطفاً محصول را انتخاب کنید"); return; }
    if (!ColorPriceProductId) { alert("لطفاً رنگ محصول را انتخاب کنید"); return; }
    if (!NumberProduct) { alert("لطفاً تعداد محصول را وارد کنید"); return; }

    if (editingOrder) {
        updateOrder(OrderId, OrderCaption, ColorPriceProductId, NumberProduct, Status);
    } else {
        addOrder(OrderId, OrderCaption, ColorPriceProductId, NumberProduct, Status);
    }

    closeModal("OrderModal");
}

function addOrder(OrderId, OrderCaption, ColorPriceProductId, NumberProduct, Status) {
    const newOrder = {
        OrderId: 0,
        OrderCaption,
        ColorPriceProductId: parseInt(ColorPriceProductId),   // ← مطابق کلاس Order
        NumberProduct: parseInt(NumberProduct),
        Status
    };
    SendData(newOrder, true);
}

function updateOrder(OrderId, OrderCaption, ColorPriceProductId, NumberProduct, Status) {
    const idx = OrderList.findIndex(d => d.OrderId == OrderId);
    if (idx === -1) return;

    const updated = {
        OrderId: parseInt(OrderId),
        OrderCaption,
        ColorPriceProductId: parseInt(ColorPriceProductId),
        NumberProduct: parseInt(NumberProduct),
        Status
    };

    OrderList[idx] = { ...OrderList[idx], ...updated };
    SendData(updated, false);
}

function SendData(order, isAdd) {
    const url = isAdd
        ? '/Orders/AddData'
        : '/Orders/UpdateData';

    showLoading();
    Http.postSecure(url, order)
        .then(response => {
            if (response.isSuccess) {
                saveToStorage();
                alert(response.data);
            } else {
                alert(response.errorTitle);
            }
        })
        .catch(handleHttpError)
        .finally(hideLoading);
}

// ============================================================
// ابزار مودال
// ============================================================
function openModal(id) {
    document.getElementById(id).classList.add("active");
}

function closeModal(id) {
    document.getElementById(id).classList.remove("active");
}

// ============================================================
// رویدادها
// ============================================================
document.getElementById("searchOrder")?.addEventListener("input", renderTable);
document.getElementById("statusFilter")?.addEventListener("change", renderTable);

if (modal) {
    modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal("OrderModal");
    });
}

// ============================================================
// شروع
// ============================================================
loadFromStorage();