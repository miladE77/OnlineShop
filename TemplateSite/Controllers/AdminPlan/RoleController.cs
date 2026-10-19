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
    public class RoleController : Controller
    {
        private IServiceRole _serviceRole;
        private IServiceQueryDB _serviceQueryDB;
        private const string PageName = "Role";
        public RoleController(
            IServiceQueryDB serviceQueryDB,
            IServiceRole serviceRole
            )
        {
            _serviceQueryDB = serviceQueryDB;
            _serviceRole = serviceRole;
        }
        [CheckAccessView(PageName, "V")]
        public async Task<ActionResult> Roles()
        {
            return View();
        }

        [HttpPost]
        [Route("Roles/GetFilterData")]
        [CheckAccessData(PageName, "F")]
        public async Task<ServiseResult<string>> GetAllRolesWithFilter(string charAccess, string data)
        {
            var Parametrs = data.Split(',');
            string Query = $"select * from RoleView where @{Parametrs[0]}";
            var parameters = new[] {
                new SqlParameter($"@{Parametrs[0]}", SqlDbType.NVarChar, 200) { Value = Parametrs[1] }
            };
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query, parameters);
        }
        [HttpPost]
        [Route("Roles/GetAllData")]
        [CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetAllRoles(int pageNumber = 0)
        {
            string Query = $"select * from {PageName}View";
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query);
        }

        [HttpPost]
        [Route("Roles/AddData")]
        [CheckAccessData(PageName, "A")]
        public async Task<ServiseResult<string>> Add(Role RoleNew)
        {
            if (RoleNew.RoleId != 0) return ServiseResult<string>.Failure("این داده قبلا ثبت شده است");
            return await _serviceRole.UpdateRole(RoleNew);
        }

        [HttpPost]
        [Route("Roles/UpdateData")]
        [CheckAccessData(PageName, "U")]
        public async Task<ServiseResult<string>> Update(Role RoleNew)
        {
            if (RoleNew.RoleId == 0) return ServiseResult<string>.Failure("این داده در دیتابیس وجود ندارد");
            return await _serviceRole.UpdateRole(RoleNew);
        }

        [HttpPost]
        [Route("Roles/DeleteData")]
        [CheckAccessData(PageName, "D")]
        public async Task<ServiseResult<string>> Delete(int id)
        {
            return await _serviceRole.DeleteRole(id);
        }

    }
}
