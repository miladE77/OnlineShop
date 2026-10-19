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
    public class RecommendationsOrderOrderController : Controller
    {
        private IServiceQueryDB _serviceQueryDB;
        private const string PageName = "RecommendationsOrder";
        public RecommendationsOrderOrderController(IServiceQueryDB serviceQueryDB)
        {
            _serviceQueryDB = serviceQueryDB;
        }

        [HttpPost]
        [Route("RecommendationsOrderOrder/GetData")]
        [CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetAll_RecommendationsOrderOrder(int id)
        {
            string Query = "select * from RecommendationsOrder_Order where OrderId =" + id;
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query);
        }
        [HttpPost]
        [Route("RecommendationsOrderOrder/AddData")]
        [CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> Add_NewRecommendationsOrderOrder(int RecommendationsId, int OrderId)
        {
            string Query = $"DELETE FROM RecommendationsOrder WHERE RecommendationsId = {RecommendationsId} AND OrderId = {OrderId}";
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query);
        }
        [HttpPost]
        [Route("RecommendationsOrderOrder/DeleteData")]
        [CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> Delete_RecommendationsOrderOrder(int RecommendationsId, int OrderId)
        {
            string Query = $"DELETE FROM RecommendationsOrder WHERE RecommendationsId = {RecommendationsId} AND OrderId = {OrderId}";
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query);
        }

    }
}
