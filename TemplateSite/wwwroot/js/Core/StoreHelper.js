(function (window) {
    'use strict';

    const H = window.HttpHelper;

    // ─── کلید localStorage ───
    const STORAGE_KEY = 'NegarShop_store';

    // ─── مقادیر پیش‌فرض ───
    const DEFAULTS = {
        storeId: 0,
        storeCode: '',
        storeCaption: 'فروشگاه',
        contacts: []
    };

    let _storeData = null;

    // ═══════════════════════════════════════════════════════
    // localStorage
    // ═══════════════════════════════════════════════════════
    function readFromStorage() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            const data = JSON.parse(raw);
            if (!data || typeof data !== 'object' || !data.storeId) return null;
            return data;
        } catch (e) {
            console.warn('[StoreHelper] localStorage خراب بود، پاک شد');
            localStorage.removeItem(STORAGE_KEY);
            return null;
        }
    }

    function writeToStorage(data) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.warn('[StoreHelper] ذخیره در localStorage ناموفق:', e);
        }
    }

    function clearStoredStore() {
        try {
            localStorage.removeItem(STORAGE_KEY);
            console.info('[StoreHelper] localStorage فروشگاه پاک شد');
        } catch (e) { /* ignore */ }
        _storeData = null;
        applyStoreInfo({ ...DEFAULTS });
    }

    // ═══════════════════════════════════════════════════════
    // خواندن ?code= از URL
    // ═══════════════════════════════════════════════════════
    function getCodeFromUrl() {
        try {
            const params = new URLSearchParams(window.location.search);
            const code = params.get('code');
            return code ? code.trim() : null;
        } catch {
            return null;
        }
    }

    // ═══════════════════════════════════════════════════════
    // درخواست به سرور (GET — عمومی)
    // ═══════════════════════════════════════════════════════
    async function fetchFromServer(code) {
        try {
            const res = await H.get('/Auth/StoreInformation', { code });

            if (!res) return null;

            if (res.isSuccess === false || res.errorTitle) {
                console.warn('[StoreHelper] سرور خطا داد:', res.errorTitle);
                return null;
            }

            let data = res.data;
            if (typeof data === 'string') {
                try { data = JSON.parse(data); } catch {
                    console.warn('[StoreHelper] JSON داخل Data نامعتبر بود');
                    return null;
                }
            }

            if (!data || !data.storeId || Number(data.storeId) <= 0) return null;

            return normalize(data);
        } catch (err) {
            console.warn('[StoreHelper] دریافت از سرور ناموفق:', err);
            return null;
        }
    }

    // ─── نرمال‌سازی ساختار ───
    function normalize(data) {
        return {
            storeId: Number(data.storeId) || 0,
            storeCode: data.storeCode || '',
            storeCaption: data.storeCaption || DEFAULTS.storeCaption,
            contacts: Array.isArray(data.contacts) ? data.contacts : []
        };
    }

    // ═══════════════════════════════════════════════════════
    // loadByCode — بارگذاری اجباری با کد
    // ═══════════════════════════════════════════════════════
    async function loadByCode(code) {
        if (!code) return null;

        const data = await fetchFromServer(code);

        if (data) {
            writeToStorage(data);
            _storeData = data;
            applyStoreInfo(data);
        }
        return data;
    }

    // ═══════════════════════════════════════════════════════
    // loadStoreInfo — اولویت: URL → localStorage → DEFAULTS
    // ═══════════════════════════════════════════════════════
    async function loadStoreInfo() {
        const urlCode = getCodeFromUrl();
        if (urlCode) {
            const fromServer = await loadByCode(urlCode);
            if (fromServer) return fromServer;
            console.info('[StoreHelper] کد URL نامعتبر بود → تلاش با localStorage');
        }

        const stored = readFromStorage();
        if (stored) {
            _storeData = stored;
            applyStoreInfo(stored);
            return stored;
        }

        _storeData = { ...DEFAULTS };
        applyStoreInfo(_storeData);
        return _storeData;
    }

    // ═══════════════════════════════════════════════════════
    // اعمال روی DOM
    // ═══════════════════════════════════════════════════════
    function applyStoreInfo(data) {
        const caption = data.storeCaption || DEFAULTS.storeCaption;

        // ۱. عنوان هدر
        const captionEl = document.getElementById('storeCaption');
        if (captionEl) captionEl.textContent = caption;

        // ۲. همه‌ی .store-caption-text در فوتر
        document.querySelectorAll('.store-caption-text').forEach(el => {
            el.textContent = caption;
        });

        // ۳. آیکون‌های شبکه‌های اجتماعی
        const socialList = document.getElementById('socialList');
        if (socialList) {
            socialList.innerHTML = '';
            const contacts = Array.isArray(data.contacts) ? data.contacts : [];

            if (contacts.length === 0) {
                socialList.style.display = 'none';
            } else {
                socialList.style.display = '';
                contacts.forEach(c => {
                    if (!c.contactCaption || !c.typeContactArm) return;
                    const a = document.createElement('a');
                    a.href = c.contactCaption;
                    a.target = '_blank';
                    a.rel = 'noopener noreferrer';
                    a.title = c.typeContactCaption || '';

                    const img = document.createElement('img');
                    img.src = `/Images/Arm/${c.typeContactArm}`;
                    img.style.width = '40px';
                    img.alt = c.typeContactArm;
                    img.onerror = () => { img.style.display = 'none'; };

                    a.appendChild(img);
                    socialList.appendChild(a);
                });
            }
        }

        // ۴. متغیرهای سراسری
        window.currentStoreId = data.storeId || 0;
        window.currentStoreCode = data.storeCode || '';

        // ۵. مخفی کردن بخش‌های خالی (تماس / خبرنامه)
        hideOptionalSections(data);

        // ۶. رویداد سراسری
        window.dispatchEvent(new CustomEvent('store:loaded', { detail: data }));
    }

    // ═══════════════════════════════════════════════════════
    // hideOptionalSections
    // ═══════════════════════════════════════════════════════
    function hideOptionalSections(data) {
        const hasContacts = Array.isArray(data.contacts) && data.contacts.length > 0;
        const isDefault = !data.storeId || Number(data.storeId) <= 0;

        const socialList = document.getElementById('socialList');
        const socialBox = socialList ? socialList.closest('.footer-box') : null;
        if (socialBox) {
            socialBox.style.display = hasContacts ? '' : 'none';
        }

        const emailInput = document.getElementById('emailNews');
        const emailBox = emailInput ? emailInput.closest('.email-box') : null;
        const emailLabel = emailBox
            ? (emailBox.previousElementSibling &&
                emailBox.previousElementSibling.tagName === 'P'
                ? emailBox.previousElementSibling
                : null)
            : null;

        if (isDefault) {
            if (emailBox) emailBox.style.display = 'none';
            if (emailLabel) emailLabel.style.display = 'none';
        } else {
            if (emailBox) emailBox.style.display = '';
            if (emailLabel) emailLabel.style.display = '';
        }
    }

    // ═══════════════════════════════════════════════════════
    // SendEmail — ارسال ایمیل خبرنامه (با HttpHelper)
    // ═══════════════════════════════════════════════════════
    async function SendEmail() {
        const emailInput = document.getElementById('emailNews');
        if (!emailInput) return;

        const email = emailInput.value.trim();

        // ─── اعتبارسنجی ساده ───
        if (!email) {
            if (window.UICore) UICore.showToast('لطفاً ایمیل خود را وارد کنید', 'warning');
            else alert('لطفاً ایمیل خود را وارد کنید');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            if (window.UICore) UICore.showToast('ایمیل وارد شده معتبر نیست', 'warning');
            else alert('ایمیل وارد شده معتبر نیست');
            return;
        }

        const storeId = window.currentStoreId || 0;

        // ─── ارسال به سرور ───
        try {
            // NewEmail یک اکشن عمومی است (بدون احراز هویت)
            const response = await H.post('/EmailNewss/NewEmail', {
                email: email,
                StoreId: storeId
            });

            if (response && response.isSuccess) {
                if (window.UICore) UICore.showToast(response.data || 'ایمیل شما ثبت شد', 'success');
                else alert(response.data);
                emailInput.value = '';
            } else {
                const msg = (response && response.errorTitle) || 'خطا در ثبت ایمیل';
                if (window.UICore) UICore.showToast(msg, 'error');
                else alert(msg);
            }
        } catch (err) {
            if (err.message === 'AUTH_REQUIRED') return;
            if (err.message === 'CSRF_OR_BAD_REQUEST') {
                if (window.UICore) UICore.showToast('نشست شما منقضی شده. صفحه را رفرش کنید.', 'error');
                else alert('نشست شما منقضی شده. صفحه را رفرش کنید.');
                return;
            }
            if (window.UICore) UICore.showToast('خطا در ارتباط با سرور', 'error');
            else alert('خطا در ارتباط با سرور');
        }
    }

    // ═══════════════════════════════════════════════════════
    // دسترسی به داده‌ی فعلی
    // ═══════════════════════════════════════════════════════
    function getStoreInfo() {
        return _storeData || { ...DEFAULTS };
    }

    // ═══════════════════════════════════════════════════════
    // بارگذاری مجدد
    // ═══════════════════════════════════════════════════════
    async function reload() {
        _storeData = null;
        return await loadStoreInfo();
    }

    // ═══════════════════════════════════════════════════════
    // Export
    // ═══════════════════════════════════════════════════════
    window.StoreHelper = {
        loadStoreInfo,
        loadByCode,
        reload,
        applyStoreInfo,
        getStoreInfo,
        hideOptionalSections,
        clearStoredStore,
        SendEmail,
        getCodeFromUrl,
        STORAGE_KEY,
        DEFAULTS
    };
    window.SendEmail = SendEmail;

})(window);