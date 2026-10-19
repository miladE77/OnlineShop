using Domain.Models;
using Domain.ServiseResult;
using DataLayer.Context;
using System.Data;
using Newtonsoft.Json;
using Microsoft.EntityFrameworkCore;

namespace Application.Services
{
    public class ServiceLevelAccess : IServiceLevelAccess
    {

        private readonly DBContext _db;
        private readonly FunctionImportant _mapper;
        private readonly IServiceCodeAccess _serviceCodeAccess;

        public ServiceLevelAccess(
            DBContext db,
            FunctionImportant mapper,
            IServiceCodeAccess serviceCodeAccess)
        {
            _db = db;
            _mapper = mapper;
            _serviceCodeAccess = serviceCodeAccess;
        }
        public async Task<ServiseResult<string>> UpdateLevelAccess(LevelAccess Data)
        {
            try
            {
                if (Data.LevelAccessId == 0)
                {
                    _db.LevelAccess.Add(Data);
                }
                else
                {
                    var P_DB = await _db.LevelAccess.SingleOrDefaultAsync(p => p.LevelAccessId == Data.LevelAccessId);
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
        public async Task<ServiseResult<string>> GetAllLevelAccess(int pageNumber)
        {
            try
            {
                var LevelAccesss = await _db.LevelAccess.Where(p => p.LevelAccessId < (pageNumber * 10) || pageNumber == 0).ToListAsync();
                return ServiseResult<string>.Success(JsonConvert.SerializeObject(LevelAccesss, Formatting.Indented));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> GetLevelAccess(int Id)
        {
            try
            {
                var LevelAccess = await _db.LevelAccess.Where(p => p.LevelAccessId == Id).ToListAsync();
                return ServiseResult<string>.Success(JsonConvert.SerializeObject(LevelAccess, Formatting.Indented));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> DeleteLevelAccess(int Id)
        {
            try
            {
                var p = await _db.LevelAccess.SingleOrDefaultAsync(p => p.LevelAccessId == Id);
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
