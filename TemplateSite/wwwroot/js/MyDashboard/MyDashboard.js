(function () {
    'use strict';

    const Http = window.HttpHelper;
    const UI = window.UICore;

    if (!Http || !UI) {
        console.error('❌ MyDashboard: Core ها لود نشده‌اند!');
        return;
    }

    // ═══════════════════════════════════════════════════════
    // State
    // ═══════════════════════════════════════════════════════
    const State = {
        stores: [],
        currentStoreId: 0,
        currentRange: 'month',
        charts: {}
    };

    // ═══════════════════════════════════════════════════════
    // Debug
    // ═══════════════════════════════════════════════════════
    function debug(...args) { console.log('🔍 [MyDashboard]', ...args); }
    function debugError(...args) { console.error('❌ [MyDashboard]', ...args); }

    // ═══════════════════════════════════════════════════════
    // DOM
    // ═══════════════════════════════════════════════════════
    const el = {
        storeSelector: document.getElementById('storeSelector'),
        dateRange: document.getElementById('dateRange'),

        kpiTodayIncome: document.getElementById('kpiTodayIncome'),
        kpiMonthIncome: document.getElementById('kpiMonthIncome'),
        kpiTotalIncome: document.getElementById('kpiTotalIncome'),
        kpiTotalOrders: document.getElementById('kpiTotalOrders'),
        kpiPendingOrders: document.getElementById('kpiPendingOrders'),
        kpiActiveProducts: document.getElementById('kpiActiveProducts'),
        kpiTotalColors: document.getElementById('kpiTotalColors'),
        kpiLowStock: document.getElementById('kpiLowStock'),

        salesChart: document.getElementById('salesChart'),
        ordersChart: document.getElementById('ordersChart'),
        monthlyChart: document.getElementById('monthlyChart'),

        recentOrdersBody: document.getElementById('recentOrdersBody'),
        topProductsBody: document.getElementById('topProductsBody'),
        lowStockBody: document.getElementById('lowStockBody'),
        inventoryBody: document.getElementById('inventoryBody'),
        salesByStoreBody: document.getElementById('salesByStoreBody')
    };

    // ═══════════════════════════════════════════════════════
    // Load Stores
    // ═══════════════════════════════════════════════════════
    async function loadStores() {
        try {
            const res = await Http.postSecure('/Auth/GetMyStoreIds');
            if (!res.isSuccess) return false;

            State.stores = JSON.parse(res.data);
            if (!State.stores || State.stores.length === 0) {
                UI.showToast('شما فروشگاهی ندارید', 'warning');
                return false;
            }

            State.currentStoreId = State.stores.length > 1 ? 0 : State.stores[0].StoreId;

            renderStoreSelector();
            return true;
        } catch (err) {
            debugError('loadStores:', err);
            return false;
        }
    }

    function renderStoreSelector() {
        if (!el.storeSelector) return;

        const stores = State.stores;
        const hasMultiple = stores.length > 1;

        let html = '<label><i class="fas fa-store"></i></label>';
        html += '<select id="storeSelect">';

        if (hasMultiple) {
            html += `<option value="0" ${State.currentStoreId === 0 ? 'selected' : ''}>همه فروشگاه‌ها</option>`;
        }

        stores.forEach(store => {
            const selected = (stores.length === 1 || store.StoreId === State.currentStoreId) ? 'selected' : '';
            html += `<option value="${store.StoreId}" ${selected}>${UI.escapeHtml(store.StoreCaption)}</option>`;
        });

        html += '</select>';

        el.storeSelector.innerHTML = html;
        el.storeSelector.style.display = 'flex';

        document.getElementById('storeSelect')?.addEventListener('change', function () {
            State.currentStoreId = parseInt(this.value);
            loadAllData();
        });
    }

    // ═══════════════════════════════════════════════════════
    // Helper — request payload
    // ═══════════════════════════════════════════════════════
    function getPayload() {
        return {
            storeId: State.currentStoreId,
            range: State.currentRange
        };
    }

    // ═══════════════════════════════════════════════════════
    // Load All Data
    // ═══════════════════════════════════════════════════════
    async function loadAllData() {
        await Promise.all([
            loadKpi(),
            loadSalesChart(),
            loadOrdersStatus(),
            loadMonthlyIncome(),
            loadRecentOrders(),
            loadTopProducts(),
            loadLowStock(),
            loadInventory(),
            loadSalesByStore()
        ]);
    }

    function refreshDashboard() {
        loadAllData();
        UI.showToast('داشبورد بروزرسانی شد', 'success');
    }

    // ═══════════════════════════════════════════════════════
    // 1. KPI Cards
    // ═══════════════════════════════════════════════════════
    async function loadKpi() {
        try {
            const res = await Http.postSecure('/MyDashboard/GetKpi', getPayload());
            if (!res.isSuccess) return;

            const data = JSON.parse(res.data);
            const row = Array.isArray(data) ? data[0] : data;

            const formatMoney = (v) => {
                const n = Number(v) || 0;
                if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
                if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
                return n.toLocaleString('fa-IR');
            };

            setText('kpiTodayIncome', formatMoney(row.todayIncome || row.TodayIncome));
            setText('kpiMonthIncome', formatMoney(row.monthIncome || row.MonthIncome));
            setText('kpiTotalIncome', formatMoney(row.totalIncome || row.TotalIncome));
            setText('kpiTotalOrders', row.totalOrders || row.TotalOrders || 0);
            setText('kpiPendingOrders', row.pendingOrders || row.PendingOrders || 0);
            setText('kpiActiveProducts', row.activeProducts || row.ActiveProducts || 0);
            setText('kpiTotalColors', row.totalColors || row.TotalColors || 0);
            setText('kpiLowStock', row.lowStock || row.LowStock || 0);
        } catch (err) {
            debugError('loadKpi:', err);
        }
    }

    function setText(id, value) {
        const elem = document.getElementById(id);
        if (elem) elem.textContent = value;
    }

    // ═══════════════════════════════════════════════════════
    // 2. Sales Chart
    // ═══════════════════════════════════════════════════════
    async function loadSalesChart() {
        try {
            const res = await Http.postSecure('/MyDashboard/GetSalesChart', getPayload());
            if (!res.isSuccess) return;

            const data = JSON.parse(res.data);

            const labels = data.map(d => {
                const date = d.saleDate || d.SaleDate;
                return date ? date.substring(5) : '';
            });
            const values = data.map(d => Number(d.totalAmount || d.TotalAmount) || 0);

            renderLineChart('salesChart', labels, values, '#0f6bff', 'فروش');
        } catch (err) {
            debugError('loadSalesChart:', err);
        }
    }

    // ═══════════════════════════════════════════════════════
    // 3. Orders Status
    // ═══════════════════════════════════════════════════════
    async function loadOrdersStatus() {
        try {
            const res = await Http.postSecure('/MyDashboard/GetOrdersStatus', getPayload());
            if (!res.isSuccess) return;

            const data = JSON.parse(res.data);

            const labels = data.map(d => d.statusCaption || d.StatusCaption || '—');
            const values = data.map(d => Number(d.count || d.Count) || 0);

            renderDoughnutChart('ordersChart', labels, values);
        } catch (err) {
            debugError('loadOrdersStatus:', err);
        }
    }

    // ═══════════════════════════════════════════════════════
    // 4. Monthly Income
    // ═══════════════════════════════════════════════════════
    async function loadMonthlyIncome() {
        try {
            const res = await Http.postSecure('/MyDashboard/GetMonthlyIncome', getPayload());
            if (!res.isSuccess) return;

            const data = JSON.parse(res.data);

            const labels = data.map(d => d.monthName || d.MonthName || '');
            const values = data.map(d => Number(d.totalIncome || d.TotalIncome) || 0);

            renderBarChart('monthlyChart', labels, values);
        } catch (err) {
            debugError('loadMonthlyIncome:', err);
        }
    }

    // ═══════════════════════════════════════════════════════
    // 5. Recent Orders
    // ═══════════════════════════════════════════════════════
    async function loadRecentOrders() {
        try {
            const res = await Http.postSecure('/MyDashboard/GetRecentOrders', getPayload());
            if (!res.isSuccess) return;

            const data = JSON.parse(res.data);

            if (!data || data.length === 0) {
                el.recentOrdersBody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;">سفارشی یافت نشد</td></tr>';
                return;
            }

            const statusMap = {
                2: { text: 'در انتظار', cls: 'pending' },
                3: { text: 'پرداخت', cls: 'processing' },
                4: { text: 'پردازش', cls: 'processing' },
                5: { text: 'ارسال', cls: 'shipped' },
                6: { text: 'پست', cls: 'shipped' },
                7: { text: 'تحویل', cls: 'delivered' }
            };

            el.recentOrdersBody.innerHTML = data.map(o => {
                const level = o.levelOrder || o.LevelOrder || 2;
                const status = statusMap[level] || statusMap[2];
                const amount = Number(o.totalAmount || o.TotalAmount) || 0;

                return `
                    <tr>
                        <td>#${o.recommendationsId || o.RecommendationsId}</td>
                        <td>${UI.escapeHtml(o.customerName || o.CustomerName || '—')}</td>
                        <td>${amount.toLocaleString('fa-IR')} ت</td>
                        <td><span class="status-badge ${status.cls}">${status.text}</span></td>
                        <td>${formatDate(o.dateTimeRecord || o.DateTimeRecord)}</td>
                    </tr>`;
            }).join('');
        } catch (err) {
            debugError('loadRecentOrders:', err);
        }
    }

    // ═══════════════════════════════════════════════════════
    // 6. Top Products
    // ═══════════════════════════════════════════════════════
    async function loadTopProducts() {
        try {
            const res = await Http.postSecure('/MyDashboard/GetTopProducts', getPayload());
            if (!res.isSuccess) return;

            const data = JSON.parse(res.data);

            if (!data || data.length === 0) {
                el.topProductsBody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;">داده‌ای نیست</td></tr>';
                return;
            }

            el.topProductsBody.innerHTML = data.map((p, i) => {
                const name = p.productName || p.ProductName || '—';
                const sold = p.totalSold || p.TotalSold || 0;
                const revenue = Number(p.totalRevenue || p.TotalRevenue) || 0;

                return `
                    <tr>
                        <td><span class="num-badge">${i + 1}</span></td>
                        <td>${UI.escapeHtml(name)}</td>
                        <td>${sold}</td>
                        <td>${revenue.toLocaleString('fa-IR')} ت</td>
                    </tr>`;
            }).join('');
        } catch (err) {
            debugError('loadTopProducts:', err);
        }
    }

    // ═══════════════════════════════════════════════════════
    // 7. Low Stock
    // ═══════════════════════════════════════════════════════
    async function loadLowStock() {
        try {
            const res = await Http.postSecure('/MyDashboard/GetLowStock', getPayload());
            if (!res.isSuccess) return;

            const data = JSON.parse(res.data);

            if (!data || data.length === 0) {
                el.lowStockBody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--success);">موجودی همه محصولات کافی است ✅</td></tr>';
                return;
            }

            el.lowStockBody.innerHTML = data.map(p => {
                const stock = p.stock || p.Stock || 0;
                const price = Number(p.priceProduct || p.PriceProduct) || 0;

                return `
                    <tr>
                        <td>${UI.escapeHtml(p.productName || p.ProductName || '—')}</td>
                        <td>${UI.escapeHtml(p.colorName || p.ColorName || '—')}</td>
                        <td>${UI.escapeHtml(p.storeName || p.StoreName || '—')}</td>
                        <td><span class="status-badge ${stock < 3 ? 'danger' : 'warning'}">${stock}</span></td>
                        <td>${price.toLocaleString('fa-IR')} ت</td>
                    </tr>`;
            }).join('');
        } catch (err) {
            debugError('loadLowStock:', err);
        }
    }

    // ═══════════════════════════════════════════════════════
    // 8. Inventory by Store
    // ═══════════════════════════════════════════════════════
    async function loadInventory() {
        try {
            const res = await Http.postSecure('/MyDashboard/GetInventoryByStore', getPayload());
            if (!res.isSuccess) return;

            const data = JSON.parse(res.data);

            if (!data || data.length === 0) {
                el.inventoryBody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;">داده‌ای نیست</td></tr>';
                return;
            }

            el.inventoryBody.innerHTML = data.map((s, i) => {
                const value = Number(s.inventoryValue || s.InventoryValue) || 0;
                const items = s.totalItems || s.TotalItems || 0;
                const products = s.productCount || s.ProductCount || 0;

                return `
                    <tr>
                        <td>${i + 1}</td>
                        <td>${UI.escapeHtml(s.storeName || s.StoreName || '—')}</td>
                        <td>${products}</td>
                        <td>${items}</td>
                        <td>${value.toLocaleString('fa-IR')} ت</td>
                    </tr>`;
            }).join('');
        } catch (err) {
            debugError('loadInventory:', err);
        }
    }

    // ═══════════════════════════════════════════════════════
    // 9. Sales by Store
    // ═══════════════════════════════════════════════════════
    async function loadSalesByStore() {
        try {
            const res = await Http.postSecure('/MyDashboard/GetSalesByStore', getPayload());
            if (!res.isSuccess) return;

            const data = JSON.parse(res.data);

            if (!data || data.length === 0) {
                el.salesByStoreBody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;">داده‌ای نیست</td></tr>';
                return;
            }

            el.salesByStoreBody.innerHTML = data.map((s, i) => {
                const income = Number(s.totalIncome || s.TotalIncome) || 0;
                const orders = s.orderCount || s.OrderCount || 0;

                return `
                    <tr>
                        <td>${i + 1}</td>
                        <td>${UI.escapeHtml(s.storeName || s.StoreName || '—')}</td>
                        <td><code>${UI.escapeHtml(s.codeStore || s.CodeStore || '—')}</code></td>
                        <td>${orders}</td>
                        <td>${income.toLocaleString('fa-IR')} ت</td>
                    </tr>`;
            }).join('');
        } catch (err) {
            debugError('loadSalesByStore:', err);
        }
    }

    // ═══════════════════════════════════════════════════════
    // Chart Helpers
    // ═══════════════════════════════════════════════════════
    function renderLineChart(canvasId, labels, values, color = '#0f6bff', label = '') {
        const canvas = document.getElementById(canvasId);
        if (!canvas || typeof Chart === 'undefined') return;

        if (State.charts[canvasId]) {
            State.charts[canvasId].destroy();
        }

        State.charts[canvasId] = new Chart(canvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: label,
                    data: values,
                    borderColor: color,
                    backgroundColor: color + '20',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 2,
                    pointRadius: 3,
                    pointBackgroundColor: color
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (v) {
                                if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M';
                                if (v >= 1000) return (v / 1000).toFixed(0) + 'K';
                                return v;
                            }
                        }
                    }
                }
            }
        });
    }

    function renderDoughnutChart(canvasId, labels, values) {
        const canvas = document.getElementById(canvasId);
        if (!canvas || typeof Chart === 'undefined') return;

        if (State.charts[canvasId]) {
            State.charts[canvasId].destroy();
        }

        const colors = ['#f59e0b', '#0f6bff', '#8b5cf6', '#06b6d4', '#10b981', '#ef4444', '#64748b'];

        State.charts[canvasId] = new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors.slice(0, values.length),
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { padding: 12, font: { size: 12 } }
                    }
                }
            }
        });
    }

    function renderBarChart(canvasId, labels, values) {
        const canvas = document.getElementById(canvasId);
        if (!canvas || typeof Chart === 'undefined') return;

        if (State.charts[canvasId]) {
            State.charts[canvasId].destroy();
        }

        State.charts[canvasId] = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'درآمد',
                    data: values,
                    backgroundColor: '#10b981',
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (v) {
                                if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M';
                                if (v >= 1000) return (v / 1000).toFixed(0) + 'K';
                                return v;
                            }
                        }
                    }
                }
            }
        });
    }

    // ═══════════════════════════════════════════════════════
    // Helpers
    // ═══════════════════════════════════════════════════════
    function formatDate(date) {
        if (!date) return '—';
        try {
            const d = new Date(date);
            if (isNaN(d)) return '—';
            return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
        } catch {
            return '—';
        }
    }

    // ═══════════════════════════════════════════════════════
    // Bind Events
    // ═══════════════════════════════════════════════════════
    function bindDateRange() {
        if (!el.dateRange) return;

        el.dateRange.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', function () {
                el.dateRange.querySelectorAll('button').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                State.currentRange = this.dataset.range;
                loadSalesChart();
            });
        });
    }

    // ═══════════════════════════════════════════════════════
    // Exports
    // ═══════════════════════════════════════════════════════
    window.refreshDashboard = refreshDashboard;

    // ═══════════════════════════════════════════════════════
    // Init
    // ═══════════════════════════════════════════════════════
    async function init() {
        debug('شروع Init...');

        bindDateRange();

        const loaded = await loadStores();

        if (!loaded) {
            UI.showToast('شما فروشگاهی ندارید', 'error');
            return;
        }

        await loadAllData();

        debug('Init کامل شد.');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();