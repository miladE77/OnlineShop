using Application.Services;
using Domain.Models;
using Domain.ServiseResult;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using TemplateSite.Filters;

namespace TemplateSite.Controllers.ShopPanel
{
    [Route("ShopPanel")]
    public class ShopVitrinController : ShopBaseController
    {
        private readonly IServiceQueryDB _serviceQueryDB;

        public ShopVitrinController(
            SignInManager<Userapp> signInManager,
            UserManager<Userapp> userManager,
            IServiceQueryDB serviceQueryDB)
            : base(signInManager, userManager)
        {
            _serviceQueryDB = serviceQueryDB;
        }

        // ═══════════════════════════════════════════════════════
        // ورود با کد اختصاصی
        // GET: /ShopPanel/OnlineShop?Code=8TZU8F6X
        // ═══════════════════════════════════════════════════════
        [HttpGet("OnlineShop")]
        public async Task<IActionResult> OnlineShop(string Code)
        {
            // ─── اعتبارسنجی اولیه ───
            if (string.IsNullOrWhiteSpace(Code) || Code.Length > 50)
                return RedirectToAction(nameof(VitrinShop), new { Code = "" });

            // ─── جلوگیری از SQL Injection (ساده) ───
            Code = Code.Replace("'", "''").Trim();

            // ═══════════════════════════════════════════════════════
            // ۱. دریافت TypeCode از CodeAccess
            // ═══════════════════════════════════════════════════════
            var data = await _serviceQueryDB.GetsDynamicDataViewByQuery(
                $"select * from CodeAccessView where CodeAccessCaption = '{Code}'");

            if (!data.IsSuccess || data.Data == null || data.Data.Count == 0)
                return RedirectToAction(nameof(VitrinShop), new { Code = "" });

            int typeCode = Convert.ToInt32(data.Data[0].TypeCode);

            // ═══════════════════════════════════════════════════════
            // ۲. مسیردهی بر اساس TypeCode
            // ═══════════════════════════════════════════════════════
            switch (typeCode)
            {
                // ─── ۰. محصول ───
                case 0:
                    return await RedirectToProduct(Code);

                // ─── ۱. فروشگاه ───
                case 1:
                    return await RedirectToStore(Code);

                // ─── ۲. صفحه HTML اختصاصی ───
                case 2:
                    return await RedirectToSitePage(Code);

                // ─── نامشخص ───
                default:
                    return RedirectToAction("E505", "Error");
            }
        }

        // ═══════════════════════════════════════════════════════════
        // ۳. مسیردهی به محصول
        // ═══════════════════════════════════════════════════════════
        private async Task<IActionResult> RedirectToProduct(string code)
        {
            var products = await _serviceQueryDB.GetsDynamicDataViewByQuery(
                $"select * from Product where CodeInternalProducts = '{code}'");

            if (products.IsSuccess && products.Data?.Count > 0)
            {
                int productId = Convert.ToInt32(products.Data[0].ProductId);
                return RedirectToAction("Details", "ShopProductPanel", new { id = productId });
            }

            return RedirectToAction("E505", "Error");
        }

        // ═══════════════════════════════════════════════════════════
        // ۴. مسیردهی به فروشگاه
        // ═══════════════════════════════════════════════════════════
        private async Task<IActionResult> RedirectToStore(string code)
        {
            return await VitrinShop(code);
        }

        // ═══════════════════════════════════════════════════════════
        // ۵. ⭐ مسیردهی به SitePage (HTML اختصاصی)
        // ═══════════════════════════════════════════════════════════
        private async Task<IActionResult> RedirectToSitePage(string code)
        {
            var sitePage = await _serviceQueryDB.GetsDynamicDataViewByQuery(
                $"select * from SitePage where CodePage = '{code}' and Status = 1");

            if (sitePage.IsSuccess && sitePage.Data?.Count > 0)
            {
                int sitePageId = Convert.ToInt32(sitePage.Data[0].SitePageId);
                return RedirectToAction("Show", "SitePagePanel", new { id = sitePageId });
            }

            return RedirectToAction("E505", "Error");
        }
        // ═══════════════════════════════════════════════════════
        // صفحه ویترین
        // GET: /ShopPanel/VitrinShop?Code=XYZ
        // ═══════════════════════════════════════════════════════
        [HttpGet("VitrinShop")]
        public async Task<IActionResult> VitrinShop(string Code)
        {
            Code = string.IsNullOrWhiteSpace(Code) ? "" : Code.Replace("'", "''").Trim();

            var data = await _serviceQueryDB.GetsDictionaryDataViewByQuery(
                "select * from KindProductView", "ParentKindProductCaption");

            if (data.IsSuccess)
                ViewData["KindProduct"] = data.Data;
            else
                return RedirectToAction("E505", "Error");

            return View("~/Views/ShopPanel/VitrinShop.cshtml");
        }

        // ═══════════════════════════════════════════════════════
        // لیست محصولات ویترین (AJAX)
        // POST: /ShopPanel/Products/GetAll
        // ═══════════════════════════════════════════════════════
        [HttpPost("Products/GetAll")]
        public async Task<ServiseResult<string>> GetVitrinProducts(string shop)
        {
            shop = string.IsNullOrWhiteSpace(shop) ? "" : shop.Replace("'", "''").Trim();

            return await _serviceQueryDB.GetsJsonDataViewByQuery(
                $"Exec dbo.VitrinShop '{shop}'");
        }


    }
}