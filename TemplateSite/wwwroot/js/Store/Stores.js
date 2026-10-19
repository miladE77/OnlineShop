/* ============================================================
   Stores.js — مدیریت فروشگاه (پنل مدیریتی)
   ------------------------------------------------------------
   وابستگی‌ها:
     1. jQuery
     2. HttpHelper.js    ← post, postSecure
     3. UICore.js        ← showToast, formatDate
     4. AuthHelper.js    ← checkAccess
     5. PersianDateInit.js ← PersianDateHelper.toJalali/toGregorian

   الگو:
     - StoreList نگه‌داری می‌شود (localStorage)
     - input[type=date] → میلادی → تبدیل به شمسی (StoreRecordFa) → ارسال
   ============================================================ */

(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════
    // وابستگی‌ها
    // ═══════════════════════════════════════════════════════
    const Http = window.HttpHelper;
    const UI = window.UICore;
    const Auth = window.AuthHelper;

    // ═══════════════════════════════════════════════════════
    // State
    // ═══════════════════════════════════════════════════════
    const State = {
        list: [],
        editing: false,

        // ─── ذخیره در localStorage ───
        persist() {
            try {
                localStorage.setItem('Stores', JSON.stringify(this.list));
            } catch (e) {
                console.error('❌ خطا در localStorage:', e);
            }
        },

        // ─── بارگذاری از localStorage ───
        restore() {
            try {
                const raw = localStorage.getItem('Stores');
                if (raw) {
                    this.list = JSON.parse(raw);
                    return true;
                }
            } catch (e) {
                console.warn('⚠️ Stores localStorage خراب بود');
                localStorage.removeItem('Stores');
            }
            return false;
        }
    };

    // ═══════════════════════════════════════════════════════
    // المان‌های DOM
    // ═══════════════════════════════════════════════════════
    const el = {
        modal: document.getElementById('StoreModal'),
        modalTitle: document.getElementById('modalTitle'),

        // فرم
        StoreId: document.getElementById('StoreId'),
        StoreCaption: document.getElementById('StoreCaption'),
        Personel: document.getElementById('Personel'),
        CodeStore: document.getElementById('CodeStore'),
        StoreRecord: document.getElementById('StoreRecord'),
        AddressStore: document.getElementById('AddressStore'),
        Status: document.getElementById('Status'),

        // جدول
        tbody: document.getElementById('StoreTableBody'),

        // فیلتر
        searchBox: document.getElementById('searchStore'),
        statusFilter: document.getElementById('statusFilter'),

        // آمار
        statsCards: document.getElementById('statsCards')
    };

    // ═══════════════════════════════════════════════════════
    // ابزار تاریخ
    // ═══════════════════════════════════════════════════════
    const DateUtil = {

        // ─── نمایش شمسی برای جدول ───
        toDisplay(data) {
            if (data.StoreRecordFa) return data.StoreRecordFa;

            if (data.StoreRecord && window.PersianDateHelper) {
                return window.PersianDateHelper.toJalali(data.StoreRecord);
            }
            return '—';
        },

        // ─── میلادی input → شمسی برای ارسال ───
        toJalali(value) {
            if (!value) return '';
            if (window.PersianDateHelper?.toJalali) {
                return window.PersianDateHelper.toJalali(value);
            }
            return value;
        },

        // ─── تنظیم مقدار input[type=date] با مقدار میلادی ───
        setInputValue(input, gregorianValue) {
            if (!input) return;
            input.value = gregorianValue || '';
            input.dispatchEvent(new Event('change', { bubbles: true }));
        },

        // ─── استخراج میلادی از رکورد ───
        extractGregorian(data) {
            if (data.StoreRecord) {
                // "2024-05-15T00:00:00" → "2024-05-15"
                return String(data.StoreRecord).split('T')[0];
            }
            if (data.StoreRecordFa && window.PersianDateHelper) {
                return window.PersianDateHelper.toGregorian(data.StoreRecordFa);
            }
            return '';
        }
    };

    // ═══════════════════════════════════════════════════════
    // Modal
    // ═══════════════════════════════════════════════════════
    const Modal = {
        open(id) {
            document.getElementById(id)?.classList.add('active');
        },
        close(id) {
            document.getElementById(id)?.classList.remove('active');
        }
    };

    // ═══════════════════════════════════════════════════════
    // Dropdown — پر کردن select ها
    // ═══════════════════════════════════════════════════════
    async function loadPersonels() {
        try {
            const res = await Http.post('/Personels/GetAllData');
            if (!res.isSuccess) return;

            const data = JSON.parse(res.data);
            let options = '<option value="">انتخاب صاحب فروشگاه</option>';

            data.forEach(item => {
                const fullName = `${item.FirstName || ''} ${item.LastName || ''}`.trim();
                options += `<option value="${item.PersonelId}">${fullName || item.PersonelId}</option>`;
            });

            if (el.Personel) el.Personel.innerHTML = options;
        } catch (err) {
            console.error('خطا در دریافت پرسنل:', err);
        }
    }

    // ═══════════════════════════════════════════════════════
    // Storage — دریافت از سرور + localStorage
    // ═══════════════════════════════════════════════════════
    async function fetchFromServer() {
        try {
            const res = await Http.post('/Stores/GetAllData');

            if (!res.isSuccess) {
                UI.showToast(res.errorTitle || 'خطا در دریافت', 'error');
                return;
            }

            State.list = JSON.parse(res.data);
            State.persist();
            renderTable();
        } catch (err) {
            console.error('خطا در fetchFromServer:', err);
            UI.showToast('خطا در ارتباط با سرور', 'error');
        }
    }

    function loadInitialData() {
        if (State.restore()) {
            renderTable();
            // ─── پس‌زمینه: آپدیت از سرور ───
            fetchFromServer();
        } else {
            fetchFromServer();
        }
    }

    // ═══════════════════════════════════════════════════════
    // Stats
    // ═══════════════════════════════════════════════════════
    function renderStats() {
        if (!el.statsCards) return;

        const total = State.list.length;
        const active = State.list.filter(d => d.Status).length;
        const inactive = State.list.filter(d => !d.Status).length;

        el.statsCards.innerHTML = `
            <div class="stat-card">
                <div class="stat-info">
                    <div class="number">${total}</div>
                    <div class="label">کل فروشگاه</div>
                </div>
                <div class="stat-icon"><i class="fas fa-store"></i></div>
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
            </div>
        `;
    }

    // ═══════════════════════════════════════════════════════
    // Table
    // ═══════════════════════════════════════════════════════
    function getFilteredList() {
        const searchTerm = (el.searchBox?.value || '').toLowerCase().trim();
        const statusFilter = el.statusFilter?.value || 'all';

        let filtered = [...State.list];

        if (searchTerm) {
            filtered = filtered.filter(p =>
                (p.StoreCaption || '').toLowerCase().includes(searchTerm) ||
                (p.CodeStore || '').toLowerCase().includes(searchTerm) ||
                (p.AddressStore || '').toLowerCase().includes(searchTerm) ||
                String(p.PersonelId || '').includes(searchTerm)
            );
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter(p => p.Status.toString() === statusFilter);
        }

        return filtered;
    }

    function renderTable() {
        if (!el.tbody) return;

        const filtered = getFilteredList();

        if (filtered.length === 0) {
            el.tbody.innerHTML = `<tr class="empty-row"><td colspan="8">هیچ رکورد یافت نشد</td></tr>`;
            renderStats();
            return;
        }

        el.tbody.innerHTML = filtered.map(data => {
            const statusText = data.Status ? 'فعال' : 'غیرفعال';
            const dateFa = DateUtil.toDisplay(data);
            const fullName = `${data.FirstName || ''} ${data.LastName || ''}`.trim() || '—';

            return `<tr>
                <td><strong>${data.StoreId}</strong></td>
                <td>${UI.escapeHtml(data.StoreCaption || '—')}</td>
                <td>${UI.escapeHtml(fullName)}</td>
                <td>${UI.escapeHtml(data.CodeStore || '—')}</td>
                <td>${dateFa}</td>
                <td>${UI.escapeHtml(data.AddressStore || '—')}</td>
                <td>${statusText}</td>
                <td class="action-buttons">
                    <button class="action-btn edit-btn" data-id="${data.StoreId}" title="ویرایش">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" data-id="${data.StoreId}" title="حذف">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            </tr>`;
        }).join('');

        bindTableEvents();
        renderStats();
    }

    function bindTableEvents() {
        el.tbody.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => openEditModal(parseInt(btn.dataset.id)));
        });

        el.tbody.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (UI.confirmAction('حذف رکورد؟')) {
                    deleteStore(parseInt(btn.dataset.id));
                }
            });
        });
    }

    // ═══════════════════════════════════════════════════════
    // CRUD
    // ═══════════════════════════════════════════════════════
    async function deleteStore(storeId) {
        try {
            const res = await Http.post('/Stores/DeleteData', { id: storeId });

            if (res.isSuccess) {
                State.list = State.list.filter(d => d.StoreId !== storeId);
                State.persist();
                renderTable();
                UI.showToast(res.data || 'حذف شد', 'success');
            } else {
                UI.showToast(res.errorTitle || 'خطا', 'error');
            }
        } catch (err) {
            UI.showToast('خطا در ارتباط با سرور', 'error');
        }
    }

    // ═══════════════════════════════════════════════════════
    // Modal — Add / Edit
    // ═══════════════════════════════════════════════════════
    function openAddModal() {
        State.editing = false;
        resetModal();
        el.modalTitle.innerText = 'افزودن فروشگاه جدید';
        Modal.open('StoreModal');
    }

    function openEditModal(storeId) {
        const data = State.list.find(d => d.StoreId === storeId);
        if (!data) return;

        State.editing = true;

        el.StoreId.value = data.StoreId || '';
        el.StoreCaption.value = data.StoreCaption || '';
        el.Personel.value = data.PersonelId || '';
        el.CodeStore.value = data.CodeStore || '';
        el.AddressStore.value = data.AddressStore || '';
        el.Status.checked = Boolean(data.Status);

        // ─── تنظیم input date با میلادی ───
        DateUtil.setInputValue(el.StoreRecord, DateUtil.extractGregorian(data));

        el.modalTitle.innerText = 'ویرایش فروشگاه';
        Modal.open('StoreModal');
    }

    function cancelSave() {
        Modal.close('StoreModal');
        resetModal();
    }

    function resetModal() {
        el.StoreId.value = '';
        el.StoreCaption.value = '';
        el.Personel.value = '';
        el.CodeStore.value = '';
        el.AddressStore.value = '';
        el.Status.checked = false;
        DateUtil.setInputValue(el.StoreRecord, '');
        el.modalTitle.innerText = 'افزودن فروشگاه جدید';
    }

    // ═══════════════════════════════════════════════════════
    // Save
    // ═══════════════════════════════════════════════════════
    function validate() {
        const StoreCaption = el.StoreCaption.value.trim();
        const PersonelId = el.Personel.value.trim();
        const CodeStore = el.CodeStore.value.trim();
        const storeRecord = el.StoreRecord?.value.trim() || '';
        const AddressStore = el.AddressStore.value.trim();

        if (!StoreCaption) { UI.showToast('لطفاً عنوان فروشگاه را وارد کنید', 'warning'); return null; }
        if (!PersonelId) { UI.showToast('لطفاً صاحب فروشگاه را انتخاب کنید', 'warning'); return null; }
        if (!CodeStore) { UI.showToast('لطفاً کد فروشگاه را وارد کنید', 'warning'); return null; }
        if (!storeRecord) { UI.showToast('لطفاً تاریخ تاسیس را انتخاب کنید', 'warning'); return null; }
        if (!AddressStore) { UI.showToast('لطفاً آدرس فروشگاه را وارد کنید', 'warning'); return null; }

        return { StoreCaption, PersonelId, CodeStore, storeRecord, AddressStore };
    }

    function saveNewModel() {
        const valid = validate();
        if (!valid) return;

        const StoreId = el.StoreId.value.trim();

        // ─── تبدیل میلادی به شمسی برای ارسال ───
        const StoreRecordFa = DateUtil.toJalali(valid.storeRecord);

        const payload = {
            StoreId: StoreId ? parseInt(StoreId) : 0,
            StoreCaption: valid.StoreCaption,
            PersonelId: parseInt(valid.PersonelId),
            CodeStore: valid.CodeStore,
            StoreRecordFa: StoreRecordFa,
            AddressStore: valid.AddressStore,
            Status: el.Status.checked
        };

        sendData(payload, !State.editing);
        Modal.close('StoreModal');
    }

    async function sendData(store, isAdd) {
        try {
            const res = await Http.post('/Stores/UpdateData', store);

            if (res.isSuccess) {
                await fetchFromServer();
                UI.showToast(res.data || 'ذخیره شد', 'success');
            } else {
                UI.showToast(res.errorTitle || 'خطا', 'error');
            }
        } catch (err) {
            UI.showToast('خطا در ارتباط با سرور', 'error');
        }
    }

    // ═══════════════════════════════════════════════════════
    // Bind Events
    // ═══════════════════════════════════════════════════════
    function bindEvents() {
        // ─── فیلترها ───
        el.searchBox?.addEventListener('input', UI.debounce(renderTable, 250));
        el.statusFilter?.addEventListener('change', renderTable);

        // ─── بستن Modal با کلیک بیرون ───
        el.modal?.addEventListener('click', (e) => {
            if (e.target === el.modal) Modal.close('StoreModal');
        });

        // ─── دکمه‌های سراسری (اگه در HTML onclick نیست) ───
        document.querySelector('.btn-add')?.addEventListener('click', openAddModal);
    }

    // ═══════════════════════════════════════════════════════
    // Export برای onclick در HTML
    // ═══════════════════════════════════════════════════════
    window.openAddModal = openAddModal;
    window.openEditModal = openEditModal;
    window.CanselSaveModal = cancelSave;
    window.SaveNewModel = saveNewModel;

    // ═══════════════════════════════════════════════════════
    // Init
    // ═══════════════════════════════════════════════════════
    function init() {
        bindEvents();
        loadPersonels();
        loadInitialData();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();