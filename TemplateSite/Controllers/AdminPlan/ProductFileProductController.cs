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
    public class ProductFileProductOrderController : Controller
    {
        private IServiceQueryDB _serviceQueryDB;
        private const string PageName = "ProductFileProduct";
        public ProductFileProductOrderController(IServiceQueryDB serviceQueryDB)
        {
            _serviceQueryDB = serviceQueryDB;
        }

        [HttpPost]
        [Route("ProductFileProductOrder/GetData")]
        [CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetAll_ProductFileProductOrder(int id)
        {
            string Query = "select * from ProductFileProduct_Order where OrderId =" + id;
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query);
        }
        [HttpPost]
        [Route("ProductFileProductOrder/AddData")]
        [CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> Add_NewProductFileProductOrder(int ProductId, int FileProductId)
        {
            string Query = $"DELETE FROM ProductFileProduct WHERE ProductId = {ProductId} AND FileProductId = {FileProductId}";
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query);
        }
        [HttpPost]
        [Route("ProductFileProductOrder/DeleteData")]
        [CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> Delete_ProductFileProductOrder(int ProductId, int FileProductId)
        {
            string Query = $"DELETE FROM ProductFileProduct WHERE ProductId = {ProductId} AND FileProductId = {FileProductId}";
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query);
        }

    }
}
