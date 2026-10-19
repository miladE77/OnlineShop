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
    public class ProductDetailProductOrderController : Controller
    {
        private IServiceQueryDB _serviceQueryDB;
        private const string PageName = "ProductDetailProduct";
        public ProductDetailProductOrderController(IServiceQueryDB serviceQueryDB)
        {
            _serviceQueryDB = serviceQueryDB;
        }

        [HttpPost]
        [Route("ProductDetailProductOrder/GetData")]
        [CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetAll_ProductDetailProductOrder(int id)
        {
            string Query = "select * from ProductDetailProduct_Order where OrderId =" + id;
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query);
        }
        [HttpPost]
        [Route("ProductDetailProductOrder/AddData")]
        [CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> Add_NewProductDetailProductOrder(int ProductId, int DetailProductId)
        {
            string Query = $"DELETE FROM ProductDetailProduct WHERE ProductId = {ProductId} AND DetailProductId = {DetailProductId}";
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query);
        }
        [HttpPost]
        [Route("ProductDetailProductOrder/DeleteData")]
        [CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> Delete_ProductDetailProductOrder(int ProductId, int DetailProductId)
        {
            string Query = $"DELETE FROM ProductDetailProduct WHERE ProductId = {ProductId} AND DetailProductId = {DetailProductId}";
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query);
        }

    }
}
