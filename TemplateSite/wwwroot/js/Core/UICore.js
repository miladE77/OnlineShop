/* ============================================================
   UICore.js — ابزار نمایش وضعیت
   ------------------------------------------------------------
   - showToast(message, type)     → نمایش Toast
   - escapeHtml(text)             → ایمن‌سازی HTML
   - formatPrice(price)           → فرمت قیمت فارسی
   - formatDate(date)             → فرمت تاریخ
   - debounce(fn, delay)          → تاخیر در اجرا
   - confirmAction(message)       → تایید
   - showLoading() / hideLoading() → لودینگ
   ============================================================ */

(function (window) {
    'use strict';

    // ═══════════════════════════════════════════════════════
    // Toast
    // ═══════════════════════════════════════════════════════
    function showToast(message, type = 'success') {
        // ─── اگه یه showToast سراسری از قبل هست، از اون استفاده کن ───
        if (typeof window.__originalShowToast === 'function'
            && window.__originalShowToast !== showToast) {
            return window.__originalShowToast(message, type);
        }

        let toast = document.getElementById('toast');

        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast';
            toast.className = 'toast';
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.className = `toast ${type} show`;

        clearTimeout(toast._timeout);
        toast._timeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 4000);
    }

    // ═══════════════════════════════════════════════════════
    // Escape HTML
    // ═══════════════════════════════════════════════════════
    function escapeHtml(text) {
        if (text === null || text === undefined) return '';
        const div = document.createElement('div');
        div.textContent = String(text);
        return div.innerHTML;
    }

    // ═══════════════════════════════════════════════════════
    // Format Price
    // ═══════════════════════════════════════════════════════
    function formatPrice(price) {
        if (price === null || price === undefined) return '۰';
        return Number(price).toLocaleString('fa-IR');
    }

    // ═══════════════════════════════════════════════════════
    // Format Date
    // ═══════════════════════════════════════════════════════
    function formatDate(date) {
        if (!date) return '';
        try {
            const dt = new Date(date);
            if (isNaN(dt)) return String(date);
            const y = dt.getFullYear();
            const m = String(dt.getMonth() + 1).padStart(2, '0');
            const d = String(dt.getDate()).padStart(2, '0');
            return `${y}/${m}/${d}`;
        } catch {
            return String(date);
        }
    }

    // ═══════════════════════════════════════════════════════
    // Debounce
    // ═══════════════════════════════════════════════════════
    function debounce(fn, delay = 300) {
        let timer = null;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    // ═══════════════════════════════════════════════════════
    // Confirm
    // ═══════════════════════════════════════════════════════
    function confirmAction(message) {
        return window.confirm(message);
    }

    // ═══════════════════════════════════════════════════════
    // Loading
    // ═══════════════════════════════════════════════════════
    function showLoading() {
        const el = document.getElementById('loadingOverlay');
        if (el) el.classList.add('active');
    }

    function hideLoading() {
        const el = document.getElementById('loadingOverlay');
        if (el) el.classList.remove('active');
    }

    // ═══════════════════════════════════════════════════════
    // Export
    // ═══════════════════════════════════════════════════════
    window.UICore = {
        showToast,
        escapeHtml,
        formatPrice,
        formatDate,
        debounce,
        confirmAction,
        showLoading,
        hideLoading
    };

})(window);