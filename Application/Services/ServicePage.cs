using Domain.Models;
using Domain.ServiseResult;
using DataLayer.Context;
using System.Data;
using Newtonsoft.Json;
using Microsoft.EntityFrameworkCore;

namespace Application.Services
{
    public class ServicePage : IServicePage
    {

        private readonly DBContext _db;
        private readonly FunctionImportant _mapper;
        private readonly IServiceCodeAccess _serviceCodeAccess;

        public ServicePage(
            DBContext db,
            FunctionImportant mapper,
            IServiceCodeAccess serviceCodeAccess)
        {
            _db = db;
            _mapper = mapper;
            _serviceCodeAccess = serviceCodeAccess;
        }
        public async Task<ServiseResult<string>> UpdatePage(Page Data)
        {
            try
            {
                if (Data.PageId == 0)
                {
                    _db.Page.Add(Data);
                }
                else
                {
                    var P_DB = await _db.Page.SingleOrDefaultAsync(p => p.PageId == Data.PageId);
                    if (P_DB != null)
                    {
                        _mapper.Map(Data, P_DB);
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
        public async Task<ServiseResult<string>> GetAllPage(int pageNumber)
        {
            try
            {
                var Pages = await _db.Page.Where(p => p.PageId < (pageNumber * 10) || pageNumber == 0).ToListAsync();
                return ServiseResult<string>.Success(JsonConvert.SerializeObject(Pages, Formatting.Indented));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> GetPage(int Id)
        {
            try
            {
                var Page = await _db.Page.Where(p => p.PageId == Id).ToListAsync();
                return ServiseResult<string>.Success(JsonConvert.SerializeObject(Page, Formatting.Indented));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> DeletePage(int Id)
        {
            try
            {
                var p = await _db.Page.SingleOrDefaultAsync(p => p.PageId == Id);
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
