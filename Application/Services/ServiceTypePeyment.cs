using Domain.Models;
using Domain.ServiseResult;
using DataLayer.Context;
using System.Data;
using Newtonsoft.Json;
using Microsoft.EntityFrameworkCore;

namespace Application.Services
{
    public class ServiceTypePeyment : IServiceTypePeyment
    {

        private readonly DBContext _db;
        private readonly FunctionImportant _mapper;
        private readonly IServiceCodeAccess _serviceCodeAccess;

        public ServiceTypePeyment(
            DBContext db,
            FunctionImportant mapper,
            IServiceCodeAccess serviceCodeAccess)
        {
            _db = db;
            _mapper = mapper;
            _serviceCodeAccess = serviceCodeAccess;
        }
        public async Task<ServiseResult<string>> UpdateTypePeyment(TypePeyment Data)
        {
            try
            {
                if (Data.TypePeymentId == 0)
                {
                    _db.TypePeyment.Add(Data);
                }
                else
                {
                    var P_DB = await _db.TypePeyment.SingleOrDefaultAsync(p => p.TypePeymentId == Data.TypePeymentId);
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
        public async Task<ServiseResult<string>> GetAllTypePeyment(int pageNumber)
        {
            try
            {
                var TypePeyments = await _db.TypePeyment.Where(p => p.TypePeymentId < (pageNumber * 10) || pageNumber == 0).ToListAsync();
                return ServiseResult<string>.Success(JsonConvert.SerializeObject(TypePeyments, Formatting.Indented));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> GetTypePeyment(int Id)
        {
            try
            {
                var TypePeyment = await _db.TypePeyment.Where(p => p.TypePeymentId == Id).ToListAsync();
                return ServiseResult<string>.Success(JsonConvert.SerializeObject(TypePeyment, Formatting.Indented));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> DeleteTypePeyment(int Id)
        {
            try
            {
                var p = await _db.TypePeyment.SingleOrDefaultAsync(p => p.TypePeymentId == Id);
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
