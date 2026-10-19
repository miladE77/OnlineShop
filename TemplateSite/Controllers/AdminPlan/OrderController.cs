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
    public class OrderController : Controller
    {
        private IServiceOrder _serviceOrder;
        private IServiceQueryDB _serviceQueryDB;
        private const string PageName = "Order";
        public OrderController(
            IServiceQueryDB serviceQueryDB,
            IServiceOrder serviceOrder
            )
        {
            _serviceQueryDB = serviceQueryDB;
            _serviceOrder = serviceOrder;
        }
        [CheckAccessView(PageName, "V")]
        public async Task<ActionResult> Orders()
        {
            return View();
        }

        [HttpPost]
        [Route("Orders/GetFilterData")]
        [CheckAccessData(PageName, "F")]
        public async Task<ServiseResult<string>> GetAllOrdersWithFilter(string charAccess, string data)
        {
            var Parametrs = data.Split(',');
            string Query = $"select * from OrderView where @{Parametrs[0]}";
            var parameters = new[] {
                new SqlParameter($"@{Parametrs[0]}", SqlDbType.NVarChar, 200) { Value = Parametrs[1] }
            };
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query, parameters);
        }
        [HttpPost]
        [Route("Orders/GetAllData")]
        [CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetAllOrders(int pageNumber = 0)
        {
            string Query = $"select * from {PageName}View";
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query);
        }

        [HttpPost]
        [Route("Orders/AddData")]
        [CheckAccessData(PageName, "A")]
        public async Task<ServiseResult<string>> Add(Order OrderNew)
        {
            if (OrderNew.OrderId != 0) return ServiseResult<string>.Failure("این داده قبلا ثبت شده است");
            return await _serviceOrder.UpdateOrder(OrderNew);
        }

        [HttpPost]
        [Route("Orders/UpdateData")]
        [CheckAccessData(PageName, "U")]
        public async Task<ServiseResult<string>> Update(Order OrderNew)
        {
            if (OrderNew.OrderId == 0) return ServiseResult<string>.Failure("این داده در دیتابیس وجود ندارد");
            return await _serviceOrder.UpdateOrder(OrderNew);
        }

        [HttpPost]
        [Route("Orders/DeleteData")]
        [CheckAccessData(PageName, "D")]
        public async Task<ServiseResult<string>> Delete(int id)
        {
            return await _serviceOrder.DeleteOrder(id);
        }

    }
}
