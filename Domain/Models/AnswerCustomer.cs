
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace Domain.Models
{
    /// <summary>
    /// پاسخ مشتری ها
    /// </summary>
    public class AnswerCustomer
    {
        public int AnswerCustomerId { get; set; }///شناسه
        public string AnswerCustomerCaption { get; set; } //&عنوان پاسخ
        public int ContactUsId { get; set; }//&سوال
        public DateTime AnswerDate { get; set; }//&تاریخ پاسخ
        [NotMapped]
        public string? AnswerDateFa { get; set; }//&تاریخ پاسخ
        public bool Status { get; set; } ///وضعیت
    }

}
