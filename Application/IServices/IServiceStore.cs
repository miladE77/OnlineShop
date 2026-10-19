using Domain.Models;
using Domain.ServiseResult;
using DataLayer.Context;
using System.Data;
using Newtonsoft.Json;
using Microsoft.EntityFrameworkCore;

namespace Application.Services
{
    public interface IServiceStore
    {
        Task<ServiseResult<string>> UpdateStore(Store Data);
        Task<ServiseResult<string>> GetAllStore(int pageNumber);
        Task<ServiseResult<string>> GetStore(int Id);
        Task<ServiseResult<string>> DeleteStore(int Id);
        Task<ServiseResult<string>> GetStoreById(int personelId);
        Task<ServiseResult<string>> GetStoreIds(int personelId);
        Task<ServiseResult<string>> HasStore(int personelId);

    }
}
