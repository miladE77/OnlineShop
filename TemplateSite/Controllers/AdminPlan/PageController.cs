using Application.Services;
using Domain.Models;
using Domain.ServiseResult;
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


namespace TemplateSite.Controllers.Management
{
    public class PageController : Controller
    {
        private IServicePage _servicePage;
        private IServiceQueryDB _serviceQueryDB;
        private const string PageName = "Page";
        public PageController(
            IServiceQueryDB serviceQueryDB,
            IServicePage servicePage
            )
        {
            _serviceQueryDB = serviceQueryDB;
            _servicePage = servicePage;
        }
        [CheckAccessView(PageName, "V")]
        public async Task<ActionResult> Pages()
        {
            return View();
        }

        [HttpPost]
        [Route("Pages/GetFilterData")]
        [CheckAccessData(PageName, "F")]
        public async Task<ServiseResult<string>> GetAllPagesWithFilter(string charAccess, string data)
        {
            var Parametrs = data.Split(',');
            string Query = $"select * from PageView where @{Parametrs[0]}";
            var parameters = new[] {
                new SqlParameter($"@{Parametrs[0]}", SqlDbType.NVarChar, 200) { Value = Parametrs[1] }
            };
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query, parameters);
        }
        [HttpPost]
        [Route("Pages/GetAllData")]
        [CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetAllPages(int pageNumber = 0)
        {
            string Query = $"select * from {PageName}View";
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query);
        }

        [HttpPost]
        [Route("Pages/AddData")]
        [CheckAccessData(PageName, "A")]
        public async Task<ServiseResult<string>> Add(Domain.Models.Page PageNew)
        {
            if (PageNew.PageId != 0) return ServiseResult<string>.Failure("این داده قبلا ثبت شده است");
            return await _servicePage.UpdatePage(PageNew);
        }

        [HttpPost]
        [Route("Pages/UpdateData")]
        [CheckAccessData(PageName, "U")]
        public async Task<ServiseResult<string>> Update(Domain.Models.Page PageNew)
        {
            if (PageNew.PageId == 0) return ServiseResult<string>.Failure("این داده در دیتابیس وجود ندارد");
            return await _servicePage.UpdatePage(PageNew);
        }

        [HttpPost]
        [Route("Pages/DeleteData")]
        [CheckAccessData(PageName, "D")]
        public async Task<ServiseResult<string>> Delete(int id)
        {
            return await _servicePage.DeletePage(id);
        }

    }
}
