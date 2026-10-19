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
    public class LevelAccessController : Controller
    {
        private IServiceLevelAccess _serviceLevelAccess;
        private IServiceQueryDB _serviceQueryDB;
        private const string PageName = "LevelAccess";
        public LevelAccessController(
            IServiceQueryDB serviceQueryDB,
            IServiceLevelAccess serviceLevelAccess
            )
        {
            _serviceQueryDB = serviceQueryDB;
            _serviceLevelAccess = serviceLevelAccess;
        }
        [CheckAccessView(PageName, "V")]
        public async Task<ActionResult> LevelAccesss()
        {
            return View();
        }

        [HttpPost]
        [Route("LevelAccesss/GetFilterData")]
        [CheckAccessData(PageName, "F")]
        public async Task<ServiseResult<string>> GetAllLevelAccesssWithFilter(string charAccess, string data)
        {
            var Parametrs = data.Split(',');
            string Query = $"select * from LevelAccessView where @{Parametrs[0]}";
            var parameters = new[] {
                new SqlParameter($"@{Parametrs[0]}", SqlDbType.NVarChar, 200) { Value = Parametrs[1] }
            };
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query, parameters);
        }
        [HttpPost]
        [Route("LevelAccesss/GetAllData")]
        [CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetAllLevelAccesss(int pageNumber = 0)
        {
            string Query = $"select * from {PageName}View";
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query);
        }

        [HttpPost]
        [Route("LevelAccesss/AddData")]
        [CheckAccessData(PageName, "A")]
        public async Task<ServiseResult<string>> Add(LevelAccess LevelAccessNew)
        {
            if (LevelAccessNew.LevelAccessId != 0) return ServiseResult<string>.Failure("این داده قبلا ثبت شده است");
            return await _serviceLevelAccess.UpdateLevelAccess(LevelAccessNew);
        }

        [HttpPost]
        [Route("LevelAccesss/UpdateData")]
        [CheckAccessData(PageName, "U")]
        public async Task<ServiseResult<string>> Update(LevelAccess LevelAccessNew)
        {
            if (LevelAccessNew.LevelAccessId == 0) return ServiseResult<string>.Failure("این داده در دیتابیس وجود ندارد");
            return await _serviceLevelAccess.UpdateLevelAccess(LevelAccessNew);
        }

        [HttpPost]
        [Route("LevelAccesss/DeleteData")]
        [CheckAccessData(PageName, "D")]
        public async Task<ServiseResult<string>> Delete(int id)
        {
            return await _serviceLevelAccess.DeleteLevelAccess(id);
        }

    }
}
