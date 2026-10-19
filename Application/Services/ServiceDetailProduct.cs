using Domain.Models;
using Domain.ServiseResult;
using DataLayer.Context;
using System.Data;
using Newtonsoft.Json;
using Microsoft.EntityFrameworkCore;

namespace Application.Services
{
    public class ServiceDetailProduct : IServiceDetailProduct
    {

        private readonly DBContext _db;
        private readonly FunctionImportant _mapper;
        private readonly IServiceCodeAccess _serviceCodeAccess;

        public ServiceDetailProduct(
            DBContext db,
            FunctionImportant mapper,
            IServiceCodeAccess serviceCodeAccess)
        {
            _db = db;
            _mapper = mapper;
            _serviceCodeAccess = serviceCodeAccess;
        }
        public async Task<ServiseResult<string>> UpdateDetailProduct(DetailProduct Data)
        {
            try
            {
                if (Data.DetailProductId == 0)
                {
                    _db.DetailProduct.Add(Data);
                }
                else
                {
                    var P_DB = await _db.DetailProduct.SingleOrDefaultAsync(p => p.DetailProductId == Data.DetailProductId);
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
        public async Task<ServiseResult<string>> GetAllDetailProduct(int pageNumber)
        {
            try
            {
                var DetailProducts = await _db.DetailProduct.Where(p => p.DetailProductId < (pageNumber * 10) || pageNumber == 0).ToListAsync();
                return ServiseResult<string>.Success(JsonConvert.SerializeObject(DetailProducts, Formatting.Indented));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> GetDetailProduct(int Id)
        {
            try
            {
                var DetailProduct = await _db.DetailProduct.Where(p => p.DetailProductId == Id).ToListAsync();
                return ServiseResult<string>.Success(JsonConvert.SerializeObject(DetailProduct, Formatting.Indented));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> DeleteDetailProduct(int Id)
        {
            try
            {
                var p = await _db.DetailProduct.SingleOrDefaultAsync(p => p.DetailProductId == Id);
                _db.Remove(p);
                await _db.SaveChangesAsync();
                return ServiseResult<string>.Success("DeleteData");
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> DeleteDetailByProduct(int Id)
        {
            try
            {
                var ps = await _db.DetailProduct.Where(p => p.ProductId == Id).ToListAsync();
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
