using Domain.Models;
using Domain.ServiseResult;
using DataLayer.Context;
using System.Data;
using Newtonsoft.Json;
using Microsoft.EntityFrameworkCore;

namespace Application.Services
{
    public interface IServiceDetailProduct
    {
        Task<ServiseResult<string>> UpdateDetailProduct(DetailProduct Data);
        Task<ServiseResult<string>> GetAllDetailProduct(int pageNumber);
        Task<ServiseResult<string>> GetDetailProduct(int Id);
        Task<ServiseResult<string>> DeleteDetailProduct(int Id);
        Task<ServiseResult<string>> DeleteDetailByProduct(int Id);
    }
}
