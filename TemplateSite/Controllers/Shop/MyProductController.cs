// TemplateSite/Controllers/ShopPanel/MyProductController.cs
using Application.Services;
using Domain.Models;
using Domain.ServiseResult;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using TemplateSite.Filters;

namespace TemplateSite.Controllers.ShopPanel
{
    /// <summary>
    /// کنترلر مدیریت محصولات برای صاحب مغازه
    /// فقط محصولات فروشگاه‌های خودش
    /// </summary>
    [Route("MyProduct")]
    public class MyProductController : ShopBaseController
    {
        private readonly IServiceProduct _serviceProduct;
        private readonly IServiceStore _serviceStore;
        private readonly IServiceKindProduct _serviceKindProduct;
        private readonly IServiceQueryDB _serviceQueryDB;
        private readonly IServiceChekerEnter _serviceCheker;

        public MyProductController(
            SignInManager<Userapp> signInManager,
            UserManager<Userapp> userManager,
            IServiceProduct serviceProduct,
            IServiceStore serviceStore,
            IServiceKindProduct serviceKindProduct,
            IServiceQueryDB serviceQueryDB,
            IServiceChekerEnter serviceCheker)
            : base(signInManager, userManager)
        {
            _serviceProduct = serviceProduct;
            _serviceStore = serviceStore;
            _serviceKindProduct = serviceKindProduct;
            _serviceQueryDB = serviceQueryDB;
            _serviceCheker = serviceCheker;
        }

        // ═══════════════════════════════════════════════════════
        // صفحه اصلی
        // GET: /MyProduct
        // ═══════════════════════════════════════════════════════
        [HttpGet("")]
        [RequireLogin]
        public async Task<IActionResult> Index()
        {
            var personelId = await GetCurrentPersonelIdAsync();
            if (personelId == null)
                return RedirectToAction("Login", "Account");
            return View("~/Views/MyProduct/Index.cshtml");
        }

        // ═══════════════════════════════════════════════════════
        // GetAll — همه محصولات (فروشگاه‌های مجاز)
        // POST: /MyProduct/GetAll
        // Body: { storeId } (اختیاری — 0 = همه)
        // ═══════════════════════════════════════════════════════
        [HttpPost("GetAll")]
        [RequireLogin]
        [ValidateAntiForgeryToken]
        public async Task<ServiseResult<string>> GetAll()
        {
            var personelId = await GetCurrentPersonelIdAsync();
            if (personelId == null)
                return ServiseResult<string>.Failure("دوباره وارد شوید");

            // ─── storeId اختیاری ───
            int storeId = 0;
            if (Request.Form.TryGetValue("storeId", out var s))
                int.TryParse(s, out storeId);

            // ─── فروشگاه‌های مجاز ───
            var allowedStoreIds = await GetAllowedStoreIds(personelId.Value);

            if (allowedStoreIds == null || allowedStoreIds.Count == 0)
                return ServiseResult<string>.Failure("شما فروشگاهی ندارید");

            // ─── فیلتر بر اساس storeId ───
            if (storeId > 0)
            {
                if (!allowedStoreIds.Contains(storeId))
                    return ServiseResult<string>.Failure("دسترسی غیرمجاز");

                return await _serviceProduct.GetByStore(storeId);
            }

            // ─── همه فروشگاه‌ها ───
            return await _serviceProduct.GetByStores(allowedStoreIds);
        }

        // ═══════════════════════════════════════════════════════
        // GetById — یک محصول (با چک مالکیت)
        // POST: /MyProduct/GetById
        // Body: { id }
        // ═══════════════════════════════════════════════════════
        [HttpPost("GetById")]
        [RequireLogin]
        [ValidateAntiForgeryToken]
        public async Task<ServiseResult<string>> GetById()
        {
            var personelId = await GetCurrentPersonelIdAsync();
            if (personelId == null)
                return ServiseResult<string>.Failure("دوباره وارد شوید");

            int id = 0;
            if (Request.Form.TryGetValue("id", out var i))
                int.TryParse(i, out id);

            if (id <= 0)
                return ServiseResult<string>.Failure("شناسه نامعتبر");

            // ─── چک مالکیت ───
            var ownership = await CheckProductOwnership(personelId.Value, id);
            if (!ownership)
                return ServiseResult<string>.Failure("دسترسی غیرمجاز");

            return await _serviceProduct.GetProduct(id);
        }

