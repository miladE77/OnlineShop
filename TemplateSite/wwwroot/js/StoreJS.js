
(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════
    // وابستگی‌ها
    // ═══════════════════════════════════════════════════════
    const Cart = window.CartStore;
    const CartUI = window.CartUI;
    const Auth = window.AuthHelper;
    const UI = window.UICore;

    // ═══════════════════════════════════════════════════════
    // Dropdown پروفایل — سراسری برای onclick در HTML
    // ⚠️ بدون el — با getElementById مستقیم
    // ═══════════════════════════════════════════════════════
    function toggleDropdownMenuStatus(event) {
        if (event) event.preventDefault();

        const menu = document.getElementById('dropdownMenu');

        menu.classList.toggle('show');
    }

    // ─── بستن Dropdown با کلیک بیرون ───
    function bindDropdownOutsideClick() {
        document.addEventListener('click', (e) => {
            const menu = document.getElementById('dropdownMenu');
            if (!menu) return;

            if (!e.target.closest('.profile-dropdown')
                && !e.target.closest('.dropdown')) {
                menu.classList.remove('show');
            }
        });
    }

    // ═══════════════════════════════════════════════════════
    // تم — دارک/لایت
    // ═══════════════════════════════════════════════════════
    function initTheme() {
        if (localStorage.getItem('shopTheme') === 'dark') {
            document.body.classList.add('dark');
        }

        document.getElementById('themeToggleBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            const isDark = document.body.classList.toggle('dark');
            localStorage.setItem('shopTheme', isDark ? 'dark' : 'light');
        });
    }

    // ═══════════════════════════════════════════════════════
    // User Status UI — واکنش به رویداد AuthHelper
    // ═══════════════════════════════════════════════════════
    function applyUserStatusUI(user) {
        if (!user) return;

        const notUserEls = document.querySelectorAll('.NotUser');
        const userExEls = document.querySelectorAll('.UserEx');
        const nameEl = document.getElementById('NameUser');
        const storeQALink = document.getElementById('storeQALink');

        if (user.isAuthenticated) {
            notUserEls.forEach(item => item.style.display = 'none');
            userExEls.forEach(item => {
                item.style.display = item.classList.contains('SubItems')
                    ? 'block'
                    : 'flex';
            });

            if (nameEl && user.fullName) nameEl.textContent = user.fullName;

            const canAccessStorePanels = user.isAdmin
                || user.role === 'StoreOwner'
                || user.hasStore === true;

            document.querySelectorAll('.StoresOwner').forEach(el => {
                el.style.display = canAccessStorePanels ? '' : 'none';
            });
            document.querySelectorAll('.AdminOnly').forEach(el => {
                el.style.display = canAccessStorePanels ? '' : 'none';
            });


        } else {
            notUserEls.forEach(item => item.style.display = 'flex');
            userExEls.forEach(item => item.style.display = 'none');

            document.querySelectorAll('.StoresOwner').forEach(el => {
                el.style.display = 'none';
            });

            document.querySelectorAll('.AdminOnly').forEach(el => {
                el.style.display = 'none';
            });
        }
    }

    window.addEventListener('auth:user-loaded', (e) => {
        applyUserStatusUI(e.detail);
    });

    // ═══════════════════════════════════════════════════════
    // سبد خرید — باز/بسته کردن sidebar
    // ═══════════════════════════════════════════════════════
    function bindCartSidebar() {
        // دکمه سبد در header
        document.getElementById('cartToggleBtn')?.addEventListener('click', (e) => {
            e.stopPropagation();

            const sidebar = document.getElementById('cartSidebar');
            if (sidebar?.classList.contains('open')) {
                CartUI.close();
            } else {
                CartUI.open();
            }
        });

        // دکمه بستن
        document.getElementById('closeCartBtn')?.addEventListener('click', () => CartUI.close());

        // کلیک روی overlay
        document.getElementById('overlay')?.addEventListener('click', () => CartUI.close());
    }

    // ═══════════════════════════════════════════════════════
    // Checkout — دکمه «تکمیل خرید»
    // ═══════════════════════════════════════════════════════
    function bindCheckout() {
        document.getElementById('checkoutBtn')?.addEventListener('click', () => {
            if (Cart.count() === 0) {
                UI.showToast('سبد خرید شما خالی است!', 'error');
                return;
            }

            const isSignedIn = document.body.dataset.signedIn === 'true';
            const targetUrl = '/ShopPanel/Recommendation/Record';

            if (isSignedIn) {
                window.location.href = targetUrl;
            } else {
                sessionStorage.setItem('returnUrl', targetUrl);

                if (typeof window.openQuickRegister === 'function') {
                    window.openQuickRegister();
                } else {
                    window.location.href =
                        `/Account/Login?returnUrl=${encodeURIComponent(targetUrl)}`;
                }
            }
        });
    }

    // ═══════════════════════════════════════════════════════
    // Init
    // ═══════════════════════════════════════════════════════
    async function init() {
        // ─── تم ───
        initTheme();

        // ─── Dropdown ───
        bindDropdownOutsideClick();

        // ─── سبد خرید ───
        if (Cart) {
            Cart.load();
        }
        if (CartUI) {
            CartUI.update();
        }
        bindCartSidebar();
        bindCheckout();

        // ─── وضعیت کاربر ───
        if (Auth?.applyUserUI) {
            await Auth.applyUserUI();
        }
    }

    // ═══════════════════════════════════════════════════════
    // Export — برای onclick در HTML
    // ═══════════════════════════════════════════════════════
    window.toggleDropdownMenuStatus = toggleDropdownMenuStatus;

    // ═══════════════════════════════════════════════════════
    // شروع
    // ═══════════════════════════════════════════════════════
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();