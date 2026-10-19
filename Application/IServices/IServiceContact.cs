using Domain.Models;
using Domain.ServiseResult;
using DataLayer.Context;
using System.Data;
using Newtonsoft.Json;
using Microsoft.EntityFrameworkCore;

namespace Application.Services
{
    public interface IServiceContact
    {
        Task<ServiseResult<string>> UpdateContact(Contact Data);
        Task<ServiseResult<string>> GetAllContact(int pageNumber);
        Task<ServiseResult<string>> GetContact(int Id);
        Task<ServiseResult<string>> DeleteContact(int Id);
        Task<ServiseResult<string>> DeleteContactStore(int storeId);
        Task<ServiseResult<string>> GetByStore(int storeId);
    }
}
