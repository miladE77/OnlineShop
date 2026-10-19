/* ============================================================
   اعمال خودکار تقویم شمسی روی همه‌ی input[type="date"]
   و input[type="datetime-local"]
   ------------------------------------------------------------
   - کتابخانه‌ها به‌صورت لوکال از /lib/persian-datepicker لود می‌شن
   - هیچ درخواست اینترنتی (CDN) وجود نداره
   - مقدار میلادی در input اصلی ذخیره می‌شه (سازگار با Backend)
   ============================================================ */

(function () {
    'use strict';

    // ====================================================
    // تبدیل تاریخ میلادی به شمسی (فرمت YYYY/MM/DD)
    // ====================================================
    function toJalaliString(gregorianValue) {
        if (!gregorianValue) return '';
        try {
            const pd = new persianDate(new Date(gregorianValue));
            return pd.format('YYYY/MM/DD');
        } catch (e) {
            return '';
        }
    }

    // ====================================================
    // تبدیل تاریخ شمسی به میلادی (فرمت ISO برای input date)
    // ====================================================
    function toGregorianString(jalaliValue) {
        if (!jalaliValue) return '';
        try {
            const parts = jalaliValue.split('/').map(Number);
            if (parts.length !== 3) return '';
            const g = new persianDate([parts[0], parts[1], parts[2]]).toDate();
            const y = g.getFullYear();
            const m = String(g.getMonth() + 1).padStart(2, '0');
            const d = String(g.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        } catch (e) {
            return '';
        }
    }

    // ====================================================
    // تبدیل datetime-local → شمسی (YYYY/MM/DD HH:mm)
    // ====================================================
    function toJalaliDateTimeString(gregorianValue) {
        if (!gregorianValue) return '';
        try {
            const pd = new persianDate(new Date(gregorianValue));
            return pd.format('YYYY/MM/DD HH:mm');
        } catch (e) {
            return '';
        }
    }

    // ====================================================
    // تبدیل شمسی (با ساعت) به datetime-local میلادی
    // ====================================================
    function toGregorianDateTimeString(jalaliValue) {
        if (!jalaliValue) return '';
        try {
            const [datePart, timePart = '00:00'] = jalaliValue.split(' ');
            const parts = datePart.split('/').map(Number);
            if (parts.length !== 3) return '';
            const [hh, mm] = timePart.split(':').map(Number);
            const g = new persianDate([parts[0], parts[1], parts[2]]).toDate();
            g.setHours(hh || 0, mm || 0, 0, 0);

            const y = g.getFullYear();
            const mo = String(g.getMonth() + 1).padStart(2, '0');
            const d = String(g.getDate()).padStart(2, '0');
            const h = String(g.getHours()).padStart(2, '0');
            const mi = String(g.getMinutes()).padStart(2, '0');
            return `${y}-${mo}-${d}T${h}:${mi}`;
        } catch (e) {
            return '';
        }
    }

    // ====================================================
    // ساخت input متنی کنار input اصلی و راه‌اندازی datepicker
    // ====================================================
    function applyPersianDate(input) {
        if (!input || !input.matches) return;
        if (!input.matches('input[type="date"], input[type="datetime-local"]')) return;
        if (input.dataset.persianApplied === '1') return;

        input.dataset.persianApplied = '1';

        const isDateTime = input.type === 'datetime-local';

        // input اصلی رو مخفی می‌کنیم (چون مقدار میلادی رو نگه می‌داره)
        input.style.display = 'none';

        // ایجاد input نمایشی
        const display = document.createElement('input');
        display.type = 'text';
        display.readOnly = true;
        display.className = input.className + ' persian-date-display';
        display.placeholder = isDateTime ? 'انتخاب تاریخ و ساعت' : 'انتخاب تاریخ';
        display.setAttribute('dir', 'ltr');
        display.style.cursor = 'pointer';

        // درج بعد از input اصلی
        input.parentNode.insertBefore(display, input.nextSibling);

        // اگر input اصلی مقدار داشت، به شمسی تبدیل کن
        if (input.value) {
            display.value = isDateTime
                ? toJalaliDateTimeString(input.value)
                : toJalaliString(input.value);
        }

        // راه‌اندازی datepicker روی input نمایشی
        $(display).persianDatepicker({
            format: isDateTime ? 'YYYY/MM/DD HH:mm' : 'YYYY/MM/DD',
            initialValue: false,
            autoClose: true,
            persianDigit: false,
            observer: true,
            timePicker: {
                enabled: isDateTime,
                meridiem: { enabled: false },
                second: { enabled: false }
            },
            onSelect: function (unix) {
                const g = new Date(unix);
                if (isDateTime) {
                    const y = g.getFullYear();
                    const mo = String(g.getMonth() + 1).padStart(2, '0');
                    const d = String(g.getDate()).padStart(2, '0');
                    const h = String(g.getHours()).padStart(2, '0');
                    const mi = String(g.getMinutes()).padStart(2, '0');
                    input.value = `${y}-${mo}-${d}T${h}:${mi}`;
                } else {
                    const y = g.getFullYear();
                    const mo = String(g.getMonth() + 1).padStart(2, '0');
                    const d = String(g.getDate()).padStart(2, '0');
                    input.value = `${y}-${mo}-${d}`;
                }
                input.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });

        // اگر input اصلی به‌صورت برنامه‌ای تغییر کرد، display رو آپدیت کن
        input.addEventListener('change', function () {
            if (input.value) {
                display.value = isDateTime
                    ? toJalaliDateTimeString(input.value)
                    : toJalaliString(input.value);
            } else {
                display.value = '';
            }
        });

        // دابل‌کلیک روی display → پاک کردن
        display.addEventListener('dblclick', function () {
            input.value = '';
            display.value = '';
            input.dispatchEvent(new Event('change', { bubbles: true }));
        });
    }

    // ====================================================
    // اعمال روی همه‌ی input های موجود
    // ====================================================
    function applyAll(root) {
        const scope = root || document;
        scope.querySelectorAll('input[type="date"], input[type="datetime-local"]')
            .forEach(applyPersianDate);
    }

    // ====================================================
    // اجرا در DOMContentLoaded
    // ====================================================
    document.addEventListener('DOMContentLoaded', function () {
        applyAll(document);

        // MutationObserver برای input های جدید (مودال ها، AJAX)
        const observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (m) {
                m.addedNodes.forEach(function (node) {
                    if (node.nodeType !== 1) return;
                    if (node.matches && node.matches('input[type="date"], input[type="datetime-local"]')) {
                        applyPersianDate(node);
                    }
                    if (node.querySelectorAll) {
                        node.querySelectorAll('input[type="date"], input[type="datetime-local"]')
                            .forEach(applyPersianDate);
                    }
                });
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    });

    // ====================================================
    // API عمومی
    // ====================================================
    window.PersianDateHelper = {
        apply: applyPersianDate,
        applyAll: applyAll,
        toJalali: toJalaliString,
        toGregorian: toGregorianString,
        toJalaliDateTime: toJalaliDateTimeString,
        toGregorianDateTime: toGregorianDateTimeString
    };

})();