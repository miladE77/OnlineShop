using Application.Services;
using Domain.Models;
using Domain.ServiseResult;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Newtonsoft.Json;
using System.Data;
using TemplateSite.Filters;

namespace TemplateSite.Controllers.ShopPanel
{
    /// <summary>
    /// داشبورد صاحب مغازه — گزارشات مالی + انبارداری
    /// فقط داده‌های فروشگاه‌های خودش
    /// </summary>
    [Route("MyDashboard")]
    public class MyDashboardController : ShopBaseController
    {
        private readonly IServiceStore _serviceStore;
        private readonly IServiceQueryDB _serviceQueryDB;

        public MyDashboardController(
            SignInManager<Userapp> signInManager,
            UserManager<Userapp> userManager,
            IServiceStore serviceStore,
            IServiceQueryDB serviceQueryDB)
            : base(signInManager, userManager)
        {
            _serviceStore = serviceStore;
            _serviceQueryDB = serviceQueryDB;
        }

        // ═══════════════════════════════════════════════════════
        // صفحه اصلی
        // GET: /MyDashboard
        // ═══════════════════════════════════════════════════════
        [HttpGet("")]
        [RequireLogin]
        public async Task<IActionResult> Index()
        {
            var personelId = await GetCurrentPersonelIdAsync();
            if (personelId == null)
                return RedirectToAction("Login", "Account");
            return View("~/Views/MyDashboard/Index.cshtml");
        }

        // ═══════════════════════════════════════════════════════
        // KPI Cards
        // POST: /MyDashboard/GetKpi
        // Body: { storeId } (0 = همه)
        // ═══════════════════════════════════════════════════════
        [HttpPost("GetKpi")]
        [RequireLogin]
        [ValidateAntiForgeryToken]
        public async Task<ServiseResult<string>> GetKpi()
        {
            var personelId = await GetCurrentPersonelIdAsync();
            if (personelId == null)
                return ServiseResult<string>.Failure("دوباره وارد شوید");

            int storeId = 0;
            if (Request.Form.TryGetValue("storeId", out var s))
                int.TryParse(s, out storeId);

            var storeIds = await GetAllowedStoreIds(personelId.Value, storeId);
            if (storeIds == null || storeIds.Count == 0)
                return ServiseResult<string>.Success(
                    "{\"totalIncome\":0,\"todayIncome\":0,\"monthIncome\":0,\"totalOrders\":0,\"pendingOrders\":0,\"activeProducts\":0,\"totalStock\":0,\"lowStock\":0,\"totalColors\":0}");

            var ids = string.Join(",", storeIds);

            string query = $@"
                SELECT 
                    -- کل درآمد
                    (SELECT ISNULL(SUM(r.ValuePeyment), 0) FROM Receipt r
                     INNER JOIN Recommendations rec ON r.RecommendationsId = rec.RecommendationsId
                     WHERE r.Status = 1
                       AND rec.PersonelId IN (SELECT PersonelId FROM Store WHERE StoreId IN ({ids}))) AS totalIncome,

                    -- درآمد امروز
                    (SELECT ISNULL(SUM(r.ValuePeyment), 0) FROM Receipt r
                     INNER JOIN Recommendations rec ON r.RecommendationsId = rec.RecommendationsId
                     WHERE r.Status = 1
                       AND CAST(r.DateTimePeyment AS DATE) = CAST(GETDATE() AS DATE)
                       AND rec.PersonelId IN (SELECT PersonelId FROM Store WHERE StoreId IN ({ids}))) AS todayIncome,

                    -- درآمد این ماه
                    (SELECT ISNULL(SUM(r.ValuePeyment), 0) FROM Receipt r
                     INNER JOIN Recommendations rec ON r.RecommendationsId = rec.RecommendationsId
                     WHERE r.Status = 1
                       AND MONTH(r.DateTimePeyment) = MONTH(GETDATE())
                       AND YEAR(r.DateTimePeyment) = YEAR(GETDATE())
                       AND rec.PersonelId IN (SELECT PersonelId FROM Store WHERE StoreId IN ({ids}))) AS monthIncome,

                    -- تعداد سفارشات
                    (SELECT COUNT(*) FROM Recommendations rec
                     WHERE rec.Status = 1
                       AND rec.PersonelId IN (SELECT PersonelId FROM Store WHERE StoreId IN ({ids}))) AS totalOrders,

                    -- سفارشات در انتظار
                    (SELECT COUNT(*) FROM Recommendations rec
                     WHERE rec.Status = 1 AND rec.LevelOrder = 2
                       AND rec.PersonelId IN (SELECT PersonelId FROM Store WHERE StoreId IN ({ids}))) AS pendingOrders,

                    -- محصولات فعال
                    (SELECT COUNT(*) FROM Product p
                     WHERE p.Status = 1 AND p.StoreId IN ({ids})) AS activeProducts,

                    -- موجودی کل
                    (SELECT ISNULL(SUM(cp.InStore), 0) FROM ColorPriceProduct cp
                     INNER JOIN Product p ON cp.ProductId = p.ProductId
                     WHERE cp.Status = 1 AND p.Status = 1 AND p.StoreId IN ({ids})) AS totalStock,

                    -- موجودی کم
                    (SELECT COUNT(*) FROM ColorPriceProduct cp
                     INNER JOIN Product p ON cp.ProductId = p.ProductId
                     WHERE cp.Status = 1 AND p.Status = 1
                       AND cp.InStore < 5
                       AND p.StoreId IN ({ids})) AS lowStock,

                    -- تعداد رنگ‌بندی
                    (SELECT COUNT(*) FROM ColorPriceProduct cp
                     INNER JOIN Product p ON cp.ProductId = p.ProductId
                     WHERE cp.Status = 1 AND p.Status = 1
                       AND p.StoreId IN ({ids})) AS totalColors
            ";

            return await _serviceQueryDB.GetsJsonDataViewByQuery(query, Array.Empty<SqlParameter>());

        }

