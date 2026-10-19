using Domain.Models;
using Domain.ServiseResult;

namespace Application.IServices
{
    public interface IOrderProcessingService
    {
        Task<ServiseResult<string>> RegisterOrderWithReceipt(
            Recommendations recommendations,
            List<Order> orders,
            Receipt receipt);
    }
}