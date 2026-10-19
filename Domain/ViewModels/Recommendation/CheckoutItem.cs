using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace Domain.ViewModels
{
    public class CheckoutItem
    {
        public int ColorPriceProductId { get; set; }
        public int NumberProduct { get; set; }
    }
}
