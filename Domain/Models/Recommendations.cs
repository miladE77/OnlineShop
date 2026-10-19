
using System.ComponentModel.DataAnnotations.Schema;

namespace Domain.Models
{
    public class Recommendations
    {

        //// <summary>
        // سفارشات
        //// </summary>
        ////DBconectID
        public int RecommendationsId { get; set; }///شناسه
        public string? RecommendationsCaption { get; set; }//&عنوان سفارش
        public int PersonelId { get; set; }//&سفارش دهنده
        public List<Receipt>? ReceiptId { get; set; }///رسید پرداخت سفارش
        public List<Order>? OrderId { get; set; }///محصولات سفارشی
        public DateTime DateTimeRecord { get; set; }///تاریخ سفارش
        [NotMapped]
        public string? DateTimeRecordFa { get; set; }///تاریخ سفارش
        public int LevelOrder { get; set; }///مرحله سفارش
        //2=>سفارش
        //3=>پرداخت
        //4=>پردازش سفارش
        //5=>بسته بندی و ارسال
        //6=>تحویل محصول به پست
        //7=>تحویل مشتری
        public string? Command { get; set; }///توضیحات
        public bool? Status { get; set; } ///وضعیت

    }
}
