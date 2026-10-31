using Application.Services;
using Domain.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace TemplateSite.Filters
{
    public class CheckAccessViewAttribute : ActionFilterAttribute
    {
        private readonly string _pageName;
        private readonly string _accessType;

        public CheckAccessViewAttribute(string pageName, string accessType = "V")
        {
            _pageName = pageName;
            _accessType = accessType;
        }

        public override async Task OnActionExecutionAsync(
            ActionExecutingContext context,
            ActionExecutionDelegate next)
        {
            var _signInManager = context.HttpContext.RequestServices
                .GetService<SignInManager<Userapp>>();
            var _userManager = context.HttpContext.RequestServices
                .GetService<UserManager<Userapp>>();
            var checker = context.HttpContext.RequestServices
                .GetService<IServiceChekerEnter>();

            var user = context.HttpContext.User;

            // ═══ ⭐ چک لاگین با returnUrl ═══
            if (!_signInManager.IsSignedIn(user))
            {
                var returnUrl = context.HttpContext.Request.Path + context.HttpContext.Request.QueryString;
                context.Result = new RedirectToActionResult(
                    "Login", "Account", new { returnUrl });
                return;
            }

            // ═══ Admin → عبور ═══
            if (user.IsInRole("Admin") || user.IsInRole("Administrator"))
            {
                await next();
                return;
            }

            // ═══ چک دسترسی ═══
            var appUser = await _userManager.FindByNameAsync(user.Identity.Name);
            if (appUser == null)
            {
                var returnUrl = context.HttpContext.Request.Path + context.HttpContext.Request.QueryString;
                context.Result = new RedirectToActionResult(
                    "Login", "Account", new { returnUrl });
                return;
            }

            bool allowAccess = await checker.CheckAccessToAction(appUser.PersonelId, _pageName, _accessType);

            if (allowAccess)
            {
                await next();
            }
            else
            {
                context.Result = new RedirectToActionResult(
                    "noAllowAccess", "Error", null);
            }
        }
    }
}