// Filters/StoreScopedAttribute.cs
using Domain.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace TemplateSite.Filters
{
    public class StoreScopedAttribute : ActionFilterAttribute
    {
        public override async Task OnActionExecutionAsync(
            ActionExecutingContext context,
            ActionExecutionDelegate next)
        {
            var user = context.HttpContext.User;

            // ─── ۱. چک لاگین ───
            if (user?.Identity?.IsAuthenticated != true)
            {
                context.Result = new JsonResult(new
                {
                    isSuccess = false,
                    errorTitle = "ابتدا وارد شوید",
                    needRegister = true
                })
                { StatusCode = 401 };
                return;
            }

            // ─── ۲. Admin → عبور ───
            if (user.IsInRole("Admin") || user.IsInRole("Administrator"))
            {
                await next();
                return;
            }

            // ─── ۳. StoreOwner و Customer ───
            var userManager = context.HttpContext.RequestServices
                .GetService<UserManager<Userapp>>();
            var appUser = await userManager.FindByNameAsync(user.Identity.Name);

            if (appUser == null)
            {
                context.Result = new JsonResult(new
                {
                    isSuccess = false,
                    errorTitle = "کاربر یافت نشد"
                })
                { StatusCode = 401 };
                return;
            }

            // ─── چک داشتن مغازه ───
            var serviceStore = context.HttpContext.RequestServices
                .GetService<Application.Services.IServiceStore>();

            var storeResult = await serviceStore.HasStore(appUser.PersonelId);

            if (!storeResult.IsSuccess)
            {
                context.Result = new JsonResult(new
                {
                    isSuccess = false,
                    errorTitle = "خطا در بررسی دسترسی"
                });
                return;
            }

            dynamic data = Newtonsoft.Json.JsonConvert.DeserializeObject(storeResult.Data);

            bool hasStore = (bool)data.HasStore;
            int storeCount = (int)data.Count;

            // ─── StoreOwner → عبور ───
            if (hasStore)
            {
                var storeIdsResult = await serviceStore.GetStoreById(appUser.PersonelId);

                if (storeIdsResult.IsSuccess)
                {
                    var ids = Newtonsoft.Json.JsonConvert
                        .DeserializeObject<List<int>>(storeIdsResult.Data);
                    context.HttpContext.Items["AllowedStoreIds"] = ids;
                }

                await next();
                return;
            }

            // ─── Customer → رد ───
            context.Result = new JsonResult(new
            {
                isSuccess = false,
                errorTitle = "شما به پنل مدیریتی دسترسی ندارید"
            });
        }
    }
}