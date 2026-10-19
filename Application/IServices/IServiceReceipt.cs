using Domain.Models;
using Domain.ServiseResult;
using DataLayer.Context;
using System.Data;
using Newtonsoft.Json;
using Microsoft.EntityFrameworkCore;

namespace Application.Services
{
    public interface IServiceReceipt
    {
        Task<ServiseResult<string>> UpdateReceipt(Receipt Data);
        Task<ServiseResult<string>> GetAllReceipt(int pageNumber);
        Task<ServiseResult<string>> GetReceipt(int Id);
        Task<ServiseResult<string>> DeleteReceipt(int Id);
    }
}
