using Domain.ServiseResult;
using System.Data;
using Microsoft.Data.SqlClient;

namespace Application.Services
{
    public interface IServiceChekerEnter
    {
        Task<bool> CheckAccessToAction(int PersonId, string PageCaption, string CharAccess);
        Task<bool> CheckAccessToAction(int PersonId, string PageCaption);
    }
}