using Domain.Models;
using Domain.ServiseResult;
using DataLayer.Context;
using System.Data;
using Newtonsoft.Json;
using Microsoft.EntityFrameworkCore;
using Domain.ViewModels;

namespace Application.Services
{
    public class ServiceFileProduct : IServiceFileProduct
    {

        private readonly DBContext _db;
        private readonly FunctionImportant _mapper;
        private readonly IServiceCodeAccess _serviceCodeAccess;

        public ServiceFileProduct(
            DBContext db,
            FunctionImportant mapper,
            IServiceCodeAccess serviceCodeAccess)
        {
            _db = db;
            _mapper = mapper;
            _serviceCodeAccess = serviceCodeAccess;
        }
        public async Task<ServiseResult<string>> UpdateFileProduct(FileProductModel Data)
        {
            try
            {
                if (Data.FileProductId == 0)
                {
                    FileProduct fileProduct = new FileProduct();
                    _mapper.Map(Data, fileProduct);
                    bool search = true;
                    while (search)
                    {
                        Random random = new Random();
                        int maxRange = _db.FileProduct.Count() + 1000;
                        int rangeRandom = random.Next(maxRange);
                        var s = _db.FileProduct.Where(s => s.CodeFileProduct == rangeRandom.ToString()).CountAsync();
                        if (s.Result == 0)
                        {
                            fileProduct.CodeFileProduct = rangeRandom.ToString() + "." + Data.FileProductCaption.Split(".")[1];
                            search = false;
                        }
                    }
                    _db.FileProduct.Add(fileProduct);
                    await _db.SaveChangesAsync();
                    return ServiseResult<string>.Success(fileProduct.CodeFileProduct);
                }
                else
                {
                    var P_DB = await _db.FileProduct.SingleOrDefaultAsync(p => p.FileProductId == Data.FileProductId);
                    if (P_DB != null)
                    {
                        _mapper.Map(Data, P_DB , ["CodeFileProduct"]);
                    }
                }
                await _db.SaveChangesAsync();
                return ServiseResult<string>.Success("0");
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> GetAllFileProduct(int pageNumber)
        {
            try
            {
                var FileProducts = await _db.FileProduct.Where(p => p.FileProductId < (pageNumber * 10) || pageNumber == 0).ToListAsync();
                return ServiseResult<string>.Success(JsonConvert.SerializeObject(FileProducts, Formatting.Indented));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> GetFileProduct(int Id)
        {
            try
            {
                var FileProduct = await _db.FileProduct.Where(p => p.FileProductId == Id).ToListAsync();
                return ServiseResult<string>.Success(JsonConvert.SerializeObject(FileProduct, Formatting.Indented));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> DeleteFileProduct(int Id)
        {
            try
            {
                var p = await _db.FileProduct.SingleOrDefaultAsync(p => p.FileProductId == Id);
                _db.Remove(p);
                await _db.SaveChangesAsync();
                return ServiseResult<string>.Success("DeleteData");
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> DeleteFileByProduct(int Id)
        {
            try
            {
                var ps = await _db.FileProduct.Where(p => p.ProductId == Id).ToListAsync();
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
