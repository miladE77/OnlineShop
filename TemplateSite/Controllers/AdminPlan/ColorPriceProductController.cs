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
    public class ColorPriceProductController : Controller
    {
        private IServiceColorPriceProduct _serviceColorPriceProduct;
        private IServiceQueryDB _serviceQueryDB;
        private const string PageName = "ColorPriceProduct";
        public ColorPriceProductController(
            IServiceQueryDB serviceQueryDB,
            IServiceColorPriceProduct serviceColorPriceProduct
            )
        {
            _serviceQueryDB = serviceQueryDB;
            _serviceColorPriceProduct = serviceColorPriceProduct;
        }

        [CheckAccessView(PageName, "V")]
        public async Task<ActionResult> ColorPriceProducts()
        {
            return View();
        }

        [HttpPost]
        [Route("ColorPriceProducts/GetFilterData")]
        [CheckAccessData(PageName, "F")]
        public async Task<ServiseResult<string>> GetAllColorPriceProductsWithFilter(string charAccess, string data)
        {
            var Parametrs = data.Split(',');
            string Query = $"select * from ColorPriceProductView where @{Parametrs[0]}";
            var parameters = new[] {
                new SqlParameter($"@{Parametrs[0]}", SqlDbType.NVarChar, 200) { Value = Parametrs[1] }
            };
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query, parameters);
        }
        [HttpPost]
        [Route("ColorPriceProducts/GetAllData")]
        [CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetAllColorPriceProducts(int pageNumber = 0)
        {
            string Query = $"select * from {PageName}View";
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query);
        }

        [HttpPost]
        [Route("ColorPriceProducts/AddData")]
        [CheckAccessData(PageName, "A")]
        public async Task<ServiseResult<string>> Add(ColorPriceProduct ColorPriceProductNew)
        {
            if (ColorPriceProductNew.ColorPriceProductId != 0) return ServiseResult<string>.Failure("این داده قبلا ثبت شده است");
            return await _serviceColorPriceProduct.UpdateColorPriceProduct(ColorPriceProductNew);
        }

        [HttpPost]
        [Route("ColorPriceProducts/UpdateData")]
        [CheckAccessData(PageName, "U")]
        public async Task<ServiseResult<string>> Update(ColorPriceProduct ColorPriceProductNew)
        {
            if (ColorPriceProductNew.ColorPriceProductId == 0) return ServiseResult<string>.Failure("این داده در دیتابیس وجود ندارد");
            return await _serviceColorPriceProduct.UpdateColorPriceProduct(ColorPriceProductNew);
        }

        [HttpPost]
        [Route("ColorPriceProducts/DeleteData")]
        [CheckAccessData(PageName, "D")]
        public async Task<ServiseResult<string>> Delete(int id)
        {
            return await _serviceColorPriceProduct.DeleteColorPriceProduct(id);
        }

    }
}
