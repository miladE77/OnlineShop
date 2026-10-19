
namespace Domain.Models
{

    public class Product
    {

        //// <summary>
        // محصولات
        //// </summary>
        ////DBconectID
        public int ProductId { get; set; }///شناسه
        ////مشخصات محصول
        public string? ProductCaption { get; set; }//&عنوان محصول
        public string? CodeInternalProducts { get; set; }///کد دسترسی داخلی
        public int KindProductId { get; set; }//&دسته بندی محصول
        public string? DetailProducts { get; set; }//&توضیحات محصول
        public int? PriceProduct { get; set; }///قیمت محصول
        public int StoreId { get; set; } //&فروشگاه
        public List<FileProduct>? Files { get; set; }///آرشیو محصولات
        public List<ColorPriceProduct>? Colors { get; set; }///رنگ بندی محصولات
        public List<DetailProduct>? Details { get; set; }///توضیحات محصولات
        public bool? Status { get; set; } ///وضعیت

    }
}
