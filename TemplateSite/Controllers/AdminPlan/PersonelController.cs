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
    public class PersonelController : Controller
    {
        private IServicePersonel _servicePersonel;
        private IServiceQueryDB _serviceQueryDB;
        private const string PageName = "Personel";
        public PersonelController(
            IServiceQueryDB serviceQueryDB,
            IServicePersonel servicePersonel
            )
        {
            _serviceQueryDB = serviceQueryDB;
            _servicePersonel = servicePersonel;
        }
        [CheckAccessView(PageName, "V")]
        public async Task<ActionResult> Personels()
        {
            return View();
        }

        [HttpPost]
        [Route("Personels/GetFilterData")]
        [CheckAccessData(PageName, "F")]
        public async Task<ServiseResult<string>> GetAllPersonelsWithFilter(string charAccess, string data)
        {
            var Parametrs = data.Split(',');
            string Query = $"select * from PersonelView where @{Parametrs[0]}";
            var parameters = new[] {
                new SqlParameter($"@{Parametrs[0]}", SqlDbType.NVarChar, 200) { Value = Parametrs[1] }
            };
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query, parameters);
        }
        [HttpPost]
        [Route("Personels/GetAllData")]
        [CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetAllPersonels(int pageNumber = 0)
        {
            string Query = $"select * from {PageName}View";
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query);
        }

        [HttpPost]
        [Route("Personels/AddData")]
        [CheckAccessData(PageName, "A")]
        public async Task<ServiseResult<string>> Add(Personel PersonelNew)
        {
            if (PersonelNew.PersonelId != 0) return ServiseResult<string>.Failure("این داده قبلا ثبت شده است");
            return await _servicePersonel.UpdatePersonel(PersonelNew);
        }

        [HttpPost]
        [Route("Personels/UpdateData")]
        [CheckAccessData(PageName, "U")]
        public async Task<ServiseResult<string>> Update(Personel PersonelNew)
        {
            if (PersonelNew.PersonelId == 0) return ServiseResult<string>.Failure("این داده در دیتابیس وجود ندارد");
            return await _servicePersonel.UpdatePersonel(PersonelNew);
        }

        [HttpPost]
        [Route("Personels/DeleteData")]
        [CheckAccessData(PageName, "D")]
        public async Task<ServiseResult<string>> Delete(int id)
        {
            return await _servicePersonel.DeletePersonel(id);
        }

    }
}
