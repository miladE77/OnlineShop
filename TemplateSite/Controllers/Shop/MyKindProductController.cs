using Application.Services;
using Domain.Models;
using Domain.ServiseResult;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using TemplateSite.Filters;

namespace TemplateSite.Controllers.ShopPanel
{
    [Route("MyKindProduct")]
    public class MyKindProductController : ShopBaseController
    {
        private readonly IServiceKindProduct _serviceKindProduct;

        public MyKindProductController(
            SignInManager<Userapp> signInManager,
            UserManager<Userapp> userManager,
            IServiceKindProduct serviceKindProduct)
            : base(signInManager, userManager)
        {
            _serviceKindProduct = serviceKindProduct;
        }

        // ═══════════════════════════════════════════════════════
        // GetAll
        // ═══════════════════════════════════════════════════════
        [HttpPost("GetAll")]
        [RequireLogin]
        [ValidateAntiForgeryToken]
        public async Task<ServiseResult<string>> GetAll()
        {
            var personelId = await GetCurrentPersonelIdAsync();
            if (personelId == null)
                return ServiseResult<string>.Failure("دوباره وارد شوید");

            return await _serviceKindProduct.GetAllKindProduct(0);
        }

        [HttpPost("Add")]
        [RequireLogin]
        [ValidateAntiForgeryToken]
        public async Task<ServiseResult<string>> Add()
        {
            var personelId = await GetCurrentPersonelIdAsync();
            if (personelId == null)
                return ServiseResult<string>.Failure("دوباره وارد شوید");

            string caption = "";
            int? parentKindProductId = null;

            if (Request.Form.TryGetValue("caption", out var c))
                caption = c.ToString()?.Trim() ?? "";
            if (Request.Form.TryGetValue("parentKindProductId", out var p))
            {
                if (int.TryParse(p, out var parentId) && parentId > 0)
                    parentKindProductId = parentId;
            }

            if (string.IsNullOrWhiteSpace(caption) || caption.Length > 100)
                return ServiseResult<string>.Failure("عنوان دسته‌بندی نامعتبر");

            var kind = new KindProduct
            {
                KindProductId = 0,
                KindProductCaption = caption,
                CodeInternalKindProducts = $"KP-{DateTime.Now.Ticks}",  // ← خودکار
                ParentKindProductId = parentKindProductId,
                Status = true
            };

            return await _serviceKindProduct.UpdateKindProduct(kind);
        }
    }
}