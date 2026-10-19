namespace Domain.Models
{
    //// <summary>
    // پرسنل
    //// </summary>
    public class Personel
    {
        public int PersonelId { get; set; } ///شناسه
        public string? FirstName { get; set; } //&نام
        public string? LastName { get; set; } //&نام خانوادگی
        public string? Date_of_birth { get; set; } ///تاریخ تولد
        public string? Lational_code { get; set; } //&کد ملی
        public string? PhoneNumber { get; set; } //&شماره تماس
        public string? Email { get; set; } //&ایمیل
        public string? Address { get; set; } //&آدرس محل سکونت
        public string? Detail { get; set; } ///توضیحات بیشتر
        public int? Code_Change_Password { get; set; } //*کد تغییر رمز
        public bool Status { get; set; } ///وضعیت
        public int? RoleId { get; set; } ///سمت
    }
}
