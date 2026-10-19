using Domain.Models;
using Domain.ServiseResult;
using DataLayer.Context;
using System.Data;
using Newtonsoft.Json;
using Microsoft.EntityFrameworkCore;

namespace Application.Services
{
    public class ServicePersonel : IServicePersonel
    {

        private readonly DBContext _db;
        private readonly FunctionImportant _mapper;
        private readonly IServiceCodeAccess _serviceCodeAccess;

        public ServicePersonel(
            DBContext db,
            FunctionImportant mapper,
            IServiceCodeAccess serviceCodeAccess)
        {
            _db = db;
            _mapper = mapper;
            _serviceCodeAccess = serviceCodeAccess;
        }
        public async Task<ServiseResult<string>> UpdatePersonel(Personel Data)
        {
            try
            {
                if (Data.PersonelId == 0)
                {
                    _db.Personel.Add(Data);
                    await _db.SaveChangesAsync();
                    return ServiseResult<string>.Success(Data.PersonelId.ToString());
                }
                else
                {
                    var P_DB = await _db.Personel.SingleOrDefaultAsync(p => p.PersonelId == Data.PersonelId);
                    if (P_DB != null)
                    {
                        _mapper.Map(Data, P_DB);
                    }
                    await _db.SaveChangesAsync();
                    return ServiseResult<string>.Success("saveData");
                }
                
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> GetAllPersonel(int pageNumber)
        {
            try
            {
                var Personels = await _db.Personel.Where(p => p.PersonelId < (pageNumber * 10) || pageNumber == 0).ToListAsync();
                return ServiseResult<string>.Success(JsonConvert.SerializeObject(Personels, Formatting.Indented));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> GetPersonel(int Id)
        {
            try
            {
                var Personel = await _db.Personel.Where(p => p.PersonelId == Id).ToListAsync();
                return ServiseResult<string>.Success(JsonConvert.SerializeObject(Personel, Formatting.Indented));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> DeletePersonel(int Id)
        {
            try
            {
                var p = await _db.Personel.SingleOrDefaultAsync(p => p.PersonelId == Id);
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
