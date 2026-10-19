
namespace Domain.Models
{

    public class OptionProduct
    {
        //// <summary>
        // مشخصات فنی هر نوع محصول
        //// </summary>
        ////DBconectID
        public int OptionProductId { get; set; }///شناسه
        public string? OptionProductCaption { get; set; }//&عنوان مشخصه
        public int KindProductId { get; set; }///نوع محصول
        public bool? Status { get; set; } ///وضعیت
    }
}
