// TemplateSite/Controllers/ShopPanel/MyContactController.cs
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
    /// کنترلر مدیریت راه‌های تماس برای صاحب مغازه
    /// فقط Contact هایی که به فروشگاه‌های خودش تعلق دارند
    /// </summary>
    [Route("MyContact")]
    public class MyContactController : ShopBaseController
    {
        private readonly IServiceContact _serviceContact;
        private readonly IServiceStore _serviceStore;
        private readonly IServiceTypeContact _serviceTypeContact;
        private readonly IServiceQueryDB _serviceQueryDB;

        public MyContactController(
            SignInManager<Userapp> signInManager,
            UserManager<Userapp> userManager,
            IServiceContact serviceContact,
            IServiceStore serviceStore,
            IServiceTypeContact serviceTypeContact,
            IServiceQueryDB serviceQueryDB)
            : base(signInManager, userManager)
        {
            _serviceContact = serviceContact;
            _serviceStore = serviceStore;
            _serviceTypeContact = serviceTypeContact;
            _serviceQueryDB = serviceQueryDB;
        }

        // ═══════════════════════════════════════════════════════
        // صفحه اصلی
        // GET: /MyContact
        // ═══════════════════════════════════════════════════════
        [HttpGet("")]
        [RequireLogin]
        public async Task<IActionResult> Index()
        {
            var personelId = await GetCurrentPersonelIdAsync();
            if (personelId == null)
                return RedirectToAction("Login", "Account");
            return View("~/Views/MyContact/Index.cshtml");
        }

        // ═══════════════════════════════════════════════════════
        // دریافت راه‌های تماس یک فروشگاه
        // POST: /MyContact/GetData
        // Body: { storeId }
        // ═══════════════════════════════════════════════════════
        [HttpPost("GetData")]
        [RequireLogin]
        [ValidateAntiForgeryToken]
        public async Task<ServiseResult<string>> GetData()
        {
            var personelId = await GetCurrentPersonelIdAsync();
            if (personelId == null)
                return ServiseResult<string>.Failure("دوباره وارد شوید");

            int storeId = 0;
            if (Request.Form.TryGetValue("storeId", out var s))
                int.TryParse(s, out storeId);

            if (storeId <= 0)
                return ServiseResult<string>.Failure("شناسه فروشگاه نامعتبر");

            // ─── چک مالکیت ───
            var checkResult = await CheckStoreOwnership(personelId.Value, storeId);
            if (!checkResult)
                return ServiseResult<string>.Failure("دسترسی غیرمجاز");

            return await _serviceContact.GetByStore(storeId);
        }

        // ═══════════════════════════════════════════════════════
        // دریافت نوع‌های پلتفرم ارتباطی (برای Select)
        // POST: /MyContact/GetTypes
        // ═══════════════════════════════════════════════════════
        [HttpPost("GetTypes")]
        [RequireLogin]
        [ValidateAntiForgeryToken]
        public async Task<ServiseResult<string>> GetTypes()
        {
            var personelId = await GetCurrentPersonelIdAsync();
            if (personelId == null)
                return ServiseResult<string>.Failure("دوباره وارد شوید");

            return await _serviceTypeContact.GetAllTypeContact(0);
        }

        // ═══════════════════════════════════════════════════════
        // افزودن راه تماس
        // POST: /MyContact/Add
        // Body: { storeId, contactCaption, typeContactId }
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
            int storeId = 0, typeContactId = 0;
            string contactCaption = "";

            if (Request.Form.TryGetValue("storeId", out var s))
                int.TryParse(s, out storeId);
            if (Request.Form.TryGetValue("typeContactId", out var t))
                int.TryParse(t, out typeContactId);
            if (Request.Form.TryGetValue("contactCaption", out var c))
                contactCaption = c.ToString()?.Trim() ?? "";

            // ─── اعتبارسنجی ───
            if (storeId <= 0)
                return ServiseResult<string>.Failure("فروشگاه را انتخاب کنید");

            if (typeContactId <= 0)
                return ServiseResult<string>.Failure("نوع پلتفرم را انتخاب کنید");

            if (string.IsNullOrWhiteSpace(contactCaption) || contactCaption.Length > 500)
                return ServiseResult<string>.Failure("مشخصات تماس نامعتبر");

            // ─── چک مالکیت ───
            var checkResult = await CheckStoreOwnership(personelId.Value, storeId);
            if (!checkResult)
                return ServiseResult<string>.Failure("دسترسی غیرمجاز");

            // ─── افزودن ───
            var contact = new Contact
            {
                ContactId = 0,
                ContactCaption = contactCaption,
                TypeContactId = typeContactId,
                StoreId = storeId,
                Status = true
            };

            return await _serviceContact.UpdateContact(contact);
        }

        // ═══════════════════════════════════════════════════════
        // ویرایش راه تماس
        // POST: /MyContact/Update
        // Body: { contactId, storeId, contactCaption, typeContactId }
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
            int contactId = 0, storeId = 0, typeContactId = 0;
            string contactCaption = "";

            if (Request.Form.TryGetValue("contactId", out var ci))
                int.TryParse(ci, out contactId);
            if (Request.Form.TryGetValue("storeId", out var s))
                int.TryParse(s, out storeId);
            if (Request.Form.TryGetValue("typeContactId", out var t))
                int.TryParse(t, out typeContactId);
            if (Request.Form.TryGetValue("contactCaption", out var c))
                contactCaption = c.ToString()?.Trim() ?? "";

            // ─── اعتبارسنجی ───
            if (contactId <= 0)
                return ServiseResult<string>.Failure("شناسه تماس نامعتبر");

            if (storeId <= 0)
                return ServiseResult<string>.Failure("شناسه فروشگاه نامعتبر");

            if (typeContactId <= 0)
                return ServiseResult<string>.Failure("نوع پلتفرم را انتخاب کنید");

            if (string.IsNullOrWhiteSpace(contactCaption) || contactCaption.Length > 500)
                return ServiseResult<string>.Failure("مشخصات تماس نامعتبر");

            // ─── چک مالکیت ───
            var checkResult = await CheckStoreOwnership(personelId.Value, storeId);
            if (!checkResult)
                return ServiseResult<string>.Failure("دسترسی غیرمجاز");

            // ─── چک وجود Contact ───
            var existingResult = await _serviceContact.GetContact(contactId);
            if (!existingResult.IsSuccess)
                return ServiseResult<string>.Failure("تماس یافت نشد");

            // ─── ویرایش ───
            var contact = new Contact
            {
                ContactId = contactId,
                ContactCaption = contactCaption,
                TypeContactId = typeContactId,
                StoreId = storeId,
                Status = true
            };

            return await _serviceContact.UpdateContact(contact);
        }

        // ═══════════════════════════════════════════════════════
        // حذف راه تماس
        // POST: /MyContact/Delete
        // Body: { contactId, storeId }
        // ═══════════════════════════════════════════════════════
        [HttpPost("Delete")]
        [RequireLogin]
        [ValidateAntiForgeryToken]
        public async Task<ServiseResult<string>> Delete()
        {
            var personelId = await GetCurrentPersonelIdAsync();
            if (personelId == null)
                return ServiseResult<string>.Failure("دوباره وارد شوید");

            // ─── پارامترها ───
            int contactId = 0, storeId = 0;

            if (Request.Form.TryGetValue("contactId", out var ci))
                int.TryParse(ci, out contactId);
            if (Request.Form.TryGetValue("storeId", out var s))
                int.TryParse(s, out storeId);

            if (contactId <= 0)
                return ServiseResult<string>.Failure("شناسه نامعتبر");

            if (storeId <= 0)
                return ServiseResult<string>.Failure("شناسه فروشگاه نامعتبر");

            // ─── چک مالکیت ───
            var checkResult = await CheckStoreOwnership(personelId.Value, storeId);
            if (!checkResult)
                return ServiseResult<string>.Failure("دسترسی غیرمجاز");

            return await _serviceContact.DeleteContact(contactId);
        }

        // ═══════════════════════════════════════════════════════
        // Helper — چک مالکیت
        // ═══════════════════════════════════════════════════════
        private async Task<bool> CheckStoreOwnership(int personelId, int storeId)
        {
            bool isAdmin = User.IsInRole("Admin") || User.IsInRole("Administrator");
            if (isAdmin) return true;

            var storeIdsResult = await _serviceStore.GetStoreIds(personelId);

            if (!storeIdsResult.IsSuccess)
                return false;

            var allowedIds = JsonConvert.DeserializeObject<List<int>>(storeIdsResult.Data);

            return allowedIds != null && allowedIds.Contains(storeId);
        }
    }
}