/* ═══════════════════════════════════════════════════
   Dashboard.js — داشبورد مدیریتی (با HttpHelper)
   ═══════════════════════════════════════════════════ */

const DashboardState = {
    range: 'month'
};

// ═══════════════════════════════════════════════════════
// HttpHelper و UICore
// ═══════════════════════════════════════════════════════
const Http = window.HttpHelper;
const UI = window.UICore;

// ═══════════════════════════════════════════════════════
// مدیریت خطا
// ═══════════════════════════════════════════════════════
function handleHttpError(err) {
    console.error('[Dashboard] HTTP error:', err);
    if (err.message === 'AUTH_REQUIRED') return;
    if (err.message === 'CSRF_OR_BAD_REQUEST') {
        showDashboardToast('نشست شما منقضی شده. صفحه را رفرش کنید.', 'error');
        return;
    }
    showDashboardToast('خطا در ارتباط با سرور', 'error');
}

function showLoading() { if (UI && UI.showLoading) UI.showLoading(); }
function hideLoading() { if (UI && UI.hideLoading) UI.hideLoading(); }

// ═══════════════════════════════════════════════════════
// شروع
// ═══════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function () {
    loadUserInfo();
    loadAllDashboardData();
    initDashboardEvents();
});

// ═══════════════════════════════════════════════════════
// Load All
// ═══════════════════════════════════════════════════════
function loadAllDashboardData() {
    showLoading();
    Promise.all([
        loadKpiCards(),
        loadSalesChart(),
        loadOrdersStatusChart(),
        loadTopProducts(),
        loadRecentOrders(),
        loadRecentContacts(),
        loadPersonelsWithStores(),
        loadStoresSummary(),
        loadLowStock(),
        loadRecentActivities()
    ]).finally(hideLoading);
}

function refreshDashboard() {
    loadAllDashboardData();
    showDashboardToast('داشبورد بروزرسانی شد', 'success');
}

// ═══════════════════════════════════════════════════════
// User Info
// ═══════════════════════════════════════════════════════
function loadUserInfo() {
    Http.postSecure('/Dashboard/GetUserInfo')
        .then(res => {
            if (!res.isSuccess) return;
            const info = JSON.parse(res.data);
            const welcome = document.querySelector('.welcome-area h2');
            if (welcome) {
                welcome.innerHTML = `<i class="fas fa-tachometer-alt"></i> سلام، ${info.FullName} 👋`;
            }
        })
        .catch(handleHttpError);
}

// ═══════════════════════════════════════════════════════
// KPI
// ═══════════════════════════════════════════════════════
function loadKpiCards() {
    return Http.postSecure('/Dashboard/GetKpiCards')
        .then(res => {
            if (!res.isSuccess) return;
            const data = JSON.parse(res.data);
            const row = Array.isArray(data) ? data[0] : data;

            setKpi('kpiTodaySales', formatMoney(row.todaySales || row.TodaySales || 0));
            setKpi('kpiMonthSales', formatMoney(row.monthSales || row.MonthSales || 0));
            setKpi('kpiPendingOrders', row.pendingOrders || row.PendingOrders || 0);
            setKpi('kpiActiveProducts', row.activeProducts || row.ActiveProducts || 0);
            setKpi('kpiNewMessages', row.newMessages || row.NewMessages || 0);
            setKpi('kpiTotalPersonels', row.totalPersonels || row.TotalPersonels || 0);
            setKpi('kpiTotalStores', row.totalStores || row.TotalStores || 0);
            setKpi('kpiLowStock', row.lowStock || row.LowStock || 0);
        })
        .catch(handleHttpError);
}

function setKpi(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

// ═══════════════════════════════════════════════════════
// Sales Chart
// ═══════════════════════════════════════════════════════
function loadSalesChart() {
    return Http.postSecure('/Dashboard/GetSalesChart', { range: DashboardState.range })
        .then(res => {
            if (!res.isSuccess) return;
            const data = JSON.parse(res.data);
            renderSalesChart(data);
        })
        .catch(handleHttpError);
}

// ═══════════════════════════════════════════════════════
// Orders Status Chart
// ═══════════════════════════════════════════════════════
function loadOrdersStatusChart() {
    return Http.postSecure('/Dashboard/GetOrdersStatusChart')
        .then(res => {
            if (!res.isSuccess) return;
            const data = JSON.parse(res.data);
            renderOrdersChart(data);
        })
        .catch(handleHttpError);
}

// ═══════════════════════════════════════════════════════
// Recent Orders
// ═══════════════════════════════════════════════════════
function loadRecentOrders() {
    return Http.postSecure('/Dashboard/GetRecentOrders')
        .then(res => {
            if (!res.isSuccess) return;
            renderRecentOrders(JSON.parse(res.data));
        })
        .catch(handleHttpError);
}

function renderRecentOrders(data) {
    const tbody = document.getElementById('recentOrdersBody');
    if (!tbody) return;
    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-row">سفارشی ثبت نشده است</td></tr>';
        return;
    }
    tbody.innerHTML = data.map(o => {
        const status = getOrderStatusBadge(o.levelOrder || o.LevelOrder);
        return `
            <tr>
                <td><span class="num-badge">#${o.recommendationsId || o.RecommendationsId}</span></td>
                <td>${escapeHtml(o.customerName || o.CustomerName || '—')}</td>
                <td><span class="money">${formatMoney(o.totalAmount || o.TotalAmount || 0)}</span></td>
                <td><span class="status-badge ${status.cls}">${status.text}</span></td>
                <td>${escapeHtml(o.orderDate || o.OrderDate || '—')}</td>
            </tr>`;
    }).join('');
}

