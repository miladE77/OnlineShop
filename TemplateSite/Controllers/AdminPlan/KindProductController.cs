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
    public class KindProductController : Controller
    {
        private IServiceKindProduct _serviceKindProduct;
        private IServiceQueryDB _serviceQueryDB;
        private const string PageName = "KindProduct";
        public KindProductController(
            IServiceQueryDB serviceQueryDB,
            IServiceKindProduct serviceKindProduct
            )
        {
            _serviceQueryDB = serviceQueryDB;
            _serviceKindProduct = serviceKindProduct;
        }
        [CheckAccessView(PageName, "V")]
        public async Task<ActionResult> KindProducts()
        {
            return View();
        }

        [HttpPost]
        [Route("KindProducts/GetFilterData")]
        [CheckAccessData(PageName, "F")]
        public async Task<ServiseResult<string>> GetAllKindProductsWithFilter(string charAccess, string data)
        {
            var Parametrs = data.Split(',');
            string Query = $"select * from KindProductView where @{Parametrs[0]}";
            var parameters = new[] {
                new SqlParameter($"@{Parametrs[0]}", SqlDbType.NVarChar, 200) { Value = Parametrs[1] }
            };
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query, parameters);
        }
        [HttpPost]
        [Route("KindProducts/GetAllData")]
        [CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetAllKindProducts(int pageNumber = 0)
        {
            string Query = $"select * from {PageName}View";
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query);
        }

        [HttpPost]
        [Route("KindProducts/AddData")]
        [CheckAccessData(PageName, "A")]
        public async Task<ServiseResult<string>> Add(KindProduct KindProductNew)
        {
            if (KindProductNew.KindProductId != 0) return ServiseResult<string>.Failure("این داده قبلا ثبت شده است");
            return await _serviceKindProduct.UpdateKindProduct(KindProductNew);
        }

        [HttpPost]
        [Route("KindProducts/UpdateData")]
        [CheckAccessData(PageName, "U")]
        public async Task<ServiseResult<string>> Update(KindProduct KindProductNew)
        {
            if (KindProductNew.KindProductId == 0) return ServiseResult<string>.Failure("این داده در دیتابیس وجود ندارد");
            return await _serviceKindProduct.UpdateKindProduct(KindProductNew);
        }

        [HttpPost]
        [Route("KindProducts/DeleteData")]
        [CheckAccessData(PageName, "D")]
        public async Task<ServiseResult<string>> Delete(int id)
        {
            return await _serviceKindProduct.DeleteKindProduct(id);
        }

    }
}
