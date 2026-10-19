/* ============================================================
   Recommendationss.js — مدیریت جامع سفارشات (Master-Detail)
   ------------------------------------------------------------
   - Master: Recommendations
   - Detail: Order (محصولات) + Receipt (رسیدها)
   - Expand/Collapse مثل Products
   - تقویم شمسی روی DateTimeRecord و DateTimePeyment
   - ✅ async/await برای همه‌ی درخواست‌های سرور
   ============================================================ */

let RecommendationsList = [];
let ProductsData = [];
let ColorPriceProductsData = [];
let TypePeymentsData = [];
let PersonelsData = [];
let editingRecommendation = false;
let currentRecommendationId = null;

// ============================================================
// ★★★ ابزار: تبدیل $.post به Promise ★★★
// ============================================================
function post(url, data = {}) {
    return new Promise((resolve, reject) => {
        $.post(url, data)
            .done(function (response) {
                resolve(response);
            })
            .fail(function (xhr, status, error) {
                reject(new Error(error || 'خطا در ارتباط با سرور'));
            });
    });
}

// ============================================================
// ★★★ ابزار: تبدیل $.ajax به Promise (برای FormData) ★★★
// ============================================================
function postForm(url, formData) {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: url,
            type: 'POST',
            data: formData,
            contentType: false,
            processData: false,
            success: resolve,
            error: function (xhr, status, error) {
                reject(new Error(error || 'خطا در ارتباط با سرور'));
            }
        });
    });
}

// ============================================================
// ابزار: تبدیل تاریخ
// ============================================================
function toJalaliString(gregorianValue) {
    if (!gregorianValue) return '';
    if (window.PersianDateHelper && window.PersianDateHelper.toJalali) {
        return window.PersianDateHelper.toJalali(gregorianValue);
    }
    return gregorianValue;
}

function getDateFa(data, gregorianField, jalaliField) {
    if (data[jalaliField]) return data[jalaliField];
    if (data[gregorianField] && window.PersianDateHelper) {
        return window.PersianDateHelper.toJalali(data[gregorianField]);
    }
    return '—';
}

// ============================================================
// ابزار: مرحله سفارش
// ============================================================
function getLevelOrderText(level) {
    const levels = {
        2: 'ثبت سفارش', 3: 'پرداخت', 4: 'پردازش سفارش',
        5: 'بسته‌بندی و ارسال', 6: 'تحویل محصول به پست', 7: 'تحویل مشتری'
    };
    return levels[level] || 'نامشخص';
}

// ============================================================
// ★★★ بارگذاری داده‌های اولیه (موازی و با await) ★★★
// ============================================================
async function LoadInitialData() {
    try {
        // همه‌ی درخواست‌ها رو موازی بفرست
        const [
            productsRes,
            colorsRes,
            typesRes,
            personelsRes
        ] = await Promise.all([
            post('/Products/GetAllData'),
            post('/ColorPriceProducts/GetAllData'),
            post('/TypePeyments/GetAllData'),
            post('/Personels/GetAllData')
        ]);

        // ── محصولات ──
        if (productsRes.isSuccess) {
            ProductsData = JSON.parse(productsRes.data);
            populateOrderProducts(ProductsData);
        } else {
            console.warn('خطا در محصولات:', productsRes.errorTitle);
        }

        // ── رنگ‌ها ──
        if (colorsRes.isSuccess) {
            ColorPriceProductsData = JSON.parse(colorsRes.data);
        } else {
            console.warn('خطا در رنگ‌ها:', colorsRes.errorTitle);
        }

        // ── نوع پرداخت ──
        if (typesRes.isSuccess) {
            TypePeymentsData = JSON.parse(typesRes.data);
            populateTypePeyments(TypePeymentsData);
        } else {
            console.warn('خطا در نوع پرداخت:', typesRes.errorTitle);
        }

        // ── پرسنل ──
        if (personelsRes.isSuccess) {
            PersonelsData = JSON.parse(personelsRes.data);
            populatePersonels(PersonelsData);
        } else {
            console.warn('خطا در پرسنل:', personelsRes.errorTitle);
        }

        console.log('✅ LoadInitialData تکمیل شد');
    } catch (err) {
        console.error('❌ خطا در LoadInitialData:', err);
        alert('خطا در بارگذاری داده‌های اولیه');
    }
}

