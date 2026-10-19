using Domain.Models;
using Domain.ServiseResult;
using DataLayer.Context;
using System.Data;
using Newtonsoft.Json;
using Microsoft.EntityFrameworkCore;

namespace Application.Services
{
    public interface IServiceKindProduct
    {
        Task<ServiseResult<string>> UpdateKindProduct(KindProduct Data);
        Task<ServiseResult<string>> GetAllKindProduct(int pageNumber);
        Task<ServiseResult<string>> GetKindProduct(int Id);
        Task<ServiseResult<string>> DeleteKindProduct(int Id);
    }
}
