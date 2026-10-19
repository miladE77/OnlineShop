/* ============================================================
   MainJS.js — منطق پنل مدیریتی
   ------------------------------------------------------------
   وابستگی‌ها (به ترتیب لود):
     1. jQuery
     2. Core/HttpHelper.js
     3. Core/UICore.js
     4. Core/AuthHelper.js
     5. Core/CartHelper.js
     6. MainJS.js (همین فایل)

   ⚠️ بدون هیچ ارجاعی به el.dropdownMenu (خطای قبلی)
   ⚠️ toggleDropdownMenuStatus با document.getElementById مستقیم
   ⚠️ Layout/Navbar/Shadow/Theme با el (کش‌شده در ابتدای IIFE)
   ============================================================ */

(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════
    // وابستگی‌ها
    // ═══════════════════════════════════════════════════════
    const Auth = window.AuthHelper;
    const UI = window.UICore;

    // ═══════════════════════════════════════════════════════
    // المان‌های DOM — فقط برای Layout و Navbar
    // ⚠️ DropdownMenu این‌جا کش نمی‌شه (با getElementById مستقیم کار می‌کنه)
    // ═══════════════════════════════════════════════════════
    const el = {
        navbar: document.getElementById('rightNavbar'),
        mainContent: document.getElementById('mainContent'),
        toggleNavBtn: document.getElementById('toggleNavbarBtn'),
        menuBtn: document.getElementById('menuBtn'),
        shadow: document.getElementById('Shadow'),
        logoArea: document.getElementById('logoAreaHeader'),
        themeToggle: document.getElementById('themeToggleBtn')
    };

    // ═══════════════════════════════════════════════════════
    // Breakpoints
    // ═══════════════════════════════════════════════════════
    const BP_DESKTOP = 900;
    const BP_TABLET = 480;

    // ═══════════════════════════════════════════════════════
    // Shadow — پس‌زمینه موبایل
    // ═══════════════════════════════════════════════════════
    const Shadow = {
        show() {
            if (!el.shadow) return;
            el.shadow.style.display = 'block';
            el.shadow.style.opacity = 1;
        },
        hide() {
            if (!el.shadow) return;
            el.shadow.style.display = '';
            el.shadow.style.opacity = 0;
        }
    };

    // ═══════════════════════════════════════════════════════
    // Layout — Desktop / Tablet / Mobile
    // ═══════════════════════════════════════════════════════
    const Layout = {
        desktop() {
            if (!el.navbar || !el.mainContent) return;

            el.mainContent.classList.toggle(
                'full-width',
                el.navbar.classList.contains('LuckNav')
            );

            if (el.menuBtn) el.menuBtn.style.display = 'none';
            if (el.toggleNavBtn) el.toggleNavBtn.style.display = '';
            if (el.logoArea) el.logoArea.style.marginRight = '60px';

            el.navbar.classList.remove('mobile', 'open');
            el.mainContent.classList.remove('full-width-mobile');

            Shadow.hide();
        },

        tablet() {
            if (!el.navbar || !el.mainContent) return;

            if (el.logoArea) el.logoArea.style.marginRight = '60px';
            if (el.menuBtn) el.menuBtn.style.display = 'none';
            if (el.toggleNavBtn) el.toggleNavBtn.style.display = '';

            el.mainContent.classList.remove('full-width');
            el.navbar.classList.remove('mobile', 'LuckNav', 'open');
            el.navbar.classList.add('Flexiable');
            el.mainContent.classList.remove('full-width-mobile');

            Shadow.hide();
        },

        mobile() {
            if (!el.navbar || !el.mainContent) return;

            if (el.logoArea) el.logoArea.style.marginRight = '5px';
            if (el.menuBtn) el.menuBtn.style.display = '';
            if (el.toggleNavBtn) el.toggleNavBtn.style.display = 'none';

            el.mainContent.classList.remove('full-width');
            el.mainContent.classList.add('full-width-mobile');
            el.navbar.classList.remove('Flexiable', 'LuckNav');
            el.navbar.classList.add('mobile');
        },

        update() {
            const w = window.innerWidth;
            if (w > BP_DESKTOP) this.desktop();
            else if (w > BP_TABLET) this.tablet();
            else this.mobile();
        }
    };

    // ═══════════════════════════════════════════════════════
    // Navbar — Toggle + آکاردئون + Active
    // ═══════════════════════════════════════════════════════
    const Navbar = {

        toggleStatus() {
            if (!el.navbar || !el.mainContent) return;

            const isOpen = el.navbar.classList.toggle('LuckNav');
            el.navbar.classList.toggle('Flexiable', !isOpen);
            el.mainContent.classList.toggle('full-width', isOpen);
            if (el.toggleNavBtn) el.toggleNavBtn.classList.toggle('open', isOpen);
        },

        toggleMobileMenu() {
            if (!el.menuBtn || !el.navbar) return;

            const isActive = el.menuBtn.classList.toggle('active');
            el.navbar.classList.toggle('open', isActive);

            isActive ? Shadow.show() : Shadow.hide();
        },

        closeMobileMenu() {
            if (!el.menuBtn || !el.navbar) return;

            el.menuBtn.classList.remove('active');
            el.navbar.classList.remove('open');
            Shadow.hide();
        },

        setActiveByUrl() {
            const currentPage = (window.location.pathname
                .split('/')
                .filter(Boolean)[0] || '').toLowerCase();

            document.querySelectorAll('[data-page]').forEach(item => {
                const page = (item.dataset.page || '').toLowerCase();
                item.classList.toggle('active', page === currentPage);
            });
        },

        autoOpenActiveGroup() {
            const active = document.querySelector('.nav-item.active');
            const group = active?.closest('.nav-group');
            if (group) group.classList.add('open');
        },

        scrollToActive() {
            document.querySelector('.nav-item.active')?.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        },

        bindEvents() {
            // دکمه Toggle اصلی
            el.toggleNavBtn?.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleStatus();
            });

            // دکمه منوی موبایل
            el.menuBtn?.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleMobileMenu();
            });

            // کلیک روی Shadow
            el.shadow?.addEventListener('click', () => this.closeMobileMenu());

            // گروه‌های آکاردئونی
            document.querySelectorAll('.nav-group-toggle').forEach(toggle => {
                toggle.addEventListener('click', function (e) {
                    e.preventDefault();
                    this.closest('.nav-group')?.classList.toggle('open');
                });
            });
        }
    };

    // ═══════════════════════════════════════════════════════
    // Theme — دارک/لایت
    // ═══════════════════════════════════════════════════════
    const Theme = {
        init() {
            if (localStorage.getItem('shopTheme') === 'dark') {
                document.body.classList.add('dark');
            }

            el.themeToggle?.addEventListener('click', (e) => {
                e.preventDefault();
                const isDark = document.body.classList.toggle('dark');
                localStorage.setItem('shopTheme', isDark ? 'dark' : 'light');
            });
        }
    };

    // ═══════════════════════════════════════════════════════
    // Dropdown پروفایل — سراسری برای onclick در HTML
    // ⚠️ بدون el — با getElementById مستقیم
    // ═══════════════════════════════════════════════════════
    function toggleDropdownMenuStatus(event) {
        if (event) event.preventDefault();

        const menu = document.getElementById('dropdownMenu');
        if (!menu) {
            return;
        }

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
    // User Status UI — واکنش به رویداد AuthHelper
    // ═══════════════════════════════════════════════════════
    function applyUserStatusUI(user) {
        if (!user) return;

        const notUserEls = document.querySelectorAll('.NotUser');
        const userExEls = document.querySelectorAll('.UserEx');
        const nameEl = document.getElementById('NameUser');

        if (user.isAuthenticated) {
            notUserEls.forEach(item => item.style.display = 'none');
            userExEls.forEach(item => {
                item.style.display = item.classList.contains('SubItems')
                    ? 'block'
                    : 'flex';
            });
            if (nameEl && user.fullName) nameEl.textContent = user.fullName;
        } else {
            notUserEls.forEach(item => item.style.display = 'flex');
            userExEls.forEach(item => item.style.display = 'none');
        }
    }

    // ─── گوش دادن به رویداد AuthHelper ───
    window.addEventListener('auth:user-loaded', (e) => {
        applyUserStatusUI(e.detail);
    });

    // ═══════════════════════════════════════════════════════
    // Resize — با Debounce
    // ═══════════════════════════════════════════════════════
    let resizeTimer = null;
    function handleResize() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            Layout.update();
            Navbar.setActiveByUrl();
        }, 150);
    }

    // ═══════════════════════════════════════════════════════
    // Init
    // ═══════════════════════════════════════════════════════
    async function init() {
        // ─── Layout ───
        Layout.update();

        // ─── Theme ───
        Theme.init();

        // ─── Navbar ───
        Navbar.bindEvents();
        Navbar.setActiveByUrl();
        Navbar.autoOpenActiveGroup();

        // ─── Dropdown ───
        bindDropdownOutsideClick();

        // ─── وضعیت کاربر ───
        if (Auth?.applyUserUI) {
            await Auth.applyUserUI();
        }

        // ─── اسکرول به آیتم فعال ───
        Navbar.scrollToActive();

        // ─── Resize ───
        window.addEventListener('resize', handleResize);
    }

    // ═══════════════════════════════════════════════════════
    // Export
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