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
    public class CodeAccessController : Controller
    {
        private IServiceCodeAccess _serviceCodeAccess;
        private IServiceQueryDB _serviceQueryDB;
        private const string PageName = "CodeAccess";
        public CodeAccessController(
            IServiceQueryDB serviceQueryDB,
            IServiceCodeAccess serviceCodeAccess
            )
        {
            _serviceQueryDB = serviceQueryDB;
            _serviceCodeAccess = serviceCodeAccess;
        }
        [CheckAccessView(PageName, "V")]
        public async Task<ActionResult> CodeAccesss()
        {
            return View();
        }

        [HttpPost]
        [Route("CodeAccesss/GetFilterData")]
        [CheckAccessData(PageName, "F")]
        public async Task<ServiseResult<string>> GetAllCodeAccesssWithFilter(string charAccess, string data)
        {
            var Parametrs = data.Split(',');
            string Query = $"select * from CodeAccessView where @{Parametrs[0]}";
            var parameters = new[] {
                new SqlParameter($"@{Parametrs[0]}", SqlDbType.NVarChar, 200) { Value = Parametrs[1] }
            };
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query, parameters);
        }
        [HttpPost]
        [Route("CodeAccesss/GetAllData")]
        [CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetAllCodeAccesss(int pageNumber = 0)
        {
            string Query = $"select * from {PageName}View";
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query);
        }

        [HttpPost]
        [Route("CodeAccesss/AddData")]
        [CheckAccessData(PageName, "A")]
        public async Task<ServiseResult<string>> Add(CodeAccess CodeAccessNew)
        {
            if (CodeAccessNew.CodeAccessId != 0) return ServiseResult<string>.Failure("این داده قبلا ثبت شده است");
            return await _serviceCodeAccess.UpdateCodeAccess(CodeAccessNew);
        }

        [HttpPost]
        [Route("CodeAccesss/UpdateData")]
        [CheckAccessData(PageName, "U")]
        public async Task<ServiseResult<string>> Update(CodeAccess CodeAccessNew)
        {
            if (CodeAccessNew.CodeAccessId == 0) return ServiseResult<string>.Failure("این داده در دیتابیس وجود ندارد");
            return await _serviceCodeAccess.UpdateCodeAccess(CodeAccessNew);
        }

        [HttpPost]
        [Route("CodeAccesss/DeleteData")]
        [CheckAccessData(PageName, "D")]
        public async Task<ServiseResult<string>> Delete(int id)
        {
            return await _serviceCodeAccess.DeleteCodeAccess(id);
        }

    }
}
