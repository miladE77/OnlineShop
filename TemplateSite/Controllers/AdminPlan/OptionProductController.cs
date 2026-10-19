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
    public class OptionProductController : Controller
    {
        private IServiceOptionProduct _serviceOptionProduct;
        private IServiceQueryDB _serviceQueryDB;
        private const string PageName = "OptionProduct";
        public OptionProductController(
            IServiceQueryDB serviceQueryDB,
            IServiceOptionProduct serviceOptionProduct
            )
        {
            _serviceQueryDB = serviceQueryDB;
            _serviceOptionProduct = serviceOptionProduct;
        }
        [CheckAccessView(PageName, "V")]
        public async Task<ActionResult> OptionProducts()
        {
            return View();
        }

        [HttpPost]
        [Route("OptionProducts/GetFilterData")]
        [CheckAccessData(PageName, "F")]
        public async Task<ServiseResult<string>> GetAllOptionProductsWithFilter(string charAccess, string data)
        {
            var Parametrs = data.Split(',');
            string Query = $"select * from OptionProductView where @{Parametrs[0]}";
            var parameters = new[] {
                new SqlParameter($"@{Parametrs[0]}", SqlDbType.NVarChar, 200) { Value = Parametrs[1] }
            };
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query, parameters);
        }
        [HttpPost]
        [Route("OptionProducts/GetAllData")]
        [CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetAllOptionProducts(int pageNumber = 0)
        {
            string Query = $"select * from {PageName}View";
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query);
        }

        [HttpPost]
        [Route("OptionProducts/AddData")]
        [CheckAccessData(PageName, "A")]
        public async Task<ServiseResult<string>> Add(OptionProduct OptionProductNew)
        {
            if (OptionProductNew.OptionProductId != 0) return ServiseResult<string>.Failure("این داده قبلا ثبت شده است");
            return await _serviceOptionProduct.UpdateOptionProduct(OptionProductNew);
        }

        [HttpPost]
        [Route("OptionProducts/UpdateData")]
        [CheckAccessData(PageName, "U")]
        public async Task<ServiseResult<string>> Update(OptionProduct OptionProductNew)
        {
            if (OptionProductNew.OptionProductId == 0) return ServiseResult<string>.Failure("این داده در دیتابیس وجود ندارد");
            return await _serviceOptionProduct.UpdateOptionProduct(OptionProductNew);
        }

        [HttpPost]
        [Route("OptionProducts/DeleteData")]
        [CheckAccessData(PageName, "D")]
        public async Task<ServiseResult<string>> Delete(int id)
        {
            return await _serviceOptionProduct.DeleteOptionProduct(id);
        }

    }
}
