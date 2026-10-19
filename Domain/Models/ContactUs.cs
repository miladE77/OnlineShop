
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.RegularExpressions;

namespace Domain.Models
{
    /// <summary>
    /// فرم تماس با ما
    /// </summary>
    public class ContactUs
    {
        public int ContactUsId { get; set; } ///شناسه
        public string ContactUsCaption { get; set; } //&موضوع متن
        public string FullName { get; set; } //&نام و نام خانوادگی
        public string Email { get; set; } //&ایمیل
        public string PhoneNumber { get; set; }  //&شماره تماس
        public string Messages { get; set; } ///متن
        public DateTime CreatedDate { get; set; } //&تاریخ ثبت
        [NotMapped]
        public string? CreatedDateFa { get; set; } //&تاریخ ثبت
        public int? StoreId { get; set; } //&فروشگاه
        public int? PersonelId { get; set; } //&پرسشگر
        public string? UserIP { get; set; } ///IP
        public List<AnswerCustomer>? Answer { get; set; } ///پاسخ ها
        public int Condetion { get; set; } ///وضعیت پاسخ دهی$0:"در انتظار پاسخ"$1:"پاسخ داده شده"$2:"رد شده"$3:"بایگانی"
        public bool Status { get; set; } ///وضعیت


    }

}