        // ═══════════════════════════════════════════════════════
        // Add — افزودن محصول
        // POST: /MyProduct/Add
        // ═══════════════════════════════════════════════════════
        [HttpPost("Add")]
        [RequireLogin]
        [ValidateAntiForgeryToken]
        public async Task<ServiseResult<string>> Add()
        {
            var personelId = await GetCurrentPersonelIdAsync();
            if (personelId == null)
                return ServiseResult<string>.Failure("دوباره وارد شوید");

            // ─── پارامترها ───
            int storeId = 0, kindProductId = 0;
            string productCaption = "", detailProducts = "";
            int? priceProduct = null;

            if (Request.Form.TryGetValue("storeId", out var s))
                int.TryParse(s, out storeId);
            if (Request.Form.TryGetValue("kindProductId", out var k))
                int.TryParse(k, out kindProductId);
            if (Request.Form.TryGetValue("productCaption", out var c))
                productCaption = c.ToString()?.Trim() ?? "";
            if (Request.Form.TryGetValue("detailProducts", out var d))
                detailProducts = d.ToString()?.Trim() ?? "";
            if (Request.Form.TryGetValue("priceProduct", out var p))
            {
                if (int.TryParse(p, out var price)) priceProduct = price;
            }

            // ─── اعتبارسنجی ───
            if (storeId <= 0)
                return ServiseResult<string>.Failure("فروشگاه را انتخاب کنید");

            if (kindProductId <= 0)
                return ServiseResult<string>.Failure("دسته‌بندی را انتخاب کنید");

            if (string.IsNullOrWhiteSpace(productCaption) || productCaption.Length > 200)
                return ServiseResult<string>.Failure("عنوان محصول نامعتبر");

            // ─── چک مالکیت ───
            var allowedStoreIds = await GetAllowedStoreIds(personelId.Value);
            if (allowedStoreIds == null || !allowedStoreIds.Contains(storeId))
                return ServiseResult<string>.Failure("دسترسی غیرمجاز");

            // ─── ساخت محصول ───
            var product = new Product
            {
                ProductId = 0,
                ProductCaption = productCaption,
                KindProductId = kindProductId,
                DetailProducts = string.IsNullOrWhiteSpace(detailProducts) ? null : detailProducts,
                PriceProduct = priceProduct,
                StoreId = storeId,
                Status = true
            };

            return await _serviceProduct.UpdateProduct(product);
        }

