using Domain.Models;
using Domain.ServiseResult;
using DataLayer.Context;
using System.Data;
using Newtonsoft.Json;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations.Schema;

namespace Application.Services
{
    public class ServiceStore : IServiceStore
    {

        private readonly DBContext _db;
        private readonly FunctionImportant _mapper;
        private readonly IServiceCodeAccess _serviceCodeAccess;

        public ServiceStore(
            DBContext db,
            FunctionImportant mapper,
            IServiceCodeAccess serviceCodeAccess)
        {
            _db = db;
            _mapper = mapper;
            _serviceCodeAccess = serviceCodeAccess;
        }
        public async Task<ServiseResult<string>> UpdateStore(Store Data)
        {
            try
            {
                if (Data.StoreId == 0)
                {
                    Data.StoreRecord = DateConverter.PersianToMiladi(Data.StoreRecordFa);
                    var ResultCode = await _serviceCodeAccess.CreateCodeAccess(1);
                    if (ResultCode.IsSuccess)
                    {
                        Data.CodeStore = ResultCode.Data;
                        _db.Store.Add(Data);
                    }
                    else
                    {
                        return ServiseResult<string>.Failure("خطا در ثبت مجدد امتحان کنید");
                    }
                    _db.Store.Add(Data);
                }
                else
                {
                    var P_DB = await _db.Store.SingleOrDefaultAsync(p => p.StoreId == Data.StoreId);
                    if (P_DB != null)
                    {
                        _mapper.Map(Data, P_DB, ["StoreId", "CodeStore", "StoreRecord"]);
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
        public async Task<ServiseResult<string>> GetAllStore(int pageNumber)
        {
            try
            {
                var Stores = await _db.Store.Where(p => p.StoreId < (pageNumber * 10) || pageNumber == 0).ToListAsync();
                foreach (var item in Stores)
                {
                    item.StoreRecordFa = DateConverter.MiladiToPersian(item.StoreRecord);
                }
                return ServiseResult<string>.Success(JsonConvert.SerializeObject(Stores, Formatting.Indented));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> GetStore(int Id)
        {
            try
            {
                var Store = await _db.Store.Where(p => p.StoreId == Id).ToListAsync();
                foreach (var item in Store)
                {
                    item.StoreRecordFa = DateConverter.MiladiToPersian(item.StoreRecord);
                }
                return ServiseResult<string>.Success(JsonConvert.SerializeObject(Store, Formatting.Indented));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> DeleteStore(int Id)
        {
            try
            {
                var p = await _db.Store.SingleOrDefaultAsync(p => p.StoreId == Id);
                _db.Remove(p);
                await _db.SaveChangesAsync();
                return ServiseResult<string>.Success("DeleteData");
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> GetStoreIds(int personelId)
        {
            try
            {
                var stores = await _db.Store.Include("ContactId")
                    .Where(s => s.PersonelId == personelId && s.Status == true)
                    .OrderByDescending(s => s.StoreId)
                    .ToListAsync();

                var storesIds = stores.Select(s => s.StoreId);
                return ServiseResult<string>.Success(
                    JsonConvert.SerializeObject(storesIds, Formatting.Indented));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> GetStoreById(int personelId)
        {
            try
            {
                var stores = await _db.Store.Include("ContactId")
                    .Where(s => s.PersonelId == personelId && s.Status == true)
                    .OrderByDescending(s => s.StoreId)
                    .ToListAsync();

                // ─── تبدیل تاریخ شمسی ───
                foreach (var store in stores)
                    store.StoreRecordFa = DateConverter.MiladiToPersian(store.StoreRecord);

                return ServiseResult<string>.Success(
                    JsonConvert.SerializeObject(stores, Formatting.Indented));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> HasStore(int personelId)
        {
            try
            {
                var count = await _db.Store
                    .CountAsync(s => s.PersonelId == personelId && s.Status == true);
                return ServiseResult<string>.Success(
                    JsonConvert.SerializeObject(new { HasStore = count > 0, Count = count }));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
    }
}
