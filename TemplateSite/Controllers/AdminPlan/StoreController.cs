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
    public class StoreController : Controller
    {
        private IServiceStore _serviceStore;
        private IServiceQueryDB _serviceQueryDB;
        private const string PageName = "Store";
        public StoreController(
            IServiceQueryDB serviceQueryDB,
            IServiceStore serviceStore
            )
        {
            _serviceQueryDB = serviceQueryDB;
            _serviceStore = serviceStore;
        }
        [CheckAccessView(PageName, "V")]
        public async Task<ActionResult> Stores()
        {
            return View();
        }

        [HttpPost]
        [Route("Stores/GetFilterData")]
        [CheckAccessData(PageName, "F")]
        public async Task<ServiseResult<string>> GetAllStoresWithFilter(string charAccess, string data)
        {
            var Parametrs = data.Split(',');
            string Query = $"select * from StoreView where @{Parametrs[0]}";
            var parameters = new[] {
                new SqlParameter($"@{Parametrs[0]}", SqlDbType.NVarChar, 200) { Value = Parametrs[1] }
            };
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query, parameters);
        }
        [HttpPost]
        [Route("Stores/GetAllData")]
        [CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetAllStores(int pageNumber = 0)
        {
            string Query = $"select * from {PageName}View";
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query);
        }

        [HttpPost]
        [Route("Stores/AddData")]
        [CheckAccessData(PageName, "A")]
        public async Task<ServiseResult<string>> Add(Store StoreNew)
        {
            if (StoreNew.StoreId != 0) return ServiseResult<string>.Failure("این داده قبلا ثبت شده است");
            return await _serviceStore.UpdateStore(StoreNew);
        }

        [HttpPost]
        [Route("Stores/UpdateData")]
        [CheckAccessData(PageName, "U")]
        public async Task<ServiseResult<string>> Update(Store StoreNew)
        {
            if (StoreNew.StoreId == 0) return ServiseResult<string>.Failure("این داده در دیتابیس وجود ندارد");
            return await _serviceStore.UpdateStore(StoreNew);
        }

        [HttpPost]
        [Route("Stores/DeleteData")]
        [CheckAccessData(PageName, "D")]
        public async Task<ServiseResult<string>> Delete(int id)
        {
            return await _serviceStore.DeleteStore(id);
        }

    }
}
