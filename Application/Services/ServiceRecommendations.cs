using Domain.Models;
using Domain.ServiseResult;
using DataLayer.Context;
using System.Data;
using Newtonsoft.Json;
using Microsoft.EntityFrameworkCore;

namespace Application.Services
{
    public class ServiceRecommendations : IServiceRecommendations
    {

        private readonly DBContext _db;
        private readonly FunctionImportant _mapper;
        private readonly IServiceCodeAccess _serviceCodeAccess;

        public ServiceRecommendations(
            DBContext db,
            FunctionImportant mapper,
            IServiceCodeAccess serviceCodeAccess)
        {
            _db = db;
            _mapper = mapper;
            _serviceCodeAccess = serviceCodeAccess;
        }

        public async Task<ServiseResult<string>> UpdateRecommendations(Recommendations Data)
        {
            try
            {
                int Id = 0;
                if (Data.RecommendationsId == 0)
                {
                    Data.DateTimeRecord = DateConverter.PersianToMiladi(Data.DateTimeRecordFa);
                    _db.Recommendations.Add(Data);
                    Id = _db.Recommendations.Max(p => p.RecommendationsId) + 1;
                }
                else
                {
                    var P_DB = await _db.Recommendations.SingleOrDefaultAsync(p => p.RecommendationsId == Data.RecommendationsId);
                    if (P_DB != null)
                    {
                        _mapper.Map(Data, P_DB, ["RecommendationsId", "PersonelId", "ReceiptId", "OrderId" , "DateTimeRecord"]);
                    }
                    Id = Data.RecommendationsId;
                }
                await _db.SaveChangesAsync();
                return ServiseResult<string>.Success(Id.ToString());
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> GetAllRecommendations(int pageNumber)
        {
            try
            {
                var Recommendationss = await _db.Recommendations.Include("OrderId").Include("ReceiptId").Where(p => p.RecommendationsId < (pageNumber * 10) || pageNumber == 0).ToListAsync();
                foreach (var item in Recommendationss)
                {
                    item.DateTimeRecordFa = DateConverter.MiladiToPersian(item.DateTimeRecord);
                }
                return ServiseResult<string>.Success(JsonConvert.SerializeObject(Recommendationss, Formatting.Indented));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> GetPersonelRecommendations(int Id)
        {
            try
            {
                var Recommendations = await _db.Recommendations.Include("OrderId").Include("ReceiptId").Where(p => p.PersonelId == Id).ToListAsync();
                foreach (var item in Recommendations)
                {
                    item.DateTimeRecordFa = DateConverter.MiladiToPersian(item.DateTimeRecord);
                }
                return ServiseResult<string>.Success(JsonConvert.SerializeObject(Recommendations, Formatting.Indented));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> GetRecommendations(int Id)
        {
            try
            {
                var Recommendation = await _db.Recommendations.Include("OrderId").Include("ReceiptId").Where(p => p.RecommendationsId == Id).ToListAsync();
                foreach (var item in Recommendation)
                {
                    item.DateTimeRecordFa = DateConverter.MiladiToPersian(item.DateTimeRecord);
                }
                return ServiseResult<string>.Success(JsonConvert.SerializeObject(Recommendation, Formatting.Indented));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> DeleteRecommendations(int Id)
        {
            try
            {
                var p = await _db.Recommendations.SingleOrDefaultAsync(p => p.RecommendationsId == Id);
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
