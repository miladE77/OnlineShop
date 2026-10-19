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
    public class ProductColorPriceProductOrderController : Controller
    {
        private IServiceQueryDB _serviceQueryDB;
        private const string PageName = "ProductColorPriceProduct";
        public ProductColorPriceProductOrderController(IServiceQueryDB serviceQueryDB)
        {
            _serviceQueryDB = serviceQueryDB;
        }

        [HttpPost]
        [Route("ProductColorPriceProductOrder/GetData")]
        [CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetAll_ProductColorPriceProductOrder(int id)
        {
            string Query = "select * from ProductColorPriceProduct_Order where OrderId =" + id;
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query);
        }
        [HttpPost]
        [Route("ProductColorPriceProductOrder/AddData")]
        [CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> Add_NewProductColorPriceProductOrder(int ProductId, int ColorPriceProductId)
        {
            string Query = $"DELETE FROM ProductColorPriceProduct WHERE ProductId = {ProductId} AND ColorPriceProductId = {ColorPriceProductId}";
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query);
        }
        [HttpPost]
        [Route("ProductColorPriceProductOrder/DeleteData")]
        [CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> Delete_ProductColorPriceProductOrder(int ProductId, int ColorPriceProductId)
        {
            string Query = $"DELETE FROM ProductColorPriceProduct WHERE ProductId = {ProductId} AND ColorPriceProductId = {ColorPriceProductId}";
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query);
        }

    }
}
