(function () {
    'use strict';

    const Http = window.HttpHelper;
    const UI = window.UICore;

    if (!Http || !UI) {
        console.error('❌ MyOrders: Core ها لود نشده‌اند!');
        return;
    }

    // ═══════════════════════════════════════════════════════
    // State
    // ═══════════════════════════════════════════════════════
    const State = {
        stores: [],
        currentStoreId: 0,
        allOrders: [],       // کش کامل همه سفارشات (همه فروشگاه‌ها)
        orders: [],          // سفارشات نمایش‌داده‌شده (بعد از فیلتر محلی)
        currentLevel: -1,
        currentSearch: ''
    };

    // ═══════════════════════════════════════════════════════
    // Debug
    // ═══════════════════════════════════════════════════════
    function debug(...args) { console.log('🔍 [MyOrders]', ...args); }
    function debugError(...args) { console.error('❌ [MyOrders]', ...args); }

    // ═══════════════════════════════════════════════════════
    // DOM
    // ═══════════════════════════════════════════════════════
    const el = {
        storeSelector: document.getElementById('storeSelector'),
        searchInput: document.getElementById('moSearch'),
        levelFilter: document.getElementById('moLevelFilter'),
        ordersList: document.getElementById('moOrdersList')
    };

    // ═══════════════════════════════════════════════════════
    // Helpers
    // ═══════════════════════════════════════════════════════
    function getOrderId(o) {
        return o.recommendationsId ?? o.RecommendationsId;
    }

    function getOrderLevel(o) {
        return o.levelOrder ?? o.LevelOrder ?? 2;
    }

    function setOrderLevel(o, level) {
        if ('levelOrder' in o) o.levelOrder = level;
        else o.LevelOrder = level;
    }

    function getOrderStoreId(o) {
        return o.storeId ?? o.StoreId;
    }

    // ═══════════════════════════════════════════════════════
    // Load Stores
    // ═══════════════════════════════════════════════════════
    async function loadStores() {
        try {
            const res = await Http.postSecure('/Auth/GetMyStoreIds');
            if (!res.isSuccess) return false;

            State.stores = JSON.parse(res.data);
            if (!State.stores || State.stores.length === 0) {
                UI.showToast('شما فروشگاهی ندارید', 'warning');
                return false;
            }

            State.currentStoreId = State.stores.length > 1 ? 0 : State.stores[0].StoreId;

            renderStoreSelector();
            return true;
        } catch (err) {
            debugError('loadStores:', err);
            return false;
        }
    }

    function renderStoreSelector() {
        if (!el.storeSelector) return;

        const stores = State.stores;
        const hasMultiple = stores.length > 1;

        let html = '<label><i class="fas fa-store"></i> فروشگاه:</label>';
        html += '<select id="storeSelect">';

        if (hasMultiple) {
            html += `<option value="0" ${State.currentStoreId === 0 ? 'selected' : ''}>همه فروشگاه‌ها</option>`;
        }

        stores.forEach(store => {
            const selected = (store.StoreId === State.currentStoreId) ? 'selected' : '';
            html += `<option value="${store.StoreId}" ${selected}>${UI.escapeHtml(store.StoreCaption)}</option>`;
        });

        html += '</select>';

        el.storeSelector.innerHTML = html;
        el.storeSelector.style.display = 'flex';

        document.getElementById('storeSelect')?.addEventListener('change', function () {
            State.currentStoreId = parseInt(this.value);

            // ریست فیلترها هنگام تغییر فروشگاه
            State.currentLevel = -1;
            State.currentSearch = '';
            if (el.levelFilter) el.levelFilter.value = '-1';
            if (el.searchInput) el.searchInput.value = '';

            applyFilters();
        });
    }

    // ═══════════════════════════════════════════════════════
    // Load All Orders (یک‌بار برای همه فروشگاه‌ها)
    // ═══════════════════════════════════════════════════════
    async function loadAllOrders() {
        if (!el.ordersList) return;

        el.ordersList.innerHTML = `
            <div class="mo-loading">
                <i class="fas fa-spinner fa-spin"></i>
                در حال بارگذاری...
            </div>`;

        try {
            if (State.stores.length === 0) {
                State.allOrders = [];
                applyFilters();
                return;
            }

            const results = await Http.postSecure('/MyOrders/GetAll');
            if (!results.isSuccess) {
                debugError('load orders failed');
                return;
            }
            State.allOrders = JSON.parse(results.data);

            debug('All Orders (merged):', State.allOrders.length);
            applyFilters();
        } catch (err) {
            debugError('loadAllOrders:', err);
            UI.showToast('خطا در ارتباط', 'error');
            State.allOrders = [];
            applyFilters();
        }
    }

    // ═══════════════════════════════════════════════════════
    // Apply Filters (محلی — بدون درخواست شبکه)
    // ═══════════════════════════════════════════════════════
    function applyFilters() {
        let result = State.allOrders;
        // فیلتر فروشگاه
        if (State.currentStoreId !== 0) {
            result = result.filter(o => o.StoreId === State.currentStoreId);
        }

        // فیلتر سطح
        if (State.currentLevel !== -1) {
            result = result.filter(o => getOrderLevel(o) === State.currentLevel);
        }

        // فیلتر جستجو
        if (State.currentSearch) {
            const q = State.currentSearch.toLowerCase();
            result = result.filter(o => {
                const caption = (o.recommendationsCaption || o.RecommendationsCaption || '').toLowerCase();
                const idStr = String(getOrderId(o));
                return caption.includes(q) || idStr.includes(q);
            });
        }

        State.orders = result;
        renderOrders();
        renderStats();
    }

    // ═══════════════════════════════════════════════════════
    // Render Orders
    // ═══════════════════════════════════════════════════════
    function renderOrders() {
        if (!el.ordersList) return;

        if (!State.orders || State.orders.length === 0) {
            el.ordersList.innerHTML = `
                <div class="mo-empty">
                    <i class="fas fa-inbox"></i>
                    <h3>هیچ سفارشی یافت نشد</h3>
                    <p>در این دسته سفارشی وجود ندارد</p>
                </div>`;
            return;
        }

        const statusMap = {
            2: { text: 'در انتظار', icon: 'fa-clock', cls: 'pending' },
            3: { text: 'پرداخت شده', icon: 'fa-credit-card', cls: 'processing' },
            4: { text: 'در حال پردازش', icon: 'fa-cogs', cls: 'processing' },
            5: { text: 'بسته‌بندی', icon: 'fa-box', cls: 'shipped' },
            6: { text: 'تحویل به پست', icon: 'fa-truck', cls: 'shipped' },
            7: { text: 'تحویل شده', icon: 'fa-check-circle', cls: 'delivered' },
            8: { text: 'ارجاع', icon: 'fa-credit-card', cls: 'pending' }
        };

        let html = '';
        State.orders.forEach(o => {
            const id = getOrderId(o);
            const level = getOrderLevel(o);
            const status = statusMap[level] || statusMap[2];
            const amount = Number(o.totalAmount || o.TotalAmount) || 0;
            const dateFa = formatDate(o.dateTimeRecord || o.DateTimeRecord);
            const itemCount = o.itemCount || o.ItemCount || 0;

            html += `
                <div class="mo-order-card" data-id="${id}">
                    <div class="mo-order-header">
                        <div class="mo-order-id">
                            <i class="fas fa-hashtag"></i>
                            ${UI.escapeHtml(o.recommendationsCaption || o.RecommendationsCaption || 'سفارش')}
                            <span class="mo-order-num">#${id}</span>
                        </div>
                        <span class="mo-status-badge mo-status-${status.cls}">
                            <i class="fas ${status.icon}"></i> ${status.text}
                        </span>
                    </div>

                    <div class="mo-order-body">
                        <div class="mo-order-meta">
                            <span><i class="fas fa-user"></i> ${UI.escapeHtml(o.customerName || o.CustomerName || '—')}</span>
                            <span><i class="fas fa-phone"></i> ${UI.escapeHtml(o.phoneNumber || o.PhoneNumber || '—')}</span>
                            <span><i class="fas fa-calendar"></i> ${dateFa}</span>
                            <span><i class="fas fa-box"></i> ${itemCount} محصول</span>
                        </div>
                        <div class="mo-order-total">
                            <strong>${amount.toLocaleString('fa-IR')} تومان</strong>
                        </div>
                    </div>

                    <div class="mo-order-footer">
                        <button class="mo-btn mo-btn-view" onclick="viewOrder(${id})">
                            <i class="fas fa-eye"></i> جزئیات
                        </button>
                        <button class="mo-btn mo-btn-status" onclick="openStatusModal(${id}, ${level})">
                            <i class="fas fa-exchange-alt"></i> تغییر وضعیت
                        </button>
                    </div>
                </div>`;
        });

        el.ordersList.innerHTML = html;
    }

    // ═══════════════════════════════════════════════════════
    // Stats
    // ═══════════════════════════════════════════════════════
    function renderStats() {
        const total = State.orders.length;
        const pending = State.orders.filter(o => getOrderLevel(o) === 2).length;
        const processing = State.orders.filter(o => {
            const l = getOrderLevel(o);
            return l === 3 || l === 4;
        }).length;
        const delivered = State.orders.filter(o => getOrderLevel(o) === 7).length;

        const setText = (id, val) => {
            const node = document.getElementById(id);
            if (node) node.textContent = val;
        };

        setText('statTotal', total);
        setText('statPending', pending);
        setText('statProcessing', processing);
        setText('statDelivered', delivered);
    }

    // ═══════════════════════════════════════════════════════
    // View Order (Modal)
    // ═══════════════════════════════════════════════════════
    async function viewOrder(orderId) {
        try {
            const res = await Http.postSecure('/MyOrders/GetById', { orderId });
            if (!res.isSuccess) {
                UI.showToast(res.errorTitle || 'خطا', 'error');
                return;
            }

            renderOrderDetails(res.data);
            openModal('orderModal');
        } catch (err) {
            debugError('viewOrder:', err);
        }
    }

    function renderOrderDetails(response) {
        const details = document.getElementById('orderDetails');
        if (!details) return;

        const data = typeof response === 'string' ? JSON.parse(response) : response;

        const header = data.header || data.Header || {};
        const items = data.items || data.Items || [];
        const receipts = data.receipts || data.Receipts || [];

        const get = (obj, camel, pascal) => obj[camel] ?? obj[pascal];

        const statusMap = {
            2: 'در انتظار تایید',
            3: 'پرداخت شده',
            4: 'در حال پردازش',
            5: 'بسته‌بندی و ارسال',
            6: 'تحویل به پست',
            7: 'تحویل مشتری',
            8: 'ارجاع'
        };

        const level = get(header, 'levelOrder', 'LevelOrder') || 2;
        const totalAmount = Number(get(header, 'totalAmount', 'TotalAmount')) || 0;

        // ═══ ۱. اطلاعات مشتری ═══
        let html = `
        <div class="mo-detail-section">
            <h4><i class="fas fa-user"></i> اطلاعات مشتری</h4>
            <div class="mo-detail-row">
                <span>نام:</span>
                <strong>${UI.escapeHtml(get(header, 'customerName', 'CustomerName') || '—')}</strong>
            </div>
            <div class="mo-detail-row">
                <span>شماره تماس:</span>
                <strong>${UI.escapeHtml(get(header, 'phoneNumber', 'PhoneNumber') || '—')}</strong>
            </div>
            <div class="mo-detail-row">
                <span>ایمیل:</span>
                <strong>${UI.escapeHtml(get(header, 'email', 'Email') || '—')}</strong>
            </div>
            <div class="mo-detail-row">
                <span>آدرس:</span>
                <strong>${UI.escapeHtml(get(header, 'address', 'Address') || '—')}</strong>
            </div>
        </div>
    `;

        // ═══ ۲. اطلاعات سفارش ═══
        html += `
        <div class="mo-detail-section">
            <h4><i class="fas fa-info-circle"></i> اطلاعات سفارش</h4>
            <div class="mo-detail-row">
                <span>شناسه:</span>
                <strong>#${get(header, 'recommendationsId', 'RecommendationsId')}</strong>
            </div>
            <div class="mo-detail-row">
                <span>عنوان:</span>
                <strong>${UI.escapeHtml(get(header, 'recommendationsCaption', 'RecommendationsCaption') || '—')}</strong>
            </div>
            <div class="mo-detail-row">
                <span>وضعیت:</span>
                <strong>${statusMap[level] || '—'}</strong>
            </div>
            <div class="mo-detail-row">
                <span>تاریخ ثبت:</span>
                <strong>${formatDate(get(header, 'dateTimeRecord', 'DateTimeRecord'))}</strong>
            </div>
            ${get(header, 'command', 'Command') ? `
                <div class="mo-detail-row">
                    <span>توضیحات:</span>
                    <strong>${UI.escapeHtml(get(header, 'command', 'Command'))}</strong>
                </div>
            ` : ''}
        </div>
    `;

        // ═══ ۳. محصولات ═══
        if (items.length > 0) {
            html += `
            <div class="mo-detail-section">
                <h4><i class="fas fa-boxes"></i> محصولات سفارش (${items.length})</h4>
                <div class="mo-products-list">
        `;

            items.forEach(item => {
                const productCaption = get(item, 'productCaption', 'ProductCaption') || '—';
                const productCode = get(item, 'productCode', 'ProductCode') || '';
                const colorCaption = get(item, 'colorCaption', 'ColorCaption') || '—';
                const qty = Number(get(item, 'numberProduct', 'NumberProduct')) || 0;
                const price = Number(get(item, 'priceProduct', 'PriceProduct')) || 0;
                const offer = Number(get(item, 'offer', 'Offer')) || 0;
                const finalPrice = Number(get(item, 'finalPrice', 'FinalPrice')) || 0;
                const totalPrice = Number(get(item, 'totalPrice', 'TotalPrice')) || 0;
                const productImage = get(item, 'productImage', 'ProductImage');
                const inStore = Number(get(item, 'inStore', 'InStore')) || 0;

                const imgSrc = productImage
                    ? `/Images/Product/${productImage}`
                    : '/Store/images/no-image.jpg';

                const offerBadge = offer > 0
                    ? `<span class="mo-offer-badge">${offer}% تخفیف</span>`
                    : '';

                const priceDisplay = offer > 0
                    ? `<div class="mo-price-old">${price.toLocaleString('fa-IR')} ت</div>
                       <div class="mo-price-new">${finalPrice.toLocaleString('fa-IR')} ت</div>`
                    : `<div class="mo-price-new">${price.toLocaleString('fa-IR')} ت</div>`;

                html += `
                <div class="mo-product-item">
                    <img src="${imgSrc}" 
                         class="mo-product-img"
                         onerror="this.src='/Store/images/no-image.jpg'"
                         alt="${UI.escapeHtml(productCaption)}">

                    <div class="mo-product-info">
                        <div class="mo-product-name">
                            ${UI.escapeHtml(productCaption)}
                            ${productCode ? `<code>${UI.escapeHtml(productCode)}</code>` : ''}
                        </div>
                        <div class="mo-product-color">
                            <i class="fas fa-palette"></i>
                            ${UI.escapeHtml(colorCaption)}
                        </div>
                        <div class="mo-product-stock">
                            <i class="fas fa-cubes"></i>
                            موجودی: ${inStore}
                        </div>
                    </div>

                    <div class="mo-product-price">
                        ${offerBadge}
                        ${priceDisplay}
                    </div>

                    <div class="mo-product-qty">
                        <span class="qty-label">تعداد</span>
                        <strong>× ${qty}</strong>
                    </div>

                    <div class="mo-product-total">
                        <span class="total-label">جمع</span>
                        <strong>${totalPrice.toLocaleString('fa-IR')} ت</strong>
                    </div>
                </div>
            `;
            });

            html += `</div></div>`;
        } else {
            html += `
            <div class="mo-detail-section">
                <h4><i class="fas fa-boxes"></i> محصولات سفارش</h4>
                <p style="text-align:center;color:var(--text-secondary);padding:15px;">
                    محصولی در این سفارش ثبت نشده
                </p>
            </div>
        `;
        }

        // ═══ ۴. رسیدهای پرداخت ═══
        if (receipts.length > 0) {
            html += `
            <div class="mo-detail-section">
                <h4><i class="fas fa-receipt"></i> رسیدهای پرداخت (${receipts.length})</h4>
                <div class="mo-receipts-list">
        `;

            receipts.forEach(r => {
                const receiptCaption = get(r, 'receiptCaption', 'ReceiptCaption') || 'رسید';
                const value = Number(get(r, 'valuePeyment', 'ValuePeyment')) || 0;
                const datePeyment = get(r, 'dateTimePeyment', 'DateTimePeyment');
                const typePeyment = get(r, 'typePeymentCaption', 'TypePeymentCaption') || '—';
                const doPeyment = get(r, 'doPeyment', 'DoPeyment');

                html += `
                <div class="mo-receipt-item">
                    <div class="mo-receipt-info">
                        <strong>${UI.escapeHtml(receiptCaption)}</strong>
                        <span class="mo-receipt-type">${UI.escapeHtml(typePeyment)}</span>
                        <span class="mo-receipt-date">${formatDate(datePeyment)}</span>
                    </div>
                    <div class="mo-receipt-amount">
                        ${value.toLocaleString('fa-IR')} ت
                        ${doPeyment
                        ? '<span class="mo-receipt-status success"><i class="fas fa-check-circle"></i> پرداخت شده</span>'
                        : '<span class="mo-receipt-status pending"><i class="fas fa-clock"></i> در انتظار</span>'
                    }
                    </div>
                </div>
            `;
            });

            html += `</div></div>`;
        }

        // ═══ ۵. خلاصه مالی ═══
        html += `
        <div class="mo-detail-section mo-summary-section">
            <div class="mo-summary-row">
                <span>مجموع کل سفارش:</span>
                <strong class="mo-summary-total">${totalAmount.toLocaleString('fa-IR')} تومان</strong>
            </div>
        </div>
    `;

        details.innerHTML = html;
    }

    // ═══════════════════════════════════════════════════════
    // Status Modal
    // ═══════════════════════════════════════════════════════
    function openStatusModal(orderId, currentLevel) {
        const idField = document.getElementById('statusOrderId');
        const levelField = document.getElementById('newLevelOrder');
        const noteField = document.getElementById('commandNote');

        if (idField) idField.value = orderId;
        if (levelField) levelField.value = currentLevel || 2;
        if (noteField) noteField.value = '';

        openModal('statusModal');
    }

    async function saveStatus() {
        const idField = document.getElementById('statusOrderId');
        const levelField = document.getElementById('newLevelOrder');
        const noteField = document.getElementById('commandNote');

        const orderId = parseInt(idField?.value);
        const newLevel = parseInt(levelField?.value);
        const command = noteField?.value.trim() || '';

        if (!orderId) return;

        try {
            const res = await Http.postSecure('/MyOrders/UpdateStatus', {
                orderId: orderId,
                newLevelOrder: newLevel,
                command: command
            });

            if (!res.isSuccess) {
                UI.showToast(res.errorTitle || 'خطا', 'error');
                return;
            }

            UI.showToast('وضعیت تغییر کرد ✅', 'success');
            closeModal('statusModal');

            // ✅ آپدیت در کش کامل
            const allOrder = State.allOrders.find(o => getOrderId(o) === orderId);
            if (allOrder) setOrderLevel(allOrder, newLevel);

            // ✅ آپدیت در لیست نمایش‌داده‌شده
            const shownOrder = State.orders.find(o => getOrderId(o) === orderId);
            if (shownOrder) setOrderLevel(shownOrder, newLevel);

            // ✅ اعمال مجدد فیلترها (اگر با فیلتر فعلی مطابقت ندارد حذف می‌شود)
            applyFilters();
        } catch (err) {
            debugError('saveStatus:', err);
            UI.showToast('خطا در ارتباط', 'error');
        }
    }

    // ═══════════════════════════════════════════════════════
    // Modal Helpers
    // ═══════════════════════════════════════════════════════
    function openModal(id) {
        document.getElementById(id)?.classList.add('active');
    }

    function closeModal(id) {
        document.getElementById(id)?.classList.remove('active');
    }

    // ═══════════════════════════════════════════════════════
    // Date
    // ═══════════════════════════════════════════════════════
    function formatDate(date) {
        if (!date) return '—';
        try {
            const d = new Date(date);
            if (isNaN(d)) return '—';
            return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
        } catch {
            return '—';
        }
    }

    // ═══════════════════════════════════════════════════════
    // Bind Filters (همه محلی)
    // ═══════════════════════════════════════════════════════
    function bindFilters() {
        el.searchInput?.addEventListener('input', UI.debounce(function () {
            State.currentSearch = el.searchInput.value.trim();
            applyFilters();
        }, 300));

        el.levelFilter?.addEventListener('change', function () {
            State.currentLevel = parseInt(this.value);
            applyFilters();
        });
    }

    // ═══════════════════════════════════════════════════════
    // Exports
    // ═══════════════════════════════════════════════════════
    window.viewOrder = viewOrder;
    window.openStatusModal = openStatusModal;
    window.saveStatus = saveStatus;
    window.closeModal = closeModal;

    // ═══════════════════════════════════════════════════════
    // Init
    // ═══════════════════════════════════════════════════════
    async function init() {
        debug('شروع Init...');

        bindFilters();

        const loaded = await loadStores();

        if (loaded) {
            // ✅ یک‌بار همه سفارشات همه فروشگاه‌ها را بگیر
            await loadAllOrders();
        } else {
            if (el.ordersList) {
                el.ordersList.innerHTML = `
                    <div class="mo-empty">
                        <i class="fas fa-store-slash"></i>
                        <h3>شما فروشگاهی ندارید</h3>
                    </div>`;
            }
        }

        debug('Init کامل شد.');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();