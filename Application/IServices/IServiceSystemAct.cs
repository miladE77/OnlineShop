using Domain.Models;
using Domain.ServiseResult;
using DataLayer.Context;
using System.Data;
using Newtonsoft.Json;
using Microsoft.EntityFrameworkCore;

namespace Application.Services
{
    public interface IServiceSystemAct
    {
        Task<ServiseResult<string>> UpdateSystemAct(SystemAct Data);
        Task<ServiseResult<string>> GetAllSystemAct(int pageNumber);
        Task<ServiseResult<string>> GetSystemAct(int Id);
        Task<ServiseResult<string>> DeleteSystemAct(int Id);
    }
}
