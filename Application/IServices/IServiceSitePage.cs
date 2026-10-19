using Domain.Models;
using Domain.ServiseResult;
using DataLayer.Context;
using System.Data;
using Newtonsoft.Json;
using Microsoft.EntityFrameworkCore;

namespace Application.Services
{
    public interface IServiceSitePage
    {
        Task<ServiseResult<string>> UpdateSitePage(SitePage Data);
        Task<ServiseResult<string>> GetAllSitePage(int pageNumber);
        Task<ServiseResult<string>> GetSitePage(int Id);
        Task<ServiseResult<string>> DeleteSitePage(int Id);
    }
}
