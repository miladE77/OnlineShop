using Domain.Models;
using Domain.ServiseResult;
using DataLayer.Context;
using System.Data;
using Newtonsoft.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Internal;


namespace Application.Services
{
    public class ServiceAnswerCustomer : IServiceAnswerCustomer
    {

        private readonly DBContext _db;
        private readonly FunctionImportant _mapper;
        private readonly IServiceCodeAccess _serviceCodeAccess;

        public ServiceAnswerCustomer(
            DBContext db,
            FunctionImportant mapper,
            IServiceCodeAccess serviceCodeAccess)
        {
            _db = db;
            _mapper = mapper;
            _serviceCodeAccess = serviceCodeAccess;
        }
        public async Task<ServiseResult<string>> UpdateAnswerCustomer(AnswerCustomer Data)
        {
            try
            {
                if (Data.AnswerCustomerId == 0)
                {
                    _db.AnswerCustomer.Add(Data);
                    Data.AnswerDate = DateConverter.PersianToMiladi(Data.AnswerDateFa);
                }
                else
                {
                    var P_DB = await _db.AnswerCustomer.SingleOrDefaultAsync(p => p.AnswerCustomerId == Data.AnswerCustomerId);
                    if (P_DB != null)
                    {
                        _mapper.Map(Data, P_DB, ["AnswerDate"]);
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
        public async Task<ServiseResult<string>> GetAllAnswerCustomer(int pageNumber)
        {
            try
            {
                var AnswerCustomers = await _db.AnswerCustomer.Where(p => p.AnswerCustomerId < (pageNumber * 10) || pageNumber == 0).ToListAsync();
                foreach (var item in AnswerCustomers)
                {
                    item.AnswerDateFa = DateConverter.MiladiToPersian(item.AnswerDate);
                }
                return ServiseResult<string>.Success(JsonConvert.SerializeObject(AnswerCustomers, Formatting.Indented));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> GetAnswerCustomer(int Id)
        {
            try
            {
                var AnswerCustomer = await _db.AnswerCustomer.Where(p => p.AnswerCustomerId == Id).ToListAsync();
                foreach (var item in AnswerCustomer)
                {
                    item.AnswerDateFa = DateConverter.MiladiToPersian(item.AnswerDate);
                }
                return ServiseResult<string>.Success(JsonConvert.SerializeObject(AnswerCustomer, Formatting.Indented));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> DeleteAnswerCustomer(int Id)
        {
            try
            {
                var p = await _db.AnswerCustomer.SingleOrDefaultAsync(p => p.AnswerCustomerId == Id);
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
