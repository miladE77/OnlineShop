using System.ComponentModel.DataAnnotations;

namespace Domain.ViewModels
{
    public class LoginViewModel
    {
        [Required(ErrorMessage = "شماره تماس الزامی است")]
        [RegularExpression(@"^09\d{9}$", ErrorMessage = "شماره تماس معتبر نیست (مثال: 09121234567)")]
        [Display(Name = "شماره تماس")]
        public string PhoneNumber { get; set; }

        [Required(ErrorMessage = "رمز عبور الزامی است")]
        [DataType(DataType.Password)]
        [Display(Name = "رمز عبور")]
        public string Password { get; set; }

        [Display(Name = "مرا به خاطر بسپار")]
        public bool RememberMe { get; set; }
    }
}