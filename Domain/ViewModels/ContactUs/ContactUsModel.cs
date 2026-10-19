using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace Domain.ViewModels
{
    public class ContactUsModel
    {
        [Display(Name = "عنوان پیام")]
        [Required(ErrorMessage = "لطفاً عنوان پیام را وارد کنید")]
        [StringLength(100, MinimumLength = 3, ErrorMessage = "عنوان پیام باید بین 3 تا 100 کاراکتر باشد")]
        public string Subject { get; set; }

        [Display(Name = "نام و نام خانوادگی")]
        [Required(ErrorMessage = "لطفاً نام و نام خانوادگی خود را وارد کنید")]
        [StringLength(100, MinimumLength = 3, ErrorMessage = "نام و نام خانوادگی باید بین 3 تا 100 کاراکتر باشد")]
        [RegularExpression(@"^[\u0600-\u06FF\s]+$", ErrorMessage = "لطفاً نام و نام خانوادگی را به فارسی وارد کنید")]
        public string FullName { get; set; }

        [Display(Name = "ایمیل")]
        [Required(ErrorMessage = "لطفاً ایمیل خود را وارد کنید")]
        [EmailAddress(ErrorMessage = "فرمت ایمیل وارد شده صحیح نیست")]
        [StringLength(100, ErrorMessage = "ایمیل نمی‌تواند بیشتر از 100 کاراکتر باشد")]
        public string Email { get; set; }

        [Display(Name = "شماره تماس")]
        [Required(ErrorMessage = "لطفاً شماره تماس خود را وارد کنید")]
        [Phone(ErrorMessage = "فرمت شماره تماس صحیح نیست")]
        [StringLength(11, MinimumLength = 11, ErrorMessage = "شماره تماس باید 11 رقم باشد")]
        [RegularExpression(@"^09[0-9]{9}$", ErrorMessage = "شماره تماس باید با 09 شروع شود و 11 رقم باشد")]
        public string PhoneNumber { get; set; }

        [Display(Name = "متن پیام")]
        [Required(ErrorMessage = "لطفاً متن پیام را وارد کنید")]
        [StringLength(1000, MinimumLength = 10, ErrorMessage = "متن پیام باید بین 10 تا 1000 کاراکتر باشد")]
        public string Message { get; set; }

        [Display(Name = "تاریخ ارسال")]
        public DateTime CreatedDate { get; set; }

        [Display(Name = "آیا ذخیره شود؟")]
        public bool IsSaved { get; set; }

        [Display(Name = "IP کاربر")]
        public string UserIP { get; set; }

        // سازنده
        public ContactUsModel()
        {
            CreatedDate = DateTime.Now;
            IsSaved = false;
        }
    }
}