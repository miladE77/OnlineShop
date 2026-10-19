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
    public class ProductController : Controller
    {
        private IServiceProduct _serviceProduct;
        private IServiceQueryDB _serviceQueryDB;
        private const string PageName = "Product";
        public ProductController(
            IServiceQueryDB serviceQueryDB,
            IServiceProduct serviceProduct
            )
        {
            _serviceQueryDB = serviceQueryDB;
            _serviceProduct = serviceProduct;
        }
        [CheckAccessView(PageName, "V")]
        public async Task<ActionResult> Products()
        {
            return View();
        }

        [HttpPost]
        [Route("Products/GetFilterData")]
        [CheckAccessData(PageName, "F")]
        public async Task<ServiseResult<string>> GetAllProductsWithFilter(string charAccess, string data)
        {
            var Parametrs = data.Split(',');
            string Query = $"select * from ProductView where @{Parametrs[0]}";
            var parameters = new[] {
                new SqlParameter($"@{Parametrs[0]}", SqlDbType.NVarChar, 200) { Value = Parametrs[1] }
            };
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query, parameters);
        }
        [HttpPost]
        [Route("Products/GetAllData")]
        [CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetAllProducts(int pageNumber = 0)
        {
            var allowedStoreIds = HttpContext.Items["AllowedStoreIds"] as List<int>;

            if (User.IsInRole("Admin") || allowedStoreIds == null)
            {
                return await _serviceProduct.GetAllProduct(0);
            }
            return await _serviceProduct.GetAllProduct(allowedStoreIds);
        }

        [HttpPost]
        [Route("Products/AddData")]
        [CheckAccessData(PageName, "A")]
        public async Task<ServiseResult<string>> Add(Product ProductNew)
        {
            if (ProductNew.ProductId != 0) return ServiseResult<string>.Failure("این داده قبلا ثبت شده است");
            return await _serviceProduct.UpdateProduct(ProductNew);
        }

        [HttpPost]
        [Route("Products/UpdateData")]
        [CheckAccessData(PageName, "U")]
        public async Task<ServiseResult<string>> Update(Product ProductNew)
        {
            if (ProductNew.ProductId == 0) return ServiseResult<string>.Failure("این داده در دیتابیس وجود ندارد");
            return await _serviceProduct.UpdateProduct(ProductNew);
        }

        [HttpPost]
        [Route("Products/DeleteData")]
        [CheckAccessData(PageName, "D")]
        public async Task<ServiseResult<string>> Delete(int id)
        {
            return await _serviceProduct.DeleteProduct(id);
        }

    }
}
