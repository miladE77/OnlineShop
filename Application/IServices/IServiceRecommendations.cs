using Domain.Models;
using Domain.ServiseResult;
using DataLayer.Context;
using System.Data;
using Newtonsoft.Json;
using Microsoft.EntityFrameworkCore;

namespace Application.Services
{
    public interface IServiceRecommendations
    {
        Task<ServiseResult<string>> UpdateRecommendations(Recommendations Data);
        Task<ServiseResult<string>> GetAllRecommendations(int pageNumber);
        Task<ServiseResult<string>> GetPersonelRecommendations(int Id);
        Task<ServiseResult<string>> GetRecommendations(int Id);
        Task<ServiseResult<string>> DeleteRecommendations(int Id);
    }
}
