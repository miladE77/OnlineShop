using System.ComponentModel.DataAnnotations;

namespace Domain.ViewModels
{
    public class VerifyPhoneViewModel
    {
        [Required(ErrorMessage = "شماره تماس الزامی است")]
        [RegularExpression(@"^09\d{9}$", ErrorMessage = "شماره تماس معتبر نیست (مثال: 09121234567)")]
        [Display(Name = "شماره تماس")]
        public string PhoneNumber { get; set; }
    }
}