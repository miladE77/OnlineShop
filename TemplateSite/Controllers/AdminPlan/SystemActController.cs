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
    public class SystemActController : Controller
    {
        private IServiceSystemAct _serviceSystemAct;
        private IServiceQueryDB _serviceQueryDB;
        private const string PageName = "SystemAct";
        public SystemActController(
            IServiceQueryDB serviceQueryDB,
            IServiceSystemAct serviceSystemAct
            )
        {
            _serviceQueryDB = serviceQueryDB;
            _serviceSystemAct = serviceSystemAct;
        }
        [CheckAccessView(PageName, "V")]
        public async Task<ActionResult> SystemActs()
        {
            return View();
        }

        [HttpPost]
        [Route("SystemActs/GetFilterData")]
        [CheckAccessData(PageName, "F")]
        public async Task<ServiseResult<string>> GetAllSystemActsWithFilter(string charAccess, string data)
        {
            var Parametrs = data.Split(',');
            string Query = $"select * from SystemActView where @{Parametrs[0]}";
            var parameters = new[] {
                new SqlParameter($"@{Parametrs[0]}", SqlDbType.NVarChar, 200) { Value = Parametrs[1] }
            };
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query, parameters);
        }
        [HttpPost]
        [Route("SystemActs/GetAllData")]
        [CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetAllSystemActs(int pageNumber = 0)
        {
            string Query = $"select * from {PageName}View";
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query);
        }

        [HttpPost]
        [Route("SystemActs/AddData")]
        [CheckAccessData(PageName, "A")]
        public async Task<ServiseResult<string>> Add(SystemAct SystemActNew)
        {
            if (SystemActNew.SystemActId != 0) return ServiseResult<string>.Failure("این داده قبلا ثبت شده است");
            return await _serviceSystemAct.UpdateSystemAct(SystemActNew);
        }

        [HttpPost]
        [Route("SystemActs/UpdateData")]
        [CheckAccessData(PageName, "U")]
        public async Task<ServiseResult<string>> Update(SystemAct SystemActNew)
        {
            if (SystemActNew.SystemActId == 0) return ServiseResult<string>.Failure("این داده در دیتابیس وجود ندارد");
            return await _serviceSystemAct.UpdateSystemAct(SystemActNew);
        }

        [HttpPost]
        [Route("SystemActs/DeleteData")]
        [CheckAccessData(PageName, "D")]
        public async Task<ServiseResult<string>> Delete(int id)
        {
            return await _serviceSystemAct.DeleteSystemAct(id);
        }

    }
}
