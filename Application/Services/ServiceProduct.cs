using Domain.Models;
using Domain.ServiseResult;
using DataLayer.Context;
using System.Data;
using Newtonsoft.Json;
using Microsoft.EntityFrameworkCore;

namespace Application.Services
{
    public class ServiceProduct : IServiceProduct
    {

        private readonly DBContext _db;
        private readonly FunctionImportant _mapper;
        private readonly IServiceCodeAccess _serviceCodeAccess;

        public ServiceProduct(
            DBContext db,
            FunctionImportant mapper,
            IServiceCodeAccess serviceCodeAccess)
        {
            _db = db;
            _mapper = mapper;
            _serviceCodeAccess = serviceCodeAccess;
        }
        public async Task<ServiseResult<string>> UpdateProduct(Product Data)
        {
            try
            {
                if (Data.ProductId == 0)
                {
                    var ResultCode = await _serviceCodeAccess.CreateCodeAccess(2);
                    if (ResultCode.IsSuccess)
                    {
                        Data.CodeInternalProducts = ResultCode.Data;
                        _db.Product.Add(Data);
                    }
                    else
                    {
                        return ServiseResult<string>.Failure("خطا در ثبت دوباره امتحان کنید");
                    }
                }
                else
                {
                    var P_DB = await _db.Product.SingleOrDefaultAsync(p => p.ProductId == Data.ProductId);
                    if (P_DB != null)
                    {
                        _mapper.Map(Data, P_DB, ["CodeInternalProducts"]);
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
        public async Task<ServiseResult<string>> GetAllProduct(int pageNumber)
        {
            try
            {
                var Products = await _db.Product.Include("Files").Include("Details").Include("Colors").Where(p => p.ProductId < (pageNumber * 10) || pageNumber == 0).ToListAsync();
                return ServiseResult<string>.Success(JsonConvert.SerializeObject(Products, Formatting.Indented));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> GetAllProduct(List<int> ids)
        {
            try
            {
                var Products = await _db.Product.Include("Files").Include("Details").Include("Colors").Where(p => ids.Contains(p.ProductId)).ToListAsync();
                return ServiseResult<string>.Success(JsonConvert.SerializeObject(Products, Formatting.Indented));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> GetProduct(int Id)
        {
            try
            {
                var Product = await _db.Product.Include("Files").Include("Details").Include("Colors").Where(p => p.ProductId == Id).ToListAsync();
                return ServiseResult<string>.Success(JsonConvert.SerializeObject(Product, Formatting.Indented));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> DeleteProductByStore(int Id)
        {
            try
            {
                var ps = await _db.Product.Where(p => p.StoreId == Id).ToListAsync();
                _db.Remove(ps);
                await _db.SaveChangesAsync();
                return ServiseResult<string>.Success("DeleteData");
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> DeleteProduct(int Id)
        {
            try
            {
                var p = await _db.Product.SingleOrDefaultAsync(p => p.ProductId == Id);
                _db.Remove(p);
                await _db.SaveChangesAsync();
                return ServiseResult<string>.Success("DeleteData");
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> GetByStore(int storeId)
        {
            try
            {
                var products = await _db.Product
                    .Include(p => p.Files)
                    .Include(p => p.Details)
                    .Include(p => p.Colors)
                    .Where(p => p.StoreId == storeId)
                    .OrderByDescending(p => p.ProductId)
                    .ToListAsync();

                return ServiseResult<string>.Success(
                    JsonConvert.SerializeObject(products, Formatting.Indented));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> GetByStores(List<int> storeIds)
        {
            try
            {
                if (storeIds == null || storeIds.Count == 0)
                    return ServiseResult<string>.Success("[]");

                var products = await _db.Product
                    .Include(p => p.Files)
                    .Include(p => p.Details)
                    .Include(p => p.Colors)
                    .Where(p => storeIds.Contains(p.StoreId))
                    .OrderByDescending(p => p.ProductId)
                    .ToListAsync();

                return ServiseResult<string>.Success(
                    JsonConvert.SerializeObject(products, Formatting.Indented));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }

    }
}
