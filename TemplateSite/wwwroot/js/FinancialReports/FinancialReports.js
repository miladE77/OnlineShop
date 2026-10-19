/* ═══════════════════════════════════════════════════
   FinancialReports.js — منطق صفحه گزارشات مالی
   ═══════════════════════════════════════════════════ */

const FinState = {
    range: 'all'
};

// ═══════════ Init ═══════════
document.addEventListener('DOMContentLoaded', function () {
    initPeriodButtons();
    loadAllReports();
});

function initPeriodButtons() {
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            FinState.range = this.dataset.range;
            loadAllReports();
        });
    });
}

function refreshAll() {
    loadAllReports();
    showToast('گزارشات بروزرسانی شد', 'success');
}

function loadAllReports() {
    loadKpi();
    loadMonthlyIncomeChart();
    loadDailyIncomeChart();
    loadIncomeByTypeChart();
    loadProfitReport();
    loadMonthComparison();
    loadSalesForecast();
    loadTopProducts();
    loadTopCustomers();
    loadInventoryByStore();
    loadSalesByStore();
    loadPendingPayments();
    loadSlowMovingProducts();
}

// ═══════════ Helpers ═══════════
function extractArray(data) {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.Table && Array.isArray(data.Table)) return data.Table;
    if (typeof data === 'object') {
        const key = Object.keys(data)[0];
        if (key && Array.isArray(data[key])) return data[key];
    }
    return [];
}

function formatMoney(v) {
    if (v === null || v === undefined) return '0';
    return Number(v).toLocaleString('fa-IR') + ' ت';
}

function formatMoneyShort(v) {
    const n = Number(v) || 0;
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
    return n.toString();
}

function getVal(row, keys) {
    for (const k of keys) {
        if (row[k] !== undefined && row[k] !== null) return row[k];
    }
    return 0;
}

function truncate(s, len) {
    if (!s) return '';
    return s.length > len ? s.substring(0, len) + '…' : s;
}

// ═══════════ KPI ═══════════
function loadKpi() {
    $.post('/FinancialReports/GetKpi', {}, function (res) {
        if (!res.isSuccess) return;
        const data = extractArray(JSON.parse(res.data));
        const row = data[0] || {};

        setText('kpiTotalIncome', formatMoney(getVal(row, ['TotalIncome', 'totalIncome'])));
        setText('kpiTodayIncome', formatMoney(getVal(row, ['TodayIncome', 'todayIncome'])));
        setText('kpiMonthIncome', formatMoney(getVal(row, ['MonthIncome', 'monthIncome'])));
        setText('kpiInventoryValue', formatMoney(getVal(row, ['InventoryValue', 'inventoryValue'])));
        setText('kpiTotalOrders', getVal(row, ['TotalOrders', 'totalOrders']));
        setText('kpiAvgOrder', formatMoney(getVal(row, ['AvgOrderValue', 'avgOrderValue'])));
        setText('kpiTotalProducts', getVal(row, ['TotalProducts', 'totalProducts']));
        setText('kpiTotalStores', getVal(row, ['TotalStores', 'totalStores']));
    });
}

function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

// ═══════════ Monthly Income Chart (Line/Area) ═══════════
function loadMonthlyIncomeChart() {
    $.post('/FinancialReports/GetMonthlyIncome', {}, function (res) {
        if (!res.isSuccess) return;
        const data = extractArray(JSON.parse(res.data));
        renderLineChart('monthlyIncomeChart', data, {
            xKey: 'MonthName',
            yKey: 'TotalIncome',
            color: '#0f6bff'
        });
    });
}

// ═══════════ Daily Income Chart (Line/Area) ═══════════
function loadDailyIncomeChart() {
    $.post('/FinancialReports/GetDailyIncome', {}, function (res) {
        if (!res.isSuccess) return;
        const data = extractArray(JSON.parse(res.data));
        renderLineChart('dailyIncomeChart', data, {
            xKey: 'IncomeDate',
            yKey: 'TotalIncome',
            color: '#10b981',
            dateFormat: true
        });
    });
}