        // ═══════════════════════════════════════════════════════
        // نمودار فروش
        // POST: /MyDashboard/GetSalesChart
        // ═══════════════════════════════════════════════════════
        [HttpPost("GetSalesChart")]
        [RequireLogin]
        [ValidateAntiForgeryToken]
        public async Task<ServiseResult<string>> GetSalesChart()
        {
            var personelId = await GetCurrentPersonelIdAsync();
            if (personelId == null)
                return ServiseResult<string>.Failure("دوباره وارد شوید");

            int storeId = 0;
            if (Request.Form.TryGetValue("storeId", out var s))
                int.TryParse(s, out storeId);

            string range = "month";
            if (Request.Form.TryGetValue("range", out var r))
                range = r.ToString() ?? "month";

            var storeIds = await GetAllowedStoreIds(personelId.Value, storeId);
            if (storeIds == null || storeIds.Count == 0)
                return ServiseResult<string>.Success("[]");

            var ids = string.Join(",", storeIds);

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
                    CONVERT(varchar(10), CAST(r.DateTimePeyment AS DATE), 120) AS saleDate,
                    SUM(r.ValuePeyment) AS totalAmount,
                    COUNT(*) AS orderCount
                FROM Receipt r
                INNER JOIN Recommendations rec ON r.RecommendationsId = rec.RecommendationsId
                WHERE r.Status = 1
                  AND r.DateTimePeyment >= DATEADD(DAY, -@day, GETDATE())
                  AND rec.PersonelId IN (SELECT PersonelId FROM Store WHERE StoreId IN (@day))
                GROUP BY CAST(r.DateTimePeyment AS DATE)
                ORDER BY CAST(r.DateTimePeyment AS DATE)
            ";

            return await _serviceQueryDB.GetsJsonDataViewByQuery(query,
            new SqlParameter($"@day", SqlDbType.Int) { Value = days });

        }

