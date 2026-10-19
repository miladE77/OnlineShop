// TemplateSite/Controllers/ShopPanel/StoreQAController.cs

using Application.Services;
using Azure.Core;
using Domain.Models;
using Domain.ServiseResult;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using TemplateSite.Controllers.ShopPanel;
using TemplateSite.Filters;

[Route("StoreQA")]
public class StoreQAController : ShopBaseController
{
    private readonly IServiceContactUs _serviceContactUs;
    private readonly IServiceAnswerCustomer _serviceAnswerCustomer;
    private readonly IServiceStore _serviceStore;
    private readonly IServiceQueryDB _serviceQueryDB;

    public StoreQAController(
        SignInManager<Userapp> signInManager,
        UserManager<Userapp> userManager,
        IServiceContactUs serviceContactUs,
        IServiceAnswerCustomer serviceAnswerCustomer,
        IServiceStore serviceStore,
        IServiceQueryDB serviceQueryDB)
        : base(signInManager, userManager)
    {
        _serviceContactUs = serviceContactUs;
        _serviceAnswerCustomer = serviceAnswerCustomer;
        _serviceStore = serviceStore;
        _serviceQueryDB = serviceQueryDB;
    }

    // ═══════════════════════════════════════════════════════
    // صفحه اصلی
    // ═══════════════════════════════════════════════════════
    [HttpGet("")]
    [RequireLogin]
    public async Task<IActionResult> Index()
    {
        var personelId = await GetCurrentPersonelIdAsync();
        if (personelId == null)
            return RedirectToAction("Login", "Account");
        return View("~/Views/StoreQA/Index.cshtml");
    }

    // ═══════════════════════════════════════════════════════
    // GetAll — همه سوالات (همه فروشگاه‌های کاربر)
    // POST: /StoreQA/GetAll
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

        // ─── دریافت فروشگاه‌های مجاز ───
        var storeIdsResult = await _serviceStore.GetStoreIds(personelId.Value);
        if (!storeIdsResult.IsSuccess)
            return ServiseResult<string>.Failure("خطا در بررسی دسترسی");

        var allowedStoreIds = JsonConvert.DeserializeObject<List<int>>(storeIdsResult.Data)
                              ?? new List<int>();

        // ─── اگه Admin ───
        bool isAdmin = User.IsInRole("Admin") || User.IsInRole("Administrator");

        if (isAdmin)
        {
            // Admin همه فروشگاه‌ها
            var allStores = await _serviceQueryDB.GetsDynamicDataViewByQuery(
                "SELECT StoreId FROM Store WHERE Status = 1");

            if (allStores.IsSuccess && allStores.Data != null)
            {
                allowedStoreIds = allStores.Data
                  .Select(x => (IDictionary<string, object>)x)
                  .Where(d => d.ContainsKey("StoreId") && d["StoreId"] != null && d["StoreId"] != DBNull.Value)
                  .Select(d => Convert.ToInt32(d["StoreId"]))
                  .ToList();
            }
        }

        // ─── فیلتر بر اساس storeId ───
        if (storeId > 0)
        {
            if (!allowedStoreIds.Contains(storeId))
                return ServiseResult<string>.Failure("دسترسی غیرمجاز");

            return await _serviceContactUs.GetByStores([storeId]);
        }

