
namespace Domain.Models
{

    public class DetailProduct
    {

        //// <summary>
        // توضیحات محصول
        //// </summary>
        ////DBconectID
        public int DetailProductId { get; set; }///شناسه
        public string DetailProductCaption { get; set; }//&توضیح محصول
        public int? OptionProductId { get; set; }//&مشخصه محصول
        public int ProductId { get; set; }///محصول
        public bool? Status { get; set; } ///وضعیت

    }
}
