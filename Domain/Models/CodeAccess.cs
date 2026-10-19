namespace Domain.Models
{

    public class CodeAccess
    {
        //// <summary>
        // کد اختصاصی
        //// </summary>
        ////DBconectID
        public int CodeAccessId { get; set; } ///شناسه
        public string CodeAccessCaption { get; set; } //&کد
        public int TypeCode { get; set; } //&نوع کد
        //0=>فروشگاه
        //1=>محصولات
        //2=>صفحه اختصاصی
        public bool? Status { get; set; } ///وضعیت


    }
}
