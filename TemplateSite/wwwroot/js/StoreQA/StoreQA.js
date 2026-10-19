(function () {
    'use strict';

    const Http = window.HttpHelper;
    const UI = window.UICore;

    if (!Http || !UI) {
        console.error('❌ StoreQA: Core ها لود نشده‌اند!');
        return;
    }

    // ═══════════════════════════════════════════════════════
    // State
    // ═══════════════════════════════════════════════════════
    const State = {
        stores: [],
        currentStoreId: 0,        // 0 = همه
        allItems: [],
        items: [],
        currentCondition: -1,
        currentYear: 0,
        currentMonth: 0,
        availableMonths: [],
        currentQuestionId: null,
        hasLoaded: false
    };

    // ═══════════════════════════════════════════════════════
    // DOM
    // ═══════════════════════════════════════════════════════
    const el = {
        qaList: document.getElementById('qaList'),
        storeSelector: document.getElementById('storeSelector'),
        monthFilter: document.getElementById('monthFilter'),
        replyModal: document.getElementById('replyModal'),
        questionPreview: document.getElementById('questionPreview'),
        replyText: document.getElementById('replyText')
    };

    // ═══════════════════════════════════════════════════════
    // Debug
    // ═══════════════════════════════════════════════════════
    function debug(...args) { console.log('🔍 [StoreQA]', ...args); }
    function debugError(...args) { console.error('❌ [StoreQA]', ...args); }

    // ═══════════════════════════════════════════════════════
    // Load Current Stores
    // ═══════════════════════════════════════════════════════
    async function loadCurrentStores() {
        try {
            const res = await Http.postSecure('/Auth/GetStoreById');

            if (!res.isSuccess) {
                debugError('GetStoreById:', res.errorTitle);
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
            State.currentStoreId = stores.length > 1 ? 0 : stores[0].StoreId;

            // ═══════════════════════════════════════════════════════
            // ★ همیشه renderStoreSelector رو صدا بزن
            // ═══════════════════════════════════════════════════════
            renderStoreSelector();

            return true;
        } catch (err) {
            debugError('loadCurrentStores:', err);
            return false;
        }
    }

    // ═══════════════════════════════════════════════════════
    // Render Store Selector — همه چیز در JS
    // ═══════════════════════════════════════════════════════
    function renderStoreSelector() {
        if (!el.storeSelector) {
            debugError('storeSelector در DOM نیست!');
            return;
        }

        const stores = State.stores;
        const hasMultiple = stores.length > 1;

        // ─── ساخت HTML ───
        let html = '<label><i class="fas fa-store"></i> فروشگاه:</label>';
        html += '<select id="storeSelect">';

        // ─── گزینه «همه» — فقط اگه > 1 فروشگاه ───
        if (hasMultiple) {
            const allSelected = State.currentStoreId === 0 ? 'selected' : '';
            html += `<option value="0" ${allSelected}>همه فروشگاه‌ها</option>`;
        }

        // ─── هر فروشگاه ───
        stores.forEach(store => {
            const selected = (stores.length === 1 || store.StoreId === State.currentStoreId)
                ? 'selected' : '';
            html += `<option value="${store.StoreId}" ${selected}>
                        ${UI.escapeHtml(store.StoreCaption)}
                     </option>`;
        });

        html += '</select>';

        // ─── تزریق در DOM ───
        el.storeSelector.innerHTML = html;
        el.storeSelector.style.display = 'flex';

        debug('renderStoreSelector — options:', hasMultiple ? stores.length + 1 : stores.length);

        // ═══════════════════════════════════════════════════════
        // ★ Bind رویداد تغییر
        // ═══════════════════════════════════════════════════════
        document.getElementById('storeSelect')?.addEventListener('change', function () {
            State.currentStoreId = parseInt(this.value);
            debug('currentStoreId:', State.currentStoreId);

            // ─── ریست ماه ───
            State.currentYear = 0;
            State.currentMonth = 0;

            // ─── بارگذاری مجدد ───
            loadAllData();
        });
    }

    // ═══════════════════════════════════════════════════════
    // Load All Data
    // ═══════════════════════════════════════════════════════
    async function loadAllData() {
        if (!el.qaList) return;

        el.qaList.innerHTML = `
            <div class="qa-loading">
                <i class="fas fa-spinner fa-spin"></i>
                در حال بارگذاری...
            </div>`;

        try {
            const payload = { storeId: State.currentStoreId };
            debug('loadAllData — payload:', payload);

            const [itemsRes, monthsRes] = await Promise.all([
                Http.postSecure('/StoreQA/GetAll', payload),
                Http.postSecure('/StoreQA/GetAvailableMonths', payload)
            ]);

            // ─── همه سوالات ───
            if (itemsRes.isSuccess) {
                State.allItems = JSON.parse(itemsRes.data);
                debug('GetAll:', State.allItems.length, 'سوال');
            } else {
                debugError('GetAll:', itemsRes.errorTitle);
                State.allItems = [];
            }

            // ─── ماه‌ها ───
            if (monthsRes.isSuccess) {
                State.availableMonths = JSON.parse(monthsRes.data);
                debug('GetAvailableMonths:', State.availableMonths);
            } else {
                State.availableMonths = [];
            }

            renderMonthFilter();
            State.hasLoaded = true;

            applyFilters();
        } catch (err) {
            debugError('loadAllData:', err);
            UI.showToast('خطا در ارتباط', 'error');
        }
    }

    // ═══════════════════════════════════════════════════════
    // Render Month Filter
    // ═══════════════════════════════════════════════════════
    function renderMonthFilter() {
        if (!el.monthFilter) return;

        if (!State.availableMonths || State.availableMonths.length === 0) {
            el.monthFilter.style.display = 'none';
            return;
        }

        let html = '<label><i class="fas fa-calendar-alt"></i> ماه:</label>';
        html += '<select id="monthSelect">';
        html += '<option value="0-0">همه ماه‌ها</option>';

        State.availableMonths.forEach(m => {
            const year = m.year ?? m.Year ?? 0;
            const month = m.month ?? m.Month ?? 0;
            const monthFa = m.monthNameFa ?? m.MonthNameFa ?? `ماه ${month}`;
            const yearFa = m.yearFa ?? m.YearFa ?? year;
            const count = m.count ?? m.Count ?? 0;

            const value = `${year}-${month}`;
            const selected = (State.currentYear === year && State.currentMonth === month)
                ? 'selected' : '';

            html += `<option value="${value}" ${selected}>
                        ${UI.escapeHtml(monthFa)} ${yearFa} (${count})
                     </option>`;
        });

        html += '</select>';

        el.monthFilter.innerHTML = html;
        el.monthFilter.style.display = 'flex';

        debug('renderMonthFilter — options:', State.availableMonths.length + 1);

        // ─── Bind ───
        document.getElementById('monthSelect')?.addEventListener('change', async function () {
            const [year, month] = this.value.split('-').map(Number);

            State.currentYear = year;
            State.currentMonth = month;

            debug('Month changed:', year, month);

            if (year === 0 && month === 0) {
                await loadAllData();
            } else {
                await loadByMonth(year, month);
            }
        });
    }

    // ═══════════════════════════════════════════════════════
    // Load By Month
    // ═══════════════════════════════════════════════════════
    async function loadByMonth(year, month) {
        if (!el.qaList) return;

        el.qaList.innerHTML = `
            <div class="qa-loading">
                <i class="fas fa-spinner fa-spin"></i>
                در حال بارگذاری...
            </div>`;

        try {
            const res = await Http.postSecure('/StoreQA/GetByMonth', {
                storeId: State.currentStoreId,
                year: year,
                month: month
            });

            if (!res.isSuccess) {
                UI.showToast(res.errorTitle || 'خطا', 'error');
                return;
            }

            State.allItems = JSON.parse(res.data);
            debug('GetByMonth:', State.allItems.length, 'سوال');

            applyFilters();
        } catch (err) {
            debugError('loadByMonth:', err);
            UI.showToast('خطا در ارتباط', 'error');
        }
    }

    // ═══════════════════════════════════════════════════════
    // Apply Filters
    // ═══════════════════════════════════════════════════════
    function applyFilters() {
        let filtered = [...State.allItems];

        if (State.currentCondition !== -1) {
            filtered = filtered.filter(item => {
                const cond = item.condetion ?? item.Condetion ?? 0;
                return cond === State.currentCondition;
            });
        }

        State.items = filtered;
        renderQuestions();
        updateCounts();
    }

    // ═══════════════════════════════════════════════════════
    // Render Questions
    // ═══════════════════════════════════════════════════════
    function renderQuestions() {
        if (!el.qaList) return;

        if (!State.items || State.items.length === 0) {
            el.qaList.innerHTML = `
                <div class="qa-empty">
                    <i class="fas fa-inbox"></i>
                    <h3>هیچ سوالی یافت نشد</h3>
                    <p>در این دسته سوالی وجود ندارد</p>
                </div>`;
            return;
        }

        el.qaList.innerHTML = State.items.map(item => renderQuestionCard(item)).join('');
        bindCardEvents();
    }

    function renderQuestionCard(item) {
        const contactUsId = item.contactUsId ?? item.ContactUsId;
        const caption = item.contactUsCaption ?? item.ContactUsCaption ?? 'بدون عنوان';
        const fullName = item.fullName ?? item.FullName ?? '—';
        const email = item.email ?? item.Email ?? '—';
        const phone = item.phoneNumber ?? item.PhoneNumber ?? '—';
        const messages = item.messages ?? item.Messages ?? '—';
        const createdDateFa = item.createdDateFa ?? item.CreatedDateFa ?? '—';
        const condetion = item.condetion ?? item.Condetion ?? 0;
        const answers = item.answer ?? item.Answer ?? [];
        const storeId = item.storeId ?? item.StoreId ?? 0;

        const store = State.stores.find(s => s.StoreId === storeId);
        const storeName = store ? store.StoreCaption : '';

        const conditionMap = {
            0: { cls: 'pending', text: 'در انتظار پاسخ', icon: 'fa-clock' },
            1: { cls: 'answered', text: 'پاسخ داده شده', icon: 'fa-check' },
            2: { cls: 'rejected', text: 'رد شده', icon: 'fa-times' },
            3: { cls: 'archive', text: 'بایگانی', icon: 'fa-archive' }
        };

        const cond = conditionMap[condetion] || conditionMap[0];
        const hasAnswer = answers && answers.length > 0;

        let answerHtml = '';
        if (hasAnswer) {
            const ans = answers[0];
            const ansCaption = ans.answerCustomerCaption ?? ans.AnswerCustomerCaption ?? '';
            const ansDateFa = ans.answerDateFa ?? ans.AnswerDateFa ?? '';

            answerHtml = `
                <div class="qa-answer">
                    <div class="qa-answer-header">
                        <i class="fas fa-reply"></i>
                        پاسخ شما
                        <span style="font-size:0.7rem;color:var(--text-secondary);margin-right:auto;">
                            ${ansDateFa}
                        </span>
                    </div>
                    <div class="qa-answer-text">${UI.escapeHtml(ansCaption)}</div>
                </div>`;
        }

        // ─── نمایش نام فروشگاه (اگه «همه» فعال) ───
        const showStore = State.currentStoreId === 0 && storeName;

        return `
            <div class="qa-card" data-id="${contactUsId}">
                <div class="qa-card-header">
                    <div class="qa-card-title">
                        <i class="fas fa-envelope"></i>
                        ${UI.escapeHtml(caption)}
                    </div>
                    <span class="qa-status qa-status-${cond.cls}">
                        <i class="fas ${cond.icon}"></i> ${cond.text}
                    </span>
                </div>

                ${showStore ? `
                    <div class="qa-store-badge">
                        <i class="fas fa-store"></i>
                        ${UI.escapeHtml(storeName)}
                    </div>
                ` : ''}

                <div class="qa-card-body">
                    <div class="qa-meta">
                        <span><i class="fas fa-user"></i> ${UI.escapeHtml(fullName)}</span>
                        <span><i class="fas fa-envelope"></i> ${UI.escapeHtml(email)}</span>
                        <span><i class="fas fa-phone"></i> ${UI.escapeHtml(phone)}</span>
                        <span><i class="fas fa-calendar"></i> ${createdDateFa}</span>
                    </div>

                    <div class="qa-message">${UI.escapeHtml(messages)}</div>

                    ${answerHtml}
                </div>

                <div class="qa-card-footer">
                    ${!hasAnswer ? `
                        <button class="qa-btn qa-btn-reply" data-id="${contactUsId}">
                            <i class="fas fa-reply"></i> پاسخ
                        </button>
                    ` : `
                        <button class="qa-btn qa-btn-edit" data-id="${contactUsId}">
                            <i class="fas fa-edit"></i> ویرایش پاسخ
                        </button>
                    `}
                    <button class="qa-btn qa-btn-reject" data-id="${contactUsId}">
                        <i class="fas fa-times"></i> رد
                    </button>
                    <button class="qa-btn qa-btn-archive" data-id="${contactUsId}">
                        <i class="fas fa-archive"></i> بایگانی
                    </button>
                </div>
            </div>`;
    }

    function bindCardEvents() {
        document.querySelectorAll('.qa-btn-reply, .qa-btn-edit').forEach(btn => {
            btn.addEventListener('click', function () {
                openReplyModal(parseInt(this.dataset.id));
            });
        });

        document.querySelectorAll('.qa-btn-reject').forEach(btn => {
            btn.addEventListener('click', async function () {
                const id = parseInt(this.dataset.id);
                if (!confirm('این سوال رد شود؟')) return;
                await updateStatus(id, 2);
            });
        });

        document.querySelectorAll('.qa-btn-archive').forEach(btn => {
            btn.addEventListener('click', async function () {
                const id = parseInt(this.dataset.id);
                if (!confirm('این سوال بایگانی شود؟')) return;
                await updateStatus(id, 3);
            });
        });
    }

    async function updateStatus(id, status) {
        try {
            const res = await Http.postSecure('/StoreQA/UpdateStatus', {
                id: id,
                newStatus: status
            });

            if (res.isSuccess) {
                UI.showToast('وضعیت تغییر کرد', 'success');

                const item = State.allItems.find(i => {
                    const iId = i.contactUsId ?? i.ContactUsId;
                    return iId === id;
                });

                if (item) {
                    if (item.condetion !== undefined) item.condetion = status;
                    else if (item.Condetion !== undefined) item.Condetion = status;
                }

                applyFilters();
            } else {
                UI.showToast(res.errorTitle || 'خطا', 'error');
            }
        } catch (err) {
            debugError('updateStatus:', err);
            UI.showToast('خطا در ارتباط', 'error');
        }
    }

    // ═══════════════════════════════════════════════════════
    // Reply Modal
    // ═══════════════════════════════════════════════════════
    function openReplyModal(questionId) {
        const item = State.allItems.find(i => {
            const iId = i.contactUsId ?? i.ContactUsId;
            return iId === questionId;
        });

        if (!item) return;

        State.currentQuestionId = questionId;

        const fullName = item.fullName ?? item.FullName ?? '—';
        const messages = item.messages ?? item.Messages ?? '—';
        const storeId = item.storeId ?? item.StoreId ?? 0;
        const store = State.stores.find(s => s.StoreId === storeId);
        const storeName = store ? store.StoreCaption : '';

        if (el.questionPreview) {
            el.questionPreview.innerHTML = `
                <div class="preview-item">
                    ${storeName ? `<div style="font-size:0.75rem;color:var(--primary);margin-bottom:4px;">
                        <i class="fas fa-store"></i> ${UI.escapeHtml(storeName)}
                    </div>` : ''}
                    <strong>${UI.escapeHtml(fullName)}:</strong>
                    ${UI.escapeHtml(messages)}
                </div>`;
        }

        if (el.replyText) {
            const answers = item.answer ?? item.Answer ?? [];
            if (answers && answers.length > 0) {
                el.replyText.value = answers[0].answerCustomerCaption
                    ?? answers[0].AnswerCustomerCaption
                    ?? '';
            } else {
                el.replyText.value = '';
            }
        }

        el.replyModal?.classList.add('active');
    }

    function closeReplyModal() {
        el.replyModal?.classList.remove('active');
        State.currentQuestionId = null;
        if (el.replyText) el.replyText.value = '';
    }

    async function submitReply() {
        const answer = el.replyText?.value.trim();

        if (!answer) {
            UI.showToast('متن پاسخ را وارد کنید', 'warning');
            return;
        }

        if (!State.currentQuestionId) return;

        try {
            const res = await Http.postSecure('/StoreQA/Reply', {
                id: State.currentQuestionId,
                answer: answer
            });

            if (res.isSuccess) {
                UI.showToast(res.data || 'پاسخ ثبت شد ✅', 'success');

                const item = State.allItems.find(i => {
                    const iId = i.contactUsId ?? i.ContactUsId;
                    return iId === State.currentQuestionId;
                });

                if (item) {
                    if (item.condetion !== undefined) item.condetion = 1;
                    else if (item.Condetion !== undefined) item.Condetion = 1;

                    const newAnswer = {
                        answerCustomerCaption: answer,
                        answerDateFa: '',
                        AnswerCustomerCaption: answer,
                        AnswerDateFa: ''
                    };

                    if (item.answer !== undefined) item.answer = [newAnswer];
                    else if (item.Answer !== undefined) item.Answer = [newAnswer];
                }

                closeReplyModal();
                applyFilters();
            } else {
                UI.showToast(res.errorTitle || 'خطا', 'error');
            }
        } catch (err) {
            debugError('submitReply:', err);
            UI.showToast('خطا در ارتباط', 'error');
        }
    }

    // ═══════════════════════════════════════════════════════
    // Counts
    // ═══════════════════════════════════════════════════════
    function updateCounts() {
        const counts = { all: 0, 0: 0, 1: 0, 2: 0, 3: 0 };

        State.allItems.forEach(item => {
            counts.all++;
            const cond = item.condetion ?? item.Condetion ?? 0;
            if (counts[cond] !== undefined) counts[cond]++;
        });

        const set = (id, value) => {
            const elem = document.getElementById(id);
            if (elem) elem.textContent = value;
        };

        set('countAll', counts.all);
        set('countPending', counts[0]);
        set('countAnswered', counts[1]);
        set('countRejected', counts[2]);
        set('countArchive', counts[3]);
    }

    // ═══════════════════════════════════════════════════════
    // Filter Buttons
    // ═══════════════════════════════════════════════════════
    function bindFilters() {
        document.querySelectorAll('.qa-filter-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                document.querySelectorAll('.qa-filter-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');

                State.currentCondition = parseInt(this.dataset.condition);
                applyFilters();
            });
        });
    }

    // ═══════════════════════════════════════════════════════
    // Init
    // ═══════════════════════════════════════════════════════
    async function init() {
        debug('شروع Init...');
        bindFilters();

        const loaded = await loadCurrentStores();

        if (loaded) {
            await loadAllData();
        } else {
            if (el.qaList) {
                el.qaList.innerHTML = `
                    <div class="qa-empty">
                        <i class="fas fa-store-slash"></i>
                        <h3>شما فروشگاهی ندارید</h3>
                        <p>برای مدیریت پرسش و پاسخ، ابتدا یک فروشگاه بسازید</p>
                    </div>`;
            }
        }

        debug('Init کامل شد.');
    }

    // Export
    window.submitReply = submitReply;
    window.closeReplyModal = closeReplyModal;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();