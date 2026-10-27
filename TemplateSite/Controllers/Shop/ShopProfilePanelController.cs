using Application.Services;
using Domain.Models;
using Domain.ServiseResult;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Site.Filters;
using TemplateSite.Filters;

namespace TemplateSite.Controllers.ShopPanel
{
    [Route("ShopPanel/Profile")]
    public class ShopProfilePanelController : ShopBaseController
    {
        private readonly IServiceQueryDB _serviceQueryDB;
        private readonly IServicePersonel _servicePersonel;
        private readonly IServiceStore _serviceStore;

        public ShopProfilePanelController(
            SignInManager<Userapp> signInManager,
            UserManager<Userapp> userManager,
            IServiceQueryDB serviceQueryDB,
            IServiceStore serviceStore,
            IServicePersonel servicePersonel)
            : base(signInManager, userManager)
        {
            _serviceQueryDB = serviceQueryDB;
            _servicePersonel = servicePersonel;
            _serviceStore = serviceStore;
        }

        // ═══════════════════════════════════════════════════════
        // GET: /ShopPanel/Profile
        // ═══════════════════════════════════════════════════════
        [HttpGet("")]
        [RequireLogin]
        public async Task<IActionResult> Index()
        {
            var personelId = await GetCurrentPersonelIdAsync();
            if (personelId == null)
                return RedirectToAction("Login", "Account");

            var data = await _serviceQueryDB.GetsDictionaryDataViewByQuery(
                "select * from KindProductView", "ParentKindProductCaption");

            if (data.IsSuccess)
                ViewData["KindProduct"] = data.Data;
            else
                return RedirectToAction("E505", "Error");

            return View("~/Views/ShopPanel/myProfile.cshtml");
        }

        // ═══════════════════════════════════════════════════════
        // دریافت پروفایل (AJAX)
        // POST: /ShopPanel/Profile/GetData
        // ═══════════════════════════════════════════════════════
        [HttpPost("GetData")]
        [RequireLogin]
        [ValidateAntiForgeryToken]
        public async Task<ServiseResult<string>> GetData()
        {
            var personelId = await GetCurrentPersonelIdAsync();
            if (personelId == null)
                return ServiseResult<string>.Failure("دوباره وارد شوید");

            return await _serviceQueryDB.GetsJsonDataViewByQuery(
                $"select * from PersonelView where PersonelId = {personelId}");
        }

        // ═══════════════════════════════════════════════════════
        // به‌روزرسانی (AJAX)
        // POST: /ShopPanel/Profile/Update
        // ═══════════════════════════════════════════════════════
        [HttpPost("Update")]
        [RequireLogin]
        [ValidateAntiForgeryToken]
        public async Task<ServiseResult<string>> Update(Personel model)
        {
            var personelId = await GetCurrentPersonelIdAsync();
            if (personelId == null)
                return ServiseResult<string>.Failure("دوباره وارد شوید");

            model.PersonelId = personelId.Value;

            if (string.IsNullOrWhiteSpace(model.FirstName) || model.FirstName.Length > 50)
                return ServiseResult<string>.Failure("نام نامعتبر");

            if (string.IsNullOrWhiteSpace(model.LastName) || model.LastName.Length > 50)
                return ServiseResult<string>.Failure("نام خانوادگی نامعتبر");

            if (!string.IsNullOrWhiteSpace(model.Lational_code) && model.Lational_code.Length != 10)
                return ServiseResult<string>.Failure("کد ملی باید ۱۰ رقم باشد");

            return await _servicePersonel.UpdatePersonel(model);
        }
        [HttpPost]
        [Route("AddStores")]
        [RequireLogin]
        [ValidateAntiForgeryToken]
        public async Task<ServiseResult<string>> Add(Store StoreNew)
        {
            
            if (StoreNew.StoreId != 0) return ServiseResult<string>.Failure("این داده قبلا ثبت شده است");

            var personelId = await GetCurrentPersonelIdAsync();
            if (personelId == null)
                return ServiseResult<string>.Failure("دوباره وارد شوید");

            StoreNew.PersonelId = personelId.Value;

            return await _serviceStore.UpdateStore(StoreNew);
        }

        [HttpPost]
        [Route("UpdateStores")]
        [RequireLogin]
        [ValidateAntiForgeryToken]
        public async Task<ServiseResult<string>> Update(Store StoreNew)
        {
            if (StoreNew.StoreId == 0) return ServiseResult<string>.Failure("این داده در دیتابیس وجود ندارد");

            var personelId = await GetCurrentPersonelIdAsync();
            if (personelId == null)
                return ServiseResult<string>.Failure("دوباره وارد شوید");

            StoreNew.PersonelId = personelId.Value;

            return await _serviceStore.UpdateStore(StoreNew);
        }
    }
}