using Domain.Models;
using Domain.ServiseResult;
using DataLayer.Context;
using System.Data;
using Newtonsoft.Json;
using Microsoft.EntityFrameworkCore;

namespace Application.Services
{
    public interface IServicePage
    {
        Task<ServiseResult<string>> UpdatePage(Page Data);
        Task<ServiseResult<string>> GetAllPage(int pageNumber);
        Task<ServiseResult<string>> GetPage(int Id);
        Task<ServiseResult<string>> DeletePage(int Id);
    }
}
