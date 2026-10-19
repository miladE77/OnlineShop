using Domain.Models;
using Domain.ServiseResult;
using DataLayer.Context;
using System.Data;
using Newtonsoft.Json;
using Microsoft.EntityFrameworkCore;

namespace Application.Services
{
    public interface IServiceProduct
    {
        Task<ServiseResult<string>> UpdateProduct(Product Data);
        Task<ServiseResult<string>> GetAllProduct(int pageNumber);
        Task<ServiseResult<string>> GetAllProduct(List<int> ids);
        Task<ServiseResult<string>> GetProduct(int Id);
        Task<ServiseResult<string>> DeleteProduct(int Id);
        Task<ServiseResult<string>> DeleteProductByStore(int Id);
        Task<ServiseResult<string>> GetByStore(int storeId);
        Task<ServiseResult<string>> GetByStores(List<int> storeIds);
    }
}
