using Domain.Models;
using Domain.ServiseResult;
using DataLayer.Context;
using System.Data;
using Newtonsoft.Json;
using Microsoft.EntityFrameworkCore;

namespace Application.Services
{
    public interface IServiceTypePeyment
    {
        Task<ServiseResult<string>> UpdateTypePeyment(TypePeyment Data);
        Task<ServiseResult<string>> GetAllTypePeyment(int pageNumber);
        Task<ServiseResult<string>> GetTypePeyment(int Id);
        Task<ServiseResult<string>> DeleteTypePeyment(int Id);
    }
}