// ═══════════ Income by Type Chart (Donut) ═══════════
function loadIncomeByTypeChart() {
    $.post('/FinancialReports/GetIncomeByTypePeyment', {}, function (res) {
        if (!res.isSuccess) return;
        const data = extractArray(JSON.parse(res.data));
        renderDonutChart('incomeByTypeChart', data, {
            labelKey: 'PeymentType',
            valueKey: 'TotalIncome'
        });
    });
}

// ═══════════ Line Chart Renderer ═══════════
function renderLineChart(containerId, data, opts) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!data || data.length === 0) {
        container.innerHTML = '<div class="chart-empty">داده‌ای برای نمایش نیست</div>';
        return;
    }

    const width = container.clientWidth || 600;
    const height = 280;
    const padding = { top: 20, right: 20, bottom: 40, left: 60 };
    const innerW = width - padding.left - padding.right;
    const innerH = height - padding.top - padding.bottom;

    const points = data.map(d => ({
        label: String(d[opts.xKey] || ''),
        value: Number(d[opts.yKey] || 0)
    }));

    const maxVal = Math.max(...points.map(p => p.value), 1);
    const stepX = points.length > 1 ? innerW / (points.length - 1) : innerW;

    const coords = points.map((p, i) => ({
        x: padding.left + i * stepX,
        y: padding.top + innerH - (p.value / maxVal) * innerH,
        ...p
    }));

    let linePath = '';
    let areaPath = '';

    if (coords.length > 0) {
        linePath = `M ${coords[0].x} ${coords[0].y}`;
        for (let i = 1; i < coords.length; i++) {
            const prev = coords[i - 1];
            const curr = coords[i];
            const cpX = (prev.x + curr.x) / 2;
            linePath += ` C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
        }
        areaPath = linePath +
            ` L ${coords[coords.length - 1].x} ${padding.top + innerH}` +
            ` L ${coords[0].x} ${padding.top + innerH} Z`;
    }

    let gridLines = '';
    const gridCount = 4;
    for (let i = 0; i <= gridCount; i++) {
        const y = padding.top + (innerH / gridCount) * i;
        const val = maxVal - (maxVal / gridCount) * i;
        gridLines += `
            <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" 
                  stroke="#e2e8f0" stroke-width="1" stroke-dasharray="3,3"/>
            <text x="${padding.left - 8}" y="${y + 4}" text-anchor="end" 
                  font-size="10" fill="#94a3b8" direction="ltr">${formatMoneyShort(val)}</text>
        `;
    }

    let dots = '';
    coords.forEach((c, i) => {
        const showDot = coords.length <= 15 || i % Math.ceil(coords.length / 10) === 0 || i === coords.length - 1;
        if (showDot) {
            dots += `<circle cx="${c.x}" cy="${c.y}" r="4" fill="#fff" 
                            stroke="${opts.color}" stroke-width="2">
                        <title>${c.label}: ${formatMoney(c.value)}</title>
                    </circle>`;
        }
    });

    let xLabels = '';
    coords.forEach((c, i) => {
        const showLabel = coords.length <= 10 ||
            i % Math.ceil(coords.length / 6) === 0 ||
            i === coords.length - 1;
        if (showLabel) {
            xLabels += `<text x="${c.x}" y="${height - 12}" text-anchor="middle" 
                              font-size="10" fill="#94a3b8" direction="ltr">${truncate(c.label, 12)}</text>`;
        }
    });

    const gradId = 'grad_' + containerId;
    const svg = `
        <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" 
             style="width:100%;height:280px;display:block;">
            <defs>
                <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="${opts.color}" stop-opacity="0.25"/>
                    <stop offset="100%" stop-color="${opts.color}" stop-opacity="0.02"/>
                </linearGradient>
            </defs>
            ${gridLines}
            <path d="${areaPath}" fill="url(#${gradId})"/>
            <path d="${linePath}" fill="none" stroke="${opts.color}" stroke-width="2.5" 
                  stroke-linecap="round" stroke-linejoin="round"/>
            ${dots}
            ${xLabels}
        </svg>
    `;

    container.innerHTML = svg;
}

// ═══════════ Donut Chart Renderer ═══════════
function renderDonutChart(containerId, data, opts) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!data || data.length === 0) {
        container.innerHTML = '<div class="chart-empty">داده‌ای برای نمایش نیست</div>';
        return;
    }

    const items = data.map(d => ({
        label: d[opts.labelKey] || '—',
        value: Number(d[opts.valueKey] || 0)
    }));

    const total = items.reduce((s, i) => s + i.value, 0);
    if (total === 0) {
        container.innerHTML = '<div class="chart-empty">داده‌ای برای نمایش نیست</div>';
        return;
    }

    const colors = ['#0f6bff', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

    const size = 220;
    const radius = 80;
    const strokeWidth = 30;
    const center = size / 2;
    const circumference = 2 * Math.PI * radius;

    let offset = 0;
    let arcs = '';

    items.forEach((item, i) => {
        const percent = item.value / total;
        const dash = circumference * percent;
        const color = colors[i % colors.length];

        arcs += `
            <circle cx="${center}" cy="${center}" r="${radius}" fill="none" 
                    stroke="${color}" stroke-width="${strokeWidth}"
                    stroke-dasharray="${dash} ${circumference - dash}"
                    stroke-dashoffset="${-offset}"
                    transform="rotate(-90 ${center} ${center})">
                <title>${item.label}: ${formatMoney(item.value)} (${(percent * 100).toFixed(1)}%)</title>
            </circle>
        `;

        offset += dash;
    });

    let legend = '<div class="chart-legend">';
    items.forEach((item, i) => {
        const color = colors[i % colors.length];
        const percent = ((item.value / total) * 100).toFixed(1);
        legend += `
            <div class="chart-legend-item">
                <span class="legend-color" style="background:${color}"></span>
                <span class="legend-label">${item.label}</span>
                <span class="legend-value">${percent}%</span>
            </div>
        `;
    });
    legend += '</div>';

    container.innerHTML = `
        <div class="donut-wrapper">
            <svg viewBox="0 0 ${size} ${size}">
                <circle cx="${center}" cy="${center}" r="${radius}" 
                        fill="none" stroke="#f1f5f9" stroke-width="${strokeWidth}"/>
                ${arcs}
                <text x="${center}" y="${center - 5}" text-anchor="middle" 
                      font-size="18" font-weight="800" fill="#1e2a3a">
                    ${formatMoneyShort(total)}
                </text>
                <text x="${center}" y="${center + 15}" text-anchor="middle" 
                      font-size="11" fill="#94a3b8">تومان</text>
            </svg>
            ${legend}
        </div>
    `;
}

// ═══════════ Profit Report ═══════════
function loadProfitReport() {
    $.post('/FinancialReports/GetProfitReport', {}, function (res) {
        if (!res.isSuccess) return;
        const data = extractArray(JSON.parse(res.data));
        const row = data[0] || {};

        setText('profitRevenue', formatMoney(getVal(row, ['TotalRevenue', 'totalRevenue'])));
        setText('profitCost', formatMoney(getVal(row, ['EstimatedCost', 'estimatedCost'])));
        setText('profitNet', formatMoney(getVal(row, ['EstimatedProfit', 'estimatedProfit'])));
        setText('profitTax', formatMoney(getVal(row, ['EstimatedTax', 'estimatedTax'])));
    });
}

// ═══════════ Month Comparison ═══════════
function loadMonthComparison() {
    $.post('/FinancialReports/GetMonthComparison', {}, function (res) {
        if (!res.isSuccess) return;
        const data = extractArray(JSON.parse(res.data));
        const row = data[0] || {};

        const thisMonth = getVal(row, ['ThisMonth', 'thisMonth']);
        const lastMonth = getVal(row, ['LastMonth', 'lastMonth']);
        const thisOrders = getVal(row, ['ThisMonthOrders', 'thisMonthOrders']);
        const lastOrders = getVal(row, ['LastMonthOrders', 'lastMonthOrders']);

        setText('compareThisMonth', formatMoney(thisMonth));
        setText('compareLastMonth', formatMoney(lastMonth));
        setText('compareThisOrders', thisOrders);
        setText('compareLastOrders', lastOrders);

        updatePercent('compareIncomePercent', thisMonth, lastMonth);
        updatePercent('compareOrdersPercent', thisOrders, lastOrders);
    });
}

function updatePercent(id, current, previous) {
    const el = document.getElementById(id);
    if (!el) return;

    const cur = Number(current) || 0;
    const prev = Number(previous) || 0;

    if (prev === 0) {
        el.textContent = cur > 0 ? 'جدید' : '—';
        el.className = 'compare-percent';
        return;
    }

    const percent = ((cur - prev) / prev) * 100;
    const sign = percent >= 0 ? '+' : '';
    el.textContent = `${sign}${percent.toFixed(1)}%`;
    el.className = 'compare-percent ' + (percent >= 0 ? 'up' : 'down');
}

// ═══════════ Sales Forecast ═══════════
function loadSalesForecast() {
    $.post('/FinancialReports/GetSalesForecast', {}, function (res) {
        if (!res.isSuccess) return;
        const data = extractArray(JSON.parse(res.data));
        const row = data[0] || {};

        const last30 = getVal(row, ['Last30Days', 'last30Days']);
        const prev30 = getVal(row, ['Previous30Days', 'previous30Days']);
        const avgOrder = getVal(row, ['AvgOrderValue', 'avgOrderValue']);
        const orders = getVal(row, ['OrdersLast30Days', 'ordersLast30Days']);

        // پیش‌بینی: میانگین وزنی (۶۰٪ ماه اخیر + ۴۰٪ ماه قبل) × رشد
        const forecast = (Number(last30) * 0.6 + Number(prev30) * 0.4) * 1.05;

        setText('forecastLast30', formatMoney(last30));
        setText('forecastPrevious30', formatMoney(prev30));
        setText('forecastNext', formatMoney(forecast));
        setText('forecastAvgOrder', formatMoney(avgOrder));
    });
}

// ═══════════ Top Products ═══════════
function loadTopProducts() {
    $.post('/FinancialReports/GetTopSellingProducts', {}, function (res) {
        if (!res.isSuccess) return;
        const data = extractArray(JSON.parse(res.data));
        const tbody = document.getElementById('topProductsBody');
        if (!tbody) return;

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="chart-empty">داده‌ای نیست</td></tr>';
            return;
        }

        tbody.innerHTML = data.map((p, i) => `
            <tr>
                <td><span class="num-badge ${i < 3 ? 'gold' : ''}">${i + 1}</span></td>
                <td>${truncate(p.ProductName || p.productName || '—', 40)}</td>
                <td><span class="num-badge">${getVal(p, ['TotalSold', 'totalSold'])}</span></td>
                <td><span class="money">${formatMoney(getVal(p, ['AvgPrice', 'avgPrice']))}</span></td>
                <td><span class="money">${formatMoney(getVal(p, ['TotalRevenue', 'totalRevenue']))}</span></td>
            </tr>
        `).join('');
    });
}

// ═══════════ Top Customers ═══════════
function loadTopCustomers() {
    $.post('/FinancialReports/GetTopCustomers', {}, function (res) {
        if (!res.isSuccess) return;
        const data = extractArray(JSON.parse(res.data));
        const tbody = document.getElementById('topCustomersBody');
        if (!tbody) return;

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="chart-empty">داده‌ای نیست</td></tr>';
            return;
        }

        tbody.innerHTML = data.map((c, i) => `
            <tr>
                <td><span class="num-badge ${i < 3 ? 'gold' : ''}">${i + 1}</span></td>
                <td>${truncate(c.CustomerName || c.customerName || '—', 30)}</td>
                <td><span class="num-badge">${getVal(c, ['OrderCount', 'orderCount'])}</span></td>
                <td><span class="money">${formatMoney(getVal(c, ['TotalSpent', 'totalSpent']))}</span></td>
                <td>${formatDate(getVal(c, ['LastOrderDate', 'lastOrderDate']))}</td>
            </tr>
        `).join('');
    });
}

// ═══════════ Inventory By Store ═══════════
function loadInventoryByStore() {
    $.post('/FinancialReports/GetInventoryValueByStore', {}, function (res) {
        if (!res.isSuccess) return;
        const data = extractArray(JSON.parse(res.data));
        const tbody = document.getElementById('inventoryByStoreBody');
        if (!tbody) return;

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="chart-empty">داده‌ای نیست</td></tr>';
            return;
        }

        tbody.innerHTML = data.map((s, i) => `
            <tr>
                <td>${i + 1}</td>
                <td>${truncate(s.StoreName || s.storeName || '—', 35)}</td>
                <td><span class="num-badge">${getVal(s, ['ProductCount', 'productCount'])}</span></td>
                <td><span class="num-badge">${getVal(s, ['TotalItems', 'totalItems'])}</span></td>
                <td><span class="money">${formatMoney(getVal(s, ['InventoryValue', 'inventoryValue']))}</span></td>
            </tr>
        `).join('');
    });
}

// ═══════════ Sales By Store ═══════════
function loadSalesByStore() {
    $.post('/FinancialReports/GetSalesByStore', {}, function (res) {
        if (!res.isSuccess) return;
        const data = extractArray(JSON.parse(res.data));
        const tbody = document.getElementById('salesByStoreBody');
        if (!tbody) return;

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="chart-empty">داده‌ای نیست</td></tr>';
            return;
        }

        tbody.innerHTML = data.map((s, i) => `
            <tr>
                <td>${i + 1}</td>
                <td>${truncate(s.StoreName || s.storeName || '—', 35)}</td>
                <td><span class="num-badge">${s.CodeStore || s.codeStore || '—'}</span></td>
                <td><span class="num-badge">${getVal(s, ['OrderCount', 'orderCount'])}</span></td>
                <td><span class="money">${formatMoney(getVal(s, ['TotalIncome', 'totalIncome']))}</span></td>
            </tr>
        `).join('');
    });
}

// ═══════════ Pending Payments ═══════════
function loadPendingPayments() {
    $.post('/FinancialReports/GetPendingPayments', {}, function (res) {
        if (!res.isSuccess) return;
        const data = extractArray(JSON.parse(res.data));
        const tbody = document.getElementById('pendingPaymentsBody');
        if (!tbody) return;

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="chart-empty">✅ پرداخت معلقی وجود ندارد</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(p => `
            <tr>
                <td><span class="num-badge">#${p.RecommendationsId || p.recommendationsId}</span></td>
                <td>${truncate(p.OrderTitle || p.orderTitle || '—', 30)}</td>
                <td>${truncate(p.CustomerName || p.customerName || '—', 25)}</td>
                <td><span class="money">${formatMoney(getVal(p, ['ExpectedAmount', 'expectedAmount']))}</span></td>
                <td><span class="status-badge pending">${p.StatusText || p.statusText || '—'}</span></td>
                <td>${formatDate(getVal(p, ['OrderDate', 'orderDate']))}</td>
            </tr>
        `).join('');
    });
}

// ═══════════ Slow Moving Products ═══════════
function loadSlowMovingProducts() {
    $.post('/FinancialReports/GetSlowMovingProducts', {}, function (res) {
        if (!res.isSuccess) return;
        const data = extractArray(JSON.parse(res.data));
        const tbody = document.getElementById('slowMovingBody');
        if (!tbody) return;

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="chart-empty">✅ محصول راکدی وجود ندارد</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(p => {
            const sold = getVal(p, ['SoldLast30Days', 'soldLast30Days']);
            const stock = getVal(p, ['CurrentStock', 'currentStock']);
            const cls = sold === 0 ? 'red' : sold < 3 ? 'gold' : '';
            return `
                <tr>
                    <td>—</td>
                    <td>${truncate(p.ProductName || p.productName || '—', 35)}</td>
                    <td>${truncate(p.StoreName || p.storeName || '—', 25)}</td>
                    <td><span class="num-badge ${stock > 20 ? 'red' : ''}">${stock}</span></td>
                    <td><span class="num-badge ${cls}">${sold}</span></td>
                </tr>
            `;
        }).join('');
    });
}

// ═══════════ Date format ═══════════
function formatDate(d) {
    if (!d) return '—';
    try {
        const dt = new Date(d);
        if (isNaN(dt)) return d;
        return `${dt.getFullYear()}/${String(dt.getMonth() + 1).padStart(2, '0')}/${String(dt.getDate()).padStart(2, '0')}`;
    } catch { return d; }
}

// ═══════════ Toast ═══════════
function showToast(msg, type = 'info') {
    const colors = { success: '#10b981', error: '#ef4444', info: '#0f6bff' };
    const t = document.createElement('div');
    t.style.cssText = `position:fixed;bottom:24px;left:24px;background:${colors[type]};color:#fff;padding:12px 20px;border-radius:10px;font-size:13px;font-weight:700;z-index:9999;box-shadow:0 10px 30px rgba(0,0,0,.2);`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2500);
}