        // ─── همه فروشگاه‌ها ───
        return await _serviceContactUs.GetByStores(allowedStoreIds);
    }

    // ═══════════════════════════════════════════════════════
    // GetAvailableMonths — ماه‌های موجود
    // POST: /StoreQA/GetAvailableMonths
    // Body: { storeId } (اختیاری)
    // ═══════════════════════════════════════════════════════
    [HttpPost("GetAvailableMonths")]
    [RequireLogin]
    [ValidateAntiForgeryToken]
    public async Task<ServiseResult<string>> GetAvailableMonths()
    {
        var personelId = await GetCurrentPersonelIdAsync();
        if (personelId == null)
            return ServiseResult<string>.Failure("دوباره وارد شوید");

        int storeId = 0;
        if (Request.Form.TryGetValue("storeId", out var s))
            int.TryParse(s, out storeId);

        var storeIdsResult = await _serviceStore.GetStoreIds(personelId.Value);
        if (!storeIdsResult.IsSuccess)
            return ServiseResult<string>.Failure("خطا در بررسی دسترسی");

        var allowedStoreIds = JsonConvert.DeserializeObject<List<int>>(storeIdsResult.Data)
                              ?? new List<int>();

        bool isAdmin = User.IsInRole("Admin") || User.IsInRole("Administrator");

        if (isAdmin)
        {
            var allStores = await _serviceQueryDB.GetsDynamicDataViewByQuery(
                "SELECT StoreId FROM Store WHERE Status = 1");

            if (allStores.IsSuccess && allStores.Data != null)
            {
                allowedStoreIds = allStores.Data
        .Select(x => (IDictionary<string, object>)x)
        .Where(d => d.ContainsKey("StoreId") && d["StoreId"] != null && d["StoreId"] != DBNull.Value)
        .Select(d => Convert.ToInt32(d["StoreId"]))
        .ToList();
            }
        }

        if (storeId > 0)
        {
            if (!allowedStoreIds.Contains(storeId))
                return ServiseResult<string>.Failure("دسترسی غیرمجاز");

            return await _serviceContactUs.GetAvailableMonths(storeId);
        }

        return await _serviceContactUs.GetAvailableMonthsByStores(allowedStoreIds);
    }

    // ═══════════════════════════════════════════════════════
    // GetByMonth — سوالات ماه خاص
    // POST: /StoreQA/GetByMonth
    // Body: { storeId, year, month }
    // ═══════════════════════════════════════════════════════
    [HttpPost("GetByMonth")]
    [RequireLogin]
    [ValidateAntiForgeryToken]
    public async Task<ServiseResult<string>> GetByMonth()
    {
        var personelId = await GetCurrentPersonelIdAsync();
        if (personelId == null)
            return ServiseResult<string>.Failure("دوباره وارد شوید");

        int storeId = 0, year = 0, month = 0;

        if (Request.Form.TryGetValue("storeId", out var s))
            int.TryParse(s, out storeId);
        if (Request.Form.TryGetValue("year", out var y))
            int.TryParse(y, out year);
        if (Request.Form.TryGetValue("month", out var m))
            int.TryParse(m, out month);

        if (year <= 0 || month < 1 || month > 12)
            return ServiseResult<string>.Failure("پارامترهای نامعتبر");

        var storeIdsResult = await _serviceStore.GetStoreIds(personelId.Value);
        if (!storeIdsResult.IsSuccess)
            return ServiseResult<string>.Failure("خطا در بررسی دسترسی");

        var allowedStoreIds = JsonConvert.DeserializeObject<List<int>>(storeIdsResult.Data)
                              ?? new List<int>();

        bool isAdmin = User.IsInRole("Admin") || User.IsInRole("Administrator");

        if (isAdmin)
        {
            var allStores = await _serviceQueryDB.GetsDynamicDataViewByQuery(
                "SELECT StoreId FROM Store WHERE Status = 1");

            if (allStores.IsSuccess && allStores.Data != null)
            {
                allowedStoreIds = allStores.Data
        .Select(x => (IDictionary<string, object>)x)
        .Where(d => d.ContainsKey("StoreId") && d["StoreId"] != null && d["StoreId"] != DBNull.Value)
        .Select(d => Convert.ToInt32(d["StoreId"]))
        .ToList();
            }
        }

        if (storeId > 0)
        {
            if (!allowedStoreIds.Contains(storeId))
                return ServiseResult<string>.Failure("دسترسی غیرمجاز");

            return await _serviceContactUs.GetByMonth(storeId, year, month);
        }

        return await _serviceContactUs.GetByStoresAndMonth(allowedStoreIds, year, month);
    }

    // ═══════════════════════════════════════════════════════
    // Reply — پاسخ
    // ═══════════════════════════════════════════════════════
    [HttpPost("Reply")]
    [RequireLogin]
    [ValidateAntiForgeryToken]
    public async Task<ServiseResult<string>> Reply()
    {
        var personelId = await GetCurrentPersonelIdAsync();
        if (personelId == null)
            return ServiseResult<string>.Failure("دوباره وارد شوید");

        int id = 0;
        string answer = "";

        if (Request.Form.TryGetValue("id", out var i))
            int.TryParse(i, out id);
        if (Request.Form.TryGetValue("answer", out var a))
            answer = a.ToString()?.Trim() ?? "";

        if (id <= 0)
            return ServiseResult<string>.Failure("شناسه نامعتبر");

        if (string.IsNullOrWhiteSpace(answer) || answer.Length > 2000)
            return ServiseResult<string>.Failure("متن پاسخ نامعتبر");

        // ─── چک مالکیت ───
        var ownershipResult = await CheckContactOwnership(personelId.Value, id);
        if (!ownershipResult)
            return ServiseResult<string>.Failure("دسترسی غیرمجاز");

        // ─── ثبت پاسخ ───
        var answerCustomer = new AnswerCustomer
        {
            ContactUsId = id,
            AnswerCustomerCaption = answer,
            AnswerDate = DateTime.Now,
            Status = true
        };

        var answerResult = await _serviceAnswerCustomer.UpdateAnswerCustomer(answerCustomer);

        if (!answerResult.IsSuccess)
            return ServiseResult<string>.Failure("خطا در ثبت پاسخ");

        await _serviceContactUs.UpdateCondition(id, 1);

        return ServiseResult<string>.Success("پاسخ با موفقیت ثبت شد ✅");
    }

    // ═══════════════════════════════════════════════════════
    // UpdateStatus — تغییر وضعیت
    // ═══════════════════════════════════════════════════════
    [HttpPost("UpdateStatus")]
    [RequireLogin]
    [ValidateAntiForgeryToken]
    public async Task<ServiseResult<string>> UpdateStatus()
    {
        var personelId = await GetCurrentPersonelIdAsync();
        if (personelId == null)
            return ServiseResult<string>.Failure("دوباره وارد شوید");

        int id = 0, newStatus = -1;

        if (Request.Form.TryGetValue("id", out var i))
            int.TryParse(i, out id);
        if (Request.Form.TryGetValue("newStatus", out var n))
            int.TryParse(n, out newStatus);

        if (id <= 0)
            return ServiseResult<string>.Failure("شناسه نامعتبر");

        if (newStatus < 0 || newStatus > 3)
            return ServiseResult<string>.Failure("وضعیت نامعتبر");

        var ownershipResult = await CheckContactOwnership(personelId.Value, id);
        if (!ownershipResult)
            return ServiseResult<string>.Failure("دسترسی غیرمجاز");

        return await _serviceContactUs.UpdateCondition(id, newStatus);
    }

    // ═══════════════════════════════════════════════════════
    // Helper — چک مالکیت Contact
    // ═══════════════════════════════════════════════════════
    private async Task<bool> CheckContactOwnership(int personelId, int contactUsId)
    {
        bool isAdmin = User.IsInRole("Admin") || User.IsInRole("Administrator");
        if (isAdmin) return true;

        var result = await _serviceContactUs.GetContactUs(contactUsId);
        if (!result.IsSuccess) return false;

        var contacts = JsonConvert.DeserializeObject<List<ContactUs>>(result.Data);
        if (contacts == null || contacts.Count == 0) return false;

        var contact = contacts[0];
        if (contact.StoreId == null) return false;

        // ─── چک مالکیت فروشگاه ───
        var storeIdsResult = await _serviceStore.GetStoreIds(personelId);
        if (!storeIdsResult.IsSuccess) return false;

        var allowedIds = JsonConvert.DeserializeObject<List<int>>(storeIdsResult.Data);
        return allowedIds != null && allowedIds.Contains(contact.StoreId.Value);
    }
}