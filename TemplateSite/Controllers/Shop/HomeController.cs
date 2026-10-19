using Microsoft.AspNetCore.Mvc;

namespace TemplateSite.Controllers
{
    /// <summary>
    /// کنترلر صفحه اصلی — فقط برای redirect
    /// </summary>
    public class HomeController : Controller
    {
        // ═══════════════════════════════════════════════════════
        // /  →  /ShopPanel/VitrinShop
        // ═══════════════════════════════════════════════════════
        public IActionResult Index()
        {
            return RedirectToAction("VitrinShop", "ShopVitrin");
        }
    }
}