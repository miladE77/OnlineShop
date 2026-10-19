using Application.Services;
using Domain.Models;
using Domain.ServiseResult;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Site.Filters
{
    public class CheckAccessDataAttribute : ActionFilterAttribute
    {
        private readonly string _pageName;
        private readonly string _accessType;

        public CheckAccessDataAttribute(string pageName, string accessType = "V")
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

            if (!_signInManager.IsSignedIn(user))
            {
                context.Result = new JsonResult(
                    ServiseResult<string>.Failure("دوباره وارد حساب کاربری خود شوید."));
                return;
            }

            if (user.IsInRole("Admin"))
            {
                await next();
                return;
            }

            var appUser = await _userManager.FindByNameAsync(user.Identity.Name);
            if (appUser == null)
            {
                context.Result = new JsonResult(
                    ServiseResult<string>.Failure("دوباره وارد حساب کاربری خود شوید."));
                return;
            }

            bool allowAccess = await checker.CheckAccessToAction(appUser.PersonelId, _pageName, _accessType);

            if (allowAccess)
            {
                await next();
            }
            else
            {
                context.Result = new JsonResult(
                    ServiseResult<string>.Failure(
                        "شما اجازه دسترسی به این بخش را ندارید."));
            }
        }
    }
}