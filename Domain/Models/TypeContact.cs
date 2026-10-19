namespace Domain.Models
{

    public class TypeContact
    {
        //// <summary>
        // نوع پلتفورم ارتباطی
        //// </summary>
        ////DBconectID
        public int TypeContactId { get; set; } ///شناسه
        public string TypeContactCaption { get; set; } //&عنوان پلتفورم
        public string TypeContactArm { get; set; } //&آرم پلتفورم
        public bool? Status { get; set; } ///وضعیت


    }
}
