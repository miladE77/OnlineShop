using System.ComponentModel.DataAnnotations.Schema;

namespace Domain.Models
{

    public class Store
    {
        //// <summary>
        // فروشگاه
        //// </summary>
        ////DBconectID
        public int StoreId { get; set; } ///شناسه
        public string StoreCaption { get; set; } //&عنوان فروشگاه
        public int PersonelId { get; set; } //&صاحب فروشگاه
        public string CodeStore { get; set; } //&کد فروشگاه
        public DateTime StoreRecord { get; set; } //&تاریخ تاسیس
        [NotMapped]
        public string? StoreRecordFa { get; set; } //&تاریخ تاسیس
        public string AddressStore { get; set; } //&آدرس فروشگاه
        public List<Contact>? ContactId { get; set; } ///راه ارتباطی
        public bool? Status { get; set; } ///وضعیت

    }
}
