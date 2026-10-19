using Application.Services;
using Domain.Models;
using Domain.ServiseResult;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.IdentityModel.Tokens;
using Newtonsoft.Json;
using Site.Filters;
using System.Data;
using TemplateSite.Filters;


namespace TemplateSite.Controllers.Management
{
    public class ContactUsAnswerCustomerOrderController : Controller
    {
        private IServiceQueryDB _serviceQueryDB;
        private const string PageName = "ContactUsAnswerCustomer";
        public ContactUsAnswerCustomerOrderController(IServiceQueryDB serviceQueryDB)
        {
            _serviceQueryDB = serviceQueryDB;
        }

        [HttpPost]
        [Route("ContactUsAnswerCustomerOrder/GetData")]
        [CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetAll_ContactUsAnswerCustomerOrder(int id)
        {
            string Query = "select * from ContactUsAnswerCustomer_Order where OrderId =" + id;
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query);
        }
        [HttpPost]
        [Route("ContactUsAnswerCustomerOrder/AddData")]
        [CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> Add_NewContactUsAnswerCustomerOrder(int ContactUsId, int AnswerCustomerId)
        {
            string Query = $"DELETE FROM ContactUsAnswerCustomer WHERE ContactUsId = {ContactUsId} AND AnswerCustomerId = {AnswerCustomerId}";
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query);
        }
        [HttpPost]
        [Route("ContactUsAnswerCustomerOrder/DeleteData")]
        [CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> Delete_ContactUsAnswerCustomerOrder(int ContactUsId, int AnswerCustomerId)
        {
            string Query = $"DELETE FROM ContactUsAnswerCustomer WHERE ContactUsId = {ContactUsId} AND AnswerCustomerId = {AnswerCustomerId}";
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query);
        }

    }
}
