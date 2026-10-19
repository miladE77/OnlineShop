using Application.Services;
using Domain.Models;
using Domain.ServiseResult;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Site.Filters;
using System.Data;
using TemplateSite.Filters;

namespace TemplateSite.Controllers.Management
{
    public class FinancialReportsController : Controller
    {
        private readonly IServiceQueryDB _serviceQueryDB;
        private readonly UserManager<Userapp> _userManager;

        private const string PageName = "FinancialReports";

        public FinancialReportsController(
            IServiceQueryDB serviceQueryDB,
            UserManager<Userapp> userManager)
        {
            _serviceQueryDB = serviceQueryDB;
            _userManager = userManager;
        }

        // ═══════════════════════════════════════════════════════
        // صفحه اصلی
        // ═══════════════════════════════════════════════════════
        [CheckAccessView(PageName, "V")]
        public IActionResult Index() => View();

        // ═══════════════════════════════════════════════════════
        // 🔑 Context کاربر
        // ═══════════════════════════════════════════════════════
        private async Task<(int personelId, bool isAdmin, List<int> storeIds)> GetUserContextAsync()
        {
            var appUser = await _userManager.FindByNameAsync(User.Identity.Name);
            if (appUser == null) return (0, false, new List<int>());

            int personelId = appUser.PersonelId;
            bool isAdmin = User.IsInRole("Admin") || User.IsInRole("Administrator") || User.IsInRole("مدیر");

            List<int> storeIds = new List<int>();
            if (isAdmin)
            {
                storeIds = await GetIntListFromDbAsync(
                    "SELECT StoreId FROM Store WHERE Status = 1",
                    Array.Empty<SqlParameter>());
            }
            else if (personelId > 0)
            {
                storeIds = await GetIntListFromDbAsync(
                    "SELECT StoreId FROM Store WHERE PersonelId = @PersonelId AND Status = 1",
                    new[] { new SqlParameter("@PersonelId", SqlDbType.Int) { Value = personelId } });
            }
            return (personelId, isAdmin, storeIds);
        }

        private async Task<List<int>> GetIntListFromDbAsync(string query, SqlParameter[] parameters)
        {
            var result = new List<int>();
            try
            {
                var res = await _serviceQueryDB.GetsTableDataViewByQuery(query, parameters);
                if (res == null || !res.IsSuccess || res.Data == null) return result;
                foreach (DataRow row in res.Data.Rows)
                    if (row[0] != DBNull.Value) result.Add(Convert.ToInt32(row[0]));
            }
            catch { }
            return result;
        }

        // ═══════════════════════════════════════════════════════
        // 🔑 فیلترها
        // ═══════════════════════════════════════════════════════
        private string BuildStoreFilter(List<int> storeIds, string column = "StoreId")
        {
            if (storeIds == null || storeIds.Count == 0) return " AND 1 = 0 ";
            return $" AND {column} IN ({string.Join(",", storeIds)}) ";
        }

        // فیلتر Receipt از طریق Recommendations → PersonelId → Store
        private string BuildReceiptStoreFilter(List<int> storeIds)
        {
            if (storeIds == null || storeIds.Count == 0) return " AND 1 = 0 ";
            return $@" AND RecommendationsId IN (
                SELECT RecommendationsId FROM Recommendations 
                WHERE PersonelId IN (
                    SELECT DISTINCT PersonelId FROM Store WHERE StoreId IN ({string.Join(",", storeIds)})
                )
            ) ";
        }

