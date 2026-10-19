using Domain.Models;
using Domain.ServiseResult;
using DataLayer.Context;
using System.Data;
using Newtonsoft.Json;
using Microsoft.EntityFrameworkCore;
using Domain.ViewModels;

namespace Application.Services
{
    public interface IServiceFileProduct
    {
        Task<ServiseResult<string>> UpdateFileProduct(FileProductModel Data);
        Task<ServiseResult<string>> GetAllFileProduct(int pageNumber);
        Task<ServiseResult<string>> GetFileProduct(int Id);
        Task<ServiseResult<string>> DeleteFileProduct(int Id);
        Task<ServiseResult<string>> DeleteFileByProduct(int Id);
    }
}
