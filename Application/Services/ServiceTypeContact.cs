using Domain.Models;
using Domain.ServiseResult;
using DataLayer.Context;
using System.Data;
using Newtonsoft.Json;
using Microsoft.EntityFrameworkCore;

namespace Application.Services
{
    public class ServiceTypeContact : IServiceTypeContact
    {

        private readonly DBContext _db;
        private readonly FunctionImportant _mapper;
        private readonly IServiceCodeAccess _serviceCodeAccess;

        public ServiceTypeContact(
            DBContext db,
            FunctionImportant mapper,
            IServiceCodeAccess serviceCodeAccess)
        {
            _db = db;
            _mapper = mapper;
            _serviceCodeAccess = serviceCodeAccess;
        }
        public async Task<ServiseResult<string>> UpdateTypeContact(TypeContact Data)
        {
            try
            {
                if (Data.TypeContactId == 0)
                {
                    _db.TypeContact.Add(Data);
                }
                else
                {
                    var P_DB = await _db.TypeContact.SingleOrDefaultAsync(p => p.TypeContactId == Data.TypeContactId);
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
        public async Task<ServiseResult<string>> GetAllTypeContact(int pageNumber)
        {
            try
            {
                var TypeContacts = await _db.TypeContact.Where(p => p.TypeContactId < (pageNumber * 10) || pageNumber == 0).ToListAsync();
                return ServiseResult<string>.Success(JsonConvert.SerializeObject(TypeContacts, Formatting.Indented));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> GetTypeContact(int Id)
        {
            try
            {
                var TypeContact = await _db.TypeContact.Where(p => p.TypeContactId == Id).ToListAsync();
                return ServiseResult<string>.Success(JsonConvert.SerializeObject(TypeContact, Formatting.Indented));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> DeleteTypeContact(int Id)
        {
            try
            {
                var p = await _db.TypeContact.SingleOrDefaultAsync(p => p.TypeContactId == Id);
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