// ============================================================
// پر کردن Dropdown ها
// ============================================================
function populateOrderProducts(products) {
    const el = document.getElementById("orderProduct");
    if (!el) return;
    let options = '<option value="">انتخاب محصول</option>';
    products.forEach(item => {
        options += `<option value="${item.ProductId}">${item.ProductCaption || 'بدون عنوان'}</option>`;
    });
    el.innerHTML = options;
}

function populateTypePeyments(types) {
    const el = document.getElementById("receiptTypePeyment");
    if (!el) return;
    let options = '<option value="">انتخاب نوع پرداخت</option>';
    types.forEach(item => {
        options += `<option value="${item.TypePeymentId}">${item.TypePeymentCaption}</option>`;
    });
    el.innerHTML = options;
}

function populatePersonels(personels) {
    const el = document.getElementById("Personel");
    if (!el) return;
    let options = '<option value="">انتخاب سفارش دهنده</option>';
    personels.forEach(item => {
        const fullName = `${item.FirstName || ''} ${item.LastName || ''}`.trim();
        options += `<option value="${item.PersonelId}">${fullName || item.PersonelId}</option>`;
    });
    el.innerHTML = options;
}

// ============================================================
// رنگ‌های یک محصول
// ============================================================
function loadColorsForOrder(productId) {
    const colorSelect = document.getElementById("orderColor");
    if (!colorSelect) return;

    const filtered = ColorPriceProductsData.filter(c => c.ProductId === parseInt(productId));

    let options = '<option value="">انتخاب رنگ</option>';
    filtered.forEach(item => {
        const price = item.PriceProduct ? ` - ${item.PriceProduct.toLocaleString()} تومان` : '';
        options += `<option value="${item.ColorPriceProductId}">${item.ColorPriceProductCaption || 'بدون رنگ'}${price}</option>`;
    });
    colorSelect.innerHTML = options;

    if (filtered.length === 0 && productId) {
        colorSelect.innerHTML = '<option value="">این محصول رنگ‌بندی ندارد</option>';
    }
}

// ============================================================
// ★★★ localStorage — Recommendations (با await) ★★★
// ============================================================
async function saveToStorage() {
    try {
        const response = await post('/Recommendationss/GetAllData');
        if (response.isSuccess) {
            RecommendationsList = JSON.parse(response.data);
            localStorage.setItem("Recommendationss", JSON.stringify(RecommendationsList));
            renderTable();
            console.log(`✅ ${RecommendationsList.length} سفارش بارگذاری شد`);
        } else {
            alert(response.errorTitle);
        }
    } catch (err) {
        console.error('❌ خطا در saveToStorage:', err);
        alert('خطا در دریافت سفارشات از سرور');
    }
}

function loadFromStorage() {
    const saved = localStorage.getItem("Recommendationss");
    if (saved) {
        try {
            RecommendationsList = JSON.parse(saved);
            renderTable();
            console.log(`📦 ${RecommendationsList.length} سفارش از localStorage`);
        } catch (e) {
            console.error('❌ localStorage خراب:', e);
            localStorage.removeItem("Recommendationss");
            saveToStorage();
        }
    } else {
        saveToStorage();
    }
}

// ============================================================
// آمار
// ============================================================
function renderStats() {
    const total = RecommendationsList.length;
    const active = RecommendationsList.filter(d => d.Status).length;
    const inactive = RecommendationsList.filter(d => !d.Status).length;
    const totalOrders = RecommendationsList.reduce((sum, r) =>
        sum + (r.OrderId ? r.OrderId.length : 0), 0);
    const totalReceipts = RecommendationsList.reduce((sum, r) =>
        sum + (r.ReceiptId ? r.ReceiptId.length : 0), 0);

    document.getElementById("statsCards").innerHTML = `
        <div class="stat-card"><div class="stat-info"><div class="number">${total}</div><div class="label">کل سفارشات</div></div><div class="stat-icon"><i class="fas fa-shopping-bag"></i></div></div>
        <div class="stat-card"><div class="stat-info"><div class="number">${active}</div><div class="label">فعال</div></div><div class="stat-icon"><i class="fas fa-check-circle"></i></div></div>
        <div class="stat-card"><div class="stat-info"><div class="number">${inactive}</div><div class="label">غیرفعال</div></div><div class="stat-icon"><i class="fas fa-ban"></i></div></div>
        <div class="stat-card"><div class="stat-info"><div class="number">${totalOrders}</div><div class="label">محصولات سفارش</div></div><div class="stat-icon"><i class="fas fa-box"></i></div></div>
        <div class="stat-card"><div class="stat-info"><div class="number">${totalReceipts}</div><div class="label">رسیدهای پرداخت</div></div><div class="stat-icon"><i class="fas fa-receipt"></i></div></div>
    `;
}

