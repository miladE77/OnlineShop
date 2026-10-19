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
    public class ReceiptController : Controller
    {
        private IServiceReceipt _serviceReceipt;
        private IServiceQueryDB _serviceQueryDB;
        private const string PageName = "Receipt";
        public ReceiptController(
            IServiceQueryDB serviceQueryDB,
            IServiceReceipt serviceReceipt
            )
        {
            _serviceQueryDB = serviceQueryDB;
            _serviceReceipt = serviceReceipt;
        }
        [CheckAccessView(PageName, "V")]
        public async Task<ActionResult> Receipts()
        {
            return View();
        }

        [HttpPost]
        [Route("Receipts/GetFilterData")]
        [CheckAccessData(PageName, "F")]
        public async Task<ServiseResult<string>> GetAllReceiptsWithFilter(string charAccess, string data)
        {
            var Parametrs = data.Split(',');
            string Query = $"select * from ReceiptView where @{Parametrs[0]}";
            var parameters = new[] {
                new SqlParameter($"@{Parametrs[0]}", SqlDbType.NVarChar, 200) { Value = Parametrs[1] }
            };
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query, parameters);
        }
        [HttpPost]
        [Route("Receipts/GetAllData")]
        [CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetAllReceipts(int pageNumber = 0)
        {
            string Query = $"select * from {PageName}View";
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query);
        }

        [HttpPost]
        [Route("Receipts/AddData")]
        [CheckAccessData(PageName, "A")]
        public async Task<ServiseResult<string>> Add(Receipt ReceiptNew)
        {
            if (ReceiptNew.ReceiptId != 0) return ServiseResult<string>.Failure("این داده قبلا ثبت شده است");
            return await _serviceReceipt.UpdateReceipt(ReceiptNew);
        }

        [HttpPost]
        [Route("Receipts/UpdateData")]
        [CheckAccessData(PageName, "U")]
        public async Task<ServiseResult<string>> Update(Receipt ReceiptNew)
        {
            if (ReceiptNew.ReceiptId == 0) return ServiseResult<string>.Failure("این داده در دیتابیس وجود ندارد");
            return await _serviceReceipt.UpdateReceipt(ReceiptNew);
        }

        [HttpPost]
        [Route("Receipts/DeleteData")]
        [CheckAccessData(PageName, "D")]
        public async Task<ServiseResult<string>> Delete(int id)
        {
            return await _serviceReceipt.DeleteReceipt(id);
        }

    }
}
