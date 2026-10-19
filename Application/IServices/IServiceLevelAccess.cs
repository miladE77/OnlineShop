using Domain.Models;
using Domain.ServiseResult;
using DataLayer.Context;
using System.Data;
using Newtonsoft.Json;
using Microsoft.EntityFrameworkCore;

namespace Application.Services
{
    public interface IServiceLevelAccess
    {
        Task<ServiseResult<string>> UpdateLevelAccess(LevelAccess Data);
        Task<ServiseResult<string>> GetAllLevelAccess(int pageNumber);
        Task<ServiseResult<string>> GetLevelAccess(int Id);
        Task<ServiseResult<string>> DeleteLevelAccess(int Id);
    }
}