// ============================================================
// ابزار: پیدا کردن محصول و رنگ
// ============================================================
function getProductInfoByColorId(colorPriceProductId) {
    const color = ColorPriceProductsData.find(c => c.ColorPriceProductId === colorPriceProductId);
    if (!color) return { productCaption: '—', colorCaption: '—', price: 0 };

    const product = ProductsData.find(p => p.ProductId === color.ProductId);

    return {
        productCaption: product ? product.ProductCaption : `#${color.ProductId}`,
        colorCaption: color.ColorPriceProductCaption || '—',
        price: color.PriceProduct || 0
    };
}

// ============================================================
// جدول (Master + Expand) — بدون تغییر
// ============================================================
function renderTable() {
    const searchTerm = (document.getElementById("searchRecommendations")?.value || "").toLowerCase();
    const statusFilter = document.getElementById("statusFilter")?.value || "all";
    const levelFilter = document.getElementById("levelFilter")?.value || "all";

    let filtered = [...RecommendationsList];

    if (searchTerm) {
        filtered = filtered.filter(p =>
            (p.RecommendationsCaption || "").toLowerCase().includes(searchTerm) ||
            (p.Command || "").toLowerCase().includes(searchTerm)
        );
    }

    if (statusFilter !== "all") {
        filtered = filtered.filter(p => p.Status.toString() === statusFilter);
    }

    if (levelFilter !== "all") {
        filtered = filtered.filter(p => p.LevelOrder === parseInt(levelFilter));
    }

    const tbody = document.getElementById("RecommendationsTableBody");
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="8">هیچ رکوردی یافت نشد</td></tr>`;
        renderStats();
        return;
    }

    let html = '';
    filtered.forEach(rec => {
        const statusText = rec.Status === true ? "فعال" : "غیرفعال";
        const statusClass = rec.Status ? "status-active" : "status-inactive";
        const dateFa = getDateFa(rec, 'DateTimeRecord', 'DateTimeRecordFa');
        const levelText = getLevelOrderText(rec.LevelOrder);
        const personelName = `${rec.FirstName || ''} ${rec.LastName || ''}`.trim() || '—';
        const ordersCount = rec.OrderId ? rec.OrderId.length : 0;
        const receiptsCount = rec.ReceiptId ? rec.ReceiptId.length : 0;
        const hasChildren = ordersCount > 0 || receiptsCount > 0;

        // ردیف اصلی
        html += `
            <tr class="product-row" data-id="${rec.RecommendationsId}">
                <td>
                    <button class="action-btn expand-btn" data-id="${rec.RecommendationsId}">
                        <i class="fas ${hasChildren ? 'fa-chevron-down' : 'fa-plus-circle'}"></i>
                    </button>
                </td>
                <td><strong>${rec.RecommendationsId}</strong></td>
                <td>${rec.RecommendationsCaption || '—'}</td>
                <td>${personelName}</td>
                <td>${dateFa}</td>
                <td><span class="level-badge level-${rec.LevelOrder}">${levelText}</span></td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td class="action-buttons">
                    <button class="action-btn toggle-status-btn" data-id="${rec.RecommendationsId}" title="تغییر وضعیت">
                        <i class="fas ${rec.Status ? 'fa-eye-slash' : 'fa-eye'}"></i>
                    </button>
                    <button class="action-btn edit-btn" data-id="${rec.RecommendationsId}" title="ویرایش">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" data-id="${rec.RecommendationsId}" title="حذف">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            </tr>
        `;

        // ردیف زیرمجموعه‌ها
        html += `
            <tr class="sub-row" id="sub-${rec.RecommendationsId}" style="display:none;">
                <td colspan="8">
                    <div class="sub-content">
                        <div class="sub-section">
                            <h4><i class="fas fa-box"></i> محصولات سفارش (Order)</h4>
                            <div class="sub-items" id="orders-${rec.RecommendationsId}">
                                ${(rec.OrderId || []).map(o => {
            const info = getProductInfoByColorId(o.ColorPriceProductId);
            return `
                                        <div class="sub-item">
                                            <span style="font-weight:600;">${info.productCaption}</span>
                                            <span>رنگ: ${info.colorCaption}</span>
                                            <span style="color:var(--primary);">${(info.price * (o.NumberProduct || 0)).toLocaleString()} تومان</span>
                                            <span style="font-size:0.7rem;">×${o.NumberProduct || 0}</span>
                                            <button class="remove-sub" data-type="order" data-id="${o.OrderId}" data-rec="${rec.RecommendationsId}">
                                                <i class="fas fa-times-circle"></i>
                                            </button>
                                        </div>
                                    `;
        }).join('')}
                                <button class="add-sub-btn" data-type="order" data-rec="${rec.RecommendationsId}">
                                    <i class="fas fa-plus"></i> افزودن محصول
                                </button>
                            </div>
                        </div>

                        <div class="sub-section">
                            <h4><i class="fas fa-receipt"></i> رسیدهای پرداخت (Receipt)</h4>
                            <div class="sub-items" id="receipts-${rec.RecommendationsId}">
                                ${(rec.ReceiptId || []).map(r => {
            const rDateFa = getDateFa(r, 'DateTimePeyment', 'DateTimePeymentFa');
            return `
                                        <div class="sub-item">
                                            <span style="font-weight:600;">${r.ReceiptCaption || '—'}</span>
                                            <span style="color:var(--success);">${(r.ValuePeyment || 0).toLocaleString()} تومان</span>
                                            <span style="font-size:0.7rem;">${rDateFa}</span>
                                            <button class="remove-sub" data-type="receipt" data-id="${r.ReceiptId}" data-rec="${rec.RecommendationsId}">
                                                <i class="fas fa-times-circle"></i>
                                            </button>
                                        </div>
                                    `;
        }).join('')}
                                <button class="add-sub-btn" data-type="receipt" data-rec="${rec.RecommendationsId}">
                                    <i class="fas fa-plus"></i> افزودن رسید
                                </button>
                            </div>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
    renderStats();
    attachEvents();
}

