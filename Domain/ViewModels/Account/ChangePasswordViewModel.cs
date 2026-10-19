using System.ComponentModel.DataAnnotations;

namespace Domain.ViewModels
{
    public class ChangePasswordViewModel
    {
        [Required]
        [Display(Name = "شماره تماس")]
        public string PhoneNumber { get; set; }

        [Required(ErrorMessage = "رمز عبور جدید الزامی است")]
        [DataType(DataType.Password)]
        [Display(Name = "رمز عبور جدید")]
        public string NewPassword { get; set; }

        [Compare(nameof(NewPassword), ErrorMessage = "رمز عبور یکسان نیست")]
        [DataType(DataType.Password)]
        [Display(Name = "تکرار رمز عبور جدید")]
        public string ConfirmNewPassword { get; set; }
    }
}