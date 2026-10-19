
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
    public class StoreTypeContactController : Controller
    {
        private readonly IServiceQueryDB _serviceQueryDB;
        private const string pageName = "StoreTypeContact";
        public StoreTypeContactController(IServiceQueryDB serviceQueryDB)
        {
            _serviceQueryDB = serviceQueryDB;
        }

        [HttpPost]
        [Route("StoreTypeContact/GetData")]
        [CheckAccessData(pageName, "V")]
        public async Task<ServiseResult<string>> GetAll_StoreTypeContact(int id)
        {
            string Query = "select * from StoreTypeContact_Order where OrderId =" + id;
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query);
        }
        [HttpPost]
        [Route("StoreTypeContact/AddData")]
        [CheckAccessData(pageName, "V")]
        public async Task<ServiseResult<string>> Add_NewStoreTypeContact(int StoreId, int TypeContactId)
        {
            string Query = $"DELETE FROM StoreTypeContact WHERE StoreId = {StoreId} AND TypeContactId = {TypeContactId}";
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query);
        }
        [HttpPost]
        [Route("StoreTypeContact/DeleteData")]
        [CheckAccessData(pageName, "V")]
        public async Task<ServiseResult<string>> Delete_StoreTypeContact(int StoreId, int TypeContactId)
        {
            string Query = $"DELETE FROM StoreTypeContact WHERE StoreId = {StoreId} AND TypeContactId = {TypeContactId}";
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query);
        }

    }
}

