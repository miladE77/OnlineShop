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
    public class RecommendationsReceiptOrderController : Controller
    {
        private IServiceQueryDB _serviceQueryDB;
        private const string PageName = "RecommendationsReceipt";
        public RecommendationsReceiptOrderController(IServiceQueryDB serviceQueryDB)
        {
            _serviceQueryDB = serviceQueryDB;
        }

        [HttpPost]
        [Route("RecommendationsReceiptOrder/GetData")]
        [CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetAll_RecommendationsReceiptOrder(int id)
        {
            string Query = "select * from RecommendationsReceipt_Order where OrderId =" + id;
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query);
        }
        [HttpPost]
        [Route("RecommendationsReceiptOrder/AddData")]
        [CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> Add_NewRecommendationsReceiptOrder(int RecommendationsId, int ReceiptId)
        {
            string Query = $"DELETE FROM RecommendationsReceipt WHERE RecommendationsId = {RecommendationsId} AND ReceiptId = {ReceiptId}";
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query);
        }
        [HttpPost]
        [Route("RecommendationsReceiptOrder/DeleteData")]
        [CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> Delete_RecommendationsReceiptOrder(int RecommendationsId, int ReceiptId)
        {
            string Query = $"DELETE FROM RecommendationsReceipt WHERE RecommendationsId = {RecommendationsId} AND ReceiptId = {ReceiptId}";
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query);
        }

    }
}