        // ═══════════════════════════════════════════════════════
        // ۱. KPI کارت‌های اصلی مالی
        // ═══════════════════════════════════════════════════════
        [HttpPost, Route("FinancialReports/GetKpi"), CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetKpi()
        {
            var (_, isAdmin, storeIds) = await GetUserContextAsync();

            if (storeIds.Count == 0 && !isAdmin)
                return await _serviceQueryDB.GetsJsonDataViewByQuery(
                    "SELECT 0 AS TotalIncome, 0 AS TodayIncome, 0 AS MonthIncome, 0 AS YearIncome, 0 AS TotalOrders, 0 AS AvgOrderValue, 0 AS TotalProducts, 0 AS InventoryValue, 0 AS TotalStores",
                    Array.Empty<SqlParameter>());

            string recFilter = BuildReceiptStoreFilter(storeIds);
            string storeFilter = BuildStoreFilter(storeIds);

            string query = $@"
                SELECT 
                    -- کل درآمد
                    (SELECT ISNULL(SUM(ValuePeyment), 0) FROM Receipt 
                     WHERE Status = 1 {recFilter}) AS TotalIncome,

                    -- درآمد امروز
                    (SELECT ISNULL(SUM(ValuePeyment), 0) FROM Receipt 
                     WHERE CAST(DateTimePeyment AS DATE) = CAST(GETDATE() AS DATE)
                       AND Status = 1 {recFilter}) AS TodayIncome,

                    -- درآمد این ماه
                    (SELECT ISNULL(SUM(ValuePeyment), 0) FROM Receipt 
                     WHERE MONTH(DateTimePeyment) = MONTH(GETDATE()) 
                       AND YEAR(DateTimePeyment) = YEAR(GETDATE())
                       AND Status = 1 {recFilter}) AS MonthIncome,

                    -- درآمد امسال
                    (SELECT ISNULL(SUM(ValuePeyment), 0) FROM Receipt 
                     WHERE YEAR(DateTimePeyment) = YEAR(GETDATE())
                       AND Status = 1 {recFilter}) AS YearIncome,

                    -- تعداد سفارشات
                    (SELECT COUNT(*) FROM Recommendations WHERE Status = 1 
                     AND PersonelId IN (SELECT DISTINCT PersonelId FROM Store WHERE StoreId IN 
                        (SELECT StoreId FROM Store WHERE 1=1 {storeFilter.Replace("StoreId", "StoreId")}))) AS TotalOrders,

                    -- میانگین سفارش
                    (SELECT ISNULL(AVG(ValuePeyment), 0) FROM Receipt 
                     WHERE Status = 1 {recFilter}) AS AvgOrderValue,

                    -- تعداد محصولات
                    (SELECT COUNT(*) FROM Product WHERE Status = 1 {storeFilter}) AS TotalProducts,

                    -- ارزش موجودی انبار
                    (SELECT ISNULL(SUM(cpp.InStore * cpp.PriceProduct), 0) 
                     FROM ColorPriceProduct cpp
                     INNER JOIN Product p ON cpp.ProductId = p.ProductId
                     WHERE cpp.Status = 1 AND p.Status = 1 
                       {BuildStoreFilter(storeIds, "p.StoreId")}) AS InventoryValue,

                    -- تعداد فروشگاه‌ها
                    {(isAdmin
                        ? "(SELECT COUNT(*) FROM Store WHERE Status = 1) AS TotalStores"
                        : $"(SELECT COUNT(*) FROM Store WHERE Status = 1 AND StoreId IN ({string.Join(",", storeIds)})) AS TotalStores")}
            ";

            return await _serviceQueryDB.GetsJsonDataViewByQuery(query, Array.Empty<SqlParameter>());
        }

        // ═══════════════════════════════════════════════════════
        // ۲. نمودار درآمد ماهانه (۱۲ ماه سال جاری)
        // ═══════════════════════════════════════════════════════
        [HttpPost, Route("FinancialReports/GetMonthlyIncome"), CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetMonthlyIncome()
        {
            var (_, isAdmin, storeIds) = await GetUserContextAsync();
            string recFilter = BuildReceiptStoreFilter(storeIds);

            string query = $@"
                SELECT 
                    MONTH(DateTimePeyment) AS MonthNum,
                    DATENAME(MONTH, DateTimePeyment) AS MonthName,
                    SUM(ValuePeyment) AS TotalIncome,
                    COUNT(*) AS OrderCount
                FROM Receipt
                WHERE YEAR(DateTimePeyment) = YEAR(GETDATE())
                  AND Status = 1 {recFilter}
                GROUP BY MONTH(DateTimePeyment), DATENAME(MONTH, DateTimePeyment)
                ORDER BY MONTH(DateTimePeyment)
            ";

            return await _serviceQueryDB.GetsJsonDataViewByQuery(query, Array.Empty<SqlParameter>());
        }

        // ═══════════════════════════════════════════════════════
        // ۳. نمودار درآمد روزانه ۳۰ روز اخیر
        // ═══════════════════════════════════════════════════════
        [HttpPost, Route("FinancialReports/GetDailyIncome"), CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetDailyIncome()
        {
            var (_, _, storeIds) = await GetUserContextAsync();
            string recFilter = BuildReceiptStoreFilter(storeIds);

            string query = $@"
                SELECT 
                    CONVERT(varchar(10), CAST(DateTimePeyment AS DATE), 120) AS IncomeDate,
                    SUM(ValuePeyment) AS TotalIncome,
                    COUNT(*) AS OrderCount
                FROM Receipt
                WHERE DateTimePeyment >= DATEADD(DAY, -30, GETDATE())
                  AND Status = 1 {recFilter}
                GROUP BY CAST(DateTimePeyment AS DATE)
                ORDER BY CAST(DateTimePeyment AS DATE)
            ";

            return await _serviceQueryDB.GetsJsonDataViewByQuery(query, Array.Empty<SqlParameter>());
        }

        // ═══════════════════════════════════════════════════════
        // ۴. درآمد بر اساس نوع پرداخت
        // ═══════════════════════════════════════════════════════
        [HttpPost, Route("FinancialReports/GetIncomeByTypePeyment"), CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetIncomeByTypePeyment()
        {
            var (_, _, storeIds) = await GetUserContextAsync();
            string recFilter = BuildReceiptStoreFilter(storeIds);

            string query = $@"
                SELECT 
                    ISNULL(tp.Caption, N'نامشخص') AS PeymentType,
                    SUM(r.ValuePeyment) AS TotalIncome,
                    COUNT(*) AS OrderCount
                FROM Receipt r
                LEFT JOIN TypePeyment tp ON r.TypePeymentId = tp.TypePeymentId
                WHERE r.Status = 1 {recFilter}
                GROUP BY tp.Caption
                ORDER BY TotalIncome DESC
            ";

            return await _serviceQueryDB.GetsJsonDataViewByQuery(query, Array.Empty<SqlParameter>());
        }

        // ═══════════════════════════════════════════════════════
        // ۵. ارزش موجودی انبار بر اساس فروشگاه
        // ═══════════════════════════════════════════════════════
        [HttpPost, Route("FinancialReports/GetInventoryValueByStore"), CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetInventoryValueByStore()
        {
            var (_, isAdmin, storeIds) = await GetUserContextAsync();

            string storeFilter = isAdmin
                ? " WHERE s.Status = 1 "
                : storeIds.Count > 0
                    ? $" WHERE s.Status = 1 AND s.StoreId IN ({string.Join(",", storeIds)}) "
                    : " WHERE 1 = 0 ";

            string query = $@"
                SELECT 
                    s.StoreId,
                    s.Caption AS StoreName,
                    ISNULL(SUM(cpp.InStore * cpp.PriceProduct), 0) AS InventoryValue,
                    ISNULL(SUM(cpp.InStore), 0) AS TotalItems,
                    COUNT(DISTINCT p.ProductId) AS ProductCount
                FROM Store s
                LEFT JOIN Product p ON p.StoreId = s.StoreId AND p.Status = 1
                LEFT JOIN ColorPriceProduct cpp ON cpp.ProductId = p.ProductId AND cpp.Status = 1
                {storeFilter}
                GROUP BY s.StoreId, s.Caption
                ORDER BY InventoryValue DESC
            ";

            return await _serviceQueryDB.GetsJsonDataViewByQuery(query, Array.Empty<SqlParameter>());
        }

        // ═══════════════════════════════════════════════════════
        // ۶. محصولات پرفروش (بر اساس درآمد)
        // ═══════════════════════════════════════════════════════
        [HttpPost, Route("FinancialReports/GetTopSellingProducts"), CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetTopSellingProducts()
        {
            var (_, _, storeIds) = await GetUserContextAsync();
            string storeFilter = BuildStoreFilter(storeIds, "p.StoreId");

            string query = $@"
                SELECT TOP 10
                    p.ProductId,
                    p.Caption AS ProductName,
                    SUM(o.NumberProduct) AS TotalSold,
                    SUM(o.NumberProduct * cpp.PriceProduct) AS TotalRevenue,
                    AVG(cpp.PriceProduct) AS AvgPrice
                FROM [Order] o
                INNER JOIN ColorPriceProduct cpp ON o.ColorPriceProductId = cpp.ColorPriceProductId
                INNER JOIN Product p ON cpp.ProductId = p.ProductId
                WHERE o.Status = 1 {storeFilter}
                GROUP BY p.ProductId, p.Caption
                ORDER BY TotalRevenue DESC
            ";

            return await _serviceQueryDB.GetsJsonDataViewByQuery(query, Array.Empty<SqlParameter>());
        }

        // ═══════════════════════════════════════════════════════
        // ۷. مشتریان برتر (بر اساس مبلغ خرید)
        // ═══════════════════════════════════════════════════════
        [HttpPost, Route("FinancialReports/GetTopCustomers"), CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetTopCustomers()
        {
            var (_, _, storeIds) = await GetUserContextAsync();

            string filter = storeIds.Count > 0
                ? $@" AND r.PersonelId IN (
                        SELECT DISTINCT PersonelId FROM Store WHERE StoreId IN ({string.Join(",", storeIds)})
                     ) "
                : " AND 1 = 0 ";

            string query = $@"
                SELECT TOP 10
                    p.PersonelId,
                    p.FirstName + ' ' + p.LastName AS CustomerName,
                    COUNT(DISTINCT r.RecommendationsId) AS OrderCount,
                    ISNULL(SUM(rec.ValuePeyment), 0) AS TotalSpent,
                    MAX(rec.DateTimePeyment) AS LastOrderDate
                FROM Recommendations r
                INNER JOIN Personel p ON r.PersonelId = p.PersonelId
                LEFT JOIN Receipt rec ON rec.RecommendationsId = r.RecommendationsId AND rec.Status = 1
                WHERE r.Status = 1 {filter}
                GROUP BY p.PersonelId, p.FirstName, p.LastName
                ORDER BY TotalSpent DESC
            ";

            return await _serviceQueryDB.GetsJsonDataViewByQuery(query, Array.Empty<SqlParameter>());
        }

        // ═══════════════════════════════════════════════════════
        // ۸. سفارشات در انتظار پرداخت (Receipt ندارن یا Status=0)
        // ═══════════════════════════════════════════════════════
        [HttpPost, Route("FinancialReports/GetPendingPayments"), CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetPendingPayments()
        {
            var (_, _, storeIds) = await GetUserContextAsync();

            string filter = storeIds.Count > 0
                ? $@" AND r.PersonelId IN (
                        SELECT DISTINCT PersonelId FROM Store WHERE StoreId IN ({string.Join(",", storeIds)})
                     ) "
                : " AND 1 = 0 ";

            string query = $@"
                SELECT TOP 20
                    r.RecommendationsId,
                    r.RecommendationsCaption AS OrderTitle,
                    ISNULL(p.FirstName + ' ' + p.LastName, N'مهمان') AS CustomerName,
                    r.LevelOrder,
                    r.DateTimeRecord AS OrderDate,
                    ISNULL(rec.ValuePeyment, 0) AS ExpectedAmount,
                    CASE WHEN rec.ReceiptId IS NULL THEN N'بدون رسید' ELSE N'در انتظار تایید' END AS StatusText
                FROM Recommendations r
                LEFT JOIN Personel p ON r.PersonelId = p.PersonelId
                LEFT JOIN Receipt rec ON rec.RecommendationsId = r.RecommendationsId
                WHERE r.Status = 1 
                  AND (rec.ReceiptId IS NULL OR rec.Status = 0)
                  {filter}
                ORDER BY r.DateTimeRecord DESC
            ";

            return await _serviceQueryDB.GetsJsonDataViewByQuery(query, Array.Empty<SqlParameter>());
        }

        // ═══════════════════════════════════════════════════════
        // ۹. گزارش فروش به تفکیک فروشگاه
        // ═══════════════════════════════════════════════════════
        [HttpPost, Route("FinancialReports/GetSalesByStore"), CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetSalesByStore()
        {
            var (_, isAdmin, storeIds) = await GetUserContextAsync();

            string filter = isAdmin
                ? " WHERE s.Status = 1 "
                : storeIds.Count > 0
                    ? $" WHERE s.Status = 1 AND s.StoreId IN ({string.Join(",", storeIds)}) "
                    : " WHERE 1 = 0 ";

            string query = $@"
                SELECT 
                    s.StoreId,
                    s.Caption AS StoreName,
                    s.CodeStore,
                    ISNULL(SUM(rc.ValuePeyment), 0) AS TotalIncome,
                    COUNT(DISTINCT r.RecommendationsId) AS OrderCount
                FROM Store s
                LEFT JOIN Personel p ON s.PersonelId = p.PersonelId
                LEFT JOIN Recommendations r ON r.PersonelId = p.PersonelId AND r.Status = 1
                LEFT JOIN Receipt rc ON rc.RecommendationsId = r.RecommendationsId AND rc.Status = 1
                {filter}
                GROUP BY s.StoreId, s.Caption, s.CodeStore
                ORDER BY TotalIncome DESC
            ";

            return await _serviceQueryDB.GetsJsonDataViewByQuery(query, Array.Empty<SqlParameter>());
        }

        // ═══════════════════════════════════════════════════════
        // ۱۰. مالیات و سود تخمینی
        // ═══════════════════════════════════════════════════════
        [HttpPost, Route("FinancialReports/GetProfitReport"), CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetProfitReport()
        {
            var (_, _, storeIds) = await GetUserContextAsync();
            string recFilter = BuildReceiptStoreFilter(storeIds);

            // فرض: قیمت خرید = 70% قیمت فروش (قابل تنظیم در AppSetting)
            string query = $@"
                SELECT 
                    (SELECT ISNULL(SUM(ValuePeyment), 0) FROM Receipt 
                     WHERE Status = 1 {recFilter}) AS TotalRevenue,

                    -- تخمین هزینه (۷۰٪ درآمد)
                    (SELECT ISNULL(SUM(ValuePeyment * 0.7), 0) FROM Receipt 
                     WHERE Status = 1 {recFilter}) AS EstimatedCost,

                    -- سود تخمینی
                    (SELECT ISNULL(SUM(ValuePeyment * 0.3), 0) FROM Receipt 
                     WHERE Status = 1 {recFilter}) AS EstimatedProfit,

                    -- مالیات (۹٪)
                    (SELECT ISNULL(SUM(ValuePeyment * 0.09), 0) FROM Receipt 
                     WHERE Status = 1 {recFilter}) AS EstimatedTax
            ";

            return await _serviceQueryDB.GetsJsonDataViewByQuery(query, Array.Empty<SqlParameter>());
        }

        // ═══════════════════════════════════════════════════════
        // ۱۱. مقایسه ماه جاری با ماه قبل
        // ═══════════════════════════════════════════════════════
        [HttpPost, Route("FinancialReports/GetMonthComparison"), CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetMonthComparison()
        {
            var (_, _, storeIds) = await GetUserContextAsync();
            string recFilter = BuildReceiptStoreFilter(storeIds);

            string query = $@"
                SELECT 
                    (SELECT ISNULL(SUM(ValuePeyment), 0) FROM Receipt 
                     WHERE MONTH(DateTimePeyment) = MONTH(GETDATE())
                       AND YEAR(DateTimePeyment) = YEAR(GETDATE())
                       AND Status = 1 {recFilter}) AS ThisMonth,

                    (SELECT ISNULL(SUM(ValuePeyment), 0) FROM Receipt 
                     WHERE MONTH(DateTimePeyment) = MONTH(DATEADD(MONTH, -1, GETDATE()))
                       AND YEAR(DateTimePeyment) = YEAR(DATEADD(MONTH, -1, GETDATE()))
                       AND Status = 1 {recFilter}) AS LastMonth,

                    (SELECT COUNT(*) FROM Receipt 
                     WHERE MONTH(DateTimePeyment) = MONTH(GETDATE())
                       AND YEAR(DateTimePeyment) = YEAR(GETDATE())
                       AND Status = 1 {recFilter}) AS ThisMonthOrders,

                    (SELECT COUNT(*) FROM Receipt 
                     WHERE MONTH(DateTimePeyment) = MONTH(DATEADD(MONTH, -1, GETDATE()))
                       AND YEAR(DateTimePeyment) = YEAR(DATEADD(MONTH, -1, GETDATE()))
                       AND Status = 1 {recFilter}) AS LastMonthOrders
            ";

            return await _serviceQueryDB.GetsJsonDataViewByQuery(query, Array.Empty<SqlParameter>());
        }

        // ═══════════════════════════════════════════════════════
        // ۱۲. محصولات راکد (بدون فروش)
        // ═══════════════════════════════════════════════════════
        [HttpPost, Route("FinancialReports/GetSlowMovingProducts"), CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetSlowMovingProducts()
        {
            var (_, _, storeIds) = await GetUserContextAsync();
            string storeFilter = BuildStoreFilter(storeIds, "p.StoreId");

            string query = $@"
                SELECT TOP 15
                    p.ProductId,
                    p.Caption AS ProductName,
                    s.Caption AS StoreName,
                    (SELECT ISNULL(SUM(cpp.InStore), 0) 
                     FROM ColorPriceProduct cpp 
                     WHERE cpp.ProductId = p.ProductId AND cpp.Status = 1) AS CurrentStock,
                    (SELECT ISNULL(SUM(o.NumberProduct), 0) 
                     FROM [Order] o 
                     INNER JOIN ColorPriceProduct cpp2 ON o.ColorPriceProductId = cpp2.ColorPriceProductId
                     WHERE cpp2.ProductId = p.ProductId 
                       AND o.Status = 1
                       AND o.OrderId NOT IN (
                           SELECT o2.OrderId FROM [Order] o2 
                           WHERE o2.OrderId = o.OrderId 
                             AND EXISTS (
                                SELECT 1 FROM Recommendations r 
                                WHERE r.RecommendationsId = o2.RecommendationsId 
                                  AND r.DateTimeRecord >= DATEADD(DAY, -30, GETDATE())
                             )
                       )
                    ) AS SoldLast30Days
                FROM Product p
                INNER JOIN Store s ON p.StoreId = s.StoreId
                WHERE p.Status = 1 {storeFilter}
                ORDER BY SoldLast30Days ASC, CurrentStock DESC
            ";

            return await _serviceQueryDB.GetsJsonDataViewByQuery(query, Array.Empty<SqlParameter>());
        }

        // ═══════════════════════════════════════════════════════
        // ۱۳. پیش‌بینی فروش (میانگین ۳۰ روز اخیر × ۳۰)
        // ═══════════════════════════════════════════════════════
        [HttpPost, Route("FinancialReports/GetSalesForecast"), CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetSalesForecast()
        {
            var (_, _, storeIds) = await GetUserContextAsync();
            string recFilter = BuildReceiptStoreFilter(storeIds);

            string query = $@"
                SELECT 
                    (SELECT ISNULL(SUM(ValuePeyment), 0) FROM Receipt 
                     WHERE DateTimePeyment >= DATEADD(DAY, -30, GETDATE())
                       AND Status = 1 {recFilter}) AS Last30Days,

                    (SELECT ISNULL(SUM(ValuePeyment), 0) FROM Receipt 
                     WHERE DateTimePeyment >= DATEADD(DAY, -60, GETDATE())
                       AND DateTimePeyment < DATEADD(DAY, -30, GETDATE())
                       AND Status = 1 {recFilter}) AS Previous30Days,

                    (SELECT ISNULL(AVG(ValuePeyment), 0) FROM Receipt 
                     WHERE DateTimePeyment >= DATEADD(DAY, -30, GETDATE())
                       AND Status = 1 {recFilter}) AS AvgOrderValue,

                    (SELECT ISNULL(COUNT(*) * 1.0, 0) FROM Receipt 
                     WHERE DateTimePeyment >= DATEADD(DAY, -30, GETDATE())
                       AND Status = 1 {recFilter}) AS OrdersLast30Days
            ";

            return await _serviceQueryDB.GetsJsonDataViewByQuery(query, Array.Empty<SqlParameter>());
        }
    }
}