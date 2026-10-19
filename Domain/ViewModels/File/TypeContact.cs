using Microsoft.AspNetCore.Http;

namespace Domain.Models
{

    public class TypeContactModel
    {
        //// <summary>
        // نوع پلتفورم ارتباطی
        //// </summary>
        ////DBconectID
        public int TypeContactId { get; set; } ///شناسه
        public string TypeContactCaption { get; set; } //&عنوان پلتفورم
        public string? TypeContactArm { get; set; } //&آرم پلتفورم
        public IFormFile? File { get; set; } //&آرم پلتفورم
        public bool? Status { get; set; } ///وضعیت


    }
}