        // ═══════════════════════════════════════════════════════
        // وضعیت سفارشات
        // POST: /MyDashboard/GetOrdersStatus
        // ═══════════════════════════════════════════════════════
        [HttpPost("GetOrdersStatus")]
        [RequireLogin]
        [ValidateAntiForgeryToken]
        public async Task<ServiseResult<string>> GetOrdersStatus()
        {
            var personelId = await GetCurrentPersonelIdAsync();
            if (personelId == null)
                return ServiseResult<string>.Failure("دوباره وارد شوید");

            int storeId = 0;
            if (Request.Form.TryGetValue("storeId", out var s))
                int.TryParse(s, out storeId);

            var storeIds = await GetAllowedStoreIds(personelId.Value, storeId);
            if (storeIds == null || storeIds.Count == 0)
                return ServiseResult<string>.Success("[]");

            var ids = string.Join(",", storeIds);

            string query = $@"
                SELECT 
                    LevelOrder,
                    CASE LevelOrder
                        WHEN 2 THEN N'در انتظار'
                        WHEN 3 THEN N'پرداخت'
                        WHEN 4 THEN N'پردازش'
                        WHEN 5 THEN N'ارسال'
                        WHEN 6 THEN N'پست'
                        WHEN 7 THEN N'تحویل'
                        ELSE N'نامشخص'
                    END AS statusCaption,
                    COUNT(*) AS count
                FROM Recommendations
                WHERE Status = 1
                  AND PersonelId IN (SELECT PersonelId FROM Store WHERE StoreId IN ({ids}))
                GROUP BY LevelOrder
            ";

            return await _serviceQueryDB.GetsJsonDataViewByQuery(query, Array.Empty<SqlParameter>());

        }

        // ═══════════════════════════════════════════════════════
        // سفارشات اخیر
        // POST: /MyDashboard/GetRecentOrders
        // ═══════════════════════════════════════════════════════
        [HttpPost("GetRecentOrders")]
        [RequireLogin]
        [ValidateAntiForgeryToken]
        public async Task<ServiseResult<string>> GetRecentOrders()
        {
            var personelId = await GetCurrentPersonelIdAsync();
            if (personelId == null)
                return ServiseResult<string>.Failure("دوباره وارد شوید");

            int storeId = 0;
            if (Request.Form.TryGetValue("storeId", out var s))
                int.TryParse(s, out storeId);

            var storeIds = await GetAllowedStoreIds(personelId.Value, storeId);
            if (storeIds == null || storeIds.Count == 0)
                return ServiseResult<string>.Success("[]");

            var ids = string.Join(",", storeIds);

            string query = $@"
                SELECT TOP 10
                    rec.RecommendationsId,
                    rec.RecommendationsCaption AS orderTitle,
                    ISNULL(p.FirstName + ' ' + p.LastName, N'مهمان') AS customerName,
                    rec.LevelOrder,
                    rec.DateTimeRecord,
                    ISNULL(r.ValuePeyment, 0) AS totalAmount
                FROM Recommendations rec
                LEFT JOIN Personel p ON rec.PersonelId = p.PersonelId
                LEFT JOIN Receipt r ON r.RecommendationsId = rec.RecommendationsId
                WHERE rec.Status = 1
                  AND rec.PersonelId IN (SELECT PersonelId FROM Store WHERE StoreId IN ({ids}))
                ORDER BY rec.DateTimeRecord DESC
            ";

            return await _serviceQueryDB.GetsJsonDataViewByQuery(query, Array.Empty<SqlParameter>());
        }

        // ═══════════════════════════════════════════════════════
        // محصولات پرفروش
        // POST: /MyDashboard/GetTopProducts
        // ═══════════════════════════════════════════════════════
        [HttpPost("GetTopProducts")]
        [RequireLogin]
        [ValidateAntiForgeryToken]
        public async Task<ServiseResult<string>> GetTopProducts()
        {
            var personelId = await GetCurrentPersonelIdAsync();
            if (personelId == null)
                return ServiseResult<string>.Failure("دوباره وارد شوید");

            int storeId = 0;
            if (Request.Form.TryGetValue("storeId", out var s))
                int.TryParse(s, out storeId);

            var storeIds = await GetAllowedStoreIds(personelId.Value, storeId);
            if (storeIds == null || storeIds.Count == 0)
                return ServiseResult<string>.Success("[]");

            var ids = string.Join(",", storeIds);

            string query = $@"
                SELECT TOP 5
                    p.ProductCaption AS productName,
                    SUM(o.NumberProduct) AS totalSold,
                    SUM(o.NumberProduct * cp.PriceProduct) AS totalRevenue
                FROM [Order] o
                INNER JOIN ColorPriceProduct cp ON o.ColorPriceProductId = cp.ColorPriceProductId
                INNER JOIN Product p ON cp.ProductId = p.ProductId
                WHERE o.Status = 1
                  AND p.StoreId IN ({ids})
                GROUP BY p.ProductCaption
                ORDER BY totalSold DESC
            ";

            return await _serviceQueryDB.GetsJsonDataViewByQuery(query, Array.Empty<SqlParameter>());
        }

