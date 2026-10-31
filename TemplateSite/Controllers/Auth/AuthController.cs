// TemplateSite/Controllers/AuthController.cs
using Application.Services;
using Azure.Core;
using Domain.Models;
using Domain.ServiseResult;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Newtonsoft.Json;
using System.Data;

namespace TemplateSite.Controllers.Auth
{
    [Route("Auth")]
    public class AuthController : Controller
    {
        private readonly SignInManager<Userapp> _signInManager;
        private readonly UserManager<Userapp> _userManager;
        private readonly IServiceStore _serviceStore;
        private readonly IServiceChekerEnter _serviceCheker;
        private readonly IServiceQueryDB _serviceQueryDB;


        public AuthController(
            SignInManager<Userapp> signInManager,
            UserManager<Userapp> userManager,
            IServiceStore serviceStore,
            IServiceQueryDB serviceQueryDB,
            IServiceChekerEnter serviceCheker)
        {
            _signInManager = signInManager;
            _userManager = userManager;
            _serviceStore = serviceStore;
            _serviceCheker = serviceCheker;
            _serviceQueryDB = serviceQueryDB;
        }

        // ═══════════════════════════════════════════════════════
        // ۱. وضعیت کلی کاربر
        // POST: /Auth/Status
        // پاسخ: { isAuthenticated, personelId, fullName, isAdmin, hasStore, storeCount, redirectTo }
        // ═══════════════════════════════════════════════════════
        [HttpPost("Status")]
        [IgnoreAntiforgeryToken]
        public async Task<ServiseResult<string>> Status()
        {
            if (!_signInManager.IsSignedIn(User))
            {
                return ServiseResult<string>.Success(JsonConvert.SerializeObject(new
                {
                    isAuthenticated = false,
                    personelId = 0,
                    fullName = (string)null,
                    isAdmin = false,
                    hasStore = false,
                    storeCount = 0,
                    redirectTo = "/Account/Login"
                }));
            }

            var appUser = await _userManager.FindByNameAsync(User.Identity.Name);
            if (appUser == null)
            {
                return ServiseResult<string>.Success(JsonConvert.SerializeObject(new
                {
                    isAuthenticated = false,
                    redirectTo = "/Account/Login"
                }));
            }

            bool isAdmin = User.IsInRole("Admin")
                        || User.IsInRole("Administrator")
                        || User.IsInRole("مدیر");

            // ─── بررسی وجود مغازه ───
            int storeCount = 0;
            if (!isAdmin)
            {
                var storeResult = await _serviceStore.HasStore(appUser.PersonelId);
                if (storeResult.IsSuccess)
                {
                    dynamic data = JsonConvert.DeserializeObject(storeResult.Data);
                    storeCount = (int)data.Count;
                }
            }

            bool hasStore = isAdmin || storeCount > 0;

            // ─── تصمیم مسیر ───
            string redirectTo = hasStore
                ? "/Dashboard"                            // ← پنل مدیریتی
                : "/ShopPanel/VitrinShop";                // ← پنل مشتری

            return ServiseResult<string>.Success(JsonConvert.SerializeObject(new
            {
                isAuthenticated = true,
                personelId = appUser.PersonelId,
                fullName = appUser.FullName,
                isAdmin,
                hasStore,
                storeCount,
                redirectTo
            }));
        }

        // ═══════════════════════════════════════════════════════
        // ۲. بررسی دسترسی به یک صفحه خاص
        // POST: /Auth/CheckAccess
        // Body: { pageName: "Product", accessType: "V" }
        // پاسخ: { hasAccess, message }
        // ═══════════════════════════════════════════════════════
        [HttpPost("CheckAccess")]
        [IgnoreAntiforgeryToken]
        public async Task<ServiseResult<string>> CheckAccess(string pageName, string accessType = "V")
        {
            if (string.IsNullOrWhiteSpace(pageName))
                return ServiseResult<string>.Failure("نام صفحه ارسال نشده");

            if (!_signInManager.IsSignedIn(User))
                return ServiseResult<string>.Success(JsonConvert.SerializeObject(new
                {
                    hasAccess = false,
                    reason = "not_authenticated",
                    message = "ابتدا وارد شوید"
                }));

            // ─── Admin همیشه دسترسی دارد ───
            if (User.IsInRole("Admin") || User.IsInRole("Administrator"))
                return ServiseResult<string>.Success(JsonConvert.SerializeObject(new
                {
                    hasAccess = true,
                    reason = "admin",
                    message = "دسترسی مدیر"
                }));

            var appUser = await _userManager.FindByNameAsync(User.Identity.Name);
            if (appUser == null)
                return ServiseResult<string>.Success(JsonConvert.SerializeObject(new
                {
                    hasAccess = false,
                    reason = "user_not_found",
                    message = "کاربر یافت نشد"
                }));

            bool hasAccess = await _serviceCheker.CheckAccessToAction(
                appUser.PersonelId, pageName, accessType);

            return ServiseResult<string>.Success(JsonConvert.SerializeObject(new
            {
                hasAccess,
                reason = hasAccess ? "allowed" : "denied",
                message = hasAccess ? "دسترسی مجاز" : "دسترسی غیرمجاز"
            }));
        }

