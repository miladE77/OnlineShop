namespace Domain.Models
{

    public class EmailNews
    {
        //// <summary>
        // ایمیل اخبار
        //// </summary>
        ////DBconectID
        public int EmailNewsId { get; set; } ///شناسه
        public string? EmailNewsCaption { get; set; } //&ایمیل
        public int StoreId { get; set; } //&فروشگاه
        public bool? Status { get; set; } ///وضعیت


    }
}
