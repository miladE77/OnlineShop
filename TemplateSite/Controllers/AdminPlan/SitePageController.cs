using Application.Services;
using Domain.Models;
using Domain.ServiseResult;
using Domain.ViewModels;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Data.SqlClient;
using Microsoft.IdentityModel.Tokens;
using Newtonsoft.Json;
using Site.Filters;
using System.Data;
using System.Text.Json;
using TemplateSite.Filters;
using Utilities;

namespace TemplateSite.Controllers.Management
{
    public class SitePageController : Controller
    {
        private IServiceSitePage _serviceSitePage;
        private IServiceQueryDB _serviceQueryDB;
        private IWebHostEnvironment _environment;
        private const string PageName = "SitePage";
        public SitePageController(
            IServiceQueryDB serviceQueryDB,
            IServiceSitePage serviceSitePage,
            IWebHostEnvironment environment
            )
        {
            _serviceSitePage = serviceSitePage;
            _serviceQueryDB = serviceQueryDB;
            _serviceSitePage = serviceSitePage;
        }
        [CheckAccessView(PageName, "V")]
        public async Task<ActionResult> SitePages()
        {
            return View();
        }

        [HttpPost]
        [Route("SitePages/GetFilterData")]
        [CheckAccessData(PageName, "F")]
        public async Task<ServiseResult<string>> GetAllSitePagesWithFilter(string charAccess, string data)
        {
            var Parametrs = data.Split(',');
            string Query = $"select * from SitePageView where @{Parametrs[0]}";
            var parameters = new[] {
                new SqlParameter($"@{Parametrs[0]}", SqlDbType.NVarChar, 200) { Value = Parametrs[1] }
            };
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query, parameters);
        }
        [HttpPost]
        [Route("SitePages/GetAllData")]
        [CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetAllSitePages(int pageNumber = 0)
        {
            string Query = $"select * from {PageName}View";
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query);
        }

        [HttpPost]
        [Route("SitePages/AddData")]
        [CheckAccessData(PageName, "A")]
        public async Task<ServiseResult<string>> Add(SitePage SitePageNew)
        {
            if (SitePageNew.SitePageId != 0)
            {
                return ServiseResult<string>.Failure("این داده قبلا ثبت شده است");
            }
            return await _serviceSitePage.UpdateSitePage(SitePageNew);
        }

        [HttpPost]
        [Route("SitePages/UpdateData")]
        [CheckAccessData(PageName, "U")]
        public async Task<ServiseResult<string>> Update(SitePage SitePageNew)
        {
            if (SitePageNew.SitePageId == 0)
            {
                return ServiseResult<string>.Failure("این رکورد در دیتابیس برای ویرایش یافت نشد");
            }
            return await _serviceSitePage.UpdateSitePage(SitePageNew);
        }

        [HttpPost]
        [Route("SitePages/DeleteData")]
        [CheckAccessData(PageName, "D")]
        public async Task<ServiseResult<string>> Delete(int id)
        {
            return await _serviceSitePage.DeleteSitePage(id);
        }

    }
}
