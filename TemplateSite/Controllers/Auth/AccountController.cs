using System;
using Domain.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Domain.ViewModels;
using Application.Services;
using Newtonsoft.Json;
using Domain.ServiseResult;

namespace TemplateSite.Controllers.Auth
{
    public class AccountController : Controller
    {
        private readonly SignInManager<Userapp> signInManager;
        private readonly UserManager<Userapp> userManager;
        private readonly RoleManager<IdentityRole> roleManager;
        private readonly IServicePersonel _servisePersonel;
        private readonly IServiceStore _serviseStore;

        public AccountController(
            SignInManager<Userapp> signInManager,
            UserManager<Userapp> userManager,
            RoleManager<IdentityRole> roleManager,
            IServiceStore serviseStore,
            IServicePersonel servicePersonel)
        {
            this.signInManager = signInManager;
            this.userManager = userManager;
            this.roleManager = roleManager;
            _servisePersonel = servicePersonel;
            _serviseStore = serviseStore;
        }

        // ═══════════════════════════════════════════════════════════
        // LOGIN
        // ═══════════════════════════════════════════════════════════
        [HttpGet]
        public async Task<IActionResult> Login()
        {
            if (signInManager.IsSignedIn(User))
            {
                return RedirectToAction("Index", "Dashboard");
            }
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Login(LoginViewModel model)
        {
            if (signInManager.IsSignedIn(User))
            {
                return RedirectToAction("Index", "Dashboard");
            }

            if (!ModelState.IsValid)
            {
                return View(model);
            }

            var result = await signInManager.PasswordSignInAsync(
                model.PhoneNumber,
                model.Password,
                model.RememberMe,
                lockoutOnFailure: false);

            if (result.Succeeded)
            {
                var cookieOption = new CookieOptions
                {
                    Expires = DateTimeOffset.Now.AddDays(7),
                    Path = "/",
                    HttpOnly = false,
                    Secure = true,
                    SameSite = SameSiteMode.Strict
                };
                var user = await userManager.FindByNameAsync(User.Identity.Name);
                Response.Cookies.Append("DataPerson", user.FullName, cookieOption);
                return await RedirectByRole();
            }

            ModelState.AddModelError(string.Empty, "شماره تماس یا رمز عبور اشتباه است.");
            return View(model);
        }

        // ═══════════════════════════════════════════════════════════
        // تصمیم مسیر بر اساس وجود مغازه
        // ═══════════════════════════════════════════════════════════
        private async Task<IActionResult> RedirectByRole()
        {
            // ۱. Admin → پنل مدیریتی
            if (User.IsInRole("Admin") || User.IsInRole("Administrator"))
                return RedirectToAction("Index", "Dashboard");

            // ۲. بررسی صاحب مغازه بودن
            var appUser = await userManager.FindByNameAsync(User.Identity.Name);
            if (appUser == null)
                return RedirectToAction("Login", "Account");

            var storeResult = await _serviseStore.HasStore(appUser.PersonelId);

            bool hasStore = false;
            if (storeResult.IsSuccess)
            {
                dynamic data = JsonConvert.DeserializeObject(storeResult.Data);
                hasStore = (bool)data.HasStore;
            }

            if (hasStore)
                return RedirectToAction("Index", "Dashboard");
            else
                return RedirectToAction("VitrinShop", "ShopVitrin");
        }

        // ═══════════════════════════════════════════════════════════
        // REGISTER
        // ═══════════════════════════════════════════════════════════
        [HttpGet]
        public IActionResult Register()
        {
            if (signInManager.IsSignedIn(User))
            {
                if (User.IsInRole("Admin"))
                {
                    return RedirectToAction("FileManager", "Site");
                }
                return RedirectToAction("ListPersonels", "Personel");
            }
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Register(RegisterViewModel model)
        {
            if (!ModelState.IsValid)
            {
                return View(model);
            }

            // بررسی تکراری بودن شماره تماس (به عنوان UserName)
            var userCheck = await userManager.FindByNameAsync(model.PhoneNumber);
            if (userCheck != null)
            {
                ModelState.AddModelError("", "کاربری با این شماره تماس وجود دارد");
                return View(model);
            }

            var personel = new Personel()
            {
                FirstName = model.FirstName,
                LastName = model.LastName,
                PhoneNumber = model.PhoneNumber,

            };

            var response = await _servisePersonel.UpdatePersonel(personel);

            if (!response.IsSuccess)
            {
                ModelState.AddModelError(string.Empty, response.ErrorTitle);
                return View(model);
            }

            var user = new Userapp
            {
                PersonelId = Convert.ToInt32(response.Data),
                FullName = model.FirstName + " " + model.LastName,
                UserName = model.PhoneNumber,           
                NormalizedUserName = model.PhoneNumber, 
                PhoneNumber = model.PhoneNumber,        
                Email = null                            
            };

            var result = await userManager.CreateAsync(user, model.Password);

            if (result.Succeeded)
            {
                // نقش User
                var roleExistUser = await roleManager.RoleExistsAsync("User");
                if (!roleExistUser)
                {
                    await roleManager.CreateAsync(new IdentityRole("User"));
                }

                // نقش Admin
                var roleExistAdmin = await roleManager.RoleExistsAsync("Admin");
                if (!roleExistAdmin)
                {
                    await roleManager.CreateAsync(new IdentityRole("Admin"));
                    await userManager.AddToRoleAsync(user, "Admin");
                }
                else
                {
                    await userManager.AddToRoleAsync(user, "User");
                }

                await signInManager.SignInAsync(user, isPersistent: false);
                return RedirectToAction("Login", "Account");
            }

            foreach (var error in result.Errors)
            {
                ModelState.AddModelError(string.Empty, error.Description);
            }

            return View(model);
        }
        [HttpPost]
        [Route("ShopQuickRegister/Register")]
        public async Task<ServiseResult<string>> RegisterFast(RegisterViewModel model)
        {
            if (!ModelState.IsValid)
            {
                return ServiseResult<string>.Failure("");
            }

            // بررسی تکراری بودن شماره تماس (به عنوان UserName)
            var userCheck = await userManager.FindByNameAsync(model.PhoneNumber);
            if (userCheck != null)
            {
                return ServiseResult<string>.Failure("کاربری با این شماره تماس وجود دارد");
            }

            var personel = new Personel()
            {
                FirstName = model.FirstName,
                LastName = model.LastName,
                PhoneNumber = model.PhoneNumber,

            };

            var response = await _servisePersonel.UpdatePersonel(personel);

            if (!response.IsSuccess)
            {
                return ServiseResult<string>.Failure(response.ErrorTitle);
            }

            var user = new Userapp
            {
                PersonelId = Convert.ToInt32(response.Data),
                FullName = model.FirstName + " " + model.LastName,
                UserName = model.PhoneNumber,           
                NormalizedUserName = model.PhoneNumber, 
                PhoneNumber = model.PhoneNumber,        
                Email = null                            
            };

            var result = await userManager.CreateAsync(user, model.Password);

            if (result.Succeeded)
            {
                // نقش User
                var roleExistUser = await roleManager.RoleExistsAsync("User");
                if (!roleExistUser)
                {
                    await roleManager.CreateAsync(new IdentityRole("User"));
                }

                // نقش Admin
                var roleExistAdmin = await roleManager.RoleExistsAsync("Admin");
                if (!roleExistAdmin)
                {
                    await roleManager.CreateAsync(new IdentityRole("Admin"));
                    await userManager.AddToRoleAsync(user, "Admin");
                }
                else
                {
                    await userManager.AddToRoleAsync(user, "User");
                }

                await signInManager.SignInAsync(user, isPersistent: false);
                return ServiseResult<string>.Success("ثبت نام انجام شد.");
            }

            foreach (var error in result.Errors)
            {
                return ServiseResult<string>.Failure(error.Description);
            }

            return ServiseResult<string>.Failure(response.ErrorTitle);
        }

        // ═══════════════════════════════════════════════════════════
        // VERIFY PHONE (بازیابی رمز)
        // ═══════════════════════════════════════════════════════════
        [HttpGet]
        public IActionResult VerifyPhone()
        {
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> VerifyPhone(VerifyPhoneViewModel model)
        {
            if (!ModelState.IsValid)
            {
                return View(model);
            }

            var user = await userManager.FindByNameAsync(model.PhoneNumber);
            if (user == null)
            {
                ModelState.AddModelError("", "کاربری با این شماره تماس یافت نشد!");
                return View(model);
            }

            return RedirectToAction("ChangePassword", "Account", new { username = user.UserName });
        }

        // ═══════════════════════════════════════════════════════════
        // CHANGE PASSWORD
        // ═══════════════════════════════════════════════════════════
        [HttpGet]
        public IActionResult ChangePassword(string username)
        {
            if (string.IsNullOrEmpty(username))
            {
                return RedirectToAction("VerifyPhone", "Account");
            }

            return View(new ChangePasswordViewModel { PhoneNumber = username });
        }

        [HttpPost]
        public async Task<IActionResult> ChangePassword(ChangePasswordViewModel model)
        {
            if (!ModelState.IsValid)
            {
                return View(model);
            }

            var user = await userManager.FindByNameAsync(model.PhoneNumber);
            if (user == null)
            {
                ModelState.AddModelError("", "کاربری یافت نشد!");
                return View(model);
            }

            var result = await userManager.RemovePasswordAsync(user);
            if (result.Succeeded)
            {
                result = await userManager.AddPasswordAsync(user, model.NewPassword);
                if (result.Succeeded)
                {
                    return RedirectToAction("Login", "Account");
                }
            }

            foreach (var error in result.Errors)
            {
                ModelState.AddModelError("", error.Description);
            }

            return View(model);
        }

        // ═══════════════════════════════════════════════════════════
        // LOGOUT
        // ═══════════════════════════════════════════════════════════
        public async Task<IActionResult> Logout()
        {
            Response.Cookies.Delete("DataPerson");
            await signInManager.SignOutAsync();
            return RedirectToAction("Login", "Account");
        }
    }
}