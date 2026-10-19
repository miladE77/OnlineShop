
namespace Domain.Models
{

    public class ColorPriceProduct
    {

        //// <summary>
        // رنگ بندی محصولات
        //// </summary>
        ////DBconectID
        public int ColorPriceProductId { get; set; }///شناسه
        public string? ColorPriceProductCaption { get; set; }//&رنگ محصول
        public int? PriceProduct { get; set; }//&قیمت محصول
        public int? Offer { get; set; }//&تخفیف
        public int ProductId { get; set; }//&محصول
        public int? InStore { get; set; }//&موجودی انبار
        public bool? Status { get; set; } ///وضعیت

    }
}
