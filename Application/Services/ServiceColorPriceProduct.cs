using Domain.Models;
using Domain.ServiseResult;
using DataLayer.Context;
using System.Data;
using Newtonsoft.Json;
using Microsoft.EntityFrameworkCore;

namespace Application.Services
{
    public class ServiceColorPriceProduct : IServiceColorPriceProduct
    {

        private readonly DBContext _db;
        private readonly FunctionImportant _mapper;
        private readonly IServiceCodeAccess _serviceCodeAccess;

        public ServiceColorPriceProduct(
            DBContext db,
            FunctionImportant mapper,
            IServiceCodeAccess serviceCodeAccess)
        {
            _db = db;
            _mapper = mapper;
            _serviceCodeAccess = serviceCodeAccess;
        }
        public async Task<ServiseResult<string>> UpdateColorPriceProduct(ColorPriceProduct Data)
        {
            try
            {
                if (Data.ColorPriceProductId == 0)
                {
                    _db.ColorPriceProduct.Add(Data);
                }
                else
                {
                    var P_DB = await _db.ColorPriceProduct.SingleOrDefaultAsync(p => p.ColorPriceProductId == Data.ColorPriceProductId);
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
        public async Task<ServiseResult<string>> GetAllColorPriceProduct(int pageNumber)
        {
            try
            {
                var ColorPriceProducts = await _db.ColorPriceProduct.Where(p => p.ColorPriceProductId < (pageNumber * 10) || pageNumber == 0).ToListAsync();
                return ServiseResult<string>.Success(JsonConvert.SerializeObject(ColorPriceProducts, Formatting.Indented));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> GetColorPriceProduct(int Id)
        {
            try
            {
                var ColorPriceProduct = await _db.ColorPriceProduct.Where(p => p.ColorPriceProductId == Id).ToListAsync();
                return ServiseResult<string>.Success(JsonConvert.SerializeObject(ColorPriceProduct, Formatting.Indented));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> DeleteColorPriceProduct(int Id)
        {
            try
            {
                var p = await _db.ColorPriceProduct.SingleOrDefaultAsync(p => p.ColorPriceProductId == Id);
                _db.Remove(p);
                await _db.SaveChangesAsync();
                return ServiseResult<string>.Success("DeleteData");
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> DeleteColorPriceByProductId(int Id)
        {
            try
            {
                var ps = await _db.ColorPriceProduct.Where(s => s.ProductId == Id).ToListAsync();
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
