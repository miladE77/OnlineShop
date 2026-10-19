//using Application.Services;
//using Domain.Models;
//using Domain.ServiseResult;
//using Microsoft.AspNetCore.Http;
//using Microsoft.AspNetCore.Identity;
//using Microsoft.AspNetCore.Mvc;
//using Microsoft.AspNetCore.Mvc.RazorPages;
//using Microsoft.IdentityModel.Tokens;
//using Newtonsoft.Json;
//using Site.Filters;
//using System.Data;
//using TemplateSite.Filters;


//namespace Site.Controllers
//{
//    public class ReletiveTempOrderController : Controller
//    {
//        private IServiceQueryDB _serviceQueryDB;
//        private const string PageName = "ReletiveTemp";
//        public ReletiveTempOrderController(IServiceQueryDB serviceQueryDB)
//        {
//            _serviceQueryDB = serviceQueryDB;
//        }

//        [HttpPost]
//        [Route("ReletiveTempOrder/GetData")]
//        [CheckAccessData(PageName, "V")]
//        public async Task<ServiseResult<string>> GetAll_ReletiveTempOrder(int id)
//        {
//            string Query = "select * from ReletiveTemp_Order where OrderId =" + id;
//            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query);
//        }
//        [HttpPost]
//        [Route("ReletiveTempOrder/AddData")]
//        [CheckAccessData(PageName, "V")]
//        public async Task<ServiseResult<string>> Add_NewReletiveTempOrder(int Prop1Id, int Prop2Id)
//        {
//            string Query = $"DELETE FROM ReletiveTemp WHERE Prop1Id = {Prop1Id} AND Prop2Id = {Prop2Id}";
//            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query);
//        }
//        [HttpPost]
//        [Route("ReletiveTempOrder/DeleteData")]
//        [CheckAccessData(PageName, "V")]
//        public async Task<ServiseResult<string>> Delete_ReletiveTempOrder(int Prop1Id, int Prop2Id)
//        {
//            string Query = $"DELETE FROM ReletiveTemp WHERE Prop1Id = {Prop1Id} AND Prop2Id = {Prop2Id}";
//            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query);
//        }

//    }
//}
