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
    public class RecommendationsController : Controller
    {
        private IServiceRecommendations _serviceRecommendations;
        private IServiceQueryDB _serviceQueryDB;
        private const string PageName = "Recommendations";
        public RecommendationsController(
            IServiceQueryDB serviceQueryDB,
            IServiceRecommendations serviceRecommendations
            )
        {
            _serviceQueryDB = serviceQueryDB;
            _serviceRecommendations = serviceRecommendations;
        }
        [CheckAccessView(PageName, "V")]
        public async Task<ActionResult> Recommendationss()
        {
            return View();
        }

        [HttpPost]
        [Route("Recommendationss/GetFilterData")]
        [CheckAccessData(PageName, "F")]
        public async Task<ServiseResult<string>> GetAllRecommendationssWithFilter(string charAccess, string data)
        {
            var Parametrs = data.Split(',');
            string Query = $"select * from RecommendationsView where @{Parametrs[0]}";
            var parameters = new[] {
                new SqlParameter($"@{Parametrs[0]}", SqlDbType.NVarChar, 200) { Value = Parametrs[1] }
            };
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query, parameters);
        }
        [HttpPost]
        [Route("Recommendationss/GetAllData")]
        [CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetAllRecommendationss(int pageNumber = 0)
        {
            return await _serviceRecommendations.GetAllRecommendations(pageNumber);
        }

        [HttpPost]
        [Route("Recommendationss/AddData")]
        [CheckAccessData(PageName, "A")]
        public async Task<ServiseResult<string>> Add(Recommendations RecommendationsNew)
        {
            if (RecommendationsNew.RecommendationsId != 0) return ServiseResult<string>.Failure("این داده قبلا ثبت شده است");
            return await _serviceRecommendations.UpdateRecommendations(RecommendationsNew);
        }

        [HttpPost]
        [Route("Recommendationss/UpdateData")]
        [CheckAccessData(PageName, "U")]
        public async Task<ServiseResult<string>> Update(Recommendations RecommendationsNew)
        {
            if (RecommendationsNew.RecommendationsId == 0) return ServiseResult<string>.Failure("این داده در دیتابیس وجود ندارد");
            return await _serviceRecommendations.UpdateRecommendations(RecommendationsNew);
        }

        [HttpPost]
        [Route("Recommendationss/DeleteData")]
        [CheckAccessData(PageName, "D")]
        public async Task<ServiseResult<string>> Delete(int id)
        {
            return await _serviceRecommendations.DeleteRecommendations(id);
        }

    }
}
