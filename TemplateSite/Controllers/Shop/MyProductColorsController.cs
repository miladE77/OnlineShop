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
    /// مدیریت رنگ‌بندی محصولات (ColorPriceProduct)
    /// مخصوص صاحب مغازه — فقط برای فروشگاه‌های خودش
    /// </summary>
    [Route("MyProductColors")]
    public class MyProductColorsController : ShopBaseController
    {
        private readonly IServiceColorPriceProduct _serviceColorPriceProduct;
        private readonly IServiceProduct _serviceProduct;
        private readonly IServiceStore _serviceStore;
        private readonly IServiceQueryDB _serviceQueryDB;

        public MyProductColorsController(
            SignInManager<Userapp> signInManager,
            UserManager<Userapp> userManager,
            IServiceColorPriceProduct serviceColorPriceProduct,
            IServiceProduct serviceProduct,
            IServiceStore serviceStore,
            IServiceQueryDB serviceQueryDB)
            : base(signInManager, userManager)
        {
            _serviceColorPriceProduct = serviceColorPriceProduct;
            _serviceProduct = serviceProduct;
            _serviceStore = serviceStore;
            _serviceQueryDB = serviceQueryDB;
        }

        // ═══════════════════════════════════════════════════════
        // GetAll — رنگ‌های یک محصول
        // POST: /MyProductColors/GetAll
        // Body: { productId }
        // ═══════════════════════════════════════════════════════
        [HttpPost("GetAll")]
        [RequireLogin]
        [ValidateAntiForgeryToken]
        public async Task<ServiseResult<string>> GetAll()
        {
            var personelId = await GetCurrentPersonelIdAsync();
            if (personelId == null)
                return ServiseResult<string>.Failure("دوباره وارد شوید");

            int productId = 0;
            if (Request.Form.TryGetValue("productId", out var p))
                int.TryParse(p, out productId);

            if (productId <= 0)
                return ServiseResult<string>.Failure("شناسه محصول نامعتبر");

            // ─── چک مالکیت ───
            var ownership = await CheckProductOwnership(personelId.Value, productId);
            if (!ownership)
                return ServiseResult<string>.Failure("دسترسی غیرمجاز");

            return await _serviceQueryDB.GetsJsonDataViewByQuery(
                $"SELECT * FROM ColorPriceProductView WHERE ProductId = {productId}");
        }

        // ═══════════════════════════════════════════════════════
        // Add — افزودن رنگ
        // POST: /MyProductColors/Add
        // Body: { productId, colorCaption, price, offer, inStore }
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
            int productId = 0;
            string colorCaption = "";
            int? priceProduct = null;
            int? offer = null;
            int? inStore = null;

            if (Request.Form.TryGetValue("productId", out var p))
                int.TryParse(p, out productId);
            if (Request.Form.TryGetValue("colorCaption", out var c))
                colorCaption = c.ToString()?.Trim() ?? "";
            if (Request.Form.TryGetValue("price", out var pr))
            {
                if (int.TryParse(pr, out var price)) priceProduct = price;
            }
            if (Request.Form.TryGetValue("offer", out var o))
            {
                if (int.TryParse(o, out var offerVal)) offer = offerVal;
            }
            if (Request.Form.TryGetValue("inStore", out var st))
            {
                if (int.TryParse(st, out var stock)) inStore = stock;
            }

            // ─── اعتبارسنجی ───
            if (productId <= 0)
                return ServiseResult<string>.Failure("شناسه محصول نامعتبر");

            if (string.IsNullOrWhiteSpace(colorCaption) || colorCaption.Length > 100)
                return ServiseResult<string>.Failure("عنوان رنگ نامعتبر");

            // ─── چک مالکیت ───
            var ownership = await CheckProductOwnership(personelId.Value, productId);
            if (!ownership)
                return ServiseResult<string>.Failure("دسترسی غیرمجاز");

            // ─── ساخت رنگ ───
            var color = new ColorPriceProduct
            {
                ColorPriceProductId = 0,
                ColorPriceProductCaption = colorCaption,
                PriceProduct = priceProduct,
                Offer = offer,
                ProductId = productId,
                InStore = inStore,
                Status = true
            };

            return await _serviceColorPriceProduct.UpdateColorPriceProduct(color);
        }

        // ═══════════════════════════════════════════════════════
        // Update — ویرایش رنگ
        // POST: /MyProductColors/Update
        // Body: { colorId, colorCaption, price, offer, inStore }
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
            int colorId = 0;
            string colorCaption = "";
            int? priceProduct = null;
            int? offer = null;
            int? inStore = null;

            if (Request.Form.TryGetValue("colorId", out var ci))
                int.TryParse(ci, out colorId);
            if (Request.Form.TryGetValue("colorCaption", out var c))
                colorCaption = c.ToString()?.Trim() ?? "";
            if (Request.Form.TryGetValue("price", out var pr))
            {
                if (int.TryParse(pr, out var price)) priceProduct = price;
            }
            if (Request.Form.TryGetValue("offer", out var o))
            {
                if (int.TryParse(o, out var offerVal)) offer = offerVal;
            }
            if (Request.Form.TryGetValue("inStore", out var st))
            {
                if (int.TryParse(st, out var stock)) inStore = stock;
            }

            // ─── اعتبارسنجی ───
            if (colorId <= 0)
                return ServiseResult<string>.Failure("شناسه رنگ نامعتبر");

            if (string.IsNullOrWhiteSpace(colorCaption) || colorCaption.Length > 100)
                return ServiseResult<string>.Failure("عنوان رنگ نامعتبر");

            // ─── دریافت رنگ موجود ───
            var colorResult = await _serviceColorPriceProduct.GetColorPriceProduct(colorId);
            if (!colorResult.IsSuccess)
                return ServiseResult<string>.Failure("رنگ یافت نشد");

            var colors = JsonConvert.DeserializeObject<List<ColorPriceProduct>>(colorResult.Data);
            if (colors == null || colors.Count == 0)
                return ServiseResult<string>.Failure("رنگ یافت نشد");

            var existingColor = colors[0];

            // ─── چک مالکیت ───
            var ownership = await CheckProductOwnership(personelId.Value, existingColor.ProductId);
            if (!ownership)
                return ServiseResult<string>.Failure("دسترسی غیرمجاز");

            // ─── ساخت رنگ ───
            var color = new ColorPriceProduct
            {
                ColorPriceProductId = colorId,
                ColorPriceProductCaption = colorCaption,
                PriceProduct = priceProduct,
                Offer = offer,
                ProductId = existingColor.ProductId,
                InStore = inStore,
                Status = true
            };

            return await _serviceColorPriceProduct.UpdateColorPriceProduct(color);
        }

        // ═══════════════════════════════════════════════════════
        // Delete — حذف رنگ
        // POST: /MyProductColors/Delete
        // Body: { colorId }
        // ═══════════════════════════════════════════════════════
        [HttpPost("Delete")]
        [RequireLogin]
        [ValidateAntiForgeryToken]
        public async Task<ServiseResult<string>> Delete()
        {
            var personelId = await GetCurrentPersonelIdAsync();
            if (personelId == null)
                return ServiseResult<string>.Failure("دوباره وارد شوید");

            int colorId = 0;
            if (Request.Form.TryGetValue("colorId", out var ci))
                int.TryParse(ci, out colorId);

            if (colorId <= 0)
                return ServiseResult<string>.Failure("شناسه نامعتبر");

            // ─── دریافت رنگ ───
            var colorResult = await _serviceColorPriceProduct.GetColorPriceProduct(colorId);
            if (!colorResult.IsSuccess)
                return ServiseResult<string>.Failure("رنگ یافت نشد");

            var colors = JsonConvert.DeserializeObject<List<ColorPriceProduct>>(colorResult.Data);
            if (colors == null || colors.Count == 0)
                return ServiseResult<string>.Failure("رنگ یافت نشد");

            // ─── چک مالکیت ───
            var ownership = await CheckProductOwnership(personelId.Value, colors[0].ProductId);
            if (!ownership)
                return ServiseResult<string>.Failure("دسترسی غیرمجاز");

            return await _serviceColorPriceProduct.DeleteColorPriceProduct(colorId);
        }

        // ═══════════════════════════════════════════════════════
        // Helper — چک مالکیت محصول
        // ═══════════════════════════════════════════════════════
        private async Task<bool> CheckProductOwnership(int personelId, int productId)
        {
            bool isAdmin = User.IsInRole("Admin") || User.IsInRole("Administrator");
            if (isAdmin) return true;

            var productResult = await _serviceProduct.GetProduct(productId);
            if (!productResult.IsSuccess) return false;

            var products = JsonConvert.DeserializeObject<List<Product>>(productResult.Data);
            if (products == null || products.Count == 0) return false;

            var product = products[0];

            var storeIdsResult = await _serviceStore.GetStoreIds(personelId);
            if (!storeIdsResult.IsSuccess) return false;

            var allowedIds = JsonConvert.DeserializeObject<List<int>>(storeIdsResult.Data);
            return allowedIds != null && allowedIds.Contains(product.StoreId);
        }
    }
}