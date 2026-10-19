using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace TemplateSite.Filters
{
    public class RequireLoginAttribute : ActionFilterAttribute
    {
        public override void OnActionExecuting(ActionExecutingContext context)
        {
            var user = context.HttpContext.User;

            if (user?.Identity?.IsAuthenticated != true)
            {
                var isAjax = context.HttpContext.Request.Headers["X-Requested-With"] == "XMLHttpRequest"
                    || context.HttpContext.Request.Headers["Accept"].ToString().Contains("application/json");

                if (isAjax)
                {
                    context.Result = new JsonResult(new
                    {
                        isSuccess = false,
                        errorTitle = "برای ادامه باید وارد حساب کاربری خود شوید.",
                        needRegister = true
                    })
                    {
                        StatusCode = 401
                    };
                }
                else
                {
                    var returnUrl = context.HttpContext.Request.Path + context.HttpContext.Request.QueryString;
                    context.Result = new RedirectToActionResult(
                        "Login", "Account", new { returnUrl });
                }
            }

            base.OnActionExecuting(context);
        }
    }
}