        // ═══════════════════════════════════════════════════════
        // Update — ویرایش محصول
        // POST: /MyProduct/Update
        // Body: { productId, kindProductId, productCaption, detailProducts, priceProduct, status }
        // ═══════════════════════════════════════════════════════
        [HttpPost("Update")]
        [RequireLogin]
        [ValidateAntiForgeryToken]
        public async Task<ServiseResult<string>> Update()
        {
            var personelId = await GetCurrentPersonelIdAsync();
            if (personelId == null)
                return ServiseResult<string>.Failure("دوباره وارد شوید");

            // ─── پارامترها ───
            int productId = 0, kindProductId = 0;
            string productCaption = "", detailProducts = "";
            int? priceProduct = null;
            bool status = true;

            if (Request.Form.TryGetValue("productId", out var pi))
                int.TryParse(pi, out productId);
            if (Request.Form.TryGetValue("kindProductId", out var k))
                int.TryParse(k, out kindProductId);
            if (Request.Form.TryGetValue("productCaption", out var c))
                productCaption = c.ToString()?.Trim() ?? "";
            if (Request.Form.TryGetValue("detailProducts", out var d))
                detailProducts = d.ToString()?.Trim() ?? "";
            if (Request.Form.TryGetValue("priceProduct", out var p))
            {
                if (int.TryParse(p, out var price)) priceProduct = price;
            }
            if (Request.Form.TryGetValue("status", out var st))
                status = st.ToString() == "true";

            // ─── اعتبارسنجی ───
            if (productId <= 0)
                return ServiseResult<string>.Failure("شناسه محصول نامعتبر");

            if (kindProductId <= 0)
                return ServiseResult<string>.Failure("دسته‌بندی را انتخاب کنید");

            if (string.IsNullOrWhiteSpace(productCaption) || productCaption.Length > 200)
                return ServiseResult<string>.Failure("عنوان محصول نامعتبر");

            // ─── چک مالکیت ───
            var ownership = await CheckProductOwnership(personelId.Value, productId);
            if (!ownership)
                return ServiseResult<string>.Failure("دسترسی غیرمجاز");

            // ─── دریافت محصول موجود ───
            var existingResult = await _serviceProduct.GetProduct(productId);
            if (!existingResult.IsSuccess)
                return ServiseResult<string>.Failure("محصول یافت نشد");

            var products = JsonConvert.DeserializeObject<List<Product>>(existingResult.Data);
            if (products == null || products.Count == 0)
                return ServiseResult<string>.Failure("محصول یافت نشد");

            var existing = products[0];

            // ─── آپدیت ───
            var product = new Product
            {
                ProductId = productId,
                ProductCaption = productCaption,
                KindProductId = kindProductId,
                DetailProducts = string.IsNullOrWhiteSpace(detailProducts) ? null : detailProducts,
                PriceProduct = priceProduct,
                StoreId = existing.StoreId,    // ← فروشگاه عوض نمی‌شه
                CodeInternalProducts = existing.CodeInternalProducts,  // ← کد عوض نمی‌شه
                Status = status
            };

            return await _serviceProduct.UpdateProduct(product);
        }

        // ═══════════════════════════════════════════════════════
        // Delete — حذف محصول
        // POST: /MyProduct/Delete
        // Body: { id }
        // ═══════════════════════════════════════════════════════
        [HttpPost("Delete")]
        [RequireLogin]
        [ValidateAntiForgeryToken]
        public async Task<ServiseResult<string>> Delete()
        {
            var personelId = await GetCurrentPersonelIdAsync();
            if (personelId == null)
                return ServiseResult<string>.Failure("دوباره وارد شوید");

            int id = 0;
            if (Request.Form.TryGetValue("id", out var i))
                int.TryParse(i, out id);

            if (id <= 0)
                return ServiseResult<string>.Failure("شناسه نامعتبر");

            // ─── چک مالکیت ───
            var ownership = await CheckProductOwnership(personelId.Value, id);
            if (!ownership)
                return ServiseResult<string>.Failure("دسترسی غیرمجاز");

            return await _serviceProduct.DeleteProduct(id);
        }

        // ═══════════════════════════════════════════════════════
        // ToggleStatus — تغییر وضعیت
        // POST: /MyProduct/ToggleStatus
        // Body: { id, status }
        // ═══════════════════════════════════════════════════════
        [HttpPost("ToggleStatus")]
        [RequireLogin]
        [ValidateAntiForgeryToken]
        public async Task<ServiseResult<string>> ToggleStatus()
        {
            var personelId = await GetCurrentPersonelIdAsync();
            if (personelId == null)
                return ServiseResult<string>.Failure("دوباره وارد شوید");

            int id = 0;
            bool status = true;

            if (Request.Form.TryGetValue("id", out var i))
                int.TryParse(i, out id);
            if (Request.Form.TryGetValue("status", out var st))
                status = st.ToString() == "true";

            if (id <= 0)
                return ServiseResult<string>.Failure("شناسه نامعتبر");

            var ownership = await CheckProductOwnership(personelId.Value, id);
            if (!ownership)
                return ServiseResult<string>.Failure("دسترسی غیرمجاز");

            // ─── دریافت و آپدیت ───
            var existingResult = await _serviceProduct.GetProduct(id);
            if (!existingResult.IsSuccess)
                return ServiseResult<string>.Failure("محصول یافت نشد");

            var products = JsonConvert.DeserializeObject<List<Product>>(existingResult.Data);
            if (products == null || products.Count == 0)
                return ServiseResult<string>.Failure("محصول یافت نشد");

            var existing = products[0];

            var product = new Product
            {
                ProductId = id,
                ProductCaption = existing.ProductCaption,
                KindProductId = existing.KindProductId,
                DetailProducts = existing.DetailProducts,
                PriceProduct = existing.PriceProduct,
                StoreId = existing.StoreId,
                CodeInternalProducts = existing.CodeInternalProducts,
                Status = status
            };

            return await _serviceProduct.UpdateProduct(product);
        }