        // ═══════════════════════════════════════════════════════
        // موجودی کم
        // POST: /MyDashboard/GetLowStock
        // ═══════════════════════════════════════════════════════
        [HttpPost("GetLowStock")]
        [RequireLogin]
        [ValidateAntiForgeryToken]
        public async Task<ServiseResult<string>> GetLowStock()
        {
            var personelId = await GetCurrentPersonelIdAsync();
            if (personelId == null)
                return ServiseResult<string>.Failure("دوباره وارد شوید");

            int storeId = 0;
            if (Request.Form.TryGetValue("storeId", out var s))
                int.TryParse(s, out storeId);

            var storeIds = await GetAllowedStoreIds(personelId.Value, storeId);
            if (storeIds == null || storeIds.Count == 0)
                return ServiseResult<string>.Success("[]");

            var ids = string.Join(",", storeIds);

            string query = $@"
                SELECT TOP 10
                    p.ProductCaption AS productName,
                    cp.ColorPriceProductCaption AS colorName,
                    cp.InStore AS stock,
                    cp.PriceProduct,
                    s.StoreCaption AS storeName
                FROM ColorPriceProduct cp
                INNER JOIN Product p ON cp.ProductId = p.ProductId
                INNER JOIN Store s ON p.StoreId = s.StoreId
                WHERE cp.Status = 1 AND p.Status = 1
                  AND cp.InStore < 5
                  AND p.StoreId IN ({ids})
                ORDER BY cp.InStore ASC
            ";

            return await _serviceQueryDB.GetsJsonDataViewByQuery(query, Array.Empty<SqlParameter>());
        }

        // ═══════════════════════════════════════════════════════
        // ارزش انبار به تفکیک فروشگاه
        // POST: /MyDashboard/GetInventoryByStore
        // ═══════════════════════════════════════════════════════
        [HttpPost("GetInventoryByStore")]
        [RequireLogin]
        [ValidateAntiForgeryToken]
        public async Task<ServiseResult<string>> GetInventoryByStore()
        {
            var personelId = await GetCurrentPersonelIdAsync();
            if (personelId == null)
                return ServiseResult<string>.Failure("دوباره وارد شوید");

            int storeId = 0;
            if (Request.Form.TryGetValue("storeId", out var s))
                int.TryParse(s, out storeId);

            var storeIds = await GetAllowedStoreIds(personelId.Value, storeId);
            if (storeIds == null || storeIds.Count == 0)
                return ServiseResult<string>.Success("[]");

            var ids = string.Join(",", storeIds);

            string query = $@"
                SELECT 
                    s.StoreId,
                    s.StoreCaption AS storeName,
                    ISNULL(SUM(cp.InStore * cp.PriceProduct), 0) AS inventoryValue,
                    ISNULL(SUM(cp.InStore), 0) AS totalItems,
                    COUNT(DISTINCT p.ProductId) AS productCount
                FROM Store s
                LEFT JOIN Product p ON p.StoreId = s.StoreId AND p.Status = 1
                LEFT JOIN ColorPriceProduct cp ON cp.ProductId = p.ProductId AND cp.Status = 1
                WHERE s.Status = 1 AND s.StoreId IN ({ids})
                GROUP BY s.StoreId, s.StoreCaption
                ORDER BY inventoryValue DESC
            ";

            return await _serviceQueryDB.GetsJsonDataViewByQuery(query, Array.Empty<SqlParameter>());
        }

        // ═══════════════════════════════════════════════════════
        // فروش به تفکیک فروشگاه
        // POST: /MyDashboard/GetSalesByStore
        // ═══════════════════════════════════════════════════════
        [HttpPost("GetSalesByStore")]
        [RequireLogin]
        [ValidateAntiForgeryToken]
        public async Task<ServiseResult<string>> GetSalesByStore()
        {
            var personelId = await GetCurrentPersonelIdAsync();
            if (personelId == null)
                return ServiseResult<string>.Failure("دوباره وارد شوید");

            int storeId = 0;
            if (Request.Form.TryGetValue("storeId", out var s))
                int.TryParse(s, out storeId);

            var storeIds = await GetAllowedStoreIds(personelId.Value, storeId);
            if (storeIds == null || storeIds.Count == 0)
                return ServiseResult<string>.Success("[]");

            var ids = string.Join(",", storeIds);

            string query = $@"
                SELECT 
                    s.StoreId,
                    s.StoreCaption AS storeName,
                    s.CodeStore,
                    ISNULL(SUM(r.ValuePeyment), 0) AS totalIncome,
                    COUNT(DISTINCT rec.RecommendationsId) AS orderCount
                FROM Store s
                LEFT JOIN Personel p ON s.PersonelId = p.PersonelId
                LEFT JOIN Recommendations rec ON rec.PersonelId = p.PersonelId AND rec.Status = 1
                LEFT JOIN Receipt r ON r.RecommendationsId = rec.RecommendationsId AND r.Status = 1
                WHERE s.Status = 1 AND s.StoreId IN ({ids})
                GROUP BY s.StoreId, s.StoreCaption, s.CodeStore
                ORDER BY totalIncome DESC
            ";

            return await _serviceQueryDB.GetsJsonDataViewByQuery(query, Array.Empty<SqlParameter>());
        }

