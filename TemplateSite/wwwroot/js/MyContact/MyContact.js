(function () {
    'use strict';

    const Http = window.HttpHelper;
    const UI = window.UICore;

    if (!Http || !UI) {
        console.error('❌ MyContact: Core ها لود نشده‌اند!');
        return;
    }

    // ═══════════════════════════════════════════════════════
    // State
    // ═══════════════════════════════════════════════════════
    const State = {
        stores: [],              // همه فروشگاه‌های کاربر
        viewStoreId: 0,          // فروشگاه فعلی (برای مشاهده)
        items: [],               // لیست راه‌های تماس
        types: [],               // نوع‌های پلتفرم
        editingId: 0,
        editingStoreId: 0
    };

    // ═══════════════════════════════════════════════════════
    // DOM
    // ═══════════════════════════════════════════════════════
    const el = {
        contactList: document.getElementById('contactList'),
        statsCards: document.getElementById('statsCards'),
        viewStoreSelect: document.getElementById('viewStoreSelect'),

        // Modal
        modal: document.getElementById('contactModal'),
        modalTitle: document.getElementById('modalTitle'),
        modalStoreGroup: document.getElementById('modalStoreGroup'),
        modalStoreId: document.getElementById('modalStoreId'),
        typeContact: document.getElementById('typeContact'),
        contactCaption: document.getElementById('contactCaption'),
        contactId: document.getElementById('contactId')
    };

    // ═══════════════════════════════════════════════════════
    // Debug
    // ═══════════════════════════════════════════════════════
    function debug(...args) { console.log('🔍 [MyContact]', ...args); }
    function debugError(...args) { console.error('❌ [MyContact]', ...args); }

    // ═══════════════════════════════════════════════════════
    // Load Current Store
    // ═══════════════════════════════════════════════════════
    async function loadCurrentStore() {
        try {
            const res = await Http.postSecure('/Auth/GetStoreById');

            if (!res.isSuccess) {
                UI.showToast('خطا در دریافت فروشگاه‌ها', 'error');
                return false;
            }

            const stores = JSON.parse(res.data);
            debug('Stores:', stores);

            if (!stores || stores.length === 0) {
                UI.showToast('شما فروشگاهی ندارید', 'warning');
                return false;
            }

            State.stores = stores;
            State.viewStoreId = stores[0].StoreId;

            // ─── Selector فروشگاه (نمایش) ───
            if (el.viewStoreSelect) {
                bindViewStoreSelector(stores);
            }

            // ─── Selector فروشگاه (Modal) ───
            renderModalStoreSelector(stores);

            return true;
        } catch (err) {
            debugError('loadCurrentStore:', err);
            return false;
        }
    }

    // ─── Selector بالای صفحه ───
    function bindViewStoreSelector(stores) {
        if (!el.viewStoreSelect) return;

        el.viewStoreSelect.addEventListener('change', function () {
            State.viewStoreId = parseInt(this.value);
            debug('viewStoreId:', State.viewStoreId);
            loadContacts();
        });
    }

    // ─── Selector داخل Modal ───
    function renderModalStoreSelector(stores) {
        if (!el.modalStoreId || !el.modalStoreGroup) return;

        // ─── اگه فقط ۱ فروشگاه داره → مخفی ───
        if (stores.length <= 1) {
            el.modalStoreGroup.style.display = 'none';

            // ─── مقدار پیش‌فرض ───
            if (stores.length === 1) {
                el.modalStoreId.innerHTML = `<option value="${stores[0].StoreId}" selected>${stores[0].StoreCaption}</option>`;
            }
            return;
        }

        // ─── چند فروشگاه → نمایش ───
        el.modalStoreGroup.style.display = '';

        let html = '<option value="">انتخاب فروشگاه...</option>';
        stores.forEach(store => {
            html += `<option value="${store.StoreId}">${UI.escapeHtml(store.StoreCaption)}</option>`;
        });

        el.modalStoreId.innerHTML = html;
    }

    // ═══════════════════════════════════════════════════════
    // Load Types + Contacts
    // ═══════════════════════════════════════════════════════
    async function loadTypesAndContacts() {
        await Promise.all([
            loadTypes(),
            loadContacts()
        ]);
    }

    async function loadTypes() {
        try {
            const res = await Http.postSecure('/MyContact/GetTypes');
            if (!res.isSuccess) return;

            State.types = JSON.parse(res.data);
            renderTypeOptions();
        } catch (err) {
            debugError('loadTypes:', err);
        }
    }

    function renderTypeOptions() {
        if (!el.typeContact) return;

        let html = '<option value="">انتخاب نوع پلتفرم</option>';

        State.types.forEach(t => {
            const id = t.typeContactId ?? t.TypeContactId;
            const cap = t.typeContactCaption ?? t.TypeContactCaption;
            html += `<option value="${id}">${UI.escapeHtml(cap)}</option>`;
        });

        el.typeContact.innerHTML = html;
    }

    async function loadContacts() {
        if (!el.contactList) return;

        el.contactList.innerHTML = `
            <div class="contact-loading">
                <i class="fas fa-spinner fa-spin"></i>
                در حال بارگذاری...
            </div>`;

        try {
            const res = await Http.postSecure('/MyContact/GetData', {
                storeId: State.viewStoreId
            });

            if (!res.isSuccess) {
                UI.showToast(res.errorTitle || 'خطا', 'error');
                State.items = [];
                renderContacts();
                return;
            }

            State.items = JSON.parse(res.data);
            debug('Contacts:', State.items.length);

            renderContacts();
            renderStats();
        } catch (err) {
            debugError('loadContacts:', err);
            UI.showToast('خطا در ارتباط', 'error');
        }
    }

    // ═══════════════════════════════════════════════════════
    // Render
    // ═══════════════════════════════════════════════════════
    function renderContacts() {
        if (!el.contactList) return;

        if (!State.items || State.items.length === 0) {
            el.contactList.innerHTML = `
                <div class="contact-empty">
                    <i class="fas fa-address-book"></i>
                    <h3>هیچ راه تماسی ثبت نشده</h3>
                    <p>برای شروع، روی «افزودن راه تماس» کلیک کنید</p>
                </div>`;
            return;
        }

        el.contactList.innerHTML = State.items.map(c => renderContactCard(c)).join('');
        bindCardEvents();
    }

    function renderContactCard(c) {
        const id = c.contactId ?? c.ContactId;
        const caption = c.contactCaption ?? c.ContactCaption ?? '—';
        const typeId = c.typeContactId ?? c.TypeContactId;
        const status = c.status ?? c.Status;
        const storeId = c.storeId ?? c.StoreId;

        const type = State.types.find(t => {
            const tId = t.typeContactId ?? t.TypeContactId;
            return tId === typeId;
        });

        const typeCaption = type
            ? (type.typeContactCaption ?? type.TypeContactCaption)
            : `نوع #${typeId}`;

        const store = State.stores.find(s => s.StoreId === storeId);
        const storeName = store ? store.StoreCaption : `#${storeId}`;

        const statusClass = status ? 'active' : 'inactive';
        const statusText = status ? 'فعال' : 'غیرفعال';

        // ═══════════════════════════════════════════════════════
        // ★ نمایش نام فروشگاه (برای مواردی که چند فروشگاه داره)
        // ═══════════════════════════════════════════════════════
        const showStoreName = State.stores.length > 1;

        return `
            <div class="contact-card" data-id="${id}">
                <div class="contact-card-header">
                    <div class="contact-type">
                        <i class="fas fa-share-alt"></i>
                        ${UI.escapeHtml(typeCaption)}
                    </div>
                    <span class="contact-status ${statusClass}">${statusText}</span>
                </div>

                ${showStoreName ? `
                    <div class="contact-store-badge">
                        <i class="fas fa-store"></i>
                        ${UI.escapeHtml(storeName)}
                    </div>
                ` : ''}

                <div class="contact-card-body">
                    <div class="contact-caption">${UI.escapeHtml(caption)}</div>
                </div>

                <div class="contact-card-footer">
                    <button class="contact-btn contact-btn-edit"
                            data-id="${id}"
                            data-store-id="${storeId}">
                        <i class="fas fa-edit"></i> ویرایش
                    </button>
                    <button class="contact-btn contact-btn-delete"
                            data-id="${id}"
                            data-store-id="${storeId}">
                        <i class="fas fa-trash"></i> حذف
                    </button>
                </div>
            </div>`;
    }

    function bindCardEvents() {
        document.querySelectorAll('.contact-btn-edit').forEach(btn => {
            btn.addEventListener('click', function () {
                const id = parseInt(this.dataset.id);
                const storeId = parseInt(this.dataset.storeId);
                openEditModal(id, storeId);
            });
        });

        document.querySelectorAll('.contact-btn-delete').forEach(btn => {
            btn.addEventListener('click', async function () {
                const id = parseInt(this.dataset.id);
                const storeId = parseInt(this.dataset.storeId);
                if (!confirm('حذف این راه تماس؟')) return;
                await deleteContact(id, storeId);
            });
        });
    }

    // ═══════════════════════════════════════════════════════
    // Stats
    // ═══════════════════════════════════════════════════════
    function renderStats() {
        if (!el.statsCards) return;

        const total = State.items.length;
        const active = State.items.filter(c => c.status ?? c.Status).length;
        const inactive = total - active;

        el.statsCards.innerHTML = `
            <div class="stat-card">
                <div class="stat-info">
                    <div class="number">${total}</div>
                    <div class="label">کل راه‌های تماس</div>
                </div>
                <div class="stat-icon"><i class="fas fa-address-book"></i></div>
            </div>
            <div class="stat-card">
                <div class="stat-info">
                    <div class="number">${active}</div>
                    <div class="label">فعال</div>
                </div>
                <div class="stat-icon"><i class="fas fa-check-circle"></i></div>
            </div>
            <div class="stat-card">
                <div class="stat-info">
                    <div class="number">${inactive}</div>
                    <div class="label">غیرفعال</div>
                </div>
                <div class="stat-icon"><i class="fas fa-ban"></i></div>
            </div>`;
    }

    // ═══════════════════════════════════════════════════════
    // Modal
    // ═══════════════════════════════════════════════════════
    function openAddModal() {
        State.editingId = 0;
        State.editingStoreId = 0;

        el.contactId.value = '0';
        el.contactCaption.value = '';
        el.typeContact.value = '';

        // ─── Store Selector ───
        if (el.modalStoreId) {
            // اگه فقط ۱ فروشگاه داره → انتخاب خودکار
            if (State.stores.length === 1) {
                el.modalStoreId.value = State.stores[0].StoreId;
            } else {
                // اگه از Selector بالای صفحه انتخاب شده، همون رو پیش‌فرض بذار
                el.modalStoreId.value = State.viewStoreId || '';
            }
        }

        el.modalTitle.innerText = 'افزودن راه تماس';
        el.modal?.classList.add('active');
    }

    function openEditModal(id, storeId) {
        const item = State.items.find(c => {
            const cId = c.contactId ?? c.ContactId;
            return cId === id;
        });

        if (!item) return;

        State.editingId = id;
        State.editingStoreId = storeId;

        el.contactId.value = id;
        el.contactCaption.value = item.contactCaption ?? item.ContactCaption ?? '';
        el.typeContact.value = item.typeContactId ?? item.TypeContactId ?? '';

        // ─── Store Selector ───
        if (el.modalStoreId) {
            el.modalStoreId.value = storeId;
        }

        el.modalTitle.innerText = 'ویرایش راه تماس';
        el.modal?.classList.add('active');
    }

    function closeModal(id) {
        document.getElementById(id)?.classList.remove('active');
    }

    // ═══════════════════════════════════════════════════════
    // Save Contact
    // ═══════════════════════════════════════════════════════
    async function saveContact() {
        const caption = el.contactCaption.value.trim();
        const typeId = parseInt(el.typeContact.value);
        const id = parseInt(el.contactId.value) || 0;

        // ───★ StoreId از Modal ───
        let storeId = 0;
        if (el.modalStoreId) {
            storeId = parseInt(el.modalStoreId.value);
        }

        // ─── اعتبارسنجی ───
        if (!storeId) {
            UI.showToast('لطفاً فروشگاه را انتخاب کنید', 'warning');
            return;
        }

        if (!caption) {
            UI.showToast('مشخصات تماس را وارد کنید', 'warning');
            return;
        }

        if (!typeId) {
            UI.showToast('نوع پلتفرم را انتخاب کنید', 'warning');
            return;
        }

        const url = id === 0 ? '/MyContact/Add' : '/MyContact/Update';
        const payload = {
            storeId: storeId,
            contactCaption: caption,
            typeContactId: typeId
        };

        if (id > 0) {
            payload.contactId = id;
        }

        try {
            const res = await Http.postSecure(url, payload);

            if (res.isSuccess) {
                UI.showToast(res.data || 'ذخیره شد ✅', 'success');
                closeModal('contactModal');

                // ───★ اگه storeId با viewStoreId فرق داشت، viewStoreId رو عوض کن ───
                if (storeId !== State.viewStoreId) {
                    State.viewStoreId = storeId;

                    if (el.viewStoreSelect) {
                        el.viewStoreSelect.value = storeId;
                    }
                }

                await loadContacts();
            } else {
                UI.showToast(res.errorTitle || 'خطا', 'error');
            }
        } catch (err) {
            debugError('saveContact:', err);
            UI.showToast('خطا در ارتباط', 'error');
        }
    }

    async function deleteContact(id, storeId) {
        try {
            const res = await Http.postSecure('/MyContact/Delete', {
                contactId: id,
                storeId: storeId
            });

            if (res.isSuccess) {
                UI.showToast(res.data || 'حذف شد', 'success');
                await loadContacts();
            } else {
                UI.showToast(res.errorTitle || 'خطا', 'error');
            }
        } catch (err) {
            debugError('deleteContact:', err);
            UI.showToast('خطا در ارتباط', 'error');
        }
    }

    // ═══════════════════════════════════════════════════════
    // Init
    // ═══════════════════════════════════════════════════════
    async function init() {
        const loaded = await loadCurrentStore();

        if (loaded && State.viewStoreId > 0) {
            await loadTypesAndContacts();
        }
    }

    // Export
    window.openAddModal = openAddModal;
    window.openEditModal = openEditModal;
    window.closeModal = closeModal;
    window.saveContact = saveContact;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
