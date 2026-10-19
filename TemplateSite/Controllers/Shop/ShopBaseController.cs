using Domain.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace TemplateSite.Controllers.ShopPanel
{
    /// <summary>
    /// Base Controller برای همه‌ی کنترلرهای ShopPanel
    /// </summary>
    public abstract class ShopBaseController : Controller
    {
        protected readonly SignInManager<Userapp> _signInManager;
        protected readonly UserManager<Userapp> _userManager;

        protected ShopBaseController(
            SignInManager<Userapp> signInManager,
            UserManager<Userapp> userManager)
        {
            _signInManager = signInManager;
            _userManager = userManager;
        }

        protected async Task<int?> GetCurrentPersonelIdAsync()
        {
            if (!_signInManager.IsSignedIn(User))
                return null;

            var user = await _userManager.GetUserAsync(User);
            return user?.PersonelId;
        }

        protected bool IsSignedIn()
        {
            return _signInManager.IsSignedIn(User);
        }
    }
}