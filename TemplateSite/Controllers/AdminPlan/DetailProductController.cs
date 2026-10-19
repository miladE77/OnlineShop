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
    public class DetailProductController : Controller
    {
        private IServiceDetailProduct _serviceDetailProduct;
        private IServiceQueryDB _serviceQueryDB;
        private const string PageName = "DetailProduct";
        public DetailProductController(
            IServiceQueryDB serviceQueryDB,
            IServiceDetailProduct serviceDetailProduct
            )
        {
            _serviceQueryDB = serviceQueryDB;
            _serviceDetailProduct = serviceDetailProduct;
        }
        [CheckAccessView(PageName, "V")]
        public async Task<ActionResult> DetailProducts()
        {
            return View();
        }

        [HttpPost]
        [Route("DetailProducts/GetFilterData")]
        [CheckAccessData(PageName, "F")]
        public async Task<ServiseResult<string>> GetAllDetailProductsWithFilter(string charAccess, string data)
        {
            var Parametrs = data.Split(',');
            string Query = $"select * from DetailProductView where @{Parametrs[0]}";
            var parameters = new[] {
                new SqlParameter($"@{Parametrs[0]}", SqlDbType.NVarChar, 200) { Value = Parametrs[1] }
            };
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query, parameters);
        }
        [HttpPost]
        [Route("DetailProducts/GetAllData")]
        [CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetAllDetailProducts(int pageNumber = 0)
        {
            string Query = $"select * from {PageName}View";
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query);
        }

        [HttpPost]
        [Route("DetailProducts/AddData")]
        [CheckAccessData(PageName, "A")]
        public async Task<ServiseResult<string>> Add(DetailProduct DetailProductNew)
        {
            if (DetailProductNew.DetailProductId != 0) return ServiseResult<string>.Failure("این داده قبلا ثبت شده است");
            return await _serviceDetailProduct.UpdateDetailProduct(DetailProductNew);
        }

        [HttpPost]
        [Route("DetailProducts/UpdateData")]
        [CheckAccessData(PageName, "U")]
        public async Task<ServiseResult<string>> Update(DetailProduct DetailProductNew)
        {
            if (DetailProductNew.DetailProductId == 0) return ServiseResult<string>.Failure("این داده در دیتابیس وجود ندارد");
            return await _serviceDetailProduct.UpdateDetailProduct(DetailProductNew);
        }

        [HttpPost]
        [Route("DetailProducts/DeleteData")]
        [CheckAccessData(PageName, "D")]
        public async Task<ServiseResult<string>> Delete(int id)
        {
            return await _serviceDetailProduct.DeleteDetailProduct(id);
        }

    }
}
