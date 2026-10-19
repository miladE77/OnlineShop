namespace Domain.Models
{

    public class FileProduct
    {
        //// <summary>
        // آرشیو محصولات
        //// </summary>
        ////DBconectID
        public int FileProductId { get; set; }///شناسه
        public string? FileProductCaption { get; set; }//&عنوان فایل
        public string? CodeFileProduct { get; set; }//*کد فایل
        public string? Detail { get; set; }///توضیحات
        public int ProductId { get; set; }//&محصول
        public bool? Status { get; set; } ///وضعیت
        

    }
}
