using Domain.Models;
using Domain.ServiseResult;
using DataLayer.Context;
using System.Data;
using Newtonsoft.Json;
using Microsoft.EntityFrameworkCore;

namespace Application.Services
{
    public interface IServiceOrder
    {
        Task<ServiseResult<string>> UpdateOrder(Order Data);
        Task<ServiseResult<string>> GetAllOrder(int pageNumber);
        Task<ServiseResult<string>> GetOrder(int Id);
        Task<ServiseResult<string>> DeleteOrder(int Id);
        Task<ServiseResult<string>> DeleteOrderByRecommendations(int Id);
    }
}
