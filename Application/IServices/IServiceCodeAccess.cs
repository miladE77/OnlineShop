using Domain.Models;
using Domain.ServiseResult;
using DataLayer.Context;
using System.Data;
using Newtonsoft.Json;
using Microsoft.EntityFrameworkCore;

namespace Application.Services
{
    public interface IServiceCodeAccess
    {
        Task<ServiseResult<string>> CreateCodeAccess(int Type);
        Task<ServiseResult<string>> UpdateCodeAccess(CodeAccess Data);
        Task<ServiseResult<string>> GetAllCodeAccess(int pageNumber);
        Task<ServiseResult<string>> GetCodeAccess(int Id);
        Task<ServiseResult<string>> DeleteCodeAccess(int Id);
    }
}
