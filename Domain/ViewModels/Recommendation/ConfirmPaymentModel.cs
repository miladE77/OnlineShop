using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace Domain.ViewModels
{

    public class ConfirmPaymentModel
    {
        public int RecommendationId { get; set; }
        public int TypePeymentId { get; set; }
    }
}
