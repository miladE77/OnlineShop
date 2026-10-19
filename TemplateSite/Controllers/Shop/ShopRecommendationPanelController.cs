using Application.Services;
using Domain.Models;
using Domain.ViewModels;
using Domain.ServiseResult;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Site.Filters;
using System.Text.Json;
using TemplateSite.Filters;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace TemplateSite.Controllers.ShopPanel
{
    [Route("ShopPanel/Recommendation")]
    public class ShopRecommendationPanelController : ShopBaseController
    {
        // ═══════════════════════════════════════════════════════
        // Dependencies
        // ═══════════════════════════════════════════════════════
        private readonly IServiceQueryDB _serviceQueryDB;
        private readonly IServiceRecommendations _serviceRecommendations;
        private readonly IServiceReceipt _serviceReceipt;
        private readonly IServiceProduct _serviceProduct;
        private readonly IServiceOrder _serviceOrder;
        private readonly IServiceTypePeyment _serviceTypePeyment;

        public ShopRecommendationPanelController(
            SignInManager<Userapp> signInManager,
            UserManager<Userapp> userManager,
            IServiceQueryDB serviceQueryDB,
            IServiceRecommendations serviceRecommendations,
            IServiceReceipt serviceReceipt,
            IServiceProduct serviceProduct,
            IServiceOrder serviceOrder,
            IServiceTypePeyment serviceTypePeyment)
            : base(signInManager, userManager)
        {
            _serviceQueryDB = serviceQueryDB;
            _serviceRecommendations = serviceRecommendations;
            _serviceReceipt = serviceReceipt;
            _serviceProduct = serviceProduct;
            _serviceOrder = serviceOrder;
            _serviceTypePeyment = serviceTypePeyment;
        }

        // ═══════════════════════════════════════════════════════
        // ۱. صفحه‌های View
        // ═══════════════════════════════════════════════════════

        // ─────────────────────────────────────────────────────
        // لیست سفارشات من
        // GET: /ShopPanel/Recommendation
        // ─────────────────────────────────────────────────────
        [HttpGet("")]
        [RequireLogin]
        public async Task<IActionResult> Index()
        {
            var personelId = await GetCurrentPersonelIdAsync();
            if (personelId == null)
                return RedirectToAction("Login", "Account");

            // ─── دسته‌بندی محصولات ───
            var data = await _serviceQueryDB.GetsDictionaryDataViewByQuery(
                "select * from KindProductView", "ParentKindProductCaption");

            if (data.IsSuccess)
                ViewData["KindProduct"] = data.Data;
            else
                return RedirectToAction("E505", "Error");

            return View("~/Views/ShopPanel/MyRecommendation.cshtml");
        }

        // ─────────────────────────────────────────────────────
        // صفحه ثبت سفارش جدید
        // GET: /ShopPanel/Recommendation/Record
        // ─────────────────────────────────────────────────────
        [HttpGet("Record")]
        [RequireLogin]
        public async Task<IActionResult> Record()
        {
            var personelId = await GetCurrentPersonelIdAsync();
            if (personelId == null)
                return RedirectToAction("Login", "Account");

            // ─── دسته‌بندی محصولات ───
            var data = await _serviceQueryDB.GetsDictionaryDataViewByQuery(
                "select * from KindProductView", "ParentKindProductCaption");

            if (data.IsSuccess)
                ViewData["KindProduct"] = data.Data;
            else
                return RedirectToAction("E505", "Error");

            return View("~/Views/ShopPanel/RecordRecommendation.cshtml");
        }

        // ═══════════════════════════════════════════════════════
        // ۲. دریافت داده‌ها (AJAX)
        // ═══════════════════════════════════════════════════════

        // ─────────────────────────────────────────────────────
        // دریافت لیست سفارشات پرسنل
        // POST: /ShopPanel/Recommendation/GetData
        // ─────────────────────────────────────────────────────
        [HttpPost("GetData")]
        [RequireLogin]
        [ValidateAntiForgeryToken]
        public async Task<ServiseResult<string>> GetData()
        {
            var personelId = await GetCurrentPersonelIdAsync();
            return await _serviceRecommendations.GetPersonelRecommendations(personelId.Value);
        }
        // ─────────────────────────────────────────────────────
        // دریافت لیست نوع پرداخت
        // POST: /ShopPanel/Recommendation/getTypePeyments
        // ─────────────────────────────────────────────────────
        [HttpPost("getTypePeyments")]
        [RequireLogin]
        [ValidateAntiForgeryToken]
        public async Task<ServiseResult<string>> GetTypePeyments()
        {
            return await _serviceQueryDB.GetsJsonDataViewByQuery($"select * from TypePeymentView");
        }
        // ─────────────────────────────────────────────────────
        // دریافت لیست سفارشات من
        // POST: /ShopPanel/Recommendation/myRecommendation
        // ─────────────────────────────────────────────────────
        [HttpPost("myRecommendation")]
        [RequireLogin]
        [ValidateAntiForgeryToken]
        public async Task<ServiseResult<string>> myRecommendation()
        {
            var personelId = await GetCurrentPersonelIdAsync();
            return await _serviceQueryDB.GetsJsonDataViewByQuery($"select top 5 * from RecommendationsView where PersonelId = {personelId}");
        }
        // ─────────────────────────────────────────────────────
        // دریافت لیست فروشگاه من
        // POST: /ShopPanel/Recommendation/myStore
        // ─────────────────────────────────────────────────────
        [HttpPost("myStore")]
        [RequireLogin]
        [ValidateAntiForgeryToken]
        public async Task<ServiseResult<string>> myStore()
        {
            var personelId = await GetCurrentPersonelIdAsync();
            return await _serviceQueryDB.GetsJsonDataViewByQuery($"select * from StoreView where PersonelId = {personelId}");
        }

        // ─────────────────────────────────────────────────────
        // دریافت داده‌های پایه (محصولات + نوع پرداخت)
        // POST: /ShopPanel/Recommendation/GetBaseData
        // ─────────────────────────────────────────────────────
        [HttpPost("GetBaseData")]
        [RequireLogin]
        [ValidateAntiForgeryToken]
        public async Task<ServiseResult<string>> GetBaseData([FromBody] GetBaseDataRequest request)
        {
            try
            {
                List<Product> products = new List<Product>();
                var conditions = new List<string>();

                // ─── شرط: colorPriceProductId ها ───
                if (request?.ColorPriceProductIds != null && request.ColorPriceProductIds.Count > 0)
                {
                    var ids = string.Join(",", request.ColorPriceProductIds);
                    conditions.Add($"c.ColorPriceProductId IN ({ids})");
                }

                // ─── شرط: productId ها (بدون رنگ) ───
                if (request?.ProductIds != null && request.ProductIds.Count > 0)
                {
                    var pids = string.Join(",", request.ProductIds);
                    conditions.Add($"p.ProductId IN ({pids})");
                }

                // ─── اجرای کوئری ───
                if (conditions.Count > 0)
                {
                    var whereClause = string.Join(" OR ", conditions);

                    var query = $@"
                        SELECT DISTINCT 
                            p.ProductId,
                            p.ProductCaption,
                            p.KindProductId,
                            c.ColorPriceProductId,
                            c.ColorPriceProductCaption,
                            c.PriceProduct,
                            c.InStore
                        FROM Product p
                        INNER JOIN ColorPriceProduct c ON c.ProductId = p.ProductId
                        WHERE {whereClause}";

                    var result = await _serviceQueryDB.GetsDynamicDataViewByQuery(query);

                    if (result.IsSuccess && result.Data?.Count > 0)
                    {
                        products = result.Data
                            .GroupBy(row => Convert.ToInt32(row.ProductId))
                            .Select(g => new Product
                            {
                                ProductId = g.Key,
                                ProductCaption = g.First().ProductCaption?.ToString() ?? "",
                                KindProductId = g.First().KindProductId != null
                                    ? Convert.ToInt32(g.First().KindProductId)
                                    : 0,
                                Colors = g.Select(c => new ColorPriceProduct
                                {
                                    ColorPriceProductId = Convert.ToInt32(c.ColorPriceProductId),
                                    ColorPriceProductCaption = c.ColorPriceProductCaption?.ToString() ?? "",
                                    PriceProduct = c.PriceProduct != null
                                        ? Convert.ToInt32(c.PriceProduct)
                                        : 0L,
                                    InStore = c.InStore != null
                                        ? Convert.ToInt32(c.InStore)
                                        : 0
                                }).ToList()
                            })
                            .ToList();
                    }
                }

                // ─── نوع پرداخت ───
                var typesResult = await _serviceTypePeyment.GetAllTypePeyment(0);

                // ─── پاسخ ───
                var response = new
                {
                    Products = products,
                    PaymentTypes = typesResult.IsSuccess
                        ? JsonSerializer.Deserialize<List<TypePeyment>>(typesResult.Data)
                        : new List<TypePeyment>()
                };

                return ServiseResult<string>.Success(
                    JsonSerializer.Serialize(response, new JsonSerializerOptions
                    {
                        WriteIndented = false,
                        PropertyNamingPolicy = null
                    })
                );
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure($"خطا: {ex.Message}");
            }
        }

        // ─────────────────────────────────────────────────────
        // دریافت سفارش توسط شناسه (برای مشاهده سفارش قبلی)
        // POST: /ShopPanel/Recommendation/GetById
        // ─────────────────────────────────────────────────────
        [HttpPost("GetById")]
        [RequireLogin]
        [ValidateAntiForgeryToken]
        public async Task<ServiseResult<string>> GetById([FromForm] int Id)
        {
            if (Id <= 0)
                return ServiseResult<string>.Failure("شناسه سفارش نامعتبر است");

            var personelId = await GetCurrentPersonelIdAsync();
            if (personelId == null)
                return ServiseResult<string>.Failure("دوباره وارد شوید");

            try
            {
                var result = await _serviceRecommendations.GetRecommendations(Id);

                if (!result.IsSuccess)
                    return ServiseResult<string>.Failure(result.ErrorTitle ?? "خطا در دریافت سفارش");

                var recommendations = Newtonsoft.Json.JsonConvert
                    .DeserializeObject<List<Recommendations>>(result.Data);

                if (recommendations == null || recommendations.Count == 0)
                    return ServiseResult<string>.Failure("سفارش یافت نشد");

                var rec = recommendations[0];

                // ─── چک مالکیت ───
                if (rec.PersonelId != personelId.Value)
                    return ServiseResult<string>.Failure("دسترسی غیرمجاز");

                return ServiseResult<string>.Success(result.Data);
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure($"خطا: {ex.Message}");
            }
        }

        // ═══════════════════════════════════════════════════════
        // ۳. ثبت سفارش و پرداخت
        // ═══════════════════════════════════════════════════════

        // ─────────────────────────────────────────────────────
        // ثبت سفارش + محاسبه مبلغ
        // POST: /ShopPanel/Recommendation/Checkout
        // ─────────────────────────────────────────────────────
        [HttpPost("Checkout")]
        [RequireLogin]
        [ValidateAntiForgeryToken]
        public async Task<ServiseResult<string>> Checkout(CheckoutModel model)
        {
            // ─── اعتبارسنجی ورودی ───
            if (model == null || model.Items == null || model.Items.Count == 0)
                return ServiseResult<string>.Failure("سبد خرید خالی است");

            if (model.TypePeymentId <= 0)
                return ServiseResult<string>.Failure("نوع پرداخت انتخاب نشده");

            var personelId = await GetCurrentPersonelIdAsync();
            if (personelId == null)
                return ServiseResult<string>.Failure("دوباره وارد شوید");

            try
            {
                bool isCashOnDelivery = model.TypePeymentId == 1;

                // ═══ ۱. ساخت Recommendations ═══
                var recommendations = new Recommendations
                {
                    RecommendationsId = model.RecommendationsId,
                    RecommendationsCaption = "سفارش " + DateConverter.MiladiToPersian(DateTime.Now),
                    PersonelId = personelId.Value,
                    DateTimeRecord = DateTime.Now,
                    LevelOrder = isCashOnDelivery ? 4 : 3,
                    Command = isCashOnDelivery ? "پرداخت درب منزل" : "در انتظار پرداخت",
                    Status = true
                };

                var recResult = await _serviceRecommendations.UpdateRecommendations(recommendations);
                if (!recResult.IsSuccess)
                    return ServiseResult<string>.Failure(recResult.ErrorTitle ?? "خطا در ثبت سفارش");

                int recommendationId = 0;
                int.TryParse(recResult.Data?.ToString(), out recommendationId);

                // ═══ ۲. محاسبه مبلغ + ساخت Order ها ═══
                long totalValue = 0;
                var orderItems = new List<Order>();

                foreach (var item in model.Items)
                {
                    if (item.ColorPriceProductId <= 0 || item.NumberProduct <= 0)
                        return ServiseResult<string>.Failure("آیتم نامعتبر");

                    // ─── چک موجودی + قیمت ───
                    var colorInfo = await _serviceQueryDB.GetsDynamicDataViewByQuery(
                        $"SELECT PriceProduct, InStore FROM ColorPriceProduct WHERE ColorPriceProductId = {item.ColorPriceProductId}");

                    if (!colorInfo.IsSuccess || colorInfo.Data?.Count == 0)
                        return ServiseResult<string>.Failure($"رنگ {item.ColorPriceProductId} یافت نشد");

                    var colorData = colorInfo.Data[0];
                    long price = colorData.PriceProduct != null
                        ? Convert.ToInt32(colorData.PriceProduct) : 0L;
                    int inStore = colorData.InStore != null
                        ? Convert.ToInt32(colorData.InStore) : 0;

                    // ─── چک موجودی ───
                    if (inStore < item.NumberProduct)
                    {
                        return ServiseResult<string>.Failure(
                            $"موجودی کافی نیست. فقط {inStore} عدد در انبار موجود است.");
                    }

                    totalValue += price * item.NumberProduct;

                    orderItems.Add(new Order
                    {
                        RecommendationsId = recommendationId,
                        ColorPriceProductId = item.ColorPriceProductId,
                        NumberProduct = item.NumberProduct,
                        Status = true
                    });
                }

                // ═══ ۳. ذخیره Order ها ═══
                foreach (var order in orderItems)
                {
                    var orderResult = await _serviceOrder.UpdateOrder(order);
                    if (!orderResult.IsSuccess)
                        return ServiseResult<string>.Failure("خطا در ثبت اقلام سفارش");
                }

                // ═══ ۴. ساخت Receipt (فقط پرداخت آنلاین) ═══
                int receiptId = 0;

                if (!isCashOnDelivery)
                {
                    var receipt = new Receipt
                    {
                        ReceiptId = 0,
                        ReceiptCaption = $"رسید #{DateConverter.MiladiToPersian(DateTime.Now)}",
                        TypePeymentId = model.TypePeymentId,
                        DoPeyment = false,
                        RecommendationsId = recommendationId,
                        ValuePeyment = (int)totalValue,
                        DateTimePeyment = DateTime.Now,
                        Status = true
                    };

                    var receiptResult = await _serviceReceipt.UpdateReceipt(receipt);
                    if (!receiptResult.IsSuccess)
                        return ServiseResult<string>.Failure("خطا در ساخت رسید");

                    int.TryParse(receiptResult.Data?.ToString(), out receiptId);
                }

                // ═══ ۵. پاسخ ═══
                var response = new
                {
                    RecommendationId = recommendationId,
                    ReceiptId = receiptId,
                    LevelOrder = recommendations.LevelOrder,
                    TotalValue = totalValue
                };

                return ServiseResult<string>.Success(JsonSerializer.Serialize(response));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure($"خطای سرور: {ex.Message}");
            }
        }

        // ─────────────────────────────────────────────────────
        // دریافت لینک درگاه پرداخت
        // POST: /ShopPanel/Recommendation/GetPaymentLink
        // ─────────────────────────────────────────────────────
        [HttpPost("GetPaymentLink")]
        [RequireLogin]
        [ValidateAntiForgeryToken]
        public async Task<ServiseResult<string>> GetPaymentLink(int receiptId, int recommendationId)
        {
            if (receiptId <= 0)
                return ServiseResult<string>.Failure("شناسه رسید نامعتبر");

            try
            {
                // ═══ فراخوانی درگاه پرداخت ═══
                // اینجا API درگاه واقعی رو صدا بزن
                // مثلاً: ZarinPal, IDPay, NextPay, ...

                // ─── نمونه (Mock) ───
                var paymentUrl = $"https://gateway.example.com/pay?receipt={receiptId}&rec={recommendationId}";

                // یا اگه سرویس داری:
                // var gatewayResult = await _paymentService.RequestPayment(receiptId, totalValue);
                // if (!gatewayResult.IsSuccess) return ...;
                // paymentUrl = gatewayResult.Data;

                var response = new { PaymentUrl = paymentUrl };

                return ServiseResult<string>.Success(JsonSerializer.Serialize(response));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure($"خطا در اتصال به درگاه: {ex.Message}");
            }
        }
        // ═══════════════════════════════════════════════════════
        // ⭐ ارجاع سفارش (LevelOrder = 8)
        // POST: /ShopPanel/Recommendation/Refer
        // Body: { orderId, note }
        // ═══════════════════════════════════════════════════════
        [HttpPost("Refer")]
        [RequireLogin]
        [ValidateAntiForgeryToken]
        public async Task<ServiseResult<string>> Refer()
        {
            var personelId = await GetCurrentPersonelIdAsync();
            if (personelId == null)
                return ServiseResult<string>.Failure("دوباره وارد شوید");

            // ─── پارامترها ───
            int orderId = 0;
            string note = "";

            if (Request.Form.TryGetValue("orderId", out var o))
                int.TryParse(o, out orderId);
            if (Request.Form.TryGetValue("note", out var n))
                note = n.ToString()?.Trim() ?? "";

            if (orderId <= 0)
                return ServiseResult<string>.Failure("شناسه سفارش نامعتبر");

            if (string.IsNullOrWhiteSpace(note) || note.Length > 1000)
                return ServiseResult<string>.Failure("متن ارجاع نامعتبر (حداکثر 1000 کاراکتر)");

            // ─── دریافت سفارش ───
            var result = await _serviceRecommendations.GetRecommendations(orderId);
            if (!result.IsSuccess)
                return ServiseResult<string>.Failure("سفارش یافت نشد");

            var recommendations = Newtonsoft.Json.JsonConvert
                .DeserializeObject<List<Recommendations>>(result.Data);

            if (recommendations == null || recommendations.Count == 0)
                return ServiseResult<string>.Failure("سفارش یافت نشد");

            var rec = recommendations[0];

            // ─── چک مالکیت ───
            if (rec.PersonelId != personelId.Value)
                return ServiseResult<string>.Failure("این سفارش متعلق به شما نیست");

            // ─── چک وضعیت ───
            if (rec.LevelOrder == 8)
                return ServiseResult<string>.Failure("این سفارش قبلاً ارجاع شده است");

            if (rec.LevelOrder == 7)
                return ServiseResult<string>.Failure("سفارش تحویل داده شده و قابل ارجاع نیست");

            // ─── آپدیت ───
            rec.LevelOrder = 8;                  // ← ارجاع شده
            rec.Command = note;

            var updateResult = await _serviceRecommendations.UpdateRecommendations(rec);

            if (!updateResult.IsSuccess)
                return ServiseResult<string>.Failure("خطا در ثبت ارجاع");

            return ServiseResult<string>.Success("سفارش با موفقیت ارجاع شد ✅");
        }
        // ═══════════════════════════════════════════════════════
        // ⭐ پرداخت سفارش (برای سفارشاتی که رسید ندارن)
        // POST: /ShopPanel/Recommendation/Pay
        // Body: { orderId, typePeymentId }
        // ═══════════════════════════════════════════════════════
        [HttpPost("Pay")]
        [RequireLogin]
        [ValidateAntiForgeryToken]
        public async Task<ServiseResult<string>> Pay()
        {
            var personelId = await GetCurrentPersonelIdAsync();
            if (personelId == null)
                return ServiseResult<string>.Failure("دوباره وارد شوید");

            // ─── پارامترها ───
            int orderId = 0, typePeymentId = 0;

            if (Request.Form.TryGetValue("orderId", out var o))
                int.TryParse(o, out orderId);
            if (Request.Form.TryGetValue("typePeymentId", out var t))
                int.TryParse(t, out typePeymentId);

            if (orderId <= 0)
                return ServiseResult<string>.Failure("شناسه سفارش نامعتبر");

            if (typePeymentId <= 0)
                return ServiseResult<string>.Failure("نوع پرداخت را انتخاب کنید");

            // ─── دریافت سفارش ───
            var result = await _serviceRecommendations.GetRecommendations(orderId);
            if (!result.IsSuccess)
                return ServiseResult<string>.Failure("سفارش یافت نشد");

            var recommendations = Newtonsoft.Json.JsonConvert
                .DeserializeObject<List<Recommendations>>(result.Data);

            if (recommendations == null || recommendations.Count == 0)
                return ServiseResult<string>.Failure("سفارش یافت نشد");

            var rec = recommendations[0];

            // ─── چک مالکیت ───
            if (rec.PersonelId != personelId.Value)
                return ServiseResult<string>.Failure("این سفارش متعلق به شما نیست");

            // ─── چک وضعیت ───
            if (rec.LevelOrder == 7)
                return ServiseResult<string>.Failure("سفارش تحویل داده شده و نیاز به پرداخت ندارد");

            if (rec.LevelOrder == 8)
                return ServiseResult<string>.Failure("سفارش ارجاع شده و قابل پرداخت نیست");

            // ─── چک وجود رسید ───
            if (rec.ReceiptId != null && rec.ReceiptId.Count > 0)
            {
                var existingReceipt = rec.ReceiptId[0];
                if (existingReceipt.DoPeyment)
                    return ServiseResult<string>.Failure("این سفارش قبلاً پرداخت شده است");

                // ─── اگه رسید هست ولی پرداخت نشده، آپدیتش کن ───
                existingReceipt.TypePeymentId = typePeymentId;
                existingReceipt.Status = true;

                var updateResult = await _serviceReceipt.UpdateReceipt(existingReceipt);

                if (!updateResult.IsSuccess)
                    return ServiseResult<string>.Failure("خطا در ثبت پرداخت");

                // ─── آپدیت LevelOrder ───
                rec.LevelOrder = 3;
                await _serviceRecommendations.UpdateRecommendations(rec);

                return ServiseResult<string>.Success("پرداخت با موفقیت ثبت شد ✅");
            }

            // ═══════════════════════════════════════════════════════
            // ⭐ محاسبه مبلغ کل سفارش
            // ═══════════════════════════════════════════════════════
            long totalValue = 0;

            if (rec.OrderId != null && rec.OrderId.Count > 0)
            {
                foreach (var order in rec.OrderId)
                {
                    var colorInfo = await _serviceQueryDB.GetsDynamicDataViewByQuery(
                        $"SELECT PriceProduct, Offer FROM ColorPriceProduct WHERE ColorPriceProductId = {order.ColorPriceProductId}");

                    if (colorInfo.IsSuccess && colorInfo.Data?.Count > 0)
                    {
                        var colorData = colorInfo.Data[0];
                        long price = colorData.PriceProduct != null
                            ? Convert.ToInt32(colorData.PriceProduct) : 0L;
                        int offer = colorData.Offer != null
                            ? Convert.ToInt32(colorData.Offer) : 0;

                        // ─── اعمال تخفیف ───
                        if (offer > 0)
                        {
                            price = (long)(price * (1 - offer / 100.0));
                        }

                        totalValue += price * order.NumberProduct;
                    }
                }
            }

            if (totalValue <= 0)
                return ServiseResult<string>.Failure("مبلغ سفارش نامعتبر است");

            // ═══════════════════════════════════════════════════════
            // ⭐ ساخت Receipt جدید
            // ═══════════════════════════════════════════════════════
            var receipt = new Receipt
            {
                ReceiptId = 0,
                ReceiptCaption = $"رسید #{DateConverter.MiladiToPersian(DateTime.Now)}",
                TypePeymentId = typePeymentId,
                DoPeyment = false,
                RecommendationsId = orderId,
                ValuePeyment = (int)totalValue,
                DateTimePeyment = DateTime.Now,
                Status = true
            };

            var receiptResult = await _serviceReceipt.UpdateReceipt(receipt);
            if (!receiptResult.IsSuccess)
                return ServiseResult<string>.Failure("خطا در ثبت رسید پرداخت");

            // ═══════════════════════════════════════════════════════
            // ⭐ آپدیت LevelOrder = 3 (پرداخت)
            // ═══════════════════════════════════════════════════════
            rec.LevelOrder = 3;
            await _serviceRecommendations.UpdateRecommendations(rec);

            return ServiseResult<string>.Success("پرداخت با موفقیت ثبت شد ✅");
        }

    }

    
}