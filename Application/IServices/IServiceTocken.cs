using Domain.Models;
using Domain.ServiseResult;
using DataLayer.Context;
using System.Data;
using Newtonsoft.Json;
using Microsoft.EntityFrameworkCore;

namespace Application.Services
{
    public interface IServiceTocken
    {
        Task<ServiseResult<string>> UpdateTocken(Tocken Data);
        Task<ServiseResult<string>> GetAllTocken(int pageNumber);
        Task<ServiseResult<string>> GetTocken(int Id);
        Task<ServiseResult<string>> DeleteTocken(int Id);
    }
}
