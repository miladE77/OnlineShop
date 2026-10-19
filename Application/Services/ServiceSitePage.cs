using Domain.Models;
using Domain.ServiseResult;
using DataLayer.Context;
using System.Data;
using Newtonsoft.Json;
using Microsoft.EntityFrameworkCore;
using Application.IServices;

namespace Application.Services
{
    public class ServiceSitePage : IServiceSitePage
    {

        private readonly DBContext _db;
        private readonly FunctionImportant _mapper;
        private readonly IServiceCodeAccess _serviceCodeAccess;

        public ServiceSitePage(
            DBContext db,
            FunctionImportant mapper,
            IServiceCodeAccess serviceCodeAccess)
        {
            _db = db;
            _mapper = mapper;
            _serviceCodeAccess = serviceCodeAccess;
        }
        public async Task<ServiseResult<string>> UpdateSitePage(SitePage Data)
        {
            try
            {
                if (Data.SitePageId == 0)
                {
                    var ResultCode = await _serviceCodeAccess.CreateCodeAccess(3);
                    if (ResultCode.IsSuccess)
                    {
                        Data.CodePage = ResultCode.Data;
                        _db.SitePage.Add(Data);
                    }
                    else
                    {
                        return ServiseResult<string>.Failure("خطا در ثبت دوباره امتحان کنید");
                    }
                }
                else
                {
                    var P_DB = await _db.SitePage.SingleOrDefaultAsync(p => p.SitePageId == Data.SitePageId);
                    if (P_DB != null)
                    {
                        _mapper.Map(Data, P_DB, ["CodePage"]);
                    }
                }
                await _db.SaveChangesAsync();
                return ServiseResult<string>.Success("SaveData");
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> GetAllSitePage(int pageNumber)
        {
            try
            {
                var SitePages = await _db.SitePage.Where(p => p.SitePageId < (pageNumber * 10) || pageNumber == 0).ToListAsync();
                return ServiseResult<string>.Success(JsonConvert.SerializeObject(SitePages, Formatting.Indented));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> GetSitePage(int Id)
        {
            try
            {
                var SitePage = await _db.SitePage.Where(p => p.SitePageId == Id).ToListAsync();
                return ServiseResult<string>.Success(JsonConvert.SerializeObject(SitePage, Formatting.Indented));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> DeleteSitePage(int Id)
        {
            try
            {
                var p = await _db.SitePage.SingleOrDefaultAsync(p => p.SitePageId == Id);
                _db.Remove(p);
                await _db.SaveChangesAsync();
                return ServiseResult<string>.Success("DeleteData");
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
    }
}
