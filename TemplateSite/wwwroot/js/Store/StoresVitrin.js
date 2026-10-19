
(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════
    // وابستگی‌ها
    // ═══════════════════════════════════════════════════════
    const Http = window.HttpHelper;
    const UI = window.UICore;
    const Cart = window.CartStore;

    // ═══════════════════════════════════════════════════════
    // State
    // ═══════════════════════════════════════════════════════
    const State = {
        products: [],
        kindList: [],
        allColors: [],
        shopName: '',

        filters: {
            kindId: 'all',
            color: 'all',
            priceMin: '',
            priceMax: '',
            stock: 'all',
            search: ''
        }
    };

    // ═══════════════════════════════════════════════════════
    // ثابت‌ها
    // ═══════════════════════════════════════════════════════
    const LAYOUT_CYCLE = 40;
    const MOBILE_BREAKPOINT = 640;

    const LAYOUT_CONTAINER = {
        simple: 'products-grid',
        album: 'album-list',
        book: 'grid-book',
        alt: 'alt-list'
    };

    // ═══════════════════════════════════════════════════════
    // DOM Elements
    // ═══════════════════════════════════════════════════════
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

    // ═══════════════════════════════════════════════════════
    // ابزار — دریافت نام فروشگاه از URL
    // ═══════════════════════════════════════════════════════
    function getShopName() {
        if (document.body.dataset.shopName) return document.body.dataset.shopName;
        const params = new URLSearchParams(window.location.search);
        return params.get('Code') || '';
    }

    // ═══════════════════════════════════════════════════════
    // بارگذاری محصولات
    // ═══════════════════════════════════════════════════════
    async function fetchProducts() {
        try {
            const response = await Http.post('/ShopPanel/Products/GetAll', {
                shop: State.shopName
            });

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

    // ─── بارگذاری از localStorage ───
    async function loadProductsFromStorage() {
        const saved = localStorage.getItem('ProductsStore');

        if (saved) {
            try {
                State.products = JSON.parse(saved);
                updateClasses();
                renderProducts();
                populateFilters();

                // ─── پس‌زمینه: آپدیت از سرور ───
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

    // ═══════════════════════════════════════════════════════
    // استخراج دسته‌ها و رنگ‌ها
    // ═══════════════════════════════════════════════════════
    function updateClasses() {
        // ─── دسته‌بندی‌ها ───
        const kindIds = [...new Set(State.products.map(p => p.KindProductId))];

        State.kindList = kindIds.map(id => {
            const p = State.products.find(pp => pp.KindProductId === id);
            return {
                KindProductId: id,
                KindProductCaption: p ? p.KindProductCaption : `دسته ${id}`
            };
        });

        // ─── رنگ‌ها ───
        State.allColors = [];
        State.products.forEach(p => {
            if (p.Color) {
                p.Color.split(',').map(c => c.trim()).forEach(c => {
                    if (c && !State.allColors.includes(c)) {
                        State.allColors.push(c);
                    }
                });
            }
        });
    }

    // ═══════════════════════════════════════════════════════
    // چیدمان — تعیین نوع بر اساس index
    // ═══════════════════════════════════════════════════════
    function isMobileView() {
        return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches;
    }

    function getLayoutForIndex(index) {
        if (isMobileView()) {
            return index % 2 === 0 ? 'simple' : 'album';
        }
        const cycle = index % LAYOUT_CYCLE;
        if (cycle < 10) return 'simple';
        if (cycle < 20) return 'album';
        if (cycle < 30) return 'book';
        return 'alt';
    }

    // ═══════════════════════════════════════════════════════
    // فیلتر
    // ═══════════════════════════════════════════════════════
    function getFilteredProducts() {
        let filtered = State.products.filter(p => p.Status === true);

        // ─── دسته ───
        if (State.filters.kindId !== 'all') {
            filtered = filtered.filter(p =>
                p.KindProductId === parseInt(State.filters.kindId));
        }

        // ─── رنگ ───
        if (State.filters.color !== 'all') {
            filtered = filtered.filter(p => {
                if (!p.Color) return false;
                return p.Color.split(',').map(c => c.trim())
                    .includes(State.filters.color);
            });
        }

        // ─── قیمت ───
        const minPrice = State.filters.priceMin ? parseInt(State.filters.priceMin) : null;
        const maxPrice = State.filters.priceMax ? parseInt(State.filters.priceMax) : null;

        if (minPrice !== null) {
            filtered = filtered.filter(p =>
                p.PriceProduct !== null && p.PriceProduct >= minPrice);
        }
        if (maxPrice !== null) {
            filtered = filtered.filter(p =>
                p.PriceProduct !== null && p.PriceProduct <= maxPrice);
        }

        // ─── موجودی ───
        if (State.filters.stock === 'in-stock') {
            filtered = filtered.filter(p => p.InStore !== null && p.InStore > 0);
        } else if (State.filters.stock === 'out-stock') {
            filtered = filtered.filter(p => p.InStore === null || p.InStore === 0);
        }

        // ─── جستجو ───
        if (State.filters.search) {
            const s = State.filters.search.toLowerCase();
            filtered = filtered.filter(p =>
                (p.ProductCaption || '').toLowerCase().includes(s) ||
                (p.CodeInternalProducts || '').toLowerCase().includes(s)
            );
        }

        return filtered;
    }

    // ═══════════════════════════════════════════════════════
    // رندر — اصلی
    // ═══════════════════════════════════════════════════════
    function renderProducts() {
        if (!el.grid) return;

        const filtered = getFilteredProducts();

        // ─── تعداد نتایج ───
        if (el.resultCount) {
            el.resultCount.textContent = `${filtered.length} محصول`;
        }

        // ─── خالی ───
        if (filtered.length === 0) {
            renderEmpty();
            return;
        }

        // ─── گروه‌بندی چیدمان ───
        const groups = [];
        let currentType = null;
        let currentItems = [];

        filtered.forEach((p, i) => {
            const type = getLayoutForIndex(i);

            if (type !== currentType) {
                if (currentItems.length) {
                    groups.push({ type: currentType, items: currentItems });
                }
                currentType = type;
                currentItems = [p];
            } else {
                currentItems.push(p);
            }
        });

        if (currentItems.length) {
            groups.push({ type: currentType, items: currentItems });
        }

        // ─── رندر ───
        let html = '';
        groups.forEach(g => {
            const cls = LAYOUT_CONTAINER[g.type];
            html += `<div class="${cls}">` +
                g.items.map(p => renderCardByType(g.type, p)).join('') +
                `</div>`;
        });

        el.grid.innerHTML = html;

        // ─── راه‌اندازی گالری‌ها ───
        initSimpleGalleries();
        initAlbums();
        initAddToCart();
    }

    function renderEmpty() {
        if (!el.grid) return;
        el.grid.innerHTML = `
            <div class="no-products">
                <i class="fas fa-box-open"></i>
                <h3>محصولی یافت نشد</h3>
                <p>با تغییر فیلترها محصولات بیشتری مشاهده کنید</p>
            </div>`;
    }

    // ═══════════════════════════════════════════════════════
    // رندر — کارت بر اساس چیدمان
    // ═══════════════════════════════════════════════════════
    function renderCardByType(type, p) {
        switch (type) {
            case 'album': return renderAlbumCard(p);
            case 'book': return renderBookCard(p);
            case 'alt': return renderAltCard(p);
            default: return renderSimpleCard(p);
        }
    }

    // ─── ابزارهای مشترک کارت ───
    function getPhotos(p) {
        return p.Photos
            ? p.Photos.split(',').map(x => x.trim()).filter(Boolean)
            : [];
    }

    function getPriceText(p) {
        return p.PriceProduct
            ? p.PriceProduct.toLocaleString('fa-IR')
            : 'تماس بگیرید';
    }

    function isInStock(p) {
        return p.InStore !== null && p.InStore !== undefined && p.InStore > 0;
    }

    function cartBtnHtml(p) {
        const inCart = Cart.has(p.ProductId, null);
        const stock = isInStock(p);

        return `<button class="add-to-cart-btn ${inCart ? 'added' : ''}"
                        data-id="${p.ProductId}"
                        ${!stock ? 'disabled' : ''}>
                    <i class="fas ${inCart ? 'fa-check' : 'fa-shopping-cart'}"></i>
                    ${inCart ? 'در سبد' : 'افزودن'}
                </button>`;
    }

    // ─── کارت Simple ───
    function renderSimpleCard(p) {
        const photos = getPhotos(p);
        const stock = isInStock(p);
        const price = getPriceText(p);
        const colors = p.Color ? p.Color.split(',').map(c => c.trim()) : [];
        const colorDisplay = colors.length ? colors.join('، ') : 'بدون رنگ';
        const detailUrl = `/ShopPanel/Product/Details/${p.ProductId}`;

        let galleryHtml = '';

        if (photos.length === 0) {
            galleryHtml = `
                <div class="slides">
                    <div class="slide"><img src="/Store/images/no-image.jpg" alt="بدون تصویر"></div>
                </div>`;
        } else {
            galleryHtml = `
                <a href="${detailUrl}">
                    <div class="slides" id="slides-${p.ProductId}">
                        ${photos.map((ph, idx) => `
                            <div class="slide" data-index="${idx}">
                                <img src="/Images/Product/${ph}" alt="تصویر ${idx + 1}" loading="lazy">
                            </div>
                        `).join('')}
                    </div>
                </a>`;

            if (photos.length > 1) {
                galleryHtml += `
                    <div class="gallery-controls">
                        <button class="gallery-prev" data-id="${p.ProductId}">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                        <div class="gallery-dots" id="dots-${p.ProductId}">
                            ${photos.map((_, idx) =>
                    `<span class="dot ${idx === 0 ? 'active' : ''}" data-index="${idx}"></span>`
                ).join('')}
                        </div>
                        <button class="gallery-next" data-id="${p.ProductId}">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                    </div>
                    <div class="image-count-badge">${photos.length} تصویر</div>`;
            }
        }

        return `
            <div class="product-card" data-id="${p.ProductId}">
                <div class="product-gallery">${galleryHtml}</div>
                <div class="product-info">
                    <a href="${detailUrl}">
                        <div class="product-title">${UI.escapeHtml(p.ProductCaption)}</div>
                    </a>
                    <div class="product-code">
                        کد: ${UI.escapeHtml(p.CodeInternalProducts || '—')}
                        | ${UI.escapeHtml(p.KindProductCaption || '')}
                    </div>
                    <div class="product-price">${price} <small>تومان</small></div>
                    <div class="product-detail">
                        ${UI.escapeHtml(p.DetailProducts || 'توضیحاتی ثبت نشده')}
                    </div>
                    <div style="font-size:.75rem;color:var(--text-secondary);margin-bottom:6px;">
                        <i class="fas fa-palette"></i> رنگ‌ها: ${UI.escapeHtml(colorDisplay)}
                    </div>
                    <div class="product-meta">
                        <span class="product-kind">
                            <i class="fas fa-store"></i> ${UI.escapeHtml(p.StoreCaption || '')}
                        </span>
                        <span class="product-stock">
                            <i class="fas ${stock ? 'fa-check-circle in-stock' : 'fa-times-circle out-stock'}"></i>
                            ${stock ? `موجود (${p.InStore})` : 'ناموجود'}
                        </span>
                        ${cartBtnHtml(p)}
                    </div>
                </div>
            </div>`;
    }

    // ─── کارت Album ───
    function renderAlbumCard(p) {
        const photos = getPhotos(p);
        const price = getPriceText(p);
        const total = photos.length || 1;
        const detailUrl = `/ShopPanel/Product/Details/${p.ProductId}`;

        let slidesHtml = '';
        let thumbsHtml = '';

        if (photos.length === 0) {
            slidesHtml = `
                <div class="album-slide active">
                    <img src="/Store/images/no-image.jpg" alt="بدون تصویر">
                </div>`;
        } else {
            slidesHtml = photos.map((ph, i) => `
                <div class="album-slide ${i === 0 ? 'active' : ''}" data-index="${i}">
                    <img src="/Images/Product/${ph}" alt="تصویر ${i + 1}" loading="lazy">
                </div>
            `).join('');

            if (photos.length > 1) {
                thumbsHtml = `
                    <div class="album-thumbs">
                        ${photos.map((ph, i) => `
                            <div class="thumb ${i === 0 ? 'active' : ''}" data-index="${i}">
                                <img src="/Images/Product/${ph}" alt="تصویر ${i + 1}" loading="lazy">
                            </div>
                        `).join('')}
                    </div>`;
            }
        }

        return `
            <div class="album-card" data-album data-id="${p.ProductId}">
                <div class="album-stage" data-stage>
                    <div class="album-counter">۱ / ${total}</div>
                    ${slidesHtml}
                    ${photos.length > 1 ? `
                        <button class="album-nav prev" data-prev>
                            <i class="fas fa-chevron-right"></i>
                        </button>
                        <button class="album-nav next" data-next>
                            <i class="fas fa-chevron-left"></i>
                        </button>
                    ` : ''}
                    <div class="album-info">
                        <div class="meta">
                            <a href="${detailUrl}">
                                <div class="album-title">${UI.escapeHtml(p.ProductCaption)}</div>
                            </a>
                            <div class="album-code">
                                کد: ${UI.escapeHtml(p.CodeInternalProducts || '—')}
                                | ${UI.escapeHtml(p.KindProductCaption || '')}
                            </div>
                            <div class="album-price">${price} <small>تومان</small></div>
                        </div>
                        ${cartBtnHtml(p)}
                    </div>
                </div>
                ${thumbsHtml}
            </div>`;
    }

    // ─── کارت Book ───
    function renderBookCard(p) {
        const photos = getPhotos(p);
        const stock = isInStock(p);
        const price = getPriceText(p);
        const cover = photos.length
            ? `/Images/Product/${photos[0]}`
            : '/Store/images/no-image.jpg';
        const detailUrl = `/ShopPanel/Product/Details/${p.ProductId}`;

        return `
            <div class="book-card" data-id="${p.ProductId}">
                <a href="${detailUrl}">
                    <div class="book-cover">
                        <img src="${cover}" alt="${UI.escapeHtml(p.ProductCaption)}" loading="lazy">
                    </div>
                </a>
                <div class="book-spine"></div>
                <div class="book-body">
                    <a href="${detailUrl}">
                        <div class="book-title">${UI.escapeHtml(p.ProductCaption)}</div>
                    </a>
                    <div class="book-code">
                        کد: ${UI.escapeHtml(p.CodeInternalProducts || '—')}
                        | ${UI.escapeHtml(p.KindProductCaption || '')}
                    </div>
                    <div class="book-price">${price} تومان</div>
                    <div class="book-desc">
                        ${UI.escapeHtml(p.DetailProducts || 'توضیحاتی ثبت نشده')}
                    </div>
                    <div class="book-foot">
                        <span class="product-stock">
                            <i class="fas ${stock ? 'fa-check-circle in-stock' : 'fa-times-circle out-stock'}"></i>
                            ${stock ? `موجود (${p.InStore})` : 'ناموجود'}
                        </span>
                        ${cartBtnHtml(p)}
                    </div>
                </div>
            </div>`;
    }

    // ─── کارت Alt ───
    function renderAltCard(p) {
        const photos = getPhotos(p);
        const stock = isInStock(p);
        const price = getPriceText(p);
        const cover = photos.length
            ? `/Images/Product/${photos[0]}`
            : '/Store/images/no-image.jpg';
        const detailUrl = `/ShopPanel/Product/Details/${p.ProductId}`;

        return `
            <div class="alt-row" data-id="${p.ProductId}">
                <a href="${detailUrl}" class="alt-media">
                    <img src="${cover}" alt="${UI.escapeHtml(p.ProductCaption)}" loading="lazy">
                    ${stock
                ? '<span class="ribbon">موجود</span>'
                : '<span class="ribbon" style="background:linear-gradient(135deg,#94a3b8,#475569);color:#fff">ناموجود</span>'}
                </a>
                <div class="alt-body">
                    <div class="alt-cat">
                        <i class="fas fa-star"></i> ${UI.escapeHtml(p.KindProductCaption || '')}
                    </div>
                    <a href="${detailUrl}">
                        <div class="alt-title">${UI.escapeHtml(p.ProductCaption)}</div>
                    </a>
                    <div class="alt-code">کد: ${UI.escapeHtml(p.CodeInternalProducts || '—')}</div>
                    <div class="alt-desc">
                        ${UI.escapeHtml(p.DetailProducts || 'توضیحاتی ثبت نشده')}
                    </div>
                    <div class="alt-price">${price} <small>تومان</small></div>
                    <div class="alt-foot">
                        ${cartBtnHtml(p)}
                        <span class="product-stock">
                            <i class="fas ${stock ? 'fa-check-circle in-stock' : 'fa-times-circle out-stock'}"></i>
                            ${stock ? `موجود (${p.InStore})` : 'ناموجود'}
                        </span>
                    </div>
                </div>
            </div>`;
    }

    // ═══════════════════════════════════════════════════════
    // گالری Simple
    // ═══════════════════════════════════════════════════════
    function initSimpleGalleries() {
        document.querySelectorAll('.product-card').forEach(card => {
            const productId = parseInt(card.dataset.id);
            const product = State.products.find(p => p.ProductId === productId);
            if (!product) return;

            const photos = getPhotos(product);
            if (photos.length <= 1) return;

            const slides = card.querySelector('.slides');
            const dots = card.querySelectorAll('.dot');
            if (!slides) return;

            let currentIndex = 0;

            const goToSlide = (index) => {
                if (index < 0) index = photos.length - 1;
                if (index >= photos.length) index = 0;
                currentIndex = index;
                slides.style.transform = `translateX(${index * 100}%)`;
                dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
            };

            card.querySelector('.gallery-prev')?.addEventListener('click', e => {
                e.stopPropagation();
                e.preventDefault();
                goToSlide(currentIndex - 1);
            });
            card.querySelector('.gallery-next')?.addEventListener('click', e => {
                e.stopPropagation();
                e.preventDefault();
                goToSlide(currentIndex + 1);
            });
            dots.forEach((dot, idx) => dot.addEventListener('click', e => {
                e.stopPropagation();
                e.preventDefault();
                goToSlide(idx);
            }));

            let interval = setInterval(() => goToSlide(currentIndex + 1), 4000);
            card.addEventListener('mouseenter', () => clearInterval(interval));
            card.addEventListener('mouseleave', () => {
                interval = setInterval(() => goToSlide(currentIndex + 1), 4000);
            });
        });
    }

    // ═══════════════════════════════════════════════════════
    // گالری Album
    // ═══════════════════════════════════════════════════════
    function initAlbums() {
        document.querySelectorAll('[data-album]').forEach(card => {
            const slides = card.querySelectorAll('.album-slide');
            const thumbs = card.querySelectorAll('.thumb');
            const counter = card.querySelector('.album-counter');
            const stage = card.querySelector('[data-stage]');
            if (!slides.length) return;

            let idx = 0;
            const toFa = (n) => n.toLocaleString('fa-IR');

            function show(i) {
                idx = (i + slides.length) % slides.length;
                slides.forEach((s, n) => s.classList.toggle('active', n === idx));
                thumbs.forEach((t, n) => t.classList.toggle('active', n === idx));
                if (counter) counter.textContent = `${toFa(idx + 1)} / ${toFa(slides.length)}`;
            }

            card.querySelector('[data-prev]')?.addEventListener('click', e => {
                e.stopPropagation();
                e.preventDefault();
                show(idx - 1);
            });
            card.querySelector('[data-next]')?.addEventListener('click', e => {
                e.stopPropagation();
                e.preventDefault();
                show(idx + 1);
            });
            thumbs.forEach((t, n) => t.addEventListener('click', (e) => {
                e.preventDefault();
                show(n);
            }));

            // ─── Swipe ───
            if (stage) {
                let startX = 0;
                let startY = 0;

                stage.addEventListener('touchstart', e => {
                    startX = e.touches[0].clientX;
                    startY = e.touches[0].clientY;
                }, { passive: true });

                stage.addEventListener('touchend', e => {
                    const dx = e.changedTouches[0].clientX - startX;
                    const dy = e.changedTouches[0].clientY - startY;
                    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
                        if (dx > 0) show(idx - 1);
                        else show(idx + 1);
                    }
                }, { passive: true });
            }

            // ─── Keyboard ───
            card.tabIndex = 0;
            card.addEventListener('keydown', e => {
                if (e.key === 'ArrowRight') show(idx - 1);
                if (e.key === 'ArrowLeft') show(idx + 1);
            });

            show(0);
        });
    }

    // ═══════════════════════════════════════════════════════
    // افزودن به سبد
    // ═══════════════════════════════════════════════════════
    function initAddToCart() {
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            if (btn.dataset.bound === '1') return;
            btn.dataset.bound = '1';

            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                e.preventDefault();
                if (this.disabled) return;

                const id = parseInt(this.dataset.id);
                const product = State.products.find(p => p.ProductId === id);
                if (!product) return;

                addProductToCart(product);

                document.querySelectorAll(`.add-to-cart-btn[data-id="${id}"]`).forEach(b => {
                    b.classList.add('added');
                    b.innerHTML = '<i class="fas fa-check"></i> در سبد';
                });
            });
        });
    }

    function addProductToCart(product) {
        const firstColor = product.Colors && product.Colors.length > 0
            ? product.Colors[0]
            : null;

        const colorId = firstColor ? firstColor.ColorPriceProductId : 0;
        const colorCaption = firstColor ? firstColor.ColorPriceProductCaption : '';
        const price = firstColor && firstColor.PriceProduct
            ? firstColor.PriceProduct
            : (product.PriceProduct || 0);

        Cart.add(product.ProductId, colorId, {
            productCaption: product.ProductCaption,
            colorCaption: colorCaption,
            price: price,
            photo: (product.Photos || '').split(',')[0] || ''
        });

        UI.showToast('به سبد خرید اضافه شد ✅', 'success');
    }

    // ═══════════════════════════════════════════════════════
    // فیلتر — اعمال / ریست
    // ═══════════════════════════════════════════════════════
    function applyFilters() {
        State.filters.kindId = el.kindFilter?.value || 'all';
        State.filters.priceMin = el.priceMin?.value || '';
        State.filters.priceMax = el.priceMax?.value || '';
        State.filters.stock = el.stockFilter?.value || 'all';

        renderProducts();
        closeFilter();
    }

    function resetFilters() {
        if (el.kindFilter) el.kindFilter.value = 'all';
        if (el.priceMin) el.priceMin.value = '';
        if (el.priceMax) el.priceMax.value = '';
        if (el.stockFilter) el.stockFilter.value = 'all';

        document.querySelectorAll('.color-option').forEach(el => el.classList.remove('active'));
        document.querySelector('.color-option.all-colors')?.classList.add('active');

        State.filters = {
            kindId: 'all',
            color: 'all',
            priceMin: '',
            priceMax: '',
            stock: 'all',
            search: ''
        };

        renderProducts();
        closeFilter();
    }

    // ═══════════════════════════════════════════════════════
    // پر کردن فیلترها
    // ═══════════════════════════════════════════════════════
    function populateFilters() {
        // ─── دسته‌بندی ───
        if (el.kindFilter) {
            el.kindFilter.innerHTML = '<option value="all">همه دسته‌ها</option>';
            State.kindList.forEach(k => {
                el.kindFilter.innerHTML +=
                    `<option value="${k.KindProductId}">${UI.escapeHtml(k.KindProductCaption)}</option>`;
            });
        }

        // ─── رنگ‌ها ───
        if (!el.colorOptions) return;

        el.colorOptions.innerHTML =
            '<div class="color-option all-colors active" data-color="all">همه</div>';

        const bgColors = {
            'مشکی': '#1a1a1a', 'سفید': '#ffffff', 'نقره‌ای': '#c0c0c0',
            'خاکستری': '#6b7280', 'آبی': '#3b82f6', 'قرمز': '#ef4444',
            'سبز': '#22c55e', 'زرد': '#eab308', 'صورتی': '#ec4899',
            'طوسی': '#9ca3af', 'طلایی': '#d97706', 'نارنجی': '#f97316'
        };

        State.allColors.forEach(color => {
            const colorDiv = document.createElement('div');
            colorDiv.className = 'color-option';
            colorDiv.dataset.color = color;
            colorDiv.style.background = bgColors[color] || '#6b7280';
            if (color === 'سفید') colorDiv.style.borderColor = '#d1d5db';
            colorDiv.innerHTML = `<span class="color-check"><i class="fas fa-check"></i></span>`;

            colorDiv.addEventListener('click', function () {
                document.querySelectorAll('.color-option').forEach(e => e.classList.remove('active'));
                this.classList.add('active');
                State.filters.color = this.dataset.color;
            });

            el.colorOptions.appendChild(colorDiv);
        });

        el.colorOptions.querySelector('.all-colors')?.addEventListener('click', function () {
            document.querySelectorAll('.color-option').forEach(e => e.classList.remove('active'));
            this.classList.add('active');
            State.filters.color = 'all';
        });
    }

    // ═══════════════════════════════════════════════════════
    // سایدبار فیلتر
    // ═══════════════════════════════════════════════════════
    function openFilter() {
        el.filterSidebar?.classList.add('open');
        el.filterOverlay?.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeFilter() {
        el.filterSidebar?.classList.remove('open');
        el.filterOverlay?.classList.remove('active');
        document.body.style.overflow = '';
    }

    function closeAll() {
        closeFilter();
        if (window.CartUI) window.CartUI.close();
    }

    // ═══════════════════════════════════════════════════════
    // Bind Events
    // ═══════════════════════════════════════════════════════
    function bindEvents() {
        el.filterToggleBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (el.filterSidebar?.classList.contains('open')) {
                closeFilter();
            } else {
                if (window.CartUI) window.CartUI.close();
                openFilter();
            }
        });

        el.closeFilterBtn?.addEventListener('click', closeFilter);
        el.filterOverlay?.addEventListener('click', closeFilter);

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeAll();
        });

        el.applyFiltersBtn?.addEventListener('click', applyFilters);
        el.resetFiltersBtn?.addEventListener('click', resetFilters);

        el.priceMin?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') applyFilters();
        });
        el.priceMax?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') applyFilters();
        });

        // ─── جستجو ───
        if (el.searchInput) {
            const debounced = UI.debounce((value) => {
                State.filters.search = value;
                renderProducts();
            }, 300);
            el.searchInput.addEventListener('input', (e) => debounced(e.target.value));
        }

        // ─── Resize ───
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (State.products.length > 0) renderProducts();
            }, 250);
        });
    }

    // ═══════════════════════════════════════════════════════
    // Init
    // ═══════════════════════════════════════════════════════
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