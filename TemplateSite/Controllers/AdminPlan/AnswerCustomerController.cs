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
    public class AnswerCustomerController : Controller
    {
        private IServiceAnswerCustomer _serviceAnswerCustomer;
        private IServiceQueryDB _serviceQueryDB;
        private const string PageName = "AnswerCustomer";
        public AnswerCustomerController(
            IServiceQueryDB serviceQueryDB,
            IServiceAnswerCustomer serviceAnswerCustomer
            )
        {
            _serviceQueryDB = serviceQueryDB;
            _serviceAnswerCustomer = serviceAnswerCustomer;
        }
        [CheckAccessView(PageName, "V")]
        public async Task<ActionResult> AnswerCustomers()
        {
            return View();
        }

        [HttpPost]
        [Route("AnswerCustomers/GetFilterData")]
        [CheckAccessData(PageName, "F")]
        public async Task<ServiseResult<string>> GetAllAnswerCustomersWithFilter(string charAccess, string data)
        {
            var Parametrs = data.Split(',');
            string Query = $"select * from AnswerCustomerView where @{Parametrs[0]}";
            var parameters = new[] {
                new SqlParameter($"@{Parametrs[0]}", SqlDbType.NVarChar, 200) { Value = Parametrs[1] }
            };
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query, parameters);
        }
        [HttpPost]
        [Route("AnswerCustomers/GetAllData")]
        [CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetAllAnswerCustomers(int pageNumber = 0)
        {
            string Query = $"select * from {PageName}View";
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query);
        }

        [HttpPost]
        [Route("AnswerCustomers/AddData")]
        [CheckAccessData(PageName, "A")]
        public async Task<ServiseResult<string>> Add(AnswerCustomer AnswerCustomerNew)
        {
            if (AnswerCustomerNew.AnswerCustomerId != 0) return ServiseResult<string>.Failure("این داده قبلا ثبت شده است");
            return await _serviceAnswerCustomer.UpdateAnswerCustomer(AnswerCustomerNew);
        }

        [HttpPost]
        [Route("AnswerCustomers/UpdateData")]
        [CheckAccessData(PageName, "U")]
        public async Task<ServiseResult<string>> Update(AnswerCustomer AnswerCustomerNew)
        {
            if (AnswerCustomerNew.AnswerCustomerId == 0) return ServiseResult<string>.Failure("این داده در دیتابیس وجود ندارد");
            return await _serviceAnswerCustomer.UpdateAnswerCustomer(AnswerCustomerNew);
        }

        [HttpPost]
        [Route("AnswerCustomers/DeleteData")]
        [CheckAccessData(PageName, "D")]
        public async Task<ServiseResult<string>> Delete(int id)
        {
            return await _serviceAnswerCustomer.DeleteAnswerCustomer(id);
        }

    }
}
