using Microsoft.AspNetCore.Http;

namespace Domain.ViewModels
{
    public class AddOrderModel
    {
        public int RecommendationsId { get; set; } 
        public List<OrderItemModel> Items { get; set; }
    }


}