// ============================================================
// رویدادها — بدون تغییر
// ============================================================
function attachEvents() {
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

    document.querySelectorAll('.toggle-status-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            const id = parseInt(this.dataset.id);
            toggleRecommendationStatus(id);
        });
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            const id = parseInt(this.dataset.id);
            openEditRecommendationModal(id);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            const id = parseInt(this.dataset.id);
            if (confirm("آیا از حذف این سفارش اطمینان دارید؟")) {
                deleteRecommendation(id);
            }
        });
    });

    document.querySelectorAll('.add-sub-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            const type = this.dataset.type;
            const recId = parseInt(this.dataset.rec);
            if (type === 'order') openOrderModal(recId);
            else if (type === 'receipt') openReceiptModal(recId);
        });
    });

    document.querySelectorAll('.remove-sub').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            const type = this.dataset.type;
            const id = parseInt(this.dataset.id);
            const recId = parseInt(this.dataset.rec);
            if (confirm("حذف این آیتم؟")) {
                removeSubItem(type, id, recId);
            }
        });
    });
}

// ============================================================
// ★★★ تغییر وضعیت (async) ★★★
// ============================================================
async function toggleRecommendationStatus(id) {
    const r = RecommendationsList.find(x => x.RecommendationsId === id);
    if (!r) return;
    r.Status = !r.Status;
    await SendRecommendation(r);
}

// ============================================================
// ★★★ حذف (async) ★★★
// ============================================================
async function deleteRecommendation(id) {
    try {
        const response = await post('/Recommendationss/DeleteData', { 'id': id });
        if (response.isSuccess) {
            alert(response.data);
            await saveToStorage();
        } else {
            alert(response.errorTitle);
        }
    } catch (err) {
        alert('خطا در حذف: ' + err.message);
    }
}

async function removeSubItem(type, id, recId) {
    try {
        const url = type === 'order'
            ? '/Orders/DeleteData'
            : '/Receipts/DeleteData';

        const response = await post(url, { 'id': id });
        if (response.isSuccess) {
            alert(response.data);
            await saveToStorage();
        } else {
            alert(response.errorTitle);
        }
    } catch (err) {
        alert('خطا در حذف: ' + err.message);
    }
}

// ============================================================
// مودال Recommendations
// ============================================================
function openAddRecommendationModal() {
    editingRecommendation = false;
    resetRecommendationModal();
    document.getElementById("recModalTitle").innerText = "افزودن سفارش جدید";
    openModal("RecommendationModal");
}

