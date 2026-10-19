using System;
using Domain.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Domain.ViewModels;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Identity.Client;
using Azure.Core;
using static System.Runtime.InteropServices.JavaScript.JSType;
using Application.Services;
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

            if (!_signInManager.IsSignedIn(user))
            {
                context.Result = new RedirectToActionResult(
                    "Login", "Account", null);
                return;
            }

            if (user.IsInRole("Admin"))
            {
                await next();
                return;
            }

            var appUser = await _userManager.FindByNameAsync(user.Identity.Name);
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