function getOrderStatusBadge(level) {
    const map = {
        2: { text: 'در انتظار', cls: 'pending' },
        3: { text: 'تایید شده', cls: 'approved' },
        4: { text: 'آماده‌سازی', cls: 'preparing' },
        5: { text: 'ارسال شده', cls: 'shipped' },
        6: { text: 'تحویل شده', cls: 'delivered' },
        7: { text: 'لغو شده', cls: 'cancelled' }
    };
    return map[level] || { text: '—', cls: 'pending' };
}

// ═══════════════════════════════════════════════════════
// Recent Contacts
// ═══════════════════════════════════════════════════════
function loadRecentContacts() {
    return Http.postSecure('/Dashboard/GetRecentContacts')
        .then(res => {
            if (!res.isSuccess) return;
            renderRecentContacts(JSON.parse(res.data));
        })
        .catch(handleHttpError);
}

function renderRecentContacts(data) {
    const tbody = document.getElementById('recentContactsBody');
    if (!tbody) return;
    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="empty-row">پیامی ثبت نشده است</td></tr>';
        return;
    }
    tbody.innerHTML = data.map(c => `
        <tr>
            <td>${escapeHtml(c.fullName || c.FullName || '—')}</td>
            <td>${escapeHtml(c.subject || c.Subject || '—')}</td>
            <td>${escapeHtml(c.createdDate || c.CreatedDate || '—')}</td>
        </tr>`).join('');
}

// ═══════════════════════════════════════════════════════
// Personels
// ═══════════════════════════════════════════════════════
function loadPersonelsWithStores() {
    return Http.postSecure('/Dashboard/GetPersonelsWithStores')
        .then(res => {
            if (!res.isSuccess) return;
            renderPersonels(JSON.parse(res.data));
        })
        .catch(handleHttpError);
}

function renderPersonels(data) {
    const tbody = document.getElementById('personelsBody');
    if (!tbody) return;
    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-row">پرسنلی یافت نشد</td></tr>';
        return;
    }
    tbody.innerHTML = data.map((p, i) => `
        <tr>
            <td>${i + 1}</td>
            <td><strong>${escapeHtml(p.fullName || p.FullName || '—')}</strong></td>
            <td>${escapeHtml(p.roleCaption || p.RoleCaption || '—')}</td>
            <td>${escapeHtml(truncate(p.address || p.Address || '—', 40))}</td>
            <td><span class="num-badge gold">${p.storeCount || p.StoreCount || 0}</span></td>
            <td><span class="num-badge">${p.productCount || p.ProductCount || 0}</span></td>
            <td>
                <span class="status-dot ${(p.isActive || p.IsActive) ? 'active' : 'inactive'}"></span>
                ${(p.isActive || p.IsActive) ? 'فعال' : 'غیرفعال'}
            </td>
        </tr>`).join('');
}

// ═══════════════════════════════════════════════════════
// Stores
// ═══════════════════════════════════════════════════════
function loadStoresSummary() {
    return Http.postSecure('/Dashboard/GetStoresSummary')
        .then(res => {
            if (!res.isSuccess) return;
            renderStores(JSON.parse(res.data));
        })
        .catch(handleHttpError);
}

function renderStores(data) {
    const tbody = document.getElementById('storesBody');
    if (!tbody) return;
    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-row">فروشگاهی یافت نشد</td></tr>';
        return;
    }
    tbody.innerHTML = data.map((s, i) => `
        <tr>
            <td>${i + 1}</td>
            <td><strong>${escapeHtml(s.storeName || s.StoreName || '—')}</strong></td>
            <td><span class="num-badge">${escapeHtml(s.codeStore || s.CodeStore || '—')}</span></td>
            <td>${escapeHtml(s.ownerName || s.OwnerName || '—')}</td>
            <td><span class="num-badge">${s.productCount || s.ProductCount || 0}</span></td>
            <td><span class="num-badge">${s.orderCount || s.OrderCount || 0}</span></td>
            <td><span class="money">${formatMoney(s.totalRevenue || s.TotalRevenue || 0)}</span></td>
            <td>
                <span class="status-dot ${(s.isActive || s.IsActive) ? 'active' : 'inactive'}"></span>
                ${(s.isActive || s.IsActive) ? 'فعال' : 'غیرفعال'}
            </td>
        </tr>`).join('');
}

// ═══════════════════════════════════════════════════════
// Top Products
// ═══════════════════════════════════════════════════════
function loadTopProducts() {
    return Http.postSecure('/Dashboard/GetTopProducts')
        .then(res => {
            if (!res.isSuccess) return;
            renderTopProducts(JSON.parse(res.data));
        })
        .catch(handleHttpError);
}

