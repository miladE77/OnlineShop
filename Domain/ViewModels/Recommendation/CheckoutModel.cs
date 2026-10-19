using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace Domain.ViewModels
{
    public class CheckoutModel
    {
        public int RecommendationsId { get; set; }
        public int TypePeymentId { get; set; }
        public List<CheckoutItem> Items { get; set; }
    }
}
