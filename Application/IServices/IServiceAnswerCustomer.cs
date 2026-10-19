using Domain.Models;
using Domain.ServiseResult;
using DataLayer.Context;
using System.Data;
using Newtonsoft.Json;
using Microsoft.EntityFrameworkCore;

namespace Application.Services
{
    public interface IServiceAnswerCustomer
    {
        Task<ServiseResult<string>> UpdateAnswerCustomer(AnswerCustomer Data);
        Task<ServiseResult<string>> GetAllAnswerCustomer(int pageNumber);
        Task<ServiseResult<string>> GetAnswerCustomer(int Id);
        Task<ServiseResult<string>> DeleteAnswerCustomer(int Id);
    }
}
