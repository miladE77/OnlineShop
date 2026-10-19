using System.ComponentModel.DataAnnotations.Schema;

namespace Domain.Models
{
    //// <summary>
    // تاریخچه عملیات
    //// </summary>
    public class SystemAct
    {
        public int SystemActId { get; set; } ///شناسه
        public string? SystemActCaption { get; set; } //&عنوان
        public int PersonelId { get; set; } //&پرسنل
        public int TypeSystemAct { get; set; } //&نوع عملیات
        //0=ورود
        //1=خروج
        public DateTime DateTime { get; set; } //&تاریخ عملیات
        [NotMapped]
        public string DateTimeFa { get; set; } //&تاریخ عملیات
        public bool Status { get; set; } ///وضعیت
    }
}
