/* ============================================================
   StoresRecommendation.js — ثبت/ویرایش سفارش
   ------------------------------------------------------------
   وابستگی‌ها:
     1. jQuery
     2. Core/HttpHelper.js   → Http
     3. Core/UICore.js       → UI
     4. Core/AuthHelper.js   → Auth
     5. Core/CartHelper.js   → Cart

   دو حالت:
     - Recommendation > 0: ویرایش سفارش قبلی
     - Recommendation = 0: سبد خرید جدید
   ============================================================ */

(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════
    // وابستگی‌ها
    // ═══════════════════════════════════════════════════════
    const Http = window.HttpHelper;
    const UI = window.UICore;
    const Cart = window.CartStore;

    if (!Http || !UI || !Cart) {
        console.error('❌ StoresRecommendation: Core ها لود نشده‌اند!');
        return;
    }

    // ═══════════════════════════════════════════════════════
    // State
    // ═══════════════════════════════════════════════════════
    const State = {
        availableProducts: [],
        paymentTypes: [],
        selectedItems: [],
        selectedPaymentType: 1,
        orderStep: 2,
        recommendationId: 0,
        lastReceiptId: 0,

        // ─── مودال رنگ ───
        currentModalItemIndex: -1,
        currentModalColors: []
    };

    // ═══════════════════════════════════════════════════════
    // DOM Elements (cache)
    // ═══════════════════════════════════════════════════════
    const el = {
        orderNumber: document.getElementById('orderNumber'),
        selectedProductsList: document.getElementById('selectedProductsList'),
        summaryItems: document.getElementById('summaryItems'),
        itemCount: document.getElementById('itemCount'),
        orderTotal: document.getElementById('orderTotal'),
        submitOrderBtn: document.getElementById('submitOrderBtn'),
        payOrderBtn: document.getElementById('payOrderBtn'),
        paymentOptions: document.getElementById('paymentOptions'),
        colorModal: document.getElementById('colorModal'),
        colorModalTitle: document.getElementById('colorModalTitle'),
        colorModalList: document.getElementById('colorModalList')
    };

    // ═══════════════════════════════════════════════════════
    // گرفتن recommendationId از URL
    // ═══════════════════════════════════════════════════════
    function getRecommendationIdFromUrl() {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('Recommendation');
        return id ? parseInt(id) : 0;
    }

    // ═══════════════════════════════════════════════════════
    // Init
    // ═══════════════════════════════════════════════════════
    async function init() {
        State.recommendationId = getRecommendationIdFromUrl();

        if (el.orderNumber) {
            el.orderNumber.textContent = State.recommendationId > 0
                ? 'ORD-' + String(State.recommendationId).padStart(4, '0')
                : 'جدید';
        }

        // ═══════════════════════════════════════════════════════
        // دو حالت
        // ═══════════════════════════════════════════════════════
        if (State.recommendationId > 0) {
            // ─── حالت ۱: سفارش قبلی ───
            const preOrder = await getPreOrder(State.recommendationId);
            if (!preOrder) {
                UI.showToast('خطا در دریافت سفارش قبلی', 'error');
                return;
            }

            const orderItems = preOrder.OrderId || [];
            const colorIds = orderItems
                .map(o => Number(o.ColorPriceProductId))
                .filter(id => id > 0);

            console.log('📦 سفارش قبلی — colorIds:', colorIds);

            const loaded = await loadBaseData({ colorIds, productIds: [] });
            if (!loaded) return;

            loadOrderToItems(preOrder);
            setViewMode(true);
        } else {
            // ─── حالت ۲: سبد جدید ───
            const loaded = await loadBaseData();
            if (!loaded) return;

            loadCartFromStore();
            setViewMode(false);
        }

        renderPaymentOptions();
        initPaymentOptions();
        bindModalEvents();
        updateSteps();
        bindEvents();
    }

    // ═══════════════════════════════════════════════════════
    // دریافت داده‌های پایه
    // ═══════════════════════════════════════════════════════
    async function loadBaseData(options = null) {
        try {
            let colorIds = [];
            let productIds = [];

            // ─── از سبد یا از options ───
            if (!options) {
                const cartItems = Cart.load();
                console.log('🛒 Cart items:', cartItems);

                colorIds = cartItems
                    .filter(item => Number(item.colorId) > 0)
                    .map(item => Number(item.colorId));

                productIds = cartItems
                    .filter(item => !item.colorId || Number(item.colorId) === 0)
                    .map(item => Number(item.productId))
                    .filter(id => id > 0);
            } else {
                colorIds = options.colorIds || [];
                productIds = options.productIds || [];
            }

            console.log('🎨 colorIds:', colorIds, '| 📦 productIds:', productIds);

            // ─── خالی ───
            if (colorIds.length === 0 && productIds.length === 0) {
                console.warn('⚠️ هیچ colorId یا productId برای دریافت داده');
                State.availableProducts = [];
                return true;
            }

            const response = await Http.postJsonSecure(
                '/ShopPanel/Recommendation/GetBaseData',
                {
                    colorPriceProductIds: colorIds,
                    productIds: productIds
                }
            );

            if (!response.isSuccess) {
                UI.showToast(response.errorTitle || 'خطا در دریافت اطلاعات', 'error');
                return false;
            }
            const data = JSON.parse(response.data);
            State.availableProducts = data.Products || [];


            // ─── paymentTypes ───
            if (!State.paymentTypes || State.paymentTypes.length === 0) {
                State.paymentTypes = data.PaymentTypes || [];
                if (State.paymentTypes.length === 0) {
                    setDefaultPaymentTypes();
                }
            }

            console.log('✅ availableProducts:', State.availableProducts);
            return true;
        } catch (err) {
            if (err.message === 'AUTH_REQUIRED') return false;
            console.error('❌ loadBaseData error:', err);
            UI.showToast('خطا در ارتباط با سرور', 'error');
            return false;
        }
    }

    // ═══════════════════════════════════════════════════════
    // دریافت سفارش قبلی
    // ═══════════════════════════════════════════════════════
    async function getPreOrder(id) {
        try {
            const response = await Http.postSecure(
                '/ShopPanel/Recommendation/GetById',
                { Id: id }
            );

            if (!response.isSuccess) {
                UI.showToast(response.errorTitle || 'خطا در دریافت سفارش', 'error');
                return null;
            }

            const orderData = JSON.parse(response.data);

            if (!orderData || orderData.length === 0) {
                UI.showToast('سفارش یافت نشد', 'warning');
                return null;
            }

            return orderData[0];
        } catch (err) {
            if (err.message === 'AUTH_REQUIRED') return null;
            UI.showToast('خطا در دریافت سفارش قبلی', 'error');
            return null;
        }
    }

    // ═══════════════════════════════════════════════════════
    // بارگذاری سفارش قبلی در selectedItems
    // ═══════════════════════════════════════════════════════
    function loadOrderToItems(orderData) {
        const orders = orderData.OrderId || [];

        if (orders.length === 0) {
            UI.showToast('هیچ محصولی در سفارش قبلی یافت نشد', 'warning');
            return;
        }

        State.orderStep = orderData.LevelOrder || 2;
        updateSteps();
        State.selectedItems = [];

        let loadedCount = 0;
        let notFoundCount = 0;

        if (orderData.ReceiptId && orderData.ReceiptId.length > 0) {
            State.selectedPaymentType = orderData.ReceiptId[0].TypePeymentId;
        }

        orders.forEach(order => {
            const colorPriceProductId = Number(order.ColorPriceProductId);
            const quantity = Number(order.NumberProduct) || 1;

            const found = findProductAndColor(colorPriceProductId);

            if (found) {
                State.selectedItems.push({
                    OrderId: order.OrderId,
                    ProductId: found.product.ProductId,
                    ProductCaption: found.product.ProductCaption,
                    ColorPriceProductId: colorPriceProductId,
                    ColorCaption: found.color.ColorPriceProductCaption,
                    Price: found.color.PriceProduct || 0,
                    quantity: quantity,
                    InStore: found.color.InStore || 0,
                    photo: found.product.Photo || found.color.Photo || '',
                    NeedsColorSelection: false
                });
                loadedCount++;
            } else {
                notFoundCount++;
                console.warn(`⚠️ محصول با colorId=${colorPriceProductId} در availableProducts نیست`);
            }
        });

        renderSelectedProducts();

        if (loadedCount > 0) {
            UI.showToast(`${loadedCount} محصول بارگذاری شد ✅`, 'success');
        }
        if (notFoundCount > 0) {
            UI.showToast(`${notFoundCount} محصول یافت نشد`, 'warning');
        }
    }

    // ═══════════════════════════════════════════════════════
    // بارگذاری از CartStore
    // ═══════════════════════════════════════════════════════
    function loadCartFromStore() {
        const items = Cart.load();
        console.log('🛒 Loading cart items:', items);

        State.selectedItems = [];
        let skipped = 0;

        items.forEach(cartItem => {
            const colorId = Number(cartItem.colorId) || 0;
            const productId = Number(cartItem.productId);

            // ─── حالت ۱: رنگ مشخص ───
            if (colorId > 0) {
                const found = findProductAndColor(colorId, productId);

                if (!found) {
                    console.warn(`⚠️ محصول ${productId} با رنگ ${colorId} یافت نشد`);
                    skipped++;
                    return;
                }

                State.selectedItems.push({
                    ProductId: found.product.ProductId,
                    ProductCaption: found.product.ProductCaption,
                    ColorPriceProductId: found.color.ColorPriceProductId,
                    ColorCaption: found.color.ColorPriceProductCaption,
                    Price: found.color.PriceProduct || 0,
                    quantity: cartItem.quantity || 1,
                    InStore: found.color.InStore || 0,
                    photo: cartItem.photo || '',
                    NeedsColorSelection: false
                });
            }
            // ─── حالت ۲: بدون رنگ ───
            else {
                const product = findProductById(productId);

                if (!product) {
                    console.warn(`⚠️ محصول ${productId} (بدون رنگ) یافت نشد`);
                    skipped++;
                    return;
                }

                State.selectedItems.push({
                    ProductId: product.ProductId,
                    ProductCaption: product.ProductCaption,
                    ColorPriceProductId: 0,
                    ColorCaption: 'انتخاب نشده',
                    Price: 0,
                    quantity: cartItem.quantity || 1,
                    InStore: 0,
                    photo: cartItem.photo || '',
                    NeedsColorSelection: true
                });
            }
        });

        console.log('✅ selectedItems:', State.selectedItems);
        renderSelectedProducts();

        if (skipped > 0) {
            UI.showToast(`${skipped} محصول از سبد حذف شد (دیگر در دسترس نیست)`, 'warning');
        }

        if (State.selectedItems.length > 0 && State.orderStep === 1) {
            State.orderStep = 2;
            updateSteps();
        }
    }

    // ═══════════════════════════════════════════════════════
    // پیدا کردن محصول/رنگ
    // ═══════════════════════════════════════════════════════
    function findProductAndColor(colorPriceProductId, productId = null) {
        for (const product of State.availableProducts) {
            if (productId && Number(product.ProductId) !== Number(productId)) continue;

            const color = (product.Colors || []).find(c =>
                Number(c.ColorPriceProductId) === Number(colorPriceProductId)
            );

            if (color) return { product, color };
        }
        return null;
    }

    function findProductById(productId) {
        const pid = Number(productId);
        return State.availableProducts.find(p => Number(p.ProductId) === pid) || null;
    }

    // ═══════════════════════════════════════════════════════
    // نوع پرداخت
    // ═══════════════════════════════════════════════════════
    function setDefaultPaymentTypes() {
        State.paymentTypes = [
            { TypePeymentId: 1, TypePeymentCaption: 'پرداخت درب منزل', Status: true },
            { TypePeymentId: 2, TypePeymentCaption: 'پرداخت آنلاین', Status: true }
        ];
    }

    function initPaymentOptions() {
        document.querySelectorAll('.payment-option').forEach(opt => {
            opt.addEventListener('click', function () {
                if (this.style.pointerEvents === 'none') return;
                document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
                this.classList.add('selected');
                State.selectedPaymentType = parseInt(this.dataset.type);
            });
        });
    }

    function renderPaymentOptions() {
        const container = el.paymentOptions;
        if (!container) return;

        const activePayments = State.paymentTypes.filter(p => p.Status !== false);

        if (activePayments.length === 0) {
            container.innerHTML = `
                <div style="text-align:center;padding:16px;color:var(--danger);">
                    <i class="fas fa-exclamation-circle"></i> هیچ روش پرداختی موجود نیست
                </div>`;
            return;
        }

        const icons = {
            'آنلاین': 'fa-credit-card',
            'اعتباری': 'fa-wallet',
            'کارت به کارت': 'fa-building-columns',
            'نقدی': 'fa-money-bill-wave',
            'دیجیتال': 'fa-mobile-alt',
            'درب منزل': 'fa-home'
        };
        const defaultIcon = 'fa-credit-card';

        let html = '';
        let firstSelected = false;

        activePayments.forEach(p => {
            let iconClass = defaultIcon;
            for (const [key, value] of Object.entries(icons)) {
                if (p.TypePeymentCaption && p.TypePeymentCaption.includes(key)) {
                    iconClass = value;
                    break;
                }
            }

            const isSelected = (!firstSelected && !State.selectedPaymentType)
                || State.selectedPaymentType === p.TypePeymentId;

            if (isSelected) {
                State.selectedPaymentType = p.TypePeymentId;
                firstSelected = true;
            }

            html += `
                <div class="payment-option ${isSelected ? 'selected' : ''}" data-type="${p.TypePeymentId}">
                    <div class="radio"></div>
                    <div class="icon"><i class="fas ${iconClass}"></i></div>
                    <div class="info">
                        <div class="title">${UI.escapeHtml(p.TypePeymentCaption)}</div>
                        <div class="desc">روش پرداخت</div>
                    </div>
                </div>`;
        });

        container.innerHTML = html;

        container.querySelectorAll('.payment-option').forEach(opt => {
            opt.addEventListener('click', function () {
                container.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
                this.classList.add('selected');
                State.selectedPaymentType = parseInt(this.dataset.type);
            });
        });
    }

    // ═══════════════════════════════════════════════════════
    // مراحل
    // ═══════════════════════════════════════════════════════
    function updateSteps() {
        ['step1', 'step2', 'step3'].forEach((id, index) => {
            const elStep = document.getElementById(id);
            if (!elStep) return;

            elStep.classList.remove('active', 'done');

            if (index + 1 === State.orderStep) elStep.classList.add('active');
            else if (index + 1 < State.orderStep) elStep.classList.add('done');
        });
    }

    // ═══════════════════════════════════════════════════════
    // رندر محصولات انتخاب‌شده
    // ═══════════════════════════════════════════════════════
    function renderSelectedProducts() {
        const container = el.selectedProductsList;
        if (!container) return;

        // ─── خالی ───
        if (State.selectedItems.length === 0) {
            container.innerHTML = `
                <div class="no-items">
                    <i class="fas fa-cart-plus"></i>
                    <p>سبد خرید شما خالی است</p>
                    <small style="font-size:0.75rem;">ابتدا از فروشگاه محصول اضافه کنید</small>
                </div>`;

            if (el.summaryItems) {
                el.summaryItems.innerHTML = `
                    <div style="text-align:center;padding:10px;color:var(--text-secondary);font-size:0.85rem;">
                        محصولی در سبد خرید نیست
                    </div>`;
            }

            if (el.orderTotal) el.orderTotal.textContent = '۰ تومان';
            if (el.itemCount) el.itemCount.textContent = '0';
            if (el.submitOrderBtn) el.submitOrderBtn.disabled = true;

            return;
        }

        if (el.itemCount) el.itemCount.textContent = State.selectedItems.length;

        let html = '';
        let total = 0;
        let hasStockIssue = false;
        let hasNeedsColor = false;
        State.selectedItems.forEach((item, index) => {
            const subtotal = (item.Price || 0) * item.quantity;
            total += subtotal;

            // ─── عکس ───
            const photoHtml = item.photo
                ? `<img src="/Images/Product/${UI.escapeHtml(item.photo)}"
                         alt="${UI.escapeHtml(item.ProductCaption)}"
                         class="product-photo"
                         onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
                   <div class="product-thumb" style="display:none;">
                       <i class="fas fa-image"></i>
                   </div>`
                : `<div class="product-thumb"><i class="fas fa-image"></i></div>`;

            // ═══ حالت ۱: نیاز به رنگ ═══
            if (item.NeedsColorSelection) {
                hasNeedsColor = true;

                html += `
                    <div class="product-select-item needs-color" data-index="${index}">
                        ${photoHtml}
                        <div class="product-details">
                            <div class="product-header">
                                <span class="product-name">${UI.escapeHtml(item.ProductCaption)}</span>
                                <span class="product-price" style="color:var(--warning);">
                                    <i class="fas fa-palette"></i> انتخاب رنگ
                                </span>
                            </div>
                            <div class="product-controls">
                                <span style="font-size:0.8rem;color:var(--warning);font-weight:600;">
                                    <i class="fas fa-exclamation-triangle"></i>
                                    لطفاً رنگ/مدل محصول را انتخاب کنید
                                </span>
                            </div>
                        </div>
                    </div>`;
                return;
            }

            // ═══ حالت ۲: رنگ انتخاب‌شده ═══
            const inStock = (item.InStore || 0) >= item.quantity;
            if (!inStock) hasStockIssue = true;

            const stockWarning = !inStock
                ? `<span style="color:var(--danger);font-size:0.7rem;">
                       <i class="fas fa-exclamation-triangle"></i>
                       موجودی: ${item.InStore || 0}
                   </span>`
                : '';

            html += `
                <div class="product-select-item ${!inStock ? 'out-of-stock' : ''}">
                    ${photoHtml}
                    <div class="product-details">
                        <div class="product-header">
                            <span class="product-name">${UI.escapeHtml(item.ProductCaption)}</span>
                            <span class="product-price">${subtotal.toLocaleString('fa-IR')} تومان</span>
                        </div>
                        <div class="product-controls">
                            <span style="font-size:0.75rem;color:var(--text-secondary);">
                                رنگ: ${UI.escapeHtml(item.ColorCaption)}
                            </span>
                            <input type="number"
                                   min="1"
                                   max="${item.InStore || 0}"
                                   value="${item.quantity}"
                                   class="qty-input"
                                   data-index="${index}">
                            <button class="btn-remove-product" data-index="${index}">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                        ${stockWarning}
                    </div>
                </div>`;
        });

        container.innerHTML = html;

        // ─── خلاصه ───
        let summaryHtml = '';
        State.selectedItems.forEach(item => {
            const subtotal = (item.Price || 0) * item.quantity;
            const colorText = item.NeedsColorSelection ? '⚠️ رنگ انتخاب نشده' : item.ColorCaption;

            summaryHtml += `
                <div class="summary-row">
                    <span>${UI.escapeHtml(item.ProductCaption)} (${UI.escapeHtml(colorText)}) × ${item.quantity}</span>
                    <span>${subtotal.toLocaleString('fa-IR')} تومان</span>
                </div>`;
        });

        if (el.summaryItems) el.summaryItems.innerHTML = summaryHtml;
        if (el.orderTotal) el.orderTotal.textContent = total.toLocaleString('fa-IR') + ' تومان';

        // ─── دکمه ثبت ───
        if (el.submitOrderBtn) {
            const disabled = hasStockIssue || hasNeedsColor;
            el.submitOrderBtn.disabled = disabled;
            el.submitOrderBtn.title = hasNeedsColor
                ? 'لطفاً ابتدا رنگ محصولات را انتخاب کنید'
                : hasStockIssue
                    ? 'موجودی بعضی محصولات کافی نیست'
                    : '';
        }

        // ─── رویداد کلیک روی کارت نیازمند رنگ ───
        document.querySelectorAll('.product-select-item.needs-color').forEach(itemEl => {
            itemEl.addEventListener('click', function () {
                const idx = parseInt(this.dataset.index);
                openColorModal(idx);
            });
        });

        // ─── رویداد qty ───
        document.querySelectorAll('.qty-input').forEach(input => {
            input.addEventListener('change', function () {
                const idx = parseInt(this.dataset.index);
                let val = parseInt(this.value) || 1;
                const maxStock = State.selectedItems[idx].InStore || 0;

                if (val < 1) val = 1;
                if (val > maxStock) {
                    val = maxStock;
                    UI.showToast(`حداکثر موجودی: ${maxStock}`, 'warning');
                }
                if (val > 99) val = 99;

                State.selectedItems[idx].quantity = val;
                Cart.setQuantity(
                    State.selectedItems[idx].ProductId,
                    State.selectedItems[idx].ColorPriceProductId,
                    val
                );
                renderSelectedProducts();
            });
        });

        // ─── رویداد حذف ───
        document.querySelectorAll('.btn-remove-product').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                const idx = parseInt(this.dataset.index);
                const item = State.selectedItems[idx];

                Cart.remove(item.ProductId, item.ColorPriceProductId);
                State.selectedItems.splice(idx, 1);
                renderSelectedProducts();
            });
        });
    }

    // ═══════════════════════════════════════════════════════
    // مودال انتخاب رنگ
    // ═══════════════════════════════════════════════════════
    function openColorModal(itemIndex) {

        const item = State.selectedItems[itemIndex];
        if (!item) return;

        const product = findProductById(item.ProductId);
        if (!product) {
            UI.showToast('محصول یافت نشد', 'error');
            return;
        }
        State.currentModalItemIndex = itemIndex;
        State.currentModalColors = product.Colors || [];

        if (State.currentModalColors.length === 0) {
            UI.showToast('هیچ رنگی برای این محصول موجود نیست', 'warning');
            return;
        }

        if (!el.colorModalList) {
            console.error('❌ مودال رنگ در HTML یافت نشد');
            return;
        }

        if (el.colorModalTitle) {
            el.colorModalTitle.textContent = `انتخاب رنگ/مدل — ${product.ProductCaption}`;
        }

        let html = '';
        State.currentModalColors.forEach(color => {
            const inStock = (color.InStore || 0) > 0;
            html += `
                <div class="color-modal-item ${!inStock ? 'out-of-stock' : ''}"
                     data-color-id="${color.ColorPriceProductId}"
                     ${!inStock ? 'data-disabled="1"' : ''}>
                    <div class="color-info">
                        <span class="color-name">${UI.escapeHtml(color.ColorPriceProductCaption)}</span>
                        <span class="color-price">${(color.PriceProduct || 0).toLocaleString('fa-IR')} تومان</span>
                    </div>
                    <div class="color-stock ${!inStock ? 'no-stock' : ''}">
                        ${inStock
                    ? `<i class="fas fa-check-circle"></i> موجودی: ${color.InStore}`
                    : `<i class="fas fa-times-circle"></i> ناموجود`}
                    </div>
                </div>`;
        });

        el.colorModalList.innerHTML = html;

        el.colorModalList.querySelectorAll('.color-modal-item').forEach(itemEl => {
            itemEl.addEventListener('click', function () {
                if (this.dataset.disabled === '1') {
                    UI.showToast('این رنگ موجود نیست', 'warning');
                    return;
                }
                const colorId = parseInt(this.dataset.colorId);
                selectColorForItem(colorId);
            });
        });

        openModal('colorModal');
    }

    function closeColorModal() {
        closeModal('colorModal');
        State.currentModalItemIndex = -1;
        State.currentModalColors = [];
    }

    window.CanselColorModal = function () {
        closeColorModal();
    };

    // ═══════════════════════════════════════════════════════
    // انتخاب رنگ
    // ═══════════════════════════════════════════════════════
    function selectColorForItem(colorId) {
        if (State.currentModalItemIndex < 0) return;

        const item = State.selectedItems[State.currentModalItemIndex];
        if (!item) return;

        const color = State.currentModalColors.find(
            c => Number(c.ColorPriceProductId) === Number(colorId)
        );

        if (!color) {
            UI.showToast('رنگ یافت نشد', 'error');
            return;
        }

        // ─── ۱. CartStore ───
        if (typeof Cart.updateColor === 'function') {
            Cart.updateColor(
                item.ProductId,
                0,
                color.ColorPriceProductId,
                {
                    colorCaption: color.ColorPriceProductCaption,
                    price: color.PriceProduct || 0
                }
            );
        } else {
            // ─── fallback ───
            const cartItems = Cart.load();
            const cartItem = cartItems.find(i =>
                Number(i.productId) === Number(item.ProductId) &&
                Number(i.colorId) === 0
            );

            if (cartItem) {
                cartItem.colorId = color.ColorPriceProductId;
                cartItem.colorCaption = color.ColorPriceProductCaption;
                cartItem.price = color.PriceProduct || 0;
                Cart.save();
            }
        }

        // ─── ۲. selectedItems ───
        item.ColorPriceProductId = color.ColorPriceProductId;
        item.ColorCaption = color.ColorPriceProductCaption;
        item.Price = color.PriceProduct || 0;
        item.InStore = color.InStore || 0;
        item.NeedsColorSelection = false;

        closeColorModal();
        renderSelectedProducts();
        UI.showToast('رنگ محصول انتخاب شد ✅', 'success');
    }

    // ═══════════════════════════════════════════════════════
    // رویدادهای مودال
    // ═══════════════════════════════════════════════════════
    function bindModalEvents() {
        const modal = el.colorModal;
        if (!modal) return;

        modal.addEventListener('click', function (e) {
            if (e.target === modal) closeColorModal();
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeColorModal();
            }
        });
    }

    // ═══════════════════════════════════════════════════════
    // توابع مودال (سراسری)
    // ═══════════════════════════════════════════════════════
    function openModal(id) {
        document.getElementById(id).classList.add('active');
    }

    function closeModal(id) {
        document.getElementById(id).classList.remove('active');
    }

    // ═══════════════════════════════════════════════════════
    // ثبت سفارش
    // ═══════════════════════════════════════════════════════
    async function submitAndPay() {
        if (State.selectedItems.length === 0) {
            UI.showToast('سبد خرید شما خالی است', 'error');
            return;
        }

        const needsColor = State.selectedItems.some(i => i.NeedsColorSelection);
        if (needsColor) {
            UI.showToast('لطفاً ابتدا رنگ تمام محصولات را انتخاب کنید', 'error');
            return;
        }

        if (!State.selectedPaymentType || State.selectedPaymentType <= 0) {
            UI.showToast('لطفاً نوع پرداخت را انتخاب کنید', 'error');
            return;
        }

        let stockIssue = false;
        State.selectedItems.forEach(item => {
            if ((item.InStore || 0) < item.quantity) stockIssue = true;
        });

        if (stockIssue) {
            UI.showToast('موجودی بعضی محصولات کافی نیست. لطفاً تعداد را کاهش دهید.', 'error');
            return;
        }

        const btn = el.submitOrderBtn;
        if (!btn) return;

        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> در حال ثبت سفارش...';

        const payload = {
            recommendationsId: State.recommendationId || 0,
            typePeymentId: State.selectedPaymentType,
            items: State.selectedItems.map(item => ({
                colorPriceProductId: item.ColorPriceProductId,
                numberProduct: item.quantity
            }))
        };

        try {
            const response = await Http.postSecure(
                '/ShopPanel/Recommendation/Checkout',
                payload
            );

            if (!response.isSuccess) {
                UI.showToast(response.errorTitle || 'خطا در ثبت سفارش', 'error');
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-check-circle"></i> ثبت و پرداخت';
                return;
            }

            const result = JSON.parse(response.data);
            const receiptId = Number(result.ReceiptId ?? result.receiptId ?? 0);
            const recId = Number(result.RecommendationId ?? result.recommendationId ?? 0);

            State.recommendationId = recId;
            State.lastReceiptId = receiptId;

            if (el.orderNumber && recId > 0) {
                el.orderNumber.textContent = 'ORD-' + String(recId).padStart(4, '0');
            }

            if (receiptId === 0) {
                // ─── پرداخت درب منزل ───
                UI.showToast('سفارش شما با موفقیت ثبت شد! 🎉', 'success');
                Cart.clear();
                State.selectedItems = [];

                setTimeout(() => {
                    window.location.href = '/ShopPanel/Recommendation?success=1';
                }, 1500);
            } else {
                // ─── پرداخت آنلاین ───
                UI.showToast('سفارش ثبت شد. در حال انتقال به درگاه پرداخت...', 'info');
                State.orderStep = 3;
                updateSteps();

                if (el.submitOrderBtn) el.submitOrderBtn.style.display = 'none';
                if (el.payOrderBtn) {
                    el.payOrderBtn.style.display = 'flex';
                    el.payOrderBtn.dataset.receiptId = receiptId;
                    el.payOrderBtn.dataset.recommendationId = recId;
                }
            }

            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-check-circle"></i> ثبت و پرداخت';
        } catch (err) {
            if (err.message === 'AUTH_REQUIRED') return;
            UI.showToast('خطا در ارتباط با سرور!', 'error');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-check-circle"></i> ثبت و پرداخت';
        }
    }

    // ═══════════════════════════════════════════════════════
    // پرداخت نهایی
    // ═══════════════════════════════════════════════════════
    async function payOrder() {
        const btn = el.payOrderBtn;
        if (!btn) return;

        const receiptId = Number(btn.dataset.receiptId || State.lastReceiptId || 0);
        const recId = Number(btn.dataset.recommendationId || State.recommendationId || 0);

        if (receiptId <= 0) {
            UI.showToast('اطلاعات پرداخت یافت نشد', 'error');
            return;
        }

        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> در حال انتقال به درگاه...';

        try {
            const response = await Http.postSecure(
                '/ShopPanel/Recommendation/GetPaymentLink',
                {
                    receiptId: receiptId,
                    recommendationId: recId
                }
            );

            if (response.isSuccess) {
                const result = JSON.parse(response.data);

                if (result.PaymentUrl) {
                    Cart.clear();
                    State.selectedItems = [];
                    window.location.href = result.PaymentUrl;
                } else {
                    UI.showToast('لینک درگاه دریافت نشد', 'error');
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fas fa-credit-card"></i> پرداخت و تایید نهایی';
                }
            } else {
                UI.showToast(response.errorTitle || 'خطا در اتصال به درگاه', 'error');
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-credit-card"></i> پرداخت و تایید نهایی';
            }
        } catch (err) {
            if (err.message === 'AUTH_REQUIRED') return;
            UI.showToast('خطا در ارتباط با سرور!', 'error');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-credit-card"></i> پرداخت و تایید نهایی';
        }
    }

    // ═══════════════════════════════════════════════════════
    // View Mode
    // ═══════════════════════════════════════════════════════
    function setViewMode(locked) {
        const container = document.querySelector('.order-container');
        if (!container) return;

        container.classList.toggle('view-mode-locked', locked);
    }

    // ═══════════════════════════════════════════════════════
    // Bind Events
    // ═══════════════════════════════════════════════════════
    function bindEvents() {
        el.submitOrderBtn?.addEventListener('click', submitAndPay);
        el.payOrderBtn?.addEventListener('click', payOrder);
    }

    // ═══════════════════════════════════════════════════════
    // Export
    // ═══════════════════════════════════════════════════════
    window.ShopRecommendation = {
        openColorModal,
        closeColorModal,
        refresh: renderSelectedProducts
    };

    // ═══════════════════════════════════════════════════════
    // شروع
    // ═══════════════════════════════════════════════════════
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();