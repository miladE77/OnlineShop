using Domain.Models;
using Domain.ServiseResult;
using DataLayer.Context;
using System.Data;
using Newtonsoft.Json;
using Microsoft.EntityFrameworkCore;

namespace Application.Services
{
    public interface IServiceEmailNews
    {
        Task<ServiseResult<string>> UpdateEmailNews(EmailNews Data);
        Task<ServiseResult<string>> GetAllEmailNews(int pageNumber);
        Task<ServiseResult<string>> GetEmailNews(int Id);
        Task<ServiseResult<string>> DeleteEmailNews(int Id);
        Task<ServiseResult<string>> DeleteEmailNewsByStore(int Id);
    }
}
