namespace Domain.Models
{
    public class Tocken
    {
        //// <summary>
        // توکن دسترسی
        //// </summary>
        ////DBconectID
        public int TockenId { get; set; }///شناسه
        public string? TockenCaption { get; set; }//&عنوان توکن
        public string? TockenDetail { get; set; }//&توضیحات توکن
        public List<LevelAccess>? LevelAccessId { get; set; }///@
        public bool? Status { get; set; } ///وضعیت

    }
}
