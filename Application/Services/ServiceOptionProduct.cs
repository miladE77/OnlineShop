using Domain.Models;
using Domain.ServiseResult;
using DataLayer.Context;
using System.Data;
using Newtonsoft.Json;
using Microsoft.EntityFrameworkCore;

namespace Application.Services
{
    public class ServiceOptionProduct : IServiceOptionProduct
    {

        private readonly DBContext _db;
        private readonly FunctionImportant _mapper;
        private readonly IServiceCodeAccess _serviceCodeAccess;

        public ServiceOptionProduct(
            DBContext db,
            FunctionImportant mapper,
            IServiceCodeAccess serviceCodeAccess)
        {
            _db = db;
            _mapper = mapper;
            _serviceCodeAccess = serviceCodeAccess;
        }
        public async Task<ServiseResult<string>> UpdateOptionProduct(OptionProduct Data)
        {
            try
            {
                if (Data.OptionProductId == 0)
                {
                    _db.OptionProduct.Add(Data);
                }
                else
                {
                    var P_DB = await _db.OptionProduct.SingleOrDefaultAsync(p => p.OptionProductId == Data.OptionProductId);
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
        public async Task<ServiseResult<string>> GetAllOptionProduct(int pageNumber)
        {
            try
            {
                var OptionProducts = await _db.OptionProduct.Where(p => p.OptionProductId < (pageNumber * 10) || pageNumber == 0).ToListAsync();
                return ServiseResult<string>.Success(JsonConvert.SerializeObject(OptionProducts, Formatting.Indented));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> GetOptionProduct(int Id)
        {
            try
            {
                var OptionProduct = await _db.OptionProduct.Where(p => p.OptionProductId == Id).ToListAsync();
                return ServiseResult<string>.Success(JsonConvert.SerializeObject(OptionProduct, Formatting.Indented));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> DeleteOptionProduct(int Id)
        {
            try
            {
                var p = await _db.OptionProduct.SingleOrDefaultAsync(p => p.OptionProductId == Id);
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
