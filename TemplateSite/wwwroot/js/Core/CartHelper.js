/* ============================================================
   CartHelper.js — سبد خرید
   ------------------------------------------------------------
   - CartStore  → داده‌ها (localStorage)
   - CartUI     → نمایش UI
   ============================================================ */

(function (window) {
    'use strict';

    const U = window.UICore;

    // ═══════════════════════════════════════════════════════
    // CartStore — مدیریت متمرکز سبد
    // ═══════════════════════════════════════════════════════
    const CartStore = {
        KEY: 'NegarShop_cart',
        items: [],

        load() {
            try {
                const raw = localStorage.getItem(this.KEY);
                this.items = raw ? JSON.parse(raw) : [];
                if (!Array.isArray(this.items)) this.items = [];
            } catch (e) {
                console.warn('⚠️ CartStore: localStorage خراب بود، ریست شد');
                this.items = [];
                localStorage.removeItem(this.KEY);
            }
            return this.items;
        },

        save() {
            try {
                localStorage.setItem(this.KEY, JSON.stringify(this.items));
                window.dispatchEvent(new CustomEvent('cart:updated', {
                    detail: { items: this.items, count: this.count() }
                }));
            } catch (e) {
                console.error('❌ خطا در ذخیره سبد:', e);
            }
        },

        add(productId, colorId, productInfo) {
            this.load();
            const existing = this.items.find(i =>
                i.productId === productId && i.colorId === colorId);

            if (existing) {
                existing.quantity += 1;
            } else {
                this.items.push({
                    productId: productId,
                    colorId: colorId,
                    productCaption: productInfo.productCaption || '',
                    colorCaption: productInfo.colorCaption || '',
                    price: Number(productInfo.price) || 0,
                    photo: productInfo.photo || '',
                    quantity: 1,
                    addedAt: new Date().toISOString()
                });
            }

            this.save();
            return this.items;
        },

        remove(productId, colorId = null) {
            this.load();
            this.items = this.items.filter(i =>
                !(i.productId === productId && (colorId === null || i.colorId === colorId)));
            this.save();
            return this.items;
        },

        setQuantity(productId, colorId, quantity) {
            this.load();
            const item = this.items.find(i =>
                i.productId === productId && i.colorId === colorId);
            if (item) {
                item.quantity = Math.max(1, Math.min(99, quantity));
                this.save();
            }
            return this.items;
        },

        count() {
            this.load();
            return this.items.reduce((sum, i) => sum + (i.quantity || 0), 0);
        },

        total() {
            this.load();
            return this.items.reduce((sum, i) =>
                sum + ((i.price || 0) * (i.quantity || 0)), 0);
        },

        clear() {
            this.items = [];
            this.save();
            return this.items;
        },

        find(productId, colorId) {
            this.load();
            return this.items.find(i =>
                i.productId === productId && i.colorId === colorId);
        },

        has(productId, colorId) {
            return !!this.find(productId, colorId);
        },

        // ─── آپدیت رنگ (برای StoresRecommendation) ───
        updateColor(productId, oldColorId, newColorId, extra = {}) {
            this.load();
            const item = this.items.find(i =>
                i.productId === productId && i.colorId === oldColorId);
            if (item) {
                item.colorId = newColorId;
                if (extra.colorCaption) item.colorCaption = extra.colorCaption;
                if (extra.price !== undefined) item.price = extra.price;
                this.save();
            }
            return this.items;
        }
    };

    // ═══════════════════════════════════════════════════════
    // CartUI — نمایش سبد
    // ═══════════════════════════════════════════════════════
    const CartUI = {
        open() {
            document.getElementById('cartSidebar')?.classList.add('open');
            document.getElementById('overlay')?.classList.add('active');
            document.body.style.overflow = 'hidden';
        },

        close() {
            document.getElementById('cartSidebar')?.classList.remove('open');
            document.getElementById('overlay')?.classList.remove('active');
            document.body.style.overflow = '';
        },

        update() {
            const items = CartStore.load();

            // ─── Badge ───
            const badge = document.getElementById('cartBadge');
            if (badge) {
                const totalItems = CartStore.count();
                badge.textContent = totalItems.toLocaleString('fa-IR');
                badge.style.display = totalItems > 0 ? '' : 'none';
            }

            // ─── Container ───
            const container = document.getElementById('cartItems');
            const totalSpan = document.getElementById('cartTotal');
            if (!container) return;

            if (items.length === 0) {
                container.innerHTML = `
                    <div class="cart-empty">
                        <i class="fas fa-cart-plus"></i>
                        <p>سبد خرید شما خالی است</p>
                        <small>محصولات مورد نظر خود را اضافه کنید</small>
                    </div>`;
                if (totalSpan) totalSpan.textContent = '۰ تومان';
                return;
            }

            let html = '';
            items.forEach(item => {
                const price = Number(item.price) || 0;
                const qty = Number(item.quantity) || 0;
                const subtotal = price * qty;

                const imgUrl = item.photo
                    ? `/Images/Product/${item.photo}`
                    : '/Store/images/no-image.jpg';

                const colorLine = item.colorCaption
                    ? `<small class="item-color">رنگ: ${U.escapeHtml(item.colorCaption)}</small>`
                    : '';

                html += `
                    <div class="cart-item">
                        <img src="${imgUrl}" alt="${U.escapeHtml(item.productCaption)}"
                             onerror="this.src='/Store/images/no-image.jpg'">
                        <div class="cart-item-info">
                            <div class="item-name">${U.escapeHtml(item.productCaption)}</div>
                            <div class="item-price">${price.toLocaleString('fa-IR')} تومان</div>
                            <small>تعداد: ${qty.toLocaleString('fa-IR')}</small>
                            ${colorLine}
                        </div>
                        <button class="cart-item-remove"
                                data-id="${item.productId}"
                                data-color-id="${item.colorId}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>`;
            });

            container.innerHTML = html;

            // ─── مجموع ───
            const total = CartStore.total();
            if (totalSpan) totalSpan.textContent = total.toLocaleString('fa-IR') + ' تومان';

            // ─── رویداد حذف ───
            container.querySelectorAll('.cart-item-remove').forEach(btn => {
                btn.addEventListener('click', () => {
                    const productId = parseInt(btn.dataset.id);
                    const colorId = parseInt(btn.dataset.colorId);
                    CartStore.remove(productId, colorId);
                });
            });
        }
    };

    // ─── همگام‌سازی خودکار ───
    window.addEventListener('cart:updated', () => CartUI.update());

    // ═══════════════════════════════════════════════════════
    // Export
    // ═══════════════════════════════════════════════════════
    window.CartStore = CartStore;
    window.CartUI = CartUI;

})(window);