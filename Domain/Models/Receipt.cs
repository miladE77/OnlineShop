
using System.ComponentModel.DataAnnotations.Schema;

namespace Domain.Models
{

    public class Receipt
    {

        //// <summary>
        // رسید پرداخت
        //// </summary>
        ////DBconectID
        public int ReceiptId { get; set; }///شناسه
        public string? ReceiptCaption { get; set; }//&عنوان پرداخت
        public int TypePeymentId { get; set; }//&نوع پرداخت
        public int RecommendationsId { get; set; }//سفارش مرتبط
        public int ValuePeyment { get; set; }///حجم پرداخت
        public bool DoPeyment { get; set; }///تکمیل پرداخت
        public DateTime DateTimePeyment { get; set; }///تاریخ پرداخت
        [NotMapped]
        public string? DateTimePeymentFa { get; set; }///تاریخ پرداخت
        public bool? Status { get; set; } ///وضعیت

    }
}
