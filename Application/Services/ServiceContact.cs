using Domain.Models;
using Domain.ServiseResult;
using DataLayer.Context;
using System.Data;
using Newtonsoft.Json;
using Microsoft.EntityFrameworkCore;

namespace Application.Services
{
    public class ServiceContact : IServiceContact
    {

        private readonly DBContext _db;
        private readonly FunctionImportant _mapper;
        private readonly IServiceCodeAccess _serviceCodeAccess;

        public ServiceContact(
            DBContext db,
            FunctionImportant mapper,
            IServiceCodeAccess serviceCodeAccess)
        {
            _db = db;
            _mapper = mapper;
            _serviceCodeAccess = serviceCodeAccess;
        }
        public async Task<ServiseResult<string>> UpdateContact(Contact Data)
        {
            try
            {
                if (Data.ContactId == 0)
                {
                    _db.Contact.Add(Data);
                }
                else
                {
                    var P_DB = await _db.Contact.SingleOrDefaultAsync(p => p.ContactId == Data.ContactId);
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
        public async Task<ServiseResult<string>> GetAllContact(int pageNumber)
        {
            try
            {
                var Contacts = await _db.Contact.Where(p => p.ContactId < (pageNumber * 10) || pageNumber == 0).ToListAsync();
                return ServiseResult<string>.Success(JsonConvert.SerializeObject(Contacts, Formatting.Indented));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> GetContact(int Id)
        {
            try
            {
                var Contact = await _db.Contact.Where(p => p.ContactId == Id).ToListAsync();
                return ServiseResult<string>.Success(JsonConvert.SerializeObject(Contact, Formatting.Indented));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> DeleteContact(int Id)
        {
            try
            {
                var p = await _db.Contact.SingleOrDefaultAsync(p => p.ContactId == Id);
                _db.Remove(p);
                await _db.SaveChangesAsync();
                return ServiseResult<string>.Success("DeleteData");
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> GetByStore(int storeId)
        {
            try
            {
                var contacts = await _db.Contact
                    .Where(c => c.StoreId == storeId)
                    .OrderByDescending(c => c.ContactId)
                    .ToListAsync();

                return ServiseResult<string>.Success(
                    JsonConvert.SerializeObject(contacts, Formatting.Indented));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> DeleteContactStore(int storeId)
        {
            try
            {
                var contacts = await _db.Contact.Where(c => c.StoreId == storeId).ToListAsync();
                _db.Remove(contacts);
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