        // ═══════════════════════════════════════════════════════
        // GetKinds — دسته‌بندی‌ها (فقط خواندن — Admin مدیریت می‌کند)
        // POST: /MyProduct/GetKinds
        // ═══════════════════════════════════════════════════════
        [HttpPost("GetKinds")]
        [RequireLogin]
        [ValidateAntiForgeryToken]
        public async Task<ServiseResult<string>> GetKinds()
        {
            var personelId = await GetCurrentPersonelIdAsync();
            if (personelId == null)
                return ServiseResult<string>.Failure("دوباره وارد شوید");

            // ─── همه KindProduct ها ───
            return await _serviceKindProduct.GetAllKindProduct(0);
        }

        // ═══════════════════════════════════════════════════════
        // GetStores — فروشگاه‌های کاربر (برای Select)
        // POST: /MyProduct/GetStores
        // ═══════════════════════════════════════════════════════
        [HttpPost("GetStores")]
        [RequireLogin]
        [ValidateAntiForgeryToken]
        public async Task<ServiseResult<string>> GetStores()
        {
            var personelId = await GetCurrentPersonelIdAsync();
            if (personelId == null)
                return ServiseResult<string>.Failure("دوباره وارد شوید");

            var storesResult = await _serviceStore.GetStoreById(personelId.Value);
            return storesResult;
        }

        // ═══════════════════════════════════════════════════════
        // Helper — فروشگاه‌های مجاز کاربر
        // ═══════════════════════════════════════════════════════
        private async Task<List<int>> GetAllowedStoreIds(int personelId)
        {
            bool isAdmin = User.IsInRole("Admin") || User.IsInRole("Administrator");

            if (isAdmin)
            {
                // ─── Admin: همه فروشگاه‌ها ───
                var allStores = await _serviceQueryDB.GetsDynamicDataViewByQuery(
                    "SELECT StoreId FROM Store WHERE Status = 1");

                if (allStores.IsSuccess && allStores.Data != null)
                {
                    return allStores.Data
                           .Select(x => (IDictionary<string, object>)x)
                           .Where(d => d.ContainsKey("StoreId") && d["StoreId"] != null && d["StoreId"] != DBNull.Value)
                           .Select(d => Convert.ToInt32(d["StoreId"]))
                           .ToList();
                }

                return new List<int>();
            }

            // ─── StoreOwner: فقط فروشگاه‌های خودش ───
            var storeIdsResult = await _serviceStore.GetStoreIds(personelId);
            if (!storeIdsResult.IsSuccess)
                return new List<int>();

            return JsonConvert.DeserializeObject<List<int>>(storeIdsResult.Data)
                   ?? new List<int>();
        }

        // ═══════════════════════════════════════════════════════
        // Helper — چک مالکیت محصول
        // ═══════════════════════════════════════════════════════
        private async Task<bool> CheckProductOwnership(int personelId, int productId)
        {
            bool isAdmin = User.IsInRole("Admin") || User.IsInRole("Administrator");
            if (isAdmin) return true;

            // ─── دریافت محصول ───
            var productResult = await _serviceProduct.GetProduct(productId);
            if (!productResult.IsSuccess) return false;

            var products = JsonConvert.DeserializeObject<List<Product>>(productResult.Data);
            if (products == null || products.Count == 0) return false;

            var product = products[0];

            // ─── چک فروشگاه ───
            var allowedStoreIds = await GetAllowedStoreIds(personelId);
            return allowedStoreIds.Contains(product.StoreId);
        }
 

    }
}