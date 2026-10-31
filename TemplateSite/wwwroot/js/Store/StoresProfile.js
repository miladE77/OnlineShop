/* ============================================================
   StoresProfile.js — پروفایل کاربر فروشگاه
   ------------------------------------------------------------
   وابستگی‌ها:
     1. jQuery
     2. Core/HttpHelper.js   → Http
     3. Core/UICore.js       → UI
     4. Core/AuthHelper.js   → Auth
     5. Core/CartHelper.js   → Cart

   ویژگی‌ها:
     - نمایش اطلاعات پرسنل
     - ویرایش پروفایل
     - CRUD فروشگاه‌های کاربر
     - نمایش ۵ سفارش اخیر
   ============================================================ */

(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════
    // وابستگی‌ها
    // ═══════════════════════════════════════════════════════
    const Http = window.HttpHelper;
    const UI = window.UICore;

    if (!Http || !UI) {
        console.error('❌ StoresProfile: HttpHelper یا UICore لود نشده!');
        return;
    }

    // ═══════════════════════════════════════════════════════
    // State
    // ═══════════════════════════════════════════════════════
    const State = {
        currentPersonel: null,
        storesList: [],
        ordersList: [],
        editingStoreId: null
    };

    // ═══════════════════════════════════════════════════════
    // Loading
    // ═══════════════════════════════════════════════════════
    function showLoading() {
        $('#loadingOverlay').addClass('active');
    }

    function hideLoading() {
        $('#loadingOverlay').removeClass('active');
    }

    // ═══════════════════════════════════════════════════════
    // تاریخ شمسی
    // ═══════════════════════════════════════════════════════
    function toJalali(value) {
        if (!value) return '';
        if (window.PersianDateHelper?.toJalali) {
            return window.PersianDateHelper.toJalali(value);
        }
        return String(value);
    }

    // ═══════════════════════════════════════════════════════
    // دریافت پرسنل
    // ═══════════════════════════════════════════════════════
    async function loadPersonnel() {
        showLoading();

        try {
            const response = await Http.postSecure('/ShopPanel/Profile/GetData');

            if (response.isSuccess) {
                const data = JSON.parse(response.data);

                if (data && data.length > 0) {
                    State.currentPersonel = data[0];
                    renderPersonnel();

                    await Promise.all([
                        loadStores(),
                        loadOrders()
                    ]);
                } else {
                    UI.showToast('اطلاعات پرسنل یافت نشد', 'error');
                }
            } else {
                UI.showToast(response.errorTitle || 'خطا در دریافت اطلاعات', 'error');
            }
        } catch (err) {
            if (err.message === 'AUTH_REQUIRED') return;
            UI.showToast('خطا در ارتباط با سرور', 'error');
        } finally {
            hideLoading();
        }
    }

    // ═══════════════════════════════════════════════════════
    // رندر — پرسنل
    // ═══════════════════════════════════════════════════════
    function renderPersonnel() {
        const p = State.currentPersonel;
        if (!p) return;

        const fullName = `${p.FirstName || ''} ${p.LastName || ''}`.trim() || 'کاربر';
        const firstChar = (p.FirstName || 'ع')[0];

        $('#avatarDisplay').text(firstChar);
        $('#heroName').text(fullName);
        $('#heroRole').text(p.Detail || 'کاربر سیستم');

        $('#viewFirstName').text(p.FirstName || '---');
        $('#viewLastName').text(p.LastName || '---');
        $('#viewBirth').text(p.Date_of_birth || '---');
        $('#viewNational').text(p.Lational_code || '---');
        $('#viewAddress').text(p.Address || '---');
        $('#viewDetail').text(p.Detail || '---');

        const statusText = p.Status ? 'فعال' : 'غیرفعال';
        const statusColor = p.Status ? 'var(--success)' : 'var(--danger)';
        $('#statusBadge').text(statusText).css('background', statusColor);
    }

    // ═══════════════════════════════════════════════════════
    // فروشگاه‌ها — دریافت
    // ═══════════════════════════════════════════════════════
    async function loadStores() {
        try {
            const response = await Http.postSecure('/ShopPanel/Recommendation/myStore');

            if (response.isSuccess) {
                State.storesList = JSON.parse(response.data);
                renderStores();
            }
        } catch (err) {
            if (err.message !== 'AUTH_REQUIRED') {
                console.error('خطا در دریافت فروشگاه‌ها:', err);
            }
        }
    }

    // ═══════════════════════════════════════════════════════
    // رندر — فروشگاه‌ها
    // ═══════════════════════════════════════════════════════
    function renderStores() {
        const container = $('#storesList');
        const countBadge = $('#storeCount');

        $('#statStores').text(State.storesList.length);

        // ─── خالی ───
        if (!State.storesList || State.storesList.length === 0) {
            container.html(`
                <div class="no-items">
                    <i class="fas fa-store"></i>
                    <p>هیچ فروشگاهی ثبت نشده است</p>
                </div>`);
            countBadge.text('0');
            return;
        }

        countBadge.text(State.storesList.length);

        let html = '';
        State.storesList.forEach(store => {
            const sClass = store.Status ? 'active' : 'inactive';
            const sText = store.Status ? 'فعال' : 'غیرفعال';

            html += `
                <div class="store-item" data-store-id="${store.StoreId}">
                    <div class="store-info">
                        <div class="name">${UI.escapeHtml(store.StoreCaption || 'بدون عنوان')}</div>
                        <div class="code">کد: ${UI.escapeHtml(store.CodeStore || '---')}</div>
                        <div class="address">
                            <i class="fas fa-map-marker-alt"></i>
                            ${UI.escapeHtml(store.AddressStore || 'آدرس ثبت نشده')}
                        </div>
                    </div>
                    <div class="store-actions">
                        <span class="store-status ${sClass}">${sText}</span>
                        <button class="btn-edit-store" data-id="${store.StoreId}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-delete-store" data-id="${store.StoreId}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>`;
        });

        container.html(html);

        // ─── رویدادها ───
        container.find('.btn-edit-store').on('click', function () {
            editStore(parseInt($(this).data('id')));
        });

        container.find('.btn-delete-store').on('click', function () {
            deleteStore(parseInt($(this).data('id')));
        });
    }

    // ═══════════════════════════════════════════════════════
    // Modal — فروشگاه
    // ═══════════════════════════════════════════════════════
    function openAddStoreModal() {
        State.editingStoreId = null;

        $('#storeCaption').val('');
        $('#storeAddress').val('');
        $('#storeModal h3').html('<i class="fas fa-store"></i> افزودن فروشگاه جدید');
        $('#storeModal').addClass('active');
        $('body').css('overflow', 'hidden');
    }

    function editStore(storeId) {
        const store = State.storesList.find(s => s.StoreId === storeId);
        if (!store) return;

        State.editingStoreId = storeId;

        $('#storeCaption').val(store.StoreCaption || '');
        $('#storeAddress').val(store.AddressStore || '');
        $('#storeModal h3').html('<i class="fas fa-edit"></i> ویرایش فروشگاه');
        $('#storeModal').addClass('active');
        $('body').css('overflow', 'hidden');
    }

    function closeStoreModal() {
        $('#storeModal').removeClass('active');
        $('body').css('overflow', '');
        State.editingStoreId = null;
    }

    // ═══════════════════════════════════════════════════════
    // فروشگاه — ذخیره
    // ═══════════════════════════════════════════════════════
    async function saveStore() {
        const caption = $('#storeCaptionInput').val().trim();
        const address = $('#storeAddressInput').val().trim();

        if (!caption) {
            UI.showToast('عنوان فروشگاه را وارد کنید', 'error');
            return;
        }
        if (!address) {
            UI.showToast('آدرس را وارد کنید', 'error');
            return;
        }

        const isEdit = !!State.editingStoreId;

        // ═══════════════════════════════════════════════════════
        // ★ payload متفاوت برای Add و Update
        // ═══════════════════════════════════════════════════════
        const storeData = {
            StoreId: isEdit ? State.editingStoreId : 0,
            StoreCaption: caption,
            AddressStore: address,
            Status: true
        };

        // ─── PersonelId فقط در افزودن ───
        if (!isEdit) {
            storeData.PersonelId = State.currentPersonel?.PersonelId || 0;
        }

        // ═══════════════════════════════════════════════════════
        // ★ URL متفاوت برای Add و Update
        // ═══════════════════════════════════════════════════════
        const url = isEdit
            ? '/ShopPanel/Profile/UpdateStores'   // ویرایش
            : '/ShopPanel/Profile/AddStores';     // افزودن

        showLoading();

        try {
            const response = await Http.postSecure(url, storeData);

            if (response.isSuccess) {
                if (isEdit) {
                    // ─── آپدیت local ───
                    const index = State.storesList.findIndex(s =>
                        s.StoreId == State.editingStoreId);

                    if (index !== -1) {
                        State.storesList[index] = {
                            ...State.storesList[index],
                            StoreCaption: caption,
                            AddressStore: address
                        };
                    }
                } else {
                    await loadStores();
                }

                renderStores();
                closeStoreModal();
                UI.showToast(response.data || 'ذخیره شد', 'success');
            } else {
                UI.showToast(response.errorTitle || 'خطا', 'error');
            }
        } catch (err) {
            if (err.message !== 'AUTH_REQUIRED') {
                UI.showToast('خطا در ارتباط', 'error');
            }
        } finally {
            hideLoading();
        }
    }

    // ═══════════════════════════════════════════════════════
    // فروشگاه — حذف
    // ═══════════════════════════════════════════════════════
    async function deleteStore(storeId) {
        const store = State.storesList.find(s => s.StoreId === storeId);
        if (!store) return;

        if (!confirm(`حذف فروشگاه "${store.StoreCaption}"؟`)) return;

        showLoading();

        try {
            const response = await Http.postSecure('/Stores/DeleteData', { id: storeId });

            if (response.isSuccess) {
                State.storesList = State.storesList.filter(s => s.StoreId !== storeId);
                renderStores();
                UI.showToast(response.data || 'حذف شد', 'success');
            } else {
                UI.showToast(response.errorTitle || 'خطا', 'error');
            }
        } catch (err) {
            if (err.message !== 'AUTH_REQUIRED') {
                UI.showToast('خطا در ارتباط', 'error');
            }
        } finally {
            hideLoading();
        }
    }

    // ═══════════════════════════════════════════════════════
    // سفارشات — دریافت
    // ═══════════════════════════════════════════════════════
    async function loadOrders() {
        try {
            const response = await Http.postSecure('/ShopPanel/Recommendation/myRecommendation');

            if (response.isSuccess) {
                State.ordersList = JSON.parse(response.data);

                // ─── مرتب‌سازی نزولی ───
                State.ordersList.sort((a, b) =>
                    (b.RecommendationsId || 0) - (a.RecommendationsId || 0));

                // ─── فقط ۵ تای اول ───
                State.ordersList = State.ordersList.slice(0, 5);

                renderOrders();
            }
        } catch (err) {
            if (err.message !== 'AUTH_REQUIRED') {
                console.error('خطا در دریافت سفارشات:', err);
            }
        }
    }

    // ═══════════════════════════════════════════════════════
    // رندر — سفارشات
    // ═══════════════════════════════════════════════════════
    function renderOrders() {
        const container = $('#ordersList');
        const countBadge = $('#orderCount');

        $('#statOrders').text(State.ordersList.length);

        // ─── خالی ───
        if (!State.ordersList || State.ordersList.length === 0) {
            container.html(`
                <div class="no-items">
                    <i class="fas fa-clock-rotate-left"></i>
                    <p>هیچ سفارشی ثبت نشده است</p>
                </div>`);
            countBadge.text('0');
            return;
        }

        countBadge.text(State.ordersList.length);

        const statusMap = {
            2: { class: 'pending', text: 'ثبت سفارش' },
            3: { class: 'processing', text: 'پرداخت' },
            4: { class: 'processing', text: 'در حال پردازش' },
            5: { class: 'shipped', text: 'بسته‌بندی' },
            6: { class: 'shipped', text: 'تحویل به پست' },
            7: { class: 'delivered', text: 'تحویل مشتری' }
        };

        let html = '';
        State.ordersList.forEach(order => {
            const level = order.LevelOrder || 2;
            const sInfo = statusMap[level] || statusMap[2];
            const dFa = toJalali(order.DateTimeRecord || order.DateTimeRecordFa);

            html += `
                <div class="order-item">
                    <div class="order-info">
                        <div class="id">#${order.RecommendationsId || '---'}</div>
                        <div class="date">${UI.escapeHtml(order.RecommendationsCaption || 'بدون عنوان')}</div>
                        <div class="products">${UI.escapeHtml(order.Command || '')}</div>
                    </div>
                    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
                        <span style="font-size:0.75rem;color:var(--text-secondary);">${dFa}</span>
                        <span class="order-status-badge ${sInfo.class}">${sInfo.text}</span>
                    </div>
                </div>`;
        });

        container.html(html);
    }

    // ═══════════════════════════════════════════════════════
    // ویرایش پروفایل
    // ═══════════════════════════════════════════════════════
    function openEditMode() {
        if (!State.currentPersonel) return;

        $('#editFirstName').val(State.currentPersonel.FirstName || '');
        $('#editLastName').val(State.currentPersonel.LastName || '');
        $('#editBirth').val(State.currentPersonel.Date_of_birth || '');
        $('#editNational').val(State.currentPersonel.Lational_code || '');
        $('#editDetail').val(State.currentPersonel.Detail || '');

        $('#viewMode').hide();
        $('#editForm').addClass('active');
    }

    function closeEditMode() {
        $('#viewMode').show();
        $('#editForm').removeClass('active');
    }

    async function saveProfile() {
        if (!State.currentPersonel) return;

        const firstName = $('#editFirstName').val().trim();
        const lastName = $('#editLastName').val().trim();
        const birth = $('#editBirth').val().trim();
        const national = $('#editNational').val().trim();
        const detail = $('#editDetail').val().trim();

        // ─── اعتبارسنجی ───
        if (!firstName) {
            UI.showToast('نام را وارد کنید', 'error');
            return;
        }
        if (!lastName) {
            UI.showToast('نام خانوادگی را وارد کنید', 'error');
            return;
        }
        if (national && national.length !== 10) {
            UI.showToast('کد ملی ۱۰ رقم باشد', 'error');
            return;
        }

        const updated = {
            ...State.currentPersonel,
            FirstName: firstName,
            LastName: lastName,
            Date_of_birth: birth || null,
            Lational_code: national,
            Detail: detail || null
        };

        showLoading();

        try {
            const response = await Http.postSecure('/ShopPanel/Profile/Update', updated);

            if (response.isSuccess) {
                State.currentPersonel = updated;
                renderPersonnel();
                closeEditMode();
                UI.showToast(response.data || 'به‌روزرسانی شد', 'success');
            } else {
                UI.showToast(response.errorTitle || 'خطا', 'error');
            }
        } catch (err) {
            if (err.message !== 'AUTH_REQUIRED') {
                UI.showToast('خطا در ارتباط', 'error');
            }
        } finally {
            hideLoading();
        }
    }

    // ═══════════════════════════════════════════════════════
    // Bind Events
    // ═══════════════════════════════════════════════════════
    function bindEvents() {
        // ─── پروفایل ───
        $('#enableEditBtn').on('click', openEditMode);
        $('#saveProfileBtn').on('click', saveProfile);
        $('#cancelEditBtn').on('click', closeEditMode);

        // ─── فروشگاه ───
        $('#openAddStoreModal').on('click', openAddStoreModal);
        $('#saveStoreBtn').on('click', saveStore);
        $('#closeStoreModal').on('click', closeStoreModal);

        // ─── بستن Modal با کلیک روی backdrop ───
        $('#storeModal').on('click', function (e) {
            if (e.target === this) closeStoreModal();
        });
    }

    // ═══════════════════════════════════════════════════════
    // Init
    // ═══════════════════════════════════════════════════════
    async function init() {
        bindEvents();
        await loadPersonnel();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();