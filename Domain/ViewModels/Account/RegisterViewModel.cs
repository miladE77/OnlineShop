using System.ComponentModel.DataAnnotations;

namespace Domain.ViewModels
{
    public class RegisterViewModel
    {
        [Required(ErrorMessage = "نام الزامی است")]
        [Display(Name = "نام")]
        public string FirstName { get; set; }

        [Required(ErrorMessage = "نام خانوادگی الزامی است")]
        [Display(Name = "نام خانوادگی")]
        public string LastName { get; set; }

        [Required(ErrorMessage = "شماره تماس الزامی است")]
        [RegularExpression(@"^09\d{9}$", ErrorMessage = "شماره تماس معتبر نیست (مثال: 09121234567)")]
        [Display(Name = "شماره تماس")]
        public string PhoneNumber { get; set; }

        [Required(ErrorMessage = "رمز عبور الزامی است")]
        [DataType(DataType.Password)]
        [Display(Name = "رمز عبور")]
        public string Password { get; set; }

        [Compare(nameof(Password), ErrorMessage = "رمز عبور یکسان نیست")]
        [DataType(DataType.Password)]
        [Display(Name = "تکرار رمز عبور")]
        public string ConfirmPassword { get; set; }
    }
}