function renderTopProducts(data) {
    const tbody = document.getElementById('topProductsBody');
    if (!tbody) return;
    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-row">داده‌ای موجود نیست</td></tr>';
        return;
    }
    tbody.innerHTML = data.map((p, i) => `
        <tr>
            <td><span class="num-badge ${i === 0 ? 'gold' : ''}">${i + 1}</span></td>
            <td>${escapeHtml(p.productName || p.ProductName || '—')}</td>
            <td><span class="num-badge">${p.totalSold || p.TotalSold || 0}</span></td>
            <td><span class="money">${formatMoney(p.totalRevenue || p.TotalRevenue || 0)}</span></td>
        </tr>`).join('');
}

// ═══════════════════════════════════════════════════════
// Low Stock
// ═══════════════════════════════════════════════════════
function loadLowStock() {
    return Http.postSecure('/Dashboard/GetLowStock')
        .then(res => {
            if (!res.isSuccess) return;
            renderLowStock(JSON.parse(res.data));
        })
        .catch(handleHttpError);
}

function renderLowStock(data) {
    const tbody = document.getElementById('lowStockBody');
    if (!tbody) return;
    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="empty-row">موجودی همه محصولات کافی است ✅</td></tr>';
        return;
    }
    tbody.innerHTML = data.map(p => `
        <tr>
            <td>${escapeHtml(p.productName || p.ProductName || '—')}</td>
            <td>${escapeHtml(p.colorName || p.ColorName || '—')}</td>
            <td>
                <span class="status-badge ${(p.stock || p.Stock) < 3 ? 'cancelled' : 'pending'}">
                    ${p.stock || p.Stock || 0}
                </span>
            </td>
        </tr>`).join('');
}

// ═══════════════════════════════════════════════════════
// Activities
// ═══════════════════════════════════════════════════════
function loadRecentActivities() {
    return Http.postSecure('/Dashboard/GetRecentActivities')
        .then(res => {
            if (!res.isSuccess) return;
            renderActivities(JSON.parse(res.data));
        })
        .catch(handleHttpError);
}

function renderActivities(data) {
    const container = document.getElementById('activitiesTimeline');
    if (!container) return;
    if (!data || data.length === 0) {
        container.innerHTML = '<div class="empty-row">فعالیتی ثبت نشده است</div>';
        return;
    }
    container.innerHTML = data.map(a => {
        const type = a.typeSystemAct ?? a.TypeSystemAct;
        const isLogin = type === 0;
        const icon = isLogin ? 'fa-sign-in-alt' : 'fa-sign-out-alt';
        const cls = isLogin ? 'login' : 'logout';
        const text = a.actCaption || a.ActCaption || (isLogin ? 'ورود' : 'خروج');
        return `
            <div class="timeline-item">
                <div class="timeline-icon ${cls}"><i class="fas ${icon}"></i></div>
                <div class="timeline-content">
                    <div class="timeline-name">
                        ${escapeHtml(a.personelName || a.PersonelName || '—')}
                        <span style="opacity:.6;font-weight:400">${escapeHtml(text)}</span>
                    </div>
                    <div class="timeline-meta">${escapeHtml(a.actDate || a.ActDate || '—')}</div>
                </div>
            </div>`;
    }).join('');
}

// ═══════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════
function escapeHtml(s) {
    if (s === null || s === undefined) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatMoney(v) {
    if (v === null || v === undefined) return '0';
    return Number(v).toLocaleString('fa-IR') + ' ت';
}

function formatMoneyShort(v) {
    const n = Number(v) || 0;
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return n.toString();
}

function formatDate(d) {
    if (!d) return '';
    try {
        const dt = new Date(d);
        if (isNaN(dt)) return d;
        return `${dt.getFullYear()}/${String(dt.getMonth() + 1).padStart(2, '0')}/${String(dt.getDate()).padStart(2, '0')}`;
    } catch { return d; }
}

function truncate(str, len) {
    if (!str) return '';
    return str.length > len ? str.substring(0, len) + '…' : str;
}

function scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        el.style.transition = 'box-shadow .4s';
        el.style.boxShadow = '0 0 0 3px rgba(15,107,255,.3)';
        setTimeout(() => { el.style.boxShadow = ''; }, 1500);
    }
}

function showDashboardToast(message, type = 'info') {
    if (UI && UI.showToast) {
        UI.showToast(message, type);
        return;
    }
    const colors = { success: '#10b981', error: '#ef4444', info: '#0f6bff' };
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed; bottom: 24px; left: 24px;
        background: ${colors[type]}; color: #fff;
        padding: 12px 20px; border-radius: 10px;
        font-size: 13px; font-weight: 700; z-index: 9999;
        box-shadow: 0 10px 30px rgba(0,0,0,.2);
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
}

// ═══════════════════════════════════════════════════════
// Events
// ═══════════════════════════════════════════════════════
function initDashboardEvents() {
    document.querySelectorAll('.date-range button').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.date-range button').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            DashboardState.range = this.dataset.range;
            loadSalesChart();
        });
    });
}