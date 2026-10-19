
// ═══════════════════════════════════════════════════════
// ۱. نمودار خطی/ناحیه‌ای (فروش)
// ═══════════════════════════════════════════════════════
function renderSalesChart(data) {
    const container = document.getElementById('salesChart');
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

    // استخراج داده‌ها
    const points = data.map(d => ({
        label: formatDateShort(d.saleDate || d.SaleDate),
        value: Number(d.totalAmount || d.TotalAmount || 0)
    }));

    const maxVal = Math.max(...points.map(p => p.value), 1);
    const stepX = points.length > 1 ? innerW / (points.length - 1) : innerW;

    // مختصات نقاط
    const coords = points.map((p, i) => ({
        x: padding.left + i * stepX,
        y: padding.top + innerH - (p.value / maxVal) * innerH,
        ...p
    }));

    // مسیر خط
    let linePath = '';
    let areaPath = '';

    if (coords.length > 0) {
        linePath = `M ${coords[0].x} ${coords[0].y}`;
        for (let i = 1; i < coords.length; i++) {
            const prev = coords[i - 1];
            const curr = coords[i];
            // منحنی نرم (Catmull-Rom ساده‌شده)
            const cpX = (prev.x + curr.x) / 2;
            linePath += ` C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
        }

        areaPath = linePath +
            ` L ${coords[coords.length - 1].x} ${padding.top + innerH}` +
            ` L ${coords[0].x} ${padding.top + innerH} Z`;
    }

    // خطوط افقی راهنما
    let gridLines = '';
    const gridCount = 4;
    for (let i = 0; i <= gridCount; i++) {
        const y = padding.top + (innerH / gridCount) * i;
        const value = maxVal - (maxVal / gridCount) * i;
        gridLines += `
            <line x1="${padding.left}" y1="${y}" 
                  x2="${width - padding.right}" y2="${y}" 
                  stroke="#e2e8f0" stroke-width="1" stroke-dasharray="3,3"/>
            <text x="${padding.left - 8}" y="${y + 4}" 
                  text-anchor="end" font-size="10" fill="#94a3b8"
                  direction="ltr">${formatMoneyShort(value)}</text>
        `;
    }

    // نقاط روی نمودار (نمایش در Tooltip)
    let dots = '';
    coords.forEach((c, i) => {
        // فقط نقاط با فاصله (برای شلوغ نشدن)
        const showDot = coords.length <= 15 || i % Math.ceil(coords.length / 10) === 0 || i === coords.length - 1;
        if (showDot) {
            dots += `
                <circle cx="${c.x}" cy="${c.y}" r="4" 
                        fill="#fff" stroke="#0f6bff" stroke-width="2"
                        class="chart-dot" data-index="${i}">
                    <title>${c.label}: ${formatMoney(c.value)}</title>
                </circle>
            `;
        }
    });

    // برچسب‌های محور X
    let xLabels = '';
    coords.forEach((c, i) => {
        const showLabel = coords.length <= 10 ||
            i % Math.ceil(coords.length / 6) === 0 ||
            i === coords.length - 1;
        if (showLabel) {
            xLabels += `<text x="${c.x}" y="${height - 12}" 
                              text-anchor="middle" font-size="10" fill="#94a3b8"
                              direction="ltr">${c.label}</text>`;
        }
    });

    const svg = `
        <svg viewBox="0 0 ${width} ${height}" 
             preserveAspectRatio="xMidYMid meet"
             class="chart-svg" style="width:100%;height:280px;display:block;">
            <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#0f6bff" stop-opacity="0.25"/>
                    <stop offset="100%" stop-color="#0f6bff" stop-opacity="0.02"/>
                </linearGradient>
            </defs>

            ${gridLines}

            <path d="${areaPath}" fill="url(#salesGradient)"/>
            <path d="${linePath}" fill="none" stroke="#0f6bff" stroke-width="2.5" 
                  stroke-linecap="round" stroke-linejoin="round"/>

            ${dots}
            ${xLabels}
        </svg>
    `;

    container.innerHTML = svg;
}

// ═══════════════════════════════════════════════════════
// ۲. نمودار دونات (وضعیت سفارشات)
// ═══════════════════════════════════════════════════════
function renderOrdersChart(data) {
    const container = document.getElementById('ordersChart');
    if (!container) return;

    if (!data || data.length === 0) {
        container.innerHTML = '<div class="chart-empty">داده‌ای برای نمایش نیست</div>';
        return;
    }

    const items = data.map(d => ({
        label: d.statusCaption || d.StatusCaption || '—',
        value: Number(d.count || d.Count || 0)
    }));

    const total = items.reduce((s, i) => s + i.value, 0);
    if (total === 0) {
        container.innerHTML = '<div class="chart-empty">داده‌ای برای نمایش نیست</div>';
        return;
    }

    const colors = ['#f59e0b', '#0f6bff', '#8b5cf6', '#06b6d4', '#10b981', '#ef4444', '#64748b'];

    const size = 240;
    const radius = 90;
    const strokeWidth = 32;
    const center = size / 2;
    const circumference = 2 * Math.PI * radius;

    let offset = 0;
    let arcs = '';

    items.forEach((item, i) => {
        const percent = item.value / total;
        const dash = circumference * percent;
        const color = colors[i % colors.length];

        arcs += `
            <circle cx="${center}" cy="${center}" r="${radius}"
                    fill="none" stroke="${color}" stroke-width="${strokeWidth}"
                    stroke-dasharray="${dash} ${circumference - dash}"
                    stroke-dashoffset="${-offset}"
                    transform="rotate(-90 ${center} ${center})"
                    class="chart-arc">
                <title>${item.label}: ${item.value} (${(percent * 100).toFixed(1)}%)</title>
            </circle>
        `;

        offset += dash;
    });

    // Legend
    let legend = '<div class="chart-legend">';
    items.forEach((item, i) => {
        const color = colors[i % colors.length];
        const percent = ((item.value / total) * 100).toFixed(1);
        legend += `
            <div class="chart-legend-item">
                <span class="legend-color" style="background:${color}"></span>
                <span class="legend-label">${item.label}</span>
                <span class="legend-value">${item.value} (${percent}%)</span>
            </div>
        `;
    });
    legend += '</div>';

    const svg = `
        <div class="donut-wrapper">
            <svg viewBox="0 0 ${size} ${size}" 
                 class="donut-svg" style="width:240px;height:240px;">
                <circle cx="${center}" cy="${center}" r="${radius}"
                        fill="none" stroke="#f1f5f9" stroke-width="${strokeWidth}"/>
                ${arcs}
                <text x="${center}" y="${center - 5}" 
                      text-anchor="middle" font-size="24" font-weight="800" 
                      fill="#1e2a3a">${total}</text>
                <text x="${center}" y="${center + 15}" 
                      text-anchor="middle" font-size="11" 
                      fill="#94a3b8">سفارش</text>
            </svg>
            ${legend}
        </div>
    `;

    container.innerHTML = svg;
}

// ═══════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════
function formatDateShort(d) {
    if (!d) return '';
    const s = String(d);
    // اگه ISO بود → yyyy-MM-dd
    if (s.includes('T')) {
        return s.split('T')[0].substring(5); // MM-dd
    }
    return s.substring(5); // MM-dd
}

function formatMoneyShort(v) {
    const n = Number(v) || 0;
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
    return n.toString();
}