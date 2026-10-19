using Domain.Models;
using Domain.ServiseResult;
using DataLayer.Context;
using System.Data;
using Newtonsoft.Json;
using Microsoft.EntityFrameworkCore;

namespace Application.Services
{
    public class ServiceEmailNews : IServiceEmailNews
    {

        private readonly DBContext _db;
        private readonly FunctionImportant _mapper;
        private readonly IServiceCodeAccess _serviceCodeAccess;

        public ServiceEmailNews(
            DBContext db,
            FunctionImportant mapper,
            IServiceCodeAccess serviceCodeAccess)
        {
            _db = db;
            _mapper = mapper;
            _serviceCodeAccess = serviceCodeAccess;
        }
        public async Task<ServiseResult<string>> UpdateEmailNews(EmailNews Data)
        {
            try
            {
                if (Data.EmailNewsId == 0)
                {
                    _db.EmailNews.Add(Data);
                }
                else
                {
                    var P_DB = await _db.EmailNews.SingleOrDefaultAsync(p => p.EmailNewsId == Data.EmailNewsId);
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
        public async Task<ServiseResult<string>> GetAllEmailNews(int pageNumber)
        {
            try
            {
                var EmailNewss = await _db.EmailNews.Where(p => p.EmailNewsId < (pageNumber * 10) || pageNumber == 0).ToListAsync();
                return ServiseResult<string>.Success(JsonConvert.SerializeObject(EmailNewss, Formatting.Indented));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> GetEmailNews(int Id)
        {
            try
            {
                var EmailNews = await _db.EmailNews.Where(p => p.EmailNewsId == Id).ToListAsync();
                return ServiseResult<string>.Success(JsonConvert.SerializeObject(EmailNews, Formatting.Indented));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> DeleteEmailNews(int Id)
        {
            try
            {
                var p = await _db.EmailNews.SingleOrDefaultAsync(p => p.EmailNewsId == Id);
                _db.Remove(p);
                await _db.SaveChangesAsync();
                return ServiseResult<string>.Success("DeleteData");
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }        
        public async Task<ServiseResult<string>> DeleteEmailNewsByStore(int Id)
        {
            try
            {
                var ps = await _db.EmailNews.Where(p => p.StoreId == Id).ToListAsync();
                _db.Remove(ps);
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
