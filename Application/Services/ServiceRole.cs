using Domain.Models;
using Domain.ServiseResult;
using DataLayer.Context;
using System.Data;
using Newtonsoft.Json;
using Microsoft.EntityFrameworkCore;

namespace Application.Services
{
    public class ServiceRole : IServiceRole
    {

        private readonly DBContext _db;
        private readonly FunctionImportant _mapper;
        private readonly IServiceCodeAccess _serviceCodeAccess;

        public ServiceRole(
            DBContext db,
            FunctionImportant mapper,
            IServiceCodeAccess serviceCodeAccess)
        {
            _db = db;
            _mapper = mapper;
            _serviceCodeAccess = serviceCodeAccess;
        }
        public async Task<ServiseResult<string>> UpdateRole(Role Data)
        {
            try
            {
                if (Data.RoleId == 0)
                {
                    _db.Role.Add(Data);
                }
                else
                {
                    var P_DB = await _db.Role.SingleOrDefaultAsync(p => p.RoleId == Data.RoleId);
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
        public async Task<ServiseResult<string>> GetAllRole(int pageNumber)
        {
            try
            {
                var Roles = await _db.Role.Where(p => p.RoleId < (pageNumber * 10) || pageNumber == 0).ToListAsync();
                return ServiseResult<string>.Success(JsonConvert.SerializeObject(Roles, Formatting.Indented));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> GetRole(int Id)
        {
            try
            {
                var Role = await _db.Role.Where(p => p.RoleId == Id).ToListAsync();
                return ServiseResult<string>.Success(JsonConvert.SerializeObject(Role, Formatting.Indented));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> DeleteRole(int Id)
        {
            try
            {
                var p = await _db.Role.SingleOrDefaultAsync(p => p.RoleId == Id);
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
