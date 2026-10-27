(function () {
    'use strict';

    const Http = window.HttpHelper;
    const UI = window.UICore;
    const Cart = window.CartStore;

    const State = {
        products: [],
        kindList: [],
        allColors: [],
        shopName: '',
        filters: { kindId: 'all', color: 'all', priceMin: '', priceMax: '', stock: 'all', search: '' }
    };

    const el = {
        grid: document.getElementById('productsGrid'),
        resultCount: document.getElementById('resultCount'),
        kindFilter: document.getElementById('kindFilter'),
        colorOptions: document.getElementById('colorOptions'),
        priceMin: document.getElementById('priceMin'),
        priceMax: document.getElementById('priceMax'),
        stockFilter: document.getElementById('stockFilter'),
        searchInput: document.getElementById('productSearch'),
        filterSidebar: document.getElementById('filterSidebar'),
        filterOverlay: document.getElementById('filterOverlay'),
        filterToggleBtn: document.getElementById('filterToggleBtn'),
        closeFilterBtn: document.getElementById('closeFilterBtn'),
        applyFiltersBtn: document.getElementById('applyFiltersBtn'),
        resetFiltersBtn: document.getElementById('resetFiltersBtn')
    };

    function getShopName() {
        if (document.body.dataset.shopName) return document.body.dataset.shopName;
        const params = new URLSearchParams(window.location.search);
        return params.get('Code') || '';
    }

    async function fetchProducts() {
        try {
            const response = await Http.post('/ShopPanel/Products/GetAll', { shop: State.shopName });
            if (response.isSuccess) {
                State.products = JSON.parse(response.data);
                localStorage.setItem('ProductsStore', JSON.stringify(State.products));
                updateClasses();
                renderProducts();
                populateFilters();
            } else {
                console.error('خطا در دریافت محصولات:', response.errorTitle);
                renderEmpty();
            }
        } catch (err) {
            if (err.message === 'AUTH_REQUIRED') return;
            console.error('خطای شبکه:', err);
            renderEmpty();
        }
    }

    async function loadProductsFromStorage() {
        const saved = localStorage.getItem('ProductsStore');
        if (saved) {
            try {
                State.products = JSON.parse(saved);
                updateClasses();
                renderProducts();
                populateFilters();
                fetchProducts();
            } catch (e) {
                console.warn('⚠️ ProductsStore خراب بود');
                localStorage.removeItem('ProductsStore');
                await fetchProducts();
            }
        } else {
            await fetchProducts();
        }
    }

    function updateClasses() {
        const kindIds = [...new Set(State.products.map(p => p.KindProductId))];
        State.kindList = kindIds.map(id => {
            const p = State.products.find(pp => pp.KindProductId === id);
            return { KindProductId: id, KindProductCaption: p ? p.KindProductCaption : `دسته ${id}` };
        });

        State.allColors = [];
        State.products.forEach(p => {
            if (p.Color) {
                p.Color.split(',').map(c => c.trim()).forEach(c => {
                    if (c && !State.allColors.includes(c)) State.allColors.push(c);
                });
            }
        });
    }

    function getFilteredProducts() {
        let filtered = State.products.filter(p => p.Status === true);

        if (State.filters.kindId !== 'all') filtered = filtered.filter(p => p.KindProductId === parseInt(State.filters.kindId));
        if (State.filters.color !== 'all') filtered = filtered.filter(p => p.Color && p.Color.split(',').map(c => c.trim()).includes(State.filters.color));

        const minPrice = State.filters.priceMin ? parseInt(State.filters.priceMin) : null;
        const maxPrice = State.filters.priceMax ? parseInt(State.filters.priceMax) : null;

        if (minPrice !== null) filtered = filtered.filter(p => p.PriceProduct !== null && p.PriceProduct >= minPrice);
        if (maxPrice !== null) filtered = filtered.filter(p => p.PriceProduct !== null && p.PriceProduct <= maxPrice);

        if (State.filters.stock === 'in-stock') filtered = filtered.filter(p => p.InStore !== null && p.InStore > 0);
        else if (State.filters.stock === 'out-stock') filtered = filtered.filter(p => p.InStore === null || p.InStore === 0);

        if (State.filters.search) {
            const s = State.filters.search.toLowerCase();
            filtered = filtered.filter(p => (p.ProductCaption || '').toLowerCase().includes(s) || (p.CodeInternalProducts || '').toLowerCase().includes(s));
        }
        return filtered;
    }

    function renderProducts() {
        if (!el.grid) return;
        const filtered = getFilteredProducts();
        if (el.resultCount) el.resultCount.textContent = `${filtered.length} محصول`;
        if (filtered.length === 0) { renderEmpty(); return; }

        el.grid.innerHTML = filtered.map(p => renderSimpleCard(p)).join('');
        initSimpleGalleries();
        initAddToCart();
    }

    function renderEmpty() {
        if (!el.grid) return;
        el.grid.innerHTML = `<div class="no-products"><i class="fas fa-box-open"></i><h3>محصولی یافت نشد</h3><p>با تغییر فیلترها محصولات بیشتری مشاهده کنید</p></div>`;
    }

    function getPhotos(p) {
        return p.Photos ? p.Photos.split(',').map(x => x.trim()).filter(Boolean) : [];
    }

    function getPriceText(p) {
        return p.PriceProduct ? p.PriceProduct.toLocaleString('fa-IR') : 'تماس بگیرید';
    }

    function isInStock(p) {
        return p.InStore !== null && p.InStore !== undefined && p.InStore > 0;
    }

    function renderSimpleCard(p) {
        const photos = getPhotos(p);
        const stock = isInStock(p);
        const price = getPriceText(p);
        const detailUrl = `/ShopPanel/Product/Details/${p.ProductId}`;

        const rating = 4.3;
        const discountPercent = 5;
        const oldPrice = p.PriceProduct ? p.PriceProduct * 1.05 : null;

        const colors = p.Color ? p.Color.split(',').map(c => c.trim()) : [];
        const colorDisplay = colors.length ? colors.join('، ') : 'بدون رنگ';
        const bgColors = { 'مشکی': '#1a1a1a', 'سفید': '#ffffff', 'نقره‌ای': '#c0c0c0', 'خاکستری': '#6b7280', 'آبی': '#3b82f6', 'قرمز': '#ef4444', 'سبز': '#22c55e', 'زرد': '#eab308', 'صورتی': '#ec4899', 'طوسی': '#9ca3af', 'طلایی': '#d97706', 'نارنجی': '#f97316' };

        let galleryHtml = '';
        if (photos.length === 0) {
            galleryHtml = `<div class="slides"><div class="slide active"><img src="/Store/images/no-image.jpg" alt="بدون تصویر" loading="lazy"></div></div>`;
        } else {
            // تصاویر
            galleryHtml = `<a href="${detailUrl}"><div class="slides">${photos.map((ph, idx) => `<div class="slide ${idx === 0 ? 'active' : ''}"><img src="/Images/Product/${ph}" alt="تصویر ${idx + 1}" loading="lazy"></div>`).join('')}</div></a>`;

            // اگر بیش از یک عکس وجود داشت، فلش‌ها و دات‌ها اضافه شوند
            if (photos.length > 1) {
                galleryHtml += `
                    <!-- دکمه‌های عقب و جلو -->
                    <button class="gallery-nav prev" data-id="${p.ProductId}" aria-label="قبلی"><i class="fas fa-chevron-right"></i></button>
                    <button class="gallery-nav next" data-id="${p.ProductId}" aria-label="بعدی"><i class="fas fa-chevron-left"></i></button>
                    
                    <!-- نقطه‌ها -->
                    <div class="gallery-controls">
                        <div class="gallery-dots">
                            ${photos.map((_, idx) => `<span class="dot ${idx === 0 ? 'active' : ''}" data-index="${idx}"></span>`).join('')}
                        </div>
                    </div>`;
            }
        }

        let colorDotsHtml = '';
        if (colors.length > 0) {
            colorDotsHtml = `<div class="color-dots">${colors.slice(0, 4).map(c => `<span style="background:${bgColors[c] || '#ddd'}; ${c === 'سفید' ? 'border:1px solid #ddd;' : ''}"></span>`).join('')}</div>`;
        }

        return `
            <div class="product-card" data-id="${p.ProductId}">
                <div class="product-gallery">${galleryHtml}</div>
                <div class="product-info">
                    <a href="${detailUrl}" style="text-decoration:none;"><div class="product-title">${UI.escapeHtml(p.ProductCaption)}</div></a>
                    <div class="product-code">کد: ${UI.escapeHtml(p.CodeInternalProducts || '—')} | ${UI.escapeHtml(p.KindProductCaption || '')}</div>
                    <div class="product-detail">${UI.escapeHtml(p.DetailProducts || 'توضیحاتی ثبت نشده')}</div>
                    <div class="product-colors"><i class="fas fa-palette"></i> رنگ‌ها: ${UI.escapeHtml(colorDisplay)}</div>
                    <div class="product-rating-row">
                        <div class="rating-box"><i class="fas fa-star"></i> ${rating.toLocaleString('fa-IR')}</div>
                        ${colorDotsHtml}
                    </div>
                    <div class="product-price-row">
                        <div class="discount-badge">${discountPercent}٪</div>
                        <div class="price-current">${price} <small>تومان</small></div>
                        ${oldPrice ? `<div class="price-old">${oldPrice.toLocaleString('fa-IR')}</div>` : ''}
                    </div>
                    <div class="product-meta">
                        <button class="add-to-cart-btn ${Cart.has(p.ProductId, null) ? 'added' : ''}" data-id="${p.ProductId}" ${!stock ? 'disabled' : ''}>
                            ${Cart.has(p.ProductId, null) ? 'در سبد' : 'افزودن'}
                        </button>
                        <span class="product-stock">${stock ? `موجود: ${p.InStore} عدد` : 'ناموجود'}</span>
                    </div>
                </div>
            </div>`;
    }

    function initSimpleGalleries() {
        document.querySelectorAll('.product-card').forEach(card => {
            const productId = parseInt(card.dataset.id);
            const product = State.products.find(p => p.ProductId === productId);
            if (!product) return;

            const photos = getPhotos(product);
            if (photos.length <= 1) return;

            const slides = card.querySelectorAll('.slide');
            const dots = card.querySelectorAll('.dot');
            if (!slides.length) return;

            let currentIndex = 0;

            const goToSlide = (index) => {
                if (index < 0) index = photos.length - 1;
                if (index >= photos.length) index = 0;
                currentIndex = index;
                slides.forEach((s, i) => s.classList.toggle('active', i === index));
                dots.forEach((d, i) => d.classList.toggle('active', i === index));
            };

            // رویداد کلیک برای دکمه‌های عقب و جلو
            card.querySelector('.gallery-nav.prev')?.addEventListener('click', e => {
                e.stopPropagation(); e.preventDefault();
                goToSlide(currentIndex - 1);
            });
            card.querySelector('.gallery-nav.next')?.addEventListener('click', e => {
                e.stopPropagation(); e.preventDefault();
                goToSlide(currentIndex + 1);
            });

            // رویداد کلیک برای نقطه‌ها
            dots.forEach((dot, idx) => dot.addEventListener('click', e => {
                e.stopPropagation(); e.preventDefault();
                goToSlide(idx);
            }));

            // پشتیبانی از سوایپ در موبایل
            const media = card.querySelector('.product-gallery');
            if (media) {
                let sx = 0, sy = 0;
                media.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
                media.addEventListener('touchend', e => {
                    const dx = e.changedTouches[0].clientX - sx;
                    const dy = e.changedTouches[0].clientY - sy;
                    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) goToSlide(dx > 0 ? currentIndex - 1 : currentIndex + 1);
                }, { passive: true });
            }
        });
    }

    function initAddToCart() {
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            if (btn.dataset.bound === '1') return;
            btn.dataset.bound = '1';
            btn.addEventListener('click', function (e) {
                e.stopPropagation(); e.preventDefault();
                if (this.disabled) return;
                const id = parseInt(this.dataset.id);
                const product = State.products.find(p => p.ProductId === id);
                if (!product) return;
                addProductToCart(product);
                document.querySelectorAll(`.add-to-cart-btn[data-id="${id}"]`).forEach(b => {
                    b.classList.add('added');
                    b.innerHTML = 'در سبد';
                });
            });
        });
    }

    function addProductToCart(product) {
        const firstColor = product.Colors && product.Colors.length > 0 ? product.Colors[0] : null;
        const colorId = firstColor ? firstColor.ColorPriceProductId : 0;
        const colorCaption = firstColor ? firstColor.ColorPriceProductCaption : '';
        const price = firstColor && firstColor.PriceProduct ? firstColor.PriceProduct : (product.PriceProduct || 0);

        Cart.add(product.ProductId, colorId, {
            productCaption: product.ProductCaption, colorCaption: colorCaption, price: price, photo: (product.Photos || '').split(',')[0] || ''
        });
        UI.showToast('به سبد خرید اضافه شد ✅', 'success');
    }

    function applyFilters() {
        State.filters.kindId = el.kindFilter?.value || 'all';
        State.filters.priceMin = el.priceMin?.value || '';
        State.filters.priceMax = el.priceMax?.value || '';
        State.filters.stock = el.stockFilter?.value || 'all';
        renderProducts(); closeFilter();
    }

    function resetFilters() {
        if (el.kindFilter) el.kindFilter.value = 'all';
        if (el.priceMin) el.priceMin.value = '';
        if (el.priceMax) el.priceMax.value = '';
        if (el.stockFilter) el.stockFilter.value = 'all';
        document.querySelectorAll('.color-option').forEach(el => el.classList.remove('active'));
        document.querySelector('.color-option.all-colors')?.classList.add('active');
        State.filters = { kindId: 'all', color: 'all', priceMin: '', priceMax: '', stock: 'all', search: '' };
        renderProducts(); closeFilter();
    }

    function populateFilters() {
        if (el.kindFilter) {
            el.kindFilter.innerHTML = '<option value="all">همه دسته‌ها</option>';
            State.kindList.forEach(k => { el.kindFilter.innerHTML += `<option value="${k.KindProductId}">${UI.escapeHtml(k.KindProductCaption)}</option>`; });
        }

        if (!el.colorOptions) return;
        el.colorOptions.innerHTML = '<div class="color-option all-colors active" data-color="all">همه</div>';
        const bgColors = { 'مشکی': '#1a1a1a', 'سفید': '#ffffff', 'نقره‌ای': '#c0c0c0', 'خاکستری': '#6b7280', 'آبی': '#3b82f6', 'قرمز': '#ef4444', 'سبز': '#22c55e', 'زرد': '#eab308', 'صورتی': '#ec4899', 'طوسی': '#9ca3af', 'طلایی': '#d97706', 'نارنجی': '#f97316' };

        State.allColors.forEach(color => {
            const colorDiv = document.createElement('div');
            colorDiv.className = 'color-option'; colorDiv.dataset.color = color;
            colorDiv.style.background = bgColors[color] || '#6b7280';
            if (color === 'سفید') colorDiv.style.borderColor = '#d1d5db';
            colorDiv.innerHTML = `<span class="color-check"><i class="fas fa-check"></i></span>`;
            colorDiv.addEventListener('click', function () {
                document.querySelectorAll('.color-option').forEach(e => e.classList.remove('active'));
                this.classList.add('active'); State.filters.color = this.dataset.color;
            });
            el.colorOptions.appendChild(colorDiv);
        });

        el.colorOptions.querySelector('.all-colors')?.addEventListener('click', function () {
            document.querySelectorAll('.color-option').forEach(e => e.classList.remove('active'));
            this.classList.add('active'); State.filters.color = 'all';
        });
    }

    function openFilter() { el.filterSidebar?.classList.add('open'); el.filterOverlay?.classList.add('active'); document.body.style.overflow = 'hidden'; }
    function closeFilter() { el.filterSidebar?.classList.remove('open'); el.filterOverlay?.classList.remove('active'); document.body.style.overflow = ''; }
    function closeAll() { closeFilter(); if (window.CartUI) window.CartUI.close(); }

    function bindEvents() {
        el.filterToggleBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (el.filterSidebar?.classList.contains('open')) closeFilter();
            else { if (window.CartUI) window.CartUI.close(); openFilter(); }
        });

        el.closeFilterBtn?.addEventListener('click', closeFilter);
        el.filterOverlay?.addEventListener('click', closeFilter);
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAll(); });
        el.applyFiltersBtn?.addEventListener('click', applyFilters);
        el.resetFiltersBtn?.addEventListener('click', resetFilters);

        el.priceMin?.addEventListener('keypress', (e) => { if (e.key === 'Enter') applyFilters(); });
        el.priceMax?.addEventListener('keypress', (e) => { if (e.key === 'Enter') applyFilters(); });

        if (el.searchInput) {
            const debounced = UI.debounce((value) => { State.filters.search = value; renderProducts(); }, 300);
            el.searchInput.addEventListener('input', (e) => debounced(e.target.value));
        }

        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => { if (State.products.length > 0) renderProducts(); }, 250);
        });
    }

    async function init() {
        State.shopName = getShopName();
        bindEvents();
        await loadProductsFromStorage();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();