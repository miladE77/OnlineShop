
namespace Domain.Models
{

    public class Order
    {
        //// <summary>
        // سفارش
        //// </summary>
        ////DBconectID
        public int OrderId { get; set; }///شناسه
        public string? OrderCaption { get; set; }//&عنوان سفارش
        public int RecommendationsId { get; set; }//سفارش مرتبط
        public int ColorPriceProductId { get; set; }//&مرتبط با محصول
        public int NumberProduct { get; set; }///تعداد محصول
        public bool? Status { get; set; } ///وضعیت

    }
}
