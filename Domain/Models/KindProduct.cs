
namespace Domain.Models
{

    public class KindProduct
    {
        //// <summary>
        // دسته بندی محصولات
        //// </summary>
        ////DBconectID
        public int KindProductId { get; set; }///شناسه
        ////مشخصات محصول
        public string? KindProductCaption { get; set; }//&عنوان دسته بندی
        public string? CodeInternalKindProducts { get; set; }//&کد دسترسی داخلی
        public int? ParentKindProductId { get; set; }//&مجموعه والد 
        public bool? Status { get; set; } ///وضعیت
    }
}