        // ═══════════════════════════════════════════════════════
        // درآمد ماهانه
        // POST: /MyDashboard/GetMonthlyIncome
        // ═══════════════════════════════════════════════════════
        [HttpPost("GetMonthlyIncome")]
        [RequireLogin]
        [ValidateAntiForgeryToken]
        public async Task<ServiseResult<string>> GetMonthlyIncome()
        {
            var personelId = await GetCurrentPersonelIdAsync();
            if (personelId == null)
                return ServiseResult<string>.Failure("دوباره وارد شوید");

            int storeId = 0;
            if (Request.Form.TryGetValue("storeId", out var s))
                int.TryParse(s, out storeId);

            var storeIds = await GetAllowedStoreIds(personelId.Value, storeId);
            if (storeIds == null || storeIds.Count == 0)
                return ServiseResult<string>.Success("[]");

            var ids = string.Join(",", storeIds);

            string query = $@"
                SELECT 
                    MONTH(r.DateTimePeyment) AS monthNum,
                    DATENAME(MONTH, r.DateTimePeyment) AS monthName,
                    SUM(r.ValuePeyment) AS totalIncome,
                    COUNT(*) AS orderCount
                FROM Receipt r
                INNER JOIN Recommendations rec ON r.RecommendationsId = rec.RecommendationsId
                WHERE r.Status = 1
                  AND YEAR(r.DateTimePeyment) = YEAR(GETDATE())
                  AND rec.PersonelId IN (SELECT PersonelId FROM Store WHERE StoreId IN ({ids}))
                GROUP BY MONTH(r.DateTimePeyment), DATENAME(MONTH, r.DateTimePeyment)
                ORDER BY MONTH(r.DateTimePeyment)
            ";

            return await _serviceQueryDB.GetsJsonDataViewByQuery(query, Array.Empty<SqlParameter>());
        }

        // ═══════════════════════════════════════════════════════
        // Helper — فروشگاه‌های مجاز
        // ═══════════════════════════════════════════════════════
        private async Task<List<int>> GetAllowedStoreIds(int personelId, int requestedStoreId)
        {
            bool isAdmin = User.IsInRole("Admin") || User.IsInRole("Administrator");

            // ─── Admin ───
            if (isAdmin)
            {
                // اگه storeId خاصی خواسته شده
                if (requestedStoreId > 0)
                    return new List<int> { requestedStoreId };

                // همه فروشگاه‌ها
                var allStores = await _serviceQueryDB.GetsTableDataViewByQuery(
                    "SELECT StoreId FROM Store WHERE Status = 1");

                if (allStores.IsSuccess && allStores.Data != null)
                {
                    var ids = new List<int>();
                    foreach (System.Data.DataRow row in allStores.Data.Rows)
                    {
                        if (row["StoreId"] != DBNull.Value)
                            ids.Add(Convert.ToInt32(row["StoreId"]));
                    }
                    return ids;
                }
                return new List<int>();
            }

            // ─── StoreOwner ───
            var storeIdsResult = await _serviceStore.GetStoreIds(personelId);
            if (!storeIdsResult.IsSuccess)
                return new List<int>();

            var allowedIds = JsonConvert.DeserializeObject<List<int>>(storeIdsResult.Data)
                             ?? new List<int>();

            // ─── فیلتر بر اساس storeId درخواستی ───
            if (requestedStoreId > 0)
            {
                if (allowedIds.Contains(requestedStoreId))
                    return new List<int> { requestedStoreId };
                return new List<int>();
            }

            return allowedIds;
        }
    }
}