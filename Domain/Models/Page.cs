namespace Domain.Models
{

    public class Page
    {
        //// <summary>
        // صفحه سایت
        //// </summary>
        ////DBconectID
        public int PageId { get; set; }///شناسه
        public string? PageCaption { get; set; }//&عنوان صفحه
        public string? TitlePage { get; set; }//&نام صفحه
        public string? DetailPage { get; set; }///توضیحات صفحه
        public bool? Status { get; set; } ///وضعیت
        public List<LevelAccess>? LevelAccessId { get; set; } 
    }
}
