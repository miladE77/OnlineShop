using Domain.Models;
using Domain.ServiseResult;
using DataLayer.Context;
using System.Data;
using Newtonsoft.Json;
using Microsoft.EntityFrameworkCore;

namespace Application.Services
{
    public interface IServiceColorPriceProduct
    {
        Task<ServiseResult<string>> UpdateColorPriceProduct(ColorPriceProduct Data);
        Task<ServiseResult<string>> GetAllColorPriceProduct(int pageNumber);
        Task<ServiseResult<string>> GetColorPriceProduct(int Id);
        Task<ServiseResult<string>> DeleteColorPriceProduct(int Id);
        Task<ServiseResult<string>> DeleteColorPriceByProductId(int Id);
    }
}
