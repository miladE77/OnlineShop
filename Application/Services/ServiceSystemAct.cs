using Domain.Models;
using Domain.ServiseResult;
using DataLayer.Context;
using System.Data;
using Newtonsoft.Json;
using Microsoft.EntityFrameworkCore;
using System.Security.AccessControl;

namespace Application.Services
{
    public class ServiceSystemAct : IServiceSystemAct
    {

        private readonly DBContext _db;
        private readonly FunctionImportant _mapper;
        private readonly IServiceCodeAccess _serviceCodeAccess;

        public ServiceSystemAct(
            DBContext db,
            FunctionImportant mapper,
            IServiceCodeAccess serviceCodeAccess)
        {
            _db = db;
            _mapper = mapper;
            _serviceCodeAccess = serviceCodeAccess;
        }
        public async Task<ServiseResult<string>> UpdateSystemAct(SystemAct Data)
        {
            try
            {
                if (Data.SystemActId == 0)
                {
                    Data.DateTime = DateConverter.PersianToMiladi(Data.DateTimeFa);
                    _db.SystemAct.Add(Data);
                }
                else
                {
                    var P_DB = await _db.SystemAct.SingleOrDefaultAsync(p => p.SystemActId == Data.SystemActId);
                    if (P_DB != null)
                    {
                        _mapper.Map(Data, P_DB, ["DateTime"]);
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
        public async Task<ServiseResult<string>> GetAllSystemAct(int pageNumber)
        {
            try
            {
                var SystemActs = await _db.SystemAct.Where(p => p.SystemActId < (pageNumber * 10) || pageNumber == 0).ToListAsync();
                foreach (var item in SystemActs)
                {
                    item.DateTimeFa = DateConverter.MiladiToPersian(item.DateTime);
                }
                return ServiseResult<string>.Success(JsonConvert.SerializeObject(SystemActs, Formatting.Indented));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> GetSystemAct(int Id)
        {
            try
            {
                var SystemAct = await _db.SystemAct.Where(p => p.SystemActId == Id).ToListAsync();
                foreach (var item in SystemAct)
                {
                    item.DateTimeFa = DateConverter.MiladiToPersian(item.DateTime);
                }
                return ServiseResult<string>.Success(JsonConvert.SerializeObject(SystemAct, Formatting.Indented));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> DeleteSystemAct(int Id)
        {
            try
            {
                var p = await _db.SystemAct.SingleOrDefaultAsync(p => p.SystemActId == Id);
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
