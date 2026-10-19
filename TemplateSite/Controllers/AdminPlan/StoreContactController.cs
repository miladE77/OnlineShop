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
    public class StoreContactOrderController : Controller
    {
        private IServiceQueryDB _serviceQueryDB;
        private const string PageName = "StoreContact";
        public StoreContactOrderController(IServiceQueryDB serviceQueryDB)
        {
            _serviceQueryDB = serviceQueryDB;
        }

        [HttpPost]
        [Route("StoreContactOrder/GetData")]
        [CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetAll_StoreContactOrder(int id)
        {
            string Query = "select * from StoreContact_Order where OrderId =" + id;
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query);
        }
        [HttpPost]
        [Route("StoreContactOrder/AddData")]
        [CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> Add_NewStoreContactOrder(int StoreId, int ContactId)
        {
            string Query = $"DELETE FROM StoreContact WHERE StoreId = {StoreId} AND ContactId = {ContactId}";
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query);
        }
        [HttpPost]
        [Route("StoreContactOrder/DeleteData")]
        [CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> Delete_StoreContactOrder(int StoreId, int ContactId)
        {
            string Query = $"DELETE FROM StoreContact WHERE StoreId = {StoreId} AND ContactId = {ContactId}";
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query);
        }

    }
}
