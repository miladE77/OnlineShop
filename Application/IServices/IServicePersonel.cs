using Domain.Models;
using Domain.ServiseResult;
using DataLayer.Context;
using System.Data;
using Newtonsoft.Json;
using Microsoft.EntityFrameworkCore;

namespace Application.Services
{
    public interface IServicePersonel
    {
        Task<ServiseResult<string>> UpdatePersonel(Personel Data);
        Task<ServiseResult<string>> GetAllPersonel(int pageNumber);
        Task<ServiseResult<string>> GetPersonel(int Id);
        Task<ServiseResult<string>> DeletePersonel(int Id);
    }
}
