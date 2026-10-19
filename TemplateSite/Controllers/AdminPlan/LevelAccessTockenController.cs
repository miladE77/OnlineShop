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
    public class LevelAccessTockenController : Controller
    {
        private readonly IServiceQueryDB _serviceQueryDB;
        private const string PageName = "LevelAccessTocken";
        public LevelAccessTockenController(IServiceQueryDB serviceQueryDB)
        {
            _serviceQueryDB = serviceQueryDB;
        }

        [HttpPost]
        [Route("LevelAccessTocken/GetData")]
        [CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> GetAll_LevelAccessTocken(int id)
        {
            string Query = "select * from LevelAccessTocken where OrderId =" + id;
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query);
        }
        [HttpPost]
        [Route("LevelAccessTocken/AddData")]
        [CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> Add_NewLevelAccessTocken(int LevelAccessId, int TockenId)
        {
            string Query = $"DELETE FROM LevelAccessTocken WHERE LevelAccessId = {LevelAccessId} AND TockenId = {TockenId}";
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query);
        }
        [HttpPost]
        [Route("LevelAccessTocken/DeleteData")]
        [CheckAccessData(PageName, "V")]
        public async Task<ServiseResult<string>> Delete_LevelAccessTocken(int LevelAccessId, int TockenId)
        {
            string Query = $"DELETE FROM LevelAccessTocken WHERE LevelAccessId = {LevelAccessId} AND TockenId = {TockenId}";
            return await _serviceQueryDB.GetsJsonDataViewByQuery(Query);
        }

    }
}
