namespace Domain.Models
{

    public class Contact
    {
        //// <summary>
        // راه های تماس
        //// </summary>
        ////DBconectID
        public int ContactId { get; set; } ///شناسه
        public string ContactCaption { get; set; } //&مشخصات تماس
        public int TypeContactId { get; set; } //&نوع پلتفورم ارتباطی
        public int? StoreId { get; set; } //&فروشگاه
        public bool? Status { get; set; } ///وضعیت


    }
}
