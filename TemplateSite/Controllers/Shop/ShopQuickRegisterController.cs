using Application.Services;
using Domain.Models;
using Domain.ServiseResult;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Text.RegularExpressions;

namespace TemplateSite.Controllers.ShopPanel
{
    [Route("ShopPanel/QuickRegister")]
    public class ShopQuickRegisterController : Controller
    {
        private readonly IServicePersonel _servicePersonel;
        private readonly UserManager<Userapp> _userManager;
        private readonly SignInManager<Userapp> _signInManager;
        private readonly RoleManager<IdentityRole> _roleManager;

        public ShopQuickRegisterController(
            IServicePersonel servicePersonel,
            UserManager<Userapp> userManager,
            SignInManager<Userapp> signInManager,
            RoleManager<IdentityRole> roleManager)
        {
            _servicePersonel = servicePersonel;
            _userManager = userManager;
            _signInManager = signInManager;
            _roleManager = roleManager;
        }

        // ═══════════════════════════════════════════════════════
        // POST: /ShopPanel/QuickRegister
        // ═══════════════════════════════════════════════════════
        [HttpPost("")]
        [ValidateAntiForgeryToken]
        public async Task<ServiseResult<string>> Register(QuickRegisterModel model)
        {
            var errors = new List<string>();

            if (string.IsNullOrWhiteSpace(model.FirstName) || model.FirstName.Length < 2 || model.FirstName.Length > 50)
                errors.Add("نام باید بین 2 تا 50 کاراکتر باشد");

            if (string.IsNullOrWhiteSpace(model.LastName) || model.LastName.Length < 2 || model.LastName.Length > 50)
                errors.Add("نام خانوادگی باید بین 2 تا 50 کاراکتر باشد");

            if (string.IsNullOrWhiteSpace(model.LationalCode) || !Regex.IsMatch(model.LationalCode, @"^\d{10}$"))
                errors.Add("کد ملی باید 10 رقم باشد");

            if (string.IsNullOrWhiteSpace(model.PhoneNumber) || !Regex.IsMatch(model.PhoneNumber, @"^09\d{9}$"))
                errors.Add("شماره تماس باید با 09 شروع شود و 11 رقم باشد");

            if (string.IsNullOrWhiteSpace(model.Address) || model.Address.Length < 5 || model.Address.Length > 500)
                errors.Add("آدرس نامعتبر است");

            if (errors.Count > 0)
                return ServiseResult<string>.Failure(string.Join(" - ", errors));

            var existingUser = await _userManager.FindByNameAsync(model.PhoneNumber);
            if (existingUser != null)
                return ServiseResult<string>.Failure("این شماره تماس قبلاً ثبت‌نام کرده است");

            var personel = new Personel
            {
                FirstName = model.FirstName.Trim(),
                LastName = model.LastName.Trim(),
                Lational_code = model.LationalCode.Trim(),
                Address = model.Address.Trim(),
                Status = true
            };

            var personelResult = await _servicePersonel.UpdatePersonel(personel);
            if (!personelResult.IsSuccess)
                return ServiseResult<string>.Failure("خطا در ثبت اطلاعات");

            int personelId;
            if (!int.TryParse(personelResult.Data?.ToString(), out personelId) || personelId <= 0)
                return ServiseResult<string>.Failure("خطا در ایجاد پروفایل");

            var user = new Userapp
            {
                UserName = model.PhoneNumber.Trim(),
                PhoneNumber = model.PhoneNumber.Trim(),
                PersonelId = personelId,
                FullName = $"{model.FirstName} {model.LastName}".Trim(),
                Email = $"{model.PhoneNumber}@negarshop.local",
                Active = true,
                ComplateInformation = true,
                ComfirmInformation = true,
                Level_access = 0,
                Delete = false,
                CompleteSpecification = true
            };

            var randomPassword = Guid.NewGuid().ToString("N").Substring(0, 16);

            var createResult = await _userManager.CreateAsync(user, randomPassword);
            if (!createResult.Succeeded)
            {
                await _servicePersonel.DeletePersonel(personelId);
                return ServiseResult<string>.Failure("خطا در ایجاد حساب کاربری");
            }

            const string customerRole = "Customer";
            if (!await _roleManager.RoleExistsAsync(customerRole))
                await _roleManager.CreateAsync(new IdentityRole(customerRole));

            await _userManager.AddToRoleAsync(user, customerRole);

            await _signInManager.SignInAsync(user, isPersistent: true);

            Response.Cookies.Append("DataPerson", user.FullName, new CookieOptions
            {
                Expires = DateTimeOffset.Now.AddDays(30),
                Path = "/",
                HttpOnly = false,
                Secure = true,
                SameSite = SameSiteMode.Strict
            });

            return ServiseResult<string>.Success("ثبت‌نام با موفقیت انجام شد ✅");
        }
    }

    public class QuickRegisterModel
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string LationalCode { get; set; }
        public string PhoneNumber { get; set; }
        public string Address { get; set; }
    }
}