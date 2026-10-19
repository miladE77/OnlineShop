namespace Domain.Models
{
    public class Role
    {
        //// <summary>
        // نقش سیستم
        //// </summary>
        ////DBconectID
        public int RoleId { get; set; }///شناسه
        public string? RoleCaption { get; set; }//&عنوان نقش
        public bool Status { get; set; } ///وضعیت
        public List<LevelAccess>? LevelAccessId { get; set; }///@

    }
}
