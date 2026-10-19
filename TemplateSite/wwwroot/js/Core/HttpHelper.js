/* ============================================================
   HttpHelper.js — ارسال داده (فقط ارتباط با سرور)
   ------------------------------------------------------------
   - post(url, data)              → POST ساده (بدون CSRF)
   - postJson(url, data)          → POST با JSON
   - postSecure(url, data)        → POST + CSRF (form-data)
   - postJsonSecure(url, data)    → POST + CSRF (JSON)
   - get(url)                     → GET ساده
   - getJson(url)                 → GET با JSON
   ============================================================ */

(function (window) {
    'use strict';

    // ═══════════════════════════════════════════════════════
    // CSRF Token (از input مخفی)
    // ═══════════════════════════════════════════════════════
    function getCsrfToken() {
        const el = document.querySelector('input[name="__RequestVerificationToken"]');
        return el ? el.value : '';
    }

    // ═══════════════════════════════════════════════════════
    // مدیریت خطای احراز هویت
    // ═══════════════════════════════════════════════════════
    function handleAuthError(xhr, reject, url) {
        if (xhr.status === 401) {
            try {
                const res = JSON.parse(xhr.responseText);
                if (res.needRegister && typeof window.openQuickRegister === 'function') {
                    window.openQuickRegister();
                }
            } catch (e) { /* ignore */ }
            reject(new Error('AUTH_REQUIRED'));
        } else {
            console.error(`[HttpHelper] خطا در ${url}:`, xhr.status, xhr.responseText);
            reject(new Error('NETWORK_ERROR'));
        }
    }

    // ═══════════════════════════════════════════════════════
    // POST ساده
    // ═══════════════════════════════════════════════════════
    function post(url, data = {}) {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: url,
                type: 'POST',
                data: data,
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            })
                .done(resolve)
                .fail((xhr) => handleAuthError(xhr, reject, url));
        });
    }

    // ═══════════════════════════════════════════════════════
    // POST امن (با CSRF در بدنه)
    // ═══════════════════════════════════════════════════════
    function postSecure(url, data = {}) {
        return new Promise((resolve, reject) => {
            data.__RequestVerificationToken = getCsrfToken();

            $.ajax({
                url: url,
                type: 'POST',
                data: data,
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            })
                .done(resolve)
                .fail((xhr) => handleAuthError(xhr, reject, url));
        });
    }

    // ═══════════════════════════════════════════════════════
    // POST با JSON
    // ═══════════════════════════════════════════════════════
    function postJson(url, data = {}, withCsrf = false) {
        return new Promise((resolve, reject) => {
            const headers = {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            };
            if (withCsrf) headers['RequestVerificationToken'] = getCsrfToken();

            $.ajax({
                url: url,
                type: 'POST',
                contentType: 'application/json; charset=utf-8',
                dataType: 'json',
                data: JSON.stringify(data),
                headers: headers
            })
                .done(resolve)
                .fail((xhr) => handleAuthError(xhr, reject, url));
        });
    }

    // ═══════════════════════════════════════════════════════
    // POST با JSON + CSRF
    // ═══════════════════════════════════════════════════════
    function postJsonSecure(url, data = {}) {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: url,
                type: 'POST',
                contentType: 'application/json; charset=utf-8',
                dataType: 'json',
                data: JSON.stringify(data),
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'RequestVerificationToken': getCsrfToken()
                }
            })
                .done(resolve)
                .fail((xhr) => handleAuthError(xhr, reject, url));
        });
    }

    // ═══════════════════════════════════════════════════════
    // GET
    // ═══════════════════════════════════════════════════════
    function get(url, data = {}) {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: url,
                type: 'GET',
                data: data,
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            })
                .done(resolve)
                .fail((xhr) => reject(new Error('NETWORK_ERROR')));
        });
    }

    // ═══════════════════════════════════════════════════════
    // Export
    // ═══════════════════════════════════════════════════════
    window.HttpHelper = {
        getCsrfToken,
        post,
        postSecure,
        postJson,
        postJsonSecure,
        get
    };

})(window);