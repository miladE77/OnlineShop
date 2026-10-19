using System.ComponentModel.DataAnnotations;

namespace Domain.ViewModels
{
    public class GetBaseDataRequest
    {
        public List<int> ColorPriceProductIds { get; set; } = new List<int>();
        public List<int> ProductIds { get; set; } = new List<int>();
    }
}
