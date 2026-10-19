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
    public class ContactUsController : Controller
    {
        private IServiceContactUs _serviceContactUs;
        private IServiceQueryDB _serviceQueryDB;
        private const string PageName = "ContactUs";
        public ContactUsController(
            IServiceQueryDB serviceQueryDB,
            IServiceContactUs serviceContactUs
            )
        {
            _serviceQueryDB = serviceQueryDB;
            _serviceContactUs = serviceContactUs;
        }
        [CheckAccessView(PageName, "V")]
        public async Task<ActionResult> ContactUss()
        {
            return View();
        }

        [HttpPost]
        [Route("ContactUss/GetFilterData")]
        [CheckAccessData(PageName, "F")]
        public async Task<ServiseResult<string>> GetAllContactUssWithFilter(string charAccess, string data)
        {
            var Parametrs = data.Split(',');
            string Query = $"select * from ContactUsView where @{Parametrs[0]}";
            var parameters = new[] {
                new SqlParameter($"@{Parametrs[0]}", SqlDbType.NVarChar, 200) { Value = Parametrs[1] }
            };
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query, parameters);
        }
        [HttpPost]
        [Route("ContactUss/GetAllData")]
        [CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetAllContactUss(int pageNumber = 0)
        {
            string Query = $"select * from {PageName}View";
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query);
        }

        [HttpPost]
        [Route("ContactUss/AddData")]
        [CheckAccessData(PageName, "A")]
        public async Task<ServiseResult<string>> Add(ContactUs ContactUsNew)
        {
            if (ContactUsNew.ContactUsId != 0) return ServiseResult<string>.Failure("این داده قبلا ثبت شده است");
            return await _serviceContactUs.UpdateContactUs(ContactUsNew);
        }

        [HttpPost]
        [Route("ContactUss/UpdateData")]
        [CheckAccessData(PageName, "U")]
        public async Task<ServiseResult<string>> Update(ContactUs ContactUsNew)
        {
            if (ContactUsNew.ContactUsId == 0) return ServiseResult<string>.Failure("این داده در دیتابیس وجود ندارد");
            return await _serviceContactUs.UpdateContactUs(ContactUsNew);
        }

        [HttpPost]
        [Route("ContactUss/DeleteData")]
        [CheckAccessData(PageName, "D")]
        public async Task<ServiseResult<string>> Delete(int id)
        {
            return await _serviceContactUs.DeleteContactUs(id);
        }

    }
}
