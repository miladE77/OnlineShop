using Domain.Models;
using Domain.ServiseResult;
using DataLayer.Context;
using System.Data;
using Newtonsoft.Json;
using Microsoft.EntityFrameworkCore;

namespace Application.Services
{
    public interface IServiceOptionProduct
    {
        Task<ServiseResult<string>> UpdateOptionProduct(OptionProduct Data);
        Task<ServiseResult<string>> GetAllOptionProduct(int pageNumber);
        Task<ServiseResult<string>> GetOptionProduct(int Id);
        Task<ServiseResult<string>> DeleteOptionProduct(int Id);
    }
}