        // ═══════════════════════════════════════════════════════
        // ۳. بررسی چند دسترسی با هم (Batch)
        // POST: /Auth/CheckAccessBatch
        // Body: { items: [{pageName, accessType}, ...] }
        // ═══════════════════════════════════════════════════════
        [HttpPost("CheckAccessBatch")]
        [IgnoreAntiforgeryToken]
        public async Task<ServiseResult<string>> CheckAccessBatch([FromBody] List<AccessCheckItem> items)
        {
            if (items == null || items.Count == 0)
                return ServiseResult<string>.Failure("لیست خالی است");

            var results = new List<object>();

            if (!_signInManager.IsSignedIn(User))
            {
                foreach (var item in items)
                    results.Add(new { item.PageName, item.AccessType, HasAccess = false });
                return ServiseResult<string>.Success(JsonConvert.SerializeObject(results));
            }

            bool isAdmin = User.IsInRole("Admin") || User.IsInRole("Administrator");
            var appUser = await _userManager.FindByNameAsync(User.Identity.Name);

            foreach (var item in items)
            {
                bool hasAccess;
                if (isAdmin)
                    hasAccess = true;
                else if (appUser == null)
                    hasAccess = false;
                else
                    hasAccess = await _serviceCheker.CheckAccessToAction(
                        appUser.PersonelId, item.PageName, item.AccessType);

                results.Add(new
                {
                    item.PageName,
                    item.AccessType,
                    HasAccess = hasAccess
                });
            }

            return ServiseResult<string>.Success(JsonConvert.SerializeObject(results));
        }

        // ═══════════════════════════════════════════════════════
        // ۴. ⭐ دریافت همه فروشگاه‌های کاربر
        // POST: /Auth/GetStoreById
        // ═══════════════════════════════════════════════════════
        [HttpPost("GetStoreById")]
        [IgnoreAntiforgeryToken]
        public async Task<ServiseResult<string>> GetStoreById()
        {
            if (!_signInManager.IsSignedIn(User))
                return ServiseResult<string>.Failure("ابتدا وارد شوید");

            var appUser = await _userManager.FindByNameAsync(User.Identity.Name);
            if (appUser == null)
                return ServiseResult<string>.Failure("کاربر یافت نشد");

            return await _serviceStore.GetStoreById(appUser.PersonelId);
        }

        // ═══════════════════════════════════════════════════════
        // ۵. ⭐ دریافت فقط IDs فروشگاه‌های کاربر
        // POST: /Auth/GetMyStoreIds
        // ═══════════════════════════════════════════════════════
        [HttpPost("GetMyStoreIds")]
        [IgnoreAntiforgeryToken]
        public async Task<ServiseResult<string>> GetMyStoreIds()
        {
            if (!_signInManager.IsSignedIn(User))
                return ServiseResult<string>.Failure("ابتدا وارد شوید");

            var appUser = await _userManager.FindByNameAsync(User.Identity.Name);
            if (appUser == null)
                return ServiseResult<string>.Failure("کاربر یافت نشد");

            return await _serviceStore.GetStoreById(appUser.PersonelId);
        }

        // ═══════════════════════════════════════════════════════
        // ۶. ⭐ آیا کاربر فروشگاه دارد؟
        // POST: /Auth/HasStore
        // ═══════════════════════════════════════════════════════
        [HttpPost("HasStore")]
        [IgnoreAntiforgeryToken]
        public async Task<ServiseResult<string>> HasStore()
        {
            if (!_signInManager.IsSignedIn(User))
                return ServiseResult<string>.Failure("ابتدا وارد شوید");

            var appUser = await _userManager.FindByNameAsync(User.Identity.Name);
            if (appUser == null)
                return ServiseResult<string>.Failure("کاربر یافت نشد");

            return await _serviceStore.HasStore(appUser.PersonelId);
        }

