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
    public class ContactController : Controller
    {
        private IServiceContact _serviceContact;
        private IServiceQueryDB _serviceQueryDB;
        private const string PageName = "Contact";
        public ContactController(
            IServiceQueryDB serviceQueryDB,
            IServiceContact serviceContact
            )
        {
            _serviceQueryDB = serviceQueryDB;
            _serviceContact = serviceContact;
        }
        [CheckAccessView(PageName, "V")]
        public async Task<ActionResult> Contacts()
        {
            return View();
        }

        [HttpPost]
        [Route("Contacts/GetFilterData")]
        [CheckAccessData(PageName, "F")]
        public async Task<ServiseResult<string>> GetAllContactsWithFilter(string charAccess, string data)
        {
            var Parametrs = data.Split(',');
            string Query = $"select * from ContactView where @{Parametrs[0]}";
            var parameters = new[] {
                new SqlParameter($"@{Parametrs[0]}", SqlDbType.NVarChar, 200) { Value = Parametrs[1] }
            };
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query, parameters);
        }
        [HttpPost]
        [Route("Contacts/GetAllData")]
        [CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetAllContacts(int pageNumber = 0)
        {
            string Query = $"select * from {PageName}View";
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query);
        }

        [HttpPost]
        [Route("Contacts/AddData")]
        [CheckAccessData(PageName, "A")]
        public async Task<ServiseResult<string>> Add(Contact ContactNew)
        {
            if (ContactNew.ContactId != 0) return ServiseResult<string>.Failure("این داده قبلا ثبت شده است");
            return await _serviceContact.UpdateContact(ContactNew);
        }

        [HttpPost]
        [Route("Contacts/UpdateData")]
        [CheckAccessData(PageName, "U")]
        public async Task<ServiseResult<string>> Update(Contact ContactNew)
        {
            if (ContactNew.ContactId == 0) return ServiseResult<string>.Failure("این داده در دیتابیس وجود ندارد");
            return await _serviceContact.UpdateContact(ContactNew);
        }

        [HttpPost]
        [Route("Contacts/DeleteData")]
        [CheckAccessData(PageName, "D")]
        public async Task<ServiseResult<string>> Delete(int id)
        {
            return await _serviceContact.DeleteContact(id);
        }

    }
}
