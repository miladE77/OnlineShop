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
    /// مدیریت سفارشات فروشگاه‌های صاحب مغازه
    /// </summary>
    [Route("MyOrders")]
    public class MyOrdersController : ShopBaseController
    {
        private readonly IServiceStore _serviceStore;
        private readonly IServiceQueryDB _serviceQueryDB;
        private readonly IServiceRecommendations _serviceRecommendations;

        public MyOrdersController(
            SignInManager<Userapp> signInManager,
            UserManager<Userapp> userManager,
            IServiceStore serviceStore,
            IServiceQueryDB serviceQueryDB,
            IServiceRecommendations serviceRecommendations)
            : base(signInManager, userManager)
        {
            _serviceStore = serviceStore;
            _serviceQueryDB = serviceQueryDB;
            _serviceRecommendations = serviceRecommendations;
        }

        // ═══════════════════════════════════════════════════════
        // صفحه اصلی
        // GET: /MyOrders
        // ═══════════════════════════════════════════════════════
        [HttpGet("")]
        [RequireLogin]
        public async Task<IActionResult> Index()
        {
            var personelId = await GetCurrentPersonelIdAsync();
            if (personelId == null)
                return RedirectToAction("Login", "Account");
            return View("~/Views/MyOrders/Index.cshtml");
        }

        // ═══════════════════════════════════════════════════════
        // GetAll — لیست سفارشات
        // POST: /MyOrders/GetAll
        // Body: { storeId, levelOrder, search }
        // ═══════════════════════════════════════════════════════
        [HttpPost("GetAll")]
        [RequireLogin]
        [ValidateAntiForgeryToken]
        public async Task<ServiseResult<string>> GetAll()
        {
            var personelId = await GetCurrentPersonelIdAsync();
            if (personelId == null)
                return ServiseResult<string>.Failure("دوباره وارد شوید");

            // ─── پارامترها ───
            int storeId = 0;
            int levelOrder = -1;
            string search = "";


            // ─── فروشگاه‌های مجاز ───
            var storeIds = await GetAllowedStoreIds(personelId.Value, storeId);
            if (storeIds == null || storeIds.Count == 0)
                return ServiseResult<string>.Success("[]");

            var ids = string.Join(",", storeIds);

            // ─── شرط‌ها ───
            string where = $@"
    WHERE rec.Status = 1
      AND (
          EXISTS (
              SELECT 1
              FROM [Order] o
              INNER JOIN ColorPriceProduct cpp ON cpp.ColorPriceProductId = o.ColorPriceProductId
              INNER JOIN Product prod ON prod.ProductId = cpp.ProductId
              WHERE o.RecommendationsId = rec.RecommendationsId
                AND prod.StoreId IN ({ids})
          )
          OR oi.StoreId IS NULL
      )
";

            if (levelOrder > 0)
                where += $" AND rec.LevelOrder = {levelOrder}";

            if (!string.IsNullOrWhiteSpace(search))
            {
                string safeSearch = search.Replace("'", "''");
                where += $" AND (rec.RecommendationsCaption LIKE N'%{safeSearch}%' OR rec.RecommendationsId = '{safeSearch}')";
            }

            // ─── Query ───
            string query = $@"
                SELECT
    rec.RecommendationsId,
    rec.RecommendationsCaption,
    rec.PersonelId,
    ISNULL(p.FirstName + ' ' + p.LastName, N'مهمان') AS CustomerName,
    p.PhoneNumber,
    rec.DateTimeRecord,
    rec.LevelOrder,
    rec.Command,
    ISNULL(rec.Status, 0) AS Status,
    ISNULL(r.ValuePeyment, 0) AS TotalAmount,
    ISNULL(oi.ItemCount, 0) AS ItemCount,
    ISNULL(oi.StoreId, 0) AS StoreId,
    ISNULL(oi.StoreCaption, N'بدون فروشگاه') AS StoreCaption
FROM Recommendations rec
LEFT JOIN Personel p ON rec.PersonelId = p.PersonelId
OUTER APPLY (
    SELECT TOP 1 r.ValuePeyment
    FROM Receipt r
    WHERE r.RecommendationsId = rec.RecommendationsId
      AND r.Status = 1
    ORDER BY r.ReceiptId DESC
) r
OUTER APPLY (
    SELECT
        COUNT(*) AS ItemCount,
        MIN(prod.StoreId) AS StoreId,
        MIN(s.StoreCaption) AS StoreCaption
    FROM [Order] o
    INNER JOIN ColorPriceProduct cpp ON cpp.ColorPriceProductId = o.ColorPriceProductId
    INNER JOIN Product prod ON prod.ProductId = cpp.ProductId
    LEFT JOIN Store s ON s.StoreId = prod.StoreId
    WHERE o.RecommendationsId = rec.RecommendationsId
) oi
{where}
ORDER BY rec.DateTimeRecord DESC;
            ";

            return await _serviceQueryDB.GetsJsonDataViewByQuery(query, Array.Empty<SqlParameter>());

        }

        // ═══════════════════════════════════════════════════════
        // GetById — جزئیات یک سفارش
        // POST: /MyOrders/GetById
        // Body: { orderId }
        // ═══════════════════════════════════════════════════════
        [HttpPost("GetById")]
        [RequireLogin]
        [ValidateAntiForgeryToken]
        public async Task<ServiseResult<string>> GetById()
        {
            var personelId = await GetCurrentPersonelIdAsync();
            if (personelId == null)
                return ServiseResult<string>.Failure("دوباره وارد شوید");

            int orderId = 0;
            if (Request.Form.TryGetValue("orderId", out var o))
                int.TryParse(o, out orderId);

            if (orderId <= 0)
                return ServiseResult<string>.Failure("شناسه نامعتبر");

            // ─── چک مالکیت ───
            var ownership = await CheckOrderOwnership(personelId.Value, orderId);
            if (!ownership)
                return ServiseResult<string>.Failure("دسترسی غیرمجاز");

            // ═══════════════════════════════════════════════════════
            // ⭐ ۱. اطلاعات پایه سفارش
            // ═══════════════════════════════════════════════════════
            string headerQuery = $@"
        SELECT 
            rec.RecommendationsId,
            rec.RecommendationsCaption,
            rec.PersonelId,
            ISNULL(p.FirstName + ' ' + p.LastName, N'مهمان') AS CustomerName,
            ISNULL(p.PhoneNumber, N'—') AS PhoneNumber,
            ISNULL(p.Email, N'—') AS Email,
            ISNULL(p.Address, N'—') AS Address,
            rec.DateTimeRecord,
            rec.LevelOrder,
            rec.Command,
            ISNULL(rec.Status, 0) AS Status,
            ISNULL(r.ValuePeyment, 0) AS TotalAmount,
            ISNULL(r.DateTimePeyment, NULL) AS PaymentDate,
            ISNULL(tp.TypePeymentCaption, N'—') AS PaymentType
        FROM Recommendations rec
        LEFT JOIN Personel p ON rec.PersonelId = p.PersonelId
        LEFT JOIN Receipt r ON r.RecommendationsId = rec.RecommendationsId AND r.Status = 1
        LEFT JOIN TypePeyment tp ON r.TypePeymentId = tp.TypePeymentId
        WHERE rec.RecommendationsId = @orderId
    ";

            var headerResult = await _serviceQueryDB.GetsJsonDataViewByQuery(headerQuery,
                new SqlParameter($"@orderId", SqlDbType.Int) { Value = orderId });
            if (!headerResult.IsSuccess)
                return ServiseResult<string>.Failure("خطا در دریافت اطلاعات سفارش");

            // ═══════════════════════════════════════════════════════
            // ⭐ ۲. محصولات سفارش (با نام، رنگ، قیمت)
            // ═══════════════════════════════════════════════════════
            string itemsQuery = $@"
        SELECT 
            o.OrderId,
            o.OrderCaption,
            o.ColorPriceProductId,
            o.NumberProduct,
            -- ─── نام محصول ───
            ISNULL(pr.ProductCaption, N'محصول حذف‌شده') AS ProductCaption,
            ISNULL(pr.CodeInternalProducts, N'—') AS ProductCode,
            -- ─── رنگ و قیمت ───
            ISNULL(cp.ColorPriceProductCaption, N'بدون رنگ') AS ColorCaption,
            ISNULL(cp.PriceProduct, 0) AS PriceProduct,
            ISNULL(cp.Offer, 0) AS Offer,
            ISNULL(cp.InStore, 0) AS InStore,
            -- ─── قیمت با تخفیف ───
            CASE 
                WHEN cp.Offer > 0 
                    THEN CAST(cp.PriceProduct * (1 - cp.Offer / 100.0) AS INT)
                ELSE ISNULL(cp.PriceProduct, 0)
            END AS FinalPrice,
            -- ─── مجموع ───
            CASE 
                WHEN cp.Offer > 0 
                    THEN CAST(cp.PriceProduct * (1 - cp.Offer / 100.0) AS INT) * o.NumberProduct
                ELSE ISNULL(cp.PriceProduct, 0) * o.NumberProduct
            END AS TotalPrice,
            -- ─── تصویر ───
            (SELECT TOP 1 CodeFileProduct FROM FileProduct 
             WHERE ProductId = pr.ProductId AND Status = 1) AS ProductImage
        FROM [Order] o
        LEFT JOIN ColorPriceProduct cp ON o.ColorPriceProductId = cp.ColorPriceProductId
        LEFT JOIN Product pr ON cp.ProductId = pr.ProductId
        WHERE o.RecommendationsId = @orderId
        ORDER BY o.OrderId
    ";

            var itemsResult = await _serviceQueryDB.GetsJsonDataViewByQuery(itemsQuery, 
                new SqlParameter($"@orderId", SqlDbType.Int) { Value = orderId });

            if (!itemsResult.IsSuccess)
                return ServiseResult<string>.Failure("خطا در دریافت محصولات سفارش");

            // ═══════════════════════════════════════════════════════
            // ⭐ ۳. رسیدهای پرداخت
            // ═══════════════════════════════════════════════════════
            string receiptsQuery = $@"
            SELECT 
            r.ReceiptId,
            r.ReceiptCaption,
            r.ValuePeyment,
            r.DateTimePeyment,
            r.DoPeyment,
            ISNULL(tp.TypePeymentCaption, N'نامشخص') AS TypePeymentCaption
            FROM Receipt r
            LEFT JOIN TypePeyment tp ON r.TypePeymentId = tp.TypePeymentId
            WHERE r.RecommendationsId = @orderId
            ORDER BY r.ReceiptId";

            var receiptsResult = await _serviceQueryDB.GetsJsonDataViewByQuery(receiptsQuery, 
                new SqlParameter($"@orderId", SqlDbType.Int) { Value = orderId });

            // ═══════════════════════════════════════════════════════
            // ⭐ ۴. ترکیب همه در یک پاسخ
            // ═══════════════════════════════════════════════════════
            var header = Newtonsoft.Json.JsonConvert.DeserializeObject<List<object>>(headerResult.Data);
            var items = Newtonsoft.Json.JsonConvert.DeserializeObject<List<object>>(itemsResult.Data);
            var receipts = receiptsResult.IsSuccess
                ? Newtonsoft.Json.JsonConvert.DeserializeObject<List<object>>(receiptsResult.Data)
                : new List<object>();

            var combined = new
            {
                Header = header?.FirstOrDefault(),
                Items = items ?? new List<object>(),
                Receipts = receipts ?? new List<object>()
            };

            return ServiseResult<string>.Success(
                Newtonsoft.Json.JsonConvert.SerializeObject(combined, Newtonsoft.Json.Formatting.Indented));
        }

        // ═══════════════════════════════════════════════════════
        // UpdateStatus — تغییر وضعیت سفارش
        // POST: /MyOrders/UpdateStatus
        // Body: { orderId, newLevelOrder, command }
        // ═══════════════════════════════════════════════════════
        [HttpPost("UpdateStatus")]
        [RequireLogin]
        [ValidateAntiForgeryToken]
        public async Task<ServiseResult<string>> UpdateStatus()
        {
            var personelId = await GetCurrentPersonelIdAsync();
            if (personelId == null)
                return ServiseResult<string>.Failure("دوباره وارد شوید");

            int orderId = 0, newLevelOrder = 0;
            string command = "";

            if (Request.Form.TryGetValue("orderId", out var o))
                int.TryParse(o, out orderId);
            if (Request.Form.TryGetValue("newLevelOrder", out var l))
                int.TryParse(l, out newLevelOrder);
            if (Request.Form.TryGetValue("command", out var c))
                command = c.ToString()?.Trim() ?? "";

            // ─── اعتبارسنجی ───
            if (orderId <= 0)
                return ServiseResult<string>.Failure("شناسه نامعتبر");

            if (newLevelOrder < 2 || newLevelOrder > 8)
                return ServiseResult<string>.Failure("مرحله سفارش نامعتبر");

            // ─── چک مالکیت ───
            var ownership = await CheckOrderOwnership(personelId.Value, orderId);
            if (!ownership)
                return ServiseResult<string>.Failure("دسترسی غیرمجاز");

            // ─── دریافت سفارش ───
            var orderResult = await _serviceRecommendations.GetRecommendations(orderId);
            if (!orderResult.IsSuccess)
                return ServiseResult<string>.Failure("سفارش یافت نشد");

            var orders = JsonConvert.DeserializeObject<List<Recommendations>>(orderResult.Data);
            if (orders == null || orders.Count == 0)
                return ServiseResult<string>.Failure("سفارش یافت نشد");

            var existing = orders[0];

            // ─── آپدیت ───
            existing.LevelOrder = newLevelOrder;
            if (!string.IsNullOrWhiteSpace(command))
                existing.Command = command;

            return await _serviceRecommendations.UpdateRecommendations(existing);
        }

        // ═══════════════════════════════════════════════════════
        // Helper — فروشگاه‌های مجاز
        // ═══════════════════════════════════════════════════════
        private async Task<List<int>> GetAllowedStoreIds(int personelId, int requestedStoreId)
        {
            bool isAdmin = User.IsInRole("Admin") || User.IsInRole("Administrator");

            if (isAdmin)
            {
                if (requestedStoreId > 0)
                    return new List<int> { requestedStoreId };

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

            var storeIdsResult = await _serviceStore.GetStoreIds(personelId);
            if (!storeIdsResult.IsSuccess)
                return new List<int>();

            var allowedIds = JsonConvert.DeserializeObject<List<int>>(storeIdsResult.Data)
                             ?? new List<int>();

            if (requestedStoreId > 0)
            {
                if (allowedIds.Contains(requestedStoreId))
                    return new List<int> { requestedStoreId };
                return new List<int>();
            }

            return allowedIds;
        }

        // ═══════════════════════════════════════════════════════
        // Helper — چک مالکیت سفارش
        // ═══════════════════════════════════════════════════════
        private async Task<bool> CheckOrderOwnership(int personelId, int orderId)
        {
            bool isAdmin = User.IsInRole("Admin") || User.IsInRole("Administrator");
            if (isAdmin) return true;

            // ─── دریافت سفارش ───
            var orderResult = await _serviceRecommendations.GetRecommendations(orderId);
            if (!orderResult.IsSuccess) return false;

            var orders = JsonConvert.DeserializeObject<List<Recommendations>>(orderResult.Data);
            if (orders == null || orders.Count == 0) return false;

            var order = orders[0];

            // ─── چک فروشگاه ───
            var storeIdsResult = await _serviceStore.GetStoreIds(personelId);
            if (!storeIdsResult.IsSuccess) return false;

            var allowedIds = JsonConvert.DeserializeObject<List<int>>(storeIdsResult.Data);

            // ─── سفارش باید به یه فروشگاه کاربر تعلق داشته باشه ───
            // چون سفارش با PersonelId سفارش‌دهنده است، باید چک کنیم که آیا این PersonelId توی Store های کاربر هست
            var storePersonelResult = await _serviceQueryDB.GetsTableDataViewByQuery(
                $"SELECT DISTINCT PersonelId FROM Store WHERE StoreId IN ({string.Join(",", allowedIds ?? new List<int>())})");

            if (!storePersonelResult.IsSuccess || storePersonelResult.Data == null)
                return false;

            foreach (System.Data.DataRow row in storePersonelResult.Data.Rows)
            {
                if (row["PersonelId"] != DBNull.Value &&
                    Convert.ToInt32(row["PersonelId"]) == order.PersonelId)
                {
                    return true;
                }
            }

            return false;
        }
    }
}