
(function (window) {
    'use strict';

    const H = window.HttpHelper;

    // ─── Cache ───
    let _cachedUser = null;
    let _cacheTime = 0;
    const CACHE_DURATION = 30000;

    function isCacheValid() {
        return _cachedUser && (Date.now() - _cacheTime) < CACHE_DURATION;
    }

    function clearCache() {
        _cachedUser = null;
        _cacheTime = 0;
    }

    // ─── getStatus ───
    async function getStatus(forceRefresh = false) {
        if (!forceRefresh && isCacheValid()) return _cachedUser;

        try {
            const res = await H.post('/Auth/Status');
            if (!res.isSuccess) return null;

            const data = JSON.parse(res.data);
            _cachedUser = data;
            _cacheTime = Date.now();
            return data;
        } catch (err) {
            if (err.message === 'AUTH_REQUIRED') {
                clearCache();
                return null;
            }
            console.error('[AuthHelper] خطا در getStatus:', err);
            return null;
        }
    }

    // ─── checkAccess ───
    async function checkAccess(pageName, accessType = 'V') {
        if (!pageName) return false;
        try {
            const res = await H.post('/Auth/CheckAccess', { pageName, accessType });
            if (!res.isSuccess) return false;
            return JSON.parse(res.data).hasAccess === true;
        } catch (err) {
            return false;
        }
    }

    // ─── checkAccessBatch ───
    async function checkAccessBatch(items) {
        if (!items || items.length === 0) return {};
        try {
            const res = await H.postJsonSecure('/Auth/CheckAccessBatch', items);
            if (!res.isSuccess) return {};
            const data = JSON.parse(res.data);
            const map = {};
            data.forEach(item => {
                map[`${item.pageName}:${item.accessType}`] = item.hasAccess;
            });
            return map;
        } catch (err) {
            return {};
        }
    }

    // ─── requireLogin ───
    function requireLogin(returnUrl = null) {
        const isSignedIn = document.body.dataset.signedIn === 'true';
        if (isSignedIn) return true;

        if (returnUrl) sessionStorage.setItem('returnUrl', returnUrl);

        if (typeof window.openQuick





            === 'function') {
            window.openQuickRegister();
        } else {
            const url = returnUrl || window.location.pathname + window.location.search;
            window.location.href = `/Account/Login?returnUrl=${encodeURIComponent(url)}`;
        }
        return false;
    }

    // ─── کمکی ───
    async function getUser() { return await getStatus(); }
    async function getPersonelId() { return (await getStatus())?.personelId ?? 0; }
    async function isAdmin() { return (await getStatus())?.isAdmin === true; }
    async function hasStore() { return (await getStatus())?.hasStore === true; }
    async function isAuthenticated() { return (await getStatus())?.isAuthenticated === true; }
    async function getRedirectTarget() {
        const user = await getStatus();
        if (!user || !user.isAuthenticated) return '/Account/Login';
        return user.redirectTo || '/';
    }

    // ═══════════════════════════════════════════════════════
    // applyUserUI — فقط منطق Auth (بدون DOM Dropdown)
    // ═══════════════════════════════════════════════════════
    async function applyUserUI() {
        const user = await getStatus();
        if (!user) return;

        // ─── Navbar (فیلتر دسترسی) ───
        await applyNavbarAccess(user);

        // ─── رویداد سراسری — MainJS می‌تونه گوش بده ───
        window.dispatchEvent(new CustomEvent('auth:user-loaded', {
            detail: user
        }));
    }

    // ═══════════════════════════════════════════════════════
    // applyNavbarAccess — فیلتر Navbar
    // ═══════════════════════════════════════════════════════
    async function applyNavbarAccess(user) {
        
        const navItems = document.querySelectorAll('.nav-item[data-page][data-charAuth]');
        if (navItems.length === 0) return;

        // Admin → همه
        if (user.isAdmin) {
            navItems.forEach(item => item.style.display = '');
            return;
        }

        // مهمان → هیچ
        if (!user.isAuthenticated) {
            navItems.forEach(item => item.style.display = 'none');
            document.querySelectorAll('.nav-group').forEach(g => g.style.display = 'none');
            return;
        }

        // Batch
        const items = Array.from(navItems).map(el => ({
            pageName: el.dataset.page,
            accessType: el.dataset.charAuth || 'V'
        }));

        const accessMap = await checkAccessBatch(items);

        navItems.forEach(item => {
            const key = `${item.dataset.page}:${item.dataset.charAuth || 'V'}`;
            item.style.display = (accessMap[key] === true) ? '' : 'none';
        });

        // گروه‌های خالی
        document.querySelectorAll('.nav-group').forEach(group => {
            const visible = group.querySelectorAll('.nav-item:not([style*="display: none"])');
            group.style.display = visible.length > 0 ? '' : 'none';
        });
    }

    async function getMyStores() {
        try {
            const res = await H.postSecure('/Auth/GetStoreById');
            if (!res.isSuccess) return [];
            return JSON.parse(res.data);
        } catch (err) {
            return [];
        }
    }

    async function getMyStoreIds() {
        try {
            const res = await H.postSecure('/Auth/GetMyStoreIds');
            if (!res.isSuccess) return [];
            return JSON.parse(res.data);
        } catch (err) {
            return [];
        }
    }

    // ═══════════════════════════════════════════════════════
    // Export — فقط Auth
    // ═══════════════════════════════════════════════════════
    window.AuthHelper = {
        getStatus,
        clearCache,
        checkAccess,
        checkAccessBatch,
        requireLogin,
        getUser,
        getPersonelId,
        isAdmin,
        hasStore,
        isAuthenticated,
        getRedirectTarget,
        applyUserUI,
        applyNavbarAccess,
        getMyStores,
        getMyStoreIds
    };

})(window);