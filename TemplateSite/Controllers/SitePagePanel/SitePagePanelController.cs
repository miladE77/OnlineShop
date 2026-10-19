using Application.Services;
using Domain.Models;
using Domain.ServiseResult;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace TemplateSite.Controllers.ShopPanel
{
    [Route("ShopPanel/SitePage")]
    public class SitePagePanelController : ShopBaseController
    {
        private readonly IServiceQueryDB _serviceQueryDB;

        public SitePagePanelController(
            SignInManager<Userapp> signInManager,
            UserManager<Userapp> userManager,
            IServiceQueryDB serviceQueryDB)
            : base(signInManager, userManager)
        {
            _serviceQueryDB = serviceQueryDB;
        }

        // ═══════════════════════════════════════════════════════
        // نمایش صفحه HTML
        // GET: /ShopPanel/SitePage/Show/5
        // ═══════════════════════════════════════════════════════
        [HttpGet("Show/{id:int}")]
        public async Task<IActionResult> Show(int id)
        {
            if (id <= 0)
                return RedirectToAction("E505", "Error");

            // ─── دریافت SitePage ───
            var data = await _serviceQueryDB.GetsDynamicDataViewByQuery(
                $"select * from SitePage where SitePageId = {id} and Status = 1");

            if (!data.IsSuccess || data.Data == null || data.Data.Count == 0)
                return RedirectToAction("E505", "Error");

            // ─── استخراج HTML و Caption ───
            var row = data.Data[0];
            string html = row.SitePageHtml?.ToString() ?? "";
            string caption = row.SitePageCaption?.ToString() ?? "صفحه";

            // ─── ارسال به View از طریق ViewData ───
            ViewData["SitePageHtml"] = html;
            ViewData["SitePageCaption"] = caption;

            return View("~/Views/ShopPanel/SitePageView.cshtml");
        }

        // ═══════════════════════════════════════════════════════
        // دریافت JSON (اختیاری — برای AJAX)
        // POST: /ShopPanel/SitePage/GetData
        // ═══════════════════════════════════════════════════════
        [HttpPost("GetData")]
        public async Task<ServiseResult<string>> GetData(int id)
        {
            if (id <= 0)
                return ServiseResult<string>.Failure("شناسه نامعتبر");

            var data = await _serviceQueryDB.GetsJsonDataViewByQuery(
                $"select SitePageId, SitePageCaption, SitePageHtml, CodePage " +
                $"from SitePage where SitePageId = {id} and Status = 1");

            return data;
        }
    }
}