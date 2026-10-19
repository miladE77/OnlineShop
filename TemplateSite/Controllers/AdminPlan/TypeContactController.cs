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
    public class TypeContactController : Controller
    {
        private IServiceTypeContact _serviceTypeContact;
        private IServiceQueryDB _serviceQueryDB;
        private const string PageName = "TypeContact";
        public TypeContactController(
            IServiceQueryDB serviceQueryDB,
            IServiceTypeContact serviceTypeContact
            )
        {
            _serviceQueryDB = serviceQueryDB;
            _serviceTypeContact = serviceTypeContact;
        }
        [CheckAccessView(PageName, "V")]
        public async Task<ActionResult> TypeContacts()
        {
            return View();
        }

        [HttpPost]
        [Route("TypeContacts/GetFilterData")]
        [CheckAccessData(PageName, "F")]
        public async Task<ServiseResult<string>> GetAllTypeContactsWithFilter(string charAccess, string data)
        {
            var Parametrs = data.Split(',');
            string Query = $"select * from TypeContactView where @{Parametrs[0]}";
            var parameters = new[] {
                new SqlParameter($"@{Parametrs[0]}", SqlDbType.NVarChar, 200) { Value = Parametrs[1] }
            };
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query, parameters);
        }
        [HttpPost]
        [Route("TypeContacts/GetAllData")]
        [CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetAllTypeContacts(int pageNumber = 0)
        {
            return await _serviceTypeContact.GetAllTypeContact(pageNumber);
        }

        [HttpPost]
        [Route("TypeContacts/AddData")]
        [CheckAccessData(PageName, "A")]
        public async Task<ServiseResult<string>> Add(TypeContact TypeContactNew)
        {
            if (TypeContactNew.TypeContactId != 0) return ServiseResult<string>.Failure("این داده قبلا ثبت شده است");
            return await _serviceTypeContact.UpdateTypeContact(TypeContactNew);
        }

        [HttpPost]
        [Route("TypeContacts/UpdateData")]
        [CheckAccessData(PageName, "U")]
        public async Task<ServiseResult<string>> Update(TypeContact TypeContactNew)
        {
            if (TypeContactNew.TypeContactId == 0) return ServiseResult<string>.Failure("این داده در دیتابیس وجود ندارد");
            return await _serviceTypeContact.UpdateTypeContact(TypeContactNew);
        }

        [HttpPost]
        [Route("TypeContacts/DeleteData")]
        [CheckAccessData(PageName, "D")]
        public async Task<ServiseResult<string>> Delete(int id)
        {
            return await _serviceTypeContact.DeleteTypeContact(id);
        }

    }
}
