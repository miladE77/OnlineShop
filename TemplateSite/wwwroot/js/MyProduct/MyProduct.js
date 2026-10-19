/* ============================================================
   MyProduct.js — مدیریت محصولات صاحب مغازه
   ============================================================ */

(function () {
    'use strict';

    const Http = window.HttpHelper;
    const UI = window.UICore;

    if (!Http || !UI) {
        console.error('❌ MyProduct: Core ها لود نشده‌اند!');
        return;
    }

    // ═══════════════════════════════════════════════════════
    // State
    // ═══════════════════════════════════════════════════════
    const State = {
        stores: [],
        currentStoreId: 0,
        products: [],
        kinds: [],
        allOptions: [],
        editingProductId: null,
        editingColorId: null,
        editingDetailId: null,
        currentProductId: 0,
        currentFile: null
    };

    // ═══════════════════════════════════════════════════════
    // Debug
    // ═══════════════════════════════════════════════════════
    function debug(...args) { console.log('🔍 [MyProduct]', ...args); }
    function debugError(...args) { console.error('❌ [MyProduct]', ...args); }

    // ═══════════════════════════════════════════════════════
    // DOM
    // ═══════════════════════════════════════════════════════
    const el = {
        storeSelector: document.getElementById('storeSelector'),
        tableBody: document.getElementById('mpTableBody'),
        searchInput: document.getElementById('mpSearch'),
        kindFilter: document.getElementById('mpKindFilter'),
        statusFilter: document.getElementById('mpStatusFilter'),

        kindListWrapper: document.getElementById('kindListWrapper'),
        kindList: document.getElementById('kindList'),

        productModal: document.getElementById('productModal'),
        productModalTitle: document.getElementById('productModalTitle'),
        productId: document.getElementById('productId'),
        modalStoreGroup: document.getElementById('modalStoreGroup'),
        modalStoreId: document.getElementById('modalStoreId'),
        productCaption: document.getElementById('productCaption'),
        productKind: document.getElementById('productKind'),
        productPrice: document.getElementById('productPrice'),
        productDetail: document.getElementById('productDetail'),
        productStatus: document.getElementById('productStatus'),

        colorModal: document.getElementById('colorModal'),
        colorModalTitle: document.getElementById('colorModalTitle'),
        colorId: document.getElementById('colorId'),
        colorProductId: document.getElementById('colorProductId'),
        colorCaption: document.getElementById('colorCaption'),
        colorPrice: document.getElementById('colorPrice'),
        colorOffer: document.getElementById('colorOffer'),
        colorInStore: document.getElementById('colorInStore'),

        fileModal: document.getElementById('fileModal'),
        fileProductId: document.getElementById('fileProductId'),
        dropZone: document.getElementById('dropZone'),
        fileInput: document.getElementById('fileInput'),
        filePreview: document.getElementById('filePreview'),
        saveFileBtn: document.getElementById('saveFileBtn'),

        detailModal: document.getElementById('detailModal'),
        detailModalTitle: document.getElementById('detailModalTitle'),
        detailId: document.getElementById('detailId'),
        detailProductId: document.getElementById('detailProductId'),
        detailOption: document.getElementById('detailOption'),
        detailCaption: document.getElementById('detailCaption'),

        kindModal: document.getElementById('kindModal'),
        kindModalTitle: document.getElementById('kindModalTitle'),
        kindCaption: document.getElementById('kindCaption'),
        kindParent: document.getElementById('kindParent')
    };

    // ═══════════════════════════════════════════════════════
    // Load Stores
    // ═══════════════════════════════════════════════════════
    async function loadStores() {
        try {
            const res = await Http.postSecure('/MyProduct/GetStores');
            if (!res.isSuccess) return false;

            State.stores = JSON.parse(res.data);
            if (!State.stores || State.stores.length === 0) {
                UI.showToast('شما فروشگاهی ندارید', 'warning');
                return false;
            }

            State.currentStoreId = State.stores.length > 1 ? 0 : State.stores[0].StoreId;

            renderStoreSelector();
            renderModalStoreSelector();
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
            const selected = (stores.length === 1 || store.StoreId === State.currentStoreId) ? 'selected' : '';
            html += `<option value="${store.StoreId}" ${selected}>${UI.escapeHtml(store.StoreCaption)}</option>`;
        });

        html += '</select>';

        el.storeSelector.innerHTML = html;
        el.storeSelector.style.display = 'flex';

        document.getElementById('storeSelect')?.addEventListener('change', function () {
            State.currentStoreId = parseInt(this.value);
            loadProducts();
        });
    }

    function renderModalStoreSelector() {
        if (!el.modalStoreId || !el.modalStoreGroup) return;

        if (State.stores.length <= 1) {
            el.modalStoreGroup.style.display = 'none';
            if (State.stores.length === 1) {
                el.modalStoreId.innerHTML = `<option value="${State.stores[0].StoreId}" selected>${State.stores[0].StoreCaption}</option>`;
            }
            return;
        }

        el.modalStoreGroup.style.display = '';

        let html = '<option value="">انتخاب فروشگاه...</option>';
        State.stores.forEach(store => {
            html += `<option value="${store.StoreId}">${UI.escapeHtml(store.StoreCaption)}</option>`;
        });

        el.modalStoreId.innerHTML = html;
    }

    // ═══════════════════════════════════════════════════════
    // Load Kinds
    // ═══════════════════════════════════════════════════════
    async function loadKinds() {
        try {
            const res = await Http.postSecure('/MyKindProduct/GetAll');
            if (!res.isSuccess) return;

            State.kinds = JSON.parse(res.data);
            debug('Kinds:', State.kinds.length);
            renderKindOptions();
        } catch (err) {
            debugError('loadKinds:', err);
        }
    }

    function renderKindOptions() {
        if (el.productKind) {
            let html = '<option value="">انتخاب دسته‌بندی...</option>';
            State.kinds.forEach(k => {
                html += `<option value="${k.KindProductId}">${UI.escapeHtml(k.KindProductCaption)}</option>`;
            });
            el.productKind.innerHTML = html;
        }

        if (el.kindFilter) {
            let html = '<option value="all">همه دسته‌بندی‌ها</option>';
            State.kinds.forEach(k => {
                html += `<option value="${k.KindProductId}">${UI.escapeHtml(k.KindProductCaption)}</option>`;
            });
            el.kindFilter.innerHTML = html;
        }

        if (el.kindParent) {
            let html = '<option value="">بدون والد (ریشه)</option>';
            State.kinds.forEach(k => {
                html += `<option value="${k.KindProductId}">${UI.escapeHtml(k.KindProductCaption)}</option>`;
            });
            el.kindParent.innerHTML = html;
        }
    }

    // ═══════════════════════════════════════════════════════
    // Load All Options
    // ═══════════════════════════════════════════════════════
    async function loadAllOptions() {
        try {
            const res = await Http.postSecure('/MyProductDetails/GetOptions');
            if (!res.isSuccess) {
                debugError('GetOptions:', res.errorTitle);
                return;
            }

            State.allOptions = JSON.parse(res.data);
            debug('Options:', State.allOptions.length);
        } catch (err) {
            debugError('loadAllOptions:', err);
        }
    }

    // ═══════════════════════════════════════════════════════
    // Load Products
    // ═══════════════════════════════════════════════════════
    async function loadProducts() {
        if (!el.tableBody) return;

        el.tableBody.innerHTML = `
            <tr><td colspan="7" style="text-align:center;padding:40px;">
                <i class="fas fa-spinner fa-spin"></i> در حال بارگذاری...
            </td></tr>`;

        try {
            const res = await Http.postSecure('/MyProduct/GetAll', {
                storeId: State.currentStoreId
            });

            if (!res.isSuccess) {
                UI.showToast(res.errorTitle || 'خطا', 'error');
                State.products = [];
                renderTable();
                return;
            }

            State.products = JSON.parse(res.data);
            debug('Products:', State.products.length);

            renderTable();
            renderStats();
        } catch (err) {
            debugError('loadProducts:', err);
            UI.showToast('خطا در ارتباط', 'error');
        }
    }

    // ═══════════════════════════════════════════════════════
    // Filter
    // ═══════════════════════════════════════════════════════
    function getFilteredProducts() {
        let filtered = [...State.products];

        const search = el.searchInput?.value?.toLowerCase() || '';
        const kindId = el.kindFilter?.value || 'all';
        const status = el.statusFilter?.value || 'all';

        if (search) {
            filtered = filtered.filter(p =>
                (p.ProductCaption || '').toLowerCase().includes(search) ||
                (p.CodeInternalProducts || '').toLowerCase().includes(search)
            );
        }

        if (kindId !== 'all') {
            filtered = filtered.filter(p => p.KindProductId === parseInt(kindId));
        }

        if (status === 'active') {
            filtered = filtered.filter(p => p.Status === true);
        } else if (status === 'inactive') {
            filtered = filtered.filter(p => p.Status === false);
        }

        return filtered;
    }

    // ═══════════════════════════════════════════════════════
    // Render Table
    // ═══════════════════════════════════════════════════════
    function renderTable() {
        if (!el.tableBody) return;

        const filtered = getFilteredProducts();

        if (filtered.length === 0) {
            el.tableBody.innerHTML = `
                <tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-secondary);">
                    <i class="fas fa-box-open" style="font-size:2rem;display:block;margin-bottom:10px;"></i>
                    هیچ محصولی یافت نشد
                </td></tr>`;
            return;
        }

        let html = '';
        filtered.forEach(p => {
            const kind = State.kinds.find(k => k.KindProductId === p.KindProductId);
            const kindName = kind ? kind.KindProductCaption : '—';
            const price = p.PriceProduct ? p.PriceProduct.toLocaleString('fa-IR') + ' ت' : '—';
            const statusClass = p.Status ? 'active' : 'inactive';
            const statusText = p.Status ? 'فعال' : 'غیرفعال';
            const store = State.stores.find(s => s.StoreId === p.StoreId);

            const colorsCount = (p.Colors || []).length;
            const filesCount = (p.Files || []).length;
            const detailsCount = (p.Details || []).length;

            html += `
                <tr class="product-row" data-id="${p.ProductId}">
                    <td>
                        <button class="expand-btn" data-id="${p.ProductId}">
                            <i class="fas fa-chevron-down"></i>
                        </button>
                    </td>
                    <td>
                        <strong>${UI.escapeHtml(p.ProductCaption || '—')}</strong>
                        ${State.stores.length > 1 && store ? `<br><small style="color:var(--primary);">
                            <i class="fas fa-store"></i> ${UI.escapeHtml(store.StoreCaption)}
                        </small>` : ''}
                    </td>
                    <td><code>${UI.escapeHtml(p.CodeInternalProducts || '—')}</code></td>
                    <td>${UI.escapeHtml(kindName)}</td>
                    <td>${price}</td>
                    <td>
                        <span class="status-badge ${statusClass}" 
                              onclick="toggleProductStatus(${p.ProductId})"
                              style="cursor:pointer;">
                            ${statusText}
                        </span>
                    </td>
                    <td class="action-buttons">
                        <button class="action-btn edit-btn" onclick="openEditProduct(${p.ProductId})" title="ویرایش">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" onclick="deleteProduct(${p.ProductId})" title="حذف">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                </tr>
            `;

            html += `
                <tr class="sub-row" id="sub-${p.ProductId}" style="display:none;">
                    <td colspan="7">
                        <div class="sub-content">
                            <div class="sub-tabs">
                                <button class="sub-tab active" data-tab="colors" data-id="${p.ProductId}">
                                    <i class="fas fa-palette"></i> رنگ‌بندی (${colorsCount})
                                </button>
                                <button class="sub-tab" data-tab="files" data-id="${p.ProductId}">
                                    <i class="fas fa-images"></i> تصاویر (${filesCount})
                                </button>
                                <button class="sub-tab" data-tab="details" data-id="${p.ProductId}">
                                    <i class="fas fa-list-ul"></i> جزئیات (${detailsCount})
                                </button>
                            </div>

                            <div class="sub-section" data-section="colors-${p.ProductId}">
                                <div class="sub-items" id="colors-${p.ProductId}">
                                    ${renderColorsHtml(p)}
                                </div>
                                <button class="add-sub-btn" onclick="openColorModal(${p.ProductId}, 0)">
                                    <i class="fas fa-plus"></i> افزودن رنگ
                                </button>
                            </div>

                            <div class="sub-section" data-section="files-${p.ProductId}" style="display:none;">
                                <div class="sub-items" id="files-${p.ProductId}">
                                    ${renderFilesHtml(p)}
                                </div>
                                <button class="add-sub-btn" onclick="openFileModal(${p.ProductId})">
                                    <i class="fas fa-plus"></i> افزودن تصویر
                                </button>
                            </div>

                            <div class="sub-section" data-section="details-${p.ProductId}" style="display:none;">
                                <div class="sub-items" id="details-${p.ProductId}">
                                    ${renderDetailsHtml(p)}
                                </div>
                                <button class="add-sub-btn" onclick="openDetailModal(${p.ProductId}, ${p.KindProductId}, 0)">
                                    <i class="fas fa-plus"></i> افزودن جزئیات
                                </button>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
        });

        el.tableBody.innerHTML = html;
        bindTableEvents();
    }

    // ═══════════════════════════════════════════════════════
    // رندر رنگ/فایل/جزئیات
    // ═══════════════════════════════════════════════════════
    function renderColorsHtml(product) {
        const colors = product.Colors || [];

        if (colors.length === 0) {
            return `<div style="text-align:center;color:var(--text-secondary);padding:15px;">
                هیچ رنگی ثبت نشده
            </div>`;
        }

        return colors.map(c => {
            const price = c.PriceProduct ? c.PriceProduct.toLocaleString('fa-IR') : '—';
            const offer = c.Offer ? `${c.Offer}%` : '—';
            const stock = c.InStore ?? '—';

            return `
                <div class="sub-item">
                    <span class="item-name">${UI.escapeHtml(c.ColorPriceProductCaption || '—')}</span>
                    <span class="item-meta">قیمت: ${price}</span>
                    <span class="item-meta">تخفیف: ${offer}</span>
                    <span class="item-meta">موجودی: ${stock}</span>
                    <button class="remove-sub" onclick="openColorModal(${product.ProductId}, ${c.ColorPriceProductId})" title="ویرایش">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="remove-sub" onclick="deleteColor(${c.ColorPriceProductId}, ${product.ProductId})" title="حذف">
                        <i class="fas fa-times"></i>
                    </button>
                </div>`;
        }).join('');
    }

    function renderFilesHtml(product) {
        const files = product.Files || [];

        if (files.length === 0) {
            return `<div style="text-align:center;color:var(--text-secondary);padding:15px;">
                هیچ تصویری ثبت نشده
            </div>`;
        }

        let html = '<div class="files-grid">';
        files.forEach(f => {
            html += `
                <div class="file-item">
                    <img src="/Images/Product/${f.CodeFileProduct}" 
                         onerror="this.src='/Store/images/no-image.jpg'"
                         alt="${UI.escapeHtml(f.FileProductCaption || '')}">
                    <button class="remove-file" onclick="deleteFile(${f.FileProductId}, ${product.ProductId})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>`;
        });
        html += '</div>';

        return html;
    }

    function renderDetailsHtml(product) {
        const details = product.Details || [];

        if (details.length === 0) {
            return `<div style="text-align:center;color:var(--text-secondary);padding:15px;">
                هیچ جزئیاتی ثبت نشده
            </div>`;
        }

        return details.map(d => {
            const option = State.allOptions.find(o =>
                o.OptionProductId === d.OptionProductId);
            const optionName = option ? option.OptionProductCaption : `مشخصه #${d.OptionProductId}`;

            return `
                <div class="sub-item">
                    <span class="item-name">${UI.escapeHtml(optionName)}:</span>
                    <span class="item-value">${UI.escapeHtml(d.DetailProductCaption || '—')}</span>
                    <button class="remove-sub" onclick="openDetailModal(${product.ProductId}, ${product.KindProductId}, ${d.DetailProductId})" title="ویرایش">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="remove-sub" onclick="deleteDetail(${d.DetailProductId}, ${product.ProductId})" title="حذف">
                        <i class="fas fa-times"></i>
                    </button>
                </div>`;
        }).join('');
    }

    // ═══════════════════════════════════════════════════════
    // Bind Table Events
    // ═══════════════════════════════════════════════════════
    function bindTableEvents() {
        document.querySelectorAll('.expand-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const id = parseInt(this.dataset.id);
                const subRow = document.getElementById(`sub-${id}`);
                if (!subRow) return;

                const isOpen = subRow.style.display !== 'none';
                subRow.style.display = isOpen ? 'none' : 'table-row';
                this.classList.toggle('expanded', !isOpen);
            });
        });

        document.querySelectorAll('.sub-tab').forEach(tab => {
            tab.addEventListener('click', function () {
                const id = parseInt(this.dataset.id);
                const tabType = this.dataset.tab;

                document.querySelectorAll(`.sub-tab[data-id="${id}"]`).forEach(t => t.classList.remove('active'));
                this.classList.add('active');

                document.querySelectorAll(`.sub-section[data-section$="-${id}"]`).forEach(s => s.style.display = 'none');

                const section = document.querySelector(`.sub-section[data-section="${tabType}-${id}"]`);
                if (section) section.style.display = '';
            });
        });
    }

    function renderStats() {
        const total = State.products.length;
        const active = State.products.filter(p => p.Status === true).length;
        const inactive = total - active;
        const colors = State.products.reduce((sum, p) => sum + (p.Colors?.length || 0), 0);

        document.getElementById('statTotal').textContent = total;
        document.getElementById('statActive').textContent = active;
        document.getElementById('statInactive').textContent = inactive;
        document.getElementById('statColors').textContent = colors;
    }

    // ═══════════════════════════════════════════════════════
    // Product Modal
    // ═══════════════════════════════════════════════════════
    function openProductModal() {
        State.editingProductId = null;
        el.productId.value = '0';
        el.productModalTitle.innerText = 'افزودن محصول جدید';
        el.productCaption.value = '';
        el.productKind.value = '';
        el.productPrice.value = '';
        el.productDetail.value = '';
        el.productStatus.checked = true;

        if (State.stores.length === 1) {
            el.modalStoreId.value = State.stores[0].StoreId;
        } else {
            el.modalStoreId.value = State.currentStoreId > 0 ? State.currentStoreId : '';
        }

        el.productModal?.classList.add('active');
    }

    function openEditProduct(productId) {
        const p = State.products.find(x => x.ProductId === productId);
        if (!p) return;

        State.editingProductId = productId;
        el.productId.value = productId;
        el.productModalTitle.innerText = 'ویرایش محصول';
        el.productCaption.value = p.ProductCaption || '';
        el.productKind.value = p.KindProductId || '';
        el.productPrice.value = p.PriceProduct || '';
        el.productDetail.value = p.DetailProducts || '';
        el.productStatus.checked = p.Status === true;

        if (State.stores.length > 1) {
            el.modalStoreId.value = p.StoreId;
        }

        el.productModal?.classList.add('active');
    }

    async function saveProduct() {
        const id = parseInt(el.productId.value) || 0;
        const caption = el.productCaption.value.trim();
        const kindId = parseInt(el.productKind.value);
        const price = el.productPrice.value.trim();
        const detail = el.productDetail.value.trim();
        const status = el.productStatus.checked;
        const storeId = parseInt(el.modalStoreId.value);

        if (!storeId) { UI.showToast('فروشگاه را انتخاب کنید', 'warning'); return; }
        if (!caption) { UI.showToast('نام محصول را وارد کنید', 'warning'); return; }
        if (!kindId) { UI.showToast('دسته‌بندی را انتخاب کنید', 'warning'); return; }

        const url = id === 0 ? '/MyProduct/Add' : '/MyProduct/Update';
        const payload = {
            storeId: storeId,
            productCaption: caption,
            kindProductId: kindId,
            detailProducts: detail,
            priceProduct: price || '',
            status: status
        };

        if (id > 0) payload.productId = id;

        try {
            const res = await Http.postSecure(url, payload);
            if (res.isSuccess) {
                UI.showToast(res.data || 'ذخیره شد ✅', 'success');
                closeModal('productModal');
                await loadProducts();
            } else {
                UI.showToast(res.errorTitle || 'خطا', 'error');
            }
        } catch (err) {
            debugError('saveProduct:', err);
            UI.showToast('خطا در ارتباط', 'error');
        }
    }

    async function deleteProduct(id) {
        if (!confirm('حذف این محصول؟')) return;

        try {
            const res = await Http.postSecure('/MyProduct/Delete', { id });
            if (res.isSuccess) {
                UI.showToast('حذف شد', 'success');
                await loadProducts();
            } else {
                UI.showToast(res.errorTitle || 'خطا', 'error');
            }
        } catch (err) {
            debugError('deleteProduct:', err);
        }
    }

    async function toggleProductStatus(id) {
        const p = State.products.find(x => x.ProductId === id);
        if (!p) return;

        try {
            const res = await Http.postSecure('/MyProduct/ToggleStatus', {
                id: id,
                status: !p.Status
            });
            if (res.isSuccess) {
                UI.showToast('وضعیت تغییر کرد', 'success');
                await loadProducts();
            } else {
                UI.showToast(res.errorTitle || 'خطا', 'error');
            }
        } catch (err) {
            debugError('toggleProductStatus:', err);
        }
    }

    // ═══════════════════════════════════════════════════════
    // Color Modal
    // ═══════════════════════════════════════════════════════
    function openColorModal(productId, colorId) {
        State.editingColorId = colorId;
        State.currentProductId = productId;

        el.colorId.value = colorId || '0';
        el.colorProductId.value = productId;
        el.colorModalTitle.innerText = colorId ? 'ویرایش رنگ' : 'افزودن رنگ';

        if (colorId) {
            const product = State.products.find(p => p.ProductId === productId);
            const c = (product?.Colors || []).find(x => x.ColorPriceProductId === colorId);

            if (c) {
                el.colorCaption.value = c.ColorPriceProductCaption || '';
                el.colorPrice.value = c.PriceProduct || '';
                el.colorOffer.value = c.Offer || '';
                el.colorInStore.value = c.InStore || '';
            }
        } else {
            el.colorCaption.value = '';
            el.colorPrice.value = '';
            el.colorOffer.value = '';
            el.colorInStore.value = '';
        }

        el.colorModal?.classList.add('active');
    }

    async function saveColor() {
        const id = parseInt(el.colorId.value) || 0;
        const productId = parseInt(el.colorProductId.value);
        const caption = el.colorCaption.value.trim();

        if (!caption) {
            UI.showToast('نام رنگ را وارد کنید', 'warning');
            return;
        }

        const url = id === 0 ? '/MyProductColors/Add' : '/MyProductColors/Update';
        const payload = {
            productId: productId,
            colorCaption: caption,
            price: el.colorPrice.value || '',
            offer: el.colorOffer.value || '',
            inStore: el.colorInStore.value || ''
        };

        if (id > 0) payload.colorId = id;

        try {
            const res = await Http.postSecure(url, payload);
            if (res.isSuccess) {
                UI.showToast(res.data || 'ذخیره شد', 'success');
                closeModal('colorModal');
                await loadProducts();
            } else {
                UI.showToast(res.errorTitle || 'خطا', 'error');
            }
        } catch (err) {
            debugError('saveColor:', err);
        }
    }

    async function deleteColor(colorId, productId) {
        if (!confirm('حذف این رنگ؟')) return;

        try {
            const res = await Http.postSecure('/MyProductColors/Delete', { colorId });
            if (res.isSuccess) {
                UI.showToast('حذف شد', 'success');
                await loadProducts();
            } else {
                UI.showToast(res.errorTitle || 'خطا', 'error');
            }
        } catch (err) {
            debugError('deleteColor:', err);
        }
    }

    // ═══════════════════════════════════════════════════════
    // File Modal
    // ═══════════════════════════════════════════════════════
    function openFileModal(productId) {
        State.currentProductId = productId;
        State.currentFile = null;

        el.fileProductId.value = productId;
        el.filePreview.style.display = 'none';
        el.filePreview.innerHTML = '';
        el.fileInput.value = '';
        el.saveFileBtn.disabled = true;

        el.fileModal?.classList.add('active');
    }

    function initFileDrop() {
        if (!el.dropZone || !el.fileInput) return;

        el.dropZone.addEventListener('click', () => el.fileInput.click());

        el.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            el.dropZone.classList.add('drag-over');
        });

        el.dropZone.addEventListener('dragleave', () => {
            el.dropZone.classList.remove('drag-over');
        });

        el.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            el.dropZone.classList.remove('drag-over');

            const files = e.dataTransfer.files;
            if (files.length > 0) handleFileSelect(files[0]);
        });

        el.fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) handleFileSelect(e.target.files[0]);
        });
    }

    function handleFileSelect(file) {
        if (file.size > 400000) {
            UI.showToast('حداکثر حجم 400 KB', 'error');
            return;
        }

        const type = (file.type || '').toLowerCase();
        if (!type.includes('png') && !type.includes('jpeg') && !type.includes('jpg')) {
            UI.showToast('فرمت باید PNG یا JPEG باشد', 'error');
            return;
        }

        State.currentFile = file;

        const reader = new FileReader();
        reader.onload = (e) => {
            el.filePreview.innerHTML = `<img src="${e.target.result}" alt="preview">`;
            el.filePreview.style.display = 'block';
            el.saveFileBtn.disabled = false;
        };
        reader.readAsDataURL(file);
    }

    async function saveFile() {
        if (!State.currentFile) {
            UI.showToast('فایلی انتخاب نشده', 'warning');
            return;
        }

        const productId = parseInt(el.fileProductId.value);

        const formData = new FormData();
        formData.append('productId', productId);
        formData.append('file', State.currentFile);
        formData.append('__RequestVerificationToken',
            document.querySelector('input[name="__RequestVerificationToken"]')?.value || '');

        el.saveFileBtn.disabled = true;
        el.saveFileBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> در حال آپلود...';

        try {
            const response = await fetch('/MyProductFiles/Add', {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            });

            const res = await response.json();

            if (res.isSuccess) {
                UI.showToast('آپلود شد ✅', 'success');
                closeModal('fileModal');
                await loadProducts();
            } else {
                UI.showToast(res.errorTitle || 'خطا', 'error');
            }
        } catch (err) {
            debugError('saveFile:', err);
            UI.showToast('خطا در آپلود', 'error');
        } finally {
            el.saveFileBtn.disabled = false;
            el.saveFileBtn.innerHTML = '<i class="fas fa-upload"></i> آپلود';
        }
    }

    async function deleteFile(fileId, productId) {
        if (!confirm('حذف این تصویر؟')) return;

        try {
            const res = await Http.postSecure('/MyProductFiles/Delete', { fileId });
            if (res.isSuccess) {
                UI.showToast('حذف شد', 'success');
                await loadProducts();
            } else {
                UI.showToast(res.errorTitle || 'خطا', 'error');
            }
        } catch (err) {
            debugError('deleteFile:', err);
        }
    }

    // ═══════════════════════════════════════════════════════
    // Detail Modal
    // ═══════════════════════════════════════════════════════
    function openDetailModal(productId, kindProductId, detailId) {
        State.editingDetailId = detailId;
        State.currentProductId = productId;

        el.detailId.value = detailId || '0';
        el.detailProductId.value = productId;
        el.detailModalTitle.innerText = detailId ? 'ویرایش جزئیات' : 'افزودن جزئیات';

        renderDetailOptions(kindProductId);

        if (detailId) {
            const product = State.products.find(p => p.ProductId === productId);
            const d = (product?.Details || []).find(x => x.DetailProductId === detailId);
            if (d) {
                el.detailOption.value = d.OptionProductId || '';
                el.detailCaption.value = d.DetailProductCaption || '';
            }
        } else {
            el.detailOption.value = '';
            el.detailCaption.value = '';
        }

        el.detailModal?.classList.add('active');
    }

    function renderDetailOptions(kindProductId) {
        if (!el.detailOption) return;

        let filtered = State.allOptions;

        if (kindProductId && kindProductId > 0) {
            filtered = State.allOptions.filter(o => o.KindProductId === kindProductId);

            if (filtered.length === 0) {
                filtered = State.allOptions;
            }
        }

        let html = '<option value="">انتخاب مشخصه...</option>';
        filtered.forEach(o => {
            html += `<option value="${o.OptionProductId}">${UI.escapeHtml(o.OptionProductCaption)}</option>`;
        });

        el.detailOption.innerHTML = html;
    }

    async function saveDetail() {
        const id = parseInt(el.detailId.value) || 0;
        const productId = parseInt(el.detailProductId.value);
        const optionId = parseInt(el.detailOption.value);
        const caption = el.detailCaption.value.trim();

        if (!optionId) { UI.showToast('مشخصه فنی را انتخاب کنید', 'warning'); return; }
        if (!caption) { UI.showToast('مقدار را وارد کنید', 'warning'); return; }

        const url = id === 0 ? '/MyProductDetails/Add' : '/MyProductDetails/Update';
        const payload = {
            productId: productId,
            optionProductId: optionId,
            caption: caption
        };

        if (id > 0) payload.detailId = id;

        try {
            const res = await Http.postSecure(url, payload);
            if (res.isSuccess) {
                UI.showToast(res.data || 'ذخیره شد', 'success');
                closeModal('detailModal');
                await loadProducts();
            } else {
                UI.showToast(res.errorTitle || 'خطا', 'error');
            }
        } catch (err) {
            debugError('saveDetail:', err);
        }
    }

    async function deleteDetail(detailId, productId) {
        if (!confirm('حذف این جزئیات؟')) return;

        try {
            const res = await Http.postSecure('/MyProductDetails/Delete', { detailId });
            if (res.isSuccess) {
                UI.showToast('حذف شد', 'success');
                await loadProducts();
            } else {
                UI.showToast(res.errorTitle || 'خطا', 'error');
            }
        } catch (err) {
            debugError('deleteDetail:', err);
        }
    }

    // ═══════════════════════════════════════════════════════
    // KindProduct — فقط افزودن
    // ═══════════════════════════════════════════════════════
    function openKindModal() {
        el.kindModalTitle.innerText = 'افزودن دسته‌بندی جدید';
        el.kindCaption.value = '';
        el.kindParent.value = '';
        el.kindModal?.classList.add('active');
    }

    async function saveKind() {
        const caption = el.kindCaption.value.trim();
        const parentId = parseInt(el.kindParent.value) || 0;

        if (!caption) {
            UI.showToast('عنوان را وارد کنید', 'warning');
            return;
        }

        const payload = {
            caption: caption,
            parentKindProductId: parentId > 0 ? parentId : ''
        };

        try {
            const res = await Http.postSecure('/MyKindProduct/Add', payload);
            if (res.isSuccess) {
                UI.showToast(res.data || 'ذخیره شد', 'success');
                closeModal('kindModal');
                await loadKinds();
            } else {
                UI.showToast(res.errorTitle || 'خطا', 'error');
            }
        } catch (err) {
            debugError('saveKind:', err);
        }
    }

    // ═══════════════════════════════════════════════════════
    // KindProduct — لیست
    // ═══════════════════════════════════════════════════════
    function toggleKindList() {
        if (!el.kindListWrapper) {
            console.warn('⚠️ kindListWrapper پیدا نشد');
            return;
        }

        const isVisible = el.kindListWrapper.style.display !== 'none';
        el.kindListWrapper.style.display = isVisible ? 'none' : 'block';

        if (!isVisible) {
            renderKindList();
        }
    }

    function renderKindList() {
        if (!el.kindList) return;

        if (!State.kinds || State.kinds.length === 0) {
            el.kindList.innerHTML = `
                <div style="text-align:center;padding:20px;color:var(--text-secondary);">
                    هیچ دسته‌بندی ثبت نشده
                </div>`;
            return;
        }

        let html = '';
        State.kinds.forEach(k => {
            const parent = State.kinds.find(x => x.KindProductId === k.ParentKindProductId);
            const parentName = parent ? parent.KindProductCaption : '—';
            const statusClass = k.Status ? 'active' : 'inactive';
            const statusText = k.Status ? 'فعال' : 'غیرفعال';

            html += `
                <div class="kind-item">
                    <div class="kind-item-info">
                        <span class="kind-item-name">
                            <i class="fas fa-tag"></i>
                            ${UI.escapeHtml(k.KindProductCaption || '—')}
                        </span>
                        <span class="kind-item-parent">
                            <i class="fas fa-level-up-alt"></i> والد: ${UI.escapeHtml(parentName)}
                        </span>
                        <span class="status-badge ${statusClass}">${statusText}</span>
                    </div>
                </div>`;
        });

        el.kindList.innerHTML = html;
    }

    // ═══════════════════════════════════════════════════════
    // Modal Helpers
    // ═══════════════════════════════════════════════════════
    function closeModal(id) {
        document.getElementById(id)?.classList.remove('active');
    }

    function bindFilters() {
        el.searchInput?.addEventListener('input', UI.debounce(renderTable, 250));
        el.kindFilter?.addEventListener('change', renderTable);
        el.statusFilter?.addEventListener('change', renderTable);
    }

    // ═══════════════════════════════════════════════════════
    // Exports
    // ═══════════════════════════════════════════════════════
    window.openProductModal = openProductModal;
    window.openEditProduct = openEditProduct;
    window.saveProduct = saveProduct;
    window.deleteProduct = deleteProduct;
    window.toggleProductStatus = toggleProductStatus;

    window.openColorModal = openColorModal;
    window.saveColor = saveColor;
    window.deleteColor = deleteColor;

    window.openFileModal = openFileModal;
    window.saveFile = saveFile;
    window.deleteFile = deleteFile;

    window.openDetailModal = openDetailModal;
    window.saveDetail = saveDetail;
    window.deleteDetail = deleteDetail;

    window.openKindModal = openKindModal;
    window.saveKind = saveKind;
    window.toggleKindList = toggleKindList;
    window.renderKindList = renderKindList;

    window.closeModal = closeModal;

    // ═══════════════════════════════════════════════════════
    // Init
    // ═══════════════════════════════════════════════════════
    async function init() {
        debug('شروع Init...');

        bindFilters();
        initFileDrop();

        const loaded = await loadStores();

        if (!loaded) {
            if (el.tableBody) {
                el.tableBody.innerHTML = `
                    <tr><td colspan="7" style="text-align:center;padding:40px;">
                        <i class="fas fa-store-slash" style="font-size:2rem;display:block;margin-bottom:10px;"></i>
                        شما فروشگاهی ندارید
                    </td></tr>`;
            }
            return;
        }

        await loadKinds();
        await loadAllOptions();
        await loadProducts();

        debug('Init کامل شد.');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();