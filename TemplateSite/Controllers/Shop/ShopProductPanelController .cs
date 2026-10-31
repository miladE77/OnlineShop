using Application.Services;
using Domain.Models;
using Domain.ServiseResult;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace TemplateSite.Controllers.ShopPanel
{

    [Route("ShopPanel/Product")]
    public class ShopProductPanelController : ShopBaseController
    {
        private readonly IServiceQueryDB _serviceQueryDB;
        private readonly IServiceProduct _serviceProduct;
        private readonly IServiceKindProduct _serviceKindProduct;
        private readonly IServiceOptionProduct _serviceOptionProduct;

        public ShopProductPanelController(
            SignInManager<Userapp> signInManager,
            UserManager<Userapp> userManager,
            IServiceQueryDB serviceQueryDB,
            IServiceProduct serviceProduct,
            IServiceKindProduct serviceKindProduct,
            IServiceOptionProduct serviceOptionProduct)
            : base(signInManager, userManager)
        {
            _serviceQueryDB = serviceQueryDB;
            _serviceProduct = serviceProduct;
            _serviceKindProduct = serviceKindProduct;
            _serviceOptionProduct = serviceOptionProduct;
        }

        // ═══════════════════════════════════════════════════════
        // صفحه جزئیات محصول
        // GET: /ShopPanel/Product/Details/5
        // ═══════════════════════════════════════════════════════
        [HttpGet("Details/{id:int}")]
        public async Task<IActionResult> Details(int id)
        {
            if (id <= 0)
                return RedirectToAction("E505", "Error");

            return View("~/Views/ShopPanel/ProductDetails.cshtml");
        }

        // ═══════════════════════════════════════════════════════
        // ★ دریافت داده‌های پایه (بدون احراز هویت)
        // POST: /ShopPanel/Product/GetBaseData
        // شامل: محصول + دسته‌بندی‌ها + مشخصات فنی
        // ═══════════════════════════════════════════════════════
        [HttpPost("GetBaseData")]
        [IgnoreAntiforgeryToken]

        public async Task<ServiseResult<string>> GetBaseData(int id)
        {
            if (id <= 0)
                return ServiseResult<string>.Failure("شناسه نامعتبر");

            try
            {
                // ─── ۱. محصول ───
                var productResult = await _serviceProduct.GetProduct(id);

                if (!productResult.IsSuccess)
                    return ServiseResult<string>.Failure("محصول یافت نشد");

                // ─── ۲. دسته‌بندی‌ها ───
                var kindResult = await _serviceKindProduct.GetAllKindProduct(0);

                // ─── ۳. مشخصات فنی ───
                var optionResult = await _serviceOptionProduct.GetAllOptionProduct(0);

                // ─── ۴. ساخت پاسخ ترکیبی ───
                var response = new
                {
                    Product = JsonSerializer.Deserialize<List<Product>>(productResult.Data),
                    KindProducts = kindResult.IsSuccess
                        ? JsonSerializer.Deserialize<List<KindProduct>>(kindResult.Data)
                        : new List<KindProduct>(),
                    OptionProducts = optionResult.IsSuccess
                        ? JsonSerializer.Deserialize<List<OptionProduct>>(optionResult.Data)
                        : new List<OptionProduct>()
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
                return ServiseResult<string>.Failure($"خطا در دریافت داده‌ها: {ex.Message}");
            }
        }

        // ═══════════════════════════════════════════════════════
        // فقط دریافت مشخصات فنی (اگه لازم شد جدا)
        // POST: /ShopPanel/Product/GetOptions
        // ═══════════════════════════════════════════════════════
        [HttpPost("GetOptions")]
        [IgnoreAntiforgeryToken]

        public async Task<ServiseResult<string>> GetOptions()
        {
            try
            {
                var optionResult = await _serviceOptionProduct.GetAllOptionProduct(0);

                if (optionResult.IsSuccess)
                    return optionResult;

                return ServiseResult<string>.Failure("مشخصات فنی یافت نشد");
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }

        // ═══════════════════════════════════════════════════════
        // فقط دریافت دسته‌بندی‌ها (اگه لازم شد جدا)
        // POST: /ShopPanel/Product/GetKinds
        // ═══════════════════════════════════════════════════════
        [HttpPost("GetKinds")]
        [IgnoreAntiforgeryToken]

        public async Task<ServiseResult<string>> GetKinds()
        {
            try
            {
                var kindResult = await _serviceKindProduct.GetAllKindProduct(0);

                if (kindResult.IsSuccess)
                    return kindResult;

                return ServiseResult<string>.Failure("دسته‌بندی یافت نشد");
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
    }
}