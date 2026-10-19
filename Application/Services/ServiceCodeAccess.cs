using Domain.Models;
using Domain.ServiseResult;
using DataLayer.Context;
using System.Data;
using Newtonsoft.Json;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace Application.Services
{
    public class ServiceCodeAccess : IServiceCodeAccess
    {
        private readonly DBContext _db;
        private readonly FunctionImportant _mapper;

        public ServiceCodeAccess(
            DBContext db,
            FunctionImportant mapper)
        {
            _db = db;
            _mapper = mapper;
        }
        public async Task<ServiseResult<string>> CreateCodeAccess(int Type)
        {
            try
            {
                string code = "";
                const int codeLength = 8;
                const int maxAttempts = 20;
                const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
                for (int attempt = 0; attempt < maxAttempts; attempt++)
                {
                    var sb = new StringBuilder(codeLength);
                    for (int i = 0; i < codeLength; i++)
                    {
                        int idx = RandomNumberGenerator.GetInt32(0, chars.Length);
                        sb.Append(chars[idx]);
                    }
                    code = sb.ToString();
                    bool exists = _db.CodeAccess.Any(p => p.CodeAccessCaption == code);
                    if (!exists)
                    {
                        break;
                    }
                }
                CodeAccess CodeAccess = new CodeAccess()
                {
                    CodeAccessCaption = code,
                    TypeCode = Type,
                    Status = true
                };
                _db.CodeAccess.Add(CodeAccess);
                _db.SaveChangesAsync();
                return ServiseResult<string>.Success(code);
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }

        public async Task<ServiseResult<string>> UpdateCodeAccess(CodeAccess Data)
        {
            try
            {
                if (Data.CodeAccessId == 0)
                {
                    _db.CodeAccess.Add(Data);
                }
                else
                {
                    var P_DB = await _db.CodeAccess.SingleOrDefaultAsync(p => p.CodeAccessId == Data.CodeAccessId);
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
        public async Task<ServiseResult<string>> GetAllCodeAccess(int pageNumber)
        {
            try
            {
                var CodeAccesss = await _db.CodeAccess.Where(p => p.CodeAccessId < (pageNumber * 10) || pageNumber == 0).ToListAsync();
                return ServiseResult<string>.Success(JsonConvert.SerializeObject(CodeAccesss, Formatting.Indented));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> GetCodeAccess(int Id)
        {
            try
            {
                var CodeAccess = await _db.CodeAccess.Where(p => p.CodeAccessId == Id).ToListAsync();
                return ServiseResult<string>.Success(JsonConvert.SerializeObject(CodeAccess, Formatting.Indented));
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> DeleteCodeAccess(int Id)
        {
            try
            {
                var p = await _db.CodeAccess.SingleOrDefaultAsync(p => p.CodeAccessId == Id);
                _db.Remove(p);
                await _db.SaveChangesAsync();
                return ServiseResult<string>.Success("DeleteData");
            }
            catch (Exception ex)
            {
                return ServiseResult<string>.Failure(ex.Message);
            }
        }
        public async Task<ServiseResult<string>> DeleteCodeAccessByCode(string Code)
        {
            try
            {
                var p = await _db.CodeAccess.SingleOrDefaultAsync(p => p.CodeAccessCaption == Code);
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
