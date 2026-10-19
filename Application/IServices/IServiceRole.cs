using Domain.Models;
using Domain.ServiseResult;
using DataLayer.Context;
using System.Data;
using Newtonsoft.Json;
using Microsoft.EntityFrameworkCore;

namespace Application.Services
{
    public interface IServiceRole
    {
        Task<ServiseResult<string>> UpdateRole(Role Data);
        Task<ServiseResult<string>> GetAllRole(int pageNumber);
        Task<ServiseResult<string>> GetRole(int Id);
        Task<ServiseResult<string>> DeleteRole(int Id);
    }
}
