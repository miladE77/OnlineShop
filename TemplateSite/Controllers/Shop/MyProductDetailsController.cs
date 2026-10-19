// TemplateSite/Controllers/ShopPanel/MyProductDetailsController.cs
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
    /// مدیریت جزئیات محصول (DetailProduct)
    /// - OptionProductId = 1 → توضیحات تکمیلی
    /// - OptionProductId != 1 → مشخصات فنی
    /// </summary>
    [Route("MyProductDetails")]
    public class MyProductDetailsController : ShopBaseController
    {
        private readonly IServiceDetailProduct _serviceDetailProduct;
        private readonly IServiceProduct _serviceProduct;
        private readonly IServiceStore _serviceStore;
        private readonly IServiceOptionProduct _serviceOptionProduct;
        private readonly IServiceQueryDB _serviceQueryDB;

        public MyProductDetailsController(
            SignInManager<Userapp> signInManager,
            UserManager<Userapp> userManager,
            IServiceDetailProduct serviceDetailProduct,
            IServiceProduct serviceProduct,
            IServiceStore serviceStore,
            IServiceOptionProduct serviceOptionProduct,
            IServiceQueryDB serviceQueryDB)
            : base(signInManager, userManager)
        {
            _serviceDetailProduct = serviceDetailProduct;
            _serviceProduct = serviceProduct;
            _serviceStore = serviceStore;
            _serviceOptionProduct = serviceOptionProduct;
            _serviceQueryDB = serviceQueryDB;
        }

        // ═══════════════════════════════════════════════════════
        // GetAll — جزئیات یک محصول
        // POST: /MyProductDetails/GetAll
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

            var ownership = await CheckProductOwnership(personelId.Value, productId);
            if (!ownership)
                return ServiseResult<string>.Failure("دسترسی غیرمجاز");

            return await _serviceQueryDB.GetsJsonDataViewByQuery(
                $"SELECT * FROM DetailProductView WHERE ProductId = {productId} AND Status = 1");
        }

        // ═══════════════════════════════════════════════════════
        // Add — افزودن جزئیات
        // POST: /MyProductDetails/Add
        // Body: { productId, optionProductId, caption }
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
            int productId = 0, optionProductId = 0;
            string caption = "";

            if (Request.Form.TryGetValue("productId", out var p))
                int.TryParse(p, out productId);
            if (Request.Form.TryGetValue("optionProductId", out var o))
                int.TryParse(o, out optionProductId);
            if (Request.Form.TryGetValue("caption", out var c))
                caption = c.ToString()?.Trim() ?? "";

            // ─── اعتبارسنجی ───
            if (productId <= 0)
                return ServiseResult<string>.Failure("شناسه محصول نامعتبر");

            if (optionProductId <= 0)
                return ServiseResult<string>.Failure("مشخصه فنی را انتخاب کنید");

            if (string.IsNullOrWhiteSpace(caption) || caption.Length > 1000)
                return ServiseResult<string>.Failure("مقدار مشخصه نامعتبر");

            // ─── چک مالکیت ───
            var ownership = await CheckProductOwnership(personelId.Value, productId);
            if (!ownership)
                return ServiseResult<string>.Failure("دسترسی غیرمجاز");

            // ─── ساخت جزئیات ───
            var detail = new DetailProduct
            {
                DetailProductId = 0,
                DetailProductCaption = caption,
                OptionProductId = optionProductId,
                ProductId = productId,
                Status = true
            };

            return await _serviceDetailProduct.UpdateDetailProduct(detail);
        }

        // ═══════════════════════════════════════════════════════
        // Update — ویرایش جزئیات
        // POST: /MyProductDetails/Update
        // Body: { detailId, optionProductId, caption }
        // ═══════════════════════════════════════════════════════
        [HttpPost("Update")]
        [RequireLogin]
        [ValidateAntiForgeryToken]
        public async Task<ServiseResult<string>> Update()
        {
            var personelId = await GetCurrentPersonelIdAsync();
            if (personelId == null)
                return ServiseResult<string>.Failure("دوباره وارد شوید");

            int detailId = 0, optionProductId = 0;
            string caption = "";

            if (Request.Form.TryGetValue("detailId", out var d))
                int.TryParse(d, out detailId);
            if (Request.Form.TryGetValue("optionProductId", out var o))
                int.TryParse(o, out optionProductId);
            if (Request.Form.TryGetValue("caption", out var c))
                caption = c.ToString()?.Trim() ?? "";

            if (detailId <= 0)
                return ServiseResult<string>.Failure("شناسه نامعتبر");

            if (optionProductId <= 0)
                return ServiseResult<string>.Failure("مشخصه فنی را انتخاب کنید");

            if (string.IsNullOrWhiteSpace(caption) || caption.Length > 1000)
                return ServiseResult<string>.Failure("مقدار مشخصه نامعتبر");

            // ─── چک مالکیت ───
            var detailResult = await _serviceDetailProduct.GetDetailProduct(detailId);
            if (!detailResult.IsSuccess)
                return ServiseResult<string>.Failure("جزئیات یافت نشد");

            var details = JsonConvert.DeserializeObject<List<DetailProduct>>(detailResult.Data);
            if (details == null || details.Count == 0)
                return ServiseResult<string>.Failure("جزئیات یافت نشد");

            var ownership = await CheckProductOwnership(personelId.Value, details[0].ProductId);
            if (!ownership)
                return ServiseResult<string>.Failure("دسترسی غیرمجاز");

            // ─── ساخت ───
            var detail = new DetailProduct
            {
                DetailProductId = detailId,
                DetailProductCaption = caption,
                OptionProductId = optionProductId,
                ProductId = details[0].ProductId,
                Status = true
            };

            return await _serviceDetailProduct.UpdateDetailProduct(detail);
        }

        // ═══════════════════════════════════════════════════════
        // Delete — حذف جزئیات
        // POST: /MyProductDetails/Delete
        // Body: { detailId }
        // ═══════════════════════════════════════════════════════
        [HttpPost("Delete")]
        [RequireLogin]
        [ValidateAntiForgeryToken]
        public async Task<ServiseResult<string>> Delete()
        {
            var personelId = await GetCurrentPersonelIdAsync();
            if (personelId == null)
                return ServiseResult<string>.Failure("دوباره وارد شوید");

            int detailId = 0;
            if (Request.Form.TryGetValue("detailId", out var d))
                int.TryParse(d, out detailId);

            if (detailId <= 0)
                return ServiseResult<string>.Failure("شناسه نامعتبر");

            var detailResult = await _serviceDetailProduct.GetDetailProduct(detailId);
            if (!detailResult.IsSuccess)
                return ServiseResult<string>.Failure("جزئیات یافت نشد");

            var details = JsonConvert.DeserializeObject<List<DetailProduct>>(detailResult.Data);
            if (details == null || details.Count == 0)
                return ServiseResult<string>.Failure("جزئیات یافت نشد");

            var ownership = await CheckProductOwnership(personelId.Value, details[0].ProductId);
            if (!ownership)
                return ServiseResult<string>.Failure("دسترسی غیرمجاز");

            return await _serviceDetailProduct.DeleteDetailProduct(detailId);
        }

        // ═══════════════════════════════════════════════════════
        // GetOptions — مشخصات فنی (فقط خواندن)
        // POST: /MyProductDetails/GetOptions
        // Body: { kindProductId }
        // ═══════════════════════════════════════════════════════
        [HttpPost("GetOptions")]
        [RequireLogin]
        [ValidateAntiForgeryToken]
        public async Task<ServiseResult<string>> GetOptions()
        {
            var personelId = await GetCurrentPersonelIdAsync();
            if (personelId == null)
                return ServiseResult<string>.Failure("دوباره وارد شوید");


            // ─── همه OptionProduct ها ───
            var result = await _serviceOptionProduct.GetAllOptionProduct(0);

            if (!result.IsSuccess)
                return ServiseResult<string>.Failure("خطا در دریافت مشخصات");

            return result;
        }

        // ═══════════════════════════════════════════════════════
        // Helper
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