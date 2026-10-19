using Domain.Models;
using Domain.ServiseResult;
using DataLayer.Context;
using System.Data;
using Newtonsoft.Json;
using Microsoft.EntityFrameworkCore;

namespace Application.Services
{
    public class ServiceReceipt : IServiceReceipt
    {

        private readonly DBContext _db;
        private readonly FunctionImportant _mapper;
        private readonly IServiceCodeAccess _serviceCodeAccess;

        public ServiceReceipt(
            DBContext db,
            FunctionImportant mapper,
            IServiceCodeAccess serviceCodeAccess)
        {
            _db = db;
            _mapper = mapper;
            _serviceCodeAccess = serviceCodeAccess;
        }
        public async Task<ServiseResult<string>> UpdateReceipt(Receipt Data)
        {
            try
            {
                if (Data.ReceiptId == 0)
                {
                    Data.DateTimePeyment = DateConverter.PersianToMiladi(Data.DateTimePeymentFa);
                    _db.Receipt.Add(Data);
                }
                else
                {
                    var P_DB = await _db.Receipt.SingleOrDefaultAsync(p => p.ReceiptId == Data.ReceiptId);
                    if (P_DB != null)
                    {
                        _mapper.Map(Data, P_DB, ["DateTimePeyment"]);
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
        public async Task<ServiseResult<string>> GetAllReceipt(int pageNumber)
        {
            try
            {
                var Receipts = await _db.Receipt.Where(p => p.ReceiptId < (pageNumber * 10) || pageNumber == 0).ToListAsync();
                foreach (var item in Receipts)
                {
                    item.DateTimePeymentFa = DateConverter.MiladiToPersian(item.DateTimePeyment);
                }
                return ServiseResult<string>.Success(JsonConvert.SerializeObject(Receipts, Formatting.Indented));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> GetReceipt(int Id)
        {
            try
            {
                var Receipt = await _db.Receipt.Where(p => p.ReceiptId == Id).ToListAsync();
                foreach (var item in Receipt)
                {
                    item.DateTimePeymentFa = DateConverter.MiladiToPersian(item.DateTimePeyment);
                }
                return ServiseResult<string>.Success(JsonConvert.SerializeObject(Receipt, Formatting.Indented));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> DeleteReceipt(int Id)
        {
            try
            {
                var p = await _db.Receipt.SingleOrDefaultAsync(p => p.ReceiptId == Id);
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
