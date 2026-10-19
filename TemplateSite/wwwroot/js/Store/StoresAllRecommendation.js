
(function () {
    'use strict';

    const Http = window.HttpHelper;
    const UI = window.UICore;

    if (!Http || !UI) {
        console.error('❌ StoresAllRecommendation: Core ها لود نشده‌اند!');
        return;
    }

    // ═══════════════════════════════════════════════════════
    // State
    // ═══════════════════════════════════════════════════════
    const State = {
        orders: [],
        colorPriceProducts: {},
        typePayments: {},
        currentFilter: 'all',
        searchTerm: '',
        isLoading: false
    };

    // ═══════════════════════════════════════════════════════
    // DOM
    // ═══════════════════════════════════════════════════════
    const el = {
        container: document.getElementById('ordersList'),
        countSpan: document.getElementById('orderCount'),
        levelFilter: document.getElementById('levelFilter'),
        searchInput: document.getElementById('searchOrder')
    };

    // ═══════════════════════════════════════════════════════
    // Debug
    // ═══════════════════════════════════════════════════════
    function debug(...args) { console.log('🔍 [Orders]', ...args); }
    function debugError(...args) { console.error('❌ [Orders]', ...args); }

    // ═══════════════════════════════════════════════════════
    // Helpers — تاریخ
    // ═══════════════════════════════════════════════════════
    function toJalali(value) {
        if (!value) return '';
        if (window.PersianDateHelper?.toJalali) {
            return window.PersianDateHelper.toJalali(value);
        }
        return String(value);
    }

    // ═══════════════════════════════════════════════════════
    // Helpers — LevelOrder
    // ═══════════════════════════════════════════════════════
    const LEVELS = {
        2: { text: 'ثبت سفارش', icon: 'fa-clipboard-list', cls: 'level-2' },
        3: { text: 'پرداخت', icon: 'fa-credit-card', cls: 'level-3' },
        4: { text: 'پردازش سفارش', icon: 'fa-cogs', cls: 'level-4' },
        5: { text: 'بسته‌بندی و ارسال', icon: 'fa-box', cls: 'level-5' },
        6: { text: 'تحویل به پست', icon: 'fa-truck', cls: 'level-6' },
        7: { text: 'تحویل مشتری', icon: 'fa-check-circle', cls: 'level-7' },
        8: { text: 'ارجاع شده', icon: 'fa-share', cls: 'level-8' }
    };

    function getLevel(level, paid) {
        if (level == 3 && !paid) {
            return { text: 'در انتظار پرداخت', icon: 'fa-credit-card', cls: 'level-3' };
        }
        return LEVELS[level] || { text: 'نامشخص', icon: 'fa-question-circle', cls: 'level-2' };
    }

    // ═══════════════════════════════════════════════════════
    // Helpers — محصول/رنگ
    // ═══════════════════════════════════════════════════════
    function getProductName(cid) {
        const i = State.colorPriceProducts[cid];
        return i ? i.ProductCaption : `محصول #${cid}`;
    }

    function getColorName(cid) {
        const i = State.colorPriceProducts[cid];
        return i ? i.ColorPriceProductCaption : 'بدون رنگ';
    }

    function getPrice(cid) {
        const i = State.colorPriceProducts[cid];
        return i ? i.PriceProduct : 0;
    }

    function getTypePaymentName(tid) {
        return State.typePayments[tid] || 'نامشخص';
    }

    // ═══════════════════════════════════════════════════════
    // Fetch — Colors + Payments
    // ═══════════════════════════════════════════════════════
    async function fetchColorPriceProducts() {
        try {
            const response = await Http.postSecure('/ColorPriceProducts/GetAllData');
            if (!response.isSuccess) return;

            const data = JSON.parse(response.data);
            State.colorPriceProducts = {};

            data.forEach(item => {
                State.colorPriceProducts[item.ColorPriceProductId] = {
                    ColorPriceProductCaption: item.ColorPriceProductCaption || 'بدون رنگ',
                    PriceProduct: item.PriceProduct || 0,
                    ProductCaption: item.ProductCaption || `محصول #${item.ProductId}`,
                    ProductId: item.ProductId || 0
                };
            });
        } catch (err) {
            if (err.message !== 'AUTH_REQUIRED') {
                debugError('fetchColorPriceProducts:', err);
            }
        }
    }

    async function fetchTypePayments() {
        try {
            const response = await Http.postSecure('/ShopPanel/Recommendation/getTypePeyments');
            if (!response.isSuccess) return;

            const data = JSON.parse(response.data);
            State.typePayments = {};

            data.forEach(item => {
                State.typePayments[item.TypePeymentId] = item.TypePeymentCaption || 'نامشخص';
            });
        } catch (err) {
            if (err.message !== 'AUTH_REQUIRED') {
                debugError('fetchTypePayments:', err);
            }
        }
    }

    // ═══════════════════════════════════════════════════════
    // Load Orders
    // ═══════════════════════════════════════════════════════
    async function getOrders() {
        if (State.isLoading) return;
        State.isLoading = true;

        if (!el.container) {
            State.isLoading = false;
            return;
        }

        el.container.innerHTML = `
            <div style="text-align:center;padding:60px;color:var(--text-secondary);">
                <i class="fas fa-spinner fa-spin" style="font-size:2rem;display:block;margin-bottom:16px;"></i>
                در حال بارگذاری سفارشات...
            </div>`;

        try {
            await Promise.all([
                fetchColorPriceProducts(),
                fetchTypePayments()
            ]);

            const response = await Http.postSecure('/ShopPanel/Recommendation/GetData');

            if (response.isSuccess) {
                State.orders = JSON.parse(response.data);
                debug('Orders:', State.orders.length);
                renderOrders();
                UI.showToast(`${State.orders.length} سفارش بارگذاری شد ✅`, 'success');
            } else {
                UI.showToast(response.errorTitle || 'خطا در دریافت سفارشات', 'error');
                el.container.innerHTML = `
                    <div class="no-orders">
                        <i class="fas fa-exclamation-circle"></i>
                        <h3>خطا در دریافت سفارشات</h3>
                        <p>${UI.escapeHtml(response.errorTitle || '')}</p>
                    </div>`;
            }
        } catch (err) {
            if (err.message === 'AUTH_REQUIRED') return;

            debugError('getOrders:', err);
            UI.showToast('خطا در ارتباط با سرور!', 'error');
            el.container.innerHTML = `
                <div class="no-orders">
                    <i class="fas fa-wifi-slash"></i>
                    <h3>خطا در ارتباط با سرور</h3>
                    <p>لطفاً اتصال اینترنت خود را بررسی کنید.</p>
                </div>`;
        } finally {
            State.isLoading = false;
        }
    }

    // ═══════════════════════════════════════════════════════
    // Filter
    // ═══════════════════════════════════════════════════════
    function getFilteredOrders() {
        let filtered = [...State.orders];

        if (State.currentFilter !== 'all') {
            filtered = filtered.filter(o =>
                o.LevelOrder === parseInt(State.currentFilter));
        }

        if (State.searchTerm.trim()) {
            const term = State.searchTerm.toLowerCase().trim();
            filtered = filtered.filter(o =>
                (o.RecommendationsCaption || '').toLowerCase().includes(term) ||
                String(o.RecommendationsId).includes(term)
            );
        }

        return filtered;
    }

    // ═══════════════════════════════════════════════════════
    // Render — اصلی
    // ═══════════════════════════════════════════════════════
    function renderOrders() {
        if (!el.container) return;

        const filtered = getFilteredOrders();

        if (el.countSpan) {
            el.countSpan.innerHTML =
                `<i class="fas fa-clipboard-list"></i> ${filtered.length} سفارش`;
        }

        if (filtered.length === 0) {
            el.container.innerHTML = `
                <div class="no-orders">
                    <i class="fas fa-inbox"></i>
                    <h3>هیچ سفارشی یافت نشد</h3>
                    <p>برای ثبت سفارش جدید به بخش فروشگاه مراجعه کنید.</p>
                </div>`;
            return;
        }

        el.container.innerHTML = filtered.map(renderOrderCard).join('');

        // باز کردن اولین سفارش
        const firstId = filtered[0].RecommendationsId;
        document.getElementById(`orderBody-${firstId}`)?.classList.add('open');
    }

    // ═══════════════════════════════════════════════════════
    // Render — کارت سفارش
    // ═══════════════════════════════════════════════════════
    function renderOrderCard(order) {


        const hasPaidReceipt = order.ReceiptId.some(r => r.DoPeyment === true);

        const level = getLevel(order.LevelOrder, hasPaidReceipt);
        const dateFa = toJalali(order.DateTimeRecord || order.DateTimeRecordFa);

        // ─── مجموع ───
        let total = 0;
        if (Array.isArray(order.OrderId)) {
            total = order.OrderId.reduce((sum, o) => {
                const price = getPrice(o.ColorPriceProductId);
                const qty = o.NumberProduct || 1;
                return sum + (price * qty);
            }, 0);
        }

        // ─── بخش‌ها ───
        const orderItemsHtml = renderOrderItems(order.OrderId);
        const receiptsHtml = renderReceipts(order.ReceiptId);
        const timelineHtml = renderTimeline(order.LevelOrder);

        // ─── یادداشت ───
        const commandHtml = order.Command ? `
            <div class="section-title" style="margin-top:16px;">
                <i class="fas fa-comment"></i> یادداشت / توضیحات
            </div>
            <div class="order-command">
                <i class="fas fa-quote-right"></i> ${UI.escapeHtml(order.Command)}
            </div>
        ` : '';

        // ─── دکمه ارجاع ───
        const canRefer = order.LevelOrder !== 8 && order.LevelOrder !== 7;
        const referBadgeHtml = order.LevelOrder === 8 ? `
            <div class="refer-badge">
                <i class="fas fa-share"></i> ارجاع شده
            </div>
        ` : '';
        const referBtnHtml = canRefer ? `
            <button class="btn-gold-blue"
                    onclick="openReferModal(${order.RecommendationsId})">
                <i class="fas fa-share"></i> ارجاع
            </button>
        ` : '';
        // ═══ بررسی وجود پرداخت ═══
        const receipts = order.ReceiptId || [];
        const hasReceipt = receipts.length > 0;
        // ─── دکمه پرداخت: فقط اگه رسید نداره یا پرداخت نشده ───
        const canPay = !hasPaidReceipt
            && order.LevelOrder !== 7
            && order.LevelOrder !== 8;

        const payBtnHtml = canPay ? `
        <button class="btn-gold-blue btn-pay"
            onclick="openPayModal(${order.RecommendationsId})">
        <i class="fas fa-credit-card"></i> پرداخت </button>` : '';

        // ─── Badge پرداخت نشده ───
        const unpaidBadgeHtml = (!hasPaidReceipt && order.LevelOrder !== 7 && order.LevelOrder !== 8) ? `
            <div class="unpaid-badge">
        <i class="fas fa-exclamation-circle"></i> در انتظار پرداخت </div>` : '';

        const referredClass = order.LevelOrder === 8 ? 'order-referred' : '';

        return `
            <div class="order-card ${referredClass}">
                <div class="order-header" onclick="window.toggleOrder(${order.RecommendationsId})">
                    <div class="order-id">
                        <i class="fas fa-hashtag"></i>
                        ${UI.escapeHtml(order.RecommendationsCaption || 'سفارش')}
                        <span style="font-size:0.7rem;color:var(--text-secondary);">#${order.RecommendationsId}</span>
                    </div>
                    <div class="order-status">
                        <span style="font-size:0.8rem;color:var(--text-secondary);">${dateFa}</span>
                        <span class="status-badge ${level.cls}">
                            <i class="fas ${level.icon}"></i> ${level.text}
                        </span>
                    </div>
                    <div class="order-total">${UI.formatPrice(total)} تومان</div>
                </div>

                <div class="order-body" id="orderBody-${order.RecommendationsId}">
                    ${referBadgeHtml}

                    <div class="order-timeline">${timelineHtml}</div>

                    <div class="section-title">
                        <i class="fas fa-boxes"></i> محصولات سفارش
                    </div>
                    <div class="order-items">${orderItemsHtml}</div>

                    <div class="section-title">
                        <i class="fas fa-receipt"></i> رسیدهای پرداخت
                    </div>
                    ${receiptsHtml}

                    ${commandHtml}

                    <div class="btnPotion">
                        <a href="/ShopPanel/Recommendation/Record?Recommendation=${order.RecommendationsId}"
                           class="btn-gold-blue">مشاهده</a>
                           ${payBtnHtml}
                           ${referBtnHtml}
                    </div>
                </div>
            </div>`;
    }
    // ─── پرداخت ───

    async function openPayModal(orderId) {
        const modal = document.getElementById('payModal');
        if (!modal) {
            UI.showToast('Modal پرداخت یافت نشد', 'error');
            return;
        }

        // ─── پاک کردن ───
        document.getElementById('payOrderId').value = orderId || 0;
        document.getElementById('payTypePeyment').innerHTML = '<option value="">در حال بارگذاری...</option>';

        modal.classList.add('active');

        // ═══════════════════════════════════════════════════════
        // بارگذاری نوع پرداخت
        // ═══════════════════════════════════════════════════════
        try {
            if (Object.keys(State.typePayments).length === 0) {
                await fetchTypePayments();
            }

            let html = '<option value="">انتخاب نوع پرداخت...</option>';

            Object.entries(State.typePayments).forEach(([id, caption]) => {
                html += `<option value="${id}">${UI.escapeHtml(caption)}</option>`;
            });

            document.getElementById('payTypePeyment').innerHTML = html;
        } catch (err) {
            debugError('openPayModal:', err);
            UI.showToast('خطا در دریافت نوع پرداخت', 'error');
        }
    }

    function closePayModal() {
        document.getElementById('payModal')?.classList.remove('active');
        const select = document.getElementById('payTypePeyment');
        if (select) select.value = '';
    }

    async function savePay() {
        const orderId = parseInt(document.getElementById('payOrderId').value);
        const typePeymentId = parseInt(document.getElementById('payTypePeyment').value);

        if (!orderId) {
            UI.showToast('شناسه سفارش نامعتبر', 'warning');
            return;
        }

        if (!typePeymentId) {
            UI.showToast('نوع پرداخت را انتخاب کنید', 'warning');
            return;
        }

        if (!confirm('آیا از ثبت پرداخت مطمئن هستید؟')) return;

        const btn = document.getElementById('paySubmitBtn');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> در حال ثبت...';
        }

        try {
            const res = await Http.postSecure('/ShopPanel/Recommendation/Pay', {
                orderId: orderId,
                typePeymentId: typePeymentId
            });

            if (res.isSuccess) {
                UI.showToast(res.data || 'پرداخت ثبت شد ✅', 'success');
                closePayModal();
                await getOrders();
            } else {
                UI.showToast(res.errorTitle || 'خطا', 'error');
            }
        } catch (err) {
            debugError('savePay:', err);
            UI.showToast('خطا در ارتباط', 'error');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-check"></i> پرداخت';
            }
        }
    }
    window.openPayModal = openPayModal;
    window.closePayModal = closePayModal;
    window.savePay = savePay;
    // ─── بخش محصولات ───
    function renderOrderItems(orderItems) {
        if (!Array.isArray(orderItems) || orderItems.length === 0) {
            return `
                <div style="color:var(--text-secondary);font-size:0.85rem;padding:8px 0;grid-column:1/-1;">
                    <i class="fas fa-info-circle"></i> جزئیات موجود نیست
                </div>`;
        }

        return orderItems.map(o => {
            const pName = getProductName(o.ColorPriceProductId);
            const cName = getColorName(o.ColorPriceProductId);
            const price = getPrice(o.ColorPriceProductId);
            const qty = o.NumberProduct || 1;

            return `
                <div class="order-item">
                    <div class="item-info">
                        <span class="item-name">${UI.escapeHtml(pName)}</span>
                        <span class="item-color">رنگ: ${UI.escapeHtml(cName)}</span>
                    </div>
                    <span class="item-qty">تعداد: ${qty}</span>
                    <span class="item-price">${UI.formatPrice(price * qty)} تومان</span>
                </div>`;
        }).join('');
    }

    // ─── بخش رسیدها ───
    function renderReceipts(receipts) {
        if (!Array.isArray(receipts) || receipts.length === 0) {
            return `
                <div style="color:var(--text-secondary);font-size:0.85rem;padding:8px 0;">
                    <i class="fas fa-info-circle"></i> هنوز پرداختی ثبت نشده
                </div>`;
        }

        return receipts.map(r => {
            const tName = getTypePaymentName(r.TypePeymentId);
            const dFa = toJalali(r.DateTimePeyment || r.DateTimePeymentFa);

            return `
                <div class="order-receipt">
                    <div class="receipt-info">
                        <span class="receipt-title">${UI.escapeHtml(r.ReceiptCaption || 'رسید پرداخت')}</span>
                        <span class="receipt-type">نوع پرداخت: ${UI.escapeHtml(tName)}</span>
                        ${dFa ? `<span style="font-size:0.7rem;color:var(--text-secondary);">${dFa}</span>` : ''}
                    </div>
                    <span class="receipt-amount">${UI.formatPrice(r.ValuePeyment)} تومان</span>
                </div>`;
        }).join('');
    }

    // ─── بخش Timeline ───
    function renderTimeline(currentLevel) {
        const steps = [
            { level: 2, label: 'ثبت سفارش', icon: 'fa-clipboard-list' },
            { level: 3, label: 'پرداخت', icon: 'fa-credit-card' },
            { level: 4, label: 'پردازش', icon: 'fa-cogs' },
            { level: 5, label: 'بسته‌بندی', icon: 'fa-box' },
            { level: 6, label: 'ارسال', icon: 'fa-truck' },
            { level: 7, label: 'تحویل', icon: 'fa-check-circle' },
            { level: 8, label: 'ارجاع', icon: 'fa-share' }
        ];

        return steps.map(step => {
            let stepClass = '';
            let labelClass = '';

            if (currentLevel >= step.level) {
                stepClass = 'completed';
                labelClass = 'completed-label';
            }
            if (currentLevel === step.level) {
                stepClass = 'active';
                labelClass = 'active-label';
            }

            return `
                <div class="step">
                    <div class="step-icon ${stepClass}">
                        <i class="fas ${step.icon}"></i>
                    </div>
                    <span class="step-label ${labelClass}">${step.label}</span>
                </div>`;
        }).join('');
    }

    // ═══════════════════════════════════════════════════════
    // Toggle Order
    // ═══════════════════════════════════════════════════════
    window.toggleOrder = function (orderId) {
        document.getElementById(`orderBody-${orderId}`)?.classList.toggle('open');
    };

    // ═══════════════════════════════════════════════════════
    // ⭐ Refer Modal
    // ═══════════════════════════════════════════════════════
    window.openReferModal = function (orderId) {
        const modal = document.getElementById('referModal');
        if (!modal) {
            UI.showToast('Modal ارجاع یافت نشد', 'error');
            return;
        }

        document.getElementById('referOrderId').value = orderId || 0;
        document.getElementById('referText').value = '';
        modal.classList.add('active');
    };

    window.closeReferModal = function () {
        document.getElementById('referModal')?.classList.remove('active');
        const text = document.getElementById('referText');
        if (text) text.value = '';
    };

    window.saveRefer = async function () {
        const orderId = parseInt(document.getElementById('referOrderId').value);
        const note = document.getElementById('referText').value.trim();

        if (!note) {
            UI.showToast('متن ارجاع را وارد کنید', 'warning');
            return;
        }

        if (note.length > 1000) {
            UI.showToast('متن ارجاع حداکثر 1000 کاراکتر باشد', 'warning');
            return;
        }

        if (!confirm('آیا از ارجاع این سفارش مطمئن هستید؟')) return;

        try {
            const res = await Http.postSecure('/ShopPanel/Recommendation/Refer', {
                orderId: orderId,
                note: note
            });

            if (res.isSuccess) {
                UI.showToast(res.data || 'سفارش ارجاع شد ✅', 'success');
                window.closeReferModal();
                await getOrders();
            } else {
                UI.showToast(res.errorTitle || 'خطا', 'error');
            }
        } catch (err) {
            debugError('saveRefer:', err);
            UI.showToast('خطا در ارتباط', 'error');
        }
    };

    // ═══════════════════════════════════════════════════════
    // Bind Events
    // ═══════════════════════════════════════════════════════
    function bindEvents() {
        el.levelFilter?.addEventListener('change', function () {
            State.currentFilter = this.value;
            renderOrders();
        });

        if (el.searchInput) {
            const debounced = UI.debounce((value) => {
                State.searchTerm = value;
                renderOrders();
            }, 300);

            el.searchInput.addEventListener('input', (e) => debounced(e.target.value));
        }
    }

    // ═══════════════════════════════════════════════════════
    // Init
    // ═══════════════════════════════════════════════════════
    async function init() {
        bindEvents();
        await getOrders();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();