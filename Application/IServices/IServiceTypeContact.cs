using Domain.Models;
using Domain.ServiseResult;
using DataLayer.Context;
using System.Data;
using Newtonsoft.Json;
using Microsoft.EntityFrameworkCore;

namespace Application.Services
{
    public interface IServiceTypeContact
    {
        Task<ServiseResult<string>> UpdateTypeContact(TypeContact Data);
        Task<ServiseResult<string>> GetAllTypeContact(int pageNumber);
        Task<ServiseResult<string>> GetTypeContact(int Id);
        Task<ServiseResult<string>> DeleteTypeContact(int Id);
    }
}
