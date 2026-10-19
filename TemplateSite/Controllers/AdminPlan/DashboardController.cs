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
    public class DashboardController : Controller
    {
        private readonly IServiceQueryDB _serviceQueryDB;
        private readonly UserManager<Userapp> _userManager;

        private const string PageName = "Dashboard";

        public DashboardController(
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
        public IActionResult Index()
        {
            return View();
        }

        // ═══════════════════════════════════════════════════════
        // 🔑 گرفتن PersonelId + StoreIds مجاز
        // ═══════════════════════════════════════════════════════
        private async Task<(int personelId, bool isAdmin, List<int> storeIds)> GetUserContextAsync()
        {
            var appUser = await _userManager.FindByNameAsync(User.Identity.Name);
            if (appUser == null)
                return (0, false, new List<int>());

            int personelId = appUser.PersonelId;

            bool isAdmin = User.IsInRole("Admin")
                        || User.IsInRole("Administrator")
                        || User.IsInRole("مدیر");

            List<int> storeIds = new List<int>();

            if (isAdmin)
            {
                storeIds = await GetStoreIdsFromDb(
                    "SELECT StoreId FROM Store WHERE Status = 1",
                    Array.Empty<SqlParameter>());
            }
            else if (personelId > 0)
            {
                storeIds = await GetStoreIdsFromDb(
                    "SELECT StoreId FROM Store WHERE PersonelId = @PersonelId AND Status = 1",
                    new[] { new SqlParameter("@PersonelId", SqlDbType.Int) { Value = personelId } });
            }

            return (personelId, isAdmin, storeIds);
        }

        // ═══════════════════════════════════════════════════════
        // 🔑 استخراج StoreIds
        // ═══════════════════════════════════════════════════════
        private async Task<List<int>> GetStoreIdsFromDb(string query, SqlParameter[] parameters)
        {
            var result = new List<int>();
            try
            {
                var res = await _serviceQueryDB.GetsTableDataViewByQuery(query, parameters);
                if (res == null || !res.IsSuccess || res.Data.Rows.Count == 0)
                    return result;

                var dt = res.Data;
                if (dt == null || dt.Rows.Count == 0)
                    return result;

                foreach (DataRow row in dt.Rows)
                {
                    if (row[0] != DBNull.Value)
                        result.Add(Convert.ToInt32(row[0]));
                }
            }
            catch { }
            return result;
        }

        // ═══════════════════════════════════════════════════════
        // 🔑 ساخت فیلتر برای جداول مختلف
        // ═══════════════════════════════════════════════════════

        // فیلتر مستقیم StoreId (Product, ContactUs, Store)
        private string BuildDirectStoreFilter(List<int> storeIds, string column = "StoreId")
        {
            if (storeIds == null || storeIds.Count == 0)
                return " AND 1 = 0 ";
            return $" AND {column} IN ({string.Join(",", storeIds)}) ";
        }

        // فیلتر از طریق PersonelId (Recommendations, SystemAct)
        // Store.PersonelId IN (SELECT PersonelId FROM Store WHERE StoreId IN (...))
        private string BuildPersonelStoreFilter(List<int> storeIds, string personelColumn = "PersonelId")
        {
            if (storeIds == null || storeIds.Count == 0)
                return " AND 1 = 0 ";
            return $@" AND {personelColumn} IN (
                SELECT DISTINCT PersonelId FROM Store WHERE StoreId IN ({string.Join(",", storeIds)})
            ) ";
        }

        // ═══════════════════════════════════════════════════════
        // ۸ کارت KPI
        // ═══════════════════════════════════════════════════════
        [HttpPost, Route("Dashboard/GetKpiCards"), CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetKpiCards()
        {
            var (personelId, isAdmin, allowedStoreIds) = await GetUserContextAsync();

            if (allowedStoreIds.Count == 0 && !isAdmin)
            {
                return await _serviceQueryDB.GetsJsonDataViewByQuery(
                    "SELECT 0 AS TodaySales, 0 AS MonthSales, 0 AS PendingOrders, 0 AS ActiveProducts, 0 AS NewMessages, 0 AS TotalPersonels, 0 AS TotalStores, 0 AS LowStock, 0 AS ActiveUsers",
                    Array.Empty<SqlParameter>());
            }

            // فیلترها
            string storeFilterProduct = BuildDirectStoreFilter(allowedStoreIds, "StoreId");
            string storeFilterContact = BuildDirectStoreFilter(allowedStoreIds, "StoreId");
            string storeFilterRecm = BuildPersonelStoreFilter(allowedStoreIds, "PersonelId");

            // فیلتر Receipt: از طریق Recommendations → PersonelId
            string storeFilterReceipt = allowedStoreIds.Count > 0
                ? $@" AND RecommendationsId IN (
                        SELECT RecommendationsId FROM Recommendations 
                        WHERE PersonelId IN (
                            SELECT DISTINCT PersonelId FROM Store WHERE StoreId IN ({string.Join(",", allowedStoreIds)})
                        )
                     ) "
                : " AND 1 = 0 ";

            string storeFilterColor = allowedStoreIds.Count > 0
                ? $@" AND ProductId IN (
                        SELECT ProductId FROM Product WHERE StoreId IN ({string.Join(",", allowedStoreIds)})
                     ) "
                : " AND 1 = 0 ";

            string query = $@"
                SELECT 
                    -- فروش امروز
                    (SELECT ISNULL(SUM(ValuePeyment), 0) FROM Receipt 
                     WHERE CAST(DateTimePeyment AS DATE) = CAST(GETDATE() AS DATE)
                       AND Status = 1 {storeFilterReceipt}) AS TodaySales,

                    -- فروش ۳۰ روز
                    (SELECT ISNULL(SUM(ValuePeyment), 0) FROM Receipt 
                     WHERE DateTimePeyment >= DATEADD(DAY, -30, GETDATE())
                       AND Status = 1 {storeFilterReceipt}) AS MonthSales,

                    -- سفارشات در انتظار
                    (SELECT COUNT(*) FROM Recommendations 
                     WHERE LevelOrder = 2 AND Status = 1 {storeFilterRecm}) AS PendingOrders,

                    -- محصولات فعال
                    (SELECT COUNT(*) FROM Product 
                     WHERE Status = 1 {storeFilterProduct}) AS ActiveProducts,

                    -- پیام‌های جدید
                    (SELECT COUNT(*) FROM ContactUs 
                     WHERE Condetion = 0 AND Status = 1 {storeFilterContact}) AS NewMessages,

                    -- پرسنل
                    {(isAdmin
                        ? "(SELECT COUNT(*) FROM Personel WHERE Status = 1) AS TotalPersonels,"
                        : $@"(SELECT COUNT(DISTINCT PersonelId) FROM Store 
                              WHERE Status = 1 AND StoreId IN ({string.Join(",", allowedStoreIds)})) AS TotalPersonels,")}

                    -- فروشگاه‌ها
                    {(isAdmin
                        ? "(SELECT COUNT(*) FROM Store WHERE Status = 1) AS TotalStores,"
                        : $"(SELECT COUNT(*) FROM Store WHERE Status = 1 AND StoreId IN ({string.Join(",", allowedStoreIds)})) AS TotalStores,")}

                    -- موجودی کم
                    (SELECT COUNT(*) FROM ColorPriceProduct 
                     WHERE InStore < 5 AND Status = 1 {storeFilterColor}) AS LowStock,

                    -- کاربران فعال
                    (SELECT COUNT(*) FROM Userapp WHERE Active = 1) AS ActiveUsers
            ";

            return await _serviceQueryDB.GetsJsonDataViewByQuery(query, Array.Empty<SqlParameter>());
        }

        // ═══════════════════════════════════════════════════════
        // نمودار فروش
        // ═══════════════════════════════════════════════════════
        [HttpPost, Route("Dashboard/GetSalesChart"), CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetSalesChart(string range = "month")
        {
            var (_, _, allowedStoreIds) = await GetUserContextAsync();

            string storeFilterReceipt = allowedStoreIds.Count > 0
                ? $@" AND RecommendationsId IN (
                        SELECT RecommendationsId FROM Recommendations 
                        WHERE PersonelId IN (
                            SELECT DISTINCT PersonelId FROM Store WHERE StoreId IN ({string.Join(",", allowedStoreIds)})
                        )
                     ) "
                : " AND 1 = 0 ";

            int days = range switch
            {
                "today" => 1,
                "week" => 7,
                "month" => 30,
                "year" => 365,
                _ => 30
            };

            string query = $@"
                SELECT 
                    CONVERT(varchar(10), CAST(DateTimePeyment AS DATE), 120) AS SaleDate,
                    SUM(ValuePeyment) AS TotalAmount,
                    COUNT(*) AS OrderCount
                FROM Receipt
                WHERE DateTimePeyment >= DATEADD(DAY, -{days}, GETDATE())
                  AND Status = 1
                  {storeFilterReceipt}
                GROUP BY CAST(DateTimePeyment AS DATE)
                ORDER BY CAST(DateTimePeyment AS DATE)
            ";

            return await _serviceQueryDB.GetsJsonDataViewByQuery(query, Array.Empty<SqlParameter>());
        }

        // ═══════════════════════════════════════════════════════
        // نمودار وضعیت سفارشات
        // ═══════════════════════════════════════════════════════
        [HttpPost, Route("Dashboard/GetOrdersStatusChart"), CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetOrdersStatusChart()
        {
            var (_, _, allowedStoreIds) = await GetUserContextAsync();
            string storeFilterRecm = BuildPersonelStoreFilter(allowedStoreIds, "PersonelId");

            string query = $@"
                SELECT 
                    LevelOrder,
                    CASE LevelOrder
                        
2 THEN N'در انتظار تایید'
                        WHEN 3 THEN N'تایید شده'
                        WHEN 4 THEN N'در حال آماده‌سازی'
                        WHEN 5 THEN N'ارسال شده'
                        WHEN 6 THEN N'تحویل داده شده'
                        WHEN 7 THEN N'لغو شده'
                        WHEN 8 THEN N'ارجاع شده'
                        ELSE N'نامشخص'
                    END AS StatusCaption,
                    COUNT(*) AS Count
                FROM Recommendations
                WHERE Status = 1 {storeFilterRecm}
                GROUP BY LevelOrder
            ";

            return await _serviceQueryDB.GetsJsonDataViewByQuery(query, Array.Empty<SqlParameter>());
        }

        // ═══════════════════════════════════════════════════════
        // محصولات پرفروش
        // ═══════════════════════════════════════════════════════
        [HttpPost, Route("Dashboard/GetTopProducts"), CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetTopProducts()
        {
            var (_, _, allowedStoreIds) = await GetUserContextAsync();
            string storeFilter = BuildDirectStoreFilter(allowedStoreIds, "p.StoreId");

            string query = $@"
                SELECT TOP 5 
                    p.ProductCaption AS ProductName,
                    SUM(o.NumberProduct) AS TotalSold,
                    SUM(o.NumberProduct * cpp.PriceProduct) AS TotalRevenue
                FROM [Order] o
                INNER JOIN ColorPriceProduct cpp ON o.ColorPriceProductId = cpp.ColorPriceProductId
                INNER JOIN Product p ON cpp.ProductId = p.ProductId
                WHERE o.Status = 1 {storeFilter}
                GROUP BY p.ProductCaption
                ORDER BY TotalSold DESC
            ";

            return await _serviceQueryDB.GetsJsonDataViewByQuery(query, Array.Empty<SqlParameter>());
        }

        // ═══════════════════════════════════════════════════════
        // سفارشات اخیر
        // ═══════════════════════════════════════════════════════
        [HttpPost, Route("Dashboard/GetRecentOrders"), CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetRecentOrders()
        {
            var (_, _, allowedStoreIds) = await GetUserContextAsync();
            string storeFilterRecm = BuildPersonelStoreFilter(allowedStoreIds, "r.PersonelId");

            string query = $@"
                SELECT TOP 5
                    r.RecommendationsId,
                    ISNULL(p.FirstName + ' ' + p.LastName, N'مهمان') AS CustomerName,
                    ISNULL(rec.ValuePeyment, 0) AS TotalAmount,
                    r.LevelOrder,
                    CONVERT(varchar(10), r.DateTimeRecord, 120) AS OrderDate
                FROM Recommendations r
                LEFT JOIN Personel p ON r.PersonelId = p.PersonelId
                LEFT JOIN Receipt rec ON rec.RecommendationsId = r.RecommendationsId
                WHERE r.Status = 1 {storeFilterRecm}
                ORDER BY r.DateTimeRecord DESC
            ";

            return await _serviceQueryDB.GetsJsonDataViewByQuery(query, Array.Empty<SqlParameter>());
        }

        // ═══════════════════════════════════════════════════════
        // پیام‌های تماس جدید
        // ═══════════════════════════════════════════════════════
        [HttpPost, Route("Dashboard/GetRecentContacts"), CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetRecentContacts()
        {
            var (_, _, allowedStoreIds) = await GetUserContextAsync();
            string storeFilter = BuildDirectStoreFilter(allowedStoreIds, "StoreId");

            string query = $@"
                SELECT TOP 5
                    ContactUsId,
                    FullName,
                    ContactUsCaption AS Subject,
                    CONVERT(varchar(10), CreatedDate, 120) AS CreatedDate,
                    Condetion
                FROM ContactUs
                WHERE Status = 1 {storeFilter}
                ORDER BY CreatedDate DESC
            ";

            return await _serviceQueryDB.GetsJsonDataViewByQuery(query, Array.Empty<SqlParameter>());
        }

        // ═══════════════════════════════════════════════════════
        // پرسنل‌ها و تعداد فروشگاه
        // ═══════════════════════════════════════════════════════
        [HttpPost, Route("Dashboard/GetPersonelsWithStores"), CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetPersonelsWithStores()
        {
            var (personelId, isAdmin, allowedStoreIds) = await GetUserContextAsync();

            string query;

            if (isAdmin)
            {
                query = @"
                    SELECT 
                        p.PersonelId,
                        p.FirstName + ' ' + p.LastName AS FullName,
                        ISNULL(r.RoleCaption, N'بدون نقش') AS RoleCaption,
                        ISNULL(p.Address, N'-') AS Address,
                        (SELECT COUNT(*) FROM Store s WHERE s.PersonelId = p.PersonelId AND s.Status = 1) AS StoreCount,
                        (SELECT COUNT(*) FROM Product pr 
                         INNER JOIN Store s2 ON pr.StoreId = s2.StoreId 
                         WHERE s2.PersonelId = p.PersonelId AND pr.Status = 1) AS ProductCount,
                        CASE WHEN p.Status = 1 THEN 1 ELSE 0 END AS IsActive
                    FROM Personel p
                    LEFT JOIN Role r ON p.RoleId = r.RoleId
                    WHERE p.Status = 1
                    ORDER BY StoreCount DESC
                ";
            }
            else
            {
                if (allowedStoreIds.Count == 0)
                {
                    return await _serviceQueryDB.GetsJsonDataViewByQuery(
                        "SELECT TOP 0 0 AS PersonelId, '' AS FullName, '' AS RoleCaption, '' AS Address, 0 AS StoreCount, 0 AS ProductCount, 0 AS IsActive",
                        Array.Empty<SqlParameter>());
                }

                string ids = string.Join(",", allowedStoreIds);
                query = $@"
                    SELECT 
                        p.PersonelId,
                        p.FirstName + ' ' + p.LastName AS FullName,
                        ISNULL(r.RoleCaption, N'بدون نقش') AS RoleCaption,
                        ISNULL(p.Address, N'-') AS Address,
                        (SELECT COUNT(*) FROM Store s WHERE s.PersonelId = p.PersonelId AND s.Status = 1) AS StoreCount,
                        (SELECT COUNT(*) FROM Product pr 
                         INNER JOIN Store s2 ON pr.StoreId = s2.StoreId 
                         WHERE s2.PersonelId = p.PersonelId AND pr.Status = 1) AS ProductCount,
                        CASE WHEN p.Status = 1 THEN 1 ELSE 0 END AS IsActive
                    FROM Personel p
                    LEFT JOIN Role r ON p.RoleId = r.RoleId
                    WHERE p.Status = 1 
                      AND (
                            p.PersonelId = {personelId}
                            OR p.PersonelId IN (
                                SELECT DISTINCT PersonelId FROM Store WHERE StoreId IN ({ids})
                            )
                          )
                    ORDER BY StoreCount DESC
                ";
            }

            return await _serviceQueryDB.GetsJsonDataViewByQuery(query, Array.Empty<SqlParameter>());
        }

        // ═══════════════════════════════════════════════════════
        // فروشگاه‌ها و خلاصه
        // ═══════════════════════════════════════════════════════
        [HttpPost, Route("Dashboard/GetStoresSummary"), CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetStoresSummary()
        {
            var (_, isAdmin, allowedStoreIds) = await GetUserContextAsync();

            string storeFilter;
            if (isAdmin)
                storeFilter = " WHERE s.Status = 1 ";
            else if (allowedStoreIds.Count > 0)
                storeFilter = $" WHERE s.Status = 1 AND s.StoreId IN ({string.Join(",", allowedStoreIds)}) ";
            else
                return await _serviceQueryDB.GetsJsonDataViewByQuery(
                    "SELECT TOP 0 0 AS StoreId, '' AS StoreName, '' AS CodeStore, '' AS OwnerName, 0 AS ProductCount, 0 AS OrderCount, 0 AS TotalRevenue, 0 AS IsActive",
                    Array.Empty<SqlParameter>());

            string query = $@"
                SELECT 
                    s.StoreId,
                    s.StoreCaption AS StoreName,
                    s.CodeStore,
                    ISNULL(p.FirstName + ' ' + p.LastName, N'-') AS OwnerName,
                    (SELECT COUNT(*) FROM Product pr WHERE pr.StoreId = s.StoreId AND pr.Status = 1) AS ProductCount,
                    (SELECT COUNT(*) FROM Recommendations r 
                     WHERE r.PersonelId IN (SELECT PersonelId FROM Store WHERE StoreId = s.StoreId)
                       AND r.Status = 1) AS OrderCount,
                    (SELECT ISNULL(SUM(rc.ValuePeyment), 0) FROM Receipt rc 
                     INNER JOIN Recommendations r2 ON rc.RecommendationsId = r2.RecommendationsId
                     WHERE r2.PersonelId IN (SELECT PersonelId FROM Store WHERE StoreId = s.StoreId)
                       AND rc.Status = 1) AS TotalRevenue,
                    CASE WHEN s.Status = 1 THEN 1 ELSE 0 END AS IsActive
                FROM Store s
                LEFT JOIN Personel p ON s.PersonelId = p.PersonelId
                {storeFilter}
                ORDER BY OrderCount DESC
            ";

            return await _serviceQueryDB.GetsJsonDataViewByQuery(query, Array.Empty<SqlParameter>());
        }

        // ═══════════════════════════════════════════════════════
        // موجودی کم
        // ═══════════════════════════════════════════════════════
        [HttpPost, Route("Dashboard/GetLowStock"), CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetLowStock()
        {
            var (_, _, allowedStoreIds) = await GetUserContextAsync();
            string storeFilter = BuildDirectStoreFilter(allowedStoreIds, "p.StoreId");

            string query = $@"
                SELECT TOP 10
                    p.ProductCaption AS ProductName,
                    cpp.ColorPriceProductCaption AS ColorName,
                    cpp.InStore AS Stock,
                    cpp.PriceProduct,
                    s.StoreCaption AS StoreName
                FROM ColorPriceProduct cpp
                INNER JOIN Product p ON cpp.ProductId = p.ProductId
                INNER JOIN Store s ON p.StoreId = s.StoreId
                WHERE cpp.InStore < 5 AND cpp.Status = 1
                  {storeFilter}
                ORDER BY cpp.InStore ASC
            ";

            return await _serviceQueryDB.GetsJsonDataViewByQuery(query, Array.Empty<SqlParameter>());
        }

        // ═══════════════════════════════════════════════════════
        // فعالیت‌های اخیر
        // ═══════════════════════════════════════════════════════
        [HttpPost, Route("Dashboard/GetRecentActivities"), CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetRecentActivities()
        {
            var (personelId, isAdmin, allowedStoreIds) = await GetUserContextAsync();

            string personelFilter;
            if (isAdmin)
                personelFilter = "";
            else if (allowedStoreIds.Count > 0)
                personelFilter = $@" AND sa.PersonelId IN (
                    SELECT DISTINCT PersonelId FROM Store WHERE StoreId IN ({string.Join(",", allowedStoreIds)})
                    UNION SELECT {personelId}
                ) ";
            else
                personelFilter = $" AND sa.PersonelId = {personelId} ";

            string query = $@"
                SELECT TOP 10
                    sa.SystemActId,
                    ISNULL(p.FirstName + ' ' + p.LastName, N'-') AS PersonelName,
                    sa.TypeSystemAct,
                    CASE sa.TypeSystemAct WHEN 0 THEN N'ورود' WHEN 1 THEN N'خروج' ELSE N'-' END AS ActCaption,
                    CONVERT(varchar(19), sa.DateTime, 120) AS ActDate
                FROM SystemAct sa
                LEFT JOIN Personel p ON sa.PersonelId = p.PersonelId
                WHERE sa.Status = 1 {personelFilter}
                ORDER BY sa.DateTime DESC
            ";

            return await _serviceQueryDB.GetsJsonDataViewByQuery(query, Array.Empty<SqlParameter>());
        }

        // ═══════════════════════════════════════════════════════
        // لیست فروشگاه‌های مجاز
        // ═══════════════════════════════════════════════════════
        [HttpPost, Route("Dashboard/GetStoresForFilter"), CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetStoresForFilter()
        {
            var (_, isAdmin, allowedStoreIds) = await GetUserContextAsync();

            string query;
            if (isAdmin)
            {
                query = @"
                    SELECT StoreId, StoreCaption AS Caption, CodeStore
                    FROM Store
                    WHERE Status = 1
                    ORDER BY StoreCaption
                ";
            }
            else if (allowedStoreIds.Count > 0)
            {
                query = $@"
                    SELECT StoreId, StoreCaption AS Caption, CodeStore
                    FROM Store
                    WHERE Status = 1 AND StoreId IN ({string.Join(",", allowedStoreIds)})
                    ORDER BY StoreCaption
                ";
            }
            else
            {
                query = "SELECT TOP 0 0 AS StoreId, '' AS Caption, '' AS CodeStore";
            }

            return await _serviceQueryDB.GetsJsonDataViewByQuery(query, Array.Empty<SqlParameter>());
        }

        // ═══════════════════════════════════════════════════════
        // اطلاعات کاربر
        // ═══════════════════════════════════════════════════════
        [HttpPost, Route("Dashboard/GetUserInfo"), CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetUserInfo()
        {
            var (personelId, isAdmin, storeIds) = await GetUserContextAsync();

            var appUser = await _userManager.FindByNameAsync(User.Identity.Name);

            string fullName = appUser?.FullName
                           ?? appUser?.UserName
                           ?? User.Identity?.Name
                           ?? "کاربر";

            var result = new
            {
                FullName = fullName,
                IsAdmin = isAdmin,
                PersonelId = personelId,
                StoreCount = storeIds.Count,
                StoreIds = storeIds
            };

            return ServiseResult<string>.Success(
                Newtonsoft.Json.JsonConvert.SerializeObject(result));
        }
    }
}