function openEditRecommendationModal(id) {
    const data = RecommendationsList.find(r => r.RecommendationsId === id);
    if (!data) return;

    editingRecommendation = true;

    document.getElementById("RecommendationsId").value = data.RecommendationsId || '';
    document.getElementById("RecommendationsCaption").value = data.RecommendationsCaption || '';
    document.getElementById("Personel").value = data.PersonelId || '';

    const dateInput = document.getElementById("DateTimeRecord");
    if (dateInput) {
        let gregorian = '';
        if (data.DateTimeRecord) {
            gregorian = String(data.DateTimeRecord).split('T')[0];
        } else if (data.DateTimeRecordFa && window.PersianDateHelper) {
            gregorian = window.PersianDateHelper.toGregorian(data.DateTimeRecordFa);
        }
        dateInput.value = gregorian;
        dateInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    document.getElementById("LevelOrder").value = data.LevelOrder || '2';
    document.getElementById("Command").value = data.Command || '';
    document.getElementById("Status").checked = Boolean(data.Status);

    document.getElementById("recModalTitle").innerText = "ویرایش سفارش";
    openModal("RecommendationModal");
}

function closeRecommendationModal() {
    closeModal("RecommendationModal");
    resetRecommendationModal();
}

function resetRecommendationModal() {
    document.getElementById("RecommendationsId").value = "";
    document.getElementById("RecommendationsCaption").value = "";
    document.getElementById("Personel").value = "";

    const dateInput = document.getElementById("DateTimeRecord");
    if (dateInput) {
        dateInput.value = "";
        dateInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    document.getElementById("LevelOrder").value = "2";
    document.getElementById("Command").value = "";
    document.getElementById("Status").checked = false;
}

// ============================================================
// ★★★ ذخیره Recommendations (async) ★★★
// ============================================================
async function SaveRecommendation() {
    const RecommendationsId = document.getElementById("RecommendationsId").value.trim();
    const RecommendationsCaption = document.getElementById("RecommendationsCaption").value.trim();
    const PersonelId = document.getElementById("Personel").value.trim();
    const dateInput = document.getElementById("DateTimeRecord");
    const gregorian = dateInput ? dateInput.value.trim() : '';
    const DateTimeRecordFa = toJalaliString(gregorian);
    const LevelOrder = document.getElementById("LevelOrder").value;
    const Command = document.getElementById("Command").value.trim();
    const Status = document.getElementById("Status").checked;

    if (!RecommendationsCaption) { alert("لطفاً عنوان سفارش را وارد کنید"); return; }
    if (!PersonelId) { alert("لطفاً سفارش دهنده را انتخاب کنید"); return; }
    if (!gregorian) { alert("لطفاً تاریخ سفارش را انتخاب کنید"); return; }

    const data = {
        RecommendationsId: RecommendationsId ? parseInt(RecommendationsId) : 0,
        RecommendationsCaption,
        PersonelId: parseInt(PersonelId),
        DateTimeRecordFa,
        LevelOrder: parseInt(LevelOrder),
        Command,
        Status
    };

    await SendRecommendation(data);
    closeRecommendationModal();
}

async function SendRecommendation(data) {
    try {
        const response = await post('/Recommendationss/UpdateData', data);
        if (response.isSuccess) {
            await saveToStorage();
            alert(response.data);
        } else {
            alert(response.errorTitle);
        }
    } catch (err) {
        alert('خطا در ارتباط با سرور: ' + err.message);
    }
}

// ============================================================
// مودال Order
// ============================================================
function openOrderModal(recId) {
    currentRecommendationId = recId;

    document.getElementById("orderCaption").value = "";
    document.getElementById("orderProduct").value = "";
    document.getElementById("orderColor").innerHTML = '<option value="">ابتدا محصول را انتخاب کنید</option>';
    document.getElementById("orderNumberProduct").value = "1";
    document.getElementById("orderStatus").checked = true;
    document.getElementById("orderRecommendationsId").value = recId;

    document.getElementById("orderModalTitle").innerText = "افزودن محصول به سفارش";
    openModal("orderModal");
}

function closeOrderModal() {
    closeModal("orderModal");
    currentRecommendationId = null;
}

document.getElementById("orderProduct")?.addEventListener("change", function () {
    loadColorsForOrder(this.value);
});

// ============================================================
// ★★★ ذخیره Order (async) ★★★
// ============================================================
async function SaveOrder() {
    const orderCaption = document.getElementById("orderCaption").value.trim();
    const productId = document.getElementById("orderProduct").value.trim();
    const colorPriceProductId = document.getElementById("orderColor").value.trim();
    const numberProduct = document.getElementById("orderNumberProduct").value.trim();
    const status = document.getElementById("orderStatus").checked;
    const recId = document.getElementById("orderRecommendationsId").value;

    if (!productId) { alert("لطفاً محصول را انتخاب کنید"); return; }
    if (!colorPriceProductId) { alert("لطفاً رنگ محصول را انتخاب کنید"); return; }
    if (!numberProduct || parseInt(numberProduct) < 1) { alert("لطفاً تعداد را وارد کنید"); return; }

    const data = {
        OrderId: 0,
        OrderCaption: orderCaption || null,
        RecommendationsId: parseInt(recId),
        ColorPriceProductId: parseInt(colorPriceProductId),
        NumberProduct: parseInt(numberProduct),
        Status: status
    };

    try {
        const response = await post('/Orders/UpdateData', data);
        if (response.isSuccess) {
            alert(response.data);
            await saveToStorage();
            closeOrderModal();
        } else {
            alert(response.errorTitle);
        }
    } catch (err) {
        alert('خطا در ذخیره محصول: ' + err.message);
    }
}

// ============================================================
// مودال Receipt
// ============================================================
function openReceiptModal(recId) {
    currentRecommendationId = recId;

    document.getElementById("receiptCaption").value = "";
    document.getElementById("receiptTypePeyment").value = "";
    document.getElementById("receiptValuePeyment").value = "";
    document.getElementById("receiptDateTimePeyment").value = "";
    document.getElementById("receiptStatus").checked = true;
    document.getElementById("receiptRecommendationsId").value = recId;

    document.getElementById("receiptModalTitle").innerText = "افزودن رسید پرداخت";
    openModal("receiptModal");
}

function closeReceiptModal() {
    closeModal("receiptModal");
    currentRecommendationId = null;
}

// ============================================================
// ★★★ ذخیره Receipt (async) ★★★
// ============================================================
async function SaveReceipt() {
    const receiptCaption = document.getElementById("receiptCaption").value.trim();
    const typePeymentId = document.getElementById("receiptTypePeyment").value.trim();
    const valuePeyment = document.getElementById("receiptValuePeyment").value.trim();
    const dateInput = document.getElementById("receiptDateTimePeyment");
    const gregorian = dateInput ? dateInput.value.trim() : '';
    const DateTimePeymentFa = toJalaliString(gregorian);
    const status = document.getElementById("receiptStatus").checked;
    const recId = document.getElementById("receiptRecommendationsId").value;

    if (!typePeymentId) { alert("لطفاً نوع پرداخت را انتخاب کنید"); return; }
    if (!valuePeyment) { alert("لطفاً حجم پرداخت را وارد کنید"); return; }
    if (!gregorian) { alert("لطفاً تاریخ پرداخت را انتخاب کنید"); return; }

    const data = {
        ReceiptId: 0,
        ReceiptCaption: receiptCaption || null,
        TypePeymentId: parseInt(typePeymentId),
        RecommendationsId: parseInt(recId),
        ValuePeyment: parseInt(valuePeyment),
        DateTimePeymentFa,
        Status: status
    };

    try {
        const response = await post('/Receipts/UpdateData', data);
        if (response.isSuccess) {
            alert(response.data);
            await saveToStorage();
            closeReceiptModal();
        } else {
            alert(response.errorTitle);
        }
    } catch (err) {
        alert('خطا در ذخیره رسید: ' + err.message);
    }
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
document.getElementById("searchRecommendations")?.addEventListener("input", renderTable);
document.getElementById("statusFilter")?.addEventListener("change", renderTable);
document.getElementById("levelFilter")?.addEventListener("change", renderTable);

document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.classList.remove("active");
        }
    });
});


(async function init() {

    await LoadInitialData();
    const saved = localStorage.getItem("Recommendationss");
    if (saved) {
        try {
            RecommendationsList = JSON.parse(saved);
            renderTable();
            console.log(`⚡ ${RecommendationsList.length} سفارش از cache`);
        } catch (e) {
            console.error('localStorage خراب:', e);
        }
    }
    await saveToStorage();

})();