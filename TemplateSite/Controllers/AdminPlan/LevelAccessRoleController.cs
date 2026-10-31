using Application.Services;
using Domain.Models;
using Domain.ServiseResult;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.IdentityModel.Tokens;
using Newtonsoft.Json;
using Site.Filters;
using System.Data;
using TemplateSite.Filters;


namespace TemplateSite.Controllers.Management
{
    public class LevelAccessRoleOrderController : Controller
    {
        private IServiceQueryDB _serviceQueryDB;
        private const string PageName = "LevelAccessRole";
        public LevelAccessRoleOrderController(IServiceQueryDB serviceQueryDB)
        {
            _serviceQueryDB = serviceQueryDB;
        }

        [HttpPost]
        [Route("LevelAccessRole/GetData")]
        [CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetAll_LevelAccessRoleOrder(int id)
        {
            string Query = "select * from LevelAccess_Role where RoleId = " + id;
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query);
        }
        [HttpPost]
        [Route("LevelAccessRole/AddData")]
        [CheckAccessData(PageName, "A")]
        public async Task<ServiseResult<string>> Add_NewLevelAccessRoleOrder(int LevelAccessId, int RoleId)
        {
            string Query = $"Insert FROM LevelAccess_Role WHERE LevelAccessId = {LevelAccessId} AND RoleId = {RoleId}";
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query);
        }
        [HttpPost]
        [Route("LevelAccessRole/DeleteData")]
        [CheckAccessData(PageName, "D")]
        public async Task<ServiseResult<string>> Delete_LevelAccessRoleOrder(int LevelAccessId, int RoleId)
        {
            string Query = $"DELETE FROM LevelAccess_Role WHERE LevelAccessId = {LevelAccessId} AND RoleId = {RoleId}";
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query);
        }

    }
}
