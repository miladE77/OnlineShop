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
    public class StoreRoleOrderController : Controller
    {
        private IServiceQueryDB _serviceQueryDB;
        private const string PageName = "StoreRole";
        public StoreRoleOrderController(IServiceQueryDB serviceQueryDB)
        {
            _serviceQueryDB = serviceQueryDB;
        }

        [HttpPost]
        [Route("StoreRoleOrder/GetData")]
        [CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetAll_StoreRoleOrder(int id)
        {
            string Query = "select * from StoreRole_Order where OrderId =" + id;
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query);
        }
        [HttpPost]
        [Route("StoreRoleOrder/AddData")]
        [CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> Add_NewStoreRoleOrder(int StoreId, int RoleId)
        {
            string Query = $"DELETE FROM StoreRole WHERE StoreId = {StoreId} AND RoleId = {RoleId}";
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query);
        }
        [HttpPost]
        [Route("StoreRoleOrder/DeleteData")]
        [CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> Delete_StoreRoleOrder(int StoreId, int RoleId)
        {
            string Query = $"DELETE FROM StoreRole WHERE StoreId = {StoreId} AND RoleId = {RoleId}";
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query);
        }

    }
}