        // ═══════════════════════════════════════════════════════
        // ۷. ⭐ دریافت یک فروشگاه (با چک مالکیت)
        // POST: /Auth/GetMyStoreById
        // ═══════════════════════════════════════════════════════
        [HttpPost("GetMyStoreById")]
        [IgnoreAntiforgeryToken]
        public async Task<ServiseResult<string>> GetMyStoreById([FromForm] int id)
        {
            if (!_signInManager.IsSignedIn(User))
                return ServiseResult<string>.Failure("ابتدا وارد شوید");

            if (id <= 0)
                return ServiseResult<string>.Failure("شناسه نامعتبر");

            var appUser = await _userManager.FindByNameAsync(User.Identity.Name);
            if (appUser == null)
                return ServiseResult<string>.Failure("کاربر یافت نشد");

            // ─── دریافت فروشگاه ───
            var result = await _serviceStore.GetStore(id);
            if (!result.IsSuccess)
                return ServiseResult<string>.Failure("فروشگاه یافت نشد");

            // ─── چک مالکیت ───
            var stores = JsonConvert.DeserializeObject<List<Store>>(result.Data);

            if (stores == null || stores.Count == 0)
                return ServiseResult<string>.Failure("فروشگاه یافت نشد");

            bool isAdmin = User.IsInRole("Admin") || User.IsInRole("Administrator");

            if (stores[0].PersonelId != appUser.PersonelId && !isAdmin)
                return ServiseResult<string>.Failure("دسترسی غیرمجاز");

            return result;
        }
        // ═══════════════════════════════════════════════════════
        // GET: /Auth/StoreInformation
        // ═══════════════════════════════════════════════════════
        [HttpGet("StoreInformation")]
        [IgnoreAntiforgeryToken]
        [AllowAnonymous]
        [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
        public async Task<ServiseResult<string>> StoreInformation([FromQuery] string code = null)
        {
            // ─── پیش‌فرض ───
            var defaultJson = JsonConvert.SerializeObject(new
            {
                storeId = 0,
                storeCode = "",
                storeCaption = "فروشگاه",
                contacts = new List<object>()
            });

            // ─── اعتبارسنجی code (جلوگیری از SQL Injection) ───
            if (!string.IsNullOrWhiteSpace(code))
            {
                // فقط حرف، عدد، خط تیره و آندرلاین
                if (!System.Text.RegularExpressions.Regex.IsMatch(code, @"^[A-Za-z0-9_\-]+$"))
                    return ServiseResult<string>.Success(defaultJson);
            }
            else
            {
                code = string.Empty;
            }

            try
            {
                // ─── اجرای SP ───
                var Result = await _serviceQueryDB.GetsDynamicDataViewByQuery(
                    $"Exec dbo.StoreInformation @Code and Status = 1", new SqlParameter($"@Code", SqlDbType.NVarChar) { Value = code });

                if (Result == null)
                    return ServiseResult<string>.Success(defaultJson);

                if (Result.Data.Count == 0)
                    return ServiseResult<string>.Success(defaultJson);

                // ─── اولین ردیف = اطلاعات فروشگاه ───
                int storeId = Result.Data[0]["StoreId"];
                string storeCaption = Result.Data[0]["StoreCaption"];
                string codeStore = Result.Data[0]["CodeStore"];

                // اگر شناسه صفر بود → فروشگاهی نیست
                if (storeId <= 0)
                    return ServiseResult<string>.Success(defaultJson);

                var contacts = new List<object>();
                var seenContactIds = new HashSet<int>();

                foreach (var contact in Result.Data)
                {
                    int contactId = contact["ContactId"];
                    if (contactId <= 0) continue;               // ContactId = null → فروشگاه بدون تماس
                    if (!seenContactIds.Add(contactId)) continue; // تکراری

                    contacts.Add(new
                    {
                        contactId = contactId,
                        contactCaption = contact["ContactCaption"],
                        typeContactId = contact["TypeContactId"],
                        typeContactCaption = contact["TypeContactCaption"],
                        typeContactArm = contact["TypeContactArm"]
                    });
                }

                // ─── خروجی ───
                var json = JsonConvert.SerializeObject(new
                {
                    storeId,
                    storeCode = codeStore,
                    storeCaption = string.IsNullOrWhiteSpace(storeCaption) ? "فروشگاه" : storeCaption,
                    contacts
                });

                return ServiseResult<string>.Success(json);
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Success(defaultJson);
            }
        }
    }

    


    public class AccessCheckItem
    {
        public string PageName { get; set; }
        public string AccessType { get; set; } = "V";
    }
}