
(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════
    // وابستگی‌ها
    // ═══════════════════════════════════════════════════════
    const Http = window.HttpHelper;
    const UI = window.UICore;
    const Cart = window.CartStore;

    // ─── چک لود ───
    if (!Http || !UI) {
        console.error('❌ StoresProdact: HttpHelper یا UICore لود نشده!');
        return;
    }

    // ═══════════════════════════════════════════════════════
    // State
    // ═══════════════════════════════════════════════════════
    const State = {
        kindProducts: [],
        optionProducts: [],
        currentProduct: null,
        selectedColorId: null,
        currentProductId: 0
    };

    // ═══════════════════════════════════════════════════════
    // نقشه رنگ‌ها
    // ═══════════════════════════════════════════════════════
    const COLOR_HEX_MAP = {
        'نقره‌ای': '#c0c0c0',
        'مشکی': '#1a1a1a',
        'سفید': '#ffffff',
        'خاکستری': '#6b7280',
        'آبی': '#3b82f6',
        'قرمز': '#ef4444',
        'سبز': '#22c55e',
        'زرد': '#eab308',
        'صورتی': '#ec4899',
        'طوسی': '#9ca3af',
        'طلایی': '#d97706',
        'نارنجی': '#f97316',
        'خاکستری تیتانیوم': '#8c8c8c',
        'مشکی مات': '#2d2d2d'
    };

    function getColorHex(colorName) {
        return COLOR_HEX_MAP[colorName] || '#6b7280';
    }

    // ═══════════════════════════════════════════════════════
    // DOM Elements
    // ═══════════════════════════════════════════════════════
    const el = {
        productIdDisplay: document.getElementById('productIdDisplay'),
        productTitle: document.getElementById('productTitle'),
        productCode: document.getElementById('productCode'),
        productPrice: document.getElementById('productPrice'),
        productDescription: document.getElementById('productDescription'),
        galleryMain: document.getElementById('galleryMain'),
        galleryThumbs: document.getElementById('galleryThumbs'),
        colorOptionsItems: document.getElementById('colorOptionsItems'),
        specsContainer: document.getElementById('specsContainer'),
        detailsContainer: document.getElementById('detailsContainer'),
        addToCartBtn: document.getElementById('addToCartBtn')
    };

    // ═══════════════════════════════════════════════════════
    // گرفتن productId از URL
    // ═══════════════════════════════════════════════════════
    function getProductIdFromUrl() {
        // /ShopPanel/Product/Details/5
        const parts = window.location.pathname.split('/');
        const last = parts[parts.length - 1];
        const id = parseInt(last);

        if (id && !isNaN(id)) return id;

        // ─── fallback ───
        const params = new URLSearchParams(window.location.search);
        const pid = params.get('Product') || params.get('id');
        return pid ? parseInt(pid) : 0;
    }

    // ═══════════════════════════════════════════════════════
    // ابزار — پیدا کردن نام مشخصه
    // ═══════════════════════════════════════════════════════
    function getOptionName(id) {
        const o = State.optionProducts.find(o => o.OptionProductId === id);
        return o ? o.OptionProductCaption : 'نامشخص';
    }

    // ═══════════════════════════════════════════════════════
    // بارگذاری محصول + داده‌های پایه
    // ═══════════════════════════════════════════════════════
    async function loadProductWithBaseData() {
        try {
            const response = await Http.post('/ShopPanel/Product/GetBaseData', {
                id: State.currentProductId
            });

            if (!response.isSuccess) {
                UI.showToast(response.errorTitle || 'خطا در دریافت اطلاعات', 'error');
                return false;
            }

            const data = JSON.parse(response.data);

            // ─── محصول ───
            if (data.Product && data.Product.length > 0) {
                State.currentProduct = data.Product[0];
            } else {
                UI.showToast('محصول یافت نشد', 'error');
                return false;
            }

            // ─── دسته‌بندی و مشخصات ───
            State.kindProducts = data.KindProducts || [];
            State.optionProducts = data.OptionProducts || [];

            // ─── رندر ───
            renderProduct(State.currentProduct);
            return true;

        } catch (err) {
            if (err.message === 'AUTH_REQUIRED') return false;

            console.error('خطا در بارگذاری:', err);
            UI.showToast('خطا در ارتباط با سرور', 'error');
            return false;
        }
    }

    // ═══════════════════════════════════════════════════════
    // رندر — محصول اصلی
    // ═══════════════════════════════════════════════════════
    function renderProduct(product) {
        if (!product) {
            UI.showToast('محصول یافت نشد!', 'error');
            return;
        }

        State.currentProduct = product;
        State.currentProductId = product.ProductId;

        // ─── انتخاب اولین رنگ فعال ───
        const activeColors = (product.Colors || []).filter(c => c.Status !== false);
        State.selectedColorId = activeColors.length > 0
            ? activeColors[0].ColorPriceProductId
            : null;

        // ─── شناسه ───
        if (el.productIdDisplay) {
            el.productIdDisplay.textContent = `#${product.ProductId}`;
        }

        // ─── عنوان و کد ───
        if (el.productTitle) {
            el.productTitle.textContent = product.ProductCaption || 'بدون عنوان';
        }
        if (el.productCode) {
            el.productCode.textContent = product.CodeInternalProducts || '---';
        }

        // ─── قیمت ───
        if (el.productPrice) {
            const basePrice = product.PriceProduct
                ? product.PriceProduct.toLocaleString('fa-IR')
                : '---';
            el.productPrice.innerHTML = `${basePrice} <small>تومان</small>`;
        }

        // ─── توضیحات ───
        if (el.productDescription) {
            el.productDescription.textContent = product.DetailProducts
                || 'توضیحاتی برای این محصول ثبت نشده است.';
        }

        // ─── بخش‌ها ───
        renderGallery(product.Files);
        renderColors(product.Colors);
        renderSpecs(product.Details);
        renderDetails(product.Details);
        updateAddToCartButton();
        saveToHistory(product.ProductId);
    }

    // ═══════════════════════════════════════════════════════
    // رندر — گالری
    // ═══════════════════════════════════════════════════════
    function renderGallery(files) {
        if (!el.galleryMain) return;

        const activeFiles = (files || []).filter(f => f.Status !== false);

        // ─── خالی ───
        if (activeFiles.length === 0) {
            el.galleryMain.innerHTML = `
                <div class="no-image">
                    <i class="fas fa-image"></i>
                    <span>تصویری برای این محصول وجود ندارد</span>
                </div>`;
            if (el.galleryThumbs) el.galleryThumbs.innerHTML = '';
            return;
        }

        // ─── تصویر اصلی ───
        el.galleryMain.innerHTML = `
            <img src="/Images/Product/${activeFiles[0].CodeFileProduct}"
                 alt="${UI.escapeHtml(activeFiles[0].FileProductCaption || 'تصویر محصول')}"
                 id="mainImage"
                 onerror="this.src='/Store/images/no-image.jpg'">`;

        // ─── تصاویر کوچک ───
        if (el.galleryThumbs) {
            el.galleryThumbs.innerHTML = activeFiles.map((f, idx) => `
                <img src="/Images/Product/${f.CodeFileProduct || ''}"
                     alt="${UI.escapeHtml(f.FileProductCaption || 'تصویر')}"
                     class="${idx === 0 ? 'active' : ''}"
                     data-index="${idx}"
                     onerror="this.src='/Store/images/no-image.jpg'"
                     onclick="window.changeProductImage(${idx})">`).join('');
        }
    }

    // ─── تغییر تصویر اصلی ───
    window.changeProductImage = function (index) {
        const mainImg = document.getElementById('mainImage');
        const thumbs = document.querySelectorAll('.gallery-thumbs img');
        if (!mainImg || !thumbs[index]) return;

        mainImg.src = thumbs[index].src;
        thumbs.forEach((t, i) => t.classList.toggle('active', i === index));
    };

    // ═══════════════════════════════════════════════════════
    // رندر — رنگ‌ها
    // ═══════════════════════════════════════════════════════
    function renderColors(colors) {
        if (!el.colorOptionsItems) return;

        const activeColors = (colors || []).filter(c => c.Status !== false);

        // ─── خالی ───
        if (activeColors.length === 0) {
            el.colorOptionsItems.innerHTML = `
                <div style="color:var(--text-secondary);font-size:0.85rem;">
                    <i class="fas fa-info-circle"></i> رنگ‌بندی برای این محصول ثبت نشده است
                </div>`;
            State.selectedColorId = null;
            updateAddToCartButton();
            return;
        }

        // ─── رندر ───
        el.colorOptionsItems.innerHTML = activeColors.map(c => {
            const isActive = c.ColorPriceProductId === State.selectedColorId;
            const inStock = c.InStore !== null && c.InStore > 0;

            const priceWithOffer = c.Offer && c.Offer > 0
                ? (c.PriceProduct * (1 - c.Offer / 100)).toFixed(0)
                : c.PriceProduct;

            const discountBadge = c.Offer && c.Offer > 0
                ? `<span style="background:var(--danger);color:white;padding:0 8px;border-radius:40px;font-size:0.6rem;">${c.Offer}%</span>`
                : '';

            return `
                <div class="color-item ${isActive ? 'active' : ''}"
                     data-id="${c.ColorPriceProductId}"
                     onclick="window.selectProductColor(${c.ColorPriceProductId})">
                    <span class="color-dot" style="background:${getColorHex(c.ColorPriceProductCaption)};"></span>
                    <span>${UI.escapeHtml(c.ColorPriceProductCaption)}</span>
                    <span class="color-price">${Number(priceWithOffer).toLocaleString('fa-IR')}</span>
                    <span class="color-stock ${inStock ? 'in-stock' : 'out-stock'}">
                        ${inStock ? `موجود (${c.InStore})` : 'ناموجود'}
                    </span>
                    ${discountBadge}
                </div>`;
        }).join('');

        updateAddToCartButton();
    }

    // ─── انتخاب رنگ ───
    window.selectProductColor = function (colorId) {
        State.selectedColorId = colorId;
        const colors = State.currentProduct?.Colors || [];
        renderColors(colors);
    };

    // ═══════════════════════════════════════════════════════
    // رندر — مشخصات فنی
    // ═══════════════════════════════════════════════════════
    function renderSpecs(details) {
        if (!el.specsContainer) return;

        const activeDetails = (details || []).filter(d =>
            d.Status !== false && d.OptionProductId != 1);

        if (activeDetails.length === 0) {
            el.specsContainer.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-info-circle"></i> مشخصات فنی ثبت نشده است
                </div>`;
            return;
        }

        el.specsContainer.innerHTML = `
            <div class="spec-list">
                ${activeDetails.map(d => `
                    <div class="spec-item">
                        <span class="spec-label">${UI.escapeHtml(getOptionName(d.OptionProductId))}</span>
                        <span class="spec-value">${UI.escapeHtml(d.DetailProductCaption)}</span>
                    </div>
                `).join('')}
            </div>`;
    }

    // ═══════════════════════════════════════════════════════
    // رندر — توضیحات
    // ═══════════════════════════════════════════════════════
    function renderDetails(details) {
        if (!el.detailsContainer) return;

        const activeDetails = (details || []).filter(d =>
            d.Status !== false && d.OptionProductId == 1);

        if (activeDetails.length === 0) {
            el.detailsContainer.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-info-circle"></i> توضیحاتی ثبت نشده است
                </div>`;
            return;
        }

        el.detailsContainer.innerHTML = `
            <div class="detail-list">
                ${activeDetails.map(d => `
                    <div class="detail-item">
                        <div class="detail-text">${UI.escapeHtml(d.DetailProductCaption)}</div>
                    </div>
                `).join('')}
            </div>`;
    }

    // ═══════════════════════════════════════════════════════
    // دکمه افزودن به سبد
    // ═══════════════════════════════════════════════════════
    function updateAddToCartButton() {
        if (!el.addToCartBtn) return;

        // ─── بارگذاری ───
        if (!State.currentProduct) {
            el.addToCartBtn.disabled = true;
            el.addToCartBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> بارگذاری...';
            return;
        }

        // ─── بدون رنگ ───
        if (!State.selectedColorId) {
            el.addToCartBtn.disabled = true;
            el.addToCartBtn.innerHTML = '<i class="fas fa-exclamation-circle"></i> انتخاب رنگ';
            return;
        }

        // ─── رنگ نامعتبر ───
        const selectedColor = (State.currentProduct.Colors || []).find(c =>
            c.ColorPriceProductId === State.selectedColorId);

        if (!selectedColor) {
            el.addToCartBtn.disabled = true;
            el.addToCartBtn.innerHTML = '<i class="fas fa-exclamation-circle"></i> رنگ نامعتبر';
            return;
        }

        // ─── ناموجود ───
        const inStock = selectedColor.InStore !== null && selectedColor.InStore > 0;
        if (!inStock) {
            el.addToCartBtn.disabled = true;
            el.addToCartBtn.innerHTML = '<i class="fas fa-times-circle"></i> ناموجود';
            return;
        }

        // ─── آماده ───
        el.addToCartBtn.disabled = false;
        el.addToCartBtn.innerHTML = '<i class="fas fa-shopping-cart"></i> افزودن به سبد خرید';
    }

    // ═══════════════════════════════════════════════════════
    // افزودن به سبد
    // ═══════════════════════════════════════════════════════
    function initAddToCart() {
        if (!el.addToCartBtn) return;

        el.addToCartBtn.addEventListener('click', function () {
            if (this.disabled) return;
            if (!State.currentProduct) return;

            const selectedColor = (State.currentProduct.Colors || []).find(c =>
                c.ColorPriceProductId === State.selectedColorId);

            if (!selectedColor) {
                UI.showToast('لطفاً یک رنگ را انتخاب کنید', 'error');
                return;
            }

            // ─── قیمت با احتساب تخفیف ───
            const priceWithOffer = selectedColor.Offer && selectedColor.Offer > 0
                ? (selectedColor.PriceProduct * (1 - selectedColor.Offer / 100)).toFixed(0)
                : selectedColor.PriceProduct;

            // ─── افزودن به سبد ───
            Cart.add(State.currentProduct.ProductId, State.selectedColorId, {
                productCaption: State.currentProduct.ProductCaption,
                colorCaption: selectedColor.ColorPriceProductCaption,
                price: parseInt(priceWithOffer),
                photo: State.currentProduct.Files && State.currentProduct.Files[0]
                    ? State.currentProduct.Files[0].CodeFileProduct
                    : ''
            });

            UI.showToast('به سبد خرید اضافه شد ✅', 'success');
        });
    }

    // ═══════════════════════════════════════════════════════
    // تاریخچه بازدید
    // ═══════════════════════════════════════════════════════
    function saveToHistory(productId) {
        try {
            let history = JSON.parse(
                localStorage.getItem('negarshop_product_history') || '[]');

            history = history.filter(id => id !== productId);
            history.unshift(productId);

            if (history.length > 20) history.pop();

            localStorage.setItem(
                'negarshop_product_history',
                JSON.stringify(history)
            );
        } catch (e) { /* ignore */ }
    }

    // ═══════════════════════════════════════════════════════
    // Init
    // ═══════════════════════════════════════════════════════
    async function init() {
        State.currentProductId = getProductIdFromUrl();

        if (!State.currentProductId || State.currentProductId <= 0) {
            UI.showToast('شناسه محصول نامعتبر', 'error');
            return;
        }

        const loaded = await loadProductWithBaseData();

        if (loaded) {
            initAddToCart();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();