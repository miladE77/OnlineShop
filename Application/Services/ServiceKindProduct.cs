using Domain.Models;
using Domain.ServiseResult;
using DataLayer.Context;
using System.Data;
using Newtonsoft.Json;
using Microsoft.EntityFrameworkCore;

namespace Application.Services
{
    public class ServiceKindProduct : IServiceKindProduct
    {

        private readonly DBContext _db;
        private readonly FunctionImportant _mapper;
        private readonly IServiceCodeAccess _serviceCodeAccess;

        public ServiceKindProduct(
            DBContext db,
            FunctionImportant mapper,
            IServiceCodeAccess serviceCodeAccess)
        {
            _db = db;
            _mapper = mapper;
            _serviceCodeAccess = serviceCodeAccess;
        }
        public async Task<ServiseResult<string>> UpdateKindProduct(KindProduct Data)
        {
            try
            {
                if (Data.KindProductId == 0)
                {
                    _db.KindProduct.Add(Data);
                }
                else
                {
                    var P_DB = await _db.KindProduct.SingleOrDefaultAsync(p => p.KindProductId == Data.KindProductId);
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
        public async Task<ServiseResult<string>> GetAllKindProduct(int pageNumber)
        {
            try
            {
                var KindProducts = await _db.KindProduct.Where(p => p.KindProductId < (pageNumber * 10) || pageNumber == 0).ToListAsync();
                return ServiseResult<string>.Success(JsonConvert.SerializeObject(KindProducts, Formatting.Indented));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> GetKindProduct(int Id)
        {
            try
            {
                var KindProduct = await _db.KindProduct.Where(p => p.KindProductId == Id).ToListAsync();
                return ServiseResult<string>.Success(JsonConvert.SerializeObject(KindProduct, Formatting.Indented));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> DeleteKindProduct(int Id)
        {
            try
            {
                var p = await _db.KindProduct.SingleOrDefaultAsync(p => p.KindProductId == Id);
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
