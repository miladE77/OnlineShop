namespace Domain.Models
{

    public class LevelAccess
    {
        //// <summary>
        // دسترسی سیستم
        //// </summary>
        ////DBconectID
        public int LevelAccessId { get; set; }///شناسه
        public string? LevelAccessCaption { get; set; }//&عنوان دسترسی
        public string? CodeAccess { get; set; }///رشته کد عملیات
        public bool Status { get; set; } ///وضعیت
        public List<Tocken>? TockenId { get; set; }
        public List<Role>? RoleId { get; set; }
        public List<Page>? PageId { get; set; }///@

    }
}
