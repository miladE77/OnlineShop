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
    public class StorePageOrderController : Controller
    {
        private IServiceQueryDB _serviceQueryDB;
        private const string PageName = "StorePage";
        public StorePageOrderController(IServiceQueryDB serviceQueryDB)
        {
            _serviceQueryDB = serviceQueryDB;
        }

        [HttpPost]
        [Route("StorePageOrder/GetData")]
        [CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetAll_StorePageOrder(int id)
        {
            string Query = "select * from StorePage_Order where OrderId =" + id;
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query);
        }
        [HttpPost]
        [Route("StorePageOrder/AddData")]
        [CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> Add_NewStorePageOrder(int StoreId, int PageId)
        {
            string Query = $"DELETE FROM StorePage WHERE StoreId = {StoreId} AND PageId = {PageId}";
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query);
        }
        [HttpPost]
        [Route("StorePageOrder/DeleteData")]
        [CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> Delete_StorePageOrder(int StoreId, int PageId)
        {
            string Query = $"DELETE FROM StorePage WHERE StoreId = {StoreId} AND PageId = {PageId}";
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query);
        }

    }
}
