using Domain.Models;
using Domain.ServiseResult;
using DataLayer.Context;
using System.Data;
using Newtonsoft.Json;
using Microsoft.EntityFrameworkCore;

namespace Application.Services
{
    public class ServiceOrder : IServiceOrder
    {

        private readonly DBContext _db;
        private readonly FunctionImportant _mapper;
        private readonly IServiceCodeAccess _serviceCodeAccess;

        public ServiceOrder(
            DBContext db,
            FunctionImportant mapper,
            IServiceCodeAccess serviceCodeAccess)
        {
            _db = db;
            _mapper = mapper;
            _serviceCodeAccess = serviceCodeAccess;
        }
        public async Task<ServiseResult<string>> UpdateOrder(Order Data)
        {
            try
            {
                if (Data.OrderId == 0)
                {
                    _db.Order.Add(Data);
                }
                else
                {
                    var P_DB = await _db.Order.SingleOrDefaultAsync(p => p.OrderId == Data.OrderId);
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
        public async Task<ServiseResult<string>> GetAllOrder(int pageNumber)
        {
            try
            {
                var Orders = await _db.Order.Where(p => p.OrderId < (pageNumber * 10) || pageNumber == 0).ToListAsync();
                return ServiseResult<string>.Success(JsonConvert.SerializeObject(Orders, Formatting.Indented));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> GetOrder(int Id)
        {
            try
            {
                var Order = await _db.Order.Where(p => p.OrderId == Id).ToListAsync();
                return ServiseResult<string>.Success(JsonConvert.SerializeObject(Order, Formatting.Indented));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> DeleteOrder(int Id)
        {
            try
            {
                var p = await _db.Order.SingleOrDefaultAsync(p => p.OrderId == Id);
                _db.Remove(p);
                await _db.SaveChangesAsync();
                return ServiseResult<string>.Success("DeleteData");
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> DeleteOrderByRecommendations(int Id)
        {
            try
            {
                var ps = await _db.Order.Where(p => p.RecommendationsId == Id).ToListAsync();
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
